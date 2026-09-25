"use strict";

// Loaded before the popup bundle. Keys typed while the popup is still booting
// (bundle parse, storage reads, first render) would land on the document body
// and be lost, which is what people typing right after the shortcut hit (#122).
// Buffer them here; TabManager calls takeEarlyKeys() once its search box is
// ready and puts the text in there.
const keys : string[] = [];

function onKey(e : KeyboardEvent) {
	if (e.ctrlKey || e.metaKey || e.altKey) return;
	if (e.key === "Backspace") {
		keys.pop();
	} else if (e.key.length === 1) {
		keys.push(e.key);
	}
}
document.addEventListener("keydown", onKey, true);

window.takeEarlyKeys = function () {
	document.removeEventListener("keydown", onKey, true);
	const typed = keys.join("");
	keys.length = 0;
	return typed;
};

declare global {
	interface Window {
		takeEarlyKeys?: () => string;
	}
}
export {};
