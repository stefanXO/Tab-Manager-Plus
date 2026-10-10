"use strict";

// Unit tests for the options' number fields: what typed text stores, what
// leaving the field settles on, and the fallback for a bad stored value
// (src/popup/numberField.ts).

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { typedInBounds, typedNumber, settledNumber, finiteOr, storedNumber, repairedNumbers, boundsOf } from "../src/popup/numberField.ts";

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
	test("storedNumber: a whole number as text (5.x) is that number, anything else as finiteOr", () => {
		assert.equal(storedNumber("650", 800), 650);
		assert.equal(storedNumber(" 5 ", 0), 5);
		assert.equal(storedNumber(450, 600), 450);
		assert.equal(storedNumber(null, 800), 800);
		assert.equal(storedNumber("", 800), 800);
		assert.equal(storedNumber("6.5", 800), 800);
		assert.equal(storedNumber("abc", 800), 800);
		assert.equal(storedNumber("NaN", 0), 0);
		assert.equal(storedNumber("1".repeat(400), 0), 0);
	});
	test("bounds from the input attributes", () => {
		assert.deepEqual(boundsOf("450", "800"), { min: 450, max: 800 });
		assert.deepEqual(boundsOf("0", undefined), { min: 0 });
		assert.deepEqual(boundsOf(undefined, ""), {});
	});
});

describe("typedInBounds: only a number inside the limits is applied while typing", () => {
	const b = boundsOf("300", "800");
	test("inside the bounds", () => {
		assert.equal(typedInBounds("600", b), 600);
		assert.equal(typedInBounds("300", b), 300);
		assert.equal(typedInBounds("800", b), 800);
	});
	test("below min (the 6 on the way to 600)", () => {
		assert.equal(typedInBounds("6", b), null);
		assert.equal(typedInBounds("60", b), null);
	});
	test("above max", () => {
		assert.equal(typedInBounds("801", b), null);
	});
	test("empty, minus sign, not a whole number", () => {
		assert.equal(typedInBounds("", b), null);
		assert.equal(typedInBounds("-", b), null);
		assert.equal(typedInBounds("4.5", b), null);
	});
	test("no bounds: any whole number", () => {
		assert.equal(typedInBounds("6"), 6);
		assert.equal(typedInBounds("-3", {}), -3);
		assert.equal(typedInBounds("", {}), null);
	});
	test("only a min", () => {
		assert.equal(typedInBounds("0", boundsOf("1")), null);
		assert.equal(typedInBounds("99999", boundsOf("1")), 99999);
	});
});

test("repairedNumbers: only keys stored in the wrong type, so the write happens once", () => {
	const defaults = { tabLimit: 0, tabWidth: 800, tabHeight: 600 };
	const stored : Record<string, unknown> = { tabLimit: "15", tabWidth: "650", tabHeight: null };
	assert.deepEqual(repairedNumbers(stored, defaults), { tabLimit: 15, tabWidth: 650 });
	Object.assign(stored, repairedNumbers(stored, defaults));
	assert.deepEqual(repairedNumbers(stored, defaults), {});
	const odd : Record<string, unknown> = { tabLimit: "65.5", tabWidth: "abc", tabHeight: " " };
	assert.deepEqual(repairedNumbers(odd, defaults), {});
	assert.deepEqual(repairedNumbers({ tabWidth: "900", tabHeight: "100" }, defaults, { tabWidth: { min: 450, max: 800 }, tabHeight: { min: 400, max: 600 } }), {});
	assert.deepEqual(repairedNumbers({}, defaults), {});
});
