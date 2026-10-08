"use strict";

import { maybePluralize } from "../helpers/utils.ts";

// The options screen's line under its export buttons: what the file will
// hold, or that there is nothing to export.

// Export Sessions: the saved windows (ISavedSession) and their tabs
export function sessionsExportNote(sessions : { tabs? : unknown[] }[] | undefined) : string {
	if (!sessions?.length) return "No saved windows to export yet";
	const tabs = sessions.reduce((n, s) => n + (s.tabs?.length ?? 0), 0);
	return "Will export " + maybePluralize(sessions.length, "saved window") + " with " + maybePluralize(tabs, "tab");
}

// Export Settings: every setting of the extension; the saved windows and the
// window names and colors are not part of it
export function settingsExportNote(count : number) : string {
	return "Will export " + maybePluralize(count, "setting") + ", not the saved windows or the window names and colors";
}

// Export tabs for debugging: every open window and tab
export function debugExportNote(windows : number, tabs : number) : string {
	if (windows === 0) return "No windows to export";
	return "Will export " + maybePluralize(windows, "window") + " with " + maybePluralize(tabs, "tab");
}
