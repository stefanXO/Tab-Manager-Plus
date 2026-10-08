"use strict";

// The saved windows file: the name of the downloads and the format reader.
// Pure (no browser APIs), unit tested in tests/sessionsFile.test.ts.
//
// Session export: { format: "tab-manager-plus-sessions", version: 1, sessions: [...] }
// Debug export ("everything"): the same plus the debug keys (see debugExport.ts),
// so importing it restores its saved windows too.
// Older exports are a bare list of saved windows; the reader accepts all three.

export const SESSIONS_FORMAT = "tab-manager-plus-sessions";

export interface SessionsFile<T = unknown> {
	format : typeof SESSIONS_FORMAT;
	version : 1;
	sessions : T[];
}

export function buildSessionsFile<T>(sessions : T[]) : SessionsFile<T> {
	return { format: SESSIONS_FORMAT, version: 1, sessions };
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
		return (parsed as { sessions : unknown[] }).sessions;
	}
	return undefined;
}
