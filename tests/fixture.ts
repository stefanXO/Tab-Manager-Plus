"use strict";

// Shared fixture used by both tests/search.test.ts and tests/duplicates.test.ts.
// RAW_TABS: ~30 realistic tabs covering titles/urls of different shapes, plus
// a handful of tabs that intentionally duplicate another tab's url (see
// DUPLICATE_URL_TABS below), and near-misses that must NOT be treated as
// duplicates (exact url comparison only).

export interface RawTab {
	title : string | undefined;
	url : string | undefined;
	// Only set on the duplicate-url tabs below, for tests/duplicates.test.ts
	// (findDuplicates in ../src/popup/duplicates.ts picks the tab with the
	// greatest lastAccessed as the original; ties/absence fall back to
	// iteration order). Unset (undefined) on every other fixture tab.
	lastAccessed? : number;
}

export const RAW_TABS : RawTab[] = [
	// 0: GitHub issue page
	{ title: "Fix login bug · Issue #42 · acme/webapp", url: "https://github.com/acme/webapp/issues/42" },
	// 1: another GitHub issue page (different repo/number, for AND/OR contrast)
	{ title: "Add dark mode support · Issue #7 · acme/mobile-app", url: "https://github.com/acme/mobile-app/issues/7" },
	// 2: YouTube
	{ title: "Rick Astley - Never Gonna Give You Up (Official Video)", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
	// 3: Reddit
	{ title: "TIL octopuses have three hearts : r/todayilearned", url: "https://www.reddit.com/r/todayilearned/comments/abc123/til_octopuses/" },
	// 4: Google search results page
	{ title: "tab manager extension - Google Search", url: "https://www.google.com/search?q=tab+manager+extension" },
	// 5: Gmail (url has a #fragment)
	{ title: "Inbox (42) - Gmail", url: "https://mail.google.com/mail/u/0/#inbox" },
	// 6: localhost dev server with a port
	{ title: "React App", url: "http://localhost:3000/dashboard" },
	// 7: IP address url
	{ title: "Router Admin Login", url: "http://192.168.1.1/index.html" },
	// 8: chrome-style tab with an empty url (e.g. a fresh New Tab page)
	{ title: "New Tab", url: "" },
	// 9: tab with an undefined title
	{ title: undefined, url: "https://example.com/mystery-page" },
	// 10: unicode/emoji title, mixed case
	{ title: "🚀 Ünïcödé Tab MIXED Case ÀÉ", url: "https://example.com/Ünïcödé?x=1" },
	// 11: url with both a query string and a #fragment
	{ title: "API Reference - Widgets", url: "https://docs.example.com/api?version=2&sort=asc#widgets-section" },
	// --- extended fixture below: appended, existing indices above are untouched ---
	// 12: router admin page on the LAN
	{ title: "Router Admin", url: "http://192.168.1.1/" },
	// 13: NAS on the LAN, non-standard port + hash route
	{ title: "Synology DiskStation", url: "http://192.168.1.50:5000/#/dashboard" },
	// 14: printer on a different /24
	{ title: "HP LaserJet - Status", url: "https://192.168.0.7/status.html" },
	// 15: local file, Windows-style path
	{ title: "report.pdf", url: "file:///C:/Users/me/Downloads/report.pdf" },
	// 16: local file, POSIX-style path
	{ title: "todo.txt", url: "file:///home/me/notes/todo.txt" },
	// 17: chrome extension page
	{ title: "Tab Manager Plus", url: "chrome-extension://abcdefghijklmnop/popup.html" },
	// 18: firefox extension page, title has an em dash
	{ title: "uBlock Origin — Dashboard", url: "moz-extension://12345678-90ab-cdef/options.html" },
	// 19: chrome settings page
	{ title: "Settings - Privacy and security", url: "chrome://settings/privacy" },
	// 20: chrome extensions list page
	{ title: "Extensions", url: "chrome://extensions/" },
	// 21: firefox settings page
	{ title: "Settings", url: "about:preferences#privacy" },
	// 22: edge flags page
	{ title: "Experiments", url: "edge://flags/" },
	// 23: "never" without "gonna" (AND vs phrase contrast with tab 2)
	{ title: "Never say never - Motivation blog", url: "https://example.com/never" },
	// 24: "gonna" without "never", title also has an em dash like tab 18
	{ title: "Gonna fix it tomorrow — GitHub Issue #12", url: "https://github.com/x/y/issues/12" },
	// 25: "rick" without "astley"
	{ title: "Rick and Morty S07E01", url: "https://example.com/rick" },
	// --- duplicate-url fixture below: for tests/duplicates.test.ts and the ---
	// --- "duplicate urls" search fixture-sanity test. See DUPLICATE_URL_TABS. ---
	// 26: exact duplicate of T.astley (same title, same url); accessed more
	// recently than T.astley, so findDuplicates picks THIS one as the original
	{ title: "Rick Astley - Never Gonna Give You Up (Official Video)", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", lastAccessed: 5000 },
	// 27: same url as T.loginIssue, identical title; the newest-accessed of the
	// three login-issue tabs, so findDuplicates picks THIS one as the original
	{ title: "Fix login bug · Issue #42 · acme/webapp", url: "https://github.com/acme/webapp/issues/42", lastAccessed: 9000 },
	// 28: same url as T.loginIssue, different title -- a url with THREE tabs
	{ title: "Issue #42 (reloaded)", url: "https://github.com/acme/webapp/issues/42" },
	// 29: another tab with an empty url, same title as T.newTab; no
	// lastAccessed on either of this pair, so T.newTab (first) stays original
	{ title: "New Tab", url: "" },
	// 30: T.astley's url plus a #fragment -- NOT a duplicate (exact url comparison)
	{ title: "Never Gonna Give You Up (bookmarked moment)", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ#t=42" },
	// 31: T.reddit's url minus its trailing slash -- NOT a duplicate
	{ title: "TIL octopuses have three hearts : r/todayilearned", url: "https://www.reddit.com/r/todayilearned/comments/abc123/til_octopuses" },
];

// Names every fixture tab by what it *is*, so assertions can read as intent
// instead of bare indices into RAW_TABS.
export const T = {
	loginIssue: 0,
	darkModeIssue: 1,
	astley: 2,
	reddit: 3,
	googleSearch: 4,
	gmail: 5,
	localhost: 6,
	routerLogin: 7,
	newTab: 8,
	untitled: 9,
	unicode: 10,
	apiDocs: 11,
	router: 12,
	nas: 13,
	printer: 14,
	pdfFile: 15,
	txtFile: 16,
	extensionPage: 17,
	ublock: 18,
	chromeSettings: 19,
	extensionsListPage: 20,
	aboutPrefs: 21,
	edgeFlags: 22,
	neverBlog: 23,
	gonnaIssue: 24,
	rickMorty: 25,
	astleyDup: 26,
	loginIssueDup1: 27,
	loginIssueDup2: 28,
	newTabDup: 29,
	astleyFragment: 30,
	redditSlash: 31,
} as const;

// Groups of T members that recur across assertions in search.test.ts (or that
// the "fixture sanity" tests give independent meaning to). Always sorted
// ascending, since ids() returns indices in ascending order.
export const GITHUB_TABS = [T.loginIssue, T.darkModeIssue, T.gonnaIssue, T.loginIssueDup1, T.loginIssueDup2].sort((a, b) => a - b);
export const LAN_TABS = [T.routerLogin, T.router, T.nas, T.printer].sort((a, b) => a - b);
export const FILE_TABS = [T.pdfFile, T.txtFile].sort((a, b) => a - b);
export const EXTENSION_PAGES = [T.extensionPage, T.ublock].sort((a, b) => a - b);
export const BROWSER_PAGES = [T.chromeSettings, T.extensionsListPage, T.aboutPrefs, T.edgeFlags].sort((a, b) => a - b);
export const SETTINGS_TABS = [T.chromeSettings, T.aboutPrefs].sort((a, b) => a - b);
export const NEVER_GONNA_FAMILY = [T.astley, T.neverBlog, T.gonnaIssue, T.rickMorty, T.astleyDup, T.astleyFragment].sort((a, b) => a - b);
export const TAB_MANAGER_TABS = [T.googleSearch, T.extensionPage].sort((a, b) => a - b);
export const LOGIN_TITLE_TABS = [T.loginIssue, T.routerLogin, T.loginIssueDup1].sort((a, b) => a - b);
export const GITHUB_AND_LOCALHOST_TABS = [...GITHUB_TABS, T.localhost].sort((a, b) => a - b);

// Tabs that share a url with at least one other tab (what findDuplicates in
// ../src/popup/duplicates.ts would flag as either the "original" or a
// "duplicate" for that url). Membership is by url only, regardless of title:
//   - T.astley / T.astleyDup share the astley url (identical title too)
//   - T.loginIssue / T.loginIssueDup1 / T.loginIssueDup2 share the login-issue
//     url (three tabs, titles differ)
//   - T.newTab / T.newTabDup share the empty-string url
// T.astleyFragment (differs by #fragment) and T.redditSlash (differs by a
// trailing slash) are near-misses and are deliberately NOT members: url
// comparison is exact, not normalized.
//
// This group is about url-sharing only, not about which tab findDuplicates()
// treats as the "original" -- that depends on lastAccessed (see the comments
// on tabs 26-29 above and tests/duplicates.test.ts).
export const DUPLICATE_URL_TABS = [
	T.astley, T.astleyDup,
	T.loginIssue, T.loginIssueDup1, T.loginIssueDup2,
	T.newTab, T.newTabDup,
].sort((a, b) => a - b);
