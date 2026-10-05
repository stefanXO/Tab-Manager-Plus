"use strict";

import { timeAgo } from "../helpers/utils.ts";

// How recently a tab was used, for the freshness indicator at the end of a
// List view row (views/Tab.tsx, css/layout/view-list.css). Level 4 is the
// freshest, 0 is older than a week. Computed at render, no timers: the popup
// re-renders on tab events anyway.
export const FRESH_STEPS = [5 * 60e3, 3600e3, 24 * 3600e3, 7 * 24 * 3600e3] as const;

export type FreshLevel = 0 | 1 | 2 | 3 | 4;

/** Level for a tab used `age` ms ago: 4 under 5 min, 3 under 1 h, 2 under a day, 1 under a week, else 0. */
export function freshness(age : number) : FreshLevel {
	if (typeof age !== "number" || isNaN(age)) return 0;
	const a = Math.max(0, age);
	for (let i = 0; i < FRESH_STEPS.length; i++) {
		if (a < FRESH_STEPS[i]) return (4 - i) as FreshLevel;
	}
	return 0;
}

export interface Freshness {
	level : FreshLevel;
	label : string;
}

/** Level + "active 3 minutes ago" for a tabs.Tab.lastAccessed; null when the browser gives none. */
export function tabFreshness(lastAccessed : number | undefined, now = Date.now()) : Freshness | null {
	if (typeof lastAccessed !== "number" || !isFinite(lastAccessed) || lastAccessed <= 0) return null;
	return { level: freshness(now - lastAccessed), label: "active " + timeAgo(lastAccessed, now) };
}
