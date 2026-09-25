"use strict";

import * as browser from 'webextension-polyfill';

// The four layouts, by their storage value. The user-facing names live in
// TabManager.readablelayout().
export const LAYOUT = {
	blocks: "blocks",
	blocksBig: "blocks-big",
	rows: "horizontal",
	list: "vertical"
} as const;
export type Layout = typeof LAYOUT[keyof typeof LAYOUT];

// The settings as stored in storage.local: one place for the keys and their
// defaults, typed access for the popup and the worker alike.
export interface Settings {
	layout : Layout;
	tabLimit : number;
	tabWidth : number;
	tabHeight : number;
	animations : boolean;
	windowTitles : boolean;
	tabactions : boolean;
	badge : boolean;
	openInOwnTab : boolean;
	compact : boolean;
	dark : boolean;
	sessionsFeature : boolean;
	hideWindows : boolean;
	"filter-tabs" : boolean;
}

export const SETTING_DEFAULTS : Settings = {
	layout: LAYOUT.blocks,
	tabLimit: 0,
	tabWidth: 800,
	tabHeight: 600,
	animations: true,
	windowTitles: true,
	tabactions: true,
	badge: true,
	openInOwnTab: false,
	compact: false,
	dark: false,
	sessionsFeature: false,
	hideWindows: false,
	"filter-tabs": false
};

// Reads the settings, writes back only the ones that are missing (plus the
// version). Writing every key from a snapshot would overwrite whatever the
// worker changed in the meantime: window names, colors, the window order.
export async function readSettings(version : string) : Promise<Settings> {
	const stored = await browser.storage.local.get(Object.keys(SETTING_DEFAULTS));
	const missing : Record<string, unknown> = { version: version };
	for (const key of Object.keys(SETTING_DEFAULTS)) {
		if (stored[key] === undefined || (key === "layout" && !stored[key])) missing[key] = SETTING_DEFAULTS[key];
	}
	await browser.storage.local.set(missing);
	return { ...SETTING_DEFAULTS, ...stored, ...missing } as Settings;
}

export async function getSetting<K extends keyof Settings>(key : K) : Promise<Settings[K]> {
	const result = await browser.storage.local.get({ [key]: SETTING_DEFAULTS[key] });
	return result[key] as Settings[K];
}

export function saveSetting<K extends keyof Settings>(key : K, value : Settings[K]) : Promise<void> {
	return browser.storage.local.set({ [key]: value });
}
