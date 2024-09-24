"use strict";

var browser = browser || chrome;
var globalTabsActive = [];
var globalDisplayInfo = [];

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

async function discardTabs(tabs) {
	for (var i = 0; i < tabs.length; i++) {
		if (!tabs[i].discarded) {
			browser.tabs.discard(tabs[i].id).catch(function (e) {
				console.error(e);
				console.log(e.message);
			});
		}
	}
}

async function closeTabs(tabs) {
	for (var i = 0; i < tabs.length; i++) {
		await browser.tabs.remove(tabs[i].id);
	}
}

async function moveTabsToWindow(windowId, tabs) {
	for (var i = 0; i < tabs.length; i++) {
		var t = tabs[i];
		await browser.tabs.move(t.id, {windowId: windowId, index: -1});
		await browser.tabs.update(t.id, {pinned: t.pinned});
	}
}

async function createWindowWithTabs(tabs, isIncognito) {

	var pinnedIndex = 0;
	var firstTab = tabs.shift();
	var t = [];
	for (var i = 0; i < tabs.length; i++) {
		t.push(tabs[i].id);
	};

	var firstPinned = firstTab.pinned;
	var w = await browser.windows.create({ tabId: firstTab.id, incognito: !!isIncognito });
	if(firstPinned) {
		await browser.tabs.update(w.tabs[0].id, { pinned: firstPinned });
		pinnedIndex++;
	}

	if (t.length > 0) {
		var i = 0;
		for (var oldTabId of t) {
			i++;
			var oldTab = await browser.tabs.get(oldTabId);
			var tabPinned = oldTab.pinned;
			var movedTabs = [];
			if(!tabPinned) {
				movedTabs = await browser.tabs.move(oldTabId, { windowId: w.id, index: -1 });
			}else{
				movedTabs = await browser.tabs.move(oldTabId, { windowId: w.id, index: pinnedIndex++ });
			}
			if(movedTabs.length > 0) {
				var newTab = movedTabs[0];
				if(tabPinned) {
					await browser.tabs.update(newTab.id, { pinned: tabPinned });
				}
			}
		};
	}
	await browser.windows.update(w.id, { focused: true });
}

async function createWindowWithSessionTabs(window, tabId) {

	var customName = false;
	if (window && window.name && window.customName) {
		customName = window.name;
	}

	var whitelistWindow = ["left", "top", "width", "height", "incognito", "type"];

	if (navigator.userAgent.search("Firefox") > -1) {
		whitelistWindow = ["left", "top", "width", "height", "incognito", "type"];
	}

	var whitelistTab = ["url", "active", "selected", "pinned", "index"];

	if (navigator.userAgent.search("Firefox") > -1) {
		whitelistTab = ["url", "active", "pinned", "index"];
	}

	var filteredWindow = Object.keys(window.windowsInfo)
		.filter(function (key) {
			return whitelistWindow.includes(key);
		})
		.reduce(function (obj, key) {
			obj[key] = window.windowsInfo[key];
			return obj;
		}, {});

	if (filteredWindow.left < 0 || filteredWindow.left > 800) filteredWindow.left = 0;
	if (filteredWindow.top < 0 || filteredWindow.top > 600) filteredWindow.top = 0;
	if (filteredWindow.width > 800) filteredWindow.width = 800;
	if (filteredWindow.height > 600) filteredWindow.height = 600;

	filteredWindow.type = "normal";

	// console.log("filtered window", filteredWindow);

	var newWindow = await browser.windows.create(filteredWindow).catch(function (error) {
		console.error(error);
		console.log(error);
		console.log(error.message);
	});

	var emptyTab = newWindow.tabs[0].id;

	for (var i = 0; i < window.tabs.length; i++) {
		var newTab = Object.keys(window.tabs[i])
			.filter(function (key) {
				return whitelistTab.includes(key);
			})
			.reduce(function (obj, key) {
				obj[key] = window.tabs[i][key];
				return obj;
			}, {});

		if (tabId != null && tabId != newTab.index) {
			continue;
		}
		newTab.windowId = newWindow.id;

		if (navigator.userAgent.search("Firefox") > -1) {
			if (!!newTab.url && newTab.url.search("about:") > -1) {
				console.log("filtered by about: url", newTab.url);
				newTab.url = "";
			}
		}
		try {
			var tabCreated = await browser.tabs.create(newTab).catch(function (error) {
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
		var names = await getLocalStorage("windowNames", {});
		names[newWindow.id] = customName || "";
		await setLocalStorage("windowNames", names);
	}

	await browser.windows.update(newWindow.id, {focused: true});
}

function focusOnTabAndWindowDelayed(tab) {
	var tab = JSON.parse(JSON.stringify(tab));
	setTimeout(focusOnTabAndWindow.bind(this, tab), 125);
}

async function focusOnTabAndWindow(tab) {
	var windowId = tab.windowId;
	var tabId;
	if (!!tab.tabId) {
		tabId = tab.tabId;
	} else {
		tabId = tab.id;
	}

	browser.windows.update(windowId, { focused: true }).then(function(tabId, windowId) {
		browser.tabs.update(tabId, { active: true }).then(function(tabId, windowId) {
			tabActiveChanged({ tabId: tabId, windowId: windowId });
		}.bind(this, tabId, windowId));
	}.bind(this, tabId, windowId));
}

function focusOnWindowDelayed(windowId) {
	setTimeout(focusOnWindow.bind(this, windowId), 125);
}

async function setWindowColor(windowId, color) {
	var colors = await getLocalStorage("windowColors", {});
	if (typeof colors !== 'object') colors = {};
	colors[windowId] = color;
	await setLocalStorage("windowColors", colors);
	await updateWindowHash(windowId);
}

async function setWindowName(windowId, name) {
	var names = await getLocalStorage("windowNames", {});
	if (typeof names !== 'object') names = {};
	names[windowId] = name;
	await setLocalStorage("windowNames", names);
	await updateWindowHash(windowId);
}

async function updateWindowHash(windowId) {
	var window = await browser.windows.get(windowId, { populate: true });
	var hash = hashcode(window);
	var hashes = await getLocalStorage("windowHashes", {});
	hashes[windowId] = hash;
	await setLocalStorage("windowHashes", hashes);
}

function focusOnWindow(windowId) {
	browser.windows.update(windowId, { focused: true });
}

async function updateTabCount() {
	var run = true;

	var badge = await getLocalStorage("badge", true);
	if (!badge) run = false;

	if (run) {
		var result = await browser.tabs.query({});
		var count = 0;
		if (!!result && !!result.length) {
			count = result.length;
		}
		await browser.action.setBadgeText({ text: count + "" });
		await browser.action.setBadgeBackgroundColor({ color: "purple" });
		var toRemove = [];
		if (!!globalTabsActive) {
			for (var i = 0; i < globalTabsActive.length; i++) {
				var t = globalTabsActive[i];
				var found = false;
				if (!!result && !!result.length) {
					for (var j = 0; j < result.length; j++) {
						if (result[j].id == t.tabId) found = true;
					};
				}
				if (!found) toRemove.push(i);
			};
		}
		// console.log("to remove", toRemove);
		for (var i = toRemove.length - 1; i >= 0; i--) {
			// console.log("removing", toRemove[i]);
			if (!!globalTabsActive && globalTabsActive.length > 0) {
				if (!!globalTabsActive[toRemove[i]]) globalTabsActive.splice(toRemove[i], 1);
			}
		};
	} else {
		await browser.action.setBadgeText({ text: "" });
	}
}

var updateTabCountDebounce = debounce(updateTabCount, 250);
var cleanupDebounce = debounce(cleanUp, 500);

function tabCountChanged() {
	updateTabCountDebounce();
}

async function tabAdded(tab) {
	var tabLimit = await getLocalStorage("tabLimit", 0);
	if (tabLimit > 0) {
		if (tab.id != browser.tabs.TAB_ID_NONE) {
			var tabCount = await browser.tabs.query({ currentWindow: true });
			if(tabCount.length > tabLimit) {
				await createWindowWithTabs([tab], tab.incognito);
			}
		}
	}
	updateTabCountDebounce();
}



function tabActiveChanged(tab) {
	if (!!tab && !!tab.tabId) {
		if (!globalTabsActive) globalTabsActive = [];
		if (!!globalTabsActive && globalTabsActive.length > 0) {
			var lastActive = globalTabsActive[globalTabsActive.length - 1];
			if (!!lastActive && lastActive.tabId == tab.tabId && lastActive.windowId == tab.windowId) {
				return;
			}
		}
		while (globalTabsActive.length > 20) {
			globalTabsActive.shift();
		}
		for (var i = globalTabsActive.length - 1; i >= 0; i--) {
			if (globalTabsActive[i].tabId == tab.tabId) {
				globalTabsActive.splice(i, 1);
			}
		};
		globalTabsActive.push(tab);
	}
	updateTabCountDebounce();
}

async function openSidebar() {
	await browser.sidebarAction.open();
}

async function openPopup() {

	var openInOwnTab = await getLocalStorage("openInOwnTab", false);
	if (openInOwnTab) {
		await browser.action.setPopup({ popup: "popup.html?popup=true" });
		await browser.action.openPopup();
		await browser.action.setPopup({ popup: "" });
	}else{
		await browser.action.openPopup();
	}
}

async function openAsOwnTab() {
	var popup_page = browser.runtime.getURL("popup.html");
	var tabs = await browser.tabs.query({});

	var currentTab;
	var previousTab;
	if (!!globalTabsActive && globalTabsActive.length > 1) {
		currentTab = globalTabsActive[globalTabsActive.length - 1];
		previousTab = globalTabsActive[globalTabsActive.length - 2];
	}

	for (var i = 0; i < tabs.length; i++) {
		var tab = tabs[i];
		if (tab.url.indexOf("popup.html") > -1 && tab.url.indexOf(popup_page) > -1) {
			if(currentTab && currentTab.tabId && tab.id == currentTab.tabId && previousTab && previousTab.tabId) {
				return focusOnTabAndWindow(previousTab);
			}else{
				return browser.windows.update(tab.windowId, { focused: true }).then(
					function() {
						browser.tabs.highlight({ windowId: tab.windowId, tabs: tab.index });
					}.bind(this)
				);
			}
		}
	}
	return browser.tabs.create({ url: "popup.html" });
}

async function setupPopup() {

	var openInOwnTab = await getLocalStorage("openInOwnTab", false);

	await browser.action.onClicked.removeListener(openAsOwnTab);
	if (openInOwnTab) {
		await browser.action.setPopup({ popup: "" });
		await browser.action.onClicked.addListener(openAsOwnTab);
	} else {
		await browser.action.setPopup({ popup: "popup.html?popup=true" });
	}
	if (browser.sidebarAction) {
		browser.sidebarAction.setPanel({ panel: "popup.html?panel=true" });
	}
}

async function setupListeners() {

	await browser.contextMenus.removeAll();
	browser.contextMenus.create({
		id: "open_in_own_tab",
		title: "📔 Open in own tab",
		contexts: ["action"]
	});

	if(!!browser.action.openPopup) {
		browser.contextMenus.create({
			id: "open_popup",
			title: "📑 Open popup",
			contexts: ["action"]
		});
	}

	if(!!browser.sidebarAction) {
		browser.contextMenus.create({
			id: "open_sidebar",
			title: "🗂 Open sidebar",
			contexts: ["action"]
		});
	}

	browser.contextMenus.create({
		id: "sep1",
		type: "separator",
		contexts: ["action"]
	});

	browser.contextMenus.create({
		title: "😍 Support this extension",
		id: "support_menu",
		"contexts": ["action"]
	});

	browser.contextMenus.create({
		id: "review",
		title: "⭐ Leave a review",
		"contexts": ["action"],
		parentId: "support_menu"
	});

	browser.contextMenus.create({
		id: "donate",
		title: "☕ Donate to keep Extensions Alive",
		"contexts": ["action"],
		parentId: "support_menu"
	});

	browser.contextMenus.create({
		id: "patron",
		title: "💰 Become a Patron",
		"contexts": ["action"],
		parentId: "support_menu"
	});

	browser.contextMenus.create({
		id: "twitter",
		title: "🐦 Follow on Twitter",
		"contexts": ["action"],
		parentId: "support_menu"
	});

	browser.contextMenus.create({
		title: "🤔 Issues and Suggestions",
		id: "code_menu",
		"contexts": ["action"]
	});

	browser.contextMenus.create({
		id: "changelog",
		title: "🆕 View recent changes",
		"contexts": ["action"],
		parentId: "code_menu"
	});

	browser.contextMenus.create({
		id: "options",
		title: "⚙ Edit Options",
		"contexts": ["action"],
		parentId: "code_menu"
	});

	browser.contextMenus.create({
		id: "source",
		title: "💻 View source code",
		"contexts": ["action"],
		parentId: "code_menu"
	});

	browser.contextMenus.create({
		id: "report",
		title: "🤔 Report an issue",
		"contexts": ["action"],
		parentId: "code_menu"
	});

	browser.contextMenus.create({
		id: "send",
		title: "💡 Send a suggestion",
		"contexts": ["action"],
		parentId: "code_menu"
	});

	browser.contextMenus.onClicked.addListener(
		function (info, tab) {
			if (info.menuItemId == "open_in_own_tab") openAsOwnTab();
			if (info.menuItemId == "open_popup") openPopup();
			if (info.menuItemId == "open_sidebar") openSidebar();

			if (info.menuItemId == "donate") browser.tabs.create({url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW'});
			if (info.menuItemId == "patron") browser.tabs.create({url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW'});
			if (info.menuItemId == "changelog") browser.tabs.create({url: 'changelog.html'});
			if (info.menuItemId == "options") browser.tabs.create({url: 'options.html'});
			if (info.menuItemId == "report") browser.tabs.create({url: 'https://github.com/stefanXO/Tab-Manager-Plus/issues'});

			if (info.menuItemId == "source") browser.tabs.create({url: 'https://github.com/stefanXO/Tab-Manager-Plus'});

			if (info.menuItemId == "twitter") browser.tabs.create({url: 'https://www.twitter.com/mastef'});

			if (info.menuItemId == "send") {
				browser.tabs.create({url: 'https://github.com/stefanXO/Tab-Manager-Plus/issues'});
				browser.tabs.create({url: 'mailto:markus+tmp@stefanxo.com'});
			}

			if (info.menuItemId == "review") {
				if (navigator.userAgent.search("Firefox") > -1) {
					browser.tabs.create({url: 'https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/'});
				} else {
					browser.tabs.create({url: 'https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff'});
				}
			}
		}
	);

	setupPopup();

	browser.tabs.onCreated.removeListener(tabAdded);
	browser.tabs.onUpdated.removeListener(tabCountChanged);
	browser.tabs.onRemoved.removeListener(tabCountChanged);
	browser.tabs.onReplaced.removeListener(tabCountChanged);
	browser.tabs.onDetached.removeListener(tabCountChanged);
	browser.tabs.onAttached.removeListener(tabCountChanged);
	browser.tabs.onActivated.removeListener(tabActiveChanged);
	browser.tabs.onMoved.removeListener(tabCountChanged);

	browser.tabs.onCreated.removeListener(checkTabCreate);
	browser.tabs.onUpdated.removeListener(checkTabUpdate);
	browser.tabs.onRemoved.removeListener(checkTabRemove);
	browser.tabs.onDetached.removeListener(checkTabDetached);
	browser.tabs.onAttached.removeListener(checkTabAttached);
	browser.tabs.onMoved.removeListener(checkTabMoved);

	browser.windows.onFocusChanged.removeListener(windowFocus);
	browser.windows.onCreated.removeListener(windowCreated);
	browser.windows.onRemoved.removeListener(windowRemoved);

	browser.tabs.onCreated.addListener(tabAdded);
	browser.tabs.onUpdated.addListener(tabCountChanged);
	browser.tabs.onRemoved.addListener(tabCountChanged);
	browser.tabs.onReplaced.addListener(tabCountChanged);
	browser.tabs.onDetached.addListener(tabCountChanged);
	browser.tabs.onAttached.addListener(tabCountChanged);
	browser.tabs.onActivated.addListener(tabActiveChanged);
	browser.tabs.onMoved.addListener(tabCountChanged);

	browser.tabs.onCreated.addListener(checkTabCreate); // 1, tab
	browser.tabs.onUpdated.addListener(checkTabUpdate); // 3, tabid, changeinfo, tab
	browser.tabs.onRemoved.addListener(checkTabRemove); // 2, tabid, removeinfo
	browser.tabs.onDetached.addListener(checkTabDetached); // 2, tabid, detachinfo
	browser.tabs.onAttached.addListener(checkTabAttached); // 2, tabid, attachinfo
	browser.tabs.onMoved.addListener(checkTabMoved); // 2, tabid, moveinfo

	browser.windows.onFocusChanged.addListener(windowFocus);
	browser.windows.onCreated.addListener(windowCreated);
	browser.windows.onRemoved.addListener(windowRemoved);
	updateTabCountDebounce();

	setTimeout(cleanupDebounce, 2500);
}

function stringHashcode(string) {
	var hash = 0;
	for (var i = 0; i < string.length; i++) {
		var code = string.charCodeAt(i);
		hash = ((hash << 5) - hash) + code;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

function hashcode(window) {
	var urls = [];
	for (var i = 0; i < window.tabs.length; i++) {
		if (!window.tabs[i].url) continue;
		urls.push(window.tabs[i].url);
	}
	urls.sort();

	var hash = 0;
	for (var i = 0; i < urls.length; i++) {
		var code = stringHashcode(urls[i]);
		hash = ((hash << 5) - hash) + code;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

async function checkWindow(windowId) {
	if (!windowId) return;

	var storage = await browser.storage.local.get(['windowNames', 'windowColors', 'windowHashes']);

	var names = storage.windowNames || {};
	var colors = storage.windowColors || {};
	var hashes = storage.windowHashes || {};

	if (!names[windowId] && !colors[windowId]) return;

	try {
		var window = await browser.windows.get(windowId, {populate: true});

		var newHash = hashcode(window);
		hashes[windowId] = newHash;
		await setLocalStorage('windowHashes', hashes);
	} catch (e) {
		console.log(e);
	}
}

async function checkTabCreate(tab) {
	checkWindow(tab.windowId);
}

async function checkTabUpdate(tabid, changeinfo, tab) {
	checkWindow(tab.windowId);
}

async function checkTabRemove(tabid, removeinfo) {
	if (removeinfo.isWindowClosing) return;
	checkWindow(removeinfo.windowId);
}

async function checkTabDetached(tabid, detachinfo) {
	checkWindow(detachinfo.oldWindowId);
}

async function checkTabAttached(tabid, attachinfo) {
	checkWindow(attachinfo.newWindowId);
}

async function checkTabMoved(tabid, moveinfo) {
	checkWindow(moveinfo.windowId);
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	return function () {
		var context = this,args = arguments;
		var later = function later() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

function windowFocus(windowId) {
	try {
		if (!!windowId) {
			windowActive(windowId);
			// console.log("onFocused", windowId);
			hideWindows(windowId);
		}
	} catch (e) {

	}
}
function windowCreated(window) {
	try {
		if (!!window && !!window.id) {
			windowActive(window.id);
		}
	} catch (e) {

	}
	// console.log("onCreated", window.id);
}
function windowRemoved(windowId) {
	try {
		if (!!windowId) {
			windowActive(windowId);
		}
	} catch (e) {

	}
	// console.log("onRemoved", windowId);
}

async function hideWindows(windowId) {
	if (navigator.userAgent.search("Firefox") > -1) {
		return;
	}

	if (!windowId || windowId < 0) {
		return;
	} else {
		var hideWindows = await getLocalStorage("hideWindows", false);
		if (!hideWindows) return;

		var result = await browser.permissions.contains({ permissions: ['system.display'] });
		if (result) {
			// The extension has the permissions.
			chrome.system.display.getInfo(async function (windowId, displaylayouts) {
				globalDisplayInfo = [];
				var _iteratorNormalCompletion = true;
				var _didIteratorError = false;
				var _iteratorError = undefined;
				try {
					for (var _iterator = displaylayouts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {var displaylayout = _step.value;
						globalDisplayInfo.push(displaylayout.bounds);
					}
				} catch (err) {
					_didIteratorError = true;
					_iteratorError = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion && _iterator.return) {
							_iterator.return();
						}
					} finally {
						if (_didIteratorError) {
							throw _iteratorError;
						}
					}
				}
				var windows = await browser.windows.getAll({ populate: true });
				var monitor = -1;
				for (var i = windows.length - 1; i >= 0; i--) {
					if (windows[i].id == windowId) {
						for (var a in globalDisplayInfo) {
							var result = is_in_bounds(windows[i], globalDisplayInfo[a]);
							if (result) {
								monitor = a;
							}
						}
					}
				};

				for (var i = windows.length - 1; i >= 0; i--) {
					if (windows[i].id != windowId) {
						if (is_in_bounds(windows[i], globalDisplayInfo[monitor])) {
							await browser.windows.update(windows[i].id, { "state": "minimized" });
						}
					}
				};
			}.bind(null, windowId));
		}
	}
}

function is_in_bounds(object, bounds) {
	var C = object,B = bounds;
	if (C.left >= B.left && C.left <= B.left + B.width) {
		if (C.top >= B.top && C.top <= B.top + B.height) {
			return true;
		}
	}
	return false;
};

async function windowActive(windowId) {
	if (windowId < 0) return;

	var windows = [];
	var windowAge = await getLocalStorage("windowAge", []);
	if (windowAge instanceof Array) windows = windowAge;

	if (windows.indexOf(windowId) > -1) windows.splice(windows.indexOf(windowId), 1);
	windows.unshift(windowId);
	await setLocalStorage("windowAge", windows);

	// browser.windows.getLastFocused({ populate: true }, function (w) {
	// 	for (var i = 0; i < w.tabs.length; i++) {
	// 		var tab = w.tabs[i];
	// 		if (tab.active == true) {
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

browser.commands.onCommand.addListener(function (command) {
	if (command == "switch_to_previous_active_tab") {
		if (!!globalTabsActive && globalTabsActive.length > 1) {
			focusOnTabAndWindow(globalTabsActive[globalTabsActive.length - 2]);
		}
	}
});

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.command) {
		case "reload_popup_controls":
			setupPopup();
			break;
		case "update_tab_count":
			updateTabCount();
			break;
		case "discard_tabs":
			discardTabs(request.tabs);
			break;
		case "move_tabs_to_window":
			moveTabsToWindow(request.window_id, request.tabs);
			break;
		case "focus_on_tab_and_window":
			focusOnTabAndWindow(request.tab);
			break;
		case "focus_on_tab_and_window_delayed":
			focusOnTabAndWindowDelayed(request.tab);
			break;
		case "focus_on_window":
			focusOnWindow(request.window_id);
			break;
		case "focus_on_window_delayed":
			focusOnWindowDelayed(request.window_id);
			break;
		case "set_window_color":
			setWindowColor(request.window_id, request.color);
			break;
		case "set_window_name":
			setWindowName(request.window_id, request.name);
			break;
		case "create_window_with_tabs":
			createWindowWithTabs(request.tabs);
			break;
		case "create_window_with_session_tabs":
			createWindowWithSessionTabs(request.window, request.tab_id);
			break;
		case "close_tabs":
			closeTabs(request.tabs);
			break;
	}
});

(async function () {
	var windows = await browser.windows.getAll({ populate: true });
	await setLocalStorage("windowAge", []);
	if (!!windows && windows.length > 0) {
		windows.sort(function (a, b) {
			if (a.id < b.id) return 1;
			if (a.id > b.id) return -1;
			return 0;
		});
		for (var i = 0; i < windows.length; i++) {
			if (!!windows[i].id) windowActive(windows[i].id);
		};
	}
})();

async function cleanUp() {
	var activewindows = await browser.windows.getAll({ populate: true });
	var windowids = [];
	for(var w of activewindows) {
		windowids.push(w.id);
	}
	// console.log("window ids...", windowids);

	var windowAge = await getLocalStorage("windowAge");

	var windows = JSON.parse(windowAge);
	if (windows instanceof Array) {

	} else {
		windows = [];
	}

	// console.log("before", JSON.parse(JSON.stringify(windows)));
	for (var i = windows.length - 1; i >= 0; i--) {
		if (windowids.indexOf(windows[i]) < 0) {
			// console.log("did not find", windows[i], i);
			windows.splice(i, 1);
		}
	};
	// console.log("after", JSON.parse(JSON.stringify(windows)));
	await setLocalStorage("windowAge", JSON.stringify(windows));

	var names = await getLocalStorage("windowNames");
	if (!!names) {
		names = JSON.parse(names);
	} else {
		names = {};
	}

	// console.log("before", JSON.parse(JSON.stringify(names)));
	for(var id of Object.keys(names)) {
		if (windowids.indexOf(parseInt(id)) < 0) {
			// console.log("did not find", id);
			delete names[id];
		}
	}
	// console.log("after", JSON.parse(JSON.stringify(names)));
	await setLocalStorage("windowNames", JSON.stringify(names));
}

setInterval(setupListeners, 300000);

setupListeners();

