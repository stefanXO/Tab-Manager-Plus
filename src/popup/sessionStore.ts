"use strict";

// The stored saved windows (the `sessions` object in storage.local, saved
// window id -> ISavedSession) as the popup reads and changes them. Every
// change goes through one queue in TabManager (mutateSessions); the pure parts
// are here: tidying what storage holds, the list the popup shows, and adding
// saved windows (a save, an import). Unit tested in tests/sessionStore.test.ts.

import { sortSessions, firstOrders } from "./sessionOrder.ts";
import type { Orderable } from "./sessionOrder.ts";
import { sameTabUrls } from "./savedUpdated.ts";

// the part of a saved window this module reads (ISavedSession has more)
export interface StoredWindow extends Orderable {
	tabs : { index? : number }[];
	windowsInfo? : unknown;
}

// A saved tab goes by its stored `index` (its key in the popup, a restore of
// one tab, a delete of some tabs), so the indexes of a saved window must be
// numbers and differ. Hand-edited backups or other tools may leave one out or
// repeat one: such a tab gets its place in the list, or, when another tab
// already has that number, the next number no tab has. The others keep theirs.
// The same array when nothing needed fixing; never changes `tabs`.
export function fixTabIndexes<T extends { index? : number }>(tabs : readonly T[]) : T[] {
	const usable = (i : unknown) : i is number => typeof i === "number" && Number.isInteger(i) && i >= 0;
	const seen = new Set<number>();
	const bad : number[] = [];
	tabs.forEach((tab, at) => {
		const i = tab && tab.index;
		if (usable(i) && !seen.has(i)) seen.add(i);
		else bad.push(at);
	});
	if (bad.length === 0) return tabs as T[];
	const taken = new Set(seen);
	let next = 0;
	const out = tabs.slice();
	for (const at of bad) {
		let index = at;
		if (taken.has(index)) {
			while (taken.has(next)) next++;
			index = next;
		}
		taken.add(index);
		out[at] = { ...tabs[at], index };
	}
	return out;
}

// an entry the popup lists: an id, a list of tabs and the window it came from
export function isSavedWindow(s : unknown) : s is StoredWindow {
	if (!s || typeof s !== "object") return false;
	const w = s as StoredWindow;
	return !!w.id && Array.isArray(w.tabs) && !!w.windowsInfo;
}

// What storage holds, tidied: the saved windows with broken tab indexes get
// fixed copies (fixTabIndexes); every other entry, and every saved window
// that needed nothing, is the same object. Anything but an object is empty.
export function tidyStored<T extends StoredWindow>(values : unknown) : Record<string, T> {
	const out : Record<string, T> = {};
	if (!values || typeof values !== "object" || Array.isArray(values)) return out;
	const stored = values as Record<string, T>;
	for (const key of Object.keys(stored)) {
		const s = stored[key];
		if (!isSavedWindow(s)) {
			out[key] = s;
			continue;
		}
		const tabs = fixTabIndexes(s.tabs);
		out[key] = tabs === s.tabs ? s : { ...s, tabs };
	}
	return out;
}

// the saved windows the popup lists, in their order (./sessionOrder.ts)
export function listSessions<T extends StoredWindow>(stored : Readonly<Record<string, T>>) : T[] {
	return sortSessions(Object.values(stored).filter(isSavedWindow) as T[]);
}

// `stored` with `added` in it (a save, or an import that may replace saved
// windows with the same id): listed first, in the order given, whatever
// `order` they came with (a backup's numbers mean nothing next to the ones in
// use), and with their tab indexes fixed. A new object; never changes either.
export function addSessions<T extends StoredWindow>(stored : Readonly<Record<string, T>>, added : readonly T[]) : Record<string, T> {
	const next : Record<string, T> = { ...stored };
	const orders = firstOrders(stored, added.length);
	added.forEach((s, i) => {
		next[s.id] = { ...s, tabs: fixTabIndexes(s.tabs), order: orders[i] };
	});
	return next;
}

export interface ImportResult<T> {
	// `stored` with the new saved windows in it (addSessions)
	stored : Record<string, T>;
	// the saved windows of the file that were added, in file order
	added : T[];
	// how many were already there (the same tabs as a saved window in `existing`)
	duplicates : number;
}

// An import (the options' backup file): `added` goes in like a save
// (addSessions), except a saved window whose tabs (addresses, in order) are
// those of a saved window in `existing` (default: `stored`; the caller leaves
// out what a pending delete takes away): that one is already there and left
// out. Never changes either.
export function importSessions<T extends StoredWindow & { tabs : { url? : string }[] }>(stored : Readonly<Record<string, T>>, added : readonly T[], existing : Readonly<Record<string, T>> = stored) : ImportResult<T> {
	const there = Object.values(existing).filter(isSavedWindow) as T[];
	const kept = added.filter((s) => !there.some((e) => sameTabUrls(e.tabs, s.tabs)));
	return { stored: kept.length ? addSessions(stored, kept) : { ...stored }, added: kept, duplicates: added.length - kept.length };
}
