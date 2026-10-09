"use strict";

// Unit tests for the notice countdown in src/popup/countdown.ts: it runs, a
// hold stops it, a release goes on with the time that was left.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Countdown } from "../src/popup/countdown.ts";

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

function setup() {
	const t = fakeTimers();
	let ended = 0;
	const c = new Countdown(t, () => { ended++; });
	return { t, c, ended: () => ended };
}

describe("Countdown", () => {
	test("ends once, after its time", () => {
		const { t, c, ended } = setup();
		c.start(8000);
		assert.equal(c.active, true);
		assert.equal(c.left, 8000);
		t.advance(7999);
		assert.equal(ended(), 0);
		assert.equal(c.left, 1);
		t.advance(1);
		assert.equal(ended(), 1);
		assert.equal(c.active, false);
		assert.equal(c.left, 0);
		t.advance(60000);
		assert.equal(ended(), 1);
	});

	test("held, the time left stands still and no timer runs", () => {
		const { t, c, ended } = setup();
		c.start(8000);
		t.advance(3000);
		c.hold(true);
		assert.equal(t.active(), 0);
		assert.equal(c.left, 5000);
		t.advance(100000);
		assert.equal(c.left, 5000);
		assert.equal(ended(), 0);
		assert.equal(c.isHeld, true);
	});

	test("let go, it goes on with what was left", () => {
		const { t, c, ended } = setup();
		c.start(8000);
		t.advance(3000);
		c.hold(true);
		t.advance(50000);
		c.hold(false);
		assert.equal(c.left, 5000);
		t.advance(4999);
		assert.equal(ended(), 0);
		t.advance(1);
		assert.equal(ended(), 1);
	});

	test("held and let go again and again adds up", () => {
		const { t, c, ended } = setup();
		c.start(8000);
		for (let i = 0; i < 4; i++) {
			t.advance(1000);
			c.hold(true);
			t.advance(10000);
			c.hold(false);
		}
		assert.equal(c.left, 4000);
		t.advance(4000);
		assert.equal(ended(), 1);
	});

	test("holding twice or letting go twice changes nothing", () => {
		const { t, c, ended } = setup();
		c.start(8000);
		t.advance(2000);
		c.hold(true);
		c.hold(true);
		t.advance(5000);
		c.hold(false);
		c.hold(false);
		t.advance(6000);
		assert.equal(ended(), 1);
	});

	test("a restart is the whole time again, and counts as a new run", () => {
		const { t, c, ended } = setup();
		c.start(8000);
		const runs = c.runs;
		t.advance(7000);
		c.start(8000);
		assert.equal(c.runs, runs + 1);
		t.advance(7999);
		assert.equal(ended(), 0);
		t.advance(1);
		assert.equal(ended(), 1);
	});

	test("a restart while held waits for the release, with the whole time", () => {
		const { t, c, ended } = setup();
		c.start(8000);
		t.advance(2000);
		c.hold(true);
		c.start(8000);
		assert.equal(t.active(), 0);
		assert.equal(c.left, 8000);
		t.advance(100000);
		assert.equal(ended(), 0);
		c.hold(false);
		t.advance(8000);
		assert.equal(ended(), 1);
	});

	test("stop cancels it and ends the hold", () => {
		const { t, c, ended } = setup();
		c.start(8000);
		c.hold(true);
		c.stop();
		assert.equal(c.active, false);
		assert.equal(c.isHeld, false);
		c.start(1000);
		t.advance(1000);
		assert.equal(ended(), 1);
		c.start(1000);
		c.stop();
		t.advance(5000);
		assert.equal(ended(), 1);
	});

	test("it ends the hold too when it has run out", () => {
		const { t, c, ended } = setup();
		c.start(1000);
		t.advance(1000);
		assert.equal(ended(), 1);
		assert.equal(c.isHeld, false);
		c.start(1000);
		t.advance(1000);
		assert.equal(ended(), 2);
	});

	test("a hold before it starts is kept for the start", () => {
		const { t, c, ended } = setup();
		c.hold(true);
		c.start(1000);
		t.advance(5000);
		assert.equal(ended(), 0);
		c.hold(false);
		t.advance(1000);
		assert.equal(ended(), 1);
	});
});
