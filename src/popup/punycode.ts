"use strict";

// Host names in Unicode. A url keeps an international host in its ASCII form
// ("xn--bcher-kva.example" for "bücher.example"); the popup shows the Unicode
// form, as the address bar does. Decode only (RFC 3492), no dependency: the
// browser has no domainToUnicode. Pure, unit tested in tests/punycode.test.ts.

const BASE = 36, TMIN = 1, TMAX = 26, SKEW = 38, DAMP = 700, MAXINT = 0x7fffffff;

function adapt(delta : number, points : number, first : boolean) : number {
	delta = first ? Math.floor(delta / DAMP) : delta >> 1;
	delta += Math.floor(delta / points);
	let k = 0;
	for (; delta > ((BASE - TMIN) * TMAX) >> 1; k += BASE) delta = Math.floor(delta / (BASE - TMIN));
	return k + Math.floor((BASE - TMIN + 1) * delta / (delta + SKEW));
}

function digit(c : number) : number {
	if (c >= 48 && c <= 57) return c - 22;
	if (c >= 65 && c <= 90) return c - 65;
	if (c >= 97 && c <= 122) return c - 97;
	return BASE;
}

// the Unicode text of a punycode string (without "xn--"), or null when it is
// not valid punycode
export function decodePunycode(input : string) : string | null {
	const out : number[] = [];
	const b = Math.max(0, input.lastIndexOf("-"));
	for (let j = 0; j < b; j++) {
		const c = input.charCodeAt(j);
		if (c >= 0x80) return null;
		out.push(c);
	}
	let n = 0x80, bias = 72, i = 0;
	for (let at = b > 0 ? b + 1 : 0; at < input.length;) {
		const old = i;
		for (let w = 1, k = BASE; ; k += BASE) {
			if (at >= input.length) return null;
			const d = digit(input.charCodeAt(at++));
			if (d >= BASE || d > Math.floor((MAXINT - i) / w)) return null;
			i += d * w;
			const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
			if (d < t) break;
			if (w > Math.floor(MAXINT / (BASE - t))) return null;
			w *= BASE - t;
		}
		const len = out.length + 1;
		bias = adapt(i - old, len, old === 0);
		n += Math.floor(i / len);
		i %= len;
		if (n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) return null;
		out.splice(i++, 0, n);
	}
	// an encoder never writes a label with nothing to encode ("a-")
	return out.some((c) => c >= 0x80) ? String.fromCodePoint(...out) : null;
}

// every "xn--" label of a host decoded; a label that does not decode stays
// as it is. A ":port" at the end is kept.
export function hostToUnicode(host : string) : string {
	if (!/xn--/i.test(host)) return host;
	const port = /:\d*$/.exec(host);
	const name = port ? host.slice(0, port.index) : host;
	const labels = name.split(".").map((label) => {
		if (!/^xn--/i.test(label)) return label;
		const text = decodePunycode(label.slice(4).toLowerCase());
		return text ? text : label;
	});
	return labels.join(".") + (port ? port[0] : "");
}

// the url with its host in Unicode ("scheme://host..." urls only)
export function urlToUnicode(url : string) : string {
	const m = /^([a-z][a-z0-9+.-]*:\/\/(?:[^/?#\\@]*@)?)([^/?#\\]*)/i.exec(url);
	if (!m || !/xn--/i.test(m[2])) return url;
	return m[1] + hostToUnicode(m[2]) + url.slice(m[0].length);
}
