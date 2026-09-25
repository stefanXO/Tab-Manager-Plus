"use strict";

// Unit tests for the search box grammar documented in src/popup/search.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseQuery, matchTab, searchable } from "../src/popup/search.ts";
import type { Searchable, SearchQuery } from "../src/popup/search.ts";
import {
	RAW_TABS, T,
	GITHUB_TABS, LAN_TABS, FILE_TABS, EXTENSION_PAGES, BROWSER_PAGES, SETTINGS_TABS,
	NEVER_GONNA_FAMILY, TAB_MANAGER_TABS, LOGIN_TITLE_TABS, GITHUB_AND_LOCALHOST_TABS,
	DUPLICATE_URL_TABS,
} from "./fixture.ts";

// ---------------------------------------------------------------------------
// Fixture: RAW_TABS, T and the group constants above live in tests/fixture.ts
// (shared with tests/duplicates.test.ts).
// ---------------------------------------------------------------------------

const TABS : Searchable[] = RAW_TABS.map((t) => searchable(t.title, t.url));

// Returns the indices of the fixture tabs that match `query`.
function ids(query : string) : number[] {
	const parsed = parseQuery(query);
	return TABS.map((_, i) => i).filter((i) => matchTab(TABS[i], parsed));
}

const ALL = TABS.map((_, i) => i);

// Small helpers for the sanity block only: plain string checks on RAW_TABS,
// deliberately independent of parseQuery/matchTab/searchable.
function fixtureTitle(i : number) : string {
	return (RAW_TABS[i].title ?? "").toLowerCase();
}
function fixtureUrl(i : number) : string {
	return (RAW_TABS[i].url ?? "").toLowerCase();
}
function fixtureText(i : number) : string {
	return `${fixtureTitle(i)} ${fixtureUrl(i)}`;
}

// ---------------------------------------------------------------------------
// 0. Fixture sanity: prove the constants above actually describe RAW_TABS,
//    using plain string checks rather than the search grammar under test.
// ---------------------------------------------------------------------------

describe("fixture sanity", () => {
	test("T names every fixture tab exactly once, covering all indices", () => {
		const values = Object.values(T);
		assert.equal(values.length, RAW_TABS.length);
		assert.equal(new Set(values).size, RAW_TABS.length);
		assert.deepEqual([...values].sort((a, b) => a - b), RAW_TABS.map((_, i) => i));
	});

	test("duplicate urls are allowed only for DUPLICATE_URL_TABS", () => {
		// Every url shared by two or more tabs must belong to DUPLICATE_URL_TABS...
		const byUrl = new Map<string, number[]>();
		RAW_TABS.forEach((tab, i) => {
			const url = tab.url ?? "";
			const list = byUrl.get(url);
			if (list) list.push(i); else byUrl.set(url, [i]);
		});
		const sharedIndices : number[] = [];
		for (const list of byUrl.values()) {
			if (list.length >= 2) sharedIndices.push(...list);
		}
		assert.deepEqual(sharedIndices.sort((a, b) => a - b), [...DUPLICATE_URL_TABS].sort((a, b) => a - b));

		// ...and every member of DUPLICATE_URL_TABS shares its url with at least one other tab.
		for (const i of DUPLICATE_URL_TABS) {
			const url = RAW_TABS[i].url ?? "";
			const count = RAW_TABS.filter((t) => (t.url ?? "") === url).length;
			assert.ok(count >= 2, `tab ${i} should share its url with at least one other tab`);
		}
	});

	test("GITHUB_TABS are exactly the tabs mentioning github", () => {
		for (const i of GITHUB_TABS) assert.ok(fixtureText(i).includes("github"), `tab ${i} should mention github`);
		for (const i of ALL.filter((i) => !GITHUB_TABS.includes(i))) {
			assert.ok(!fixtureText(i).includes("github"), `tab ${i} should not mention github`);
		}
	});

	test("LAN_TABS are exactly the tabs on a 192.168.x.x network", () => {
		for (const i of LAN_TABS) assert.ok(fixtureUrl(i).includes("192.168"), `tab ${i} should be on 192.168.x.x`);
		for (const i of ALL.filter((i) => !LAN_TABS.includes(i))) {
			assert.ok(!fixtureUrl(i).includes("192.168"), `tab ${i} should not be on 192.168.x.x`);
		}
	});

	test("FILE_TABS are exactly the local file:// tabs", () => {
		for (const i of FILE_TABS) assert.ok(fixtureUrl(i).startsWith("file:"), `tab ${i} should be a file: url`);
		for (const i of ALL.filter((i) => !FILE_TABS.includes(i))) {
			assert.ok(!fixtureUrl(i).startsWith("file:"), `tab ${i} should not be a file: url`);
		}
	});

	test("EXTENSION_PAGES are exactly the extension-protocol tabs", () => {
		for (const i of EXTENSION_PAGES) assert.ok(fixtureUrl(i).includes("-extension://"), `tab ${i} should be an extension:// url`);
		for (const i of ALL.filter((i) => !EXTENSION_PAGES.includes(i))) {
			assert.ok(!fixtureUrl(i).includes("-extension://"), `tab ${i} should not be an extension:// url`);
		}
	});

	test("BROWSER_PAGES are exactly the chrome/about/edge internal pages", () => {
		for (const i of BROWSER_PAGES) assert.ok(/^(chrome|about|edge):/.test(fixtureUrl(i)), `tab ${i} should be a browser-internal page`);
		for (const i of ALL.filter((i) => !BROWSER_PAGES.includes(i))) {
			assert.ok(!/^(chrome|about|edge):/.test(fixtureUrl(i)), `tab ${i} should not be a browser-internal page`);
		}
	});

	test("SETTINGS_TABS are exactly the settings-titled pages", () => {
		for (const i of SETTINGS_TABS) assert.ok(fixtureTitle(i).includes("settings"), `tab ${i} should be titled settings`);
		for (const i of ALL.filter((i) => !SETTINGS_TABS.includes(i))) {
			assert.ok(!fixtureTitle(i).includes("settings"), `tab ${i} should not be titled settings`);
		}
	});

	test("NEVER_GONNA_FAMILY are exactly the never/gonna/rick contrast tabs", () => {
		for (const i of NEVER_GONNA_FAMILY) assert.ok(/never|gonna|rick/.test(fixtureText(i)), `tab ${i} should mention never/gonna/rick`);
		for (const i of ALL.filter((i) => !NEVER_GONNA_FAMILY.includes(i))) {
			assert.ok(!/never|gonna|rick/.test(fixtureText(i)), `tab ${i} should not mention never/gonna/rick`);
		}
	});

	test("TAB_MANAGER_TABS are exactly the tabs titled with both 'tab' and 'manager'", () => {
		for (const i of TAB_MANAGER_TABS) {
			const title = fixtureTitle(i);
			assert.ok(title.includes("tab") && title.includes("manager"), `tab ${i} should be titled with tab+manager`);
		}
		for (const i of ALL.filter((i) => !TAB_MANAGER_TABS.includes(i))) {
			const title = fixtureTitle(i);
			assert.ok(!(title.includes("tab") && title.includes("manager")), `tab ${i} should not be titled with tab+manager`);
		}
	});

	test("LOGIN_TITLE_TABS are exactly the tabs titled with 'login'", () => {
		for (const i of LOGIN_TITLE_TABS) assert.ok(fixtureTitle(i).includes("login"), `tab ${i} should be titled with login`);
		for (const i of ALL.filter((i) => !LOGIN_TITLE_TABS.includes(i))) {
			assert.ok(!fixtureTitle(i).includes("login"), `tab ${i} should not be titled with login`);
		}
	});

	test("GITHUB_AND_LOCALHOST_TABS are exactly GITHUB_TABS plus the localhost dev server", () => {
		assert.deepEqual(GITHUB_AND_LOCALHOST_TABS, [...GITHUB_TABS, T.localhost].sort((a, b) => a - b));
		for (const i of GITHUB_AND_LOCALHOST_TABS) {
			assert.ok(fixtureText(i).includes("github") || fixtureText(i).includes("localhost"), `tab ${i} should mention github or localhost`);
		}
	});
});

// ---------------------------------------------------------------------------
// 1. Plain substring matching
// ---------------------------------------------------------------------------

describe("plain substring matching", () => {
	test("matches case-insensitively", () => {
		assert.deepEqual(ids("github"), GITHUB_TABS);
		assert.deepEqual(ids("GITHUB"), GITHUB_TABS);
		assert.deepEqual(ids("GitHub"), GITHUB_TABS);
	});

	test("matches inside the title only", () => {
		assert.deepEqual(ids("widgets"), [T.apiDocs]); // only in the title of T.apiDocs
	});

	test("matches inside the url only", () => {
		assert.deepEqual(ids("docs.example"), [T.apiDocs]); // only in the url of T.apiDocs
		assert.deepEqual(ids("192.168"), LAN_TABS);
		assert.deepEqual(ids("mystery"), [T.untitled]);
	});

	test("returns nothing when there is no match", () => {
		assert.deepEqual(ids("zzzznotfound"), []);
	});

	test("matches on a partial word (pure substring semantics)", () => {
		assert.deepEqual(ids("git"), GITHUB_TABS); // substring of "github" (T.gonnaIssue too)
	});

	test("matches url query-string and #fragment content", () => {
		assert.deepEqual(ids("version=2"), [T.apiDocs]);
		assert.deepEqual(ids("widgets-section"), [T.apiDocs]);
		assert.deepEqual(ids("#inbox"), [T.gmail]);
	});
});

// ---------------------------------------------------------------------------
// 2. AND (space-separated terms)
// ---------------------------------------------------------------------------

describe("AND (space-separated terms)", () => {
	test("two terms narrow the result to tabs matching both", () => {
		// T.loginIssueDup1's title is identical to T.loginIssue's, so it also has "bug" and "github".
		assert.deepEqual(ids("bug github"), [T.loginIssue, T.loginIssueDup1].sort((a, b) => a - b));
	});

	test("three terms narrow further", () => {
		// All three login-issue tabs share a title or url containing "acme", "issue" and "42".
		assert.deepEqual(ids("acme issue 42"), [T.loginIssue, T.loginIssueDup1, T.loginIssueDup2].sort((a, b) => a - b));
	});

	test("term order does not affect the AND result", () => {
		assert.deepEqual(ids("acme issue 42"), ids("42 acme issue"));
		assert.deepEqual(ids("bug github"), ids("github bug"));
	});

	test("terms may hit the title and the url separately on the same tab", () => {
		// "bug" only appears in T.loginIssue's title, "github" only in its url
		// (T.loginIssueDup1 shares both, being a title-for-title duplicate).
		assert.deepEqual(ids("bug github"), [T.loginIssue, T.loginIssueDup1].sort((a, b) => a - b));
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
		// Also picks up T.astleyDup/T.astleyFragment (youtube.com urls) and
		// T.redditSlash (a reddit.com url) -- verified by running the code.
		assert.deepEqual(ids("youtube OR reddit"), [T.astley, T.reddit, T.astleyDup, T.astleyFragment, T.redditSlash].sort((a, b) => a - b));
	});

	test("three-way OR", () => {
		assert.deepEqual(ids("youtube OR reddit OR gmail"), [T.astley, T.reddit, T.gmail, T.astleyDup, T.astleyFragment, T.redditSlash].sort((a, b) => a - b));
	});

	test("OR combines with field-prefixed terms", () => {
		// T.gonnaIssue's title also contains "Issue".
		assert.deepEqual(ids("t:issue OR u:localhost"), GITHUB_AND_LOCALHOST_TABS);
	});

	test("a leading bare OR is not itself a term", () => {
		assert.deepEqual(ids("OR youtube"), [T.astley, T.astleyDup, T.astleyFragment].sort((a, b) => a - b));
	});

	test("a trailing bare OR is not itself a term", () => {
		assert.deepEqual(ids("youtube OR"), [T.astley, T.astleyDup, T.astleyFragment].sort((a, b) => a - b));
	});

	test("OR can combine quoted and regex terms", () => {
		// T.gonnaIssue's url ("github.com/x/y/issues/12") also contains "issues".
		assert.deepEqual(ids('"issues" OR /localhost/'), GITHUB_AND_LOCALHOST_TABS);
	});
});

// ---------------------------------------------------------------------------
// 4. Field prefixes (t: / u:)
// ---------------------------------------------------------------------------

describe("field prefixes", () => {
	test("t: restricts matching to the title", () => {
		assert.deepEqual(ids("t:youtube"), []); // "youtube" is only in the url
		assert.deepEqual(ids("t:login"), LOGIN_TITLE_TABS);
	});

	test("u: restricts matching to the url", () => {
		assert.deepEqual(ids("u:youtube"), [T.astley, T.astleyDup, T.astleyFragment].sort((a, b) => a - b));
		assert.deepEqual(ids("u:login"), []); // "login" is only in titles, not urls
	});

	test("a field term that only matches the other field does not match", () => {
		assert.deepEqual(ids("t:youtube"), []);
		assert.deepEqual(ids("u:login"), []);
	});

	test("prefixes are case-insensitive: T: and U: work like t: and u:", () => {
		assert.deepEqual(ids("T:youtube"), ids("t:youtube"));
		assert.deepEqual(ids("U:youtube"), [T.astley, T.astleyDup, T.astleyFragment].sort((a, b) => a - b));
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
		// T.astley and T.astleyDup's titles contain "official" ("...Official Video)").
		assert.deepEqual(ids("-official"), ALL.filter((i) => i !== T.astley && i !== T.astleyDup));
	});

	test("-t: excludes by title only", () => {
		const withLoginTitle = ids("t:login");
		assert.deepEqual(withLoginTitle, LOGIN_TITLE_TABS);
		assert.deepEqual(ids("-t:login"), ALL.filter((i) => !withLoginTitle.includes(i)));
	});

	test("-u: excludes by url only", () => {
		const youtubeTabs = [T.astley, T.astleyDup, T.astleyFragment];
		assert.deepEqual(ids("-u:youtube"), ALL.filter((i) => !youtubeTabs.includes(i)));
	});

	test("negation combined with a positive term (AND)", () => {
		// "issue" alone matches exactly GITHUB_TABS; none mentions "reddit".
		assert.deepEqual(ids("-reddit issue"), GITHUB_TABS);
	});

	test("a negated term is not the same as an empty query: it still excludes matches", () => {
		const negatedOnly = ids("-official");
		assert.notDeepEqual(negatedOnly, ALL);
		assert.ok(!negatedOnly.includes(T.astley));
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
		assert.deepEqual(ids('"never gonna"'), [T.astley, T.astleyDup, T.astleyFragment].sort((a, b) => a - b));
	});

	test("a quoted phrase with a field prefix", () => {
		assert.deepEqual(ids('u:"issues/42"'), [T.loginIssue, T.loginIssueDup1, T.loginIssueDup2].sort((a, b) => a - b));
	});

	test("a negated quoted phrase", () => {
		assert.deepEqual(ids('-"official video"'), ALL.filter((i) => i !== T.astley && i !== T.astleyDup));
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
		// T.loginIssueDup1's title is identical to T.loginIssue's, so it also starts with "fix".
		assert.deepEqual(ids("/^fix/"), [T.loginIssue, T.loginIssueDup1].sort((a, b) => a - b));
	});

	test("character classes and quantifiers", () => {
		// T.router/T.nas/T.printer (192.168.x.x), T.ublock (12345678-90ab-cdef),
		// T.gonnaIssue (Issue #12, issues/12) and T.rickMorty (S07E01) also
		// contain a run of 2+ digits, as do T.loginIssueDup1/T.loginIssueDup2
		// (same "issues/42" url / "#42" title as T.loginIssue), T.astleyFragment
		// ("#t=42") and T.redditSlash ("abc123").
		assert.deepEqual(
			ids("/[0-9]{2,}/"),
			[T.loginIssue, T.reddit, T.gmail, T.localhost, T.routerLogin, T.router, T.nas, T.printer, T.ublock, T.gonnaIssue, T.rickMorty,
				T.loginIssueDup1, T.loginIssueDup2, T.astleyFragment, T.redditSlash].sort((a, b) => a - b),
		);
	});

	test("\\d+ shorthand", () => {
		assert.deepEqual(
			ids("/\\d+/"),
			[T.loginIssue, T.darkModeIssue, T.astley, T.reddit, T.gmail, T.localhost, T.routerLogin, T.unicode, T.apiDocs, T.router, T.nas, T.printer, T.ublock, T.gonnaIssue, T.rickMorty,
				T.astleyDup, T.loginIssueDup1, T.loginIssueDup2, T.astleyFragment, T.redditSlash].sort((a, b) => a - b),
		);
	});

	test("escaped slash inside the pattern matches a literal /", () => {
		// T.redditSlash's url also starts with "reddit.com/r/".
		assert.deepEqual(ids("/reddit.com\\/r\\//"), [T.reddit, T.redditSlash].sort((a, b) => a - b));
	});

	test("u:/.../ combines a field prefix with a regex", () => {
		assert.deepEqual(ids("u:/localhost:\\d+/"), [T.localhost]);
	});

	test("a negated regex", () => {
		// T.loginIssue and T.loginIssueDup1's titles both start with "fix".
		const fixTabs = [T.loginIssue, T.loginIssueDup1];
		assert.deepEqual(ids("-/^fix/"), ALL.filter((i) => !fixTabs.includes(i)));
	});

	test("regex matching is case-insensitive", () => {
		assert.deepEqual(ids("/YOUTUBE/"), [T.astley, T.astleyDup, T.astleyFragment].sort((a, b) => a - b));
		assert.deepEqual(ids("/ÜNÏCÖDÉ/"), [T.unicode]);
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
		// T.extensionPage's title ("Tab Manager Plus") also matches "tab" AND "manager".
		assert.deepEqual(ids("tab   manager"), TAB_MANAGER_TABS);
		assert.deepEqual(ids("tab\t\tmanager"), TAB_MANAGER_TABS);
		assert.deepEqual(ids("tab manager"), TAB_MANAGER_TABS);
	});

	test("a very long query (many repeated terms) still parses and matches correctly", () => {
		const long = Array(50).fill("tab manager").join(" ");
		assert.deepEqual(ids(long), TAB_MANAGER_TABS);
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
		// T.gonnaIssue's url also contains "issues".
		assert.deepEqual(ids('"issues" OR /localhost/'), GITHUB_AND_LOCALHOST_TABS);
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
		assert.deepEqual(ids("mystery"), [T.untitled]);
		assert.deepEqual(ids("t:mystery"), []); // title is empty, so a title-only search fails
	});

	test("unicode and emoji titles match case-insensitively", () => {
		assert.deepEqual(ids("ünïcödé"), [T.unicode]);
		assert.deepEqual(ids("MIXED case"), [T.unicode]);
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
// 10. AND vs phrase, using the never/gonna/rick family (NEVER_GONNA_FAMILY)
// ---------------------------------------------------------------------------
// T.astley is the pre-existing Rick Astley/YouTube tab ("...Never Gonna Give
// You Up..."); T.neverBlog, T.gonnaIssue and T.rickMorty were added
// specifically to contrast AND-of-words against quoted-phrase and negation
// semantics.

describe("AND vs phrase (never/gonna/rick family)", () => {
	test("two bare words (AND, any order) match only the tab containing both", () => {
		// T.astleyDup and T.astleyFragment's titles also contain both words.
		assert.deepEqual(ids("never gonna"), [T.astley, T.astleyDup, T.astleyFragment].sort((a, b) => a - b));
	});

	test('a quoted phrase in the written order matches the same tabs', () => {
		assert.deepEqual(ids('"never gonna"'), [T.astley, T.astleyDup, T.astleyFragment].sort((a, b) => a - b));
	});

	test("a quoted phrase in the wrong word order matches nothing", () => {
		assert.deepEqual(ids('"gonna never"'), []);
	});

	test('"never" without "gonna" isolates the other never-tab', () => {
		assert.deepEqual(ids("never -gonna"), [T.neverBlog]);
	});

	test('"gonna" without "never" isolates the GitHub issue tab', () => {
		assert.deepEqual(ids("gonna -never"), [T.gonnaIssue]);
	});

	test("OR of the two words matches all never/gonna tabs", () => {
		assert.deepEqual(ids("never OR gonna"), [T.astley, T.neverBlog, T.gonnaIssue, T.astleyDup, T.astleyFragment].sort((a, b) => a - b));
	});

	test('"rick" without "astley" isolates the Rick and Morty tab', () => {
		assert.deepEqual(ids("rick -astley"), [T.rickMorty]);
	});

	test("t:rick u:youtube narrows to the Astley tabs (title has rick, url is youtube)", () => {
		// T.astleyDup's title is identical to T.astley's ("Rick Astley..."); T.astleyFragment's
		// title doesn't mention "rick", so it's excluded despite its youtube.com url.
		assert.deepEqual(ids("t:rick u:youtube"), [T.astley, T.astleyDup].sort((a, b) => a - b));
	});

	test("excluding never/gonna/rick leaves everything else (exactly 4 tabs excluded)", () => {
		const result = ids("-never -gonna -rick");
		assert.equal(result.length, ALL.length - NEVER_GONNA_FAMILY.length);
		assert.deepEqual(result, ALL.filter((i) => !NEVER_GONNA_FAMILY.includes(i)));
	});
});

// ---------------------------------------------------------------------------
// 11. IP / local network addresses (LAN_TABS)
// ---------------------------------------------------------------------------
// Note: T.routerLogin (from the original fixture) is also a 192.168.1.1
// router page, so several of these queries hit it in addition to the newly
// added LAN tabs -- verified by running the code, not assumed.

describe("IP / local network addresses", () => {
	test("a bare '192.168' substring matches every LAN tab, including the pre-existing router tab", () => {
		assert.deepEqual(ids("192.168"), LAN_TABS);
	});

	test("u:192.168.1. matches the 192.168.1.x tabs (both router tabs and the NAS), not the 192.168.0.x printer", () => {
		assert.deepEqual(ids("u:192.168.1."), [T.routerLogin, T.router, T.nas]);
	});

	test("192.168.1.1 as a plain substring matches both router tabs, not the .1.50 NAS", () => {
		// "192.168.1.1" is a substring of both T.routerLogin's url
		// ("192.168.1.1/index.html") and T.router's url ("192.168.1.1/"); it is
		// NOT a substring of T.nas's "192.168.1.50...".
		assert.deepEqual(ids("192.168.1.1"), [T.routerLogin, T.router]);
	});

	test("an anchored regex requiring an exact host + trailing slash isolates the new router tab only", () => {
		// T.routerLogin's url has a trailing "/index.html" after the host, so
		// the "$" anchor right after the trailing slash excludes it; only
		// T.router ends exactly at "http://192.168.1.1/".
		assert.deepEqual(ids("u:/^http:\\/\\/192\\.168\\.\\d+\\.\\d+\\/$/"), [T.router]);
	});

	test("a regex for a 4-digit port followed by a slash matches the NAS and the localhost dev server", () => {
		// T.localhost ("http://localhost:3000/dashboard") and T.nas
		// ("http://192.168.1.50:5000/#/dashboard") both have :NNNN/.
		assert.deepEqual(ids("u:/:\\d{4}\\//"), [T.localhost, T.nas]);
	});

	test("-u:192.168 excludes every 192.168.x.x tab, including the pre-existing router one", () => {
		const result = ids("-u:192.168");
		assert.ok(!LAN_TABS.some((i) => result.includes(i)));
		assert.equal(result.length, ALL.length - LAN_TABS.length);
	});
});

// ---------------------------------------------------------------------------
// 12. file:// tabs (FILE_TABS)
// ---------------------------------------------------------------------------

describe("file:// tabs", () => {
	test("u:file: matches both local-file tabs", () => {
		assert.deepEqual(ids("u:file:"), FILE_TABS);
	});

	test("u:file:///c: matches the Windows-style path case-insensitively", () => {
		assert.deepEqual(ids("u:file:///c:"), [T.pdfFile]);
	});

	test(".pdf matches the report tab through both its title and its url", () => {
		assert.deepEqual(ids(".pdf"), [T.pdfFile]);
		assert.deepEqual(ids("t:.pdf"), [T.pdfFile]);
		assert.deepEqual(ids("u:.pdf"), [T.pdfFile]);
	});

	test("t:todo matches only the todo.txt tab's title", () => {
		assert.deepEqual(ids("t:todo"), [T.txtFile]);
	});

	test("a regex anchored to file:///home matches only the POSIX-style path", () => {
		assert.deepEqual(ids("u:/^file:\\/\\/\\/home/"), [T.txtFile]);
	});
});

// ---------------------------------------------------------------------------
// 13. Extension and browser-internal pages (EXTENSION_PAGES, BROWSER_PAGES)
// ---------------------------------------------------------------------------

describe("extension and browser pages", () => {
	test("u:chrome-extension matches only the chrome extension tab", () => {
		assert.deepEqual(ids("u:chrome-extension"), [T.extensionPage]);
	});

	test("u:moz-extension matches only the firefox extension tab", () => {
		assert.deepEqual(ids("u:moz-extension"), [T.ublock]);
	});

	test("a bare 'extension' substring also picks up unrelated title/url hits", () => {
		// Matches T.extensionPage and T.ublock (EXTENSION_PAGES) and the
		// "Extensions" browser page (T.extensionsListPage) as expected, but
		// ALSO T.googleSearch ("tab manager extension - Google Search") since
		// its title contains the word "extension" too -- verified by running
		// the code, not assumed.
		assert.deepEqual(ids("extension"), [T.googleSearch, T.extensionPage, T.ublock, T.extensionsListPage]);
	});

	test("u:chrome:// matches the chrome-internal pages but not chrome-extension:// urls", () => {
		assert.deepEqual(ids("u:chrome://"), [T.chromeSettings, T.extensionsListPage]);
	});

	test("u:about: matches only the firefox about: page", () => {
		assert.deepEqual(ids("u:about:"), [T.aboutPrefs]);
	});

	test("u:edge:// matches only the edge flags page", () => {
		assert.deepEqual(ids("u:edge://"), [T.edgeFlags]);
	});

	test("t:settings matches both settings-titled pages", () => {
		assert.deepEqual(ids("t:settings"), SETTINGS_TABS);
	});

	test("settings -u:chrome excludes the chrome settings page, leaving the about: one", () => {
		assert.deepEqual(ids("settings -u:chrome"), [T.aboutPrefs]);
	});

	test("a regex alternation over the scheme matches all four browser-internal pages", () => {
		assert.deepEqual(ids("u:/^(chrome|edge|about):/"), BROWSER_PAGES);
	});

	test("'dashboard' matches the NAS and uBlock tabs, plus the pre-existing localhost dev server url", () => {
		// T.localhost's url ("http://localhost:3000/dashboard") also contains
		// "dashboard" -- verified by running the code, not assumed.
		assert.deepEqual(ids("dashboard"), [T.localhost, T.nas, T.ublock]);
	});

	test('"tab manager" phrase matches the Google search result and the extension tab', () => {
		assert.deepEqual(ids('"tab manager"'), TAB_MANAGER_TABS);
	});
});

// ---------------------------------------------------------------------------
// 14. Unicode (em dash in T.ublock's title)
// ---------------------------------------------------------------------------

describe("unicode: em dash in title", () => {
	test("u:origin does not match, because 'origin' only appears in the title, not the url", () => {
		assert.deepEqual(ids("u:origin"), []);
	});

	test('t:"ublock origin" matches the title as a phrase', () => {
		assert.deepEqual(ids('t:"ublock origin"'), [T.ublock]);
	});

	test("t:— (em dash) matches every title containing that character", () => {
		// T.gonnaIssue's title ("Gonna fix it tomorrow — GitHub Issue #12") also
		// uses an em dash, so it matches too, alongside T.ublock.
		assert.deepEqual(ids("t:—"), [T.ublock, T.gonnaIssue]);
	});
});
