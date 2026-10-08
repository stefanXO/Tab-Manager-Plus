"use strict";

// The search box and the saved windows. A search marks the saved tabs that
// match, like the open ones (the others fade, or hide with "Hide non-matching
// tabs"). It selects them only when no open tab matches (../searchPicks.ts):
// the selection never mixes open and saved tabs. Highlight Duplicates and Highlight recently
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
	// keys of the saved tabs that match
	matched : number[];
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
	const out : SavedSearch = { active: false, hidden: new Set(), shown: new Set(), matched: [], tabs: 0, windows: 0 };
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
			if (hit) {
				matches++;
				out.matched.push(keys.key(s.id, tab.index));
			} else out.hidden.add(keys.key(s.id, tab.index));
		}
		if (matches > 0) {
			out.shown.add(s.id);
			out.tabs += matches;
			out.windows++;
		}
	}
	return out;
}

// What kind of search the header describes: "all" (words that can match open
// and saved tabs), "saved" (only saved tabs can match, as for s:), or "open
// list" (a query of only -s:: every open tab shows, none is selected).
export type SummaryKind = "all" | "saved" | "open list";

// the header of a running search: the open matches, and the saved ones
// beside them. `top` is the title line, `bottom` the hint under it.
// "open list": `open` is the number of open tabs shown, `windows` the open
// windows they are in. `savedPicked`: the search selected the saved matches
// (no open tab matched), so Enter opens them.
export function searchSummary(
	text : string,
	open : number,
	saved : { tabs : number, windows : number },
	kind : SummaryKind = "all",
	windows = 0,
	savedPicked = false
) : { top : string, bottom : string } {
	const noun = (n : number) => n === 1 ? "match" : "matches";
	const where = saved.windows === 1 ? "a saved window" : saved.windows + " saved windows";
	const savedHint = !savedPicked ? "Saved tabs are not selected. Click one to restore it"
		: saved.tabs === 1 ? "Press enter to open it in a new window" : "Press enter to open them in a new window";
	if (kind === "open list") {
		const inWindows = windows === 1 ? "an open window" : windows + " open windows";
		if (open === 0) return { top: "No open tabs", bottom: "" };
		return { top: open + (open === 1 ? " tab" : " tabs") + " in " + inWindows, bottom: "Open tabs only, none is selected" };
	}
	// only saved tabs can match: the words are in the box already, so the
	// header reads like the saved part of a normal search
	if (kind === "saved" && saved.tabs > 0) {
		return { top: saved.tabs + (saved.tabs === 1 ? " tab" : " tabs") + " in " + where, bottom: savedHint };
	}
	let top : string;
	if (open === 0 && saved.tabs === 0) top = "No matches for '" + text + "'";
	else if (saved.tabs === 0) top = open + " " + noun(open) + " for '" + text + "'";
	else if (open === 0) top = saved.tabs + " " + noun(saved.tabs) + " for '" + text + "' in " + where;
	else top = open + " " + noun(open) + " for '" + text + "', and " + saved.tabs + " in " + where;

	let bottom = "";
	if (open > 1) bottom = "Press enter to move them to a new window";
	else if (open === 1) bottom = "Press enter to switch to the tab";
	else if (saved.tabs > 0) bottom = savedHint;
	return { top, bottom };
}
