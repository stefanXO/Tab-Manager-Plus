"use strict";

// Unit tests for switching saved windows on for profiles upgraded from 6.x
// (src/helpers/sessionsUpgrade.ts).
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { storedBefore7, mayHoldOldSessionsDefault, upgradeSessionsFeature } from "../src/helpers/sessionsUpgrade.ts";

describe("storedBefore7", () => {
	test("6.x and 5.x versions are before 7", () => {
		assert.equal(storedBefore7("6.0.0"), true);
		assert.equal(storedBefore7("6.2.1"), true);
		assert.equal(storedBefore7("5.3.0"), true);
	});
	test("7.0.0 and later are not", () => {
		assert.equal(storedBefore7("7.0.0"), false);
		assert.equal(storedBefore7("7.1.2"), false);
		assert.equal(storedBefore7("10.0.0"), false);
	});
	test("no stored version counts as older", () => {
		assert.equal(storedBefore7(undefined), true);
		assert.equal(storedBefore7(""), true);
		assert.equal(storedBefore7(6), true);
		assert.equal(storedBefore7("garbage"), true);
	});
});

describe("upgradeSessionsFeature", () => {
	test("6.x wrote false and no saved window is stored: switched on", () => {
		assert.equal(upgradeSessionsFeature("6.0.0", false, undefined), true);
		assert.equal(upgradeSessionsFeature("6.0.0", false, {}), true);
	});
	test("false next to saved windows is a deliberate off: kept", () => {
		assert.equal(upgradeSessionsFeature("6.0.0", false, { a: { id: "a", tabs: [] } }), false);
	});
	test("only on the first run after 6.x: a false stored by 7.x is kept", () => {
		assert.equal(upgradeSessionsFeature("7.0.0", false, {}), false);
		assert.equal(mayHoldOldSessionsDefault("7.0.0", false), false);
	});
	test("true, or nothing stored, needs no change", () => {
		assert.equal(upgradeSessionsFeature("6.0.0", true, {}), false);
		assert.equal(upgradeSessionsFeature("6.0.0", undefined, {}), false);
		assert.equal(mayHoldOldSessionsDefault("6.0.0", true), false);
	});
});
