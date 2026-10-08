"use strict";

// The search syntax help and the rotating tip follow the saved windows setting.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
	SAVED_SEARCH_TIP, SEARCH_HELP_ROWS, searchHelpIntro, searchHelpRows, searchTips
} from "../src/popup/searchHelp.ts";
import { matchTab, parseQuery, searchable } from "../src/popup/search.ts";

describe("search help rows", () => {
	test("with saved windows on, the s: rows are listed, in the nested form too", () => {
		const codes = searchHelpRows(true).map((r) => r.code);
		for (const c of ["s:tax", "s:u:github", "s: t:tax", "-s:"]) assert.ok(codes.includes(c), c);
	});

	test("with saved windows off, no row mentions them", () => {
		const rows = searchHelpRows(false);
		assert.ok(rows.length > 0);
		for (const r of rows) {
			assert.ok(!/^-?s:/i.test(r.code), r.code);
			assert.ok(!/saved/i.test(r.text), r.text);
		}
		assert.ok(!/saved/i.test(searchHelpIntro(false)));
		assert.ok(/saved windows/.test(searchHelpIntro(true)));
	});

	test("only the s: rows go: everything else stays", () => {
		const off = searchHelpRows(false).length;
		assert.equal(off + SEARCH_HELP_ROWS.filter((r) => r.saved).length, SEARCH_HELP_ROWS.length);
		assert.equal(searchHelpRows(true).length, SEARCH_HELP_ROWS.length);
	});

	test("every s: example in the help does what its text says", () => {
		const saved = (q : string, title : string, url : string) => matchTab(searchable(title, url, true), parseQuery(q));
		const open = (q : string, title : string, url : string) => matchTab(searchable(title, url, false), parseQuery(q));
		assert.equal(saved("s:tax", "Tax", "https://x.test"), true);
		assert.equal(open("s:tax", "Tax", "https://x.test"), false);
		assert.equal(saved("s:u:github", "x", "https://github.com"), true);
		assert.equal(saved("s:u:github", "github", "https://x.test"), false);
		assert.equal(saved("s: t:tax", "Tax", "https://x.test"), true);
		assert.equal(open("s: t:tax", "Tax", "https://x.test"), false);
		assert.equal(open("-s:", "Tax", "https://x.test"), true);
		assert.equal(saved("-s:", "Tax", "https://x.test"), false);
	});
});

describe("search tips", () => {
	const tips = ["a", SAVED_SEARCH_TIP, "b"];
	test("the saved windows tip goes with the feature", () => {
		assert.deepEqual(searchTips(tips, true), tips);
		assert.deepEqual(searchTips(tips, false), ["a", "b"]);
	});
	test("the tip names the nested form", () => {
		assert.ok(SAVED_SEARCH_TIP.includes("s:u:github"));
	});
});
