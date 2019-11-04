"use strict";

var browser = browser || chrome;

async function createWindowWithTabs(tabs, isIncognito) {
	var first = tabs.shift();
	var t = [];
	for (var i = 0; i < tabs.length; i++) {
		t.push(tabs[i].id);
	};
	var w = await browser.windows.create({ tabId: first.id, incognito: !!isIncognito });
	await browser.tabs.update(first.id, { pinned: first.pinned });
	if (t.length > 0) {
		var tab = await browser.tabs.move(t, { windowId: w.id, index: -1 });
		await browser.tabs.update(tab.id, { pinned: tab.pinned });
	}
	await browser.windows.update(w.id, { focused: true });
}

async function focusOnTabAndWindow(tab) {
	await browser.windows.update(tab.windowId, { focused: true });
	if (!!tab.tabId) {
		await browser.tabs.update(tab.tabId, { active: true });
		tabActiveChanged(tab);
	} else {
		await browser.tabs.update(tab.id, { active: true });
		tabActiveChanged({ tabId: tab.id, windowId: tab.windowId });
	}
}

async function updateTabCount() {
	var run = true;
	if (localStorageAvailable()) {
		if (typeof localStorage["badge"] === "undefined") localStorage["badge"] = "1";
		if (localStorage["badge"] == "0") run = false;
	}

	if (run) {
		var result = await browser.tabs.query({});
		var count = 0;
		if (!!result && !!result.length) {
			count = result.length;
		}
		await browser.browserAction.setBadgeText({ text: count + "" });
		await browser.browserAction.setBadgeBackgroundColor({ color: "purple" });
		var toRemove = [];
		if (!!window.tabsActive) {
			for (var i = 0; i < window.tabsActive.length; i++) {
				var t = window.tabsActive[i];
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
			if (!!window.tabsActive && window.tabsActive.length > 0) {
				if (!!window.tabsActive[toRemove[i]]) window.tabsActive.splice(toRemove[i], 1);
			}
		};
	} else {
		await browser.browserAction.setBadgeText({ text: "" });
	}
}

var updateTabCountDebounce = debounce(updateTabCount, 250);

function tabRemoved() {
	updateTabCountDebounce();
}

window.tabsActive = [];

async function tabAdded(tab) {
	if (typeof localStorage["tabLimit"] === "undefined") localStorage["tabLimit"] = "0";
	try {
		var tabLimit = JSON.parse(localStorage["tabLimit"]);
	} catch (e) {
		var tabLimit = 0;
	}
	if (tabLimit > 0) {
		if (tab.index >= tabLimit) {
			await createWindowWithTabs([tab], tab.incognito);
		}
	}
	updateTabCountDebounce();
}



function tabActiveChanged(tab) {
	if (!!tab && !!tab.tabId) {
		if (!window.tabsActive) window.tabsActive = [];
		if (!!window.tabsActive && window.tabsActive.length > 0) {
			var lastActive = window.tabsActive[window.tabsActive.length - 1];
			if (!!lastActive && lastActive.tabId == tab.tabId && lastActive.windowId == tab.windowId) {
				return;
			}
		}
		while (window.tabsActive.length > 20) {
			window.tabsActive.shift();
		}
		for (var i = window.tabsActive.length - 1; i >= 0; i--) {
			if (window.tabsActive[i].tabId == tab.tabId) {
				window.tabsActive.splice(i, 1);
			}
		};
		window.tabsActive.push(tab);
	}
	updateTabCountDebounce();
}

async function openPopup() {
	return browser.browserAction.openPopup();
}

async function openAsOwnTab() {
	var popup_page = browser.runtime.getURL("popup.html");
	var tabs = await browser.tabs.query({});
	for (var i = 0; i < tabs.length; i++) {
		var tab = tabs[i];
		if (tab.url.indexOf("popup.html") > -1 && tab.url.indexOf(popup_page) > -1) {
			return browser.windows.update(tab.windowId, { focused: true }).then(
				function() {
					browser.tabs.highlight({ windowId: tab.windowId, tabs: tab.index });
				}.bind(this)
			);
		}
	}
	return browser.tabs.create({ url: "popup.html" });
}

async function setupPopup() {
	if (typeof localStorage["openInOwnTab"] === "undefined") localStorage["openInOwnTab"] = "0";
	var openInOwnTab = false
	try {
		openInOwnTab = !!JSON.parse(localStorage["openInOwnTab"]);
	} catch (e) {
		openInOwnTab = false;
	}
	console.log(openInOwnTab);
	if(openInOwnTab) {
		await browser.browserAction.setPopup({ popup: "" });
		await browser.browserAction.onClicked.addListener(openAsOwnTab);
	}else{
		await browser.browserAction.setPopup({ popup: "popup.html?popup=true" });
		await browser.browserAction.onClicked.removeListener(openAsOwnTab);
	}
}

async function setupListeners() {

	await browser.contextMenus.removeAll();
	browser.contextMenus.create({
		title: "📔 Open in own tab",
		contexts: ["browser_action"],
		onclick: openAsOwnTab });

	browser.contextMenus.create({
		title: "📑 Open popup",
		contexts: ["browser_action"],
		onclick: openPopup });

	browser.contextMenus.create({
		type: "separator",
		contexts: ["browser_action"] });

	browser.contextMenus.create({
		title: "😍 Support this extension",
		id: "support_menu",
		"contexts": ["browser_action"]
	});

	browser.contextMenus.create({
		title: "⭐ Leave a review",
		"contexts": ["browser_action"],
		parentId: "support_menu",
		onclick: function onclick(info, tab) {
			if (navigator.userAgent.search("Firefox") > -1) {
				browser.tabs.create({ url: 'https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/' });
			}else{
				browser.tabs.create({ url: 'https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff' });
			}
	} });

	browser.contextMenus.create({
		title: "☕ Donate to keep Extensions Alive",
		"contexts": ["browser_action"],
		parentId: "support_menu",
		onclick: function onclick(info, tab) {
			browser.tabs.create({ url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW' });
	} });

	browser.contextMenus.create({
		title: "💰 Become a Patron",
		"contexts": ["browser_action"],
		parentId: "support_menu",
		onclick: function onclick(info, tab) {
			browser.tabs.create({ url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW' });
	} });

	browser.contextMenus.create({
		title: "🤔 Issues and Suggestions",
		id: "code_menu",
		"contexts": ["browser_action"]
	});

	browser.contextMenus.create({
		title: "🆕 View recent changes",
		"contexts": ["browser_action"],
		parentId: "code_menu",
		onclick: function onclick(info, tab) {
			browser.tabs.create({ url: 'changelog.html' });
	} });

	browser.contextMenus.create({
		title: "⚙ Edit Options",
		"contexts": ["browser_action"],
		parentId: "code_menu",
		onclick: function onclick(info, tab) {
			browser.tabs.create({ url: 'options.html' });
	} });

	browser.contextMenus.create({
		title: "💻 View source code",
		"contexts": ["browser_action"],
		parentId: "code_menu",
		onclick: function onclick(info, tab) {
			browser.tabs.create({ url: 'https://github.com/stefanXO/Tab-Manager-Plus' });
	} });

	browser.contextMenus.create({
		title: "🤔 Report an issue",
		"contexts": ["browser_action"],
		parentId: "code_menu",
		onclick: function onclick(info, tab) {
			browser.tabs.create({ url: 'https://github.com/stefanXO/Tab-Manager-Plus/issues' });
	} });

	browser.contextMenus.create({
		title: "💡 Send a suggestion",
		"contexts": ["browser_action"],
		parentId: "code_menu",
		onclick: function onclick(info, tab) {
			browser.tabs.create({ url: 'https://github.com/stefanXO/Tab-Manager-Plus/issues' });
			browser.tabs.create({ url: 'mailto:markus+tmp@stefanxo.com' });
	} });

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
	var test = 'test';
	try {
		localStorage.setItem(test, test);
		localStorage.removeItem(test);
		return true;
	} catch (e) {
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

window.displayInfo = [];

async function hideWindows(windowId) {
	if (!windowId || windowId < 0) {
		return;
	} else {
		if (localStorageAvailable()) {
			if (typeof localStorage["hideWindows"] === "undefined") localStorage["hideWindows"] = "0";
			if (localStorage["hideWindows"] == "0") return;
		} else {
			console.log("no local storage");
			return;
		}

		if (navigator.userAgent.search("Firefox") > -1) {
			return;
		}

		var result = await browser.permissions.contains({ permissions: ['system.display'] });
		if (result) {
			// The extension has the permissions.
			chrome.system.display.getInfo(async function (windowId, displaylayouts) {
				window.displayInfo = [];
				var _iteratorNormalCompletion = true;
				var _didIteratorError = false;
				var _iteratorError = undefined;
				try {
					for (var _iterator = displaylayouts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {var displaylayout = _step.value;
						window.displayInfo.push(displaylayout.bounds);
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
						for (var a in window.displayInfo) {
							var result = is_in_bounds(windows[i], window.displayInfo[a]);
							if (result) {
								monitor = a;
							}
						}
					}
				};

				for (var i = windows.length - 1; i >= 0; i--) {
					if (windows[i].id != windowId) {
						if (is_in_bounds(windows[i], window.displayInfo[monitor])) {
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

function windowActive(windowId) {
	if (windowId < 0) return;
	var windows = JSON.parse(localStorage["windowAge"]);
	if (windows instanceof Array) {

	} else {
		windows = [];
	}
	if (windows.indexOf(windowId) > -1) windows.splice(windows.indexOf(windowId), 1);
	windows.unshift(windowId);
	localStorage["windowAge"] = JSON.stringify(windows);

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
		if (!!window.tabsActive && window.tabsActive.length > 1) {
			focusOnTabAndWindow(window.tabsActive[window.tabsActive.length - 2]);
		}
	}
});

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.command == "reload_popup_controls") {
		setupPopup();
	}
});

(async function () {
	var windows = await browser.windows.getAll({ populate: true });
	localStorage["windowAge"] = JSON.stringify([]);
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

setInterval(setupListeners, 300000);
setupListeners();

