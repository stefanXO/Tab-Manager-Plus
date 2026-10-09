"use strict";

// documentation.html, the user guide: it is shipped, themed, links only to
// pages that exist, names only keys the popup really uses, the search syntax
// it teaches is the popup's own, and it stays easy to read.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const rootDir = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const read = (rel : string) => readFileSync(join(rootDir, rel), "utf8");
const html = read("documentation.html");

function sourceFiles(dir : string) : string[] {
	const out : string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...sourceFiles(path));
		else if (/\.(ts|tsx|js)$/.test(entry.name)) out.push(path);
	}
	return out;
}
// everything the extension's code says, and its manifest (the shortcuts)
const corpus = sourceFiles(join(rootDir, "src")).map((f) => readFileSync(f, "utf8")).join("\n") + read("manifest.json");

const decode = (s : string) => s
	.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
	.replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&amp;/g, "&");

describe("documentation.html", () => {
	test("exists and is part of the build", () => {
		assert.ok(existsSync(join(rootDir, "documentation.html")));
		assert.match(read("build.mjs"), /const STATIC = \[[^\]]*'documentation\.html'/);
		assert.match(read("build.mjs"), /const WATCHED = \[[^\]]*'documentation\.html'/);
		assert.match(read("scripts/bundle.mjs"), /'popup\/documentation': 'src\/popup\/documentation\.ts'/);
		assert.match(read("css/popup.css"), /@import "components\/documentation\.css" layer\(components\);/);
	});

	test("loads the stylesheet and the theme script", () => {
		assert.match(html, /<link rel="stylesheet" type="text\/css" href="css\/popup\.css"\/>/);
		assert.match(html, /<script src="dist\/popup\/documentation\.js"><\/script>/);
	});

	test("the theme script reads the popup's boot cache key", () => {
		const key = /const BOOT_CACHE = "([^"]+)"/;
		assert.equal(read("src/popup/documentation.ts").match(key)?.[1], read("src/helpers/settings.ts").match(key)?.[1]);
	});

	test("the options page links to it", () => {
		assert.match(read("src/popup/views/TabOptions.tsx"), /url: "documentation\.html"/);
	});

	test("every local link points to an existing file or an id on the page", () => {
		const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
		const bad : string[] = [];
		for (const [, href] of html.matchAll(/\shref="([^"]+)"/g)) {
			if (/^https:\/\//.test(href)) continue;
			if (href.startsWith("#")) {
				if (!ids.has(href.slice(1))) bad.push(href);
				continue;
			}
			const file = href.replace(/^\.\//, "").replace(/[?#].*$/, "");
			if (!existsSync(join(rootDir, file))) bad.push(href);
		}
		assert.deepEqual(bad, []);
	});

	test("every key cap is a key the popup uses", () => {
		// the caps the page may draw; the arrows and the comma by their names
		const NAMES : Record<string, string> = { "←": "Left", "→": "Right", "↑": "Up", "↓": "Down", ",": "Comma" };
		const ALLOWED = ["Alt", "Shift", "Ctrl", "M", ",", "Enter", "Esc", "Del", "Backspace", "Space", "Tab", "Z", "⌘", "⌫", "←", "→", "↑", "↓"];
		const caps = [...html.matchAll(/<kbd>([^<]*)<\/kbd>/g)].map((m) => decode(m[1]));
		assert.ok(caps.length > 10);
		for (const cap of caps) assert.ok(ALLOWED.includes(cap), `unknown key cap: ${cap}`);
		for (const cap of ALLOWED) {
			const name = NAMES[cap] ?? cap;
			const found = /^\w+$/.test(name) ? new RegExp(`\\b${name}\\b`).test(corpus) : corpus.includes(name);
			assert.ok(found, `key ${cap} (${name}) is not in src/ or manifest.json`);
		}
	});

	test("every inline icon is a popup icon, named as its hover card names it", () => {
		const icons = read("css/components/icons.css");
		const classes = [...html.matchAll(/<span class="icon (?:windowaction|tabaction) ([\w-]+)"/g)].map((m) => m[1]);
		assert.ok(classes.length > 15);
		for (const cls of classes) assert.ok(icons.includes(`.icon.${cls}`), `no .icon.${cls} in icons.css`);
		// the name next to an icon (<span class="doc-name">) is a hover card's
		// first line: a string in the code that starts with it
		const names = [...html.matchAll(/<span class="doc-name">([^<]+)<\/span>/g)].map((m) => m[1]);
		assert.ok(names.length > 10);
		for (const name of names) assert.ok(corpus.includes('"' + name), `"${name}" is not a hover card name in src/`);
	});

	test("the default shortcuts are the manifest's", () => {
		const manifest = JSON.parse(read("manifest.json"));
		assert.equal(manifest.commands._execute_action.suggested_key.default, "Alt+Shift+M");
		assert.equal(manifest.commands.switch_to_previous_active_tab.suggested_key.default, "Alt+Shift+Comma");
		assert.match(html, /<kbd>Alt<\/kbd><kbd>Shift<\/kbd><kbd>M<\/kbd>/);
		assert.match(html, /<kbd>Alt<\/kbd><kbd>Shift<\/kbd><kbd>,<\/kbd>/);
	});

	test("every search example uses syntax the search help lists", () => {
		const help = read("src/popup/searchHelp.ts");
		for (const prefix of ["t:", "u:", "s:", "-s:", "s:u:", "-u:", " OR "]) {
			assert.ok(help.includes(prefix), `searchHelp.ts lacks ${prefix}`);
		}
		// the examples of the search table, each one's prefix in the help
		const examples = [...html.matchAll(/<td><code>([^<]+)<\/code><\/td>/g)].map((m) => decode(m[1]));
		assert.ok(examples.includes("t:release") && examples.includes("s:tax") && examples.includes("-s:tax"));
		for (const ex of examples) {
			const prefix = ex.match(/^-?(?:s:)?(?:[tu]:)?/)?.[0] ?? "";
			if (prefix) assert.ok(help.includes(prefix), `${ex}: ${prefix} is not in searchHelp.ts`);
			// the regular expression examples are the help's own
			if (ex.startsWith("/")) assert.ok(help.includes(JSON.stringify(ex).slice(1, -1)), `${ex} is not in searchHelp.ts`);
		}
	});

	test("facts it states match the code", () => {
		// layouts, Undo time, the recent-tabs steps, the popup size limit
		const tm = read("src/popup/views/TabManager.tsx");
		for (const name of ["Block", "Big Block", "Rows", "List"]) assert.ok(tm.includes(`return "${name}"`), name);
		assert.match(read("src/popup/pendingDelete.ts"), /UNDO_MS = 8000/);
		assert.match(html, /for 8 seconds/);
		assert.match(read("src/popup/recent.ts"), /RECENT_WINDOWS = \[15 \* MIN, HOUR, 3 \* HOUR, 12 \* HOUR, DAY/);
		assert.match(read("src/popup/recent.ts"), /RECENT_LEVELS = 3/);
		assert.match(read("src/popup/views/TabOptions.tsx"), /max="800"[^\n]*\n[\s\S]*?max="600"/);
		assert.match(read("src/service_worker/ui/context_menus.ts"), /Open in own tab/);
		assert.match(read("src/service_worker/ui/context_menus.ts"), /Open sidebar/);
		// "no tab groups yet": true while the code never touches them
		assert.ok(!/tabGroups/.test(corpus), "the code uses tabGroups now: update the tab groups answer");
	});
	test("every mouse glyph is a defined symbol with an allowed label, and its word right after it, and no bare right-/middle-click is left", () => {
		const symbols = new Set([...html.matchAll(/<symbol id="(mouse-[\w-]+)"/g)].map((m) => m[1]));
		assert.ok(symbols.size >= 3);
		const uses = [...html.matchAll(/<use href="#(mouse-[^"]*)"/g)].map((m) => m[1]);
		assert.ok(uses.length > 10, `only ${uses.length} mouse glyphs`);
		for (const id of uses) assert.ok(symbols.has(id), `#${id} is not a <symbol>`);
		const ALLOWED = ["click", "right-click", "middle-click", "double-click"];
		const svgs = [...html.matchAll(/<svg class="mouse"[^>]*>/g)].map((m) => m[0]);
		assert.equal(svgs.length, uses.length);
		for (const svg of svgs) {
			const label = svg.match(/ role="img" aria-label="([^"]+)"/)?.[1];
			assert.ok(label && ALLOWED.includes(label), `mouse glyph without an allowed label: ${svg}`);
		}
		// each glyph is followed by its word, in sight: the label, any case
		const after = [...html.matchAll(/aria-label="([^"]+)"><use [^>]+><\/svg>(?:\s|&nbsp;)*([A-Za-z-]+)/g)];
		assert.equal(after.length, svgs.length, "a mouse glyph without its word right after it");
		for (const [, label, word] of after) assert.equal(word.toLowerCase(), label, `glyph ${label} followed by "${word}"`);
		// the words themselves: only after a glyph, the FAQ may keep one bare one
		const body = html.slice(html.indexOf("<body"))
			.replace(/<svg class="mouse"[\s\S]*?<\/svg>(?:\s|&nbsp;)*[A-Za-z-]+/g, " ");
		const faq = body.indexOf('id="faq"');
		const bare = [...body.matchAll(/\b(?:right|middle)-click/gi)];
		assert.deepEqual(bare.filter((m) => m.index! < faq).map((m) => m[0]), []);
		assert.ok(bare.filter((m) => m.index! > faq).length <= 1, "more than one bare right-/middle-click in the FAQ");
	});
});

// ---------------------------------------------------------------------------
// readability: Flesch-Kincaid grade of the running text
// ---------------------------------------------------------------------------

// syllables approximated by vowel groups; a silent final e is dropped
function syllables(word : string) : number {
	const w = word.toLowerCase().replace(/[^a-z]/g, "");
	if (!w) return 0;
	let n = (w.match(/[aeiouy]+/g) || []).length;
	if (n > 1 && /[^aeiouy]e$/.test(w) && !/[^aeiouy]le$/.test(w)) n--;
	return Math.max(1, n);
}

// the page's prose: the text of its paragraphs (<p>) and list items (<li>)
// only, so the tables, headings, the links at the top and the contents do not
// count; code and key caps left out, every paragraph or item ends a sentence
function proseOf(page : string) : string {
	let s = page.slice(page.indexOf("<body"));
	s = s.replace(/<script[\s\S]*?<\/script>/g, " ");
	s = s.replace(/<p class="doc-nav">[\s\S]*?<\/p>/g, " ");
	s = s.replace(/<ul class="doc-toc">[\s\S]*?<\/ul>/g, " ");
	s = s.replace(/<code>[\s\S]*?<\/code>/g, " ");
	s = s.replace(/<span class="stats-keys">[\s\S]*?<\/span>/g, " ");
	const blocks = [...s.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => m[2]);
	return decode(blocks.map((b) => b.replace(/<[^>]+>/g, " ").trim().replace(/[.!?:]?$/, ". ")).join(" "));
}

function fleschKincaid(text : string) : { grade : number, words : number, sentences : number } {
	const sentences = text.split(/[.!?:]+(?:\s|$)/).map((x) => x.trim()).filter((x) => /[A-Za-z]/.test(x));
	let words = 0, syl = 0;
	for (const sentence of sentences) {
		for (const word of sentence.split(/\s+/)) {
			if (!/[A-Za-z]/.test(word)) continue;
			words++;
			syl += syllables(word);
		}
	}
	const grade = 0.39 * (words / sentences.length) + 11.8 * (syl / words) - 15.59;
	return { grade, words, sentences: sentences.length };
}

describe("documentation.html readability", () => {
	test("syllable count", () => {
		assert.equal(syllables("tab"), 1);
		assert.equal(syllables("window"), 2);
		assert.equal(syllables("close"), 1);
		assert.equal(syllables("table"), 2);
		assert.equal(syllables("selected"), 3);
	});

	test("its prose reads at grade 6 to 9.5 (Flesch-Kincaid over <p> and <li>)", () => {
		const { grade, words, sentences } = fleschKincaid(proseOf(html));
		assert.ok(words > 500, `only ${words} words found: the text extraction broke`);
		console.log(`documentation.html: Flesch-Kincaid grade ${grade.toFixed(1)} (${words} words, ${sentences} sentences)`);
		assert.ok(grade <= 9.5, `grade ${grade.toFixed(1)} is above 9.5: shorter sentences, simpler words`);
		assert.ok(grade >= 6, `grade ${grade.toFixed(1)} is below 6: full sentences that say why, not chopped ones`);
	});
});
