"use strict";

// Unit tests for renaming and recolouring saved windows in src/popup/sessionEdit.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { editSession, editableName, shownSavedName } from "../src/popup/sessionEdit.ts";

const tabs = [
	{ url: "https://github.com/a/b", title: "a" },
	{ url: "https://github.com/c/d", title: "b" },
	{ url: "https://github.com/e/f", title: "c" },
	{ url: "https://github.com/g/h", title: "d" }
];
const make = (over = {}) => ({ id: "s1", name: "Old name", color: "color4", customName: true, date: 5, tabs, windowsInfo: { id: 9 }, ...over });
const stored = () => ({ s1: make(), s2: make({ id: "s2", name: "Other" }) });

describe("editSession", () => {
	test("writes name, colour and customName for that window only", () => {
		const before = stored();
		const next = editSession(before, "s1", { name: "Taxes", color: "color7" })!;
		assert.equal(next.s1.name, "Taxes");
		assert.equal(next.s1.color, "color7");
		assert.equal(next.s1.customName, true);
		assert.deepEqual(next.s2, before.s2);
	});

	test("keeps tabs, date and geometry", () => {
		const next = editSession(stored(), "s1", { name: "X", color: "color1" })!;
		assert.equal(next.s1.date, 5);
		assert.equal(next.s1.tabs, tabs);
		assert.deepEqual(next.s1.windowsInfo, { id: 9 });
	});

	test("does not change its input", () => {
		const before = stored();
		editSession(before, "s1", { name: "Taxes", color: "color7" });
		assert.deepEqual(before, stored());
	});

	test("an empty or blank name goes back to the automatic name", () => {
		for (const name of ["", "   "]) {
			const next = editSession(stored(), "s1", { name, color: "color4" })!;
			assert.equal(next.s1.customName, false);
			assert.equal(next.s1.name, "GitHub");
		}
	});

	test("the name is trimmed", () => {
		const next = editSession(stored(), "s1", { name: "  Taxes ", color: "color4" })!;
		assert.equal(next.s1.name, "Taxes");
	});

	test("no colour means the default colour", () => {
		assert.equal(editSession(stored(), "s1", { name: "A", color: "" })!.s1.color, "default");
	});

	test("a window without nameable tabs keeps its old name when cleared", () => {
		const s = { s1: make({ tabs: [] }) };
		const next = editSession(s, "s1", { name: "", color: "default" })!;
		assert.equal(next.s1.name, "Old name");
		assert.equal(next.s1.customName, false);
	});

	test("an unknown window is null: nothing to write", () => {
		assert.equal(editSession(stored(), "nope", { name: "A", color: "default" }), null);
	});
});

describe("editableName", () => {
	test("a custom name opens in the field", () => {
		assert.equal(editableName({ name: "Taxes", customName: true }), "Taxes");
	});
	test("an automatic name stays a placeholder", () => {
		assert.equal(editableName({ name: "GitHub", customName: false }), "");
	});
});

describe("names that are not text (an imported file)", () => {
	const tabs = [{ url: "https://github.com/a", title: 42 as any }];
	test("shownSavedName is always text", () => {
		for (const name of [{ text: "Work" }, ["a"], 42, null, undefined] as any[]) {
			assert.equal(typeof shownSavedName({ name, customName: true, tabs }, false), "string");
			assert.equal(typeof shownSavedName({ name, customName: true, tabs: [] }, false), "string");
		}
		assert.equal(shownSavedName({ name: { text: "Work" } as any, customName: true, tabs }, false), "GitHub");
	});
	test("editableName is always text", () => {
		assert.equal(editableName({ name: { text: "Work" } as any, customName: true }), "");
	});
});

describe("shownSavedName", () => {
	const five = [
		{ url: "https://github.com/a" }, { url: "https://github.com/b" }, { url: "https://github.com/c" },
		{ url: "https://github.com/d" }, { url: "https://github.com/e" }
	];
	const mixed = [
		{ url: "https://github.com/a" }, { url: "https://www.reddit.com/b" },
		{ url: "https://www.wikipedia.org/c" }, { url: "https://news.ycombinator.com/d" }
	];

	test("a name the user gave is shown as stored, compact or not", () => {
		const s = { name: "Taxes", customName: true, tabs: five };
		assert.equal(shownSavedName(s, false), "Taxes");
		assert.equal(shownSavedName(s, true), "Taxes");
	});

	test("without a custom name: the automatic name from the tabs, not the stored one", () => {
		const s = { name: "Stale old name", customName: false, tabs: five };
		assert.equal(shownSavedName(s, false), "GitHub");
	});

	test("compact mode shortens the automatic name as for an open window", () => {
		const s = { name: "x", customName: false, tabs: mixed };
		const full = shownSavedName(s, false);
		assert.match(full, / & \d+ more$/);
		assert.equal(shownSavedName(s, true), full.replace(/ & (\d+) more$/, " + $1"));
	});

	test("customName true but an empty name counts as no custom name", () => {
		assert.equal(shownSavedName({ name: "", customName: true, tabs: five }, false), "GitHub");
	});

	test("no usable tabs: the stored name stays", () => {
		assert.equal(shownSavedName({ name: "Kept", customName: false, tabs: [] }, false), "Kept");
	});
});
