"use strict";

// What one press of Escape does in the popup's main view (TabManager.checkKey).
// The search help card and the name / color overlay take the press alone; else
// an open hover card closes AND the search and selection clear in the same press.
// The popup stays open when anything was closed or cleared.

export interface EscapeInput {
	cardOpen : boolean;
	searchLen : number;
	selectionSize : number;
	helpOpen : boolean;
	overlayOpen : boolean;
}

export interface EscapeResult {
	// the hover card closes (statsHover does it)
	closeCard : boolean;
	// the search and the selection clear
	clear : boolean;
	// the press is swallowed, so the browser does not close the popup
	keepPopup : boolean;
}

export function escapeKey(i : EscapeInput) : EscapeResult {
	if (i.helpOpen || i.overlayOpen) return { closeCard: false, clear: false, keepPopup: true };
	const something = i.searchLen > 0 || i.selectionSize > 0;
	return { closeCard: i.cardOpen, clear: true, keepPopup: i.cardOpen || something };
}
