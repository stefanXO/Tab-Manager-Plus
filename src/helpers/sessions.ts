"use strict";

// Building saved windows (the ISavedSession records under the `sessions`
// storage key) from open tabs: the "save this window" button and the "save
// selected tabs" button of the bottom bar. Pure (no browser APIs), so it is
// unit tested in tests/sessions.test.ts.

import { windowName } from "../popup/windowName.ts";
import type { NameTab } from "../popup/windowName.ts";
import { maybePluralize } from "./utils.ts";
import { firefoxCanOpen } from "./aboutPages.ts";

// a random version 4 uuid, the id of a saved window
export function newSessionId(random : () => number = Math.random) : string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

// the saved window as stored (ISavedSession), over the tab and window types the caller has
export interface NewSavedWindow<T, W> {
	tabs : T[];
	windowsInfo : W;
	name : string;
	customName : boolean;
	color : string;
	date : number;
	sessionStartTime : number;
	incognito : boolean;
	id : string;
}

export interface SaveInput<T, W> {
	id : string;
	now : number;
	// the tabs to keep, in order, as the browser reports them
	tabs : T[];
	windowsInfo : W;
	// the name the user gave the window, "" when it has none
	name : string;
	// the name its sites make (the title bar of an open window shows it)
	autoName? : string;
	color? : string;
	incognito : boolean;
	// Firefox cannot restore its about: pages (./aboutPages.ts): they are left out
	firefox : boolean;
}

// A saved window: the user's name (else the automatic one, else one made from
// the tabs) is its name, and only a given name is a custom one that restoring
// carries over to the new window.
export function buildSavedWindow<T extends NameTab, W>(input : SaveInput<T, W>) : NewSavedWindow<T, W> {
	const kept = input.tabs.filter((tab) => !input.firefox || firefoxCanOpen(tab.url));
	return {
		tabs: kept,
		windowsInfo: input.windowsInfo,
		name: input.name || input.autoName || windowName(input.tabs),
		customName: !!input.name,
		color: input.color || "default",
		date: input.now,
		sessionStartTime: input.now,
		incognito: input.incognito,
		id: input.id
	};
}

// the part of an open tab the selection grouping reads
export interface SelectedTab extends NameTab {
	index : number;
	windowId? : number;
	incognito? : boolean;
	active? : boolean;
}

// What one saved window takes from a selection of open tabs.
export interface SelectionGroup<T> {
	incognito : boolean;
	// the open window whose size, place and state the saved window gets: the
	// one that holds most of the selected tabs (the first of them on a tie)
	windowId : number | undefined;
	// the tabs in popup order, renumbered from 0 (a restore opens a tab by its
	// index, and the old ones belong to different windows); only the first
	// active tab stays active
	tabs : T[];
}

// Splits selected open tabs into the saved windows they make: tabs in the
// order the popup lists them (`windowOrder`: window ids, top to bottom; a
// window it does not know goes last), within a window by tab index. Normal
// and private tabs never share a saved window (a window is one or the other),
// so a mixed selection makes two, normal first.
export function groupSelection<T extends SelectedTab>(tabs : T[], windowOrder : number[]) : SelectionGroup<T>[] {
	const rank = (tab : T) : number => {
		const at = tab.windowId === undefined ? -1 : windowOrder.indexOf(tab.windowId);
		return at < 0 ? windowOrder.length : at;
	};
	const sorted = tabs.map((tab, at) => ({ tab, at })).sort((a, b) => rank(a.tab) - rank(b.tab) || a.tab.index - b.tab.index || a.at - b.at).map((e) => e.tab);

	const groups : SelectionGroup<T>[] = [];
	for (const incognito of [false, true]) {
		const own = sorted.filter((tab) => !!tab.incognito === incognito);
		if (own.length === 0) continue;
		// the window with most of the tabs; own is in window order, so a tie keeps the first
		const counts = new Map<number | undefined, number>();
		for (const tab of own) counts.set(tab.windowId, (counts.get(tab.windowId) || 0) + 1);
		let windowId : number | undefined = own[0].windowId;
		for (const [id, count] of counts) if (count > counts.get(windowId)!) windowId = id;

		let seenActive = false;
		groups.push({
			incognito,
			windowId,
			tabs: own.map((tab, index) => {
				const copy : T = { ...tab, index };
				if (copy.active) {
					if (seenActive) copy.active = false;
					seenActive = true;
				}
				return copy;
			})
		});
	}
	return groups;
}

// what the header says after saving: "Saved 4 tabs as “Work”"
export function savedText(saved : { name : string, tabs : unknown[] }[]) : string {
	if (saved.length === 0) return "";
	const count = saved.reduce((sum, s) => sum + s.tabs.length, 0);
	const names = saved.map((s) => "“" + s.name + "”").join(" and ");
	return "Saved " + maybePluralize(count, "tab") + " as " + names;
}
