"use strict";

// Deleting the selected saved tabs: which saved windows lose which tabs. The
// selection holds saved tab keys (./sessionKeys.ts); the result is what the
// Undo countdown takes (./pendingDelete.ts).

import {SavedTabKeys, savedTabKeys, isSavedTabKey} from "./sessionKeys.ts";
import type {PendingItem} from "./pendingDelete.ts";

// the shape of a saved window this needs (ISavedSession has more)
export interface SavedWindowTabs {
	id : string;
	name : string;
	tabs : { index? : number }[];
}

// One item per saved window that has selected tabs, in the order of
// `sessions` (the saved windows as shown: tabs already pending are not in
// them). A window whose every tab is selected is deleted as a whole, the
// others lose just the selected tabs. Keys of saved tabs that are not in
// `sessions` (deleted meanwhile) are ignored, and so are open tab ids.
export function savedDeleteItems(selection : ReadonlySet<number>, sessions : readonly SavedWindowTabs[], keys : SavedTabKeys = savedTabKeys) : PendingItem[] {
	const picked = new Map<string, Set<number>>();
	for (const id of selection) {
		if (!isSavedTabKey(id)) continue;
		const ref = keys.ref(id);
		if (!ref) continue;
		let indexes = picked.get(ref.sessionId);
		if (!indexes) picked.set(ref.sessionId, indexes = new Set());
		indexes.add(ref.index);
	}
	const items : PendingItem[] = [];
	for (const session of sessions) {
		const indexes = picked.get(session.id);
		if (!indexes) continue;
		const going = session.tabs.filter((tab) => tab.index !== undefined && indexes.has(tab.index));
		if (going.length === 0) continue;
		if (going.length === session.tabs.length) {
			items.push({ id: session.id, name: session.name, tabs: session.tabs.length });
		} else {
			// sorted and without repeats: a stored window may hold two tabs with one index
			const gone = [...new Set(going.map((tab) => tab.index as number))].sort((a, b) => a - b);
			items.push({ id: session.id, name: session.name, tabs: going.length, indexes: gone });
		}
	}
	return items;
}
