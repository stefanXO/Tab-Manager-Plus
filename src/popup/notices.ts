"use strict";

// The notices over the bottom bar. There are three kinds, drawn by one
// component (./views/Notice.tsx): the Undo notice after a delete (its
// countdown lives in ./pendingDelete.ts), and the two kept here, which have no
// Undo: an error (red edge and tint) and an info (what an import did). Each
// has a countdown that a mouse over it holds (./countdown.ts) and a close
// button.

import { Countdown, realTimers } from "./countdown.ts";
import type { Timers } from "./countdown.ts";

export type NoticeKind = "undo" | "error" | "info";

// An error stays long enough to be read twice; the rest of the page goes on
export const ERROR_MS = 12000;
export const INFO_MS = 8000;
// older ones make room when more are open
export const MAX_NOTICES = 3;

export interface Notice {
	id : number;
	kind : "error" | "info";
	text : string;
	// the countdown's length
	ms : number;
}

export interface NoticeBoardOptions {
	// the list changed (shown, closed, ended): render again
	onChange() : void;
	timers? : Timers;
}

// The errors and infos on screen, oldest first. The same message shown again
// does not pile up: it replaces the earlier one and starts its countdown over.
export class NoticeBoard {
	private list : Notice[] = [];
	private readonly clocks = new Map<number, Countdown>();
	private next = 1;
	private readonly timers : Timers;
	private readonly options : NoticeBoardOptions;

	constructor(options : NoticeBoardOptions) {
		this.options = options;
		this.timers = options.timers ?? realTimers;
	}

	get items() : readonly Notice[] {
		return this.list;
	}

	show(kind : Notice["kind"], text : string, ms? : number) : number {
		const length = ms ?? (kind === "error" ? ERROR_MS : INFO_MS);
		for (const old of this.list.filter((n) => n.kind === kind && n.text === text)) this.drop(old.id);
		while (this.list.length >= MAX_NOTICES) this.drop(this.list[0].id);
		const id = this.next++;
		this.list.push({ id, kind, text, ms: length });
		const clock = new Countdown(this.timers, () => this.close(id));
		this.clocks.set(id, clock);
		clock.start(length);
		this.options.onChange();
		return id;
	}

	error(text : string, ms? : number) : number {
		return this.show("error", text, ms);
	}

	info(text : string, ms? : number) : number {
		return this.show("info", text, ms);
	}

	close(id : number) : void {
		if (!this.drop(id)) return;
		this.options.onChange();
	}

	closeAll() : void {
		if (this.list.length === 0) return;
		for (const n of [...this.list]) this.drop(n.id);
		this.options.onChange();
	}

	// the mouse is over the notice (or left it)
	hold(id : number, held : boolean) : void {
		this.clocks.get(id)?.hold(held);
	}

	// how often the notice's countdown (re)started
	runs(id : number) : number {
		return this.clocks.get(id)?.runs ?? 0;
	}

	// ms left of the notice's countdown
	left(id : number) : number {
		return this.clocks.get(id)?.left ?? 0;
	}

	private drop(id : number) : boolean {
		const at = this.list.findIndex((n) => n.id === id);
		if (at < 0) return false;
		this.list.splice(at, 1);
		this.clocks.get(id)?.stop();
		this.clocks.delete(id);
		return true;
	}
}

// ---- Ctrl+Z / Cmd+Z ----

// the platform string of the browser (navigator.platform, or userAgentData's)
export function isMacPlatform(platform : string | undefined) : boolean {
	return !!platform && /mac|iphone|ipad|ipod/i.test(platform);
}

export interface KeyLike {
	key : string;
	code? : string;
	ctrlKey : boolean;
	metaKey : boolean;
	shiftKey : boolean;
	altKey : boolean;
}

// Ctrl+Z (Cmd+Z on a Mac), not Shift+Ctrl+Z (redo), not with Alt. The letter
// is read from `key`; a layout whose Z key types another script (key is not a
// Latin letter) is read from its place on the keyboard.
export function isUndoKey(e : KeyLike, mac : boolean) : boolean {
	if (e.shiftKey || e.altKey) return false;
	if (mac ? (!e.metaKey || e.ctrlKey) : (!e.ctrlKey || e.metaKey)) return false;
	const key = e.key || "";
	if (key.length === 1 && /[a-z]/i.test(key)) return key.toLowerCase() === "z";
	return e.code === "KeyZ";
}

// the key caps the Undo button shows
export function undoKeyCaps(mac : boolean) : string[] {
	return [mac ? "⌘" : "Ctrl", "Z"];
}

// Whether a Ctrl+Z typed into `field` is for the Undo notice: not when it is a
// text field with something in it (that is the text's own undo). The search
// box with nothing in it is not editing anything, and neither is a button.
export function undoKeyForField(field : { tag : string, type? : string, value? : string, contentEditable? : boolean } | null) : boolean {
	if (!field) return true;
	if (field.contentEditable) return false;
	const tag = field.tag.toUpperCase();
	if (tag === "TEXTAREA") return false;
	if (tag !== "INPUT") return true;
	const type = (field.type || "text").toLowerCase();
	if (["button", "checkbox", "radio", "range", "color", "file", "submit", "reset", "image"].includes(type)) return true;
	return !field.value;
}

// ---- texts ----

function reason(err : unknown) : string {
	if (err instanceof Error) return err.message;
	return typeof err === "string" ? err : "";
}

// Why a write was refused, for the error notice: "Could not save the window:
// the browser's storage is full ...". `what`: the verb phrase ("save the window").
// A quota error says so; any other error gives its message.
export function refusedText(what : string, err : unknown) : string {
	const why = reason(err);
	if (/quota/i.test(why)) return "Could not " + what + ": the browser's storage is full. Delete some saved windows and try again.";
	return "Could not " + what + (why ? ": " + why : ".");
}

// the error after dropping saved tabs into a window opened fewer of them than
// asked; "" when all of them opened
export function openFailedText(total : number, opened : number) : string {
	if (opened >= total) return "";
	if (opened <= 0) return total === 1 ? "Could not open the saved tab" : "Could not open the saved tabs";
	const failed = total - opened;
	return failed === 1 ? "1 saved tab could not be opened" : failed + " saved tabs could not be opened";
}
