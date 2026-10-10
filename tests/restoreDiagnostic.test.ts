"use strict";

// Restoring a window saved maximized on monitor 2 (step maxfix): the worker
// goes by the display list the popup predicted with (geometry.ts
// chooseRestoreDisplays), checks where the window ended up (onPlannedDisplay),
// and the everything export says what it knows (helpers/restoreDiagnostic.ts).
// Run with: npm test

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { chooseRestoreDisplays, displayList, onPlannedDisplay, planBounds, restorePlan, predictLanding, landingOf, knownDisplayList } from "../src/helpers/geometry.ts";
import type { Bounds, SavedWindowInfo } from "../src/helpers/geometry.ts";
import { buildRestoreDiagnostic, appendRestoreLog, savedBox, windowBox } from "../src/helpers/restoreDiagnostic.ts";
import type { RestoreTrace } from "../src/helpers/restoreDiagnostic.ts";

// two 1920x1080 monitors side by side, a 40 px taskbar on each (Windows)
const ONE : Bounds = { left: 0, top: 0, width: 1920, height: 1040 };
const TWO : Bounds = { left: 1920, top: 0, width: 1920, height: 1040 };
const INFO = [
	{ id: "1", name: "Primary", isPrimary: true, bounds: { left: 0, top: 0, width: 1920, height: 1080 }, workArea: ONE, dpiX: 96, modes: [{ width: 1920 }] },
	{ id: "2", name: "Second", isPrimary: false, bounds: { left: 1920, top: 0, width: 1920, height: 1080 }, workArea: TWO, dpiX: 96 },
];
const BOTH = knownDisplayList(ONE, INFO);
const POPUP_ONLY = knownDisplayList(ONE, []);
// what Chrome on Windows reports for a window maximized on monitor 2
const MAX_ON_TWO : SavedWindowInfo = { state: "maximized", incognito: false, left: 1912, top: -8, width: 1936, height: 1056 };

describe("chooseRestoreDisplays", () => {
	test("the popup's list wins when the worker knows fewer monitors (the bug: the worker knew only the popup's)", () => {
		assert.deepEqual(chooseRestoreDisplays(BOTH, POPUP_ONLY), { displays: BOTH, from: "popup" });
		// so the restore plan equals the hover card's prediction: maximized on monitor 2
		const plan = restorePlan(MAX_ON_TWO, chooseRestoreDisplays(BOTH, POPUP_ONLY).displays);
		assert.equal(plan.maximize, true);
		assert.deepEqual(plan.display, TWO);
		assert.deepEqual(landingOf(plan, BOTH), predictLanding(MAX_ON_TWO, BOTH));
		// what happened before: the worker's own list alone puts it on the popup's monitor
		assert.deepEqual(restorePlan(MAX_ON_TWO, POPUP_ONLY), { create: { type: "normal", incognito: false, state: "maximized" }, maximize: false });
	});
	test("the popup's list on a tie, the worker's when it knows more", () => {
		assert.equal(chooseRestoreDisplays(BOTH, BOTH).from, "popup");
		assert.deepEqual(chooseRestoreDisplays(POPUP_ONLY, BOTH), { displays: BOTH, from: "worker" });
	});
	test("nothing usable sent (an older popup, garbage): the worker's", () => {
		for (const sent of [undefined, null, "x", [], [{ left: 0 }], [{ left: 0, top: 0, width: 0, height: 10 }], [{ left: NaN, top: 0, width: 10, height: 10 }]]) {
			assert.deepEqual(chooseRestoreDisplays(sent, POPUP_ONLY), { displays: POPUP_ONLY, from: "worker" }, JSON.stringify(sent));
		}
	});
	test("displayList keeps the usable entries, only their bounds", () => {
		assert.deepEqual(displayList([{ ...ONE, extra: 1 }, null, { left: 1, top: 2, width: -1, height: 5 }, TWO]), [ONE, TWO]);
		assert.deepEqual(displayList({}), []);
	});
});

describe("onPlannedDisplay", () => {
	const plan = restorePlan(MAX_ON_TWO, BOTH);
	test("maximized on monitor 2 as Chrome on Windows reports it (-8,-8 overhang): there", () => {
		assert.equal(onPlannedDisplay(plan, { left: 1912, top: -8, width: 1936, height: 1056 }), true);
		assert.equal(onPlannedDisplay(plan, TWO), true);
	});
	test("maximized on the popup's monitor instead: not there", () => {
		assert.equal(onPlannedDisplay(plan, { left: -8, top: -8, width: 1936, height: 1056 }), false);
		assert.equal(onPlannedDisplay(plan, ONE), false);
	});
	test("plans that name no display, and windows without a position, count as there", () => {
		assert.equal(onPlannedDisplay(restorePlan({ state: "normal", left: 10, top: 10, width: 800, height: 600 }, BOTH), ONE), true);
		assert.equal(onPlannedDisplay(restorePlan(MAX_ON_TWO, POPUP_ONLY), ONE), true);
		assert.equal(onPlannedDisplay(plan, {}), true);
		assert.equal(onPlannedDisplay(plan, null), true);
	});
	test("planBounds: the create bounds, or null", () => {
		assert.deepEqual(planBounds(plan), TWO);
		assert.equal(planBounds(restorePlan(MAX_ON_TWO, POPUP_ONLY)), null);
	});
});

describe("buildRestoreDiagnostic", () => {
	const sessions = [
		{ id: "a", name: "Max on 2", windowsInfo: MAX_ON_TWO },
		{ id: "b", name: "Normal", windowsInfo: { state: "normal", left: 100, top: 100, width: 800, height: 600, incognito: false } },
		{ id: "c", windowsInfo: undefined },
	];
	test("the worker's monitors, the popup's list, and each saved window's plan", () => {
		const d = buildRestoreDiagnostic({ browser: "chrome", permission: true, displayInfo: INFO, screen: ONE, popupDisplays: BOTH, sessions });
		assert.equal(d.permission, true);
		// only the listed fields of each monitor
		assert.deepEqual(d.displayInfo[0], { id: "1", name: "Primary", isPrimary: true, bounds: INFO[0].bounds, workArea: ONE, dpiX: 96 });
		assert.deepEqual(d.workerDisplays, BOTH);
		assert.deepEqual(d.popupDisplays, BOTH);
		assert.deepEqual(d.displays, BOTH);
		assert.equal(d.from, "popup");
		assert.deepEqual(d.saved.map((s) => [s.id, s.name, s.saved.state, s.plan.maximize, s.landing.maximized]), [
			["a", "Max on 2", "maximized", true, true],
			["b", "Normal", "normal", false, false],
			["c", "", "", false, false],
		]);
		assert.deepEqual(d.saved[0].saved, { state: "maximized", left: 1912, top: -8, width: 1936, height: 1056 });
		assert.deepEqual(d.saved[0].plan.display, TWO);
		assert.deepEqual(d.saved[0].landing.bounds, TWO);
		assert.deepEqual(d.log, []);
		assert.equal("displayError" in d, false);
	});
	test("a worker whose query failed: the error, and the popup's list carries the plan", () => {
		const d = buildRestoreDiagnostic({ browser: "chrome", permission: true, displayInfo: [], displayError: "TypeError: x", screen: ONE, popupDisplays: BOTH, sessions: sessions.slice(0, 1) });
		assert.equal(d.displayError, "TypeError: x");
		assert.deepEqual(d.workerDisplays, POPUP_ONLY);
		assert.equal(d.from, "popup");
		assert.deepEqual(d.saved[0].plan.display, TWO);
	});
	test("Firefox: no permission, the popup's monitor", () => {
		const d = buildRestoreDiagnostic({ browser: "firefox", permission: null, displayInfo: [], screen: ONE, popupDisplays: POPUP_ONLY, sessions: sessions.slice(0, 1) });
		assert.equal(d.permission, null);
		assert.deepEqual(d.displays, POPUP_ONLY);
		assert.equal(d.saved[0].plan.create.state, "maximized");
	});
	test("the log: kept when it is a list, newest last, at most five", () => {
		const trace = (n : number) : RestoreTrace => ({ at: String(n), saved: savedBox({}), screen: null, own: [], sent: [], from: "worker", plan: restorePlan({}, []), steps: [] });
		let log : RestoreTrace[] = [];
		for (let i = 1; i <= 7; i++) log = appendRestoreLog(log, trace(i));
		assert.deepEqual(log.map((t) => t.at), ["3", "4", "5", "6", "7"]);
		assert.deepEqual(appendRestoreLog("junk", trace(1)).length, 1);
		assert.deepEqual(buildRestoreDiagnostic({ browser: "chrome", permission: false, displayInfo: [], sessions: [], log }).log, log);
		assert.deepEqual(buildRestoreDiagnostic({ browser: "chrome", permission: false, displayInfo: [], sessions: [], log: "junk" }).log, []);
	});
	test("windowBox: state and the numbers it has", () => {
		assert.deepEqual(windowBox({ state: "maximized", left: 1912, top: -8, width: 1936, height: 1056 }), { state: "maximized", left: 1912, top: -8, width: 1936, height: 1056 });
		assert.deepEqual(windowBox({}), { state: "" });
		assert.equal(windowBox(null), null);
	});
});
