"use strict";

// Unit tests for the search over saved windows in src/popup/searchSaved.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseQuery, queryReach } from "../src/popup/search.ts";
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

describe("searchSaved with s:", () => {
	test("s:word keeps the saved tabs with the word, like a plain word", () => {
		const keys = new SavedTabKeys();
		const r = searchSaved(SESSIONS, parseQuery("s:google"), false, keys);
		assert.deepEqual([...r.shown], ["s2"]);
		assert.equal(r.tabs, 2);
		assert.equal(r.windows, 1);
		assert.equal(r.hidden.size, 3);
	});

	test("bare s: keeps every saved tab", () => {
		const r = searchSaved(SESSIONS, parseQuery("s:"), false, new SavedTabKeys());
		assert.equal(r.active, true);
		assert.deepEqual([...r.shown], ["s1", "s2"]);
		assert.equal(r.tabs, 5);
		assert.equal(r.windows, 2);
		assert.equal(r.hidden.size, 0);
	});

	test("combined with t:, u:, a minus, a phrase and a pattern", () => {
		const q = (text : string) => searchSaved(SESSIONS, parseQuery(text), false, new SavedTabKeys());
		assert.equal(q("s: t:inbox").tabs, 1);
		assert.equal(q("s: u:google.com").tabs, 2);
		assert.equal(q("s: google -u:mail").tabs, 1);
		assert.equal(q('s:"react - npm"').tabs, 1);
		assert.equal(q("s:/lofi|hacker/").tabs, 2);
		assert.equal(q("s: -google").tabs, 3);
		assert.equal(q("s:nothinglikethis").tabs, 0);
	});

	test("s:u: and s:t: look at one field of the saved tabs", () => {
		const q = (text : string) => searchSaved(SESSIONS, parseQuery(text), false, new SavedTabKeys());
		assert.equal(q("s:u:google").tabs, 2);
		assert.equal(q("s:u:inbox").tabs, 1);
		assert.equal(q("s:t:inbox").tabs, 1);
		assert.equal(q("s:t:google").tabs, 1);
		assert.equal(q("s:u:planning").tabs, 0);
		assert.equal(q("s:t:q3 s:u:docs").tabs, 1);
		assert.equal(q("s: u:google t:gmail").tabs, 1);
		assert.equal(q("s:u:google").windows, 1);
	});

	test("-s:word, -s:u:x and -s:t:x are the open scope: every saved tab hides", () => {
		for (const q of ["-s:google", "-s:u:google", "-s:t:inbox", "-s:http://", "-s:\"react - npm\"", "-s:/react/"]) {
			const r = searchSaved(SESSIONS, parseQuery(q), false, new SavedTabKeys());
			assert.equal(r.active, true, q);
			assert.equal(r.tabs, 0, q);
			assert.equal(r.windows, 0, q);
			assert.equal(r.shown.size, 0, q);
			assert.equal(r.hidden.size, 5, q);
		}
	});

	test("-s:http:// finds no saved window, whatever their urls hold", () => {
		const web = [{ id: "w", tabs: [{ index: 0, title: "A", url: "http://example.com/" }] }];
		assert.equal(searchSaved(web, parseQuery("-s:http://"), false, new SavedTabKeys()).tabs, 0);
		assert.equal(searchSaved(web, parseQuery("s:http://"), false, new SavedTabKeys()).tabs, 1);
		assert.equal(searchSaved(web, parseQuery("http://"), false, new SavedTabKeys()).tabs, 1);
	});

	test("-s: leaves no saved tab: all of them hide", () => {
		const r = searchSaved(SESSIONS, parseQuery("-s:"), false, new SavedTabKeys());
		assert.equal(r.tabs, 0);
		assert.equal(r.shown.size, 0);
		assert.equal(r.hidden.size, 5);
		// with other terms too
		const t = searchSaved(SESSIONS, parseQuery("-s: google"), false, new SavedTabKeys());
		assert.equal(t.tabs, 0);
		assert.equal(t.hidden.size, 5);
	});

	test("with the feature off, s: is text and -s: a negation: saved tabs follow the words", () => {
		const web = [{ id: "w", tabs: [{ index: 0, title: "about s:foo", url: "http://a.test" }, { index: 1, title: "foo", url: "http://b.test" }] }];
		const keys = new SavedTabKeys();
		assert.equal(searchSaved(web, parseQuery("s:foo", false), false, keys).tabs, 1);
		assert.equal(searchSaved(web, parseQuery("-s:foo", false), false, keys).tabs, 1);
		assert.equal(searchSaved(web, parseQuery("s:", false), false, keys).tabs, 1);
	});

	test("Highlight Duplicates still beats it: no saved tab belongs to what it picked", () => {
		const r = searchSaved(SESSIONS, parseQuery("s:"), true, new SavedTabKeys());
		assert.equal(r.tabs, 0);
		assert.equal(r.hidden.size, 5);
	});

	test("the header for a bare s: reads like the saved part of a normal search", () => {
		const r = searchSaved(SESSIONS, parseQuery("s:"), false, new SavedTabKeys());
		assert.equal(searchSummary("s:", 0, r, "saved").top, "5 tabs in 2 saved windows");
	});
});

describe("searchSummary for a search only saved tabs can match", () => {
	const run = (text : string, openCount = 0) => {
		const q = parseQuery(text);
		const saved = searchSaved(SESSIONS, q, false, new SavedTabKeys());
		const reach = queryReach(q);
		const kind = reach.saved && !reach.open ? "saved" : "all";
		return searchSummary(text, openCount, saved, kind);
	};

	test("N tabs in M saved windows, the wording of a normal search's saved part", () => {
		assert.equal(run("s:").top, "5 tabs in 2 saved windows");
		assert.equal(run("s:google").top, "2 tabs in a saved window");
		assert.equal(run("s:u:google").top, "2 tabs in a saved window");
		assert.equal(run("s:t:inbox").top, "1 tab in a saved window");
		assert.equal(run("s: -google").top, "3 tabs in a saved window");
		assert.equal(run("s:/o/").top, "5 tabs in 2 saved windows");
		assert.equal(run("s:/lofi|hacker/").top, "2 tabs in a saved window");
	});

	test("the saved part is the same words as in a mixed search", () => {
		const mixed = searchSummary("g", 5, { tabs: 2, windows: 1 }).top;
		assert.ok(mixed.endsWith(", and 2 in a saved window"));
		assert.ok(run("s:google").top.endsWith("in a saved window"));
		assert.ok(run("s:").top.endsWith("in 2 saved windows"));
		assert.ok(searchSummary("g", 1, { tabs: 3, windows: 2 }).top.endsWith("3 in 2 saved windows"));
	});

	test("the hint says the saved tabs are not selected", () => {
		assert.match(run("s:").bottom, /not selected/);
	});

	test("no match still says so, with the text", () => {
		assert.equal(run("s:nothinglikethis").top, "No matches for 's:nothinglikethis'");
		assert.equal(run("s:nothinglikethis").bottom, "");
	});

	test("a search that can match open tabs keeps the usual header", () => {
		assert.equal(searchSummary("g", 4, { tabs: 0, windows: 0 }, "all").top, "4 matches for 'g'");
	});
});

describe("searchSummary for a query of only -s:", () => {
	test("N tabs in M open windows, none selected", () => {
		const s = searchSummary("-s:", 24, { tabs: 0, windows: 0 }, "open list", 3);
		assert.equal(s.top, "24 tabs in 3 open windows");
		assert.match(s.bottom, /none is selected/);
		assert.equal(searchSummary("-s:", 1, { tabs: 0, windows: 0 }, "open list", 1).top, "1 tab in an open window");
		assert.equal(searchSummary("-s:", 0, { tabs: 0, windows: 0 }, "open list", 0).top, "No open tabs");
	});
});

describe("-s:word header", () => {
	test("open matches only, saved tabs never counted", () => {
		const q = parseQuery("-s:google");
		const saved = searchSaved(SESSIONS, q, false, new SavedTabKeys());
		assert.equal(saved.tabs, 0);
		const s = searchSummary("-s:google", 3, saved, "all");
		assert.equal(s.top, "3 matches for '-s:google'");
		assert.equal(s.bottom, "Press enter to move them to a new window");
	});
});
