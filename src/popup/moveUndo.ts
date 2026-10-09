"use strict";

// Undo for a move of saved tabs (./savedMove.ts) that left a saved window
// without a tab. The move removes that window at once; the Undo notice then
// offers to take the move back for a few seconds: every tab the move took
// goes back to where it was, and the removed window comes back with its name
// and colour.
//
// The undo works from a snapshot (the saved windows the move changed, as they
// were) and is made like any other change, on what is stored when Undo is
// clicked (TabManager.mutateSessions): another popup, the sidebar or an import
// may have changed the saved windows meanwhile. A moved tab is found again in
// the window it went to, by its place and address, else by its address alone;
// one that is no longer there stays gone (a delete is not undone), and a tab
// whose old window was deleted meanwhile (or is being deleted) stays where it
// is. When nothing changed in between, the windows are put back exactly as
// they were. A moved tab whose own delete is counting down goes back hidden:
// that delete follows it (PendingDeletes.relocate), so each Undo takes back
// only what it did, in either order.
// Pure, unit tested in tests/moveUndo.test.ts and tests/undoStack.test.ts.

import { maybePluralize } from "../helpers/utils.ts";
import { sameTabUrls } from "./savedUpdated.ts";
import type { SavedTabRef } from "./sessionKeys.ts";
import type { SavedTabMove } from "./savedMove.ts";
import { Countdown, realTimers } from "./countdown.ts";
import type { Timers } from "./countdown.ts";

// the part of a saved window this module reads (ISavedSession has more)
export interface UndoableWindow {
	id : string;
	name? : string;
	tabs : { index? : number, url? : string }[];
	updated? : number;
}

export interface MoveUndo<T> {
	// the saved windows the move changed, as stored before it
	before : T[];
	// the ones it removed (left without a tab)
	emptied : string[];
	// where the dragged tabs went (the ones the move only numbered anew are
	// not here: they keep their order around the ones going back)
	moves : SavedTabMove[];
}

function isWindow(s : unknown) : s is UndoableWindow {
	return !!s && typeof s === "object" && typeof (s as UndoableWindow).id === "string" && Array.isArray((s as UndoableWindow).tabs);
}

// The snapshot for undoing a move: `stored` as it was before the move, the
// dragged saved tabs, and what the move did (moveSavedTabs). Null when the
// move removed no window.
export function moveUndoRecord<T extends UndoableWindow>(stored : Readonly<Record<string, T>>, refs : readonly SavedTabRef[], result : { moves : SavedTabMove[], emptied : string[] }) : MoveUndo<T> | null {
	if (result.emptied.length === 0) return null;
	const dragged = new Set(refs.map((r) => JSON.stringify([r.sessionId, r.index])));
	const moves = result.moves.filter((m) => dragged.has(JSON.stringify([m.from.sessionId, m.from.index])));
	const ids = new Set<string>(result.emptied);
	for (const m of result.moves) {
		ids.add(m.from.sessionId);
		ids.add(m.to.sessionId);
	}
	const before = Object.values(stored).filter((s) => isWindow(s) && ids.has(s.id));
	return { before, emptied: [...result.emptied], moves };
}

export interface MoveUndoResult<T> {
	// the stored saved windows after the undo (a new object)
	stored : Record<string, T>;
	// every tab whose saved window or index the undo changed (the selection
	// and the pending deletes follow them, as after a move)
	moves : SavedTabMove[];
	// how many moved tabs went back to another saved window
	count : number;
	// the removed saved windows that came back
	restored : string[];
}

// What is stored once the move is undone (see the top of the file), or null
// when no moved tab can go back. Windows the undo leaves as they were before
// the move (the same tabs in the same order) get the snapshot's tabs and
// `updated` back (a removed window comes back as it was); the others get
// their tabs numbered 0, 1, 2… and `updated: now`. Never changes `stored`.
// `closed`: saved windows that count as deleted although still stored (a
// delete of the whole window is counting down, ./pendingDelete.ts): a tab
// whose old window that is stays where it is, as for one deleted for good
// (it would come back hidden, and that delete would then leave the window).
export function undoMove<T extends UndoableWindow>(stored : Readonly<Record<string, T>>, record : MoveUndo<T>, now : number, closed : Iterable<string> = []) : MoveUndoResult<T> | null {
	const shut = new Set(closed);
	type Tab = T["tabs"][number];
	const keys = Object.keys(stored).filter((key) => isWindow(stored[key]));
	const keyOf = new Map(keys.map((key) => [stored[key].id, key]));
	const snapshot = new Map(record.before.map((s) => [s.id, s]));
	const current = (id : string) : T | undefined => {
		const key = keyOf.get(id);
		return key === undefined ? undefined : stored[key];
	};
	// a removed window that is not stored again (an import may have brought it back)
	const recreate = (id : string) => !keyOf.has(id) && record.emptied.includes(id) && snapshot.has(id);

	// each moved tab, with its address and place in its old window's list
	interface Back { move : SavedTabMove, url : string, at : number, tab? : Tab }
	const backs : Back[] = [];
	for (const move of record.moves) {
		const old = snapshot.get(move.from.sessionId);
		const at = old ? old.tabs.findIndex((tab) => tab.index === move.from.index) : -1;
		if (at < 0) continue;
		// its old window must be able to take it, or it stays where it is
		if (!keyOf.has(move.from.sessionId) && !recreate(move.from.sessionId)) continue;
		if (shut.has(move.from.sessionId)) continue;
		backs.push({ move, url: old!.tabs[at].url || "", at });
	}

	// found again where they went: at their place with their address, then
	// by address alone
	const taken = new Map<string, Set<Tab>>();
	const takenIn = (id : string) => {
		let set = taken.get(id);
		if (!set) taken.set(id, set = new Set());
		return set;
	};
	for (const pass of [0, 1]) {
		for (const b of backs) {
			if (b.tab) continue;
			const into = current(b.move.to.sessionId);
			if (!into) continue;
			const set = takenIn(into.id);
			const tab = into.tabs.find((t) => !set.has(t) && (t.url || "") === b.url && (pass === 1 || t.index === b.move.to.index));
			if (!tab) continue;
			set.add(tab);
			b.tab = tab;
		}
	}
	const found = backs.filter((b) => b.tab);
	if (found.length === 0) return null;

	// the new lists: the found tabs out, then each into its old window at its
	// old place, in the order of those places
	const lists = new Map<string, Tab[]>();
	const listOf = (id : string) : Tab[] => {
		let list = lists.get(id);
		if (!list) lists.set(id, list = (current(id)?.tabs || []).slice());
		return list;
	};
	for (const [id, set] of taken) if (set.size) lists.set(id, listOf(id).filter((t) => !set.has(t)));
	for (const b of [...found].sort((x, y) => x.at - y.at)) {
		const list = listOf(b.move.from.sessionId);
		list.splice(Math.min(b.at, list.length), 0, b.tab!);
	}

	// where each tab of the windows touched is now
	const was = new Map<Tab, SavedTabRef>();
	for (const id of lists.keys()) {
		for (const tab of current(id)?.tabs || []) if (typeof tab.index === "number") was.set(tab, { sessionId: id, index: tab.index });
	}
	const moves : SavedTabMove[] = [];
	const restored : string[] = [];
	const changed = new Map<string, T | null>();
	for (const [id, list] of lists) {
		const old = snapshot.get(id);
		const exact = !!old && sameTabUrls(list, old.tabs);
		const base = current(id) || old!;
		const tabs = list.map((tab, at) => {
			const index = exact ? old!.tabs[at].index! : at;
			const from = was.get(tab);
			if (from && (from.sessionId !== id || from.index !== index)) moves.push({ from, to: { sessionId: id, index } });
			return exact ? old!.tabs[at] : tab.index === at ? tab : { ...tab, index: at };
		});
		if (!keyOf.has(id) && tabs.length) restored.push(id);
		if (tabs.length === 0) {
			changed.set(id, null);
		} else if (exact) {
			// its tabs and their time as before the move; a name or colour
			// given since stays
			const next : T = { ...base, tabs: old!.tabs };
			if (old!.updated === undefined) delete next.updated;
			else next.updated = old!.updated;
			changed.set(id, next);
		} else {
			changed.set(id, { ...base, tabs, updated: now });
		}
	}

	const out : Record<string, T> = {};
	for (const key of Object.keys(stored)) {
		const s = stored[key];
		if (!isWindow(s) || !changed.has(s.id)) {
			out[key] = s;
			continue;
		}
		const next = changed.get(s.id);
		if (next) out[key] = next;
	}
	for (const id of restored) out[id] = changed.get(id)!;
	const count = found.filter((b) => b.move.from.sessionId !== b.move.to.sessionId).length;
	return { stored: out, moves, count, restored };
}

// the notice: "Removed “Tax 2029” (left empty)", "Removed 2 saved windows left empty"
export function emptiedText(names : readonly string[]) : string {
	if (names.length === 1) return "Removed “" + (names[0] || "saved window") + "” (left empty)";
	return "Removed " + names.length + " saved windows left empty";
}

// the header after Undo
export function undoneText(count : number, restored : readonly string[]) : { topText : string, bottomText : string } {
	return {
		topText: "Moved " + maybePluralize(count, "saved tab") + " back",
		bottomText: restored.length === 0 ? " " : restored.length === 1 ? "“" + restored[0] + "” is back" : restored.length + " saved windows are back"
	};
}

// the clock and timers, injectable so the tests need no real waiting
// (./countdown.ts)
export type OfferTimers = Timers;

export interface UndoOfferOptions {
	// an offer came or went: render again
	onChange() : void;
	delay : number;
	timers? : OfferTimers;
}

interface Offer<V> {
	key : number;
	value : V;
	clock : Countdown;
}

// an offer as the notices draw it
export interface UndoOfferItem<V> {
	readonly key : number;
	readonly value : V;
	// how often its countdown (re)started: its bar runs again when this changes
	readonly runs : number;
}

// Undos offered for a while (one Undo notice each), then no more. Nothing is
// written when one runs out: the change it would undo is already stored.
// Each offer has its own countdown, which the mouse over its notice holds
// (./countdown.ts), as for a delete; a new offer leaves the others alone
// (the notices stack, ./notices.ts NoticeOrder).
export class UndoOffers<V> {
	private list : Offer<V>[] = [];
	private next = 1;
	private readonly options : UndoOfferOptions;
	private readonly timers : OfferTimers;

	constructor(options : UndoOfferOptions) {
		this.options = options;
		this.timers = options.timers ?? realTimers;
	}

	// the offers, oldest first
	get items() : UndoOfferItem<V>[] {
		return this.list.map((o) => ({ key: o.key, value: o.value, runs: o.clock.runs }));
	}

	// what the newest offer's Undo would take back; null when nothing is offered
	get current() : V | null {
		return this.offer_()?.value ?? null;
	}

	// whether offer `key` still stands
	has(key : number) : boolean {
		return this.list.some((o) => o.key === key);
	}

	// When the newest offer ends if its countdown runs on (ms, the timers'
	// clock); 0 when nothing is offered. Moves on while the countdown is held.
	get deadline() : number {
		const o = this.offer_();
		return o ? this.timers.now() + o.clock.left : 0;
	}

	get countdown() : number {
		return this.options.delay;
	}

	// how often the newest offer's countdown was (re)started; 0 without one
	get runs() : number {
		return this.offer_()?.clock.runs ?? 0;
	}

	// the mouse is over the notice of offer `key` (the newest when left out),
	// or left it: its countdown waits
	hold(held : boolean, key? : number) : void {
		this.offer_(key)?.clock.hold(held);
	}

	// offers `value`; returns its key
	offer(value : V) : number {
		const key = this.next++;
		const clock = new Countdown(this.timers, () => this.clear(key));
		this.list.push({ key, value, clock });
		clock.start(this.options.delay);
		this.options.onChange();
		return key;
	}

	// offer `key` (the newest when left out), which ends now (Undo was clicked)
	take(key? : number) : V | null {
		const o = this.offer_(key);
		if (!o) return null;
		this.clear(o.key);
		return o.value;
	}

	// offer `key` ends (all of them when left out)
	clear(key? : number) : void {
		const gone = this.list.filter((o) => key === undefined || o.key === key);
		if (gone.length === 0) return;
		for (const o of gone) o.clock.stop();
		this.list = this.list.filter((o) => !gone.includes(o));
		this.options.onChange();
	}

	// offer `key`, or the newest
	private offer_(key? : number) : Offer<V> | undefined {
		return key === undefined ? this.list[this.list.length - 1] : this.list.find((o) => o.key === key);
	}
}
