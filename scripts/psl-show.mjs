// Prints the Public Suffix List rules that src/popup/psl.ts carries, unpacked to
// full suffixes, as JSON on stdout.
//
//   npm run psl:show            every tld: { "<tld>": { "icann": [...], "private": [...] } }
//   npm run psl:show -- com     one tld:   { "icann": [...], "private": [...] }
//   npm run psl:show -- com uk  several tlds, keyed by tld
//
// Rules keep their "*." and "!" prefixes. Pipe to a file to keep it:
//   npm run psl:show -- jp > psl-jp.json

import { ICANN, PRIVATE } from "../src/popup/psl.ts";

const unpack = (packed, tld) => (packed[tld] || "").split(" ").filter(Boolean).map((rule) => rule + "." + tld).sort();
const forTld = (tld) => ({ icann: unpack(ICANN, tld), private: unpack(PRIVATE, tld) });

const wanted = process.argv.slice(2).map((t) => t.toLowerCase().replace(/^\./, ""));
const all = [...new Set([...Object.keys(ICANN), ...Object.keys(PRIVATE)])].sort();

let out;
if (wanted.length === 0) {
	out = Object.fromEntries(all.map((tld) => [tld, forTld(tld)]));
} else {
	const missing = wanted.filter((t) => !all.includes(t));
	if (missing.length) {
		console.error("no rules for: " + missing.join(", ") + " (a tld without multi-label rules is its own public suffix)");
		process.exitCode = 1;
	}
	const found = wanted.filter((t) => all.includes(t));
	out = found.length === 1 ? forTld(found[0]) : Object.fromEntries(found.map((tld) => [tld, forTld(tld)]));
}
process.stdout.write(JSON.stringify(out, null, "\t") + "\n");
