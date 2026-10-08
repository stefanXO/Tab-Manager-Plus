"use strict";

// Unit tests for the settings file in src/popup/settingsFile.ts (Export
// Settings / Import Settings) and how the saved windows import treats it.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildSettingsFile, fileKind, planSettingsImport, SETTING_RULES, settingProblem, settingsSummary, settingsWorked } from "../src/popup/settingsFile.ts";
import type { SettingsEnv } from "../src/popup/settingsFile.ts";
import { buildSessionsFile, settingsFileName } from "../src/popup/sessionsFile.ts";
import { buildEverythingExport } from "../src/popup/debugExport.ts";
import { importSummary, planImport } from "../src/popup/importCount.ts";
import { settingsExportNote } from "../src/popup/exportNotes.ts";

// the same keys and defaults as SETTING_DEFAULTS in src/helpers/settings.ts
// (which needs the browser to load); a test below keeps the two in step
const DEFAULTS = {
	layout: "blocks", tabLimit: 0, tabWidth: 800, tabHeight: 600, animations: true, windowTitles: true,
	tabactions: true, badge: true, openInOwnTab: false, compact: false, theme: "system", sessionsFeature: true,
	hideWindows: false, supportLinks: true, showMonitors: "unset", "filter-tabs": false,
};
const meta = { extension: "7.0.0", exported: new Date(Date.UTC(2030, 0, 2, 3, 4, 5)) };
const env = (over : Partial<SettingsEnv> = {}) : SettingsEnv => ({ defaults: DEFAULTS, current: { ...DEFAULTS }, firefox: false, systemDisplay: true, ...over });
const file = (settings : unknown) => ({ format: "tab-manager-plus-export", version: 1, kind: "settings", settings });

describe("the rules and SETTING_DEFAULTS", () => {
	test("one rule per default, with a label", () => {
		assert.deepEqual(Object.keys(SETTING_RULES).sort(), Object.keys(DEFAULTS).sort());
		for (const rule of Object.values(SETTING_RULES)) assert.ok(rule.label);
	});
	test("the defaults here are the extension's", async () => {
		const { readFileSync } = await import("node:fs");
		const src = readFileSync(new URL("../src/helpers/settings.ts", import.meta.url), "utf8");
		const body = src.slice(src.indexOf("export const SETTING_DEFAULTS"));
		const block = body.slice(body.indexOf("{"), body.indexOf("};"));
		const keys = [...block.matchAll(/^\t"?([\w-]+)"?:/gm)].map((m) => m[1]);
		assert.deepEqual(keys.sort(), Object.keys(DEFAULTS).sort());
	});
	test("every default is valid for its own rule", () => {
		for (const [key, value] of Object.entries(DEFAULTS)) assert.equal(settingProblem(key, value, DEFAULTS), undefined, key);
	});
});

describe("file name", () => {
	test("tab-manager-plus-settings-YYYY-MM-DD-HH-MM-SS.json in local time", () => {
		assert.equal(settingsFileName(new Date(2030, 0, 2, 3, 4, 5)), "tab-manager-plus-settings-2030-01-02-03-04-05.json");
	});
});

describe("buildSettingsFile", () => {
	test("the envelope of the other exports with kind settings", () => {
		const f = buildSettingsFile(DEFAULTS, DEFAULTS, meta);
		assert.equal(f.format, "tab-manager-plus-export");
		assert.equal(f.version, 1);
		assert.equal(f.kind, "settings");
		assert.equal(f.extension, "7.0.0");
		assert.equal(f.exported, "2030-01-02T03:04:05.000Z");
		assert.deepEqual(f.settings, DEFAULTS);
	});
	test("only the settings: no saved windows, names or colors, nothing unknown", () => {
		const f = buildSettingsFile({ ...DEFAULTS, theme: "dark", sessions: [{}], windowNames: { 1: "x" }, windowColors: {}, version: "7.0.0" }, DEFAULTS, meta);
		assert.deepEqual(Object.keys(f.settings), Object.keys(DEFAULTS));
		assert.equal(f.settings.theme, "dark");
		assert.equal((f as unknown as Record<string, unknown>).sessions, undefined);
	});
	test("a missing or unusable stored value is written as the default", () => {
		const f = buildSettingsFile({ theme: "purple", tabWidth: "800", compact: 1, layout: undefined, tabLimit: 12 }, DEFAULTS, meta);
		assert.deepEqual(f.settings, { ...DEFAULTS, tabLimit: 12 });
	});
	test("survives a trip through JSON and reads back as nothing to change", () => {
		const f = JSON.parse(JSON.stringify(buildSettingsFile({ ...DEFAULTS, theme: "dark", tabWidth: 700 }, DEFAULTS, meta)));
		const plan = planSettingsImport(f, env({ current: { ...DEFAULTS, theme: "dark", tabWidth: 700 } }));
		assert.deepEqual(plan.values, {});
		assert.deepEqual(plan.skipped, []);
		assert.equal(plan.same.length, Object.keys(DEFAULTS).length);
	});
});

describe("fileKind", () => {
	test("settings, saved windows, debug file, unknown", () => {
		assert.equal(fileKind(buildSettingsFile(DEFAULTS, DEFAULTS, meta)), "settings");
		assert.equal(fileKind(buildSessionsFile([])), "sessions");
		assert.equal(fileKind([]), "sessions");
		const everything = buildEverythingExport([], DEFAULTS, { extension: "7", browser: "x", exported: meta.exported, names: new Map() }, []);
		assert.equal(fileKind(everything), "everything");
		for (const v of [null, 5, "x", {}, { a: 1 }, { settings: DEFAULTS }]) assert.equal(fileKind(v), "unknown");
	});
});

describe("planSettingsImport", () => {
	test("valid settings that differ are applied, equal ones counted", () => {
		const plan = planSettingsImport(file({ theme: "dark", compact: true, animations: true }), env());
		assert.deepEqual(plan.values, { theme: "dark", compact: true });
		assert.deepEqual(plan.same, ["animations"]);
		assert.deepEqual(plan.skipped, []);
		assert.equal(plan.fatal, undefined);
	});
	test("unknown keys are skipped, also names of Object itself", () => {
		const plan = planSettingsImport(file(JSON.parse('{"foo":1,"toString":1,"__proto__":{"x":1},"constructor":"a","theme":"light"}')), env());
		assert.deepEqual(plan.values, { theme: "light" });
		assert.deepEqual(plan.skipped.map((s) => s.key).sort(), ["__proto__", "constructor", "foo", "toString"]);
		assert.ok(plan.skipped.every((s) => s.reason === "unknown setting"));
		assert.equal(({} as Record<string, unknown>).x, undefined);
	});
	test("a value of another type than the default's is skipped with a reason", () => {
		const plan = planSettingsImport(file({ compact: "yes", tabWidth: "700", theme: 3, animations: null, layout: ["blocks"], tabLimit: true }), env());
		assert.deepEqual(plan.values, {});
		assert.deepEqual(plan.skipped, [
			{ key: "compact", reason: "wrong type, expected true or false" },
			{ key: "tabWidth", reason: "wrong type, expected a number" },
			{ key: "theme", reason: "wrong type, expected text" },
			{ key: "animations", reason: "wrong type, expected true or false" },
			{ key: "layout", reason: "wrong type, expected text" },
			{ key: "tabLimit", reason: "wrong type, expected a number" },
		]);
	});
	test("a value of the right type outside the setting's values or range is skipped", () => {
		const plan = planSettingsImport(file({ theme: "purple", layout: "grid", tabWidth: 5000, tabHeight: 399, tabLimit: -1, showMonitors: "maybe", tabLimit2: 1 }), env());
		assert.deepEqual(plan.values, {});
		const reasons = Object.fromEntries(plan.skipped.map((s) => [s.key, s.reason]));
		assert.equal(reasons.theme, "not one of system, light, dark");
		assert.equal(reasons.layout, "not one of blocks, blocks-big, horizontal, vertical");
		assert.equal(reasons.tabWidth, "out of range, 450 to 800");
		assert.equal(reasons.tabHeight, "out of range, 400 to 600");
		assert.equal(reasons.tabLimit, "below 0");
		assert.equal(reasons.showMonitors, "not one of unset, on, off");
		assert.equal(reasons.tabLimit2, "unknown setting");
	});
	test("a fraction is not a whole number", () => {
		assert.equal(planSettingsImport(file({ tabWidth: 700.5 }), env()).skipped[0].reason, "not a whole number");
	});
	test("a setting that needs system.display is skipped without it (Chrome)", () => {
		const plan = planSettingsImport(file({ hideWindows: true, showMonitors: "on", compact: true }), env({ systemDisplay: false }));
		assert.deepEqual(plan.values, { compact: true });
		assert.deepEqual(plan.skipped, [
			{ key: "hideWindows", reason: "needs permission, turn it on in the options" },
			{ key: "showMonitors", reason: "needs permission, turn it on in the options" },
		]);
	});
	test("turning them off or leaving them unset needs no permission", () => {
		const current = { ...DEFAULTS, hideWindows: true, showMonitors: "on" };
		const plan = planSettingsImport(file({ hideWindows: false, showMonitors: "off" }), env({ systemDisplay: false, current }));
		assert.deepEqual(plan.values, { hideWindows: false, showMonitors: "off" });
		assert.deepEqual(planSettingsImport(file({ showMonitors: "unset" }), env({ systemDisplay: false })).same, ["showMonitors"]);
	});
	test("with the permission granted they are applied", () => {
		const plan = planSettingsImport(file({ hideWindows: true, showMonitors: "on" }), env({ systemDisplay: true }));
		assert.deepEqual(plan.values, { hideWindows: true, showMonitors: "on" });
		assert.deepEqual(plan.skipped, []);
	});
	test("Firefox needs no permission for Minimize inactive windows and leaves the Chrome-only setting alone", () => {
		const plan = planSettingsImport(file({ hideWindows: true, showMonitors: "on", theme: "dark" }), env({ firefox: true, systemDisplay: false }));
		assert.deepEqual(plan.values, { hideWindows: true, theme: "dark" });
		assert.deepEqual(plan.skipped, []);
		assert.deepEqual(plan.same, []);
		// an invalid value of it is still reported
		assert.equal(planSettingsImport(file({ showMonitors: 4 }), env({ firefox: true })).skipped.length, 1);
	});
	test("a debug (everything) file: its settings part is read", () => {
		const everything = buildEverythingExport([], { ...DEFAULTS, theme: "dark" }, { extension: "7", browser: "x", exported: meta.exported, names: new Map() }, [{ id: "a" }]);
		const plan = planSettingsImport(JSON.parse(JSON.stringify(everything)), env());
		assert.equal(plan.fromEverything, true);
		assert.deepEqual(plan.values, { theme: "dark" });
		assert.match(settingsSummary(plan), /^Settings imported from a debug file: /);
	});
	test("a saved windows file is refused", () => {
		for (const parsed of [buildSessionsFile([{ id: "a" }]), [{ id: "a" }]]) {
			const plan = planSettingsImport(parsed, env());
			assert.match(plan.fatal!, /saved windows file.*Import Sessions/);
			assert.deepEqual(plan.values, {});
			assert.equal(settingsWorked(plan), false);
			assert.equal(settingsSummary(plan), plan.fatal);
		}
	});
	test("anything else is refused; so is a settings file without settings", () => {
		for (const parsed of [null, 5, "x", {}, { a: 1 }, { theme: "dark" }]) assert.match(planSettingsImport(parsed, env()).fatal!, /not a Tab Manager Plus settings file/);
		for (const parsed of [file(undefined), file([1]), file("x"), file({})]) assert.equal(planSettingsImport(parsed, env()).fatal, "The file has no settings in it");
	});
});

describe("settingsSummary and settingsWorked", () => {
	test("changed, the same, skipped with reasons", () => {
		const plan = planSettingsImport(file({ theme: "dark", compact: true, animations: true, foo: 1, hideWindows: true }), env({ systemDisplay: false }));
		assert.equal(settingsSummary(plan),
			"Settings imported: 2 settings changed (Theme, Compact mode), 1 already the same, 2 skipped (\"foo\": unknown setting; Minimize inactive windows: needs permission, turn it on in the options)");
		assert.equal(settingsWorked(plan), true);
	});
	test("singular", () => {
		assert.equal(settingsSummary(planSettingsImport(file({ theme: "dark" }), env())), "Settings imported: 1 setting changed (Theme)");
	});
	test("nothing to change is a note", () => {
		const plan = planSettingsImport(file({ theme: "system" }), env());
		assert.equal(settingsSummary(plan), "No settings changed: 1 already the same");
		assert.equal(settingsWorked(plan), true);
	});
	test("everything skipped is an error", () => {
		const plan = planSettingsImport(file({ foo: 1, compact: "x" }), env());
		assert.equal(settingsSummary(plan), "No settings changed: 2 skipped (\"foo\": unknown setting; Compact mode: wrong type, expected true or false)");
		assert.equal(settingsWorked(plan), false);
	});
	test("only a Chrome-only setting read in Firefox: nothing changed, nothing refused", () => {
		const plan = planSettingsImport(file({ showMonitors: "on" }), env({ firefox: true }));
		assert.equal(settingsSummary(plan), "No settings changed");
		assert.equal(settingsWorked(plan), true);
	});
});

describe("Import Sessions and the settings file", () => {
	test("a settings file is refused with a clear message", () => {
		const plan = planImport(buildSettingsFile(DEFAULTS, DEFAULTS, meta));
		assert.equal(plan.valid.length, 0);
		assert.match(plan.fatal!, /settings file.*Import Settings/);
		assert.equal(importSummary(plan), plan.fatal);
	});
	test("a settings file with a sessions key is still refused", () => {
		assert.ok(planImport({ ...buildSettingsFile(DEFAULTS, DEFAULTS, meta), sessions: [{ id: "a", windowsInfo: {}, tabs: [{}] }] }).fatal);
	});
	test("a debug file still gives its saved windows", () => {
		const everything = buildEverythingExport([], DEFAULTS, { extension: "7", browser: "x", exported: meta.exported, names: new Map() }, [{ id: "a", windowsInfo: {}, tabs: [{}] }]);
		assert.equal(planImport(everything).valid.length, 1);
	});
});

describe("settingsExportNote", () => {
	test("what the file holds", () => {
		assert.equal(settingsExportNote(16), "Will export 16 settings, not the saved windows or the window names and colors");
		assert.equal(settingsExportNote(1), "Will export 1 setting, not the saved windows or the window names and colors");
	});
});
