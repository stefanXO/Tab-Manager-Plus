"use strict";

import * as browser from 'webextension-polyfill';

// Sorts windows the way the popup lists them: most recently active first
// (the worker's windowAge order), minimized ones last. Shared by the boot
// fetch and every later refresh, so both agree on the order.
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
