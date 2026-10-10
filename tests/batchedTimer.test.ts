"use strict";

// batchedTimeout (src/popup/batchedTimer.ts): callbacks due together run in
// one task, so the tiles' end-of-entrance setStates make one React commit.
// Run with: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { batchedTimeout } from "../src/popup/batchedTimer.ts";

const sleep = (ms : number) => new Promise((r) => setTimeout(r, ms));

test("callbacks due together run in the same task, a cancelled one never", async () => {
	const ran : string[] = [];
	let task = 0;
	const tick = setInterval(() => task++, 1);
	const at : number[] = [];
	for (let i = 0; i < 50; i++) batchedTimeout(() => { ran.push("t" + i); at.push(task); }, 30);
	const cancel = batchedTimeout(() => ran.push("cancelled"), 30);
	cancel();
	await sleep(80);
	clearInterval(tick);
	assert.equal(ran.length, 50);
	assert.ok(!ran.includes("cancelled"));
	assert.equal(new Set(at).size, 1, "all ran in one task");
});

test("a throwing callback does not stop the next one", async () => {
	const ran : string[] = [];
	const err = console.error; console.error = () => {};
	batchedTimeout(() => { throw new Error("boom"); }, 10);
	batchedTimeout(() => ran.push("next"), 10);
	await sleep(60);
	console.error = err;
	assert.deepEqual(ran, ["next"]);
});

test("a later callback is not run early", async () => {
	const ran : string[] = [];
	batchedTimeout(() => ran.push("a"), 10);
	batchedTimeout(() => ran.push("b"), 120);
	await sleep(60);
	assert.deepEqual(ran, ["a"]);
	await sleep(120);
	assert.deepEqual(ran, ["a", "b"]);
});
