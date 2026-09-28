"use strict";

// The colour theme is an attribute on the root element, <html data-theme="…">,
// which css/themes/*.css key on (html[data-theme="dark"]). Being on <html> it
// is there before <body> is parsed and before React renders, so popup.tsx can
// apply the cached theme for the very first frame.
//
// Today the theme is the boolean `dark` setting. A later `theme` setting
// ("system" | "light" | "dark" | a named theme) will replace it; this helper is
// then the one place that learns to map it (for "system": follow
// prefers-color-scheme, and update the <meta name="color-scheme"> tag).
export function applyTheme(dark : boolean) {
	document.documentElement.dataset.theme = dark ? "dark" : "light";
}
