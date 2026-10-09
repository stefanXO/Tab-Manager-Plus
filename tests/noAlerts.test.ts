"use strict";

// Native alert() is unreliable in extension popups (Chromium shows a blank
// first dialog, Firefox does not support it there at all). The popup, the
// options screen and the options page must show messages in the page instead.
// Run with: npm test  (== node --test tests/)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../src/popup", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

function sourceFiles(dir : string) : string[] {
	const out : string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...sourceFiles(path));
		else if (/\.(ts|tsx|js)$/.test(entry.name)) out.push(path);
	}
	return out;
}

test("no alert() call anywhere under src/popup", () => {
	const found : string[] = [];
	for (const file of sourceFiles(root)) {
		readFileSync(file, "utf8").split(/\r?\n/).forEach((line, i) => {
			const code = line.replace(/\/\/.*$/, "");
			if (/\balert\s*\(/.test(code)) found.push(`${file.slice(root.length + 1)}:${i + 1}: ${line.trim()}`);
		});
	}
	assert.deepEqual(found, [], "use an in-page message instead of alert():\n" + found.join("\n"));
});
