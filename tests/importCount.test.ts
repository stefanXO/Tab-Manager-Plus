"use strict";

// Unit tests for the session import counting in src/popup/importCount.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { planImport, importSummary } from "../src/popup/importCount.ts";

const good = (id : string) => ({ id, windowsInfo: {}, tabs: [{}] });

describe("planImport", () => {
	test("not a list is fatal", () => {
		const p = planImport({ a: 1 });
		assert.ok(p.fatal);
		assert.equal(importSummary(p), p.fatal);
	});

	test("counts valid and skipped with reasons", () => {
		const p = planImport([good("a"), { id: "b", windowsInfo: {}, tabs: [] }, { id: "c", tabs: [{}] }, 5, { windowsInfo: {}, tabs: [{}] }, good("d")]);
		assert.equal(p.valid.length, 2);
		assert.deepEqual(p.skipped, { "no tabs": 1, "no window info": 1, "not a saved window": 1, "no id": 1 });
	});

	test("empty list", () => {
		assert.equal(importSummary(planImport([])), "No saved windows in the file");
	});
});

describe("importSummary", () => {
	test("all restored", () => {
		assert.equal(importSummary(planImport([good("a"), good("b")])), "2 saved windows restored");
		assert.equal(importSummary(planImport([good("a")])), "1 saved window restored");
	});

	test("some skipped", () => {
		assert.equal(importSummary(planImport([good("a"), { id: "x", windowsInfo: {} }])), "1 saved window restored, 1 skipped (1 no tabs)");
	});

	test("nothing restored", () => {
		assert.equal(importSummary(planImport([{}])), "No saved windows restored, 1 skipped (1 no window info)");
	});

	test("failed writes count as skipped", () => {
		assert.equal(importSummary(planImport([good("a"), good("b")]), 1), "1 saved window restored, 1 skipped (1 could not be stored)");
	});
});
