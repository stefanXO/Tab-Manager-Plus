"use strict";

import { STROKE_WIDTH, type IconDef, type IconPart } from "./types.ts";
import { COLORS } from "./palette.ts";

// One icon as an SVG string, the only renderer (Icon.tsx wraps it, the
// stylesheet generator and the contact sheet use it). Every part is painted
// in its named colour, so the image looks the same on a light and a dark page.
function partAttrs(part : IconPart) : string {
	const { kind, color, opacity, width } = part;
	const hex = COLORS[color];
	let attrs : string;
	if (kind === "stroke") {
		attrs = 'fill="none" stroke="' + hex + '" stroke-width="' + (width ?? STROKE_WIDTH) + '" stroke-linecap="round" stroke-linejoin="round"';
	} else if (kind === "tint") {
		attrs = 'fill="' + hex + '" stroke="none"';
	} else {
		attrs = 'fill="' + hex + '" fill-rule="evenodd" stroke="none"';
	}
	return opacity === undefined ? attrs : attrs + ' opacity="' + opacity + '"';
}

// the parts paint in their listed order: the author stacks highlights on
// bodies and outlines where they want them
export function iconSvg(def : IconDef, size : number) : string {
	const paths = def.parts
		.map((part) => '<path d="' + part.d + '" ' + partAttrs(part) + "/>")
		.join("");
	return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="' + size + '" height="' + size + '">' + paths + "</svg>";
}
