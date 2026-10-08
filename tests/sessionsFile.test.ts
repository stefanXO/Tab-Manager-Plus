"use strict";

// Unit tests for the saved windows file in src/popup/sessionsFile.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildSessionsFile, everythingFileName, readSessionsFile, sessionsFileName } from "../src/popup/sessionsFile.ts";
import { planImport } from "../src/popup/importCount.ts";

describe("file names", () => {
	test("sessions-YYYY-MM-DD-HH-MM-SS.json in local time, zero padded", () => {
		assert.equal(sessionsFileName(new Date(2030, 0, 2, 3, 4, 5)), "sessions-2030-01-02-03-04-05.json");
		assert.equal(sessionsFileName(new Date(2030, 11, 31, 23, 59, 59)), "sessions-2030-12-31-23-59-59.json");
	});
	test("everything-YYYY-MM-DD-HH-MM-SS.json", () => {
		assert.equal(everythingFileName(new Date(2030, 0, 2, 3, 4, 5)), "everything-2030-01-02-03-04-05.json");
	});
});

describe("readSessionsFile", () => {
	const list = [{ id: "a", windowsInfo: {}, tabs: [{}] }];
	test("bare list (older exports)", () => assert.deepEqual(readSessionsFile(list), list));
	test("sessions export", () => assert.deepEqual(readSessionsFile(buildSessionsFile(list)), list));
	test("everything export (extra keys ignored)", () => {
		assert.deepEqual(readSessionsFile({ format: "tab-manager-plus-debug", windows: [], settings: {}, sessions: list }), list);
	});
	test("format key", () => {
		assert.equal(buildSessionsFile(list).format, "tab-manager-plus-export");
		assert.deepEqual(readSessionsFile({ format: "tab-manager-plus-export", version: 1, windows: [], sessions: list }), list);
	});
	test("test-build tags still read", () => {
		for (const format of ["tab-manager-plus-sessions", "tab-manager-plus-debug"]) {
			assert.deepEqual(readSessionsFile({ format, version: 1, sessions: list }), list);
		}
	});
	test("unknown format tag", () => assert.equal(readSessionsFile({ format: "other", sessions: list }), undefined));
	test("anything else", () => {
		for (const v of [null, 5, "x", {}, { sessions: 1 }, { windows: [] }]) assert.equal(readSessionsFile(v), undefined);
	});
	test("planImport takes both formats", () => {
		assert.equal(planImport(buildSessionsFile(list)).valid.length, 1);
		assert.equal(planImport({ windows: [] }).fatal !== undefined, true);
	});
});
