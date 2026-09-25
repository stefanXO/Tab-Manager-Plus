"use strict";

// The search box grammar. Everything is case-insensitive substring unless a
// term says otherwise:
//   foo bar        every term must match (AND), anywhere in title or url
//   foo OR bar     any term matches
//   t:foo          title only            u:foo   url only
//   -foo           must not match        -u:foo  url must not contain
//   "foo bar"      one term with a space
//   /re+gex/       a term is a regular expression (t:/^\d+/ works too);
//                  an invalid pattern falls back to a plain substring
// Nothing else on purpose: every extra token is something to explain.

export interface SearchTerm {
	field : "any" | "title" | "url";
	negate : boolean;
	test : (s : string) => boolean;
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
}

export function searchable(title : string | undefined, url : string | undefined) : Searchable {
	return { title: (title || "").toLowerCase(), url: (url || "").toLowerCase() };
}

// splits on whitespace, keeps "quoted phrases" and /regex bodies/ together
function tokens(query : string) : string[] {
	const out : string[] = [];
	const re = /(-?(?:[tuTU]:)?)(?:"([^"]*)"|\/((?:\\\/|[^\/])+)\/(i?)|(\S+))/g;
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
	if (rest.length === 0) return null;

	let test : SearchTerm["test"];
	const rx = /^\/(.+)\/(i?)$/.exec(rest);
	const quoted = /^"(.*)"$/.exec(rest);
	if (rx) {
		try {
			const r = new RegExp(rx[1], "i");
			test = (s) => r.test(s);
		} catch (e) {
			// not a valid pattern: search for its text as it is
			const lit = rx[1].toLowerCase();
			test = (s) => s.indexOf(lit) >= 0;
		}
	} else {
		const lit = (quoted ? quoted[1] : rest).toLowerCase();
		if (lit.length === 0) return null;
		test = (s) => s.indexOf(lit) >= 0;
	}
	return { field, negate, test };
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
		else found = t.test(tab.title) || t.test(tab.url);
		return t.negate ? !found : found;
	};
	return query.mode === "or" ? query.terms.some(hit) : query.terms.every(hit);
}
