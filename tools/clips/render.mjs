// node tools/clips/render.mjs [--list] [--no-build] [clip names...]
// Builds the popup from the working folder, records the clips, encodes out/final/ (no names = all six).
// Needs Chrome (CHROME_PATH overrides), ffmpeg (on PATH, or FFMPEG=<path>) and puppeteer-core from the repo's node_modules.
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));

const CLIPS = {
	look: "layout button Block -> Big Block -> Rows -> List, header theme button Light -> Dark -> System",
	search: "search (react, u:github, -issues), Highlight Duplicates, the recent-tabs clock twice",
	saved: "save selected tabs, name / colour screen, drag saved tabs into a window, s:tax, Ctrl+Delete, Undo",
	info: "tab hover card, window card with the monitor map, the trash button card with key caps",
	options: "Donate / Rate switch, Export / Import Settings, keyboard shortcuts list",
	keys: "the keyboard cursor: arrows, Space, Shift+arrows, Ctrl+arrows in a search, Enter switches, Tab, Esc",
};
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const names = args.filter((a) => !a.startsWith("--"));
for (const n of names) if (!CLIPS[n]) { console.error(`no clip "${n}" (have: ${Object.keys(CLIPS).join(", ")})`); process.exit(1); }
if (flag("--list") || flag("--dry-run")) {
	for (const n of names.length ? names : Object.keys(CLIPS)) console.log(n.padEnd(8), CLIPS[n]);
	console.log("\noutput: " + join(here, "out", "final") + " (<name>.webm, .mp4, .jpg, sheet-<name>.png, loop-<name>.png, sizes.json)");
	process.exit(0);
}
const run = (script, args = []) => execFileSync(process.execPath, [join(here, script), ...args], { cwd: here, stdio: "inherit" });
if (!flag("--no-build")) run("build-app.mjs");
run("clips.mjs", names);
run("encode.mjs", names);
