"use strict";

// Unit tests for the automatic window name in src/popup/windowName.ts.
// Run with: npm test  (== node --test tests/)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { windowName, compactName, tabsKey, siteOf, publicSuffix } from "../src/popup/windowName.ts";
import type { NameTab } from "../src/popup/windowName.ts";

const t = (url: string, title = "", extra: Partial<NameTab> = {}): NameTab => ({ url, title, ...extra });
const many = (n: number, mk: (i: number) => NameTab): NameTab[] => Array.from({ length: n }, (_, i) => mk(i));

describe("siteOf", () => {
	test("unparseable or empty urls give null", () => {
		assert.equal(siteOf({}), null);
		assert.equal(siteOf({ url: "" }), null);
		assert.equal(siteOf({ url: "not a url" }), null);
	});

	test("pendingUrl wins over url", () => {
		assert.equal(siteOf({ url: "https://a.com/", pendingUrl: "https://github.com/x" })?.name, "GitHub");
	});

	test("table: google subdomains", () => {
		assert.equal(siteOf(t("https://mail.google.com/mail/u/0"))?.name, "Gmail");
		assert.equal(siteOf(t("https://docs.google.com/document/d/1"))?.name, "Google Docs");
		assert.equal(siteOf(t("https://drive.google.com/"))?.name, "Google Drive");
		assert.equal(siteOf(t("https://calendar.google.com/"))?.name, "Google Calendar");
		assert.equal(siteOf(t("https://www.google.com/maps/place/x"))?.name, "Google Maps");
		assert.equal(siteOf(t("https://www.google.com/search?q=x"))?.name, "Google");
	});

	test("table: wildcard tenants and aliases", () => {
		assert.equal(siteOf(t("https://acme.atlassian.net/browse/X-1"))?.name, "Jira");
		assert.equal(siteOf(t("https://acme.slack.com/x"))?.name, "Slack");
		assert.equal(siteOf(t("https://youtu.be/abc"))?.name, "YouTube");
		assert.equal(siteOf(t("https://twitter.com/a"))?.name, "X");
		assert.equal(siteOf(t("https://www.amazon.co.uk/x"))?.name, "Amazon");
		assert.equal(siteOf(t("https://en.wikipedia.org/wiki/X"))?.name, "Wikipedia");
		assert.equal(siteOf(t("https://developer.mozilla.org/en-US/"))?.name, "MDN");
	});

	test("table wins over unread count title", () => {
		assert.equal(siteOf(t("https://mail.google.com/", "(3) Inbox - Gmail"))?.name, "Gmail");
	});

	test("title segment matching the domain label", () => {
		assert.equal(siteOf(t("https://stackoverflow.com/q/1", "How do I x - Stack Overflow"))?.name, "Stack Overflow");
		assert.equal(siteOf(t("https://www.acme.co.uk/news/1", "Something happened - Acme News"))?.name, "Acme News");
		assert.equal(siteOf(t("https://news.ycombinator.com/", "Hacker News"))?.name, "Hacker News"); // known table
		assert.equal(siteOf(t("https://www.tagesblatt.de/", "T"))?.name, "Tagesblatt"); // one-letter segment never matches
		assert.equal(siteOf(t("https://example.com/", "(3) Foo | Example"))?.name, "Example");
	});

	test("first segment is tried too", () => {
		assert.equal(siteOf(t("https://acme.com/", "Acme | Welcome home"))?.name, "Acme");
	});

	test("falls back to capitalised label", () => {
		assert.equal(siteOf(t("https://hackernews.io/", "Totally unrelated"))?.name, "Hackernews");
	});

	test("never a bare tld", () => {
		const s = siteOf(t("https://t.co/abc"));
		assert.ok(s);
		assert.notEqual(s.name.toLowerCase(), "co");
		assert.equal(s.name, "T");
		assert.equal(siteOf(t("https://foo.co.uk/"))?.name, "FOO");
		assert.equal(siteOf(t("https://shop.example.com.au/"))?.name, "Example");
	});

	test("multi-tenant hosts use the tenant", () => {
		const s = siteOf(t("https://foo.github.io/page"));
		assert.equal(s?.name, "FOO");
		assert.equal(s?.key, "foo.github.io");
		assert.notEqual(siteOf(t("https://bar.github.io/"))?.key, s?.key);
	});

	test("ip and localhost keep host and port", () => {
		assert.equal(siteOf(t("http://192.168.1.5:8080/x"))?.name, "192.168.1.5:8080");
		assert.equal(siteOf(t("http://localhost:3000/"))?.name, "localhost:3000");
		assert.notEqual(siteOf(t("http://localhost:3000/"))?.key, siteOf(t("http://localhost:4000/"))?.key);
	});

	test("browser pages", () => {
		assert.equal(siteOf(t("chrome://newtab/", "New Tab"))?.name, "New Tab");
		assert.equal(siteOf(t("chrome://extensions/"))?.name, "Extensions");
		assert.equal(siteOf(t("chrome-extension://abcdef/popup.html", "Tab Manager"))?.name, "Tab Manager");
		assert.equal(siteOf(t("about:blank"))?.name, "Blank");
	});

	test("view-source unwraps", () => {
		assert.equal(siteOf(t("view-source:https://github.com/x"))?.name, "GitHub");
	});
});

describe("siteOf: more rules", () => {
	test("thai and other two-level country suffixes", () => {
		assert.equal(siteOf(t("https://www.kasikornbank.co.th/", "K PLUS - Kasikornbank"))?.name, "Kasikornbank");
		assert.equal(siteOf(t("https://foo.co.th/"))?.name, "FOO");
		for (const h of ["or.th", "ac.th", "go.th", "co.id", "com.my", "com.ph", "com.vn", "co.il", "com.pk", "com.eg", "com.ng", "co.ke", "com.pe", "com.co", "com.ec", "com.uy", "com.ve", "co.ve", "com.pl", "com.ua", "com.ru", "co.at", "co.hu", "ne.jp", "or.jp", "ac.jp"]) {
			assert.equal(siteOf(t("https://shop.zorp." + h + "/"))?.name, "Zorp", h);
		}
	});

	test("search engines are just the engine", () => {
		assert.equal(siteOf(t("https://www.google.com/"))?.name, "Google");
		assert.equal(siteOf(t("https://google.co.th/search?q=x", "x - Google Search"))?.name, "Google");
		assert.equal(siteOf(t("https://www.google.de/webhp"))?.name, "Google");
		assert.equal(siteOf(t("https://www.google.de/imghp"))?.name, "Google");
		assert.equal(siteOf(t("https://www.google.com/maps/place/x"))?.name, "Google Maps");
		assert.equal(siteOf(t("https://docs.google.com/x"))?.name, "Google Docs");
		assert.equal(siteOf(t("https://bing.com/search?q=x"))?.name, "Bing");
		assert.equal(siteOf(t("https://duckduckgo.com/?q=x"))?.name, "DuckDuckGo");
		assert.equal(siteOf(t("https://search.yahoo.com/search"))?.name, "Yahoo");
		assert.equal(siteOf(t("https://www.ecosia.org/search"))?.name, "Ecosia");
		assert.equal(siteOf(t("https://www.startpage.com/"))?.name, "Startpage");
		assert.equal(siteOf(t("https://search.brave.com/search"))?.name, "Brave Search");
		assert.equal(siteOf(t("https://kagi.com/search"))?.name, "Kagi");
		assert.equal(siteOf(t("https://yandex.ru/search"))?.name, "Yandex");
		assert.equal(siteOf(t("https://www.baidu.com/s"))?.name, "Baidu");
		assert.equal(siteOf(t("https://www.perplexity.ai/"))?.name, "Perplexity");
	});

	test("tenant hosts take the title spelling", () => {
		assert.equal(siteOf(t("https://phuket-padel.web.app/", "Phuket Padel - Book a court"))?.name, "Phuket Padel");
		assert.equal(siteOf(t("https://phuket-padel.web.app/", "Book a court | Phuket Padel"))?.name, "Phuket Padel");
		assert.equal(siteOf(t("https://phuket-padel.web.app/"))?.name, "Phuket Padel");
		assert.equal(siteOf(t("https://foo.github.io/"))?.name, "FOO");
		assert.equal(siteOf(t("https://acme.netlify.app/", "ACME"))?.name, "ACME");
		assert.equal(siteOf(t("https://myblog.blogspot.com/", "My Blog"))?.name, "My Blog");
		assert.equal(siteOf(t("https://name.notion.site/"))?.name, "Name");
		assert.equal(siteOf(t("https://myblog.wordpress.com/", "My Blog"))?.name, "My Blog");
		assert.equal(siteOf(t("https://name.substack.com/"))?.name, "Name");
		assert.equal(siteOf(t("https://my_site.vercel.app/"))?.name, "My Site");
	});

	test("hyphenated labels become words", () => {
		assert.equal(siteOf(t("https://my-site.com/"))?.name, "My Site");
	});

	test("google products", () => {
		const cases: [string, string][] = [
			["console.firebase.google.com", "Firebase"], ["firebase.google.com", "Firebase"], ["console.cloud.google.com", "Google Cloud"],
			["analytics.google.com", "Google Analytics"], ["search.google.com", "Search Console"], ["colab.research.google.com", "Colab"],
			["notebooklm.google.com", "NotebookLM"], ["tagmanager.google.com", "Tag Manager"], ["chromewebstore.google.com", "Chrome Web Store"],
			["developer.chrome.com", "Chrome Developers"], ["maps.app.goo.gl", "Google Maps"], ["aistudio.google.com", "AI Studio"],
		];
		for (const [h, n] of cases) assert.equal(siteOf(t("https://" + h + "/x"))?.name, n, h);
	});

	test("other popular sites and lookup order", () => {
		assert.equal(siteOf(t("https://console.aws.amazon.com/x"))?.name, "AWS");
		assert.equal(siteOf(t("https://aws.amazon.com/"))?.name, "AWS");
		assert.equal(siteOf(t("https://www.amazon.de/"))?.name, "Amazon");
		assert.equal(siteOf(t("https://web.archive.org/web/1/x"))?.name, "Wayback Machine");
		assert.equal(siteOf(t("https://archive.org/"))?.name, "Internet Archive");
		assert.equal(siteOf(t("https://www.bbc.co.uk/news"))?.name, "BBC");
		assert.equal(siteOf(t("https://teams.microsoft.com/"))?.name, "Teams");
		assert.equal(siteOf(t("https://www.microsoft.com/"))?.name, "Microsoft");
		assert.equal(siteOf(t("https://developer.mozilla.org/"))?.name, "MDN");
		assert.equal(siteOf(t("https://www.shopee.co.th/"))?.name, "Shopee");
		assert.equal(siteOf(t("https://www.ebay.de/"))?.name, "eBay");
		assert.equal(siteOf(t("https://open.spotify.com/"))?.name, "Spotify");
		assert.equal(siteOf(t("https://www.booking.com/"))?.name, "Booking.com");
		assert.equal(siteOf(t("https://dev.to/x"))?.name, "DEV");
	});
});

describe("windowName", () => {
	test("empty", () => {
		assert.equal(windowName([]), "");
		assert.equal(windowName([{}]), "");
	});

	test("mixed-case facebook titles collapse to one name", () => {
		const tabs = [
			t("https://www.facebook.com/", "Facebook"),
			t("https://facebook.com/groups/1", "Group | FACEBOOK"),
			t("https://m.facebook.com/x", "x - facebook"),
		];
		assert.equal(windowName(tabs), "Facebook");
	});

	test("ordering by count across google subdomains", () => {
		const tabs = [
			t("https://docs.google.com/a"), t("https://docs.google.com/b"), t("https://docs.google.com/c"),
			t("https://drive.google.com/"), t("https://drive.google.com/x"),
			t("https://www.google.com/search?q=1"),
		];
		assert.equal(windowName(tabs), "Google Docs, Google Drive, Google");
	});

	test("ties broken by lastAccessed, then first appearance", () => {
		assert.equal(windowName([t("https://alpha.com/", "", { lastAccessed: 1 }), t("https://beta.com/", "", { lastAccessed: 5 })]), "Beta, Alpha");
		assert.equal(windowName([t("https://alpha.com/"), t("https://beta.com/")]), "Alpha, Beta");
	});

	test("dominant site wins alone", () => {
		const tabs = [...many(7, (i) => t("https://www.youtube.com/watch?v=" + i, "Video - YouTube")), t("https://a.com/"), t("https://b.com/")];
		assert.equal(windowName(tabs), "YouTube");
	});

	test("dominant needs 4 tabs and 70 percent", () => {
		assert.equal(windowName([...many(3, (i) => t("https://youtube.com/" + i)), t("https://a.com/")]), "YouTube, A");
		const six = [...many(6, (i) => t("https://youtube.com/" + i)), t("https://a.com/"), t("https://b.com/"), t("https://c.com/")];
		assert.equal(windowName(six), "YouTube, A, B & 1 more");
	});

	test("more counts sites, not tabs", () => {
		const tabs = ["a", "b", "c", "d", "e"].flatMap((s) => [t(`https://${s}site.com/1`), t(`https://${s}site.com/2`)]);
		assert.equal(windowName(tabs), "Asite, Bsite, Csite & 2 more");
	});

	test("exactly three sites show all three", () => {
		const name = windowName([t("https://a.com/"), t("https://b.com/"), t("https://c.com/")]);
		assert.equal(name, "A, B, C");
		assert.ok(!name.includes("more"));
	});

	test("different sites with the same name are merged", () => {
		const tabs = [t("https://github.com/a"), t("https://github.com/b"), t("https://foo.github.io/", "GitHub"), t("https://x.com/")];
		const parts = windowName(tabs).split(", ");
		assert.equal(new Set(parts.map((p) => p.toLowerCase())).size, parts.length);
	});

	test("most frequent title-derived name wins within a site", () => {
		const tabs = [
			t("https://acme.com/1", "One - Acme Corp"),
			t("https://acme.com/2", "Two - Acme"),
			t("https://acme.com/3", "Three - Acme"),
		];
		assert.equal(windowName(tabs), "Acme");
	});

	test("browser pages and ip in a window", () => {
		assert.equal(windowName([t("chrome://newtab/", "New Tab")]), "New Tab");
		assert.equal(windowName([t("http://192.168.1.5:8080/")]), "192.168.1.5:8080");
	});
});

describe("tabsKey", () => {
	test("changes when a url changes or tabs are added", () => {
		const a = [t("https://a.com/"), t("https://b.com/")];
		assert.notEqual(tabsKey(a), tabsKey([t("https://a.com/"), t("https://c.com/")]));
		assert.notEqual(tabsKey(a), tabsKey([...a, t("https://d.com/")]));
		assert.notEqual(tabsKey(a), tabsKey([a[1], a[0]]));
	});

	test("same when only titles change", () => {
		assert.equal(tabsKey([t("https://a.com/", "x")]), tabsKey([t("https://a.com/", "y")]));
	});

	test("pendingUrl counts", () => {
		assert.notEqual(tabsKey([{ url: "https://a.com/" }]), tabsKey([{ url: "https://a.com/", pendingUrl: "https://b.com/" }]));
	});
});

describe("public suffix list", () => {
	const name = (url: string) => siteOf({ url })?.name;
	const key = (url: string) => siteOf({ url })?.key;

	test("country second-level suffixes", () => {
		assert.equal(name("https://www.kasikornbank.co.th/"), "Kasikornbank");
		assert.equal(key("https://www.kasikornbank.co.th/"), "kasikornbank.co.th");
		assert.equal(name("https://foo.co.th/"), "FOO");
		assert.equal(name("https://example.com.au/"), "Example");
		assert.equal(name("https://bbc.co.uk/"), "BBC");
		assert.equal(name("https://a.b.c.example.co.id/"), "Example");
	});

	test("wildcard and exception rules", () => {
		assert.deepEqual(publicSuffix("www.city.kawasaki.jp"), { suffix: "kawasaki.jp", private: false });
		assert.equal(name("https://www.city.kawasaki.jp/"), "City");
		assert.deepEqual(publicSuffix("shop.foo.kawasaki.jp"), { suffix: "foo.kawasaki.jp", private: false });
		assert.equal(name("https://shop.foo.kawasaki.jp/"), "Shop");
		assert.equal(key("https://shop.foo.kawasaki.jp/"), "shop.foo.kawasaki.jp");
	});

	test("private suffixes are tenants", () => {
		assert.equal(name("https://phuket-padel.web.app/"), "Phuket Padel");
		assert.equal(key("https://phuket-padel.web.app/"), "phuket-padel.web.app");
		assert.equal(name("https://myblog.blogspot.com/"), "Myblog");
		assert.equal(name("https://foo.github.io/"), "FOO");
		assert.equal(name("https://github.io/"), "Github");
		assert.equal(key("https://github.io/"), "github.io");
		assert.equal(publicSuffix("foo.github.io").private, true);
		assert.equal(publicSuffix("github.io").private, true);
	});

	test("unknown tld falls back to the last label", () => {
		assert.deepEqual(publicSuffix("a.b.zzzz"), { suffix: "zzzz", private: false });
		assert.deepEqual(publicSuffix("foo.example"), { suffix: "example", private: false });
		assert.equal(name("https://sub.example.com/"), "Example");
	});
});

describe("known brands and leading The", () => {
	test("title segment with The matches the label", () => {
		const a = { ...t("https://www.washingtonpost.com/x", "Opinion - The Washington Post") };
		assert.equal(siteOf(a)?.name, "The Washington Post");
		assert.equal(siteOf(t("https://www.independent.co.uk/news/1", "News | The Independent"))?.name, "The Independent");
		assert.equal(siteOf(t("https://www.tagesblatt.de/", "Neu - The Tagesblatt"))?.name, "The Tagesblatt");
		assert.equal(siteOf(t("https://www.acmenews.org/", "Story - Acme News"))?.name, "Acme News");
	});

	test("table: public-suffix hosts and longest match", () => {
		assert.equal(siteOf(t("https://www.gov.uk/"))?.name, "GOV.UK");
		assert.equal(siteOf(t("https://www.gov.uk/browse/x"))?.key, "known:GOV.UK");
		assert.equal(siteOf(t("https://www.nhs.uk/conditions/"))?.name, "NHS");
		assert.equal(siteOf(t("https://company-information.service.gov.uk/company/1"))?.name, "Companies House");
		assert.equal(siteOf(t("https://www.nytimes.com/"))?.name, "The New York Times");
		assert.equal(siteOf(t("https://www.the-sun.com/"))?.name, "The Sun");
		assert.equal(siteOf(t("https://www.thesun.co.uk/"))?.name, "The Sun");
		assert.equal(siteOf(t("https://www.istockphoto.com/"))?.name, "iStock");
	});
});

describe("title spelling", () => {
	const name = (url: string, title = "") => siteOf(t(url, title))?.name;

	test("label prefixes are ignored for matching only", () => {
		assert.equal(name("https://www.flyasiana.com/", "ASIANA AIRLINES"), "Asiana Airlines");
		assert.equal(name("https://www.getfoobar.com/", "Foobar - Home"), "Foobar");
		assert.equal(name("https://www.myacmeshop.com/", "Welcome | Acmeshop"), "Acmeshop"); // "my" stripped, "acmeshop" matches
		assert.equal(name("https://www.flyxy.com/", "Xy Air"), "Flyxy"); // fewer than 4 chars would remain
	});

	test("long all-caps segments become title case, short ones stay", () => {
		assert.equal(name("https://www.asiana.com/", "ASIANA AIRLINES"), "Asiana Airlines");
		assert.equal(name("https://www.ikeafoo.com/", "IKEAFOO"), "Ikeafoo");
		assert.equal(name("https://www.nasa.example/", "NASA"), "NASA");
		assert.equal(name("https://www.ikea.example/", "IKEA"), "IKEA");
		assert.equal(name("https://www.abcd.example/", "ABCD"), "ABCD");
	});

	test("lowercase single words get a capital", () => {
		assert.equal(name("https://villabox.com/", "villabox"), "Villabox");
		assert.equal(name("https://lhelge.se/", "lhelge.se"), "Lhelge.se");
	});

	test("version-like or long prefix-only matches are rejected", () => {
		assert.equal(name("https://suslik.lan/", "Face learning run — suslik 0.1.0.545-cpu"), "Suslik");
		assert.equal(name("https://suslik.lan/", "suslik 0.1.0.545-cpu"), "Suslik");
		assert.equal(name("https://acme.example/", "Acme and a very long tail of words here"), "Acme");
		assert.equal(name("https://acme.example/", "Acme Inc"), "Acme Inc"); // short prefix match still fine
	});

	test("very short labels are upper-cased in the fallback", () => {
		assert.equal(name("https://nv.ua/"), "NV");
		assert.equal(name("https://t.co/abc"), "T");
		assert.equal(name("https://abc.example/"), "ABC");
		assert.equal(name("https://abcd.example/"), "Abcd");
	});

	test("table additions", () => {
		const table: Record<string, string> = {
			"https://claude.ai/": "Claude",
			"https://claude.com/": "Claude",
			"https://code.claude.com/docs": "Claude Code",
			"https://docs.claude.com/en": "Claude Docs",
			"https://snyk.io/": "Snyk",
			"https://dribbble.com/": "Dribbble",
			"https://www.flaticon.com/": "Flaticon",
			"https://journals.plos.org/": "PLOS",
			"https://wptavern.com/": "WP Tavern",
			"https://trendshift.io/": "Trendshift",
		};
		for (const [url, expected] of Object.entries(table)) assert.equal(name(url), expected, url);
	});

	test("browser pages rank after real sites and stay out of the count", () => {
		const newtab = (i: number) => t("chrome://newtab/", "New Tab", { lastAccessed: 100 + i });
		const tabs = [newtab(0), newtab(1), t("https://github.com/a"), t("https://en.wikipedia.org/wiki/B")];
		assert.equal(windowName(tabs), "GitHub, Wikipedia");
		assert.equal(windowName(many(3, newtab)), "New Tab");
		const five = [t("https://github.com/a"), t("https://a.com/"), t("https://b.com/"), t("https://c.com/"), t("https://d.com/"), newtab(0), newtab(1), newtab(2)];
		assert.equal(windowName(five), "GitHub, A, B & 2 more");
		assert.equal(windowName([t("chrome://extensions/", "Extensions"), newtab(0)]), "New Tab, Extensions");
	});
});

describe("compactName: the title in compact mode", () => {
	test("\" & N more\" becomes \" + N\"", () => {
		assert.equal(compactName("GitHub, Claude, Google & 3 more"), "GitHub, Claude, Google + 3");
		assert.equal(compactName("YouTube, A, B & 1 more"), "YouTube, A, B + 1");
	});

	test("names without the suffix stay as they are", () => {
		assert.equal(compactName("GitHub, Claude"), "GitHub, Claude");
		assert.equal(compactName("Tom & Jerry"), "Tom & Jerry");
		assert.equal(compactName(""), "");
	});

	test("matches what windowName produces", () => {
		const five = many(5, (i) => t("https://site" + i + ".com/", "S" + i));
		assert.match(windowName(five), / & 2 more$/);
		assert.match(compactName(windowName(five)), / \+ 2$/);
	});
});

describe("international hosts are named in Unicode", () => {
	test("three CJK hosts", () => {
		const tabs = [t("https://xn--wgv71a119e.jp/", "タブ タイトル"), t("https://www.xn--fiq228c.com/a", "中文 标签"), t("https://xn--3e0b707e.kr/", "탭")];
		assert.equal(windowName(tabs), "日本語, 中文, 한국");
		assert.equal(windowName([...tabs, t("https://xn--o3crh0a8bb0k.th/"), t("https://xn--r8jz45g.xn--zckzah/")]), "日本語, 中文, 한국 & 2 more");
	});

	test("a Latin label with accents, and the key stays the ASCII host", () => {
		assert.deepEqual(siteOf(t("https://www.xn--bcher-kva.example/")), { key: "xn--bcher-kva.example", name: "Bücher" });
		assert.equal(siteOf(t("https://xn--mnchen-3ya.de/", "München - Offizielles Stadtportal"))?.name, "München");
	});

	test("a label that does not decode keeps its old name", () => {
		assert.equal(siteOf(t("https://xn--zz.com/"))?.name, "Xn Zz");
	});
});
