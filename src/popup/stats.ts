"use strict";

// The text of the stats cards: the one a tab shows when the pointer rests on
// it, and the one a window shows on its "last active" label. Pure: everything
// comes in through the arguments (the clock too), nothing is read from the
// browser, nothing is stored. Only what tabs.Tab / windows.Window already
// carry; counters that need bookkeeping in the worker (tab age, time in
// front, visits) are for a later version and slot in as more keyed lines.
import { timeAgo, maybePluralize } from "../helpers/utils.ts";
import { dupKey } from "./duplicates.ts";

// the tabs.Tab fields the card reads
export interface StatsTab {
	id? : number;
	index? : number;
	windowId? : number;
	title? : string;
	url? : string;
	lastAccessed? : number;
	discarded? : boolean;
	frozen? : boolean;
	status? : string;
	audible? : boolean;
	mutedInfo? : { muted : boolean; reason? : string };
	pinned? : boolean;
	incognito? : boolean;
	openerTabId? : number;
}

// the windows.Window fields the card reads
export interface StatsWindow {
	id? : number;
	state? : string;
	incognito? : boolean;
	width? : number;
	height? : number;
}

// the small pictures a card can put in front of a line or a word: the list
// view's state chip badges (asleep, muted, playing, pinned), a few of the
// toolbar images (position, opener, copies), and line drawings (active: a
// clock, zoom, tabs, sites, used, window, monitor, hint)
export type StatsIcon = "active" | "asleep" | "muted" | "playing" | "pinned" | "position" | "opener" | "copies"
	| "zoom" | "tabs" | "sites" | "used" | "window" | "monitor" | "hint" | "saved";

// one word group of a line, drawn with its own icon ("· "-separated)
export interface StatsItem {
	icon? : StatsIcon;
	text : string;
}

// one line of a card; `key` says what it is, so a caller (or a test, or a
// later version adding lines) can find it without parsing the text. `text`
// is the whole line; `items`, when there, is the same line in parts, and
// `icon` goes in front of the line
export interface StatsLine {
	key : string;
	text : string;
	icon? : StatsIcon;
	items? : StatsItem[];
}

export interface StatsCard {
	title : string;
	lines : StatsLine[];
}

export interface TabStatsContext {
	now : number;
	// the tabs of the tab's own window, for "tab 4 of 12"
	windowTabs : StatsTab[];
	// every open tab, for the opener and the copies
	allTabs : Iterable<StatsTab>;
	// a window's display name ("" / undefined: leave it out of the copies list)
	windowName? : (windowId : number) => string | undefined;
	// tabs.getZoom(), when it has answered
	zoom? : number;
	// the names of the saved windows that hold this tab's url (savedWindowsWith)
	savedIn? : string[];
}

// the card of a tab of a saved window
export interface SavedTabStatsContext {
	now : number;
	// when the saved window was saved
	savedAt : number;
	// the saved window's display name and how many tabs it holds
	windowName : string;
	windowTabCount : number;
	// every open tab, for "open now in"
	allTabs : Iterable<StatsTab>;
	// an open window's display name ("" / undefined: leave it out)
	openWindowName? : (windowId : number) => string | undefined;
}

// a saved window, as far as the url lookup needs it
export interface SavedWindowNames {
	name : string;
	tabs : { url? : string }[];
}

export interface WindowStatsContext {
	now : number;
	name? : string;
	// when the window was last focused (the worker's windowAge record)
	lastActive? : number;
	// the popup's "current" window
	focused? : boolean;
	// the window is on no monitor the popup knows (monitorMap().offscreen)
	offscreen? : boolean;
	// which monitor it is on (monitorMap().monitor)
	monitor? : { index : number; count : number } | null;
	// only the popup's own monitor is known (Chrome without system.display)
	monitorHint? : boolean;
}

const SEP = " · ";

const MUTED_BY : Record<string, string> = {
	user: "muted by you",
	capture: "muted by tab capture",
	extension: "muted by an extension",
};

function isMuted(tab : StatsTab) : boolean {
	return !!tab.mutedInfo && !!tab.mutedInfo.muted;
}

function tabStateWords(tab : StatsTab) : StatsItem[] {
	const words : StatsItem[] = [];
	if (tab.discarded) words.push({ icon: "asleep", text: "asleep" });
	if (tab.frozen) words.push({ text: "frozen" });
	if (tab.status === "loading") words.push({ text: "loading" });
	if (isMuted(tab)) words.push({ icon: "muted", text: MUTED_BY[tab.mutedInfo.reason] || "muted" });
	else if (tab.audible) words.push({ icon: "playing", text: "playing sound" });
	if (tab.pinned) words.push({ icon: "pinned", text: "pinned" });
	if (tab.incognito) words.push({ text: "incognito" });
	return words;
}

function itemsLine(key : string, items : StatsItem[]) : StatsLine {
	return { key, text: items.map((i) => i.text).join(SEP), items };
}

export function tabStats(tab : StatsTab, ctx : TabStatsContext) : StatsCard {
	const lines : StatsLine[] = [];
	const add = (key : string, text : string, icon? : StatsIcon) => lines.push(icon ? { key, text, icon } : { key, text });

	if (typeof tab.lastAccessed === "number") add("active", "active " + timeAgo(tab.lastAccessed, ctx.now), "active");

	const state = tabStateWords(tab);
	if (state.length) lines.push(itemsLine("state", state));

	if (typeof tab.index === "number" && ctx.windowTabs.length > 0) {
		add("position", "tab " + (tab.index + 1) + " of " + ctx.windowTabs.length, "position");
	}

	const all = [...ctx.allTabs];
	if (tab.openerTabId !== undefined && tab.openerTabId !== tab.id) {
		const opener = all.find((t) => t.id === tab.openerTabId);
		if (opener) add("opener", "opened from " + (opener.title || opener.url || "another tab"), "opener");
	}

	const key = dupKey(tab);
	if (key) {
		const copies = all.filter((t) => t.id !== tab.id && dupKey(t) === key);
		if (copies.length) {
			const names : string[] = [];
			for (const c of copies) {
				const name = ctx.windowName && c.windowId !== undefined ? ctx.windowName(c.windowId) : "";
				if (name && !names.includes(name)) names.push(name);
			}
			const count = copies.length + " more " + (copies.length === 1 ? "copy" : "copies");
			add("copies", count + (names.length ? " (" + names.join(", ") + ")" : ""), "copies");
		}
	}

	if (ctx.savedIn && ctx.savedIn.length) add("savedIn", "also saved in " + ctx.savedIn.join(", "), "saved");

	if (typeof ctx.zoom === "number" && Math.round(ctx.zoom * 100) !== 100) {
		add("zoom", "zoom " + Math.round(ctx.zoom * 100) + " %", "zoom");
	}

	return { title: tab.title || tab.url || "Untitled tab", lines };
}

// The names of the saved windows that hold a tab with this url, each once, in
// the order given (a saved window with no name is left out). Compared as
// open tabs are (dupKey); no url: none.
export function savedWindowsWith(url : string | undefined, sessions : Iterable<SavedWindowNames>) : string[] {
	const key = dupKey({ url });
	const names : string[] = [];
	if (!key) return names;
	for (const s of sessions) {
		if (s.name && !names.includes(s.name) && s.tabs.some((t) => dupKey(t) === key)) names.push(s.name);
	}
	return names;
}

// How many open tabs have this url, and the names of their windows, each once
// (a window with no name is left out).
export function openTabsWith(url : string | undefined, tabs : Iterable<StatsTab>, windowName? : (windowId : number) => string | undefined) : { count : number; names : string[] } {
	const key = dupKey({ url });
	const names : string[] = [];
	let count = 0;
	if (!key) return { count, names };
	for (const t of tabs) {
		if (dupKey(t) !== key) continue;
		count++;
		const name = windowName && t.windowId !== undefined ? windowName(t.windowId) : "";
		if (name && !names.includes(name)) names.push(name);
	}
	return { count, names };
}

// The card for a tab of a saved window: when it was saved, whether it is
// pinned, where it sits in its saved window, and where it is open now.
export function savedTabStats(tab : StatsTab, ctx : SavedTabStatsContext) : StatsCard {
	const lines : StatsLine[] = [];
	const add = (key : string, text : string, icon : StatsIcon) => lines.push({ key, text, icon });

	add("saved", "saved " + timeAgo(ctx.savedAt, ctx.now), "saved");
	if (tab.pinned) lines.push(itemsLine("state", [{ icon: "pinned", text: "pinned" }]));

	if (typeof tab.index === "number" && ctx.windowTabCount > 0) {
		add("position", "tab " + (tab.index + 1) + " of " + ctx.windowTabCount + (ctx.windowName ? " in " + ctx.windowName : ""), "position");
	}

	const open = openTabsWith(tab.url, ctx.allTabs, ctx.openWindowName);
	if (open.count) add("open", "open now" + (open.names.length ? " in " + open.names.join(", ") : ""), "window");

	return { title: tab.title || tab.url || "Untitled tab", lines };
}

function hostOf(url : string | undefined) : string {
	if (!url || !/^https?:/i.test(url)) return "";
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return "";
	}
}

export function windowStats(win : StatsWindow, tabs : StatsTab[], ctx : WindowStatsContext) : StatsCard {
	const lines : StatsLine[] = [];
	const add = (key : string, text : string, icon : StatsIcon) => lines.push({ key, text, icon });

	const counts : StatsItem[] = [{ icon: "tabs", text: maybePluralize(tabs.length, "tab") }];
	const pinned = tabs.filter((t) => t.pinned).length;
	const asleep = tabs.filter((t) => t.discarded).length;
	const playing = tabs.filter((t) => t.audible && !isMuted(t)).length;
	if (pinned) counts.push({ icon: "pinned", text: pinned + " pinned" });
	if (asleep) counts.push({ icon: "asleep", text: asleep + " asleep" });
	if (playing) counts.push({ icon: "playing", text: playing + " playing" });
	lines.push(itemsLine("counts", counts));

	const hosts = new Set(tabs.map((t) => hostOf(t.url)).filter(Boolean));
	if (hosts.size) add("sites", maybePluralize(hosts.size, "site"), "sites");

	if (typeof ctx.lastActive === "number") add("lastActive", "last active " + timeAgo(ctx.lastActive, ctx.now), "active");

	const used = tabs.map((t) => t.lastAccessed).filter((a) : a is number => typeof a === "number");
	if (used.length === 1) {
		add("used", "tab used " + timeAgo(used[0], ctx.now), "used");
	} else if (used.length > 1) {
		add("used", "oldest tab used " + timeAgo(Math.min(...used), ctx.now) + SEP + "newest " + timeAgo(Math.max(...used), ctx.now), "used");
	}

	const state : string[] = [];
	if (ctx.focused) state.push("focused");
	if (win.state === "minimized" || win.state === "maximized" || win.state === "fullscreen") state.push(win.state);
	if (win.incognito) state.push("incognito");
	if (state.length) add("state", state.join(SEP), "window");

	const size = typeof win.width === "number" && typeof win.height === "number" ? win.width + "×" + win.height : "";
	const monitor = ctx.monitor && ctx.monitor.count > 1 ? "monitor " + ctx.monitor.index + " of " + ctx.monitor.count : "";
	if (size || monitor) add("size", [size, monitor].filter(Boolean).join(SEP), "monitor");
	if (ctx.offscreen) add("monitor", "on another monitor", "monitor");
	if (ctx.monitorHint) add("monitorHint", "one monitor known · allow monitor access in options", "hint");

	return { title: ctx.name || "Window", lines };
}

// A url in three parts for the card's url line: the host is drawn strong,
// the rest muted. Only "scheme://authority" urls have a host; "about:blank"
// and the like are all rest. A leading "www." is not what names the site: it
// goes with the scheme, muted.
export function splitUrl(url : string | undefined) : { before : string; host : string; after : string } {
	const m = /^([a-z][a-z0-9+.-]*:\/\/)([^/?#]*)(.*)$/i.exec(url || "");
	if (!m) return { before: "", host: "", after: url || "" };
	const www = /^www\./i.exec(m[2]);
	if (www && m[2].length > 4) return { before: m[1] + www[0], host: m[2].slice(4), after: m[3] };
	return { before: m[1], host: m[2], after: m[3] };
}

// The window card's favicons: one tab for each of the `n` sites with the most
// tabs (the first tab seen of that site; ties: the site seen first).
export function topSites<T extends StatsTab>(tabs : T[], n : number) : T[] {
	const bySite = new Map<string, { tab : T; count : number }>();
	for (const tab of tabs) {
		const host = hostOf(tab.url);
		if (!host) continue;
		const entry = bySite.get(host);
		if (entry) entry.count++; else bySite.set(host, { tab, count: 1 });
	}
	// Map keeps insertion order and sort is stable: ties stay first-seen
	return [...bySite.values()].sort((a, b) => b.count - a.count).slice(0, n).map((e) => e.tab);
}

// Where the card goes: under the anchor with its left edge on the anchor's,
// or above it when there is no room below; always inside the viewport with a
// small margin. Viewport coordinates (position: fixed).
export interface Rect { left : number; top : number; right : number; bottom : number }
export interface Size { width : number; height : number }

const GAP = 6;
const MARGIN = 8;

export function placeCard(anchor : Rect, card : Size, view : Size) : { left : number; top : number } {
	let top : number;
	const below = anchor.bottom + GAP;
	const above = anchor.top - GAP - card.height;
	if (below + card.height <= view.height - MARGIN) top = below;
	else if (above >= MARGIN) top = above;
	else top = Math.max(MARGIN, view.height - MARGIN - card.height);
	const left = Math.max(MARGIN, Math.min(anchor.left, view.width - MARGIN - card.width));
	return { left, top };
}

// Where a card that follows the pointer goes: OFFSET right of and below the
// pointer; left of it / above it when there is no room; clamped inside the
// viewport margins when there is room on neither side.
const OFFSET = 12;

function along(p : number, size : number, room : number) : number {
	if (p + OFFSET + size <= room - MARGIN) return p + OFFSET;
	if (p - OFFSET - size >= MARGIN) return p - OFFSET - size;
	return Math.max(MARGIN, Math.min(p + OFFSET, room - MARGIN - size));
}

export function placeAtPointer(x : number, y : number, card : Size, view : Size) : { left : number; top : number } {
	return { left: along(x, card.width, view.width), top: along(y, card.height, view.height) };
}

// ---- the window card's monitor map ----
// The monitors in their real arrangement, scaled into maxWidth x maxHeight
// (aspect and relative positions kept), the window as a rect on the monitor
// it is (mostly) on, clipped to it, and the other windows the same way.
// Minimized windows are drawn at the bounds the browser reports, flagged
// `minimized` (Chrome reports the restore bounds: checked on a real Windows
// window); bounds on no monitor (Windows' -32000 parking spot) are skipped.
// A (not minimized) target on no known monitor gets no rect and `offscreen`:
// the map would have to invent where it is.
export interface Bounds { left : number; top : number; width : number; height : number }
export interface MapWindow { id? : number; left? : number; top? : number; width? : number; height? : number; state? : string }
export interface MapRect { x : number; y : number; w : number; h : number; minimized? : boolean }
export interface MonitorMap {
	width : number;
	height : number;
	monitors : MapRect[];
	others : MapRect[];
	target : MapRect | null;
	offscreen : boolean;
	// the monitor the target is on, 1-based in the order given; null: none
	monitor : { index : number; count : number } | null;
}

function hasBounds(w : MapWindow) : w is MapWindow & Bounds {
	return typeof w.left === "number" && typeof w.top === "number" && w.width > 0 && w.height > 0;
}

function overlap(a : Bounds, b : Bounds) : Bounds | null {
	const left = Math.max(a.left, b.left), top = Math.max(a.top, b.top);
	const right = Math.min(a.left + a.width, b.left + b.width), bottom = Math.min(a.top + a.height, b.top + b.height);
	return right > left && bottom > top ? { left, top, width: right - left, height: bottom - top } : null;
}

// the monitor the window overlaps most and the part of it on there, or null
function onMonitor(w : Bounds, displays : Bounds[]) : { display : Bounds; part : Bounds } | null {
	let best : { display : Bounds; part : Bounds } | null = null;
	for (const d of displays) {
		const o = overlap(w, d);
		if (o && (!best || o.width * o.height > best.part.width * best.part.height)) best = { display: d, part: o };
	}
	return best;
}

export function monitorMap(displays : Bounds[], windows : MapWindow[], targetId : number, maxWidth : number, maxHeight : number) : MonitorMap | null {
	const ds = displays.filter((d) => d && d.width > 0 && d.height > 0);
	if (!ds.length) return null;
	const minL = Math.min(...ds.map((d) => d.left)), minT = Math.min(...ds.map((d) => d.top));
	const maxR = Math.max(...ds.map((d) => d.left + d.width)), maxB = Math.max(...ds.map((d) => d.top + d.height));
	const scale = Math.min(maxWidth / (maxR - minL), maxHeight / (maxB - minT));
	const rect = (b : Bounds) : MapRect => ({
		x: Math.round((b.left - minL) * scale), y: Math.round((b.top - minT) * scale),
		w: Math.round(b.width * scale), h: Math.round(b.height * scale),
	});

	let target : MapRect | null = null;
	let offscreen = false;
	let monitor : { index : number; count : number } | null = null;
	const others : MapRect[] = [];
	for (const w of windows) {
		if (!hasBounds(w)) continue;
		const minimized = w.state === "minimized";
		const on = onMonitor(w, ds);
		const r = on ? (minimized ? { ...rect(on.part), minimized: true } : rect(on.part)) : null;
		if (w.id === targetId) {
			target = r;
			if (on) monitor = { index: ds.indexOf(on.display) + 1, count: ds.length };
			else if (!minimized) offscreen = true;
		} else if (r) {
			others.push(r);
		}
	}
	return {
		width: Math.round((maxR - minL) * scale), height: Math.round((maxB - minT) * scale),
		monitors: ds.map(rect), others, target, offscreen, monitor,
	};
}
