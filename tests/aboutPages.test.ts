"use strict";

// Unit tests for the Firefox about: rule in src/helpers/aboutPages.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { firefoxCanOpen } from "../src/helpers/aboutPages.ts";

describe("firefoxCanOpen", () => {
	test("about: pages are refused", () => {
		for (const url of ["about:newtab", "about:config", "about:addons", "about:preferences#privacy", "About:Home"]) assert.equal(firefoxCanOpen(url), false, url);
	});

	test("about:blank opens", () => {
		assert.equal(firefoxCanOpen("about:blank"), true);
		assert.equal(firefoxCanOpen("ABOUT:BLANK"), true);
	});

	test("web pages open, also with about: further on in the url", () => {
		assert.equal(firefoxCanOpen("https://example.com/"), true);
		assert.equal(firefoxCanOpen("https://example.com/?from=about:newtab"), true);
	});

	test("no url: nothing to refuse", () => {
		assert.equal(firefoxCanOpen(""), true);
		assert.equal(firefoxCanOpen(undefined), true);
	});
});
