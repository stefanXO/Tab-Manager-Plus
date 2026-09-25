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
		assert.deepEqual(ids("github"), [0, 1]);
		assert.deepEqual(ids("GITHUB"), [0, 1]);
		assert.deepEqual(ids("GitHub"), [0, 1]);
	});

	test("matches inside the title only", () => {
		assert.deepEqual(ids("widgets"), [11]); // only in the title of tab 11
	});

	test("matches inside the url only", () => {
		assert.deepEqual(ids("docs.example"), [11]); // only in the url of tab 11
		assert.deepEqual(ids("192.168"), [7]);
		assert.deepEqual(ids("mystery"), [9]);
	});

	test("returns nothing when there is no match", () => {
		assert.deepEqual(ids("zzzznotfound"), []);
	});

	test("matches on a partial word (pure substring semantics)", () => {
		assert.deepEqual(ids("git"), [0, 1]); // substring of "github"
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
		assert.deepEqual(ids("t:issue OR u:localhost"), [0, 1, 6]);
	});

	test("a leading bare OR is not itself a term", () => {
		assert.deepEqual(ids("OR youtube"), [2]);
	});

	test("a trailing bare OR is not itself a term", () => {
		assert.deepEqual(ids("youtube OR"), [2]);
	});

	test("OR can combine quoted and regex terms", () => {
		assert.deepEqual(ids('"issues" OR /localhost/'), [0, 1, 6]);
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
		assert.deepEqual(ids("-official"), [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
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
		// "issue" alone matches tabs 0 and 1; neither mentions "reddit".
		assert.deepEqual(ids("-reddit issue"), [0, 1]);
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
		assert.deepEqual(ids('-"official video"'), [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
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
		assert.deepEqual(ids("/[0-9]{2,}/"), [0, 3, 5, 6, 7]);
	});

	test("\\d+ shorthand", () => {
		assert.deepEqual(ids("/\\d+/"), [0, 1, 2, 3, 5, 6, 7, 10, 11]);
	});

	test("escaped slash inside the pattern matches a literal /", () => {
		assert.deepEqual(ids("/reddit.com\\/r\\//"), [3]);
	});

	test("u:/.../ combines a field prefix with a regex", () => {
		assert.deepEqual(ids("u:/localhost:\\d+/"), [6]);
	});

	test("a negated regex", () => {
		assert.deepEqual(ids("-/^fix/"), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
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
		assert.deepEqual(ids("tab   manager"), [4]);
		assert.deepEqual(ids("tab\t\tmanager"), [4]);
		assert.deepEqual(ids("tab manager"), [4]);
	});

	test("a very long query (many repeated terms) still parses and matches correctly", () => {
		const long = Array(50).fill("tab manager").join(" ");
		assert.deepEqual(ids(long), [4]);
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
		assert.deepEqual(ids('"issues" OR /localhost/'), [0, 1, 6]);
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
