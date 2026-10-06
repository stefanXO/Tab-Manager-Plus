"use strict";

import { ACTION_ICONS, COLOR_KEYS, ICON_NAMES, REQUIRED_ICONS, ROLES, STROKE_WIDTH, type IconFamily } from "./types.ts";
import { pathPoints } from "./path.ts";

// Everything wrong with a family, one readable line each ("save: part 0:
// point (16.5, 3) outside 0.8..15.2"); empty when it is fine. Strokes keep
// their centre line half a stroke inside the box so the 1.6 stroke is not
// clipped (the part's own width, if it has one); fills may touch the edge.
// A family with scope "actions" only needs the action icons (the state icons,
// recent-1..3, filter-on, theme-light, theme-dark, are optional for every family); a draft is
// not asked for missing icons at all, so it can be checked while it is drawn.
const KINDS = ["stroke", "tint", "fill"];
const EPS = 0.001;
const MIN_WIDTH = 0.6;
const MAX_WIDTH = 2.4;
const isColor = (c : unknown) => (COLOR_KEYS as readonly string[]).includes(c as string);

export function validateFamily(f : IconFamily) : string[] {
	const errors : string[] = [];
	const names = Object.keys(f.icons);
	const required = f.scope === "actions" ? ACTION_ICONS : REQUIRED_ICONS;
	if (!f.draft) for (const name of required) if (!f.icons[name]) errors.push(name + ": missing");
	for (const name of names) if (!(ICON_NAMES as readonly string[]).includes(name)) errors.push(name + ": not an icon name");

	for (const name of names) {
		const def = f.icons[name as keyof IconFamily["icons"]];
		if (!def) continue;
		if (!(ROLES as readonly string[]).includes(def.role)) errors.push(name + ": unknown role " + JSON.stringify(def.role));
		if (!def.parts?.length) {
			errors.push(name + ": no parts");
			continue;
		}
		def.parts.forEach((part, p) => {
			const at = name + ": part " + p + ": ";
			if (!KINDS.includes(part.kind)) {
				errors.push(at + "unknown kind " + JSON.stringify(part.kind));
				return;
			}
			if (part.color !== undefined && !isColor(part.color)) errors.push(at + "unknown color " + JSON.stringify(part.color));
			if (part.opacity !== undefined && !(part.opacity >= 0 && part.opacity <= 1)) errors.push(at + "opacity " + part.opacity + " outside 0..1");
			if (part.width !== undefined) {
				if (part.kind !== "stroke") errors.push(at + "width needs a stroke part");
				else if (!(part.width >= MIN_WIDTH && part.width <= MAX_WIDTH)) errors.push(at + "width " + part.width + " outside " + MIN_WIDTH + ".." + MAX_WIDTH);
			}
			const half = (part.kind === "stroke" ? part.width ?? STROKE_WIDTH : 0) / 2;
			const [lo, hi] = [+half.toFixed(3), +(16 - half).toFixed(3)];
			let points : [number, number][];
			try {
				points = pathPoints(part.d);
			} catch (e) {
				errors.push(at + (e as Error).message);
				return;
			}
			const out = points.find(([x, y]) => x < lo - EPS || x > hi + EPS || y < lo - EPS || y > hi + EPS);
			if (out) errors.push(at + "point (" + +out[0].toFixed(3) + ", " + +out[1].toFixed(3) + ") outside " + lo + ".." + hi);
		});
		// muted, the family the popup uses, is flat: named colours with an ink outline
		if (!def.parts.some((p) => p.color)) errors.push(name + ": flat icons need a part with color");
		if (!def.parts.some((p) => p.kind === "stroke")) errors.push(name + ": flat icons need a stroke part (the outline)");
	}
	return errors;
}
