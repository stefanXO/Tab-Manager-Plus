"use strict";

// Opening saved tabs in an open window: a saved tab (or the selected saved
// tabs) dragged from a saved window onto an open window or one of its tabs.
// The popup sends what to open and where (S.open_saved_tabs); the worker opens
// them one after the other with tabs.create. The saved window is not changed.
// No browser calls in here: the worker passes tabs.create in, the tests a fake.

import { firefoxCanOpen } from "./aboutPages.ts";

// one saved tab to open: what the popup sends the worker
export interface ISavedTabOpen {
	url : string;
	pinned : boolean;
}

// the part of tabs.create's argument used here
export interface IOpenCreate {
	windowId : number;
	index? : number;
	url? : string;
	pinned : boolean;
	active : boolean;
}

// the part of the created tab used here
export interface IOpenCreated {
	id? : number;
	index : number;
}

// What tabs.create gets for one saved tab. Opened in the background: the
// popup stays open over the window it was dropped on and shows the new tabs
// (activating a tab in the popup's own window would close it). Firefox
// refuses its about: pages (./aboutPages.ts), as when a saved window is
// restored (background/windows.ts); such a tab opens as a new tab instead.
export function createData(tab : ISavedTabOpen, windowId : number, index : number | undefined, firefox : boolean) : IOpenCreate {
	const data : IOpenCreate = { windowId, pinned: !!tab.pinned, active: false };
	if (index !== undefined) data.index = index;
	if (tab.url && (!firefox || firefoxCanOpen(tab.url))) data.url = tab.url;
	return data;
}

// Opens `tabs` in the window `windowId` at `index` (undefined: at the end),
// in the given order, and resolves with the ids of the tabs it opened. A tab
// that fails to open is logged and skipped; the rest still open.
//
// The browser may put a tab elsewhere than asked: a pinned tab goes to the end
// of the pinned tabs, an unpinned one never before them. The next tab goes
// after the one just opened when that landed at or after the asked place, and
// one further than asked when it landed before it (it pushed the asked place
// one to the right): the unpinned ones stay together at the drop position.
export async function openTabsAt(create : (data : IOpenCreate) => Promise<IOpenCreated | void>, windowId : number, index : number | undefined, tabs : readonly ISavedTabOpen[], firefox : boolean) : Promise<number[]> {
	const opened : number[] = [];
	let at = index;
	for (const tab of tabs) {
		let made : IOpenCreated | void;
		try {
			made = await create(createData(tab, windowId, at, firefox));
		} catch (e) {
			console.error("could not open the saved tab", tab.url, e);
			continue;
		}
		if (!made) continue;
		if (typeof made.id === "number") opened.push(made.id);
		if (at !== undefined) at = made.index < at ? at + 1 : made.index + 1;
	}
	return opened;
}
