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

// sessions-2030-01-02-03-04-05.json, in local time
export function sessionsFileName(date : Date) : string {
	return "sessions-" + stamp(date) + ".json";
}

// everything-2030-01-02-03-04-05.json, in local time
export function everythingFileName(date : Date) : string {
	return "everything-" + stamp(date) + ".json";
}

// The list of saved windows in a parsed file, or undefined when the file is
// neither a bare list nor an object with a `sessions` list.
export function readSessionsFile(parsed : unknown) : unknown[] | undefined {
	if (Array.isArray(parsed)) return parsed;
	if (parsed && typeof parsed === "object" && Array.isArray((parsed as { sessions? : unknown }).sessions)) {
		const format = (parsed as { format? : unknown }).format;
		if (format !== undefined && format !== EXPORT_FORMAT && !LEGACY_FORMATS.includes(format as string)) return undefined;
		return (parsed as { sessions : unknown[] }).sessions;
	}
	return undefined;
}
