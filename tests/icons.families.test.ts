"use strict";

// Every family file in src/icons/families must pass validateFamily: all
// icon names, in bounds, the family's own style rules. Families are found
// on disk, so a new one is checked without touching this file.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { validateFamily } from "../src/icons/validate.ts";

const dir = new URL("../src/icons/families/", import.meta.url);
let files : string[] = [];
try {
	files = readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "index.ts");
} catch {
	// reported by the test below
}

test("families found: " + (files.join(", ") || "none"), () => {
	assert.ok(files.length > 0, "no family files in src/icons/families");
});

for (const file of files) {
	test("family " + file + " is complete and valid", async () => {
		const mod = await import(new URL(file, dir).href);
		assert.ok(mod.family, file + " exports `family`");
		assert.equal(mod.family.id + ".ts", file);
		assert.deepEqual(validateFamily(mod.family), []);
	});
}
