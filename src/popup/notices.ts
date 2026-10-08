"use strict";

// The notices over the bottom bar. There are three kinds, drawn by one
// component (./views/Notice.tsx): the Undo notices (after a delete, their
// countdowns live in ./pendingDelete.ts; after a move that emptied a saved
// window, ./moveUndo.ts), and the two kept here, which have no Undo: an error
// (red edge and tint) and an info (what an import did). Each has a countdown
// that a mouse over it holds (./countdown.ts) and a close button. Which Undo
// notice is the newest, and which one makes room for a newcomer, is
// NoticeOrder's; the errors and infos make room among themselves (NoticeBoard).

import { Countdown, realTimers } from "./countdown.ts";
import type { Timers } from "./countdown.ts";

export type NoticeKind = "undo" | "error" | "info";

// An error stays long enough to be read twice, an info is a passing word (an
// Undo notice stays UNDO_MS, ./pendingDelete.ts)
export const ERROR_MS = 8000;
export const INFO_MS = 5000;
// at most this many Undo notices at once (NoticeOrder), and at most this
// many errors and infos (NoticeBoard): an error never makes an Undo go
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
	// notice `id` came up, or came up again (the same text): it is the newest
	onShown?(id : number) : void;
	timers? : Timers;
}

// The errors and infos on screen, oldest first. The same message shown again
// does not pile up: the earlier one moves to the end and starts its countdown
// over, keeping its id, so its component (and a mouse hold on it) stays.
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
		const again = this.list.find((n) => n.kind === kind && n.text === text);
		if (again) {
			// in place: a held countdown stays held and starts when let go
			this.list = [...this.list.filter((n) => n !== again), { ...again, ms: length }];
			this.clocks.get(again.id)?.start(length);
			this.options.onChange();
			this.options.onShown?.(again.id);
			return again.id;
		}
		while (this.list.length >= MAX_NOTICES) this.drop(this.list[0].id);
		const id = this.next++;
		this.list.push({ id, kind, text, ms: length });
		const clock = new Countdown(this.timers, () => this.close(id));
		this.clocks.set(id, clock);
		clock.start(length);
		this.options.onChange();
		this.options.onShown?.(id);
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

	// whether notice `id` is on screen
	has(id : number) : boolean {
		return this.clocks.has(id);
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

// ---- the order of the notices ----

// who owns a notice: the board's errors and infos (key: the notice's id), a
// batch of deletes (./pendingDelete.ts, key: the batch's), a move's Undo
// (./moveUndo.ts UndoOffers, key: the offer's)
export type NoticeSource = "board" | "delete" | "move";

export interface NoticeRef {
	source : NoticeSource;
	key : number;
}

function sameRef(a : NoticeRef, b : NoticeRef) : boolean {
	return a.source === b.source && a.key === b.key;
}

// The order the notices handed to it came up in (the popup hands it only the
// Undo notices, so an error never makes one go). The owners keep the notices
// themselves; this keeps when each came. The Undo notices are stacked: Ctrl+Z
// takes back the newest first (sort, last). A newcomer beyond `max` makes the
// oldest go (push): an Undo notice then commits (a delete is written, a
// move's offer ends); a board notice, if one is handed in, closes.
export class NoticeOrder {
	private list : NoticeRef[] = [];
	private readonly alive : (ref : NoticeRef) => boolean;
	private readonly max : number;

	// `alive`: whether a notice is still on screen (its owner may have ended
	// it on its own: undone, run out, closed)
	constructor(alive : (ref : NoticeRef) => boolean, max = MAX_NOTICES) {
		this.alive = alive;
		this.max = max;
	}

	// the notices on screen, oldest first
	get refs() : readonly NoticeRef[] {
		this.prune();
		return this.list;
	}

	// `ref` came up (or came up again, or its countdown started over): it is
	// the newest now. Returns the ones that have to make room, oldest first;
	// the caller ends them.
	push(ref : NoticeRef) : NoticeRef[] {
		this.prune();
		this.list = this.list.filter((r) => !sameRef(r, ref));
		this.list.push(ref);
		const room : NoticeRef[] = [];
		while (this.list.length > this.max) room.push(this.list.shift()!);
		return room;
	}

	// `refs` oldest first (one this order never saw counts as the newest)
	sort<T extends NoticeRef>(refs : readonly T[]) : T[] {
		const rank = (ref : NoticeRef) => {
			const at = this.list.findIndex((r) => sameRef(r, ref));
			return at < 0 ? Infinity : at;
		};
		return [...refs].sort((a, b) => rank(a) - rank(b));
	}

	private prune() {
		this.list = this.list.filter((r) => this.alive(r));
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

// Whether a Ctrl+Z typed into `field` is for the Undo notice (one is up): not
// when it is a text field with something in it (that is the text's own
// undo), except the search box (`search`): there the Undo notice wins, text
// or not (with no Undo notice up, Ctrl+Z in it is the text's undo, as
// always). A button is not editing anything.
export function undoKeyForField(field : { tag : string, type? : string, value? : string, contentEditable? : boolean, search? : boolean } | null) : boolean {
	if (!field || field.search) return true;
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
