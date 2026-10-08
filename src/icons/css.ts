"use strict";

import type { ActionIconName, IconDef, IconFamily, IconName } from "./types.ts";
import { iconSvg } from "./svg.ts";

// The popup's icon classes (css/components/actions.css) per action icon.
// Not here: recent (one rule per level, below) and favicon (the --fav
// fallback in tab.css, below).
export const ICON_CLASSES : Partial<Record<ActionIconName, string>> = {
	save: "save", restore: "restore", delete: "delete", add: "add", close: "close",
	minimize: "minimize", maximize: "maximize", colors: "colors", new: "new", "save-tabs": "save-tabs", trash: "trash",
	discard: "discard", pin: "pin", duplicates: "duplicates", filter: "filter", options: "options",
	rate: "rate", "view-big-blocks": "blocks-big-view", "view-blocks": "blocks-view",
	"view-horizontal": "horizontal-view", "view-vertical": "vertical-view",
};

// The recent button's icon per level (data-level 0..3); a level the family
// does not draw shows its plain clock.
const RECENT_LEVELS : IconName[] = ["recent", "recent-1", "recent-2", "recent-3"];

// the tab.css selectors that draw a tab without a favicon: the tile's
// ::after and the list row's .iconoverlay
const FAVICON_SELECTORS = [".icon.tab::after", ".iconoverlay"];

// The stats card's line icons (css/components/stats.css) that show a toolbar
// icon, per class: the tab's place in its window (the list layout), the tab
// it was opened from (add) and its copies (duplicates).
export const STATS_CLASSES : Record<string, ActionIconName> = {
	"stats-icon-position": "view-vertical", "stats-icon-opener": "add", "stats-icon-copies": "duplicates",
};
// the stats card's page icon for a tab without a favicon (StatsCard.tsx);
// not under a tile, so no --fav to fall back from
const STATS_FAVICON = ".stats-favicon-generic";

const url = (svg : string) => 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';

// A stylesheet that swaps every mapped .icon.<class> image for the family's
// drawing (names the family lacks are skipped); the drawings use named
// colours, so one rule serves both themes. Also the recent button's
// levels (.icon.recent[data-level]; TabManager draws no clock itself, so it
// is empty without this sheet), the filter button's on state (.icon.filter.enabled),
// the stats card's line icons and the favicon fallback for tabs without one.
export function familyCss(f : IconFamily) : string {
	let css = "";
	const rule = (selector : string, value : string) => {
		css += selector + " { background-image: " + value + "; }\n";
	};
	const image = (def : IconDef) => url(iconSvg(def, 16));
	for (const [name, cls] of Object.entries(ICON_CLASSES) as [ActionIconName, string][]) {
		const def = f.icons[name];
		if (def) rule(".icon." + cls, image(def));
	}
	RECENT_LEVELS.forEach((name, level) => {
		const def = f.icons[name] ?? f.icons.recent;
		if (def) rule('.icon.recent[data-level="' + level + '"]', image(def));
	});
	// the filter button switched on (.enabled, TabManager): the same selector
	// plus .enabled, emitted after .icon.filter so it wins; a
	// family without filter-on keeps its plain filter drawing
	const filterOn = f.icons["filter-on"] ?? f.icons.filter;
	if (filterOn) rule(".icon.filter.enabled", image(filterOn));
	for (const [cls, name] of Object.entries(STATS_CLASSES)) {
		const def = f.icons[name];
		if (def) rule("." + cls, image(def));
	}
	const favicon = f.icons.favicon;
	if (favicon) {
		for (const sel of FAVICON_SELECTORS) rule(sel, "var(--fav, " + image(favicon) + ")");
		rule(STATS_FAVICON, image(favicon));
	}
	return css;
}
