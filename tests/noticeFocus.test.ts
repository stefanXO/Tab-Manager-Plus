"use strict";

// Source-level check: a timed notice holds its countdown on keyboard focus as well as on mouse hover.
// Run with: npm test  (== node --test tests/)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/popup/views/Notice.tsx", "utf8");

test("Notice holds on focus and releases only when focus leaves the notice", () => {
	assert.ok(src.includes("onFocus={() => { this.focused = true; this.hold(true); }}"));
	assert.ok(src.includes("onBlur={(e) =>"));
	assert.ok(src.includes("if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;"));
	// the mouse leaving keeps the hold while a button is focused, and the other way round
	assert.ok(src.includes("onMouseLeave={() => { this.hovered = false; this.hold(this.focused); }}"));
	assert.ok(src.includes("this.focused = false;
					this.hold(this.hovered);"));
});
