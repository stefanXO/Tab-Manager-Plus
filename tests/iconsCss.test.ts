"use strict";

// Unit tests for src/icons/css.ts: a family as background-image overrides
// for the popup's .icon classes.

import { test } from "node:test";
import assert from "node:assert/strict";
import { familyCss, ICON_CLASSES, STATS_CLASSES } from "../src/icons/css.ts";
import { ICON_NAMES, type IconFamily } from "../src/icons/types.ts";

const def = { parts: [{ d: "M4 4l8 8", kind: "stroke" as const, color: "ink" as const }] };
const fam = { id: "muted", label: "F", icons: Object.fromEntries(ICON_NAMES.map((n) => [n, def])) } as IconFamily;

test("every mapped class gets one rule, and no dark rules: the drawings use named colours", () => {
	const css = familyCss(fam);
	for (const cls of Object.values(ICON_CLASSES)) {
		assert.ok(css.includes(".icon." + cls + " {"), cls);
	}
	assert.ok(css.includes(".icon.tab::after {"));
	assert.ok(!css.includes("data-theme"));
});

test("images are encoded svg in the named colours", () => {
	const css = familyCss(fam);
	assert.ok(css.includes('background-image: url("data:image/svg+xml,'));
	assert.ok(css.includes(encodeURIComponent("#1f2633")));
});

test("the clock and the favicon are not toolbar classes", () => {
	assert.equal(ICON_CLASSES.recent, undefined);
	assert.equal(ICON_CLASSES.favicon, undefined);
});

test("names the family lacks are skipped", () => {
	const some = { ...fam, scope: "actions", icons: { save: def } } as IconFamily;
	const css = familyCss(some);
	assert.ok(css.includes(".icon.save {"));
	assert.ok(!css.includes(".icon.restore {"));
});

test("the recent button: one image per level", () => {
	const css = familyCss(fam);
	for (const level of [0, 1, 2, 3]) {
		assert.ok(css.includes('.icon.recent[data-level="' + level + '"] {'), "level " + level);
	}
});

test("a level without its own icon falls back to the recent clock", () => {
	const clock = { parts: [{ d: "M8 4V8h3", kind: "stroke" as const, color: "ink" as const }] };
	const lvl = { parts: [{ d: "M8 4V11", kind: "stroke" as const, color: "ink" as const }] };
	const rule = (css : string, level : number) => css.split("\n").find((l) => l.startsWith('.icon.recent[data-level="' + level + '"] {'));
	const plain = familyCss({ id: "muted", label: "F", icons: { recent: clock } } as IconFamily);
	assert.ok(rule(plain, 0));
	assert.equal(rule(plain, 1), rule(plain, 0).replace('"0"', '"1"'));
	const full = familyCss({ id: "muted", label: "F", icons: { recent: clock, "recent-2": lvl } } as IconFamily);
	assert.notEqual(rule(full, 2), rule(full, 0).replace('"0"', '"2"'));
	assert.equal(rule(full, 3), rule(full, 0).replace('"0"', '"3"'));
});

const filterOff = { parts: [{ d: "M2 8H14", kind: "stroke" as const, color: "ink" as const }] };
const filterOn = { parts: [{ d: "M2 2L14 14", kind: "stroke" as const, color: "coral" as const }] };
const rule = (css : string, selector : string) => css.split("\n").find((l) => l.startsWith(selector + " {"));
const value = (line : string | undefined) => line?.slice(line.indexOf("{"));

test("the filter button: .icon.filter is the off drawing, .enabled the filter-on one", () => {
	const css = familyCss({ id: "muted", label: "F", icons: { filter: filterOff, "filter-on": filterOn } } as IconFamily);
	const off = rule(css, ".icon.filter"), on = rule(css, ".icon.filter.enabled");
	assert.ok(off && on, "rules");
	assert.notEqual(value(on), value(off), "differ");
});

test("filter-on wins over the plain filter rule: same selector plus .enabled, later in the sheet", () => {
	const css = familyCss({ id: "muted", label: "F", icons: { filter: filterOff, "filter-on": filterOn } } as IconFamily);
	assert.ok(css.indexOf(".icon.filter.enabled {") > css.indexOf(".icon.filter {"));
});

test("no filter-on icon: the enabled filter button keeps the filter drawing", () => {
	const css = familyCss({ id: "muted", label: "F", icons: { filter: filterOff } } as IconFamily);
	assert.ok(rule(css, ".icon.filter.enabled"));
	assert.equal(value(rule(css, ".icon.filter.enabled")), value(rule(css, ".icon.filter")));
});

test("no filter icon at all: no filter rules", () => {
	assert.ok(!familyCss({ id: "muted", label: "F", icons: { save: def } } as IconFamily).includes(".icon.filter"));
});

test("no recent icon at all: no recent rules", () => {
	assert.ok(!familyCss({ id: "muted", label: "F", icons: { save: def } } as IconFamily).includes(".recent"));
});

test("the favicon is the --fav fallback on the tile and the list row", () => {
	const css = familyCss(fam);
	for (const sel of [".icon.tab::after", ".iconoverlay"]) {
		assert.ok(css.includes(sel + " { background-image: var(--fav, url(\"data:image/svg+xml,"), sel);
	}
});

test("no favicon icon: the tab.css fallback stays", () => {
	assert.ok(!familyCss({ id: "muted", label: "F", icons: { save: def } } as IconFamily).includes("--fav"));
});

test("the stats card's line icons: position, opener and copies use the family's list, add and duplicates icons", () => {
	const css = familyCss(fam);
	for (const [cls, name] of Object.entries(STATS_CLASSES)) {
		assert.ok(ICON_CLASSES[name as keyof typeof ICON_CLASSES], name + " is a toolbar icon");
		assert.ok(rule(css, "." + cls), cls);
	}
	assert.deepEqual(STATS_CLASSES, { "stats-icon-position": "view-vertical", "stats-icon-opener": "add", "stats-icon-copies": "duplicates" });
	// the same image as the toolbar button it stands for
	assert.equal(value(rule(css, ".stats-icon-opener")), value(rule(css, ".icon.add")));
	assert.equal(value(rule(css, ".stats-icon-copies")), value(rule(css, ".icon.duplicates")));
});

test("the stats card's page icon for a tab without a favicon: the plain favicon drawing, no --fav", () => {
	const css = familyCss(fam);
	const line = rule(css, ".stats-favicon-generic");
	assert.ok(line);
	assert.ok(!line.includes("--fav"));
	// the image inside the tiles' var(--fav, …) fallback
	const image = line.slice(line.indexOf("url("), line.lastIndexOf(";"));
	assert.ok(rule(css, ".iconoverlay").includes("var(--fav, " + image + ")"));
	assert.ok(!familyCss({ id: "muted", label: "F", icons: { save: def } } as IconFamily).includes(".stats-favicon-generic"));
});
