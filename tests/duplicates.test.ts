"use strict";

// Unit tests for findDuplicates in src/popup/duplicates.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { findDuplicates } from "../src/popup/duplicates.ts";
import type { DuplicateCandidate } from "../src/popup/duplicates.ts";
import { parseQuery, matchTab, searchable } from "../src/popup/search.ts";
import { RAW_TABS, T, DUPLICATE_URL_TABS } from "./fixture.ts";

// The whole fixture, turned into findDuplicates candidates: id is the
// RAW_TABS index, url and lastAccessed carried straight through.
const CANDIDATES : DuplicateCandidate[] = RAW_TABS.map((t, i) => ({ id: i, url: t.url, lastAccessed: t.lastAccessed }));

// ---------------------------------------------------------------------------
// 1. originals/duplicates over the shared fixture
// ---------------------------------------------------------------------------
// Recap of the fixture's duplicate-url tabs (see tests/fixture.ts):
//   - astley (no lastAccessed) / astleyDup (lastAccessed: 5000) -> astleyDup wins
//   - loginIssue (none) / loginIssueDup1 (9000) / loginIssueDup2 (none) -> loginIssueDup1 wins
//   - newTab (none) / newTabDup (none) -> newTab wins (first in order, no timestamps)

describe("findDuplicates: originals and duplicates over the fixture", () => {
	test("duplicates set is exactly the expected fixture members", () => {
		const { duplicates } = findDuplicates(CANDIDATES);
		assert.deepEqual(
			[...duplicates].sort((a, b) => a - b),
			[T.loginIssue, T.astley, T.loginIssueDup2, T.newTabDup].sort((a, b) => a - b),
		);
	});

	test("originals set is exactly the expected fixture members", () => {
		const { originals } = findDuplicates(CANDIDATES);
		assert.deepEqual(
			[...originals].sort((a, b) => a - b),
			[T.newTab, T.astleyDup, T.loginIssueDup1].sort((a, b) => a - b),
		);
	});

	test("astleyDup (newer lastAccessed) is the original; astley (no lastAccessed) is the duplicate", () => {
		const { originals, duplicates } = findDuplicates(CANDIDATES);
		assert.ok(originals.has(T.astleyDup));
		assert.ok(duplicates.has(T.astley));
		assert.ok(!originals.has(T.astley));
		assert.ok(!duplicates.has(T.astleyDup));
	});

	test("loginIssueDup1 (newest lastAccessed) is the original; the other two login-issue tabs are duplicates", () => {
		const { originals, duplicates } = findDuplicates(CANDIDATES);
		assert.ok(originals.has(T.loginIssueDup1));
		assert.ok(duplicates.has(T.loginIssue));
		assert.ok(duplicates.has(T.loginIssueDup2));
	});

	test("newTab (first, neither tab has lastAccessed) is the original; newTabDup is the duplicate", () => {
		const { originals, duplicates } = findDuplicates(CANDIDATES);
		assert.ok(originals.has(T.newTab));
		assert.ok(duplicates.has(T.newTabDup));
	});

	test("originals + duplicates together are exactly DUPLICATE_URL_TABS", () => {
		const { originals, duplicates } = findDuplicates(CANDIDATES);
		const combined = [...originals, ...duplicates].sort((a, b) => a - b);
		assert.deepEqual(combined, [...DUPLICATE_URL_TABS].sort((a, b) => a - b));
	});

	test("originals and duplicates never overlap: no tab is in both sets", () => {
		const { originals, duplicates } = findDuplicates(CANDIDATES);
		for (const i of originals) assert.ok(!duplicates.has(i), `tab ${i} is in both sets`);
		for (const i of duplicates) assert.ok(!originals.has(i), `tab ${i} is in both sets`);
	});

	test("the fragment and trailing-slash near-misses are in neither set", () => {
		const { originals, duplicates } = findDuplicates(CANDIDATES);
		for (const i of [T.astleyFragment, T.redditSlash]) {
			assert.ok(!originals.has(i), `tab ${i} should not be an original`);
			assert.ok(!duplicates.has(i), `tab ${i} should not be a duplicate`);
		}
	});

	test("a url with three tabs produces exactly one original and two duplicates", () => {
		const { originals, duplicates } = findDuplicates(CANDIDATES);
		const trio = [T.loginIssue, T.loginIssueDup1, T.loginIssueDup2];
		assert.equal(trio.filter((i) => originals.has(i)).length, 1);
		assert.equal(trio.filter((i) => duplicates.has(i)).length, 2);
	});
});

// ---------------------------------------------------------------------------
// 2. lastAccessed tie-breaking semantics
// ---------------------------------------------------------------------------

describe("findDuplicates: lastAccessed tie-breaking", () => {
	test("the newest lastAccessed wins regardless of input order (astley pair, whole fixture reversed)", () => {
		const { originals, duplicates } = findDuplicates([...CANDIDATES].reverse());
		assert.ok(originals.has(T.astleyDup));
		assert.ok(duplicates.has(T.astley));
	});

	test("the newest lastAccessed wins regardless of input order (login-issue trio, whole fixture reversed)", () => {
		const { originals, duplicates } = findDuplicates([...CANDIDATES].reverse());
		assert.ok(originals.has(T.loginIssueDup1));
		assert.ok(duplicates.has(T.loginIssue));
		assert.ok(duplicates.has(T.loginIssueDup2));
	});

	test("reversed input flips the original only for the pair without any lastAccessed (newTab/newTabDup)", () => {
		const forward : DuplicateCandidate[] = [
			{ id: T.newTab, url: "" },
			{ id: T.newTabDup, url: "" },
		];
		const reversed = [...forward].reverse();
		const fwd = findDuplicates(forward);
		const rev = findDuplicates(reversed);
		assert.ok(fwd.originals.has(T.newTab) && fwd.duplicates.has(T.newTabDup));
		assert.ok(rev.originals.has(T.newTabDup) && rev.duplicates.has(T.newTab));
	});

	test("equal (non-zero) timestamps: the first tab in iteration order wins", () => {
		const tabs : DuplicateCandidate[] = [
			{ id: 100, url: "https://example.com/tie", lastAccessed: 42 },
			{ id: 101, url: "https://example.com/tie", lastAccessed: 42 },
		];
		const { originals, duplicates } = findDuplicates(tabs);
		assert.deepEqual([...originals], [100]);
		assert.deepEqual([...duplicates], [101]);
	});

	test("a tab with a timestamp beats a tab without one, regardless of order", () => {
		const noTimestampFirst : DuplicateCandidate[] = [
			{ id: 200, url: "https://example.com/beats" },
			{ id: 201, url: "https://example.com/beats", lastAccessed: 1 },
		];
		const timestampFirst : DuplicateCandidate[] = [
			{ id: 201, url: "https://example.com/beats", lastAccessed: 1 },
			{ id: 200, url: "https://example.com/beats" },
		];
		assert.deepEqual([...findDuplicates(noTimestampFirst).originals], [201]);
		assert.deepEqual([...findDuplicates(timestampFirst).originals], [201]);
	});

	test("a lastAccessed of 0 counts as absent: it does not beat an undefined lastAccessed (first wins)", () => {
		const tabs : DuplicateCandidate[] = [
			{ id: 300, url: "https://example.com/zero" }, // lastAccessed undefined
			{ id: 301, url: "https://example.com/zero", lastAccessed: 0 },
		];
		const { originals, duplicates } = findDuplicates(tabs);
		// the code does `tab.lastAccessed || 0`, so undefined and 0 compare equal (0 > 0 is false either way)
		assert.deepEqual([...originals], [300]);
		assert.deepEqual([...duplicates], [301]);
	});

	test("a lastAccessed of 0 does not beat a tab with a real, nonzero timestamp", () => {
		const tabs : DuplicateCandidate[] = [
			{ id: 400, url: "https://example.com/zero2", lastAccessed: 0 },
			{ id: 401, url: "https://example.com/zero2", lastAccessed: 1 },
		];
		assert.deepEqual([...findDuplicates(tabs).originals], [401]);
	});
});

// ---------------------------------------------------------------------------
// 3. Misc semantics: skipping, empty inputs, url normalization, mutation, sizes
// ---------------------------------------------------------------------------

describe("findDuplicates: misc semantics", () => {
	test("tabs with id undefined are skipped entirely", () => {
		const tabs : DuplicateCandidate[] = [
			{ url: "https://example.com/skip" }, // no id
			{ id: 1, url: "https://example.com/skip" },
		];
		const { originals, duplicates } = findDuplicates(tabs);
		assert.equal(originals.size, 0);
		assert.equal(duplicates.size, 0);
	});

	test("an empty list gives two empty sets", () => {
		const { originals, duplicates } = findDuplicates([]);
		assert.equal(originals.size, 0);
		assert.equal(duplicates.size, 0);
	});

	test("a list without any duplicate url gives two empty sets", () => {
		const tabs : DuplicateCandidate[] = [
			{ id: 1, url: "https://a.example.com" },
			{ id: 2, url: "https://b.example.com" },
			{ id: 3, url: "https://c.example.com" },
		];
		const { originals, duplicates } = findDuplicates(tabs);
		assert.equal(originals.size, 0);
		assert.equal(duplicates.size, 0);
	});

	test("url: undefined and url: \"\" are treated as the same key (both normalize to \"\")", () => {
		const tabs : DuplicateCandidate[] = [
			{ id: 1, url: undefined },
			{ id: 2, url: "" },
		];
		const { originals, duplicates } = findDuplicates(tabs);
		assert.deepEqual([...originals], [1]);
		assert.deepEqual([...duplicates], [2]);
	});

	test("the input is not mutated", () => {
		const tabs : DuplicateCandidate[] = CANDIDATES.map((t) => ({ ...t }));
		const snapshot = tabs.map((t) => ({ ...t }));
		findDuplicates(tabs);
		assert.deepEqual(tabs, snapshot);
	});

	test("size invariant: every url appears in originals at most once", () => {
		const { originals } = findDuplicates(CANDIDATES);
		const seenUrls = new Set<string>();
		for (const i of originals) {
			const url = RAW_TABS[i].url ?? "";
			assert.ok(!seenUrls.has(url), `url ${url} has more than one original`);
			seenUrls.add(url);
		}
	});

	test("size invariant: duplicates.size === input.length - distinctUrls (every tab has an id)", () => {
		const distinctUrls = new Set(RAW_TABS.map((t) => t.url ?? "")).size;
		const { duplicates } = findDuplicates(CANDIDATES);
		assert.equal(duplicates.size, RAW_TABS.length - distinctUrls);
	});
});

// ---------------------------------------------------------------------------
// 4. Search within duplicates, the way the popup combines the two features
// ---------------------------------------------------------------------------

describe("search within duplicates (findDuplicates + the search grammar)", () => {
	const { originals, duplicates } = findDuplicates(CANDIDATES);
	const candidateIds = [...duplicates, ...originals];

	function idsAmong(query : string) : number[] {
		const parsed = parseQuery(query);
		return candidateIds
			.filter((i) => matchTab(searchable(RAW_TABS[i].title, RAW_TABS[i].url), parsed))
			.sort((a, b) => a - b);
	}

	test("'youtube' among duplicates+originals matches only the astley pair", () => {
		assert.deepEqual(idsAmong("youtube"), [T.astley, T.astleyDup].sort((a, b) => a - b));
	});

	test("'issue #42' among duplicates+originals matches all three login-issue tabs", () => {
		assert.deepEqual(idsAmong("issue #42"), [T.loginIssue, T.loginIssueDup1, T.loginIssueDup2].sort((a, b) => a - b));
	});

	test("'reddit' among duplicates+originals matches nothing (the reddit variants are not duplicates)", () => {
		assert.deepEqual(idsAmong("reddit"), []);
	});
});
