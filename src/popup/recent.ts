"use strict";

import { maybePluralize } from "../helpers/utils.ts";

// The tabs "Highlight recently active tabs" selects, by tabs.Tab.lastAccessed:
// all tabs used within a time window, the smallest window from
// RECENT_WINDOWS that holds at least RECENT_MIN tabs ("if several tabs were
// active in the last 15 minutes, only those; if not, the last 3 hours"...).
//
// The button cycles through RECENT_LEVELS levels, then off. Each level is
// the same rule, skipping the windows the levels before used: level 2 is the
// next window that adds tabs, level 3 the one after. Windows that add no tab
// are skipped, so every level selects more than the one before (while there
// are older tabs to add).
const MIN = 60e3, HOUR = 60 * MIN, DAY = 24 * HOUR;
export const RECENT_WINDOWS = [15 * MIN, 3 * HOUR, 12 * HOUR, 2 * DAY, 7 * DAY, 28 * DAY];
export const RECENT_MIN = 2;
export const RECENT_LEVELS = 3;

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

// a window as text: 5, 10, 15, 30 minutes, hour, 2..12 hours, day,
// 2..14 days, 3..8 weeks, 2.. months
export function recentSpan(age : number) : string {
	for (const m of [5, 10, 15, 30]) {
		if (age <= m * MIN) return m + " minutes";
	}
	if (age <= HOUR) return "hour";
	if (age <= 12 * HOUR) return Math.ceil(age / HOUR) + " hours";
	if (age <= DAY) return "day";
	if (age <= 14 * DAY) return Math.ceil(age / DAY) + " days";
	if (age <= 8 * 7 * DAY) return Math.ceil(age / (7 * DAY)) + " weeks";
	return Math.ceil(age / (30 * DAY)) + " months";
}

export function recentTabs(tabs : Iterable<RecentCandidate>, now : number, level = 1) : RecentTabs {
	level = Math.min(Math.max(1, Math.floor(level)), RECENT_LEVELS);
	const aged : { id : number, age : number }[] = [];
	for (const tab of tabs) {
		if (tab.id === undefined || !tab.lastAccessed) continue;
		aged.push({ id: tab.id, age: Math.max(0, now - tab.lastAccessed) });
	}
	aged.sort((a, b) => a.age - b.age || a.id - b.id);

	// the windows each level can land on: at least RECENT_MIN tabs, and more
	// than the window before; if none has that many, the largest window
	let picked = 0, count = 0, window = 0;
	for (const w of RECENT_WINDOWS) {
		let n = count;
		while (n < aged.length && aged[n].age <= w) n++;
		if (n < RECENT_MIN || n === count) continue;
		count = n;
		window = w;
		if (++picked === level) break;
	}
	if (picked === 0) {
		const last = RECENT_WINDOWS[RECENT_WINDOWS.length - 1];
		while (count < aged.length && aged[count].age <= last) count++;
		window = last;
	}
	if (count === 0) return { ids: [], count: 0, span: null };
	return { ids: aged.slice(0, count).map((t) => t.id), count, span: recentSpan(window) };
}

// the header text: "4 tabs active in the last 15 minutes"
export function recentText(recent : RecentTabs) : string {
	if (!recent.span || recent.count === 0) return "No recently active tabs";
	return maybePluralize(recent.count, "tab") + " active in the last " + recent.span;
}
