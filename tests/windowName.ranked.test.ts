"use strict";

// Data-driven check of siteOf over the top domains of three regions
// (tests/data/ranked_domains_{world,us,uk}.json, from dataforseo.com).
// Run with: npm test
// To review the fallback names (domains not in KNOWN_SITES), print them:
//   NAMES_DUMP=1 node --test tests/windowName.ranked.test.ts
// which prints "position<TAB>domain<TAB>name" for every domain whose key
// does not start with "known:".

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { siteOf } from "../src/popup/windowName.ts";

interface Ranked {
	position: number;
	domain: string;
}

const load = (region: string): Ranked[] =>
	JSON.parse(readFileSync(new URL("./data/ranked_domains_" + region + ".json", import.meta.url), "utf8"));

const REGIONS = ["world", "us", "uk"];
const lists: Record<string, Ranked[]> = {};
for (const r of REGIONS) lists[r] = load(r);

const BARE = ["com", "org", "net", "co", "gov", "edu", "uk", "www", "io", "app"];

for (const region of REGIONS) {
	test("ranked " + region + ": every domain gets a sane name", () => {
		for (const { domain } of lists[region]) {
			const site = siteOf({ url: "https://" + domain + "/" });
			assert.ok(site, domain + " -> null");
			const { name, key } = site;
			assert.ok(name.length > 0, domain + " -> empty name");
			assert.ok(name.length <= 40, domain + " -> " + name + " (too long)");
			assert.ok(!BARE.includes(name.toLowerCase()), domain + " -> " + name + " (bare suffix)");
			assert.ok(!BARE.includes(key.toLowerCase()) && !BARE.includes(key.replace(/^known:/, "").toLowerCase()), domain + " -> key " + key);
		}
	});
}

test("ranked world top 100: name is not the raw lowercase label", () => {
	for (const { domain } of lists.world.slice(0, 100)) {
		const site = siteOf({ url: "https://" + domain + "/" });
		assert.ok(site, domain + " -> null");
		const label = domain.split(".")[0];
		const ok = site.key.startsWith("known:") || site.name !== label;
		assert.ok(ok, domain + " -> " + site.name);
	}
});

if (process.env.NAMES_DUMP) {
	test("dump fallback names", () => {
		const seen = new Set<string>();
		const lines: string[] = [];
		for (const r of REGIONS) {
			for (const { position, domain } of lists[r]) {
				if (seen.has(domain)) continue;
				seen.add(domain);
				const site = siteOf({ url: "https://" + domain + "/" });
				if (site && !site.key.startsWith("known:")) lines.push(position + "\t" + domain + "\t" + site.name);
			}
		}
		console.log(lines.join("\n"));
	});
}
