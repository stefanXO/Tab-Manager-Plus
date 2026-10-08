"use strict";

import {cleanupDebounce} from "@background/tracking";
import {getLocalStorage, getLocalStorageMap, setLocalStorage, setLocalStorageMap, serialized} from "@helpers/storage";
import {restorePlan, knownDisplayList, windowsToMinimize, chooseRestoreDisplays, displayList} from "@helpers/geometry";
import {maximizeOnDisplay, WindowApi} from "@helpers/restoreMaximize";
import {RestoreTrace, appendRestoreLog, buildRestoreDiagnostic, RestoreDiagnostic, savedBox, windowBox} from "@helpers/restoreDiagnostic";
import {hashcode} from "@helpers/windows";
import {firefoxCanOpen} from "@helpers/aboutPages";
import {setWindowColor, setWindowName} from "@background/actions";
import * as S from "@strings";
import * as browser from 'webextension-polyfill';
import {getSetting} from "@helpers/settings";
import {ISavedSession, IScreenBounds} from "@types";

// must stay synchronous: it runs during the service worker's first event loop
// turn so that the events that woke the worker are not missed
export function setupWindowListeners() {
	browser.windows.onFocusChanged.removeListener(windowFocus);
	browser.windows.onCreated.removeListener(windowCreated);
	browser.windows.onRemoved.removeListener(windowRemoved);

	browser.windows.onFocusChanged.addListener(windowFocus);
	browser.windows.onCreated.addListener(windowCreated);
	browser.windows.onRemoved.addListener(windowRemoved);
}

export async function createWindowWithTabs(tabs : browser.Tabs.Tab[], isIncognito : boolean = false) {
	var pinnedIndex = 0;
	var firstTab = tabs.shift();
	var t = [];
	for (const _tab of tabs) {
		t.push(_tab.id);
	}

	var firstPinned = firstTab.pinned;
	var w = await browser.windows.create({tabId: firstTab.id, incognito: !!isIncognito});
	if (firstPinned) {
		await browser.tabs.update(w.tabs[0].id, {pinned: firstPinned});
		pinnedIndex++;
	}

	if (t.length > 0) {
		var i = 0;
		for (let oldTabId of t) {
			i++;
			var oldTab = await browser.tabs.get(oldTabId);
			var tabPinned = oldTab.pinned;
			var movedTabs : browser.Tabs.Tab | browser.Tabs.Tab[] = [];
			if (!tabPinned) {
				movedTabs = await browser.tabs.move(oldTabId, {windowId: w.id, index: -1});
			} else {
				movedTabs = await browser.tabs.move(oldTabId, {windowId: w.id, index: pinnedIndex++});
			}

			let firstTab : browser.Tabs.Tab;
			if (Array.isArray(movedTabs)) {
				firstTab = movedTabs[0];
			} else {
				firstTab = movedTabs;
			}

			if (!!firstTab) {
				if (tabPinned) {
					await browser.tabs.update(firstTab.id, {pinned: tabPinned});
				}
			}
		}
	}
	await browser.windows.update(w.id, {focused: true});
}

// resolves with the id of the new window, so the popup can scroll to it
// `displays`: the list the popup's landing preview went by (see windowGeometry)
export async function createWindowWithSessionTabs(session: ISavedSession, tabId: number, screen? : IScreenBounds, displays? : IScreenBounds[]) : Promise<number | undefined> {

	var customName : string;
	if (session && session.name && session.customName) {
		customName = session.name;
	}
	var color = "default";
	if (session && session.color) {
		color = session.color;
	}

	var whitelistTab = ["url", "active", "selected", "pinned", "index"];

	if (IS_FIREFOX) {
		whitelistTab = ["url", "active", "pinned", "index"];
	}

	const trace = await windowGeometry(session.windowsInfo, screen, displays);
	const plan = trace.plan;
	const filteredWindow = plan.create;

	let newWindow : browser.Windows.Window | void = await browser.windows.create(filteredWindow).catch(function (error) {
		console.error("restoring with the saved geometry failed, using the fallback", filteredWindow, error);
		trace.steps.push({step: "create refused", error: String(error)});
	});
	if (newWindow && plan.maximize) {
		// maximized on its monitor, and checked (helpers/restoreMaximize.ts)
		await maximizeOnDisplay(windowApi, newWindow.id, plan, trace.steps);
	}
	if (!newWindow) {
		// the browser refused the geometry: the old, always-accepted 800x600 at the corner
		newWindow = await browser.windows.create({
			type: "normal",
			incognito: !!session.windowsInfo.incognito,
			left: 0, top: 0, width: 800, height: 600
		}).catch(function (error) {
			console.error(error);
			trace.steps.push({step: "fallback refused", error: String(error)});
		});
		if (newWindow) trace.steps.push({step: "fallback", window: windowBox(newWindow)});
	}
	await logRestore(trace);

	if (!newWindow) return undefined;

	let emptyTab = newWindow.tabs[0].id;

	for (let i = 0; i < session.tabs.length; i++) {
		let newTab = Object.keys(session.tabs[i])
			.filter(function (key) {
				return whitelistTab.includes(key);
			})
			.reduce(function (obj, key) {
				obj[key] = session.tabs[i][key];
				return obj;
			}, {});

		var fTab : browser.Tabs.Tab = newTab as browser.Tabs.Tab;

		if (tabId != null && tabId !== fTab.index) {
			continue;
		}
		fTab.windowId = newWindow.id;

		// Firefox refuses its about: pages (helpers/aboutPages.ts): a new tab instead
		if (IS_FIREFOX && !firefoxCanOpen(fTab.url)) {
			console.log("filtered by about: url", fTab.url);
			fTab.url = "";
		}
		try {
			await browser.tabs.create(fTab).catch(function (error) {
				console.error(error);
				console.log(error);
				console.log(error.message);
			});
		} catch (e) {
			console.log("couldn't restore tab");
			console.error(e);
		}
	}

	await browser.tabs.remove(emptyTab).catch(function (error) {
		console.error(error);
		console.log(error);
		console.log(error.message);
	});

	if (customName) {
		console.log("setting name");
		await setWindowName(newWindow.id, customName);
	}

	if (color !== "default") {
		console.log("setting color");
		await setWindowColor(newWindow.id, color);
	}

	await browser.windows.update(newWindow.id, {focused: true});
	return newWindow.id;
}

// browser.windows for helpers/restoreMaximize.ts
const windowApi : WindowApi = {
	get: (windowId) => browser.windows.get(windowId),
	update: (windowId, props) => browser.windows.update(windowId, props),
	sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms))
};

// the last restores, in storage.session (kept across worker restarts, not
// across browser restarts), for the everything export
const RESTORE_LOG = "restoreLog";
async function logRestore(trace : RestoreTrace) {
	try {
		const stored = await browser.storage.session.get(RESTORE_LOG);
		await browser.storage.session.set({[RESTORE_LOG]: appendRestoreLog(stored[RESTORE_LOG], trace)});
	} catch (e) {
		console.error(e);
	}
}

// How a saved window comes back (helpers/geometry.ts restorePlan): a
// maximized window maximized on the monitor it was saved on when that is
// connected (created normal inside it, then maximized), else on the popup's;
// anything else at its saved position and size, fitted into a display that exists now (#208; a window saved on an
// ultrawide, restored on a laptop). The displays come from the
// system.display permission when granted, else the one display the popup
// reported. The old fix squeezed every window into 800x600 at the top left
// corner (#205). The popup's landing preview (the saved window's hover card)
// calls the same function, and the popup sends the display list it used:
// the restore goes by that one unless the worker knows more monitors itself
// (geometry.ts chooseRestoreDisplays). Going by its own list alone, a worker
// that saw fewer monitors than the popup put a window saved maximized on
// monitor 2 on the popup's monitor while the card said "monitor 2".
// Resolves with the trace of this restore, which holds the plan.
async function windowGeometry(saved : browser.Windows.Window, screen? : IScreenBounds, sent? : IScreenBounds[]) : Promise<RestoreTrace> {
	const own = await knownDisplays(screen);
	const choice = chooseRestoreDisplays(sent, own.displays);
	const trace : RestoreTrace = {
		at: new Date().toISOString(),
		saved: savedBox(saved),
		screen: screen || null,
		own: own.displays,
		sent: displayList(sent),
		from: choice.from,
		plan: restorePlan(saved, choice.displays),
		steps: []
	};
	if (own.error) trace.ownError = own.error;
	return trace;
}

// the displays available now: all of them with the permission, else the one
// the popup is on (first in the list, so it is the fallback target). A failed
// query (no system.display in the worker) is logged and leaves the popup's
// monitor; the restore then goes by the popup's list.
async function knownDisplays(screen? : IScreenBounds) : Promise<{ displays : IScreenBounds[], info : chrome.system.display.DisplayUnitInfo[], permission : boolean | null, error? : string }> {
	if (IS_FIREFOX) {
		return { displays: knownDisplayList(screen, []), info: [], permission: null };
	} else {
		let permission = false;
		try {
			permission = await browser.permissions.contains({ permissions: ["system.display"] });
			if (permission) {
				const info = await chrome.system.display.getInfo();
				return { displays: knownDisplayList(screen, info), info, permission };
			}
		} catch (e) {
			console.error("the monitors are not known in the worker", e);
			return { displays: knownDisplayList(screen, []), info: [], permission, error: String(e) };
		}
		return { displays: knownDisplayList(screen, []), info: [], permission };
	}
}

// The "restore" part of the everything export (helpers/restoreDiagnostic.ts):
// the monitors as the worker sees them, and for each saved window the plan a
// restore would use now, with the popup's screen and display list.
export async function restoreDiagnostic(screen? : IScreenBounds, sent? : IScreenBounds[]) : Promise<RestoreDiagnostic> {
	const own = await knownDisplays(screen);
	const stored = await browser.storage.local.get("sessions").catch(() => ({} as Record<string, unknown>));
	const map = stored.sessions;
	const sessions = map && typeof map === "object" ? Object.values(map as Record<string, ISavedSession>) : [];
	const log = await browser.storage.session.get(RESTORE_LOG).then((x) => x[RESTORE_LOG], () => []);
	return buildRestoreDiagnostic({
		browser: IS_FIREFOX ? "firefox" : "chrome",
		permission: own.permission,
		displayInfo: own.info,
		displayError: own.error,
		screen: screen || null,
		popupDisplays: sent,
		sessions: sessions,
		log
	});
}

export function focusOnWindowDelayed(windowId: number) {
	setTimeout(() => focusOnWindow(windowId), 125);
}

export async function focusOnWindow(windowId : number) {
	await browser.windows.update(windowId, {focused: true});
}

// "Minimize inactive windows": when a window gets the focus, minimize the
// other windows. Chrome: the ones on its monitor (every monitor is known
// through the optional system.display permission; nothing without it).
// Firefox has no display API: every other window, on every monitor, so one
// window stays active in all.
async function hideWindows(windowId : number) {
	if (!windowId || windowId < 0) return;

	let hide_windows = await getSetting("hideWindows");
	if (!hide_windows) return;

	const displays = await hideDisplays();
	if (displays !== null && displays.length === 0) return;

	const windows = await browser.windows.getAll();
	for (const id of windowsToMinimize(windowId, windows, displays)) {
		await browser.windows.update(id, {"state": "minimized"});
	}
}

// null on Firefox (no monitors: every window counts); if/else, so the Firefox
// build drops the system.display branch entirely
async function hideDisplays() : Promise<IScreenBounds[] | null> {
	if (IS_FIREFOX) {
		return null;
	} else {
		let has_permission = await browser.permissions.contains({permissions: ['system.display']});
		if (!has_permission) return [];
		try {
			return (await chrome.system.display.getInfo()).map((d) => d.bounds);
		} catch (err) {
			console.error(err);
			return [];
		}
	}
}

export async function windowActive(windowId : number) {
	if (windowId < 0) return;

	await serialized(async function () {
		var windows = [];
		var windowAge = await getLocalStorage(S.windowAge, []);
		if (windowAge instanceof Array) windows = windowAge;

		if (windows.indexOf(windowId) > -1) windows.splice(windows.indexOf(windowId), 1);
		windows.unshift(windowId);
		await setLocalStorage(S.windowAge, windows);

		// when each window was last active, shown on its card in the popup
		const lastActive : Map<number, number> = await getLocalStorageMap<number, number>(S.windowLastActive);
		lastActive.set(windowId, Date.now());
		await setLocalStorageMap(S.windowLastActive, lastActive);
	});

	// browser.windows.getLastFocused({ populate: true }, function (w) {
	// 	for (let i = 0; i < w.tabs.length; i++) {
	// 		var tab = w.tabs[i];
	// 		if (tab.active === true) {
	// 			// console.log("get last focused", tab.id);
	// 			// tabActiveChanged({
	// 			// 	tabId: tab.id,
	// 			// 	windowId: tab.windowId
	// 			// });
	// 		}
	// 	};
	// });
	// console.log(windows);
}

async function windowFocus(windowId : number) {
	try {
		if (!!windowId) {
			await windowActive(windowId);
			// console.log("onFocused", windowId);
			await hideWindows(windowId);
		}
	} catch (e) {

	}
}

async function windowCreated(window : browser.Windows.Window) {
	try {
		if (!!window && !!window.id) {
			await windowActive(window.id);
		}
	} catch (e) {

	}
	// console.log("onCreated " + window.id, window);
	setTimeout(cleanupDebounce, 250);
}

async function windowRemoved(windowId : number) {
	try {
		if (!!windowId) {
			await windowInactive(windowId);
		}
	} catch (e) {

	}
	// console.log("onRemoved", windowId);
}

async function windowInactive(windowId : number) {
	await serialized(async function () {
		var windows = [];
		var windowAge = await getLocalStorage(S.windowAge, []);
		if (windowAge instanceof Array) windows = windowAge;

		if (windows.indexOf(windowId) > -1) {
			windows.splice(windows.indexOf(windowId), 1);
			await setLocalStorage(S.windowAge, windows);
		}
		const lastActive : Map<number, number> = await getLocalStorageMap<number, number>(S.windowLastActive);
		if (lastActive.delete(windowId)) await setLocalStorageMap(S.windowLastActive, lastActive);
	});
}

export async function checkWindow(windowId : number) {
	if (!windowId) return;

	const colors: Map<number, string> = await getLocalStorageMap<number, string>(S.windowColors);
	const names: Map<number, string> = await getLocalStorageMap<number, string>(S.windowNames);

	if (!names.has(windowId) && !colors.has(windowId)) return;

	let window : browser.Windows.Window;
	try {
		window = await browser.windows.get(windowId, {populate: true});
	} catch (e) {
		// closed since the tab event that queued this check
		return;
	}
	const newHash = hashcode(window);

	await serialized(async function () {
		const hashes: Map<number, number> = await getLocalStorageMap<number, number>(S.windowHashes);
		if (hashes.get(windowId) === newHash) return;
		hashes.set(windowId, newHash);
		await setLocalStorageMap(S.windowHashes, hashes);
	});
}
