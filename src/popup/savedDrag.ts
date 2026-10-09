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
	return [...selection].filter((id) => isSavedTabKey(id));
}

// What to open for these keys, in the order the saved windows and their tabs
// are shown (`sessions`), whatever order they were selected in, and how many
// of them cannot be opened: `gone`, saved tabs that are not in `sessions`
// (deleted meanwhile, or pending delete), and `blank`, tabs without an address.
// `keys`: the keys of `tabs` (the ones a successful open is done with).
export interface Openable {
	tabs : ISavedTabOpen[];
	keys : number[];
	gone : number;
	blank : number;
}

export function openableSaved(keys : readonly number[], sessions : readonly SavedWindowOpen[], registry : SavedTabKeys = savedTabKeys) : Openable {
	// saved window id -> stored index -> the key asked for it
	const picked = new Map<string, Map<number, number>>();
	// each saved tab once, however often it was asked
	const asked = new Set<number>();
	for (const key of keys) {
		if (!isSavedTabKey(key) || asked.has(key)) continue;
		asked.add(key);
		const ref = registry.ref(key);
		if (!ref) continue;
		let indexes = picked.get(ref.sessionId);
		if (!indexes) picked.set(ref.sessionId, indexes = new Map());
		indexes.set(ref.index, key);
	}
	const tabs : ISavedTabOpen[] = [];
	const found : number[] = [];
	let seen = 0;
	for (const session of sessions) {
		const indexes = picked.get(session.id);
		if (!indexes) continue;
		for (const tab of session.tabs) {
			if (tab.index === undefined || !indexes.has(tab.index)) continue;
			seen++;
			const url = tab.url || tab.pendingUrl || "";
			if (!url) continue;
			tabs.push({ url, pinned: !!tab.pinned });
			found.push(indexes.get(tab.index)!);
		}
	}
	return { tabs, keys: found, gone: Math.max(0, asked.size - seen), blank: seen - tabs.length };
}

// What to open for these keys: the tabs of openableSaved
export function savedTabsToOpen(keys : readonly number[], sessions : readonly SavedWindowOpen[], registry : SavedTabKeys = savedTabKeys) : ISavedTabOpen[] {
	return openableSaved(keys, sessions, registry).tabs;
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

// The drag data type a saved tab's drag carries (beside its address): saved
// tabs and saved window cards take a drop only from a drag carrying it
// (./savedMove.ts). Open windows and tabs take it too, and open the tabs.
export const SAVED_TAB_DRAG = "application/x-tab-manager-saved-tab";

export function isSavedTabDrag(types : ArrayLike<string> | null | undefined) : boolean {
	return !!types && Array.from(types).includes(SAVED_TAB_DRAG);
}
