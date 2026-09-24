"use strict";

import { getLocalStorage, setLocalStorage, serialized } from "@helpers/storage";
import * as _a from "@background/actions";
import * as _w from '@background/windows';
import * as _t from '@background/tabs';
import { cleanupDebounce, cleanUp, forgetWindowIds } from '@background/tracking';

import * as _c from '@ui/context_menus';
import * as _o from '@ui/open';
import * as browser from 'webextension-polyfill';

const CLEANUP_ALARM = "cleanup_old_windows";

// Every listener must be registered synchronously in the first event loop
// turn: an MV3 service worker is woken BY events, and a listener added after
// an await can miss the very event that woke the worker.
browser.commands.onCommand.addListener(_a.handleCommands);
browser.runtime.onMessage.addListener(_a.handleMessages);
_t.setupTabListeners();
_w.setupWindowListeners();
_c.setupContextMenuListeners();
_o.setupPopupListeners();

// A suspended worker discards its timers, which is why the old
// setTimeout/setInterval based cleanup never ran; alarms survive suspension.
// The hourly pass only drops entries that have been without a window for over
// a day, so an alarm that fires right at browser start, before the session is
// restored, cannot take anything the restore is about to re-attach.
browser.alarms.onAlarm.addListener(async function (alarm) {
	if (alarm.name !== CLEANUP_ALARM) return;
	try {
		await cleanUp(true);
	} catch (e) {
		console.error(e);
	}
});

browser.runtime.onInstalled.addListener(async function () {
	console.log(" ON INSTALLED");
	// context menus persist in the browser, they only need creating here
	try {
		await _c.setupContextMenus();
	} catch (e) {
		console.error(e);
	}
	await reconcileWindowAge();
});

browser.runtime.onStartup.addListener(async function () {
	console.log(" ON STARTUP");
	// stored window ids are from the previous session and mean nothing now
	try {
		await forgetWindowIds();
	} catch (e) {
		console.error(e);
	}
	await reconcileWindowAge();
	// hand names and colors to whatever the session restore has recreated so
	// far; later windows get theirs through windowCreated
	try {
		await cleanUp();
	} catch (e) {
		console.error(e);
	}
});

// windowAge used to be wiped and rebuilt from window ids on every service
// worker wake, which reset the user's window ordering many times a day.
// Instead, reconcile once per install/browser start: keep the stored recency
// order, drop windows that no longer exist and append unknown ones.
async function reconcileWindowAge() {
	try {
		const windows = await browser.windows.getAll({});
		const liveIds : number[] = [];
		for (const w of windows) {
			if (w.id !== undefined) liveIds.push(w.id);
		}
		// at browser start the session may not be restored yet; the windows
		// register themselves through windowCreated as they appear
		if (liveIds.length === 0) return;

		await serialized(async function () {
			let windowAge = await getLocalStorage("windowAge", []);
			if (!(windowAge instanceof Array)) windowAge = [];

			windowAge = windowAge.filter(function (id) {
				return liveIds.indexOf(id) > -1;
			});
			for (const id of liveIds) {
				if (windowAge.indexOf(id) < 0) windowAge.push(id);
			}
			await setLocalStorage("windowAge", windowAge);
		});
	} catch (e) {
		console.error(e);
	}
}

async function setup() {
	try {
		await _o.setupPopup();
	} catch (e) {
		console.error(e);
	}

	_t.updateTabCountDebounce();

	// recreating an existing alarm would reset its countdown on every
	// worker wake and it might never fire, so only create it once
	const existing = await browser.alarms.get(CLEANUP_ALARM);
	if (!existing) {
		await browser.alarms.create(CLEANUP_ALARM, { delayInMinutes: 60, periodInMinutes: 60 });
	}

	setTimeout(cleanupDebounce, 2500);
}

setup();
