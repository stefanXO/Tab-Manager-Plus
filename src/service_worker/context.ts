"use strict";
import * as browser from 'webextension-polyfill';

export let globalTabsActive : browser.Tabs.OnActivatedActiveInfoType[] = [];

// MV3 service workers are suspended after ~30s of inactivity and lose all
// module state, which used to silently break switch_to_previous_active_tab.
// storage.session survives worker restarts (but not browser restarts), so the
// active-tab history is mirrored there. On Firefox MV2 the background page is
// persistent and storage.session may not exist, so the in-memory array alone
// keeps the old behavior.
const sessionStorageArea = !!browser.storage ? browser.storage.session : undefined;

export const tabsActiveLoaded : Promise<void> = (async function () {
	if (!sessionStorageArea) return;
	try {
		const stored = await sessionStorageArea.get({globalTabsActive: []});
		if (stored.globalTabsActive instanceof Array && globalTabsActive.length === 0) {
			globalTabsActive.push(...(stored.globalTabsActive as browser.Tabs.OnActivatedActiveInfoType[]));
		}
	} catch (e) {
		console.error(e);
	}
})();

export function persistTabsActive() {
	if (!sessionStorageArea) return;
	sessionStorageArea.set({globalTabsActive: globalTabsActive}).catch(function (e) {
		console.error(e);
	});
}
