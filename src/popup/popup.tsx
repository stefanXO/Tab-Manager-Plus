"use strict";

import {migrated} from '@helpers/migrate';
import {getLocalStorage} from "@helpers/storage";
import * as browser from 'webextension-polyfill';
import {TabManager} from '@views';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

declare global {
	interface Window {
		loaded: boolean;
		loading: boolean;
		inPopup: boolean;
		inPanel: boolean;
		optionPage: boolean;
		extensionVersion: string;
	}
}

window.loaded = false;
window.loading = false;
window.inPopup = window.location.search.indexOf("?popup") > -1;
window.inPanel = window.location.search.indexOf("?panel") > -1;
window.extensionVersion = process.env.VERSION;

window.onload = () => window.requestAnimationFrame(loadApp);

setTimeout(loadApp, 25);
setTimeout(loadApp, 75);
setTimeout(loadApp, 125);
setTimeout(loadApp, 250);
setTimeout(loadApp, 375);
setTimeout(loadApp, 700);
setTimeout(loadApp, 1000);
setTimeout(loadApp, 2000);
setTimeout(loadApp, 3000);
setTimeout(loadApp, 5000);
setTimeout(loadApp, 15000);

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

async function loadApp() {
	if (!!window.loaded) return;
	if (!!window.loading) return;
	try {
		window.loading = true;
		// A Tab Manager tab is already open (opened from the icon's menu or by
		// the "open in own tab" setting): the popup is the wrong place, switch
		// to that tab instead. The tab's url is popup.html without a query.
		if (window.inPopup && await switchToOwnTab()) {
			window.close();
			return;
		}
		// the migration writes tabHeight/tabWidth and the TabManager settings;
		// reading them earlier would race it and write defaults on top
		await migrated;
		let height : number = await getLocalStorage("tabHeight", 600);
		let width : number = await getLocalStorage("tabWidth", 800);
		console.log(height, width);
		if (window.inPopup) {

			if (height > 0 && width > 0) {
				document.body.style.width = width + "px";
				document.body.style.height = height + "px";
			}

			const _root = document.getElementById("root");
			if (_root != null) {
				var _height = parseInt(document.body.style.height.split("px")[0]) || 0;
				if (_height < 300) {
					_height = 400;
					document.body.style.minHeight = _height + "px";
				} else {
					_height++;
					if (_height > 600) _height = 600;
					document.body.style.minHeight = _height + "px";
				}
			}
		} else {
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

		if (!!window.loaded) return;
		window.loaded = true;

		const container = document.getElementById('TMP');
		const root = createRoot(container!);
		root.render(
			<TabManager optionsActive={!!window.optionPage}/>
		);
	} catch (err) {
		console.error(err);
		window.loading = false;
		window.loaded = false;
	}
}

window.addEventListener("contextmenu", function (e) {
	e.preventDefault();
});

loadApp();
