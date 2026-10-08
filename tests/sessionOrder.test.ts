"use strict";

// Unit tests for the order of the saved windows (src/popup/sessionOrder.ts):
// listing, moving a card, the stored numbers, new saved windows first, and
// which half of a card a drag is over.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { sortSessions, moveSession, reorderSessions, firstOrders, dropSide, isSavedWindowDrag, SAVED_WINDOW_DRAG } from "../src/popup/sessionOrder.ts";

const s = (id : string, order? : number, extra : Record<string, unknown> = {}) => (order === undefined ? { id, ...extra } : { id, order, ...extra });
const ids = (list : { id : string }[]) => list.map((e) => e.id);

describe("sortSessions", () => {
	test("without numbers: the order they come in", () => {
		assert.deepEqual(ids(sortSessions([s("a"), s("b"), s("c")])), ["a", "b", "c"]);
	});

	test("numbered ones first, lowest first; the others after, as they came", () => {
		assert.deepEqual(ids(sortSessions([s("a"), s("b", 2), s("c"), s("d", -1), s("e", 0)])), ["d", "e", "b", "a", "c"]);
	});

	test("equal numbers keep the order they come in", () => {
		assert.deepEqual(ids(sortSessions([s("a", 1), s("b", 0), s("c", 1)])), ["b", "a", "c"]);
	});

	test("a number that is not a finite number counts as none", () => {
		const odd = [s("a"), { id: "b", order: "1" as unknown as number }, s("c", NaN), s("d", Infinity), s("e", 5)];
		assert.deepEqual(ids(sortSessions(odd)), ["e", "a", "b", "c", "d"]);
	});

	test("the input is not changed", () => {
		const list = [s("a", 2), s("b", 1)];
		sortSessions(list);
		assert.deepEqual(ids(list), ["a", "b"]);
	});
});

describe("moveSession", () => {
	const list = ["a", "b", "c", "d"];

	test("before a card further up", () => {
		assert.deepEqual(moveSession(list, "d", "b", true), ["a", "d", "b", "c"]);
	});

	test("after a card further up", () => {
		assert.deepEqual(moveSession(list, "d", "a", false), ["a", "d", "b", "c"]);
	});

	test("before / after a card further down", () => {
		assert.deepEqual(moveSession(list, "a", "c", true), ["b", "a", "c", "d"]);
		assert.deepEqual(moveSession(list, "a", "d", false), ["b", "c", "d", "a"]);
	});

	test("to the very top", () => {
		assert.deepEqual(moveSession(list, "c", "a", true), ["c", "a", "b", "d"]);
	});

	test("nothing changes: on itself, right before the next, right after the previous", () => {
		assert.equal(moveSession(list, "b", "b", true), null);
		assert.equal(moveSession(list, "b", "c", true), null);
		assert.equal(moveSession(list, "b", "a", false), null);
	});

	test("an id that is not listed", () => {
		assert.equal(moveSession(list, "x", "a", true), null);
		assert.equal(moveSession(list, "a", "x", true), null);
	});

	test("the input is not changed", () => {
		const copy = [...list];
		moveSession(copy, "d", "a", true);
		assert.deepEqual(copy, list);
	});
});

describe("reorderSessions", () => {
	test("every saved window numbered by its new place; other fields and key order kept", () => {
		const stored = { a: s("a", undefined, { name: "A", tabs: [1] }), b: s("b", undefined, { name: "B" }), c: s("c", undefined, { name: "C" }) };
		const next = reorderSessions(stored, "c", "a", true)!;
		assert.deepEqual(Object.keys(next), ["a", "b", "c"]);
		assert.deepEqual(next.c, { id: "c", name: "C", order: 0 });
		assert.deepEqual(next.a, { id: "a", name: "A", tabs: [1], order: 1 });
		assert.deepEqual(next.b, { id: "b", name: "B", order: 2 });
		assert.deepEqual(ids(sortSessions(Object.values(next))), ["c", "a", "b"]);
	});

	test("starts from the listed order (numbered first), not the keys' order", () => {
		const stored = { a: s("a"), b: s("b", 5), c: s("c", 1) };
		// listed: c, b, a; a dragged before b
		const next = reorderSessions(stored, "a", "b", true)!;
		assert.deepEqual(ids(sortSessions(Object.values(next))), ["c", "a", "b"]);
		assert.deepEqual([next.c.order, next.a.order, next.b.order], [0, 1, 2]);
	});

	test("the stored object is not changed", () => {
		const stored = { a: s("a"), b: s("b") };
		const next = reorderSessions(stored, "b", "a", true)!;
		assert.notEqual(next, stored);
		assert.deepEqual(stored, { a: { id: "a" }, b: { id: "b" } });
	});

	test("null when nothing moves", () => {
		const stored = { a: s("a"), b: s("b") };
		assert.equal(reorderSessions(stored, "a", "b", true), null);
		assert.equal(reorderSessions(stored, "a", "a", false), null);
		assert.equal(reorderSessions(stored, "a", "gone", true), null);
	});

	test("entries that are not saved windows are left alone", () => {
		const junk = { note: "x" } as unknown as { id : string };
		const stored = { a: s("a"), bad: junk, b: s("b") };
		const next = reorderSessions(stored, "b", "a", true)!;
		assert.equal(next.bad, junk);
		assert.deepEqual(Object.keys(next), ["a", "bad", "b"]);
		assert.deepEqual([next.b.order, next.a.order], [0, 1]);
	});
});

describe("firstOrders", () => {
	test("nothing numbered: below 0, so they still come before the others", () => {
		assert.deepEqual(firstOrders({ a: s("a"), b: s("b") }, 1), [-1]);
		assert.deepEqual(firstOrders({}, 2), [-2, -1]);
	});

	test("below the lowest number in use", () => {
		assert.deepEqual(firstOrders({ a: s("a", 0), b: s("b", 3), c: s("c", -4) }, 1), [-5]);
		assert.deepEqual(firstOrders({ a: s("a", 2) }, 2), [-2, -1]);
	});

	test("a new saved window is listed first", () => {
		const stored : Record<string, { id : string, order? : number }> = { a: s("a", 0), b: s("b", 1), c: s("c") };
		const [order] = firstOrders(stored, 1);
		stored.n = s("n", order);
		assert.deepEqual(ids(sortSessions(Object.values(stored))), ["n", "a", "b", "c"]);
	});

	test("several new ones are listed first, in the order given", () => {
		const stored : Record<string, { id : string, order? : number }> = { a: s("a") };
		const [o1, o2] = firstOrders(stored, 2);
		stored.n1 = s("n1", o1);
		stored.n2 = s("n2", o2);
		assert.deepEqual(ids(sortSessions(Object.values(stored))), ["n1", "n2", "a"]);
	});

	test("none asked: none", () => {
		assert.deepEqual(firstOrders({ a: s("a", 1) }, 0), []);
	});
});

describe("dropSide", () => {
	const rect = { left: 100, top: 50, width: 200, height: 80 };

	test("side by side: left half before, right half after", () => {
		assert.equal(dropSide(rect, 150, 120, true), "before");
		assert.equal(dropSide(rect, 250, 60, true), "after");
	});

	test("stacked: top half before, bottom half after", () => {
		assert.equal(dropSide(rect, 290, 60, false), "before");
		assert.equal(dropSide(rect, 110, 120, false), "after");
	});
});

describe("isSavedWindowDrag", () => {
	test("only a drag that carries the saved window type", () => {
		assert.equal(isSavedWindowDrag(["Text", SAVED_WINDOW_DRAG]), true);
		assert.equal(isSavedWindowDrag(["Text", "text/uri-list"]), false);
		assert.equal(isSavedWindowDrag([]), false);
		assert.equal(isSavedWindowDrag(null), false);
		assert.equal(isSavedWindowDrag(undefined), false);
	});
});
