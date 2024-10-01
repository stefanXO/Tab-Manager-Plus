"use strict";

import {cleanupDebounce} from "@background/tracking";
import {getLocalStorage, getLocalStorageMap, setLocalStorage, setLocalStorageMap} from "@helpers/storage";
import {is_in_bounds, stringHashcode} from "@helpers/utils";
import {setWindowColor, setWindowName} from "@background/actions";
import * as S from "@strings";
import * as browser from 'webextension-polyfill';
import {ISavedSession} from "@types";

export async function setupWindowListeners() {
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

export async function createWindowWithSessionTabs(session: ISavedSession, tabId: number) {

	var customName : string;
	if (session && session.name && session.customName) {
		customName = session.name;
	}
	var color = "default";
	if (session && session.color) {
		color = session.color;
	}

	var whitelistWindow = ["left", "top", "width", "height", "incognito", "type"];

	if (navigator.userAgent.search("Firefox") > -1) {
		whitelistWindow = ["left", "top", "width", "height", "incognito", "type"];
	}

	var whitelistTab = ["url", "active", "selected", "pinned", "index"];

	if (navigator.userAgent.search("Firefox") > -1) {
		whitelistTab = ["url", "active", "pinned", "index"];
	}

	var filteredWindow : browser.Windows.CreateCreateDataType = Object.keys(session.windowsInfo)
		.filter(function (key) {
			return whitelistWindow.includes(key);
		})
		.reduce(function (obj, key) {
			obj[key] = session.windowsInfo[key];
			return obj;
		}, {});

	if (filteredWindow.left < 0 || filteredWindow.left > 800) filteredWindow.left = 0;
	if (filteredWindow.top < 0 || filteredWindow.top > 600) filteredWindow.top = 0;
	if (filteredWindow.width > 800) filteredWindow.width = 800;
	if (filteredWindow.height > 600) filteredWindow.height = 600;

	filteredWindow.type = "normal";

	// console.log("filtered window", filteredWindow);

	const newWindow = await browser.windows.create(filteredWindow).catch(function (error) {
		console.error(error);
		console.log(error);
		console.log(error.message);
	});

	if (!newWindow) return;

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

		if (navigator.userAgent.search("Firefox") > -1) {
			if (!!fTab.url && fTab.url.search("about:") > -1) {
				console.log("filtered by about: url", fTab.url);
				fTab.url = "";
			}
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
}

export function focusOnWindowDelayed(windowId: number) {
	setTimeout(focusOnWindow.bind(this, windowId), 125);
}

export async function focusOnWindow(windowId : number) {
	await browser.windows.update(windowId, {focused: true});
}

async function hideWindows(windowId : number) {
	if (navigator.userAgent.search("Firefox") > -1) return;
	if (!windowId || windowId < 0) return;

	let hide_windows = await getLocalStorage("hideWindows", false);
	if (!hide_windows) return;

	let has_permission = await browser.permissions.contains({permissions: ['system.display']});
	if (!has_permission) return;

	let displaylayouts = await chrome.system.display.getInfo();
	let monitor_bounds = [];

	try {
		for (let displaylayout of displaylayouts) {
			monitor_bounds.push(displaylayout.bounds);
		}
	} catch (err) {
		console.error(err);
		return;
	}

	let windows = await browser.windows.getAll({populate: true});
	let monitor = null;

	for (let window of windows) {
		if (window.id === windowId) {
			for (let bounds_index in monitor_bounds) {
				let _monitor = monitor_bounds[bounds_index];
				let _is_in_bounds = is_in_bounds(window, _monitor);
				if (_is_in_bounds) {
					monitor = _monitor;
					break;
				}
			}
		}
	}

	if (monitor == null) return;

	for (let window of windows) {
		if (window.id !== windowId) {
			if (is_in_bounds(window, monitor)) {
				await browser.windows.update(window.id, {"state": "minimized"});
			}
		}
	}
}

export async function windowActive(windowId : number) {
	if (windowId < 0) return;

	var windows = [];
	var windowAge = await getLocalStorage("windowAge", []);
	if (windowAge instanceof Array) windows = windowAge;

	if (windows.indexOf(windowId) > -1) windows.splice(windows.indexOf(windowId), 1);
	windows.unshift(windowId);
	await setLocalStorage("windowAge", windows);

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
			await windowActive(windowId);
		}
	} catch (e) {

	}
	// console.log("onRemoved", windowId);
}

export async function checkWindow(windowId : number) {
	if (!windowId) return;

	const colors: Map<number, string> = await getLocalStorageMap<number, string>(S.windowColors);
	const names: Map<number, string> = await getLocalStorageMap<number, string>(S.windowNames);

	if (!names[windowId] && !colors[windowId]) return;

	const hashes: Map<number, number> = await getLocalStorageMap<number, number>(S.windowHashes);

	try {
		const window = await browser.windows.get(windowId, {populate: true});

		let newHash = hashcode(window);
		hashes.set(windowId, newHash);
		await setLocalStorageMap(S.windowHashes, hashes);
	} catch (e) {
		console.log(e);
	}
}

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