"use strict";

// Unit tests for what a tab drag carries and what its drop reads back, and
// which tiles the drag image of a several-tab drag shows
// (src/popup/dragPayload.ts).
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { encodeSaved, decodeSaved, encodeIds, decodeIds, readTabDrag, stackTiles, stackLabel, stackKind } from "../src/popup/dragPayload.ts";
import { SAVED_TAB_DRAG } from "../src/popup/savedDrag.ts";
import { OPEN_TAB_DRAG } from "../src/popup/savedAdd.ts";
import { SAVED_WINDOW_DRAG } from "../src/popup/sessionOrder.ts";
import { SavedTabKeys } from "../src/popup/sessionKeys.ts";

// a DataTransfer as a drop sees it: its types, and getData
const transfer = (data : Record<string, string>) => ({
	types: Object.keys(data),
	getData: (type : string) => data[type] ?? "",
});
const ref = (sessionId : string, index : number) => ({ sessionId, index });

describe("encodeSaved / decodeSaved", () => {
	test("round trip, order kept", () => {
		const refs = [ref("s2", 1), ref("s1", 3), ref("s1", 0)];
		assert.deepEqual(decodeSaved(encodeSaved(refs)), refs);
	});

	test("saved window ids with commas, quotes or colons survive", () => {
		const refs = [ref('a,b:"c"', 2)];
		assert.deepEqual(decodeSaved(encodeSaved(refs)), refs);
	});

	test("the same saved tabs in another page: other keys there, the same tabs", () => {
		// keys are numbered per page, in the order the page met the tabs
		const here = new SavedTabKeys(), there = new SavedTabKeys();
		there.key("s9", 0);
		const sent = encodeSaved([ref("s1", 2)]);
		const got = decodeSaved(sent).map((r) => there.key(r.sessionId, r.index));
		assert.notEqual(got[0], here.key("s1", 2));
		assert.deepEqual(there.ref(got[0]), ref("s1", 2));
	});

	test("nothing, junk and bad entries give nothing; each tab once", () => {
		assert.deepEqual(decodeSaved(undefined), []);
		assert.deepEqual(decodeSaved(""), []);
		assert.deepEqual(decodeSaved("-3"), []);
		assert.deepEqual(decodeSaved("{not json"), []);
		assert.deepEqual(decodeSaved('{"s1": 2}'), []);
		assert.deepEqual(decodeSaved('[["s1", 2], ["s1", -1], ["s1", 1.5], ["", 0], [3, 0], ["s1"], "s1", ["s1", 2], ["s2", "0"]]'), [ref("s1", 2)]);
	});
});

describe("encodeIds / decodeIds", () => {
	test("round trip, order kept", () => {
		assert.equal(encodeIds([12, 4, 0]), "12,4,0");
		assert.deepEqual(decodeIds(encodeIds([12, 4, 0])), [12, 4, 0]);
	});

	test("nothing, empty, junk and negative numbers give nothing; each id once", () => {
		assert.deepEqual(decodeIds(undefined), []);
		assert.deepEqual(decodeIds(null), []);
		assert.deepEqual(decodeIds(""), []);
		assert.deepEqual(decodeIds("a,,1.5, ,1e3,0x10,-3"), []);
		assert.deepEqual(decodeIds("5, 5,6"), [5, 6]);
	});

	test("numbers too big to be ids are left out", () => {
		assert.deepEqual(decodeIds("99999999999999999999,3"), [3]);
	});
});

describe("readTabDrag", () => {
	test("a saved tab drag: its saved tabs", () => {
		const data = transfer({ "text/plain": "https://a.test/", [SAVED_TAB_DRAG]: encodeSaved([ref("s1", 2), ref("s2", 0)]) });
		assert.deepEqual(readTabDrag(data), { kind: "saved", refs: [ref("s1", 2), ref("s2", 0)] });
	});

	test("an open tab drag: its ids", () => {
		assert.deepEqual(readTabDrag(transfer({ "text/plain": "12", [OPEN_TAB_DRAG]: "12,40" })), { kind: "open", ids: [12, 40] });
	});

	test("nothing usable: null, so the drop falls back on the page's memory", () => {
		assert.equal(readTabDrag(null), null);
		assert.equal(readTabDrag(undefined), null);
		assert.equal(readTabDrag(transfer({ [SAVED_TAB_DRAG]: "" })), null);
		// what a saved tab's drag carried before: its page's key
		assert.equal(readTabDrag(transfer({ [SAVED_TAB_DRAG]: "-3" })), null);
		assert.equal(readTabDrag(transfer({ [OPEN_TAB_DRAG]: "x" })), null);
	});

	test("other drags (a saved window card, a link from a page): null", () => {
		assert.equal(readTabDrag(transfer({ [SAVED_WINDOW_DRAG]: "s1", "text/plain": "Reading" })), null);
		assert.equal(readTabDrag(transfer({ "text/uri-list": "https://a.test/" })), null);
	});

	test("getData that throws (a protected DataTransfer): null", () => {
		const locked = { types: [SAVED_TAB_DRAG], getData: () : string => { throw new Error("protected"); } };
		assert.equal(readTabDrag(locked), null);
	});
});

describe("stackTiles", () => {
	test("one tab or none: no stack", () => {
		assert.deepEqual(stackTiles(5, [5]), []);
		assert.deepEqual(stackTiles(5, []), []);
	});

	test("the dragged one in front, then the next ones in order", () => {
		assert.deepEqual(stackTiles(7, [3, 7, 9]), [7, 3, 9]);
		assert.deepEqual(stackTiles(-4, [-2, -3, -4, -5, -6]), [-4, -2, -3]);
	});

	test("at most `max` tiles", () => {
		assert.deepEqual(stackTiles(1, [1, 2, 3, 4], 2), [1, 2]);
	});

	test("a dragged id that is not among them: the first ones", () => {
		assert.deepEqual(stackTiles(9, [1, 2, 3, 4]), [1, 2, 3]);
	});
});

test("stackLabel", () => {
	assert.equal(stackLabel(2), "2 tabs");
	assert.equal(stackLabel(14), "14 tabs");
});

// the layouts' storage values, read from the settings module (importing it
// pulls in the browser polyfill)
const layouts = () => {
	const src = readFileSync(new URL("../src/helpers/settings.ts", import.meta.url), "utf8");
	const body = /export const LAYOUT = \{([^}]*)\}/.exec(src)![1];
	return Object.fromEntries([...body.matchAll(/(\w+):\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]));
};

describe("stackKind", () => {
	test("every layout has an answer: list titled, the icon layouts icons", () => {
		const l = layouts();
		assert.deepEqual(Object.keys(l).sort(), ["blocks", "blocksBig", "list", "rows"]);
		assert.equal(stackKind(l.list), "titled");
		assert.equal(stackKind(l.blocks), "icons");
		assert.equal(stackKind(l.rows), "icons");
		assert.equal(stackKind(l.blocksBig), "icons-big");
	});

	test("an unknown or missing layout gets the titled stack", () => {
		assert.equal(stackKind("grid"), "titled");
		assert.equal(stackKind(""), "titled");
		assert.equal(stackKind(undefined), "titled");
		assert.equal(stackKind(null), "titled");
	});

	test("the popup passes its layout and the css draws every kind", () => {
		const root = new URL("../", import.meta.url);
		const manager = readFileSync(new URL("src/popup/views/TabManager.tsx", root), "utf8");
		assert.match(manager, /setStackImage\(e\.dataTransfer, tiles, ids\.length, stackKind\(this\.state\.layout\)\)/);
		const css = readFileSync(new URL("css/components/drag.css", root), "utf8");
		for (const kind of ["icons", "icons-big"]) assert.ok(css.includes(".drag-stack." + kind), kind);
		// the icon tiles are the size the layouts' tab tiles have (tab.css)
		assert.match(css, /\.drag-stack\.icons-big \{[^}]*--tile-w: 2\.5rem/);
		assert.match(css, /--tile-w: 1\.4rem/);
	});
});
