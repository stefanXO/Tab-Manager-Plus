"use strict";

// The saved window's hover card (step 08): its text (src/popup/stats.ts
// savedWindowStats), its hover key (statsHoverLogic.ts), and the landing
// preview, which must predict exactly what the worker's restore does
// (src/helpers/geometry.ts restoreCreate / predictLanding / knownDisplayList).
// Run with: npm test

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { restoreCreate, restorePlan, predictLanding, landingOf, knownDisplayList } from "../src/helpers/geometry.ts";
import type { Bounds, SavedWindowInfo } from "../src/helpers/geometry.ts";
import { savedWindowStats } from "../src/popup/stats.ts";
import type { StatsLine } from "../src/popup/stats.ts";
import { hoverKey, parseKey, hoverAction } from "../src/popup/statsHoverLogic.ts";
import type { HoverNode } from "../src/popup/statsHoverLogic.ts";

// the popup's monitor (a work area) and a second one to its right
const POPUP : Bounds = { left: 0, top: 0, width: 1920, height: 1040 };
const SECOND_INFO = { bounds: { left: 1920, top: -180, width: 2560, height: 1440 }, workArea: { left: 1920, top: -180, width: 2560, height: 1400 } };
const PRIMARY_INFO = { bounds: { left: 0, top: 0, width: 1920, height: 1080 }, workArea: POPUP };
const BOTH = knownDisplayList(POPUP, [PRIMARY_INFO, SECOND_INFO]);
const ONLY_POPUP = knownDisplayList(POPUP, []);

const saved = (b : Partial<SavedWindowInfo>) : SavedWindowInfo => ({ state: "normal", incognito: false, ...b });

// what the worker passes to windows.create, as bounds (or null: none)
function workerBounds(info : SavedWindowInfo, displays : Bounds[]) : Bounds | null {
	const c = restoreCreate(info, displays);
	return typeof c.left === "number" ? { left: c.left, top: c.top, width: c.width, height: c.height } : null;
}

describe("knownDisplayList", () => {
	test("the popup's display first, then each work area not already in", () => {
		assert.deepEqual(BOTH, [POPUP, SECOND_INFO.workArea]);
	});
	test("bounds when a display has no work area; none known: just the popup's", () => {
		assert.deepEqual(knownDisplayList(undefined, [{ bounds: SECOND_INFO.bounds }]), [SECOND_INFO.bounds]);
		assert.deepEqual(ONLY_POPUP, [POPUP]);
		assert.deepEqual(knownDisplayList(undefined, []), []);
	});
});

describe("landing preview = the worker's restore", () => {
	const cases : [string, SavedWindowInfo, Bounds[]][] = [
		["on screen", saved({ left: 100, top: 50, width: 1200, height: 800 }), BOTH],
		["on the second monitor", saved({ left: 2400, top: 0, width: 1400, height: 900 }), BOTH],
		["off screen (its monitor is gone)", saved({ left: 5000, top: 200, width: 1200, height: 800 }), BOTH],
		["off screen, only the popup's monitor known", saved({ left: 2400, top: 0, width: 1400, height: 900 }), ONLY_POPUP],
		["too big for its monitor", saved({ left: 0, top: 0, width: 3440, height: 1440 }), BOTH],
		["maximized on the second monitor", saved({ state: "maximized", left: 1912, top: -188, width: 2576, height: 1416 }), BOTH],
		["maximized on the popup's monitor", saved({ state: "maximized", left: -8, top: -8, width: 1936, height: 1056 }), BOTH],
		["maximized, its monitor is gone", saved({ state: "maximized", left: 5000, top: 0, width: 1920, height: 1040 }), BOTH],
		["maximized, only the popup's monitor known", saved({ state: "maximized", left: 1912, top: -188, width: 2576, height: 1416 }), ONLY_POPUP],
		["maximized without bounds", saved({ state: "maximized" }), BOTH],
		["fullscreen", saved({ state: "fullscreen", left: 0, top: 0, width: 1920, height: 1080 }), BOTH],
		["fullscreen without bounds", saved({ state: "fullscreen" }), ONLY_POPUP],
		["unusable bounds", saved({ left: 0, top: 0, width: 50, height: 50 }), BOTH],
		["no display known", saved({ left: 0, top: 0, width: 800, height: 600 }), []],
	];
	for (const [name, info, displays] of cases) {
		test(name + ": the preview's bounds are the ones the worker creates", () => {
			const l = predictLanding(info, displays);
			const plan = restorePlan(info, displays);
			const c = plan.create;
			if (plan.maximize) {
				// created normal inside its monitor, then maximized: it fills that monitor
				assert.equal(l.maximized, true);
				assert.equal(c.state, undefined);
				assert.deepEqual(l.bounds, plan.display);
				assert.ok(displays.some((d) => d.left === l.bounds.left && d.top === l.bounds.top));
				const b = workerBounds(info, displays);
				assert.ok(b.left >= l.bounds.left && b.top >= l.bounds.top);
				assert.ok(b.left + b.width <= l.bounds.left + l.bounds.width && b.top + b.height <= l.bounds.top + l.bounds.height);
			} else if (c.state === "maximized") {
				assert.equal(l.maximized, true);
				assert.equal(workerBounds(info, displays), null);
				// a window created maximized fills the display a new window opens on
				assert.deepEqual(l.bounds, displays[0] || null);
			} else {
				assert.equal(l.maximized, false);
				assert.deepEqual(l.bounds, workerBounds(info, displays));
			}
		});
	}

	test("the predicted bounds themselves", () => {
		assert.deepEqual(predictLanding(cases[0][1], BOTH).bounds, { left: 100, top: 50, width: 1200, height: 800 });
		assert.deepEqual(predictLanding(cases[1][1], BOTH).bounds, { left: 2400, top: 0, width: 1400, height: 900 });
		// gone: onto the popup's monitor, pulled inside
		assert.deepEqual(predictLanding(cases[2][1], BOTH).bounds, { left: 720, top: 200, width: 1200, height: 800 });
		assert.deepEqual(predictLanding(cases[3][1], ONLY_POPUP).bounds, { left: 520, top: 0, width: 1400, height: 900 });
		// shrunk to the popup's work area
		assert.deepEqual(predictLanding(cases[4][1], BOTH).bounds, { left: 0, top: 0, width: 1920, height: 1040 });
		assert.deepEqual(predictLanding(cases[5][1], BOTH), { bounds: SECOND_INFO.workArea, maximized: true });
		assert.deepEqual(predictLanding(cases[6][1], BOTH), { bounds: POPUP, maximized: true });
		// not connected / unknown: the display a new window opens on, the popup's
		for (const i of [7, 8, 9, 11]) assert.deepEqual(predictLanding(cases[i][1], cases[i][2]), { bounds: POPUP, maximized: true }, cases[i][0]);
		// fullscreen is restored like maximized
		assert.deepEqual(predictLanding(cases[10][1], BOTH), { bounds: POPUP, maximized: true });
		assert.deepEqual(predictLanding(cases[12][1], BOTH), { bounds: null, maximized: false });
		assert.deepEqual(predictLanding(cases[13][1], []), { bounds: null, maximized: false });
	});

	test("a window saved maximized comes back maximized on the monitor it was saved on", () => {
		// second monitor, saved with the few pixels a maximized window overhangs: created normal inside its work area, then maximized
		const plan = restorePlan(cases[5][1], BOTH);
		assert.equal(plan.maximize, true);
		assert.deepEqual(plan.display, SECOND_INFO.workArea);
		assert.deepEqual(plan.create, { type: "normal", incognito: false, left: 1920, top: -180, width: 2560, height: 1400 });
		// the popup's monitor
		assert.deepEqual(restorePlan(cases[6][1], BOTH).create, { type: "normal", incognito: false, left: 0, top: 0, width: 1920, height: 1040 });
		// a state never goes together with bounds (Chrome refuses it)
		for (const c of cases) {
			const create = restoreCreate(c[1], c[2]);
			assert.ok(!(create.state && typeof create.left === "number"), c[0]);
		}
		// its centre decides, not the corner: a window mostly on the second monitor
		const mostly = saved({ state: "maximized", left: 1800, top: 0, width: 2000, height: 1000 });
		assert.deepEqual(restorePlan(mostly, BOTH).display, SECOND_INFO.workArea);
	});

	test("a maximized window whose monitor is not connected is created maximized, for the popup's monitor", () => {
		for (const i of [7, 8, 9, 11]) {
			const plan = restorePlan(cases[i][1], cases[i][2]);
			assert.equal(plan.maximize, false, cases[i][0]);
			assert.deepEqual(plan.create, { type: "normal", incognito: false, state: "maximized" }, cases[i][0]);
			assert.deepEqual(landingOf(plan, cases[i][2]), { bounds: cases[i][2][0], maximized: true });
		}
	});

	test("a second monitor placed left of or above the popup's works too", () => {
		const left : Bounds = { left: -1280, top: 100, width: 1280, height: 900 };
		const displays = knownDisplayList(POPUP, [PRIMARY_INFO, { bounds: left, workArea: left }]);
		const plan = restorePlan(saved({ state: "maximized", left: -1288, top: 92, width: 1296, height: 916 }), displays);
		assert.equal(plan.maximize, true);
		assert.deepEqual(plan.display, left);
		assert.deepEqual(plan.create, { type: "normal", incognito: false, ...left });
	});

	test("restoreCreate keeps incognito and the window type", () => {
		assert.deepEqual(restoreCreate(saved({ incognito: true, state: "maximized" }), BOTH), { type: "normal", incognito: true, state: "maximized" });
		assert.deepEqual(restoreCreate(saved({ incognito: true, state: "maximized", left: 0, top: 0, width: 1920, height: 1040 }), BOTH),
			{ type: "normal", incognito: true, left: 0, top: 0, width: 1920, height: 1040 });
		assert.deepEqual(landingOf({ create: { type: "normal", incognito: false }, maximize: false }, BOTH), { bounds: null, maximized: false });
	});

	// the two callers must keep going through the shared functions
	test("the worker and the popup call the shared placement", () => {
		const worker = readFileSync(new URL("../src/service_worker/background/windows.ts", import.meta.url), "utf8");
		// the plan over the display list the popup sent, unless the worker knows more
		assert.match(worker, /const choice = chooseRestoreDisplays\(sent, own\.displays\);/);
		assert.match(worker, /plan: restorePlan\(saved, choice\.displays\)/);
		// created normal inside the monitor, then maximized (and checked), when the plan says so
		assert.match(worker, /plan\.maximize\) \{[^}]*await maximizeOnDisplay\(windowApi, newWindow\.id, plan, trace\.steps\);/);
		assert.match(worker, /knownDisplayList\(screen, info\)/);
		const popup = readFileSync(new URL("../src/popup/statsHover.ts", import.meta.url), "utf8");
		assert.match(popup, /predictLanding\(info, this\.displays\.restore\)/);
		assert.match(popup, /const restore = await restoreDisplays\(\);/);
		const list = readFileSync(new URL("../src/popup/restoreDisplays.ts", import.meta.url), "utf8");
		assert.match(list, /knownDisplayList\(popupScreen\(\), await chrome\.system\.display\.getInfo\(\)\)/);
		// and both restore commands send the worker the screen and the list it previews with
		for (const file of ["Session.tsx", "TabManager.tsx"]) {
			const view = readFileSync(new URL("../src/popup/views/" + file, import.meta.url), "utf8");
			assert.match(view, /command: S\.create_window_with_session_tabs,[\s\S]{0,200}screen: popupScreen\(\),\s*\/\/[^\n]*\n\s*displays: await restoreDisplays\(\)/, file);
		}
		const actions = readFileSync(new URL("../src/service_worker/background/actions.ts", import.meta.url), "utf8");
		assert.match(actions, /createWindowWithSessionTabs\(request\.session, request\.tab_id, request\.screen, request\.displays\)/);
	});
});

describe("savedWindowStats", () => {
	const DAY = 24 * 3600e3;
	const now = Date.parse("2030-06-01T12:00:00Z");
	const tabs = [
		{ url: "https://news.ycombinator.com/", pinned: true },
		{ url: "https://en.wikipedia.org/wiki/Tab" },
		{ url: "https://en.wikipedia.org/wiki/Browser", discarded: true, audible: true },
	];
	const info = { state: "normal", left: 0, top: 0, width: 1600, height: 900 };
	const line = (lines : StatsLine[], key : string) => lines.find((l) => l.key === key);
	const base = { now, name: "Conference reading", savedAt: now - 2 * DAY };

	test("title, counts (pinned only), sites, saved, saved as, hint", () => {
		const card = savedWindowStats(info, tabs, base);
		assert.equal(card.title, "Conference reading");
		assert.equal(line(card.lines, "counts").text, "3 tabs · 1 pinned");
		assert.equal(line(card.lines, "sites").text, "2 sites");
		assert.equal(line(card.lines, "saved").text, "saved 2 days ago");
		assert.equal(line(card.lines, "savedAs").text, "saved as 1600×900");
		assert.ok(line(card.lines, "restoreHint"));
		// no monitors known yet: no landing line
		assert.equal(line(card.lines, "landing"), undefined);
	});
	test("saved state words", () => {
		const card = savedWindowStats({ ...info, state: "maximized", incognito: true }, tabs, base);
		assert.equal(line(card.lines, "savedAs").text, "saved as 1600×900 · maximized · incognito");
	});
	test("no name: Saved window", () => {
		assert.equal(savedWindowStats(info, [], { ...base, name: "" }).title, "Saved window");
	});
	const one = { index: 1, count: 1 };
	const two = (index : number) => ({ index, count: 2 });
	test("landing: where it goes", () => {
		const at = (landing) => line(savedWindowStats(info, tabs, { ...base, landing }).lines, "landing").text;
		assert.equal(at({ bounds: { left: 0, top: 0, width: 1600, height: 900 }, maximized: false, monitor: one }), "restores at 1600×900");
		assert.equal(at({ bounds: { left: 0, top: 0, width: 1600, height: 900 }, maximized: false, monitor: two(1) }), "restores at 1600×900 on monitor 1 of 2");
		assert.equal(at({ bounds: { left: 200, top: 0, width: 1600, height: 900 }, maximized: false, monitor: one }), "restores at 1600×900 · moved to fit");
		assert.equal(at({ bounds: { left: 0, top: 0, width: 1600, height: 800 }, maximized: false, monitor: two(2) }), "restores at 1600×800 on monitor 2 of 2 · shrunk to fit");
		assert.equal(at({ bounds: POPUP, maximized: true, monitor: two(1) }), "restores maximized on monitor 1 of 2");
		assert.equal(at({ bounds: POPUP, maximized: true, monitor: one }), "restores maximized");
		assert.equal(at({ bounds: { left: 2400, top: 0, width: 1400, height: 900 }, maximized: false, monitor: null }), "restores on another monitor");
		assert.equal(at({ bounds: null, maximized: false, monitor: null }), "restores where the browser puts new windows");
	});
});

describe("saved window hover key", () => {
	const el = (id : string) : HoverNode => ({ id, closest: () => null });
	const node = (matches : Record<string, HoverNode>) : HoverNode => ({ id: "", closest: (sel : string) => matches[sel] || null });
	const SESSION = ".window-container .window[id^='session-']";
	const SAVED_TAB = ".window-container .tab[id^='sessiontab_']";

	test("on a saved window card: S<saved window id>", () => {
		assert.equal(hoverKey(node({ [SESSION]: el("session-s1") })), "Ss1");
		assert.equal(hoverKey(node({ [SESSION]: el("session-a_b-9") })), "Sa_b-9");
	});
	test("a saved tab wins; its action buttons are no target", () => {
		assert.equal(hoverKey(node({ [SAVED_TAB]: el("sessiontab_s1_2"), [SESSION]: el("session-s1") })), "ss1_2");
		assert.equal(hoverKey(node({ ".window-actions": el(""), [SESSION]: el("session-s1") })), "");
	});
	test("parseKey", () => {
		assert.deepEqual(parseKey("Ss1"), { kind: "session", sessionId: "s1" });
		assert.deepEqual(parseKey("Sa_b_3"), { kind: "session", sessionId: "a_b_3" });
		assert.equal(parseKey("S"), null);
	});
	test("behaves as a window: warm still settles", () => {
		assert.deepEqual(hoverAction("Ss1", "t4", true, true), { kind: "show", key: "Ss1", delay: 100 });
	});
});
