"use strict";

import * as browser from 'webextension-polyfill';

// The extension's keyboard shortcuts as the browser has them now, for the
// options screen. The user changes them in the browser's own shortcut
// settings, so this is read again whenever the options screen gets focus.

export interface Shortcut {
	name : string;
	label : string;
	// the key as the browser shows it ("Ctrl+Shift+M"); "" when none is set
	shortcut : string;
}

// _execute_action has no description in the manifest: it opens the popup
const LABELS : Record<string, string> = {
	_execute_action: "Open Tab Manager Plus",
};

// In manifest order; [] when the browser cannot tell
export async function getShortcuts() : Promise<Shortcut[]> {
	try {
		const commands = await browser.commands.getAll();
		return commands.map((command) => {
			const name = command.name ?? "";
			return {
				name,
				label: LABELS[name] ?? command.description ?? name,
				shortcut: command.shortcut ?? "",
			};
		});
	} catch {
		return [];
	}
}
