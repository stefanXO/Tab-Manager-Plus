"use strict";

// Source-level check: a timed notice holds its countdown on keyboard focus as well as on mouse
// hover, and the hold ends only when neither the mouse nor the focus is on the notice.
// Run with: npm test  (== node --test tests/)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/popup/views/Notice.tsx", "utf8").replace(/\r\n/g, "\n");

test("Notice holds on focus and releases only when focus leaves the notice", () => {
	assert.ok(src.includes("onFocus={() => { this.focused = true; this.hold(true); }}"));
	assert.ok(src.includes("onBlur={(e) =>"));
	assert.ok(src.includes("if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;"));
});

test("the mouse leaving keeps the hold while a button is focused, and the other way round", () => {
	assert.ok(src.includes("onMouseLeave={() => { this.hovered = false; this.hold(this.focused); }}"));
	assert.match(src, /this\.focused = false;\n\s*this\.hold\(this\.hovered\);/);
});
