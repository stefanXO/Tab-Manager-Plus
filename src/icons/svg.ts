"use strict";

import { STROKE_WIDTH, type IconDef, type IconPart, type IconRole, type PartKind } from "./types.ts";
import { PALETTE, COLORS, type Theme } from "./palette.ts";

// One icon as an SVG string, the only renderer (Icon.tsx wraps it, the
// stylesheet generator and the contact sheet use it). `Paint` says what the three
// part kinds are painted with: real colours for one theme (an image), or
// currentColor + the palette's custom properties (live in the page).
export interface Paint {
	text : string;
	color : string;
	tint : string;
}

export function themePaint(role : IconRole, theme : Theme) : Paint {
	const p = PALETTE[theme];
	return { text: p.text, color: p.roles[role].color, tint: p.roles[role].tint };
}

export function cssPaint(role : IconRole) : Paint {
	return { text: "currentColor", color: "var(--icon-" + role + ")", tint: "var(--icon-tint-" + role + ")" };
}

function partAttrs(part : IconPart, paint : Paint) : string {
	const { kind, color, opacity, width } = part;
	const hex = color ? COLORS[color] : null;
	let attrs : string;
	if (kind === "stroke") {
		attrs = 'fill="none" stroke="' + (hex ?? paint.text) + '" stroke-width="' + (width ?? STROKE_WIDTH) + '" stroke-linecap="round" stroke-linejoin="round"';
	} else if (kind === "tint") {
		attrs = 'fill="' + (hex ?? paint.tint) + '" stroke="none"';
	} else {
		attrs = 'fill="' + (hex ?? paint.color) + '" fill-rule="evenodd" stroke="none"';
	}
	return opacity === undefined ? attrs : attrs + ' opacity="' + opacity + '"';
}

// tints first, then fills, then strokes on top, whatever order the parts are listed in
const ORDER : Record<PartKind, number> = { tint: 0, fill: 1, stroke: 2 };

export function iconSvg(def : IconDef, size : number, paint : Paint) : string {
	// a multi-colour icon (any part with a color) is painted in its
	// listed order: the author stacks highlights on bodies and outlines where
	// they want them, which the tint / fill / stroke sort would undo
	const ordered = def.parts.some((p) => p.color)
		? def.parts
		: [...def.parts].sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
	const paths = ordered
		.map((part) => '<path d="' + part.d + '" ' + partAttrs(part, paint) + "/>")
		.join("");
	return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="' + size + '" height="' + size + '">' + paths + "</svg>";
}
