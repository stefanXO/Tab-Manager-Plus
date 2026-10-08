"use strict";

// Unit tests for what Delete, Backspace and Enter do with the selection
// (src/popup/selectionKeys.ts) and for the window Enter opens from selected
// saved tabs (src/popup/savedRestore.ts).
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { selectionKeyAction, KEY_BACKSPACE, KEY_DELETE, KEY_ENTER } from "../src/popup/selectionKeys.ts";
import type { SelectionKeyContext } from "../src/popup/selectionKeys.ts";
import { savedWindowFor } from "../src/popup/savedRestore.ts";
import { SavedTabKeys } from "../src/popup/sessionKeys.ts";

// an open tab id is >= 0, a saved tab key is below -1
const OPEN = [3, 4];
const SAVED = [-2, -3];

function ctx(over : Partial<SelectionKeyContext>) : SelectionKeyContext {
	return {
		keyCode: KEY_DELETE,
		modified: false,
		mainScreen: true,
		searchFocused: false,
		selection: new Set(OPEN),
		...over
	};
}

describe("selectionKeyAction: Delete and Backspace", () => {
	for (const keyCode of [KEY_DELETE, KEY_BACKSPACE]) {
		const name = keyCode === KEY_DELETE ? "Delete" : "Backspace";

		test(name + " with open tabs selected closes them", () => {
			assert.equal(selectionKeyAction(ctx({ keyCode })), "close-open");
		});

		test(name + " with saved tabs selected removes them from their saved windows", () => {
			assert.equal(selectionKeyAction(ctx({ keyCode, selection: new Set(SAVED) })), "delete-saved");
		});

		test(name + " in the focused search box edits the text, even when it is empty", () => {
			assert.equal(selectionKeyAction(ctx({ keyCode, searchFocused: true })), null);
			assert.equal(selectionKeyAction(ctx({ keyCode, searchFocused: true, selection: new Set(SAVED) })), null);
		});

		test(name + " acts while the search box holds text, as long as it is not focused (search, select, " + name + ")", () => {
			// the search text is not part of the decision: only the focus is
			assert.equal(selectionKeyAction(ctx({ keyCode })), "close-open");
			assert.equal(selectionKeyAction(ctx({ keyCode, selection: new Set(SAVED) })), "delete-saved");
		});

		test(name + " with nothing selected does nothing (no tab is closed)", () => {
			assert.equal(selectionKeyAction(ctx({ keyCode, selection: new Set() })), null);
		});

		test(name + " off the window list does nothing", () => {
			assert.equal(selectionKeyAction(ctx({ keyCode, mainScreen: false })), null);
		});

		test(name + " with Ctrl, Alt or Meta held is left to the browser", () => {
			assert.equal(selectionKeyAction(ctx({ keyCode, modified: true })), null);
		});
	}
});

describe("selectionKeyAction: Enter", () => {
	test("with saved tabs selected opens them", () => {
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_ENTER, selection: new Set(SAVED) })), "open-saved");
	});

	test("with saved tabs selected it also opens them from the search box, whatever it holds", () => {
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_ENTER, selection: new Set(SAVED), searchFocused: true })), "open-saved");
	});

	test("with open tabs, or nothing, selected it keeps its old meaning", () => {
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_ENTER })), null);
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_ENTER, selection: new Set() })), null);
	});

	test("off the window list it does nothing", () => {
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_ENTER, selection: new Set(SAVED), mainScreen: false })), null);
	});
});

test("other keys have no action", () => {
	for (const keyCode of [27, 32, 37, 65, 112]) {
		assert.equal(selectionKeyAction(ctx({ keyCode })), null);
		assert.equal(selectionKeyAction(ctx({ keyCode, selection: new Set(SAVED) })), null);
	}
});

describe("savedWindowFor", () => {
	const tab = (index : number, url : string, over : object = {}) => ({ index, url, pinned: false, active: false, ...over });
	const info = (over : object = {}) => ({ left: 10, top: 20, width: 800, height: 600, incognito: false, ...over });
	const sessions = [
		{ id: "s1", name: "Reading", customName: true, color: "blue", incognito: false, windowsInfo: info(), tabs: [tab(0, "https://a.test/", { active: true }), tab(1, "https://b.test/"), tab(2, "https://c.test/"), tab(3, "https://d.test/")] },
		{ id: "s2", name: "Work", customName: true, color: "red", incognito: false, windowsInfo: info({ left: 900 }), tabs: [tab(0, "https://e.test/"), tab(5, "https://f.test/")] },
	];
	const urls = (s : { tabs : { url? : string }[] } | null) => s ? s.tabs.map((t) => t.url) : null;

	test("tabs of one saved window come in the saved order, whatever the click order, renumbered, the first active", () => {
		const keys = new SavedTabKeys();
		const w = savedWindowFor([keys.key("s1", 3), keys.key("s1", 1)], sessions, keys)!;
		assert.deepEqual(urls(w), ["https://b.test/", "https://d.test/"]);
		assert.deepEqual(w.tabs.map((t) => t.index), [0, 1]);
		assert.deepEqual(w.tabs.map((t) => t.active), [true, false]);
	});

	test("one saved window keeps its name, colour and geometry", () => {
		const keys = new SavedTabKeys();
		const w = savedWindowFor([keys.key("s2", 5)], sessions, keys)!;
		assert.equal(w.id, "s2");
		assert.equal(w.name, "Work");
		assert.equal(w.customName, true);
		assert.equal(w.color, "red");
		assert.equal(w.windowsInfo.left, 900);
	});

	test("tabs of several saved windows: the shown order of windows, then their tabs", () => {
		const keys = new SavedTabKeys();
		// clicked in the opposite order
		const w = savedWindowFor([keys.key("s2", 5), keys.key("s2", 0), keys.key("s1", 2)], sessions, keys)!;
		assert.deepEqual(urls(w), ["https://c.test/", "https://e.test/", "https://f.test/"]);
		assert.deepEqual(w.tabs.map((t) => t.index), [0, 1, 2]);
	});

	test("tabs of several saved windows: first window's geometry, no name, default colour", () => {
		const keys = new SavedTabKeys();
		const w = savedWindowFor([keys.key("s1", 0), keys.key("s2", 0)], sessions, keys)!;
		assert.equal(w.windowsInfo.left, 10);
		assert.equal(w.customName, false);
		assert.equal(w.name, "");
		assert.equal(w.color, "default");
	});

	test("a private saved window makes the combined window private", () => {
		const keys = new SavedTabKeys();
		const mixed = [sessions[0], { ...sessions[1], windowsInfo: info({ incognito: true }) }];
		const w = savedWindowFor([keys.key("s1", 0), keys.key("s2", 0)], mixed, keys)!;
		assert.equal(w.windowsInfo.incognito, true);
		assert.equal(w.incognito, true);
		const one = savedWindowFor([keys.key("s1", 0), keys.key("s1", 1)], mixed, keys)!;
		assert.equal(one.windowsInfo.incognito, false);
	});

	test("the saved windows themselves are not changed", () => {
		const keys = new SavedTabKeys();
		savedWindowFor([keys.key("s1", 1), keys.key("s1", 3)], sessions, keys);
		assert.deepEqual(sessions[0].tabs.map((t) => t.index), [0, 1, 2, 3]);
		assert.equal(sessions[0].tabs[0].active, true);
	});

	test("open tab ids, unknown keys and gone saved windows give nothing", () => {
		const keys = new SavedTabKeys();
		assert.equal(savedWindowFor([3, 4, -99], sessions, keys), null);
		assert.equal(savedWindowFor([keys.key("gone", 0)], sessions, keys), null);
		assert.equal(savedWindowFor([keys.key("s1", 77)], sessions, keys), null);
		assert.equal(savedWindowFor([], sessions, keys), null);
		// the ones that exist still go
		assert.deepEqual(urls(savedWindowFor([3, keys.key("gone", 0), keys.key("s1", 2)], sessions, keys)), ["https://c.test/"]);
	});
});
