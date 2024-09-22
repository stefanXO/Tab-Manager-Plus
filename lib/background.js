"use strict";

var browser = browser || chrome;
var globalTabsActive = [];
var globalDisplayInfo = [];
var globalLocalStorageAvailable = true;

browser.runtime.onStartup.addListener(
	async function () {
		console.log(" ON STARTUP ");
		await checkLocalStorageAvailable();

		// move windowNames to oldWindowNames
		// move windowInfo to oldWindowInfo
	}
);

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

function focusOnWindow(windowId) {
	browser.windows.update(windowId, { focused: true });
}

async function updateTabCount() {
	var run = true;
	if (localStorageAvailable()) {
		var badge = await getLocalStorage("badge");
		if (typeof badge === "undefined") {
			badge = "1";
			await setLocalStorage("badge", badge);
		}
		if (badge == "0") run = false;
	}

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

function tabRemoved() {
	updateTabCountDebounce();
}

async function tabAdded(tab) {
	var tL = await getLocalStorage("tabLimit");
	if (typeof tL === "undefined" || tL == null) {
		tL = "0";
		await setLocalStorage("tabLimit", tL);
	}
	try {
		var tabLimit = JSON.parse(tL);
	} catch (e) {
		var tabLimit = 0;
	}

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

	var openInOwnTabValue = await getLocalStorage("openInOwnTab");
	if (typeof openInOwnTabValue === "undefined") {
		openInOwnTabValue = "0";
		await setLocalStorage("openInOwnTab", openInOwnTabValue);
	}

	var openInOwnTab = false
	try {
		openInOwnTab = !!JSON.parse(openInOwnTabValue);
	} catch (e) {
		openInOwnTab = false;
	}
	if(openInOwnTab) {
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

	var openInOwnTabValue = await getLocalStorage("openInOwnTab");
	if (typeof openInOwnTabValue === "undefined") {
		openInOwnTabValue = "0";
		await setLocalStorage("openInOwnTab", openInOwnTabValue);
	}

	var openInOwnTab = false
	try {
		openInOwnTab = !!JSON.parse(openInOwnTabValue);
	} catch (e) {
		openInOwnTab = false;
	}

	await browser.action.onClicked.removeListener(openAsOwnTab);
	if(openInOwnTab) {
		await browser.action.setPopup({ popup: "" });
		await browser.action.onClicked.addListener(openAsOwnTab);
	}else{
		await browser.action.setPopup({ popup: "popup.html?popup=true" });
	}
	if(browser.sidebarAction) {
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
	browser.tabs.onUpdated.removeListener(tabRemoved);
	browser.tabs.onRemoved.removeListener(tabRemoved);
	browser.tabs.onReplaced.removeListener(tabRemoved);
	browser.tabs.onDetached.removeListener(tabRemoved);
	browser.tabs.onAttached.removeListener(tabRemoved);
	browser.tabs.onActivated.removeListener(tabActiveChanged);
	browser.tabs.onMoved.removeListener(tabRemoved);
	browser.windows.onFocusChanged.removeListener(windowFocus);
	browser.windows.onCreated.removeListener(windowCreated);
	browser.windows.onRemoved.removeListener(windowRemoved);

	browser.tabs.onCreated.addListener(tabAdded);
	browser.tabs.onUpdated.addListener(tabRemoved);
	browser.tabs.onRemoved.addListener(tabRemoved);
	browser.tabs.onReplaced.addListener(tabRemoved);
	browser.tabs.onDetached.addListener(tabRemoved);
	browser.tabs.onAttached.addListener(tabRemoved);
	browser.tabs.onActivated.addListener(tabActiveChanged);
	browser.tabs.onMoved.addListener(tabRemoved);
	browser.windows.onFocusChanged.addListener(windowFocus);
	browser.windows.onCreated.addListener(windowCreated);
	browser.windows.onRemoved.addListener(windowRemoved);
	updateTabCountDebounce();

	setTimeout(cleanUp, 5000);
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

function localStorageAvailable() {
	return globalLocalStorageAvailable;
}

async function checkLocalStorageAvailable() {
	var test = 'test';
	try {
		await setLocalStorage(test, test);
		await removeLocalStorage(test);
		console.log("local storage available");
		globalLocalStorageAvailable = true;
		return true;
	} catch (e) {
		console.log(e);
		console.log("no local storage");
		globalLocalStorageAvailable = false;
		return false;
	}
}

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
		if (localStorageAvailable()) {
			var hideWindows = getLocalStorage("hideWindows") || "0";
			if (typeof hideWindows === "undefined") hideWindows = "0";
			await setLocalStorage("hideWindows", hideWindows);
			if (hideWindows == "0") return;
		} else {
			return;
		}

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
	if (localStorageAvailable()) {
		var windowAge = await getLocalStorage("windowAge");
		var windows = JSON.parse(windowAge);
		if (windows instanceof Array) {

		} else {
			windows = [];
		}
	}

	if (windows.indexOf(windowId) > -1) windows.splice(windows.indexOf(windowId), 1);
	windows.unshift(windowId);
	await setLocalStorage("windowAge", JSON.stringify(windows));

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
	if (request.command == "reload_popup_controls") {
		setupPopup();
	}
});

(async function () {
	await checkLocalStorageAvailable();

	var windows = await browser.windows.getAll({ populate: true });
	await setLocalStorage("windowAge", JSON.stringify([]));
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

