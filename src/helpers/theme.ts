"use strict";

// The colour theme is an attribute on the root element, <html data-theme="…">,
// which css/themes/*.css key on (html[data-theme="dark"]). Being on <html> it
// is there before <body> is parsed and before React renders, so popup.tsx can
// apply the cached theme for the very first frame.
//
// The `theme` setting:
//   "system" - follows the OS / browser (prefers-color-scheme), live
//   "light"  - always light
//   "dark"   - always dark
// It replaced the boolean `dark` setting (6.x): dark on -> "dark", anything
// else -> "system". readTheme(), resolveTheme() and nextTheme() are pure, so
// the rules are unit tested (tests/theme.test.ts).

export type Theme = "system" | "light" | "dark";

// the stored value; missing or unknown falls back to the old `dark` boolean
export function readTheme(value : unknown, legacyDark? : unknown) : Theme {
	if (value === "system" || value === "light" || value === "dark") return value;
	return legacyDark === true ? "dark" : "system";
}

// what the page shows: "system" takes the OS / browser preference
export function resolveTheme(theme : Theme, systemDark : boolean) : "light" | "dark" {
	if (theme === "system") return systemDark ? "dark" : "light";
	return theme;
}

// the header's theme button: System -> Light -> Dark -> System
export function nextTheme(theme : Theme) : Theme {
	if (theme === "system") return "light";
	if (theme === "light") return "dark";
	return "system";
}

let current : Theme = "system";
let systemQuery : MediaQueryList | null = null;

function render() {
	document.documentElement.dataset.theme = resolveTheme(current, !!systemQuery?.matches);
}

// Sets the page's theme. The first call starts listening to the OS / browser
// preference, so "system" switches along while the page stays open.
export function applyTheme(theme : Theme) {
	current = readTheme(theme);
	if (!systemQuery && typeof matchMedia === "function") {
		systemQuery = matchMedia("(prefers-color-scheme: dark)");
		systemQuery.addEventListener("change", render);
	}
	render();
}
