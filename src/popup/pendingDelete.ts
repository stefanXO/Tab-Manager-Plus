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

import { maybePluralize } from "../helpers/utils.ts";

export const UNDO_MS = 8000;

export interface PendingItem {
	id : string;
	name : string;
	// how many tabs go (for the notice): all of the window's, or indexes.length
	tabs : number;
	// only the saved tabs with these stored `index` values go, the window stays
	indexes? : number[];
}

function partial(item : PendingItem) : boolean {
	return item.indexes !== undefined;
}

// the clock and timers, injectable so the tests need no real waiting
export interface Timers {
	now() : number;
	setTimeout(fn : () => void, ms : number) : unknown;
	clearTimeout(handle : unknown) : void;
}

const realTimers : Timers = {
	now: () => Date.now(),
	setTimeout: (fn, ms) => setTimeout(fn, ms),
	clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>)
};

export interface PendingOptions {
	// removes the items from storage. `sync` when the popup is closing: start
	// the write without reading first (a read would not finish in time)
	commit(items : PendingItem[], sync : boolean) : Promise<unknown> | void;
	// the pending list or the deadline changed: render again
	onChange() : void;
	delay? : number;
	timers? : Timers;
}

export class PendingDeletes {
	private pending : PendingItem[] = [];
	// being written right now: still hidden, no longer undoable
	private committing : PendingItem[] = [];
	private changes = 0;
	private handle : unknown = null;
	private until = 0;
	private readonly delay : number;
	private readonly timers : Timers;
	private readonly options : PendingOptions;

	constructor(options : PendingOptions) {
		this.options = options;
		this.delay = options.delay ?? UNDO_MS;
		this.timers = options.timers ?? realTimers;
	}

	// the items Undo would bring back, oldest first
	get items() : readonly PendingItem[] {
		return this.pending;
	}

	// when the countdown ends (ms, the timers' clock); 0 when nothing is pending
	get deadline() : number {
		return this.pending.length ? this.until : 0;
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
	// some of its tabs.
	add(item : PendingItem) : void {
		const at = this.pending.findIndex((p) => p.id === item.id);
		if (at < 0) {
			this.pending.push(item);
		} else if (!partial(item)) {
			this.pending[at] = item;
		} else if (partial(this.pending[at])) {
			const old = this.pending[at];
			const indexes = [...new Set([...old.indexes!, ...item.indexes!])].sort((a, b) => a - b);
			this.pending[at] = { ...old, indexes, tabs: indexes.length };
		}
		this.restart();
		this.changed();
	}

	// brings every pending item back; the ones already being written are gone
	undo() : PendingItem[] {
		const items = this.pending;
		this.stop();
		this.pending = [];
		if (items.length) this.changed();
		return items;
	}

	// writes the pending deletes now (the countdown ran out, or the popup closes)
	flush(sync = false) : void {
		if (!this.pending.length) return;
		const items = this.pending;
		this.stop();
		this.pending = [];
		this.committing.push(...items);
		const done = () => {
			this.committing = this.committing.filter((c) => !items.includes(c));
			this.changed();
		};
		let result : Promise<unknown> | void;
		try {
			result = this.options.commit(items, sync);
		} catch (err) {
			console.error(err);
			done();
			return;
		}
		// a failed write leaves the saved window in storage: it shows again
		Promise.resolve(result).then(done, (err) => { console.error(err); done(); });
		// the notice goes now, the windows stay hidden until the write is done
		this.changed();
	}

	private changed() {
		this.changes++;
		this.options.onChange();
	}

	private restart() {
		this.stop();
		this.until = this.timers.now() + this.delay;
		this.handle = this.timers.setTimeout(() => this.flush(), this.delay);
	}

	private stop() {
		if (this.handle !== null) this.timers.clearTimeout(this.handle);
		this.handle = null;
	}
}

interface HasTabs {
	tabs : { index? : number }[];
}

// What is stored once the items are removed: a whole window goes, a partial one
// loses the tabs with its indexes (and goes too when none is left). The tabs
// that stay keep their `index`. Never changes `values`.
export function withoutItems<T extends HasTabs>(values : Record<string, T>, items : readonly PendingItem[]) : Record<string, T> {
	const out : Record<string, T> = {};
	for (const key of Object.keys(values)) {
		const mine = items.filter((item) => item.id === key);
		if (mine.some((item) => !partial(item))) continue;
		const gone = new Set<number>();
		for (const item of mine) for (const index of item.indexes!) gone.add(index);
		if (gone.size === 0) {
			out[key] = values[key];
			continue;
		}
		const tabs = values[key].tabs.filter((tab) => !gone.has(tab.index as number));
		if (tabs.length > 0) out[key] = { ...values[key], tabs };
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

// whole seconds left, rounded up, never negative
export function secondsLeft(deadline : number, now : number) : number {
	return Math.max(0, Math.ceil((deadline - now) / 1000));
}

// how much of the countdown is left, 0 to 1
export function fractionLeft(deadline : number, now : number, delay : number) : number {
	if (delay <= 0) return 0;
	return Math.min(1, Math.max(0, (deadline - now) / delay));
}
