"use strict";

export interface Bounds {
	left : number;
	top : number;
	width : number;
	height : number;
}

// true when the point (left, top) lies inside the bounds
export function isInBounds(point : { left : number, top : number }, bounds : Bounds) : boolean {
	return point.left >= bounds.left && point.left <= bounds.left + bounds.width
		&& point.top >= bounds.top && point.top <= bounds.top + bounds.height;
}

// Where a saved window goes on the displays available now: the display its
// top-left corner was on if that still exists, else the first one (the popup's
// own). Its size is capped to that display and its position pulled inside.
export function placeWindow(saved : Bounds, displays : Bounds[]) : Bounds | null {
	if (displays.length === 0) return null;
	const home = displays.find((d) => isInBounds(saved, d)) || displays[0];
	return fitInto(saved, home);
}

// shrink to the display if needed, then move inside it
export function fitInto(bounds : Bounds, display : Bounds) : Bounds {
	const width = Math.min(bounds.width, display.width);
	const height = Math.min(bounds.height, display.height);
	const left = Math.min(Math.max(bounds.left, display.left), display.left + display.width - width);
	const top = Math.min(Math.max(bounds.top, display.top), display.top + display.height - height);
	return { left, top, width, height };
}

// saved bounds worth restoring at all: numbers, and not absurdly small
export function usableBounds(b : Partial<Bounds>) : b is Bounds {
	const values = [b.left, b.top, b.width, b.height];
	return values.every((v) => typeof v === "number" && isFinite(v)) && b.width >= 100 && b.height >= 100;
}
