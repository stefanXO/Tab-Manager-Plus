"use strict";

// The drag image of a drag that takes several tabs (open or saved): up to
// three tab tiles stacked, the dragged one in front (titled rows in the List
// layout, icon tiles only in the layouts that show tabs as icons), and the
// number of tabs under them (css/components/drag.css). Built off screen at
// dragstart, handed to setDragImage, which takes its picture right away, and
// removed on the next task. Which tiles and how they look: ./dragPayload.ts.

import {stackLabel, StackKind} from "./dragPayload.ts";

// one tile of the stack: the favicon as a css url() value ("" for none), the
// title (titled stack only) and the favicon's tone class ("icon-mono-light"
// and so on, "" for none: css/components/tab.css), so a white or black icon
// keeps the filter its real tile gives it
export interface StackTile {
	fav : string;
	title : string;
	tone? : string;
}

// where the pointer holds the image: inside the top left corner of the
// titled stack, so the stack and the count hang below and to the right of the
// pointer; on the middle of the front tile of an icon stack (the stack's
// padding, css/components/drag.css --pad, plus half a tile)
const HOLD : Record<StackKind, {x : number, y : number}> = {
	"titled": {x: 10, y: 10},
	"icons": {x: 15, y: 15},
	"icons-big": {x: 24, y: 24}
};

// `kind`: titled rows (the List layout) or icon tiles only (the layouts that
// show tabs as icons), see stackKind() in ./dragPayload.ts
export function setStackImage(dataTransfer : DataTransfer | null | undefined, tiles : readonly StackTile[], count : number, kind : StackKind = "titled") : void {
	if (!dataTransfer || typeof dataTransfer.setDragImage !== "function" || tiles.length === 0) return;
	const stack = document.createElement("div");
	stack.className = "drag-stack " + kind;
	stack.setAttribute("aria-hidden", "true");
	stack.style.setProperty("--layers", String(tiles.length));
	// back to front: the dragged tab is painted last, on top
	for (let i = tiles.length - 1; i >= 0; i--) {
		const tile = document.createElement("div");
		tile.className = "drag-tile" + (i === 0 ? "" : " behind");
		tile.style.setProperty("--depth", String(i));
		const fav = document.createElement("span");
		fav.className = "drag-fav";
		if (tiles[i].fav) fav.style.setProperty("--fav", tiles[i].fav);
		if (tiles[i].tone) fav.classList.add(tiles[i].tone as string);
		tile.append(fav);
		if (kind === "titled") {
			const title = document.createElement("span");
			title.className = "drag-title";
			title.textContent = tiles[i].title;
			tile.append(title);
		}
		stack.append(tile);
	}
	const label = document.createElement("div");
	label.className = "drag-count";
	label.textContent = stackLabel(count);
	stack.append(label);
	document.body.append(stack);
	try {
		dataTransfer.setDragImage(stack, HOLD[kind].x, HOLD[kind].y);
	} finally {
		setTimeout(() => stack.remove(), 0);
	}
}
