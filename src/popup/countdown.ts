"use strict";

// The countdown behind a notice (./notices.ts, ./pendingDelete.ts): runs for a
// while, then calls `end`. It can be held (the mouse is over the notice): the
// time left stops with it and goes on from there when it is let go. The bar the
// user sees is a CSS animation that pauses and resumes the same way, so the two
// stay together without the page ticking.

// the clock and timers, injectable so the tests need no real waiting
export interface Timers {
	now() : number;
	setTimeout(fn : () => void, ms : number) : unknown;
	clearTimeout(handle : unknown) : void;
}

export const realTimers : Timers = {
	now: () => Date.now(),
	setTimeout: (fn, ms) => setTimeout(fn, ms),
	clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>)
};

export class Countdown {
	private handle : unknown = null;
	// counting down: started, not ended or stopped (also while held)
	private on = false;
	private held = false;
	// the time left when the timer last started (or when it was held)
	private remaining = 0;
	// when the timer last started (the timers' clock)
	private from = 0;
	private starts = 0;
	private readonly timers : Timers;
	private readonly end : () => void;

	constructor(timers : Timers, end : () => void) {
		this.timers = timers;
		this.end = end;
	}

	// how often it was (re)started: the bar's animation runs again when this changes
	get runs() : number {
		return this.starts;
	}

	get active() : boolean {
		return this.on;
	}

	get isHeld() : boolean {
		return this.held;
	}

	// ms left (0 when not counting down)
	get left() : number {
		if (!this.on) return 0;
		if (this.handle === null) return this.remaining;
		return Math.max(0, this.remaining - (this.timers.now() - this.from));
	}

	// (Re)starts with the whole `ms`. Held, it waits for the release.
	start(ms : number) : void {
		this.clear();
		this.starts++;
		this.on = true;
		this.remaining = ms;
		if (!this.held) this.run();
	}

	// holds (the mouse is over the notice) or lets go
	hold(held : boolean) : void {
		if (held === this.held) return;
		this.held = held;
		if (!this.on) return;
		if (held) {
			this.remaining = this.left;
			this.clear();
		} else {
			this.run();
		}
	}

	// No more counting. The notice is gone, so the hold is over too (the mouse
	// leaving a notice that was removed is never reported).
	stop() : void {
		this.clear();
		this.on = false;
		this.held = false;
		this.remaining = 0;
	}

	private run() : void {
		this.from = this.timers.now();
		this.handle = this.timers.setTimeout(() => {
			this.handle = null;
			this.stop();
			this.end();
		}, this.remaining);
	}

	private clear() : void {
		if (this.handle !== null) this.timers.clearTimeout(this.handle);
		this.handle = null;
	}
}
