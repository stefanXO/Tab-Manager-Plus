"use strict";

// Unit tests for renaming and recolouring saved windows in src/popup/sessionEdit.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { editSession, editableName } from "../src/popup/sessionEdit.ts";

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
