"use strict";

// Unit tests for src/popup/savedWrites.ts: the popup's copy of the saved
// windows, its write queue, refused writes and the reads around writes.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { SavedWrites } from "../src/popup/savedWrites.ts";
import type { Stored } from "../src/popup/savedWrites.ts";

type W = { name : string };

// lets every pending promise callback run
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// storage whose writes the test answers by hand (ok / refuse), oldest first
function fakeStorage(initial : Stored<W>) {
	let data = initial;
	const writes : { next : Stored<W>, ok : () => void, refuse : () => void }[] = [];
	let reads = 0;
	return {
		get data() { return data; },
		set data(value : Stored<W>) { data = value; },
		writes,
		reads: () => reads,
		read: async () => { reads++; return data; },
		write: (next : Stored<W>) => new Promise<void>((resolve, reject) => {
			writes.push({
				next,
				ok: () => { data = next; resolve(); },
				refuse: () => reject(new Error("QUOTA_BYTES quota exceeded"))
			});
		})
	};
}

function setup(initial : Stored<W> = { a: { name: "A" } }) {
	const storage = fakeStorage(initial);
	const shown : Stored<W>[] = [];
	const loaded : Stored<W>[] = [];
	const store = new SavedWrites<W>({
		read: storage.read,
		write: storage.write,
		show: (stored) => { shown.push(stored); },
		loaded: (stored) => { loaded.push(stored); }
	});
	return { storage, store, shown, loaded };
}

const add = (id : string, name : string) => (stored : Stored<W>) => ({ ...stored, [id]: { name } });

describe("SavedWrites: the queue", () => {
	test("a change shows at once, then is written; the next builds on it", async () => {
		const { storage, store, shown } = setup();
		await store.sync();
		const first = store.mutate(add("b", "B"));
		const second = store.mutate(add("c", "C"));
		await settle();
		assert.equal(storage.writes.length, 1);
		assert.deepEqual(Object.keys(shown[0]), ["a", "b"]);
		storage.writes[0].ok();
		assert.deepEqual(Object.keys((await first)!), ["a", "b"]);
		await settle();
		assert.deepEqual(Object.keys(storage.writes[1].next), ["a", "b", "c"]);
		storage.writes[1].ok();
		await second;
		assert.deepEqual(Object.keys(storage.data), ["a", "b", "c"]);
	});

	test("before the first read a change starts from what storage has", async () => {
		const { storage, store } = setup();
		const done = store.mutate(add("b", "B"));
		await settle();
		assert.deepEqual(Object.keys(storage.writes[0].next), ["a", "b"]);
		storage.writes[0].ok();
		await done;
	});

	test("a change that returns null writes nothing", async () => {
		const { storage, store, shown } = setup();
		await store.sync();
		assert.equal(await store.mutate(() => null), null);
		assert.equal(storage.writes.length, 0);
		assert.equal(shown.length, 0);
	});

	test("writeNow starts its write at once, from the copy, before the queued changes", async () => {
		const { storage, store } = setup();
		await store.sync();
		const queued = store.mutate(add("b", "B"));
		await settle();
		// b is on its way; c waits behind it
		const waiting = store.mutate(add("c", "C"));
		void store.writeNow((stored) => { const { a, ...rest } = stored; return rest; });
		assert.equal(storage.writes.length, 2);
		// built on the copy, so b (on its way) is in it and a is gone
		assert.deepEqual(Object.keys(storage.writes[1].next), ["b"]);
		storage.writes[0].ok();
		storage.writes[1].ok();
		await queued;
		await settle();
		storage.writes[2].ok();
		await waiting;
		assert.deepEqual(Object.keys(storage.data), ["b", "c"]);
	});
});

describe("SavedWrites: a refused write", () => {
	test("goes back to the copy before it, and the next change does not carry it", async () => {
		const { storage, store, shown } = setup();
		await store.sync();
		let undone = 0;
		const refused = store.mutate(add("big", "Big"), () => { undone++; });
		const next = store.mutate(add("b", "B"));
		await settle();
		storage.writes[0].refuse();
		await assert.rejects(refused);
		assert.equal(undone, 1);
		// shown: the change, then the copy before it
		assert.deepEqual(Object.keys(shown[0]), ["a", "big"]);
		assert.deepEqual(Object.keys(shown[1]), ["a"]);
		await settle();
		assert.deepEqual(Object.keys(storage.writes[1].next), ["a", "b"]);
		storage.writes[1].ok();
		await next;
		assert.deepEqual(Object.keys(store.stored!), ["a", "b"]);
	});

	test("storage is read again, at a moment no write is on its way", async () => {
		const { storage, store, loaded } = setup();
		await store.sync();
		const before = loaded.length;
		const refused = store.mutate(add("big", "Big"));
		const next = store.mutate(add("b", "B"));
		await settle();
		storage.writes[0].refuse();
		await assert.rejects(refused);
		await settle();
		storage.writes[1].ok();
		await next;
		await settle();
		// read again (before b's write started, or after it landed), never
		// shown while b was on its way
		assert.ok(loaded.length > before);
		assert.ok(loaded.slice(before).every((l) => !("big" in l)));
		assert.deepEqual(Object.keys(store.stored!), ["a", "b"]);
		assert.deepEqual(Object.keys(storage.data), ["a", "b"]);
	});

	test("a read dropped behind the next write is made after that write", async () => {
		const { storage, store, loaded } = setup();
		await store.sync();
		const refused = store.mutate(add("big", "Big"));
		await settle();
		storage.writes[0].refuse();
		// b is written before the read after the refusal can land
		const next = store.mutate(add("b", "B"));
		await assert.rejects(refused);
		const read = store.sync();
		await settle();
		// another popup writes right after ours lands
		storage.writes[1].ok();
		storage.data = { ...storage.data, x: { name: "from another popup" } };
		await next;
		await read;
		await settle();
		assert.deepEqual(Object.keys(loaded[loaded.length - 1]), ["a", "b", "x"]);
	});

	test("a refused write with nothing behind it reads storage again", async () => {
		const { storage, store, loaded } = setup();
		await store.sync();
		const refused = store.mutate(add("big", "Big"));
		await settle();
		storage.data = { a: { name: "A" }, x: { name: "from another popup" } };
		storage.writes[0].refuse();
		await assert.rejects(refused);
		await settle();
		assert.deepEqual(Object.keys(loaded[loaded.length - 1]), ["a", "x"]);
		assert.deepEqual(Object.keys(store.stored!), ["a", "x"]);
	});

	test("a closing write built on the refused copy is not undone under it", async () => {
		const { storage, store, shown } = setup();
		await store.sync();
		let undone = 0;
		const refused = store.mutate(add("big", "Big"), () => { undone++; });
		await settle();
		void store.writeNow(add("c", "C"));
		storage.writes[0].refuse();
		await assert.rejects(refused);
		assert.equal(undone, 0);
		assert.deepEqual(Object.keys(store.stored!), ["a", "big", "c"]);
		assert.equal(shown.length, 2);
	});
});

describe("SavedWrites: reads around writes", () => {
	test("a read made while a write is on its way is made again after it", async () => {
		const { storage, store, loaded } = setup();
		await store.sync();
		const writing = store.mutate(add("b", "B"));
		await settle();
		// another popup writes; its storage.onChanged comes while ours is busy
		const read = store.sync();
		storage.writes[0].ok();
		storage.data = { ...storage.data, x: { name: "X" } };
		await read;
		await writing;
		await settle();
		assert.deepEqual(Object.keys(loaded[loaded.length - 1]), ["a", "b", "x"]);
		assert.deepEqual(Object.keys(store.stored!), ["a", "b", "x"]);
	});

	test("a read overtaken by a write that already landed is made again at once", async () => {
		const { storage, store, loaded } = setup();
		await store.sync();
		let release : () => void = () => {};
		const slow = new Promise<void>((resolve) => { release = resolve; });
		const realRead = storage.read;
		let first = true;
		// the first read waits until the write below has landed
		const store2 = new SavedWrites<W>({
			read: async () => { if (first) { first = false; await slow; } return realRead(); },
			write: storage.write,
			show: () => {},
			loaded: (stored) => { loaded.push(stored); }
		});
		const read = store2.sync();
		const writing = store2.mutate(add("b", "B"));
		await settle();
		storage.writes[0].ok();
		await writing;
		release();
		await read;
		await settle();
		assert.deepEqual(Object.keys(loaded[loaded.length - 1]), ["a", "b"]);
		assert.deepEqual(Object.keys(store2.stored!), ["a", "b"]);
		void store;
	});

	test("only the newest of two reads counts", async () => {
		const { storage, store, loaded } = setup();
		const one = store.sync();
		storage.data = { z: { name: "Z" } };
		const two = store.sync();
		await Promise.all([one, two]);
		assert.equal(loaded.length, 1);
		assert.deepEqual(Object.keys(store.stored!), ["z"]);
	});
});
