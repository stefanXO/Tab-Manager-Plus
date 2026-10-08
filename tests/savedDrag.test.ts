"use strict";

// Unit tests for dragging saved tabs into an open window: which saved tabs a
// drag takes and what the popup asks for (src/popup/savedDrag.ts), and how the
// worker opens them (src/helpers/openTabs.ts).
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { draggedSaved, savedTabsToOpen, openableSaved, openedText } from "../src/popup/savedDrag.ts";
import { SavedTabKeys } from "../src/popup/sessionKeys.ts";
import { createData, openTabsAt } from "../src/helpers/openTabs.ts";
import type { IOpenCreate, IOpenCreated, ISavedTabOpen } from "../src/helpers/openTabs.ts";

const tab = (index : number, url : string, pinned = false) => ({ index, url, pinned });
const sessions = [
	{ id: "s1", tabs: [tab(0, "https://a.test/", true), tab(1, "https://b.test/"), tab(2, "https://c.test/"), tab(3, "https://d.test/")] },
	{ id: "s2", tabs: [tab(0, "https://e.test/"), tab(1, "https://f.test/")] },
];

describe("draggedSaved", () => {
	test("an unselected saved tab: only it, whatever is selected", () => {
		const keys = new SavedTabKeys();
		const a = keys.key("s1", 0), b = keys.key("s1", 1);
		assert.deepEqual(draggedSaved(a, new Set([b])), [a]);
		assert.deepEqual(draggedSaved(a, new Set()), [a]);
	});

	test("a selected saved tab: every selected saved tab", () => {
		const keys = new SavedTabKeys();
		const a = keys.key("s1", 0), b = keys.key("s1", 2), c = keys.key("s2", 1);
		assert.deepEqual(draggedSaved(b, new Set([a, b, c])), [a, b, c]);
	});

	test("open tab ids in the selection are not taken", () => {
		const keys = new SavedTabKeys();
		const a = keys.key("s1", 0);
		assert.deepEqual(draggedSaved(a, new Set([5, a, 0])), [a]);
	});

	test("with \"Hide non-matching tabs\" on, selected tabs the search hides stay out", () => {
		const keys = new SavedTabKeys();
		const a = keys.key("s1", 0), b = keys.key("s1", 2), c = keys.key("s2", 1);
		assert.deepEqual(draggedSaved(b, new Set([a, b, c]), new Set([a])), [b, c]);
		// the dragged one is on screen: it goes even if the set names it
		assert.deepEqual(draggedSaved(b, new Set([a, b]), new Set([a, b])), [b]);
		// not selected: only it, as before
		assert.deepEqual(draggedSaved(a, new Set([b, c]), new Set([b])), [a]);
	});

	test("an open tab gives nothing", () => {
		assert.deepEqual(draggedSaved(4, new Set([4])), []);
		assert.deepEqual(draggedSaved(-1, new Set()), []);
	});

	test("the selection is not changed", () => {
		const keys = new SavedTabKeys();
		const a = keys.key("s1", 0), b = keys.key("s1", 1);
		const sel = new Set([b]);
		draggedSaved(a, sel);
		assert.deepEqual([...sel], [b]);
	});
});

describe("savedTabsToOpen", () => {
	test("url and pinned of the dragged tab", () => {
		const keys = new SavedTabKeys();
		assert.deepEqual(savedTabsToOpen([keys.key("s1", 0)], sessions, keys), [{ url: "https://a.test/", pinned: true }]);
	});

	test("in the order shown, not the order selected", () => {
		const keys = new SavedTabKeys();
		const picked = [keys.key("s2", 1), keys.key("s1", 3), keys.key("s1", 1)];
		assert.deepEqual(savedTabsToOpen(picked, sessions, keys).map((t) => t.url), ["https://b.test/", "https://d.test/", "https://f.test/"]);
	});

	test("saved windows that are not shown (deleted, pending delete) give nothing", () => {
		const keys = new SavedTabKeys();
		const picked = [keys.key("s9", 0), keys.key("s1", 7), keys.key("s2", 0)];
		assert.deepEqual(savedTabsToOpen(picked, sessions, keys).map((t) => t.url), ["https://e.test/"]);
	});

	test("open ids and unknown keys are ignored", () => {
		const keys = new SavedTabKeys();
		assert.deepEqual(savedTabsToOpen([3, -1, -50], sessions, keys), []);
	});

	test("a tab without an address is left out, pendingUrl counts", () => {
		const keys = new SavedTabKeys();
		const odd = [{ id: "x", tabs: [{ index: 0 }, { index: 1, pendingUrl: "https://p.test/" }] }];
		assert.deepEqual(savedTabsToOpen([keys.key("x", 0), keys.key("x", 1)], odd, keys), [{ url: "https://p.test/", pinned: false }]);
	});

	test("a stored window with two tabs at one index opens both", () => {
		const keys = new SavedTabKeys();
		const dup = [{ id: "d", tabs: [tab(0, "https://one.test/"), tab(0, "https://two.test/")] }];
		assert.deepEqual(savedTabsToOpen([keys.key("d", 0)], dup, keys).length, 2);
	});
});

describe("openableSaved: what cannot open", () => {
	test("everything there: nothing gone, nothing blank", () => {
		const keys = new SavedTabKeys();
		const r = openableSaved([keys.key("s1", 0), keys.key("s2", 1)], sessions, keys);
		assert.equal(r.tabs.length, 2);
		assert.deepEqual(r.keys, [keys.key("s1", 0), keys.key("s2", 1)]);
		assert.equal(r.gone, 0);
		assert.equal(r.blank, 0);
	});

	test("a saved window or a saved tab that is gone is counted", () => {
		const keys = new SavedTabKeys();
		const picked = [keys.key("s9", 0), keys.key("s1", 7), keys.key("s2", 0)];
		const r = openableSaved(picked, sessions, keys);
		assert.deepEqual(r.tabs.map((t) => t.url), ["https://e.test/"]);
		// only the key of the tab that opens: the gone ones stay selected
		assert.deepEqual(r.keys, [keys.key("s2", 0)]);
		assert.equal(r.gone, 2);
		assert.equal(r.blank, 0);
	});

	test("a tab without an address is counted as blank, not as gone", () => {
		const keys = new SavedTabKeys();
		const odd = [{ id: "x", tabs: [{ index: 0 }, { index: 1, url: "https://ok.test/" }] }];
		const r = openableSaved([keys.key("x", 0), keys.key("x", 1)], odd, keys);
		assert.deepEqual(r, { tabs: [{ url: "https://ok.test/", pinned: false }], keys: [keys.key("x", 1)], gone: 0, blank: 1 });
	});

	test("the same key twice counts once; open ids are no saved tabs", () => {
		const keys = new SavedTabKeys();
		const a = keys.key("s9", 0);
		assert.deepEqual(openableSaved([a, a, 3, -1], sessions, keys), { tabs: [], keys: [], gone: 1, blank: 0 });
	});

	test("the keys follow the shown order, whatever order they were asked in", () => {
		const keys = new SavedTabKeys();
		const r = openableSaved([keys.key("s2", 0), keys.key("s1", 1)], sessions, keys);
		assert.deepEqual(r.keys, [keys.key("s1", 1), keys.key("s2", 0)]);
	});

	test("nothing asked: nothing", () => {
		assert.deepEqual(openableSaved([], sessions, new SavedTabKeys()), { tabs: [], keys: [], gone: 0, blank: 0 });
	});
});

describe("openedText", () => {
	test("one tab, with the window's name", () => {
		assert.deepEqual(openedText(1, "Research"), { topText: "Opened 1 saved tab in “Research”", bottomText: "The saved window keeps it" });
	});

	test("several, no name", () => {
		assert.deepEqual(openedText(3, ""), { topText: "Opened 3 saved tabs", bottomText: "The saved window keeps them" });
	});

	test("none opened", () => {
		assert.equal(openedText(0, "Research").topText, "Could not open the saved tabs");
	});
});

describe("createData", () => {
	const t : ISavedTabOpen = { url: "https://a.test/", pinned: true };

	test("window, index, url, pinned, in the background", () => {
		assert.deepEqual(createData(t, 7, 3, false), { windowId: 7, index: 3, url: "https://a.test/", pinned: true, active: false });
	});

	test("no index: none passed (the end of the window)", () => {
		assert.equal("index" in createData(t, 7, undefined, false), false);
	});

	test("Firefox: about: pages open as a new tab, about:blank stays", () => {
		assert.equal(createData({ url: "about:config", pinned: false }, 1, 0, true).url, undefined);
		assert.equal(createData({ url: "about:blank", pinned: false }, 1, 0, true).url, "about:blank");
		assert.equal(createData({ url: "about:config", pinned: false }, 1, 0, false).url, "about:config");
	});

	test("an empty url is not passed", () => {
		assert.equal("url" in createData({ url: "", pinned: false }, 1, 0, false), false);
	});
});

// A window as the browser keeps it: tabs.create inserts at the clamped index,
// pinned tabs before unpinned ones (a pinned tab goes to the end of the pinned
// ones at most, an unpinned one to their end at least).
function fakeWindow(start : { url : string, pinned : boolean }[]) {
	const tabs = start.map((t, i) => ({ ...t, id: i + 1 }));
	let next = 100;
	const calls : IOpenCreate[] = [];
	const create = async (data : IOpenCreate) : Promise<IOpenCreated> => {
		calls.push(data);
		const pinnedCount = tabs.filter((t) => t.pinned).length;
		let at = data.index === undefined ? tabs.length : Math.max(0, Math.min(data.index, tabs.length));
		if (data.pinned) at = Math.min(at, pinnedCount);
		else at = Math.max(at, pinnedCount);
		const made = { url: data.url || "", pinned: data.pinned, id: next++ };
		tabs.splice(at, 0, made);
		return { id: made.id, index: at };
	};
	return { tabs, calls, create, urls: () => tabs.map((t) => t.url) };
}
const open = (url : string, pinned = false) : ISavedTabOpen => ({ url, pinned });
const start = [{ url: "P", pinned: true }, { url: "A", pinned: false }, { url: "B", pinned: false }, { url: "C", pinned: false }];

describe("openTabsAt", () => {
	test("one tab at the drop position", async () => {
		const w = fakeWindow(start);
		const ids = await openTabsAt(w.create, 9, 2, [open("x")], false);
		assert.deepEqual(w.urls(), ["P", "A", "x", "B", "C"]);
		assert.deepEqual(ids, [100]);
		assert.equal(w.calls[0].windowId, 9);
	});

	test("several keep their order, one after the other", async () => {
		const w = fakeWindow(start);
		await openTabsAt(w.create, 9, 1, [open("x"), open("y"), open("z")], false);
		assert.deepEqual(w.urls(), ["P", "x", "y", "z", "A", "B", "C"]);
		assert.deepEqual(w.calls.map((c) => c.index), [1, 2, 3]);
	});

	test("no index: all at the end, in order", async () => {
		const w = fakeWindow(start);
		await openTabsAt(w.create, 9, undefined, [open("x"), open("y")], false);
		assert.deepEqual(w.urls(), ["P", "A", "B", "C", "x", "y"]);
		assert.deepEqual(w.calls.map((c) => c.index), [undefined, undefined]);
	});

	test("a pinned tab among them goes to the pinned ones, the rest stay at the drop position", async () => {
		const w = fakeWindow(start);
		await openTabsAt(w.create, 9, 3, [open("x"), open("pin", true), open("y")], false);
		assert.deepEqual(w.urls(), ["P", "pin", "A", "B", "x", "y", "C"]);
	});

	test("unpinned tabs dropped among pinned ones go right after them", async () => {
		const w = fakeWindow([{ url: "P", pinned: true }, { url: "Q", pinned: true }, { url: "A", pinned: false }]);
		await openTabsAt(w.create, 9, 1, [open("x"), open("y")], false);
		assert.deepEqual(w.urls(), ["P", "Q", "x", "y", "A"]);
	});

	test("an index past the end is clamped by the browser, order kept", async () => {
		const w = fakeWindow(start);
		await openTabsAt(w.create, 9, 40, [open("x"), open("y")], false);
		assert.deepEqual(w.urls(), ["P", "A", "B", "C", "x", "y"]);
	});

	test("a tab that fails is skipped, the others open", async () => {
		const w = fakeWindow(start);
		const create = async (data : IOpenCreate) => {
			if (data.url === "bad") throw new Error("refused");
			return w.create(data);
		};
		const errors = console.error;
		console.error = () => {};
		try {
			const ids = await openTabsAt(create, 9, 1, [open("x"), open("bad"), open("y")], false);
			assert.equal(ids.length, 2);
		} finally {
			console.error = errors;
		}
		assert.deepEqual(w.urls(), ["P", "x", "y", "A", "B", "C"]);
	});

	test("nothing to open: no call", async () => {
		const w = fakeWindow(start);
		assert.deepEqual(await openTabsAt(w.create, 9, 1, [], false), []);
		assert.equal(w.calls.length, 0);
	});

	test("every tab opens in the background", async () => {
		const w = fakeWindow(start);
		await openTabsAt(w.create, 9, 1, [open("x"), open("y", true)], false);
		assert.ok(w.calls.every((c) => c.active === false));
	});
});
