"use strict";

import type { ColorKey, IconRole } from "./types.ts";

// The icon colours per theme. `color` paints solid fills (and the text
// colour for neutral), `tint` the soft tint fills: darker, lower-alpha
// tints on the dark theme so they do not glow.
export type Theme = "light" | "dark";

export interface RoleColors {
	color : string;
	tint : string;
}

export const PALETTE : Record<Theme, { text : string, roles : Record<IconRole, RoleColors> }> = {
	light: {
		text: "#1f2328",
		roles: {
			neutral: { color: "#1f2328", tint: "rgba(31, 35, 40, 0.12)" },
			accent: { color: "#2563eb", tint: "rgba(37, 99, 235, 0.18)" },
			add: { color: "#16a34a", tint: "rgba(22, 163, 74, 0.20)" },
			danger: { color: "#dc2626", tint: "rgba(220, 38, 38, 0.18)" },
			warn: { color: "#d97706", tint: "rgba(217, 119, 6, 0.22)" },
		},
	},
	dark: {
		text: "#e6e6e6",
		roles: {
			neutral: { color: "#e6e6e6", tint: "rgba(230, 230, 230, 0.14)" },
			accent: { color: "#60a5fa", tint: "rgba(96, 165, 250, 0.22)" },
			add: { color: "#4ade80", tint: "rgba(74, 222, 128, 0.20)" },
			danger: { color: "#f87171", tint: "rgba(248, 113, 113, 0.22)" },
			warn: { color: "#fbbf24", tint: "rgba(251, 191, 36, 0.22)" },
		},
	},
};

// the palette as custom properties on `selector`: --icon-<role> and
// --icon-tint-<role>, what cssPaint() (svg.ts) refers to
export function paletteCss(selector : string, theme : Theme) : string {
	const lines : string[] = [];
	for (const [role, c] of Object.entries(PALETTE[theme].roles)) {
		lines.push("\t--icon-" + role + ": " + c.color + ";", "\t--icon-tint-" + role + ": " + c.tint + ";");
	}
	return selector + " {\n" + lines.join("\n") + "\n}\n";
}

// The named colours of the multi-colour family (muted, F), the same in
// both themes: tuned to read on a white and on a #1e2227 tile.
export const COLORS : Record<ColorKey, string> = {
	"ink": "#1f2633",
	"white": "#ffffff",
	"red": "#ef4444",
	"red-dark": "#b91c1c",
	"orange": "#f97316",
	"yellow": "#facc15",
	"yellow-dark": "#ca8a04",
	"green": "#22c55e",
	"green-dark": "#15803d",
	"blue": "#3b82f6",
	"blue-dark": "#1d4ed8",
	"sky": "#7dd3fc",
	"purple": "#8b5cf6",
	"pink": "#ec4899",
	"brown": "#a16207",
	"gold": "#f59e0b",
	"grey-light": "#e5e7eb",
	"grey": "#9ca3af",
	"grey-dark": "#4b5563",
	"steel": "#cbd5e1",
	// muted (F): the old images' direction, coral / lime / soft blue / warm gold, a step calmer than the keys above
	"coral": "#f06b6b",
	"coral-dark": "#c9504f",
	"lime": "#78b84a",
	"lime-dark": "#5b9a33",
	"amber": "#fcc96e",
	"amber-dark": "#e5a03c",
	"blue-soft": "#5b97e3",
	"blue-soft-dark": "#3b6fc2",
	"sky-soft": "#9fd3ee",
	"cream": "#fff6e0",
	"slate": "#607d8b",
	"peach": "#f39b5b",
};
