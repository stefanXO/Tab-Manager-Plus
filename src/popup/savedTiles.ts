"use strict";

// The tiles of saved tabs, by their selection key (./sessionKeys.ts), so the
// stats card can show the favicon (and the tone) a tile resolved: open tiles
// are reached through the windows' refs, saved ones have no window to ask.
// Session creates a ref per saved tab and hands it to the Tab; the registry
// lives as long as the popup, like the keys.

import type {FaviconTone} from "@helpers/favicon";

export interface SavedTile {
	state : { favIcon : string; iconTone : FaviconTone };
}

export interface SavedTileRef {
	current : SavedTile | null;
}

const refs = new Map<number, SavedTileRef>();

// the ref of the tile with this key; the same key always gets the same ref
export function savedTileRef(key : number) : SavedTileRef {
	let ref = refs.get(key);
	if (!ref) {
		ref = { current: null };
		refs.set(key, ref);
	}
	return ref;
}

// the tile mounted for this key right now, if any
export function savedTile(key : number) : SavedTile | null {
	return refs.get(key)?.current ?? null;
}
