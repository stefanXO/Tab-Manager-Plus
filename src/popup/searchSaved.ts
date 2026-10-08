"use strict";

// The search box and the saved windows. A search marks the saved tabs that
// match, like the open ones (the others fade, or hide with "Hide non-matching
// tabs"), but never selects them: Enter, Delete and the other selection
// actions stay on open tabs. Highlight Duplicates and Highlight recently
// active tabs are about open tabs only, so while one of them is on, every
// saved tab counts as not part of it.
//
// Saved tabs go by the keys of ./sessionKeys.ts in the popup's hiddenTabs set;
// this module works out which of them to put there.

import { matchTab, searchable } from "./search.ts";
import type { SearchQuery } from "./search.ts";
import { savedTabKeys } from "./sessionKeys.ts";
import type { SavedTabKeys } from "./sessionKeys.ts";

// the part of a saved window this module reads (ISavedSession has more)
export interface SearchedWindow {
	id : string;
	tabs : { index : number, title? : string, url? : string, pendingUrl? : string }[];
}

export interface SavedSearch {
	// something narrows the saved tabs (a query, or open-tab-only highlighting)
	active : boolean;
	// keys of the saved tabs that do not match
	hidden : Set<number>;
	// ids of the saved windows with at least one matching tab
	shown : Set<string>;
	// matching saved tabs, and saved windows holding a match
	tabs : number;
	windows : number;
}

// `openOnly`: Highlight Duplicates or Highlight recently active tabs is on, so
// no saved tab belongs to what it picked, whatever the query says.
export function searchSaved(
	sessions : SearchedWindow[],
	query : SearchQuery | null,
	openOnly : boolean,
	keys : SavedTabKeys = savedTabKeys
) : SavedSearch {
	const out : SavedSearch = { active: false, hidden: new Set(), shown: new Set(), tabs: 0, windows: 0 };
	const searching = !!query && !query.empty;
	if (!searching && !openOnly) {
		for (const s of sessions) out.shown.add(s.id);
		return out;
	}
	out.active = true;
	for (const s of sessions) {
		let matches = 0;
		for (const tab of s.tabs) {
			const hit = !openOnly && matchTab(searchable(tab.title, tab.url || tab.pendingUrl, true), query as SearchQuery);
			if (hit) matches++;
			else out.hidden.add(keys.key(s.id, tab.index));
		}
		if (matches > 0) {
			out.shown.add(s.id);
			out.tabs += matches;
			out.windows++;
		}
	}
	return out;
}

// the header of a running search: the open matches, and the saved ones
// beside them. `top` is the title line, `bottom` the hint under it.
export function searchSummary(text : string, open : number, saved : { tabs : number, windows : number }) : { top : string, bottom : string } {
	const noun = (n : number) => n === 1 ? "match" : "matches";
	const where = saved.windows === 1 ? "a saved window" : saved.windows + " saved windows";
	let top : string;
	if (open === 0 && saved.tabs === 0) top = "No matches for '" + text + "'";
	else if (saved.tabs === 0) top = open + " " + noun(open) + " for '" + text + "'";
	else if (open === 0) top = saved.tabs + " " + noun(saved.tabs) + " for '" + text + "' in " + where;
	else top = open + " " + noun(open) + " for '" + text + "', and " + saved.tabs + " in " + where;

	let bottom = "";
	if (open > 1) bottom = "Press enter to move them to a new window";
	else if (open === 1) bottom = "Press enter to switch to the tab";
	else if (saved.tabs > 0) bottom = "Saved tabs are not selected. Click one to restore it";
	return { top, bottom };
}
