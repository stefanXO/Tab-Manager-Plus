"use strict";

// Unit tests for src/popup/searchPicks.ts: a new search replaces only what an
// earlier search selected; the tabs selected by hand stay selected.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { SearchPicks, searchSelects, searchSelectsSaved, searchTab, keptByHand } from "../src/popup/searchPicks.ts";
import { SavedTabKeys } from "../src/popup/sessionKeys.ts";

// one search pass over the open tabs `ids`, `matches` being the ones it matches
function search(selection : Set<number>, picks : SearchPicks, ids : number[], matches : number[], scopeOnly = false) {
	const selects = searchSelects(selection, scopeOnly);
	for (const id of ids) searchTab(selection, picks, id, matches.includes(id), selects);
}
const sorted = (s : Set<number>) => [...s].sort((a, b) => a - b);
const TABS = [1, 2, 3, 4, 5];

describe("a search selects its matches", () => {
	test("the matches are selected, nothing else", () => {
		const selection = new Set<number>();
		const picks = new SearchPicks();
		search(selection, picks, TABS, [1, 3]);
		assert.deepEqual(sorted(selection), [1, 3]);
		assert.equal(keptByHand(selection, picks), false);
	});

	test("a new search replaces what the last one selected", () => {
		const selection = new Set<number>();
		const picks = new SearchPicks();
		search(selection, picks, TABS, [1, 3]);
		search(selection, picks, TABS, [3, 4]);
		assert.deepEqual(sorted(selection), [3, 4]);
	});

	test("clearing the search takes back what it selected", () => {
		const selection = new Set<number>();
		const picks = new SearchPicks();
		search(selection, picks, TABS, [1, 3]);
		picks.unpickAll(selection);
		assert.deepEqual(sorted(selection), []);
	});
});

describe("tabs selected by hand stay selected", () => {
	test("a tab Ctrl+clicked after the search stays when the next search does not match it", () => {
		const selection = new Set<number>();
		const picks = new SearchPicks();
		search(selection, picks, TABS, [1, 3]);
		// Ctrl+click on 2 (a non-match)
		picks.touch(2);
		selection.add(2);
		search(selection, picks, TABS, [3, 4]);
		assert.deepEqual(sorted(selection), [2, 3, 4]);
		assert.equal(keptByHand(selection, picks), true);
	});

	test("a tab selected before the search stays, matching or not", () => {
		const selection = new Set([2, 3]);
		const picks = new SearchPicks();
		search(selection, picks, TABS, [3, 4]);
		assert.deepEqual(sorted(selection), [2, 3, 4]);
		// 3 was the user's before it matched: still theirs when it stops matching
		search(selection, picks, TABS, [4]);
		assert.deepEqual(sorted(selection), [2, 3, 4]);
		search(selection, picks, TABS, [1]);
		assert.deepEqual(sorted(selection), [1, 2, 3]);
	});

	test("a match the user deselected is selected again by the next search, as before", () => {
		const selection = new Set<number>();
		const picks = new SearchPicks();
		search(selection, picks, TABS, [1, 3]);
		picks.touch(3);
		selection.delete(3);
		search(selection, picks, TABS, [1, 3, 4]);
		assert.deepEqual(sorted(selection), [1, 3, 4]);
	});

	test("a search-selected tab the user touched becomes theirs: it stays when it stops matching", () => {
		const selection = new Set<number>();
		const picks = new SearchPicks();
		search(selection, picks, TABS, [1, 3]);
		// a Shift range over 1..3 selects 2 and touches 1 and 3
		for (const id of [1, 2, 3]) { picks.touch(id); selection.add(id); }
		search(selection, picks, TABS, [5]);
		assert.deepEqual(sorted(selection), [1, 2, 3, 5]);
	});

	test("clearing the search keeps the tabs selected by hand", () => {
		const selection = new Set([2]);
		const picks = new SearchPicks();
		search(selection, picks, TABS, [1, 3]);
		picks.unpickAll(selection);
		assert.deepEqual(sorted(selection), [2]);
	});

	test("clear forgets what the search selected (the selection itself went)", () => {
		const selection = new Set<number>();
		const picks = new SearchPicks();
		search(selection, picks, TABS, [1, 3]);
		selection.clear();
		picks.clear();
		selection.add(1);
		search(selection, picks, TABS, [3]);
		// 1 is now a tab the user selected
		assert.deepEqual(sorted(selection), [1, 3]);
	});

	test("tabs outside the pass (a search within Highlight Duplicates) are left alone", () => {
		const selection = new Set<number>();
		const picks = new SearchPicks();
		search(selection, picks, TABS, [1, 5]);
		search(selection, picks, [1, 2, 3], [2]);
		assert.deepEqual(sorted(selection), [2, 5]);
	});
});

describe("a bare -s: and selected saved tabs", () => {
	test("a bare -s: selects nothing and takes back what the last search selected", () => {
		const selection = new Set([2]);
		const picks = new SearchPicks();
		search(selection, picks, TABS, [1, 3]);
		search(selection, picks, TABS, TABS, true);
		assert.deepEqual(sorted(selection), [2]);
	});

	test("selected saved tabs stay, and the search then selects no open tab", () => {
		const keys = new SavedTabKeys();
		const saved = keys.key("s1", 0);
		const selection = new Set([saved]);
		const picks = new SearchPicks();
		assert.equal(searchSelects(selection, false), false);
		search(selection, picks, TABS, [1, 3]);
		assert.deepEqual([...selection], [saved]);
		assert.equal(keptByHand(selection, picks), true);
	});

	test("searchSelects: open tabs or nothing selected, not a bare -s:", () => {
		assert.equal(searchSelects(new Set(), false), true);
		assert.equal(searchSelects(new Set([4]), false), true);
		assert.equal(searchSelects(new Set(), true), false);
	});
});

// One whole pass as runSearch does it: earlier saved picks leave, the open tabs
// are searched, and the saved matches are selected when no open tab matched.
function searchBoth(selection : Set<number>, picks : SearchPicks, matches : number[], savedMatches : number[], scopeOnly = false) {
	picks.unpickSaved(selection);
	search(selection, picks, TABS, matches, scopeOnly);
	if (searchSelectsSaved(selection, matches.length, scopeOnly)) for (const key of savedMatches) picks.pick(selection, key);
}

describe("saved tabs are selected when no open tab matches", () => {
	const keys = new SavedTabKeys();
	const a = keys.key("s1", 0), b = keys.key("s1", 1);

	test("open and saved matches: only the open ones are selected", () => {
		const selection = new Set<number>();
		const picks = new SearchPicks();
		searchBoth(selection, picks, [2, 4], [a, b]);
		assert.deepEqual(sorted(selection), [2, 4]);
	});

	test("only saved matches: those are selected, and Enter has them alone", () => {
		const selection = new Set<number>();
		const picks = new SearchPicks();
		searchBoth(selection, picks, [], [a, b]);
		assert.deepEqual(sorted(selection), [b, a]);
		assert.equal(keptByHand(selection, picks), false);
	});

	test("typing on until open tabs match: the saved picks leave, the open matches come in", () => {
		const selection = new Set<number>();
		const picks = new SearchPicks();
		searchBoth(selection, picks, [], [a]);
		searchBoth(selection, picks, [3], [a]);
		assert.deepEqual(sorted(selection), [3]);
		searchBoth(selection, picks, [], [b]);
		assert.deepEqual(sorted(selection), [b]);
		picks.unpickAll(selection);
		assert.equal(selection.size, 0);
	});

	test("an open tab selected by hand: no saved tab is selected", () => {
		const selection = new Set<number>([5]);
		const picks = new SearchPicks();
		searchBoth(selection, picks, [], [a]);
		assert.deepEqual(sorted(selection), [5]);
	});

	test("a saved tab selected by hand: saved matches join it, open matches do not", () => {
		const selection = new Set<number>([b]);
		const picks = new SearchPicks();
		searchBoth(selection, picks, [], [a]);
		assert.deepEqual(sorted(selection), [b, a]);
		searchBoth(selection, picks, [1], [a]);
		assert.deepEqual(sorted(selection), [b]);
	});

	test("a bare s: or -s: selects nothing", () => {
		const selection = new Set<number>();
		const picks = new SearchPicks();
		searchBoth(selection, picks, [], [a, b], true);
		assert.equal(selection.size, 0);
		assert.equal(searchSelectsSaved(new Set(), 0, true), false);
	});
});
