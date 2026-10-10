"use strict";

// Unit tests for when a saved window last changed (src/popup/savedUpdated.ts),
// the import's duplicate check (src/popup/sessionStore.ts importSessions), its
// wording (src/popup/importCount.ts) and the cards' created / last saved lines
// (src/popup/stats.ts).
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { sameTabUrls, stampUpdated, lastSaved, savedTimes, savedLabel, savedHover } from "../src/popup/savedUpdated.ts";
import { importSessions } from "../src/popup/sessionStore.ts";
import { importSummary, importWorked, planImport } from "../src/popup/importCount.ts";
import { savedTabStats, savedWindowStats } from "../src/popup/stats.ts";
import type { StatsLine } from "../src/popup/stats.ts";
import { moveSavedTabs } from "../src/popup/savedMove.ts";
import { addOpenTabs } from "../src/popup/savedAdd.ts";
import { withoutItems } from "../src/popup/pendingDelete.ts";
import { editSession } from "../src/popup/sessionEdit.ts";

const NOW = Date.parse("2030-06-01T12:00:00.000Z");
const HOUR = 3600e3;
const DAY = 24 * HOUR;

interface T { index? : number, url : string, title? : string }
interface W { id : string, name : string, color? : string, customName? : boolean, tabs : T[], windowsInfo : object, date : number, updated? : number, order? : number, incognito? : boolean }
const win = (id : string, urls : string[], extra : Partial<W> = {}) : W =>
	({ id, name: id.toUpperCase(), tabs: urls.map((url, index) => ({ index, url })), windowsInfo: {}, date: NOW - 2 * DAY, ...extra });
const store = () : Record<string, W> => ({ s1: win("s1", ["a", "b", "c"], { order: 0 }), s2: win("s2", ["d", "e"], { order: 1 }) });

describe("sameTabUrls", () => {
	test("same addresses in the same order, whatever the numbers", () => {
		assert.ok(sameTabUrls([{ url: "a" }, { url: "b" }], [{ url: "a" }, { url: "b" }]));
		assert.ok(sameTabUrls([], []));
	});
	test("another order, another length, another address", () => {
		assert.ok(!sameTabUrls([{ url: "a" }, { url: "b" }], [{ url: "b" }, { url: "a" }]));
		assert.ok(!sameTabUrls([{ url: "a" }], [{ url: "a" }, { url: "a" }]));
		assert.ok(!sameTabUrls([{ url: "a" }], [{ url: "c" }]));
	});
	test("a tab without an address counts as an empty one", () => {
		assert.ok(sameTabUrls([{}], [{ url: "" }]));
	});
});

describe("stampUpdated", () => {
	test("only the saved windows whose tabs changed get the time", () => {
		const before = store();
		const after = { ...before, s1: { ...before.s1, tabs: before.s1.tabs.slice(1) } };
		const out = stampUpdated(before, after, NOW);
		assert.equal(out.s1.updated, NOW);
		assert.equal(out.s2, before.s2);
		assert.equal(before.s1.updated, undefined, "input untouched");
	});
	test("tabs numbered anew, or a rename, are no change of the tabs", () => {
		const before = store();
		const renumbered = { ...before, s1: { ...before.s1, tabs: before.s1.tabs.map((t, i) => ({ ...t, index: i + 5 })) } };
		assert.equal(stampUpdated(before, renumbered, NOW).s1.updated, undefined);
		const renamed = editSession(before, "s1", { name: "New", color: "color3" })!;
		assert.equal(stampUpdated(before, renamed, NOW).s1.updated, undefined);
	});
	test("a new saved window is not stamped, a removed one is gone", () => {
		const before = store();
		const after : Record<string, W> = { s1: before.s1, s3: win("s3", ["x"]) };
		const out = stampUpdated(before, after, NOW);
		assert.deepEqual(Object.keys(out), ["s1", "s3"]);
		assert.equal(out.s3.updated, undefined);
	});
	test("a move stamps both windows, a reorder within one stamps it", () => {
		const before = store();
		const moved = moveSavedTabs(before, [{ sessionId: "s1", index: 0 }], { sessionId: "s2", index: undefined, before: false })!;
		const out = stampUpdated(before, moved.stored, NOW);
		assert.equal(out.s1.updated, NOW);
		assert.equal(out.s2.updated, NOW);
		const reordered = moveSavedTabs(before, [{ sessionId: "s1", index: 2 }], { sessionId: "s1", index: 0, before: true })!;
		const out2 = stampUpdated(before, reordered.stored, NOW);
		assert.equal(out2.s1.updated, NOW);
		assert.equal(out2.s2.updated, undefined);
	});
	test("an add and a partial delete stamp their window", () => {
		const before = store();
		const added = addOpenTabs(before, [{ id: 1, windowId: 1, index: 0, url: "https://n.test/" }], { sessionId: "s2", before: false }, { windowOrder: [1], firefox: false })!;
		assert.equal(stampUpdated(before, added.stored, NOW).s2.updated, NOW);
		const deleted = withoutItems(before, [{ id: "s1", name: "S1", tabs: 1, indexes: [1], urls: ["b"] }]);
		assert.equal(stampUpdated(before, deleted, NOW).s1.updated, NOW);
	});
});

describe("lastSaved / savedTimes / savedLabel / savedHover", () => {
	test("no update: the saved date, one line", () => {
		const s = { date: NOW - 2 * DAY };
		assert.equal(lastSaved(s), NOW - 2 * DAY);
		assert.deepEqual(savedTimes(s, NOW).map((t) => t.text), ["saved 2 days ago"]);
		assert.equal(savedLabel(s, NOW), "saved 2 days ago");
	});
	test("updated later: created and last saved", () => {
		const s = { date: NOW - 2 * DAY, updated: NOW - 3 * HOUR };
		assert.equal(lastSaved(s), NOW - 3 * HOUR);
		assert.deepEqual(savedTimes(s, NOW).map((t) => [t.key, t.text]), [["created", "created 2 days ago"], ["saved", "last saved 3 hours ago"]]);
		assert.equal(savedLabel(s, NOW), "saved 3 hours ago");
	});
	test("updated, but they read the same: one line", () => {
		const s = { date: NOW - 10e3, updated: NOW - 5e3 };
		assert.deepEqual(savedTimes(s, NOW).map((t) => t.text), ["saved just now"]);
	});
	test("no usable date: created falls back to updated, one line", () => {
		assert.deepEqual(savedTimes({ updated: NOW - 3 * HOUR }, NOW).map((t) => [t.key, t.text]), [["saved", "saved 3 hours ago"]]);
		assert.deepEqual(savedTimes({}, NOW).map((t) => t.text), ["saved just now"]);
	});
	test("an unusable updated is ignored", () => {
		assert.equal(lastSaved({ date: 5, updated: NaN }), 5);
		assert.equal(lastSaved({ date: 5, updated: "x" as unknown as number }), 5);
	});
	test("the tooltip has each time with its date", () => {
		const fmt = (at : number) => "@" + at;
		assert.equal(savedHover({ date: 1 }, NOW, fmt).split("\n")[1], "@1");
		assert.equal(savedHover({ date: NOW - 2 * DAY, updated: NOW - 3 * HOUR }, NOW, fmt),
			"Created 2 days ago\n@" + (NOW - 2 * DAY) + "\nLast saved 3 hours ago\n@" + (NOW - 3 * HOUR));
	});
});

describe("the cards: created and last saved", () => {
	const keyed = (lines : StatsLine[]) => lines.filter((l) => l.key === "created" || l.key === "saved").map((l) => l.key + ": " + l.text);
	test("saved window card", () => {
		const base = { now: NOW, name: "W", savedAt: NOW - 2 * DAY };
		assert.deepEqual(keyed(savedWindowStats({}, [], base).lines), ["saved: saved 2 days ago"]);
		assert.deepEqual(keyed(savedWindowStats({}, [], { ...base, updatedAt: NOW - 3 * HOUR }).lines), ["created: created 2 days ago", "saved: last saved 3 hours ago"]);
	});
	test("saved tab card", () => {
		const base = { now: NOW, savedAt: NOW - 2 * DAY, windowName: "W", windowTabs: [], allTabs: [] };
		assert.deepEqual(keyed(savedTabStats({ url: "a" }, base).lines), ["saved: saved 2 days ago"]);
		assert.deepEqual(keyed(savedTabStats({ url: "a" }, { ...base, updatedAt: NOW - 3 * HOUR }).lines), ["created: created 2 days ago", "saved: last saved 3 hours ago"]);
	});
});

describe("importSessions", () => {
	test("a saved window with the same tabs is already there and left out", () => {
		const stored = store();
		const r = importSessions(stored, [win("x1", ["a", "b", "c"]), win("x2", ["a", "c", "b"]), win("x3", ["d", "e", "f"])]);
		assert.deepEqual(r.added.map((s) => s.id), ["x2", "x3"]);
		assert.equal(r.duplicates, 1);
		assert.deepEqual(Object.keys(r.stored).sort(), ["s1", "s2", "x2", "x3"]);
		assert.deepEqual(Object.keys(stored), ["s1", "s2"], "input untouched");
	});
	test("the same id with the same tabs: kept as it is (name and colour stay)", () => {
		const stored = store();
		const r = importSessions(stored, [win("s1", ["a", "b", "c"], { name: "Other" })]);
		assert.equal(r.duplicates, 1);
		assert.equal(r.stored.s1, stored.s1);
	});
	test("the same id with other tabs replaces it, as before", () => {
		const r = importSessions(store(), [win("s1", ["z"])]);
		assert.equal(r.duplicates, 0);
		assert.deepEqual(r.stored.s1.tabs.map((t) => t.url), ["z"]);
	});
	test("`existing` decides what is there (a pending delete's windows left out)", () => {
		const stored = store();
		const r = importSessions(stored, [win("x1", ["a", "b", "c"])], { s2: stored.s2 });
		assert.equal(r.duplicates, 0);
		assert.deepEqual(r.added.map((s) => s.id), ["x1"]);
	});
	test("two equal windows in the file both go in when none is stored", () => {
		const r = importSessions({}, [win("x1", ["a"]), win("x2", ["a"])]);
		assert.equal(r.duplicates, 0);
		assert.equal(r.added.length, 2);
	});
	test("everything already there: nothing added", () => {
		const r = importSessions(store(), [win("x1", ["d", "e"])]);
		assert.equal(r.added.length, 0);
		assert.equal(r.duplicates, 1);
	});
});

describe("importSummary / importWorked with windows already there", () => {
	const good = (id : string) => ({ id, windowsInfo: {}, tabs: [{ url: "u" }] });
	test("some restored, some already there", () => {
		const plan = planImport([good("a"), good("b"), good("c")]);
		assert.equal(importSummary(plan, 0, 1), "2 saved windows restored, 1 already there");
		assert.ok(importWorked(plan, 0, 1));
	});
	test("all already there: a note, not an error", () => {
		const plan = planImport([good("a"), good("b")]);
		assert.equal(importSummary(plan, 0, 2), "No new saved windows, 2 already there");
		assert.ok(importWorked(plan, 0, 2));
	});
	test("with skipped entries too", () => {
		const plan = planImport([good("a"), good("b"), {}]);
		assert.equal(importSummary(plan, 0, 1), "1 saved window restored, 1 already there, 1 skipped (1 no window info)");
		assert.equal(importSummary(planImport([good("a"), {}]), 0, 1), "No new saved windows, 1 already there, 1 skipped (1 no window info)");
	});
	test("refused or nothing usable: an error", () => {
		assert.ok(!importWorked(planImport([good("a")]), 1, 0));
		assert.ok(!importWorked(planImport([{}])));
		assert.ok(!importWorked(planImport({})));
		assert.ok(importWorked(planImport([good("a")])));
	});
});

describe("a saved window without a date", () => {
	test("reads as saved just now, not NaN", () => {
		const now = Date.now();
		assert.equal(savedLabel({}, now), "saved just now");
		assert.ok(!/NaN|Invalid/.test(savedHover({}, now)));
		assert.ok(!/NaN/.test(savedLabel({ date: NaN }, now)));
	});
	test("addSessions stamps a missing date", async () => {
		const { addSessions } = await import("../src/popup/sessionStore.ts");
		const out = addSessions({}, [{ id: "a", tabs: [] } as any, { id: "b", tabs: [], date: 5 } as any]);
		assert.ok(Number.isFinite((out.a as any).date));
		assert.equal((out.b as any).date, 5);
	});
});
