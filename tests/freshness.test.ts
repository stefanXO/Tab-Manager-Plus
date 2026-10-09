"use strict";

// Unit tests for freshness / tabFreshness in src/popup/freshness.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { freshness, tabFreshness, FRESH_STEPS } from "../src/popup/freshness.ts";

const NOW = Date.parse("2030-06-01T12:00:00.000Z");
const MIN = 60e3, HOUR = 60 * MIN, DAY = 24 * HOUR;

describe("freshness: levels", () => {
	test("steps are 5 min, 1 h, 1 day, 7 days", () => {
		assert.deepEqual([...FRESH_STEPS], [5 * MIN, HOUR, DAY, 7 * DAY]);
	});
	test("4 under 5 minutes", () => {
		assert.equal(freshness(0), 4);
		assert.equal(freshness(3 * MIN), 4);
		assert.equal(freshness(5 * MIN - 1), 4);
	});
	test("3 from 5 minutes to under an hour", () => {
		assert.equal(freshness(5 * MIN), 3);
		assert.equal(freshness(45 * MIN), 3);
		assert.equal(freshness(HOUR - 1), 3);
	});
	test("2 from an hour to under a day", () => {
		assert.equal(freshness(HOUR), 2);
		assert.equal(freshness(20 * HOUR), 2);
		assert.equal(freshness(DAY - 1), 2);
	});
	test("1 from a day to under a week", () => {
		assert.equal(freshness(DAY), 1);
		assert.equal(freshness(6 * DAY), 1);
		assert.equal(freshness(7 * DAY - 1), 1);
	});
	test("0 from a week on", () => {
		assert.equal(freshness(7 * DAY), 0);
		assert.equal(freshness(400 * DAY), 0);
	});
	test("a future timestamp (clock skew) counts as just used", () => {
		assert.equal(freshness(-5 * MIN), 4);
	});
	test("NaN / not a number -> 0", () => {
		assert.equal(freshness(NaN), 0);
		assert.equal(freshness(undefined as unknown as number), 0);
	});
});

describe("tabFreshness", () => {
	test("no lastAccessed -> null (no indicator)", () => {
		assert.equal(tabFreshness(undefined, NOW), null);
		assert.equal(tabFreshness(NaN, NOW), null);
		assert.equal(tabFreshness(0, NOW), null);
	});
	test("level + label from timeAgo", () => {
		assert.deepEqual(tabFreshness(NOW - 3 * MIN, NOW), { level: 4, label: "active 3 minutes ago" });
		assert.deepEqual(tabFreshness(NOW, NOW), { level: 4, label: "active just now" });
		assert.deepEqual(tabFreshness(NOW - 40 * MIN, NOW), { level: 3, label: "active 40 minutes ago" });
		assert.deepEqual(tabFreshness(NOW - 5 * HOUR, NOW), { level: 2, label: "active 5 hours ago" });
		assert.deepEqual(tabFreshness(NOW - 2 * DAY, NOW), { level: 1, label: "active 2 days ago" });
		assert.deepEqual(tabFreshness(NOW - 14 * DAY, NOW), { level: 0, label: "active 2 weeks ago" });
	});
	test("defaults to Date.now()", () => {
		const r = tabFreshness(Date.now() - 2 * MIN);
		assert.equal(r?.level, 4);
	});
});
