"use strict";

import {migrated} from '@helpers/migrate';
import {readBootCache} from "@helpers/settings";
import {fetchBootData} from "./boot";
import * as browser from 'webextension-polyfill';
import {TabManager} from '@views';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

declare global {
	interface Window {
		inPopup: boolean;
		inPanel: boolean;
		optionPage: boolean;
		extensionVersion: string;
	}
}

window.inPopup = window.location.search.indexOf("?popup") > -1;
window.inPanel = window.location.search.indexOf("?panel") > -1;
window.extensionVersion = process.env.VERSION;


async function switchToOwnTab() : Promise<boolean> {
	const page = browser.runtime.getURL("popup.html");
	const tabs = await browser.tabs.query({});
	const current = await browser.windows.getLastFocused();
	const own = tabs
		.filter((tab) => (tab.url || tab.pendingUrl || "") === page)
		.sort((a, b) => (a.windowId === current.id ? 0 : 1) - (b.windowId === current.id ? 0 : 1))[0];
	if (!own) return false;
	await browser.windows.update(own.windowId, {focused: true});
	await browser.tabs.update(own.id, {active: true});
	return true;
}

// the popup's own size comes from the settings; the browser action popup has
// no size of its own until the body has one
function sizePopup(width : number, height : number) {
	if (height > 0 && width > 0) {
		document.body.style.width = width + "px";
		document.body.style.height = height + "px";
	}
	let minHeight = parseInt(document.body.style.height.split("px")[0]) || 0;
	if (minHeight < 300) {
		minHeight = 400;
	} else {
		minHeight++;
		if (minHeight > 600) minHeight = 600;
	}
	document.body.style.minHeight = minHeight + "px";
}

// own tab and sidebar fill the page
function sizePage() {
	if (window.inPanel) {
		document.documentElement.style.maxHeight = "auto";
		document.documentElement.style.maxWidth = "auto";
		document.body.style.maxHeight = "auto";
		document.body.style.maxWidth = "auto";
	}
	document.documentElement.style.maxHeight = "100%";
	document.documentElement.style.maxWidth = "100%";
	document.documentElement.style.height = "100%";
	document.documentElement.style.width = "100%";
	document.body.style.maxHeight = "100%";
	document.body.style.maxWidth = "100%";
	document.body.style.height = "100%";
	document.body.style.width = "100%";
}

// set while a boot runs or once it succeeded; a failed boot clears it and retries
let booting = false;
let attempts = 0;

async function loadApp() {
	if (booting) return;
	try {
		booting = true;

		// 1. synchronous: size and theme from the cache of the last run, so the
		//    very first frame has the right popup size and colours
		const cache = readBootCache();
		if (cache.dark) document.body.className = "dark";
		if (window.inPopup) sizePopup(cache.tabWidth || 0, cache.tabHeight || 0);
		else sizePage();

		// 2. everything the first render needs, in parallel: the own-tab check
		//    (a Tab Manager tab already open means the popup closes instead),
		//    settings, windows, their order and last-active times
		const [own, boot] = await Promise.all([
			window.inPopup ? switchToOwnTab() : Promise.resolve(false),
			migrated.then(() => fetchBootData(window.extensionVersion))
		]);
		if (own) {
			window.close();
			return;
		}
		document.body.className = boot.settings.dark ? "dark" : "";
		if (window.inPopup) sizePopup(boot.settings.tabWidth, boot.settings.tabHeight);

		const container = document.getElementById('TMP');
		const root = createRoot(container!);
		root.render(
			<TabManager optionsActive={!!window.optionPage} boot={boot}/>
		);
	} catch (err) {
		console.error(err);
		booting = false;
		// a storage or API call rejected at boot: try again a few times, then
		// give up. A slow machine does not land here, its awaits just take
		// longer and resolve.
		if (attempts++ < 10) setTimeout(loadApp, 250 * attempts);
	}
}

window.addEventListener("contextmenu", function (e) {
	e.preventDefault();
});

loadApp();
