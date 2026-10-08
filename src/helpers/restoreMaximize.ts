"use strict";

// The last part of restoring a window saved maximized on a monitor that is
// connected (geometry.ts restorePlan with `maximize`): the window was created
// normal inside that monitor (Chrome refuses a state together with bounds);
// now it is maximized, and checked. Should the browser have put it, or
// maximized it, on another monitor (its centre is not on the planned one,
// geometry.ts onPlannedDisplay), it is moved back (state normal with the
// planned bounds) and maximized once more; still elsewhere after that, it is
// left normal on the planned monitor. Every step goes into `steps` (the
// restore trace of the everything export). A refused update is recorded and
// the window stays as it is.
// The window API is passed in (browser.windows in the worker), so the
// sequence is unit tested with a fake browser (tests/restoreMaximize.test.ts).

import {onPlannedDisplay, planBounds} from "./geometry.ts";
import type {RestorePlan} from "./geometry.ts";
import {windowBox} from "./restoreDiagnostic.ts";

export interface WindowLike {
	state? : string;
	left? : number;
	top? : number;
	width? : number;
	height? : number;
}

export interface WindowApi {
	get(windowId : number) : Promise<WindowLike>;
	update(windowId : number, props : Record<string, unknown>) : Promise<unknown>;
	sleep(ms : number) : Promise<void>;
}

export type RestoreStep = { step : string, [key : string] : unknown };

// how often a window is asked for again until it reports maximized, and the pause
const POLLS = 10;
const POLL_MS = 50;

export async function maximizeOnDisplay(api : WindowApi, windowId : number, plan : RestorePlan, steps : RestoreStep[]) : Promise<void> {
	const bounds = planBounds(plan);
	const update = async (props : Record<string, unknown>, what : string) => {
		try {
			await api.update(windowId, props);
		} catch (e) {
			steps.push({ step: what + " refused", error: String(e) });
		}
	};
	let w = await windowNow(api, windowId);
	steps.push({ step: "created", window: windowBox(w) });
	if (bounds && !onPlannedDisplay(plan, w)) await update({ state: "normal", ...bounds }, "move");
	for (let attempt = 1; attempt <= 2; attempt++) {
		await update({ state: "maximized" }, "maximize");
		w = await windowNow(api, windowId, (x) => x.state === "maximized");
		steps.push({ step: "maximized", attempt, window: windowBox(w) });
		if (!bounds || onPlannedDisplay(plan, w)) return;
		await update({ state: "normal", ...bounds }, "move");
	}
	steps.push({ step: "left normal on the planned monitor", window: windowBox(await windowNow(api, windowId)) });
}

// the window as the browser reports it (null: gone); with `until`, asked
// again for a moment until it holds
async function windowNow(api : WindowApi, windowId : number, until? : (w : WindowLike) => boolean) : Promise<WindowLike | null> {
	let w : WindowLike | null = null;
	for (let i = 0; i < POLLS; i++) {
		try {
			w = await api.get(windowId);
		} catch {
			return null;
		}
		if (!w || !until || until(w)) return w;
		await api.sleep(POLL_MS);
	}
	return w;
}
