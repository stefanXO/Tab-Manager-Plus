"use strict";

// Unit tests for src/popup/screen.ts: TabManager.checkKey only lets Enter and
// the arrow keys act on windows while the main screen is up.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { onMainScreen } from "../src/popup/screen.ts";

describe("onMainScreen", () => {
	test("the window list is the main screen", () => {
		assert.equal(onMainScreen({ optionsActive: false, colorsActive: 0 }), true);
	});

	test("the options screen is not (Enter must not open a window there)", () => {
		assert.equal(onMainScreen({ optionsActive: true, colorsActive: 0 }), false);
	});

	test("the window name / colour overlay is not", () => {
		assert.equal(onMainScreen({ optionsActive: false, colorsActive: 42 }), false);
	});

	test("both at once is not", () => {
		assert.equal(onMainScreen({ optionsActive: true, colorsActive: 42 }), false);
	});
});

describe("onMainScreen with the saved window overlay", () => {
	test("the overlay on a saved window is not the main screen", () => {
		assert.equal(onMainScreen({ optionsActive: false, colorsActive: 0, colorsSession: "s1" }), false);
	});
	test("closed it is", () => {
		assert.equal(onMainScreen({ optionsActive: false, colorsActive: 0, colorsSession: "" }), true);
	});
});
