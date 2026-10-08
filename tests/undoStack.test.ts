"use strict";

// Unit tests for the stacked Undo notices: the order of the notices
// (NoticeOrder, src/popup/notices.ts), deletes in batches of their own
// (PendingDeletes, src/popup/pendingDelete.ts), the move offers (UndoOffers,
// src/popup/moveUndo.ts), and the overlaps: a move's Undo and a delete's Undo
// that touch the same saved windows, taken back in either order.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { NoticeOrder, NoticeBoard, MAX_NOTICES, ERROR_MS, INFO_MS } from "../src/popup/notices.ts";
import type { NoticeRef } from "../src/popup/notices.ts";
import { PendingDeletes, withoutItems, visibleSessions, goneUrls, UNDO_MS } from "../src/popup/pendingDelete.ts";
import type { PendingItem } from "../src/popup/pendingDelete.ts";
import { moveUndoRecord, undoMove, UndoOffers } from "../src/popup/moveUndo.ts";
import type { MoveUndo } from "../src/popup/moveUndo.ts";
import { moveSavedTabs } from "../src/popup/savedMove.ts";
import type { SavedDropTarget } from "../src/popup/savedMove.ts";

// a clock and timers the test moves by hand
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
			for (const [h, t] of [...timers].sort((a, b) => a[1].at - b[1].at)) if (t.at <= now) { timers.delete(h); t.fn(); }
		},
		active: () => timers.size
	};
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("NoticeOrder", () => {
	const ref = (source : NoticeRef["source"], key : number) : NoticeRef => ({ source, key });

	test("newest last; one that comes up again moves to the end", () => {
		const o = new NoticeOrder(() => true);
		o.push(ref("delete", 1));
		o.push(ref("move", 1));
		o.push(ref("delete", 1));
		assert.deepEqual(o.refs, [ref("move", 1), ref("delete", 1)]);
	});

	test("a fourth makes the oldest go; the caller ends it", () => {
		const o = new NoticeOrder(() => true);
		assert.deepEqual(o.push(ref("delete", 1)), []);
		assert.deepEqual(o.push(ref("move", 1)), []);
		assert.deepEqual(o.push(ref("board", 7)), []);
		assert.deepEqual(o.push(ref("delete", 2)), [ref("delete", 1)]);
		assert.equal(o.refs.length, MAX_NOTICES);
	});

	test("notices their owners ended do not count", () => {
		const alive = new Set(["delete1", "move1", "board7"]);
		const o = new NoticeOrder((r) => alive.has(r.source + r.key));
		o.push(ref("delete", 1));
		o.push(ref("move", 1));
		o.push(ref("board", 7));
		alive.delete("move1");
		alive.add("delete2");
		assert.deepEqual(o.push(ref("delete", 2)), [], "the move's offer ran out: room enough");
		assert.deepEqual(o.refs, [ref("delete", 1), ref("board", 7), ref("delete", 2)]);
	});

	test("sort puts notices in the order they came; one never pushed counts as newest", () => {
		const o = new NoticeOrder(() => true);
		o.push(ref("move", 3));
		o.push(ref("delete", 1));
		const sorted = o.sort([{ ...ref("delete", 9), x: "c" }, { ...ref("delete", 1), x: "b" }, { ...ref("move", 3), x: "a" }]);
		assert.deepEqual(sorted.map((s) => s.x), ["a", "b", "c"]);
	});

	test("the board tells when a notice came up (also again)", () => {
		const shown : number[] = [];
		const board = new NoticeBoard({ onChange: () => {}, onShown: (id) => shown.push(id), timers: fakeTimers() });
		const a = board.error("a");
		const b = board.info("b");
		assert.equal(board.error("a"), a);
		assert.deepEqual(shown, [a, b, a]);
		assert.equal(board.has(a), true);
		board.close(a);
		assert.equal(board.has(a), false);
	});

	test("timings: errors 8 s, infos 5 s, Undo 8 s", () => {
		assert.equal(ERROR_MS, 8000);
		assert.equal(INFO_MS, 5000);
		assert.equal(UNDO_MS, 8000);
		const t = fakeTimers();
		const board = new NoticeBoard({ onChange: () => {}, timers: t });
		board.error("e");
		board.info("i");
		t.advance(4999);
		assert.equal(board.items.length, 2);
		t.advance(1);
		assert.deepEqual(board.items.map((n) => n.text), ["e"]);
		t.advance(3000);
		assert.equal(board.items.length, 0);
	});
});

describe("PendingDeletes in batches", () => {
	function setup() {
		const t = fakeTimers();
		const commits : string[][] = [];
		const p = new PendingDeletes({ commit: (items) => { commits.push(items.map((i) => i.id)); }, onChange: () => {}, timers: t });
		return { t, p, commits };
	}
	const item = (id : string) : PendingItem => ({ id, name: id.toUpperCase(), tabs: 2 });

	test("a batch of its own (null) has its own countdown; left out, a delete joins the newest", () => {
		const { t, p, commits } = setup();
		const a = p.add(item("a"));
		t.advance(3000);
		const b = p.add(item("b"), null);
		assert.notEqual(a, b);
		assert.equal(p.add(item("c")), b, "joins the newest");
		assert.deepEqual(p.groups.map((g) => g.items.map((i) => i.id)), [["a"], ["b", "c"]]);
		t.advance(UNDO_MS - 3000);
		assert.deepEqual(commits, [["a"]], "a's countdown ended, b's goes on");
		t.advance(3000);
		assert.deepEqual(commits, [["a"], ["b", "c"]]);
	});

	test("a key joins that batch; a key that is gone starts a new one", () => {
		const { p } = setup();
		const a = p.add(item("a"), null);
		const b = p.add(item("b"), null);
		assert.equal(p.add(item("c"), a), a);
		p.undo(a);
		const d = p.add(item("d"), a);
		assert.notEqual(d, a);
		assert.notEqual(d, b);
		assert.equal(p.has(a), false);
	});

	test("undo takes back one batch: the newest when no key is given", () => {
		const { p, t, commits } = setup();
		const a = p.add(item("a"), null);
		const b = p.add(item("b"), null);
		assert.deepEqual(p.undo().map((i) => i.id), ["b"]);
		assert.equal(p.has(b), false);
		assert.deepEqual(p.items.map((i) => i.id), ["a"]);
		assert.deepEqual(p.undo(a).map((i) => i.id), ["a"]);
		assert.deepEqual(p.undo(), []);
		t.advance(UNDO_MS);
		assert.equal(commits.length, 0);
	});

	test("flush with a key writes that batch only; without one, all of them", () => {
		const { p, commits } = setup();
		const a = p.add(item("a"), null);
		p.add(item("b"), null);
		p.add(item("c"), null);
		p.flush(false, a);
		assert.deepEqual(commits, [["a"]]);
		assert.deepEqual(p.items.map((i) => i.id), ["b", "c"]);
		p.flush();
		assert.deepEqual(commits, [["a"], ["b", "c"]]);
		assert.equal(p.groups.length, 0);
	});

	test("hold holds one batch's countdown", () => {
		const { p, t, commits } = setup();
		const a = p.add(item("a"), null);
		p.add(item("b"), null);
		p.hold(true, a);
		t.advance(UNDO_MS * 3);
		assert.deepEqual(commits, [["b"]]);
		p.hold(false, a);
		t.advance(UNDO_MS);
		assert.deepEqual(commits, [["b"], ["a"]]);
	});

	test("each batch's bar runs again when its own countdown starts over", () => {
		const { p } = setup();
		const a = p.add(item("a"), null);
		const b = p.add(item("b"), null);
		p.add(item("c"), b);
		const runs = Object.fromEntries(p.groups.map((g) => [g.key, g.runs]));
		assert.equal(runs[a], 1);
		assert.equal(runs[b], 2);
	});
});

describe("PendingDeletes.relocate", () => {
	const timers = { now: () => 0, setTimeout: () => 1, clearTimeout: () => {} };
	const at = (sessionId : string, index : number) => ({ sessionId, index });

	test("within a window like renumber; to another window into an item of the same batch, same name", () => {
		const p = new PendingDeletes({ commit: () => {}, onChange: () => {}, timers });
		p.add({ id: "a", name: "A", tabs: 2, indexes: [1, 3], urls: ["q", "s"] });
		p.relocate([{ from: at("a", 1), to: at("a", 0) }, { from: at("a", 3), to: at("b", 2) }]);
		assert.deepEqual(p.items, [
			{ id: "a", name: "A", tabs: 1, indexes: [0], urls: ["q"] },
			{ id: "b", name: "A", tabs: 1, indexes: [2], urls: ["s"] },
		]);
		assert.equal(p.groups.length, 1);
	});

	test("joins the batch's item for that window; a whole window there takes it in", () => {
		const p = new PendingDeletes({ commit: () => {}, onChange: () => {}, timers });
		const k = p.add({ id: "a", name: "A", tabs: 1, indexes: [0], urls: ["p"] });
		p.add({ id: "b", name: "B", tabs: 1, indexes: [4], urls: ["x"] }, k);
		p.add({ id: "c", name: "C", tabs: 3 }, k);
		p.add({ id: "a", name: "A", tabs: 1, indexes: [1], urls: ["q"] }, k);
		p.relocate([{ from: at("a", 0), to: at("b", 0) }, { from: at("a", 1), to: at("c", 0) }]);
		assert.deepEqual(p.items, [
			{ id: "b", name: "B", tabs: 2, indexes: [0, 4], urls: ["p", "x"] },
			{ id: "c", name: "C", tabs: 3 },
		], "a lost both tabs and is gone from the batch");
	});

	test("an item whose write waits: the tab that left goes to an item written with it", () => {
		let handed : PendingItem[] = [];
		const p = new PendingDeletes({ commit: (items) => { handed = items; return new Promise(() => {}); }, onChange: () => {}, timers });
		p.add({ id: "a", name: "A", tabs: 2, indexes: [0, 1], urls: ["p", "q"] });
		p.flush();
		p.relocate([{ from: at("a", 1), to: at("b", 0) }]);
		assert.deepEqual(handed, [{ id: "a", name: "A", tabs: 1, indexes: [0], urls: ["p"] }], "changed in place");
		const mine = p.claim(handed);
		assert.deepEqual(mine.map((i) => [i.id, i.indexes]), [["a", [0]], ["b", [0]]]);
		assert.deepEqual(p.claim(handed), [], "claimed once");
	});

	test("an item whose write started is not touched", () => {
		let handed : PendingItem[] = [];
		const p = new PendingDeletes({ commit: (items) => { handed = items; return new Promise(() => {}); }, onChange: () => {}, timers });
		p.add({ id: "a", name: "A", tabs: 1, indexes: [1], urls: ["q"] });
		p.flush();
		p.claim(handed);
		p.relocate([{ from: at("a", 1), to: at("b", 0) }]);
		assert.deepEqual(handed[0].indexes, [1]);
		assert.equal(p.hiding().length, 1);
	});
});

describe("withoutItems keeps what another batch still hides", () => {
	type Tab = { index : number, url : string };
	type Win = { id : string, name : string, tabs : Tab[] };
	const win = (id : string, urls : string[]) : Win => ({ id, name: id, tabs: urls.map((url, index) => ({ index, url })) });

	test("a whole window goes but keeps the tabs an older batch hides; those go with that batch", () => {
		const stored = { a: win("a", ["p", "q", "r"]) };
		const older : PendingItem = { id: "a", name: "a", tabs: 1, indexes: [1], urls: ["q"] };
		const whole : PendingItem = { id: "a", name: "a", tabs: 3, urls: ["p", "q", "r"] };
		const after = withoutItems(stored, [whole], [older, whole]);
		assert.deepEqual(after.a.tabs, [{ index: 1, url: "q" }]);
		assert.deepEqual(visibleSessions(Object.values(after), [older]), [], "still hidden");
		// its own Undo: q shows again; its own write: the window goes
		assert.deepEqual(visibleSessions(Object.values(after), []).map((w) => w.tabs.map((t) => t.url)), [["q"]]);
		assert.deepEqual(withoutItems(after, [older]), {});
	});

	test("without other batches, as before", () => {
		const stored = { a: win("a", ["p", "q"]) };
		assert.deepEqual(withoutItems(stored, [{ id: "a", name: "a", tabs: 2, urls: ["p", "q"] }]), {});
	});
});

// The popup's glue (TabManager) over the pure parts, writing to `stored`
// at once: deletes, moves, their Undo notices and their order.
type T = { index : number, url : string };
type W = { id : string, name : string, color : string, tabs : T[], windowsInfo : object, date : number, updated? : number, order? : number };
const mk = (id : string, name : string, urls : string[], order : number) : W =>
	({ id, name, color: "color" + order, tabs: urls.map((url, index) => ({ index, url })), windowsInfo: {}, date: 1, order });

class Popup {
	stored : Record<string, W>;
	readonly t = fakeTimers();
	readonly commits : string[][] = [];
	readonly infos : string[] = [];
	readonly pending : PendingDeletes;
	readonly offers : UndoOffers<MoveUndo<W>>;
	readonly order : NoticeOrder;
	// the errors and infos: their own cap of MAX_NOTICES, outside the order,
	// so they never make an Undo notice go (as in TabManager); with three
	// Undo notices up they show two at most
	readonly board = new NoticeBoard({ onChange: () => {}, timers: this.t, limit: () => this.undos().length >= MAX_NOTICES ? MAX_NOTICES - 1 : MAX_NOTICES });

	constructor(stored : Record<string, W>) {
		this.stored = stored;
		this.pending = new PendingDeletes({
			commit: (items) => {
				const mine = this.pending.claim(items);
				const others = this.pending.hiding().filter((i) => !mine.includes(i));
				this.stored = withoutItems(this.stored, mine, others);
				this.commits.push(mine.map((i) => i.id));
			},
			onChange: () => {},
			timers: this.t
		});
		this.offers = new UndoOffers({ delay: UNDO_MS, onChange: () => {}, timers: this.t });
		this.order = new NoticeOrder((r) => r.source === "delete" ? this.pending.has(r.key) : this.offers.has(r.key));
	}
	undos() : NoticeRef[] {
		return this.order.sort([
			...this.pending.groups.map((g) => ({ source: "delete" as const, key: g.key })),
			...this.offers.items.map((o) => ({ source: "move" as const, key: o.key })),
		]);
	}
	// what the notices say, oldest first
	notices() : string[] {
		return this.undos().map((r) => r.source === "move" ? "move" : "delete " + this.pending.groups.find((g) => g.key === r.key)!.items.map((i) => i.id + (i.indexes ? ":" + i.indexes.join(",") : "")).join(" "));
	}
	private joinable() : number | null {
		const newest = this.undos().pop();
		return newest && newest.source === "delete" ? newest.key : null;
	}
	private shown(ref : NoticeRef) {
		for (const old of this.order.push(ref)) {
			if (old.source === "delete") this.pending.flush(false, old.key);
			else this.offers.clear(old.key);
		}
		this.board.trim();
	}
	deleteWindow(id : string) {
		const w = this.stored[id];
		const key = this.pending.add({ id, name: w.name, tabs: w.tabs.length, urls: goneUrls(w.tabs) }, this.joinable());
		this.shown({ source: "delete", key });
	}
	deleteTabs(id : string, urls : string[]) {
		const tabs = this.stored[id].tabs.filter((t) => urls.includes(t.url));
		const key = this.pending.add({ id, name: this.stored[id].name, tabs: tabs.length, indexes: tabs.map((t) => t.index), urls: tabs.map((t) => t.url) }, this.joinable());
		this.shown({ source: "delete", key });
	}
	move(from : string, urls : string[], target : SavedDropTarget) {
		this.moveRefs(this.stored[from].tabs.filter((t) => urls.includes(t.url)).map((t) => ({ sessionId: from, index: t.index })), target);
	}
	moveRefs(refs : { sessionId : string, index : number }[], target : SavedDropTarget) {
		const result = moveSavedTabs(this.stored, refs, target)!;
		assert.ok(result, "the move happens");
		const record = moveUndoRecord(this.stored, refs, result);
		this.stored = result.stored;
		this.pending.relocate(result.moves);
		if (record) this.shown({ source: "move", key: this.offers.offer(record) });
	}
	// Undo on notice `ref`, or Ctrl+Z (the newest)
	undo(ref : NoticeRef | undefined = this.undos().pop()) {
		assert.ok(ref, "an Undo notice is up");
		if (ref.source === "delete") {
			this.pending.undo(ref.key);
			return;
		}
		const record = this.offers.take(ref.key)!;
		const closed = this.pending.hiding().filter((i) => i.indexes === undefined).map((i) => i.id);
		const result = undoMove(this.stored, record, 2000, closed);
		if (!result) {
			this.infos.push("nothing to move back");
			return;
		}
		this.stored = result.stored;
		this.pending.relocate(result.moves);
	}
	// the saved windows as shown: "id: urls", in id order
	view() : string[] {
		return visibleSessions(Object.values(this.stored), this.pending.hiding())
			.sort((a, b) => a.id.localeCompare(b.id)).map((w) => w.id + ": " + [...w.tabs].sort((x, y) => x.index - y.index).map((t) => t.url).join(" "));
	}
	storedView() : string[] {
		return Object.values(this.stored).sort((a, b) => a.id.localeCompare(b.id)).map((w) => w.id + ": " + [...w.tabs].sort((x, y) => x.index - y.index).map((t) => t.url).join(" "));
	}
}
// A: a1 a2 a3 a4, B: b1 b2, C: c1
const start = () => ({ A: mk("A", "Reading", ["a1", "a2", "a3", "a4"], 0), B: mk("B", "Tax", ["b1", "b2"], 1), C: mk("C", "Misc", ["c1"], 2) });
const ORIGINAL = ["A: a1 a2 a3 a4", "B: b1 b2", "C: c1"];

describe("stacked Undo notices", () => {
	test("a move's Undo no longer writes the pending delete, nor does a delete drop the move's offer", () => {
		const u = new Popup(start());
		u.deleteTabs("A", ["a4"]);
		u.move("B", ["b1", "b2"], { sessionId: "C", before: false });
		assert.equal(u.commits.length, 0, "the delete still counts down");
		u.deleteTabs("A", ["a1"]);
		assert.deepEqual(u.notices(), ["delete A:3", "move", "delete A:0"], "three notices, the newest last");
	});

	test("Ctrl+Z takes back the newest first, then the next", () => {
		const u = new Popup(start());
		u.move("B", ["b1", "b2"], { sessionId: "C", before: false });
		u.deleteWindow("A");
		assert.deepEqual(u.view(), ["C: c1 b1 b2"]);
		u.undo();
		assert.deepEqual(u.view(), ["A: a1 a2 a3 a4", "C: c1 b1 b2"], "the delete first");
		assert.deepEqual(u.notices(), ["move"]);
		u.undo();
		assert.deepEqual(u.view(), ORIGINAL, "then the move");
		assert.deepEqual(u.storedView(), ORIGINAL);
		assert.deepEqual(u.stored, start(), "exactly as before, numbers and all");
		assert.deepEqual(u.notices(), []);
	});

	test("deletes in a row share one notice until another Undo notice comes up", () => {
		const u = new Popup(start());
		u.deleteTabs("A", ["a1"]);
		u.deleteTabs("A", ["a2"]);
		assert.deepEqual(u.notices(), ["delete A:0,1"]);
		u.move("B", ["b1", "b2"], { sessionId: "C", before: false });
		u.deleteTabs("A", ["a3"]);
		assert.deepEqual(u.notices(), ["delete A:0,1", "move", "delete A:2"]);
		u.undo();
		assert.deepEqual(u.view(), ["A: a3 a4", "C: c1 b1 b2"]);
	});

	test("a fourth notice writes the oldest delete (and ends the oldest move's offer)", () => {
		const u = new Popup(start());
		u.deleteTabs("A", ["a1"]);
		u.move("B", ["b1", "b2"], { sessionId: "C", before: false });
		u.deleteTabs("A", ["a2"]);
		assert.deepEqual(u.commits, []);
		u.move("C", ["c1", "b1", "b2"], { sessionId: "A", before: false });
		assert.deepEqual(u.commits, [["A"]], "the oldest, the first delete, is written");
		assert.deepEqual(u.notices(), ["move", "delete A:1", "move"]);
		u.deleteTabs("A", ["a3"]);
		assert.deepEqual(u.notices(), ["delete A:1", "move", "delete A:2"], "the first move's offer made room");
		assert.equal(u.offers.items.length, 1);
	});

	test("a third Undo notice trims the board to two; with fewer Undo notices it holds three", () => {
		const u = new Popup(start());
		u.deleteTabs("A", ["a1"]);
		u.move("B", ["b1", "b2"], { sessionId: "C", before: false });
		u.board.error("one");
		u.board.error("two");
		u.board.error("three");
		assert.equal(u.board.items.length, MAX_NOTICES, "two Undo notices: three errors fit");
		u.deleteTabs("A", ["a2"]);
		assert.equal(u.notices().length, 3);
		assert.deepEqual(u.board.items.map((n) => n.text), ["two", "three"], "the third Undo notice made the oldest error go");
	});

	test("errors and infos never make an Undo notice go: Ctrl+Z still has the whole stack", () => {
		const u = new Popup(start());
		u.deleteTabs("A", ["a1"]);
		u.move("B", ["b1", "b2"], { sessionId: "C", before: false });
		u.deleteTabs("A", ["a2"]);
		u.board.error("Nothing moved: the saved window is gone");
		u.board.error("Nothing added: the saved window is gone");
		u.board.info("Imported 2 saved windows");
		u.board.error("Could not open the saved tab");
		assert.deepEqual(u.commits, [], "no delete is written");
		assert.deepEqual(u.notices(), ["delete A:0", "move", "delete A:1"]);
		assert.equal(u.board.items.length, MAX_NOTICES - 1, "with three Undo notices up the board keeps two");
		assert.deepEqual(u.board.items.map((n) => n.text), ["Imported 2 saved windows", "Could not open the saved tab"], "the oldest went");
		u.undo();
		u.undo();
		u.undo();
		assert.deepEqual(u.stored, start(), "all three taken back");
	});

	test("each countdown ends on its own: a delete is written, a move's offer goes, nothing else", () => {
		const u = new Popup(start());
		u.move("B", ["b1", "b2"], { sessionId: "C", before: false });
		u.t.advance(4000);
		u.deleteTabs("A", ["a1"]);
		u.t.advance(4000);
		assert.deepEqual(u.notices(), ["delete A:0"]);
		assert.deepEqual(u.commits, []);
		u.t.advance(4000);
		assert.deepEqual(u.commits, [["A"]]);
		assert.deepEqual(u.storedView(), ["A: a2 a3 a4", "C: c1 b1 b2"]);
	});
});

describe("stacked Undo notices: overlaps", () => {
	test("delete some tabs of A, then empty B into A: either Undo first, all back as it was", () => {
		for (const order of ["newest first", "oldest first"]) {
			const u = new Popup(start());
			u.deleteTabs("A", ["a2"]);
			u.move("B", ["b1", "b2"], { sessionId: "A", index: 2, before: true });
			assert.deepEqual(u.view(), ["A: a1 b1 b2 a3 a4", "C: c1"], "a2 hidden among the moved tabs");
			const [del, mv] = u.undos();
			if (order === "newest first") {
				u.undo(mv);
				assert.deepEqual(u.view(), ["A: a1 a3 a4", "B: b1 b2", "C: c1"], "a2 still hidden: " + order);
				u.undo(del);
			} else {
				u.undo(del);
				assert.deepEqual(u.view(), ["A: a1 a2 b1 b2 a3 a4", "C: c1"], "a2 back in its place: " + order);
				u.undo(mv);
			}
			assert.deepEqual(u.stored, start(), order);
		}
	});

	test("the same, the delete written before the move's Undo: a2 is gone, the rest as before", async () => {
		const u = new Popup(start());
		u.deleteTabs("A", ["a2"]);
		u.move("B", ["b1", "b2"], { sessionId: "A", index: 2, before: true });
		u.t.advance(UNDO_MS - 1);
		const [, mv] = u.undos();
		u.offers.hold(true, mv.key);
		u.t.advance(1);
		assert.deepEqual(u.commits, [["A"]]);
		await tick();
		u.undo(mv);
		assert.deepEqual(u.storedView(), ["A: a1 a3 a4", "B: b1 b2", "C: c1"]);
	});

	test("empty B into A, then delete a moved tab: the move's Undo takes it back to B still hidden", async () => {
		const u = new Popup(start());
		u.move("B", ["b1", "b2"], { sessionId: "A", before: false });
		u.deleteTabs("A", ["b1"]);
		assert.deepEqual(u.view(), ["A: a1 a2 a3 a4 b2", "C: c1"]);
		const [mv, del] = u.undos();
		u.undo(mv);
		assert.deepEqual(u.view(), ORIGINAL.map((l) => l === "B: b1 b2" ? "B: b2" : l), "b1 went back to B, hidden");
		assert.deepEqual(u.pending.items, [{ id: "B", name: "Reading", tabs: 1, indexes: [0], urls: ["b1"] }], "the delete followed it");
		// its own Undo brings it back where it is now
		u.undo(del);
		assert.deepEqual(u.stored, start());
	});

	test("the same, the delete written after the move's Undo: b1 goes from B", async () => {
		const u = new Popup(start());
		u.move("B", ["b1", "b2"], { sessionId: "A", before: false });
		u.deleteTabs("A", ["b1"]);
		u.undo(u.undos()[0]);
		u.pending.flush();
		await tick();
		assert.deepEqual(u.storedView(), ["A: a1 a2 a3 a4", "B: b2", "C: c1"]);
	});

	test("the same, the delete's Undo first: b1 shows in A, then the move's Undo takes both back", () => {
		const u = new Popup(start());
		u.move("B", ["b1", "b2"], { sessionId: "A", before: false });
		u.deleteTabs("A", ["b1"]);
		u.undo();
		assert.deepEqual(u.view(), ["A: a1 a2 a3 a4 b1 b2", "C: c1"]);
		u.undo();
		assert.deepEqual(u.stored, start());
	});

	test("empty B into A, then delete A whole: the move's Undo brings B back; A's delete takes only what is left", async () => {
		const u = new Popup(start());
		u.move("B", ["b1", "b2"], { sessionId: "A", before: false });
		u.deleteWindow("A");
		assert.deepEqual(u.view(), ["C: c1"]);
		const [mv] = u.undos();
		u.undo(mv);
		assert.deepEqual(u.view(), ["B: b1 b2", "C: c1"], "A still hidden");
		u.pending.flush();
		await tick();
		assert.deepEqual(u.storedView(), ["B: b1 b2", "C: c1"], "A goes, without B's tabs");
	});

	test("the same, A's delete undone after the move's: A is back as it was before the move", () => {
		const u = new Popup(start());
		u.move("B", ["b1", "b2"], { sessionId: "A", before: false });
		u.deleteWindow("A");
		const [mv, del] = u.undos();
		u.undo(mv);
		u.undo(del);
		assert.deepEqual(u.stored, start());
	});

	test("a moved tab whose old window is being deleted whole stays where it is; that delete still goes", async () => {
		// a3 (of A) and c1 (C, emptied) dragged to B together
		const v = new Popup(start());
		v.moveRefs([{ sessionId: "A", index: 2 }, { sessionId: "C", index: 0 }], { sessionId: "B", before: false });
		v.deleteWindow("A");
		assert.deepEqual(v.view(), ["B: b1 b2 a3 c1"]);
		v.undo(v.undos()[0]);
		assert.deepEqual(v.view(), ["B: b1 b2 a3", "C: c1"], "c1 home, a3 stays (A is being deleted)");
		v.pending.flush();
		await tick();
		assert.deepEqual(v.storedView(), ["B: b1 b2 a3", "C: c1"], "A's delete is not held back by a tab it never saw");
	});

	test("two moves stacked: newest first gives back the exact store; oldest first the same tabs", () => {
		for (const order of ["newest first", "oldest first"]) {
			const u = new Popup(start());
			u.move("B", ["b1", "b2"], { sessionId: "A", before: false });
			u.move("C", ["c1"], { sessionId: "A", index: 0, before: true });
			assert.deepEqual(u.view(), ["A: c1 a1 a2 a3 a4 b1 b2"]);
			const [first, second] = u.undos();
			u.undo(order === "newest first" ? second : first);
			u.undo(order === "newest first" ? first : second);
			assert.deepEqual(u.view(), ORIGINAL, order);
			if (order === "newest first") assert.deepEqual(u.stored, start());
		}
	});

	test("a move's Undo with nothing left to move back says so", () => {
		const u = new Popup(start());
		u.move("C", ["c1"], { sessionId: "A", before: false });
		u.move("A", ["a1", "a2", "a3", "a4", "c1"], { sessionId: "B", before: false });
		assert.deepEqual(u.notices(), ["move", "move"]);
		// the first move put c1 in A; A is gone since (emptied into B)
		u.undo(u.undos()[0]);
		assert.deepEqual(u.infos, ["nothing to move back"]);
		u.undo();
		assert.deepEqual(u.view(), ["A: a1 a2 a3 a4 c1", "B: b1 b2"]);
	});
});
