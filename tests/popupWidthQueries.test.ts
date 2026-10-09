"use strict";

// Chrome lays an extension's action popup out at 25px wide first, on every
// frame that changes anything (a hover). A width query in the popup's
// stylesheet that matches at 25px and not at the popup's own width switches
// on and off twice per frame, and each switch restyles the whole popup: with
// ~150 tabs and 17 saved windows a hover took 0.5-3 s per frame (an
// unguarded `max-width: 540px` in documentation.css, which css/popup.css
// bundles too). Every max-width query therefore starts at 100px, as in
// css/layout/narrow.css. And the frame's fixed parts take the popup's width
// (--popup-width, src/helpers/popup_size.ts), not the viewport's, so that
// pass does not lay every tile out again. Run with: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p : string) => readFileSync(new URL("../css/" + p, import.meta.url), "utf8");

// css/popup.css and every file it imports
function popupCss() : { file : string, text : string }[] {
	const entry = read("popup.css");
	const files = [...entry.matchAll(/@import\s+"([^"]+)"/g)].map((m) => m[1]);
	assert.ok(files.length > 10, "popup.css imports");
	return files.map((file) => ({ file, text: read(file) }));
}

test("every max-width query of the popup's stylesheet starts at 100px", () => {
	for (const { file, text } of popupCss()) {
		for (const m of text.matchAll(/@(?:media|container)\s+([^{]+)\{/g)) {
			const query = m[1].trim();
			if (!/max-width/.test(query)) continue;
			assert.match(query, /min-width:\s*100px/, file + ": " + query + " matches at Chrome's 25px sizing pass");
		}
	}
});

test("the frame's fixed parts take the popup's width, not the viewport's", () => {
	const frame = read("layout/frame.css");
	for (const sel of [".window-container, .options-container {", ".window.top {", ".window.searchbox {"]) {
		const at = frame.indexOf(sel);
		assert.ok(at > -1, sel);
		const rule = frame.slice(at, frame.indexOf("}", at));
		assert.match(rule, /width: var\(--popup-width, 100%\)/, sel);
	}
	assert.match(readFileSync(new URL("../src/helpers/popup_size.ts", import.meta.url), "utf8"), /setProperty\("--popup-width"/);
});
