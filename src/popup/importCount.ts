"use strict";

import { maybePluralize } from "../helpers/utils.ts";
import { readSessionsFile } from "./sessionsFile.ts";

// The options screen's session import: sorts the parsed sessions file into the
// saved windows that can be restored and the ones that cannot (with the
// reason), and words the result.

export type SkipReason = "no window info" | "no tabs" | "no id" | "not a saved window";

export interface ImportPlan<T> {
	// entries that look like saved windows, in file order
	valid : T[];
	// skipped entries by reason, only reasons that occurred
	skipped : Partial<Record<SkipReason, number>>;
	// the whole file is unusable (not a list), else undefined
	fatal? : string;
}

export function planImport<T = unknown>(parsed : unknown) : ImportPlan<T> {
	const plan : ImportPlan<T> = { valid: [], skipped: {} };
	const list = readSessionsFile(parsed);
	if (!list) {
		plan.fatal = "The file is JSON, but not a list of saved windows";
		return plan;
	}
	for (const entry of list as any[]) {
		let reason : SkipReason | undefined;
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) reason = "not a saved window";
		else if (!entry.windowsInfo) reason = "no window info";
		else if (!Array.isArray(entry.tabs) || !entry.tabs.length) reason = "no tabs";
		else if (!entry.id) reason = "no id";
		if (reason) plan.skipped[reason] = (plan.skipped[reason] ?? 0) + 1;
		else plan.valid.push(entry as T);
	}
	return plan;
}

// "2 saved windows restored, 1 skipped (no tabs)"; failedWrites are valid
// entries the browser refused to store
export function importSummary(plan : ImportPlan<unknown>, failedWrites = 0) : string {
	if (plan.fatal) return plan.fatal;
	const restored = plan.valid.length - failedWrites;
	const parts : string[] = [];
	for (const [reason, n] of Object.entries(plan.skipped)) parts.push(n + " " + reason);
	if (failedWrites) parts.push(failedWrites + " could not be stored");
	const skipped = (plan.valid.length + Object.values(plan.skipped).reduce((a, b) => a + b, 0)) - restored;
	if (restored <= 0) {
		return skipped ? "No saved windows restored, " + skipped + " skipped (" + parts.join(", ") + ")" : "No saved windows in the file";
	}
	let msg = maybePluralize(restored, "saved window") + " restored";
	if (skipped) msg += ", " + skipped + " skipped (" + parts.join(", ") + ")";
	return msg;
}
