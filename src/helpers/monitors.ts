"use strict";

// "Show all monitors" (Chrome only): whether the window card's map shows every
// monitor, through the optional system.display permission. The permission can
// also come from "Minimize inactive windows", so the switch is a setting of
// its own, next to the permission:
//   "unset" - never touched: follows the permission (granted -> becomes "on")
//   "on"    - switched on (the map shows every monitor while granted)
//   "off"   - switched off: stays off, even when the permission comes later
// Pure: no browser APIs, so the rules are unit tested (tests/monitors.test.ts).

export type ShowMonitors = "unset" | "on" | "off";

// the stored value; anything unknown (missing, an old boolean) is "unset"
export function readShowMonitors(value : unknown) : ShowMonitors {
	return value === "on" || value === "off" ? value : "unset";
}

// On options load, popup boot and permissions.onAdded: the setting to keep
// (persist it when it changed) and whether all monitors are shown, which is
// also what the switch shows. Only "unset" follows a grant; "off" sticks.
export function resolveShowMonitors(setting : ShowMonitors, granted : boolean) : { setting : ShowMonitors, enabled : boolean } {
	let s = readShowMonitors(setting);
	if (s === "unset" && granted) s = "on";
	return { setting: s, enabled: granted && s === "on" };
}

// The switch clicked: on asks for the permission first (`granted` is the
// answer, or true when it was already there); denied leaves the setting as
// it was, so the switch stays off. Off is always "off".
export function switchShowMonitors(setting : ShowMonitors, turnOn : boolean, granted : boolean) : ShowMonitors {
	if (!turnOn) return "off";
	return granted ? "on" : readShowMonitors(setting);
}
