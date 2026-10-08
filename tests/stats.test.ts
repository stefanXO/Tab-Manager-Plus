"use strict";

// Unit tests for the stats card text in src/popup/stats.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { tabStats, windowStats, placeCard, placeAtPointer, splitUrl, topSites, monitorMap } from "../src/popup/stats.ts";
import type { StatsTab, StatsLine } from "../src/popup/stats.ts";

const NOW = Date.parse("2030-06-01T12:00:00.000Z");
const MIN = 60e3, HOUR = 60 * MIN, DAY = 24 * HOUR;

let nextId = 1;
function t(windowId : number, url : string, extra : Partial<StatsTab> = {}) : StatsTab {
	return { id: nextId++, windowId, url, title: "Title of " + url, ...extra };
}
function withIndex(tabs : StatsTab[]) : StatsTab[] {
	tabs.forEach((tab, i) => (tab.index = i));
	return tabs;
}
const text = (lines : StatsLine[]) => lines.map((l) => l.text);
const keyed = (lines : StatsLine[], key : string) => lines.find((l) => l.key === key)?.text;

const WORK = 1, LIFE = 2;
const NAMES = new Map([[WORK, "Work"], [LIFE, "Life"]]);

// ---------------------------------------------------------------------------
// tabStats
// ---------------------------------------------------------------------------
describe("tabStats", () => {
	test("a plain tab: title, position, nothing else", () => {
		const tabs = withIndex([t(WORK, "https://a.test/"), t(WORK, "https://b.test/")]);
		const s = tabStats(tabs[1], { now: NOW, windowTabs: tabs, allTabs: tabs, windowName: (id) => NAMES.get(id) });
		assert.equal(s.title, "Title of https://b.test/");
		assert.deepEqual(text(s.lines), ["tab 2 of 2"]);
	});

	test("title falls back to the url, then to a placeholder", () => {
		const a = t(WORK, "https://a.test/", { title: "" });
		const b = t(WORK, "", { title: undefined });
		assert.equal(tabStats(a, { now: NOW, windowTabs: [a], allTabs: [a] }).title, "https://a.test/");
		assert.equal(tabStats(b, { now: NOW, windowTabs: [b], allTabs: [b] }).title, "Untitled tab");
	});

	test("lastAccessed -> 'active <timeAgo>'; hidden when undefined", () => {
		const a = t(WORK, "https://a.test/", { lastAccessed: NOW - 3 * HOUR });
		const b = t(WORK, "https://b.test/", { lastAccessed: NOW - 10e3 });
		const c = t(WORK, "https://c.test/");
		const ctx = { now: NOW, windowTabs: [a, b, c], allTabs: [a, b, c] };
		assert.equal(keyed(tabStats(a, ctx).lines, "active"), "active 3 hours ago");
		assert.equal(keyed(tabStats(b, ctx).lines, "active"), "active just now");
		assert.equal(keyed(tabStats(c, ctx).lines, "active"), undefined);
	});

	test("state words, in a fixed order", () => {
		const a = t(WORK, "https://a.test/", { discarded: true, pinned: true, incognito: true });
		assert.equal(keyed(tabStats(a, { now: NOW, windowTabs: [a], allTabs: [a] }).lines, "state"), "asleep · pinned · incognito");
		const b = t(WORK, "https://b.test/", { frozen: true, status: "loading" });
		assert.equal(keyed(tabStats(b, { now: NOW, windowTabs: [b], allTabs: [b] }).lines, "state"), "frozen · loading");
	});

	test("audible and not muted -> playing sound", () => {
		const a = t(WORK, "https://a.test/", { audible: true, mutedInfo: { muted: false } });
		assert.equal(keyed(tabStats(a, { now: NOW, windowTabs: [a], allTabs: [a] }).lines, "state"), "playing sound");
	});

	test("muted, with the reason when the browser gives one", () => {
		const ctx = (tab : StatsTab) => ({ now: NOW, windowTabs: [tab], allTabs: [tab] });
		const plain = t(WORK, "https://a.test/", { audible: true, mutedInfo: { muted: true } });
		const user = t(WORK, "https://a.test/", { mutedInfo: { muted: true, reason: "user" } });
		const capture = t(WORK, "https://a.test/", { mutedInfo: { muted: true, reason: "capture" } });
		const ext = t(WORK, "https://a.test/", { mutedInfo: { muted: true, reason: "extension" } });
		assert.equal(keyed(tabStats(plain, ctx(plain)).lines, "state"), "muted");
		assert.equal(keyed(tabStats(user, ctx(user)).lines, "state"), "muted by you");
		assert.equal(keyed(tabStats(capture, ctx(capture)).lines, "state"), "muted by tab capture");
		assert.equal(keyed(tabStats(ext, ctx(ext)).lines, "state"), "muted by an extension");
	});

	test("a complete, unmuted, unpinned tab has no state line", () => {
		const a = t(WORK, "https://a.test/", { status: "complete", mutedInfo: { muted: false }, audible: false });
		assert.equal(keyed(tabStats(a, { now: NOW, windowTabs: [a], allTabs: [a] }).lines, "state"), undefined);
	});

	test("position uses index within the window", () => {
		const tabs = withIndex([t(WORK, "https://a.test/"), t(WORK, "https://b.test/"), t(WORK, "https://c.test/")]);
		assert.equal(keyed(tabStats(tabs[0], { now: NOW, windowTabs: tabs, allTabs: tabs }).lines, "position"), "tab 1 of 3");
	});

	test("position is skipped when the index is unknown", () => {
		const a = t(WORK, "https://a.test/");
		assert.equal(keyed(tabStats(a, { now: NOW, windowTabs: [a], allTabs: [a] }).lines, "position"), undefined);
	});

	test("opener: only when openerTabId resolves to an open tab", () => {
		const opener = t(WORK, "https://gh.test/pr/418", { title: "GitHub · PR #418" });
		const child = t(WORK, "https://b.test/", { openerTabId: opener.id });
		const orphan = t(WORK, "https://c.test/", { openerTabId: 99999 });
		const all = [opener, child, orphan];
		assert.equal(keyed(tabStats(child, { now: NOW, windowTabs: all, allTabs: all }).lines, "opener"), "opened from GitHub · PR #418");
		assert.equal(keyed(tabStats(orphan, { now: NOW, windowTabs: all, allTabs: all }).lines, "opener"), undefined);
	});

	test("a tab that names itself as opener is ignored", () => {
		const a = t(WORK, "https://a.test/");
		a.openerTabId = a.id;
		assert.equal(keyed(tabStats(a, { now: NOW, windowTabs: [a], allTabs: [a] }).lines, "opener"), undefined);
	});

	test("copies: other tabs with the same url, their window names once each", () => {
		const a = t(WORK, "https://dup.test/");
		const b = t(LIFE, "https://dup.test/");
		const c = t(LIFE, "https://dup.test/");
		const d = t(WORK, "https://dup.test/");
		const other = t(WORK, "https://other.test/");
		const all = [a, b, c, d, other];
		const ctx = { now: NOW, windowTabs: [a, d, other], allTabs: all, windowName: (id : number) => NAMES.get(id) };
		assert.equal(keyed(tabStats(a, ctx).lines, "copies"), "3 more copies (Life, Work)");
		assert.equal(keyed(tabStats(other, ctx).lines, "copies"), undefined);
	});

	test("one copy is singular; unnamed windows are left out of the list", () => {
		const a = t(WORK, "https://dup.test/");
		const b = t(7, "https://dup.test/");
		const all = [a, b];
		assert.equal(keyed(tabStats(a, { now: NOW, windowTabs: [a], allTabs: all, windowName: () => "" }).lines, "copies"), "1 more copy");
	});

	test("tabs without a url are never copies of each other", () => {
		const a = t(WORK, "");
		const b = t(WORK, "");
		assert.equal(keyed(tabStats(a, { now: NOW, windowTabs: [a, b], allTabs: [a, b] }).lines, "copies"), undefined);
	});

	test("zoom: shown only when it is not 100 %", () => {
		const a = t(WORK, "https://a.test/");
		const ctx = { now: NOW, windowTabs: [a], allTabs: [a] };
		assert.equal(keyed(tabStats(a, { ...ctx, zoom: 1.25 }).lines, "zoom"), "zoom 125 %");
		assert.equal(keyed(tabStats(a, { ...ctx, zoom: 0.9 }).lines, "zoom"), "zoom 90 %");
		assert.equal(keyed(tabStats(a, { ...ctx, zoom: 1 }).lines, "zoom"), undefined);
		assert.equal(keyed(tabStats(a, { ...ctx, zoom: 1.0000001 }).lines, "zoom"), undefined);
		assert.equal(keyed(tabStats(a, ctx).lines, "zoom"), undefined);
	});

	test("line order: active, state, position, opener, copies, zoom", () => {
		const opener = t(WORK, "https://o.test/", { title: "Opener" });
		const a = t(WORK, "https://dup.test/", { lastAccessed: NOW - 5 * MIN, pinned: true, openerTabId: opener.id });
		const b = t(LIFE, "https://dup.test/");
		const tabs = withIndex([opener, a]);
		const s = tabStats(a, { now: NOW, windowTabs: tabs, allTabs: [...tabs, b], windowName: (id) => NAMES.get(id), zoom: 1.5 });
		assert.deepEqual(s.lines.map((l) => l.key), ["active", "state", "position", "opener", "copies", "zoom"]);
		assert.deepEqual(text(s.lines), ["active 5 minutes ago", "pinned", "tab 2 of 2", "opened from Opener", "1 more copy (Life)", "zoom 150 %"]);
	});
});

// ---------------------------------------------------------------------------
// windowStats
// ---------------------------------------------------------------------------
describe("windowStats", () => {
	test("counts row: tabs always, the others only when non-zero", () => {
		const tabs = [
			t(WORK, "https://a.test/", { pinned: true }),
			t(WORK, "https://b.test/", { discarded: true }),
			t(WORK, "https://c.test/", { audible: true }),
			t(WORK, "https://d.test/", { audible: true, mutedInfo: { muted: true } }),
		];
		const s = windowStats({ id: WORK }, tabs, { now: NOW });
		assert.equal(keyed(s.lines, "counts"), "4 tabs · 1 pinned · 1 asleep · 1 playing");
		const plain = windowStats({ id: WORK }, [t(WORK, "https://a.test/")], { now: NOW });
		assert.equal(keyed(plain.lines, "counts"), "1 tab");
	});

	test("sites: distinct hostnames, www. folded, non-web urls ignored", () => {
		const tabs = [
			t(WORK, "https://www.a.test/x"),
			t(WORK, "https://a.test/y"),
			t(WORK, "https://b.test/"),
			t(WORK, "about:blank"),
			t(WORK, ""),
		];
		assert.equal(keyed(windowStats({ id: WORK }, tabs, { now: NOW }).lines, "sites"), "2 sites");
		assert.equal(keyed(windowStats({ id: WORK }, [tabs[0]], { now: NOW }).lines, "sites"), "1 site");
		assert.equal(keyed(windowStats({ id: WORK }, [tabs[3]], { now: NOW }).lines, "sites"), undefined);
	});

	test("last active from the window age, when known", () => {
		const tabs = [t(WORK, "https://a.test/")];
		assert.equal(keyed(windowStats({ id: WORK }, tabs, { now: NOW, lastActive: NOW - 2 * HOUR }).lines, "lastActive"), "last active 2 hours ago");
		assert.equal(keyed(windowStats({ id: WORK }, tabs, { now: NOW }).lines, "lastActive"), undefined);
	});

	test("oldest / newest tab use from lastAccessed", () => {
		const tabs = [
			t(WORK, "https://a.test/", { lastAccessed: NOW - 3 * DAY }),
			t(WORK, "https://b.test/", { lastAccessed: NOW - 5 * MIN }),
			t(WORK, "https://c.test/"),
		];
		assert.equal(keyed(windowStats({ id: WORK }, tabs, { now: NOW }).lines, "used"), "oldest tab used 3 days ago · newest 5 minutes ago");
	});

	test("one timestamp only: a single 'tab used' phrase; none: no line", () => {
		const one = [t(WORK, "https://a.test/", { lastAccessed: NOW - HOUR }), t(WORK, "https://b.test/")];
		assert.equal(keyed(windowStats({ id: WORK }, one, { now: NOW }).lines, "used"), "tab used 1 hour ago");
		const none = [t(WORK, "https://a.test/")];
		assert.equal(keyed(windowStats({ id: WORK }, none, { now: NOW }).lines, "used"), undefined);
	});

	test("state words: focused, minimized / maximized / fullscreen, incognito", () => {
		const tabs = [t(WORK, "https://a.test/")];
		assert.equal(keyed(windowStats({ id: WORK, state: "minimized" }, tabs, { now: NOW }).lines, "state"), "minimized");
		assert.equal(keyed(windowStats({ id: WORK, state: "normal" }, tabs, { now: NOW, focused: true }).lines, "state"), "focused");
		assert.equal(keyed(windowStats({ id: WORK, state: "maximized", incognito: true }, tabs, { now: NOW, focused: true }).lines, "state"), "focused · maximized · incognito");
		assert.equal(keyed(windowStats({ id: WORK, state: "normal" }, tabs, { now: NOW }).lines, "state"), undefined);
	});

	test("size when both width and height are known", () => {
		const tabs = [t(WORK, "https://a.test/")];
		assert.equal(keyed(windowStats({ id: WORK, width: 1280, height: 720 }, tabs, { now: NOW }).lines, "size"), "1280×720");
		assert.equal(keyed(windowStats({ id: WORK, width: 1280 }, tabs, { now: NOW }).lines, "size"), undefined);
	});

	test("a window on no monitor the popup knows: says so after the size", () => {
		const tabs = [t(WORK, "https://a.test/")];
		const s = windowStats({ id: WORK, width: 800, height: 600 }, tabs, { now: NOW, offscreen: true });
		assert.deepEqual(s.lines.slice(-2).map((l) => l.text), ["800×600", "on another monitor"]);
		assert.equal(keyed(windowStats({ id: WORK }, tabs, { now: NOW }).lines, "monitor"), undefined);
	});

	test("size line names the monitor when there are several", () => {
		const tabs = [t(WORK, "https://a.test/")];
		assert.equal(keyed(windowStats({ id: WORK, width: 1600, height: 900 }, tabs, { now: NOW, monitor: { index: 2, count: 3 } }).lines, "size"), "1600×900 · monitor 2 of 3");
		assert.equal(keyed(windowStats({ id: WORK, width: 1600, height: 900 }, tabs, { now: NOW, monitor: { index: 1, count: 1 } }).lines, "size"), "1600×900");
		assert.equal(keyed(windowStats({ id: WORK }, tabs, { now: NOW, monitor: { index: 1, count: 2 } }).lines, "size"), "monitor 1 of 2");
	});

	test("only the popup's monitor known: a hint line, last", () => {
		const tabs = [t(WORK, "https://a.test/")];
		const s = windowStats({ id: WORK, width: 800, height: 600 }, tabs, { now: NOW, monitorHint: true });
		assert.deepEqual(s.lines[s.lines.length - 1], { key: "monitorHint", text: "one monitor known · allow monitor access in options", icon: "hint" });
		assert.equal(keyed(windowStats({ id: WORK }, tabs, { now: NOW }).lines, "monitorHint"), undefined);
	});

	test("title is the window name, else a generic one", () => {
		const tabs = [t(WORK, "https://a.test/")];
		assert.equal(windowStats({ id: WORK }, tabs, { now: NOW, name: "Work" }).title, "Work");
		assert.equal(windowStats({ id: WORK }, tabs, { now: NOW }).title, "Window");
	});

	test("line order: counts, sites, lastActive, used, state, size", () => {
		const tabs = [t(WORK, "https://a.test/", { lastAccessed: NOW - HOUR })];
		const s = windowStats({ id: WORK, state: "minimized", width: 800, height: 600 }, tabs, { now: NOW, lastActive: NOW - HOUR });
		assert.deepEqual(s.lines.map((l) => l.key), ["counts", "sites", "lastActive", "used", "state", "size"]);
	});
});

// ---------------------------------------------------------------------------
// placeCard
// ---------------------------------------------------------------------------
describe("placeCard", () => {
	const VIEW = { width: 800, height: 600 };
	const CARD = { width: 200, height: 100 };

	test("below the anchor, left edges aligned, with a gap", () => {
		const p = placeCard({ left: 100, top: 50, right: 180, bottom: 90 }, CARD, VIEW);
		assert.deepEqual(p, { left: 100, top: 96 });
	});

	test("above the anchor when it does not fit below", () => {
		const p = placeCard({ left: 100, top: 520, right: 180, bottom: 560 }, CARD, VIEW);
		assert.deepEqual(p, { left: 100, top: 414 });
	});

	test("clamped to the right edge", () => {
		const p = placeCard({ left: 700, top: 50, right: 780, bottom: 90 }, CARD, VIEW);
		assert.deepEqual(p, { left: 592, top: 96 });
	});

	test("clamped to the left edge", () => {
		const p = placeCard({ left: -20, top: 50, right: 30, bottom: 90 }, CARD, VIEW);
		assert.equal(p.left, 8);
	});

	test("fits neither below nor above: as low as fits, never above the top margin", () => {
		assert.equal(placeCard({ left: 10, top: 40, right: 50, bottom: 80 }, { width: 200, height: 560 }, VIEW).top, 32);
		assert.equal(placeCard({ left: 10, top: 40, right: 50, bottom: 80 }, { width: 200, height: 700 }, VIEW).top, 8);
	});

	test("a card wider than the viewport starts at the left margin", () => {
		const p = placeCard({ left: 100, top: 50, right: 180, bottom: 90 }, { width: 900, height: 100 }, VIEW);
		assert.equal(p.left, 8);
	});
});

// ---------------------------------------------------------------------------
// icons
// ---------------------------------------------------------------------------
describe("icons on the lines", () => {
	test("the state line carries one item per word, with the chip icon where one exists", () => {
		const a = t(WORK, "https://a.test/", { discarded: true, frozen: true, pinned: true, incognito: true, mutedInfo: { muted: true, reason: "user" } });
		const state = tabStats(a, { now: NOW, windowTabs: [a], allTabs: [a] }).lines.find((l) => l.key === "state");
		assert.deepEqual(state.items, [
			{ icon: "asleep", text: "asleep" },
			{ text: "frozen" },
			{ icon: "muted", text: "muted by you" },
			{ icon: "pinned", text: "pinned" },
			{ text: "incognito" },
		]);
		assert.equal(state.text, "asleep · frozen · muted by you · pinned · incognito");
	});

	test("playing sound uses the playing icon", () => {
		const a = t(WORK, "https://a.test/", { audible: true });
		const state = tabStats(a, { now: NOW, windowTabs: [a], allTabs: [a] }).lines.find((l) => l.key === "state");
		assert.deepEqual(state.items, [{ icon: "playing", text: "playing sound" }]);
	});

	test("active, position, opener, copies and zoom lines have a line icon", () => {
		const opener = t(WORK, "https://o.test/", { title: "Opener" });
		const a = t(WORK, "https://dup.test/", { lastAccessed: NOW - MIN, openerTabId: opener.id });
		const b = t(LIFE, "https://dup.test/");
		const tabs = withIndex([opener, a]);
		const s = tabStats(a, { now: NOW, windowTabs: tabs, allTabs: [...tabs, b], zoom: 2 });
		const icons = Object.fromEntries(s.lines.map((l) => [l.key, l.icon]));
		assert.deepEqual(icons, { active: "active", position: "position", opener: "opener", copies: "copies", zoom: "zoom" });
	});

	test("window counts row: an item per count, icons for pinned / asleep / playing", () => {
		const tabs = [t(WORK, "https://a.test/", { pinned: true }), t(WORK, "https://b.test/", { discarded: true }), t(WORK, "https://c.test/", { audible: true })];
		const counts = windowStats({ id: WORK }, tabs, { now: NOW }).lines.find((l) => l.key === "counts");
		assert.deepEqual(counts.items, [
			{ icon: "tabs", text: "3 tabs" },
			{ icon: "pinned", text: "1 pinned" },
			{ icon: "asleep", text: "1 asleep" },
			{ icon: "playing", text: "1 playing" },
		]);
	});
});

// ---------------------------------------------------------------------------
// splitUrl
// ---------------------------------------------------------------------------
describe("window line icons", () => {
	test("every window line has a line icon", () => {
		const tabs = [t(WORK, "https://a.test/", { lastAccessed: NOW - HOUR })];
		const s = windowStats({ id: WORK, state: "minimized", width: 800, height: 600 }, tabs, { now: NOW, lastActive: NOW - HOUR, offscreen: true, monitorHint: true });
		const icons = Object.fromEntries(s.lines.map((l) => [l.key, l.icon ?? l.items?.[0].icon]));
		assert.deepEqual(icons, { counts: "tabs", sites: "sites", lastActive: "active", used: "used", state: "window", size: "monitor", monitor: "monitor", monitorHint: "hint" });
	});
});

describe("splitUrl", () => {
	test("web url: scheme, host, rest", () => {
		assert.deepEqual(splitUrl("https://news.ycombinator.com/item?id=1"), { before: "https://", host: "news.ycombinator.com", after: "/item?id=1" });
	});
	test("a leading www. goes with the scheme; other subdomains stay in the host", () => {
		assert.deepEqual(splitUrl("https://www.youtube.com/watch?v=1"), { before: "https://www.", host: "youtube.com", after: "/watch?v=1" });
		assert.deepEqual(splitUrl("https://WWW.a.test/"), { before: "https://WWW.", host: "a.test", after: "/" });
		assert.deepEqual(splitUrl("https://www2.a.test/"), { before: "https://", host: "www2.a.test", after: "/" });
		assert.deepEqual(splitUrl("https://mail.www.a.test/"), { before: "https://", host: "mail.www.a.test", after: "/" });
	});
	test("a bare www. host stays a host", () => {
		assert.deepEqual(splitUrl("https://www./"), { before: "https://", host: "www.", after: "/" });
	});
	test("keeps a port and user-less authority in the host", () => {
		assert.deepEqual(splitUrl("http://localhost:8080/"), { before: "http://", host: "localhost:8080", after: "/" });
	});
	test("no path", () => {
		assert.deepEqual(splitUrl("https://a.test"), { before: "https://", host: "a.test", after: "" });
	});
	test("browser pages: the page name is the host", () => {
		assert.deepEqual(splitUrl("chrome://settings/privacy"), { before: "chrome://", host: "settings", after: "/privacy" });
	});
	test("no authority: all of it is the rest", () => {
		assert.deepEqual(splitUrl("about:blank"), { before: "", host: "", after: "about:blank" });
		assert.deepEqual(splitUrl(""), { before: "", host: "", after: "" });
		assert.deepEqual(splitUrl(undefined), { before: "", host: "", after: "" });
	});
});

// ---------------------------------------------------------------------------
// topSites
// ---------------------------------------------------------------------------
describe("topSites", () => {
	test("one tab per site, most tabs first, first seen breaks ties", () => {
		const tabs = [
			t(WORK, "https://a.test/1"), t(WORK, "https://b.test/1"), t(WORK, "https://www.b.test/2"),
			t(WORK, "https://c.test/"), t(WORK, "about:blank"), t(WORK, "https://a.test/2"), t(WORK, "https://d.test/"),
		];
		assert.deepEqual(topSites(tabs, 3).map((x) => x.url), ["https://a.test/1", "https://b.test/1", "https://c.test/"]);
	});
	test("fewer sites than asked", () => {
		assert.deepEqual(topSites([t(WORK, "about:blank")], 4), []);
	});
});

// ---------------------------------------------------------------------------
// placeAtPointer
// ---------------------------------------------------------------------------
describe("placeAtPointer", () => {
	const VIEW = { width: 800, height: 600 };
	const CARD = { width: 200, height: 100 };

	test("12px right of and below the pointer", () => {
		assert.deepEqual(placeAtPointer(100, 100, CARD, VIEW), { left: 112, top: 112 });
	});
	test("no room on the right: left of the pointer", () => {
		assert.deepEqual(placeAtPointer(700, 100, CARD, VIEW), { left: 488, top: 112 });
	});
	test("no room below: above the pointer", () => {
		assert.deepEqual(placeAtPointer(100, 550, CARD, VIEW), { left: 112, top: 438 });
	});
	test("bottom right corner: both flip", () => {
		assert.deepEqual(placeAtPointer(790, 590, CARD, VIEW), { left: 578, top: 478 });
	});
	test("room on neither side: clamped inside the margins", () => {
		const p = placeAtPointer(150, 100, { width: 700, height: 100 }, { width: 760, height: 600 });
		assert.equal(p.left, 52);
		const q = placeAtPointer(100, 300, { width: 200, height: 590 }, VIEW);
		assert.equal(q.top, 8);
	});
});

// an action button's card stays clear of the button it describes
describe("placeAtPointer, clear of a button", () => {
	const VIEW = { width: 800, height: 600 };
	const CARD = { width: 200, height: 60 };

	test("the header's buttons (top right): below the button, left of the pointer", () => {
		const button = { left: 760, top: 6, right: 792, bottom: 38 };
		const p = placeAtPointer(776, 22, CARD, VIEW, button);
		assert.deepEqual(p, { left: 564, top: 44 });
		assert.ok(p.top >= button.bottom);
	});
	test("the bottom bar's buttons: above the button", () => {
		const button = { left: 500, top: 560, right: 532, bottom: 592 };
		const p = placeAtPointer(516, 590, CARD, VIEW, button);
		assert.deepEqual(p, { left: 528, top: 494 });
		assert.ok(p.top + CARD.height <= button.top);
	});
	test("pointer near the button's top edge: still the pointer's offset when that is further", () => {
		const button = { left: 100, top: 200, right: 132, bottom: 232 };
		assert.deepEqual(placeAtPointer(110, 230, CARD, VIEW, button), { left: 122, top: 242 });
		assert.deepEqual(placeAtPointer(110, 201, CARD, VIEW, button), { left: 122, top: 238 });
	});
	test("no room on either side of the button: as without one", () => {
		const tall = { width: 200, height: 560 };
		const button = { left: 100, top: 280, right: 132, bottom: 312 };
		assert.deepEqual(placeAtPointer(110, 300, tall, VIEW, button), placeAtPointer(110, 300, tall, VIEW));
	});
	test("no button: unchanged", () => {
		assert.deepEqual(placeAtPointer(100, 100, CARD, VIEW, null), placeAtPointer(100, 100, CARD, VIEW));
	});
});

// ---------------------------------------------------------------------------
// monitorMap
// ---------------------------------------------------------------------------
describe("monitorMap", () => {
	const FHD = { left: 0, top: 0, width: 1920, height: 1080 };
	const win = (id : number, left : number, top : number, width : number, height : number, state = "normal") => ({ id, left, top, width, height, state });

	test("single monitor: scaled to the width, aspect kept, window on it", () => {
		const m = monitorMap([FHD], [win(1, 0, 0, 960, 540)], 1, 120, 80);
		assert.equal(m.width, 120);
		assert.equal(m.height, 68);
		assert.deepEqual(m.monitors, [{ x: 0, y: 0, w: 120, h: 68 }]);
		assert.deepEqual(m.target, { x: 0, y: 0, w: 60, h: 34 });
		assert.equal(m.offscreen, false);
	});

	test("two monitors side by side keep their relative positions", () => {
		const m = monitorMap([FHD, { left: 1920, top: 0, width: 1920, height: 1080 }], [win(1, 2400, 270, 960, 540)], 1, 120, 80);
		assert.equal(m.width, 120);
		assert.deepEqual(m.monitors, [{ x: 0, y: 0, w: 60, h: 34 }, { x: 60, y: 0, w: 60, h: 34 }]);
		assert.deepEqual(m.target, { x: 75, y: 8, w: 30, h: 17 });
	});

	test("stacked monitors: the height limit wins, still aspect-true", () => {
		const m = monitorMap([FHD, { left: 0, top: 1080, width: 1920, height: 1080 }], [win(1, 0, 1080, 1920, 1080)], 1, 120, 80);
		assert.equal(m.height, 80);
		assert.equal(m.width, 71);
		assert.deepEqual(m.monitors[1], { x: 0, y: 40, w: 71, h: 40 });
		assert.deepEqual(m.target, { x: 0, y: 40, w: 71, h: 40 });
	});

	test("negative coordinates: a monitor left of and above the primary", () => {
		const m = monitorMap([FHD, { left: -1280, top: -200, width: 1280, height: 1024 }], [win(1, -1280, -200, 640, 512)], 1, 160, 100);
		assert.deepEqual(m.monitors[1], { x: 0, y: 0, w: 64, h: 51 });
		assert.deepEqual(m.monitors[0], { x: 64, y: 10, w: 96, h: 54 });
		assert.deepEqual(m.target, { x: 0, y: 0, w: 32, h: 26 });
	});

	test("a window hanging over its monitor's edge is clipped to that monitor", () => {
		const m = monitorMap([FHD], [win(1, 1440, -20, 960, 540)], 1, 120, 80);
		assert.deepEqual(m.target, { x: 90, y: 0, w: 30, h: 33 });
	});

	test("target on no known monitor: no rect, offscreen", () => {
		const m = monitorMap([FHD], [win(1, 3000, 0, 800, 600)], 1, 120, 80);
		assert.equal(m.target, null);
		assert.equal(m.offscreen, true);
	});

	test("minimized target: drawn at its restore bounds, flagged minimized", () => {
		// Chrome (Windows, checked on a real window) reports a minimized
		// window's restore bounds
		const m = monitorMap([FHD], [win(1, 0, 0, 960, 540, "minimized")], 1, 120, 80);
		assert.deepEqual(m.target, { x: 0, y: 0, w: 60, h: 34, minimized: true });
		assert.equal(m.offscreen, false);
		assert.deepEqual(m.monitor, { index: 1, count: 1 });
	});

	test("minimized target with junk bounds (-32000): no rect, not offscreen", () => {
		const m = monitorMap([FHD], [win(1, -32000, -32000, 160, 28, "minimized")], 1, 120, 80);
		assert.equal(m.target, null);
		assert.equal(m.offscreen, false);
		assert.equal(m.monitor, null);
	});

	test("other windows: drawn when on a monitor, minimized ones flagged", () => {
		const m = monitorMap([FHD], [win(1, 0, 0, 960, 540), win(2, 960, 540, 960, 540), win(3, 5000, 0, 100, 100), win(4, 0, 0, 100, 100, "minimized")], 1, 120, 80);
		assert.deepEqual(m.others, [{ x: 60, y: 34, w: 60, h: 34 }, { x: 0, y: 0, w: 6, h: 6, minimized: true }]);
	});

	test("which monitor: 1-based in the order given, with the count", () => {
		const three = [FHD, { left: 1920, top: 0, width: 1920, height: 1080 }, { left: 3840, top: 0, width: 1280, height: 1024 }];
		assert.deepEqual(monitorMap(three, [win(1, 2000, 100, 800, 600)], 1, 180, 80).monitor, { index: 2, count: 3 });
		assert.deepEqual(monitorMap(three, [win(1, 6000, 100, 800, 600)], 1, 180, 80).monitor, null);
	});

	test("unknown bounds or no monitors: no map", () => {
		assert.equal(monitorMap([], [win(1, 0, 0, 10, 10)], 1, 120, 80), null);
		assert.equal(monitorMap([FHD], [{ id: 1 }], 1, 120, 80).target, null);
	});
});
