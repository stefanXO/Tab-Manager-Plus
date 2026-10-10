"use strict";

import { maybePluralize } from "../helpers/utils.ts";

// Tabs that share a url. One copy per url stays (the original): the one used
// most recently (tabs.Tab.lastAccessed), and among tabs without that
// timestamp the first in the order given. The other copies are the
// duplicates that "Highlight Duplicates" selects and "Delete" closes (#248).
// A url that occurs once is neither.
export interface Duplicates {
	originals : Set<number>;
	duplicates : Set<number>;
}

export interface DuplicateCandidate {
	id? : number;
	url? : string;
	lastAccessed? : number;
}

// what makes two tabs copies of each other: the same url, compared exactly
export function dupKey(tab : { url? : string }) : string {
	return tab.url || "";
}

export function findDuplicates(tabs : Iterable<DuplicateCandidate>) : Duplicates {
	const byUrl = new Map<string, DuplicateCandidate[]>();
	for (const tab of tabs) {
		if (tab.id === undefined) continue;
		const url = dupKey(tab);
		const list = byUrl.get(url);
		if (list) list.push(tab); else byUrl.set(url, [tab]);
	}
	const originals = new Set<number>();
	const duplicates = new Set<number>();
	for (const list of byUrl.values()) {
		if (list.length < 2) continue;
		let keep = list[0];
		for (const tab of list) {
			if ((tab.lastAccessed || 0) > (keep.lastAccessed || 0)) keep = tab;
		}
		originals.add(keep.id);
		for (const tab of list) {
			if (tab !== keep) duplicates.add(tab.id);
		}
	}
	return { originals, duplicates };
}

// the button's tooltip: what a click does and how many tabs it touches
// (on: Highlight Duplicates is showing them)
export function duplicatesTitle(dups : Duplicates, on : boolean) : string {
	const heading = on ? "Clear highlighted duplicates" : "Highlight Duplicates";
	const n = dups.duplicates.size;
	if (n === 0) return heading + "\nNo duplicates found";
	if (on) return heading + "\nWill unselect " + maybePluralize(n, "duplicate");
	return heading + "\n" + maybePluralize(n + dups.originals.size, "tab") + " with duplicates: will select the "
		+ maybePluralize(n, "duplicate") + " and keep one of each";
}
