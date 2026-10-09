"use strict";

// openMoveIndices: the tabs end up at the marker, whichever side of it they
// come from. The moves are replayed here the way tabs.move does them (take
// the tab out of its window, put it in at the index).

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { openMoveIndices, shownOrder } from "../src/popup/openMovePlan.ts";

function replay(order : number[], moves : { id : number, index : number }[]) : number[] {
	const list = order.slice();
	for (const m of moves) {
		const at = list.indexOf(m.id);
		if (at >= 0) list.splice(at, 1);
		list.splice(Math.min(m.index, list.length), 0, m.id);
	}
	return list;
}
const run = (order : number[], ids : number[], index : number) => replay(order, openMoveIndices(order, ids.map((id) => ({ id })), index));

describe("openMoveIndices", () => {
	const w = [10, 11, 12, 13, 14];

	test("one tab moved right lands before the tab at the marker, not after it", () => {
		assert.deepEqual(run(w, [10], 3), [11, 12, 10, 13, 14]);
		assert.deepEqual(openMoveIndices(w, [{ id: 10 }], 3), [{ id: 10, index: 2 }]);
	});

	test("one tab moved left lands at the marker", () => {
		assert.deepEqual(run(w, [13], 1), [10, 13, 11, 12, 14]);
	});

	test("a tab dropped on its own place, or the gap right after it, stays", () => {
		assert.deepEqual(run(w, [12], 2), w);
		assert.deepEqual(run(w, [12], 3), w);
		assert.deepEqual(run(w, [14], 5), w);
	});

	test("the gap past the last tab is the end", () => {
		assert.deepEqual(run(w, [10], 5), [11, 12, 13, 14, 10]);
	});

	test("several tabs of the window keep their order and meet at the marker", () => {
		assert.deepEqual(run(w, [10, 11], 4), [12, 13, 10, 11, 14]);
		assert.deepEqual(run(w, [13, 14], 1), [10, 13, 14, 11, 12]);
		assert.deepEqual(run(w, [10, 14], 2), [11, 10, 14, 12, 13]);
		assert.deepEqual(run(w, [10, 12, 14], 3), [11, 10, 12, 14, 13]);
	});

	test("several tabs dropped where they already are stay, also on a selected tab's near side", () => {
		assert.deepEqual(run(w, [11, 12], 1), w);
		assert.deepEqual(run(w, [11, 12], 2), w);
		assert.deepEqual(run(w, [11, 12], 3), w);
	});

	test("tabs of another window go in at the marker with no shift", () => {
		assert.deepEqual(run(w, [20, 21], 2), [10, 11, 20, 21, 12, 13, 14]);
		assert.deepEqual(run(w, [20], 5), [...w, 20]);
		assert.deepEqual(run(w, [20, 12], 0), [20, 12, 10, 11, 13, 14]);
	});

	test("the replay agrees with a plain rebuild for every tab set and marker", () => {
		for (let mask = 1; mask < 32; mask++) {
			const ids = w.filter((_, i) => mask & (1 << i));
			for (let index = 0; index <= w.length; index++) {
				const rest = w.filter((id) => !ids.includes(id));
				const before = w.slice(0, index).filter((id) => !ids.includes(id)).length;
				const want = [...rest.slice(0, before), ...ids, ...rest.slice(before)];
				assert.deepEqual(run(w, ids, index), want, `${ids} at ${index}`);
			}
		}
	});
});

describe("shownOrder", () => {
	test("dragged tabs come out by window, then index, not by click order", () => {
		const tabs = [{ id: 3, windowId: 1, index: 2 }, { id: 1, windowId: 1, index: 0 }, { id: 20, windowId: 2, index: 0 }, { id: 2, windowId: 1, index: 1 }];
		assert.deepEqual(shownOrder(tabs, [2, 1]).map((t) => t.id), [20, 1, 2, 3]);
		assert.deepEqual(shownOrder(tabs, [1, 2]).map((t) => t.id), [1, 2, 3, 20]);
		assert.deepEqual(tabs.map((t) => t.id), [3, 1, 20, 2]);
	});
	test("planned in shown order, a drop before another window's tab keeps the strip order", () => {
		const order = [10, 11, 12, 13, 14];
		const picked = [{ id: 3, windowId: 1, index: 2 }, { id: 1, windowId: 1, index: 0 }, { id: 2, windowId: 1, index: 1 }];
		assert.deepEqual(replay(order, openMoveIndices(order, shownOrder(picked, [1, 2]), 2)), [10, 11, 1, 2, 3, 12, 13, 14]);
	});
	test("a tab of an unknown window goes last; no tabs, no tabs", () => {
		assert.deepEqual(shownOrder([{ windowId: 9, index: 0 }, { windowId: 1, index: 5 }], [1]).map((t) => t.windowId), [1, 9]);
		assert.deepEqual(shownOrder([], [1]), []);
	});
});
