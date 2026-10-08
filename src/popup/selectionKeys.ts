"use strict";

// What the Delete, Backspace and Enter keys do with the selection. Pure, so
// TabManager.checkKey only has to run what this says; unit tested in
// tests/selectionKeys.test.ts.
//
// Delete and Backspace close the selection (saved tabs: remove them from their
// saved windows, with Undo) when the search box is not focused, whatever text
// it holds (search, select results, Delete); with the box focused they edit
// the search text, as they always did. Selecting moves the focus out of the
// box (TabManager.leaveSearchBox), typing moves it back in. Enter
// opens the selected saved tabs in one new window; with open tabs selected,
// or nothing, it keeps its old meaning (TabManager.addWindow).

import {onlySavedSelected} from "./sessionKeys.ts";

export const KEY_BACKSPACE = 8;
export const KEY_ENTER = 13;
export const KEY_DELETE = 46;

export type SelectionKeyAction =
	// Delete / Backspace with open tabs selected: close them
	| "close-open"
	// Delete / Backspace with saved tabs selected: remove them from their saved windows
	| "delete-saved"
	// Enter with saved tabs selected: open them in one new window
	| "open-saved";

export interface SelectionKeyContext {
	keyCode : number;
	// Ctrl, Alt or Meta is held: Delete / Backspace are then editing shortcuts
	// of the browser or system (Cmd+Backspace), not ours
	modified : boolean;
	// the window list is shown (not the options or the name / colour screen)
	mainScreen : boolean;
	// the search box has the keyboard focus (its text does not matter)
	searchFocused : boolean;
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
		if (c.modified || c.searchFocused) return null;
		return saved ? "delete-saved" : "close-open";
	}
	return null;
}
