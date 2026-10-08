"use strict";

// Renaming and recolouring a saved window. Pure (no browser APIs), unit
// tested in tests/sessionEdit.test.ts.

import { windowName } from "./windowName.ts";

export interface SessionEdit {
	name : string;
	color : string;
}

// the part of a saved window an edit touches or reads
interface EditableSession {
	name : string;
	color : string;
	customName : boolean;
	tabs : { url? : string, pendingUrl? : string, title? : string }[];
}

// The name field as it opens: the name the user gave, empty when the window
// still carries its automatic one (shown as the placeholder instead).
export function editableName(s : Pick<EditableSession, "name" | "customName">) : string {
	return s.customName ? s.name || "" : "";
}

// The stored sessions with one saved window renamed and recoloured, as a new
// object (the input is never changed). A name left empty means "no custom
// name", as for open windows: the window goes back to the automatic name made
// from its tabs, and restoring it no longer names the new window. Anything
// the edit does not mention (tabs, date, geometry) stays as it was. Null when
// there is no such saved window, so the caller writes nothing.
export function editSession<T extends EditableSession>(sessions : Record<string, T>, id : string, edit : SessionEdit) : Record<string, T> | null {
	const old = sessions[id];
	if (!old) return null;
	const name = edit.name.trim();
	const next : T = {
		...old,
		name: name || windowName(old.tabs) || old.name,
		color: edit.color || "default",
		customName: !!name
	};
	return { ...sessions, [id]: next };
}
