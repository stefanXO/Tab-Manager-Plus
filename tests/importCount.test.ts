"use strict";

// Unit tests for the session import counting in src/popup/importCount.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { planImport, importSummary, importWorked, importNoticeKind } from "../src/popup/importCount.ts";

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

describe("file in another format", () => {
	const foreign = (sessions : unknown[]) => ({ format: "something-else", sessions });
	test("is imported and the summary says so", () => {
		const p = planImport(foreign([good("a"), good("b")]));
		assert.equal(p.fatal, undefined);
		assert.equal(p.foreignFormat, true);
		assert.equal(importSummary(p), "2 saved windows restored. The file was not in Tab Manager Plus's format.");
		assert.equal(importWorked(p), true);
	});
	test("note follows skipped and already-there counts", () => {
		const p = planImport(foreign([good("a"), { id: "x", windowsInfo: {} }]));
		assert.equal(importSummary(p), "1 saved window restored, 1 skipped (1 no tabs). The file was not in Tab Manager Plus's format.");
	});
	test("nothing usable is an error, still with the note", () => {
		const p = planImport(foreign([5]));
		assert.equal(importWorked(p), false);
		assert.match(importSummary(p), /^No saved windows restored, 1 skipped .*format\.$/);
	});
	test("a foreign file that restores nothing is an info, not an error", () => {
		assert.equal(importNoticeKind(planImport(foreign([5]))), "info");
		assert.equal(importNoticeKind(planImport(foreign([]))), "info");
	});
	test("a foreign file with a refused write, or a fatal plan, stays an error", () => {
		assert.equal(importNoticeKind(planImport(foreign([good("a")])), 1, 0), "error");
		assert.equal(importNoticeKind(planImport({ format: "something-else", windows: [] })), "error");
	});
	test("our own format that restores nothing is an error", () => {
		assert.equal(importNoticeKind(planImport([5])), "error");
		assert.equal(importNoticeKind(planImport([good("a")])), "info");
	});
	test("no sessions list is refused, without the note", () => {
		const p = planImport({ format: "something-else", windows: [] });
		assert.ok(p.fatal);
		assert.equal(importSummary(p), p.fatal);
	});
	test("our formats and bare lists carry no note", () => {
		for (const f of [[good("a")], { sessions: [good("a")] }, { format: "tab-manager-plus-export", sessions: [good("a")] }, { format: "tab-manager-plus-debug", sessions: [good("a")] }]) {
			const p = planImport(f);
			assert.equal(p.foreignFormat, undefined);
			assert.equal(importSummary(p), "1 saved window restored");
		}
	});
});
