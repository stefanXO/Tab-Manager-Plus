"use strict";

// Unit tests for the notices in src/popup/notices.ts: the error / info list
// with its countdowns, Ctrl+Z, and the texts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { NoticeBoard, ERROR_MS, INFO_MS, MAX_NOTICES, isMacPlatform, isUndoKey, undoKeyCaps, undoKeyForField, refusedText, openFailedText } from "../src/popup/notices.ts";

function fakeTimers() {
	let now = 1000;
	let next = 1;
	const timers = new Map<number, { at : number, fn : () => void }>();
	return {
		now: () => now,
		setTimeout: (fn : () => void, ms : number) => { timers.set(next, { at: now + ms, fn }); return next++; },
		clearTimeout: (h : unknown) => { timers.delete(h as number); },
		advance(ms : number) {
			now += ms;
			for (const [h, t] of [...timers]) if (t.at <= now) { timers.delete(h); t.fn(); }
		},
		active: () => timers.size
	};
}

function setup() {
	const t = fakeTimers();
	let changes = 0;
	const board = new NoticeBoard({ onChange: () => { changes++; }, timers: t });
	return { t, board, changes: () => changes };
}

const texts = (b : NoticeBoard) => b.items.map((n) => n.text);

describe("NoticeBoard", () => {
	test("an error counts down and goes by itself", () => {
		const { t, board, changes } = setup();
		board.error("Could not save the window");
		assert.deepEqual(board.items.map((n) => [n.kind, n.text, n.ms]), [["error", "Could not save the window", ERROR_MS]]);
		assert.equal(changes(), 1);
		t.advance(ERROR_MS - 1);
		assert.equal(board.items.length, 1);
		t.advance(1);
		assert.equal(board.items.length, 0);
		assert.equal(changes(), 2);
	});

	test("an info has its own, shorter countdown", () => {
		const { t, board } = setup();
		board.info("2 saved windows restored");
		assert.equal(board.items[0].kind, "info");
		assert.equal(board.items[0].ms, INFO_MS);
		t.advance(INFO_MS);
		assert.equal(board.items.length, 0);
	});

	test("the mouse over a notice holds its countdown, and only its own", () => {
		const { t, board } = setup();
		const a = board.error("a");
		const b = board.error("b");
		board.hold(a, true);
		t.advance(ERROR_MS);
		assert.deepEqual(texts(board), ["a"]);
		assert.equal(board.left(a), ERROR_MS);
		board.hold(a, false);
		t.advance(ERROR_MS - 1);
		assert.equal(board.items.length, 1);
		t.advance(1);
		assert.equal(board.items.length, 0);
		assert.equal(board.left(b), 0);
	});

	test("closing is at once, and stops the countdown", () => {
		const { t, board, changes } = setup();
		const a = board.error("a");
		board.close(a);
		assert.equal(board.items.length, 0);
		assert.equal(t.active(), 0);
		const n = changes();
		board.close(a);
		assert.equal(changes(), n);
	});

	test("closing one under the mouse leaves nothing held", () => {
		const { t, board } = setup();
		const a = board.error("a");
		board.hold(a, true);
		board.close(a);
		board.hold(a, false);
		board.error("b");
		t.advance(ERROR_MS);
		assert.equal(board.items.length, 0);
	});

	test("limit lowers the cap, and trim drops the oldest down to it", () => {
		let limit = 3;
		const board = new NoticeBoard({ onChange: () => {}, limit: () => limit, timers: fakeTimers() });
		board.error("a");
		board.info("b");
		board.error("c");
		assert.equal(board.items.length, 3);
		limit = 2;
		board.trim();
		assert.deepEqual(board.items.map((n) => n.text), ["b", "c"]);
		board.error("d");
		assert.deepEqual(board.items.map((n) => n.text), ["c", "d"], "a new one makes the oldest go at the lower cap");
		limit = 3;
		board.info("e");
		assert.equal(board.items.length, 3);
	});

	test("closeAll takes every notice and every timer", () => {
		const { t, board, changes } = setup();
		board.error("a");
		board.info("b");
		const n = changes();
		board.closeAll();
		assert.equal(board.items.length, 0);
		assert.equal(t.active(), 0);
		assert.equal(changes(), n + 1);
		board.closeAll();
		assert.equal(changes(), n + 1);
	});

	test("the same message again starts over instead of piling up", () => {
		const { t, board } = setup();
		const first = board.error("Could not save the window");
		t.advance(ERROR_MS - 1000);
		const second = board.error("Could not save the window");
		// the same notice, its countdown run again (the bar restarts)
		assert.equal(first, second);
		assert.equal(board.runs(first), 2);
		assert.equal(board.items.length, 1);
		t.advance(ERROR_MS - 1);
		assert.equal(board.items.length, 1);
		t.advance(1);
		assert.equal(board.items.length, 0);
	});

	test("the same message again while the mouse holds it stays held, and moves to the end", () => {
		const { t, board } = setup();
		const first = board.error("Could not save the window");
		board.info("Imported");
		board.hold(first, true);
		t.advance(1000);
		assert.equal(board.error("Could not save the window"), first);
		assert.deepEqual(texts(board), ["Imported", "Could not save the window"]);
		t.advance(ERROR_MS * 2);
		assert.equal(board.left(first), ERROR_MS);
		board.hold(first, false);
		t.advance(ERROR_MS);
		assert.ok(!board.items.some((n) => n.id === first));
	});

	test("an error and an info with one text are two notices", () => {
		const { board } = setup();
		board.error("same");
		board.info("same");
		assert.equal(board.items.length, 2);
	});

	test("the oldest makes room beyond the limit", () => {
		const { board } = setup();
		for (let i = 0; i < MAX_NOTICES + 2; i++) board.error("e" + i);
		assert.equal(board.items.length, MAX_NOTICES);
		assert.deepEqual(texts(board), ["e2", "e3", "e4"]);
	});

	test("runs counts a notice's countdown starts", () => {
		const { board } = setup();
		const a = board.error("a");
		assert.equal(board.runs(a), 1);
		assert.equal(board.runs(999), 0);
	});

	test("a notice may name its own length", () => {
		const { t, board } = setup();
		board.error("short", 1000);
		t.advance(1000);
		assert.equal(board.items.length, 0);
	});
});

const key = (k : string, mods : Partial<{ ctrlKey : boolean, metaKey : boolean, shiftKey : boolean, altKey : boolean, code : string }> = {}) =>
	({ key: k, code: "", ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...mods });

describe("Ctrl+Z", () => {
	test("Ctrl+Z off a Mac, Cmd+Z on one", () => {
		assert.equal(isUndoKey(key("z", { ctrlKey: true }), false), true);
		assert.equal(isUndoKey(key("Z", { ctrlKey: true }), false), true);
		assert.equal(isUndoKey(key("z", { metaKey: true }), false), false);
		assert.equal(isUndoKey(key("z", { metaKey: true }), true), true);
		assert.equal(isUndoKey(key("z", { ctrlKey: true }), true), false);
	});

	test("not without the modifier, not redo, not with Alt, not another letter", () => {
		assert.equal(isUndoKey(key("z"), false), false);
		assert.equal(isUndoKey(key("z", { ctrlKey: true, shiftKey: true }), false), false);
		assert.equal(isUndoKey(key("Z", { metaKey: true, shiftKey: true }), true), false);
		assert.equal(isUndoKey(key("z", { ctrlKey: true, altKey: true }), false), false);
		assert.equal(isUndoKey(key("y", { ctrlKey: true }), false), false);
		assert.equal(isUndoKey(key("a", { ctrlKey: true, code: "KeyZ" }), false), false);
	});

	test("a layout whose Z key types another script is read by its place", () => {
		assert.equal(isUndoKey(key("я", { ctrlKey: true, code: "KeyZ" }), false), true);
		assert.equal(isUndoKey(key("я", { ctrlKey: true, code: "KeyQ" }), false), false);
	});

	test("the key caps follow the platform", () => {
		assert.deepEqual(undoKeyCaps(false), ["Ctrl", "Z"]);
		assert.deepEqual(undoKeyCaps(true), ["⌘", "Z"]);
		assert.equal(isMacPlatform("MacIntel"), true);
		assert.equal(isMacPlatform("macOS"), true);
		assert.equal(isMacPlatform("Win32"), false);
		assert.equal(isMacPlatform("Linux x86_64"), false);
		assert.equal(isMacPlatform(undefined), false);
	});

	test("a text field with text keeps its own undo, an empty one and the rest do not", () => {
		assert.equal(undoKeyForField(null), true);
		assert.equal(undoKeyForField({ tag: "INPUT", type: "text", value: "" }), true);
		assert.equal(undoKeyForField({ tag: "INPUT", type: "text", value: "react" }), false);
		assert.equal(undoKeyForField({ tag: "input", type: "search", value: "x" }), false);
		assert.equal(undoKeyForField({ tag: "TEXTAREA", value: "" }), false);
		assert.equal(undoKeyForField({ tag: "DIV", contentEditable: true }), false);
		assert.equal(undoKeyForField({ tag: "INPUT", type: "checkbox", value: "on" }), true);
		assert.equal(undoKeyForField({ tag: "BUTTON" }), true);
		assert.equal(undoKeyForField({ tag: "DIV" }), true);
	});

	test("the search box gives Ctrl+Z to the Undo notice, text or not", () => {
		assert.equal(undoKeyForField({ tag: "INPUT", type: "text", value: "react", search: true }), true);
		assert.equal(undoKeyForField({ tag: "INPUT", type: "text", value: "", search: true }), true);
		// another text field with text (the name screen) keeps its own undo
		assert.equal(undoKeyForField({ tag: "INPUT", type: "text", value: "react", search: false }), false);
	});
});

describe("notice texts", () => {
	test("a refused write says why, a full storage says so", () => {
		assert.equal(refusedText("save the window", new Error("Disk on fire")), "Could not save the window: Disk on fire");
		assert.equal(refusedText("save the window", "nope"), "Could not save the window: nope");
		assert.equal(refusedText("save the window", undefined), "Could not save the window.");
		assert.match(refusedText("save the window", new Error("QUOTA_BYTES quota exceeded")), /^Could not save the window: the browser's storage is full/);
		assert.match(refusedText("save the window", new Error("QuotaExceededError: storage.local set")), /storage is full/);
	});

	test("what could not be opened", () => {
		assert.equal(openFailedText(3, 3), "");
		assert.equal(openFailedText(1, 0), "Could not open the saved tab");
		assert.equal(openFailedText(3, 0), "Could not open the saved tabs");
		assert.equal(openFailedText(3, 2), "1 saved tab could not be opened");
		assert.equal(openFailedText(5, 2), "3 saved tabs could not be opened");
	});
});
