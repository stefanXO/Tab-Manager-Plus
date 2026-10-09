"use strict";

// Unit tests for moving saved tabs inside and between saved windows
// (src/popup/savedMove.ts), and for pending deletes following the new numbers
// (PendingDeletes.renumber in src/popup/pendingDelete.ts).
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { moveSavedTabs, remapSavedKeys, renumberedIndex, movedText } from "../src/popup/savedMove.ts";
import type { SavedTabMove } from "../src/popup/savedMove.ts";
import { SavedTabKeys } from "../src/popup/sessionKeys.ts";
import { PendingDeletes, withoutItems } from "../src/popup/pendingDelete.ts";
import type { PendingItem } from "../src/popup/pendingDelete.ts";

interface T { index? : number, url : string }
interface W { id : string, name : string, tabs : T[], order? : number, incognito? : boolean, windowsInfo? : { incognito? : boolean } }

const win = (id : string, urls : string[], extra : Partial<W> = {}) : W =>
	({ id, name: id.toUpperCase(), tabs: urls.map((url, index) => ({ index, url })), windowsInfo: {}, ...extra });
// s1: a b c d, s2: e f, listed s1 then s2
const store = () : Record<string, W> => ({ s1: win("s1", ["a", "b", "c", "d"], { order: 0 }), s2: win("s2", ["e", "f"], { order: 1 }) });
const urls = (stored : Record<string, W>, id : string) => stored[id].tabs.map((t) => t.url).join(" ");
const indexes = (stored : Record<string, W>, id : string) => stored[id].tabs.map((t) => t.index);
const ref = (sessionId : string, index : number) => ({ sessionId, index });

describe("moveSavedTabs: inside one saved window", () => {
	test("dropped before an earlier tab", () => {
		const r = moveSavedTabs(store(), [ref("s1", 3)], { sessionId: "s1", index: 1, before: true })!;
		assert.equal(urls(r.stored, "s1"), "a d b c");
		assert.deepEqual(indexes(r.stored, "s1"), [0, 1, 2, 3]);
		assert.equal(r.count, 1);
		assert.deepEqual(r.emptied, []);
	});

	test("dropped after a later tab", () => {
		const r = moveSavedTabs(store(), [ref("s1", 0)], { sessionId: "s1", index: 2, before: false })!;
		assert.equal(urls(r.stored, "s1"), "b c a d");
	});

	test("the moves list every tab whose number changed, not the others", () => {
		const r = moveSavedTabs(store(), [ref("s1", 3)], { sessionId: "s1", index: 1, before: true })!;
		assert.deepEqual(r.moves, [
			{ from: ref("s1", 3), to: ref("s1", 1) },
			{ from: ref("s1", 1), to: ref("s1", 2) },
			{ from: ref("s1", 2), to: ref("s1", 3) },
		]);
	});

	test("tabs that keep their number keep their object, the other window is untouched", () => {
		const before = store();
		const r = moveSavedTabs(before, [ref("s1", 3)], { sessionId: "s1", index: 1, before: true })!;
		assert.equal(r.stored.s1.tabs[0], before.s1.tabs[0]);
		assert.equal(r.stored.s2, before.s2);
	});

	test("nothing changes: on itself, right before the next, right after the previous", () => {
		assert.equal(moveSavedTabs(store(), [ref("s1", 1)], { sessionId: "s1", index: 1, before: true }), null);
		assert.equal(moveSavedTabs(store(), [ref("s1", 1)], { sessionId: "s1", index: 1, before: false }), null);
		assert.equal(moveSavedTabs(store(), [ref("s1", 1)], { sessionId: "s1", index: 2, before: true }), null);
		assert.equal(moveSavedTabs(store(), [ref("s1", 1)], { sessionId: "s1", index: 0, before: false }), null);
	});

	test("the last tab dropped on its own card (at the end): nothing changes", () => {
		assert.equal(moveSavedTabs(store(), [ref("s1", 3)], { sessionId: "s1", before: false }), null);
	});

	test("an earlier tab dropped on its own card goes to the end", () => {
		const r = moveSavedTabs(store(), [ref("s1", 0)], { sessionId: "s1", before: false })!;
		assert.equal(urls(r.stored, "s1"), "b c d a");
	});

	test("indexes with gaps are numbered from 0; no change in order is still no change", () => {
		const s = store();
		s.s1.tabs = [{ index: 0, url: "a" }, { index: 4, url: "b" }, { index: 7, url: "c" }];
		assert.equal(moveSavedTabs(s, [ref("s1", 4)], { sessionId: "s1", index: 7, before: true }), null);
		const r = moveSavedTabs(s, [ref("s1", 7)], { sessionId: "s1", index: 0, before: true })!;
		assert.equal(urls(r.stored, "s1"), "c a b");
		assert.deepEqual(indexes(r.stored, "s1"), [0, 1, 2]);
	});
});

describe("moveSavedTabs: between saved windows", () => {
	test("onto a tab of another saved window: out of one, into the other, both numbered anew", () => {
		const r = moveSavedTabs(store(), [ref("s2", 0)], { sessionId: "s1", index: 2, before: true })!;
		assert.equal(urls(r.stored, "s1"), "a b e c d");
		assert.equal(urls(r.stored, "s2"), "f");
		assert.deepEqual(indexes(r.stored, "s1"), [0, 1, 2, 3, 4]);
		assert.deepEqual(indexes(r.stored, "s2"), [0]);
		assert.deepEqual(r.moves, [
			{ from: ref("s2", 0), to: ref("s1", 2) },
			{ from: ref("s1", 2), to: ref("s1", 3) },
			{ from: ref("s1", 3), to: ref("s1", 4) },
			{ from: ref("s2", 1), to: ref("s2", 0) },
		]);
	});

	test("onto another saved window's card: at its end", () => {
		const r = moveSavedTabs(store(), [ref("s1", 1)], { sessionId: "s2", before: false })!;
		assert.equal(urls(r.stored, "s1"), "a c d");
		assert.equal(urls(r.stored, "s2"), "e f b");
	});

	test("the other fields of the saved windows and the keys' order stay", () => {
		const r = moveSavedTabs(store(), [ref("s1", 1)], { sessionId: "s2", before: false })!;
		assert.deepEqual(Object.keys(r.stored), ["s1", "s2"]);
		assert.equal(r.stored.s1.name, "S1");
		assert.equal(r.stored.s2.order, 1);
	});

	test("its last tab moved out: the saved window is removed and named in emptied", () => {
		const s = store();
		s.s3 = win("s3", ["g"], { order: 2 });
		const r = moveSavedTabs(s, [ref("s3", 0)], { sessionId: "s1", index: 0, before: true })!;
		assert.equal(urls(r.stored, "s1"), "g a b c d");
		assert.equal("s3" in r.stored, false);
		assert.deepEqual(r.emptied, ["s3"]);
	});

	test("several tabs from several windows: in the order the windows and tabs are listed", () => {
		const s = store();
		// s2 listed first
		s.s2.order = -1;
		const r = moveSavedTabs(s, [ref("s1", 3), ref("s2", 1), ref("s1", 0)], { sessionId: "s1", index: 2, before: false })!;
		assert.equal(urls(r.stored, "s1"), "b c f a d");
		assert.equal(urls(r.stored, "s2"), "e");
		assert.equal(r.count, 3);
	});

	test("the tab dropped on is one of the dragged: they go where it was", () => {
		const r = moveSavedTabs(store(), [ref("s1", 0), ref("s1", 2)], { sessionId: "s1", index: 2, before: false })!;
		assert.equal(urls(r.stored, "s1"), "b a c d");
		const r2 = moveSavedTabs(store(), [ref("s1", 1), ref("s1", 3)], { sessionId: "s1", index: 3, before: true })!;
		assert.equal(urls(r2.stored, "s1"), "a c b d");
	});

	test("a private saved window's tab does not go into a normal one, nor the other way", () => {
		const s = store();
		s.s2.windowsInfo = { incognito: true };
		assert.equal(moveSavedTabs(s, [ref("s2", 0)], { sessionId: "s1", index: 0, before: true }), null);
		assert.equal(moveSavedTabs(s, [ref("s1", 0)], { sessionId: "s2", before: false }), null);
		const p = store();
		p.s1.incognito = true;
		assert.equal(moveSavedTabs(p, [ref("s1", 0)], { sessionId: "s2", before: false }), null);
		// inside a private one is fine
		assert.notEqual(moveSavedTabs(s, [ref("s2", 1)], { sessionId: "s2", index: 0, before: true }), null);
	});

	test("unknown target window, unknown target tab, no dragged tab found: null", () => {
		assert.equal(moveSavedTabs(store(), [ref("s1", 0)], { sessionId: "nope", before: false }), null);
		assert.equal(moveSavedTabs(store(), [ref("s1", 0)], { sessionId: "s2", index: 9, before: true }), null);
		assert.equal(moveSavedTabs(store(), [ref("s1", 9), ref("gone", 0)], { sessionId: "s2", before: false }), null);
		assert.equal(moveSavedTabs(store(), [], { sessionId: "s2", before: false }), null);
	});

	test("never changes the stored object; entries that are not saved windows are kept", () => {
		const s = store() as Record<string, W | string>;
		s.junk = "x";
		const copy = JSON.parse(JSON.stringify(s));
		const r = moveSavedTabs(s as Record<string, W>, [ref("s1", 0)], { sessionId: "s2", index: 0, before: true })!;
		assert.deepEqual(s, copy);
		assert.equal((r.stored as Record<string, unknown>).junk, "x");
	});
});

describe("remapSavedKeys", () => {
	test("selected tabs that moved stay selected at their new places; the others stay as they are", () => {
		const keys = new SavedTabKeys();
		const r = moveSavedTabs(store(), [ref("s2", 0)], { sessionId: "s1", index: 2, before: true })!;
		// selected: e (s2 0), c (s1 2), a (s1 0), plus an open tab id
		const sel = new Set([keys.key("s2", 0), keys.key("s1", 2), keys.key("s1", 0), 7]);
		assert.equal(remapSavedKeys(sel, r.moves, keys), true);
		assert.deepEqual([...sel].sort((a, b) => a - b), [keys.key("s1", 2), keys.key("s1", 3), keys.key("s1", 0), 7].sort((a, b) => a - b));
	});

	test("a new key that was another moved tab's old key is kept", () => {
		const keys = new SavedTabKeys();
		// a b c d -> d a b c: every tab moves one up, d to 0
		const r = moveSavedTabs(store(), [ref("s1", 3)], { sessionId: "s1", index: 0, before: true })!;
		const sel = new Set([keys.key("s1", 0), keys.key("s1", 3)]);
		remapSavedKeys(sel, r.moves, keys);
		// a is now 1, d is now 0
		assert.deepEqual([...sel].sort((a, b) => a - b), [keys.key("s1", 0), keys.key("s1", 1)].sort((a, b) => a - b));
	});

	test("nothing moved: false", () => {
		const keys = new SavedTabKeys();
		const sel = new Set([keys.key("s1", 0)]);
		assert.equal(remapSavedKeys(sel, [], keys), false);
		assert.equal(remapSavedKeys(sel, [{ from: ref("s2", 0), to: ref("s2", 1) }], keys), false);
		assert.deepEqual([...sel], [keys.key("s1", 0)]);
	});
});

describe("renumberedIndex and PendingDeletes.renumber", () => {
	const moves : SavedTabMove[] = [
		{ from: ref("s1", 3), to: ref("s1", 1) },
		{ from: ref("s1", 1), to: ref("s1", 2) },
		{ from: ref("s2", 0), to: ref("s1", 0) },
	];

	test("the new index inside the same window; anything else keeps its number", () => {
		const to = renumberedIndex(moves);
		assert.equal(to("s1", 3), 1);
		assert.equal(to("s1", 1), 2);
		assert.equal(to("s1", 2), 2);
		// moved to another window: not a pending tab's case, the number stays
		assert.equal(to("s2", 0), 0);
	});

	test("pending tabs follow their new numbers, whole windows and the countdown stay", () => {
		let changes = 0;
		const timers = { now: () => 0, setTimeout: () => 1, clearTimeout: () => {} };
		const p = new PendingDeletes({ commit: () => {}, onChange: () => { changes++; }, timers });
		p.add({ id: "s1", name: "S1", tabs: 2, indexes: [1, 3] });
		p.add({ id: "s3", name: "S3", tabs: 4 });
		const version = p.version;
		const deadline = p.deadline;
		p.renumber(renumberedIndex(moves));
		assert.deepEqual(p.items, [
			{ id: "s1", name: "S1", tabs: 2, indexes: [1, 2] },
			{ id: "s3", name: "S3", tabs: 4 },
		]);
		assert.equal(p.version, version + 1);
		assert.equal(p.deadline, deadline);
		assert.ok(changes > 0);
	});

	test("nothing renumbered: no change reported", () => {
		const timers = { now: () => 0, setTimeout: () => 1, clearTimeout: () => {} };
		const p = new PendingDeletes({ commit: () => {}, onChange: () => {}, timers });
		p.add({ id: "s2", name: "S2", tabs: 1, indexes: [1] });
		const version = p.version;
		p.renumber(renumberedIndex(moves));
		assert.equal(p.version, version);
		assert.deepEqual(p.items[0].indexes, [1]);
	});
});

describe("PendingDeletes.renumber while a delete is being written", () => {
	const timers = { now: () => 0, setTimeout: () => 1, clearTimeout: () => {} };

	test("a delete queued behind the move removes the tab the user deleted, by its new number", () => {
		// the write waits in the queue and reads `items` only when it runs
		let queued : (() => Record<string, W>) | null = null;
		const before : Record<string, W> = { s1: win("s1", ["a", "b", "c"]) };
		let stored = before;
		const p = new PendingDeletes({
			commit: (items) => { queued = () => withoutItems(stored, items); return new Promise(() => {}); },
			onChange: () => {},
			timers
		});
		// "c" (index 2) deleted, the countdown runs out while a move waits
		p.add({ id: "s1", name: "S1", tabs: 1, indexes: [2] });
		p.flush();
		assert.equal(p.items.length, 0);
		// the move runs first: "a" to the end, a b c -> b c a
		const r = moveSavedTabs(stored, [ref("s1", 0)], { sessionId: "s1", index: undefined, before: false })!;
		assert.equal(urls(r.stored, "s1"), "b c a");
		p.renumber(renumberedIndex(r.moves));
		stored = r.stored;
		// still hidden under its new number
		assert.deepEqual(p.hiding().map((item) => item.indexes), [[1]]);
		// then the queued delete runs: "c" goes, "a" stays
		const after = queued!();
		assert.equal(urls(after, "s1"), "b a");
		assert.equal(urls(before, "s1"), "a b c");
	});

	test("a write that already landed is not touched", () => {
		let items : PendingItem[] = [];
		const p = new PendingDeletes({ commit: (i) => { items = i; return new Promise(() => {}); }, onChange: () => {}, timers });
		p.add({ id: "s1", name: "S1", tabs: 1, indexes: [2] });
		p.flush();
		// stored is now a b d (indexes 0 1 3): a move renumbers them 0 1 2
		p.renumber(renumberedIndex([{ from: ref("s1", 3), to: ref("s1", 2) }]));
		assert.deepEqual(items[0].indexes, [2]);
	});

	test("the inverse map puts the numbers back (a refused write)", () => {
		const moves : SavedTabMove[] = [
			{ from: ref("s1", 0), to: ref("s1", 2) },
			{ from: ref("s1", 1), to: ref("s1", 0) },
			{ from: ref("s1", 2), to: ref("s1", 1) },
		];
		let items : PendingItem[] = [];
		const p = new PendingDeletes({ commit: (i) => { items = i; return new Promise(() => {}); }, onChange: () => {}, timers });
		p.add({ id: "s1", name: "S1", tabs: 1, indexes: [0] });
		p.flush();
		p.add({ id: "s1", name: "S1", tabs: 1, indexes: [1] });
		p.renumber(renumberedIndex(moves));
		assert.deepEqual(items[0].indexes, [2]);
		assert.deepEqual(p.items[0].indexes, [0]);
		p.renumber(renumberedIndex(moves.map((m) => ({ from: m.to, to: m.from }))));
		assert.deepEqual(items[0].indexes, [0]);
		assert.deepEqual(p.items[0].indexes, [1]);
	});
});

describe("movedText", () => {
	test("one tab, several, with the saved windows left empty", () => {
		assert.deepEqual(movedText(1, "Research", 0), { topText: "Moved 1 saved tab to “Research”", bottomText: " " });
		assert.deepEqual(movedText(3, "Research", 1), { topText: "Moved 3 saved tabs to “Research”", bottomText: "The saved window left empty was removed" });
		assert.equal(movedText(2, "", 2).topText, "Moved 2 saved tabs");
		assert.equal(movedText(2, "", 2).bottomText, "2 saved windows left empty were removed");
	});
});
