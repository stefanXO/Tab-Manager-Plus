import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
	placeWindow,
	fitInto,
	usableBounds,
	isInBounds,
} from "../src/helpers/geometry.ts";

// ---------------------------------------------------------------------------
// isInBounds
// ---------------------------------------------------------------------------
describe("isInBounds", () => {
	const bounds = { left: 10, top: 20, width: 100, height: 50 };
	// right edge = 110, bottom edge = 70

	test("point strictly inside bounds", () => {
		assert.equal(isInBounds({ left: 50, top: 40 }, bounds), true);
	});

	test("point on the left edge is in bounds (>=)", () => {
		assert.equal(isInBounds({ left: 10, top: 40 }, bounds), true);
	});
	test("point on the right edge is in bounds (<=)", () => {
		assert.equal(isInBounds({ left: 110, top: 40 }, bounds), true);
	});
	test("point on the top edge is in bounds (>=)", () => {
		assert.equal(isInBounds({ left: 50, top: 20 }, bounds), true);
	});
	test("point on the bottom edge is in bounds (<=)", () => {
		assert.equal(isInBounds({ left: 50, top: 70 }, bounds), true);
	});

	test("point exactly at the far (bottom-right) corner is in bounds", () => {
		assert.equal(isInBounds({ left: 110, top: 70 }, bounds), true);
	});
	test("point exactly at the near (top-left) corner is in bounds", () => {
		assert.equal(isInBounds({ left: 10, top: 20 }, bounds), true);
	});

	test("point outside to the left", () => {
		assert.equal(isInBounds({ left: 9, top: 40 }, bounds), false);
	});
	test("point outside to the right", () => {
		assert.equal(isInBounds({ left: 111, top: 40 }, bounds), false);
	});
	test("point outside above (top)", () => {
		assert.equal(isInBounds({ left: 50, top: 19 }, bounds), false);
	});
	test("point outside below (bottom)", () => {
		assert.equal(isInBounds({ left: 50, top: 71 }, bounds), false);
	});
});

// ---------------------------------------------------------------------------
// fitInto
// ---------------------------------------------------------------------------
describe("fitInto", () => {
	test("window already fits inside the display: unchanged", () => {
		const bounds = { left: 50, top: 50, width: 200, height: 200 };
		const display = { left: 0, top: 0, width: 1920, height: 1080 };
		assert.deepEqual(fitInto(bounds, display), bounds);
	});

	test("wider than the display: width capped and left moved so it fits", () => {
		const bounds = { left: 500, top: 0, width: 3000, height: 200 };
		const display = { left: 0, top: 0, width: 1920, height: 1080 };
		assert.deepEqual(fitInto(bounds, display), { left: 0, top: 0, width: 1920, height: 200 });
	});

	test("taller than the display: height capped and top moved so it fits", () => {
		const bounds = { left: 0, top: 500, width: 200, height: 3000 };
		const display = { left: 0, top: 0, width: 1920, height: 1080 };
		assert.deepEqual(fitInto(bounds, display), { left: 0, top: 0, width: 200, height: 1080 });
	});

	test("partly off the right edge: shifted left so it stays inside", () => {
		const bounds = { left: 1800, top: 0, width: 300, height: 200 };
		const display = { left: 0, top: 0, width: 1920, height: 1080 };
		assert.deepEqual(fitInto(bounds, display), { left: 1620, top: 0, width: 300, height: 200 });
	});

	test("partly off the bottom edge: shifted up so it stays inside", () => {
		const bounds = { left: 0, top: 1000, width: 200, height: 300 };
		const display = { left: 0, top: 0, width: 1920, height: 1080 };
		assert.deepEqual(fitInto(bounds, display), { left: 0, top: 780, width: 200, height: 300 });
	});

	test("partly off the left edge (negative left): shifted to the display's left", () => {
		const bounds = { left: -100, top: 0, width: 200, height: 200 };
		const display = { left: 0, top: 0, width: 1920, height: 1080 };
		assert.deepEqual(fitInto(bounds, display), { left: 0, top: 0, width: 200, height: 200 });
	});

	test("partly off the top edge (negative top): shifted to the display's top", () => {
		const bounds = { left: 0, top: -50, width: 200, height: 200 };
		const display = { left: 0, top: 0, width: 1920, height: 1080 };
		assert.deepEqual(fitInto(bounds, display), { left: 0, top: 0, width: 200, height: 200 });
	});

	test("display not at the origin (second monitor at left:1920): result stays inside that monitor", () => {
		const bounds = { left: 3800, top: 0, width: 300, height: 200 };
		const display = { left: 1920, top: 0, width: 1920, height: 1080 };
		const result = fitInto(bounds, display);
		assert.deepEqual(result, { left: 3540, top: 0, width: 300, height: 200 });
		assert.ok(result.left >= display.left && result.left + result.width <= display.left + display.width);
	});

	test("a window exactly the display size equals the display", () => {
		const display = { left: 1920, top: 0, width: 1920, height: 1080 };
		const bounds = { left: 1920, top: 0, width: 1920, height: 1080 };
		assert.deepEqual(fitInto(bounds, display), display);
	});

	test("Samsung G9 -> MacBook: an oversized ultrawide saved window is clamped fully into the small display", () => {
		const saved = { left: 300, top: 100, width: 5120, height: 1440 };
		const display = { left: 0, top: 25, width: 1512, height: 957 };
		assert.deepEqual(fitInto(saved, display), { left: 0, top: 25, width: 1512, height: 957 });
	});
});

// ---------------------------------------------------------------------------
// placeWindow
// ---------------------------------------------------------------------------
describe("placeWindow", () => {
	test("no displays available -> null", () => {
		const saved = { left: 0, top: 0, width: 200, height: 200 };
		assert.equal(placeWindow(saved, []), null);
	});

	test("one display -> same as fitInto against that display", () => {
		const saved = { left: 1800, top: 0, width: 300, height: 200 };
		const display = { left: 0, top: 0, width: 1920, height: 1080 };
		assert.deepEqual(placeWindow(saved, [display]), fitInto(saved, display));
	});

	test("two displays, saved top-left lies on the second: fitted into the second, not the first", () => {
		const d1 = { left: 0, top: 0, width: 1920, height: 1080 };
		const d2 = { left: 1920, top: 0, width: 1920, height: 1080 };
		const saved = { left: 2000, top: 100, width: 500, height: 400 };
		const result = placeWindow(saved, [d1, d2]);
		assert.deepEqual(result, { left: 2000, top: 100, width: 500, height: 400 });
		// sanity: fitting into d1 instead would have produced a different left
		assert.notEqual(result.left, fitInto(saved, d1).left);
	});

	test("saved position on no display -> fitted into displays[0]", () => {
		const d1 = { left: 0, top: 0, width: 1920, height: 1080 };
		const d2 = { left: 1920, top: 0, width: 1920, height: 1080 };
		const saved = { left: 5000, top: 5000, width: 300, height: 200 };
		assert.deepEqual(placeWindow(saved, [d1, d2]), fitInto(saved, d1));
	});

	test("saved position exactly on the boundary between two displays: picked by isInBounds's first match (d1, since its right edge check is inclusive) -- documents observed behavior, not a guaranteed contract", () => {
		const d1 = { left: 0, top: 0, width: 1920, height: 1080 };
		const d2 = { left: 1920, top: 0, width: 1920, height: 1080 };
		const saved = { left: 1920, top: 100, width: 300, height: 200 };
		const result = placeWindow(saved, [d1, d2]);
		// isInBounds(saved, d1) is true because d1's right edge (1920) is an
		// inclusive boundary, so Array.find picks d1 first even though the
		// point sits exactly on d2's left edge too.
		assert.deepEqual(result, fitInto(saved, d1));
		assert.deepEqual(result, { left: 1620, top: 100, width: 300, height: 200 });
	});
});

// ---------------------------------------------------------------------------
// usableBounds
// ---------------------------------------------------------------------------
describe("usableBounds", () => {
	test("all numbers >= 100 -> true", () => {
		assert.equal(usableBounds({ left: 100, top: 100, width: 100, height: 100 }), true);
	});

	test("width 99 -> false", () => {
		assert.equal(usableBounds({ left: 0, top: 0, width: 99, height: 100 }), false);
	});

	test("height 50 -> false", () => {
		assert.equal(usableBounds({ left: 0, top: 0, width: 100, height: 50 }), false);
	});

	test("missing left -> false", () => {
		assert.equal(usableBounds({ top: 0, width: 100, height: 100 }), false);
	});

	test("NaN -> false", () => {
		assert.equal(usableBounds({ left: NaN, top: 0, width: 100, height: 100 }), false);
	});

	test("Infinity -> false", () => {
		assert.equal(usableBounds({ left: 0, top: 0, width: Infinity, height: 100 }), false);
	});

	test("negative left with valid size -> true (position may be negative on a left monitor)", () => {
		assert.equal(usableBounds({ left: -500, top: 0, width: 100, height: 100 }), true);
	});

	test("strings -> false", () => {
		assert.equal(usableBounds({ left: "0", top: 0, width: 100, height: 100 } as any), false);
	});
});
