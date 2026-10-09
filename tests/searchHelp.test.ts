"use strict";

// The search syntax help and the rotating tip follow the saved windows setting.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
	SAVED_SEARCH_TIP, SEARCH_HELP_ROWS, searchHelpIntro, searchHelpRows, searchTips
} from "../src/popup/searchHelp.ts";
import { matchTab, parseQuery, searchable } from "../src/popup/search.ts";

describe("search help rows", () => {
	test("with saved windows on, the s: rows are listed, in the nested form too", () => {
		const codes = searchHelpRows(true).map((r) => r.code);
		for (const c of ["s:tax", "s:u:github", "s: t:tax", "-s:tax", "-s:"]) assert.ok(codes.includes(c), c);
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
		// -s:tax: open tabs only (-s:u: url, -s:t: title)
		assert.equal(open("-s:tax", "Tax", "https://x.test"), true);
		assert.equal(saved("-s:tax", "Tax", "https://x.test"), false);
		assert.equal(open("-s:u:github", "x", "https://github.com"), true);
		assert.equal(open("-s:t:github", "x", "https://github.com"), false);
		assert.equal(saved("-s:u:github", "x", "https://github.com"), false);
		// -s: alone: open windows only, selects nothing
		assert.equal(open("-s:", "Tax", "https://x.test"), true);
		assert.equal(saved("-s:", "Tax", "https://x.test"), false);
		assert.equal(parseQuery("-s:").scopeOnly, true);
	});

	test("the -s: rows say open, not leave out", () => {
		const rows = searchHelpRows(true).filter((r) => r.code.startsWith("-s:"));
		assert.equal(rows.length, 2);
		for (const r of rows) {
			assert.match(r.text, /open/);
			assert.ok(!/leave out/.test(r.text), r.text);
		}
	});

	test("with the feature off, s: is plain text and has no help", () => {
		assert.equal(searchHelpRows(false).some((r) => /s:/.test(r.code)), false);
		assert.equal(matchTab(searchable("s:tax", "https://x.test"), parseQuery("s:tax", false)), true);
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

describe("search help icon", () => {
	const read = (p : string) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
	const tsx = read("src/popup/views/TabManager.tsx");
	const css = read("css/components/search.css");
	test("the TSX has the help button with its label and description", () => {
		assert.match(tsx, /<button type="button" className=\{"search-help-icon"[^>]*aria-label="Search help" aria-describedby="search-help"/);
		assert.match(tsx, /onMouseDown=\{\(e\) => e\.preventDefault\(\)\}/);
	});
	test("the icon is a mono outline svg, not a button look", () => {
		assert.match(tsx, /search-help-icon[\s\S]{0,400}<svg viewBox="0 0 16 16"/);
		const block = css.slice(css.indexOf(".search-help-icon {"), css.indexOf("}", css.indexOf(".search-help-icon {")));
		assert.match(block, /border:\s*0/);
		assert.match(block, /background:\s*none/);
		assert.match(css, /stroke:\s*currentColor/);
		assert.match(css, /stroke-width:\s*1\.5/);
		assert.match(css, /\.search-help-icon:focus-visible\s*\{[^}]*outline/);
	});
	test("the card shows on the icon, not on the whole cell", () => {
		assert.ok(!/td\.one:hover\s+\.search-help/.test(css));
		assert.ok(!/td\.one:hover\s+\.search-help/.test(read("css/motion.css")));
		assert.match(css, /\.search-help-icon:hover ~ \.search-help/);
		assert.match(css, /\.search-help-icon:focus-visible ~ \.search-help/);
		assert.match(css, /\.search-help:hover/);
		assert.match(css, /transition-delay:\s*400ms/);
	});
});
