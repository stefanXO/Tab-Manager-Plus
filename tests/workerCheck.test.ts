"use strict";

// The popup's check that the service worker is the one it was built for
// (src/popup/workerCheck.ts): the decision on an answer (match, mismatch, no
// answer, a failed message, a worker that never answers), the notice text, and
// the scheduling (nothing before the delay, once, nothing after a cancel).
// Run with: npm test

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { workerState, checkWorker, staleWorkerText, scheduleWorkerCheck, CHECK_DELAY_MS } from "../src/popup/workerCheck.ts";

const V = "0123456789ab";

describe("workerState", () => {
	test("the same version is current", () => {
		assert.equal(workerState(V, V), "current");
	});
	test("another version is stale", () => {
		assert.equal(workerState(V, "ba9876543210"), "stale");
	});
	test("no answer (a worker that does not know the command) is stale", () => {
		assert.equal(workerState(V, undefined), "stale");
		assert.equal(workerState(V, null), "stale");
		assert.equal(workerState(V, ""), "stale");
	});
	test("an answer of another kind is stale", () => {
		assert.equal(workerState(V, 12), "stale");
		assert.equal(workerState(V, { version: V }), "stale");
	});
});

describe("checkWorker", () => {
	test("match", async () => {
		assert.equal(await checkWorker(async () => V, V), "current");
	});
	test("mismatch", async () => {
		assert.equal(await checkWorker(async () => "old", V), "stale");
	});
	test("undefined (an older worker resolves the unknown command with nothing)", async () => {
		assert.equal(await checkWorker(async () => undefined, V), "stale");
	});
	test("the message fails (rejected)", async () => {
		assert.equal(await checkWorker(() => Promise.reject(new Error("Could not establish connection.")), V), "stale");
	});
	test("the message throws on the spot", async () => {
		assert.equal(await checkWorker(() => { throw new Error("no runtime"); }, V), "stale");
	});
	test("a worker that does not answer in time is left alone", async () => {
		assert.equal(await checkWorker(() => new Promise(() => {}), V, 10), "unknown");
	});
	test("a late failure after the timeout is not an unhandled rejection", async () => {
		let reject : (e : Error) => void = () => {};
		const late = new Promise<never>((_, r) => { reject = r; });
		assert.equal(await checkWorker(() => late, V, 5), "unknown");
		reject(new Error("late"));
		await new Promise((r) => setTimeout(r, 5));
	});
});

describe("staleWorkerText", () => {
	test("names the page to reload the extension on, per browser", () => {
		assert.match(staleWorkerText(false), /out of date\. Reload the extension in chrome:\/\/extensions\.$/);
		assert.match(staleWorkerText(true), /out of date\. Reload the extension in about:debugging\.$/);
		assert.match(staleWorkerText(false), /^The background part of Tab Manager Plus/);
	});
});

// a clock the test drives: timers run when it is advanced
function fakeClock() {
	const timers : { id : number, at : number, run : () => void }[] = [];
	let now = 0, next = 1;
	return {
		setTimer: (run : () => void, ms : number) => { const id = next++; timers.push({ id, at: now + ms, run }); return id; },
		clearTimer: (id : unknown) => { const i = timers.findIndex((t) => t.id === id); if (i >= 0) timers.splice(i, 1); },
		advance(ms : number) {
			now += ms;
			for (const t of timers.filter((t) => t.at <= now)) { timers.splice(timers.indexOf(t), 1); t.run(); }
		},
		pending: () => timers.length
	};
}
const settle = () => new Promise((r) => setTimeout(r, 0));

describe("scheduleWorkerCheck", () => {
	test("asks nothing before the delay, then once, and reports a stale worker once", async () => {
		const clock = fakeClock();
		let asked = 0, stale = 0;
		scheduleWorkerCheck({ ask: async () => { asked++; return "old"; }, required: V, onStale: () => { stale++; }, ...clock });
		clock.advance(CHECK_DELAY_MS - 1);
		assert.equal(asked, 0);
		clock.advance(1);
		await settle();
		assert.equal(asked, 1);
		assert.equal(stale, 1);
		clock.advance(60000);
		await settle();
		assert.equal(asked, 1);
		assert.equal(stale, 1);
	});
	test("a current worker says nothing", async () => {
		const clock = fakeClock();
		let stale = 0;
		scheduleWorkerCheck({ ask: async () => V, required: V, onStale: () => { stale++; }, ...clock });
		clock.advance(CHECK_DELAY_MS);
		await settle();
		assert.equal(stale, 0);
	});
	test("a failed message reports a stale worker", async () => {
		const clock = fakeClock();
		let stale = 0;
		scheduleWorkerCheck({ ask: () => Promise.reject(new Error("gone")), required: V, onStale: () => { stale++; }, ...clock });
		clock.advance(CHECK_DELAY_MS);
		await settle();
		assert.equal(stale, 1);
	});
	test("the popup closing first: nothing is asked", async () => {
		const clock = fakeClock();
		let asked = 0, stale = 0;
		const cancel = scheduleWorkerCheck({ ask: async () => { asked++; return "old"; }, required: V, onStale: () => { stale++; }, ...clock });
		cancel();
		assert.equal(clock.pending(), 0);
		clock.advance(CHECK_DELAY_MS * 10);
		await settle();
		assert.equal(asked, 0);
		assert.equal(stale, 0);
	});
	test("the popup closing while the question is out: the answer is dropped", async () => {
		const clock = fakeClock();
		let stale = 0;
		let answer : (v : unknown) => void = () => {};
		const cancel = scheduleWorkerCheck({ ask: () => new Promise((r) => { answer = r; }), required: V, onStale: () => { stale++; }, ...clock });
		clock.advance(CHECK_DELAY_MS);
		cancel();
		answer("old");
		await settle();
		assert.equal(stale, 0);
	});
});
