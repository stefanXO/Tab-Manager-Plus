import browser from "webextension-polyfill";
import { onMessage } from "webext-bridge/background";

window.tabsActive = [];
window.displayInfo = [];

async function getItem(name) {
	return (await browser.storage.local.get(name))[name];
}
function setItem(name, value) {
	return browser.storage.local.set({ [name]: value });
}

onMessage("create_window_with_tabs", ({ data: { tabs }}) => {
	return createWindowWithTabs(tabs)
})

async function createWindowWithTabs(tabs, isIncognito) {

	var pinnedIndex = 0;
	var firstTab = tabs.shift();
	var t = [];
	for (var i = 0; i < tabs.length; i++) {
		t.push(tabs[i].id);
	};

	var firstPinned = firstTab.pinned;
	var w = await browser.windows.create({
		tabId: firstTab.id,
		incognito: !!isIncognito,
	});
	if (firstPinned) {
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
			if (!tabPinned) {
				movedTabs = await browser.tabs.move(oldTabId, {
					windowId: w.id,
					index: -1,
				});
			} else {
				movedTabs = await browser.tabs.move(oldTabId, {
					windowId: w.id,
					index: pinnedIndex++,
				});
			}
			if (movedTabs.length > 0) {
				var newTab = movedTabs[0];
				if (tabPinned) {
					await browser.tabs.update(newTab.id, { pinned: tabPinned });
				}
			}
		}
	}
	await browser.windows.update(w.id, { focused: true });
}

onMessage("focus_on_tab_and_window", ({ data: { tab, isFirefox } }) => {
	if (isFirefox)
		return new Promise((resolve) => setTimeout(resolve, 125)).then(
			focusOnTabAndWindow.bind(this, tab)
		);

	return focusOnTabAndWindow(tab);
});

async function focusOnTabAndWindow(tab) {
	var windowId = tab.windowId;
	var tabId;
	if (!!tab.tabId) {
		tabId = tab.tabId;
	} else {
		tabId = tab.id;
	}

	browser.windows.update(windowId, { focused: true }).then(
		function (tabId, windowId) {
			browser.tabs.update(tabId, { active: true }).then(
				function (tabId, windowId) {
					tabActiveChanged({ tabId: tabId, windowId: windowId });
				}.bind(this, tabId, windowId)
			);
		}.bind(this, tabId, windowId)
	);
}

onMessage("focus_on_window", ({ data: { windowId, isFirefox } }) => {
	if (isFirefox)
		return new Promise((resolve) => setTimeout(resolve, 125)).then(
			focusOnWindow.bind(this, windowId)
		);

	return focusOnWindow(windowId);
});

function focusOnWindow(windowId) {
	return browser.windows.update(windowId, { focused: true });
}

async function updateTabCount() {
	var run = true;
	if (typeof (await getItem("badge")) === "undefined")
		await setItem("badge", "1");
	if ((await getItem("badge")) == "0") run = false;

	if (run) {
		var result = await browser.tabs.query({});
		var count = 0;
		if (!!result && !!result.length) {
			count = result.length;
		}
		await browser.action.setBadgeText({ text: count + "" });
		await browser.action.setBadgeBackgroundColor({ color: "purple" });
		var toRemove = [];
		if (!!window.tabsActive) {
			for (var i = 0; i < window.tabsActive.length; i++) {
				var t = window.tabsActive[i];
				var found = false;
				if (!!result && !!result.length) {
					for (var j = 0; j < result.length; j++) {
						if (result[j].id == t.tabId) found = true;
					}
				}
				if (!found) toRemove.push(i);
			}
		}
		// console.log("to remove", toRemove);
		for (var i = toRemove.length - 1; i >= 0; i--) {
			// console.log("removing", toRemove[i]);
			if (!!window.tabsActive && window.tabsActive.length > 0) {
				if (!!window.tabsActive[toRemove[i]])
					window.tabsActive.splice(toRemove[i], 1);
			}
		}
	} else {
		await browser.action.setBadgeText({ text: "" });
	}
}

var updateTabCountDebounce = debounce(updateTabCount, 250);

function tabRemoved() {
	updateTabCountDebounce();
}

async function tabAdded(tab) {
	if (typeof (await getItem("tabLimit")) === "undefined")
		await setItem("tabLimit", "0");
	try {
		var tabLimit = JSON.parse(await getItem("tabLimit"));
	} catch (e) {
		var tabLimit = 0;
	}
	if (tabLimit > 0) {
		if (tab.id != browser.tabs.TAB_ID_NONE) {
			var tabCount = await browser.tabs.query({ currentWindow: true });
			if (tabCount.length > tabLimit) {
				await createWindowWithTabs([tab], tab.incognito);
			}
		}
	}
	updateTabCountDebounce();
}

function tabActiveChanged(tab) {
	if (!!tab && !!tab.tabId) {
		if (!window.tabsActive) window.tabsActive = [];
		if (!!window.tabsActive && window.tabsActive.length > 0) {
			var lastActive = window.tabsActive[window.tabsActive.length - 1];
			if (
				!!lastActive &&
				lastActive.tabId == tab.tabId &&
				lastActive.windowId == tab.windowId
			) {
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
		}
		window.tabsActive.push(tab);
	}
	updateTabCountDebounce();
}

async function openSidebar() {
	await browser.sidebarAction.open();
}

async function openPopup() {
	if (typeof (await getItem("openInOwnTab")) === "undefined")
		await setItem("openInOwnTab", "0");
	var openInOwnTab = false;
	try {
		openInOwnTab = !!JSON.parse(await getItem("openInOwnTab"));
	} catch (e) {
		openInOwnTab = false;
	}
	if (openInOwnTab) {
		await browser.action.setPopup({ popup: "popup.html?popup=true" });
		await browser.action.openPopup();
		await browser.action.setPopup({ popup: "" });
	} else {
		await browser.action.openPopup();
	}
}

async function openAsOwnTab() {
	var popup_page = browser.runtime.getURL("popup.html");
	var tabs = await browser.tabs.query({});

	var currentTab;
	var previousTab;
	if (!!window.tabsActive && window.tabsActive.length > 1) {
		currentTab = window.tabsActive[window.tabsActive.length - 1];
		previousTab = window.tabsActive[window.tabsActive.length - 2];
	}

	for (var i = 0; i < tabs.length; i++) {
		var tab = tabs[i];
		if (
			tab.url.indexOf("popup.html") > -1 &&
			tab.url.indexOf(popup_page) > -1
		) {
			if (
				currentTab &&
				currentTab.tabId &&
				tab.id == currentTab.tabId &&
				previousTab &&
				previousTab.tabId
			) {
				return focusOnTabAndWindow(previousTab);
			} else {
				return browser.windows
					.update(tab.windowId, { focused: true })
					.then(
						function () {
							browser.tabs.highlight({
								windowId: tab.windowId,
								tabs: tab.index,
							});
						}.bind(this)
					);
			}
		}
	}
	return browser.tabs.create({ url: "popup.html" });
}

async function setupPopup() {
	if (typeof (await getItem("openInOwnTab")) === "undefined")
		await setItem("openInOwnTab", "0");
	var openInOwnTab = false;
	try {
		openInOwnTab = !!JSON.parse(await getItem("openInOwnTab"));
	} catch (e) {
		openInOwnTab = false;
	}
	console.log(openInOwnTab);
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

const menus = [];
menus.push({
	title: "📔 Open in own tab",
	id: "open_in_own_tab",
	contexts: ["browser_action"],
	onclick: openAsOwnTab,
});

if (!!browser.action.openPopup) {
	menus.push({
		title: "📑 Open popup",
		id: "open_popup",
		contexts: ["browser_action"],
		onclick: openPopup,
	});
}

if (!!browser.sidebarAction) {
	menus.push({
		title: "🗂 Open sidebar",
		id: "open_sidebar",
		contexts: ["browser_action"],
		onclick: openSidebar,
	});
}

menus.push({
	type: "separator",
	id: "sep_1",
	contexts: ["browser_action"],
});

menus.push({
	title: "😍 Support this extension",
	id: "support_menu",
	contexts: ["browser_action"],
});

menus.push({
	title: "⭐ Leave a review",
	contexts: ["browser_action"],
	id: "leave_a_review",
	parentId: "support_menu",
	onclick: function onclick(info, tab) {
		if (navigator.userAgent.search("Firefox") > -1) {
			browser.tabs.create({
				url: "https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/",
			});
		} else {
			browser.tabs.create({
				url: "https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff",
			});
		}
	},
});

menus.push({
	title: "☕ Donate to keep Extensions Alive",
	contexts: ["browser_action"],
	id: "donate",
	parentId: "support_menu",
	onclick: function onclick(info, tab) {
		browser.tabs.create({
			url: "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW",
		});
	},
});

menus.push({
	title: "💰 Become a Patron",
	contexts: ["browser_action"],
	id: "patron",
	parentId: "support_menu",
	onclick: function onclick(info, tab) {
		browser.tabs.create({
			url: "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW",
		});
	},
});

menus.push({
	title: "🐦 Follow on Twitter",
	contexts: ["browser_action"],
	id: "follow_x",
	parentId: "support_menu",
	onclick: function onclick(info, tab) {
		browser.tabs.create({ url: "https://www.twitter.com/mastef" });
	},
});

menus.push({
	title: "🤔 Issues and Suggestions",
	id: "code_menu",
	contexts: ["browser_action"],
});

menus.push({
	title: "🆕 View recent changes",
	contexts: ["browser_action"],
	id: "view_changes",
	parentId: "code_menu",
	onclick: function onclick(info, tab) {
		browser.tabs.create({ url: "changelog.html" });
	},
});

menus.push({
	title: "⚙ Edit Options",
	contexts: ["browser_action"],
	id: "edit_options",
	parentId: "code_menu",
	onclick: function onclick(info, tab) {
		browser.tabs.create({ url: "options.html" });
	},
});

menus.push({
	title: "💻 View source code",
	contexts: ["browser_action"],
	id: "view_source",
	parentId: "code_menu",
	onclick: function onclick(info, tab) {
		browser.tabs.create({
			url: "https://github.com/stefanXO/Tab-Manager-Plus",
		});
	},
});

menus.push({
	title: "🤔 Report an issue",
	contexts: ["browser_action"],
	id: "report",
	parentId: "code_menu",
	onclick: function onclick(info, tab) {
		browser.tabs.create({
			url: "https://github.com/stefanXO/Tab-Manager-Plus/issues",
		});
	},
});

menus.push({
	title: "💡 Send a suggestion",
	contexts: ["browser_action"],
	id: "send_sugg",
	parentId: "code_menu",
	onclick: function onclick(info, tab) {
		browser.tabs.create({
			url: "https://github.com/stefanXO/Tab-Manager-Plus/issues",
		});
		browser.tabs.create({ url: "mailto:markus+tmp@stefanxo.com" });
	},
});

async function setupListeners() {
	await browser.contextMenus.removeAll();

	for (const menu of menus) {
		const data = { ...menu };
		delete data.onclick;
		data.contexts = ["browser_action", "action"];
		await browser.contextMenus.create(data);
	}

	browser.contextMenus.onClicked.removeListener(contextClicked);
	browser.contextMenus.onClicked.addListener(contextClicked);

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

function contextClicked(info, tab) {
	const onclick = menus.find((menu) => menu.id === info.menuItemId)?.onclick;

	onclick?.(info, tab);
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	return function () {
		var context = this,
			args = arguments;
		var later = function later() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

async function windowFocus(windowId) {
	try {
		if (!!windowId) {
			await windowActive(windowId);
			// console.log("onFocused", windowId);
			hideWindows(windowId);
		}
	} catch (e) {}
}
function windowCreated(window) {
	try {
		if (!!window && !!window.id) {
			windowActive(window.id);
		}
	} catch (e) {}
	// console.log("onCreated", window.id);
}
function windowRemoved(windowId) {
	try {
		if (!!windowId) {
			windowActive(windowId);
		}
	} catch (e) {}
	// console.log("onRemoved", windowId);
}

async function hideWindows(windowId) {
	if (navigator.userAgent.search("Firefox") > -1) {
		return;
	}

	if (!windowId || windowId < 0) {
		return;
	} else {
		if (typeof (await getItem("hideWindows")) === "undefined")
			await setItem("hideWindows", "0");
		if ((await getItem("hideWindows")) == "0") return;

		var result = await browser.permissions.contains({
			permissions: ["system.display"],
		});
		if (result) {
			// The extension has the permissions.
			chrome.system.display.getInfo(
				async function (windowId, displaylayouts) {
					window.displayInfo = [];
					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;
					try {
						for (
							var _iterator = displaylayouts[Symbol.iterator](),
								_step;
							!(_iteratorNormalCompletion = (_step =
								_iterator.next()).done);
							_iteratorNormalCompletion = true
						) {
							var displaylayout = _step.value;
							window.displayInfo.push(displaylayout.bounds);
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (
								!_iteratorNormalCompletion &&
								_iterator.return
							) {
								_iterator.return();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}
					var windows = await browser.windows.getAll({
						populate: true,
					});
					var monitor = -1;
					for (var i = windows.length - 1; i >= 0; i--) {
						if (windows[i].id == windowId) {
							for (var a in window.displayInfo) {
								var result = is_in_bounds(
									windows[i],
									window.displayInfo[a]
								);
								if (result) {
									monitor = a;
								}
							}
						}
					}

					for (var i = windows.length - 1; i >= 0; i--) {
						if (windows[i].id != windowId) {
							if (
								is_in_bounds(
									windows[i],
									window.displayInfo[monitor]
								)
							) {
								await browser.windows.update(windows[i].id, {
									state: "minimized",
								});
							}
						}
					}
				}.bind(null, windowId)
			);
		}
	}
}

function is_in_bounds(object, bounds) {
	var C = object,
		B = bounds;
	if (C.left >= B.left && C.left <= B.left + B.width) {
		if (C.top >= B.top && C.top <= B.top + B.height) {
			return true;
		}
	}
	return false;
}

async function windowActive(windowId) {
	if (windowId < 0) return;
	var windows = JSON.parse(await getItem("windowAge"));
	if (windows instanceof Array) {
	} else {
		windows = [];
	}
	if (windows.indexOf(windowId) > -1)
		windows.splice(windows.indexOf(windowId), 1);
	windows.unshift(windowId);
	await setItem("windowAge", JSON.stringify(windows));

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
			focusOnTabAndWindow(
				window.tabsActive[window.tabsActive.length - 2]
			);
		}
	}
});

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.command == "reload_popup_controls") {
		setupPopup();
	}
});

(async function () {
	var windows = await browser.windows.getAll({ populate: true });
	await setItem("windowAge", JSON.stringify([]));
	if (!!windows && windows.length > 0) {
		windows.sort(function (a, b) {
			if (a.id < b.id) return 1;
			if (a.id > b.id) return -1;
			return 0;
		});
		for (var i = 0; i < windows.length; i++) {
			if (!!windows[i].id) await windowActive(windows[i].id);
		}
	}
})();

async function cleanUp() {
	var activewindows = await browser.windows.getAll({ populate: true });
	var windowids = [];
	for (var w of activewindows) {
		windowids.push(w.id);
	}
	// console.log("window ids...", windowids);
	var windows = JSON.parse(await getItem("windowAge"));
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
	}
	// console.log("after", JSON.parse(JSON.stringify(windows)));
	await setItem("windowAge", JSON.stringify(windows));

	var names = await getItem("windowNames");
	if (!!names) {
		names = JSON.parse(names);
	} else {
		names = {};
	}

	// console.log("before", JSON.parse(JSON.stringify(names)));
	for (var id of Object.keys(names)) {
		if (windowids.indexOf(parseInt(id)) < 0) {
			// console.log("did not find", id);
			delete names[id];
		}
	}
	// console.log("after", JSON.parse(JSON.stringify(names)));
	await setItem("windowNames", JSON.stringify(names));
}

setInterval(setupListeners, 300000);

setupListeners();
