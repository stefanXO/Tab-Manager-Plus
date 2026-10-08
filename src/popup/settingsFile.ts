"use strict";

// The settings file: Export Settings writes it, Import Settings reads it.
// Pure (no browser APIs), unit tested in tests/settingsFile.test.ts.
//
// { format: "tab-manager-plus-export", version: 1, kind: "settings",
//   extension: "7.0.0", exported: "<ISO time>", settings: { theme: "dark", ... } }
//
// It is the same envelope as the saved windows file (./sessionsFile.ts) with a
// `kind` of its own, so neither can be taken for the other: Import Sessions
// refuses a settings file (./importCount.ts) and Import Settings refuses a
// saved windows file. The debug export ("everything") holds the settings too,
// under the same `settings` key: Import Settings reads that part of it.
// Only the settings in SETTING_DEFAULTS are in the file: not the saved windows,
// and not the window names and colors (those are not settings).

import { maybePluralize } from "../helpers/utils.ts";
import type { Settings } from "../helpers/settings.ts";
import { EXPORT_FORMAT } from "./sessionsFile.ts";

export const SETTINGS_KIND = "settings";

export interface SettingsFile {
	format : typeof EXPORT_FORMAT;
	version : 1;
	kind : typeof SETTINGS_KIND;
	// the extension's version, and when the file was written (ISO)
	extension : string;
	exported : string;
	settings : Record<string, unknown>;
}

// What a setting may hold beyond its type, and how the notice names it (the
// options' own titles). One entry per setting, so a new setting cannot be
// forgotten here: the type is every key of Settings.
interface SettingRule {
	label : string;
	// the values it takes (text settings)
	choices? : readonly string[];
	// whole numbers from min to max (number settings; max left out: any)
	min? : number;
	max? : number;
	// Chrome only: the setting does nothing in Firefox, where an import leaves it alone
	chromeOnly? : boolean;
	// the value needs the system.display permission (Chrome): it is only
	// taken while the browser has granted it, turning it on is the options' job
	needsDisplay? : (value : unknown) => boolean;
}

export const SETTING_RULES : { [K in keyof Settings] : SettingRule } = {
	layout: { label: "Layout", choices: ["blocks", "blocks-big", "horizontal", "vertical"] },
	tabLimit: { label: "Limit Tabs Per Window", min: 0 },
	tabWidth: { label: "Popup Width", min: 450, max: 800 },
	tabHeight: { label: "Popup Height", min: 400, max: 600 },
	animations: { label: "Animations" },
	windowTitles: { label: "Window titles" },
	tabactions: { label: "Show action buttons" },
	badge: { label: "Count Tabs" },
	openInOwnTab: { label: "Open in own Tab by default" },
	compact: { label: "Compact mode" },
	theme: { label: "Theme", choices: ["system", "light", "dark"] },
	sessionsFeature: { label: "Save Windows for Later" },
	hideWindows: { label: "Minimize inactive windows", needsDisplay: (v) => v === true },
	supportLinks: { label: "Donate and Rate buttons" },
	showMonitors: { label: "Show all monitors", choices: ["unset", "on", "off"], chromeOnly: true, needsDisplay: (v) => v === "on" },
	"filter-tabs": { label: "Hide non-matching tabs" },
};

const NEEDS_PERMISSION = "needs permission, turn it on in the options";

const has = (o : object, key : string) : boolean => Object.prototype.hasOwnProperty.call(o, key);
// a value of an object by a key the type does not know
const at = (o : object, key : string) : unknown => (o as Record<string, unknown>)[key];
const isObject = (v : unknown) : v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

// Why `value` cannot be the setting `key`, or undefined when it can: the
// type of its default and the setting's own limits (no permission rules).
export function settingProblem(key : string, value : unknown, defaults : object) : string | undefined {
	if (!has(defaults, key) || !has(SETTING_RULES, key)) return "unknown setting";
	const type = typeof at(defaults, key);
	if (typeof value !== type) {
		return "wrong type, expected " + (type === "boolean" ? "true or false" : type === "number" ? "a number" : "text");
	}
	const rule = SETTING_RULES[key as keyof Settings];
	if (rule.choices && !rule.choices.includes(value as string)) return "not one of " + rule.choices.join(", ");
	if (type === "number") {
		const n = value as number;
		if (!Number.isInteger(n)) return "not a whole number";
		if ((rule.min !== undefined && n < rule.min) || (rule.max !== undefined && n > rule.max)) {
			return rule.max === undefined ? "below " + rule.min : "out of range, " + rule.min + " to " + rule.max;
		}
	}
	return undefined;
}

export interface SettingsMeta {
	extension : string;
	exported : Date;
}

// The file for the settings as they stand: every setting in `defaults`, the
// default where the stored value is missing or unusable.
export function buildSettingsFile(settings : object, defaults : object, meta : SettingsMeta) : SettingsFile {
	const out : Record<string, unknown> = {};
	for (const key of Object.keys(defaults)) {
		out[key] = settingProblem(key, at(settings, key), defaults) === undefined ? at(settings, key) : at(defaults, key);
	}
	return { format: EXPORT_FORMAT, version: 1, kind: SETTINGS_KIND, extension: meta.extension, exported: meta.exported.toISOString(), settings: out };
}

export type FileKind = "settings" | "everything" | "sessions" | "unknown";

// What a parsed file is. A settings file carries kind "settings"; the debug
// export ("everything") has settings and windows (and the saved windows);
// anything else with a list of saved windows, or that list itself, is a saved
// windows file.
export function fileKind(parsed : unknown) : FileKind {
	if (Array.isArray(parsed)) return "sessions";
	if (!isObject(parsed)) return "unknown";
	if (parsed.kind === SETTINGS_KIND) return "settings";
	if (isObject(parsed.settings) && Array.isArray(parsed.windows)) return "everything";
	if (Array.isArray(parsed.sessions)) return "sessions";
	return "unknown";
}

// What Import Sessions says to a settings file
export const SETTINGS_FILE_FOR_SESSIONS = "This is a settings file, not a saved windows file. Use Import Settings for it";

export interface SettingsEnv {
	// SETTING_DEFAULTS
	defaults : object;
	// the settings as stored now (defaults where missing)
	current : object;
	firefox : boolean;
	// the browser has granted system.display right now (Chrome)
	systemDisplay : boolean;
}

export interface SkippedSetting {
	key : string;
	reason : string;
}

export interface SettingsPlan {
	// the file cannot be used at all (the reason), else undefined
	fatal? : string;
	// the settings were read from a debug file, not a settings file
	fromEverything? : boolean;
	// the settings to write: the valid ones that differ from the current
	values : Record<string, unknown>;
	// the valid ones that are already as stored
	same : string[];
	skipped : SkippedSetting[];
}

// Sorts the settings of a parsed file into the ones to apply (valid key, the
// type of its default, within its limits, no permission missing), the ones
// already set that way and the skipped ones with their reason.
export function planSettingsImport(parsed : unknown, env : SettingsEnv) : SettingsPlan {
	const plan : SettingsPlan = { values: {}, same: [], skipped: [] };
	const kind = fileKind(parsed);
	if (kind === "sessions") {
		plan.fatal = "This is a saved windows file, not a settings file. Use Import Sessions for it";
		return plan;
	}
	if (kind === "unknown") {
		plan.fatal = "The file is JSON, but not a Tab Manager Plus settings file";
		return plan;
	}
	const settings = (parsed as { settings? : unknown }).settings;
	if (!isObject(settings)) {
		plan.fatal = "The file has no settings in it";
		return plan;
	}
	if (kind === "everything") plan.fromEverything = true;
	for (const [key, value] of Object.entries(settings)) {
		const problem = settingProblem(key, value, env.defaults);
		// a Chrome-only setting does nothing in Firefox: left alone, not reported
		// (every Firefox export and debug file holds it)
		if (!problem && env.firefox && SETTING_RULES[key as keyof Settings].chromeOnly) continue;
		const reason = problem ?? gateProblem(key, value, env);
		if (reason) plan.skipped.push({ key, reason });
		else if (value === at(env.current, key)) plan.same.push(key);
		else plan.values[key] = value;
	}
	if (!Object.keys(settings).length) plan.fatal = "The file has no settings in it";
	return plan;
}

// the browser-dependent reasons to leave a valid setting alone
function gateProblem(key : string, value : unknown, env : SettingsEnv) : string | undefined {
	const rule = SETTING_RULES[key as keyof Settings];
	if (!env.firefox && rule.needsDisplay?.(value) && !env.systemDisplay) return NEEDS_PERMISSION;
	return undefined;
}

// the title of a setting for the notice; an unknown key in quotes
function settingName(key : string) : string {
	return has(SETTING_RULES, key) ? SETTING_RULES[key as keyof Settings].label : '"' + key + '"';
}

// "Settings imported: 3 settings changed (Theme, ...), 10 already the same,
// 2 skipped (Show all monitors: needs permission, ...; "foo": unknown setting)"
export function settingsSummary(plan : SettingsPlan) : string {
	if (plan.fatal) return plan.fatal;
	const changed = Object.keys(plan.values);
	const parts : string[] = [];
	if (changed.length) parts.push(maybePluralize(changed.length, "setting") + " changed (" + changed.map(settingName).join(", ") + ")");
	if (plan.same.length) parts.push(plan.same.length + " already the same");
	if (plan.skipped.length) parts.push(plan.skipped.length + " skipped (" + plan.skipped.map((s) => settingName(s.key) + ": " + s.reason).join("; ") + ")");
	const from = plan.fromEverything ? " from a debug file" : "";
	if (changed.length) return "Settings imported" + from + ": " + parts.join(", ");
	return "No settings changed" + from + (parts.length ? ": " + parts.join(", ") : "");
}

// whether the import went well enough to say so as a note, not an error:
// something was applied, or nothing was refused (everything usable was already
// set that way)
export function settingsWorked(plan : SettingsPlan) : boolean {
	return !plan.fatal && (Object.keys(plan.values).length + plan.same.length > 0 || plan.skipped.length === 0);
}
