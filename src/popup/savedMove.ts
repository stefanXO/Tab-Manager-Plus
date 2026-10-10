"use strict";

// Moving saved tabs: a saved tab (or the selected saved tabs) dragged onto
// another saved tab goes right before / after it, in the same saved window or
// in another one; dropped on a saved window card (not on a tab) it goes to the
// end of that window. Pure, unit tested in tests/savedMove.test.ts.
//
// A saved tab goes by its stored `index` (its key in the popup,
// ./sessionKeys.ts; a pending delete, ./pendingDelete.ts). A move numbers the
// tabs of every saved window it touches 0, 1, 2… in their new order, so the
// popup carries its selection and its pending deletes over: `moves` says which
// tab went where.

import {SavedTabKeys, savedTabKeys, isSavedTabKey} from "./sessionKeys.ts";
import type {SavedTabRef} from "./sessionKeys.ts";
import {sortSessions} from "./sessionOrder.ts";
import type {Orderable} from "./sessionOrder.ts";

// the part of a saved window this module reads (ISavedSession has more)
export interface MovableWindow extends Orderable {
	tabs : { index? : number }[];
	incognito? : boolean;
	windowsInfo? : { incognito? : boolean };
}

// where the dragged saved tabs are dropped
export interface SavedDropTarget {
	sessionId : string;
	// the stored index of the saved tab dropped on; undefined: on the card, at its end
	index? : number;
	// before (else after) that tab
	before : boolean;
}

// a saved tab whose saved window or index changed
export interface SavedTabMove {
	from : SavedTabRef;
	to : SavedTabRef;
}

export interface SavedMoveResult<T> {
	// the stored saved windows after the move (a new object)
	stored : Record<string, T>;
	// every tab whose saved window or index changed, the dragged ones and the
	// ones numbered anew around them
	moves : SavedTabMove[];
	// the saved windows the move left without a tab: removed
	emptied : string[];
	// how many saved tabs were dragged
	count : number;
}

function isMovable(s : unknown) : s is MovableWindow {
	return !!s && typeof s === "object" && typeof (s as MovableWindow).id === "string" && Array.isArray((s as MovableWindow).tabs);
}

function isPrivate(s : MovableWindow) : boolean {
	return !!(s.incognito || (s.windowsInfo && s.windowsInfo.incognito));
}

function sameList(a : readonly unknown[], b : readonly unknown[]) : boolean {
	return a.length === b.length && a.every((x, i) => x === b[i]);
}

// The stored saved windows (the `sessions` storage object) with the saved
// tabs `refs` moved to `target`, in the order the saved windows and their tabs
// are listed, whatever order they were picked in. Null when that changes no
// saved window's order (dropped on itself, or right next to where they are),
// when no dragged tab or the target is found, or when it would move a tab of a
// private saved window into a normal one or the other way round (open tabs
// cannot cross either). Tabs that stay keep their order; the windows touched
// are numbered 0, 1, 2… anew; the others, and the keys' order, stay as they
// were. Never changes `stored`.
export function moveSavedTabs<T extends MovableWindow>(stored : Readonly<Record<string, T>>, refs : readonly SavedTabRef[], target : SavedDropTarget) : SavedMoveResult<T> | null {
	type Tab = T["tabs"][number];
	const keys = Object.keys(stored).filter((key) => isMovable(stored[key]));
	const keyOf = new Map(keys.map((key) => [stored[key].id, key]));
	const targetKey = keyOf.get(target.sessionId);
	if (targetKey === undefined) return null;
	const into = stored[targetKey];

	const wanted = new Map<string, Set<number>>();
	for (const ref of refs) {
		let indexes = wanted.get(ref.sessionId);
		if (!indexes) wanted.set(ref.sessionId, indexes = new Set());
		indexes.add(ref.index);
	}
	const dragged : Tab[] = [];
	const from = new Set<string>();
	for (const s of sortSessions(keys.map((key) => stored[key]))) {
		const indexes = wanted.get(s.id);
		if (!indexes) continue;
		for (const tab of s.tabs) {
			if (typeof tab.index !== "number" || !indexes.has(tab.index)) continue;
			dragged.push(tab);
			from.add(s.id);
		}
	}
	if (dragged.length === 0) return null;
	for (const id of from) if (isPrivate(stored[keyOf.get(id)!]) !== isPrivate(into)) return null;

	// where they go: before / after the tab dropped on, or at the end; counted
	// among the tabs that stay
	let at = into.tabs.length;
	if (target.index !== undefined) {
		const on = into.tabs.findIndex((tab) => tab.index === target.index);
		if (on < 0) return null;
		at = on + (target.before ? 0 : 1);
	}
	const going = new Set<Tab>(dragged);
	const place = into.tabs.slice(0, at).filter((tab) => !going.has(tab)).length;

	const touched = [...new Set([target.sessionId, ...from])];
	const lists = new Map<string, Tab[]>();
	for (const id of touched) lists.set(id, stored[keyOf.get(id)!].tabs.filter((tab) => !going.has(tab)));
	lists.get(target.sessionId)!.splice(place, 0, ...dragged);
	if (touched.every((id) => sameList(lists.get(id)!, stored[keyOf.get(id)!].tabs))) return null;

	// where each tab of the touched windows was
	const was = new Map<Tab, SavedTabRef>();
	for (const id of touched) {
		for (const tab of stored[keyOf.get(id)!].tabs) {
			if (typeof tab.index === "number") was.set(tab, { sessionId: id, index: tab.index });
		}
	}
	const moves : SavedTabMove[] = [];
	const emptied : string[] = [];
	const changed = new Map<string, T | null>();
	for (const id of touched) {
		const tabs = lists.get(id)!.map((tab, index) => {
			const old = was.get(tab);
			if (old && (old.sessionId !== id || old.index !== index)) moves.push({ from: old, to: { sessionId: id, index } });
			return tab.index === index ? tab : { ...tab, index };
		});
		if (tabs.length === 0) emptied.push(id);
		changed.set(id, tabs.length === 0 ? null : { ...stored[keyOf.get(id)!], tabs });
	}
	const out : Record<string, T> = {};
	for (const key of Object.keys(stored)) {
		const s = stored[key];
		if (!isMovable(s) || !changed.has(s.id)) {
			out[key] = s;
			continue;
		}
		const next = changed.get(s.id);
		if (next) out[key] = next;
	}
	return { stored: out, moves, emptied, count: dragged.length };
}

// The selected saved tabs after a move: each key of a tab that moved is
// replaced by the key of its new place (../sessionKeys.ts), so the same tabs
// stay selected. True when the selection changed.
export function remapSavedKeys(selection : Set<number>, moves : readonly SavedTabMove[], keys : SavedTabKeys = savedTabKeys) : boolean {
	if (moves.length === 0) return false;
	const to = new Map(moves.map((m) => [JSON.stringify([m.from.sessionId, m.from.index]), m.to]));
	const gone : number[] = [];
	const added : number[] = [];
	for (const id of selection) {
		if (!isSavedTabKey(id)) continue;
		const ref = keys.ref(id);
		const next = ref && to.get(JSON.stringify([ref.sessionId, ref.index]));
		if (!next) continue;
		gone.push(id);
		added.push(keys.key(next.sessionId, next.index));
	}
	// all removed first: a new key may be the old key of another moved tab
	for (const id of gone) selection.delete(id);
	for (const id of added) selection.add(id);
	return gone.length > 0;
}

// The new index of the tab that was at `index` in the saved window
// `sessionId`, for a pending delete (../pendingDelete.ts): its tabs are hidden
// and stay in their window, so only the number changes.
export function renumberedIndex(moves : readonly SavedTabMove[]) : (sessionId : string, index : number) => number {
	const to = new Map(moves.filter((m) => m.from.sessionId === m.to.sessionId).map((m) => [JSON.stringify([m.from.sessionId, m.from.index]), m.to.index]));
	return (sessionId, index) => to.get(JSON.stringify([sessionId, index])) ?? index;
}

// the header after the drop
export function movedText(count : number, windowName : string, emptied : number) : { topText : string, bottomText : string } {
	const tabs = count === 1 ? "1 saved tab" : count + " saved tabs";
	return {
		topText: "Moved " + tabs + (windowName ? " to “" + windowName + "”" : ""),
		bottomText: emptied === 0 ? " " : emptied === 1 ? "The saved window left empty was removed" :emptied + " saved windows left empty were removed"
	};
}
