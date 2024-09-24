"use strict";

importScripts('../../vendor/babel-polyfill.js');
importScripts('../../vendor/browser-polyfill.min.js');

importScripts('../helpers/storage.js');
importScripts('../helpers/utils.js');

importScripts('./background/actions.js');
importScripts('./background/windows.js');
importScripts('./background/tabs.js');
importScripts('./background/tracking.js');

importScripts('./ui/context_menus.js');
importScripts('./ui/open.js');

var browser = browser || chrome;
var globalTabsActive = [];
var globalDisplayInfo = [];

browser.runtime.onStartup.addListener(
	async function () {
		console.log(" ON STARTUP");
	}
);

browser.runtime.onSuspend.addListener(
	async function () {
		console.log(" ON SUSPEND");
	}
);

var updateTabCountDebounce = debounce(updateTabCount, 250);
var cleanupDebounce = debounce(cleanUp, 500);

async function openSidebar() {
	await browser.sidebarAction.open();
}

async function setup() {
	await setupContextMenus();
	await setupPopup();
	await setupTabListeners();
	await setupWindowListeners();

	updateTabCountDebounce();

	setTimeout(cleanupDebounce, 2500);
}

browser.commands.onCommand.addListener(handleCommands);
browser.runtime.onMessage.addListener(handleMessages);

(async function () {
	var windows = await browser.windows.getAll({ populate: true });
	await setLocalStorage("windowAge", []);
	if (!!windows && windows.length > 0) {
		windows.sort(function (a, b) {
			if (a.id < b.id) return 1;
			if (a.id > b.id) return -1;
			return 0;
		});
		for (var i = 0; i < windows.length; i++) {
			if (!!windows[i].id) await windowActive(windows[i].id);
		};
	}
})();

setInterval(setup, 300000);

setup();