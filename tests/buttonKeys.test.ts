"use strict";

// Keyboard use of the action buttons (src/popup/buttonKeys.ts).

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { activatesButton, actionKeyDown, keepFocus, ACTION_BUTTON } from "../src/popup/buttonKeys.ts";
import type { ButtonKeyEvent } from "../src/popup/buttonKeys.ts";

function press(key : string, extra : Partial<ButtonKeyEvent> = {}) {
	const log : string[] = [];
	const e : ButtonKeyEvent = {
		key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, repeat: false,
		currentTarget: { click: () => log.push("click") },
		preventDefault: () => log.push("prevent"),
		stopPropagation: () => log.push("stop"),
		...extra
	};
	actionKeyDown(e);
	return log;
}

describe("which key presses an action button", () => {
	test("Enter and Space, alone", () => {
		assert.equal(activatesButton({ key: "Enter", ctrlKey: false, metaKey: false, altKey: false, shiftKey: false }), true);
		assert.equal(activatesButton({ key: " ", ctrlKey: false, metaKey: false, altKey: false, shiftKey: false }), true);
	});
	test("other keys, and Enter or Space with a modifier, do not", () => {
		const none = { ctrlKey: false, metaKey: false, altKey: false, shiftKey: false };
		for (const key of ["Escape", "Tab", "a", "ArrowDown", "Delete", "Backspace"]) assert.equal(activatesButton({ key, ...none }), false, key);
		for (const mod of ["ctrlKey", "metaKey", "altKey", "shiftKey"]) {
			assert.equal(activatesButton({ key: "Enter", ...none, [mod]: true }), false, mod);
			assert.equal(activatesButton({ key: " ", ...none, [mod]: true }), false, mod);
		}
	});
});

describe("actionKeyDown", () => {
	test("Enter and Space click the button and stop there", () => {
		assert.deepEqual(press("Enter"), ["prevent", "stop", "click"]);
		assert.deepEqual(press(" "), ["prevent", "stop", "click"]);
	});
	test("a held key clicks once, the repeats are swallowed", () => {
		assert.deepEqual(press("Enter", { repeat: true }), ["prevent", "stop"]);
	});
	test("other keys bubble untouched", () => {
		assert.deepEqual(press("Escape"), []);
		assert.deepEqual(press("Delete", { ctrlKey: true }), []);
		assert.deepEqual(press("Enter", { ctrlKey: true }), []);
	});
});

describe("the props of an action button", () => {
	test("tabIndex 0, after the search box (1) and the window list (2)", () => {
		assert.equal(ACTION_BUTTON.tabIndex, 0);
		assert.equal(ACTION_BUTTON.onKeyDown, actionKeyDown);
	});
	test("a mouse press does not take the focus", () => {
		let prevented = false;
		keepFocus({ preventDefault: () => { prevented = true; } });
		assert.equal(prevented, true);
		assert.equal(ACTION_BUTTON.onMouseDown, keepFocus);
	});
});

describe("native buttons on the main screen", () => {
	test("Enter and Space stay off the root's key handler, nothing is prevented", async () => {
		const { nativeButtonKeyDown } = await import("../src/popup/buttonKeys.ts");
		const log : string[] = [];
		for (const key of ["Enter", " ", "a", "Tab", "Escape"]) nativeButtonKeyDown({ key, stopPropagation: () => log.push(key) });
		assert.deepEqual(log, ["Enter", " "]);
	});
	test("the search help, Undo and Close buttons use it", async () => {
		const { readFileSync } = await import("node:fs");
		const notice = readFileSync("src/popup/views/Notice.tsx", "utf8");
		const manager = readFileSync("src/popup/views/TabManager.tsx", "utf8");
		assert.equal((notice.match(/<button [^>]*onKeyDown=\{nativeButtonKeyDown\}/g) || []).length, 2);
		assert.equal((notice.match(/<button /g) || []).length, 2);
		assert.match(manager, /<button .*search-help-icon.*onKeyDown=.nativeButtonKeyDown./);
		assert.match(manager, /flushOnHide\(document\.visibilityState, window\.inPopup\)/);
	});
});
