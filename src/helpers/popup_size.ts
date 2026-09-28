"use strict";

// The browser action popup has no size of its own until the body has one, so
// the popup's size comes from the settings (tabWidth x tabHeight).

// what the settings ask for; 0 until they are known
let requested = { width: 0, height: 0 };
let listening = false;

// keeps the panel this far away from the screen edge
const SCREEN_MARGIN = 8;
// never shrink below this: a panel that is still being laid out can report tiny sizes
const MIN_ROOM = 300;

export function sizePopup(width : number, height : number) {
	if (width > 0 && height > 0) requested = { width, height };
	apply();
	if (IS_FIREFOX && !listening) {
		// the panel's position on screen is only known once it is shown
		listening = true;
		window.addEventListener("resize", apply);
	}
}

function apply() {
	let { width, height } = requested;
	let capped = false;
	if (IS_FIREFOX && width > 0) {
		// Firefox keeps the panel at the page's size even where that runs off the
		// screen (a short screen, or high display scaling), so the page has to fit
		// the room between the panel's top and the bottom of the screen itself
		const room = roomOnScreen();
		if (room.height >= MIN_ROOM && room.height < height) {
			height = room.height;
			capped = true;
		}
		if (room.width >= MIN_ROOM) width = Math.min(width, room.width);
	}

	const body = document.body.style;
	if (width > 0) {
		body.width = width + "px";
		body.height = height + "px";
	}
	let minHeight = parseInt(body.height) || 0;
	if (minHeight < 300) {
		minHeight = 400;
	} else {
		minHeight++;
		if (minHeight > 600) minHeight = 600;
		// a min-height past the screen would undo the cap
		if (capped) minHeight = height;
	}
	body.minHeight = minHeight + "px";
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
