"use strict";

import { getLocalStorage, setLocalStorage } from "@helpers/storage";
import * as _a from "@background/actions";
import * as _w from '@background/windows';
import * as _t from '@background/tabs';
import { cleanupDebounce, cleanUp } from '@background/tracking';

import * as _c from '@ui/context_menus';
import * as _o from '@ui/open';
import * as browser from 'webextension-polyfill';

const CLEANUP_ALARM = "cleanup_old_windows";

// cleanUp(true) deletes the names, colors and hashes of windows it cannot find.
// A periodic alarm that came due while the browser was closed fires right at
// startup, before session restore has recreated the windows, and would throw
// away exactly the entries the restore is about to re-attach. So the
// destructive pass is skipped for a while after the browser started.
const STARTUP_GRACE = 10 * 60 * 1000;

// Firefox MV2 (persistent page, no storage.session): the page start is the
// browser start. Under MV3 the worker restarts all the time, so the first wake
// after a browser start is recorded in storage.session, which the browser
// clears on restart.
const bootedAt = Date.now();

async function noteBrowserStart() {
	if (!browser.storage.session) return;
	const stored = await browser.storage.session.get({startedAt: 0});
	if (!stored.startedAt) await browser.storage.session.set({startedAt: Date.now()});
}

async function browserStartedRecently() : Promise<boolean> {
	let startedAt = bootedAt;
	if (browser.storage.session) {
		const stored = await browser.storage.session.get({startedAt: 0});
		// nothing recorded yet: this is the first wake since the browser started
		if (!stored.startedAt) return true;
		startedAt = stored.startedAt as number;
	}
	return Date.now() - startedAt < STARTUP_GRACE;
}

// Every listener must be registered synchronously in the first event loop
// turn: an MV3 service worker is woken BY events, and a listener added after
// an await can miss the very event that woke the worker.
browser.commands.onCommand.addListener(_a.handleCommands);
browser.runtime.onMessage.addListener(_a.handleMessages);
_t.setupTabListeners();
_w.setupWindowListeners();
_c.setupContextMenuListeners();
_o.setupPopupListeners();

if (browser.alarms) {
	browser.alarms.onAlarm.addListener(async function (alarm) {
		if (alarm.name !== CLEANUP_ALARM) return;
		try {
			if (await browserStartedRecently()) return;
			await cleanUp(true);
		} catch (e) {
			console.error(e);
		}
	});
} else {
	// MV2 persistent background page: plain timers stay alive there.
	// Under MV3 a suspended worker discards its timers, which is why the
	// old setTimeout/setInterval based cleanup never ran - alarms above
	// are the replacement.
	setTimeout(cleanUp.bind(null, true), 2000000);
}

browser.runtime.onInstalled.addListener(async function () {
	console.log(" ON INSTALLED");
	await reconcileWindowAge();
});

browser.runtime.onStartup.addListener(async function () {
	console.log(" ON STARTUP");
	await reconcileWindowAge();
});

browser.runtime.onSuspend.addListener(
	async function () {
		console.log(" ON SUSPEND");
	}
);

// windowAge used to be wiped and rebuilt from window ids on every service
// worker wake, which reset the user's window ordering many times a day.
// Instead, reconcile once per install/browser start: keep the stored recency
// order, drop windows that no longer exist and append unknown ones.
async function reconcileWindowAge() {
	try {
		const windows = await browser.windows.getAll({});
		const liveIds : number[] = [];
		for (const w of windows) {
			if (!!w.id) liveIds.push(w.id);
		}

		let windowAge = await getLocalStorage("windowAge", []);
		if (!(windowAge instanceof Array)) windowAge = [];

		windowAge = windowAge.filter(function (id) {
			return liveIds.indexOf(id) > -1;
		});
		for (const id of liveIds) {
			if (windowAge.indexOf(id) < 0) windowAge.push(id);
		}
		await setLocalStorage("windowAge", windowAge);
	} catch (e) {
		console.error(e);
	}
}

async function setup() {
	try {
		await noteBrowserStart();
	} catch (e) {
		console.error(e);
	}
	try {
		await _c.setupContextMenus();
	} catch (e) {
		console.error(e);
	}
	try {
		await _o.setupPopup();
	} catch (e) {
		console.error(e);
	}

	_t.updateTabCountDebounce();

	if (browser.alarms) {
		// recreating an existing alarm would reset its countdown on every
		// worker wake and it might never fire, so only create it once
		const existing = await browser.alarms.get(CLEANUP_ALARM);
		if (!existing) {
			await browser.alarms.create(CLEANUP_ALARM, { delayInMinutes: 33, periodInMinutes: 30 });
		}
	}

	setTimeout(cleanupDebounce, 2500);
}

setup();
