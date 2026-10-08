"use strict";

// The saved windows file: the name of the downloads and the format reader.
// Pure (no browser APIs), unit tested in tests/sessionsFile.test.ts.
//
// Session export: { format: "tab-manager-plus-export", version: 1, sessions: [...] }
// Everything export: the same format plus the debug keys (see debugExport.ts),
// so importing it restores its saved windows too.
// The reader also accepts a bare list of saved windows and the tags written by
// test builds ("tab-manager-plus-sessions", "tab-manager-plus-debug").

export const EXPORT_FORMAT = "tab-manager-plus-export";
const LEGACY_FORMATS = ["tab-manager-plus-sessions", "tab-manager-plus-debug"];

export interface SessionsFile<T = unknown> {
	format : typeof EXPORT_FORMAT;
	version : 1;
	sessions : T[];
}

export function buildSessionsFile<T>(sessions : T[]) : SessionsFile<T> {
	return { format: EXPORT_FORMAT, version: 1, sessions };
}

function stamp(date : Date) : string {
	const p = (n : number) => ("0" + n).slice(-2);
	return date.getFullYear() + "-" + p(date.getMonth() + 1) + "-" + p(date.getDate())
		+ "-" + p(date.getHours()) + "-" + p(date.getMinutes()) + "-" + p(date.getSeconds());
}

// tab-manager-plus-sessions-2030-01-02-03-04-05.json, in local time
export function sessionsFileName(date : Date) : string {
	return "tab-manager-plus-sessions-" + stamp(date) + ".json";
}

// tab-manager-plus-everything-2030-01-02-03-04-05.json, in local time
export function everythingFileName(date : Date) : string {
	return "tab-manager-plus-everything-" + stamp(date) + ".json";
}

// The list of saved windows in a parsed file, or undefined when the file is
// neither a bare list nor an object with a `sessions` list. An object with a
// format that is not ours is read too (see isForeignFormat).
export function readSessionsFile(parsed : unknown) : unknown[] | undefined {
	if (Array.isArray(parsed)) return parsed;
	if (parsed && typeof parsed === "object" && Array.isArray((parsed as { sessions? : unknown }).sessions)) {
		return (parsed as { sessions : unknown[] }).sessions;
	}
	return undefined;
}

// Whether a readable file is an object whose `format` is set and not one of
// ours; its sessions are imported anyway and the result says so.
export function isForeignFormat(parsed : unknown) : boolean {
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
	if (!Array.isArray((parsed as { sessions? : unknown }).sessions)) return false;
	const format = (parsed as { format? : unknown }).format;
	return format !== undefined && format !== EXPORT_FORMAT && !LEGACY_FORMATS.includes(format as string);
}
