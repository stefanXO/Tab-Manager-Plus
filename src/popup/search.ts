"use strict";

// The search box grammar. Everything is case-insensitive substring unless a
// term says otherwise:
//   foo bar        every term must match (AND), anywhere in title or url
//   foo OR bar     any term matches
//   t:foo          title only            u:foo   url only
//   -foo           must not match        -u:foo  url must not contain
//   s:foo          saved windows only: matches only tabs of saved windows
//                  (title or url), open tabs never match it; a bare s: is
//                  every saved tab, so it shows the saved windows alone;
//                  -s:foo leaves out saved tabs that match, -s: all saved tabs
//   "foo bar"      one term with a space
//   /\(\d+\)/      a term is a regular expression (t:/\(\d+\)/ works too);
//                  an invalid pattern falls back to a plain substring
// Nothing else on purpose: every extra token is something to explain.

export interface SearchTerm {
	field : "any" | "title" | "url" | "saved";
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
}

// what a tab is matched against, computed once per tab per refresh
export interface Searchable {
	title : string;
	url : string;
	// a tab of a saved window (what s: looks for); absent for an open tab
	saved? : boolean;
}

export function searchable(title : string | undefined, url : string | undefined, saved = false) : Searchable {
	const out : Searchable = { title: (title || "").toLowerCase(), url: (url || "").toLowerCase() };
	if (saved) out.saved = true;
	return out;
}

// splits on whitespace, keeps "quoted phrases" and /regex bodies/ together
function tokens(query : string) : string[] {
	const out : string[] = [];
	const re = /(-?(?:[tusTUS]:)?)(?:"([^"]*)"|\/((?:\\\/|[^\/])+)\/(i?)|(\S+))/g;
	let m : RegExpExecArray | null;
	while ((m = re.exec(query)) !== null) {
		if (m[2] !== undefined) out.push(m[1] + '"' + m[2] + '"');
		else if (m[3] !== undefined) out.push(m[1] + "/" + m[3] + "/" + (m[4] || ""));
		else out.push(m[1] + m[5]);
	}
	return out;
}

function term(token : string) : SearchTerm | null {
	let negate = false;
	let field : SearchTerm["field"] = "any";
	let rest = token;
	if (rest.startsWith("-")) { negate = true; rest = rest.slice(1); }
	// prefixes are case-insensitive, T: is as good as t:
	const prefix = rest.slice(0, 2).toLowerCase();
	if (prefix === "t:") { field = "title"; rest = rest.slice(2); }
	else if (prefix === "u:") { field = "url"; rest = rest.slice(2); }
	else if (prefix === "s:") { field = "saved"; rest = rest.slice(2); }
	// a bare s: is every saved tab (and -s: every open one); the other
	// prefixes need something to look for
	if (rest.length === 0) return field === "saved" ? { field, negate, test: () => true, hits: () => [] } : null;

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
			return { field, negate, test, hits };
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
	return { field, negate, test, hits };
}

export function parseQuery(query : string) : SearchQuery {
	const raw = tokens(query);
	// "OR" between terms switches the mode; the word itself is not a term
	const mode : SearchQuery["mode"] = raw.some((t) => t === "OR") ? "or" : "and";
	const terms : SearchTerm[] = [];
	for (const t of raw) {
		if (t === "OR") continue;
		const parsed = term(t);
		if (parsed) terms.push(parsed);
	}
	return { terms, mode, empty: terms.length === 0 };
}

export function matchTab(tab : Searchable, query : SearchQuery) : boolean {
	if (query.empty) return true;
	const hit = (t : SearchTerm) : boolean => {
		let found : boolean;
		if (t.field === "title") found = t.test(tab.title);
		else if (t.field === "url") found = t.test(tab.url);
		// open tabs never match s:, whatever the word
		else if (t.field === "saved") found = !!tab.saved && (t.test(tab.title) || t.test(tab.url));
		else found = t.test(tab.title) || t.test(tab.url);
		return t.negate ? !found : found;
	};
	return query.mode === "or" ? query.terms.some(hit) : query.terms.every(hit);
}

// The parts of a title the search matched, to show in bold: every term that
// looks at the title (not url-only, not excluded), sorted, overlaps merged.
export function titleHits(title : string, query : SearchQuery | null) : [number, number][] {
	if (!query || query.empty || !title) return [];
	const all : [number, number][] = [];
	for (const t of query.terms) {
		if (t.negate || t.field === "url") continue;
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
