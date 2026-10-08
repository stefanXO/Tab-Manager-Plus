"use strict";

// Deleting with an undo countdown. A saved window that is deleted is hidden
// at once and only removed from storage when the countdown ends (or when the
// popup is going away: flush). Until then Undo brings it back untouched.
//
// Several deletes in a row share one countdown: each new one restarts it, the
// notice names all of them and Undo restores all of them. The step that
// deletes saved tabs reuses this with its own ids.

export const UNDO_MS = 8000;

export interface PendingItem {
	id : string;
	name : string;
	// how many tabs the deleted window had (for the notice)
	tabs : number;
}

// the clock and timers, injectable so the tests need no real waiting
export interface Timers {
	now() : number;
	setTimeout(fn : () => void, ms : number) : unknown;
	clearTimeout(handle : unknown) : void;
}

const realTimers : Timers = {
	now: () => Date.now(),
	setTimeout: (fn, ms) => setTimeout(fn, ms),
	clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>)
};

export interface PendingOptions {
	// removes the ids from storage. `sync` when the popup is closing: start
	// the write without reading first (a read would not finish in time)
	commit(ids : string[], sync : boolean) : Promise<unknown> | void;
	// the pending list or the deadline changed: render again
	onChange() : void;
	delay? : number;
	timers? : Timers;
}

export class PendingDeletes {
	private pending : PendingItem[] = [];
	// being written right now: still hidden, no longer undoable
	private committing = new Set<string>();
	private handle : unknown = null;
	private until = 0;
	private readonly delay : number;
	private readonly timers : Timers;
	private readonly options : PendingOptions;

	constructor(options : PendingOptions) {
		this.options = options;
		this.delay = options.delay ?? UNDO_MS;
		this.timers = options.timers ?? realTimers;
	}

	// the items Undo would bring back, oldest first
	get items() : readonly PendingItem[] {
		return this.pending;
	}

	// when the countdown ends (ms, the timers' clock); 0 when nothing is pending
	get deadline() : number {
		return this.pending.length ? this.until : 0;
	}

	get countdown() : number {
		return this.delay;
	}

	// ids that must not be shown: pending ones and the ones being written
	hidden() : Set<string> {
		return new Set([...this.pending.map((p) => p.id), ...this.committing]);
	}

	// hides `item` and (re)starts the countdown for the whole batch
	add(item : PendingItem) : void {
		if (!this.pending.some((p) => p.id === item.id)) this.pending.push(item);
		this.restart();
		this.options.onChange();
	}

	// brings every pending item back; the ones already being written are gone
	undo() : PendingItem[] {
		const items = this.pending;
		this.stop();
		this.pending = [];
		if (items.length) this.options.onChange();
		return items;
	}

	// writes the pending deletes now (the countdown ran out, or the popup closes)
	flush(sync = false) : void {
		if (!this.pending.length) return;
		const ids = this.pending.map((p) => p.id);
		this.stop();
		this.pending = [];
		for (const id of ids) this.committing.add(id);
		const done = () => {
			for (const id of ids) this.committing.delete(id);
			this.options.onChange();
		};
		let result : Promise<unknown> | void;
		try {
			result = this.options.commit(ids, sync);
		} catch (err) {
			console.error(err);
			done();
			return;
		}
		// a failed write leaves the saved window in storage: it shows again
		Promise.resolve(result).then(done, (err) => { console.error(err); done(); });
		// the notice goes now, the windows stay hidden until the write is done
		this.options.onChange();
	}

	private restart() {
		this.stop();
		this.until = this.timers.now() + this.delay;
		this.handle = this.timers.setTimeout(() => this.flush(), this.delay);
	}

	private stop() {
		if (this.handle !== null) this.timers.clearTimeout(this.handle);
		this.handle = null;
	}
}

// storage.local's `sessions` object without the given ids; never changes `values`
export function withoutSessions<T>(values : Record<string, T>, ids : readonly string[]) : Record<string, T> {
	const out : Record<string, T> = {};
	for (const key of Object.keys(values)) if (!ids.includes(key)) out[key] = values[key];
	return out;
}

// the notice's text: "Deleted "Tax 2029" (3 tabs)" or "Deleted 3 saved windows"
export function noticeText(items : readonly PendingItem[]) : string {
	if (items.length === 0) return "";
	if (items.length > 1) return "Deleted " + items.length + " saved windows";
	const [item] = items;
	const tabs = item.tabs === 1 ? "1 tab" : item.tabs + " tabs";
	return "Deleted “" + (item.name || "saved window") + "” (" + tabs + ")";
}

// whole seconds left, rounded up, never negative
export function secondsLeft(deadline : number, now : number) : number {
	return Math.max(0, Math.ceil((deadline - now) / 1000));
}

// how much of the countdown is left, 0 to 1
export function fractionLeft(deadline : number, now : number, delay : number) : number {
	if (delay <= 0) return 0;
	return Math.min(1, Math.max(0, (deadline - now) / delay));
}
