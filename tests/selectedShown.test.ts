"use strict";

// Unit tests for src/popup/selectedShown.ts: selected tabs are always shown,
// whatever "Hide non-matching tabs" (or the hide mode of Highlight Duplicates
// and Highlight recently active tabs) says.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { tabShow, isHiddenTab, hidesWholeWindow, sessionsWithSelection, shownWithSelection, savedSelectionSignature } from "../src/popup/selectedShown.ts";
import { SavedTabKeys } from "../src/popup/sessionKeys.ts";
import { searchSaved } from "../src/popup/searchSaved.ts";
import { parseQuery } from "../src/popup/search.ts";

describe("tabShow: a selected tab is never hidden", () => {
	const raw = new Set([2, 3]);

	test("a tab that matches is shown, selected or not", () => {
		assert.equal(tabShow(1, raw, true, new Set()), "shown");
		assert.equal(tabShow(1, raw, true, new Set([1])), "shown");
	});

	test("a non-matching tab hides with the filter on", () => {
		assert.equal(tabShow(2, raw, true, new Set()), "hidden");
		assert.equal(tabShow(2, raw, true, new Set([1])), "hidden");
	});

	test("the same tab selected stays on screen, faded", () => {
		assert.equal(tabShow(2, raw, true, new Set([2])), "faded");
		assert.equal(isHiddenTab(2, raw, true, new Set([2])), false);
	});

	test("with the filter off a non-matching tab fades, selected or not", () => {
		assert.equal(tabShow(2, raw, false, new Set()), "faded");
		assert.equal(tabShow(2, raw, false, new Set([2])), "faded");
	});

	test("selecting only keeps the selected one: the others still hide", () => {
		const selection = new Set([2]);
		assert.equal(tabShow(2, raw, true, selection), "faded");
		assert.equal(tabShow(3, raw, true, selection), "hidden");
	});

	test("no search (nothing in the set): everything is shown", () => {
		assert.equal(tabShow(2, new Set(), true, new Set()), "shown");
	});

	test("the sets are not changed", () => {
		const r = new Set([2]), sel = new Set([2]);
		tabShow(2, r, true, sel);
		assert.deepEqual([...r], [2]);
		assert.deepEqual([...sel], [2]);
	});
});

describe("hidesWholeWindow", () => {
	const raw = new Set([1, 2, 3]);

	test("every tab hidden: the window goes", () => {
		assert.equal(hidesWholeWindow([1, 2, 3], raw, true, new Set()), true);
	});

	test("one selected tab keeps the window on screen", () => {
		assert.equal(hidesWholeWindow([1, 2, 3], raw, true, new Set([2])), false);
	});

	test("a selected tab of another window does not", () => {
		assert.equal(hidesWholeWindow([1, 2, 3], raw, true, new Set([9])), true);
	});

	test("one matching tab keeps it too; the filter off hides nothing", () => {
		assert.equal(hidesWholeWindow([1, 4], raw, true, new Set()), false);
		assert.equal(hidesWholeWindow([1, 2, 3], raw, false, new Set()), false);
	});

	test("a window without a tab has nothing to show", () => {
		assert.equal(hidesWholeWindow([], raw, true, new Set()), true);
	});
});

describe("saved windows with a selected tab", () => {
	const SESSIONS = [
		{ id: "s1", tabs: [{ index: 0, title: "React docs", url: "https://react.dev/" }, { index: 1, title: "Wikipedia", url: "https://en.wikipedia.org/" }] },
		{ id: "s2", tabs: [{ index: 0, title: "Gmail", url: "https://mail.google.com/" }] },
	];

	test("the saved windows that hold a selected saved tab", () => {
		const keys = new SavedTabKeys();
		const sel = new Set([keys.key("s2", 0), keys.key("s1", 1), 5]);
		assert.deepEqual([...sessionsWithSelection(sel, keys)].sort(), ["s1", "s2"]);
		assert.deepEqual([...sessionsWithSelection(new Set([5, 0]), keys)], []);
	});

	test("a search that matches in one saved window: the one with a selected tab stays", () => {
		const keys = new SavedTabKeys();
		const found = searchSaved(SESSIONS, parseQuery("react", true), false, keys);
		assert.deepEqual([...found.shown], ["s1"]);
		const gmail = keys.key("s2", 0);
		const shown = shownWithSelection(found.shown, new Set([gmail]), keys);
		assert.deepEqual([...shown].sort(), ["s1", "s2"]);
		// the tab itself still does not match: it fades
		assert.equal(found.hidden.has(gmail), true);
		assert.equal(tabShow(gmail, found.hidden, true, new Set([gmail])), "faded");
		// the match counts of the header are the search's own
		assert.equal(found.windows, 1);
		assert.equal(found.tabs, 1);
	});

	test("the same with the window's other tab selected: that window had a match anyway", () => {
		const keys = new SavedTabKeys();
		const found = searchSaved(SESSIONS, parseQuery("react", true), false, keys);
		const wiki = keys.key("s1", 1);
		assert.deepEqual([...shownWithSelection(found.shown, new Set([wiki]), keys)], ["s1"]);
		assert.equal(tabShow(wiki, found.hidden, true, new Set([wiki])), "faded");
	});

	test("open tab ids in the selection add no saved window; the set it gets is not changed", () => {
		const keys = new SavedTabKeys();
		const found = searchSaved(SESSIONS, parseQuery("react", true), false, keys);
		const out = shownWithSelection(found.shown, new Set([3]), keys);
		assert.deepEqual([...out], ["s1"]);
		assert.notEqual(out, found.shown);
		assert.deepEqual([...found.shown], ["s1"]);
	});

	test("the signature names the selected saved tabs only, in a fixed order", () => {
		const keys = new SavedTabKeys();
		const a = keys.key("s1", 0), b = keys.key("s1", 1);
		assert.equal(savedSelectionSignature(new Set([b, a, 4])), savedSelectionSignature(new Set([a, 7, b])));
		assert.notEqual(savedSelectionSignature(new Set([a])), savedSelectionSignature(new Set([a, b])));
		assert.equal(savedSelectionSignature(new Set([4, 5])), "");
	});
});
