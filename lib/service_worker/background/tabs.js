var browser = browser || chrome;

async function setupTabListeners() {
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
}

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

	browser.windows.update(windowId, {focused: true}).then(function (tabId, windowId) {
		browser.tabs.update(tabId, {active: true}).then(function (tabId, windowId) {
			tabActiveChanged({tabId: tabId, windowId: windowId});
		}.bind(this, tabId, windowId));
	}.bind(this, tabId, windowId));
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
		await browser.action.setBadgeText({text: count + ""});
		await browser.action.setBadgeBackgroundColor({color: "purple"});
		var toRemove = [];
		if (!!globalTabsActive) {
			for (var i = 0; i < globalTabsActive.length; i++) {
				var t = globalTabsActive[i];
				var found = false;
				if (!!result && !!result.length) {
					for (var j = 0; j < result.length; j++) {
						if (result[j].id == t.tabId) found = true;
					}
					;
				}
				if (!found) toRemove.push(i);
			}
			;
		}
		// console.log("to remove", toRemove);
		for (var i = toRemove.length - 1; i >= 0; i--) {
			// console.log("removing", toRemove[i]);
			if (!!globalTabsActive && globalTabsActive.length > 0) {
				if (!!globalTabsActive[toRemove[i]]) globalTabsActive.splice(toRemove[i], 1);
			}
		}
		;
	} else {
		await browser.action.setBadgeText({text: ""});
	}
}

function tabCountChanged() {
	updateTabCountDebounce();
}

async function tabAdded(tab) {
	var tabLimit = await getLocalStorage("tabLimit", 0);
	if (tabLimit > 0) {
		if (tab.id != browser.tabs.TAB_ID_NONE) {
			var tabCount = await browser.tabs.query({currentWindow: true});
			if (tabCount.length > tabLimit) {
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
		}
		globalTabsActive.push(tab);
	}
	updateTabCountDebounce();
}

async function checkTabCreate(tab) {
	await checkWindow(tab.windowId);
}

async function checkTabUpdate(tabid, changeinfo, tab) {
	await checkWindow(tab.windowId);
}

async function checkTabRemove(tabid, removeinfo) {
	if (removeinfo.isWindowClosing) return;
	await checkWindow(removeinfo.windowId);
}

async function checkTabDetached(tabid, detachinfo) {
	await checkWindow(detachinfo.oldWindowId);
}

async function checkTabAttached(tabid, attachinfo) {
	await checkWindow(attachinfo.newWindowId);
}

async function checkTabMoved(tabid, moveinfo) {
	await checkWindow(moveinfo.windowId);
}