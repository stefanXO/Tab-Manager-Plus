"use strict";

// Unit tests for the punycode decoder in src/popup/punycode.ts, checked
// against node's own domainToUnicode.
// Run with: npm test  (== node --test tests/)

import { test } from "node:test";
import assert from "node:assert/strict";
import { domainToUnicode } from "node:url";
import { decodePunycode, hostToUnicode, urlToUnicode } from "../src/popup/punycode.ts";

test("labels decode as RFC 3492 says", () => {
	assert.equal(hostToUnicode("xn--wgv71a"), "日本");
	assert.equal(hostToUnicode("xn--wgv71a119e"), "日本語");
	assert.equal(hostToUnicode("xn--r8jz45g"), "例え");
	assert.equal(hostToUnicode("xn--bcher-kva"), "bücher");
	assert.equal(decodePunycode("bcher-kva"), "bücher");
	for (const h of ["xn--o3crh0a8bb0k", "xn--3e0bk47br7k", "xn--mnchen-3ya", "xn--fiq228c", "xn--mgbh0fb", "xn--4dbrk0ce"]) {
		assert.equal(hostToUnicode(h), domainToUnicode(h), h);
	}
});

test("a mixed host: only the xn-- labels change, the port stays", () => {
	assert.equal(hostToUnicode("www.xn--bcher-kva.example"), "www.bücher.example");
	assert.equal(hostToUnicode("XN--WGV71A119E.xn--wgv71a.jp:8080"), "日本語.日本.jp:8080");
	assert.equal(hostToUnicode("github.com"), "github.com");
});

test("an invalid label comes back as it was", () => {
	for (const h of ["xn--", "xn--zz", "xn--ü-abc", "xn--99999999999a", "xn--a-.com"]) assert.equal(hostToUnicode(h), h, h);
	assert.equal(decodePunycode("zz"), null);
	assert.equal(hostToUnicode(""), "");
});

test("urlToUnicode changes the host only", () => {
	assert.equal(urlToUnicode("https://www.xn--bcher-kva.example:8080/a?q=xn--wgv71a#xn--x"), "https://www.bücher.example:8080/a?q=xn--wgv71a#xn--x");
	assert.equal(urlToUnicode("https://u:p@xn--wgv71a.jp/"), "https://u:p@日本.jp/");
	assert.equal(urlToUnicode("https://example.com/xn--wgv71a"), "https://example.com/xn--wgv71a");
	assert.equal(urlToUnicode("about:blank"), "about:blank");
	assert.equal(urlToUnicode(""), "");
});
