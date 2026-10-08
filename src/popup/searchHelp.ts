"use strict";

// The rows of the search syntax help (hover the search box) and the one
// rotating tip about saved windows. Both are about saved windows, so they are
// left out while the saved windows feature is off: nothing to look for there.

export interface HelpRow {
	code : string;
	text : string;
	// only listed while the saved windows feature is on
	saved? : boolean;
}

export const SEARCH_HELP_INTRO = "Type to search titles and urls. Every word must match.";
export const SEARCH_HELP_INTRO_SAVED = "Type to search titles and urls, in saved windows too. Every word must match.";

export const SEARCH_HELP_ROWS : HelpRow[] = [
	{ code: "github issue", text: "both words, anywhere" },
	{ code: "github OR reddit", text: "either word matches" },
	{ code: "t:release", text: "title only" },
	{ code: "u:youtube", text: "url only" },
	{ code: "s:tax", text: "saved windows only", saved: true },
	{ code: "s:u:github", text: "saved windows, url only (s:t: title)", saved: true },
	{ code: "s: t:tax", text: "whole search in saved windows", saved: true },
	{ code: "-s:tax", text: "open tabs only (-s:u: url, -s:t: title)", saved: true },
	{ code: "-s:", text: "show open windows only, selects nothing", saved: true },
	{ code: "-reddit", text: "leave out matching tabs" },
	{ code: "-u:old.reddit", text: "leave out by url" },
	{ code: "\"pull request\"", text: "exact phrase" },
	{ code: "/\\(\\d+\\)/", text: "unread count, like \"Inbox (3)\"" },
	{ code: "/localhost:\\d+/", text: "local dev servers, any port" },
	{ code: "/\\.pdf$/", text: "urls ending in .pdf" },
	{ code: "Enter", text: "move matches to new window" },
	{ code: "Esc", text: "clear the search" },
];

export function searchHelpRows(sessionsFeature : boolean) : HelpRow[] {
	return SEARCH_HELP_ROWS.filter((r) => sessionsFeature || !r.saved);
}

export function searchHelpIntro(sessionsFeature : boolean) : string {
	return sessionsFeature ? SEARCH_HELP_INTRO_SAVED : SEARCH_HELP_INTRO;
}

export const SAVED_SEARCH_TIP = "Search saved windows only with s:tax, or s:u:github for their urls";

// the tips that fit the current settings
export function searchTips(tips : string[], sessionsFeature : boolean) : string[] {
	return sessionsFeature ? tips : tips.filter((t) => t !== SAVED_SEARCH_TIP);
}
