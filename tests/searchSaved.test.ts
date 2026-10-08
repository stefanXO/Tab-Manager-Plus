"use strict";

// Unit tests for the search over saved windows in src/popup/searchSaved.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseQuery } from "../src/popup/search.ts";
import { searchSaved, searchSummary } from "../src/popup/searchSaved.ts";
import { SavedTabKeys, isSavedTabKey } from "../src/popup/sessionKeys.ts";

const SESSIONS = [
	{ id: "s1", tabs: [
		{ index: 0, title: "Hacker News", url: "https://news.ycombinator.com/" },
		{ index: 1, title: "react - npm", url: "https://www.npmjs.com/package/react" },
		{ index: 2, title: "Lofi beats", url: "https://www.youtube.com/watch?v=1" },
	] },
	{ id: "s2", tabs: [
		{ index: 0, title: "Q3 planning - Google Docs", url: "https://docs.google.com/document/d/q3" },
		{ index: 1, title: "Inbox - Gmail", url: "https://mail.google.com/mail/u/0/#inbox" },
	] },
];

describe("searchSaved", () => {
	test("no query and nothing highlighted: nothing hidden, every window shown", () => {
		const keys = new SavedTabKeys();
		for (const q of [null, parseQuery(""), parseQuery("   ")]) {
			const r = searchSaved(SESSIONS, q, false, keys);
			assert.equal(r.active, false);
			assert.equal(r.hidden.size, 0);
			assert.deepEqual([...r.shown], ["s1", "s2"]);
			assert.equal(r.tabs, 0);
			assert.equal(r.windows, 0);
		}
	});

	test("matching tabs stay, the others are hidden by their saved-tab key", () => {
		const keys = new SavedTabKeys();
		const r = searchSaved(SESSIONS, parseQuery("react"), false, keys);
		assert.equal(r.active, true);
		assert.equal(r.tabs, 1);
		assert.equal(r.windows, 1);
		assert.deepEqual([...r.shown], ["s1"]);
		// 5 saved tabs, 1 matches
		assert.equal(r.hidden.size, 4);
		assert.ok(!r.hidden.has(keys.key("s1", 1)));
		assert.ok(r.hidden.has(keys.key("s1", 0)));
		assert.ok(r.hidden.has(keys.key("s2", 0)));
		for (const k of r.hidden) assert.ok(isSavedTabKey(k), "never an open tab id: " + k);
	});

	test("a window with no match is not shown, and every one of its tabs is hidden", () => {
		const keys = new SavedTabKeys();
		const r = searchSaved(SESSIONS, parseQuery("google"), false, keys);
		assert.deepEqual([...r.shown], ["s2"]);
		assert.equal(r.tabs, 2);
		assert.equal(r.windows, 1);
		for (let i = 0; i < 3; i++) assert.ok(r.hidden.has(keys.key("s1", i)));
		assert.ok(!r.hidden.has(keys.key("s2", 0)));
		assert.ok(!r.hidden.has(keys.key("s2", 1)));
	});

	test("matches in several windows are counted per tab and per window", () => {
		const r = searchSaved(SESSIONS, parseQuery("o"), false, new SavedTabKeys());
		assert.equal(r.windows, 2);
		assert.ok(r.tabs >= 4);
	});

	test("the grammar applies: url-only, title-only, exclusion and OR", () => {
		const keys = new SavedTabKeys();
		const hit = (q : string) => SESSIONS.flatMap((s) => s.tabs.map((t) => [s.id, t.index] as const))
			.filter(([id, i]) => !searchSaved(SESSIONS, parseQuery(q), false, keys).hidden.has(keys.key(id, i)))
			.map(([id, i]) => id + ":" + i);
		assert.deepEqual(hit("u:npmjs"), ["s1:1"]);
		assert.deepEqual(hit("t:npmjs"), []);
		assert.deepEqual(hit("google -gmail"), ["s2:0"]);
		assert.deepEqual(hit("hacker OR inbox"), ["s1:0", "s2:1"]);
	});

	test("no match at all: everything hidden, no window shown", () => {
		const keys = new SavedTabKeys();
		const r = searchSaved(SESSIONS, parseQuery("zzzz"), false, keys);
		assert.equal(r.shown.size, 0);
		assert.equal(r.tabs, 0);
		assert.equal(r.hidden.size, 5);
	});

	test("open-tab-only highlighting (duplicates, recent) hides every saved tab, whatever the query", () => {
		const keys = new SavedTabKeys();
		for (const q of [null, parseQuery("google")]) {
			const r = searchSaved(SESSIONS, q, true, keys);
			assert.equal(r.active, true);
			assert.equal(r.hidden.size, 5);
			assert.equal(r.shown.size, 0);
			assert.equal(r.tabs, 0);
		}
	});

	test("a pending url is searched when the saved tab has no url", () => {
		const r = searchSaved([{ id: "p", tabs: [{ index: 0, title: "", pendingUrl: "https://example.org/x" }] }], parseQuery("example.org"), false, new SavedTabKeys());
		assert.equal(r.tabs, 1);
	});

	test("it does not change the saved windows", () => {
		const copy = JSON.stringify(SESSIONS);
		searchSaved(SESSIONS, parseQuery("react"), false, new SavedTabKeys());
		assert.equal(JSON.stringify(SESSIONS), copy);
	});
});

describe("searchSummary", () => {
	const none = { tabs: 0, windows: 0 };

	test("open matches only: the header it always had", () => {
		assert.deepEqual(searchSummary("x", 0, none), { top: "No matches for 'x'", bottom: "" });
		assert.deepEqual(searchSummary("x", 1, none), { top: "1 match for 'x'", bottom: "Press enter to switch to the tab" });
		assert.deepEqual(searchSummary("x", 4, none), { top: "4 matches for 'x'", bottom: "Press enter to move them to a new window" });
	});

	test("open and saved matches are both counted", () => {
		assert.equal(searchSummary("g", 5, { tabs: 2, windows: 1 }).top, "5 matches for 'g', and 2 in a saved window");
		assert.equal(searchSummary("g", 1, { tabs: 3, windows: 2 }).top, "1 match for 'g', and 3 in 2 saved windows");
		// Enter still only moves the open ones
		assert.equal(searchSummary("g", 5, { tabs: 2, windows: 1 }).bottom, "Press enter to move them to a new window");
	});

	test("only saved matches: says where, and that they are not selected", () => {
		const s = searchSummary("tax", 0, { tabs: 1, windows: 1 });
		assert.equal(s.top, "1 match for 'tax' in a saved window");
		assert.match(s.bottom, /not selected/);
		assert.equal(searchSummary("tax", 0, { tabs: 4, windows: 2 }).top, "4 matches for 'tax' in 2 saved windows");
	});
});
