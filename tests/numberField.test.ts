"use strict";

// Unit tests for the options' number fields: what typed text stores, what
// leaving the field settles on, and the fallback for a bad stored value
// (src/popup/numberField.ts).

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { typedNumber, settledNumber, finiteOr, boundsOf } from "../src/popup/numberField.ts";

describe("typedNumber: only a whole number reaches the setting", () => {
	test("numbers, with spaces around, negative too", () => {
		assert.equal(typedNumber("15"), 15);
		assert.equal(typedNumber(" 450 "), 450);
		assert.equal(typedNumber("-3"), -3);
		assert.equal(typedNumber("0"), 0);
	});
	test("an emptied field, a lone minus, letters and decimals are drafts", () => {
		assert.equal(typedNumber(""), null);
		assert.equal(typedNumber("-"), null);
		assert.equal(typedNumber("abc"), null);
		assert.equal(typedNumber("1e3"), null);
		assert.equal(typedNumber("4.5"), null);
	});
});

describe("settledNumber: leaving the field", () => {
	test("a number inside the bounds stays", () => {
		assert.equal(settledNumber("600", 800, { min: 450, max: 800 }), 600);
		assert.equal(settledNumber("15", 0, { min: 0 }), 15);
	});
	test("outside the bounds it is clamped", () => {
		assert.equal(settledNumber("20", 800, { min: 450, max: 800 }), 450);
		assert.equal(settledNumber("9999", 800, { min: 450, max: 800 }), 800);
		assert.equal(settledNumber("-5", 0, { min: 0 }), 0);
	});
	test("no number goes back to the current value", () => {
		assert.equal(settledNumber("", 600, { min: 450, max: 800 }), 600);
		assert.equal(settledNumber("-", 15, { min: 0 }), 15);
	});
});

describe("finiteOr and boundsOf", () => {
	test("a finite number stays, anything else falls back", () => {
		assert.equal(finiteOr(25, 0), 25);
		assert.equal(finiteOr(NaN, 0), 0);
		assert.equal(finiteOr(null, 800), 800);
		assert.equal(finiteOr("600", 800), 800);
		assert.equal(finiteOr(undefined, 600), 600);
	});
	test("bounds from the input attributes", () => {
		assert.deepEqual(boundsOf("450", "800"), { min: 450, max: 800 });
		assert.deepEqual(boundsOf("0", undefined), { min: 0 });
		assert.deepEqual(boundsOf(undefined, ""), {});
	});
});
