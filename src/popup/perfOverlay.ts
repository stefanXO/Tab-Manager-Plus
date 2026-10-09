"use strict";

// Development builds only: a small box in the popup's corner with
//   fps        frames the page drew in the last second (requestAnimationFrame)
//   commits/s  React commits in the last second, and the last one's duration
//              (React.Profiler around the root, see popup.tsx)
//   long       long tasks (over 50 ms) since the popup opened
//   input      the last click / mousemove / keydown: ms from the event to the
//              frame after it (the first task after the next animation frame)
//   top 3      the hover path's most expensive functions in the last second:
//              total ms (and calls) of each perfSpan (./perfSpan.ts) name.
//              Time a long task spends outside all of them is style, layout
//              and paint (or code not wrapped yet)
//
// Every call site is behind `process.env.NODE_ENV !== "production"`, which the
// production build replaces by false, so esbuild drops this module from it
// (tests/perfOverlay.test.ts checks for PERF_MARKER in the production bundle).
// Off with ?perf=0 (on again with ?perf=1), or for good with
// localStorage.perfOverlay = "0". The numbers are also on window.__tmPerf for
// headless scripts.

import {PERF_SPAN_PREFIX} from "./perfSpan.ts";

export const PERF_MARKER = "tmp-perf-overlay";

interface PerfStats {
	fps : number;
	commits : number;
	commitMs : number;
	commitsTotal : number;
	longTasks : number;
	longestTaskMs : number;
	input : { type : string, ms : number }[];
	// the last second's most expensive perfSpan names
	top : { name : string, ms : number, calls : number }[];
}

const stats : PerfStats = { fps: 0, commits: 0, commitMs: 0, commitsTotal: 0, longTasks: 0, longestTaskMs: 0, input: [], top: [] };
let spans : { t : number, name : string, ms : number }[] = [];
let commitTimes : number[] = [];
let started = false;

/** Whether the overlay is wanted: ?perf=0/1 first, then localStorage.perfOverlay, else on. */
export function perfOverlayWanted() : boolean {
	const q = /[?&]perf(?:=([^&]*))?/.exec(location.search);
	if (q) return q[1] !== "0" && q[1] !== "false";
	try { return localStorage.getItem("perfOverlay") !== "0"; } catch { return true; }
}

/** React.Profiler's onRender: one call per commit of the wrapped tree. */
export function perfCommit(_id : string, _phase : string, actualDuration : number) {
	commitTimes.push(performance.now());
	stats.commitsTotal++;
	stats.commitMs = actualDuration;
}

export function startPerfOverlay() {
	if (started) return;
	started = true;
	(window as any).__tmPerf = stats;
	// perfSpan times only while this runs
	(globalThis as any).__tmPerfSpans = true;

	const box = document.createElement("div");
	box.id = PERF_MARKER;
	box.style.cssText = "position:fixed;left:2px;bottom:2px;z-index:2147483647;pointer-events:none;" +
		"font:10px/1.3 ui-monospace,monospace;color:#0f0;background:rgba(0,0,0,.75);padding:2px 4px;border-radius:3px;white-space:pre;contain:strict;width:190px;height:91px;overflow:hidden";
	document.body.appendChild(box);

	// fps
	let frames : number[] = [];
	const frame = (t : number) => {
		frames.push(t);
		requestAnimationFrame(frame);
	};
	requestAnimationFrame(frame);

	// long tasks
	try {
		new PerformanceObserver((list) => {
			for (const e of list.getEntries()) {
				stats.longTasks++;
				stats.longestTaskMs = Math.max(stats.longestTaskMs, e.duration);
			}
		}).observe({ type: "longtask", buffered: true });
	} catch { /* not supported (Firefox) */ }

	// the hover path's timed functions (perfSpan); the timeline's copies are
	// dropped as they arrive, so it never grows
	try {
		new PerformanceObserver((list) => {
			for (const e of list.getEntries()) {
				if (e.name.startsWith(PERF_SPAN_PREFIX)) spans.push({ t: e.startTime + e.duration, name: e.name.slice(PERF_SPAN_PREFIX.length), ms: e.duration });
			}
			performance.clearMeasures();
		}).observe({ type: "measure" });
	} catch { /* no User Timing observer */ }

	// event to the next frame: the rAF callback runs before the paint, a task
	// queued from it runs after it
	const channel = new MessageChannel();
	let pending : { type : string, t0 : number } | null = null;
	channel.port1.onmessage = () => {
		if (!pending) return;
		stats.input.unshift({ type: pending.type, ms: performance.now() - pending.t0 });
		stats.input.length = Math.min(stats.input.length, 20);
		pending = null;
	};
	const onInput = (e : Event) => {
		// a click or key takes over from a mousemove still waiting for its frame
		if (pending && (pending.type !== "mousemove" || e.type === "mousemove")) return;
		pending = { type: e.type, t0: e.timeStamp };
		requestAnimationFrame(() => channel.port2.postMessage(0));
	};
	for (const type of ["click", "mousemove", "keydown"]) document.addEventListener(type, onInput, { capture: true, passive: true });

	setInterval(() => {
		const now = performance.now();
		frames = frames.filter((t) => now - t < 1000);
		commitTimes = commitTimes.filter((t) => now - t < 1000);
		stats.fps = frames.length;
		stats.commits = commitTimes.length;
		spans = spans.filter((s) => now - s.t < 1000);
		const sums = new Map<string, { ms : number, calls : number }>();
		for (const s of spans) {
			const v = sums.get(s.name) || { ms: 0, calls: 0 };
			v.ms += s.ms;
			v.calls++;
			sums.set(s.name, v);
		}
		stats.top = [...sums].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.ms - a.ms).slice(0, 3);
		const last = stats.input[0];
		box.textContent =
			`fps ${stats.fps}\n` +
			`commits/s ${stats.commits} last ${stats.commitMs.toFixed(1)}ms\n` +
			`long tasks ${stats.longTasks} max ${stats.longestTaskMs.toFixed(0)}ms\n` +
			(last ? `${last.type} → paint ${last.ms.toFixed(1)}ms` : "input –") +
			(stats.top.length ? "\n" + stats.top.map((s) => `${s.name} ${s.ms.toFixed(1)}ms ×${s.calls}`).join("\n") : "\nno timed work");
	}, 500);
}
