import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
	mergeManifest,
	checkPermissions,
	firefoxManifest,
	CHROME_ONLY_PERMISSIONS,
} from "../scripts/manifest.mjs";

/** The committed manifests, read from disk so the tests check the real files. */
function read(name: string) {
	return JSON.parse(readFileSync(new URL(`../${name}`, import.meta.url), "utf8"));
}

const realBase = read("manifest.json");
const realOverlay = read("manifest.firefox.json");

// ---------------------------------------------------------------------------
// mergeManifest
// ---------------------------------------------------------------------------
describe("mergeManifest", () => {
	test("copies keys the base does not have", () => {
		assert.deepEqual(mergeManifest({ a: 1 }, { b: 2 }), { a: 1, b: 2 });
	});

	test("overwrites a scalar", () => {
		assert.deepEqual(mergeManifest({ a: 1 }, { a: 2 }), { a: 2 });
	});

	test("deep-merges plain objects", () => {
		const merged = mergeManifest(
			{ gecko: { id: "old", keep: true } },
			{ gecko: { id: "new", added: 1 } },
		);
		assert.deepEqual(merged, { gecko: { id: "new", keep: true, added: 1 } });
	});

	test("deep-merges more than one level down", () => {
		const merged = mergeManifest(
			{ a: { b: { c: 1, d: 2 } } },
			{ a: { b: { c: 9 } } },
		);
		assert.deepEqual(merged, { a: { b: { c: 9, d: 2 } } });
	});

	test("replaces an array wholesale instead of concatenating", () => {
		assert.deepEqual(mergeManifest({ p: ["a", "b", "c"] }, { p: ["a"] }), { p: ["a"] });
	});

	test("an array replaces an object and an object replaces an array", () => {
		assert.deepEqual(mergeManifest({ a: { b: 1 } }, { a: [1] }), { a: [1] });
		assert.deepEqual(mergeManifest({ a: [1] }, { a: { b: 1 } }), { a: { b: 1 } });
	});

	test("null deletes the key", () => {
		assert.deepEqual(mergeManifest({ a: 1, b: 2 }, { b: null }), { a: 1 });
	});

	test("null deletes a nested key", () => {
		const merged = mergeManifest(
			{ background: { service_worker: "sw.js", type: "module" } },
			{ background: { service_worker: null, scripts: ["sw.js"] } },
		);
		assert.deepEqual(merged, { background: { type: "module", scripts: ["sw.js"] } });
	});

	test("deleting a key that is not there is not an error", () => {
		assert.deepEqual(mergeManifest({ a: 1 }, { nope: null }), { a: 1 });
	});

	test("leaves the base untouched", () => {
		const base = { a: { b: 1 }, list: ["x"], gone: true };
		mergeManifest(base, { a: { b: 2, c: 3 }, list: ["y"], gone: null });
		assert.deepEqual(base, { a: { b: 1 }, list: ["x"], gone: true });
	});

	test("leaves the overlay untouched, and does not share its objects", () => {
		const overlay = { a: { b: 1 }, list: ["x"] };
		const merged = mergeManifest({}, overlay);
		merged.a.b = 99;
		merged.list.push("y");
		assert.deepEqual(overlay, { a: { b: 1 }, list: ["x"] });
	});
});

// ---------------------------------------------------------------------------
// the real Chrome manifest merged with the real Firefox overlay
// ---------------------------------------------------------------------------
describe("the Firefox manifest", () => {
	const firefox = firefoxManifest(realBase, realOverlay);

	test("stays manifest version 3 and keeps the version from the base", () => {
		assert.equal(firefox.manifest_version, 3);
		assert.equal(firefox.version, realBase.version);
		assert.equal("version" in realOverlay, false);
	});

	test("has no key: that is Chrome's pin for the unpacked id", () => {
		assert.equal("key" in firefox, false);
		assert.ok(realBase.key, "manifest.json should still carry the key for Chrome");
	});

	test("drops the other keys Firefox does not know", () => {
		assert.equal("offline_enabled" in firefox, false);
		assert.equal("optional_permissions" in firefox, false);
		assert.equal("content_security_policy" in firefox, false);
	});

	test("asks for no favicon permission", () => {
		assert.equal(firefox.permissions.includes("favicon"), false);
		assert.ok(realBase.permissions.includes("favicon"));
	});

	test("keeps every other permission the base asks for", () => {
		for (const permission of realBase.permissions) {
			if (CHROME_ONLY_PERMISSIONS.includes(permission)) continue;
			assert.ok(firefox.permissions.includes(permission), `${permission} is missing`);
		}
	});

	test("runs the background as an event page, not a service worker", () => {
		assert.deepEqual(firefox.background, { scripts: ["dist/service_worker/service_worker.js"] });
		assert.equal("service_worker" in firefox.background, false);
	});

	// the overlay repeats both strings, so a Chrome edit must be mirrored
	test("is named for Firefox, otherwise worded like Chrome", () => {
		assert.equal(firefox.name, realBase.name.replace("for Chrome", "for Firefox"));
		assert.equal(firefox.description, realBase.description.replace("for Chrome", "for Firefox"));
	});

	test("carries the gecko id, minimum version and data collection answer", () => {
		assert.deepEqual(firefox.browser_specific_settings.gecko, {
			id: "{45f2dc53-96cd-4c41-91f6-f4a73a8fb2b0}",
			strict_min_version: "140.0",
			data_collection_permissions: { required: ["none"] },
		});
	});

	test("opens in the sidebar as well as the toolbar", () => {
		assert.equal(firefox.sidebar_action.default_panel, "popup.html?panel=true");
		assert.equal(firefox.sidebar_action.default_title, "Tab Manager Plus");
		assert.deepEqual(firefox.sidebar_action.default_icon, realBase.action.default_icon);
	});

	test("keeps _execute_action, which is the MV3 spelling in Firefox too", () => {
		assert.ok(firefox.commands._execute_action);
		assert.equal("_execute_browser_action" in firefox.commands, false);
	});

	test("carries no $comment from the overlay", () => {
		for (const key of Object.keys(firefox)) assert.equal(key.startsWith("$"), false, key);
	});
});

// ---------------------------------------------------------------------------
// the permission guard
// ---------------------------------------------------------------------------
describe("checkPermissions", () => {
	test("passes when nothing is dropped", () => {
		checkPermissions({ permissions: ["tabs", "alarms"] }, { permissions: ["tabs", "alarms"] });
	});

	test("passes when only a documented chrome-only permission is dropped", () => {
		checkPermissions({ permissions: ["tabs", "favicon"] }, { permissions: ["tabs"] });
	});

	test("throws when a permission is dropped without being chrome-only", () => {
		assert.throws(
			() => checkPermissions({ permissions: ["tabs", "bookmarks"] }, { permissions: ["tabs"] }),
			/bookmarks/,
		);
	});

	test("names every dropped permission", () => {
		assert.throws(
			() => checkPermissions({ permissions: ["tabs", "bookmarks", "downloads"] }, { permissions: [] }),
			/bookmarks, downloads/,
		);
	});

	test("firefoxManifest throws when the overlay drops a permission silently", () => {
		const base = { permissions: ["tabs", "bookmarks"] };
		assert.throws(() => firefoxManifest(base, { permissions: ["tabs"] }), /bookmarks/);
	});

	test("the real overlay passes the guard", () => {
		checkPermissions(realBase, firefoxManifest(realBase, realOverlay));
	});
});
