// Regenerates the release list inside changelog.html from CHANGELOG.md, or
// verifies it is up to date with --check.
//
//   node scripts/changelog.mjs          write
//   node scripts/changelog.mjs --check  exit 1 if changelog.html is stale (CI)
//
// changelog.html carries markers around the generated region, inside the
// <div class="toggle-box"> that follows <h3>What's new</h3>:
//   <!-- CHANGELOG -->...generated...<!-- /CHANGELOG -->
// A missing marker is an error, so the file can never silently drift.

import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ISSUE_URL = "https://github.com/stefanXO/Tab-Manager-Plus/issues/";
const H = "\t\t\t\t\t\t"; // indentation for <h3>/<h4>/<ul>
const LI = "\t\t\t\t\t\t\t"; // indentation for <li>

const VERSION_RE = /^(\d+\.\d+\.\d+)(?: \((\d{4}-\d{2}-\d{2})\))?$/;
const UNDERLINE_RE = /^=+$/;

// ---- inline markdown -> html -------------------------------------------

export function escapeHtml(text) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function inlineHtml(text) {
	return text
		.split(/(`[^`]+`)/)
		.map((part) => {
			if (part.length >= 2 && part.startsWith("`") && part.endsWith("`")) {
				return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
			}
			return escapeHtml(part).replace(
				/#(\d{2,4})\b/g,
				(m, num) => `<a href="${ISSUE_URL}${num}" target="_blank" rel="noopener">#${num}</a>`,
			);
		})
		.join("");
}

// ---- markdown parsing ----------------------------------------------------

function parseBlocks(markdown) {
	const lines = markdown.replace(/\r\n/g, "\n").split("\n");

	const headings = [];
	for (let i = 0; i < lines.length - 1; i++) {
		const m = lines[i].match(VERSION_RE);
		if (m && UNDERLINE_RE.test(lines[i + 1])) {
			headings.push({ line: i, version: m[1], date: m[2] });
		}
	}

	return headings.map((h, k) => {
		const start = h.line + 2;
		const end = k + 1 < headings.length ? headings[k + 1].line : lines.length;
		return { version: h.version, date: h.date, groups: parseGroups(lines.slice(start, end)) };
	});
}

function parseGroups(contentLines) {
	const groups = [];
	let current = null;

	for (const raw of contentLines) {
		if (raw.trim() === "") continue; // blank lines are just separators, never meaningful

		if (/^\s/.test(raw)) {
			// continuation of the previous bullet's wrapped text
			if (current && current.bullets.length) {
				current.bullets[current.bullets.length - 1] += " " + raw.trim();
			}
			continue;
		}

		if (raw.startsWith("- ")) {
			if (!current) {
				current = { heading: null, bullets: [] };
				groups.push(current);
			}
			current.bullets.push(raw.slice(2).trim());
		} else {
			current = { heading: raw.trim(), bullets: [] };
			groups.push(current);
		}
	}

	return groups;
}

// ---- rendering -------------------------------------------------------------

const ONE_LINE = 140; // bullets up to this many visible characters are not wrapped
const WRAP = 80; // otherwise wrap at this many visible characters; tags don't count

function visibleLength(html) {
	return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/g, "_").length;
}

/** Word-wraps an html string at spaces outside tags, by visible length. */
export function wrapHtml(html, width = WRAP) {
	const words = html.match(/(?:<[^>]*>|[^\s<])+/g) ?? [];
	const lines = [];
	let line = "";
	for (const word of words) {
		if (line && visibleLength(line) + 1 + visibleLength(word) > width) {
			lines.push(line);
			line = word;
		} else {
			line = line ? `${line} ${word}` : word;
		}
	}
	if (line) lines.push(line);
	return lines;
}

// Trailing issue references: "(#12)", "(#12, #34)" or "#12 #34".
const TRAILING_ISSUES_RE = /\s+(\(#\d+(?:,\s*#\d+)*\)|#\d+(?:[\s,]+#\d+)*)$/;

// The text before any trailing issue links stays on one line up to ONE_LINE
// visible characters; a longer text wraps at WRAP, continuing one tab deeper.
// Trailing issue links stay inline if the whole bullet fits in WRAP, otherwise
// they go on their own line, followed by the closing </li> on its own line.
function renderBullet(bullet) {
	const m = bullet.match(TRAILING_ISSUES_RE);
	const html = inlineHtml(bullet);
	if (visibleLength(html) <= (m ? WRAP : ONE_LINE)) return `${LI}<li>${html}</li>`;

	const text = inlineHtml(m ? bullet.slice(0, m.index) : bullet);
	const lines = visibleLength(text) <= ONE_LINE ? [text] : wrapHtml(text);
	const [first, ...rest] = lines;
	const out = [`${LI}<li>${first}`, ...rest.map((l) => `${LI}\t${l}`)];
	if (m) out.push(`${LI}\t${inlineHtml(m[1])}`, `${LI}</li>`);
	else out[out.length - 1] += "</li>";
	return out.join("\n");
}

function renderBlock({ version, date, groups }) {
	const lines = [
		date
			? `${H}<h3>${version} <time datetime="${date}" title="${date}"></time></h3>`
			: `${H}<h3>${version}</h3>`,
	];

	for (const group of groups) {
		if (group.bullets.length === 0) continue; // empty groups produce nothing
		if (group.heading) lines.push(`${H}<h4>${inlineHtml(group.heading)}</h4>`);
		lines.push(`${H}<ul>`);
		for (const bullet of group.bullets) lines.push(renderBullet(bullet));
		lines.push(`${H}</ul>`);
	}

	return lines.join("\n");
}

/** Renders the html fragment that belongs between the CHANGELOG markers. */
export function renderChangelog(markdown) {
	const body = parseBlocks(markdown).map(renderBlock).join("\n\n");
	return `\n\n${body}\n\n`;
}

function countVersions(markdown) {
	return parseBlocks(markdown).length;
}

// ---- CLI ---------------------------------------------------------------

function main() {
	const check = process.argv.includes("--check");

	const markdown = readFileSync("CHANGELOG.md", "utf8");
	const html = readFileSync("changelog.html", "utf8");

	const markerRe = /<!-- CHANGELOG -->([\s\S]*?)<!-- \/CHANGELOG -->/;
	const match = html.match(markerRe);
	if (!match) {
		console.error(
			"changelog.html: no <!-- CHANGELOG --> ... <!-- /CHANGELOG --> markers found; " +
				"add them around the generated region inside the toggle-box div",
		);
		process.exit(1);
	}

	const inner = renderChangelog(markdown);
	const after = html.slice(0, match.index) + `<!-- CHANGELOG -->${inner}<!-- /CHANGELOG -->` + html.slice(match.index + match[0].length);

	if (check) {
		if (after !== html) {
			console.error("changelog.html: out of date, run `npm run changelog`");
			process.exit(1);
		}
		console.log("changelog.html up to date");
		return;
	}

	if (after === html) {
		console.log("changelog.html unchanged");
		return;
	}

	writeFileSync("changelog.html", after);
	console.log(`changelog.html: ${countVersions(markdown)} versions`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main();
}
