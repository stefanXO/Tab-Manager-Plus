"use strict";

// A popup handler that sends a message to the service worker and then closes
// the popup must wait for the message first. When the MV3 worker is asleep,
// Chrome drops a message whose sender closed before the worker started, so the
// click closed the popup without switching tabs (#252, #246, #242). Use
// sendAndWait() from src/popup/messaging.ts, or await the sendMessage call.
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

// The body of each method-like block that calls window.close(): from the
// nearest preceding line that starts a handler (`name = async (` / `name(`
// at class-member indent) to the close call.
function blocksBeforeClose(src : string) : { line : number, body : string }[] {
	const lines = src.split(/\r?\n/);
	const out : { line : number, body : string }[] = [];
	lines.forEach((l, i) => {
		if (!/\bwindow\.close\s*\(/.test(l.replace(/\/\/.*$/, ""))) return;
		let start = i;
		while (start > 0 && !/^\t(async\s+)?\w+\s*(=\s*(async\s*)?\(|\()/.test(lines[start])) start--;
		out.push({ line: i + 1, body: lines.slice(start, i).join("\n") });
	});
	return out;
}

test("popup code waits for its messages before window.close()", () => {
	const found : string[] = [];
	for (const file of sourceFiles(root)) {
		for (const { line, body } of blocksBeforeClose(readFileSync(file, "utf8"))) {
			body.split("\n").forEach(l => {
				const code = l.replace(/\/\/.*$/, "");
				if (/runtime\.sendMessage\s*[<(]/.test(code) && !/\b(await|return)\b/.test(code) && !/=\s*await\b/.test(code))
					found.push(`${file.slice(root.length + 1)}:${line}: ${code.trim()}`);
			});
		}
	}
	assert.deepEqual(found, [], "await the message (or use sendAndWait) before closing the popup:\n" + found.join("\n"));
});
