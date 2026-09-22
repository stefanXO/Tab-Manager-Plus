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
		let oldSessionKeys : string[] = [];
		let values : Record<string, unknown> = await browser.storage.local.get(null);
		if (!!values) {
			// keep whatever an earlier (possibly interrupted) migration already
			// consolidated - it must never be overwritten with an empty object
			let sessions : Record<string, unknown> = {};
			if (!!values["sessions"] && typeof values["sessions"] === "object") {
				sessions = values["sessions"] as Record<string, unknown>;
			}

			// collect all old per-session entries (the values with a tabs array)
			for (const key in values) {
				if (key === "sessions") continue;
				const value = values[key];
				if (!!value && typeof value === "object" && !!(value as ISavedSession).tabs) {
					console.log("session migrating " + key);
					sessions[key] = value;
					oldSessionKeys.push(key);
				}
			}
			keyValue["sessions"] = sessions;
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

		// write the consolidated data BEFORE removing anything, so an
		// interrupted migration can be re-run without losing sessions
		await browser.storage.local.set(keyValue);

		// only now remove the old per-session entries and localstorage flags
		if (oldSessionKeys.length > 0) {
			await browser.storage.local.remove(oldSessionKeys);
		}
		for (const key of stringkeys) localStorage.removeItem(key);
		for (const key of boolkeys) localStorage.removeItem(key);
		for (const key of jsonkeys) localStorage.removeItem(key);
	}
})().catch(function (e) {
	// nothing has been removed yet if the consolidating write failed, and the
	// localStorage flags are still set, so the migration re-runs next time
	console.error("migration failed", e);
});