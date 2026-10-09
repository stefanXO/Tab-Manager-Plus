"use strict";

// Unit tests for recentTabs / recentSpan / recentText / recentTitle in src/popup/recent.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { recentTabs, recentText, recentTitle, recentSpan, RECENT_WINDOWS, RECENT_MIN, RECENT_LEVELS } from "../src/popup/recent.ts";
import type { RecentCandidate } from "../src/popup/recent.ts";

const NOW = Date.parse("2030-06-01T12:00:00.000Z");
const MIN = 60e3, HOUR = 60 * MIN, DAY = 24 * HOUR;

// tabs with ids 1.. used `ages[i]` ms before NOW (null: no lastAccessed)
function tabs(ages : (number | null)[]) : RecentCandidate[] {
	return ages.map((a, i) => (a === null ? { id: i + 1 } : { id: i + 1, lastAccessed: NOW - a }));
}
const sorted = (ids : number[]) => [...ids].sort((a, b) => a - b);

describe("constants", () => {
	test("windows 15 min .. 4 weeks, at least 2 tabs, 3 levels", () => {
		assert.deepEqual(RECENT_WINDOWS, [15 * MIN, HOUR, 3 * HOUR, 12 * HOUR, DAY, 2 * DAY, 7 * DAY, 28 * DAY]);
		assert.equal(RECENT_MIN, 2);
		assert.equal(RECENT_LEVELS, 3);
	});
});

describe("recentTabs: level 1, the smallest window with several tabs", () => {
	test("tabs from minutes, hours and days ago: only the last minutes", () => {
		const r = recentTabs(tabs([0, 2 * MIN, 3 * HOUR, 5 * HOUR, 6 * DAY]), NOW);
		assert.deepEqual(sorted(r.ids), [1, 2]);
		assert.equal(recentText(r), "2 tabs active in the last 15 minutes");
	});

	test("only one tab in 15 minutes: the next window", () => {
		const r = recentTabs(tabs([0, 40 * MIN, 2 * HOUR, 2 * DAY]), NOW);
		assert.deepEqual(sorted(r.ids), [1, 2]);
		assert.equal(r.span, "hour");
	});

	test("a window's edge is inside it", () => {
		assert.equal(recentTabs(tabs([0, 15 * MIN, 2 * HOUR]), NOW).count, 2);
		assert.equal(recentTabs(tabs([0, 15 * MIN + 1, 2 * HOUR]), NOW).span, "hour");
	});

	test("the level defaults to 1", () => {
		const list = tabs([0, 1 * MIN, 3 * HOUR, 2 * DAY]);
		assert.deepEqual(recentTabs(list, NOW), recentTabs(list, NOW, 1));
	});

	test("the harness fixture: the two tabs used in the last 15 minutes", () => {
		const ages = [0, 12 * MIN, 95 * MIN, 4 * HOUR, 2 * DAY, 30 * MIN, 6 * DAY, 3 * HOUR, 9 * DAY,
			25 * MIN, 40 * MIN, 45 * MIN, 20 * HOUR, 5 * HOUR, 26 * HOUR, 2 * DAY, 12 * DAY,
			3 * HOUR, 7 * HOUR, 2 * DAY, 3 * DAY, 14 * DAY, 10 * HOUR];
		assert.equal(recentText(recentTabs(tabs(ages), NOW, 1)), "2 tabs active in the last 15 minutes");
		assert.equal(recentText(recentTabs(tabs(ages), NOW, 2)), "6 tabs active in the last hour");
		assert.equal(recentText(recentTabs(tabs(ages), NOW, 3)), "9 tabs active in the last 3 hours");
	});
});

describe("recentTabs: levels 2 and 3 skip the windows before", () => {
	const ages = [0, 1 * MIN, 90 * MIN, 2 * HOUR, 3 * HOUR, 2 * DAY, 20 * DAY];

	test("level 2: the next window that adds tabs (the hour adds none)", () => {
		const r = recentTabs(tabs(ages), NOW, 2);
		assert.deepEqual(sorted(r.ids), [1, 2, 3, 4, 5]);
		assert.equal(r.span, "3 hours");
	});

	test("level 3: the one after that adds tabs (12 hours and a day add none)", () => {
		const r = recentTabs(tabs(ages), NOW, 3);
		assert.deepEqual(sorted(r.ids), [1, 2, 3, 4, 5, 6]);
		assert.equal(recentText(r), "6 tabs active in the last 2 days");
	});

	test("windows that add nothing are skipped", () => {
		const list = tabs([0, 1 * MIN, 2 * DAY - 10 * MIN, 2 * DAY - 5 * MIN, 20 * DAY]);
		const r = recentTabs(list, NOW, 2);
		assert.equal(r.span, "2 days");
		assert.equal(r.count, 4);
		assert.equal(recentTabs(list, NOW, 3).span, "4 weeks");
	});

	test("each level is a superset of the one before", () => {
		for (let i = 0; i < 200; i++) {
			const list = tabs(Array.from({ length: 1 + (i % 40) }, (_, k) => ((k * 7919 + i * 104729) % 1000) / 1000 * 10 * DAY));
			let before : number[] = [];
			for (let level = 1; level <= RECENT_LEVELS; level++) {
				const ids = recentTabs(list, NOW, level).ids;
				for (const id of before) assert.ok(ids.includes(id));
				before = ids;
			}
		}
	});

	test("no more windows: a level stays at the last one", () => {
		const list = tabs([0, 1 * MIN, 2 * MIN]);
		assert.deepEqual(recentTabs(list, NOW, 3), recentTabs(list, NOW, 1));
	});

	test("levels out of range are clamped", () => {
		assert.deepEqual(recentTabs(tabs(ages), NOW, 0), recentTabs(tabs(ages), NOW, 1));
		assert.deepEqual(recentTabs(tabs(ages), NOW, 9), recentTabs(tabs(ages), NOW, 3));
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

	test("a single tab: it, in the largest window", () => {
		const r = recentTabs(tabs([3 * HOUR]), NOW);
		assert.deepEqual(r.ids, [1]);
		assert.equal(recentText(r), "1 tab active in the last 4 weeks");
	});

	test("never older than the largest window", () => {
		assert.deepEqual(recentTabs(tabs([0, 40 * DAY]), NOW, 3).ids, [1]);
		assert.deepEqual(recentTabs(tabs([40 * DAY, 50 * DAY]), NOW).ids, []);
	});

	test("tabs without lastAccessed or id are skipped", () => {
		assert.deepEqual(sorted(recentTabs(tabs([null, 1 * MIN, null, 3 * MIN]), NOW).ids), [2, 4]);
		assert.deepEqual(recentTabs([{ lastAccessed: NOW }, { id: 2, lastAccessed: NOW }, { id: 3, lastAccessed: NOW }], NOW).ids, [2, 3]);
	});

	test("a timestamp in the future counts as age 0", () => {
		const r = recentTabs(tabs([-5 * MIN, 0, 1 * MIN]), NOW);
		assert.equal(r.count, 3);
		assert.equal(r.span, "15 minutes");
	});

	test("the order of the input does not matter", () => {
		const list = tabs([25 * MIN, 2 * DAY, 2 * MIN, null, 9 * MIN, 2 * MIN]);
		const a = recentTabs(list, NOW);
		assert.deepEqual(sorted(a.ids), [3, 5, 6]);
		assert.deepEqual(sorted(recentTabs([...list].reverse(), NOW).ids), sorted(a.ids));
	});

	test("accepts any iterable (a Map's values)", () => {
		const m = new Map(tabs([0, 0, 0]).map((t) => [t.id, t]));
		assert.equal(recentTabs(m.values(), NOW).count, 3);
	});
});

describe("recentSpan", () => {
	const table : [number, string][] = [
		[0, "5 minutes"], [5 * MIN, "5 minutes"], [15 * MIN, "15 minutes"], [HOUR, "hour"], [3 * HOUR, "3 hours"], [12 * HOUR, "12 hours"],
		[DAY, "day"], [2 * DAY, "2 days"], [7 * DAY, "7 days"], [14 * DAY + 1, "3 weeks"], [28 * DAY, "4 weeks"],
		[56 * DAY + 1, "2 months"],
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

describe("recentTitle: the button's tooltip lists every level", () => {
	const list = tabs([0, 1 * MIN, 40 * MIN, 2 * HOUR, 2 * DAY]);
	const levels = ["2 tabs active in the last 15 minutes", "3 tabs active in the last hour", "4 tabs active in the last 3 hours"];
	// the three levels, each followed by its mark
	const title = (marks : string[]) => levels.map((l, i) => l + marks[i]).join("\n");

	test("off: the first click marked", () => {
		assert.equal(recentTitle(list, NOW, 0),
			"Highlight recently active tabs\n" + title([" (next click)", "", ""]));
	});

	test("on: the level shown and the next click marked", () => {
		assert.equal(recentTitle(list, NOW, 1),
			"Highlight more recently active tabs\n" + title([" (shown)", " (next click)", ""]));
		assert.equal(recentTitle(list, NOW, 2),
			"Highlight more recently active tabs\n" + title(["", " (shown)", " (next click)"]));
	});

	test("the last level: the next click clears", () => {
		assert.equal(recentTitle(list, NOW, 3),
			"Clear highlighted tabs\n" + title(["", "", " (shown)"]));
	});

	test("levels that select the same tabs are one line", () => {
		const few = tabs([0, 1 * MIN, 2 * MIN]);
		assert.equal(recentTitle(few, NOW, 0), "Highlight recently active tabs\n3 tabs active in the last 15 minutes (next click)");
		assert.equal(recentTitle(few, NOW, 3), "Clear highlighted tabs\n3 tabs active in the last 15 minutes (shown)");
	});

	test("no tabs", () => {
		assert.equal(recentTitle([], NOW, 0), "Highlight recently active tabs\nNo recently active tabs");
	});

	test("takes an iterator, read once", () => {
		assert.equal(recentTitle(list.values(), NOW, 0), recentTitle(list, NOW, 0));
	});
});
