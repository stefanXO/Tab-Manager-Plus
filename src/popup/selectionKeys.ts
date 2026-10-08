"use strict";

// What Ctrl/Cmd+Delete, Ctrl/Cmd+Backspace and Enter do with the selection.
// Pure, so TabManager.checkKey only has to run what this says; unit tested in
// tests/selectionKeys.test.ts.
//
// Ctrl+Delete and Ctrl+Backspace (Cmd on a Mac) close the selection (saved
// tabs: remove them from their saved windows, with Undo). Plain Delete and
// Backspace never act on the selection: they are typing, as in 6.x, and go to
// the search box. The one exception to the shortcut is a search box that has
// the focus and holds text: there the shortcut keeps its text meaning (delete
// a word), because typing a search selects the matching open tabs. Selecting
// with a right-click, a modifier click or the arrows moves the focus out of
// the box (TabManager.leaveSearchBox), so "search, right-click results,
// Ctrl+Delete" works; typing moves it back in. Enter opens the selected saved
// tabs in one new window; with open tabs selected, or nothing, it keeps its
// old meaning (TabManager.addWindow).

import {onlySavedSelected} from "./sessionKeys.ts";

export const KEY_BACKSPACE = 8;
export const KEY_ENTER = 13;
export const KEY_DELETE = 46;

export type SelectionKeyAction =
	// Ctrl/Cmd+Delete / Backspace with open tabs selected: close them
	| "close-open"
	// Ctrl/Cmd+Delete / Backspace with saved tabs selected: remove them from their saved windows
	| "delete-saved"
	// Enter with saved tabs selected: open them in one new window
	| "open-saved";

export interface SelectionKeyContext {
	keyCode : number;
	// Ctrl or Cmd (Meta) is held, and not Alt (AltGr is Ctrl+Alt): the shortcut
	// of Delete / Backspace. Plain, or with Alt only, they are typing
	cmd : boolean;
	// the window list is shown (not the options or the name / colour screen)
	mainScreen : boolean;
	// the search box has the keyboard focus ...
	searchFocused : boolean;
	// ... and holds text: the shortcut then deletes a word in it
	searchHasText : boolean;
	// the selection keys (open tab ids and saved tab keys, ./sessionKeys.ts)
	selection : ReadonlySet<number>;
}

// The action a key press asks for, or null when the key keeps its other
// meaning (typing into the search box, Enter's old behaviour...).
export function selectionKeyAction(c : SelectionKeyContext) : SelectionKeyAction | null {
	if (!c.mainScreen || c.selection.size === 0) return null;
	const saved = onlySavedSelected(c.selection);
	if (c.keyCode === KEY_ENTER) return saved ? "open-saved" : null;
	if (c.keyCode === KEY_DELETE || c.keyCode === KEY_BACKSPACE) {
		if (!c.cmd) return null;
		if (c.searchFocused && c.searchHasText) return null;
		return saved ? "delete-saved" : "close-open";
	}
	return null;
}

// The shortcut as the header hints and the trash button's title name it
export function deleteKeyName(mac : boolean) : string {
	return (mac ? "Cmd" : "Ctrl") + "+Delete";
}
