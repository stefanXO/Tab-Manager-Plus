"use strict";

// Dragging saved tabs into an open window: which saved tabs go, and what the
// worker gets to open (../helpers/openTabs.ts). The keys are saved tab keys
// (./sessionKeys.ts).

import {SavedTabKeys, savedTabKeys, isSavedTabKey} from "./sessionKeys.ts";
import type {ISavedTabOpen} from "../helpers/openTabs.ts";

// the shape of a saved window this needs (ISavedSession has more)
export interface SavedWindowOpen {
	id : string;
	tabs : { index? : number, url? : string, pendingUrl? : string, pinned? : boolean }[];
}

// The saved tabs a drag takes: every selected saved tab when the dragged one
// is selected, else only the dragged one (the selection is left alone). An
// open tab id gives nothing.
export function draggedSaved(key : number, selection : ReadonlySet<number>) : number[] {
	if (!isSavedTabKey(key)) return [];
	if (!selection.has(key)) return [key];
	return [...selection].filter(isSavedTabKey);
}

// What to open for these keys, in the order the saved windows and their tabs
// are shown (`sessions`), whatever order they were selected in. Keys of saved
// tabs that are not in `sessions` (deleted meanwhile, or pending delete) and
// tabs without an address are left out.
export function savedTabsToOpen(keys : readonly number[], sessions : readonly SavedWindowOpen[], registry : SavedTabKeys = savedTabKeys) : ISavedTabOpen[] {
	const picked = new Map<string, Set<number>>();
	for (const key of keys) {
		if (!isSavedTabKey(key)) continue;
		const ref = registry.ref(key);
		if (!ref) continue;
		let indexes = picked.get(ref.sessionId);
		if (!indexes) picked.set(ref.sessionId, indexes = new Set());
		indexes.add(ref.index);
	}
	const out : ISavedTabOpen[] = [];
	for (const session of sessions) {
		const indexes = picked.get(session.id);
		if (!indexes) continue;
		for (const tab of session.tabs) {
			if (tab.index === undefined || !indexes.has(tab.index)) continue;
			const url = tab.url || tab.pendingUrl || "";
			if (!url) continue;
			out.push({ url, pinned: !!tab.pinned });
		}
	}
	return out;
}

// the header after the drop
export function openedText(count : number, windowName : string) : { topText : string, bottomText : string } {
	const tabs = count === 1 ? "1 saved tab" : count + " saved tabs";
	if (count === 0) return { topText: "Could not open the saved tabs", bottomText: " " };
	return {
		topText: "Opened " + tabs + (windowName ? " in “" + windowName + "”" : ""),
		bottomText: "The saved window keeps " + (count === 1 ? "it" : "them")
	};
}
