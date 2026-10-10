"use strict";

// The action buttons' help (the toolbar, the header's icons, the window and
// saved window actions): the hover card shows it while the pointer rests on a
// button (../statsHover.ts, the card of the tabs and windows), instead of a
// native tooltip: the button's name, a line on what it does, and the key caps
// of a key that does the same. Only keys that really do it
// (TabManager.checkKey, ./selectionKeys.ts): Ctrl+Delete (Cmd+Backspace on a
// Mac) closes the selection as the trash button does, Enter does what the new
// window button does. Pure, unit tested in tests/actionHelp.test.ts.

import {maybePluralize} from "../helpers/utils.ts";
import {nextTheme, type Theme} from "../helpers/theme.ts";
import type {StatsCard} from "./stats.ts";

// The attributes that give a button its card: the text (the name, then after a
// \n what it does) and the key caps joined with "+" (readKeys). The card reads
// them when it opens and again when they change (a click on the button)
export interface ActionHelp {
	"data-help" : string;
	"data-help-keys"? : string;
}

export function actionHelp(text : string, keys? : readonly string[] | null) : ActionHelp {
	const help : ActionHelp = { "data-help": text };
	if (keys && keys.length > 0) help["data-help-keys"] = keys.join("+");
	return help;
}

// data-help-keys back to the caps; null without any
export function readKeys(attr : string | null | undefined) : string[] | null {
	return attr ? attr.split("+") : null;
}

// What the card shows for a button: its name (the first line) as the title,
// the key caps next to it, and what it does under it: every further line (the
// recent tabs button has one per step), blank ones left out. Null without a
// help text.
export interface ActionCardContent {
	card : StatsCard;
	keys : string[] | null;
}
export function actionCard(help : string | null | undefined, keysAttr? : string | null) : ActionCardContent | null {
	if (!help) return null;
	const [title, ...rest] = help.split("\n");
	const lines = rest.map((l) => l.trim()).filter((l) => l).map((text, i) => ({ key: "help" + i, text }));
	return { card: { title, lines }, keys: readKeys(keysAttr) };
}

// Ctrl/Cmd+Delete as caps: on a Mac the key named delete is Backspace (both
// do it, ./selectionKeys.ts), drawn as on its keyboard, like the Undo
// notice's ⌘ Z (../notices.ts undoKeyCaps)
export function deleteKeyCaps(mac : boolean) : string[] {
	return mac ? ["⌘", "⌫"] : ["Ctrl", "Del"];
}

// The trash button: the keys close the selected open tabs or delete the
// selected saved tabs, as it does; with nothing selected the button closes the
// current tab and the keys do nothing
export function trashKeys(selected : number, mac : boolean) : string[] | null {
	return selected > 0 ? deleteKeyCaps(mac) : null;
}

// The new window button, which Enter runs (TabManager.addWindow): moves the
// selected open tabs to a new window (one tab: switches to it), or opens an
// empty one. Not with saved tabs selected (Enter opens those, the button does
// nothing), nor after a search that selected nothing (Enter does nothing).
export function newWindowKeys(selected : number, savedOnly : boolean, searching : boolean) : string[] | null {
	if (savedOnly) return null;
	if (selected === 0 && searching) return null;
	return ["Enter"];
}

// The new window button's name and help for `selected` tabs. One selected tab
// is not moved: the button switches to it (TabManager.addWindow), so it says so.
export function newWindowLabel(selected : number) : string {
	if (selected === 0) return "Open new empty window";
	return selected === 1 ? "Switch to the selected tab" : "Move tabs to new window";
}

export function newWindowHelp(selected : number) : string {
	if (selected === 0) return newWindowLabel(selected);
	if (selected === 1) return newWindowLabel(selected) + "\nActivates it in its window";
	return newWindowLabel(selected) + "\nWill move " + maybePluralize(selected, "selected tab") + " to it";
}

const THEME_NAMES : Record<Theme, string> = { system: "System", light: "Light", dark: "Dark" };

// the theme button's name, for its aria-label and the card's title
export function themeLabel(theme : Theme) : string {
	return "Theme: " + THEME_NAMES[theme];
}

// The theme button's help: the theme now, and what a click makes it (the card
// changes with it when the button is clicked)
export function themeHelp(theme : Theme) : string {
	const next = nextTheme(theme);
	const follows = "follows the dark mode of your system";
	if (theme === "system") return themeLabel(theme) + "\nIt " + follows + ". Click for " + THEME_NAMES[next];
	if (next === "system") return themeLabel(theme) + "\nClick for System, which " + follows;
	return themeLabel(theme) + "\nClick for " + THEME_NAMES[next];
}
