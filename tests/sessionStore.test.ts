"use strict";

// Unit tests for the stored saved windows (src/popup/sessionStore.ts): fixing
// tab indexes, tidying what storage holds, the listed order, and adding saved
// windows (a save, an import).
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { fixTabIndexes, tidyStored, listSessions, addSessions, isSavedWindow } from "../src/popup/sessionStore.ts";
import type { StoredWindow } from "../src/popup/sessionStore.ts";

type W = StoredWindow & { name? : string };
const tabs = (...indexes : (number | undefined)[]) => indexes.map((index, at) => (index === undefined ? { url: "u" + at } : { index, url: "u" + at }));
const win = (id : string, extra : Partial<W> = {}) : W => ({ id, tabs: tabs(0, 1), windowsInfo: {}, ...extra });
const indexes = (list : { index? : number }[]) => list.map((t) => t.index);

describe("fixTabIndexes", () => {
	test("good indexes (gaps allowed): the same array", () => {
		const t = tabs(0, 3, 7);
		assert.equal(fixTabIndexes(t), t);
		assert.deepEqual(fixTabIndexes([]), []);
	});

	test("none has an index: their places", () => {
		assert.deepEqual(indexes(fixTabIndexes(tabs(undefined, undefined, undefined))), [0, 1, 2]);
	});

	test("a repeated index: the later tab gets its place", () => {
		assert.deepEqual(indexes(fixTabIndexes(tabs(0, 0, 2))), [0, 1, 2]);
	});

	test("its place taken by another tab: the lowest number no tab has", () => {
		assert.deepEqual(indexes(fixTabIndexes(tabs(1, undefined, 0))), [1, 2, 0]);
		assert.deepEqual(indexes(fixTabIndexes(tabs(5, 5, 1))), [5, 0, 1]);
	});

	test("not a whole number >= 0 counts as none", () => {
		const odd = [{ index: -1 }, { index: 1.5 }, { index: "2" as unknown as number }, { index: NaN }];
		assert.deepEqual(indexes(fixTabIndexes(odd)), [0, 1, 2, 3]);
	});

	test("every index differs afterwards", () => {
		const fixed = fixTabIndexes(tabs(2, undefined, 2, 0, undefined, 1));
		assert.equal(new Set(indexes(fixed)).size, fixed.length);
	});

	test("the input is not changed; the good tabs are the same objects", () => {
		const t = tabs(0, 0);
		const fixed = fixTabIndexes(t);
		assert.deepEqual(indexes(t), [0, 0]);
		assert.equal(fixed[0], t[0]);
		assert.notEqual(fixed[1], t[1]);
		assert.equal(fixed[1].url, "u1");
	});
});

describe("tidyStored", () => {
	test("only saved windows with broken indexes are copied", () => {
		const good = win("a");
		const bad = win("b", { tabs: tabs(undefined, undefined) });
		const junk = { note: 1 };
		const out = tidyStored<W>({ a: good, b: bad, j: junk });
		assert.equal(out.a, good);
		assert.equal(out.j as unknown, junk);
		assert.notEqual(out.b, bad);
		assert.deepEqual(indexes(out.b.tabs), [0, 1]);
		assert.deepEqual(indexes(bad.tabs), [undefined, undefined]);
	});

	test("anything but an object is empty", () => {
		assert.deepEqual(tidyStored(null), {});
		assert.deepEqual(tidyStored([win("a")]), {});
		assert.deepEqual(tidyStored("x"), {});
	});
});

describe("listSessions", () => {
	test("only saved windows, in their order", () => {
		const stored = {
			old: win("old", { date: 1 }),
			n: win("n", { order: 0 }),
			bad: { id: "bad", tabs: "x", windowsInfo: {} } as unknown as W,
			noInfo: { id: "noInfo", tabs: [] } as unknown as W,
			fresh: win("fresh", { date: 9 })
		};
		assert.deepEqual(listSessions(stored).map((s) => s.id), ["n", "fresh", "old"]);
	});

	test("isSavedWindow", () => {
		assert.equal(isSavedWindow(win("a")), true);
		assert.equal(isSavedWindow({ id: "a", tabs: [] }), false);
		assert.equal(isSavedWindow(null), false);
	});
});

describe("addSessions", () => {
	test("listed first, in the order given, whatever order they came with", () => {
		const stored = { a: win("a", { order: 0 }), b: win("b", { order: 1 }) };
		const next = addSessions(stored, [win("x", { order: 50 }), win("y", { order: -100 })]);
		assert.deepEqual(listSessions(next).map((s) => s.id), ["x", "y", "a", "b"]);
		assert.deepEqual([next.x.order, next.y.order], [-2, -1]);
	});

	test("also before saved windows without a number", () => {
		const next = addSessions({ old: win("old", { date: 5 }) }, [win("x", { date: 1 })]);
		assert.deepEqual(listSessions(next).map((s) => s.id), ["x", "old"]);
	});

	test("the same id replaces the stored one", () => {
		const next = addSessions({ a: win("a", { name: "old", order: 0 }) }, [win("a", { name: "new" })]);
		assert.equal(Object.keys(next).length, 1);
		assert.equal(next.a.name, "new");
	});

	test("their tab indexes are fixed", () => {
		const next = addSessions({}, [win("x", { tabs: tabs(undefined, undefined, 0) })]);
		assert.deepEqual(indexes(next.x.tabs), [1, 2, 0]);
	});

	test("neither input is changed", () => {
		const stored = { a: win("a") };
		const added = win("x", { order: 3 });
		const next = addSessions(stored, [added]);
		assert.notEqual(next, stored);
		assert.deepEqual(Object.keys(stored), ["a"]);
		assert.equal(added.order, 3);
	});
});
