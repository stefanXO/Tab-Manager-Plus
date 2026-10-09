"use strict";

// Firefox refuses to open its about: pages from an extension (tabs.create,
// windows.create), all but about:blank. One rule for the three places that
// meet them: saving a window leaves such tabs out (./sessions.ts), restoring
// one opens them as a new tab (background/windows.ts), and so does dragging a
// saved tab into an open window (./openTabs.ts). Pure, unit tested in
// tests/aboutPages.test.ts.

// whether Firefox opens `url` from an extension; Chrome opens everything here
export function firefoxCanOpen(url : string | undefined) : boolean {
	if (!url) return true;
	const lower = url.trim().toLowerCase();
	return !lower.startsWith("about:") || lower === "about:blank";
}
