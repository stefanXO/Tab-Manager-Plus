"use strict";

// The browser action popup has no size of its own until the body has one, so
// the popup's size comes from the settings (tabWidth x tabHeight).

// what the settings ask for; 0 until they are known
let requested = { width: 0, height: 0 };
let listening = false;

// keeps the panel this far away from the screen edge
const SCREEN_MARGIN = 8;
// Chrome lays an action popup out at 25px wide before it knows its real size.
const MIN_VIEWPORT_WIDTH = 100;
// the widest action popup Chrome shows
const CHROME_POPUP_MAX_WIDTH = 800;

// the options' ranges (SETTING_RULES): older versions stored unclamped values
export function clampPopupSize(width : number, height : number) : { width : number, height : number } {
	const clamp = (n : number, min : number, max : number) => Math.min(Math.max(n, min), max);
	return { width: clamp(width, 450, 800), height: clamp(height, 400, 600) };
}

export interface PopupSize {
	width : number;
	height : number;
}

export interface PopupViewport {
	width : number;
	height : number;
}

export function fitPopupSize(size : PopupSize, viewport : PopupViewport) : PopupSize {
	if (!Number.isFinite(viewport.width) || !Number.isFinite(viewport.height) ||
		viewport.width < MIN_VIEWPORT_WIDTH || viewport.height <= 0) return size;
	return {
		width: Math.min(size.width, Math.floor(viewport.width)),
		height: Math.min(size.height, Math.floor(viewport.height))
	};
}

export function sizePopup(width : number, height : number) {
	if (width > 0 && height > 0) ({ width, height } = clampPopupSize(width, height));
	if (width > 0 && height > 0) requested = { width, height };
	apply();
	if (!listening) {
		// Chrome's viewport changes when the popup is laid out at its real size;
		// Firefox also learns the panel's position only once it is shown.
		listening = true;
		window.addEventListener("resize", apply);
		window.visualViewport?.addEventListener("resize", apply);
	}
}

function apply() {
	let { width, height } = requested;
	let capped = false;
	const viewport = popupViewport();
	if (viewport) {
		const fitted = fitPopupSize({ width, height }, viewport);
		capped = fitted.width < width || fitted.height < height;
		({ width, height } = fitted);
	}
	if (IS_FIREFOX && width > 0) {
		// Firefox keeps the panel at the page's size even where that runs off the
		// screen (a short screen, or high display scaling), so the page has to fit
		// the room between the panel's top and the bottom of the screen itself.
		const room = roomOnScreen();
		const fitted = capPopupSize({ width, height }, room);
		capped ||= fitted.width < width || fitted.height < height;
		({ width, height } = fitted);
	}

	const root = document.documentElement.style;
	const body = document.body.style;
	if (width > 0) {
		body.width = width + "px";
		body.height = height + "px";
		root.setProperty("--popup-min-width", width + "px");
		root.setProperty("--popup-min-height", height + "px");
	}
	// Chrome's action popup: the frame's fixed parts take this width instead of
	// the viewport's (css/layout/frame.css), so Chrome's sizing pass at 25px
	// wide, run on every frame that changes anything, does not lay every tile
	// out again. Unlike the requested setting, this is allowed to be narrower
	// when browser zoom leaves less room for the popup.
	if (!IS_FIREFOX && width > 0) root.setProperty("--popup-width", Math.min(width, CHROME_POPUP_MAX_WIDTH) + "px");
	let minHeight = parseInt(body.height) || 0;
	if (capped) {
		// A capped popup must not have the old 400px minimum put back on it.
		minHeight = height;
	} else if (minHeight < 300) {
		minHeight = 400;
	} else {
		minHeight++;
		if (minHeight > 600) minHeight = 600;
	}
	body.minHeight = minHeight + "px";
}

function popupViewport() : PopupViewport | void {
	const root = document.documentElement;
	const widths = [window.innerWidth, root.clientWidth].filter(validDimension);
	const heights = [window.innerHeight, root.clientHeight].filter(validDimension);
	if (!widths.length || !heights.length) return;
	const width = Math.floor(Math.min(...widths));
	if (width < MIN_VIEWPORT_WIDTH) return;
	return { width, height: Math.floor(Math.min(...heights)) };
}

function validDimension(n : number) : boolean {
	return Number.isFinite(n) && n > 0;
}

function capPopupSize(size : PopupSize, room : PopupViewport) : PopupSize {
	return {
		width: validDimension(room.width) ? Math.min(size.width, Math.floor(room.width)) : size.width,
		height: validDimension(room.height) ? Math.min(size.height, Math.floor(room.height)) : size.height
	};
}

// space from the popup's top-left corner to the bottom-right of the screen, in
// CSS pixels; 0 while Firefox has not placed the panel yet
function roomOnScreen() : { width : number, height : number } {
	const win = window as Window & { mozInnerScreenX? : number, mozInnerScreenY? : number };
	const scr = screen as Screen & { availLeft? : number, availTop? : number };
	if (!win.mozInnerScreenY || !win.mozInnerScreenX) return { width: 0, height: 0 };
	return {
		width: Math.floor((scr.availLeft || 0) + scr.availWidth - win.mozInnerScreenX - SCREEN_MARGIN),
		height: Math.floor((scr.availTop || 0) + scr.availHeight - win.mozInnerScreenY - SCREEN_MARGIN),
	};
}

// The monitor the popup is on (its usable area, screen.avail*), sent to the
// background, which has no screen: restored windows are placed on it, and on
// Firefox it is the monitor "Minimize inactive windows" acts on.
export function popupScreen() : { left : number, top : number, width : number, height : number } {
	const scr = screen as Screen & { availLeft? : number, availTop? : number };
	return {
		left: scr.availLeft || 0,
		top: scr.availTop || 0,
		width: scr.availWidth,
		height: scr.availHeight
	};
}
