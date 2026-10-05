import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readTheme, resolveTheme } from "../src/helpers/theme.ts";

// ---------------------------------------------------------------------------
// readTheme: the stored value, or the 6.x `dark` boolean when there is none
// ---------------------------------------------------------------------------
describe("readTheme", () => {
	test("keeps the three known values", () => {
		assert.equal(readTheme("system"), "system");
		assert.equal(readTheme("light"), "light");
		assert.equal(readTheme("dark"), "dark");
	});
	test("a stored theme wins over the old dark switch", () => {
		assert.equal(readTheme("light", true), "light");
		assert.equal(readTheme("system", true), "system");
		assert.equal(readTheme("dark", false), "dark");
	});
	test("no theme yet: dark switched on stays dark", () => {
		assert.equal(readTheme(undefined, true), "dark");
	});
	test("no theme yet: dark off, or never set -> system", () => {
		assert.equal(readTheme(undefined, false), "system");
		assert.equal(readTheme(undefined, undefined), "system");
		assert.equal(readTheme(undefined), "system");
	});
	test("garbage -> as if missing", () => {
		assert.equal(readTheme("blue"), "system");
		assert.equal(readTheme(true), "system");
		assert.equal(readTheme(null, true), "dark");
		assert.equal(readTheme(undefined, "true"), "system");
	});
});

// ---------------------------------------------------------------------------
// resolveTheme: what <html data-theme> gets
// ---------------------------------------------------------------------------
describe("resolveTheme", () => {
	test("system follows the preference", () => {
		assert.equal(resolveTheme("system", true), "dark");
		assert.equal(resolveTheme("system", false), "light");
	});
	test("light and dark ignore it", () => {
		assert.equal(resolveTheme("light", true), "light");
		assert.equal(resolveTheme("light", false), "light");
		assert.equal(resolveTheme("dark", true), "dark");
		assert.equal(resolveTheme("dark", false), "dark");
	});
});
