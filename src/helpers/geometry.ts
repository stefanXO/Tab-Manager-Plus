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

// ---- restoring a saved window ----
// The worker (background/windows.ts windowGeometry) and the popup's landing
// preview (the saved window's hover card) both go through restoreCreate, so
// the preview cannot drift from what Restore does.

// what a saved window stored about itself (its windows.Window at save time)
export interface SavedWindowInfo {
	state? : string;
	incognito? : boolean;
	left? : number;
	top? : number;
	width? : number;
	height? : number;
}

// the windows.create() data a restore uses (a windows.CreateCreateDataType)
export interface RestoreCreate {
	type : "normal";
	incognito : boolean;
	state? : "maximized";
	left? : number;
	top? : number;
	width? : number;
	height? : number;
}

// How a saved window comes back on the displays known now (the first one is
// the popup's). A maximized (or fullscreen) window is restored maximized: a
// window cannot be created with both a state and bounds. Anything else gets
// its saved position and size, fitted into a display that exists now (the
// monitor it was saved on may be gone or smaller, #208); unusable bounds or
// no display known: the browser's default placement (no bounds at all).
export function restoreCreate(saved : SavedWindowInfo, displays : Bounds[]) : RestoreCreate {
	const create : RestoreCreate = { type: "normal", incognito: !!saved.incognito };
	if (saved.state === "maximized" || saved.state === "fullscreen") {
		create.state = "maximized";
		return create;
	}
	const bounds = { left: saved.left, top: saved.top, width: saved.width, height: saved.height };
	if (!usableBounds(bounds)) return create;
	const placed = placeWindow(bounds, displays);
	if (placed) Object.assign(create, placed);
	return create;
}

// Where restoreCreate's window shows up: its bounds; a maximized one fills
// the display a new window opens on (the browser picks it: the one of the
// window in use, i.e. the popup's, first in the list); null when the browser
// places it itself.
export interface Landing {
	bounds : Bounds | null;
	maximized : boolean;
}

export function landingOf(create : RestoreCreate, displays : Bounds[]) : Landing {
	if (create.state === "maximized") return { bounds: displays.length ? { ...displays[0] } : null, maximized: true };
	const b = { left: create.left, top: create.top, width: create.width, height: create.height };
	return { bounds: Object.values(b).every((v) => typeof v === "number") ? b as Bounds : null, maximized: false };
}

// where a saved window would land if restored now
export function predictLanding(saved : SavedWindowInfo, displays : Bounds[]) : Landing {
	return landingOf(restoreCreate(saved, displays), displays);
}

// The displays a restore knows: the popup's own (first, so it is the
// fallback target), then each system.display monitor's work area (its
// bounds without one) that is not the popup's already.
export function knownDisplayList(screen : Bounds | undefined, infos : { bounds : Bounds, workArea? : Bounds }[]) : Bounds[] {
	const list : Bounds[] = screen ? [screen] : [];
	for (const d of infos) {
		const b = d.workArea || d.bounds;
		if (!list.some((s) => s.left === b.left && s.top === b.top)) list.push({ left: b.left, top: b.top, width: b.width, height: b.height });
	}
	return list;
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
