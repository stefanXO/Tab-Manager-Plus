"use strict";

// Unit tests for the icon foundation in src/icons (path parser, family
// validator, SVG renderer, palette). Run with: npm test

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { pathPoints } from "../src/icons/path.ts";
import { validateFamily } from "../src/icons/validate.ts";
import { iconSvg } from "../src/icons/svg.ts";
import { COLORS } from "../src/icons/palette.ts";
import { ICON_NAMES, ACTION_ICONS, OPTION_ICONS, STATE_ICONS, COLOR_KEYS, type IconFamily, type IconDef, type IconPart } from "../src/icons/types.ts";

// the two parts muted's style rule asks of every icon: a named colour and an outline stroke
const RULE_PARTS : IconPart[] = [{ d: "M2 2h2v2H2z", kind: "fill", color: "coral" }, { d: "M2 2h2", kind: "stroke", color: "ink" }];

// a muted family where every icon is the same def; the style rule's parts are
// appended (after the def's own, so "part 0" is the def's first) unless raw
function family(def : IconDef, drop : string[] = [], raw = false) : IconFamily {
	const icons = Object.fromEntries(ICON_NAMES.filter((n) => !drop.includes(n)).map((n) => [n, raw ? def : withRule(def)]));
	return { id: "muted", label: "muted", icons } as IconFamily;
}
const withRule = (def : IconDef) : IconDef => ({ ...def, parts: [...def.parts, ...RULE_PARTS] });
const LINE : IconDef = { parts: [{ d: "M2 2h12v12H2z", kind: "stroke", color: "ink" }] };

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
		const edge = validateFamily(family({ parts: [{ d: "M0.5 8H8", kind: "stroke", color: "ink" }] }));
		assert.equal(edge.length, ICON_NAMES.length);
		assert.match(edge[0], /part 0: point \(0.5, 8\) outside 0.8..15.2/);
		assert.deepEqual(validateFamily(family({ parts: [{ d: "M0 0h16v16H0z", kind: "fill", color: "coral" }] })), []);
	});
	test("bad path data is reported, not thrown", () => {
		const errors = validateFamily(family({ parts: [{ d: "M2 8a6 6 0 014 0", kind: "stroke", color: "ink" }] }));
		assert.match(errors[0], /^save: part 0: .*arc flags/);
	});
	test("unknown kind", () => {
		const errors = validateFamily(family({ parts: [{ d: "M2 2h4", kind: "glow" as any, color: "ink" }] }));
		assert.ok(errors.includes("save: part 0: unknown kind \"glow\""));
	});
});

// the same def for the given names only
function partial(def : IconDef, names : readonly string[], extra : Partial<IconFamily> = {}) : IconFamily {
	return { id: "muted", label: "muted", icons: Object.fromEntries(names.map((n) => [n, withRule(def)])), ...extra } as IconFamily;
}
const FLAT : IconDef = { parts: [{ d: "M2 2h12v12H2z", kind: "fill", color: "coral" }, { d: "M2 2h12v12H2z", kind: "stroke", color: "ink" }] };

describe("validateFamily: colour parts", () => {
	test("palette has every colour key", () => {
		assert.deepEqual(Object.keys(COLORS), [...COLOR_KEYS]);
		assert.equal(COLORS.ink, "#1f2633");
		assert.deepEqual(COLOR_KEYS.slice(0, 3), ["ink", "white", "grey-light"]);
		for (const k of ["coral", "coral-dark", "lime", "lime-dark", "amber", "blue-soft"]) assert.match(COLORS[k as keyof typeof COLORS], /^#[0-9a-f]{6}$/);
		assert.equal(COLORS["grey-light"], "#e5e7eb");
	});
	test("a part without a colour", () => {
		const bad = validateFamily(family({ parts: [{ d: "M2 2h4v4H2z", kind: "fill" } as any, { d: "M2 2h4", kind: "stroke", color: "ink" }] }));
		assert.ok(bad.includes("save: part 0: missing color"));
	});
	test("unknown colour values", () => {
		const bad = validateFamily(family({ parts: [
			{ d: "M2 2h4v4H2z", kind: "fill", color: "teal" as any },
			{ d: "M2 2h4", kind: "stroke", color: "ink" },
		] }));
		assert.ok(bad.includes('save: part 0: unknown color "teal"'));
	});
	test("width only on strokes, within 0.6..2.4", () => {
		const wide = validateFamily(family({ parts: [{ d: "M4 4h8", kind: "stroke", color: "ink", width: 3 }] }));
		assert.ok(wide.includes("save: part 0: width 3 outside 0.6..2.4"));
		const thin = validateFamily(family({ parts: [{ d: "M4 4h8", kind: "stroke", color: "ink", width: 0.5 }] }));
		assert.ok(thin.includes("save: part 0: width 0.5 outside 0.6..2.4"));
		const onFill = validateFamily(family({ parts: [{ d: "M4 4h8v4z", kind: "fill", color: "coral", width: 1 }] }));
		assert.ok(onFill.includes("save: part 0: width needs a stroke part"));
		assert.deepEqual(validateFamily(family({ parts: [{ d: "M4 4h8", kind: "stroke", color: "ink", width: 2.4 }] })), []);
	});
	test("opacity within 0..1", () => {
		const bad = validateFamily(family({ parts: [{ d: "M4 4h8v4z", kind: "fill", color: "coral", opacity: 1.5 }] }));
		assert.ok(bad.includes("save: part 0: opacity 1.5 outside 0..1"));
		assert.deepEqual(validateFamily(family({ parts: [{ d: "M4 4h8v4z", kind: "fill", color: "coral", opacity: 0.5 }] })), []);
	});
	test("stroke bounds use the part's own half width", () => {
		const thin = { parts: [{ d: "M0.4 8H8", kind: "stroke" as const, color: "ink" as const, width: 0.8 }] };
		assert.deepEqual(validateFamily(family(thin)), []);
		const wide = validateFamily(family({ parts: [{ d: "M1 8H8", kind: "stroke", color: "ink", width: 2.4 }] }));
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
		(f.icons as any)["recent-2"] = withRule({ parts: [{ d: "M0 0h4", kind: "stroke", color: "ink" }] });
		assert.match(validateFamily(f)[0], /^recent-2: part 0: point/);
	});
	test("filter-on and the theme variants are optional and checked like any icon", () => {
		for (const n of ["filter-on", "theme-light", "theme-dark"] as const) {
			assert.deepEqual(validateFamily(partial(LINE, [...REQUIRED, n])), [], n);
			const f = partial(LINE, [...REQUIRED, n]);
			(f.icons as any)[n] = withRule({ parts: [{ d: "M0 0h4", kind: "stroke", color: "ink" }] });
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
		(f.icons as any).pin = withRule({ parts: [{ d: "M0 0h4", kind: "stroke", color: "ink" }] });
		const errors = validateFamily(f);
		assert.equal(errors.length, 1);
		assert.match(errors[0], /^pin: part 0: point/);
	});
});

describe("validateFamily: muted", () => {
	test("muted is flat: every icon has an outline stroke", () => {
		assert.deepEqual(validateFamily(family(FLAT, [], true)), []);
		const noStroke = validateFamily(family({ parts: [{ d: "M2 2h4v4z", kind: "fill", color: "coral" }] }, [], true));
		assert.ok(noStroke.includes("save: flat icons need a stroke part (the outline)"));
		const tinted = validateFamily(family({ parts: [{ d: "M2 2h4v4H2z", kind: "tint", color: "coral" }] }, [], true));
		assert.match(tinted[0], /^save: flat icons need/);
	});
});

describe("iconSvg", () => {
	test("color paints fills and strokes with the named colour", () => {
		const svg = iconSvg({ parts: [{ d: "M2 2h4v4z", kind: "fill", color: "coral" }, { d: "M2 2h4", kind: "stroke", color: "ink" }] }, 16);
		assert.ok(svg.includes('fill="#f06b6b" fill-rule="evenodd" stroke="none"'));
		assert.ok(svg.includes('fill="none" stroke="#1f2633"'));
		assert.ok(!svg.includes("<defs>"));
	});
	test("color on a tint paints with the named colour, without fill-rule", () => {
		assert.ok(iconSvg({ parts: [{ d: "M2 2h4v4z", kind: "tint", color: "sky-soft" }] }, 16).includes('fill="#9fd3ee" stroke="none"'));
	});
	test("opacity and width", () => {
		const svg = iconSvg({ parts: [{ d: "M2 2h4v4z", kind: "fill", color: "white", opacity: 0.5 }, { d: "M2 2h4", kind: "stroke", color: "ink", width: 1 }] }, 16);
		assert.ok(svg.includes('opacity="0.5"'));
		assert.ok(svg.includes('stroke-width="1"'));
		assert.ok(!svg.includes('stroke-width="1.6"'));
		assert.ok(!iconSvg(LINE, 16).includes("opacity"));
	});
	test("parts keep their listed order", () => {
		const svg = iconSvg({ parts: [
			{ d: "M1 1h2", kind: "stroke", color: "ink" },
			{ d: "M2 2h2", kind: "fill", color: "coral" },
			{ d: "M3 3h2", kind: "fill", color: "white", opacity: 0.5 },
			{ d: "M4 4h2", kind: "tint", color: "sky-soft" },
		] }, 16);
		const at = ["M1 1h2", "M2 2h2", "M3 3h2", "M4 4h2"].map((d) => svg.indexOf('d="' + d));
		assert.deepEqual([...at].sort((a, b) => a - b), at);
	});
	test("svg wrapper, size and default stroke style", () => {
		const svg = iconSvg(LINE, 12);
		assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="12" height="12">'));
		assert.ok(svg.includes('stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"'));
	});
});
