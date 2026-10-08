"use strict";

// Unit tests for the undo countdown in src/popup/pendingDelete.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PendingDeletes, noticeText, UNDO_MS } from "../src/popup/pendingDelete.ts";
import type { PendingItem } from "../src/popup/pendingDelete.ts";

// the saved windows hidden whole (pending or being written)
const hiddenWindows = (p : PendingDeletes) => p.hiding().filter((i) => i.indexes === undefined).map((i) => i.id);

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
		},
		active: () => timers.size
	};
}

function setup(commit : (items : PendingItem[], sync : boolean) => Promise<unknown> | void = () => {}) {
	const t = fakeTimers();
	const commits : { ids : string[], sync : boolean }[] = [];
	let changes = 0;
	const p = new PendingDeletes({
		commit: (items, sync) => { commits.push({ ids: items.map((i) => i.id), sync }); return commit(items, sync); },
		onChange: () => { changes++; },
		timers: t
	});
	return { t, p, commits, changes: () => changes };
}

const item = (id : string) => ({ id, name: "Window " + id, tabs: 3 });

describe("PendingDeletes", () => {
	test("hides at once, writes only when the countdown ends", () => {
		const { t, p, commits } = setup();
		p.add(item("a"));
		assert.deepEqual(hiddenWindows(p), ["a"]);
		assert.equal(p.deadline, 1000 + UNDO_MS);
		t.advance(UNDO_MS - 1);
		assert.equal(commits.length, 0);
		t.advance(1);
		assert.deepEqual(commits, [{ ids: ["a"], sync: false }]);
		assert.equal(p.items.length, 0);
		assert.equal(p.deadline, 0);
	});

	test("undo brings it back and nothing is ever written", () => {
		const { t, p, commits } = setup();
		p.add(item("a"));
		const back = p.undo();
		assert.deepEqual(back.map((b) => b.id), ["a"]);
		assert.equal(hiddenWindows(p).length, 0);
		assert.equal(t.active(), 0);
		t.advance(UNDO_MS * 2);
		assert.equal(commits.length, 0);
	});

	test("a second delete restarts the countdown and shares it", () => {
		const { t, p, commits } = setup();
		p.add(item("a"));
		t.advance(5000);
		p.add(item("b"));
		assert.equal(t.active(), 1);
		t.advance(5000);
		assert.equal(commits.length, 0);
		t.advance(3000);
		assert.deepEqual(commits[0].ids, ["a", "b"]);
	});

	test("undo restores every pending item", () => {
		const { p } = setup();
		p.add(item("a"));
		p.add(item("b"));
		assert.deepEqual(p.undo().map((b) => b.id), ["a", "b"]);
	});

	test("the same id twice is one item", () => {
		const { p } = setup();
		p.add(item("a"));
		p.add(item("a"));
		assert.equal(p.items.length, 1);
	});

	test("flush writes now, with the sync flag, and stays hidden until the write is done", async () => {
		let finish : () => void = () => {};
		const { t, p, commits } = setup(() => new Promise<void>((r) => { finish = r; }));
		p.add(item("a"));
		p.flush(true);
		assert.deepEqual(commits, [{ ids: ["a"], sync: true }]);
		assert.equal(t.active(), 0);
		assert.equal(p.items.length, 0);
		assert.deepEqual(hiddenWindows(p), ["a"]);
		assert.equal(p.undo().length, 0);
		finish();
		await Promise.resolve();
		await Promise.resolve();
		assert.equal(hiddenWindows(p).length, 0);
	});

	test("a failed write shows the window again", async () => {
		const { p } = setup(() => Promise.reject(new Error("quota")));
		const log = console.error;
		console.error = () => {};
		try {
			p.add(item("a"));
			p.flush();
			await new Promise((r) => setTimeout(r, 0));
		} finally {
			console.error = log;
		}
		assert.equal(hiddenWindows(p).length, 0);
	});

	test("flush with nothing pending does nothing", () => {
		const { p, commits } = setup();
		p.flush(true);
		assert.equal(commits.length, 0);
	});
});

describe("PendingDeletes held by the mouse", () => {
	test("held, the countdown waits; let go, it goes on from where it was", () => {
		const { t, p, commits } = setup();
		p.add(item("a"));
		t.advance(5000);
		p.hold(true);
		t.advance(60000);
		assert.equal(commits.length, 0);
		assert.equal(hiddenWindows(p).length, 1);
		p.hold(false);
		t.advance(UNDO_MS - 5000 - 1);
		assert.equal(commits.length, 0);
		t.advance(1);
		assert.deepEqual(commits, [{ ids: ["a"], sync: false }]);
	});

	test("a delete while held starts the whole countdown over, still held", () => {
		const { t, p, commits } = setup();
		p.add(item("a"));
		t.advance(5000);
		p.hold(true);
		const runs = p.runs;
		p.add(item("b"));
		assert.equal(p.runs, runs + 1);
		t.advance(60000);
		assert.equal(commits.length, 0);
		p.hold(false);
		t.advance(UNDO_MS - 1);
		assert.equal(commits.length, 0);
		t.advance(1);
		assert.deepEqual(commits, [{ ids: ["a", "b"], sync: false }]);
	});

	test("undo or a flush ends the hold: the next delete counts down at once", () => {
		const { t, p, commits } = setup();
		p.add(item("a"));
		p.hold(true);
		p.undo();
		p.add(item("b"));
		t.advance(UNDO_MS);
		assert.deepEqual(commits, [{ ids: ["b"], sync: false }]);
		p.add(item("c"));
		p.hold(true);
		p.flush();
		p.add(item("d"));
		t.advance(UNDO_MS);
		assert.deepEqual(commits.map((c) => c.ids), [["b"], ["c"], ["d"]]);
	});

	test("a hold with nothing pending is ignored", () => {
		const { t, p, commits } = setup();
		p.hold(true);
		p.add(item("a"));
		t.advance(UNDO_MS);
		assert.equal(commits.length, 1);
	});

	test("a closing flush writes even while held", () => {
		const { p, commits } = setup();
		p.add(item("a"));
		p.hold(true);
		p.flush(true);
		assert.deepEqual(commits, [{ ids: ["a"], sync: true }]);
	});

	test("a refused write is reported, and the window shows again", async () => {
		const t = fakeTimers();
		const errors : string[][] = [];
		const p = new PendingDeletes({
			commit: () => Promise.reject(new Error("QUOTA_BYTES quota exceeded")),
			onChange: () => {},
			onError: (err, items) => { errors.push([(err as Error).message, ...items.map((i) => i.id)]); },
			timers: t
		});
		p.add(item("a"));
		t.advance(UNDO_MS);
		await new Promise((r) => setTimeout(r, 0));
		assert.deepEqual(errors, [["QUOTA_BYTES quota exceeded", "a"]]);
		assert.deepEqual(hiddenWindows(p), []);
	});
});

describe("notice text", () => {
	test("text for one and several", () => {
		assert.equal(noticeText([]), "");
		assert.equal(noticeText([{ id: "a", name: "Tax 2029", tabs: 3 }]), "Deleted “Tax 2029” (3 tabs)");
		assert.equal(noticeText([{ id: "a", name: "", tabs: 1 }]), "Deleted “saved window” (1 tab)");
		assert.equal(noticeText([item("a"), item("b"), item("c")]), "Deleted 3 saved windows");
	});
});
