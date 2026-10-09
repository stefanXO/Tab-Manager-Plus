"use strict";

export interface Bounds {
	left : number;
	top : number;
	width : number;
	height : number;
}

// true when the point (left, top) lies inside the bounds. Display rectangles
// are half-open: the left and top edges are inside, the right and bottom edges
// are not (x = 1920 belongs to the display starting at 1920, not the one
// ending there).
export function isInBounds(point : { left : number, top : number }, bounds : Bounds) : boolean {
	return point.left >= bounds.left && point.left < bounds.left + bounds.width
		&& point.top >= bounds.top && point.top < bounds.top + bounds.height;
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
// the popup's), as the data for windows.create() plus what to do once it
// exists:
// - A window saved maximized (or fullscreen) comes back maximized on the
//   monitor it was saved on, when that monitor is connected: its centre lies
//   in one of the displays (a maximized window's corner may sit a few pixels
//   outside, so not the corner). Chrome refuses a state together with bounds,
//   so it is created normal inside that display and then maximized
//   (`maximize`, a windows.update afterwards; `display` is the monitor).
// - A maximized window whose monitor is not known (gone, saved without
//   usable bounds, or this browser knows only the popup's monitor) is created
//   maximized, so the browser opens it on the popup's monitor.
// - Anything else gets its saved position and size, fitted into a display
//   that exists now (the monitor it was saved on may be gone or smaller,
//   #208); unusable bounds or no display known: the browser's default
//   placement (no bounds at all).
export interface RestorePlan {
	create : RestoreCreate;
	// true: maximize the window right after creating it
	maximize : boolean;
	// the display that window ends up filling (when maximize)
	display? : Bounds;
}

export function restorePlan(saved : SavedWindowInfo, displays : Bounds[]) : RestorePlan {
	const create : RestoreCreate = { type: "normal", incognito: !!saved.incognito };
	const bounds = { left: saved.left, top: saved.top, width: saved.width, height: saved.height };
	if (saved.state === "maximized" || saved.state === "fullscreen") {
		const home = usableBounds(bounds) ? displayOfCentre(bounds, displays) : undefined;
		if (!home) {
			create.state = "maximized";
			return { create, maximize: false };
		}
		Object.assign(create, fitInto(bounds, home));
		return { create, maximize: true, display: { ...home } };
	}
	if (!usableBounds(bounds)) return { create, maximize: false };
	const placed = placeWindow(bounds, displays);
	if (placed) Object.assign(create, placed);
	return { create, maximize: false };
}

// the first display holding the centre of the bounds
function displayOfCentre(b : Bounds, displays : Bounds[]) : Bounds | undefined {
	const centre = { left: b.left + b.width / 2, top: b.top + b.height / 2 };
	return displays.find((d) => isInBounds(centre, d));
}

// the windows.create() data of restorePlan
export function restoreCreate(saved : SavedWindowInfo, displays : Bounds[]) : RestoreCreate {
	return restorePlan(saved, displays).create;
}

// Where the plan's window shows up: its bounds; a maximized one fills its
// display (the monitor it was saved on, or else the display a new window
// opens on: the browser picks it, the one of the window in use, i.e. the
// popup's, first in the list); null when the browser places it itself.
export interface Landing {
	bounds : Bounds | null;
	maximized : boolean;
}

export function landingOf(plan : RestorePlan, displays : Bounds[]) : Landing {
	if (plan.maximize && plan.display) return { bounds: { ...plan.display }, maximized: true };
	if (plan.create.state === "maximized") return { bounds: displays.length ? { ...displays[0] } : null, maximized: true };
	return { bounds: planBounds(plan), maximized: false };
}

// where a saved window would land if restored now
export function predictLanding(saved : SavedWindowInfo, displays : Bounds[]) : Landing {
	return landingOf(restorePlan(saved, displays), displays);
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

// The display list a restore goes by. The popup sends the list its landing
// preview used (`sent`, ../popup/restoreDisplays.ts); the worker has its own
// (`own`, from system.display in the worker). The popup's wins unless the
// worker knows more monitors, so Restore does what the hover card showed,
// even when the worker's own query fails or comes back short; entries that
// are not usable bounds are dropped.
export function chooseRestoreDisplays(sent : unknown, own : Bounds[]) : { displays : Bounds[], from : "popup" | "worker" } {
	const list = displayList(sent);
	if (list.length > 0 && list.length >= own.length) return { displays: list, from: "popup" };
	return { displays: own, from: "worker" };
}

// the usable bounds in a list from elsewhere (a message): finite numbers, a size
export function displayList(value : unknown) : Bounds[] {
	if (!Array.isArray(value)) return [];
	const out : Bounds[] = [];
	for (const v of value) {
		if (!v || typeof v !== "object") continue;
		const b = v as Partial<Bounds>;
		const values = [b.left, b.top, b.width, b.height];
		if (!values.every((n) => typeof n === "number" && isFinite(n)) || b.width <= 0 || b.height <= 0) continue;
		out.push({ left: b.left, top: b.top, width: b.width, height: b.height });
	}
	return out;
}

// After the window exists (windows.get): is it on the display the plan meant?
// Only a `maximize` plan names one; the window's centre must lie in it (a
// maximized window overhangs its monitor by a few pixels on Windows, -8,-8,
// so not its corner). Anything else counts as there; so does a window that
// reports no position (the check can only correct what it can see).
export function onPlannedDisplay(plan : RestorePlan, win : Partial<Bounds> | null | undefined) : boolean {
	if (!plan.maximize || !plan.display || !win) return true;
	const values = [win.left, win.top, win.width, win.height];
	if (!values.every((v) => typeof v === "number" && isFinite(v))) return true;
	return isInBounds({ left: win.left + win.width / 2, top: win.top + win.height / 2 }, plan.display);
}

// the bounds a plan creates its window with (none: the browser's placement)
export function planBounds(plan : RestorePlan) : Bounds | null {
	const c = plan.create;
	const b = { left: c.left, top: c.top, width: c.width, height: c.height };
	return Object.values(b).every((v) => typeof v === "number") ? b as Bounds : null;
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
