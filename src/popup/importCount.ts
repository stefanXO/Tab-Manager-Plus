"use strict";

import { maybePluralize } from "../helpers/utils.ts";
import { isForeignFormat, readSessionsFile } from "./sessionsFile.ts";
import { fileKind, SETTINGS_FILE_FOR_SESSIONS } from "./settingsFile.ts";

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
	// a sessions list under a format tag that is not ours
	foreignFormat? : boolean;
}

export function planImport<T = unknown>(parsed : unknown) : ImportPlan<T> {
	const plan : ImportPlan<T> = { valid: [], skipped: {} };
	// a settings file is for Import Settings (the debug file is read: it holds saved windows too)
	if (fileKind(parsed) === "settings") {
		plan.fatal = SETTINGS_FILE_FOR_SESSIONS;
		return plan;
	}
	const list = readSessionsFile(parsed);
	if (!list) {
		plan.fatal = "The file is JSON, but not a list of saved windows";
		return plan;
	}
	if (isForeignFormat(parsed)) plan.foreignFormat = true;
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

// "2 saved windows restored, 1 already there, 1 skipped (no tabs)";
// failedWrites are valid entries the browser refused to store, alreadyThere
// valid ones left out because a saved window with the same tabs is stored
// (../sessionStore.ts importSessions)
export const FOREIGN_FORMAT_NOTE = "The file was not in Tab Manager Plus's format.";

export function importSummary(plan : ImportPlan<unknown>, failedWrites = 0, alreadyThere = 0) : string {
	const text = importSummaryText(plan, failedWrites, alreadyThere);
	return plan.foreignFormat ? text + ". " + FOREIGN_FORMAT_NOTE : text;
}

function importSummaryText(plan : ImportPlan<unknown>, failedWrites : number, alreadyThere : number) : string {
	if (plan.fatal) return plan.fatal;
	const restored = plan.valid.length - failedWrites - alreadyThere;
	const parts : string[] = [];
	for (const [reason, n] of Object.entries(plan.skipped)) parts.push(n + " " + reason);
	if (failedWrites) parts.push(failedWrites + " could not be stored");
	const skipped = Object.values(plan.skipped).reduce((a, b) => a + b, 0) + failedWrites;
	let tail = "";
	if (alreadyThere) tail += ", " + alreadyThere + " already there";
	if (skipped) tail += ", " + skipped + " skipped (" + parts.join(", ") + ")";
	if (restored <= 0) {
		if (alreadyThere) return "No new saved windows" + tail;
		return skipped ? "No saved windows restored" + tail : "No saved windows in the file";
	}
	return maybePluralize(restored, "saved window") + " restored" + tail;
}

// whether the import went well enough to say so as a note, not an error:
// something was restored, or everything usable was already there
export function importWorked(plan : ImportPlan<unknown>, failedWrites = 0, alreadyThere = 0) : boolean {
	if (plan.fatal) return false;
	return plan.valid.length - failedWrites - alreadyThere > 0 || (alreadyThere > 0 && failedWrites === 0);
}
