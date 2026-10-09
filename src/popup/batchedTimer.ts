// Uses performance.now(), not Date.now(): the screenshot harness freezes Date.now, and a frozen clock would never let a batch come due.
"use strict";

// One timer for many callbacks that are due at about the same time. Every tile
// ends its entrance animation (Tab: state.entering) 800 ms after it mounted;
// with a setTimeout each, 150 tiles mounted together (opening the popup, Back
// from the options, a layout switch) ran 150 tasks, and each task's setState
// was its own React commit. Here the callbacks that are due within SLACK ms of
// each other run in one task, so React renders them in one commit.

const SLACK = 16;

interface Entry { due : number, fn : () => void, done : boolean }

const queue : Entry[] = [];
let timer = 0;

function arm(now : number) {
	clearTimeout(timer);
	timer = 0;
	if (queue.length) timer = setTimeout(run, Math.max(0, queue[0].due - now)) as unknown as number;
}

function run() {
	const now = performance.now();
	const due : Entry[] = [];
	while (queue.length && queue[0].due <= now + SLACK) due.push(queue.shift()!);
	arm(now);
	// one failing callback must not keep the others from running
	for (const e of due) if (!e.done) {
		e.done = true;
		try { e.fn(); } catch (err) { console.error(err); }
	}
}

/** Calls `fn` after `ms`, batched with the others due then; returns a cancel function. */
export function batchedTimeout(fn : () => void, ms : number) : () => void {
	const now = performance.now();
	const entry : Entry = { due: now + ms, fn, done: false };
	let i = queue.length;
	while (i > 0 && queue[i - 1].due > entry.due) i--;
	queue.splice(i, 0, entry);
	if (i === 0) arm(now);
	return () => { entry.done = true; };
}
