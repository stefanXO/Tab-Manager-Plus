"use strict";
import { toBoolean } from "./utils.js";

var browser = browser || chrome;

var stringkeys = [
	"layout",
	"version"
];

var jsonkeys = [
	"tabLimit",
	"tabWidth",
	"tabHeight",
	"windowAge",
	"windowNames",
	"windowColors"
];

var boolkeys = [
	"openInOwnTab",
	"animations",
	"windowTitles",
	"compact",
	"dark",
	"tabactions",
	"badge",
	"sessionsFeature",
	"hideWindows",
	"filter-tabs"
];

(async function () {

	var needsMigration = false;

	for (const key of stringkeys) {
		if (!!localStorage[key]) { needsMigration = true; break; }
	}

	for (const key of boolkeys) {
		if (!!localStorage[key]) { needsMigration = true; break; }
	}

	for (const key of jsonkeys) {
		if (!!localStorage[key]) { needsMigration = true; break; }
	}

	if (needsMigration) {
		var values = await browser.storage.local.get(null);
		values = values || {};
		// delete all values that don't have a tabs array
		for (const key in values) {
			if (!!values[key].tabs) {
				console.log("session deleting " + key);
				await browser.storage.local.remove(key);
			} else {
				delete values[key];
			}
		}
		var keyValue = {};
		keyValue["sessions"] = values;
		for (const key of stringkeys) {
			if (!!localStorage[key]) keyValue[key] = localStorage[key];
		}

		for (const key of boolkeys) {
			if (!!localStorage[key]) keyValue[key] = toBoolean(localStorage[key]);
		}

		for (const key of jsonkeys) {
			if (!!localStorage[key]) keyValue[key] = JSON.parse(localStorage[key]);
		}
		await browser.storage.local.set(keyValue);

		// clear old localstorage
		for (const key of stringkeys) localStorage.removeItem(key);
		for (const key of boolkeys) localStorage.removeItem(key);
		for (const key of jsonkeys) localStorage.removeItem(key);

	}
})();