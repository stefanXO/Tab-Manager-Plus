"use strict";

// Unit tests for the debug export in src/popup/debugExport.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readSessionsFile } from "../src/popup/sessionsFile.ts";
import { buildDebugExport, buildEverythingExport } from "../src/popup/debugExport.ts";

const windows = [
	{
		id: 1, focused: true, state: "normal", incognito: false, left: 10, top: 20,
		tabs: [
			{ id: 5, index: 0, title: "K PLUS - Kasikornbank", url: "https://www.kasikornbank.co.th/", pendingUrl: "", active: true, pinned: false, audible: false, mutedInfo: { muted: false }, discarded: false, status: "complete", lastAccessed: 1700000000000, favIconUrl: "https://x/f.ico", windowId: 1, groupId: 3, width: 100 },
			{ id: 6, index: 1, title: "Docs", url: "https://docs.google.com/document/d/1", active: false, pinned: true, audible: true, mutedInfo: { muted: true }, discarded: true, status: "unloaded", lastAccessed: 1700000001000, favIconUrl: "data:secret" },
		],
	},
	{
		id: 2, focused: false, state: "minimized", incognito: true,
		tabs: [{ id: 9, index: 0, title: "New", url: "chrome://newtab/", pendingUrl: "chrome://newtab/", active: true, pinned: false }],
	},
];
const meta = { extension: "7.0.0", browser: "UA/1.0", exported: new Date("2030-01-02T03:04:05Z"), names: new Map([[1, "Banking"]]) };
const settings = { theme: "dark", tabLimit: 0 };

describe("buildDebugExport", () => {
	const out = buildDebugExport(windows, settings, meta);

	test("shape", () => {
		assert.equal(out.format, "tab-manager-plus-export");
		assert.equal(out.version, 1);
		assert.equal(out.kind, "everything");
		assert.deepEqual(Object.keys(out).slice(0, 4), ["format", "version", "kind", "extension"]);
		assert.equal(out.extension, "7.0.0");
		assert.equal(out.browser, "UA/1.0");
		assert.equal(out.exported, "2030-01-02T03:04:05.000Z");
		assert.deepEqual(out.settings, settings);
		assert.equal(out.windows.length, 2);
		assert.deepEqual(Object.keys(out.windows[0]), ["id", "focused", "state", "incognito", "name", "autoName", "tabs"]);
	});

	test("custom name or null, and the automatic name is filled", () => {
		assert.equal(out.windows[0].name, "Banking");
		assert.equal(out.windows[1].name, null);
		assert.equal(out.windows[0].autoName, "Google Docs, Kasikornbank");
		assert.equal(out.windows[1].autoName, "New");
	});

	test("tab fields: exactly the listed ones", () => {
		assert.deepEqual(out.windows[0].tabs[0], {
			id: 5, index: 0, title: "K PLUS - Kasikornbank", url: "https://www.kasikornbank.co.th/", pendingUrl: "",
			active: true, pinned: false, audible: false, muted: false, discarded: false, status: "complete", lastAccessed: 1700000000000,
		});
		const t = out.windows[0].tabs[1];
		assert.equal(t.muted, true);
		assert.equal(t.audible, true);
		assert.equal(t.discarded, true);
		assert.equal(t.pendingUrl, "");
	});

	test("nothing else is copied", () => {
		const json = JSON.stringify(out);
		for (const leak of ["favIconUrl", "f.ico", "secret", "groupId", "windowId", "width", "left", "top"]) assert.ok(!json.includes(leak), leak);
	});

	test("missing fields get neutral values and the input is not changed", () => {
		const before = JSON.stringify(windows);
		const w = buildDebugExport([{ id: 3, tabs: [{ id: 1 }] }], {}, meta).windows[0];
		assert.deepEqual(w.tabs[0], { id: 1, index: 0, title: "", url: "", pendingUrl: "", active: false, pinned: false, audible: false, muted: false, discarded: false, status: "", lastAccessed: 0 });
		assert.equal(w.focused, false);
		assert.equal(w.autoName, "");
		assert.equal(JSON.stringify(windows), before);
	});
});

test("buildEverythingExport adds the saved windows and stays readable as a sessions file", () => {
	const sessions = [{ id: "a", windowsInfo: {}, tabs: [{}] }];
	const out = buildEverythingExport(windows, settings, meta, sessions);
	assert.deepEqual(out.sessions, sessions);
	assert.equal(out.windows.length, 2);
	assert.deepEqual(readSessionsFile(out), sessions);
});

test("no user:password@ in the export, open or saved, and the inputs keep theirs", () => {
	const open = [{ id: 1, tabs: [{ id: 2, title: "Login", url: "http://user:secret-pass@cred.example.com/login", pendingUrl: "https://u:pw2@cred.example.com/next" }] }];
	const sessions = [{ id: "s", tabs: [{ url: "https://me:saved-pass@cred.example.com/", title: "https://me:saved-pass@cred.example.com/", favIconUrl: "https://me:saved-pass@cred.example.com/f.ico" }] }];
	const out = buildEverythingExport(open, settings, meta, sessions);
	const json = JSON.stringify(out);
	for (const leak of ["secret-pass", "pw2", "saved-pass", "user:", "me:"]) assert.ok(!json.includes(leak), leak);
	assert.equal(out.windows[0].tabs[0].url, "http://cred.example.com/login");
	assert.equal(out.windows[0].tabs[0].pendingUrl, "https://cred.example.com/next");
	assert.deepEqual(readSessionsFile(out), [{ id: "s", tabs: [{ url: "https://cred.example.com/", title: "https://cred.example.com/", favIconUrl: "https://cred.example.com/f.ico" }] }]);
	assert.equal(sessions[0].tabs[0].url, "https://me:saved-pass@cred.example.com/");
	assert.equal(open[0].tabs[0].url, "http://user:secret-pass@cred.example.com/login");
});
