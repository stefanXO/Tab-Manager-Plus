"use strict";

// The order of the saved windows. Each saved window may carry an `order`
// number (ISavedSession.order): the ones with one come first, lowest first;
// the ones without (saved before this existed) come after them, newest first,
// as a new save is listed first. Dragging a card renumbers every saved window
// 0, 1, 2…; a new saved window (and an imported one) gets a number below all
// of them, so it is listed first. Pure, unit tested in
// tests/sessionOrder.test.ts.

// the part of a saved window the order reads
export interface Orderable {
	id : string;
	order? : number;
	// when it was saved (ms)
	date? : number;
}

function ordered(s : Orderable) : boolean {
	return typeof s.order === "number" && Number.isFinite(s.order);
}

// when it was saved; without a usable date, older than any
function dateOf(s : Orderable) : number {
	return typeof s.date === "number" && Number.isFinite(s.date) ? s.date : -Infinity;
}

// The saved windows in the order they are listed. Stable: equal numbers, and
// the ones without a number saved at the same time, keep the order they come in.
export function sortSessions<T extends Orderable>(sessions : readonly T[]) : T[] {
	return sessions
		.map((s, at) => ({ s, at }))
		.sort((a, b) => {
			const oa = ordered(a.s), ob = ordered(b.s);
			if (oa && ob) return (a.s.order! - b.s.order!) || (a.at - b.at);
			if (oa !== ob) return oa ? -1 : 1;
			const da = dateOf(a.s), db = dateOf(b.s);
			if (da !== db) return db > da ? 1 : -1;
			return a.at - b.at;
		})
		.map((e) => e.s);
}

// `ids` with `dragged` moved right before (or after) `target`; null when that
// changes nothing (dropped on itself, or next to where it already is) or
// either id is not in the list.
export function moveSession(ids : readonly string[], dragged : string, target : string, before : boolean) : string[] | null {
	if (dragged === target) return null;
	const from = ids.indexOf(dragged);
	if (from < 0 || ids.indexOf(target) < 0) return null;
	const rest = ids.filter((id) => id !== dragged);
	const to = rest.indexOf(target) + (before ? 0 : 1);
	const next = [...rest.slice(0, to), dragged, ...rest.slice(to)];
	return next.every((id, i) => id === ids[i]) ? null : next;
}

// The stored saved windows (the `sessions` storage object) after a drag of
// `dragged` before / after `target`: a new object, every saved window in it
// numbered by its new place, the other fields and the keys' order as they
// were. Null when nothing moves. Entries that are not saved windows (no id)
// are left as they are.
export function reorderSessions<T extends Orderable>(stored : Readonly<Record<string, T>>, dragged : string, target : string, before : boolean) : Record<string, T> | null {
	const keys = Object.keys(stored).filter((key) => isSaved(stored[key]));
	const list = sortSessions(keys.map((key) => ({ key, id: stored[key].id, order: stored[key].order, date: stored[key].date })));
	const ids = list.map((e) => e.id);
	const next = moveSession(ids, dragged, target, before);
	if (!next) return null;
	const place = new Map(next.map((id, i) => [id, i]));
	const out : Record<string, T> = {};
	for (const key of Object.keys(stored)) {
		const s = stored[key];
		out[key] = isSaved(s) && place.has(s.id) ? { ...s, order: place.get(s.id)! } : s;
	}
	return out;
}

// The same, for a drag among the cards on screen (`shown`: their ids, in
// order; a pending delete or a search can hide some): null when the drop
// changes nothing there, even if it would move the dragged card past hidden
// ones. Otherwise it lands right before / after `target` in the stored order,
// and the hidden ones keep their places around it.
export function reorderShown<T extends Orderable>(stored : Readonly<Record<string, T>>, shown : readonly string[], dragged : string, target : string, before : boolean) : Record<string, T> | null {
	if (moveSession(shown, dragged, target, before) === null) return null;
	return reorderSessions(stored, dragged, target, before);
}

function isSaved(s : unknown) : s is Orderable {
	return !!s && typeof s === "object" && typeof (s as Orderable).id === "string";
}

// The numbers for `count` new saved windows, in the order they are listed:
// all below every number in use, so they come first. With no numbers in use
// they still come first, since the saved windows without one go last.
export function firstOrders(stored : Readonly<Record<string, unknown>>, count : number) : number[] {
	let lowest = 0;
	for (const s of Object.values(stored)) {
		if (isSaved(s) && ordered(s) && s.order! < lowest) lowest = s.order!;
	}
	return Array.from({ length: count }, (_, i) => lowest - count + i);
}

export type DropSide = "before" | "after";

// Where a card dragged over `rect` at (x, y) goes: before the card over its
// first half, after it over the second; left / right halves while the cards
// stand side by side (`across`: a grid with more than one column), top /
// bottom halves when they are stacked.
export function dropSide(rect : { left : number, top : number, width : number, height : number }, x : number, y : number, across : boolean) : DropSide {
	if (across) return x < rect.left + rect.width / 2 ? "before" : "after";
	return y < rect.top + rect.height / 2 ? "before" : "after";
}

// The drag data type of a saved window card. A drag carrying it is not a tab:
// open windows and tabs take no drop from it, and only saved window cards do.
export const SAVED_WINDOW_DRAG = "application/x-tab-manager-saved-window";

export function isSavedWindowDrag(types : ArrayLike<string> | null | undefined) : boolean {
	return !!types && Array.from(types).includes(SAVED_WINDOW_DRAG);
}
