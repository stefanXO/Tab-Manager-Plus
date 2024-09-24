var browser = browser || chrome;

async function openPopup() {
	var openInOwnTab = await getLocalStorage("openInOwnTab", false);
	if (openInOwnTab) {
		await browser.action.setPopup({popup: "popup.html?popup=true"});
		await browser.action.openPopup();
		await browser.action.setPopup({popup: ""});
	} else {
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
			if (currentTab && currentTab.tabId && tab.id == currentTab.tabId && previousTab && previousTab.tabId) {
				return focusOnTabAndWindow(previousTab);
			} else {
				return browser.windows.update(tab.windowId, {focused: true}).then(
					function () {
						browser.tabs.highlight({windowId: tab.windowId, tabs: tab.index});
					}.bind(this)
				);
			}
		}
	}
	return browser.tabs.create({url: "popup.html"});
}

async function setupPopup() {

	var openInOwnTab = await getLocalStorage("openInOwnTab", false);

	await browser.action.onClicked.removeListener(openAsOwnTab);
	if (openInOwnTab) {
		await browser.action.setPopup({popup: ""});
		await browser.action.onClicked.addListener(openAsOwnTab);
	} else {
		await browser.action.setPopup({popup: "popup.html?popup=true"});
	}
	if (browser.sidebarAction) {
		browser.sidebarAction.setPanel({panel: "popup.html?panel=true"});
	}
}