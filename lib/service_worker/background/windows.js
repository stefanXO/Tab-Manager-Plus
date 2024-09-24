var browser = browser || chrome;

async function setupWindowListeners() {
	browser.windows.onFocusChanged.removeListener(windowFocus);
	browser.windows.onCreated.removeListener(windowCreated);
	browser.windows.onRemoved.removeListener(windowRemoved);

	browser.windows.onFocusChanged.addListener(windowFocus);
	browser.windows.onCreated.addListener(windowCreated);
	browser.windows.onRemoved.addListener(windowRemoved);
}

async function createWindowWithTabs(tabs, isIncognito) {
	var pinnedIndex = 0;
	var firstTab = tabs.shift();
	var t = [];
	for (var i = 0; i < tabs.length; i++) {
		t.push(tabs[i].id);
	}
	;

	var firstPinned = firstTab.pinned;
	var w = await browser.windows.create({tabId: firstTab.id, incognito: !!isIncognito});
	if (firstPinned) {
		await browser.tabs.update(w.tabs[0].id, {pinned: firstPinned});
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
				movedTabs = await browser.tabs.move(oldTabId, {windowId: w.id, index: -1});
			} else {
				movedTabs = await browser.tabs.move(oldTabId, {windowId: w.id, index: pinnedIndex++});
			}
			if (movedTabs.length > 0) {
				var newTab = movedTabs[0];
				if (tabPinned) {
					await browser.tabs.update(newTab.id, {pinned: tabPinned});
				}
			}
		}
		;
	}
	await browser.windows.update(w.id, {focused: true});
}

async function createWindowWithSessionTabs(window, tabId) {

	var customName = false;
	if (window && window.name && window.customName) {
		customName = window.name;
	}
	var color = "default";
	if (window && window.color) {
		color = window.color;
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
		console.log("setting name");
		setWindowName(newWindow.id, customName);
	}

	if (color != "default") {
		console.log("setting color");
		setWindowColor(newWindow.id, color);
	}

	await browser.windows.update(newWindow.id, {focused: true});
}

function focusOnWindowDelayed(windowId) {
	setTimeout(focusOnWindow.bind(this, windowId), 125);
}

async function focusOnWindow(windowId) {
	await browser.windows.update(windowId, {focused: true});
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

		var result = await browser.permissions.contains({permissions: ['system.display']});
		if (result) {
			// The extension has the permissions.
			chrome.system.display.getInfo(async function (windowId, displaylayouts) {
				globalDisplayInfo = [];
				var _iteratorNormalCompletion = true;
				var _didIteratorError = false;
				var _iteratorError = undefined;
				try {
					for (var _iterator = displaylayouts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
						var displaylayout = _step.value;
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
				var windows = await browser.windows.getAll({populate: true});
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
				}
				;

				for (var i = windows.length - 1; i >= 0; i--) {
					if (windows[i].id != windowId) {
						if (is_in_bounds(windows[i], globalDisplayInfo[monitor])) {
							await browser.windows.update(windows[i].id, {"state": "minimized"});
						}
					}
				}
				;
			}.bind(null, windowId));
		}
	}
}

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

async function windowFocus(windowId) {
	try {
		if (!!windowId) {
			await windowActive(windowId);
			// console.log("onFocused", windowId);
			await hideWindows(windowId);
		}
	} catch (e) {

	}
}

async function windowCreated(window) {
	try {
		if (!!window && !!window.id) {
			await windowActive(window.id);
		}
	} catch (e) {

	}
	// console.log("onCreated " + window.id, window);
	setTimeout(cleanupDebounce, 250);
}

async function windowRemoved(windowId) {
	try {
		if (!!windowId) {
			await windowActive(windowId);
		}
	} catch (e) {

	}
	// console.log("onRemoved", windowId);
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