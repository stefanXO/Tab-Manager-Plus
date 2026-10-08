"use strict";

// The saved windows (`sessions` in storage.local) as the popup keeps and
// writes them. There is one copy of the whole object as storage has it once
// the writes started here are done. Every change is made to this copy and
// written from it, one after the other (mutate): a change never reads storage
// while another is on its way, and a write that has to start as the popup
// closes (writeNow) needs no read.
//
// Reads (sync: on opening, and on every storage change, from here or from
// another popup, the sidebar, the options page) replace the copy. A read that
// a newer read or a write started here may have overtaken is dropped, and the
// store reads again once no write is on its way: a change made elsewhere
// meanwhile is never lost.
//
// A refused write (quota) puts the copy and the screen back to what they
// were before that change, so the next change does not build on it, and
// reads storage again once no write is on its way.

export type Stored<T> = Record<string, T>;

// gets the stored object and returns the new one, or null for no change;
// never changes what it gets
export type SavedChange<T> = (stored : Stored<T>) => Stored<T> | null;

export interface SavedWritesOptions<T> {
	// what storage holds now (tidied)
	read() : Promise<Stored<T>>;
	// stores `next`; rejects when the browser refuses it
	write(next : Stored<T>) : Promise<unknown>;
	// a change (or its undoing after a refused write) is to be shown
	show(stored : Stored<T>) : void;
	// a read is to be shown
	loaded(stored : Stored<T>) : Promise<unknown> | void;
}

export class SavedWrites<T> {
	private copy : Stored<T> | null = null;
	// the changes, one after the other
	private queue : Promise<unknown> = Promise.resolve();
	// bumps with every write started here; how many are on their way
	private writes = 0;
	private busy = 0;
	// bumps with every read: only the newest one counts
	private reads = 0;
	// a read was dropped, or a write refused: read again once no write is busy
	private again = false;
	private readonly options : SavedWritesOptions<T>;

	constructor(options : SavedWritesOptions<T>) {
		this.options = options;
	}

	// the copy (null until the first read or write)
	get stored() : Stored<T> | null {
		return this.copy;
	}

	// whether a write started here is on its way
	get writing() : boolean {
		return this.busy > 0;
	}

	// Queues `change`. When it runs it gets the copy (or what storage has,
	// before the first read); the copy and the screen change at once, then
	// the write. Resolves with what was written (null: nothing), rejects when
	// the browser refused it. `undo` runs when a refused change is taken back
	// (the screen shows the old copy right after).
	mutate(change : SavedChange<T>, undo? : () => void) : Promise<Stored<T> | null> {
		const run = async () => this.apply(this.copy || await this.options.read(), change, undo);
		const result = this.queue.then(run);
		this.queue = result.catch(() => undefined);
		return result;
	}

	// `change` made to the copy and written now, not after the queued changes:
	// the popup is closing and they would not run any more. The write starts
	// before this returns. Before the first read it is queued like any other.
	writeNow(change : SavedChange<T>, undo? : () => void) : Promise<Stored<T> | null> {
		if (!this.copy) return this.mutate(change, undo);
		return this.apply(this.copy, change, undo);
	}

	// Reads storage and shows it, unless a newer read or a write started here
	// may have overtaken it (then storage is read again once no write is busy).
	async sync() : Promise<void> {
		const read = ++this.reads;
		const writes = this.writes;
		const quiet = this.busy === 0;
		const values = await this.options.read();
		if (read !== this.reads) return;
		if (!quiet || writes !== this.writes) {
			this.again = true;
			this.readWhenQuiet();
			return;
		}
		this.copy = values;
		await this.options.loaded(values);
	}

	private async apply(base : Stored<T>, change : SavedChange<T>, undo? : () => void) : Promise<Stored<T> | null> {
		const next = change(base);
		if (!next) return null;
		try {
			await this.write(next);
		} catch (err) {
			// storage still holds what it held: back to `base`, unless a later
			// write went from this copy meanwhile (writeNow, the popup closing)
			if (this.copy === next) {
				this.copy = base;
				undo?.();
				this.options.show(base);
			}
			this.readWhenQuiet();
			throw err;
		}
		return next;
	}

	// writes `next` from the copy; the write starts before this returns
	private write(next : Stored<T>) : Promise<unknown> {
		this.copy = next;
		this.writes++;
		this.busy++;
		this.options.show(next);
		let written : Promise<unknown>;
		try {
			written = Promise.resolve(this.options.write(next));
		} catch (err) {
			written = Promise.reject(err);
		}
		// before the caller hears of it: a refused one reads again only after
		// apply() took the change back
		written.then(() => {
			this.busy--;
			this.readWhenQuiet();
		}, () => {
			this.busy--;
			this.again = true;
		});
		return written;
	}

	private readWhenQuiet() {
		if (!this.again || this.busy > 0) return;
		this.again = false;
		void this.sync().catch((err) => console.error(err));
	}
}
