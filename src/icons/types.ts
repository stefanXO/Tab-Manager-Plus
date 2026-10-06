"use strict";

// The icon set: every toolbar / window action icon and one icon per option
// row. The family the popup uses (families/muted.ts) draws all of them on a
// 16x16 grid.

export const ACTION_ICONS = [
	"save", "restore", "delete", "add", "close", "minimize", "maximize", "colors",
	"new", "trash", "discard", "pin", "duplicates", "filter", "options", "rate",
	"view-big-blocks", "view-blocks", "view-horizontal", "view-vertical", "favicon", "recent",
] as const;

export const OPTION_ICONS = [
	"tab-limit", "popup-width", "popup-height", "theme", "compact", "animations",
	"window-titles", "support-links", "sessions", "export-sessions", "import-sessions",
	"badge", "own-tab", "minimize-inactive", "monitors", "action-buttons",
	"private-windows", "shortcuts", "changelog", "debug-export",
	"mouse-right", "mouse-shift-right", "mouse-middle", "key-enter",
] as const;

// Optional variants of another icon: the recent button's three levels, the
// filter button switched on, the light and dark theme choices (css.ts, the
// options screen). No family has to draw them; without one the plain icon
// (recent, filter) or no icon (theme-light, theme-dark) shows.
export const STATE_ICONS = ["recent-1", "recent-2", "recent-3", "filter-on", "theme-light", "theme-dark"] as const;

export type ActionIconName = typeof ACTION_ICONS[number];
export type OptionIconName = typeof OPTION_ICONS[number];
export type StateIconName = typeof STATE_ICONS[number];
export type IconName = ActionIconName | OptionIconName | StateIconName;
export const ICON_NAMES : readonly IconName[] = [...ACTION_ICONS, ...OPTION_ICONS, ...STATE_ICONS];
// what a family must draw: the state icons are optional
export const REQUIRED_ICONS : readonly IconName[] = [...ACTION_ICONS, ...OPTION_ICONS];

// what an icon's colour means; the colours themselves are in palette.ts
export const ROLES = ["neutral", "accent", "add", "danger", "warn"] as const;
export type IconRole = typeof ROLES[number];

// stroke: an outline in the text colour; tint: a soft fill in the role's
// tint; fill: a solid fill in the role's colour
export type PartKind = "stroke" | "tint" | "fill";

// named colours for multi-colour families (palette.ts COLORS); theme-independent
export const COLOR_KEYS = [
	"ink", "white", "red", "red-dark", "orange", "yellow", "yellow-dark", "green", "green-dark",
	"blue", "blue-dark", "sky", "purple", "pink", "brown", "gold",
	"grey-light", "grey", "grey-dark", "steel",
	// the softer tones of the muted family (F), sampled from the old images; append only
	"coral", "coral-dark", "lime", "lime-dark", "amber", "amber-dark", "blue-soft", "blue-soft-dark",
	"sky-soft", "cream", "slate", "peach",
] as const;
export type ColorKey = typeof COLOR_KEYS[number];

export interface IconPart {
	d : string;
	kind : PartKind;
	// fill / tint: paint with this named colour instead of the role colour;
	// stroke: stroke in this colour instead of the text colour
	color? : ColorKey;
	// 0..1, e.g. a white highlight at 0.5
	opacity? : number;
	// stroke only: width instead of STROKE_WIDTH, 0.6..2.4
	width? : number;
}

export interface IconDef {
	role : IconRole;
	parts : IconPart[];
}

export type FamilyId = "muted";

export interface IconFamily {
	id : FamilyId;
	label : string;
	// "actions": only ACTION_ICONS are required (the toolbar / window icons);
	// the validator enforces completeness by scope, so callers must handle a missing icon
	scope? : "all" | "actions";
	// being drawn: validateFamily reports per-icon errors only, no missing icons
	draft? : boolean;
	icons : Partial<Record<IconName, IconDef>>;
}

// the stats card's line style (views/StatsCard.tsx)
export const STROKE_WIDTH = 1.6;
