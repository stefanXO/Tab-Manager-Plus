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

export async function discardTabs(tabs) {
	for (const tab of tabs) {
		if (!tab.discarded) {
			browser.tabs.discard(tab.id).catch(function (e) {
				console.error(e);
				console.log(e.message);
			});
		}
	}
}

export async function closeTabs(tabs) {
	for (const tab of tabs) {
		await browser.tabs.remove(item.id);
	}
}

export async function moveTabsToWindow(windowId, tabs) {
	for (const tab of tabs) {
		await browser.tabs.move(tab.id, {windowId: windowId, index: -1});
		await browser.tabs.update(tab.id, {pinned: tab.pinned});
	}
}

export function focusOnTabAndWindowDelayed(tab) {
	var _tab = JSON.parse(JSON.stringify(tab));
	setTimeout(focusOnTabAndWindow.bind(this, _tab), 125);
}

export async function focusOnTabAndWindow(tab) {
	var windowId = tab.windowId;
	var tabId;
	if (!!tab.tabId) {
		tabId = tab.tabId;
	} else {
		tabId = tab.id;
	}

	await browser.windows.update(windowId, {focused: true});
	await browser.tabs.update(tabId, {active: true});
	await tabActiveChanged({tabId: tabId, windowId: windowId});
}

export async function updateTabCount() {
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
		var _to_remove = [];

		if (!!globalTabsActive) {
			for (let i = 0; i < globalTabsActive.length; i++) {
				var t = globalTabsActive[i];
				var found = false;
				if (!!result && !!result.length) {
					for (let j = 0; j < result.length; j++) {
						if (result[j].id === t.tabId) found = true;
					}
				}
				if (!found) _to_remove.push(i);
			}
		}

		while (_to_remove.length > 0) {
			let index = _to_remove.pop();
			// console.log("removing", toRemove[i]);
			if (!!globalTabsActive && globalTabsActive.length > 0) {
				if (!!globalTabsActive[index]) globalTabsActive.splice(index, 1);
			}
		}

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
		if (tab.id !== browser.tabs.TAB_ID_NONE) {
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