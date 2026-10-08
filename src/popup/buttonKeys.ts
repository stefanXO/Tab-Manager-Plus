"use strict";

// The action buttons are divs with role="button" (the header's, the bottom
// bar's, the window and saved window cards'). To be reached with the Tab key
// they take tabIndex 0 (the search box is 1 and the window list 2, so they
// come after those), and to be pressed from the keyboard they act on Enter
// and Space, as a native button does. Enter on a focused button must not
// reach the root's key handler (TabManager.checkKey): there it opens or moves
// to a window. Unit tested in tests/buttonKeys.test.ts.

// the part of a keyboard event this reads
export interface ButtonKeyEvent {
	key : string;
	ctrlKey : boolean;
	metaKey : boolean;
	altKey : boolean;
	shiftKey : boolean;
	repeat : boolean;
	currentTarget : { click() : void };
	preventDefault() : void;
	stopPropagation() : void;
}

// Whether the key presses the button: Enter or Space, alone. With Ctrl, Cmd,
// Alt or Shift it is some other shortcut and goes on up.
export function activatesButton(e : Pick<ButtonKeyEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey">) : boolean {
	if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return false;
	return e.key === "Enter" || e.key === " " || e.key === "Spacebar";
}

// onKeyDown of an action button: a pressing key clicks the button (its own
// onClick runs) and is not passed on, not even to the browser (Space would
// scroll). A held key presses once: the repeats are swallowed. Other keys
// bubble as before.
export function actionKeyDown(e : ButtonKeyEvent) : void {
	if (!activatesButton(e)) return;
	e.preventDefault();
	e.stopPropagation();
	if (e.repeat) return;
	e.currentTarget.click();
}

// onMouseDown of an action button: the button is focusable, but a click must
// not move the focus there from the search box or the window list (the keys
// those take stay where they were)
export function keepFocus(e : { preventDefault() : void }) : void {
	e.preventDefault();
}

// What every action button spreads on its element
export const ACTION_BUTTON = { tabIndex: 0, onKeyDown: actionKeyDown, onMouseDown: keepFocus };
