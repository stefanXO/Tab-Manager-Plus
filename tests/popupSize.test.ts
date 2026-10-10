"use strict";

// Unit tests for clampPopupSize in src/helpers/popup_size.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { clampPopupSize } from "../src/helpers/popup_size.ts";

test("the stored size stays in the options' range", () => {
	assert.deepEqual(clampPopupSize(8, 600), { width: 450, height: 600 });
	assert.deepEqual(clampPopupSize(1000, 900), { width: 800, height: 600 });
	assert.deepEqual(clampPopupSize(600, 100), { width: 600, height: 400 });
});
