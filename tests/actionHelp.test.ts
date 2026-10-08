"use strict";

// Unit tests for the action buttons' help in the hover card and its key caps
// (src/popup/actionHelp.ts).
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { actionHelp, actionCard, readKeys, deleteKeyCaps, trashKeys, newWindowKeys, themeLabel, themeHelp } from "../src/popup/actionHelp.ts";
import { undoKeyCaps } from "../src/popup/notices.ts";

describe("actionHelp (the button's attributes)", () => {
	test("the text, no keys", () => {
		assert.deepEqual(actionHelp("Open a new tab"), { "data-help": "Open a new tab" });
		assert.deepEqual(actionHelp("Pin current Tab", null), { "data-help": "Pin current Tab" });
		assert.deepEqual(actionHelp("Pin current Tab", []), { "data-help": "Pin current Tab" });
	});
	test("keys joined with +, and read back", () => {
		const help = actionHelp("Close selected tabs\nWill close 2 tabs", ["Ctrl", "Del"]);
		assert.equal(help["data-help-keys"], "Ctrl+Del");
		assert.deepEqual(readKeys(help["data-help-keys"]), ["Ctrl", "Del"]);
		assert.deepEqual(readKeys(actionHelp("x", ["⌘", "⌫"])["data-help-keys"]), ["⌘", "⌫"]);
	});
	test("no attribute, no keys", () => {
		assert.equal(readKeys(undefined), null);
		assert.equal(readKeys(null), null);
		assert.equal(readKeys(""), null);
	});
	test("no header help any more: no data-hover, no title", () => {
		const help = actionHelp("Close selected tabs\nWill close 2 tabs", ["Ctrl", "Del"]) as Record<string, string>;
		assert.equal(help["data-hover"], undefined);
		assert.equal(help["data-hover-hold"], undefined);
		assert.equal(help.title, undefined);
	});
});

describe("actionCard (what the hover card shows for a button)", () => {
	test("the name as the title, what it does as the line under it, the key caps", () => {
		const help = actionHelp("Close selected tabs\nWill close 2 tabs", trashKeys(2, false));
		assert.deepEqual(actionCard(help["data-help"], help["data-help-keys"]), {
			card: { title: "Close selected tabs", lines: [{ key: "help0", text: "Will close 2 tabs" }] },
			keys: ["Ctrl", "Del"]
		});
	});
	test("the Mac's caps", () => {
		const help = actionHelp("Close selected tabs\nWill close 2 tabs", trashKeys(2, true));
		assert.deepEqual(actionCard(help["data-help"], help["data-help-keys"])!.keys, ["⌘", "⌫"]);
	});
	test("a name alone: no lines, no keys", () => {
		assert.deepEqual(actionCard("Close current Tab", undefined), { card: { title: "Close current Tab", lines: [] }, keys: null });
		assert.deepEqual(actionCard("Open a new tab\n "), { card: { title: "Open a new tab", lines: [] }, keys: null });
	});
	test("several lines (the recent tabs button): one each, blank ones left out", () => {
		const c = actionCard("Highlight recently active tabs\n6 used in the last hour (next click)\n\n12 today");
		assert.deepEqual(c!.card.lines.map((l) => l.text), ["6 used in the last hour (next click)", "12 today"]);
		assert.deepEqual(c!.card.lines.map((l) => l.key), ["help0", "help1"]);
	});
	test("the new window button: Enter", () => {
		const help = actionHelp("Open new empty window", newWindowKeys(0, false, false));
		assert.deepEqual(actionCard(help["data-help"], help["data-help-keys"])!.keys, ["Enter"]);
	});
	test("the theme button: its name, then what a click makes it", () => {
		assert.deepEqual(actionCard(themeHelp("light"))!.card, { title: "Theme: Light", lines: [{ key: "help0", text: "Click for Dark" }] });
		assert.deepEqual(actionCard(themeHelp("dark"))!.card.title, themeLabel("dark"));
	});
	test("the saved window's delete mentions Undo", () => {
		const c = actionCard("Delete this saved window\nWill delete 3 tabs. Undo is possible for a few seconds");
		assert.match(c!.card.lines[0].text, /Undo/);
	});
	test("no help: no card", () => {
		assert.equal(actionCard(undefined), null);
		assert.equal(actionCard(null), null);
		assert.equal(actionCard(""), null);
	});
});

describe("the trash button: Ctrl+Delete, Cmd+Backspace on a Mac", () => {
	test("caps per platform; the Mac's ⌘ as the Undo notice draws it", () => {
		assert.deepEqual(deleteKeyCaps(false), ["Ctrl", "Del"]);
		assert.deepEqual(deleteKeyCaps(true), ["⌘", "⌫"]);
		assert.equal(deleteKeyCaps(true)[0], undoKeyCaps(true)[0]);
		assert.equal(deleteKeyCaps(false)[0], undoKeyCaps(false)[0]);
	});
	test("with a selection (open or saved tabs) the keys do what the button does", () => {
		assert.deepEqual(trashKeys(1, false), ["Ctrl", "Del"]);
		assert.deepEqual(trashKeys(5, true), ["⌘", "⌫"]);
	});
	test("nothing selected: the button closes the current tab, the keys nothing", () => {
		assert.equal(trashKeys(0, false), null);
		assert.equal(trashKeys(0, true), null);
	});
});

describe("the new window button: Enter", () => {
	test("open tabs selected: Enter moves them (or switches to the one), as the button", () => {
		assert.deepEqual(newWindowKeys(3, false, false), ["Enter"]);
		assert.deepEqual(newWindowKeys(1, false, false), ["Enter"]);
		assert.deepEqual(newWindowKeys(2, false, true), ["Enter"]);
	});
	test("nothing selected, no search: Enter opens an empty window, as the button", () => {
		assert.deepEqual(newWindowKeys(0, false, false), ["Enter"]);
	});
	test("a search that selected nothing: Enter does nothing, the button still opens a window", () => {
		assert.equal(newWindowKeys(0, false, true), null);
	});
	test("saved tabs selected: Enter opens them, the button does nothing", () => {
		assert.equal(newWindowKeys(2, true, false), null);
		assert.equal(newWindowKeys(2, true, true), null);
	});
	test("a fresh array each time: a caller may change it", () => {
		assert.notEqual(newWindowKeys(1, false, false), newWindowKeys(1, false, false));
	});
});

describe("the theme button", () => {
	test("its name says the theme now", () => {
		assert.equal(themeLabel("system"), "Theme: System");
		assert.equal(themeLabel("light"), "Theme: Light");
		assert.equal(themeLabel("dark"), "Theme: Dark");
	});
	test("the help names the theme now (first line) and what a click makes it", () => {
		assert.equal(themeHelp("system"), "Theme: System\nIt follows the dark mode of your system. Click for Light");
		assert.equal(themeHelp("light"), "Theme: Light\nClick for Dark");
		assert.equal(themeHelp("dark"), "Theme: Dark\nClick for System, which follows the dark mode of your system");
	});
	test("two lines each: the card's title and the line under it", () => {
		for (const t of ["system", "light", "dark"] as const) {
			const lines = themeHelp(t).split("\n");
			assert.equal(lines.length, 2, t);
			assert.equal(lines[0], themeLabel(t));
		}
	});
});
