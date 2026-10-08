"use strict";

// The drag image of a drag that takes several tabs (open or saved): up to
// three tab tiles stacked, the dragged one in front, and the number of tabs
// under them (css/components/drag.css). Built off screen at dragstart, handed
// to setDragImage, which takes its picture right away, and removed on the
// next task. Which tiles: ./dragPayload.ts.

import {stackLabel} from "./dragPayload.ts";

// one tile of the stack: the favicon as a css url() value ("" for none) and
// the title
export interface StackTile {
	fav : string;
	title : string;
}

// where the pointer holds the image: just inside its top left corner, so the
// stack and the count hang below and to the right of the pointer
const HOLD_X = 10;
const HOLD_Y = 10;

export function setStackImage(dataTransfer : DataTransfer | null | undefined, tiles : readonly StackTile[], count : number) : void {
	if (!dataTransfer || typeof dataTransfer.setDragImage !== "function" || tiles.length === 0) return;
	const stack = document.createElement("div");
	stack.className = "drag-stack";
	stack.setAttribute("aria-hidden", "true");
	stack.style.setProperty("--layers", String(tiles.length));
	// back to front: the dragged tab is painted last, on top
	for (let i = tiles.length - 1; i >= 0; i--) {
		const tile = document.createElement("div");
		tile.className = i === 0 ? "drag-tile" : "drag-tile behind";
		tile.style.setProperty("--depth", String(i));
		const fav = document.createElement("span");
		fav.className = "drag-fav";
		if (tiles[i].fav) fav.style.setProperty("--fav", tiles[i].fav);
		const title = document.createElement("span");
		title.className = "drag-title";
		title.textContent = tiles[i].title;
		tile.append(fav, title);
		stack.append(tile);
	}
	const label = document.createElement("div");
	label.className = "drag-count";
	label.textContent = stackLabel(count);
	stack.append(label);
	document.body.append(stack);
	try {
		dataTransfer.setDragImage(stack, HOLD_X, HOLD_Y);
	} finally {
		setTimeout(() => stack.remove(), 0);
	}
}
