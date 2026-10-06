"use strict";

// Unit tests for the icon foundation in src/icons (path parser, family
// validator, SVG renderer, palette). Run with: npm test

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { pathPoints } from "../src/icons/path.ts";
import { validateFamily } from "../src/icons/validate.ts";
import { iconSvg, themePaint, cssPaint } from "../src/icons/svg.ts";
import { paletteCss, COLORS } from "../src/icons/palette.ts";
import { ICON_NAMES, ACTION_ICONS, OPTION_ICONS, STATE_ICONS, COLOR_KEYS, type IconFamily, type IconDef, type IconPart } from "../src/icons/types.ts";

// the two parts muted's style rule asks of every icon: a named colour and an outline stroke
const RULE_PARTS : IconPart[] = [{ d: "M2 2h2v2H2z", kind: "fill", color: "blue" }, { d: "M2 2h2", kind: "stroke", color: "ink" }];

// a muted family where every icon is the same def; the style rule's parts are
// appended (after the def's own, so "part 0" is the def's first) unless raw
function family(def : IconDef, drop : string[] = [], raw = false) : IconFamily {
	const icons = Object.fromEntries(ICON_NAMES.filter((n) => !drop.includes(n)).map((n) => [n, raw ? def : withRule(def)]));
	return { id: "muted", label: "muted", icons } as IconFamily;
}
const withRule = (def : IconDef) : IconDef => ({ ...def, parts: [...def.parts, ...RULE_PARTS] });
const LINE : IconDef = { role: "neutral", parts: [{ d: "M2 2h12v12H2z", kind: "stroke" }] };

describe("pathPoints", () => {
	test("absolute and relative commands", () => {
		assert.deepEqual(pathPoints("M2 3L4 5h2v-1z"), [[2, 3], [4, 5], [6, 5], [6, 4]]);
		assert.deepEqual(pathPoints("m1 1 2 2"), [[1, 1], [3, 3]]);
	});
	test("curves give their control points", () => {
		assert.deepEqual(pathPoints("M0 0C1 2 3 4 5 6"), [[0, 0], [1, 2], [3, 4], [5, 6]]);
		assert.deepEqual(pathPoints("M1 1q1 1 2 0"), [[1, 1], [2, 2], [3, 1]]);
	});
	test("arcs: end point only, flags separate", () => {
		assert.deepEqual(pathPoints("M2 8a6 6 0 0 1 12 0"), [[2, 8], [14, 8]]);
		assert.throws(() => pathPoints("M2 8a6 6 0 014 0"), /arc flags/);
	});
	test("compact numbers", () => {
		assert.deepEqual(pathPoints("M1.5.5l-.5-.5"), [[1.5, 0.5], [1, 0]]);
	});
	test("errors", () => {
		assert.throws(() => pathPoints("L2 2"), /must start with M/);
		assert.throws(() => pathPoints("M2 2 X"), /unexpected "X"/);
		assert.throws(() => pathPoints("M2 2C1 1"), /C needs 6 numbers/);
	});
});

describe("validateFamily", () => {
	test("a complete, in-bounds family has no errors", () => {
		assert.deepEqual(validateFamily(family(LINE)), []);
	});
	test("missing and extra names", () => {
		const f = family(LINE, ["save"]);
		(f.icons as any)["sav"] = withRule(LINE);
		assert.deepEqual(validateFamily(f), ["save: missing", "sav: not an icon name"]);
	});
	test("strokes stay half a stroke inside, fills may touch the edge", () => {
		const edge = validateFamily(family({ role: "neutral", parts: [{ d: "M0.5 8H8", kind: "stroke" }] }));
		assert.equal(edge.length, ICON_NAMES.length);
		assert.match(edge[0], /part 0: point \(0.5, 8\) outside 0.8..15.2/);
		assert.deepEqual(validateFamily(family({ role: "add", parts: [{ d: "M0 0h16v16H0z", kind: "fill" }] })), []);
	});
	test("bad path data is reported, not thrown", () => {
		const errors = validateFamily(family({ role: "neutral", parts: [{ d: "M2 8a6 6 0 014 0", kind: "stroke" }] }));
		assert.match(errors[0], /^save: part 0: .*arc flags/);
	});
	test("unknown role and kind", () => {
		const errors = validateFamily(family({ role: "pink" as any, parts: [{ d: "M2 2h4", kind: "glow" as any }] }));
		assert.ok(errors.includes("save: unknown role \"pink\""));
		assert.ok(errors.includes("save: part 0: unknown kind \"glow\""));
	});
});

// the same def for the given names only
function partial(def : IconDef, names : readonly string[], extra : Partial<IconFamily> = {}) : IconFamily {
	return { id: "muted", label: "muted", icons: Object.fromEntries(names.map((n) => [n, withRule(def)])), ...extra } as IconFamily;
}
const FLAT : IconDef = { role: "neutral", parts: [{ d: "M2 2h12v12H2z", kind: "fill", color: "blue" }, { d: "M2 2h12v12H2z", kind: "stroke", color: "ink" }] };

describe("validateFamily: colour parts", () => {
	test("palette has every colour key", () => {
		assert.deepEqual(Object.keys(COLORS), [...COLOR_KEYS]);
		assert.equal(COLORS.ink, "#1f2633");
		// the muted family's softer keys are appended, the first 20 keep their order
		assert.deepEqual(COLOR_KEYS.slice(0, 3), ["ink", "white", "red"]);
		for (const k of ["coral", "coral-dark", "lime", "lime-dark", "amber", "blue-soft"]) assert.match(COLORS[k as keyof typeof COLORS], /^#[0-9a-f]{6}$/);
		assert.equal(COLORS["grey-light"], "#e5e7eb");
	});
	test("unknown colour values", () => {
		const bad = validateFamily(family({ role: "neutral", parts: [
			{ d: "M2 2h4v4H2z", kind: "fill", color: "teal" as any },
			{ d: "M2 2h4", kind: "stroke", color: "ink" },
		] }));
		assert.ok(bad.includes('save: part 0: unknown color "teal"'));
	});
	test("width only on strokes, within 0.6..2.4", () => {
		const wide = validateFamily(family({ role: "neutral", parts: [{ d: "M4 4h8", kind: "stroke", width: 3 }] }));
		assert.ok(wide.includes("save: part 0: width 3 outside 0.6..2.4"));
		const thin = validateFamily(family({ role: "neutral", parts: [{ d: "M4 4h8", kind: "stroke", width: 0.5 }] }));
		assert.ok(thin.includes("save: part 0: width 0.5 outside 0.6..2.4"));
		const onFill = validateFamily(family({ role: "neutral", parts: [{ d: "M4 4h8v4z", kind: "fill", width: 1 }] }));
		assert.ok(onFill.includes("save: part 0: width needs a stroke part"));
		assert.deepEqual(validateFamily(family({ role: "neutral", parts: [{ d: "M4 4h8", kind: "stroke", width: 2.4 }] })), []);
	});
	test("opacity within 0..1", () => {
		const bad = validateFamily(family({ role: "neutral", parts: [{ d: "M4 4h8v4z", kind: "fill", opacity: 1.5 }] }));
		assert.ok(bad.includes("save: part 0: opacity 1.5 outside 0..1"));
		assert.deepEqual(validateFamily(family({ role: "neutral", parts: [{ d: "M4 4h8v4z", kind: "fill", opacity: 0.5 }] })), []);
	});
	test("stroke bounds use the part's own half width", () => {
		const thin = { role: "neutral" as const, parts: [{ d: "M0.4 8H8", kind: "stroke" as const, width: 0.8 }] };
		assert.deepEqual(validateFamily(family(thin)), []);
		const wide = validateFamily(family({ role: "neutral", parts: [{ d: "M1 8H8", kind: "stroke", width: 2.4 }] }));
		assert.match(wide[0], /point \(1, 8\) outside 1.2..14.8/);
	});
});

describe("validateFamily: state icons", () => {
	const REQUIRED = [...ACTION_ICONS, ...OPTION_ICONS];
	test("the state variants are known names", () => {
		assert.deepEqual([...STATE_ICONS], ["recent-1", "recent-2", "recent-3", "filter-on", "theme-light", "theme-dark"]);
		for (const n of STATE_ICONS) assert.ok(ICON_NAMES.includes(n), n);
	});
	test("a family without them is valid: they are optional variants", () => {
		assert.deepEqual(validateFamily(partial(LINE, REQUIRED)), []);
		assert.deepEqual(validateFamily(partial(LINE, ACTION_ICONS, { scope: "actions" })), []);
	});
	test("a family with them is valid", () => {
		assert.deepEqual(validateFamily(partial(LINE, [...REQUIRED, ...STATE_ICONS])), []);
	});
	test("a state icon is checked like any other", () => {
		const f = partial(LINE, [...REQUIRED, "recent-2"]);
		(f.icons as any)["recent-2"] = withRule({ role: "neutral", parts: [{ d: "M0 0h4", kind: "stroke" }] });
		assert.match(validateFamily(f)[0], /^recent-2: part 0: point/);
	});
	test("filter-on and the theme variants are optional and checked like any icon", () => {
		for (const n of ["filter-on", "theme-light", "theme-dark"] as const) {
			assert.deepEqual(validateFamily(partial(LINE, [...REQUIRED, n])), [], n);
			const f = partial(LINE, [...REQUIRED, n]);
			(f.icons as any)[n] = withRule({ role: "neutral", parts: [{ d: "M0 0h4", kind: "stroke" }] });
			assert.match(validateFamily(f)[0], new RegExp("^" + n + ": part 0: point"));
		}
	});
	test("an unknown level still fails", () => {
		const f = partial(LINE, REQUIRED);
		(f.icons as any)["recent-4"] = withRule(LINE);
		assert.deepEqual(validateFamily(f), ["recent-4: not an icon name"]);
	});
});

describe("validateFamily: scope and draft", () => {
	test("actions scope needs only the action icons", () => {
		assert.deepEqual(validateFamily(partial(LINE, ACTION_ICONS, { scope: "actions" })), []);
		const errors = validateFamily(partial(LINE, ACTION_ICONS.filter((n) => n !== "pin"), { scope: "actions" }));
		assert.deepEqual(errors, ["pin: missing"]);
	});
	test("actions scope may include option icons but still rejects unknown names", () => {
		const f = partial(LINE, [...ACTION_ICONS, OPTION_ICONS[0]], { scope: "actions" });
		(f.icons as any).bogus = withRule(LINE);
		assert.deepEqual(validateFamily(f), ["bogus: not an icon name"]);
	});
	test("an all-scope family still needs every icon", () => {
		assert.equal(validateFamily(partial(LINE, ACTION_ICONS)).length, OPTION_ICONS.length);
	});
	test("a draft reports no missing icons but still per-icon errors", () => {
		assert.deepEqual(validateFamily(partial(LINE, [], { draft: true })), []);
		const f = partial(LINE, ["save"], { draft: true });
		(f.icons as any).pin = withRule({ role: "neutral", parts: [{ d: "M0 0h4", kind: "stroke" }] });
		const errors = validateFamily(f);
		assert.equal(errors.length, 1);
		assert.match(errors[0], /^pin: part 0: point/);
	});
});

describe("validateFamily: muted", () => {
	test("muted is flat: a colour part and an outline stroke", () => {
		assert.deepEqual(validateFamily(family(FLAT, [], true)), []);
		const noStroke = validateFamily(family({ role: "neutral", parts: [{ d: "M2 2h4v4z", kind: "fill", color: "coral" }] }, [], true));
		assert.ok(noStroke.includes("save: flat icons need a stroke part (the outline)"));
		const noColour = validateFamily(family({ role: "neutral", parts: [{ d: "M2 2h4", kind: "stroke" }, { d: "M2 2h4v4z", kind: "fill" }] }, [], true));
		assert.ok(noColour.includes("save: flat icons need a part with color"));
		const tinted = validateFamily(family({ role: "accent", parts: [{ d: "M2 2h4v4H2z", kind: "tint" }] }, [], true));
		assert.match(tinted[0], /^save: flat icons need/);
	});
});

describe("iconSvg: colour parts", () => {
	const paint = themePaint("neutral", "light");
	test("color paints fills and strokes with the named colour", () => {
		const svg = iconSvg({ role: "neutral", parts: [{ d: "M2 2h4v4z", kind: "fill", color: "red" }, { d: "M2 2h4", kind: "stroke", color: "blue-dark" }] }, 16, paint);
		assert.ok(svg.includes('fill="#ef4444"'));
		assert.ok(svg.includes('stroke="#1d4ed8"'));
		assert.ok(!svg.includes(paint.text));
		assert.ok(!svg.includes("<defs>"));
	});
	test("color on a tint paints with the named colour", () => {
		assert.ok(iconSvg({ role: "neutral", parts: [{ d: "M2 2h4v4z", kind: "tint", color: "sky" }] }, 16, paint).includes('fill="#7dd3fc"'));
	});
	test("opacity and width", () => {
		const svg = iconSvg({ role: "neutral", parts: [{ d: "M2 2h4v4z", kind: "fill", color: "white", opacity: 0.5 }, { d: "M2 2h4", kind: "stroke", width: 1 }] }, 16, paint);
		assert.ok(svg.includes('opacity="0.5"'));
		assert.ok(svg.includes('stroke-width="1"'));
		assert.ok(!svg.includes('stroke-width="1.6"'));
		assert.ok(!iconSvg(LINE, 16, paint).includes("opacity"));
	});
	test("listed order is kept when any part has a colour", () => {
		const svg = iconSvg({ role: "neutral", parts: [
			{ d: "M1 1h2", kind: "stroke", color: "ink" },
			{ d: "M2 2h2", kind: "fill", color: "red" },
			{ d: "M3 3h2", kind: "fill", color: "white", opacity: 0.5 },
			{ d: "M4 4h2", kind: "tint" },
		] }, 16, paint);
		const at = ["M1 1h2", "M2 2h2", "M3 3h2", "M4 4h2"].map((d) => svg.indexOf('d="' + d));
		assert.deepEqual([...at].sort((a, b) => a - b), at);
	});
});

describe("iconSvg", () => {
	const def : IconDef = { role: "danger", parts: [
		{ d: "M4 4l8 8", kind: "stroke" },
		{ d: "M2 2h12v12H2z", kind: "tint" },
	] };
	test("tints under strokes, stroke style, size", () => {
		const svg = iconSvg(def, 16, themePaint("danger", "light"));
		assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">'));
		assert.ok(svg.indexOf('d="M2 2h12v12H2z"') < svg.indexOf('d="M4 4l8 8"'));
		assert.ok(svg.includes('stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"'));
		assert.ok(svg.includes('fill="rgba(220, 38, 38, 0.18)"'));
	});
	test("dark paint differs from light", () => {
		assert.notDeepEqual(themePaint("danger", "dark"), themePaint("danger", "light"));
		assert.ok(iconSvg(def, 16, themePaint("danger", "dark")).includes('stroke="#e6e6e6"'));
	});
	test("css paint uses currentColor and the palette's properties", () => {
		const svg = iconSvg(def, 12, cssPaint("danger"));
		assert.ok(svg.includes('stroke="currentColor"'));
		assert.ok(svg.includes('fill="var(--icon-tint-danger)"'));
	});
});

describe("paletteCss", () => {
	test("one colour and one tint per role", () => {
		const css = paletteCss(":root", "dark");
		assert.ok(css.startsWith(":root {\n"));
		assert.ok(css.includes("\t--icon-add: #4ade80;"));
		assert.ok(css.includes("\t--icon-tint-warn: rgba(251, 191, 36, 0.22);"));
	});
});
