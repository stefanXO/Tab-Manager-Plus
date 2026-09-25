import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { sortWindows, hashcode } from "../src/helpers/windows.ts";

// ---------------------------------------------------------------------------
// sortWindows
// ---------------------------------------------------------------------------
// Minimal window stand-ins: only id, state and tabs matter to sortWindows.
// Cast as any since the real browser.Windows.Window type demands more fields.
describe("sortWindows", () => {
	test("order follows windowAge (most recent first) regardless of input order", () => {
		const windows = [
			{ id: 1, state: "normal", tabs: [] },
			{ id: 2, state: "normal", tabs: [] },
			{ id: 3, state: "normal", tabs: [] },
		] as any[];
		const windowAge = [3, 1, 2];
		const result = sortWindows(windows, windowAge);
		assert.deepEqual(result.map((w: any) => w.id), [3, 1, 2]);
	});

	test("minimized windows always sort after normal ones, even when more recent in windowAge", () => {
		const windows = [
			{ id: 1, state: "minimized", tabs: [] },
			{ id: 2, state: "normal", tabs: [] },
		] as any[];
		const windowAge = [1, 2]; // 1 is "more recent" than 2, but minimized
		const result = sortWindows(windows, windowAge);
		assert.deepEqual(result.map((w: any) => w.id), [2, 1]);
	});

	test("two minimized windows keep their windowAge order between themselves", () => {
		const windows = [
			{ id: 4, state: "minimized", tabs: [] },
			{ id: 5, state: "minimized", tabs: [] },
		] as any[];
		const windowAge = [5, 4];
		const result = sortWindows(windows, windowAge);
		assert.deepEqual(result.map((w: any) => w.id), [5, 4]);
	});

	test("a window missing from windowAge (indexOf -1) sorts before those present, since -1 < 0", () => {
		// documents observed behavior: indexOf returns -1 for an id not found,
		// and -1 sorts before any present index (0, 1, ...), so an "unknown
		// age" window ends up treated as more recent than known ones.
		const windows = [
			{ id: 10, state: "normal", tabs: [] },
			{ id: 99, state: "normal", tabs: [] }, // not in windowAge
		] as any[];
		const windowAge = [10];
		const result = sortWindows(windows, windowAge);
		assert.deepEqual(result.map((w: any) => w.id), [99, 10]);
	});

	test("empty windowAge keeps input order (stable sort, all comparisons equal)", () => {
		const windows = [
			{ id: 7, state: "normal", tabs: [] },
			{ id: 8, state: "normal", tabs: [] },
			{ id: 9, state: "normal", tabs: [] },
		] as any[];
		const result = sortWindows(windows, []);
		assert.deepEqual(result.map((w: any) => w.id), [7, 8, 9]);
	});

	test("the input array is not mutated; sortWindows returns a copy", () => {
		const windows = [
			{ id: 3, state: "normal", tabs: [] },
			{ id: 1, state: "normal", tabs: [] },
			{ id: 2, state: "normal", tabs: [] },
		] as any[];
		const originalOrder = windows.map((w: any) => w.id);
		sortWindows(windows, [1, 2, 3]);
		assert.deepEqual(windows.map((w: any) => w.id), originalOrder);
	});

	test("single window", () => {
		const windows = [{ id: 1, state: "normal", tabs: [] }] as any[];
		const result = sortWindows(windows, []);
		assert.deepEqual(result.map((w: any) => w.id), [1]);
	});

	test("empty list", () => {
		const result = sortWindows([] as any[], []);
		assert.deepEqual(result, []);
	});
});

// ---------------------------------------------------------------------------
// hashcode
// ---------------------------------------------------------------------------
describe("hashcode", () => {
	test("same tab urls in a different order produce the same hash (urls are sorted first)", () => {
		const a = { tabs: [{ url: "https://a.example" }, { url: "https://b.example" }] } as any;
		const b = { tabs: [{ url: "https://b.example" }, { url: "https://a.example" }] } as any;
		assert.equal(hashcode(a), hashcode(b));
	});

	test("different urls produce different hashes", () => {
		const a = { tabs: [{ url: "https://a.example" }] } as any;
		const b = { tabs: [{ url: "https://c.example" }] } as any;
		assert.notEqual(hashcode(a), hashcode(b));
	});

	test("a tab without a url is ignored", () => {
		const withEmptyTab = { tabs: [{ url: "https://a.example" }, {}] } as any;
		const withoutIt = { tabs: [{ url: "https://a.example" }] } as any;
		assert.equal(hashcode(withEmptyTab), hashcode(withoutIt));
	});

	test("adding a tab changes the hash", () => {
		const before = { tabs: [{ url: "https://a.example" }] } as any;
		const after = { tabs: [{ url: "https://a.example" }, { url: "https://b.example" }] } as any;
		assert.notEqual(hashcode(before), hashcode(after));
	});

	test("the empty window hashes to 0", () => {
		assert.equal(hashcode({ tabs: [] } as any), 0);
	});

	test("hash is a 32-bit integer", () => {
		const window = {
			tabs: [
				{ url: "https://a.example/some/reasonably/long/path" },
				{ url: "https://b.example/another/path?with=query" },
				{ url: "https://c.example" },
			],
		} as any;
		const h = hashcode(window);
		assert.equal(Number.isInteger(h), true);
		assert.ok(h >= -2147483648 && h <= 2147483647);
	});

	test("duplicate urls count twice: [\"a\",\"a\"] differs from [\"a\"]", () => {
		const duplicated = { tabs: [{ url: "https://a.example" }, { url: "https://a.example" }] } as any;
		const single = { tabs: [{ url: "https://a.example" }] } as any;
		assert.notEqual(hashcode(duplicated), hashcode(single));
	});
});
