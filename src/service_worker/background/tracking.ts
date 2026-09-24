"use strict";

import {hashcode} from "@background/windows"
import {debounce} from "@helpers/utils";
import {getLocalStorageMap, setLocalStorageMap, getLocalStorage, setLocalStorage} from "@helpers/storage";
import * as S from "@strings";
import * as browser from 'webextension-polyfill';
import {ICommand} from "@types";

export const cleanupDebounce = debounce(cleanUp, 500);

// A name or color whose window has been gone this long is dropped for good.
// Shorter and a window reopened from the history would lose its name; the
// browser restart case is unaffected, restored windows get their entries back
// within seconds through the hash match below.
const ORPHAN_MAX_AGE = 24 * 60 * 60 * 1000;

// Re-attaches window names, colors and hashes after the browser gave the
// windows new ids (restart, reopen from history), and with remove_old purges
// the entries that have been without a window for over ORPHAN_MAX_AGE.
export async function cleanUp(remove_old = false) {
	let activewindows = await browser.windows.getAll({populate: true});
	let windowids: number[] = [];
	for (let _w of activewindows) {
		windowids.push(_w.id);
	}
	// console.log("window ids...", windowids);

	let windows = await getLocalStorage("windowAge", []);
	if (!(windows instanceof Array)) windows = [];

	// console.log("before", JSON.parse(JSON.stringify(windows)));
	for (let i = windows.length - 1; i >= 0; i--) {
		if (windowids.indexOf(windows[i]) < 0) {
			// console.log("did not find", windows[i], i);
			windows.splice(i, 1);
		}
	}

	// console.log("after", JSON.parse(JSON.stringify(windows)));
	await setLocalStorage("windowAge", windows);

	let names : Map<number, string> = await getLocalStorageMap<number, string>(S.windowNames);
	let colors : Map<number, string> = await getLocalStorageMap<number, string>(S.windowColors);
	let to_check = new Set<number>();
	let exists = new Set<number>();
	let to_refresh : number[] = [];

	// console.log("before", JSON.parse(JSON.stringify(names)));
	for (const [id, _name] of names) {
		if (windowids.indexOf(id) < 0) {
			// console.log("did not find", id);
			to_check.add(id);
		} else {
			exists.add(id);
		}
	}

	for (const [id, _color] of colors) {
		if (windowids.indexOf(id) < 0) {
			// console.log("did not find", id);
			to_check.add(id);
		} else {
			exists.add(id);
		}
	}

	let hashes : Map<number, number> = await getLocalStorageMap<number, number>(S.windowHashes);
	let found = false;

	if (to_check.size > 0) {
		for (let w of activewindows) {
			// a window that already has a name or color must not adopt a stale one
			if (names.has(w.id) || colors.has(w.id)) continue;
			const windowhash = hashcode(w);
			for (const [id, _hash] of hashes) {
				if (!to_check.has(id)) continue;
				if (exists.has(id)) continue;
				if (w.id === id) continue;
				if (_hash === windowhash) {
					console.log("found by hash, old id " + id + " new id " + w.id);
					to_refresh.push(w.id);
					if (!!names.get(id)) {
						names.set(w.id, names.get(id));
						names.delete(id);
					}
					if (!!colors.get(id)) {
						colors.set(w.id, colors.get(id));
						colors.delete(id);
					}
					hashes.set(w.id, _hash);
					hashes.delete(id);
					found = true;
					to_check.delete(id);
					break;
				}
			}
		}
	}

	// remember when each still unmatched entry was first seen without a
	// window, forget the ones that got a window back (window ids are small
	// numbers the browser reuses after a restart, a stale timestamp would
	// purge a new window's name on the first pass)
	const orphaned : Map<number, number> = await getLocalStorageMap<number, number>(S.windowOrphaned);
	const now = Date.now();
	let orphanedChanged = false;
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

	let save = false;
	if (remove_old) {
		for (const _id of to_check) {
			if (now - orphaned.get(_id) < ORPHAN_MAX_AGE) continue;
			console.log("dropping window " + _id + ", gone for over a day");
			colors.delete(_id);
			names.delete(_id);
			hashes.delete(_id);
			orphaned.delete(_id);
			orphanedChanged = true;
			save = true;
		}
		// a hash without a name or color carries nothing worth keeping
		for (const id of hashes.keys()) {
			if (windowids.indexOf(id) < 0 && !names.has(id) && !colors.has(id)) {
				hashes.delete(id);
				save = true;
			}
		}
	}

	if (orphanedChanged) {
		await setLocalStorageMap<number, number>(S.windowOrphaned, orphaned);
	}
	if (found || save) {
		await setLocalStorageMap<number, string>(S.windowNames, names);
		await setLocalStorageMap<number, string>(S.windowColors, colors);
		await setLocalStorageMap<number, number>(S.windowHashes, hashes);
		if (found) {
			browser.runtime.sendMessage<ICommand>({
				command: S.refresh_windows,
				window_ids: to_refresh
			});
		}
	}
}