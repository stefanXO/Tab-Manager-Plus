"use strict";

// Adding open tabs to a saved window: an open tab (or the selected open tabs)
// dragged onto a saved tab goes in as a copy right before / after it; dropped
// on a saved window card (not on a tab) at the end of that window. The open
// tabs stay open. The drop targets are the ones saved tabs move to
// (./savedMove.ts). Pure, unit tested in tests/savedAdd.test.ts.
//
// The saved window is numbered 0, 1, 2… anew in its new order, as a move
// does, so `moves` carries the selection and the pending deletes of its tabs
// over to their new numbers (TabManager, as for a move).

import {firefoxCanOpen} from "../helpers/aboutPages.ts";
import type {MovableWindow, SavedDropTarget, SavedTabMove} from "./savedMove.ts";

// The drag data type an open tab's drag carries (beside its id and address):
// saved tabs and saved window cards take a drop of open tabs only from a drag
// carrying it.
export const OPEN_TAB_DRAG = "application/x-tab-manager-open-tab";

export function isOpenTabDrag(types : ArrayLike<string> | null | undefined) : boolean {
	return !!types && Array.from(types).includes(OPEN_TAB_DRAG);
}

// The open tabs a drag onto a saved window copies: the selected ones (`tabs`,
// the dragged one among them), without the ones the search hides when "Hide
// non-matching tabs" is on (`hidden`: their ids). The dragged one always
// goes: it is on screen.
export function draggedOpen<T extends { id? : number }>(tabs : readonly T[], dragged : number, hidden? : ReadonlySet<number>) : T[] {
	if (!hidden) return tabs.slice();
	return tabs.filter((tab) => tab.id === dragged || tab.id === undefined || !hidden.has(tab.id));
}

// the part of an open tab a copy is made from (browser.Tabs.Tab has more)
export interface AddableTab {
	index : number;
	windowId? : number;
	url? : string;
	pendingUrl? : string;
	title? : string;
	pinned? : boolean;
	favIconUrl? : string;
	incognito? : boolean;
}

// a saved tab made from an open tab: only what a saved tab needs to show and
// to come back (the worker restores url, pinned and index); never active, so
// a restore keeps the active tab the saved window had
export interface SavedTabCopy {
	index : number;
	url : string;
	title : string;
	pinned : boolean;
	favIconUrl? : string;
	active : boolean;
	highlighted : boolean;
	incognito : boolean;
}

export interface SavedAddResult<T> {
	// the stored saved windows after the add (a new object)
	stored : Record<string, T>;
	// the saved tabs of the target window whose index changed
	moves : SavedTabMove[];
	// how many copies went in
	count : number;
	// open tabs left out: no address, or one Firefox cannot open again
	skipped : number;
}

export interface AddOptions {
	// open window ids in the order the popup lists them (a window it does not know goes last)
	windowOrder? : readonly number[];
	// Firefox cannot restore its about: pages (../helpers/aboutPages.ts)
	firefox? : boolean;
}

function isWindow(s : unknown) : s is MovableWindow {
	return !!s && typeof s === "object" && typeof (s as MovableWindow).id === "string" && Array.isArray((s as MovableWindow).tabs);
}

function isPrivate(s : MovableWindow) : boolean {
	return !!(s.incognito || (s.windowsInfo && s.windowsInfo.incognito));
}

// The copy of an open tab a saved window keeps, or null when there is
// nothing to restore (no address, or an about: page on Firefox)
export function savedCopy(tab : AddableTab, incognito : boolean, firefox = false) : SavedTabCopy | null {
	const url = tab.url || tab.pendingUrl || "";
	if (!url || (firefox && !firefoxCanOpen(url))) return null;
	const copy : SavedTabCopy = { index: 0, url, title: tab.title || url, pinned: !!tab.pinned, active: false, highlighted: false, incognito };
	if (tab.favIconUrl) copy.favIconUrl = tab.favIconUrl;
	return copy;
}

// The stored saved windows (the `sessions` storage object) with copies of the
// open tabs `tabs` added at `target`, in the order the popup lists them
// (windows in `windowOrder`, then by tab index), whatever order they were
// picked in. Null when the target is not found, when no tab has anything to
// restore, or when a private tab would go into a normal saved window or the
// other way round (open and saved tabs never cross; ./savedMove.ts). The
// target window is numbered 0, 1, 2… anew; the others, other fields and the
// keys' order stay as they were. Never changes `stored`.
export function addOpenTabs<T extends MovableWindow>(stored : Readonly<Record<string, T>>, tabs : readonly AddableTab[], target : SavedDropTarget, options : AddOptions = {}) : SavedAddResult<T> | null {
	type Tab = T["tabs"][number];
	const key = Object.keys(stored).find((k) => isWindow(stored[k]) && stored[k].id === target.sessionId);
	if (key === undefined || tabs.length === 0) return null;
	const into = stored[key];
	const incognito = isPrivate(into);
	if (tabs.some((tab) => !!tab.incognito !== incognito)) return null;

	const order = options.windowOrder || [];
	const rank = (tab : AddableTab) : number => {
		const at = tab.windowId === undefined ? -1 : order.indexOf(tab.windowId);
		return at < 0 ? order.length : at;
	};
	const sorted = tabs.map((tab, at) => ({ tab, at })).sort((a, b) => rank(a.tab) - rank(b.tab) || a.tab.index - b.tab.index || a.at - b.at);
	const copies = sorted.map((e) => savedCopy(e.tab, incognito, !!options.firefox)).filter((c) : c is SavedTabCopy => !!c);
	if (copies.length === 0) return null;

	// where they go: before / after the tab dropped on, or at the end
	let at = into.tabs.length;
	if (target.index !== undefined) {
		const on = into.tabs.findIndex((tab) => tab.index === target.index);
		if (on < 0) return null;
		at = on + (target.before ? 0 : 1);
	}
	const list : Tab[] = into.tabs.slice();
	list.splice(at, 0, ...(copies as unknown as Tab[]));
	const added = new Set<unknown>(copies);

	const moves : SavedTabMove[] = [];
	const renumbered = list.map((tab, index) => {
		if (added.has(tab)) return { ...tab, index };
		if (typeof tab.index === "number" && tab.index !== index) moves.push({ from: { sessionId: into.id, index: tab.index }, to: { sessionId: into.id, index } });
		return tab.index === index ? tab : { ...tab, index };
	});
	const out : Record<string, T> = {};
	for (const k of Object.keys(stored)) out[k] = k === key ? { ...into, tabs: renumbered } : stored[k];
	return { stored: out, moves, count: copies.length, skipped: tabs.length - copies.length };
}

// the header after the drop
export function addedText(count : number, skipped : number, windowName : string) : { topText : string, bottomText : string } {
	const tabs = count === 1 ? "1 tab" : count + " tabs";
	const left = skipped === 0 ? "" : skipped === 1 ? "; 1 tab could not be saved" : "; " + skipped + " tabs could not be saved";
	return {
		topText: "Added " + tabs + (windowName ? " to “" + windowName + "”" : " to the saved window"),
		bottomText: (count + skipped === 1 ? "The open tab stays open" : "The open tabs stay open") + left
	};
}
