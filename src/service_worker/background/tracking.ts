"use strict";

import {hashcode} from "@background/windows"
import {notifyRefresh} from "@background/actions";
import {debounce} from "@helpers/utils";
import {getLocalStorageMap, setLocalStorageMap, getLocalStorage, setLocalStorage, serialized} from "@helpers/storage";
import * as S from "@strings";
import * as browser from 'webextension-polyfill';

export const cleanupDebounce = debounce(cleanUp, 500);

// A name or color whose window has been gone this long is dropped for good.
// Shorter and a window reopened from the history would lose its name; the
// browser restart case is unaffected, restored windows get their entries back
// within seconds through the hash match below.
const ORPHAN_MAX_AGE = 24 * 60 * 60 * 1000;

// Window ids are small numbers that start over with every browser session, so
// after a restart a stored id says nothing about which window it belonged to:
// the restored "Work" window may well get the id a window named "Old" had
// last week. Called once at browser start, this moves every stored entry to
// the negative of its id, which no live window can ever have. From then on
// only the hash match below can hand an entry to a window, and entries that
// never match age out.
export async function forgetWindowIds() {
	await serialized(async function () {
		for (const key of [S.windowNames, S.windowColors, S.windowHashes, S.windowOrphaned]) {
			const map : Map<number, unknown> = await getLocalStorageMap<number, unknown>(key);
			const moved = new Map<number, unknown>();
			for (const [id, value] of map) {
				moved.set(id > 0 ? -id : id, value);
			}
			await setLocalStorageMap(key, moved);
		}
	});
}

// Re-attaches window names, colors and hashes after the browser gave the
// windows new ids (restart, reopen from history), and with remove_old purges
// the entries that have been without a window for over ORPHAN_MAX_AGE.
export function cleanUp(remove_old = false) : Promise<void> {
	return serialized(function () {
		return cleanUpLocked(remove_old);
	});
}

async function cleanUpLocked(remove_old : boolean) {
	const activewindows = await browser.windows.getAll({populate: true});
	const windowids : number[] = [];
	for (const _w of activewindows) {
		if (_w.id === undefined) continue;
		windowids.push(_w.id);
	}

	// forget closed windows in the recency order
	let windows = await getLocalStorage("windowAge", []);
	if (!(windows instanceof Array)) windows = [];
	let windowsChanged = false;
	for (let i = windows.length - 1; i >= 0; i--) {
		if (windowids.indexOf(windows[i]) < 0) {
			windows.splice(i, 1);
			windowsChanged = true;
		}
	}
	// the popup re-renders on every windowAge write, so only write a change
	if (windowsChanged) await setLocalStorage("windowAge", windows);

	const names : Map<number, string> = await getLocalStorageMap<number, string>(S.windowNames);
	const colors : Map<number, string> = await getLocalStorageMap<number, string>(S.windowColors);
	const hashes : Map<number, number> = await getLocalStorageMap<number, number>(S.windowHashes);
	const orphaned : Map<number, number> = await getLocalStorageMap<number, number>(S.windowOrphaned);

	// entries whose window is gone
	const to_check = new Set<number>();
	for (const id of names.keys()) {
		if (windowids.indexOf(id) < 0) to_check.add(id);
	}
	for (const id of colors.keys()) {
		if (windowids.indexOf(id) < 0) to_check.add(id);
	}

	let namesChanged = false, colorsChanged = false, hashesChanged = false, orphanedChanged = false;
	const to_refresh : number[] = [];

	// hand each of them to the live window with the same set of urls, if any
	if (to_check.size > 0) {
		for (const w of activewindows) {
			if (w.id === undefined) continue;
			// a window that already has a name or color must not adopt a stale one
			if (names.has(w.id) || colors.has(w.id)) continue;
			const windowhash = hashcode(w);
			for (const [id, _hash] of hashes) {
				if (!to_check.has(id)) continue;
				if (_hash !== windowhash) continue;
				console.log("found by hash, old id " + id + " new id " + w.id);
				to_refresh.push(w.id);
				if (names.has(id)) {
					names.set(w.id, names.get(id));
					names.delete(id);
					namesChanged = true;
				}
				if (colors.has(id)) {
					colors.set(w.id, colors.get(id));
					colors.delete(id);
					colorsChanged = true;
				}
				hashes.set(w.id, _hash);
				hashes.delete(id);
				hashesChanged = true;
				to_check.delete(id);
				break;
			}
		}
	}

	// remember when each still unmatched entry was first seen without a
	// window, forget the ones that got a window back
	const now = Date.now();
	for (const id of to_check) {
		if (!orphaned.has(id)) {
			orphaned.set(id, now);
			orphanedChanged = true;
		}
	}
	for (const id of orphaned.keys()) {
		if (!to_check.has(id)) {
			orphaned.delete(id);
			orphanedChanged = true;
		}
	}

	if (remove_old) {
		for (const id of to_check) {
			if (now - orphaned.get(id) < ORPHAN_MAX_AGE) continue;
			console.log("dropping window " + id + ", gone for over a day");
			if (names.delete(id)) namesChanged = true;
			if (colors.delete(id)) colorsChanged = true;
			if (hashes.delete(id)) hashesChanged = true;
			orphaned.delete(id);
			orphanedChanged = true;
		}
		// a hash without a name or color carries nothing worth keeping
		for (const id of hashes.keys()) {
			if (windowids.indexOf(id) < 0 && !names.has(id) && !colors.has(id)) {
				hashes.delete(id);
				hashesChanged = true;
			}
		}
	}

	// write only what changed: every write here overwrites the whole map
	if (namesChanged) await setLocalStorageMap<number, string>(S.windowNames, names);
	if (colorsChanged) await setLocalStorageMap<number, string>(S.windowColors, colors);
	if (hashesChanged) await setLocalStorageMap<number, number>(S.windowHashes, hashes);
	if (orphanedChanged) await setLocalStorageMap<number, number>(S.windowOrphaned, orphaned);
	if (to_refresh.length > 0) notifyRefresh(to_refresh);
}
