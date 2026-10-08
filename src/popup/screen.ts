"use strict";

// Which screen the popup shows. The window list (with the search box) is the
// main screen; the options screen and the window name / colour overlay
// replace it. Keys that act on windows and tabs (Enter opens or moves to a
// window, the arrows move the selection) only mean something on the main
// screen: on the others they must do nothing to windows.
export interface ScreenState {
	optionsActive : boolean;
	colorsActive : number;
	// the same overlay opened on a saved window (its id, "" when closed)
	colorsSession? : string;
}

export function onMainScreen(s : ScreenState) : boolean {
	return !s.optionsActive && !s.colorsActive && !s.colorsSession;
}
