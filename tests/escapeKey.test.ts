"use strict";

// Unit tests for what one Escape does (src/popup/escapeKey.ts).
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { escapeKey } from "../src/popup/escapeKey.ts";

const base = { cardOpen: false, searchLen: 0, selectionSize: 0, helpOpen: false, overlayOpen: false };

describe("escapeKey", () => {
	test("a card and a search and selection: one press closes the card and clears both", () => {
		assert.deepEqual(escapeKey({ ...base, cardOpen: true, searchLen: 3, selectionSize: 2 }), { closeCard: true, clear: true, keepPopup: true });
	});
	test("a card and nothing to clear: the card closes and the popup stays", () => {
		assert.deepEqual(escapeKey({ ...base, cardOpen: true }), { closeCard: true, clear: true, keepPopup: true });
	});
	test("no card, a search or a selection: it clears and the popup stays", () => {
		assert.equal(escapeKey({ ...base, searchLen: 1 }).keepPopup, true);
		assert.equal(escapeKey({ ...base, selectionSize: 1 }).keepPopup, true);
		assert.equal(escapeKey({ ...base, searchLen: 1 }).closeCard, false);
	});
	test("no card and nothing to clear: the popup may close", () => {
		assert.equal(escapeKey(base).keepPopup, false);
	});
	test("the help card and the overlay take the press alone", () => {
		for (const k of ["helpOpen", "overlayOpen"]) {
			assert.deepEqual(escapeKey({ ...base, cardOpen: true, searchLen: 2, selectionSize: 1, [k]: true }), { closeCard: false, clear: false, keepPopup: true });
		}
	});
});
