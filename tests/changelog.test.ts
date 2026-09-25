import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { inlineHtml, renderChangelog, wrapHtml } from "../scripts/changelog.mjs";

// ---------------------------------------------------------------------------
// inlineHtml
// ---------------------------------------------------------------------------

describe("inlineHtml", () => {
	test("escapes &", () => {
		assert.equal(inlineHtml("a & b"), "a &amp; b");
	});

	test("escapes <", () => {
		assert.equal(inlineHtml("a < b"), "a &lt; b");
	});

	test("escapes >", () => {
		assert.equal(inlineHtml("a > b"), "a &gt; b");
	});

	test("leaves double quotes untouched", () => {
		assert.equal(inlineHtml('say "hi"'), 'say "hi"');
	});

	test("leaves single quotes untouched", () => {
		assert.equal(inlineHtml("its' own tab"), "its' own tab");
	});

	test("wraps `code` spans in <code>", () => {
		assert.equal(inlineHtml("use `t:word` here"), "use <code>t:word</code> here");
	});

	test("escapes html special chars inside a code span", () => {
		assert.equal(inlineHtml("`a < b`"), "<code>a &lt; b</code>");
	});

	test("links a #123 issue reference", () => {
		assert.equal(
			inlineHtml("fixed #123"),
			'fixed <a href="https://github.com/stefanXO/Tab-Manager-Plus/issues/123" target="_blank" rel="noopener">#123</a>',
		);
	});

	test("links a 2-digit issue reference", () => {
		assert.equal(
			inlineHtml("#12"),
			'<a href="https://github.com/stefanXO/Tab-Manager-Plus/issues/12" target="_blank" rel="noopener">#12</a>',
		);
	});

	test("links multiple issue references without double-linking", () => {
		assert.equal(
			inlineHtml("#100, #200"),
			'<a href="https://github.com/stefanXO/Tab-Manager-Plus/issues/100" target="_blank" rel="noopener">#100</a>, ' +
				'<a href="https://github.com/stefanXO/Tab-Manager-Plus/issues/200" target="_blank" rel="noopener">#200</a>',
		);
	});

	test("a bare # with no digits is not linked", () => {
		assert.equal(inlineHtml("c# is a language"), "c# is a language");
	});

	test("a 5-digit number is NOT linked", () => {
		assert.equal(inlineHtml("issue #12345"), "issue #12345");
	});

	test("a 1-digit number is NOT linked", () => {
		assert.equal(inlineHtml("room #1"), "room #1");
	});

	test("combines escaping, code and issue links in one string", () => {
		assert.equal(
			inlineHtml("Search with `t:word` (#224) & more"),
			'Search with <code>t:word</code> (<a href="https://github.com/stefanXO/Tab-Manager-Plus/issues/224" target="_blank" rel="noopener">#224</a>) &amp; more',
		);
	});
});

// ---------------------------------------------------------------------------
// renderChangelog
// ---------------------------------------------------------------------------

describe("renderChangelog", () => {
	test("dated version heading includes a <time> element", () => {
		const md = "6.0.0 (2024-10-01)\n=====\n- one\n";
		const html = renderChangelog(md);
		assert.match(html, /<h3>6\.0\.0 <time datetime="2024-10-01" title="2024-10-01"><\/time><\/h3>/);
	});

	test("undated version heading has no <time> element", () => {
		const md = "7.0.0\n=====\n- one\n";
		const html = renderChangelog(md);
		assert.match(html, /<h3>7\.0\.0<\/h3>/);
		assert.doesNotMatch(html, /<time/);
	});

	test("block without groups renders a single <h3> + <ul>", () => {
		const md = "1.0.0\n=====\n- first\n- second\n";
		const html = renderChangelog(md);
		assert.match(html, /<h3>1\.0\.0<\/h3>\n\t{6}<ul>\n\t{7}<li>first<\/li>\n\t{7}<li>second<\/li>\n\t{6}<\/ul>/);
	});

	test("block with groups renders an <h4> + <ul> per group", () => {
		const md = "1.0.0\n=====\nGroup A\n- a1\n- a2\nGroup B\n- b1\n";
		const html = renderChangelog(md);
		assert.match(html, /<h4>Group A<\/h4>\n\t{6}<ul>\n\t{7}<li>a1<\/li>\n\t{7}<li>a2<\/li>\n\t{6}<\/ul>/);
		assert.match(html, /<h4>Group B<\/h4>\n\t{6}<ul>\n\t{7}<li>b1<\/li>\n\t{6}<\/ul>/);
	});

	test("bullets before the first group heading go in an <h4>-less <ul>", () => {
		const md = "1.0.0\n=====\n- ungrouped\nGroup A\n- a1\n";
		const html = renderChangelog(md);
		const ulIndex = html.indexOf("<ul>");
		const h4Index = html.indexOf("<h4>");
		assert.ok(ulIndex !== -1 && ulIndex < h4Index, "the ungrouped <ul> must come before the first <h4>");
		assert.match(html, /<ul>\n\t{7}<li>ungrouped<\/li>\n\t{6}<\/ul>/);
	});

	test("empty groups (a heading with no bullets) are skipped", () => {
		const md = "1.0.0\n=====\nEmpty Group\nGroup A\n- a1\n";
		const html = renderChangelog(md);
		assert.doesNotMatch(html, /Empty Group/);
		assert.match(html, /<h4>Group A<\/h4>/);
	});

	test("renders two blocks in file order, separated by a blank line", () => {
		const md = "2.0.0\n=====\n- two\n\n1.0.0\n=====\n- one\n";
		const html = renderChangelog(md);
		const idx2 = html.indexOf("2.0.0");
		const idx1 = html.indexOf("1.0.0");
		assert.ok(idx2 !== -1 && idx1 !== -1 && idx2 < idx1);
	});

	test("a wrapped bullet continuation line is joined onto the bullet", () => {
		const md = "1.0.0\n=====\n- first line\n  continued text\n";
		const html = renderChangelog(md);
		assert.match(html, /<li>first line continued text<\/li>/);
	});

	test("a blank line right after the underline is tolerated", () => {
		const md = "1.0.0\n=====\n\n- one\n";
		const html = renderChangelog(md);
		assert.match(html, /<li>one<\/li>/);
	});

	test("exact whitespace of one small dated block", () => {
		const md = "1.2.3 (2020-01-01)\n=====\n- only bullet\n";
		const html = renderChangelog(md);
		assert.equal(
			html,
			"\n\n" +
				'\t\t\t\t\t\t<h3>1.2.3 <time datetime="2020-01-01" title="2020-01-01"></time></h3>\n' +
				"\t\t\t\t\t\t<ul>\n" +
				"\t\t\t\t\t\t\t<li>only bullet</li>\n" +
				"\t\t\t\t\t\t</ul>\n\n",
		);
	});
});

// ---------------------------------------------------------------------------
// wrapHtml
// ---------------------------------------------------------------------------

describe("wrapHtml", () => {
	test("breaks at the last space that keeps the line within the width", () => {
		assert.deepEqual(wrapHtml("aaa bbb ccc", 7), ["aaa bbb", "ccc"]);
	});

	test("tags don't count toward the width and are never split", () => {
		const link = '<a href="x y" target="_blank">#12</a>';
		assert.deepEqual(wrapHtml(`aaa ${link} bbb`, 8), [`aaa ${link}`, "bbb"]);
	});

	test("a long bullet wraps one tab deeper with </li> at the end of the last line", () => {
		const md = "1.0.0\n=====\n- " + "word ".repeat(30).trim() + "\n";
		const html = renderChangelog(md);
		assert.match(html, /\t{7}<li>word[^\n]*\n\t{8}word[^\n]*word<\/li>\n/);
	});

	test("trailing issue links of a wrapped bullet get their own line", () => {
		const md = "1.0.0\n=====\n- " + "word ".repeat(30).trim() + " (#12, #34)\n";
		const html = renderChangelog(md);
		assert.match(html, /\n\t{8}word[^\n]*word\n\t{8}\(<a [^\n]*>#12<\/a>, <a [^\n]*>#34<\/a>\)\n\t{7}<\/li>/);
	});

	test("a bullet up to 120 visible characters stays on one line", () => {
		const text = "word ".repeat(24).trim(); // 119 chars
		const html = renderChangelog(`1.0.0\n=====\n- ${text}\n`);
		assert.match(html, new RegExp(`<li>${text}</li>`));
	});

	test("text up to 120 characters stays on one line with trailing links on the next", () => {
		const text = "word ".repeat(20).trim(); // 99 chars
		const html = renderChangelog(`1.0.0\n=====\n- ${text} #12\n`);
		assert.match(html, new RegExp(`<li>${text}\\n\\t{8}<a [^>]*>#12</a>\\n\\t{7}</li>`));
	});

	test("trailing issue links stay inline on a short bullet", () => {
		const html = renderChangelog("1.0.0\n=====\n- short fix #12\n");
		assert.match(html, /<li>short fix <a [^>]*>#12<\/a><\/li>/);
	});
});
