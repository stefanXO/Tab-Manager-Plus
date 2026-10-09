"use strict";

// Unit tests for src/popup/safeUrl.ts.
// Run with: npm test  (== node --test tests/)

import { test } from "node:test";
import assert from "node:assert/strict";
import { stripUserinfo, stripUserinfoDeep } from "../src/popup/safeUrl.ts";

test("http, https and ftp lose user:password@", () => {
	assert.equal(stripUserinfo("http://user:secret-pass@cred.example.com/login"), "http://cred.example.com/login");
	assert.equal(stripUserinfo("HTTPS://u:p@Example.com:8080/a?b=c#d"), "HTTPS://Example.com:8080/a?b=c#d");
	assert.equal(stripUserinfo("ftp://anonymous@ftp.example.org/pub/"), "ftp://ftp.example.org/pub/");
	assert.equal(stripUserinfo("https://:pw@example.com"), "https://example.com");
});

test("an @ in the password or the path", () => {
	assert.equal(stripUserinfo("https://me:p@ss@example.com/x"), "https://example.com/x");
	assert.equal(stripUserinfo("https://example.com/@someone"), "https://example.com/@someone");
	assert.equal(stripUserinfo("https://example.com/?mail=a@b.c"), "https://example.com/?mail=a@b.c");
	assert.equal(stripUserinfo("https://example.com#a@b"), "https://example.com#a@b");
});

test("urls without userinfo and other schemes are untouched", () => {
	for (const url of [
		"https://example.com/",
		"mailto:someone@example.com",
		"chrome://version",
		"about:blank",
		"file:///C:/x@y.txt",
		"data:text/plain,user:pass@host",
		"blob:https://example.com/1234",
		"javascript:void(0)",
		"",
	]) assert.equal(stripUserinfo(url), url, url);
});

test("garbage never throws", () => {
	assert.equal(stripUserinfo(undefined), "");
	assert.equal(stripUserinfo(null), "");
	assert.equal(stripUserinfo(42 as unknown as string), "");
	assert.equal(stripUserinfo("http://@"), "http://");
	assert.equal(stripUserinfo("not a url @ all"), "not a url @ all");
	assert.equal(stripUserinfo("\u0000http://a:b@c"), "\u0000http://a:b@c");
});

test("stripUserinfoDeep cleans every url key and copies", () => {
	const input = [{ id: "a", name: "x:y@z", tabs: [{ url: "http://a:b@h/", favIconUrl: "https://a:b@h/f.ico", title: "http://a:b@h/", n: 1 }], windowsInfo: { pendingUrl: "ftp://u@h" } }];
	const before = JSON.stringify(input);
	const out = stripUserinfoDeep(input);
	assert.deepEqual(out, [{ id: "a", name: "x:y@z", tabs: [{ url: "http://h/", favIconUrl: "https://h/f.ico", title: "http://h/", n: 1 }], windowsInfo: { pendingUrl: "ftp://h" } }]);
	assert.equal(JSON.stringify(input), before);
	assert.equal(stripUserinfoDeep(null), null);
	assert.equal(stripUserinfoDeep("http://a:b@h"), "http://a:b@h");
});

