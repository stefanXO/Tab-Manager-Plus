"use strict";

var browser = browser || chrome;

var stringkeys = [
	"layout"
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

	for (var key of stringkeys) {
		if (!!localStorage[key]) { needsMigration = true; break; }
	}

	for (var key of boolkeys) {
		if (!!localStorage[key]) { needsMigration = true; break; }
	}

	for (var key of jsonkeys) {
		if (!!localStorage[key]) { needsMigration = true; break; }
	}

	if (needsMigration) {
		var values = await browser.storage.local.get(null);
		values = values || {};
		// delete all values that don't have a tabs array
		for (var key in values) {
			if (!!values[key].tabs) {
				await browser.storage.local.remove(key);
			} else {
				delete values[key];
			}
		}
		var keyValue = {};
		keyValue["sessions"] = values;
		for (var key of stringkeys) {
			if (!!localStorage[key]) keyValue[key] = localStorage[key];
		}

		for (var key of boolkeys) {
			if (!!localStorage[key]) keyValue[key] = toBoolean(localStorage[key]);
		}

		for (var key of jsonkeys) {
			if (!!localStorage[key]) keyValue[key] = JSON.parse(localStorage[key]);
		}
		await browser.storage.local.set(keyValue);

		// clear old localstorage
		for (var key of stringkeys) localStorage.removeItem(key);
		for (var key of boolkeys) localStorage.removeItem(key);
		for (var key of jsonkeys) localStorage.removeItem(key);

	}
})();

function toBoolean(str)
{
	if (typeof str === "undefined" || str === null) {
		return false;
	} else if (typeof str === "string") {
		switch (str.toLowerCase()) {
			case "false":
			case "no":
			case "0":
			case "":
				return false;
			default:
				return true;
		}
	} else if (typeof str === "number") {
		return str !== 0;
	} else {
		return true;
	}
}