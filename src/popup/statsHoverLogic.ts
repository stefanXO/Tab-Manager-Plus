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

// An action button (the toolbar, the header's icons, a window's or a saved
// window's actions) has its help in the card: an element with data-help
// (./actionHelp.ts). Its key is "a<n>", n a number given to that element
// the first time the pointer is on it (several buttons may have the same
// text, and a click changes the text: neither may make them the same target
// or a new one)
export const ACTION_SELECTOR = "[data-help]";
const actionNumbers = new WeakMap<object, number>();
let nextActionNumber = 1;
export function actionKey(button : object) : string {
	let n = actionNumbers.get(button);
	if (n === undefined) {
		n = nextActionNumber++;
		actionNumbers.set(button, n);
	}
	return "a" + n;
}

// The card target under the pointer: an action button's "a<n>" (actionKey),
// "t<tab id>", "s<saved window id>_<index>"
// (a tab of a saved window; its element id is "sessiontab_<that>"),
// "w<window id>", "S<saved window id>" (its element id is "session-<that>"),
// or "" for none. A button wins (a window's buttons are on its card), then
// a tab tile; else the window card (open or saved) around the pointer, except
// between its action buttons.
export function hoverKey(target : HoverNode, windowAnywhere = STATS_WINDOW_ANYWHERE) : string {
	const action = target.closest(ACTION_SELECTOR);
	if (action) return actionKey(action);
	const tab = target.closest(".window-container .tab[id^='tab-']");
	if (tab) return "t" + tab.id.slice(4);
	const saved = target.closest(".window-container .tab[id^='sessiontab_']");
	if (saved) return "s" + saved.id.slice(11);
	if (target.closest(".window-actions")) return "";
	if (!windowAnywhere && !target.closest(".window-container .window-age")) return "";
	const win = target.closest(".window-container .window[id^='window-']");
	if (win) return "w" + win.id.slice(7);
	const session = target.closest(".window-container .window[id^='session-']");
	return session ? "S" + session.id.slice(8) : "";
}

export type ParsedKey =
	| { kind : "tab" | "window", id : number }
	| { kind : "saved", sessionId : string, index : number }
	| { kind : "session", sessionId : string }
	| { kind : "action" };

export function parseKey(key : string) : ParsedKey | null {
	if (key.length < 2) return null;
	if (key[0] === "a") return /^a\d+$/.test(key) ? { kind: "action" } : null;
	if (key[0] === "S") return { kind: "session", sessionId: key.slice(1) };
	if (key[0] === "s") {
		// the index is what follows the last "_" (a saved window's id may hold one)
		const cut = key.lastIndexOf("_");
		const tail = key.slice(cut + 1);
		if (cut < 2 || !/^\d+$/.test(tail)) return null;
		return { kind: "saved", sessionId: key.slice(1, cut), index: Number(tail) };
	}
	if (key[0] !== "t" && key[0] !== "w") return null;
	return { kind: key[0] === "t" ? "tab" : "window", id: Number(key.slice(1)) };
}

// chaining: a card is open, or one closed moments ago
export function isWarm(open : boolean, now : number, leftAt : number, grace = STATS_WARM_GRACE) : boolean {
	return open || now - leftAt < grace;
}

export type HoverAction =
	// same target as before (moving inside one tile): nothing changes
	| { kind : "none" }
	// off every target: close the card now, or after `delay` ms when given
	// (`left`: one was open, so chaining starts counting from then)
	| { kind : "close", left : boolean, delay? : number }
	// open / swap to `key`, after `delay` ms (0: right now, in this event)
	| { kind : "show", key : string, delay : number };

// The pointer moved onto `key` (see hoverKey) from `prev`.
// Onto another target an open card stays until the new one replaces it, so
// crossing the gap between two tiles (a moment on the window) does not blink
// it off and on. Warm onto a tab: swap right away. Warm onto a window (open
// or saved): settle
// first, so crossing that gap does not flash the window card in between.
// Cold: settle, or the target's own delay if that is longer. An action
// button is a target like a tab: warm onto one swaps right away, and from one
// to a tab too. Its buttons have gaps between them where nothing is under the
// pointer (the bars, a window's actions): off a button's open card, the close
// waits the settle, so crossing a gap to the next button swaps the card
// instead of closing and fading it in again.
export function hoverAction(key : string, prev : string, open : boolean, warm : boolean, t : StatsTimings = STATS_TIMINGS) : HoverAction {
	if (key === prev) return { kind: "none" };
	if (!key) return open && prev[0] === "a" ? { kind: "close", left: true, delay: t.settle } : { kind: "close", left: open };
	const isWindow = key[0] === "w" || key[0] === "S";
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
