"use strict";

// Keys for saved tabs (the tabs of a saved window, ISavedSession.tabs) in the
// popup's selection and hiddenTabs sets, which otherwise hold open tab ids.
//
// A saved tab has no usable id of its own: the id it was stored with belonged
// to an open tab when the window was saved and may belong to another open tab
// now, and its index (0, 1, 2...) is an ordinary open tab id too. Open tab ids
// are >= 0 and tabs.TAB_ID_NONE is -1, so a saved tab gets a negative number
// below -1, handed out once per (saved window id, index) and kept for as long
// as the popup is open. The key maps back to its saved window and index.

export interface SavedTabRef {
	sessionId : string;
	index : number;
}

// the shape of a saved window this module needs (ISavedSession has more)
export interface SavedWindowLike {
	id : string;
	tabs : { index? : number, url? : string, title? : string }[];
}

export class SavedTabKeys {
	private next = -2;
	private readonly keys = new Map<string, number>();
	private readonly refs = new Map<number, SavedTabRef>();

	// the key of the tab at `index` in the saved window `sessionId`; the same
	// pair always gets the same key
	key(sessionId : string, index : number) : number {
		const name = JSON.stringify([sessionId, index]);
		let key = this.keys.get(name);
		if (key === undefined) {
			key = this.next--;
			this.keys.set(name, key);
			this.refs.set(key, { sessionId, index });
		}
		return key;
	}

	// the saved window and index a key was handed out for
	ref(key : number) : SavedTabRef | undefined {
		const ref = this.refs.get(key);
		return ref ? { ...ref } : undefined;
	}
}

// the popup's one registry (one per page load, so keys last the popup's lifetime)
export const savedTabKeys = new SavedTabKeys();

export function isSavedTabKey(id : number) : boolean {
	return id < -1;
}

// The two kinds of tab a selection key names.
export type TabKind = "open" | "saved";

export function tabKind(id : number) : TabKind {
	return isSavedTabKey(id) ? "saved" : "open";
}

// The selection never mixes open tabs and saved tabs: before a tab of `kind`
// is selected, every key of the other kind is dropped. True when something
// was dropped.
export function keepKind(selection : Set<number>, kind : TabKind) : boolean {
	let dropped = false;
	for (const id of [...selection]) {
		if (tabKind(id) !== kind) {
			selection.delete(id);
			dropped = true;
		}
	}
	return dropped;
}

// Something is selected and all of it is saved tabs. The open-tab actions
// (close, discard, pin, move to a new window) have nothing to act on then.
export function onlySavedSelected(selection : ReadonlySet<number>) : boolean {
	if (selection.size === 0) return false;
	for (const id of selection) if (!isSavedTabKey(id)) return false;
	return true;
}

// Drops the selected saved tabs whose saved window or index no longer exists
// (the saved window was deleted, or changed in another popup). With `before`
// (the saved windows as they were), also the ones whose index now names
// another tab: a saved window rewritten with its tabs numbered anew (imported
// over, changed elsewhere, its indexes fixed) would otherwise select whatever
// tab took the number. True when something was dropped.
export function dropMissingSaved(selection : Set<number>, sessions : readonly SavedWindowLike[], keys : SavedTabKeys = savedTabKeys, before? : readonly SavedWindowLike[]) : boolean {
	let dropped = false;
	for (const id of [...selection]) {
		if (!isSavedTabKey(id)) continue;
		const ref = keys.ref(id);
		const session = ref && sessions.find((s) => s.id === ref.sessionId);
		const tab = session && session.tabs.find((t) => t.index === ref.index);
		let gone = !tab;
		if (tab && before) {
			const old = before.find((s) => s.id === ref!.sessionId);
			const was = old && old.tabs !== session!.tabs ? old.tabs.find((t) => t.index === ref!.index) : undefined;
			if (was && (was.url !== tab.url || was.title !== tab.title)) gone = true;
		}
		if (gone) {
			selection.delete(id);
			dropped = true;
		}
	}
	return dropped;
}
