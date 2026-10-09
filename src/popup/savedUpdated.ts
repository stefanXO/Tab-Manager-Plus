"use strict";

// When a saved window last changed. `date` is when it was saved and never
// changes; the optional `updated` is when its tabs last changed: saved tabs
// moved in, out or within it, open tabs added to it, saved tabs deleted from
// it. A new name or colour, or a new place among the saved windows, is no
// change of its tabs. Restoring never reads it. The cards say "saved … ago"
// from the later of the two. Pure, unit tested in tests/savedUpdated.test.ts.

import { timeAgo } from "../helpers/utils.ts";

export interface Dated {
	date? : number;
	updated? : number;
}

interface UrlTab {
	url? : string;
}

function usable(t : unknown) : t is number {
	return typeof t === "number" && Number.isFinite(t);
}

// the same tabs: the same addresses in the same order
export function sameTabUrls(a : readonly UrlTab[], b : readonly UrlTab[]) : boolean {
	return a.length === b.length && a.every((tab, i) => (tab && tab.url || "") === (b[i] && b[i].url || ""));
}

// `after`, a change of the stored saved windows `before`, with `updated: now`
// on every saved window that was there before and whose tabs are not the same
// any more (sameTabUrls: tabs numbered anew are the same). New ones and the
// ones whose tabs stayed are the same objects. Never changes either.
export function stampUpdated<T extends Dated & { tabs : UrlTab[] }>(before : Readonly<Record<string, T>>, after : Readonly<Record<string, T>>, now : number) : Record<string, T> {
	const out : Record<string, T> = {};
	for (const key of Object.keys(after)) {
		const was = before[key];
		const s = after[key];
		const changed = !!was && !!s && Array.isArray(was.tabs) && Array.isArray(s.tabs) && was.tabs !== s.tabs && !sameTabUrls(was.tabs, s.tabs);
		out[key] = changed ? { ...s, updated: now } : s;
	}
	return out;
}

// when it was last saved: when its tabs last changed, else when it was saved
export function lastSaved(s : Dated) : number {
	return usable(s.updated) ? s.updated : s.date as number;
}

export interface SavedTime {
	key : "created" | "saved";
	text : string;
	at : number;
}

// The times a card shows: "created 2 days ago" and "last saved 3 hours ago"
// when they read differently, else only "saved 2 days ago".
export function savedTimes(s : Dated, now : number) : SavedTime[] {
	const created = usable(s.date) ? s.date : now;
	const saved = usable(s.updated) ? s.updated : created;
	const createdText = ago(created, now);
	const savedText = ago(saved, now);
	if (saved === created || savedText === createdText) return [{ key: "saved", text: "saved " + savedText, at: saved }];
	return [
		{ key: "created", text: "created " + createdText, at: created },
		{ key: "saved", text: "last saved " + savedText, at: saved }
	];
}

// timeAgo, "just now" for a time that is not a number (an import without a date)
function ago(at : unknown, now : number) : string {
	return timeAgo(usable(at) ? at : now, now);
}

// the card's "saved … ago" label
export function savedLabel(s : Dated, now : number) : string {
	return "saved " + ago(lastSaved(s), now);
}

// its tooltip: each time with the exact date under it
export function savedHover(s : Dated, now : number, format : (at : number) => string = (at) => new Date(at).toLocaleString()) : string {
	return savedTimes(s, now).map((t) => t.text.charAt(0).toUpperCase() + t.text.slice(1) + "\n" + format(t.at)).join("\n");
}
