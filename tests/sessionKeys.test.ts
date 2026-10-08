"use strict";

// Unit tests for the saved-tab keys and the selection rule in src/popup/sessionKeys.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { SavedTabKeys, savedTabKeys, isSavedTabKey, tabKind, keepKind, onlySavedSelected, dropMissingSaved } from "../src/popup/sessionKeys.ts";

describe("SavedTabKeys", () => {
	test("keys are below -1: never an open tab id (>= 0) nor TAB_ID_NONE (-1)", () => {
		const keys = new SavedTabKeys();
		for (let i = 0; i < 50; i++) {
			const k = keys.key("s" + (i % 3), i);
			assert.ok(k < -1, "key " + k);
			assert.ok(isSavedTabKey(k));
		}
	});

	test("the same saved window and index always get the same key", () => {
		const keys = new SavedTabKeys();
		const a = keys.key("s1", 2);
		keys.key("s2", 0);
		keys.key("s1", 3);
		assert.equal(keys.key("s1", 2), a);
	});

	test("different tabs never share a key", () => {
		const keys = new SavedTabKeys();
		const seen = new Set<number>();
		for (const id of ["s1", "s2", "s10", "s1_1"]) {
			for (let i = 0; i < 12; i++) seen.add(keys.key(id, i));
		}
		assert.equal(seen.size, 4 * 12);
	});

	test("ids that would join to the same text stay apart", () => {
		const keys = new SavedTabKeys();
		// joined naively as id + index (or id + "_" + index) these pairs collide
		assert.notEqual(keys.key("s1", 11), keys.key("s11", 1));
		assert.notEqual(keys.key("a_1", 2), keys.key("a", 12));
	});

	test("a key maps back to its saved window and index", () => {
		const keys = new SavedTabKeys();
		const k = keys.key("abc-123", 4);
		keys.key("other", 4);
		assert.deepEqual(keys.ref(k), { sessionId: "abc-123", index: 4 });
	});

	test("unknown keys and open tab ids map to nothing", () => {
		const keys = new SavedTabKeys();
		keys.key("s1", 0);
		assert.equal(keys.ref(-999), undefined);
		assert.equal(keys.ref(0), undefined);
		assert.equal(keys.ref(7), undefined);
	});

	test("ref returns a copy: changing it does not change the registry", () => {
		const keys = new SavedTabKeys();
		const k = keys.key("s1", 1);
		const ref = keys.ref(k);
		ref.index = 9;
		assert.deepEqual(keys.ref(k), { sessionId: "s1", index: 1 });
	});

	test("the popup's registry is shared", () => {
		const k = savedTabKeys.key("shared-test", 0);
		assert.equal(savedTabKeys.key("shared-test", 0), k);
	});
});

describe("tabKind", () => {
	test("open ids, TAB_ID_NONE and saved keys", () => {
		assert.equal(tabKind(0), "open");
		assert.equal(tabKind(1), "open");
		assert.equal(tabKind(123456), "open");
		assert.equal(tabKind(-1), "open");
		assert.equal(tabKind(-2), "saved");
		assert.equal(tabKind(-50), "saved");
	});
});

describe("keepKind: the selection never mixes open and saved tabs", () => {
	test("selecting a saved tab drops the open tabs", () => {
		const sel = new Set([1, 5, 9]);
		assert.equal(keepKind(sel, "saved"), true);
		assert.deepEqual([...sel], []);
	});

	test("selecting an open tab drops the saved tabs", () => {
		const sel = new Set([-2, -3, 4]);
		assert.equal(keepKind(sel, "open"), true);
		assert.deepEqual([...sel], [4]);
	});

	test("saved tabs from several saved windows may stay selected together", () => {
		const keys = new SavedTabKeys();
		const a = keys.key("s1", 0), b = keys.key("s2", 3);
		const sel = new Set([a, b]);
		assert.equal(keepKind(sel, "saved"), false);
		assert.deepEqual([...sel], [a, b]);
	});

	test("same kind: nothing dropped", () => {
		const sel = new Set([1, 2]);
		assert.equal(keepKind(sel, "open"), false);
		assert.deepEqual([...sel], [1, 2]);
		const empty = new Set<number>();
		assert.equal(keepKind(empty, "saved"), false);
	});
});

describe("onlySavedSelected", () => {
	test("empty, open, mixed and saved selections", () => {
		assert.equal(onlySavedSelected(new Set()), false);
		assert.equal(onlySavedSelected(new Set([1, 2])), false);
		assert.equal(onlySavedSelected(new Set([1, -2])), false);
		assert.equal(onlySavedSelected(new Set([-2, -3])), true);
	});
});

describe("dropMissingSaved", () => {
	const sessions = [
		{ id: "s1", tabs: [{ index: 0 }, { index: 1 }, { index: 2 }] },
		{ id: "s2", tabs: [{ index: 0 }] },
	];

	test("keeps saved tabs that still exist and every open tab", () => {
		const keys = new SavedTabKeys();
		const sel = new Set([3, keys.key("s1", 2), keys.key("s2", 0)]);
		assert.equal(dropMissingSaved(sel, sessions, keys), false);
		assert.equal(sel.size, 3);
	});

	test("drops saved tabs of a deleted saved window and of a missing index", () => {
		const keys = new SavedTabKeys();
		const gone = keys.key("s3", 0), past = keys.key("s2", 1), kept = keys.key("s1", 1);
		const sel = new Set([gone, past, kept, 7]);
		assert.equal(dropMissingSaved(sel, sessions, keys), true);
		assert.deepEqual([...sel], [kept, 7]);
	});

	test("drops keys the registry never handed out", () => {
		const keys = new SavedTabKeys();
		const sel = new Set([-40]);
		assert.equal(dropMissingSaved(sel, sessions, keys), true);
		assert.equal(sel.size, 0);
	});
});
