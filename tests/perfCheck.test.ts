"use strict";

// tools/perf-check/check.mjs gates what a mouse move costs in the real action
// popup (see its README). Cheap guard here, no Chrome: its threshold constants
// are numbers in sane bounds (not 0, not Infinity), and npm has the script.
// Run with: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const check = readFileSync(new URL("../tools/perf-check/check.mjs", import.meta.url), "utf8");
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const constant = (name : string) => {
	const m = new RegExp("^const " + name + " = ([0-9.]+)\\s*(?:\\/\\/.*)?$", "m").exec(check);
	assert.ok(m, name + " is a plain number constant in check.mjs");
	return Number(m[1]);
};

test("perf-check thresholds are numbers in sane bounds", () => {
	const bounds : Record<string, [number, number]> = {
		MAX_MEDIAN_RESTYLES: [1, 1000],
		MAX_MEDIAN_LAYOUTS: [1, 1000],
		MAX_P95_RESTYLES: [1, 2000],
		MAX_P95_LAYOUTS: [1, 2000],
		MAX_MEDIAN_RESTYLE_MS: [1, 200],
		MAX_MEDIAN_LAYOUT_MS: [1, 100],
		MAX_VS_TAB: [1, 10],
		TAB_FLOOR_RESTYLE_MS: [0.1, 20],
		TAB_FLOOR_LAYOUT_MS: [0.1, 20],
	};
	for (const [name, [lo, hi]] of Object.entries(bounds)) {
		const v = constant(name);
		assert.ok(Number.isFinite(v) && v >= lo && v <= hi, name + " = " + v + " is within " + lo + ".." + hi);
	}
	assert.ok(constant("MAX_P95_RESTYLES") >= constant("MAX_MEDIAN_RESTYLES"), "p95 cap is not under the median cap");
	assert.ok(constant("MAX_P95_LAYOUTS") >= constant("MAX_MEDIAN_LAYOUTS"), "p95 cap is not under the median cap");
});

test("package.json has the perf:check script", () => {
	assert.equal(pkg.scripts["perf:check"], "node tools/perf-check/check.mjs");
});
