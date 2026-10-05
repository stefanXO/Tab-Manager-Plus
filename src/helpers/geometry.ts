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

// "Minimize inactive windows": the ids of the windows to minimize when the
// window targetId gets the focus. Windows that are already minimized are
// left out.
// Chrome (displays known through system.display): the other windows whose
// top-left corner is on the target's display (the first display containing
// it), so one window stays active per monitor; windows that report no
// position are left out, and nothing when the target is on none of the
// displays.
// Firefox (no display API, displays = null): every other normal window, on
// every monitor, so one window stays active in all.
export function windowsToMinimize(
	targetId : number,
	windows : { id? : number, left? : number, top? : number, state? : string, type? : string }[],
	displays : Bounds[] | null
) : number[] {
	const target = windows.find((w) => w.id === targetId);
	if (!target) return [];
	const others = windows.filter((w) => w.id !== targetId && typeof w.id === "number" && w.state !== "minimized");
	if (displays === null) {
		return others.filter((w) => !w.type || w.type === "normal").map((w) => w.id);
	}
	const hasPosition = (w : { left? : number, top? : number }) : w is { left : number, top : number } =>
		typeof w.left === "number" && typeof w.top === "number";
	if (!hasPosition(target)) return [];
	const home = displays.find((d) => isInBounds(target, d));
	if (!home) return [];
	return others.filter((w) => hasPosition(w) && isInBounds(w, home)).map((w) => w.id);
}
