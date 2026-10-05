"use strict";

import { maybePluralize } from "../helpers/utils.ts";

// The tabs "Highlight recently active tabs" selects: the newest run of tabs
// (by tabs.Tab.lastAccessed) without a big gap in it. Newest first, the run
// goes on to the next tab while that one is not much older than the one
// before: at most RATIO times as old, or FLOOR older (so tabs used a minute
// or two apart never count as a gap). It takes at least MIN tabs, jumping a
// gap if it has to, and never a tab older than MAX_AGE. No upper limit: a
// steady chain of 60 tabs over the last hour is all recent.
export const RECENT_RATIO = 3;
export const RECENT_FLOOR = 10 * 60e3;
export const RECENT_MIN = 3;
export const RECENT_MAX_AGE = 7 * 24 * 3600e3;

export interface RecentCandidate {
	id? : number;
	lastAccessed? : number;
}

export interface RecentTabs {
	ids : number[];
	count : number;
	// "... active in the last <span>"; null when nothing was picked
	span : string | null;
}

const MIN = 60e3, HOUR = 60 * MIN, DAY = 24 * HOUR;

// the oldest picked age, rounded up to a friendly span: 5, 10, 15, 30
// minutes, hour, 2..12 hours, day, 2.. days
export function recentSpan(age : number) : string {
	for (const m of [5, 10, 15, 30]) {
		if (age <= m * MIN) return m + " minutes";
	}
	if (age <= HOUR) return "hour";
	if (age <= 12 * HOUR) return Math.ceil(age / HOUR) + " hours";
	if (age <= DAY) return "day";
	return Math.ceil(age / DAY) + " days";
}

export function recentTabs(tabs : Iterable<RecentCandidate>, now : number) : RecentTabs {
	const aged : { id : number, age : number }[] = [];
	for (const tab of tabs) {
		if (tab.id === undefined || !tab.lastAccessed) continue;
		const age = Math.max(0, now - tab.lastAccessed);
		if (age <= RECENT_MAX_AGE) aged.push({ id: tab.id, age });
	}
	if (aged.length === 0) return { ids: [], count: 0, span: null };
	aged.sort((a, b) => a.age - b.age || a.id - b.id);

	let n = 1;
	while (n < aged.length) {
		const prev = aged[n - 1].age, next = aged[n].age;
		if (n >= RECENT_MIN && next > Math.max(prev * RECENT_RATIO, prev + RECENT_FLOOR)) break;
		n++;
	}
	const ids = aged.slice(0, n).map((t) => t.id);
	return { ids, count: n, span: recentSpan(aged[n - 1].age) };
}

// the header text: "4 tabs active in the last 30 minutes"
export function recentText(recent : RecentTabs) : string {
	if (!recent.span || recent.count === 0) return "No recently active tabs";
	return maybePluralize(recent.count, "tab") + " active in the last " + recent.span;
}
