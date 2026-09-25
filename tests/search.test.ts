"use strict";

// Unit tests for the search box grammar documented in src/popup/search.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseQuery, matchTab, searchable } from "../src/popup/search.ts";
import type { Searchable, SearchQuery } from "../src/popup/search.ts";

// ---------------------------------------------------------------------------
// Fixture: ~10 realistic tabs covering titles/urls of different shapes.
// ---------------------------------------------------------------------------

interface RawTab {
	title : string | undefined;
	url : string | undefined;
}

const RAW_TABS : RawTab[] = [
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
];

const TABS : Searchable[] = RAW_TABS.map((t) => searchable(t.title, t.url));

// Returns the indices of the fixture tabs that match `query`.
function ids(query : string) : number[] {
	const parsed = parseQuery(query);
	return TABS.map((_, i) => i).filter((i) => matchTab(TABS[i], parsed));
}

const ALL = TABS.map((_, i) => i);

// ---------------------------------------------------------------------------
// 1. Plain substring matching
// ---------------------------------------------------------------------------

describe("plain substring matching", () => {
	test("matches case-insensitively", () => {
		// Tab 24 ("Gonna fix it tomorrow — GitHub Issue #12", github.com url)
		// also contains "github" in both title and url.
		assert.deepEqual(ids("github"), [0, 1, 24]);
		assert.deepEqual(ids("GITHUB"), [0, 1, 24]);
		assert.deepEqual(ids("GitHub"), [0, 1, 24]);
	});

	test("matches inside the title only", () => {
		assert.deepEqual(ids("widgets"), [11]); // only in the title of tab 11
	});

	test("matches inside the url only", () => {
		assert.deepEqual(ids("docs.example"), [11]); // only in the url of tab 11
		// Tabs 12-14 (router/NAS/printer) are also on a 192.168.x.x network.
		assert.deepEqual(ids("192.168"), [7, 12, 13, 14]);
		assert.deepEqual(ids("mystery"), [9]);
	});

	test("returns nothing when there is no match", () => {
		assert.deepEqual(ids("zzzznotfound"), []);
	});

	test("matches on a partial word (pure substring semantics)", () => {
		assert.deepEqual(ids("git"), [0, 1, 24]); // substring of "github" (tab 24 too)
	});

	test("matches url query-string and #fragment content", () => {
		assert.deepEqual(ids("version=2"), [11]);
		assert.deepEqual(ids("widgets-section"), [11]);
		assert.deepEqual(ids("#inbox"), [5]);
	});
});

// ---------------------------------------------------------------------------
// 2. AND (space-separated terms)
// ---------------------------------------------------------------------------

describe("AND (space-separated terms)", () => {
	test("two terms narrow the result to tabs matching both", () => {
		assert.deepEqual(ids("bug github"), [0]);
	});

	test("three terms narrow further", () => {
		assert.deepEqual(ids("acme issue 42"), [0]);
	});

	test("term order does not affect the AND result", () => {
		assert.deepEqual(ids("acme issue 42"), ids("42 acme issue"));
		assert.deepEqual(ids("bug github"), ids("github bug"));
	});

	test("terms may hit the title and the url separately on the same tab", () => {
		// "bug" only appears in tab 0's title, "github" only in tab 0's url.
		assert.deepEqual(ids("bug github"), [0]);
	});

	test("AND requires every term, so an unmatched extra term empties the result", () => {
		assert.deepEqual(ids("acme issue 999"), []);
	});
});

// ---------------------------------------------------------------------------
// 3. OR
// ---------------------------------------------------------------------------

describe("OR", () => {
	test("a OR b matches either term", () => {
		assert.deepEqual(ids("youtube OR reddit"), [2, 3]);
	});

	test("three-way OR", () => {
		assert.deepEqual(ids("youtube OR reddit OR gmail"), [2, 3, 5]);
	});

	test("OR combines with field-prefixed terms", () => {
		// Tab 24's title also contains "Issue".
		assert.deepEqual(ids("t:issue OR u:localhost"), [0, 1, 6, 24]);
	});

	test("a leading bare OR is not itself a term", () => {
		assert.deepEqual(ids("OR youtube"), [2]);
	});

	test("a trailing bare OR is not itself a term", () => {
		assert.deepEqual(ids("youtube OR"), [2]);
	});

	test("OR can combine quoted and regex terms", () => {
		// Tab 24's url ("github.com/x/y/issues/12") also contains "issues".
		assert.deepEqual(ids('"issues" OR /localhost/'), [0, 1, 6, 24]);
	});
});

// ---------------------------------------------------------------------------
// 4. Field prefixes (t: / u:)
// ---------------------------------------------------------------------------

describe("field prefixes", () => {
	test("t: restricts matching to the title", () => {
		assert.deepEqual(ids("t:youtube"), []); // "youtube" is only in the url
		assert.deepEqual(ids("t:login"), [0, 7]);
	});

	test("u: restricts matching to the url", () => {
		assert.deepEqual(ids("u:youtube"), [2]);
		assert.deepEqual(ids("u:login"), []); // "login" is only in titles, not urls
	});

	test("a field term that only matches the other field does not match", () => {
		assert.deepEqual(ids("t:youtube"), []);
		assert.deepEqual(ids("u:login"), []);
	});

	test("prefixes are case-insensitive: T: and U: work like t: and u:", () => {
		assert.deepEqual(ids("T:youtube"), ids("t:youtube"));
		assert.deepEqual(ids("U:youtube"), [2]);
		assert.equal(parseQuery("T:youtube").terms[0]?.field, "title");
		assert.equal(parseQuery("-U:youtube").terms[0]?.field, "url");
		assert.equal(parseQuery("-U:youtube").terms[0]?.negate, true);
	});
});

// ---------------------------------------------------------------------------
// 5. Negation
// ---------------------------------------------------------------------------

describe("negation", () => {
	test("-word excludes tabs containing word", () => {
		// Only tab 2's title contains "official" ("...Official Video)").
		assert.deepEqual(ids("-official"), ALL.filter((i) => i !== 2));
	});

	test("-t: excludes by title only", () => {
		const withLoginTitle = ids("t:login");
		assert.deepEqual(withLoginTitle, [0, 7]);
		assert.deepEqual(ids("-t:login"), ALL.filter((i) => !withLoginTitle.includes(i)));
	});

	test("-u: excludes by url only", () => {
		assert.deepEqual(ids("-u:youtube"), ALL.filter((i) => i !== 2));
	});

	test("negation combined with a positive term (AND)", () => {
		// "issue" alone matches tabs 0, 1 and 24; none mentions "reddit".
		assert.deepEqual(ids("-reddit issue"), [0, 1, 24]);
	});

	test("a negated term is not the same as an empty query: it still excludes matches", () => {
		const negatedOnly = ids("-official");
		assert.notDeepEqual(negatedOnly, ALL);
		assert.ok(!negatedOnly.includes(2));
	});

	test("'-' alone is not a term: the query is empty and matches everything", () => {
		assert.deepEqual(ids("-"), ALL);
		assert.equal(parseQuery("-").empty, true);
		assert.equal(parseQuery("-").terms.length, 0);
	});

	test("'-t:' alone is not a term: the query is empty and matches everything", () => {
		assert.deepEqual(ids("-t:"), ALL);
		assert.equal(parseQuery("-t:").empty, true);
	});

	test("'-u:' alone is not a term: the query is empty and matches everything", () => {
		assert.deepEqual(ids("-u:"), ALL);
		assert.equal(parseQuery("-u:").empty, true);
	});
});

// ---------------------------------------------------------------------------
// 6. Quoted phrases
// ---------------------------------------------------------------------------

describe("quoted phrases", () => {
	test("a quoted phrase with a space is one term", () => {
		assert.deepEqual(ids('"never gonna"'), [2]);
	});

	test("a quoted phrase with a field prefix", () => {
		assert.deepEqual(ids('u:"issues/42"'), [0]);
	});

	test("a negated quoted phrase", () => {
		assert.deepEqual(ids('-"official video"'), ALL.filter((i) => i !== 2));
	});

	test('empty quotes "" are not a term: the query is empty', () => {
		assert.deepEqual(ids('""'), ALL);
		assert.equal(parseQuery('""').empty, true);
		assert.deepEqual(ids('"" "" ""'), ALL);
	});

	test("an unterminated quote is treated as a literal, including the quote character", () => {
		// No fixture title/url contains an actual `"` character, so this
		// literal (which includes the leading quote) matches nothing here --
		// which itself demonstrates that the quote char is part of the literal
		// rather than being stripped.
		assert.deepEqual(ids('"github'), []);
		const q = parseQuery('"github');
		assert.equal(q.terms.length, 1);
		assert.equal(q.terms[0].test('say "github now'), true);
		assert.equal(q.terms[0].test("github without a quote"), false);
	});
});

// ---------------------------------------------------------------------------
// 7. Regular expressions
// ---------------------------------------------------------------------------

describe("regular expressions", () => {
	test("anchors", () => {
		assert.deepEqual(ids("/^fix/"), [0]); // only tab 0's title starts with "fix"
	});

	test("character classes and quantifiers", () => {
		// Tabs 12-14 (192.168.x.x), 18 (12345678-90ab-cdef), 24 (Issue #12,
		// issues/12) and 25 (S07E01) also contain a run of 2+ digits.
		assert.deepEqual(ids("/[0-9]{2,}/"), [0, 3, 5, 6, 7, 12, 13, 14, 18, 24, 25]);
	});

	test("\\d+ shorthand", () => {
		assert.deepEqual(ids("/\\d+/"), [0, 1, 2, 3, 5, 6, 7, 10, 11, 12, 13, 14, 18, 24, 25]);
	});

	test("escaped slash inside the pattern matches a literal /", () => {
		assert.deepEqual(ids("/reddit.com\\/r\\//"), [3]);
	});

	test("u:/.../ combines a field prefix with a regex", () => {
		assert.deepEqual(ids("u:/localhost:\\d+/"), [6]);
	});

	test("a negated regex", () => {
		// Only tab 0's title starts with "fix".
		assert.deepEqual(ids("-/^fix/"), ALL.filter((i) => i !== 0));
	});

	test("regex matching is case-insensitive", () => {
		assert.deepEqual(ids("/YOUTUBE/"), [2]);
		assert.deepEqual(ids("/ÜNÏCÖDÉ/"), [10]);
	});

	test("an invalid pattern does not throw and falls back to a literal search for the pattern body", () => {
		assert.doesNotThrow(() => parseQuery("/[/"));
		const q = parseQuery("/[/");
		assert.equal(q.terms.length, 1);
		// the body "[" is searched as plain text, slashes not included
		assert.equal(q.terms[0].test("issue [wip]"), true);
		assert.equal(q.terms[0].test("weird /[/ marker"), true);
		assert.equal(q.terms[0].test("no brackets here"), false);
		// case-insensitive like every other literal
		assert.equal(parseQuery("/A(/").terms[0].test("issue a(b)"), true);
	});
});

// ---------------------------------------------------------------------------
// 8. Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
	test("empty string query matches everything", () => {
		assert.deepEqual(ids(""), ALL);
	});

	test("whitespace-only query matches everything", () => {
		assert.deepEqual(ids("   "), ALL);
		assert.deepEqual(ids("\t  \t"), ALL);
	});

	test("tabs and multiple spaces between terms are equivalent to single spaces", () => {
		// Tab 17's title ("Tab Manager Plus") also matches "tab" AND "manager".
		assert.deepEqual(ids("tab   manager"), [4, 17]);
		assert.deepEqual(ids("tab\t\tmanager"), [4, 17]);
		assert.deepEqual(ids("tab manager"), [4, 17]);
	});

	test("a very long query (many repeated terms) still parses and matches correctly", () => {
		const long = Array(50).fill("tab manager").join(" ");
		assert.deepEqual(ids(long), [4, 17]);
	});

	test("a query that is only 'OR' matches everything (mode becomes 'or' but there are no terms)", () => {
		assert.deepEqual(ids("OR"), ALL);
		const q = parseQuery("OR");
		assert.equal(q.mode, "or");
		assert.equal(q.terms.length, 0);
		assert.equal(q.empty, true);
	});

	test("'OR OR' also matches everything", () => {
		assert.deepEqual(ids("OR OR"), ALL);
		assert.equal(parseQuery("OR OR").terms.length, 0);
	});

	test("mixing a quoted phrase and a regex in one query", () => {
		// Tab 24's url also contains "issues".
		assert.deepEqual(ids('"issues" OR /localhost/'), [0, 1, 6, 24]);
		assert.deepEqual(ids('"issues" /localhost/'), []); // AND: no tab has both
	});

	test("searchable(undefined, undefined) gives empty strings and matches only empty queries", () => {
		const blank = searchable(undefined, undefined);
		assert.deepEqual(blank, { title: "", url: "" });
		assert.equal(matchTab(blank, parseQuery("")), true);
		assert.equal(matchTab(blank, parseQuery("   ")), true);
		assert.equal(matchTab(blank, parseQuery("anything")), false);
		assert.equal(matchTab(blank, parseQuery("-anything")), true); // negated term, nothing to find -> matches
	});

	test("a tab with an undefined title only matches through its url", () => {
		assert.deepEqual(ids("mystery"), [9]);
		assert.deepEqual(ids("t:mystery"), []); // title is empty, so a title-only search fails
	});

	test("unicode and emoji titles match case-insensitively", () => {
		assert.deepEqual(ids("ünïcödé"), [10]);
		assert.deepEqual(ids("MIXED case"), [10]);
	});
});

// ---------------------------------------------------------------------------
// 9. parseQuery structure
// ---------------------------------------------------------------------------

describe("parseQuery structure", () => {
	test("mode is 'and' by default", () => {
		assert.equal(parseQuery("foo bar").mode, "and");
	});

	test("mode is 'or' when OR appears between terms", () => {
		assert.equal(parseQuery("foo OR bar").mode, "or");
	});

	test("empty is true only when there are no terms", () => {
		assert.equal(parseQuery("").empty, true);
		assert.equal(parseQuery("foo").empty, false);
		assert.equal(parseQuery("OR").empty, true);
	});

	test("terms.length matches the number of real terms parsed", () => {
		assert.equal(parseQuery("foo bar baz").terms.length, 3);
		assert.equal(parseQuery("foo OR bar").terms.length, 2);
		assert.equal(parseQuery("OR").terms.length, 0);
		assert.equal(parseQuery('"" foo').terms.length, 1);
	});

	test("each term records its field and negate flags", () => {
		const q : SearchQuery = parseQuery("t:foo OR -u:bar");
		assert.equal(q.terms.length, 2);
		assert.equal(q.terms[0].field, "title");
		assert.equal(q.terms[0].negate, false);
		assert.equal(q.terms[1].field, "url");
		assert.equal(q.terms[1].negate, true);
	});

	test("a plain term has field 'any' and negate false", () => {
		const q = parseQuery("foo bar");
		for (const t of q.terms) {
			assert.equal(t.field, "any");
			assert.equal(t.negate, false);
		}
	});

	test("a regex term's field/negate flags are independent of its pattern", () => {
		const q = parseQuery("-t:/^fix/");
		assert.equal(q.terms.length, 1);
		assert.equal(q.terms[0].field, "title");
		assert.equal(q.terms[0].negate, true);
	});
});

// ---------------------------------------------------------------------------
// 10. AND vs phrase, using the "never gonna"/"rick" family (tabs 2, 23-25)
// ---------------------------------------------------------------------------
// Tab 2 is the pre-existing Rick Astley/YouTube tab ("...Never Gonna Give You
// Up..."); tabs 23-25 were added specifically to contrast AND-of-words against
// quoted-phrase and negation semantics.

describe("AND vs phrase (never/gonna/rick family)", () => {
	test("two bare words (AND, any order) match only the tab containing both", () => {
		assert.deepEqual(ids("never gonna"), [2]);
	});

	test('a quoted phrase in the written order matches the same tab', () => {
		assert.deepEqual(ids('"never gonna"'), [2]);
	});

	test("a quoted phrase in the wrong word order matches nothing", () => {
		assert.deepEqual(ids('"gonna never"'), []);
	});

	test('"never" without "gonna" isolates the other never-tab', () => {
		assert.deepEqual(ids("never -gonna"), [23]);
	});

	test('"gonna" without "never" isolates the GitHub issue tab', () => {
		assert.deepEqual(ids("gonna -never"), [24]);
	});

	test("OR of the two words matches all three never/gonna tabs", () => {
		assert.deepEqual(ids("never OR gonna"), [2, 23, 24]);
	});

	test('"rick" without "astley" isolates the Rick and Morty tab', () => {
		assert.deepEqual(ids("rick -astley"), [25]);
	});

	test("t:rick u:youtube narrows to the Astley tab (title has rick, url is youtube)", () => {
		assert.deepEqual(ids("t:rick u:youtube"), [2]);
	});

	test("excluding never/gonna/rick leaves everything else (exactly 4 tabs excluded)", () => {
		const result = ids("-never -gonna -rick");
		assert.equal(result.length, ALL.length - 4);
		assert.deepEqual(result, ALL.filter((i) => ![2, 23, 24, 25].includes(i)));
	});
});

// ---------------------------------------------------------------------------
// 11. IP / local network addresses (tabs 7, 12-14)
// ---------------------------------------------------------------------------
// Note: tab 7 (from the original fixture) is also a 192.168.1.1 router page,
// so several of these queries hit it in addition to the newly added tabs --
// verified by running the code, not assumed.

describe("IP / local network addresses", () => {
	test("a bare '192.168' substring matches every LAN tab, including the pre-existing router tab", () => {
		assert.deepEqual(ids("192.168"), [7, 12, 13, 14]);
	});

	test("u:192.168.1. matches the 192.168.1.x tabs (both router tabs and the NAS), not the 192.168.0.x printer", () => {
		assert.deepEqual(ids("u:192.168.1."), [7, 12, 13]);
	});

	test("192.168.1.1 as a plain substring matches both router tabs, not the .1.50 NAS", () => {
		// "192.168.1.1" is a substring of both "192.168.1.1/index.html" (tab 7)
		// and "192.168.1.1/" (tab 12); it is NOT a substring of "192.168.1.50...".
		assert.deepEqual(ids("192.168.1.1"), [7, 12]);
	});

	test("an anchored regex requiring an exact host + trailing slash isolates the new router tab only", () => {
		// tab 7's url has a trailing "/index.html" after the host, so the "$"
		// anchor right after the trailing slash excludes it; only tab 12 ends
		// exactly at "http://192.168.1.1/".
		assert.deepEqual(ids("u:/^http:\\/\\/192\\.168\\.\\d+\\.\\d+\\/$/"), [12]);
	});

	test("a regex for a 4-digit port followed by a slash matches the NAS and the localhost dev server", () => {
		// tab 6 ("http://localhost:3000/dashboard") and tab 13
		// ("http://192.168.1.50:5000/#/dashboard") both have :NNNN/.
		assert.deepEqual(ids("u:/:\\d{4}\\//"), [6, 13]);
	});

	test("-u:192.168 excludes every 192.168.x.x tab, including the pre-existing router one", () => {
		const result = ids("-u:192.168");
		assert.ok(![7, 12, 13, 14].some((i) => result.includes(i)));
		assert.equal(result.length, ALL.length - 4);
	});
});

// ---------------------------------------------------------------------------
// 12. file:// tabs (tabs 15-16)
// ---------------------------------------------------------------------------

describe("file:// tabs", () => {
	test("u:file: matches both local-file tabs", () => {
		assert.deepEqual(ids("u:file:"), [15, 16]);
	});

	test("u:file:///c: matches the Windows-style path case-insensitively", () => {
		assert.deepEqual(ids("u:file:///c:"), [15]);
	});

	test(".pdf matches the report tab through both its title and its url", () => {
		assert.deepEqual(ids(".pdf"), [15]);
		assert.deepEqual(ids("t:.pdf"), [15]);
		assert.deepEqual(ids("u:.pdf"), [15]);
	});

	test("t:todo matches only the todo.txt tab's title", () => {
		assert.deepEqual(ids("t:todo"), [16]);
	});

	test("a regex anchored to file:///home matches only the POSIX-style path", () => {
		assert.deepEqual(ids("u:/^file:\\/\\/\\/home/"), [16]);
	});
});

// ---------------------------------------------------------------------------
// 13. Extension and browser-internal pages (tabs 17-22)
// ---------------------------------------------------------------------------

describe("extension and browser pages", () => {
	test("u:chrome-extension matches only the chrome extension tab", () => {
		assert.deepEqual(ids("u:chrome-extension"), [17]);
	});

	test("u:moz-extension matches only the firefox extension tab", () => {
		assert.deepEqual(ids("u:moz-extension"), [18]);
	});

	test("a bare 'extension' substring also picks up unrelated title/url hits", () => {
		// Matches the chrome/moz extension tabs (17, 18) and the "Extensions"
		// browser page (20) as expected, but ALSO the pre-existing "tab manager
		// extension - Google Search" tab (4) since its title contains the word
		// "extension" too -- verified by running the code, not assumed.
		assert.deepEqual(ids("extension"), [4, 17, 18, 20]);
	});

	test("u:chrome:// matches the chrome-internal pages but not chrome-extension:// urls", () => {
		assert.deepEqual(ids("u:chrome://"), [19, 20]);
	});

	test("u:about: matches only the firefox about: page", () => {
		assert.deepEqual(ids("u:about:"), [21]);
	});

	test("u:edge:// matches only the edge flags page", () => {
		assert.deepEqual(ids("u:edge://"), [22]);
	});

	test("t:settings matches both settings-titled pages", () => {
		assert.deepEqual(ids("t:settings"), [19, 21]);
	});

	test("settings -u:chrome excludes the chrome settings page, leaving the about: one", () => {
		assert.deepEqual(ids("settings -u:chrome"), [21]);
	});

	test("a regex alternation over the scheme matches all four browser-internal pages", () => {
		assert.deepEqual(ids("u:/^(chrome|edge|about):/"), [19, 20, 21, 22]);
	});

	test("'dashboard' matches the NAS and uBlock tabs, plus the pre-existing localhost dev server url", () => {
		// tab 6's url ("http://localhost:3000/dashboard") also contains
		// "dashboard" -- verified by running the code, not assumed.
		assert.deepEqual(ids("dashboard"), [6, 13, 18]);
	});

	test('"tab manager" phrase matches the Google search result and the extension tab', () => {
		assert.deepEqual(ids('"tab manager"'), [4, 17]);
	});
});

// ---------------------------------------------------------------------------
// 14. Unicode (em dash in tab 18's title)
// ---------------------------------------------------------------------------

describe("unicode: em dash in title", () => {
	test("u:origin does not match, because 'origin' only appears in the title, not the url", () => {
		assert.deepEqual(ids("u:origin"), []);
	});

	test('t:"ublock origin" matches the title as a phrase', () => {
		assert.deepEqual(ids('t:"ublock origin"'), [18]);
	});

	test("t:— (em dash) matches every title containing that character", () => {
		// Tab 24's title ("Gonna fix it tomorrow — GitHub Issue #12") also uses
		// an em dash, so it matches too, alongside tab 18.
		assert.deepEqual(ids("t:—"), [18, 24]);
	});
});
