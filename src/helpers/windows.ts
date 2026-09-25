"use strict";

import type * as browser from 'webextension-polyfill';
// .ts on purpose: Node runs these pure helpers directly in the tests
import {stringHashcode} from "./utils.ts";

// Sorts windows the way the popup lists them: most recently active first
// (the worker's windowAge order), minimized ones last. A window the order
// does not know yet (indexOf -1) sorts first on purpose: it was just created,
// which makes it the most recent one; the worker adds it to windowAge a
// moment later. Shared by the boot fetch and every later refresh, so both
// agree on the order.
export function sortWindows(windows : browser.Windows.Window[], windowAge : number[]) : browser.Windows.Window[] {
	return windows.slice().sort(function (a, b) {
		const aSort = windowAge.indexOf(a.id);
		const bSort = windowAge.indexOf(b.id);
		if (a.state === "minimized" && b.state !== "minimized") return 1;
		if (b.state === "minimized" && a.state !== "minimized") return -1;
		if (aSort < bSort) return -1;
		if (aSort > bSort) return 1;
		return 0;
	});
}

// A window's identity across a browser restart: the hash of its sorted set
// of tab urls. cleanUp re-attaches a stored name or color to the live window
// whose hash matches.
export function hashcode(window : browser.Windows.Window) : number {
	let urls = [];
	for (let i = 0; i < window.tabs.length; i++) {
		if (!window.tabs[i].url) continue;
		urls.push(window.tabs[i].url);
	}
	urls.sort();

	let hash = 0;
	for (let i = 0; i < urls.length; i++) {
		const code = stringHashcode(urls[i]);
		hash = ((hash << 5) - hash) + code;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}
