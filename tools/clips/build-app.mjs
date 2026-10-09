// Bundles the CURRENT working-folder popup (src/, css/, popup.html, images/, fonts/) against ./fake-browser.js
// (a copy of tools/css-baseline/fake-browser.js, see README) into ./app/ (gitignored). Nothing in the repo is written.
// Run: node tools/clips/build-app.mjs   (--firefox: the Firefox build; the Chrome build is the default: monitor map, shortcuts list)
import { cpSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { fetchFavicons } from "../store-shots/fetch-favicons.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const chrome = !process.argv.includes("--firefox");
const app = join(here, "app");
const esbuild = await import(pathToFileURL(join(repo, "node_modules", "esbuild", "lib", "main.js")).href);
const { cssOptions } = await import(pathToFileURL(join(repo, "scripts", "css.mjs")).href);

rmSync(app, { recursive: true, force: true });
mkdirSync(app, { recursive: true });
for (const f of ["popup.html", "images", "fonts"]) cpSync(join(repo, f), join(app, f), { recursive: true });
// the demo favicons the fake tabs point at (F("host") in fake-browser.js): third-party logos, cached in tools/store-shots/fav, never committed
const favs = [...new Set([...readFileSync(join(here, "fake-browser.js"), "utf8").matchAll(/\bF\("([^"]+)"\)/g)].map((m) => m[1] + ".png"))];
await fetchFavicons(join(app, "fav"), favs);
await esbuild.build({ ...cssOptions({ outfile: join(app, "css", "popup.css"), absWorkingDir: repo }), logLevel: "warning" });
await esbuild.build({
	absWorkingDir: repo,
	entryPoints: { "popup/early": "src/popup/early.ts", "popup/popup": "src/popup/popup.tsx" },
	outdir: join(app, "dist"),
	bundle: true,
	target: "chrome110",
	minify: true,
	alias: { "webextension-polyfill": join(here, "fake-browser.js") },
	define: {
		"process.env.VERSION": JSON.stringify("7.0.0"),
		"process.env.BROWSER": JSON.stringify(chrome ? "chrome" : "firefox"),
		"process.env.NODE_ENV": JSON.stringify("production"),
		REQUIRED_WORKER_VERSION: JSON.stringify("clips-worker"),
		IS_FIREFOX: String(!chrome),
		IS_CHROME: String(chrome),
	},
	logLevel: "warning",
});
console.log("built " + app);
