"use strict";

// Urls as the popup shows them. Chrome keeps a "user:password@" part in
// tab.url (http://user:secret@host/), so the header, the tab card and the
// debug export (a file users attach to bug reports) would show the password.
// stripUserinfo drops it for display and export only: what is stored and what
// a restore opens keeps the full url. Pure, unit tested in tests/safeUrl.test.ts.

// scheme "://" then the authority up to its last "@" (the host never holds
// one); the authority ends at the first / ? # or \
const USERINFO = /^((?:https?|ftp):\/\/)[^/?#\\]*@/i;

// the url without its userinfo for http, https and ftp; any other url, or
// anything that is not a string, comes back as it is ("" for none)
export function stripUserinfo(url : string | null | undefined) : string {
	if (typeof url !== "string") return "";
	return url.replace(USERINFO, "$1");
}

// a copy of any JSON-like value with the userinfo taken out of every string
// under a url key (url, pendingUrl, favIconUrl, and title: a saved tab with
// no title keeps its url as the title): the saved windows in the debug export
const URL_KEYS = new Set(["url", "pendingUrl", "favIconUrl", "title"]);
export function stripUserinfoDeep<T>(value : T) : T {
	if (Array.isArray(value)) return value.map((v) => stripUserinfoDeep(v)) as T;
	if (value === null || typeof value !== "object") return value;
	const out : Record<string, unknown> = {};
	for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
		out[k] = URL_KEYS.has(k) && typeof v === "string" ? stripUserinfo(v) : stripUserinfoDeep(v);
	}
	return out as T;
}
