"use strict";

// Unit tests for the options screen's export notes in src/popup/exportNotes.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { sessionsExportNote, debugExportNote } from "../src/popup/exportNotes.ts";

describe("sessionsExportNote: what Export Sessions writes", () => {
	test("saved windows and their tabs", () => {
		assert.equal(sessionsExportNote([{ tabs: [{}, {}, {}] }, { tabs: [{}] }]), "Will export 2 saved windows with 4 tabs");
	});

	test("singular", () => {
		assert.equal(sessionsExportNote([{ tabs: [{}] }]), "Will export 1 saved window with 1 tab");
	});

	test("a session without tabs counts none", () => {
		assert.equal(sessionsExportNote([{}]), "Will export 1 saved window with 0 tabs");
	});

	test("nothing saved", () => {
		assert.equal(sessionsExportNote([]), "No saved windows to export yet");
		assert.equal(sessionsExportNote(undefined), "No saved windows to export yet");
	});
});

describe("debugExportNote: what the debug file holds", () => {
	test("windows and tabs", () => {
		assert.equal(debugExportNote(3, 23), "Will export 3 windows with 23 tabs");
		assert.equal(debugExportNote(1, 1), "Will export 1 window with 1 tab");
	});

	test("no windows", () => {
		assert.equal(debugExportNote(0, 0), "No windows to export");
	});
});
