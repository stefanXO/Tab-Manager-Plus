"use strict";

// A saved window's title: its name truncates inside its own span, and the
// saved marker is part of that span. Beside the span, the marker made a long
// name overflow the title bar, whose own text-overflow then replaced the whole
// span with a bare "..." that is not the span (a click on it restored the
// window instead of opening the name screen). The real clicks are checked in
// tools/drag-check (`--only title`); this guards the markup and css they rely on.
// Run with: npm test  (== node --test tests/)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file : string) => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("the saved marker is inside the name's span, the only child of the title", () => {
	const src = read("src/popup/views/Session.tsx");
	const title = src.slice(src.indexOf('className="center windowTitle"'));
	const h3 = title.slice(0, title.indexOf("</h3>"));
	const open = h3.indexOf('<span\n');
	assert.ok(open >= 0, "the name span");
	assert.ok(h3.indexOf("{savedMark()}") > open, "the marker comes after the span opens");
	assert.equal(h3.split("{savedMark()}").length - 1, 1);
	assert.ok(h3.indexOf("{savedMark()}") < h3.indexOf("{name}"), "the marker is in front of the name");
	assert.match(h3, /className="editName windowName"/);
	assert.match(h3, /onClick=\{this\.openOptions\}/);
});

test(".windowName counts its padding in max-width and truncates itself", () => {
	const css = read("css/components/window.css");
	const rule = css.match(/\n\.windowName \{([^}]*)\}/);
	assert.ok(rule, "the .windowName rule");
	assert.match(rule[1], /box-sizing:\s*border-box/);
	assert.match(rule[1], /max-width:\s*100%/);
	assert.match(rule[1], /text-overflow:\s*ellipsis/);
	assert.match(rule[1], /overflow:\s*hidden/);
});
