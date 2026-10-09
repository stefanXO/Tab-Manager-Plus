"use strict";

import { urlToUnicode } from "./punycode.ts";

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

// the url for a file that leaves the machine (the debug export): no userinfo,
// no query string and no fragment, so a token in "?token=" or "#access_token="
// is not written. Scheme, host and path stay.
export function exportUrl(url : string | null | undefined) : string {
	return stripUserinfo(url).replace(/[?#][^]*$/, "");
}

// a url as the header and the tab card show it: no userinfo, the host in
// Unicode (./punycode.ts)
export function shownUrl(url : string | null | undefined) : string {
	return urlToUnicode(stripUserinfo(url));
}

// a copy of any JSON-like value with the userinfo taken out of every string
// under a url key (url, pendingUrl, favIconUrl, and title: a saved tab with
// no title keeps its url as the title): the saved windows in the debug export
const URL_KEYS = new Set(["url", "pendingUrl", "favIconUrl", "title"]);
export function stripUserinfoDeep<T>(value : T, clean : (v : string, key : string) => string = (v) => stripUserinfo(v)) : T {
	if (Array.isArray(value)) return value.map((v) => stripUserinfoDeep(v, clean)) as T;
	if (value === null || typeof value !== "object") return value;
	const out : Record<string, unknown> = {};
	for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
		out[k] = URL_KEYS.has(k) && typeof v === "string" ? clean(v, k) : stripUserinfoDeep(v, clean);
	}
	return out as T;
}
