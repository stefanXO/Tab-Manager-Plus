"use strict";

import {getLocalStorage} from "@helpers/storage";
import {globalTabsActive, tabsActiveLoaded} from '@context';
import {focusOnTabAndWindow} from "@background/tabs";
import * as browser from 'webextension-polyfill';
import {getSetting} from "@helpers/settings";

export async function openSidebar() {
	await browser.sidebarAction.open();
}

export async function openPopup() {
	const openInOwnTab : boolean = await getSetting("openInOwnTab");
	if (openInOwnTab) {
		await browser.action.setPopup({popup: "popup.html?popup=true"});
		await browser.action.openPopup();
		await browser.action.setPopup({popup: ""});
	} else {
		await browser.action.openPopup();
	}
}

export async function openAsOwnTab() {
	const popup_page = browser.runtime.getURL("popup.html");
	const tabs = await browser.tabs.query({});

	let currentTab : browser.Tabs.OnActivatedActiveInfoType;
	let previousTab : browser.Tabs.OnActivatedActiveInfoType;

	await tabsActiveLoaded;
	if (!!globalTabsActive && globalTabsActive.length > 1) {
		currentTab = globalTabsActive[globalTabsActive.length - 1];
		previousTab = globalTabsActive[globalTabsActive.length - 2];
	}

	// an open Tab Manager tab, the one in the current window first. url can be
	// missing on tabs the extension may not see (incognito), hence the guard
	const current = await browser.windows.getLastFocused();
	const existing = tabs
		.filter((tab) => (tab.url || tab.pendingUrl || "").startsWith(popup_page))
		.sort((a, b) => (a.windowId === current.id ? 0 : 1) - (b.windowId === current.id ? 0 : 1))[0];

	if (existing) {
		// clicking the icon while already on the Tab Manager tab toggles back
		if (currentTab && currentTab.tabId === existing.id && previousTab && previousTab.tabId) {
			await focusOnTabAndWindow(previousTab.tabId, previousTab.windowId);
		} else {
			await focusOnTabAndWindow(existing.id, existing.windowId);
		}
		return;
	}
	await browser.tabs.create({url: "popup.html"});
}

// must stay synchronous: it runs during the service worker's first event loop
// turn so that the click that woke the worker is not missed. onClicked only
// fires while no popup url is set, so registering unconditionally is safe -
// setupPopup() below decides which mode is active via setPopup.
export function setupPopupListeners() {
	browser.action.onClicked.removeListener(openAsOwnTab);
	browser.action.onClicked.addListener(openAsOwnTab);
}

export async function setupPopup() {

	const openInOwnTab = await getSetting("openInOwnTab");

	if (openInOwnTab) {
		await browser.action.setPopup({popup: ""});
	} else {
		await browser.action.setPopup({popup: "popup.html?popup=true"});
	}
	if (browser.sidebarAction) {
		await browser.sidebarAction.setPanel({panel: "popup.html?panel=true"});
	}
}