"use strict";

// Renaming and recolouring a saved window. Pure (no browser APIs), unit
// tested in tests/sessionEdit.test.ts.

import { windowName, compactName } from "./windowName.ts";

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

// The name a saved window shows (its title, hover card, notices): the name the
// user gave, else the automatic one as the naming works now, made from its
// tabs (shortened in compact mode, as an open window's title is), not the one
// stored when it was saved. A window without custom name and without usable
// tabs falls back to the stored name.
export function shownSavedName(s : Pick<EditableSession, "name" | "customName" | "tabs">, compact : boolean) : string {
	if (s.customName && s.name) return s.name;
	const auto = windowName(s.tabs);
	if (!auto) return s.name || "";
	return compact ? compactName(auto) : auto;
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
