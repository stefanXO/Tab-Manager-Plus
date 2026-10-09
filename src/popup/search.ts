"use strict";

// The search box grammar. Everything is case-insensitive substring unless a
// term says otherwise:
//   foo bar        every term must match (AND), anywhere in title or url
//   foo OR bar     any term matches
//   t:foo          title only            u:foo   url only
//   -foo           must not match        -u:foo  url must not contain
//   s:foo          s: is a scope: what follows applies to tabs of saved
//                  windows only, open tabs never match it. It wraps any term:
//                  s:foo (title or url), s:u:github, s:t:tax, s:"a b", s:/re/
//                  A bare s: is every saved tab, so with other terms behind it
//                  (s: u:github t:tax) the whole search is saved windows only
//   -s:foo         the mirror: -s: is the open-tabs scope. -s:foo, -s:u:x,
//                  -s:t:x, -s:"a b", -s:/re/ match open tabs only, saved tabs
//                  never match. A bare -s: with other terms limits the whole
//                  search to open tabs; a query of only -s: matches every open
//                  tab but selects none (the caller checks scopeOnly)
//                  s: and -s: only exist while the saved windows feature is
//                  on (parseQuery's second argument); off, they are plain text
//   "foo bar"      one term with a space
//   /\(\d+\)/      a term is a regular expression (t:/\(\d+\)/ works too);
//                  an invalid pattern falls back to a plain substring
// Nothing else on purpose: every extra token is something to explain.

import { urlToUnicode } from "./punycode.ts";

export interface SearchTerm {
	field : "any" | "title" | "url";
	// "saved": the term sits behind s:, only a tab of a saved window can match
	// it; "open": behind -s:, only an open tab can; "any": either kind
	scope : "any" | "saved" | "open";
	// a scope with nothing behind it (s: or -s:), no word to look for
	bare? : boolean;
	negate : boolean;
	test : (s : string) => boolean;
	// where the term matches in `s` (original case), as [start, end) pairs
	hits : (s : string) => [number, number][];
}

export interface SearchQuery {
	terms : SearchTerm[];
	// "or": any term matches; "and": all terms match
	mode : "and" | "or";
	// true when the query holds nothing to match against
	empty : boolean;
	// every term is a bare s: or -s: (nothing to look for): the search only
	// picks the kind of tab to show. A bare -s: alone matches every open tab,
	// which must not select them all
	scopeOnly : boolean;
}

// what a tab is matched against, computed once per tab per refresh
export interface Searchable {
	title : string;
	url : string;
	// the url with its host in Unicode, when that differs (an international
	// host is stored as "xn--..."): url terms match either form
	urlUnicode? : string;
	// a tab of a saved window (what s: looks for); absent for an open tab
	saved? : boolean;
}

export function searchable(title : string | undefined, url : string | undefined, saved = false) : Searchable {
	const out : Searchable = { title: (title || "").toLowerCase(), url: (url || "").toLowerCase() };
	const unicode = urlToUnicode(url || "").toLowerCase();
	if (unicode !== out.url) out.urlUnicode = unicode;
	if (saved) out.saved = true;
	return out;
}

// splits on whitespace, keeps "quoted phrases" and /regex bodies/ together.
// `scoped`: s: and -s: are prefixes (saved windows feature on); off, they are
// part of the word
function tokens(query : string, scoped : boolean) : string[] {
	const out : string[] = [];
	const re = scoped
		? /(-?(?:[sS]:)?(?:[tuTU]:)?)(?:"([^"]*)"|\/((?:\\\/|[^\/])+)\/(i?)|(\S+))/g
		: /(-?(?:[tuTU]:)?)(?:"([^"]*)"|\/((?:\\\/|[^\/])+)\/(i?)|(\S+))/g;
	let m : RegExpExecArray | null;
	while ((m = re.exec(query)) !== null) {
		if (m[2] !== undefined) out.push(m[1] + '"' + m[2] + '"');
		else if (m[3] !== undefined) out.push(m[1] + "/" + m[3] + "/" + (m[4] || ""));
		else out.push(m[1] + m[5]);
	}
	return out;
}

function term(token : string, scoped : boolean) : SearchTerm | null {
	let negate = false;
	let field : SearchTerm["field"] = "any";
	let rest = token;
	if (rest.startsWith("-")) { negate = true; rest = rest.slice(1); }
	// prefixes are case-insensitive, T: is as good as t:. s: comes first and
	// wraps the rest: s:u:github is a saved-tabs-only url term. -s: is not a
	// negation but the opposite scope: open tabs only
	let scope : SearchTerm["scope"] = "any";
	if (scoped && rest.slice(0, 2).toLowerCase() === "s:") {
		scope = negate ? "open" : "saved";
		negate = false;
		rest = rest.slice(2);
	}
	const prefix = rest.slice(0, 2).toLowerCase();
	if (prefix === "t:") { field = "title"; rest = rest.slice(2); }
	else if (prefix === "u:") { field = "url"; rest = rest.slice(2); }
	// a bare s: (or s:u: with nothing behind it) is every saved tab, and a bare
	// -s: every open one; the other prefixes need something to look for
	if (rest.length === 0) return scope !== "any" ? { field: "any", scope, bare: true, negate, test: () => true, hits: () => [] } : null;

	let test : SearchTerm["test"];
	let hits : SearchTerm["hits"];
	const rx = /^\/(.+)\/(i?)$/.exec(rest);
	const quoted = /^"(.*)"$/.exec(rest);
	let lit : string;
	if (rx) {
		try {
			const r = new RegExp(rx[1], "i");
			const all = new RegExp(rx[1], "gi");
			test = (s) => r.test(s);
			hits = (s) => {
				const out : [number, number][] = [];
				for (const m of s.matchAll(all)) if (m[0].length > 0) out.push([m.index, m.index + m[0].length]);
				return out;
			};
			return { field, scope, negate, test, hits };
		} catch (e) {
			// not a valid pattern: search for its text as it is
			lit = rx[1].toLowerCase();
		}
	} else {
		lit = (quoted ? quoted[1] : rest).toLowerCase();
		if (lit.length === 0) return null;
	}
	test = (s) => s.indexOf(lit) >= 0;
	hits = (s) => {
		const out : [number, number][] = [];
		const lower = s.toLowerCase();
		// a few characters change length when lowercased (İ): the offsets
		// would be off, so no hits rather than wrong ones
		if (lower.length !== s.length) return out;
		for (let i = lower.indexOf(lit); i >= 0; i = lower.indexOf(lit, i + lit.length)) out.push([i, i + lit.length]);
		return out;
	};
	return { field, scope, negate, test, hits };
}

// `sessionsFeature`: the saved windows feature is on, so s: and -s: are syntax.
// Off, they are plain text: s:foo looks for the text "s:foo"
export function parseQuery(query : string, sessionsFeature = true) : SearchQuery {
	const raw = tokens(query, sessionsFeature);
	// "OR" between terms switches the mode; the word itself is not a term
	const mode : SearchQuery["mode"] = raw.some((t) => t === "OR") ? "or" : "and";
	const terms : SearchTerm[] = [];
	for (const t of raw) {
		if (t === "OR") continue;
		const parsed = term(t, sessionsFeature);
		if (parsed) terms.push(parsed);
	}
	return { terms, mode, empty: terms.length === 0, scopeOnly: terms.length > 0 && terms.every((t) => t.bare === true) };
}

// Which kinds of tab a query can match at all. AND: a term behind s: leaves
// only saved tabs, one behind -s: only open ones (both: none). OR: a kind
// is reachable when some term can match it.
export function queryReach(query : SearchQuery) : { open : boolean, saved : boolean } {
	if (query.empty) return { open: true, saved: true };
	const t = query.terms;
	if (query.mode === "or") return { open: t.some((x) => x.scope !== "saved"), saved: t.some((x) => x.scope !== "open") };
	return { open: !t.some((x) => x.scope === "saved"), saved: !t.some((x) => x.scope === "open") };
}

// matchTab for text the user typed: a query that parsed to no term at all
// (`t:`, `u:`, `-`, `""`, spaces, `OR`) matches nothing, not everything
export function matchTyped(tab : Searchable, query : SearchQuery) : boolean {
	return !query.empty && matchTab(tab, query);
}

// The open tabs a search shows: those of `ids` not in `hidden`, which may
// still hold tabs that closed since
export function shownCount(ids : Iterable<number>, hidden : ReadonlySet<number>) : number {
	let n = 0;
	for (const id of ids) if (!hidden.has(id)) n++;
	return n;
}

export function matchTab(tab : Searchable, query : SearchQuery) : boolean {
	if (query.empty) return true;
	const hit = (t : SearchTerm) : boolean => {
		let found : boolean;
		// open tabs never match behind s:, saved ones never behind -s:
		if (t.scope === "saved" && !tab.saved) found = false;
		else if (t.scope === "open" && tab.saved) found = false;
		else if (t.field === "title") found = t.test(tab.title);
		else if (t.field === "url") found = t.test(tab.url) || (tab.urlUnicode !== undefined && t.test(tab.urlUnicode));
		else found = t.test(tab.title) || t.test(tab.url) || (tab.urlUnicode !== undefined && t.test(tab.urlUnicode));
		return t.negate ? !found : found;
	};
	return query.mode === "or" ? query.terms.some(hit) : query.terms.every(hit);
}

// The parts of a title the search matched, to show in bold: every term that
// looks at the title (not url-only, not excluded), sorted, overlaps merged.
// `saved`: the tab belongs to a saved window, the only kind an s: term matches
// (and the one kind a -s: term never does).
export function titleHits(title : string, query : SearchQuery | null, saved = false) : [number, number][] {
	if (!query || query.empty || !title) return [];
	const all : [number, number][] = [];
	for (const t of query.terms) {
		if (t.negate || t.field === "url" || (t.scope === "saved" && !saved) || (t.scope === "open" && saved)) continue;
		all.push(...t.hits(title));
	}
	all.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	const out : [number, number][] = [];
	for (const [start, end] of all) {
		const last = out[out.length - 1];
		if (last && start <= last[1]) last[1] = Math.max(last[1], end);
		else out.push([start, end]);
	}
	return out;
}
