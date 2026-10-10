"use strict";

// The maximize step of a restore (src/helpers/restoreMaximize.ts), against a
// fake browser: a window created normal on monitor 2 is maximized there; a
// browser that maximizes it on the popup's monitor gets it moved back and
// maximized again; refused updates are recorded.
// Run with: npm test

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { maximizeOnDisplay } from "../src/helpers/restoreMaximize.ts";
import type { WindowApi, WindowLike, RestoreStep } from "../src/helpers/restoreMaximize.ts";
import { restorePlan, knownDisplayList } from "../src/helpers/geometry.ts";
import type { Bounds } from "../src/helpers/geometry.ts";

const ONE : Bounds = { left: 0, top: 0, width: 1920, height: 1040 };
const TWO : Bounds = { left: 1920, top: 0, width: 1920, height: 1040 };
const BOTH = knownDisplayList(ONE, [{ bounds: ONE, workArea: ONE }, { bounds: TWO, workArea: TWO }]);
const PLAN = restorePlan({ state: "maximized", left: 1912, top: -8, width: 1936, height: 1056 }, BOTH);

// Chrome on Windows: a maximized window overhangs its monitor by 8 px
const maxOn = (d : Bounds) : WindowLike => ({ state: "maximized", left: d.left - 8, top: d.top - 8, width: d.width + 16, height: d.height + 16 });

// a fake windows API: `maximizeOn(n)` says which monitor the n-th maximize uses
function fakeBrowser(start : WindowLike, maximizeOn : (n : number, w : WindowLike) => Bounds, opts : { refuse? : string[], lag? : number } = {}) {
	let w : WindowLike = { ...start };
	let maximizes = 0;
	let lagging = 0;
	const calls : Record<string, unknown>[] = [];
	const api : WindowApi = {
		async get() {
			if (lagging > 0) { lagging--; return { ...w, state: "normal" }; }
			return { ...w };
		},
		async update(_id, props) {
			calls.push(props);
			if (opts.refuse && opts.refuse.includes(String(props.state))) throw new Error("refused " + props.state);
			if (props.state === "maximized") {
				w = maxOn(maximizeOn(++maximizes, w));
				lagging = opts.lag || 0;
			} else if (props.state === "normal") {
				w = { state: "normal", left: props.left as number, top: props.top as number, width: props.width as number, height: props.height as number };
			}
		},
		async sleep() {}
	};
	return { api, calls, now: () => w };
}

const centreOn = (w : WindowLike, d : Bounds) => {
	const x = w.left + w.width / 2, y = w.top + w.height / 2;
	return x >= d.left && x <= d.left + d.width && y >= d.top && y <= d.top + d.height;
};

describe("maximizeOnDisplay", () => {
	test("the plan: created normal filling monitor 2, to be maximized there", () => {
		assert.equal(PLAN.maximize, true);
		assert.deepEqual(PLAN.display, TWO);
		assert.deepEqual(PLAN.create, { type: "normal", incognito: false, ...TWO });
	});

	test("a browser that maximizes where the window is: one maximize, on monitor 2", async () => {
		const b = fakeBrowser({ state: "normal", ...TWO }, (_n, w) => centreOn(w, TWO) ? TWO : ONE);
		const steps : RestoreStep[] = [];
		await maximizeOnDisplay(b.api, 1, PLAN, steps);
		assert.deepEqual(b.calls, [{ state: "maximized" }]);
		assert.deepEqual(b.now(), maxOn(TWO));
		assert.deepEqual(steps.map((s) => s.step), ["created", "maximized"]);
	});

	test("created on the popup's monitor after all: moved to monitor 2 first", async () => {
		const b = fakeBrowser({ state: "normal", left: 100, top: 100, width: 800, height: 600 }, (_n, w) => centreOn(w, TWO) ? TWO : ONE);
		const steps : RestoreStep[] = [];
		await maximizeOnDisplay(b.api, 1, PLAN, steps);
		assert.deepEqual(b.calls, [{ state: "normal", ...TWO }, { state: "maximized" }]);
		assert.deepEqual(b.now(), maxOn(TWO));
	});

	test("maximized on the popup's monitor the first time: moved back and maximized again", async () => {
		const b = fakeBrowser({ state: "normal", ...TWO }, (n) => n === 1 ? ONE : TWO);
		const steps : RestoreStep[] = [];
		await maximizeOnDisplay(b.api, 1, PLAN, steps);
		assert.deepEqual(b.calls, [{ state: "maximized" }, { state: "normal", ...TWO }, { state: "maximized" }]);
		assert.deepEqual(b.now(), maxOn(TWO));
		assert.deepEqual(steps.map((s) => s.step), ["created", "maximized", "maximized"]);
		assert.deepEqual(steps[1].window, { state: "maximized", ...maxOn(ONE) });
	});

	test("always maximized on the popup's monitor: left normal on monitor 2, two tries", async () => {
		const b = fakeBrowser({ state: "normal", ...TWO }, () => ONE);
		const steps : RestoreStep[] = [];
		await maximizeOnDisplay(b.api, 1, PLAN, steps);
		assert.equal(b.calls.filter((c) => c.state === "maximized").length, 2);
		assert.deepEqual(b.now(), { state: "normal", ...TWO });
		assert.equal(steps[steps.length - 1].step, "left normal on the planned monitor");
	});

	test("a state that takes a moment to show: asked again, no second maximize", async () => {
		const b = fakeBrowser({ state: "normal", ...TWO }, () => TWO, { lag: 3 });
		const steps : RestoreStep[] = [];
		await maximizeOnDisplay(b.api, 1, PLAN, steps);
		assert.deepEqual(b.calls, [{ state: "maximized" }]);
		assert.deepEqual(steps[1].window, { state: "maximized", ...maxOn(TWO) });
	});

	test("maximize refused: recorded, the window stays on monitor 2", async () => {
		const b = fakeBrowser({ state: "normal", ...TWO }, () => TWO, { refuse: ["maximized"] });
		const steps : RestoreStep[] = [];
		await maximizeOnDisplay(b.api, 1, PLAN, steps);
		assert.equal(steps[1].step, "maximize refused");
		assert.match(String(steps[1].error), /refused maximized/);
		assert.deepEqual(b.now(), { state: "normal", ...TWO });
	});

	test("the window is gone meanwhile: no throw", async () => {
		const api : WindowApi = { get: async () => { throw new Error("No window with id"); }, update: async () => {}, sleep: async () => {} };
		const steps : RestoreStep[] = [];
		await maximizeOnDisplay(api, 1, PLAN, steps);
		assert.deepEqual(steps[0], { step: "created", window: null });
	});
});
