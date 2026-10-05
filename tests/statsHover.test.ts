"use strict";

// Unit tests for the stats card's hover rules in src/popup/statsHoverLogic.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { hoverKey, hoverAction, isWarm, parseKey, arrowsMoveCard, STATS_TIMINGS, STATS_SETTLE, STATS_WARM_GRACE, STATS_WINDOW_DELAY } from "../src/popup/statsHoverLogic.ts";
import type { HoverNode } from "../src/popup/statsHoverLogic.ts";

// a fake element: its own id and the ancestors (itself included) that match
// each selector hoverKey asks for
function node(matches : Record<string, HoverNode | true>, id = "") : HoverNode {
	const self : HoverNode = {
		id,
		closest: (sel : string) => {
			const m = matches[sel];
			return m === true ? self : m || null;
		}
	};
	return self;
}
const TAB = ".window-container .tab[id^='tab-']";
const WIN = ".window-container .window[id^='window-']";
const ACTIONS = ".window-actions";
const AGE = ".window-container .window-age";
const el = (id : string) : HoverNode => ({ id, closest: () => null });

describe("hoverKey (target resolution)", () => {
	test("a tab tile wins over its window", () => {
		assert.equal(hoverKey(node({ [TAB]: el("tab-42"), [WIN]: el("window-7") })), "t42");
	});
	test("anywhere else on a window card: the window", () => {
		assert.equal(hoverKey(node({ [WIN]: el("window-7") })), "w7");
	});
	test("the window's action buttons are no target", () => {
		assert.equal(hoverKey(node({ [ACTIONS]: el(""), [WIN]: el("window-7") })), "");
	});
	test("outside every window: nothing", () => {
		assert.equal(hoverKey(node({})), "");
	});
	test("window card only on the age label when not 'anywhere'", () => {
		assert.equal(hoverKey(node({ [WIN]: el("window-7") }), false), "");
		assert.equal(hoverKey(node({ [AGE]: el(""), [WIN]: el("window-7") }), false), "w7");
	});
});

describe("parseKey", () => {
	test("tab, window, nothing", () => {
		assert.deepEqual(parseKey("t12"), { kind: "tab", id: 12 });
		assert.deepEqual(parseKey("w3"), { kind: "window", id: 3 });
		assert.equal(parseKey(""), null);
		assert.equal(parseKey("key"), null);
	});
});

describe("isWarm (chaining)", () => {
	test("open is warm", () => assert.equal(isWarm(true, 1000, 0), true));
	test("closed moments ago is warm, later cold", () => {
		assert.equal(isWarm(false, 1000 + STATS_WARM_GRACE - 1, 1000), true);
		assert.equal(isWarm(false, 1000 + STATS_WARM_GRACE, 1000), false);
	});
});

describe("hoverAction (warm / cold, delay)", () => {
	test("same target: nothing (moving inside one tile)", () => {
		assert.deepEqual(hoverAction("t1", "t1", true, true), { kind: "none" });
	});
	test("off every target: close, chaining counts from now only if a card was open", () => {
		assert.deepEqual(hoverAction("", "t1", true, true), { kind: "close", left: true });
		assert.deepEqual(hoverAction("", "t1", false, false), { kind: "close", left: false });
	});
	test("warm onto a tab: swap right away", () => {
		assert.deepEqual(hoverAction("t2", "t1", true, true), { kind: "show", key: "t2", delay: 0 });
	});
	test("warm onto a window: settle first (no flash crossing the gap between tiles)", () => {
		assert.deepEqual(hoverAction("w1", "t1", true, true), { kind: "show", key: "w1", delay: STATS_SETTLE });
	});
	test("cold: tab and window both open after the settle", () => {
		assert.equal(STATS_WINDOW_DELAY, 0);
		assert.deepEqual(hoverAction("t2", "", false, false), { kind: "show", key: "t2", delay: STATS_SETTLE });
		assert.deepEqual(hoverAction("w2", "", false, false), { kind: "show", key: "w2", delay: STATS_SETTLE });
	});
	test("cold: a target's own delay wins when it is longer than the settle", () => {
		const t = { ...STATS_TIMINGS, windowDelay: 500, tabDelay: 250 };
		assert.equal((hoverAction("w2", "", false, false, t) as { delay : number }).delay, 500);
		assert.equal((hoverAction("t2", "", false, false, t) as { delay : number }).delay, 250);
		// warm ignores them
		assert.equal((hoverAction("w2", "t1", true, true, t) as { delay : number }).delay, STATS_SETTLE);
		assert.equal((hoverAction("t2", "t1", true, true, t) as { delay : number }).delay, 0);
	});
	test("from the keyboard's card to a tab under the pointer: a new target", () => {
		assert.deepEqual(hoverAction("t5", "key", true, true), { kind: "show", key: "t5", delay: 0 });
	});
});

describe("arrowsMoveCard", () => {
	test("arrows in the list view on the main screen", () => {
		for (const k of [37, 38, 39, 40]) assert.equal(arrowsMoveCard(k, true, true, false), true);
	});
	test("not other keys, other layouts, other screens, or a search box caret", () => {
		assert.equal(arrowsMoveCard(36, true, true, false), false);
		assert.equal(arrowsMoveCard(41, true, true, false), false);
		assert.equal(arrowsMoveCard(40, false, true, false), false);
		assert.equal(arrowsMoveCard(40, true, false, false), false);
		assert.equal(arrowsMoveCard(40, true, true, true), false);
	});
});
