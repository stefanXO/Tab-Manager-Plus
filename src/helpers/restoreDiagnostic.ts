"use strict";

// What the worker knows when it restores a saved window, for the "everything"
// export (the options' debug file): the monitors as the worker sees them, the
// permission, the list the popup sent, and for each saved window its saved
// state and bounds and the plan a restore would use now (geometry.ts
// restorePlan, the same function the restore and the hover card call). Plus
// the last few restores as they happened (RestoreTrace, written by
// service_worker/background/windows.ts). A maintainer who cannot reproduce a
// restore on the user's monitors reads it from there. Pure, so it is unit
// tested (tests/restoreDiagnostic.test.ts).

import {knownDisplayList, chooseRestoreDisplays, displayList, restorePlan, landingOf} from "./geometry.ts";
import type {Bounds, RestorePlan, Landing, SavedWindowInfo} from "./geometry.ts";

// one restore, step by step
export interface RestoreTrace {
	at : string;
	saved : SavedBox;
	screen : Bounds | null;
	// the worker's own list, and why it has no more (the error of its query)
	own : Bounds[];
	ownError? : string;
	sent : Bounds[];
	from : "popup" | "worker";
	plan : RestorePlan;
	steps : { step : string, [key : string] : unknown }[];
}

export interface SavedBox {
	state : string;
	left? : number;
	top? : number;
	width? : number;
	height? : number;
}

// a monitor as system.display reports it, the fields that matter here
export interface DisplayFacts {
	id? : string;
	name? : string;
	isPrimary? : boolean;
	isEnabled? : boolean;
	bounds? : Bounds;
	workArea? : Bounds;
	dpiX? : number;
	dpiY? : number;
	rotation? : number;
	displayZoomFactor? : number;
}

export interface RestoreDiagnostic {
	browser : "chrome" | "firefox";
	// system.display granted (null: Firefox, which has no such permission)
	permission : boolean | null;
	// system.display.getInfo() in the worker, or why it failed
	displayInfo : DisplayFacts[];
	displayError? : string;
	// the display the popup is on (first in every list)
	screen : Bounds | null;
	// the worker's own list, the popup's, and the one a restore goes by
	workerDisplays : Bounds[];
	popupDisplays : Bounds[];
	displays : Bounds[];
	from : "popup" | "worker";
	saved : { id : string, name : string, saved : SavedBox, plan : RestorePlan, landing : Landing }[];
	log : RestoreTrace[];
}

export interface RestoreDiagnosticInput {
	browser : "chrome" | "firefox";
	permission : boolean | null;
	displayInfo : unknown[];
	displayError? : string;
	screen? : Bounds | null;
	popupDisplays? : unknown;
	sessions : { id? : string, name? : string, windowsInfo? : SavedWindowInfo }[];
	log? : unknown;
}

const FACTS : (keyof DisplayFacts)[] = ["id", "name", "isPrimary", "isEnabled", "bounds", "workArea", "dpiX", "dpiY", "rotation", "displayZoomFactor"];

export function buildRestoreDiagnostic(input : RestoreDiagnosticInput) : RestoreDiagnostic {
	const displayInfo = input.displayInfo.map((d) => {
		const out : Record<string, unknown> = {};
		for (const key of FACTS) {
			const v = (d as Record<string, unknown>)?.[key];
			if (v !== undefined) out[key] = typeof v === "object" && v !== null ? { ...v } : v;
		}
		return out as DisplayFacts;
	});
	const screen = input.screen || null;
	const infos = displayInfo.filter((d) => !!d.bounds) as { bounds : Bounds, workArea? : Bounds }[];
	const workerDisplays = knownDisplayList(screen || undefined, infos);
	const choice = chooseRestoreDisplays(input.popupDisplays, workerDisplays);
	const popupDisplays = displayList(input.popupDisplays);
	const saved = input.sessions.map((s) => {
		const info = s.windowsInfo || {};
		const plan = restorePlan(info, choice.displays);
		return { id: s.id || "", name: s.name || "", saved: savedBox(info), plan, landing: landingOf(plan, choice.displays) };
	});
	const out : RestoreDiagnostic = {
		browser: input.browser,
		permission: input.permission,
		displayInfo,
		screen,
		workerDisplays,
		popupDisplays,
		displays: choice.displays,
		from: choice.from,
		saved,
		log: Array.isArray(input.log) ? input.log as RestoreTrace[] : []
	};
	if (input.displayError) out.displayError = input.displayError;
	return out;
}

// the saved state and bounds of a saved window (its windowsInfo)
export function savedBox(info : SavedWindowInfo) : SavedBox {
	const box : SavedBox = { state: info.state || "" };
	for (const key of ["left", "top", "width", "height"] as const) {
		if (typeof info[key] === "number") box[key] = info[key];
	}
	return box;
}

// the log with one more restore, the newest last, at most `max` kept
export function appendRestoreLog(log : unknown, trace : RestoreTrace, max = 5) : RestoreTrace[] {
	const list = Array.isArray(log) ? log as RestoreTrace[] : [];
	return [...list, trace].slice(-max);
}

// the position, size and state of a window, as a trace step records it
export function windowBox(w : { state? : string, left? : number, top? : number, width? : number, height? : number } | null | undefined) : SavedBox | null {
	if (!w) return null;
	return savedBox(w);
}
