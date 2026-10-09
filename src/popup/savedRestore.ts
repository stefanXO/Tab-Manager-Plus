"use strict";

// Opening the selected saved tabs in one new window (Enter). The window is
// built from the saved windows the tabs belong to and goes through the same
// worker command as clicking a saved tab or a saved window
// (S.create_window_with_session_tabs, restore path in
// service_worker/background/windows.ts). The keys are saved tab keys
// (./sessionKeys.ts).

import {SavedTabKeys, savedTabKeys, isSavedTabKey} from "./sessionKeys.ts";

// the shape of a saved window this needs (ISavedSession has more)
export interface RestoreSource {
	id : string;
	incognito? : boolean;
	windowsInfo? : { incognito? : boolean };
	tabs : { index? : number, active? : boolean }[];
}

// The saved window to restore for these keys: the selected tabs in the order
// shown (the saved windows as `sessions` lists them, their tabs in stored
// order, whatever order they were clicked in), numbered 0, 1, 2… as the
// window gets them, the first one active. Keys that are not in `sessions`
// (deleted meanwhile, or pending delete) and open tab ids are left out; null
// when nothing is left.
//
// Tabs of one saved window keep that window (name, colour, size and
// position). Tabs of several get the first one's size and position, no
// name and the default colour, and the window is private when any of the
// saved windows was (a private tab never lands in a normal window).
export function savedWindowFor<T extends RestoreSource>(keys : Iterable<number>, sessions : readonly T[], registry : SavedTabKeys = savedTabKeys) : T | null {
	const picked = new Map<string, Set<number>>();
	for (const key of keys) {
		if (!isSavedTabKey(key)) continue;
		const ref = registry.ref(key);
		if (!ref) continue;
		let indexes = picked.get(ref.sessionId);
		if (!indexes) picked.set(ref.sessionId, indexes = new Set());
		indexes.add(ref.index);
	}
	const from : T[] = [];
	const tabs : T["tabs"] = [];
	for (const session of sessions) {
		const indexes = picked.get(session.id);
		if (!indexes) continue;
		const mine = session.tabs.filter((tab) => tab.index !== undefined && indexes.has(tab.index));
		if (mine.length === 0) continue;
		from.push(session);
		tabs.push(...mine);
	}
	if (tabs.length === 0) return null;
	const numbered = tabs.map((tab, n) => ({ ...tab, index: n, active: n === 0 }));
	const first = from[0];
	if (from.length === 1) return { ...first, tabs: numbered };
	const priv = from.some((s) => !!s.incognito || !!(s.windowsInfo && s.windowsInfo.incognito));
	return {
		...first,
		name: "",
		customName: false,
		color: "default",
		incognito: priv,
		windowsInfo: { ...first.windowsInfo, incognito: priv },
		tabs: numbered
	} as T;
}
