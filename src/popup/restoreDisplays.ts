"use strict";

import * as browser from 'webextension-polyfill';
import {popupScreen} from "@helpers/popup_size";
import {knownDisplayList, Bounds} from "@helpers/geometry";

// The displays a restore goes by, as the popup knows them: the popup's own
// monitor first, then every monitor's work area while the system.display
// permission is granted (whatever "Show all monitors" says), as
// helpers/geometry.ts knownDisplayList builds it. The saved window's hover
// card predicts the landing with this list, and the restore command sends
// it along, so the worker places the window by the same monitors (it goes by
// its own list only when that one knows more, geometry.ts
// chooseRestoreDisplays). Firefox has no display API: the popup's monitor.
export async function restoreDisplays() : Promise<Bounds[]> {
	if (IS_FIREFOX) {
		return knownDisplayList(popupScreen(), []);
	} else {
		try {
			if (await browser.permissions.contains({ permissions: ["system.display"] })) {
				return knownDisplayList(popupScreen(), await chrome.system.display.getInfo());
			}
		} catch (e) {
			console.error("the monitors are not known", e);
		}
		return knownDisplayList(popupScreen(), []);
	}
}
