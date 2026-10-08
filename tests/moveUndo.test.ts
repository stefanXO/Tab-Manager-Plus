"use strict";

// Unit tests for undoing a move of saved tabs that left a saved window without
// a tab (src/popup/moveUndo.ts), and for the offer the Undo notice shows.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { moveUndoRecord, undoMove, emptiedText, undoneText, UndoOffers } from "../src/popup/moveUndo.ts";
import type { MoveUndo } from "../src/popup/moveUndo.ts";
import { moveSavedTabs, remapSavedKeys } from "../src/popup/savedMove.ts";
import type { SavedDropTarget } from "../src/popup/savedMove.ts";
import type { SavedTabRef } from "../src/popup/sessionKeys.ts";
import { SavedTabKeys } from "../src/popup/sessionKeys.ts";
import { stampUpdated } from "../src/popup/savedUpdated.ts";
import { addOpenTabs } from "../src/popup/savedAdd.ts";
import { withoutItems } from "../src/popup/pendingDelete.ts";

const NOW = 1_900_000_000_000;
const LATER = NOW + 5000;

interface T { index? : number, url : string }
interface W { id : string, name : string, color : string, tabs : T[], windowsInfo : object, date : number, updated? : number, order? : number, incognito? : boolean }
const win = (id : string, urls : string[], extra : Partial<W> = {}) : W =>
	({ id, name: id.toUpperCase(), color: "color" + id.length, tabs: urls.map((url, index) => ({ index, url })), windowsInfo: {}, date: 1, ...extra });
// s1: a b c d, s2: e f (Tax), s3: g
const store = () : Record<string, W> => ({
	s1: win("s1", ["a", "b", "c", "d"], { order: 0 }),
	s2: win("s2", ["e", "f"], { order: 1, name: "Tax", color: "color15", updated: 7 }),
	s3: win("s3", ["g"], { order: 2 }),
});
const urls = (stored : Record<string, W>, id : string) => stored[id] ? stored[id].tabs.map((t) => t.url).join(" ") : "(gone)";
const ref = (sessionId : string, index : number) : SavedTabRef => ({ sessionId, index });

// a move as the popup makes it: the record from what was stored before, the
// stored result stamped
function move(stored : Record<string, W>, refs : SavedTabRef[], target : SavedDropTarget) {
	const result = moveSavedTabs(stored, refs, target)!;
	assert.ok(result, "the move happens");
	return { after: stampUpdated(stored, result.stored, NOW), record: moveUndoRecord(stored, refs, result), result };
}

describe("moveUndoRecord", () => {
	test("none when no window was emptied", () => {
		const s = store();
		const r = moveSavedTabs(s, [ref("s2", 0)], { sessionId: "s1", before: false })!;
		assert.equal(moveUndoRecord(s, [ref("s2", 0)], r), null);
	});
	test("the windows the move changed, as they were, and what went where", () => {
		const s = store();
		const { record } = move(s, [ref("s2", 0), ref("s2", 1)], { sessionId: "s1", index: 1, before: true });
		assert.deepEqual(record!.emptied, ["s2"]);
		assert.deepEqual(record!.before.map((w) => w.id).sort(), ["s1", "s2"]);
		assert.equal(record!.before.find((w) => w.id === "s2"), s.s2, "the stored object itself");
		// only the dragged tabs, not the ones of s1 numbered anew
		assert.deepEqual(record!.moves, [{ from: ref("s2", 0), to: ref("s1", 1) }, { from: ref("s2", 1), to: ref("s1", 2) }]);
	});
});

describe("undoMove: nothing changed in between", () => {
	test("the emptied window comes back as it was, the target too", () => {
		const s = store();
		const { after, record } = move(s, [ref("s2", 0), ref("s2", 1)], { sessionId: "s1", index: 1, before: true });
		assert.equal(urls(after, "s2"), "(gone)");
		assert.equal(urls(after, "s1"), "a e f b c d");
		const r = undoMove(after, record!, LATER)!;
		assert.deepEqual(r.restored, ["s2"]);
		assert.equal(r.count, 2);
		assert.deepEqual(r.stored.s2, s.s2, "name, colour, order, updated, tabs");
		assert.deepEqual(r.stored.s1, s.s1, "no updated, old numbers");
		assert.equal(r.stored.s3, s.s3);
	});
	test("a single last tab dropped on another card", () => {
		const s = store();
		const { after, record } = move(s, [ref("s3", 0)], { sessionId: "s2", before: false });
		assert.equal(urls(after, "s2"), "e f g");
		const r = undoMove(after, record!, LATER)!;
		assert.deepEqual(r.stored.s3, s.s3);
		assert.deepEqual(r.stored.s2, s.s2);
	});
	test("selected tabs of several windows: every one goes back where it was", () => {
		const s = store();
		const { after, record } = move(s, [ref("s1", 1), ref("s3", 0)], { sessionId: "s2", index: 0, before: true });
		assert.equal(urls(after, "s1"), "a c d");
		assert.equal(urls(after, "s2"), "b g e f");
		const r = undoMove(after, record!, LATER)!;
		assert.equal(urls(r.stored, "s1"), "a b c d");
		assert.equal(urls(r.stored, "s2"), "e f");
		assert.equal(urls(r.stored, "s3"), "g");
		assert.deepEqual(r.stored, s);
	});
	test("the stored indexes with gaps come back too", () => {
		const s = store();
		s.s2 = { ...s.s2, tabs: [{ index: 3, url: "e" }, { index: 9, url: "f" }] };
		const { after, record } = move(s, [ref("s2", 3), ref("s2", 9)], { sessionId: "s1", before: false });
		const r = undoMove(after, record!, LATER)!;
		assert.deepEqual(r.stored.s2.tabs, [{ index: 3, url: "e" }, { index: 9, url: "f" }]);
	});
	test("the moves let the selection follow the tabs back", () => {
		const s = store();
		const { after, record, result } = move(s, [ref("s2", 0), ref("s2", 1)], { sessionId: "s1", index: 1, before: true });
		const keys = new SavedTabKeys();
		const selection = new Set([keys.key("s2", 0)]);
		remapSavedKeys(selection, result.moves, keys);
		assert.deepEqual([...selection].map((k) => keys.ref(k)), [ref("s1", 1)]);
		const r = undoMove(after, record!, LATER)!;
		remapSavedKeys(selection, r.moves, keys);
		assert.deepEqual([...selection].map((k) => keys.ref(k)), [ref("s2", 0)]);
	});
	test("input untouched", () => {
		const s = store();
		const { after, record } = move(s, [ref("s3", 0)], { sessionId: "s2", before: false });
		const copy = JSON.parse(JSON.stringify(after));
		undoMove(after, record!, LATER);
		assert.deepEqual(after, copy);
	});
});

describe("undoMove: storage changed meanwhile", () => {
	test("a tab added to the target since stays there; the window is stamped", () => {
		const s = store();
		const { after, record } = move(s, [ref("s3", 0)], { sessionId: "s2", before: false });
		const added = addOpenTabs(after, [{ id: 1, windowId: 1, index: 0, url: "n" }], { sessionId: "s2", index: 0, before: true }, { windowOrder: [1] })!.stored;
		assert.equal(urls(added, "s2"), "n e f g");
		const r = undoMove(added, record!, LATER)!;
		assert.equal(urls(r.stored, "s2"), "n e f");
		assert.deepEqual(r.stored.s2.tabs.map((t) => t.index), [0, 1, 2]);
		assert.equal(r.stored.s2.updated, LATER);
		assert.deepEqual(r.stored.s3, s.s3);
	});
	test("the moved tab reordered within the target since: found by its address", () => {
		const s = store();
		const { after, record } = move(s, [ref("s3", 0)], { sessionId: "s2", before: false });
		const reordered = moveSavedTabs(after, [ref("s2", 2)], { sessionId: "s2", index: 0, before: true })!.stored;
		assert.equal(urls(reordered, "s2"), "g e f");
		const r = undoMove(reordered, record!, LATER)!;
		assert.equal(urls(r.stored, "s2"), "e f");
		assert.equal(urls(r.stored, "s3"), "g");
	});
	test("a moved tab deleted since stays deleted; the window comes back with the others", () => {
		const s = store();
		const { after, record } = move(s, [ref("s2", 0), ref("s2", 1)], { sessionId: "s1", before: false });
		assert.equal(urls(after, "s1"), "a b c d e f");
		const deleted = withoutItems(after, [{ id: "s1", name: "S1", tabs: 1, indexes: [4], urls: ["e"] }]);
		const r = undoMove(deleted, record!, LATER)!;
		assert.equal(urls(r.stored, "s2"), "f");
		assert.equal(r.stored.s2.name, "Tax");
		assert.equal(r.stored.s2.color, "color15");
		assert.equal(r.stored.s2.updated, LATER);
		assert.equal(urls(r.stored, "s1"), "a b c d");
	});
	test("every moved tab gone (the target deleted): nothing to undo", () => {
		const s = store();
		const { after, record } = move(s, [ref("s3", 0)], { sessionId: "s2", before: false });
		const { s2, ...rest } = after;
		assert.ok(s2);
		assert.equal(undoMove(rest, record!, LATER), null);
	});
	test("the target renamed since: the name stays, the tabs go back", () => {
		const s = store();
		const { after, record } = move(s, [ref("s3", 0)], { sessionId: "s2", before: false });
		const renamed = { ...after, s2: { ...after.s2, name: "Renamed" } };
		const r = undoMove(renamed, record!, LATER)!;
		assert.equal(r.stored.s2.name, "Renamed");
		assert.equal(urls(r.stored, "s2"), "e f");
		assert.equal(r.stored.s2.updated, 7, "its time as before the move");
	});
	test("a tab whose old window (not the emptied one) was deleted since stays where it is", () => {
		const s = store();
		const { after, record } = move(s, [ref("s1", 1), ref("s3", 0)], { sessionId: "s2", index: 0, before: true });
		const { s1, ...rest } = after;
		assert.ok(s1);
		const r = undoMove(rest, record!, LATER)!;
		assert.equal(urls(r.stored, "s2"), "b e f");
		assert.equal(urls(r.stored, "s3"), "g");
		assert.equal(urls(r.stored, "s1"), "(gone)");
	});
	test("the emptied window stored again meanwhile (an import): the tabs go into it", () => {
		const s = store();
		const { after, record } = move(s, [ref("s3", 0)], { sessionId: "s2", before: false });
		const imported = { ...after, s3: win("s3", ["z"], { name: "Imported" }) };
		const r = undoMove(imported, record!, LATER)!;
		assert.deepEqual(r.restored, []);
		assert.equal(urls(r.stored, "s3"), "g z");
		assert.equal(r.stored.s3.name, "Imported");
	});
	test("duplicate addresses: the tab at its place is taken first", () => {
		const s = store();
		s.s3 = win("s3", ["e"]);
		const { after, record } = move(s, [ref("s3", 0)], { sessionId: "s2", before: false });
		assert.equal(urls(after, "s2"), "e f e");
		const r = undoMove(after, record!, LATER)!;
		assert.deepEqual(r.stored.s2, s.s2, "the first e stays");
	});
});

describe("texts", () => {
	test("emptiedText", () => {
		assert.equal(emptiedText(["Tax"]), "Removed “Tax” (left empty)");
		assert.equal(emptiedText([""]), "Removed “saved window” (left empty)");
		assert.equal(emptiedText(["A", "B"]), "Removed 2 saved windows left empty");
	});
	test("undoneText", () => {
		assert.deepEqual(undoneText(2, ["Tax"]), { topText: "Moved 2 saved tabs back", bottomText: "“Tax” is back" });
		assert.deepEqual(undoneText(1, []), { topText: "Moved 1 saved tab back", bottomText: " " });
		assert.equal(undoneText(3, ["A", "B"]).bottomText, "2 saved windows are back");
	});
});

describe("UndoOffers", () => {
	function fakeTimers() {
		let now = 1000;
		const pending = new Map<number, { at : number, fn : () => void }>();
		let next = 1;
		return {
			timers: {
				now: () => now,
				setTimeout: (fn : () => void, ms : number) => { pending.set(next, { at: now + ms, fn }); return next++; },
				clearTimeout: (h : unknown) => { pending.delete(h as number); }
			},
			advance(ms : number) {
				now += ms;
				for (const [h, t] of [...pending]) if (t.at <= now) { pending.delete(h); t.fn(); }
			},
			count: () => pending.size
		};
	}
	test("offered, then gone when the countdown ends", () => {
		const f = fakeTimers();
		let changes = 0;
		const o = new UndoOffers<string>({ delay: 8000, timers: f.timers, onChange: () => changes++ });
		assert.equal(o.current, null);
		assert.equal(o.deadline, 0);
		const key = o.offer("x");
		assert.equal(o.current, "x");
		assert.equal(o.has(key), true);
		assert.equal(o.deadline, 9000);
		assert.equal(o.countdown, 8000);
		f.advance(7999);
		assert.equal(o.current, "x");
		f.advance(1);
		assert.equal(o.current, null);
		assert.equal(o.has(key), false);
		assert.equal(changes, 2);
	});
	test("take ends it and hands it over once", () => {
		const f = fakeTimers();
		const o = new UndoOffers<string>({ delay: 8000, timers: f.timers, onChange: () => {} });
		o.offer("x");
		assert.equal(o.take(), "x");
		assert.equal(o.take(), null);
		assert.equal(f.count(), 0);
	});
	test("a new offer stacks: each keeps its own countdown", () => {
		const f = fakeTimers();
		const o = new UndoOffers<string>({ delay: 8000, timers: f.timers, onChange: () => {} });
		const x = o.offer("x");
		f.advance(5000);
		const y = o.offer("y");
		assert.equal(f.count(), 2);
		assert.deepEqual(o.items.map((i) => i.value), ["x", "y"]);
		assert.equal(o.current, "y", "the newest");
		f.advance(3000);
		assert.deepEqual(o.items.map((i) => i.value), ["y"], "x ran out, y goes on");
		assert.equal(o.has(x), false);
		f.advance(5000);
		assert.equal(o.has(y), false);
		assert.equal(o.current, null);
	});
	test("take and clear by key leave the others alone; take without a key takes the newest", () => {
		const f = fakeTimers();
		const o = new UndoOffers<string>({ delay: 8000, timers: f.timers, onChange: () => {} });
		const x = o.offer("x");
		o.offer("y");
		const z = o.offer("z");
		assert.equal(o.take(x), "x");
		assert.equal(o.take(), "z");
		assert.equal(o.take(z), null);
		assert.deepEqual(o.items.map((i) => i.value), ["y"]);
		o.offer("w");
		o.clear();
		assert.equal(o.items.length, 0);
		assert.equal(f.count(), 0);
	});
	test("held by the mouse over its notice: that one waits, then goes on with what was left", () => {
		const f = fakeTimers();
		const o = new UndoOffers<string>({ delay: 8000, timers: f.timers, onChange: () => {} });
		const x = o.offer("x");
		const y = o.offer("y");
		assert.equal(o.items[0].runs, 1);
		f.advance(3000);
		o.hold(true, x);
		f.advance(60000);
		assert.deepEqual(o.items.map((i) => i.value), ["x"], "y ran out, x is held");
		o.hold(false, x);
		f.advance(4999);
		assert.equal(o.has(x), true);
		f.advance(1);
		assert.equal(o.has(x), false);
		assert.equal(o.has(y), false);
	});
	test("clear with nothing offered changes nothing", () => {
		let changes = 0;
		const o = new UndoOffers<MoveUndo<W>>({ delay: 1, timers: fakeTimers().timers, onChange: () => changes++ });
		o.clear();
		o.clear(5);
		assert.equal(changes, 0);
	});
});
