"use strict";

// Saved windows are on by default and no longer called beta or experimental.
// settings.ts and the options screen need the browser, so this reads their source.
// Run with: npm test  (== node --test tests/)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file : string) => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("sessionsFeature defaults to true in SETTING_DEFAULTS", () => {
	const src = read("src/helpers/settings.ts");
	const defaults = src.slice(src.indexOf("export const SETTING_DEFAULTS"));
	assert.match(defaults, /sessionsFeature\s*:\s*true\s*,/);
});

test("the options do not call saved windows beta or experimental", () => {
	const src = read("src/popup/views/TabOptions.tsx");
	assert.doesNotMatch(src, /\bbeta\b/i);
	assert.doesNotMatch(src, /experimental/i);
});

test("the options' help for saved windows says they are on by default", () => {
	const src = read("src/popup/views/TabOptions.tsx");
	const help = src.match(/sessions:\s*"([^"]*)"/);
	assert.ok(help, "the help text for the sessions option");
	assert.match(help[1], /Default : on/);
});
