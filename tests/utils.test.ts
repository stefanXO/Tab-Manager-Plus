import { test, describe, mock } from "node:test";
import assert from "node:assert/strict";
import {
	timeAgo,
	maybePluralize,
	debounce,
	is_in_bounds,
	stringHashcode,
	toBoolean,
} from "../src/helpers/utils.ts";

// ---------------------------------------------------------------------------
// timeAgo
// ---------------------------------------------------------------------------
// timeAgo(at, now) computes s = Math.max(0, Math.round((now - at) / 1000))
// and buckets it into bands. Helper below lets us specify an elapsed amount
// directly (in ms) rather than juggling `at`/`now` by hand.
const NOW = 1_700_000_000_000; // arbitrary fixed reference instant
function elapsed(ms: number): string {
	return timeAgo(NOW - ms, NOW);
}
const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("timeAgo", () => {
	describe("just now band (< 45s)", () => {
		test("0 seconds elapsed", () => {
			assert.equal(elapsed(0), "just now");
		});
		test("44 seconds elapsed stays 'just now'", () => {
			assert.equal(elapsed(44 * SEC), "just now");
		});
		test("46 seconds elapsed crosses into minutes", () => {
			assert.equal(elapsed(46 * SEC), "1 minute ago");
		});
		test("exactly 45 seconds is NOT 'just now' (boundary is < 45, not <=)", () => {
			// s=45 -> round(45/60)=round(0.75)=1 minute
			assert.equal(elapsed(45 * SEC), "1 minute ago");
		});
		test("future timestamp is clamped to 'just now' via Math.max(0, ...)", () => {
			assert.equal(elapsed(-100 * SEC), "just now");
		});
	});

	describe("minutes band", () => {
		test("1 minute (singular)", () => {
			assert.equal(elapsed(60 * SEC), "1 minute ago");
		});
		test("2 minutes (plural)", () => {
			assert.equal(elapsed(90 * SEC), "2 minutes ago"); // round(90/60)=round(1.5)=2
		});
		test("89 minutes still reports as hours=1 (rounds down)", () => {
			assert.equal(elapsed(89 * MIN), "1 hour ago"); // round(89/60)=round(1.4833)=1
		});
		test("91 minutes rounds up to hours=2", () => {
			assert.equal(elapsed(91 * MIN), "2 hours ago"); // round(91/60)=round(1.5167)=2
		});
	});

	describe("hours band", () => {
		test("1 hour (singular)", () => {
			assert.equal(elapsed(60 * MIN), "1 hour ago");
		});
		test("2 hours (plural)", () => {
			assert.equal(elapsed(120 * MIN), "2 hours ago");
		});
		test("23 hours stays in hours band", () => {
			assert.equal(elapsed(23 * HOUR), "23 hours ago");
		});
	});

	describe("day/yesterday band", () => {
		test("exactly 1 day (24h) is 'yesterday'", () => {
			assert.equal(elapsed(1 * DAY), "yesterday");
		});
		test("6 days ago (6.375 days rounds down to 6)", () => {
			assert.equal(elapsed(153 * HOUR), "6 days ago"); // 153/24 = 6.375 -> round = 6
		});
		test("6.58 days rounds UP to 7 days, which is >= 7 so it becomes '1 week ago'", () => {
			// documents that the day band boundary (d < 7) can be reached via
			// non-exact-day elapsed times, not just whole days
			assert.equal(elapsed(158 * HOUR), "1 week ago"); // 158/24 = 6.583 -> round = 7 -> week band
		});
		test("2 days (plural)", () => {
			assert.equal(elapsed(2 * DAY), "2 days ago");
		});
	});

	describe("weeks band", () => {
		test("exactly 7 days -> 1 week (singular)", () => {
			assert.equal(elapsed(7 * DAY), "1 week ago");
		});
		test("11 days -> 2 weeks (plural)", () => {
			assert.equal(elapsed(11 * DAY), "2 weeks ago"); // round(11/7)=round(1.571)=2
		});
		test("31 days -> 4 weeks (still < 5 weeks band)", () => {
			assert.equal(elapsed(31 * DAY), "4 weeks ago"); // round(31/7)=round(4.4286)=4
		});
		test("32 days -> week count would round to 5, so it falls through to months band", () => {
			// round(32/7)=round(4.5714)=5, so `w < 5` fails and the month
			// calculation (round(32/30.44)=1) takes over instead.
			assert.equal(elapsed(32 * DAY), "1 month ago");
		});
	});

	describe("months band", () => {
		test("60 days -> 2 months (plural)", () => {
			assert.equal(elapsed(60 * DAY), "2 months ago"); // round(60/30.44)=round(1.971)=2
		});
		test("335 days -> 11 months (just under the year cutoff)", () => {
			assert.equal(elapsed(335 * DAY), "11 months ago"); // round(335/30.44)=round(11.006)=11
		});
	});

	describe("years band", () => {
		test("365 days -> month count rounds to 12, so it falls through to 'a year ago'", () => {
			// round(365/30.44)=round(11.992)=12, so `mo < 12` fails;
			// y=round(365/365.25)=round(0.9993)=1 -> singular special-case text
			assert.equal(elapsed(365 * DAY), "a year ago");
		});
		test("731 days -> 2 years (plural, no 'a year' special case)", () => {
			assert.equal(elapsed(731 * DAY), "2 years ago"); // round(731/365.25)=round(2.0014)=2
		});
	});
});

// ---------------------------------------------------------------------------
// maybePluralize
// ---------------------------------------------------------------------------
describe("maybePluralize", () => {
	test("0 uses plural form (count !== 1)", () => {
		assert.equal(maybePluralize(0, "item"), "0 items");
	});
	test("1 uses singular form (no suffix)", () => {
		assert.equal(maybePluralize(1, "item"), "1 item");
	});
	test("2 uses plural form", () => {
		assert.equal(maybePluralize(2, "item"), "2 items");
	});
	test("custom suffix is applied for non-1 counts", () => {
		assert.equal(maybePluralize(2, "box", "es"), "2 boxes");
	});
	test("custom suffix is NOT applied for count === 1", () => {
		assert.equal(maybePluralize(1, "box", "es"), "1 box");
	});
	test("negative counts are treated as plural (documents actual behavior, not necessarily desirable)", () => {
		// count !== 1 is true for -1, so the suffix is appended even though
		// grammatically "-1 items" reads oddly. This is the function's actual
		// behavior per its `count !== 1` check.
		assert.equal(maybePluralize(-1, "item"), "-1 items");
	});
});

// ---------------------------------------------------------------------------
// debounce
// ---------------------------------------------------------------------------
describe("debounce", () => {
	test("rapid calls collapse into a single trailing call with the last arguments", (t) => {
		mock.timers.enable({ apis: ["setTimeout"] });
		t.after(() => mock.timers.reset());

		const calls: unknown[][] = [];
		const debounced = debounce(function (...args: unknown[]) {
			calls.push(args);
		}, 100);

		debounced("first");
		debounced("second");
		debounced("third");

		// not yet called: still within the debounce wait window
		assert.equal(calls.length, 0);

		mock.timers.tick(99);
		assert.equal(calls.length, 0, "should not fire before the wait elapses");

		mock.timers.tick(1);
		assert.equal(calls.length, 1, "should fire exactly once after the wait elapses");
		assert.deepEqual(calls[0], ["third"], "should use the arguments from the last call");
	});

	test("each call resets the timer, so steady trickling calls never fire", (t) => {
		mock.timers.enable({ apis: ["setTimeout"] });
		t.after(() => mock.timers.reset());

		const calls: unknown[] = [];
		const debounced = debounce(() => calls.push(1), 100);

		debounced();
		mock.timers.tick(60);
		debounced();
		mock.timers.tick(60);
		debounced();
		mock.timers.tick(60);

		assert.equal(calls.length, 0, "never idle for a full 100ms, so trailing call never fires");

		mock.timers.tick(100);
		assert.equal(calls.length, 1, "fires once the calls stop and the wait fully elapses");
	});

	test("immediate=true fires on the leading edge and not again until the wait passes", (t) => {
		mock.timers.enable({ apis: ["setTimeout"] });
		t.after(() => mock.timers.reset());

		const calls: unknown[][] = [];
		const debounced = debounce(function (...args: unknown[]) {
			calls.push(args);
		}, 100, true);

		debounced("a");
		assert.equal(calls.length, 1, "fires immediately on the leading edge");
		assert.deepEqual(calls[0], ["a"]);

		debounced("b");
		debounced("c");
		assert.equal(calls.length, 1, "does not fire again while still within the wait window");

		mock.timers.tick(100);
		// after the wait elapses, timeout resets to null; a new call should
		// fire immediately again
		debounced("d");
		assert.equal(calls.length, 2, "fires again on the next leading edge after the wait passed");
		assert.deepEqual(calls[1], ["d"]);
	});

	test("preserves `this` when invoked as a method", (t) => {
		mock.timers.enable({ apis: ["setTimeout"] });
		t.after(() => mock.timers.reset());

		let capturedThis: unknown;
		const obj = {
			value: 42,
			handler: debounce(function (this: { value: number }) {
				capturedThis = this;
			}, 50),
		};

		obj.handler();
		mock.timers.tick(50);

		assert.equal(capturedThis, obj, "the debounced function should be invoked with the original `this`");
		assert.equal((capturedThis as { value: number }).value, 42);
	});

	test("preserves `this` in immediate mode as well", (t) => {
		mock.timers.enable({ apis: ["setTimeout"] });
		t.after(() => mock.timers.reset());

		let capturedThis: unknown;
		const obj = {
			value: 7,
			handler: debounce(function (this: { value: number }) {
				capturedThis = this;
			}, 50, true),
		};

		obj.handler();
		assert.equal(capturedThis, obj);
	});
});

// ---------------------------------------------------------------------------
// is_in_bounds
// ---------------------------------------------------------------------------
describe("is_in_bounds", () => {
	const bounds = { left: 10, top: 20, width: 100, height: 50 };

	test("point strictly inside bounds", () => {
		assert.equal(is_in_bounds({ left: 50, top: 40 }, bounds), true);
	});

	test("point on the left edge is in bounds (>=)", () => {
		assert.equal(is_in_bounds({ left: 10, top: 40 }, bounds), true);
	});
	test("point on the right edge is in bounds (<=)", () => {
		assert.equal(is_in_bounds({ left: 110, top: 40 }, bounds), true);
	});
	test("point on the top edge is in bounds (>=)", () => {
		assert.equal(is_in_bounds({ left: 50, top: 20 }, bounds), true);
	});
	test("point on the bottom edge is in bounds (<=)", () => {
		assert.equal(is_in_bounds({ left: 50, top: 70 }, bounds), true);
	});
	test("all four corners are in bounds", () => {
		assert.equal(is_in_bounds({ left: 10, top: 20 }, bounds), true);
		assert.equal(is_in_bounds({ left: 110, top: 20 }, bounds), true);
		assert.equal(is_in_bounds({ left: 10, top: 70 }, bounds), true);
		assert.equal(is_in_bounds({ left: 110, top: 70 }, bounds), true);
	});

	test("point outside to the left", () => {
		assert.equal(is_in_bounds({ left: 9, top: 40 }, bounds), false);
	});
	test("point outside to the right", () => {
		assert.equal(is_in_bounds({ left: 111, top: 40 }, bounds), false);
	});
	test("point outside above", () => {
		assert.equal(is_in_bounds({ left: 50, top: 19 }, bounds), false);
	});
	test("point outside below", () => {
		assert.equal(is_in_bounds({ left: 50, top: 71 }, bounds), false);
	});
	test("point correct on the left axis but outside on top axis", () => {
		assert.equal(is_in_bounds({ left: 50, top: 1000 }, bounds), false);
	});
});

// ---------------------------------------------------------------------------
// stringHashcode
// ---------------------------------------------------------------------------
describe("stringHashcode", () => {
	test("same input produces the same hash", () => {
		assert.equal(stringHashcode("hello world"), stringHashcode("hello world"));
	});
	test("different inputs produce different hashes (for these samples)", () => {
		assert.notEqual(stringHashcode("hello"), stringHashcode("world"));
		assert.notEqual(stringHashcode("Tab Manager"), stringHashcode("tab manager"));
	});
	test("empty string hashes to 0", () => {
		assert.equal(stringHashcode(""), 0);
	});
	test("returns an integer (32-bit range)", () => {
		const h = stringHashcode("some reasonably long test string for hashing purposes");
		assert.equal(Number.isInteger(h), true);
		assert.ok(h >= -2147483648 && h <= 2147483647);
	});
	test("single character hash matches its char code formula", () => {
		// hash starts at 0; loop does hash = ((0<<5)-0)+code = code, then &0xFFFFFFFF (no-op for small values)
		assert.equal(stringHashcode("A"), "A".charCodeAt(0));
	});
});

// ---------------------------------------------------------------------------
// toBoolean (pure helper, no browser APIs needed)
// ---------------------------------------------------------------------------
describe("toBoolean", () => {
	test("undefined is false", () => {
		assert.equal(toBoolean(undefined), false);
	});
	test("null is false", () => {
		assert.equal(toBoolean(null), false);
	});
	test("string 'false' is false (case-insensitive)", () => {
		assert.equal(toBoolean("false"), false);
		assert.equal(toBoolean("FALSE"), false);
	});
	test("string 'no' is false", () => {
		assert.equal(toBoolean("no"), false);
	});
	test("string '0' is false", () => {
		assert.equal(toBoolean("0"), false);
	});
	test("empty string is false", () => {
		assert.equal(toBoolean(""), false);
	});
	test("other non-empty strings are true", () => {
		assert.equal(toBoolean("true"), true);
		assert.equal(toBoolean("yes"), true);
		assert.equal(toBoolean("1"), true);
		assert.equal(toBoolean("anything"), true);
	});
	test("number 0 is false, other numbers are true", () => {
		assert.equal(toBoolean(0), false);
		assert.equal(toBoolean(1), true);
		assert.equal(toBoolean(-1), true);
	});
	test("any other type (e.g. object/array) is true", () => {
		assert.equal(toBoolean({}), true);
		assert.equal(toBoolean([]), true);
	});
});
