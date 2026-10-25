"use strict";

// The block view uses one centred tile grid so incomplete rows keep the same
// columns as the rows above them. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p : string) => readFileSync(new URL("../css/" + p, import.meta.url), "utf8");

test("block layout shares one centered grid between tab rows", () => {
	const blocks = read("layout/view-blocks.css");
	const selector = ".window-container.blocks .window.block .tabs,\n.window-container.blocks-big .window.block .tabs";
	const at = blocks.indexOf(selector);
	assert.ok(at > -1, "block tab wrapper rule");
	const rule = blocks.slice(at, blocks.indexOf("}", at));
	assert.match(rule, /display: grid;/);
	assert.match(rule, /grid-template-columns: repeat\(auto-fill, var\(--tab-track\)\);/);
	assert.match(rule, /justify-content: center;/);
	assert.match(rule, /flex: 0 0 100%;/);
	assert.match(blocks, /\.window-container\.blocks-big \.window\.block \.tabs \{[\s\S]*--tab-track: 3rem;/);
	assert.match(blocks, /\.compact \.window-container\.blocks \.window\.block \.tabs \{[\s\S]*--tab-track: 1\.6rem;/);
	assert.match(blocks, /\.compact \.window-container\.blocks-big \.window\.block \.tabs \{[\s\S]*--tab-track: 2\.7rem;/);
});
