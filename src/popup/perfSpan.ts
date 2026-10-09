"use strict";

// Development builds only: times a function on the hover path as a User
// Timing measure ("tm:<name>"), which the perf overlay (./perfOverlay.ts)
// sums per second and shows the three most expensive of. In the production
// build the condition is the constant false (build.mjs defines NODE_ENV), so
// esbuild leaves just the call: no timing, no measure, nothing of the overlay
// (tests/perfOverlay.test.ts checks the bundle). Only while the overlay runs
// (it sets the flag): with ?perf=0 nothing is timed either.

export const PERF_SPAN_PREFIX = "tm:";

export function perfSpan<T>(name : string, fn : () => T) : T {
	if (process.env.NODE_ENV === "production" || !(globalThis as any).__tmPerfSpans) return fn();
	const start = performance.now();
	try {
		return fn();
	} finally {
		try { performance.measure(PERF_SPAN_PREFIX + name, { start }); } catch { /* an old engine without the options form */ }
	}
}
