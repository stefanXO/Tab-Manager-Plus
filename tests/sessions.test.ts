"use strict";

// Unit tests for building saved windows in src/helpers/sessions.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { newSessionId, buildSavedWindow, groupSelection, savedText } from "../src/helpers/sessions.ts";
import { restoreCreate, predictLanding } from "../src/helpers/geometry.ts";

const tab = (windowId : number, index : number, url : string, extra = {}) => ({ id: windowId * 100 + index, windowId, index, url, title: url, ...extra });

describe("newSessionId", () => {
	test("is a version 4 uuid", () => {
		assert.match(newSessionId(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
	});
	test("follows the random source", () => {
		assert.equal(newSessionId(() => 0), "00000000-0000-4000-8000-000000000000");
		assert.notEqual(newSessionId(), newSessionId());
	});
});

describe("buildSavedWindow", () => {
	const tabs = [tab(1, 0, "https://github.com/a/b"), tab(1, 1, "https://github.com/c/d")];
	const base = { id: "x", now: 1234, tabs, windowsInfo: { id: 1 }, name: "", incognito: false, firefox: false };

	test("the fields of a saved window", () => {
		const s = buildSavedWindow({ ...base, autoName: "GitHub", color: "color4" });
		assert.deepEqual(s, {
			tabs, windowsInfo: { id: 1 }, name: "GitHub", customName: false, color: "color4",
			date: 1234, sessionStartTime: 1234, incognito: false, id: "x"
		});
	});
	test("a given name is the name and a custom one", () => {
		const s = buildSavedWindow({ ...base, name: "Taxes", autoName: "GitHub" });
		assert.equal(s.name, "Taxes");
		assert.equal(s.customName, true);
	});
	test("without any name it is made from the sites", () => {
		const s = buildSavedWindow(base);
		assert.equal(s.name, "GitHub");
		assert.equal(s.customName, false);
	});
	test("no colour is the default one", () => {
		assert.equal(buildSavedWindow(base).color, "default");
		assert.equal(buildSavedWindow({ ...base, color: "" }).color, "default");
	});
	test("the private flag is kept", () => {
		assert.equal(buildSavedWindow({ ...base, incognito: true }).incognito, true);
	});
	test("Firefox leaves out about: pages, Chrome keeps them", () => {
		const mixed = [tab(1, 0, "about:newtab"), tab(1, 1, "https://github.com/a/b"), tab(1, 2, "about:addons")];
		assert.deepEqual(buildSavedWindow({ ...base, tabs: mixed, firefox: true }).tabs.map((t) => t.index), [1]);
		assert.equal(buildSavedWindow({ ...base, tabs: mixed, firefox: false }).tabs.length, 3);
	});
	test("a tab without a url is kept", () => {
		const t = [{ index: 0 }];
		assert.equal(buildSavedWindow({ ...base, tabs: t, firefox: true }).tabs.length, 1);
	});
	test("the name does not depend on the left out tabs", () => {
		// as saving a window always did: the name is made from every tab
		const mixed = [tab(1, 0, "about:newtab"), tab(1, 1, "https://github.com/a/b")];
		assert.equal(buildSavedWindow({ ...base, tabs: mixed, firefox: true }).name, "GitHub");
	});
	test("the input tabs are not changed", () => {
		const copy = JSON.stringify(tabs);
		buildSavedWindow({ ...base, firefox: true });
		assert.equal(JSON.stringify(tabs), copy);
	});
});

describe("groupSelection", () => {
	test("tabs in popup order, then tab order, renumbered from 0", () => {
		const sel = [tab(2, 5, "https://b.com"), tab(1, 3, "https://a.com"), tab(2, 1, "https://c.com"), tab(1, 0, "https://d.com")];
		const groups = groupSelection(sel, [1, 2]);
		assert.equal(groups.length, 1);
		assert.deepEqual(groups[0].tabs.map((t) => t.url), ["https://d.com", "https://a.com", "https://c.com", "https://b.com"]);
		assert.deepEqual(groups[0].tabs.map((t) => t.index), [0, 1, 2, 3]);
	});
	test("the window order decides, not the window ids", () => {
		const sel = [tab(1, 0, "https://a.com"), tab(2, 0, "https://b.com")];
		assert.deepEqual(groupSelection(sel, [2, 1])[0].tabs.map((t) => t.url), ["https://b.com", "https://a.com"]);
	});
	test("a window the order does not know goes last", () => {
		const sel = [tab(9, 0, "https://z.com"), tab(1, 0, "https://a.com")];
		assert.deepEqual(groupSelection(sel, [1])[0].tabs.map((t) => t.url), ["https://a.com", "https://z.com"]);
	});
	test("the saved window takes the geometry of the window with most selected tabs", () => {
		const sel = [tab(1, 0, "https://a.com"), tab(2, 0, "https://b.com"), tab(2, 1, "https://c.com")];
		assert.equal(groupSelection(sel, [1, 2])[0].windowId, 2);
	});
	test("on a tie the first window in popup order", () => {
		const sel = [tab(2, 0, "https://b.com"), tab(1, 0, "https://a.com")];
		assert.equal(groupSelection(sel, [1, 2])[0].windowId, 1);
		assert.equal(groupSelection(sel, [2, 1])[0].windowId, 2);
	});
	test("only the first active tab stays active", () => {
		const sel = [tab(1, 0, "https://a.com", { active: true }), tab(1, 1, "https://b.com"), tab(2, 0, "https://c.com", { active: true })];
		assert.deepEqual(groupSelection(sel, [1, 2])[0].tabs.map((t) => t.active), [true, undefined, false]);
	});
	test("pinned stays as it is", () => {
		const sel = [tab(1, 0, "https://a.com", { pinned: true }), tab(1, 1, "https://b.com", { pinned: false })];
		assert.deepEqual(groupSelection(sel, [1])[0].tabs.map((t) => t.pinned), [true, false]);
	});
	test("private and normal tabs make two saved windows, normal first", () => {
		const sel = [tab(3, 0, "https://p.com", { incognito: true }), tab(1, 0, "https://a.com"), tab(3, 1, "https://q.com", { incognito: true }), tab(2, 0, "https://b.com")];
		const groups = groupSelection(sel, [3, 1, 2]);
		assert.deepEqual(groups.map((g) => g.incognito), [false, true]);
		assert.deepEqual(groups[0].tabs.map((t) => t.url), ["https://a.com", "https://b.com"]);
		assert.deepEqual(groups[1].tabs.map((t) => t.url), ["https://p.com", "https://q.com"]);
		assert.deepEqual(groups.map((g) => g.windowId), [1, 3]);
		assert.deepEqual(groups[1].tabs.map((t) => t.index), [0, 1]);
	});
	test("only private tabs make one private saved window", () => {
		const groups = groupSelection([tab(3, 0, "https://p.com", { incognito: true })], [3]);
		assert.equal(groups.length, 1);
		assert.equal(groups[0].incognito, true);
	});
	test("nothing selected makes nothing", () => {
		assert.deepEqual(groupSelection([], [1, 2]), []);
	});
	test("the selected tabs are not changed", () => {
		const sel = [tab(2, 5, "https://b.com", { active: true }), tab(1, 3, "https://a.com", { active: true })];
		const copy = JSON.stringify(sel);
		groupSelection(sel, [1, 2]);
		assert.equal(JSON.stringify(sel), copy);
	});
	test("the grouped tabs make a saved window whose name comes from the sites", () => {
		const sel = [tab(1, 4, "https://github.com/a"), tab(2, 2, "https://github.com/b"), tab(2, 3, "https://www.reddit.com/r/x")];
		const [g] = groupSelection(sel, [1, 2]);
		const s = buildSavedWindow({ id: "n", now: 1, tabs: g.tabs, windowsInfo: { id: g.windowId }, name: "", incognito: g.incognito, firefox: false });
		assert.equal(s.name, "GitHub, Reddit");
		assert.equal(s.tabs.length, 3);
		assert.deepEqual(s.windowsInfo, { id: 2 });
	});
});

describe("savedText", () => {
	test("one saved window", () => {
		assert.equal(savedText([{ name: "GitHub", tabs: [1, 2, 3] }]), "Saved 3 tabs as “GitHub”");
	});
	test("a single tab", () => {
		assert.equal(savedText([{ name: "Gmail", tabs: [1] }]), "Saved 1 tab as “Gmail”");
	});
	test("two saved windows", () => {
		assert.equal(savedText([{ name: "A", tabs: [1, 2] }, { name: "B", tabs: [1] }]), "Saved 3 tabs as “A” and “B”");
	});
	test("nothing saved says nothing", () => {
		assert.equal(savedText([]), "");
	});
});

describe("a saved window without window geometry", () => {
	// saving a selection whose window is unknown (no windowId) stores an empty windowsInfo
	test("restores with the browser's default placement", () => {
		const s = buildSavedWindow({ id: "n", now: 1, tabs: [tab(1, 0, "https://github.com/a")], windowsInfo: {}, name: "", incognito: false, firefox: false });
		assert.deepEqual(restoreCreate(s.windowsInfo, [{ left: 0, top: 0, width: 1920, height: 1080 }]), { type: "normal", incognito: false });
		assert.deepEqual(predictLanding(s.windowsInfo, []), { bounds: null, maximized: false });
	});
});
