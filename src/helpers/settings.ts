"use strict";

import * as browser from 'webextension-polyfill';
import {readShowMonitors, resolveShowMonitors, ShowMonitors} from "./monitors";

// The four layouts, by their storage value. The user-facing names live in
// TabManager.readablelayout().
export const LAYOUT = {
	blocks: "blocks",
	blocksBig: "blocks-big",
	rows: "horizontal",
	list: "vertical"
} as const;
export type Layout = typeof LAYOUT[keyof typeof LAYOUT];

// both block layouts: tiles in a grid, as opposed to the rows and list layouts
export function isBlockLayout(layout : Layout) : boolean {
	return layout === LAYOUT.blocks || layout === LAYOUT.blocksBig;
}

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
	// Chrome: "Show all monitors", see ./monitors.ts
	showMonitors : ShowMonitors;
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
	showMonitors: "unset",
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

// Chrome: "Show all monitors" as it stands now. Reads the setting and the
// system.display permission and applies the unset -> on rule (persisting it),
// see resolveShowMonitors(). `enabled`: the map shows every monitor and the
// options switch is on.
export async function currentShowMonitors() : Promise<{ setting : ShowMonitors, enabled : boolean }> {
	const [stored, granted] = await Promise.all([
		getSetting("showMonitors").catch(() => "unset" as ShowMonitors),
		browser.permissions.contains({ permissions: ["system.display"] }).catch(() => false)
	]);
	const setting = readShowMonitors(stored);
	const resolved = resolveShowMonitors(setting, granted);
	if (resolved.setting !== stored) await saveSetting("showMonitors", resolved.setting).catch(() => {});
	return resolved;
}

// What the very first paint needs, mirrored in localStorage so the popup can
// size and theme itself synchronously, before any storage read resolves.
export interface BootCache {
	tabWidth : number;
	tabHeight : number;
	dark : boolean;
	layout : Layout;
	compact : boolean;
}
const BOOT_CACHE = "tmpBootCache";

export function readBootCache() : Partial<BootCache> {
	try {
		return JSON.parse(localStorage.getItem(BOOT_CACHE) || "{}");
	} catch (e) {
		return {};
	}
}

export function writeBootCache(s : Pick<Settings, "tabWidth" | "tabHeight" | "dark" | "layout" | "compact">) {
	try {
		const cache : BootCache = { tabWidth: s.tabWidth, tabHeight: s.tabHeight, dark: s.dark, layout: s.layout, compact: s.compact };
		localStorage.setItem(BOOT_CACHE, JSON.stringify(cache));
	} catch (e) {
		// storage full or blocked: the next open just takes the slow path
	}
}
