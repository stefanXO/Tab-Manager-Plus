"use strict";
import * as browser from 'webextension-polyfill';

export let globalTabsActive : browser.Tabs.OnActivatedActiveInfoType[] = [];

// MV3 service workers are suspended after ~30s of inactivity and lose all
// module state, which used to silently break switch_to_previous_active_tab.
// storage.session survives worker restarts (but not browser restarts), so the
// active-tab history is mirrored there.
export const tabsActiveLoaded : Promise<void> = (async function () {
	try {
		const stored = await browser.storage.session.get({globalTabsActive: []});
		if (stored.globalTabsActive instanceof Array && globalTabsActive.length === 0) {
			globalTabsActive.push(...(stored.globalTabsActive as browser.Tabs.OnActivatedActiveInfoType[]));
		}
	} catch (e) {
		console.error(e);
	}
})();

export function persistTabsActive() : Promise<void> {
	return browser.storage.session.set({globalTabsActive: globalTabsActive}).catch(function (e) {
		console.error(e);
	});
}

// drops a closed tab from the history so the previous-tab shortcut never
// targets it
export async function forgetTab(tabId : number) {
	await tabsActiveLoaded;
	let changed = false;
	for (let i = globalTabsActive.length - 1; i >= 0; i--) {
		if (globalTabsActive[i].tabId === tabId) {
			globalTabsActive.splice(i, 1);
			changed = true;
		}
	}
	if (changed) await persistTabsActive();
}
