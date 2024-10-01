"use strict";

import { setLocalStorage } from "@helpers/storage";
import * as _a from "@background/actions";
import * as _w from '@background/windows';
import * as _t from '@background/tabs';
import { cleanupDebounce, cleanUp } from '@background/tracking';

import * as _c from '@ui/context_menus';
import * as _o from '@ui/open';
import {debounce} from "@helpers/utils";
import * as browser from 'webextension-polyfill';

browser.runtime.onStartup.addListener(
	async function () {
		console.log(" ON STARTUP");
	}
);

browser.runtime.onSuspend.addListener(
	async function () {
		console.log(" ON SUSPEND");
	}
);

browser.commands.onCommand.addListener(_a.handleCommands);
browser.runtime.onMessage.addListener(_a.handleMessages);

(async function () {
	var windows = await browser.windows.getAll({ populate: true });
	await setLocalStorage("windowAge", []);
	if (!!windows && windows.length > 0) {
		windows.sort(function (a, b) {
			if (a.id < b.id) return 1;
			if (a.id > b.id) return -1;
			return 0;
		});
		for (let i = 0; i < windows.length; i++) {
			if (!!windows[i].id) await _w.windowActive(windows[i].id);
		}
	}
})();

export const setupDebounced = debounce(setup, 2000);

async function setup() {
	await _c.setupContextMenus();
	await _o.setupPopup();
	await _t.setupTabListeners();
	await _w.setupWindowListeners();

	_t.updateTabCountDebounce();

	setTimeout(cleanupDebounce, 2500);
	setTimeout(cleanUp.bind(this, true), 200000);
}

setInterval(setupDebounced, 300000);

setup();