"use strict";

// The icon set: every toolbar / window action icon and one icon per option
// row. The family the popup uses (families/muted.ts) draws all of them on a
// 16x16 grid.

export const ACTION_ICONS = [
	"save", "restore", "delete", "add", "close", "minimize", "maximize", "colors",
	"new", "save-tabs", "trash", "discard", "pin", "duplicates", "filter", "options", "rate",
	"view-big-blocks", "view-blocks", "view-horizontal", "view-vertical", "favicon", "recent",
] as const;

export const OPTION_ICONS = [
	"tab-limit", "popup-width", "popup-height", "theme", "compact", "animations",
	"window-titles", "support-links", "sessions", "export-sessions", "import-sessions",
	"export-settings", "import-settings",
	"badge", "own-tab", "minimize-inactive", "monitors", "action-buttons",
	"private-windows", "shortcuts", "changelog", "debug-export",
	"mouse-right", "mouse-shift-right", "mouse-middle", "key-enter",
] as const;

// Optional variants of another icon: the recent button's three levels, the
// filter button switched on, the light and dark theme choices (the options
// screen, and the header's theme button through css.ts). No family has to draw them; without one the plain icon
// (recent, filter) or no icon (theme-light, theme-dark) shows.
export const STATE_ICONS = ["recent-1", "recent-2", "recent-3", "filter-on", "theme-light", "theme-dark"] as const;

export type ActionIconName = typeof ACTION_ICONS[number];
export type OptionIconName = typeof OPTION_ICONS[number];
export type StateIconName = typeof STATE_ICONS[number];
export type IconName = ActionIconName | OptionIconName | StateIconName;
export const ICON_NAMES : readonly IconName[] = [...ACTION_ICONS, ...OPTION_ICONS, ...STATE_ICONS];
// what a family must draw: the state icons are optional
export const REQUIRED_ICONS : readonly IconName[] = [...ACTION_ICONS, ...OPTION_ICONS];

// stroke: an outline; tint: a soft fill; fill: a solid fill (evenodd). All
// are painted in the part's named colour
export type PartKind = "stroke" | "tint" | "fill";

// the named colours (palette.ts COLORS), the same on a light and a dark page
export const COLOR_KEYS = [
	"ink", "white", "grey-light", "grey", "steel",
	// the softer tones of the muted family (F), sampled from the old images
	"coral", "coral-dark", "lime", "lime-dark", "amber", "amber-dark", "blue-soft", "blue-soft-dark",
	"sky-soft", "cream", "slate", "peach",
] as const;
export type ColorKey = typeof COLOR_KEYS[number];

export interface IconPart {
	d : string;
	kind : PartKind;
	// the named colour the part is painted (fill, tint) or stroked in
	color : ColorKey;
	// 0..1, e.g. a white highlight at 0.5
	opacity? : number;
	// stroke only: width instead of STROKE_WIDTH, 0.6..2.4
	width? : number;
}

export interface IconDef {
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
