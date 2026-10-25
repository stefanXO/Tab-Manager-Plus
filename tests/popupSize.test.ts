"use strict";

// Unit tests for clampPopupSize in src/helpers/popup_size.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { clampPopupSize, fitPopupSize } from "../src/helpers/popup_size.ts";

test("the stored size stays in the options' range", () => {
	assert.deepEqual(clampPopupSize(8, 600), { width: 450, height: 600 });
	assert.deepEqual(clampPopupSize(1000, 900), { width: 800, height: 600 });
	assert.deepEqual(clampPopupSize(600, 100), { width: 600, height: 400 });
});


test("the popup fits a real viewport without changing the requested size", () => {
	assert.deepEqual(fitPopupSize({ width: 800, height: 600 }, { width: 533.8, height: 421.4 }), { width: 533, height: 421 });
	assert.deepEqual(fitPopupSize({ width: 450, height: 400 }, { width: 300, height: 350 }), { width: 300, height: 350 });
});

test("the popup ignores Chrome's temporary 25px sizing pass", () => {
	assert.deepEqual(fitPopupSize({ width: 800, height: 600 }, { width: 25, height: 25 }), { width: 800, height: 600 });
});
