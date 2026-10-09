import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
	resolveShowMonitors,
	switchShowMonitors,
	readShowMonitors,
} from "../src/helpers/monitors.ts";

// ---------------------------------------------------------------------------
// readShowMonitors: the stored value, anything unknown is "unset"
// ---------------------------------------------------------------------------
describe("readShowMonitors", () => {
	test("keeps the three known values", () => {
		assert.equal(readShowMonitors("unset"), "unset");
		assert.equal(readShowMonitors("on"), "on");
		assert.equal(readShowMonitors("off"), "off");
	});
	test("missing or garbage -> unset", () => {
		assert.equal(readShowMonitors(undefined), "unset");
		assert.equal(readShowMonitors(null), "unset");
		assert.equal(readShowMonitors(true), "unset");
		assert.equal(readShowMonitors("yes"), "unset");
	});
});

// ---------------------------------------------------------------------------
// resolveShowMonitors: options load, popup boot, permissions.onAdded
// ---------------------------------------------------------------------------
describe("resolveShowMonitors", () => {
	test("unset + granted -> persisted on, enabled", () => {
		assert.deepEqual(resolveShowMonitors("unset", true), { setting: "on", enabled: true });
	});
	test("unset + not granted -> stays unset, disabled", () => {
		assert.deepEqual(resolveShowMonitors("unset", false), { setting: "unset", enabled: false });
	});
	test("on + granted -> on, enabled", () => {
		assert.deepEqual(resolveShowMonitors("on", true), { setting: "on", enabled: true });
	});
	test("on + permission taken away (browser settings) -> on kept, but disabled", () => {
		assert.deepEqual(resolveShowMonitors("on", false), { setting: "on", enabled: false });
	});
	test("off sticks: a later grant never flips it back", () => {
		assert.deepEqual(resolveShowMonitors("off", true), { setting: "off", enabled: false });
	});
	test("off + not granted -> off, disabled", () => {
		assert.deepEqual(resolveShowMonitors("off", false), { setting: "off", enabled: false });
	});
	test("a garbage stored value counts as unset", () => {
		assert.deepEqual(resolveShowMonitors("maybe" as never, true), { setting: "on", enabled: true });
	});
});

// ---------------------------------------------------------------------------
// switchShowMonitors: the options switch clicked
// ---------------------------------------------------------------------------
describe("switchShowMonitors", () => {
	test("switched on, permission granted -> on", () => {
		assert.equal(switchShowMonitors("unset", true, true), "on");
		assert.equal(switchShowMonitors("off", true, true), "on");
	});
	test("switched on, permission denied -> the setting stays as it was", () => {
		assert.equal(switchShowMonitors("unset", true, false), "unset");
		assert.equal(switchShowMonitors("off", true, false), "off");
	});
	test("switched off -> off, whatever the permission", () => {
		assert.equal(switchShowMonitors("on", false, true), "off");
		assert.equal(switchShowMonitors("unset", false, true), "off");
		assert.equal(switchShowMonitors("on", false, false), "off");
	});
	test("after switching, resolve gives what the switch shows", () => {
		assert.equal(resolveShowMonitors(switchShowMonitors("off", true, true), true).enabled, true);
		assert.equal(resolveShowMonitors(switchShowMonitors("unset", true, false), false).enabled, false);
		assert.equal(resolveShowMonitors(switchShowMonitors("on", false, true), true).enabled, false);
	});
});
