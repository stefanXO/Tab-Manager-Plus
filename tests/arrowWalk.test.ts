"use strict";

// Unit tests for where the arrow keys move the keyboard cursor and what
// Shift+arrow adds to the selection (src/popup/arrowWalk.ts).
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { arrowWalk, walkStart, arrowStep, cursorStep } from "../src/popup/arrowWalk.ts";

// three windows on screen, the tabs the arrows visit in each
const W = [[1, 2, 3], [4, 5], [6, 7, 8, 9]];

describe("arrowWalk", () => {
	test("Left / Right walk the tabs and Up / Down the windows, except in List", () => {
		assert.deepEqual([37, 38, 39, 40].map((k) => arrowWalk(k, false)), ["prev", "prevWindow", "next", "nextWindow"]);
	});
	test("in List the tabs run down the page: Up / Down walk the tabs, Left / Right the windows", () => {
		assert.deepEqual([37, 38, 39, 40].map((k) => arrowWalk(k, true)), ["prevWindow", "prev", "nextWindow", "next"]);
	});
	test("other keys are no walk", () => {
		assert.equal(arrowWalk(32, false), null);
		assert.equal(arrowWalk(13, true), null);
	});
});

describe("walkStart", () => {
	test("the first candidate on the walk: the cursor before the last selected tab and the active tab", () => {
		assert.equal(walkStart(W, [5, 2, 7]), 5);
		assert.equal(walkStart(W, [0, 2, 7]), 2);
		assert.equal(walkStart(W, [0, 0, 7]), 7);
	});
	test("candidates the arrows do not visit (hidden, gone) are passed over", () => {
		assert.equal(walkStart(W, [42, 43, 8]), 8);
	});
	test("none on the walk: 0", () => {
		assert.equal(walkStart(W, [0, 0, 0]), 0);
		assert.equal(walkStart(W, [42]), 0);
		assert.equal(walkStart([], [1]), 0);
	});
});

describe("arrowStep: along the tabs", () => {
	test("next and previous tab, across windows", () => {
		assert.equal(arrowStep(W, 1, "next"), 2);
		assert.equal(arrowStep(W, 3, "next"), 4);
		assert.equal(arrowStep(W, 4, "prev"), 3);
		assert.equal(arrowStep(W, 7, "prev"), 6);
	});
	test("wraps around at both ends", () => {
		assert.equal(arrowStep(W, 9, "next"), 1);
		assert.equal(arrowStep(W, 1, "prev"), 9);
	});
	test("one tab on screen stays where it is", () => {
		assert.equal(arrowStep([[5]], 5, "next"), 5);
		assert.equal(arrowStep([[5]], 5, "prev"), 5);
	});
});

describe("arrowStep: along the windows", () => {
	test("to the tab at the same place in the next / previous window", () => {
		assert.equal(arrowStep(W, 2, "nextWindow"), 5);
		assert.equal(arrowStep(W, 5, "nextWindow"), 7);
		assert.equal(arrowStep(W, 7, "prevWindow"), 5);
	});
	test("a shorter window: its last tab", () => {
		assert.equal(arrowStep(W, 3, "nextWindow"), 5);
		assert.equal(arrowStep(W, 9, "prevWindow"), 5);
	});
	test("wraps around: from the last window to the first and back", () => {
		assert.equal(arrowStep(W, 8, "nextWindow"), 3);
		assert.equal(arrowStep(W, 2, "prevWindow"), 7);
	});
	test("one window: the same tab", () => {
		assert.equal(arrowStep([[1, 2]], 2, "nextWindow"), 2);
	});
});

describe("arrowStep: edge cases", () => {
	test("nothing to start from: Right and Down reach the first tab, Left the last, Up the last window's first", () => {
		assert.equal(arrowStep(W, 0, "next"), 1);
		assert.equal(arrowStep(W, 0, "nextWindow"), 1);
		assert.equal(arrowStep(W, 0, "prev"), 9);
		assert.equal(arrowStep(W, 0, "prevWindow"), 6);
	});
	test("a start the arrows do not visit counts as none", () => {
		assert.equal(arrowStep(W, 42, "next"), 1);
	});
	test("windows with no tab to visit are passed over, both ways", () => {
		const gaps = [[1, 2], [], [3]];
		assert.equal(arrowStep(gaps, 2, "nextWindow"), 3);
		assert.equal(arrowStep(gaps, 3, "prevWindow"), 1);
		assert.equal(arrowStep(gaps, 2, "next"), 3);
		assert.equal(arrowStep([[], [4]], 0, "prevWindow"), 4);
	});
	test("no tab on screen: 0", () => {
		assert.equal(arrowStep([], 1, "next"), 0);
		assert.equal(arrowStep([[], []], 0, "prevWindow"), 0);
	});
});

describe("cursorStep", () => {
	test("a plain arrow adds nothing to the selection", () => {
		assert.deepEqual(cursorStep(true, 1, 2, false), []);
		assert.deepEqual(cursorStep(false, 1, 2, false), []);
	});
	test("Shift with nothing selected takes the tab it started from and the one it lands on", () => {
		assert.deepEqual(cursorStep(true, 1, 2, true), [1, 2]);
	});
	test("Shift with a selection adds the tab it lands on only", () => {
		assert.deepEqual(cursorStep(false, 1, 2, true), [2]);
	});
	test("Shift with nothing to start from, or landing where it started: the one tab", () => {
		assert.deepEqual(cursorStep(true, 0, 2, true), [2]);
		assert.deepEqual(cursorStep(true, 5, 5, true), [5]);
	});
	test("no tab landed on: nothing", () => {
		assert.deepEqual(cursorStep(true, 1, 0, true), []);
	});
});
