"use strict";

// Selected tabs are always shown. "Hide non-matching tabs" (and the hide mode
// of Highlight Duplicates and Highlight recently active tabs, which hide the
// same way) never hides a selected tab, open or saved: it shows as if the hide
// option were off, faded like any tab that does not match, and still selected.
// Its window (or saved window) stays on screen because of it. So no selected
// tab is ever out of sight, and every action takes the whole selection.
//
// `raw` is the set the search fills: the keys (open tab ids, saved tab keys of
// ./sessionKeys.ts) of the tabs that do not match.

import { savedTabKeys, isSavedTabKey } from "./sessionKeys.ts";
import type { SavedTabKeys } from "./sessionKeys.ts";

// How a tab shows: "shown" (matches, or no search), "faded" (does not match,
// still on screen) or "hidden" (does not match, filter on, not selected).
export type TabShow = "shown" | "faded" | "hidden";

export function tabShow(
	id : number,
	raw : ReadonlySet<number>,
	filter : boolean,
	selection : ReadonlySet<number>
) : TabShow {
	if (!raw.has(id)) return "shown";
	return filter && !selection.has(id) ? "hidden" : "faded";
}

// Whether the tab is out of sight (the tab itself, not its window).
export function isHiddenTab(id : number, raw : ReadonlySet<number>, filter : boolean, selection : ReadonlySet<number>) : boolean {
	return tabShow(id, raw, filter, selection) === "hidden";
}

// Whether a window with these tabs has nothing to show: no tab, or every tab
// hidden. A selected tab counts as shown.
export function hidesWholeWindow(
	tabIds : readonly number[],
	raw : ReadonlySet<number>,
	filter : boolean,
	selection : ReadonlySet<number>
) : boolean {
	return tabIds.every((id) => isHiddenTab(id, raw, filter, selection));
}

// the saved window ids that hold a selected saved tab
export function sessionsWithSelection(selection : ReadonlySet<number>, keys : SavedTabKeys = savedTabKeys) : Set<string> {
	const out = new Set<string>();
	for (const id of selection) {
		if (!isSavedTabKey(id)) continue;
		const ref = keys.ref(id);
		if (ref) out.add(ref.sessionId);
	}
	return out;
}

// The saved windows a search leaves on screen (`shown`: the ones with a
// match), plus the ones that hold a selected tab.
export function shownWithSelection(shown : ReadonlySet<string>, selection : ReadonlySet<number>, keys : SavedTabKeys = savedTabKeys) : Set<string> {
	const out = new Set(shown);
	for (const id of sessionsWithSelection(selection, keys)) out.add(id);
	return out;
}

// what of the selection decides the saved windows on screen: the same text
// for the same selected saved tabs (a cache key)
export function savedSelectionSignature(selection : ReadonlySet<number>) : string {
	const keys : number[] = [];
	for (const id of selection) if (isSavedTabKey(id)) keys.push(id);
	return keys.sort((a, b) => a - b).join(",");
}
