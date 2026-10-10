"use strict";

import type { ColorKey } from "./types.ts";

// The named colours of the muted family (F), the same on a light and a dark
// page: tuned to read on a white and on a #1e2227 tile.
export const COLORS : Record<ColorKey, string> = {
	"ink": "#1f2633",
	"white": "#ffffff",
	"grey-light": "#e5e7eb",
	"grey": "#9ca3af",
	"steel": "#cbd5e1",
	// the old images' direction: coral / lime / soft blue / warm gold
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
