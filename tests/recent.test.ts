"use strict";

// Unit tests for recentTabs / recentSpan / recentText in src/popup/recent.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { recentTabs, recentText, recentSpan, RECENT_RATIO, RECENT_FLOOR, RECENT_MIN, RECENT_MAX_AGE } from "../src/popup/recent.ts";
import type { RecentCandidate } from "../src/popup/recent.ts";

const NOW = Date.parse("2030-06-01T12:00:00.000Z");
const MIN = 60e3, HOUR = 60 * MIN, DAY = 24 * HOUR;

// tabs with ids 1.. used `ages[i]` ms before NOW (null: no lastAccessed)
function tabs(ages : (number | null)[]) : RecentCandidate[] {
	return ages.map((a, i) => (a === null ? { id: i + 1 } : { id: i + 1, lastAccessed: NOW - a }));
}
const sorted = (ids : number[]) => [...ids].sort((a, b) => a - b);

describe("constants", () => {
	test("ratio 3, floor 10 min, min 3, max age 7 days", () => {
		assert.equal(RECENT_RATIO, 3);
		assert.equal(RECENT_FLOOR, 10 * MIN);
		assert.equal(RECENT_MIN, 3);
		assert.equal(RECENT_MAX_AGE, 7 * DAY);
	});
});

describe("recentTabs: gap clustering", () => {
	test("the user's example: 2, 2, 9, 25 min and 2 days -> the four", () => {
		const r = recentTabs(tabs([2 * MIN, 2 * MIN, 9 * MIN, 25 * MIN, 2 * DAY]), NOW);
		assert.deepEqual(sorted(r.ids), [1, 2, 3, 4]);
		assert.equal(r.count, 4);
		assert.equal(r.span, "30 minutes");
		assert.equal(recentText(r), "4 tabs active in the last 30 minutes");
	});

	test("stops at a gap once it has three", () => {
		// 30 min -> 100 min: 100 > max(90, 40)
		const r = recentTabs(tabs([1 * MIN, 5 * MIN, 30 * MIN, 100 * MIN, 105 * MIN]), NOW);
		assert.deepEqual(sorted(r.ids), [1, 2, 3]);
	});

	test("the floor: two tabs active now (age 0) and one 8 min ago", () => {
		const r = recentTabs(tabs([0, 0, 8 * MIN, 3 * HOUR]), NOW);
		assert.deepEqual(sorted(r.ids), [1, 2, 3]);
		assert.equal(r.span, "10 minutes");
	});

	test("just past the floor is a gap (with three already in)", () => {
		const r = recentTabs(tabs([0, 0, 0, 10 * MIN + 1]), NOW);
		assert.equal(r.count, 3);
		const s = recentTabs(tabs([0, 0, 0, 10 * MIN]), NOW);
		assert.equal(s.count, 4);
	});

	test("fewer than three: jumps a gap, then the gap rule again", () => {
		const r = recentTabs(tabs([2 * MIN, 2 * DAY, 2 * DAY + 5 * MIN, 6.5 * DAY]), NOW);
		assert.deepEqual(sorted(r.ids), [1, 2, 3]);
		assert.equal(r.span, "3 days");
	});

	test("after a jump the chain may go on past three", () => {
		const r = recentTabs(tabs([1 * MIN, 3 * DAY, 4 * DAY, 5 * DAY]), NOW);
		assert.equal(r.count, 4);
	});

	test("never older than 7 days, even to reach three", () => {
		const r = recentTabs(tabs([1 * MIN, 8 * DAY, 30 * DAY]), NOW);
		assert.deepEqual(r.ids, [1]);
		assert.equal(r.span, "5 minutes");
		const e = recentTabs(tabs([7 * DAY, 7 * DAY + 1]), NOW);
		assert.deepEqual(e.ids, [1]);
	});

	test("a continuous chain of 60 one-minute steps: all 60", () => {
		const r = recentTabs(tabs(Array.from({ length: 60 }, (_, i) => i * MIN)), NOW);
		assert.equal(r.count, 60);
		assert.equal(r.span, "hour");
	});

	test("a single tab", () => {
		const r = recentTabs(tabs([3 * HOUR]), NOW);
		assert.deepEqual(r.ids, [1]);
		assert.equal(recentText(r), "1 tab active in the last 3 hours");
	});

	test("the harness fixture: an even spread chains to 6 days", () => {
		const ages = [0, 12 * MIN, 95 * MIN, 4 * HOUR, 2 * DAY, 30 * MIN, 6 * DAY, 3 * HOUR, 9 * DAY,
			25 * MIN, 40 * MIN, 45 * MIN, 20 * HOUR, 5 * HOUR, 26 * HOUR, 2 * DAY, 12 * DAY,
			3 * HOUR, 7 * HOUR, 2 * DAY, 3 * DAY, 14 * DAY, 10 * HOUR];
		const r = recentTabs(tabs(ages), NOW);
		assert.equal(r.count, 20);
		assert.equal(recentText(r), "20 tabs active in the last 6 days");
	});
});

describe("recentTabs: edges", () => {
	test("empty input", () => {
		assert.deepEqual(recentTabs([], NOW), { ids: [], count: 0, span: null });
	});

	test("none with lastAccessed (or 0): nothing", () => {
		assert.deepEqual(recentTabs([...tabs([null, null]), { id: 9, lastAccessed: 0 }], NOW), { ids: [], count: 0, span: null });
		assert.equal(recentText(recentTabs(tabs([null]), NOW)), "No recently active tabs");
	});

	test("tabs without lastAccessed are skipped, not chained over", () => {
		const r = recentTabs(tabs([null, 1 * MIN, null, 3 * MIN, 4 * MIN]), NOW);
		assert.deepEqual(sorted(r.ids), [2, 4, 5]);
	});

	test("tabs without an id are skipped", () => {
		const r = recentTabs([{ lastAccessed: NOW }, { id: 2, lastAccessed: NOW }], NOW);
		assert.deepEqual(r.ids, [2]);
	});

	test("a timestamp in the future counts as age 0", () => {
		const r = recentTabs(tabs([-5 * MIN, 0, 1 * MIN]), NOW);
		assert.equal(r.count, 3);
		assert.equal(r.span, "5 minutes");
	});

	test("the order of the input does not matter", () => {
		const list = tabs([25 * MIN, 2 * DAY, 2 * MIN, null, 9 * MIN, 2 * MIN]);
		const a = recentTabs(list, NOW);
		const b = recentTabs([...list].reverse(), NOW);
		const c = recentTabs([list[4], list[1], list[5], list[0], list[3], list[2]], NOW);
		assert.deepEqual(sorted(a.ids), [1, 3, 5, 6]);
		assert.deepEqual(sorted(b.ids), sorted(a.ids));
		assert.deepEqual(sorted(c.ids), sorted(a.ids));
		assert.equal(a.span, b.span);
	});

	test("accepts any iterable (a Map's values)", () => {
		const m = new Map(tabs([0, 0, 0]).map((t) => [t.id, t]));
		assert.equal(recentTabs(m.values(), NOW).count, 3);
	});
});

describe("recentSpan: the oldest age rounded up", () => {
	const table : [number, string][] = [
		[0, "5 minutes"], [5 * MIN, "5 minutes"], [5 * MIN + 1, "10 minutes"], [10 * MIN, "10 minutes"],
		[11 * MIN, "15 minutes"], [15 * MIN, "15 minutes"], [16 * MIN, "30 minutes"], [30 * MIN, "30 minutes"],
		[31 * MIN, "hour"], [HOUR, "hour"], [HOUR + 1, "2 hours"], [2 * HOUR, "2 hours"], [5.5 * HOUR, "6 hours"],
		[12 * HOUR, "12 hours"], [12 * HOUR + 1, "day"], [DAY, "day"], [DAY + 1, "2 days"], [6.2 * DAY, "7 days"], [7 * DAY, "7 days"],
	];
	for (const [age, span] of table) {
		test(age + " ms -> " + span, () => assert.equal(recentSpan(age), span));
	}
});

describe("recentText", () => {
	test("plural, singular, nothing", () => {
		assert.equal(recentText({ ids: [1, 2], count: 2, span: "hour" }), "2 tabs active in the last hour");
		assert.equal(recentText({ ids: [1], count: 1, span: "day" }), "1 tab active in the last day");
		assert.equal(recentText({ ids: [], count: 0, span: null }), "No recently active tabs");
	});
});
