"use strict";

import {getLocalStorage} from "@helpers/storage";
import {globalTabsActive} from '@context';
import {focusOnTabAndWindow} from "@background/tabs";
import * as browser from 'webextension-polyfill';

export async function openSidebar() {
	await browser.sidebarAction.open();
}

export async function openPopup() {
	const openInOwnTab : boolean = await getLocalStorage("openInOwnTab", false);
	if (openInOwnTab) {
		await browser.action.setPopup({popup: "popup.html?popup=true"});
		await browser.action.openPopup();
		await browser.action.setPopup({popup: ""});
	} else {
		await browser.action.openPopup();
	}
}

export async function openAsOwnTab() {
	const popup_page = await browser.runtime.getURL("popup.html");
	const tabs = await browser.tabs.query({});

	let currentTab : browser.Tabs.OnActivatedActiveInfoType;
	let previousTab : browser.Tabs.OnActivatedActiveInfoType;

	if (!!globalTabsActive && globalTabsActive.length > 1) {
		currentTab = globalTabsActive[globalTabsActive.length - 1];
		previousTab = globalTabsActive[globalTabsActive.length - 2];
	}

	for (var i = 0; i < tabs.length; i++) {
		const tab = tabs[i];
		if (tab.url.indexOf("popup.html") > -1 && tab.url.indexOf(popup_page) > -1) {
			if (currentTab && currentTab.tabId && tab.id === currentTab.tabId && previousTab && previousTab.tabId) {
				await focusOnTabAndWindow(previousTab.tabId, previousTab.windowId);
				return;
			} else {
				await browser.windows.update(tab.windowId, {focused: true});
				await browser.tabs.highlight({windowId: tab.windowId, tabs: tab.index});
				return;
			}
		}
	}
	await browser.tabs.create({url: "popup.html"});
}

export async function setupPopup() {

	const openInOwnTab = await getLocalStorage("openInOwnTab", false);

	browser.action.onClicked.removeListener(openAsOwnTab);
	if (openInOwnTab) {
		await browser.action.setPopup({popup: ""});
		browser.action.onClicked.addListener(openAsOwnTab);
	} else {
		await browser.action.setPopup({popup: "popup.html?popup=true"});
	}
	if (browser.sidebarAction) {
		await browser.sidebarAction.setPanel({panel: "popup.html?panel=true"});
	}
}