"use strict";

// Drops that do nothing, or only part of what was dragged, and why. Three
// things live here, all pure (unit tested in tests/dropReasons.test.ts):
//
// - what a drop on saved windows takes of what was dragged and what it leaves
//   out (`planMove`, `planAdd`, `splitByKind`, ./savedDrag.ts for the saved
//   tabs that open in an open window), each left-out tab with its reason;
// - the red error notice for that (`dropErrorText`): "Nothing added: …" when
//   the drop did nothing, "2 of 5 tabs left out: …" when it did part.
//
// A drop that changes nothing on purpose (a tab dropped where it already is)
// has no reason and no notice.

import type {SavedTabRef} from "./sessionKeys.ts";
import type {MovableWindow, SavedDropTarget} from "./savedMove.ts";
import {savedCopy} from "./savedAdd.ts";
import type {AddableTab} from "./savedAdd.ts";

// Why tabs were left out of a drop
export type LeftReason =
	// the place dropped on is gone (closed, deleted meanwhile)
	| "target-window-gone"
	| "target-tab-gone"
	| "target-open-window-gone"
	| "target-open-tab-gone"
	// the dragged tabs are gone
	| "dragged-saved-gone"
	| "dragged-open-gone"
	// private and normal never mix: open tabs between open windows, open tabs
	// into saved windows, saved tabs between saved windows
	| "private-to-normal-window"
	| "normal-to-private-window"
	| "private-to-normal-saved"
	| "normal-to-private-saved"
	| "saved-private-to-normal"
	| "saved-normal-to-private"
	// nothing to restore in an open tab
	| "no-address"
	| "about-page"
	// the browser refused
	| "move-refused"
	| "open-failed";

export interface Left {
	reason : LeftReason;
	// how many tabs (the places that are gone count what they take with them)
	n : number;
}

// ---- private and normal ----

// the part of a tab this reads
export interface KindTab {
	incognito? : boolean;
}

// What of `tabs` can go to a private (`privateTarget`) or a normal window or
// saved window (`where`), and the reason for the ones that cannot
export function splitByKind<T extends KindTab>(tabs : readonly T[], privateTarget : boolean, where : "window" | "saved") : { go : T[], left : Left[] } {
	const go = tabs.filter((tab) => !!tab.incognito === privateTarget);
	const n = tabs.length - go.length;
	if (n === 0) return { go, left: [] };
	const reason = (privateTarget ? "normal-to-private-" : "private-to-normal-") + where as LeftReason;
	return { go, left: [{ reason, n }] };
}

function isWindow(s : unknown) : s is MovableWindow {
	return !!s && typeof s === "object" && typeof (s as MovableWindow).id === "string" && Array.isArray((s as MovableWindow).tabs);
}

function isPrivate(s : MovableWindow) : boolean {
	return !!(s.incognito || (s.windowsInfo && s.windowsInfo.incognito));
}

function findWindow<T extends MovableWindow>(stored : Readonly<Record<string, T>>, id : string) : T | undefined {
	return Object.values(stored).find((s) => isWindow(s) && s.id === id);
}

// ---- saved tabs dropped on saved windows ----

export interface MovePlan {
	// the dragged saved tabs that can go, to hand to moveSavedTabs
	go : SavedTabRef[];
	// why the others cannot (all of them, when the place dropped on is gone)
	left : Left[];
}

// What moving the saved tabs `refs` to `target` takes of them, in `stored`
// (the saved windows as they are now): the place dropped on must be there,
// the dragged tabs too, and a private saved window gives and takes no tabs
// from a normal one. `left` is empty when everything can go.
export function planMove<T extends MovableWindow>(stored : Readonly<Record<string, T>>, refs : readonly SavedTabRef[], target : SavedDropTarget) : MovePlan {
	const into = findWindow(stored, target.sessionId);
	if (!into) return { go: [], left: [{ reason: "target-window-gone", n: refs.length }] };
	if (target.index !== undefined && !into.tabs.some((tab) => tab.index === target.index)) return { go: [], left: [{ reason: "target-tab-gone", n: refs.length }] };
	let gone = 0;
	let mixed = 0;
	const go : SavedTabRef[] = [];
	for (const ref of refs) {
		const from = findWindow(stored, ref.sessionId);
		if (!from || !from.tabs.some((tab) => tab.index === ref.index)) gone++;
		else if (isPrivate(from) !== isPrivate(into)) mixed++;
		else go.push(ref);
	}
	const left : Left[] = [];
	if (gone) left.push({ reason: "dragged-saved-gone", n: gone });
	if (mixed) left.push({ reason: isPrivate(into) ? "saved-normal-to-private" : "saved-private-to-normal", n: mixed });
	return { go, left };
}

// ---- open tabs dropped on saved windows ----

export interface AddPlan<T> {
	// the dragged open tabs to hand to addOpenTabs: the ones that may go into
	// that saved window. Some may still have nothing to restore (addOpenTabs
	// leaves those out; `left` says so)
	go : T[];
	left : Left[];
}

// The reason an open tab has nothing a saved window can restore: no address,
// or (Firefox) an about: page it cannot reopen; null when it can be saved
export function whyUnsavable(tab : AddableTab, firefox : boolean) : "no-address" | "about-page" | null {
	if (savedCopy(tab, false, firefox)) return null;
	const url = tab.url || tab.pendingUrl || "";
	return !url ? "no-address" : "about-page";
}

// What adding the open tabs `tabs` at `target` takes of them, in `stored`:
// the place dropped on must be there, private tabs go only to a private saved
// window and normal tabs to a normal one, and a tab needs an address Firefox
// can reopen. `left` is empty when every tab goes in.
export function planAdd<T extends MovableWindow, U extends AddableTab>(stored : Readonly<Record<string, T>>, tabs : readonly U[], target : SavedDropTarget, firefox = false) : AddPlan<U> {
	const into = findWindow(stored, target.sessionId);
	if (!into) return { go: [], left: [{ reason: "target-window-gone", n: tabs.length }] };
	if (target.index !== undefined && !into.tabs.some((tab) => tab.index === target.index)) return { go: [], left: [{ reason: "target-tab-gone", n: tabs.length }] };
	const kinds = splitByKind(tabs, isPrivate(into), "saved");
	const left = kinds.left.slice();
	let blank = 0;
	let about = 0;
	for (const tab of kinds.go) {
		const why = whyUnsavable(tab, firefox);
		if (why === "no-address") blank++;
		else if (why === "about-page") about++;
	}
	if (blank) left.push({ reason: "no-address", n: blank });
	if (about) left.push({ reason: "about-page", n: about });
	return { go: kinds.go, left };
}

// ---- the error notice ----

function count(n : number, one : string, many : string = one + "s") : string {
	return n + " " + (n === 1 ? one : many);
}

// One clause of the notice
export function leftClause(left : Left) : string {
	const n = left.n;
	switch (left.reason) {
		case "target-window-gone": return "the saved window is gone";
		case "target-tab-gone": return "the saved tab you dropped on is gone";
		case "target-open-window-gone": return "the window you dropped on is closed";
		case "target-open-tab-gone": return "the tab you dropped on is closed";
		case "dragged-saved-gone": return n === 1 ? "the dragged saved tab is gone" : n + " dragged saved tabs are gone";
		case "dragged-open-gone": return n === 1 ? "the dragged tab is closed" : n + " dragged tabs are closed";
		case "private-to-normal-window": return count(n, "private tab") + " can't move to a normal window";
		case "normal-to-private-window": return count(n, "normal tab") + " can't move to a private window";
		case "private-to-normal-saved": return count(n, "private tab") + " can't be added to a normal saved window";
		case "normal-to-private-saved": return count(n, "normal tab") + " can't be added to a private saved window";
		case "saved-private-to-normal": return count(n, "private saved tab") + " can't move into a normal saved window";
		case "saved-normal-to-private": return count(n, "normal saved tab") + " can't move into a private saved window";
		case "no-address": return n === 1 ? "1 tab has no address" : n + " tabs have no address";
		case "about-page": return count(n, "about: page") + " can't be saved on Firefox";
		case "move-refused": return "the browser would not move " + count(n, "tab");
		case "open-failed": return count(n, "saved tab") + " could not be opened";
	}
}

// How many tabs the reasons take out of the drop (a place that is gone takes
// all of them: its count is that of the tabs dragged)
export function leftTotal(left : readonly Left[]) : number {
	return left.reduce((sum, l) => sum + l.n, 0);
}

// The error notice for a drop: nothing happened ("Nothing added: the saved
// window is gone"), or only part did ("2 of 5 tabs left out: 1 private tab
// can't be added to a normal saved window; 1 about: page can't be saved on
// Firefox"). `verb`: what the drop does ("added", "moved", "opened"), `noun`:
// what was dragged ("tab", "saved tab"), `asked`: how many were dragged (the
// ones on screen), `done`: how many it did. "" when nothing was left out.
export function dropErrorText(verb : string, noun : string, asked : number, done : number, left : readonly Left[]) : string {
	if (left.length === 0) return "";
	const why = left.map(leftClause).join("; ");
	if (done <= 0) return "Nothing " + verb + ": " + why;
	return leftTotal(left) + " of " + asked + " " + noun + "s left out: " + why;
}

// ---- refused drops: the not-allowed cursor ----

// What a drag over a target says to the browser: `moves` (the drop is taken
// and does something, at least in part: the cursor shows the drop and the
// drop marker the place), `refused` (every dragged tab is left out for a
// reason: the cursor is the not-allowed one, no marker), `none` (a drop that
// changes nothing on purpose, or nothing is dragged: the cursor is the
// not-allowed one too, and there is nothing to say)
export type DropVerdict = "moves" | "refused" | "none";

// the part of an open tab this reads
export interface OpenMoveTab extends KindTab {
	id : number;
	windowId : number;
	index : number;
}

// Open tabs dragged over an open window: `incognito` is that of the window,
// `index` where they would go (undefined: at its end), `last` the index of
// the window's last tab
export interface OpenMoveTarget {
	windowId : number;
	incognito : boolean;
	index? : number;
	last : number;
}

// Whether dropping the open tabs `tabs` on the open window / tab `target`
// moves any of them: private tabs go only to a private window and normal
// tabs to a normal one. A drop that takes only part of them is still taken
// (the notice names the rest, dropErrorText); one that takes none is
// refused, with its reasons. A single tab dropped where it already is (its
// own place, or the end of a window it already ends) changes nothing.
export function openMoveVerdict(tabs : readonly OpenMoveTab[], target : OpenMoveTarget) : { verdict : DropVerdict, left : Left[] } {
	if (tabs.length === 0) return { verdict: "none", left: [] };
	const kinds = splitByKind(tabs, target.incognito, "window");
	if (kinds.go.length === 0) return { verdict: "refused", left: kinds.left };
	if (kinds.left.length === 0 && kinds.go.length === 1) {
		const tab = kinds.go[0];
		const stays = tab.windowId === target.windowId && (target.index === undefined ? tab.index === target.last : tab.index === target.index);
		if (stays) return { verdict: "none", left: [] };
	}
	return { verdict: "moves", left: [] };
}

// Whether saved tabs dragged over an open window / tab open anything:
// `openable` of the dragged ones can be opened, `gone` are deleted meanwhile,
// `blank` have no address (./savedDrag.ts openableSaved)
export function openSavedVerdict(openable : number, gone : number, blank : number) : { verdict : DropVerdict, left : Left[] } {
	if (openable > 0) return { verdict: "moves", left: [] };
	const left : Left[] = [];
	if (gone) left.push({ reason: "dragged-saved-gone", n: gone });
	if (blank) left.push({ reason: "no-address", n: blank });
	return { verdict: left.length > 0 ? "refused" : "none", left };
}

// How long after the last dragover over a refusing target a drag still
// ended there: the browser repeats dragover every 50 to 350 ms while the
// pointer is over a target, so an older one is a drag that left the popup
export const REFUSAL_FRESH_MS = 1500;

// The last refusing target of a drag: the notice its reason gives, and when
export interface Refusal {
	text : string;
	at : number;
}

// The error notice for a drag that ended (dragend) over a refusing target,
// "" when there is none: the drag was dropped nowhere (`dropEffect` "none"
// and no drop event came), and the last dragover was over a target that
// refused it for a reason, not long ago
export function refusalNotice(refusal : Refusal | null, now : number, dropEffect : string | undefined, dropped : boolean) : string {
	if (!refusal || !refusal.text || dropped || dropEffect !== "none") return "";
	if (now - refusal.at > REFUSAL_FRESH_MS || now < refusal.at) return "";
	return refusal.text;
}
