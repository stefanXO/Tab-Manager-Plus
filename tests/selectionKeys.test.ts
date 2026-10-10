"use strict";

// Unit tests for what Ctrl/Cmd+Delete, Ctrl/Cmd+Backspace and Enter do with the selection
// (src/popup/selectionKeys.ts) and for the window Enter opens from selected
// saved tabs (src/popup/savedRestore.ts).
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { selectionKeyAction, deleteKeyName, arrowNavigates, KEY_BACKSPACE, KEY_DELETE, KEY_ENTER, KEY_SPACE, keyTarget } from "../src/popup/selectionKeys.ts";
import type { SelectionKeyContext } from "../src/popup/selectionKeys.ts";
import { savedWindowFor } from "../src/popup/savedRestore.ts";
import { SavedTabKeys } from "../src/popup/sessionKeys.ts";

// an open tab id is >= 0, a saved tab key is below -1
const OPEN = [3, 4];
const SAVED = [-2, -3];

function ctx(over : Partial<SelectionKeyContext>) : SelectionKeyContext {
	return {
		keyCode: KEY_DELETE,
		cmd: true,
		mainScreen: true,
		searchFocused: false,
		searchHasText: false,
		selection: new Set(OPEN),
		...over
	};
}

describe("selectionKeyAction: Ctrl/Cmd+Delete and Ctrl/Cmd+Backspace", () => {
	for (const keyCode of [KEY_DELETE, KEY_BACKSPACE]) {
		const name = "Ctrl+" + (keyCode === KEY_DELETE ? "Delete" : "Backspace");

		test(name + " with open tabs selected closes them", () => {
			assert.equal(selectionKeyAction(ctx({ keyCode })), "close-open");
		});

		test(name + " with saved tabs selected removes them from their saved windows", () => {
			assert.equal(selectionKeyAction(ctx({ keyCode, selection: new Set(SAVED) })), "delete-saved");
		});

		test(name + " in the focused search box that holds text deletes a word: nothing closes", () => {
			assert.equal(selectionKeyAction(ctx({ keyCode, searchFocused: true, searchHasText: true })), null);
			assert.equal(selectionKeyAction(ctx({ keyCode, searchFocused: true, searchHasText: true, selection: new Set(SAVED) })), null);
		});

		test(name + " acts while the search box holds text, as long as it is not focused (search, right-click, " + name + ")", () => {
			assert.equal(selectionKeyAction(ctx({ keyCode, searchHasText: true })), "close-open");
			assert.equal(selectionKeyAction(ctx({ keyCode, searchHasText: true, selection: new Set(SAVED) })), "delete-saved");
		});

		test(name + " with nothing selected does nothing (no tab is closed)", () => {
			assert.equal(selectionKeyAction(ctx({ keyCode, selection: new Set() })), null);
		});

		test(name + " off the window list does nothing", () => {
			assert.equal(selectionKeyAction(ctx({ keyCode, mainScreen: false })), null);
		});
	}

	test("Ctrl+Delete in the focused but empty search box still acts (search, select results, Ctrl+Delete)", () => {
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_DELETE, searchFocused: true })), "close-open");
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_DELETE, searchFocused: true, selection: new Set(SAVED) })), "delete-saved");
	});

	test("Ctrl+Backspace in the focused but empty search box is text editing: nothing closes (a second press after deleting the word)", () => {
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_BACKSPACE, searchFocused: true })), null);
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_BACKSPACE, searchFocused: true, selection: new Set(SAVED) })), null);
	});

	for (const keyCode of [KEY_DELETE, KEY_BACKSPACE]) {
		const name = keyCode === KEY_DELETE ? "Delete" : "Backspace";

		test("plain " + name + " never acts on the selection, saved or open, focused box or not", () => {
			for (const selection of [new Set(OPEN), new Set(SAVED)]) {
				for (const searchFocused of [false, true]) {
					for (const searchHasText of [false, true]) {
						assert.equal(selectionKeyAction(ctx({ keyCode, cmd: false, selection, searchFocused, searchHasText })), null);
					}
				}
			}
		});
	}
});

describe("deleteKeyName", () => {
	test("names the shortcut by platform", () => {
		assert.equal(deleteKeyName(false), "Ctrl+Delete");
		assert.equal(deleteKeyName(true), "Cmd+Delete");
	});
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

describe("selectionKeyAction: the keyboard cursor", () => {
	test("Space on the window list with a cursor selects or deselects the cursor tab, Ctrl+Space too", () => {
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_SPACE, cmd: false, cursor: 4, listFocused: true })), "toggle-cursor");
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_SPACE, cmd: true, cursor: 4, listFocused: true, selection: new Set() })), "toggle-cursor");
	});

	test("Space in a text field (the search box) types a space; with no cursor it keeps its old meaning", () => {
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_SPACE, cursor: 4, listFocused: false, searchFocused: true })), null);
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_SPACE, cursor: 0, listFocused: true })), null);
	});

	test("Alt+Space and Space off the window list do nothing to the selection", () => {
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_SPACE, cursor: 4, listFocused: true, alt: true })), null);
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_SPACE, cursor: 4, listFocused: true, mainScreen: false })), null);
	});

	test("Enter with nothing selected and a shown cursor switches to the cursor tab, also from the search box", () => {
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_ENTER, selection: new Set(), cursor: 4, cursorShown: true })), "switch-cursor");
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_ENTER, selection: new Set(), cursor: 4, cursorShown: true, searchFocused: true, searchHasText: true })), "switch-cursor");
	});
	test("a cursor whose ring is hidden (set by a click) does not take Enter: nothing marks the tab", () => {
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_ENTER, selection: new Set(), cursor: 4 })), null);
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_ENTER, selection: new Set(), cursor: 4, cursorShown: false })), null);
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_SPACE, cursor: 4, listFocused: true })), "toggle-cursor");
	});

	test("Enter with a selection keeps its meaning whatever the cursor; with neither, the old empty window", () => {
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_ENTER, cursor: 4 })), null);
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_ENTER, selection: new Set(SAVED), cursor: 4 })), "open-saved");
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_ENTER, selection: new Set(), cursor: 0 })), null);
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_ENTER, selection: new Set(), cursor: 4, mainScreen: false })), null);
	});

	test("Space and Enter on a focused action button press the button, also with Ctrl: never the cursor tab", () => {
		for (const cmd of [false, true]) {
			assert.equal(selectionKeyAction(ctx({ keyCode: KEY_SPACE, cmd, cursor: 4, listFocused: false, onButton: true })), null);
			assert.equal(selectionKeyAction(ctx({ keyCode: KEY_ENTER, cmd, cursor: 4, onButton: true, selection: new Set() })), null);
		}
	});

	test("Ctrl+Delete acts on the selection only, never on the cursor tab", () => {
		assert.equal(selectionKeyAction(ctx({ keyCode: KEY_DELETE, selection: new Set(), cursor: 4, listFocused: true })), null);
	});
});

describe("keyTarget", () => {
	test("text fields type: the search box, a textarea, a contenteditable", () => {
		assert.equal(keyTarget({ tagName: "INPUT", role: null, editable: false }), "text");
		assert.equal(keyTarget({ tagName: "textarea", role: null, editable: false }), "text");
		assert.equal(keyTarget({ tagName: "DIV", role: null, editable: true }), "text");
	});
	test("an action button (a div with role=button) and a native button are buttons, not the list", () => {
		assert.equal(keyTarget({ tagName: "DIV", role: "button", editable: false }), "button");
		assert.equal(keyTarget({ tagName: "BUTTON", role: null, editable: false }), "button");
	});
	test("the window list, the root and nothing focused are the list", () => {
		assert.equal(keyTarget({ tagName: "DIV", role: null, editable: false }), "list");
		assert.equal(keyTarget({ tagName: "BODY", role: null, editable: false }), "list");
		assert.equal(keyTarget(null), "list");
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

const none = {shift: false, ctrl: false, alt: false, meta: false};
const ctrl = {...none, ctrl: true};
const alt = {...none, alt: true};
const shift = {...none, shift: true};
const meta = {...none, meta: true};

describe("arrowNavigates", () => {
	test("outside a search box with text every arrow walks the tabs, with any modifier", () => {
		for (const k of [37, 38, 39, 40]) {
			assert.equal(arrowNavigates(k, none, true, false, false), true);
			assert.equal(arrowNavigates(k, shift, true, false, false), true);
			assert.equal(arrowNavigates(k, ctrl, true, false, true), true);
		}
	});
	test("in a search box with text the plain arrows and Shift edit the text", () => {
		assert.equal(arrowNavigates(39, none, true, true, false), false);
		assert.equal(arrowNavigates(39, shift, true, true, false), false);
		assert.equal(arrowNavigates(39, {...ctrl, shift: true}, true, true, false), false);
	});
	test("Ctrl+arrow walks the tabs from a search box with text, on every platform", () => {
		assert.equal(arrowNavigates(39, ctrl, true, true, false), true);
		assert.equal(arrowNavigates(39, ctrl, true, true, true), true);
	});
	test("Alt+arrow walks the tabs, except on a Mac where Option jumps by word; Cmd stays text", () => {
		assert.equal(arrowNavigates(39, alt, true, true, false), true);
		assert.equal(arrowNavigates(39, alt, true, true, true), false);
		assert.equal(arrowNavigates(39, meta, true, true, true), false);
		assert.equal(arrowNavigates(39, meta, true, true, false), false);
	});
	test("not other keys, and not off the main screen", () => {
		assert.equal(arrowNavigates(36, none, true, false, false), false);
		assert.equal(arrowNavigates(41, none, true, false, false), false);
		assert.equal(arrowNavigates(40, ctrl, false, false, false), false);
	});
});
