"use strict";

// Deleting with an undo countdown. A saved window that is deleted is hidden
// at once and only removed from storage when the countdown ends (or when the
// popup is going away: flush). Until then Undo brings it back untouched.
//
// Several deletes in a row share one countdown (a batch): each new one
// restarts it, the notice names all of them and Undo restores all of them.
// A delete made after another Undo notice came up (a move's, ./moveUndo.ts)
// starts a batch of its own, with its own notice and countdown, so Ctrl+Z
// can take the notices back newest first (TabManager). Each batch is
// written when its own countdown ends.
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

// The merge of `item` into a batch's list: tabs of a window that is already
// in it join its item; the whole window wins over some of its tabs (and takes
// their addresses along: they were in the window the user saw go).
function join(list : PendingItem[], item : PendingItem) : void {
	const at = list.findIndex((p) => p.id === item.id);
	if (at < 0) {
		list.push(item);
	} else if (!partial(item)) {
		const old = list[at];
		const whole : PendingItem = { ...item };
		if (partial(old) && item.urls) {
			if (old.urls) whole.urls = [...item.urls, ...old.urls];
			else delete whole.urls;
		}
		list[at] = whole;
	} else if (partial(list[at])) {
		const old = list[at];
		const merged : PendingItem = { ...old };
		setGone(merged, [...goneOf(old), ...goneOf(item)]);
		merged.tabs = merged.indexes!.length;
		list[at] = merged;
	}
}

// Adds `gone` (tabs that came over from another saved window) to the partial
// item for `id` in `list`, in place, or to a new one made by `make`, which it
// returns (the caller adds it); nothing when the list holds that whole window
// (its tabs are hidden with it).
function joinGone(list : readonly PendingItem[], id : string, gone : Gone[], make : () => PendingItem) : PendingItem | null {
	const there = list.find((p) => p.id === id);
	if (there && !partial(there)) return null;
	const item = there || make();
	setGone(item, [...(there ? goneOf(there) : []), ...gone]);
	item.tabs = item.indexes!.length;
	return there ? null : item;
}

// One Undo notice's worth of deletes: what it hides and its countdown
interface Batch {
	key : number;
	items : PendingItem[];
	clock : Countdown;
}

// a batch as the notices draw it
export interface PendingBatch {
	readonly key : number;
	readonly items : readonly PendingItem[];
	// how often its countdown (re)started: its bar runs again when this changes
	readonly runs : number;
}

// the part of a move of saved tabs (./savedMove.ts SavedTabMove) read here
export interface TabRelocation {
	from : { sessionId : string, index : number };
	to : { sessionId : string, index : number };
}

export class PendingDeletes {
	// The batches still counting down, oldest first, each with its own Undo
	// notice and countdown (it ends in a flush of that batch; the mouse over
	// its notice holds it).
	private batches : Batch[] = [];
	private nextKey = 1;
	// being written right now: still hidden, no longer undoable
	private committing : PendingItem[] = [];
	// the ones of `committing` whose write started (claim); until then their
	// write may wait behind other changes
	private started = new Set<PendingItem>();
	// Items split off one whose write waits (a tab of it went to another
	// saved window, relocate), keyed by the item handed to commit(): its write
	// takes them along (claim). `rootOf` leads a split-off item to that key.
	private offspring = new Map<PendingItem, PendingItem[]>();
	private rootOf = new Map<PendingItem, PendingItem>();
	private changes = 0;
	private readonly delay : number;
	private readonly timers : Timers;
	private readonly options : PendingOptions;

	constructor(options : PendingOptions) {
		this.options = options;
		this.delay = options.delay ?? UNDO_MS;
		this.timers = options.timers ?? realTimers;
	}

	// the items Undo would bring back, every batch, oldest first
	get items() : readonly PendingItem[] {
		return this.batches.flatMap((b) => b.items);
	}

	// the batches, oldest first: one Undo notice each
	get groups() : PendingBatch[] {
		return this.batches.map((b) => ({ key: b.key, items: b.items, runs: b.clock.runs }));
	}

	// whether batch `key` is still counting down
	has(key : number) : boolean {
		return this.batches.some((b) => b.key === key);
	}

	// When the newest batch's countdown ends if it runs on (ms, the timers'
	// clock); 0 when nothing is pending. Moves on while the countdown is held.
	get deadline() : number {
		const b = this.batch();
		return b ? this.timers.now() + b.clock.left : 0;
	}

	// How often the newest batch's countdown was (re)started (the notice's
	// bar runs again when this changes); 0 when nothing is pending.
	get runs() : number {
		return this.batch()?.clock.runs ?? 0;
	}

	// The mouse is over the notice of batch `key` (the newest when left out),
	// or left it: its countdown waits.
	hold(held : boolean, key? : number) : void {
		this.batch(key)?.clock.hold(held);
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
		return [...this.items, ...this.committing];
	}

	// Hides `item` and (re)starts its batch's countdown. `batch`: the key of
	// the batch it joins (several deletes in a row share one notice); null: a
	// batch of its own (a new notice); left out: the newest batch. A batch
	// that is gone means a new one too. Returns the key of its batch.
	// Tabs of a window already in that batch join its item; the whole window
	// wins over some of its tabs (join).
	add(item : PendingItem, batch? : number | null) : number {
		let b = batch === null ? undefined : this.batch(batch);
		if (!b) {
			const key = this.nextKey++;
			b = { key, items: [], clock: new Countdown(this.timers, () => this.flush(false, key)) };
			this.batches.push(b);
		}
		join(b.items, item);
		b.clock.start(this.delay);
		this.changed();
		return b.key;
	}

	// Brings back the items of batch `key` (the newest when left out); the
	// ones already being written are gone.
	undo(key? : number) : PendingItem[] {
		const b = this.batch(key);
		if (!b) return [];
		b.clock.stop();
		this.batches = this.batches.filter((x) => x !== b);
		this.changed();
		return b.items;
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
		for (const item of this.hiding()) {
			if (!partial(item)) continue;
			const before = item.indexes!;
			setGone(item, goneOf(item).map((g) => ({ ...g, index: to(item.id, g.index) })));
			if (item.indexes!.length === before.length && item.indexes!.every((index, i) => index === before[i])) continue;
			changed = true;
		}
		if (changed) this.changed();
	}

	// Saved tabs moved (a move, ./savedMove.ts; the Undo of one,
	// ./moveUndo.ts): the tabs these items hide follow them. To a new number
	// in the same saved window, as renumber; into another saved window, to an
	// item for that window in the same batch, under the same name (the notice
	// still says what was deleted), so its Undo brings the tab back where it
	// is now and its write removes it there. A whole window stays as it is: a
	// tab that leaves it is no longer part of it. Items change in place (see
	// renumber); a tab of one whose write waits goes to an item written with
	// it (claim). One whose write started is not touched.
	relocate(moves : readonly TabRelocation[]) : void {
		if (moves.length === 0) return;
		const dest = new Map(moves.map((m) => [JSON.stringify([m.from.sessionId, m.from.index]), m.to]));
		// first every item's own tabs, by the numbers before the moves; the
		// ones going to another window are handed on afterwards, so none is
		// moved twice
		const away : { item : PendingItem, id : string, gone : Gone[] }[] = [];
		let changed = false;
		for (const item of this.hiding()) {
			if (!partial(item) || this.started.has(item)) continue;
			const stay : Gone[] = [];
			const leaving = new Map<string, Gone[]>();
			for (const g of goneOf(item)) {
				const to = dest.get(JSON.stringify([item.id, g.index]));
				if (!to) stay.push(g);
				else if (to.sessionId === item.id) stay.push({ ...g, index: to.index });
				else leaving.set(to.sessionId, [...(leaving.get(to.sessionId) || []), { ...g, index: to.index }]);
			}
			const before = item.indexes!;
			setGone(item, stay);
			item.tabs = item.indexes!.length;
			if (leaving.size || item.indexes!.length !== before.length || item.indexes!.some((index, i) => index !== before[i])) changed = true;
			for (const [id, gone] of leaving) away.push({ item, id, gone });
		}
		for (const { item, id, gone } of away) {
			const make = () : PendingItem => ({ id, name: item.name, tabs: 0, indexes: [] });
			const b = this.batches.find((x) => x.items.includes(item));
			if (b) {
				const fresh = joinGone(b.items, id, gone, make);
				if (fresh) b.items.push(fresh);
				continue;
			}
			// being written, its write still waiting
			const root = this.rootOf.get(item) || item;
			const kin = this.offspring.get(root) || [];
			const fresh = joinGone(kin, id, gone, make);
			if (!fresh) continue;
			this.offspring.set(root, [...kin, fresh]);
			this.rootOf.set(fresh, root);
			this.committing.push(fresh);
		}
		// an item of a batch left without a tab goes from it (one being
		// written stays, empty: its write may still read it)
		for (const b of this.batches) b.items = b.items.filter((item) => !partial(item) || item.indexes!.length > 0);
		if (changed) this.changed();
	}

	// The write of `items` (as handed to commit()) starts: the ones it still
	// has to remove (with the items split off them, relocate), from now on
	// marked as written. A write queued behind other changes calls this when
	// it runs, so that what the closing flush already wrote is not removed
	// twice (found again by address, a second removal could take another tab).
	claim(items : readonly PendingItem[]) : PendingItem[] {
		const all = items.flatMap((item) => [item, ...(this.offspring.get(item) || [])]);
		const mine = all.filter((item) => this.committing.includes(item) && !this.started.has(item));
		for (const item of mine) this.started.add(item);
		return mine;
	}

	// Writes the pending deletes now: batch `key` (its countdown ran out, its
	// notice was closed, or it made room for a newer notice), or all of them
	// (the popup closes, an import starts). Closing (`sync`), the ones whose
	// queued write has not started yet go along: that write would never run.
	flush(sync = false, key? : number) : void {
		const chosen = key === undefined ? this.batches : this.batches.filter((b) => b.key === key);
		// (a split-off item goes along with the one it came from: claim)
		const waiting = sync ? this.committing.filter((c) => !this.started.has(c) && !this.rootOf.has(c)) : [];
		const fresh = chosen.flatMap((b) => b.items);
		if (!fresh.length && !waiting.length) return;
		for (const b of chosen) b.clock.stop();
		this.batches = this.batches.filter((b) => !chosen.includes(b));
		this.committing.push(...fresh);
		const items = [...waiting, ...fresh];
		const done = () => {
			const ours = new Set(items.flatMap((item) => [item, ...(this.offspring.get(item) || [])]));
			this.committing = this.committing.filter((c) => !ours.has(c));
			for (const item of ours) {
				this.started.delete(item);
				this.offspring.delete(item);
				this.rootOf.delete(item);
			}
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

	// batch `key`, or the newest
	private batch(key? : number) : Batch | undefined {
		return key === undefined ? this.batches[this.batches.length - 1] : this.batches.find((b) => b.key === key);
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
// `keep`: other deletes still pending (another batch, written later). The
// tabs their partial items take stay when a whole window of `items` goes:
// the window keeps just those (hidden by them), so their own Undo can still
// bring them back, and their own write removes them (the window with them).
export function withoutItems<T extends HasTabs>(values : Record<string, T>, items : readonly PendingItem[], keep : readonly PendingItem[] = []) : Record<string, T> {
	const out : Record<string, T> = {};
	for (const key of Object.keys(values)) {
		const mine = items.filter((item) => item.id === key);
		if (mine.length === 0) {
			out[key] = values[key];
			continue;
		}
		const gone = resolveGone(values[key].tabs, mine);
		const tabs = gone.size ? values[key].tabs.filter((tab) => !gone.has(tab)) : values[key].tabs;
		const others = keep.filter((item) => item.id === key && partial(item) && !items.includes(item));
		const kept = others.length ? resolveGone(tabs, others) : new Set<SavedTabLike>();
		const left = kept.size ? tabs.filter((tab) => !kept.has(tab)) : tabs;
		if (mine.some((item) => !partial(item) && sameWindow(left, item))) {
			if (kept.size) out[key] = { ...values[key], tabs: tabs.filter((tab) => kept.has(tab)) };
			continue;
		}
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

// Whether the page being hidden writes the pending deletes at once. Only the
// action popup: it closes when it loses focus. An own tab or the Firefox
// sidebar is hidden by almost any click (the browser focuses another tab) and
// lives on, so the 8 s Undo keeps counting there; "pagehide" still flushes.
export function flushOnHide(visibility : string, inPopup : boolean | undefined) : boolean {
	return !!inPopup && visibility === "hidden";
}
