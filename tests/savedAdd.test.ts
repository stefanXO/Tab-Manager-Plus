"use strict";

// Unit tests for adding open tabs to a saved window (src/popup/savedAdd.ts).
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { addOpenTabs, savedCopy, addedText, isOpenTabDrag, OPEN_TAB_DRAG } from "../src/popup/savedAdd.ts";
import type { AddableTab } from "../src/popup/savedAdd.ts";
import { remapSavedKeys, renumberedIndex } from "../src/popup/savedMove.ts";
import { SavedTabKeys } from "../src/popup/sessionKeys.ts";

interface T { index? : number, url : string, title? : string, pinned? : boolean, favIconUrl? : string, active? : boolean }
interface W { id : string, name : string, tabs : T[], order? : number, incognito? : boolean, windowsInfo? : { incognito? : boolean } }

const win = (id : string, urls : string[], extra : Partial<W> = {}) : W =>
	({ id, name: id.toUpperCase(), tabs: urls.map((url, index) => ({ index, url })), windowsInfo: {}, ...extra });
// s1: a b c, s2: d e
const store = () : Record<string, W> => ({ s1: win("s1", ["a", "b", "c"], { order: 0 }), s2: win("s2", ["d", "e"], { order: 1 }) });
const urls = (stored : Record<string, W>, id : string) => stored[id].tabs.map((t) => t.url).join(" ");
const indexes = (stored : Record<string, W>, id : string) => stored[id].tabs.map((t) => t.index);
const open = (url : string, extra : Partial<AddableTab> = {}) : AddableTab => ({ index: 0, windowId: 1, url, title: url.toUpperCase(), ...extra });

describe("addOpenTabs: where the copies go", () => {
	test("before a saved tab", () => {
		const r = addOpenTabs(store(), [open("x")], { sessionId: "s1", index: 1, before: true })!;
		assert.equal(urls(r.stored, "s1"), "a x b c");
		assert.deepEqual(indexes(r.stored, "s1"), [0, 1, 2, 3]);
		assert.equal(r.count, 1);
		assert.equal(r.skipped, 0);
	});

	test("after a saved tab", () => {
		const r = addOpenTabs(store(), [open("x")], { sessionId: "s1", index: 1, before: false })!;
		assert.equal(urls(r.stored, "s1"), "a b x c");
	});

	test("after the last tab, and on the card: at the end, nothing renumbered", () => {
		const after = addOpenTabs(store(), [open("x")], { sessionId: "s1", index: 2, before: false })!;
		const card = addOpenTabs(store(), [open("x")], { sessionId: "s1", before: false })!;
		assert.equal(urls(after.stored, "s1"), "a b c x");
		assert.equal(urls(card.stored, "s1"), "a b c x");
		assert.deepEqual(card.moves, []);
		assert.equal(card.stored.s1.tabs[3].index, 3);
	});

	test("before the first tab: every saved tab moves up one", () => {
		const r = addOpenTabs(store(), [open("x")], { sessionId: "s1", index: 0, before: true })!;
		assert.equal(urls(r.stored, "s1"), "x a b c");
		assert.deepEqual(r.moves, [
			{ from: { sessionId: "s1", index: 0 }, to: { sessionId: "s1", index: 1 } },
			{ from: { sessionId: "s1", index: 1 }, to: { sessionId: "s1", index: 2 } },
			{ from: { sessionId: "s1", index: 2 }, to: { sessionId: "s1", index: 3 } }
		]);
	});

	test("indexes with gaps are closed, and the moves say so", () => {
		const s = store();
		s.s1.tabs = [{ index: 0, url: "a" }, { index: 4, url: "b" }, { index: 7, url: "c" }];
		const r = addOpenTabs(s, [open("x")], { sessionId: "s1", index: 4, before: false })!;
		assert.equal(urls(r.stored, "s1"), "a b x c");
		assert.deepEqual(indexes(r.stored, "s1"), [0, 1, 2, 3]);
		assert.deepEqual(r.moves.map((m) => [m.from.index, m.to.index]), [[4, 1], [7, 3]]);
	});

	test("several tabs go in the order the popup lists them", () => {
		const tabs = [open("w2b", { windowId: 2, index: 5 }), open("w1", { windowId: 1, index: 3 }), open("w2a", { windowId: 2, index: 1 }), open("w9", { windowId: 9, index: 0 })];
		const r = addOpenTabs(store(), tabs, { sessionId: "s2", before: false }, { windowOrder: [1, 2] })!;
		assert.equal(urls(r.stored, "s2"), "d e w1 w2a w2b w9");
		assert.equal(r.count, 4);
	});
});

describe("addOpenTabs: the copies", () => {
	test("keep url, title, pinned and favicon; never active", () => {
		const r = addOpenTabs(store(), [open("x", { pinned: true, favIconUrl: "/f.png", title: "Ex", windowId: 3, index: 9 })], { sessionId: "s1", before: false })!;
		const copy = r.stored.s1.tabs[3];
		assert.deepEqual(copy, { index: 3, url: "x", title: "Ex", pinned: true, favIconUrl: "/f.png", active: false, highlighted: false, incognito: false });
	});

	test("an open tab still loading is saved by its pending address", () => {
		assert.equal(savedCopy({ index: 0, pendingUrl: "https://p/" }, false)!.url, "https://p/");
	});

	test("no title: the address stands in", () => {
		assert.equal(savedCopy({ index: 0, url: "https://u/" }, false)!.title, "https://u/");
	});

	test("open tabs without an address are left out and counted", () => {
		const r = addOpenTabs(store(), [open(""), open("x")], { sessionId: "s1", before: false })!;
		assert.equal(urls(r.stored, "s1"), "a b c x");
		assert.equal(r.count, 1);
		assert.equal(r.skipped, 1);
	});

	test("Firefox leaves out about: pages but keeps about:blank", () => {
		const r = addOpenTabs(store(), [open("about:preferences"), open("about:blank")], { sessionId: "s1", before: false }, { firefox: true })!;
		assert.equal(urls(r.stored, "s1"), "a b c about:blank");
		assert.equal(r.skipped, 1);
		assert.equal(addOpenTabs(store(), [open("about:preferences")], { sessionId: "s1", before: false }, { firefox: true }), null);
		assert.ok(addOpenTabs(store(), [open("about:preferences")], { sessionId: "s1", before: false }));
	});

	test("a copy into a private saved window is private", () => {
		const s = store();
		s.s2.incognito = true;
		const r = addOpenTabs(s, [open("x", { incognito: true })], { sessionId: "s2", before: false })!;
		assert.equal((r.stored.s2.tabs[2] as T & { incognito : boolean }).incognito, true);
	});
});

describe("addOpenTabs: nothing to do", () => {
	test("unknown saved window, unknown tab, no tabs", () => {
		assert.equal(addOpenTabs(store(), [open("x")], { sessionId: "nope", before: false }), null);
		assert.equal(addOpenTabs(store(), [open("x")], { sessionId: "s1", index: 9, before: false }), null);
		assert.equal(addOpenTabs(store(), [], { sessionId: "s1", before: false }), null);
	});

	test("private tabs never go into a normal saved window, nor the other way round", () => {
		assert.equal(addOpenTabs(store(), [open("x"), open("y", { incognito: true })], { sessionId: "s1", before: false }), null);
		const s = store();
		s.s2.windowsInfo = { incognito: true };
		assert.equal(addOpenTabs(s, [open("x")], { sessionId: "s2", before: false }), null);
		assert.ok(addOpenTabs(s, [open("x", { incognito: true })], { sessionId: "s2", before: false }));
	});
});

describe("addOpenTabs: the rest of the store", () => {
	test("other windows, other fields and the keys' order are kept; the input is not changed", () => {
		const s = store();
		const before = JSON.stringify(s);
		const r = addOpenTabs(s, [open("x")], { sessionId: "s1", index: 0, before: true })!;
		assert.equal(JSON.stringify(s), before);
		assert.equal(r.stored.s2, s.s2);
		assert.deepEqual(Object.keys(r.stored), ["s1", "s2"]);
		assert.equal(r.stored.s1.name, "S1");
		assert.equal(r.stored.s1.order, 0);
	});

	test("junk entries are left alone", () => {
		const s = { junk: 5, ...store() } as unknown as Record<string, W>;
		const r = addOpenTabs(s, [open("x")], { sessionId: "s2", before: false })!;
		assert.equal((r.stored as Record<string, unknown>).junk, 5);
		assert.deepEqual(Object.keys(r.stored), ["junk", "s1", "s2"]);
	});
});

describe("addOpenTabs with the selection and pending deletes", () => {
	test("a selected saved tab stays selected at its new number", () => {
		const keys = new SavedTabKeys();
		const selection = new Set([keys.key("s1", 1)]);
		const r = addOpenTabs(store(), [open("x")], { sessionId: "s1", index: 0, before: true })!;
		assert.equal(remapSavedKeys(selection, r.moves, keys), true);
		assert.deepEqual([...selection], [keys.key("s1", 2)]);
	});

	test("a pending delete follows its tab", () => {
		const r = addOpenTabs(store(), [open("x"), open("y", { index: 1 })], { sessionId: "s1", index: 1, before: true })!;
		const to = renumberedIndex(r.moves);
		assert.equal(to("s1", 0), 0);
		assert.equal(to("s1", 1), 3);
		assert.equal(to("s1", 2), 4);
		assert.equal(to("s2", 1), 1);
	});
});

describe("addedText / isOpenTabDrag", () => {
	test("the header", () => {
		assert.deepEqual(addedText(1, 0, "Tax 2029"), { topText: "Added 1 tab to “Tax 2029”", bottomText: "The open tab stays open" });
		assert.deepEqual(addedText(2, 0, "Tax 2029"), { topText: "Added 2 tabs to “Tax 2029”", bottomText: "The open tabs stay open" });
		assert.deepEqual(addedText(1, 1, ""), { topText: "Added 1 tab to the saved window", bottomText: "The open tabs stay open; 1 tab could not be saved" });
		assert.equal(addedText(1, 3, "A").bottomText, "The open tabs stay open; 3 tabs could not be saved");
	});

	test("the drag type", () => {
		assert.equal(isOpenTabDrag([OPEN_TAB_DRAG, "Text"]), true);
		assert.equal(isOpenTabDrag(["Text", "text/uri-list"]), false);
		assert.equal(isOpenTabDrag(null), false);
	});
});
