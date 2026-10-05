"use strict";

// When the stats card opens, and for what: the pure decisions behind the
// hover controller (./statsHover.ts). No DOM, no browser APIs, so the rules
// can be unit tested (tests/statsHover.test.ts).

// ---- the timings (experiments, flip them here) ----
// the tab card has no delay of its own: it opens once the pointer has settled
export const STATS_TAB_DELAY = 0;
// the window card opens anywhere on a window card that is not a tab (title,
// padding, age label; not the action buttons) and sits under the pointer;
// false = only on the "last active" label
export const STATS_WINDOW_ANYWHERE = true;
// no delay of its own either: it opens after the same settle as a tab
export const STATS_WINDOW_DELAY = 0;
// the pointer has to rest this long on one target before any card opens, so
// a sweep across a row of tabs does not open (and re-render) a card per tile
export const STATS_SETTLE = 100;
// the arrows in the list view: key repeat must not open a card per row
export const STATS_KEYBOARD_DELAY = 500;
// tooltip chaining: while a card is open, or this soon after the pointer left
// every target, the next card opens after STATS_SETTLE at most (no cold delay)
export const STATS_WARM_GRACE = 300;

export interface StatsTimings {
	tabDelay : number;
	windowDelay : number;
	settle : number;
	warmGrace : number;
}
export const STATS_TIMINGS : StatsTimings = {
	tabDelay: STATS_TAB_DELAY,
	windowDelay: STATS_WINDOW_DELAY,
	settle: STATS_SETTLE,
	warmGrace: STATS_WARM_GRACE
};

// what hoverKey() needs of a DOM element (an Element fits), so tests can fake it
export interface HoverNode {
	id : string;
	closest(selector : string) : HoverNode | null;
}

// The card target under the pointer: "t<tab id>", "w<window id>", or "" for
// none. A tab tile wins; else the window card around the pointer, except over
// its action buttons (the card would sit over the row about to be clicked).
export function hoverKey(target : HoverNode, windowAnywhere = STATS_WINDOW_ANYWHERE) : string {
	const tab = target.closest(".window-container .tab[id^='tab-']");
	if (tab) return "t" + tab.id.slice(4);
	if (target.closest(".window-actions")) return "";
	if (!windowAnywhere && !target.closest(".window-container .window-age")) return "";
	const win = target.closest(".window-container .window[id^='window-']");
	return win ? "w" + win.id.slice(7) : "";
}

export function parseKey(key : string) : { kind : "tab" | "window", id : number } | null {
	if (key.length < 2 || (key[0] !== "t" && key[0] !== "w")) return null;
	return { kind: key[0] === "t" ? "tab" : "window", id: Number(key.slice(1)) };
}

// chaining: a card is open, or one closed moments ago
export function isWarm(open : boolean, now : number, leftAt : number, grace = STATS_WARM_GRACE) : boolean {
	return open || now - leftAt < grace;
}

export type HoverAction =
	// same target as before (moving inside one tile): nothing changes
	| { kind : "none" }
	// off every target: close the card now (`left`: one was open, so chaining
	// starts counting from now)
	| { kind : "close", left : boolean }
	// open / swap to `key`, after `delay` ms (0: right now, in this event)
	| { kind : "show", key : string, delay : number };

// The pointer moved onto `key` (see hoverKey) from `prev`.
// Onto another target an open card stays until the new one replaces it, so
// crossing the gap between two tiles (a moment on the window) does not blink
// it off and on. Warm onto a tab: swap right away. Warm onto a window: settle
// first, so crossing that gap does not flash the window card in between.
// Cold: settle, or the target's own delay if that is longer.
export function hoverAction(key : string, prev : string, open : boolean, warm : boolean, t : StatsTimings = STATS_TIMINGS) : HoverAction {
	if (key === prev) return { kind: "none" };
	if (!key) return { kind: "close", left: open };
	const isWindow = key[0] === "w";
	if (warm && !isWindow) return { kind: "show", key, delay: 0 };
	const delay = warm ? t.settle : Math.max(t.settle, isWindow ? t.windowDelay : t.tabDelay);
	return { kind: "show", key, delay };
}

// An arrow key in the list view moves the selection (TabManager.checkKey),
// and the card follows it; not off the main screen, not while the arrows move
// the caret in a search box that has text.
export function arrowsMoveCard(keyCode : number, listLayout : boolean, mainScreen : boolean, searchHasCaret : boolean) : boolean {
	return keyCode >= 37 && keyCode <= 40 && listLayout && mainScreen && !searchHasCaret;
}
