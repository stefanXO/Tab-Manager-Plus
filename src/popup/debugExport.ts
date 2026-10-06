"use strict";

// The debug export: a JSON snapshot of the windows, tabs and settings, to
// attach to a bug report. Pure (no browser APIs), so it is unit tested in
// tests/debugExport.test.ts. Only the fields listed here are copied.

import { windowName } from "./windowName.ts";

interface ExportTabSource {
	id?: number;
	index?: number;
	title?: string;
	url?: string;
	pendingUrl?: string;
	active?: boolean;
	pinned?: boolean;
	audible?: boolean;
	mutedInfo?: { muted?: boolean };
	discarded?: boolean;
	status?: string;
	lastAccessed?: number;
}

export interface ExportWindowSource {
	id?: number;
	focused?: boolean;
	state?: string;
	incognito?: boolean;
	tabs?: ExportTabSource[];
}

export interface DebugMeta {
	extension: string;
	browser: string;
	exported: Date;
	// the names the user gave the windows, by window id
	names: Map<number, string>;
}

export interface DebugTab {
	id: number;
	index: number;
	title: string;
	url: string;
	pendingUrl: string;
	active: boolean;
	pinned: boolean;
	audible: boolean;
	muted: boolean;
	discarded: boolean;
	status: string;
	lastAccessed: number;
}

export interface DebugWindow {
	id: number;
	focused: boolean;
	state: string;
	incognito: boolean;
	name: string | null;
	autoName: string;
	tabs: DebugTab[];
}

export interface DebugExport {
	format: "tab-manager-plus-debug";
	version: 1;
	extension: string;
	browser: string;
	exported: string;
	settings: Record<string, unknown>;
	windows: DebugWindow[];
}

export function buildDebugExport(windows: ExportWindowSource[], settings: Record<string, unknown>, meta: DebugMeta): DebugExport {
	return {
		format: "tab-manager-plus-debug",
		version: 1,
		extension: meta.extension,
		browser: meta.browser,
		exported: meta.exported.toISOString(),
		settings: { ...settings },
		windows: windows.map((w) => {
			const tabs = (w.tabs || []).map((t, i): DebugTab => ({
				id: t.id ?? -1,
				index: t.index ?? i,
				title: t.title || "",
				url: t.url || "",
				pendingUrl: t.pendingUrl || "",
				active: !!t.active,
				pinned: !!t.pinned,
				audible: !!t.audible,
				muted: !!t.mutedInfo?.muted,
				discarded: !!t.discarded,
				status: t.status || "",
				lastAccessed: t.lastAccessed || 0,
			}));
			return {
				id: w.id ?? -1,
				focused: !!w.focused,
				state: w.state || "",
				incognito: !!w.incognito,
				name: (w.id !== undefined && meta.names.get(w.id)) || null,
				autoName: windowName(tabs),
				tabs,
			};
		}),
	};
}

// tab-manager-plus-debug-2030-01-02.json, in local time
export function debugFileName(date: Date): string {
	const p = (n: number) => ("0" + n).slice(-2);
	return "tab-manager-plus-debug-" + date.getFullYear() + "-" + p(date.getMonth() + 1) + "-" + p(date.getDate()) + ".json";
}
