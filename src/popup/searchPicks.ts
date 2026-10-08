"use strict";

// What a search does to the selection. The search selects the open tabs it
// matches; the tabs the user selected by hand (Ctrl+click, a Shift range, a
// drag, the arrows) are the user's, and the search leaves them alone. A new
// search takes back only the tabs an earlier search selected and that no
// longer match. So a hand-selected tab that does not match the new search
// stays selected, and therefore on screen (./selectedShown.ts), as if "Hide
// non-matching tabs" were off for it.
//
// Selected saved tabs are always selected by hand (a search never selects
// them) and stay too. The selection never mixes open and saved tabs
// (./sessionKeys.ts), so while saved tabs are selected the search marks the
// open matches without selecting them.

import { onlySavedSelected } from "./sessionKeys.ts";

// The open tab ids the search (or Highlight Duplicates / Highlight recently
// active tabs) selected and the user has not touched since.
export class SearchPicks {
	private readonly picked = new Set<number>();
	// the search selects `id`; a tab already selected (by hand) stays the user's
	pick(selection : Set<number>, id : number) : void {
		if (selection.has(id)) return;
		selection.add(id);
		this.picked.add(id);
	}
	// `id` no longer matches (or a bare -s: selects nothing): it leaves the
	// selection when the search put it there
	unpick(selection : Set<number>, id : number) : void {
		if (this.picked.delete(id)) selection.delete(id);
	}
	// the user selected or deselected `id` by hand: from now on it is theirs
	touch(id : number) : void {
		this.picked.delete(id);
	}
	// the search was cleared: what it selected leaves, the user's tabs stay
	unpickAll(selection : Set<number>) : void {
		for (const id of this.picked) selection.delete(id);
		this.picked.clear();
	}
	// the whole selection went (Escape, a new highlight)
	clear() : void {
		this.picked.clear();
	}
	has(id : number) : boolean {
		return this.picked.has(id);
	}
}

// Whether a search selects the open tabs it matches: not a bare -s: (it shows
// the open tabs and selects none), and not while saved tabs are selected.
export function searchSelects(selection : ReadonlySet<number>, scopeOnly : boolean) : boolean {
	return !scopeOnly && !onlySavedSelected(selection);
}

// One open tab of a search pass: a match is selected (when the search
// selects), anything else the search had selected leaves.
export function searchTab(selection : Set<number>, picks : SearchPicks, id : number, match : boolean, selects : boolean) : void {
	if (match && selects) picks.pick(selection, id);
	else picks.unpick(selection, id);
}

// Whether the selection holds a tab the search did not select (a hand-picked
// one, matching or not, or a saved tab): the header then speaks of the
// selection, not of the matches alone.
export function keptByHand(selection : ReadonlySet<number>, picks : SearchPicks) : boolean {
	for (const id of selection) if (!picks.has(id)) return true;
	return false;
}
