"use strict";

import { globalTabsActive, tabsActiveLoaded, persistTabsActive } from '@context'
import * as S from "@strings";
import { focusOnWindow, focusOnWindowDelayed, createWindowWithTabs, createWindowWithSessionTabs, hashcode } from '@background/windows';
import { getLocalStorageMap, setLocalStorageMap } from "@helpers/storage";
import { setupPopup } from "@ui/open";
import { updateTabCount, discardTabs, moveTabsToWindow, closeTabs, focusOnTabAndWindow, focusOnTabAndWindowDelayed } from "@background/tabs";
import * as browser from 'webextension-polyfill';
import { ICommand } from '@types';

// Returning the handler's promise keeps the message channel open until the
// work is done, which also keeps the MV3 service worker alive for the whole
// operation (e.g. restoring a large session). Unknown commands return nothing
// so the channel is released immediately.
export function handleMessages(message : unknown, sender : browser.Runtime.MessageSender) {
	const request = message as ICommand;

	switch (request.command) {
		case S.reload_popup_controls:
			return setupPopup();
		case S.update_tab_count:
			return updateTabCount();
		case S.discard_tabs:
			return discardTabs(request.tabs);
		case S.move_tabs_to_window:
			return moveTabsToWindow(request.window_id, request.tabs);
		case S.focus_on_tab_and_window:
			if (!!request.tab) {
				return focusOnTabAndWindow(request.tab.id, request.tab.windowId);
			} else {
				return focusOnTabAndWindow(request.saved_tab.tabId, request.saved_tab.windowId);
			}
		case S.focus_on_tab_and_window_delayed:
			if (!!request.tab) {
				focusOnTabAndWindowDelayed(request.tab.id, request.tab.windowId);
			} else {
				focusOnTabAndWindowDelayed(request.saved_tab.tabId, request.saved_tab.windowId);
			}
			break;
		case S.focus_on_window:
			return focusOnWindow(request.window_id);
		case S.focus_on_window_delayed:
			focusOnWindowDelayed(request.window_id);
			break;
		case S.set_window_color:
			return setWindowColor(request.window_id, request.color);
		case S.set_window_name:
			return setWindowName(request.window_id, request.name);
		case S.create_window_with_tabs:
			return createWindowWithTabs(request.tabs, request.incognito);
		case S.create_window_with_session_tabs:
			return createWindowWithSessionTabs(request.session, request.tab_id);
		case S.close_tabs:
			return closeTabs(request.tabs);
	}
}

export async function handleCommands(command : string) {
	if (command === S.switch_to_previous_active_tab) {
		await tabsActiveLoaded;
		if (!!globalTabsActive && globalTabsActive.length > 1) {
			var _tab = globalTabsActive[globalTabsActive.length - 2];
			await focusOnTabAndWindow(_tab.tabId, _tab.windowId);
		}
	}
}

export async function trackLastTab(tab : browser.Tabs.OnActivatedActiveInfoType) {
	if (!!tab && !!tab.tabId) {
		await tabsActiveLoaded;
		if (!!globalTabsActive && globalTabsActive.length > 0) {
			var lastActive = globalTabsActive[globalTabsActive.length - 1];
			if (!!lastActive && lastActive.tabId === tab.tabId && lastActive.windowId === tab.windowId) {
				return;
			}
		}
		while (globalTabsActive.length > 20) {
			globalTabsActive.shift();
		}
		for (let i = globalTabsActive.length - 1; i >= 0; i--) {
			if (globalTabsActive[i].tabId === tab.tabId) {
				globalTabsActive.splice(i, 1);
			}
		}
		globalTabsActive.push(tab);
		persistTabsActive();
	}
}

export async function setWindowColor(windowId : number, color : string) {
	var colors : Map<number, string> = await getLocalStorageMap<number, string>(S.windowColors);
	if (!!color) {
		colors.set(windowId, color);
	} else {
		colors.delete(windowId);
	}
	await setLocalStorageMap(S.windowColors, colors);
	await updateWindowHash(windowId);
	browser.runtime.sendMessage<ICommand>({
		command: S.refresh_windows,
		window_ids: [windowId]
	});
}

export async function setWindowName(windowId: number, name : string) {
	var names : Map<number, string> = await getLocalStorageMap<number, string>(S.windowNames);
	if (!!name) {
		names.set(windowId, name);
	} else {
		names.delete(windowId);
	}
	await setLocalStorageMap(S.windowNames, names);
	await updateWindowHash(windowId);
	browser.runtime.sendMessage<ICommand>({
		command: S.refresh_windows,
		window_ids: [windowId]
	});
}

async function updateWindowHash(windowId : number) {
	const window = await browser.windows.get(windowId, {populate: true});
	const hash = hashcode(window);
	const hashes : Map<number, number> = await getLocalStorageMap<number, number>(S.windowHashes);
	hashes.set(windowId, hash);
	await setLocalStorageMap(S.windowHashes, hashes);
}