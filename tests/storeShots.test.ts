"use strict";

// Shape of tools/store-shots/shots.json, the file that drives the Chrome Web Store screenshot harness
// (node tools/store-shots/shoot.mjs, see tools/store-shots/README.md): the sizes must match the store's names, every
// favicon must be a known file, every tab url must parse. Run with: npm test

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dirname, "..", "tools", "store-shots");
const cfg = JSON.parse(readFileSync(join(dir, "shots.json"), "utf8"));

// the sizes the store accepts, by the names in store/images (see store/README.md)
const STORE_SIZES = ["1280x800", "440x280", "1400x560"];
const size = (s: number[]) => s.join("x");
const FRAMES = ["hero", "card", "side", "grid", "tile"];
const KEYS = ["Left", "Up", "Right", "Down", "Space", "Enter", "Escape", "Tab"];
const LAYOUTS = ["blocks", "blocks-big", "horizontal", "vertical"];

const allTabs: { title: string; url: string; favicon: string }[] = [
	...cfg.windows.flatMap((w: any) => w.tabs),
	...cfg.saved.flatMap((s: any) => s.tabs),
];
const openTabCount = cfg.windows.reduce((n: number, w: any) => n + w.tabs.length, 0);

describe("shots.json windows", () => {
	test("has windows with a name, a color and tabs", () => {
		assert.ok(cfg.windows.length >= 1);
		const ids = new Set();
		for (const w of cfg.windows) {
			assert.equal(typeof w.id, "number");
			assert.ok(!ids.has(w.id), "duplicate window id " + w.id);
			ids.add(w.id);
			assert.match(w.name, /\S/);
			assert.match(w.color, /^color\d+$/);
			assert.ok(w.tabs.length > 0, w.name + " has no tabs");
		}
	});

	test("every tab has a title, a parseable url and an age", () => {
		for (const t of cfg.windows.flatMap((w: any) => w.tabs)) {
			assert.match(t.title, /\S/);
			assert.doesNotThrow(() => new URL(t.url), "bad url: " + t.url);
			assert.equal(typeof t.ageMinutes, "number", "no ageMinutes: " + t.title);
			for (const k of ["pinned", "discarded", "audible", "muted", "active"]) assert.ok(!(k in t) || typeof t[k] === "boolean", k + " must be boolean");
		}
	});

	test("every saved window has an id, a name, a color, an age and parseable tabs", () => {
		const ids = new Set();
		for (const s of cfg.saved) {
			assert.ok(!ids.has(s.id), "duplicate saved id " + s.id);
			ids.add(s.id);
			assert.match(s.name, /\S/);
			assert.match(s.color, /^color\d+$/);
			assert.equal(typeof s.ageDays, "number");
			assert.ok(s.tabs.length > 0);
			for (const t of s.tabs) { assert.match(t.title, /\S/); assert.doesNotThrow(() => new URL(t.url), "bad url: " + t.url); }
		}
	});
});

describe("shots.json favicons", () => {
	// the icons are third-party logos: never committed, cached in tools/store-shots/fav (see fetch-favicons.mjs)
	const caches = [join(dir, "fav"), join(dir, "..", "css-baseline", "fav")].filter((d) => existsSync(d));

	test("every favicon is a <domain>.png that belongs to its tab's host", () => {
		for (const t of allTabs) {
			assert.match(t.favicon, /^[a-z0-9.-]+\.png$/, "bad favicon name: " + t.favicon);
			const domain = t.favicon.slice(0, -4), host = new URL(t.url).hostname;
			assert.ok(host === domain || host.endsWith("." + domain), `${t.favicon} does not match ${host}`);
		}
	});

	test("every favicon file referenced exists (once the cache has been filled by a shoot)", (ctx) => {
		if (!caches.length) return ctx.skip("no favicon cache yet: run `npm run store:shots` once");
		for (const f of new Set(allTabs.map((t) => t.favicon))) {
			assert.ok(caches.some((c) => existsSync(join(c, f))), `${f} is in none of ${caches.join(", ")}`);
		}
	});
});

describe("shots.json shots", () => {
	test("ids are unique and every shot names its output", () => {
		const ids = cfg.shots.map((s: any) => s.id);
		assert.equal(new Set(ids).size, ids.length);
		for (const s of cfg.shots) {
			assert.match(String(s.id), /^\S+$/);
			assert.match(s.file, /^(screenshot-\d+|promo-(small|marquee))$/, "file: " + s.file);
			assert.ok(FRAMES.includes(s.frame), `shot ${s.id}: unknown frame ${s.frame}`);
		}
	});

	test("every size is one the store accepts, and fits the file name", () => {
		for (const s of cfg.shots) {
			assert.ok(STORE_SIZES.includes(size(s.size)), `shot ${s.id}: ${size(s.size)} is not one of ${STORE_SIZES}`);
			if (s.file.startsWith("screenshot")) assert.equal(size(s.size), "1280x800", `shot ${s.id}`);
			if (s.file === "promo-small") assert.equal(size(s.size), "440x280");
			if (s.file === "promo-marquee") assert.equal(size(s.size), "1400x560");
		}
	});

	test("styles, scales and the A / B overrides are well formed", () => {
		for (const s of cfg.shots) {
			assert.ok(s.styles.length > 0 && s.styles.every((x: string) => x === "A" || x === "B"), `shot ${s.id}: styles`);
			for (const x of s.onRequest || []) assert.ok(x === "A" || x === "B");
			for (const x of ["A", "B"]) for (const k of ["scales"]) {
				const v = s[x]?.[k];
				if (v) assert.ok(v.every((n: number) => n === 1 || n === 2), `shot ${s.id}: ${x}.${k}`);
			}
			// the style's own text keys: a tile has a name and a line in each style it is rendered in
			if (s.frame === "tile") for (const x of s.styles) {
				const m = { ...s, ...(s[x] || {}) };
				assert.match(m.name, /\S/, `shot ${s.id} style ${x}: name`);
				assert.match(m.line, /\S/, `shot ${s.id} style ${x}: line`);
			}
		}
	});

	test("card shots have a headline, and the keys they drive exist", () => {
		for (const s of cfg.shots) {
			if (s.frame === "card" || s.frame === "side" || s.frame === "grid") assert.match(s.title, /\S/, `shot ${s.id}: title`);
			if (s.layout) assert.ok(LAYOUTS.includes(s.layout), `shot ${s.id}: layout ${s.layout}`);
			if (s.theme) assert.ok(["system", "light", "dark"].includes(s.theme), `shot ${s.id}: theme ${s.theme}`);
			for (const k of s.keys || []) assert.ok(KEYS.includes(k) || Number.isInteger(k), `shot ${s.id}: key ${k}`);
			for (const g of s.grid || []) assert.ok(LAYOUTS.includes(g.layout) && ["light", "dark"].includes(g.theme) && g.caption, `shot ${s.id}: grid entry`);
			if (s.frame === "side") assert.ok(s.keypanel?.length, `shot ${s.id}: keypanel`);
			if (s.saved) assert.ok(cfg.saved.length > 0, `shot ${s.id} needs saved windows`);
		}
	});

	test("selections point at tabs that exist, callouts have a selector and a text", () => {
		for (const s of cfg.shots) {
			for (const sel of s.selections || []) {
				const m = /^#tab-(\d+)$/.exec(sel);
				assert.ok(m && +m[1] >= 1 && +m[1] <= openTabCount, `shot ${s.id}: ${sel} (tab ids are 1..${openTabCount})`);
			}
			for (const c of s.callouts || []) {
				assert.match(c.selector, /\S/);
				assert.match(c.text, /\S/);
				assert.ok(!c.align || ["center", "right"].includes(c.align), `shot ${s.id}: align ${c.align}`);
			}
			if (s.crop) assert.ok(s.callouts?.length, `shot ${s.id}: a crop needs a callout`);
		}
	});

	test("style B (the store pick) renders the hero, search, duplicates, layouts and both tiles", () => {
		const b = cfg.shots.filter((s: any) => s.styles.includes("B")).map((s: any) => s.id);
		for (const id of ["0", "3", "4", "7", "small", "marquee"]) assert.ok(b.includes(id), `style B lacks shot ${id}`);
	});
});

describe("shots.json tiles", () => {
	test("each alternative tile has an html file and store sizes", () => {
		const ids = new Set();
		for (const t of cfg.tiles) {
			assert.ok(!ids.has(t.id));
			ids.add(t.id);
			assert.ok(existsSync(join(dir, t.html)), t.html + " is missing");
			assert.match(t.out, /^tiles-[a-z]+$/);
			for (const [kind, s] of Object.entries<number[]>(t.sizes)) assert.equal(size(s), kind === "small" ? "440x280" : "1400x560");
		}
	});
});
