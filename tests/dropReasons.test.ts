"use strict";

// Unit tests for the drops that do nothing or only part of what was dragged
// (src/popup/dropReasons.ts): what a drop on saved windows takes of what was
// dragged, and the words of the error notice.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { splitByKind, planMove, planAdd, whyUnsavable, leftClause, leftTotal, dropErrorText } from "../src/popup/dropReasons.ts";
import type { Left } from "../src/popup/dropReasons.ts";
import { moveSavedTabs } from "../src/popup/savedMove.ts";
import { addOpenTabs } from "../src/popup/savedAdd.ts";
import type { AddableTab } from "../src/popup/savedAdd.ts";

interface W { id : string, name : string, order? : number, incognito? : boolean, tabs : { index : number, url : string }[], windowsInfo? : { incognito? : boolean } }
const win = (id : string, urls : string[], extra : Partial<W> = {}) : W =>
	({ id, name: id, tabs: urls.map((url, index) => ({ index, url })), windowsInfo: {}, ...extra });
// s1 normal: a b c, s2 normal: d e, p1 private: x y
const store = () : Record<string, W> => ({
	s1: win("s1", ["a", "b", "c"], { order: 0 }),
	s2: win("s2", ["d", "e"], { order: 1 }),
	p1: win("p1", ["x", "y"], { order: 2, incognito: true }),
});
const ref = (sessionId : string, index : number) => ({ sessionId, index });
const open = (url : string, extra : Partial<AddableTab> = {}) : AddableTab => ({ index: 0, windowId: 1, url, title: url, ...extra });

describe("splitByKind: private and normal windows", () => {
	const tabs = [{ id: 1 }, { id: 2, incognito: true }, { id: 3, incognito: false }, { id: 4, incognito: true }];

	test("to a normal window the private tabs stay out", () => {
		const r = splitByKind(tabs, false, "window");
		assert.deepEqual(r.go.map((t) => t.id), [1, 3]);
		assert.deepEqual(r.left, [{ reason: "private-to-normal-window", n: 2 }]);
	});

	test("to a private window the normal tabs stay out", () => {
		const r = splitByKind(tabs, true, "window");
		assert.deepEqual(r.go.map((t) => t.id), [2, 4]);
		assert.deepEqual(r.left, [{ reason: "normal-to-private-window", n: 2 }]);
	});

	test("the same kind: all go, no reason; saved windows have their own reasons", () => {
		assert.deepEqual(splitByKind([{ id: 1 }], false, "saved"), { go: [{ id: 1 }], left: [] });
		assert.deepEqual(splitByKind([{ id: 1 }], true, "saved").left, [{ reason: "normal-to-private-saved", n: 1 }]);
		assert.deepEqual(splitByKind([{ id: 1, incognito: true }], false, "saved").left, [{ reason: "private-to-normal-saved", n: 1 }]);
	});
});

describe("planMove: saved tabs dropped on a saved window", () => {
	test("everything can go: no reason", () => {
		const r = planMove(store(), [ref("s1", 0), ref("s1", 2)], { sessionId: "s2", before: false });
		assert.deepEqual(r, { go: [ref("s1", 0), ref("s1", 2)], left: [] });
	});

	test("the saved window dropped on is gone", () => {
		const r = planMove(store(), [ref("s1", 0)], { sessionId: "s9", before: false });
		assert.deepEqual(r, { go: [], left: [{ reason: "target-window-gone", n: 1 }] });
	});

	test("the saved tab dropped on is gone", () => {
		const r = planMove(store(), [ref("s1", 0), ref("s1", 1)], { sessionId: "s2", index: 9, before: true });
		assert.deepEqual(r, { go: [], left: [{ reason: "target-tab-gone", n: 2 }] });
	});

	test("dragged saved tabs that are gone are counted, the others still go", () => {
		const r = planMove(store(), [ref("s1", 0), ref("s7", 0), ref("s1", 8)], { sessionId: "s2", before: false });
		assert.deepEqual(r.go, [ref("s1", 0)]);
		assert.deepEqual(r.left, [{ reason: "dragged-saved-gone", n: 2 }]);
	});

	test("private saved tabs into a normal saved window: left out, the normal ones go", () => {
		const r = planMove(store(), [ref("s1", 0), ref("p1", 1)], { sessionId: "s2", before: false });
		assert.deepEqual(r.go, [ref("s1", 0)]);
		assert.deepEqual(r.left, [{ reason: "saved-private-to-normal", n: 1 }]);
	});

	test("normal saved tabs into a private saved window", () => {
		const r = planMove(store(), [ref("s1", 0), ref("s2", 1)], { sessionId: "p1", before: false });
		assert.deepEqual(r.go, []);
		assert.deepEqual(r.left, [{ reason: "saved-normal-to-private", n: 2 }]);
	});

	test("a private flag in windowsInfo counts too", () => {
		const s = store();
		s.s2.windowsInfo = { incognito: true };
		const r = planMove(s, [ref("s1", 0)], { sessionId: "s2", before: false });
		assert.deepEqual(r.left, [{ reason: "saved-normal-to-private", n: 1 }]);
	});

	test("what goes is what moveSavedTabs moves; nothing going (all refused) is null there", () => {
		const target = { sessionId: "s2", before: false };
		const plan = planMove(store(), [ref("s1", 0), ref("p1", 1)], target);
		const moved = moveSavedTabs(store(), plan.go, target)!;
		assert.equal(moved.count, 1);
		const refused = planMove(store(), [ref("p1", 1)], target);
		assert.equal(moveSavedTabs(store(), refused.go, target), null);
		assert.ok(refused.left.length > 0);
	});

	test("dropped where it already is: it changes nothing and has no reason", () => {
		const target = { sessionId: "s1", index: 1, before: true };
		const plan = planMove(store(), [ref("s1", 0)], target);
		assert.deepEqual(plan.left, []);
		assert.equal(moveSavedTabs(store(), plan.go, target), null);
	});
});

describe("planAdd: open tabs dropped on a saved window", () => {
	test("everything can go: no reason", () => {
		const r = planAdd(store(), [open("x1"), open("x2")], { sessionId: "s1", before: false });
		assert.equal(r.go.length, 2);
		assert.deepEqual(r.left, []);
	});

	test("the saved window or tab dropped on is gone", () => {
		assert.deepEqual(planAdd(store(), [open("x1")], { sessionId: "s9", before: false }).left, [{ reason: "target-window-gone", n: 1 }]);
		assert.deepEqual(planAdd(store(), [open("x1"), open("x2")], { sessionId: "s1", index: 9, before: false }).left, [{ reason: "target-tab-gone", n: 2 }]);
	});

	test("private tabs into a normal saved window and the other way round", () => {
		const mixed = [open("x1"), open("x2", { incognito: true })];
		const toNormal = planAdd(store(), mixed, { sessionId: "s1", before: false });
		assert.equal(toNormal.go.length, 1);
		assert.deepEqual(toNormal.left, [{ reason: "private-to-normal-saved", n: 1 }]);
		const toPrivate = planAdd(store(), mixed, { sessionId: "p1", before: false });
		assert.equal(toPrivate.go.length, 1);
		assert.deepEqual(toPrivate.left, [{ reason: "normal-to-private-saved", n: 1 }]);
	});

	test("tabs without an address are counted; Firefox's about: pages only on Firefox", () => {
		const tabs = [open("https://ok.test/"), open("", { url: "" }), open("about:config")];
		const chrome = planAdd(store(), tabs, { sessionId: "s1", before: false }, false);
		assert.deepEqual(chrome.left, [{ reason: "no-address", n: 1 }]);
		const firefox = planAdd(store(), tabs, { sessionId: "s1", before: false }, true);
		assert.deepEqual(firefox.left, [{ reason: "no-address", n: 1 }, { reason: "about-page", n: 1 }]);
	});

	test("its count of left-out tabs is the count addOpenTabs skips", () => {
		const tabs = [open("https://ok.test/"), open("about:config"), open("about:addons"), open("about:blank")];
		const target = { sessionId: "s1", before: false };
		const plan = planAdd(store(), tabs, target, true);
		const r = addOpenTabs(store(), plan.go, target, { firefox: true })!;
		assert.equal(r.count, 2);
		assert.equal(r.skipped, 2);
		assert.equal(leftTotal(plan.left), r.skipped);
	});

	test("nothing left to add (all about: pages): addOpenTabs gives null and the plan says why", () => {
		const tabs = [open("about:config"), open("about:addons")];
		const target = { sessionId: "s1", before: false };
		const plan = planAdd(store(), tabs, target, true);
		assert.equal(addOpenTabs(store(), plan.go, target, { firefox: true }), null);
		assert.deepEqual(plan.left, [{ reason: "about-page", n: 2 }]);
	});

	test("whyUnsavable", () => {
		assert.equal(whyUnsavable(open("https://a.test/"), true), null);
		assert.equal(whyUnsavable(open("about:blank"), true), null);
		assert.equal(whyUnsavable(open("about:config"), false), null);
		assert.equal(whyUnsavable(open("about:config"), true), "about-page");
		assert.equal(whyUnsavable({ index: 0, url: "" }, false), "no-address");
		assert.equal(whyUnsavable({ index: 0, pendingUrl: "https://p.test/" }, true), null);
	});
});

describe("dropErrorText: the words of the notice", () => {
	test("nothing left out: no notice", () => {
		assert.equal(dropErrorText("moved", "tab", 3, 3, []), "");
	});

	test("the drop did nothing: 'Nothing ...: reason'", () => {
		assert.equal(dropErrorText("added", "tab", 2, 0, [{ reason: "target-window-gone", n: 2 }]), "Nothing added: the saved window is gone");
		assert.equal(dropErrorText("added", "tab", 1, 0, [{ reason: "target-tab-gone", n: 1 }]), "Nothing added: the saved tab you dropped on is gone");
		assert.equal(dropErrorText("moved", "saved tab", 2, 0, [{ reason: "saved-private-to-normal", n: 2 }]), "Nothing moved: 2 private saved tabs can't move into a normal saved window");
		assert.equal(dropErrorText("added", "tab", 1, 0, [{ reason: "private-to-normal-saved", n: 1 }]), "Nothing added: 1 private tab can't be added to a normal saved window");
		assert.equal(dropErrorText("opened", "saved tab", 1, 0, [{ reason: "dragged-saved-gone", n: 1 }]), "Nothing opened: the dragged saved tab is gone");
	});

	test("only part: how many were left out of how many, and why", () => {
		assert.equal(
			dropErrorText("added", "tab", 5, 3, [{ reason: "private-to-normal-saved", n: 1 }, { reason: "about-page", n: 1 }]),
			"2 of 5 tabs left out: 1 private tab can't be added to a normal saved window; 1 about: page can't be saved on Firefox");
		assert.equal(
			dropErrorText("opened", "saved tab", 4, 2, [{ reason: "dragged-saved-gone", n: 1 }, { reason: "open-failed", n: 1 }]),
			"2 of 4 saved tabs left out: the dragged saved tab is gone; 1 saved tab could not be opened");
	});

	test("a drop on an open window", () => {
		assert.equal(dropErrorText("moved", "tab", 3, 1, [{ reason: "private-to-normal-window", n: 2 }]), "2 of 3 tabs left out: 2 private tabs can't move to a normal window");
		assert.equal(dropErrorText("moved", "tab", 2, 0, [{ reason: "normal-to-private-window", n: 2 }]), "Nothing moved: 2 normal tabs can't move to a private window");
		assert.equal(dropErrorText("moved", "tab", 2, 0, [{ reason: "target-open-window-gone", n: 2 }]), "Nothing moved: the window you dropped on is closed");
		assert.equal(dropErrorText("moved", "tab", 2, 1, [{ reason: "move-refused", n: 1 }]), "1 of 2 tabs left out: the browser would not move 1 tab");
	});

	test("every reason has a short clause that reads on its own", () => {
		const reasons : Left["reason"][] = ["target-window-gone", "target-tab-gone", "target-open-window-gone", "target-open-tab-gone", "dragged-saved-gone", "dragged-open-gone",
			"private-to-normal-window", "normal-to-private-window", "private-to-normal-saved", "normal-to-private-saved", "saved-private-to-normal", "saved-normal-to-private",
			"no-address", "about-page", "move-refused", "open-failed"];
		for (const reason of reasons) {
			for (const n of [1, 3]) {
				const text = leftClause({ reason, n });
				assert.ok(text.length > 8 && text.length < 80, reason + ": " + text);
				assert.ok(!/undefined|NaN/.test(text), text);
			}
		}
		assert.equal(leftClause({ reason: "no-address", n: 1 }), "1 tab has no address");
		assert.equal(leftClause({ reason: "no-address", n: 3 }), "3 tabs have no address");
		assert.equal(leftClause({ reason: "dragged-open-gone", n: 2 }), "2 dragged tabs are closed");
		assert.equal(leftClause({ reason: "dragged-open-gone", n: 1 }), "the dragged tab is closed");
	});

	test("leftTotal", () => {
		assert.equal(leftTotal([]), 0);
		assert.equal(leftTotal([{ reason: "no-address", n: 2 }, { reason: "about-page", n: 3 }]), 5);
	});
});
