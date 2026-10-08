"use strict";

// Unit tests for the undo countdown in src/popup/pendingDelete.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PendingDeletes, withoutSessions, noticeText, secondsLeft, fractionLeft, UNDO_MS } from "../src/popup/pendingDelete.ts";

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

function setup(commit : (ids : string[], sync : boolean) => Promise<unknown> | void = () => {}) {
	const t = fakeTimers();
	const commits : { ids : string[], sync : boolean }[] = [];
	let changes = 0;
	const p = new PendingDeletes({
		commit: (ids, sync) => { commits.push({ ids, sync }); return commit(ids, sync); },
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
		assert.deepEqual([...p.hidden()], ["a"]);
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
		assert.equal(p.hidden().size, 0);
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
		assert.deepEqual([...p.hidden()], ["a"]);
		assert.equal(p.undo().length, 0);
		finish();
		await Promise.resolve();
		await Promise.resolve();
		assert.equal(p.hidden().size, 0);
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
		assert.equal(p.hidden().size, 0);
	});

	test("flush with nothing pending does nothing", () => {
		const { p, commits } = setup();
		p.flush(true);
		assert.equal(commits.length, 0);
	});
});

describe("withoutSessions", () => {
	test("drops the ids and leaves the input alone", () => {
		const values = { a: 1, b: 2, c: 3 };
		assert.deepEqual(withoutSessions(values, ["a", "c"]), { b: 2 });
		assert.deepEqual(values, { a: 1, b: 2, c: 3 });
	});
});

describe("notice text and countdown", () => {
	test("text for one and several", () => {
		assert.equal(noticeText([]), "");
		assert.equal(noticeText([{ id: "a", name: "Tax 2029", tabs: 3 }]), "Deleted “Tax 2029” (3 tabs)");
		assert.equal(noticeText([{ id: "a", name: "", tabs: 1 }]), "Deleted “saved window” (1 tab)");
		assert.equal(noticeText([item("a"), item("b"), item("c")]), "Deleted 3 saved windows");
	});

	test("seconds round up and never go negative", () => {
		assert.equal(secondsLeft(9000, 1000), 8);
		assert.equal(secondsLeft(9000, 1001), 8);
		assert.equal(secondsLeft(9000, 8999), 1);
		assert.equal(secondsLeft(9000, 9500), 0);
	});

	test("fraction left stays between 0 and 1", () => {
		assert.equal(fractionLeft(9000, 1000, 8000), 1);
		assert.equal(fractionLeft(9000, 5000, 8000), 0.5);
		assert.equal(fractionLeft(9000, 9500, 8000), 0);
		assert.equal(fractionLeft(9000, 0, 8000), 1);
		assert.equal(fractionLeft(9000, 0, 0), 0);
	});
});
