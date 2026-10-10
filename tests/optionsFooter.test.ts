"use strict";

// The options screen: a fixed bottom bar of buttons, the licenses in the
// page body, and the incognito status on Chrome too. Source-string tests.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p : string) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const tsx = read("src/popup/views/TabOptions.tsx");
const optionsCss = read("css/components/options.css");
const narrowCss = read("css/layout/narrow.css");
const manager = read("src/popup/views/TabManager.tsx");

describe("options bottom bar", () => {
	test("has the buttons in order", () => {
		const bar = tsx.slice(tsx.indexOf("footer() {"));
		assert.ok(bar.length > 0);
		const labels = ["Changelog", "Help", "Change shortcut keys", "Back to tabs"];
		let at = -1;
		for (const l of labels) {
			const i = bar.indexOf(", \"" + l + "\", ");
			assert.ok(i > at, l);
			at = i;
		}
		assert.match(bar, /<button type="button"/);
	});

	test("Back to tabs is left out on the standalone options page", () => {
		assert.match(manager, /onBack=\{window\.optionPage \? undefined : this\.toggleOptions\}/);
	});

	test("Back to tabs uses the header options button's function", () => {
		assert.match(tsx, /onBack/);
		assert.match(manager, /: this.toggleOptions}/);
	});

	test("the body no longer has the changelog, help and Chrome shortcut rows", () => {
		assert.ok(!tsx.includes("What's new in this version"));
		assert.ok(!tsx.includes("Help: how to use Tab Manager Plus"));
		assert.ok(!tsx.includes(">\n\t\t\t\t\t\t\t\t\tChange shortcut key\n"));
	});

	test("the licenses are in the page body, not fixed", () => {
		assert.ok(!/\.licenses\s*\{\s*position:\s*fixed/.test(optionsCss));
		assert.match(optionsCss, /\.options-footer\s*\{[^}]*position:\s*fixed/);
	});

	test("labels hide on a narrow popup, icons stay", () => {
		assert.match(narrowCss, /@media \(min-width: 100px\) and \(max-width: 450px\)[\s\S]*\.options-footer-button span.label/);
	});

	test("the footer buttons are centred", () => {
		assert.match(optionsCss, /\.options-footer\s*\{[^}]*justify-content:\s*center/);
	});

	test("uses theme variables, no hardcoded colours", () => {
		const block = optionsCss.slice(optionsCss.indexOf(".options-footer"));
		assert.ok(!/#[0-9a-f]{3,6}\b/i.test(block));
	});
});

describe("incognito status on Chrome", () => {
	test("both browsers read isAllowedIncognitoAccess, on mount and focus", () => {
		assert.ok(!/if \(IS_FIREFOX\) \{\s*const incognitoAllowed/.test(tsx));
		assert.match(tsx, /checkIncognito = async/);
		assert.match(tsx, /isAllowedIncognitoAccess\(\)\.catch\(\(\) => undefined\)/);
		assert.match(tsx, /addEventListener\("focus", this\.checkIncognito\)/);
		assert.ok(!/permissions\.onAdded\?\.addListener\(this\.checkIncognito\)/.test(tsx));
	});
	test("the Chrome row shows the note", () => {
		const i = tsx.indexOf("openIncognitoOptions}");
		assert.ok(tsx.slice(i, i + 900).includes("Currently: "));
	});
});
