"use strict";

// Unit tests for the saved tab's hover card and the saved / open lookups in
// src/popup/stats.ts, and the saved tab's hover key in statsHoverLogic.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { tabStats, savedTabStats, savedWindowsWith, openTabsWith } from "../src/popup/stats.ts";
import type { StatsTab, StatsLine } from "../src/popup/stats.ts";
import { hoverKey, parseKey, hoverAction } from "../src/popup/statsHoverLogic.ts";
import type { HoverNode } from "../src/popup/statsHoverLogic.ts";

const NOW = Date.parse("2030-06-01T12:00:00.000Z");
const DAY = 24 * 3600e3;
const keyed = (lines : StatsLine[], key : string) => lines.find((l) => l.key === key)?.text;
const open = (id : number, windowId : number, url : string) : StatsTab => ({ id, windowId, url, title: "T" + id });
const NAMES = new Map([[1, "Work"], [2, "Life"]]);
const openName = (id : number) => NAMES.get(id);

const saved = (index : number, url : string, extra : Partial<StatsTab> = {}) : StatsTab => ({ index, url, title: "Saved " + index, ...extra });

describe("savedTabStats", () => {
	const base = { now: NOW, savedAt: NOW - 2 * DAY, windowName: "Conference reading", windowTabCount: 5, allTabs: [] as StatsTab[], openWindowName: openName };

	test("title, saved how long ago, position in the saved window", () => {
		const card = savedTabStats(saved(2, "https://a.test/"), base);
		assert.equal(card.title, "Saved 2");
		assert.deepEqual(card.lines.map((l) => l.key), ["saved", "position"]);
		assert.equal(keyed(card.lines, "saved"), "saved 2 days ago");
		assert.equal(keyed(card.lines, "position"), "tab 3 of 5 in Conference reading");
	});

	test("title falls back to the url, then to a placeholder", () => {
		assert.equal(savedTabStats(saved(0, "https://a.test/", { title: "" }), base).title, "https://a.test/");
		assert.equal(savedTabStats(saved(0, "", { title: "" }), base).title, "Untitled tab");
	});

	test("a pinned tab says so", () => {
		const card = savedTabStats(saved(0, "https://a.test/", { pinned: true }), base);
		assert.equal(keyed(card.lines, "state"), "pinned");
		assert.equal(keyed(savedTabStats(saved(0, "https://a.test/"), base).lines, "state"), undefined);
	});

	test("a saved window without a name: no 'in ...'", () => {
		const card = savedTabStats(saved(0, "https://a.test/"), { ...base, windowName: "" });
		assert.equal(keyed(card.lines, "position"), "tab 1 of 5");
	});

	test("open now in the windows that hold the url, each once", () => {
		const all = [open(1, 1, "https://a.test/"), open(2, 1, "https://a.test/"), open(3, 2, "https://a.test/"), open(4, 2, "https://b.test/")];
		const card = savedTabStats(saved(0, "https://a.test/"), { ...base, allTabs: all });
		assert.equal(keyed(card.lines, "open"), "open now in Work, Life");
	});

	test("open now without a window name; not open: no line", () => {
		const all = [open(1, 99, "https://a.test/")];
		assert.equal(keyed(savedTabStats(saved(0, "https://a.test/"), { ...base, allTabs: all }).lines, "open"), "open now");
		assert.equal(keyed(savedTabStats(saved(0, "https://zzz.test/"), { ...base, allTabs: all }).lines, "open"), undefined);
	});

	test("a saved tab with no url is never 'open now'", () => {
		const all = [open(1, 1, "")];
		assert.equal(keyed(savedTabStats(saved(0, ""), { ...base, allTabs: all }).lines, "open"), undefined);
	});
});

describe("savedWindowsWith / openTabsWith", () => {
	const sessions = [
		{ name: "Reading", tabs: [{ url: "https://a.test/" }, { url: "https://b.test/" }] },
		{ name: "Taxes", tabs: [{ url: "https://c.test/" }] },
		{ name: "Reading again", tabs: [{ url: "https://b.test/" }, { url: "https://b.test/" }] },
		{ name: "", tabs: [{ url: "https://b.test/" }] },
	];
	test("names of the saved windows with the url, each once, in order", () => {
		assert.deepEqual(savedWindowsWith("https://b.test/", sessions), ["Reading", "Reading again"]);
		assert.deepEqual(savedWindowsWith("https://c.test/", sessions), ["Taxes"]);
	});
	test("no match, no url", () => {
		assert.deepEqual(savedWindowsWith("https://zzz.test/", sessions), []);
		assert.deepEqual(savedWindowsWith("", sessions), []);
		assert.deepEqual(savedWindowsWith(undefined, sessions), []);
	});
	test("the url is compared exactly", () => {
		assert.deepEqual(savedWindowsWith("https://b.test", sessions), []);
	});
	test("openTabsWith counts tabs and names windows once", () => {
		const all = [open(1, 1, "https://a.test/"), open(2, 1, "https://a.test/"), open(3, 2, "https://b.test/")];
		assert.deepEqual(openTabsWith("https://a.test/", all, openName), { count: 2, names: ["Work"] });
		assert.deepEqual(openTabsWith("https://none.test/", all, openName), { count: 0, names: [] });
	});
});

describe("tabStats: also saved in", () => {
	const tabs = [open(1, 1, "https://a.test/")];
	tabs[0].index = 0;
	test("lists the saved windows that hold the url", () => {
		const s = tabStats(tabs[0], { now: NOW, windowTabs: tabs, allTabs: tabs, savedIn: ["Reading", "Taxes"] });
		assert.equal(keyed(s.lines, "savedIn"), "also saved in Reading, Taxes");
	});
	test("no line when it is in none (or nothing is known)", () => {
		assert.equal(keyed(tabStats(tabs[0], { now: NOW, windowTabs: tabs, allTabs: tabs, savedIn: [] }).lines, "savedIn"), undefined);
		assert.equal(keyed(tabStats(tabs[0], { now: NOW, windowTabs: tabs, allTabs: tabs }).lines, "savedIn"), undefined);
	});
	test("it comes after the copies line", () => {
		const two = [open(1, 1, "https://a.test/"), open(2, 2, "https://a.test/")];
		two.forEach((t, i) => (t.index = i));
		const s = tabStats(two[0], { now: NOW, windowTabs: [two[0]], allTabs: two, windowName: openName, savedIn: ["Reading"] });
		assert.deepEqual(s.lines.map((l) => l.key).filter((k) => k === "copies" || k === "savedIn"), ["copies", "savedIn"]);
	});
});

describe("saved tab hover key", () => {
	const el = (id : string) : HoverNode => ({ id, closest: () => null });
	const node = (matches : Record<string, HoverNode>) : HoverNode => ({ id: "", closest: (sel : string) => matches[sel] || null });
	const SAVED = ".window-container .tab[id^='sessiontab_']";

	test("a saved tab tile: s<saved window id>_<index>", () => {
		assert.equal(hoverKey(node({ [SAVED]: el("sessiontab_s1_3") })), "ss1_3");
	});
	test("the saved window's action buttons are no target", () => {
		assert.equal(hoverKey(node({ ".window-actions": el("") })), "");
	});
	test("parseKey: the index follows the last underscore", () => {
		assert.deepEqual(parseKey("ss1_3"), { kind: "saved", sessionId: "s1", index: 3 });
		assert.deepEqual(parseKey("sa_b_c_12"), { kind: "saved", sessionId: "a_b_c", index: 12 });
		assert.deepEqual(parseKey("s6f1c-9d_0"), { kind: "saved", sessionId: "6f1c-9d", index: 0 });
	});
	test("parseKey: malformed saved keys", () => {
		assert.equal(parseKey("s"), null);
		assert.equal(parseKey("s1"), null);
		assert.equal(parseKey("s_3"), null);
		assert.equal(parseKey("ss1_"), null);
		assert.equal(parseKey("ss1_x"), null);
	});
	test("a saved tab behaves as a tab: warm swaps at once, cold settles", () => {
		assert.deepEqual(hoverAction("ss1_1", "t4", true, true), { kind: "show", key: "ss1_1", delay: 0 });
		assert.equal((hoverAction("ss1_1", "", false, false) as { delay : number }).delay, 100);
	});
});
