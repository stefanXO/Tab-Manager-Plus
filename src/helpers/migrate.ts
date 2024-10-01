"use strict";
import { toBoolean } from "./utils.js";
import * as S from "@strings";
import * as browser from 'webextension-polyfill';
import {ISavedSession} from "@types";

const stringkeys = [
	"layout",
	"version"
];

const jsonkeys = [
	"tabLimit",
	"tabWidth",
	"tabHeight",
	"windowAge",
	S.windowNames,
	S.windowColors
];

const boolkeys = [
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

	let needsMigration = false;

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
		let keyValue = {};
		let values : Record<string, unknown> = await browser.storage.local.get(null);
		if (!!values) {
			// delete all values that don't have a tabs array
			for (const key in values) {
				if (!!(values[key] as ISavedSession).tabs) {
					console.log("session deleting " + key);
					await browser.storage.local.remove(key);
				} else {
					delete values[key];
				}
			}
			keyValue["sessions"] = values;
		}

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