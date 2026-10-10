"use strict";

// Saved windows are on by default since 7.0.0, but SETTING_DEFAULTS only
// reaches profiles where `sessionsFeature` is missing: 6.x wrote
// `sessionsFeature: false` into storage each time its popup opened, so
// nearly every upgrading user would keep them off. On the first run after
// 6.x (or older), a stored false with no saved windows is taken for that
// old default and switched on once. A false next to saved windows is kept:
// that user had them on and turned them off. Pure, unit tested in
// tests/sessionsUpgrade.test.ts; readSettings() (./settings.ts) runs it.

// the stored `version` comes from before 7.0.0 (none stored: older still)
export function storedBefore7(version : unknown) : boolean {
	if (typeof version !== "string" || version === "") return true;
	const major = parseInt(version.split(".")[0], 10);
	return !isFinite(major) || major < 7;
}

// whether the stored settings may hold 6.x's written default (only then is
// the sessions object worth reading)
export function mayHoldOldSessionsDefault(storedVersion : unknown, sessionsFeature : unknown) : boolean {
	return sessionsFeature === false && storedBefore7(storedVersion);
}

// switch saved windows on: 6.x's written default, and no saved window stored
export function upgradeSessionsFeature(storedVersion : unknown, sessionsFeature : unknown, sessions : unknown) : boolean {
	if (!mayHoldOldSessionsDefault(storedVersion, sessionsFeature)) return false;
	if (!sessions || typeof sessions !== "object") return true;
	return Object.keys(sessions as object).length === 0;
}
