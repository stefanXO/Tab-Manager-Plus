"use strict";

// Where the arrow keys move the keyboard cursor, and what Shift+arrow adds to
// the selection. Pure, so TabManager.checkKey only has to apply it; unit tested
// in tests/arrowWalk.test.ts.
//
// The cursor is not the selection (7.0): a plain arrow moves the cursor (the
// ringed tab, css/components/tab.css .key-cursor) and leaves the selection as
// it is; Shift+arrow moves it and adds every tab it lands on. The walk is the
// one 5.1 brought in: Left / Right go to the previous / next tab through all
// windows on screen and wrap around at the ends; Up / Down go to the window
// above / below, to the tab at the same place in it (or its last tab when it
// is shorter), and wrap around too. The List layout lays the tabs out down
// the page, so there Up / Down walk the tabs and Left / Right the windows.

// a step of the walk, whatever the layout
export type ArrowWalk = "next" | "prev" | "nextWindow" | "prevWindow";

// The walk an arrow key (37 left, 38 up, 39 right, 40 down) asks for in a layout
export function arrowWalk(keyCode : number, listLayout : boolean) : ArrowWalk | null {
	switch (keyCode) {
		case 37: return listLayout ? "prevWindow" : "prev";
		case 38: return listLayout ? "prev" : "prevWindow";
		case 39: return listLayout ? "nextWindow" : "next";
		case 40: return listLayout ? "next" : "nextWindow";
		default: return null;
	}
}

// The tab the walk starts from: the first of `candidates` (the cursor, the last
// selected tab, the active tab of the current window, in that order; 0 for
// none) that is on the walk, `windows` (the ids of the tabs the arrows visit,
// window by window, in screen order). 0 when none is: the walk then lands on
// the first tab on screen.
export function walkStart(windows : readonly (readonly number[])[], candidates : readonly number[]) : number {
	for (const id of candidates) {
		if (!id) continue;
		for (const tabs of windows) if (tabs.includes(id)) return id;
	}
	return 0;
}

// The tab one step of `walk` lands on from `from` (0, or a tab not on the walk:
// none), or 0 when there is no tab to visit. Windows without a tab to visit
// are passed over. With nothing to start from, Right / Down (or their List
// keys) land on the first tab, Left on the last and Up on the first tab of
// the last window, so the first press always reaches the near end.
export function arrowStep(windows : readonly (readonly number[])[], from : number, walk : ArrowWalk) : number {
	const shown = windows.filter((tabs) => tabs.length > 0);
	if (shown.length === 0) return 0;
	let w = -1;
	let t = -1;
	for (let i = 0; i < shown.length && w < 0; i++) {
		const at = from ? shown[i].indexOf(from) : -1;
		if (at >= 0) {
			w = i;
			t = at;
		}
	}
	if (w < 0) {
		if (walk === "prev") return shown[shown.length - 1][shown[shown.length - 1].length - 1];
		if (walk === "prevWindow") return shown[shown.length - 1][0];
		return shown[0][0];
	}
	if (walk === "next" || walk === "prev") {
		const flat = shown.flat();
		const at = flat.indexOf(from);
		return flat[(at + (walk === "next" ? 1 : flat.length - 1)) % flat.length];
	}
	const target = shown[(w + (walk === "nextWindow" ? 1 : shown.length - 1)) % shown.length];
	return target[Math.min(t, target.length - 1)];
}

// What one arrow step adds to the selection: nothing for a plain arrow; with
// Shift the tab it lands on, and, when nothing was selected yet, the tab it
// started from as well, so Shift+Right from a tab takes that tab and the next
// (as Shift+arrow does in a file list). Already selected tabs stay selected:
// the caller only adds.
export function cursorStep(selectionEmpty : boolean, from : number, to : number, shift : boolean) : number[] {
	if (!shift || !to) return [];
	if (selectionEmpty && !!from && from !== to) return [from, to];
	return [to];
}
