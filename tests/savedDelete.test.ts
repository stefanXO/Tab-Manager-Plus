"use strict";

// Unit tests for deleting saved tabs: which tabs go with Delete
// (src/popup/savedDelete.ts) and how the Undo countdown (src/popup/pendingDelete.ts)
// handles items that take some tabs of a saved window.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { savedDeleteItems } from "../src/popup/savedDelete.ts";
import { SavedTabKeys } from "../src/popup/sessionKeys.ts";
import { PendingDeletes, withoutItems, visibleSessions, noticeText, UNDO_MS } from "../src/popup/pendingDelete.ts";
import type { PendingItem } from "../src/popup/pendingDelete.ts";

// the saved windows hidden whole (pending or being written)
const hiddenWindows = (p : PendingDeletes) => p.hiding().filter((i) => i.indexes === undefined).map((i) => i.id);

const win = (id : string, indexes : number[]) => ({ id, name: "Window " + id, tabs: indexes.map((index) => ({ index, url: "https://" + id + "/" + index })) });
const u = (id : string, indexes : number[]) => indexes.map((index) => "https://" + id + "/" + index);
const some = (id : string, indexes : number[]) : PendingItem => ({ id, name: "Window " + id, tabs: indexes.length, indexes });
const whole = (id : string, tabs = 3) : PendingItem => ({ id, name: "Window " + id, tabs });

describe("savedDeleteItems", () => {
	const sessions = [win("s1", [0, 1, 2, 3]), win("s2", [0, 1, 2])];

	test("some tabs of a window: an item with their indexes", () => {
		const keys = new SavedTabKeys();
		const sel = new Set([keys.key("s1", 3), keys.key("s1", 1)]);
		assert.deepEqual(savedDeleteItems(sel, sessions, keys), [{ id: "s1", name: "Window s1", tabs: 2, indexes: [1, 3], urls: u("s1", [1, 3]) }]);
	});

	test("every tab of a window: the window goes whole", () => {
		const keys = new SavedTabKeys();
		const sel = new Set([0, 1, 2].map((i) => keys.key("s2", i)));
		assert.deepEqual(savedDeleteItems(sel, sessions, keys), [{ id: "s2", name: "Window s2", tabs: 3, urls: u("s2", [0, 1, 2]) }]);
	});

	test("tabs of several windows: one item each, in the order of the windows", () => {
		const keys = new SavedTabKeys();
		const sel = new Set([keys.key("s2", 0), keys.key("s2", 1), keys.key("s2", 2), keys.key("s1", 0)]);
		assert.deepEqual(savedDeleteItems(sel, sessions, keys), [
			{ id: "s1", name: "Window s1", tabs: 1, indexes: [0], urls: u("s1", [0]) },
			{ id: "s2", name: "Window s2", tabs: 3, urls: u("s2", [0, 1, 2]) }
		]);
	});

	test("what is no longer there is ignored: gone windows and tabs, open tab ids, unknown keys", () => {
		const keys = new SavedTabKeys();
		const sel = new Set([keys.key("gone", 0), keys.key("s1", 9), 5, 0, -77]);
		assert.deepEqual(savedDeleteItems(sel, sessions, keys), []);
	});

	test("an empty selection deletes nothing", () => {
		assert.deepEqual(savedDeleteItems(new Set(), sessions, new SavedTabKeys()), []);
	});

	test("the window as shown decides what 'every tab' is: tabs already pending are not in it", () => {
		const keys = new SavedTabKeys();
		// tab 1 of s1 is pending, so the shown window has 0, 2, 3
		const shown = [win("s1", [0, 2, 3])];
		const sel = new Set([0, 2, 3].map((i) => keys.key("s1", i)));
		assert.deepEqual(savedDeleteItems(sel, shown, keys), [{ id: "s1", name: "Window s1", tabs: 3, urls: u("s1", [0, 2, 3]) }]);
	});

	test("two stored tabs with one index go together, listed once", () => {
		const keys = new SavedTabKeys();
		const dup = [win("s1", [0, 1, 1, 2])];
		const sel = new Set([keys.key("s1", 1)]);
		assert.deepEqual(savedDeleteItems(sel, dup, keys), [{ id: "s1", name: "Window s1", tabs: 2, indexes: [1], urls: u("s1", [1]) }]);
	});

	test("never changes the selection or the windows", () => {
		const keys = new SavedTabKeys();
		const sel = new Set([keys.key("s1", 0)]);
		savedDeleteItems(sel, sessions, keys);
		assert.equal(sel.size, 1);
		assert.equal(sessions[0].tabs.length, 4);
	});
});

// a clock and timers the test moves by hand
function fakeTimers() {
	let now = 1000;
	let next = 1;
	const timers = new Map<number, { at : number, fn : () => void }>();
	return {
		now: () => now,
		setTimeout: (fn : () => void, ms : number) => { timers.set(next, { at: now + ms, fn }); return next++; },
		clearTimeout: (h : unknown) => { timers.delete(h as number); },
		advance(ms : number) {
			now += ms;
			for (const [h, t] of [...timers]) if (t.at <= now) { timers.delete(h); t.fn(); }
		}
	};
}

function setup(commit : (items : PendingItem[], sync : boolean) => Promise<unknown> | void = () => {}) {
	const t = fakeTimers();
	const commits : { items : PendingItem[], sync : boolean }[] = [];
	const p = new PendingDeletes({
		commit: (items, sync) => { commits.push({ items, sync }); return commit(items, sync); },
		onChange: () => {},
		timers: t
	});
	return { t, p, commits };
}

describe("PendingDeletes with saved tabs", () => {
	test("tabs of a window do not hide the window, but are listed as hiding", () => {
		const { p } = setup();
		p.add(some("a", [1]));
		assert.equal(hiddenWindows(p).length, 0);
		assert.deepEqual(p.hiding(), [some("a", [1])]);
	});

	test("tabs of a window already pending join its item", () => {
		const { p } = setup();
		p.add(some("a", [2]));
		p.add(some("a", [0, 2]));
		assert.equal(p.items.length, 1);
		assert.deepEqual(p.items[0].indexes, [0, 2]);
		assert.equal(p.items[0].tabs, 2);
	});

	test("the whole window wins over some of its tabs, and not the other way", () => {
		const { p } = setup();
		p.add(some("a", [1]));
		p.add(whole("a"));
		assert.equal(p.items.length, 1);
		assert.equal(p.items[0].indexes, undefined);
		assert.deepEqual(hiddenWindows(p), ["a"]);
		p.add(some("a", [0]));
		assert.equal(p.items[0].indexes, undefined);
	});

	test("the version moves with every change", () => {
		const { t, p } = setup();
		const v0 = p.version;
		p.add(some("a", [1]));
		const v1 = p.version;
		assert.notEqual(v1, v0);
		p.undo();
		assert.notEqual(p.version, v1);
		p.add(some("a", [1]));
		const v2 = p.version;
		t.advance(UNDO_MS);
		assert.notEqual(p.version, v2);
	});

	test("the countdown ends: the commit gets tabs and windows alike, hidden until it is done", async () => {
		let finish : () => void = () => {};
		const { t, p, commits } = setup(() => new Promise<void>((r) => { finish = r; }));
		p.add(some("a", [1, 2]));
		p.add(whole("b"));
		t.advance(UNDO_MS);
		assert.deepEqual(commits[0].items, [some("a", [1, 2]), whole("b")]);
		assert.equal(commits[0].sync, false);
		assert.deepEqual(p.hiding(), commits[0].items);
		finish();
		await Promise.resolve();
		await Promise.resolve();
		assert.equal(p.hiding().length, 0);
	});

	test("undo brings tabs back too, and nothing is written", () => {
		const { t, p, commits } = setup();
		p.add(some("a", [1]));
		assert.equal(p.undo().length, 1);
		assert.equal(p.hiding().length, 0);
		t.advance(UNDO_MS * 2);
		assert.equal(commits.length, 0);
	});
});

describe("withoutItems and visibleSessions", () => {
	const values = { a: win("a", [0, 1, 2, 3]), b: win("b", [0, 1]) };

	test("tabs go by their stored index, the others keep theirs", () => {
		const out = withoutItems(values, [some("a", [1, 2])]);
		assert.deepEqual(out.a.tabs.map((t) => t.index), [0, 3]);
		assert.equal(out.b, values.b);
	});

	test("a window left with no tab goes", () => {
		const out = withoutItems(values, [some("b", [0, 1])]);
		assert.deepEqual(Object.keys(out), ["a"]);
	});

	test("a whole window goes, even next to some of its tabs", () => {
		const out = withoutItems(values, [some("a", [0]), whole("a")]);
		assert.deepEqual(Object.keys(out), ["b"]);
	});

	test("two items on one window add up", () => {
		const out = withoutItems(values, [some("a", [0]), some("a", [3])]);
		assert.deepEqual(out.a.tabs.map((t) => t.index), [1, 2]);
	});

	test("keeps the rest of a saved window as it was", () => {
		const stored = { a: { ...win("a", [0, 1]), color: "color4", date: 5 } };
		const out = withoutItems(stored, [some("a", [0])]);
		assert.equal(out.a.color, "color4");
		assert.equal(out.a.date, 5);
	});

	test("never changes what it is given", () => {
		withoutItems(values, [some("a", [0, 1, 2]), whole("b")]);
		assert.equal(values.a.tabs.length, 4);
		assert.equal(Object.keys(values).length, 2);
	});

	test("the shown list keeps its order and the windows nothing touches", () => {
		const list = [win("a", [0, 1, 2]), win("b", [0, 1]), win("c", [0])];
		const shown = visibleSessions(list, [some("a", [1]), whole("c")]);
		assert.deepEqual(shown.map((s) => s.id), ["a", "b"]);
		assert.deepEqual(shown[0].tabs.map((t) => t.index), [0, 2]);
		assert.equal(shown[1], list[1]);
		assert.equal(list[0].tabs.length, 3);
	});

	test("nothing hiding: the same windows", () => {
		const list = [win("a", [0]), win("b", [0])];
		const shown = visibleSessions(list, []);
		assert.equal(shown[0], list[0]);
		assert.equal(shown[1], list[1]);
		assert.notEqual(shown, list);
	});
});

describe("notice text for saved tabs", () => {
	test("some tabs of one window", () => {
		assert.equal(noticeText([some("a", [1, 2])]), "Deleted 2 tabs from “Window a”");
		assert.equal(noticeText([some("a", [1])]), "Deleted 1 tab from “Window a”");
		assert.equal(noticeText([{ id: "a", name: "", tabs: 2, indexes: [0, 1] }]), "Deleted 2 tabs from “saved window”");
	});

	test("tabs of several windows, and tabs with windows", () => {
		assert.equal(noticeText([some("a", [1, 2]), some("b", [0])]), "Deleted 3 saved tabs");
		assert.equal(noticeText([some("a", [1]), whole("b")]), "Deleted 1 saved tab and 1 saved window");
		assert.equal(noticeText([some("a", [1, 2]), whole("b"), whole("c")]), "Deleted 2 saved tabs and 2 saved windows");
	});
});
