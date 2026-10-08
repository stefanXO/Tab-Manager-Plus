"use strict";

// Deleting with an undo countdown. A saved window that is deleted is hidden
// at once and only removed from storage when the countdown ends (or when the
// popup is going away: flush). Until then Undo brings it back untouched.
//
// Several deletes in a row share one countdown: each new one restarts it, the
// notice names all of them and Undo restores all of them.
//
// An item is a whole saved window, or (`indexes`) only some of its tabs: the
// saved tabs that were selected and deleted. Those go by their stored `index`,
// which a delete leaves alone in the tabs that stay.
//
// Another popup, the sidebar or an import can change the saved window during
// the countdown. So an item also keeps the address of each tab that goes
// (`urls`), and the write finds them again in what is stored by then
// (withoutItems): a tab goes only when its address is still the one deleted.

import { maybePluralize } from "../helpers/utils.ts";
import { Countdown, realTimers } from "./countdown.ts";
import type { Timers } from "./countdown.ts";

export type { Timers };

export const UNDO_MS = 8000;

export interface PendingItem {
	id : string;
	name : string;
	// how many tabs go (for the notice): all of the window's, or indexes.length
	tabs : number;
	// only the saved tabs with these stored `index` values go, the window stays
	indexes? : number[];
	// The address of each tab that goes, as it was deleted: with `indexes`
	// one per index, in the same order; for a whole window, every tab it had.
	// Without it (tests) the tabs go by index alone and a whole window goes
	// whatever it holds.
	urls? : string[];
}

function partial(item : PendingItem) : boolean {
	return item.indexes !== undefined;
}

interface Gone {
	index : number;
	url? : string;
}

// a partial item's tabs as index + address pairs
function goneOf(item : PendingItem) : Gone[] {
	return item.indexes!.map((index, i) => ({ index, url: item.urls ? item.urls[i] : undefined }));
}

// Sets a partial item's tabs from `list`, in place: sorted, one per index (the
// first wins). Addresses are kept only when every tab has one.
function setGone(item : PendingItem, list : Gone[]) : void {
	const byIndex = new Map<number, Gone>();
	for (const g of list) if (!byIndex.has(g.index)) byIndex.set(g.index, g);
	const sorted = [...byIndex.values()].sort((a, b) => a.index - b.index);
	item.indexes = sorted.map((g) => g.index);
	if (sorted.length > 0 && sorted.every((g) => g.url !== undefined)) item.urls = sorted.map((g) => g.url as string);
	else delete item.urls;
}

export interface PendingOptions {
	// removes the items from storage. `sync` when the popup is closing: start
	// the write without reading first (a read would not finish in time)
	commit(items : PendingItem[], sync : boolean) : Promise<unknown> | void;
	// the pending list or the deadline changed: render again
	onChange() : void;
	// a write failed (the browser refused it): the windows show again
	onError?(err : unknown, items : PendingItem[]) : void;
	delay? : number;
	timers? : Timers;
}

export class PendingDeletes {
	private pending : PendingItem[] = [];
	// being written right now: still hidden, no longer undoable
	private committing : PendingItem[] = [];
	// the ones of `committing` whose write started (claim); until then their
	// write may wait behind other changes
	private started = new Set<PendingItem>();
	private changes = 0;
	// the countdown: it ends in a flush, and the mouse over the notice holds it
	private readonly clock : Countdown;
	private readonly delay : number;
	private readonly timers : Timers;
	private readonly options : PendingOptions;

	constructor(options : PendingOptions) {
		this.options = options;
		this.delay = options.delay ?? UNDO_MS;
		this.timers = options.timers ?? realTimers;
		this.clock = new Countdown(this.timers, () => this.flush());
	}

	// the items Undo would bring back, oldest first
	get items() : readonly PendingItem[] {
		return this.pending;
	}

	// when the countdown ends if it runs on (ms, the timers' clock); 0 when
	// nothing is pending. Moves on while the countdown is held.
	get deadline() : number {
		return this.pending.length ? this.timers.now() + this.clock.left : 0;
	}

	// How often the countdown was (re)started: the notice's bar runs again when
	// this changes.
	get runs() : number {
		return this.clock.runs;
	}

	// The mouse is over the notice (or left it): the countdown waits.
	hold(held : boolean) : void {
		if (this.pending.length) this.clock.hold(held);
	}

	get countdown() : number {
		return this.delay;
	}

	// bumps with every change to what is hidden (a cache key for the callers)
	get version() : number {
		return this.changes;
	}

	// everything that must not be shown, the tabs of a window that stays
	// included: what visibleSessions() takes away
	hiding() : PendingItem[] {
		return [...this.pending, ...this.committing];
	}

	// hides `item` and (re)starts the countdown for the whole batch. Tabs of a
	// window that is already pending join its item; the whole window wins over
	// some of its tabs (and takes their addresses along: they were in the
	// window the user saw go).
	add(item : PendingItem) : void {
		const at = this.pending.findIndex((p) => p.id === item.id);
		if (at < 0) {
			this.pending.push(item);
		} else if (!partial(item)) {
			const old = this.pending[at];
			const whole : PendingItem = { ...item };
			if (partial(old) && item.urls) {
				if (old.urls) whole.urls = [...item.urls, ...old.urls];
				else delete whole.urls;
			}
			this.pending[at] = whole;
		} else if (partial(this.pending[at])) {
			const old = this.pending[at];
			const merged : PendingItem = { ...old };
			setGone(merged, [...goneOf(old), ...goneOf(item)]);
			merged.tabs = merged.indexes!.length;
			this.pending[at] = merged;
		}
		this.restart();
		this.changed();
	}

	// brings every pending item back; the ones already being written are gone
	undo() : PendingItem[] {
		const items = this.pending;
		this.clock.stop();
		this.pending = [];
		if (items.length) this.changed();
		return items;
	}

	// The tabs of some saved windows were numbered anew (saved tabs moved,
	// ./savedMove.ts): `to` gives the new index of each tab. The tabs these
	// items hide stay hidden under their new numbers; the countdown goes on.
	// The ones being written are renumbered too: their write may still wait
	// behind the move (TabManager.mutateSessions) and reads the items only
	// when it runs. So each item changes in place, never swapped for a copy:
	// flush() handed those very objects to commit(). One whose write already
	// landed is not touched: its tabs are gone, so no move names them.
	renumber(to : (id : string, index : number) => number) : void {
		let changed = false;
		for (const item of [...this.pending, ...this.committing]) {
			if (!partial(item)) continue;
			const before = item.indexes!;
			setGone(item, goneOf(item).map((g) => ({ ...g, index: to(item.id, g.index) })));
			if (item.indexes!.length === before.length && item.indexes!.every((index, i) => index === before[i])) continue;
			changed = true;
		}
		if (changed) this.changed();
	}

	// The write of `items` (as handed to commit()) starts: the ones it still
	// has to remove, from now on marked as written. A write queued behind other
	// changes calls this when it runs, so that what the closing flush already
	// wrote is not removed twice (found again by address, a second removal
	// could take another tab).
	claim(items : readonly PendingItem[]) : PendingItem[] {
		const mine = items.filter((item) => this.committing.includes(item) && !this.started.has(item));
		for (const item of mine) this.started.add(item);
		return mine;
	}

	// Writes the pending deletes now (the countdown ran out, or the popup
	// closes). Closing (`sync`), the ones whose queued write has not started
	// yet go along: that write would never run.
	flush(sync = false) : void {
		const waiting = sync ? this.committing.filter((c) => !this.started.has(c)) : [];
		if (!this.pending.length && !waiting.length) return;
		const fresh = this.pending;
		const items = [...waiting, ...fresh];
		this.clock.stop();
		this.pending = [];
		this.committing.push(...fresh);
		const done = () => {
			this.committing = this.committing.filter((c) => !items.includes(c));
			for (const item of items) this.started.delete(item);
			this.changed();
		};
		let result : Promise<unknown> | void;
		try {
			result = this.options.commit(items, sync);
		} catch (err) {
			this.failed(err, items);
			done();
			return;
		}
		// a failed write leaves the saved window in storage: it shows again
		Promise.resolve(result).then(done, (err) => { this.failed(err, items); done(); });
		// the notice goes now, the windows stay hidden until the write is done
		this.changed();
	}

	private changed() {
		this.changes++;
		this.options.onChange();
	}

	private failed(err : unknown, items : PendingItem[]) {
		console.error(err);
		try {
			this.options.onError?.(err, items);
		} catch (e) {
			console.error(e);
		}
	}

	private restart() {
		this.clock.start(this.delay);
	}
}

interface SavedTabLike {
	index? : number;
	url? : string;
}

interface HasTabs {
	tabs : SavedTabLike[];
}

function urlOf(tab : SavedTabLike) : string {
	return tab.url ?? "";
}

// the addresses to keep in PendingItem.urls ("" for a tab without one)
export function goneUrls(tabs : readonly SavedTabLike[]) : string[] {
	return tabs.map(urlOf);
}

// The tabs of `tabs` (a saved window as stored now) that the partial items
// take. First every tab still at its index with the address deleted (for an
// item without addresses: at its index); then, for each of the others, the
// first tab not yet taken with that address (it moved, or another popup
// numbered the window anew). One found neither way is no longer there and
// takes nothing.
export function resolveGone<T extends SavedTabLike>(tabs : readonly T[], items : readonly PendingItem[]) : Set<T> {
	const taken = new Set<T>();
	const rest : Gone[] = [];
	for (const item of items) {
		if (!partial(item)) continue;
		for (const g of goneOf(item)) {
			const tab = tabs.find((t) => t.index === g.index && !taken.has(t));
			if (tab && (g.url === undefined || urlOf(tab) === g.url)) taken.add(tab);
			else if (g.url !== undefined) rest.push(g);
		}
	}
	for (const g of rest) {
		const tab = tabs.find((t) => !taken.has(t) && urlOf(t) === g.url);
		if (tab) taken.add(tab);
	}
	return taken;
}

// Whether a whole window item still names the window stored now (`left`: its
// tabs that no partial item takes): every one of them was among the tabs the
// window had when it was deleted. A window with a tab the user never saw go
// (an import replaced it, another popup added to it) stays.
function sameWindow(left : readonly SavedTabLike[], item : PendingItem) : boolean {
	if (!item.urls) return true;
	const count = new Map<string, number>();
	for (const url of item.urls) count.set(url, (count.get(url) || 0) + 1);
	for (const tab of left) {
		const n = count.get(urlOf(tab)) || 0;
		if (n === 0) return false;
		count.set(urlOf(tab), n - 1);
	}
	return true;
}

// What is stored once the items are removed: a whole window goes (sameWindow),
// a partial one loses its tabs (resolveGone; and goes too when none is left).
// The tabs that stay keep their `index`. Never changes `values`.
export function withoutItems<T extends HasTabs>(values : Record<string, T>, items : readonly PendingItem[]) : Record<string, T> {
	const out : Record<string, T> = {};
	for (const key of Object.keys(values)) {
		const mine = items.filter((item) => item.id === key);
		if (mine.length === 0) {
			out[key] = values[key];
			continue;
		}
		const gone = resolveGone(values[key].tabs, mine);
		const tabs = gone.size ? values[key].tabs.filter((tab) => !gone.has(tab)) : values[key].tabs;
		if (mine.some((item) => !partial(item) && sameWindow(tabs, item))) continue;
		if (gone.size === 0) out[key] = values[key];
		else if (tabs.length > 0) out[key] = { ...values[key], tabs };
	}
	return out;
}

// The saved windows as the popup shows them while `items` are pending or being
// written: the list without the windows that go, and with the tabs left out for
// the ones that lose some. A window nothing touches keeps its identity (the
// search's memo compares those).
export function visibleSessions<T extends HasTabs & { id : string }>(sessions : readonly T[], items : readonly PendingItem[]) : T[] {
	if (items.length === 0) return sessions.slice();
	const kept = withoutItems(Object.fromEntries(sessions.map((s) => [s.id, s])), items);
	return sessions.filter((s) => kept[s.id]).map((s) => kept[s.id]);
}

// the notice's text: "Deleted "Tax 2029" (3 tabs)", "Deleted 2 tabs from
// "Tax 2029"", "Deleted 3 saved windows" or, mixed, "Deleted 2 saved tabs and
// 1 saved window"
export function noticeText(items : readonly PendingItem[]) : string {
	if (items.length === 0) return "";
	if (items.length === 1) {
		const [item] = items;
		const name = "“" + (item.name || "saved window") + "”";
		if (partial(item)) return "Deleted " + maybePluralize(item.tabs, "tab") + " from " + name;
		return "Deleted " + name + " (" + maybePluralize(item.tabs, "tab") + ")";
	}
	const windows = items.filter((item) => !partial(item)).length;
	const tabs = items.filter(partial).reduce((sum, item) => sum + item.tabs, 0);
	const parts : string[] = [];
	if (tabs > 0) parts.push(maybePluralize(tabs, "saved tab"));
	if (windows > 0) parts.push(maybePluralize(windows, "saved window"));
	return "Deleted " + parts.join(" and ");
}
