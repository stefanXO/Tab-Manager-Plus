// Single source of truth for the version is package.json. This script copies
// it into every file that repeats it, or verifies them with --check.
//
//   node scripts/sync-version.mjs          write
//   node scripts/sync-version.mjs --check  exit 1 if any file disagrees (CI)
//
// Text files carry explicit markers so nothing is matched by accident:
//   HTML / Markdown   <!-- VERSION -->6.0.1<!-- /VERSION -->
//   shell             CIRCLE_BUILD_NUM="6.0.1" # VERSION
// JSON manifests are parsed and rewritten, keeping their indentation.
// A missing marker is an error, so a file can never silently drift.

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const check = process.argv.includes("--check");
const { version } = JSON.parse(readFileSync("package.json", "utf8"));

const MARKER = /(<!-- VERSION -->)(.*?)(<!-- \/VERSION -->)/;
const SHELL = /^(\w+=")([^"]*)(".*# VERSION)$/m;

const targets = [
	{ file: "manifest.json", kind: "json" },
	{ file: "manifest-firefox.json", kind: "json" },
	{ file: "readme.md", kind: "marker" },
	{ file: "changelog.html", kind: "marker" },
	// gitignored release script; only touched when present
	{ file: "crxmake.sh", kind: "shell", optional: true },
];

let failed = false;

for (const { file, kind, optional } of targets) {
	if (!existsSync(file)) {
		if (optional) continue;
		console.error(`${file}: missing`);
		failed = true;
		continue;
	}
	const before = readFileSync(file, "utf8");
	let after, current;

	if (kind === "json") {
		const indent = before.match(/^(\t| +)"/m)?.[1] ?? "\t";
		const data = JSON.parse(before);
		current = data.version;
		data.version = version;
		after = JSON.stringify(data, null, indent) + (before.endsWith("\n") ? "\n" : "");
	} else {
		const re = kind === "shell" ? SHELL : MARKER;
		const m = before.match(re);
		if (!m) {
			console.error(`${file}: no VERSION marker found`);
			failed = true;
			continue;
		}
		current = m[2];
		after = before.replace(re, `$1${version}$3`);
	}

	if (current === version) continue;
	if (check) {
		console.error(`${file}: ${current} != ${version}`);
		failed = true;
	} else {
		writeFileSync(file, after);
		console.log(`${file}: ${current} -> ${version}`);
	}
}

if (failed) process.exit(1);
if (check) console.log(`all files at ${version}`);
