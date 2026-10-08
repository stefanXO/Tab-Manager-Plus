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
// tabs in one new window; with open tabs selected it keeps its old meaning
// (TabManager.addWindow).
//
// The keyboard cursor (the tab the arrows are on, ./arrowWalk.ts) is not the
// selection: Space (and Ctrl+Space) puts the cursor tab in or takes it out of
// the selection, and Enter with nothing selected switches to the cursor tab,
// as "arrow, arrow, Enter" did in 6.x, when the arrows still selected what
// they landed on. With neither a selection nor a cursor Enter opens an empty
// window, as before.

import {onlySavedSelected} from "./sessionKeys.ts";

export const KEY_BACKSPACE = 8;
export const KEY_ENTER = 13;
export const KEY_DELETE = 46;
export const KEY_SPACE = 32;

// The modifiers held with an arrow key
export interface ArrowMods {
	shift : boolean;
	ctrl : boolean;
	alt : boolean;
	meta : boolean;
}

// Do the arrow keys walk the tabs (TabManager.checkKey), or are they text
// editing in the search box? Outside a search box that holds text they walk.
// In a box with text the plain arrows keep moving the caret (a misspelled
// search is fixed with them) and Shift keeps selecting text; Ctrl+arrow walks
// the tabs instead (the box gives the focus up). Alt+arrow walks too, except
// on a Mac, where Option+arrow jumps by word; Cmd+arrow on a Mac goes to the
// start or end of the line and stays text. keyCode is the arrow (37-40).
export function arrowNavigates(keyCode : number, mods : ArrowMods, mainScreen : boolean, searchHasText : boolean, mac : boolean) : boolean {
	if (keyCode < 37 || keyCode > 40 || !mainScreen) return false;
	if (!searchHasText) return true;
	if (mods.shift) return false;
	return mods.ctrl || (mods.alt && !mac);
}

export type SelectionKeyAction =
	// Ctrl/Cmd+Delete / Backspace with open tabs selected: close them
	| "close-open"
	// Ctrl/Cmd+Delete / Backspace with saved tabs selected: remove them from their saved windows
	| "delete-saved"
	// Enter with saved tabs selected: open them in one new window
	| "open-saved"
	// Space (or Ctrl+Space) on the window list with a cursor: select or deselect the cursor tab
	| "toggle-cursor"
	// Enter with nothing selected and a cursor: switch to the cursor tab
	| "switch-cursor";

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
	// the open tab the keyboard cursor is on, or 0 (none)
	cursor? : number;
	// its ring is on screen (a key moved it; a click sets the cursor but hides
	// the ring): only then Enter switches to it, since the tab is marked
	cursorShown? : boolean;
	// the keyboard focus is on the window list, not in a text field (the
	// search box or the window name): Space is not typing there
	listFocused? : boolean;
	// an action button (a div with role="button", ./buttonKeys.ts) has the
	// focus: Space and Enter press the button, with a modifier too, never the
	// cursor tab
	onButton? : boolean;
	// Alt is held (Alt+Space opens the window menu on Windows)
	alt? : boolean;
}

// What has the keyboard focus, for Space and Enter: a text field (the search
// box, a window name) types, an action button presses itself (./buttonKeys.ts
// stops plain Enter and Space there, but Ctrl+Space and Ctrl+Enter bubble on
// to TabManager.checkKey), anything else is the window list. null: nothing
// focused (the page body), the list as well.
export type KeyTarget = "text" | "button" | "list";
export function keyTarget(el : { tagName : string, role : string | null, editable : boolean } | null) : KeyTarget {
	if (!el) return "list";
	const tag = el.tagName.toUpperCase();
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.editable) return "text";
	if (tag === "BUTTON" || el.role === "button") return "button";
	return "list";
}

// The action a key press asks for, or null when the key keeps its other
// meaning (typing into the search box, Enter's old behaviour...).
export function selectionKeyAction(c : SelectionKeyContext) : SelectionKeyAction | null {
	if (!c.mainScreen) return null;
	const cursor = c.cursor || 0;
	if (c.keyCode === KEY_SPACE) return !!cursor && !!c.listFocused && !c.onButton && !c.alt ? "toggle-cursor" : null;
	if (c.keyCode === KEY_ENTER && c.selection.size === 0) return cursor && c.cursorShown && !c.onButton ? "switch-cursor" : null;
	if (c.selection.size === 0) return null;
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
