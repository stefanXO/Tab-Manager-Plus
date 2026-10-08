"use strict";

// What a tab drag carries in its DataTransfer, and what a drop reads back.
//
// A drag of saved tabs carries, under SAVED_TAB_DRAG, the saved window id and
// stored index of every saved tab it takes; a drag of open tabs carries the
// ids of the open tabs it takes under OPEN_TAB_DRAG. Both are decided once,
// at dragstart (the dragged tab, or the selection it is in). A drop takes
// what it opens, moves or copies from its own event, so it no longer depends
// on the page still remembering the drag when the drop arrives: not on a
// dragend that forgets it coming first, nor on the drop landing in the page
// the drag started in (saved tab keys, ./sessionKeys.ts, are numbered per
// page, so the drag names saved tabs by saved window and index instead).
// dragover cannot read the data, only its types: the page's memory of the
// drag still decides the drop markers.
//
// Also: which tiles the drag image of a several-tab drag shows. Pure, unit
// tested in tests/dragPayload.test.ts.

import type {SavedTabRef} from "./sessionKeys.ts";
import {SAVED_TAB_DRAG, isSavedTabDrag} from "./savedDrag.ts";
import {OPEN_TAB_DRAG, isOpenTabDrag} from "./savedAdd.ts";

export type TabDrag = { kind : "saved", refs : SavedTabRef[] } | { kind : "open", ids : number[] };

// the part of a DataTransfer this reads
export interface DragDataLike {
	types : ArrayLike<string>;
	getData(type : string) : string;
}

// saved tabs as drag data: [[saved window id, index], …]
export function encodeSaved(refs : readonly SavedTabRef[]) : string {
	return JSON.stringify(refs.map((ref) => [ref.sessionId, ref.index]));
}

// The saved tabs in `text`, in order, each once. Entries that are not a
// saved window id and a whole index of 0 or more are left out.
export function decodeSaved(text : string | null | undefined) : SavedTabRef[] {
	const out : SavedTabRef[] = [];
	if (!text) return out;
	let list : unknown;
	try { list = JSON.parse(text); } catch { return out; }
	if (!Array.isArray(list)) return out;
	for (const entry of list) {
		if (!Array.isArray(entry) || entry.length !== 2) continue;
		const [sessionId, index] = entry;
		if (typeof sessionId !== "string" || !sessionId || !Number.isSafeInteger(index) || index < 0) continue;
		if (out.some((ref) => ref.sessionId === sessionId && ref.index === index)) continue;
		out.push({ sessionId, index });
	}
	return out;
}

// open tabs as drag data: their ids
export function encodeIds(ids : readonly number[]) : string {
	return ids.join(",");
}

// The open tab ids in `text` (whole numbers, 0 or more), in order, each once.
export function decodeIds(text : string | null | undefined) : number[] {
	const out : number[] = [];
	if (!text) return out;
	for (const part of text.split(",")) {
		const trimmed = part.trim();
		if (!/^\d+$/.test(trimmed)) continue;
		const id = Number(trimmed);
		if (!Number.isSafeInteger(id) || out.includes(id)) continue;
		out.push(id);
	}
	return out;
}

// The tabs a dropped drag carries. Null when it is no tab drag of Tab Manager,
// or carries nothing usable (data the browser did not keep): the drop then
// falls back on what the page remembers of the drag.
export function readTabDrag(data : DragDataLike | null | undefined) : TabDrag | null {
	if (!data) return null;
	try {
		if (isSavedTabDrag(data.types)) {
			const refs = decodeSaved(data.getData(SAVED_TAB_DRAG));
			return refs.length ? { kind: "saved", refs } : null;
		}
		if (isOpenTabDrag(data.types)) {
			const ids = decodeIds(data.getData(OPEN_TAB_DRAG));
			return ids.length ? { kind: "open", ids } : null;
		}
	} catch {
		// a DataTransfer that refuses to be read
	}
	return null;
}

// The tiles a drag image of several tabs shows, front first: the dragged one,
// then the next ones of the drag in its order, `max` in all. One tab (or
// none): nothing, the browser's own picture of the tile is used.
export function stackTiles(dragged : number, ids : readonly number[], max = 3) : number[] {
	if (ids.length < 2) return [];
	const rest = ids.filter((id) => id !== dragged);
	return (ids.includes(dragged) ? [dragged, ...rest] : rest).slice(0, max);
}

// How the drag image draws its tiles, by the layout the popup is in: "titled"
// (favicon and title, the List layout's rows) or icon tiles only, as the
// layout draws its tabs: "icons" (Blocks and Rows, 1.4rem tiles) and
// "icons-big" (Big blocks, 2.5rem tiles). Layout values as stored
// (src/helpers/settings.ts LAYOUT); an unknown one gets the titled stack.
export type StackKind = "titled" | "icons" | "icons-big";
export function stackKind(layout : string | null | undefined) : StackKind {
	switch (layout) {
		case "blocks":
		case "horizontal":
			return "icons";
		case "blocks-big":
			return "icons-big";
		default:
			return "titled";
	}
}

// the count under the stack
export function stackLabel(count : number) : string {
	return count + " tabs";
}
