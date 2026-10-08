"use strict";

// Unit tests for src/popup/pendingDelete.ts: pending deletes found again by
// address when the saved window changed meanwhile (another popup, the
// sidebar, an import), and the closing flush writing deletes whose queued
// write never started.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PendingDeletes, withoutItems, visibleSessions, resolveGone, goneUrls } from "../src/popup/pendingDelete.ts";
import type { PendingItem } from "../src/popup/pendingDelete.ts";

type Tab = { index : number, url : string };
type Win = { id : string, name : string, tabs : Tab[] };

// a saved window with these addresses, numbered 0, 1, 2…
const win = (id : string, urls : string[]) : Win => ({ id, name: "Window " + id, tabs: urls.map((url, index) => ({ index, url })) });
const some = (id : string, indexes : number[], urls : string[]) : PendingItem => ({ id, name: "Window " + id, tabs: indexes.length, indexes, urls });
const whole = (w : Win) : PendingItem => ({ id: w.id, name: w.name, tabs: w.tabs.length, urls: goneUrls(w.tabs) });
const urls = (w : Win | undefined) => w ? w.tabs.map((t) => t.url) : undefined;

describe("withoutItems: some tabs, found again", () => {
	test("unchanged window: the tabs at their indexes go", () => {
		const out = withoutItems({ a: win("a", ["p", "q", "r"]) }, [some("a", [1], ["q"])]);
		assert.deepEqual(urls(out.a), ["p", "r"]);
	});

	test("another popup put a tab in front: the deleted one is found by address", () => {
		// deleted q at index 1; elsewhere n went first, so q is now at index 2
		const out = withoutItems({ a: win("a", ["n", "p", "q", "r"]) }, [some("a", [1], ["q"])]);
		assert.deepEqual(urls(out.a), ["n", "p", "r"]);
	});

	test("a tab no longer there takes nothing (not the tab now at its index)", () => {
		const out = withoutItems({ a: win("a", ["p", "x", "r"]) }, [some("a", [1], ["q"])]);
		assert.deepEqual(urls(out.a), ["p", "x", "r"]);
	});

	test("the same address twice: the one at the index first, then the first not taken", () => {
		const stored = { a: win("a", ["q", "p", "q", "q"]) };
		assert.deepEqual(urls(withoutItems(stored, [some("a", [2], ["q"])]).a), ["q", "p", "q"]);
		assert.deepEqual(withoutItems(stored, [some("a", [2], ["q"])]).a.tabs.map((t) => t.index), [0, 1, 3]);
		// index 1 holds p now: the first q not taken goes
		assert.deepEqual(urls(withoutItems(stored, [some("a", [1], ["q"])]).a), ["p", "q", "q"]);
		// two deleted copies never take one tab twice
		assert.deepEqual(urls(withoutItems(stored, [some("a", [0, 2], ["q", "q"])]).a), ["p", "q"]);
	});

	test("exact matches are taken before a moved one looks by address", () => {
		// q at 0 and q at 2 deleted; the window now reads q p q: both found where they are
		const gone = resolveGone(win("a", ["q", "p", "q"]).tabs, [some("a", [2, 0], ["q", "q"])]);
		assert.deepEqual([...gone].map((t) => t.index).sort(), [0, 2]);
	});

	test("every tab gone after resolving: the window goes", () => {
		const out = withoutItems({ a: win("a", ["n", "q"]), b: win("b", ["z"]) }, [some("a", [0, 1], ["q", "n"])]);
		assert.deepEqual(Object.keys(out), ["b"]);
	});

	test("an item without addresses goes by index alone", () => {
		const out = withoutItems({ a: win("a", ["p", "x", "r"]) }, [{ id: "a", name: "A", tabs: 1, indexes: [1] }]);
		assert.deepEqual(urls(out.a), ["p", "r"]);
	});

	test("the shown list hides the same tabs", () => {
		const shown = visibleSessions([win("a", ["n", "p", "q"])], [some("a", [1], ["q"])]);
		assert.deepEqual(urls(shown[0]), ["n", "p"]);
	});
});

describe("withoutItems: a whole window", () => {
	test("unchanged, renamed or with tabs gone elsewhere: it goes", () => {
		const a = win("a", ["p", "q"]);
		assert.deepEqual(Object.keys(withoutItems({ a }, [whole(a)])), []);
		assert.deepEqual(Object.keys(withoutItems({ a: { ...a, name: "Renamed" } }, [whole(a)])), []);
		assert.deepEqual(Object.keys(withoutItems({ a: win("a", ["q"]) }, [whole(a)])), []);
		assert.deepEqual(Object.keys(withoutItems({ a: win("a", ["q", "p"]) }, [whole(a)])), []);
	});

	test("an import replaced it with other tabs: the new one stays", () => {
		const a = win("a", ["p", "q"]);
		const imported = win("a", ["x", "y", "z"]);
		const out = withoutItems({ a: imported }, [whole(a)]);
		assert.equal(out.a, imported);
	});

	test("another popup added a tab to it: it stays, whole", () => {
		const a = win("a", ["p", "q"]);
		const grown = win("a", ["p", "q", "new"]);
		assert.equal(withoutItems({ a: grown }, [whole(a)]).a, grown);
		// one more copy of a tab it had counts as new too
		assert.ok(withoutItems({ a: win("a", ["p", "q", "q"]) }, [whole(a)]).a);
	});

	test("its tabs a partial item takes in the same write do not count", () => {
		// q deleted first (being written), then the rest of the window (p)
		const stored = { a: win("a", ["p", "q"]) };
		const out = withoutItems(stored, [some("a", [1], ["q"]), { id: "a", name: "A", tabs: 1, urls: ["p"] }]);
		assert.deepEqual(Object.keys(out), []);
	});

	test("a whole window without addresses goes whatever it holds", () => {
		assert.deepEqual(Object.keys(withoutItems({ a: win("a", ["x"]) }, [{ id: "a", name: "A", tabs: 2 }])), []);
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

describe("PendingDeletes keeps the addresses", () => {
	const setup = () => new PendingDeletes({ commit: () => new Promise(() => {}), onChange: () => {}, timers: fakeTimers() });

	test("tabs of one window added twice: indexes and addresses stay paired", () => {
		const p = setup();
		p.add(some("a", [3], ["s"]));
		p.add(some("a", [1, 3], ["q", "s"]));
		assert.deepEqual(p.items[0].indexes, [1, 3]);
		assert.deepEqual(p.items[0].urls, ["q", "s"]);
		assert.equal(p.items[0].tabs, 2);
	});

	test("the whole window after some of its tabs keeps their addresses too", () => {
		const p = setup();
		p.add(some("a", [1], ["q"]));
		// the window as shown no longer has q
		p.add({ id: "a", name: "Window a", tabs: 2, urls: ["p", "r"] });
		assert.equal(p.items[0].indexes, undefined);
		assert.deepEqual([...p.items[0].urls!].sort(), ["p", "q", "r"]);
		assert.deepEqual(Object.keys(withoutItems({ a: win("a", ["p", "q", "r"]) }, p.items)), []);
	});

	test("renumber moves the addresses with their indexes", () => {
		const p = setup();
		p.add(some("a", [0, 2], ["p", "r"]));
		// a move put r first: 2 -> 0, 0 -> 1
		p.renumber((id, index) => index === 2 ? 0 : index === 0 ? 1 : index);
		assert.deepEqual(p.items[0].indexes, [0, 1]);
		assert.deepEqual(p.items[0].urls, ["r", "p"]);
	});
});

describe("PendingDeletes: the closing flush and the queued write", () => {
	// commit() as the manager does it: a queued write claims its items when it runs
	function setup() {
		const t = fakeTimers();
		const calls : { items : PendingItem[], sync : boolean }[] = [];
		const p = new PendingDeletes({
			commit: (items, sync) => { calls.push({ items, sync }); return new Promise(() => {}); },
			onChange: () => {},
			timers: t
		});
		return { t, p, calls };
	}

	test("a delete whose queued write has not started goes with the closing flush", () => {
		const { t, p, calls } = setup();
		p.add({ id: "a", name: "A", tabs: 1 });
		t.advance(8000);
		// its write waits behind another change; the popup closes
		p.add({ id: "b", name: "B", tabs: 1 });
		p.flush(true);
		assert.equal(calls.length, 2);
		assert.deepEqual(calls[1].items.map((i) => i.id), ["a", "b"]);
		assert.equal(calls[1].sync, true);
		// the closing write claims both; the queued one, if it ever runs, has nothing left
		assert.deepEqual(p.claim(calls[1].items).map((i) => i.id), ["a", "b"]);
		assert.deepEqual(p.claim(calls[0].items), []);
	});

	test("only that: nothing pending, a waiting write still goes when closing", () => {
		const { t, p, calls } = setup();
		p.add({ id: "a", name: "A", tabs: 1 });
		t.advance(8000);
		p.flush(true);
		assert.equal(calls.length, 2);
		assert.deepEqual(calls[1].items.map((i) => i.id), ["a"]);
	});

	test("a write that started is not written again", () => {
		const { t, p, calls } = setup();
		p.add({ id: "a", name: "A", tabs: 1 });
		t.advance(8000);
		assert.deepEqual(p.claim(calls[0].items).map((i) => i.id), ["a"]);
		p.flush(true);
		assert.equal(calls.length, 1);
	});

	test("not closing, the countdown's flush leaves waiting writes queued", () => {
		const { t, p, calls } = setup();
		p.add({ id: "a", name: "A", tabs: 1 });
		t.advance(8000);
		p.add({ id: "b", name: "B", tabs: 1 });
		t.advance(8000);
		assert.deepEqual(calls[1].items.map((i) => i.id), ["b"]);
	});

	test("written once: the partial delete the closing flush wrote takes no second tab", () => {
		const { t, p, calls } = setup();
		let stored : Record<string, Win> = { a: win("a", ["q", "p", "q"]) };
		p.add(some("a", [0], ["q"]));
		t.advance(8000);
		p.flush(true);
		const closing = p.claim(calls[1].items);
		stored = withoutItems(stored, closing);
		// the queued write runs after all (the page stayed): nothing left to remove
		const late = p.claim(calls[0].items);
		if (late.length) stored = withoutItems(stored, late);
		assert.deepEqual(urls(stored.a), ["p", "q"]);
	});
});
