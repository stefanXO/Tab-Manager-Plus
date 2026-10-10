// Builds and packages the extension for the stores.
//
//   node scripts/package.mjs     (npm run release also type-checks first)
//
// Writes into release/:
//   tab-manager-plus-<version>.chrome.zip    upload to the Chrome Web Store (and Edge, Opera)
//   tab-manager-plus-<version>.chrome.crx    self-hosted install; only when a key is found
//   tab-manager-plus-<version>.firefox.zip   upload to addons.mozilla.org
//   tab-manager-plus-<version>.firefox.xpi   the same file under the .xpi name, for the
//                                             GitHub release; unsigned, so release Firefox
//                                             only loads it as a temporary add-on
//   tab-manager-plus-<version>.source.zip    the committed source (git archive HEAD),
//                                             for store reviewers that ask for it
//
// Each browser gets its own production build, since the browser is compiled in.
// build.mjs writes a complete extension folder per browser, so a store zip is
// simply the contents of build/<browser>/ - that folder is the truth about what
// ships, and nothing is listed twice here.
//
// The .crx is signed with the key from $CRX_KEY, else key.pem, else key.pem.bak.
// No key is ever generated: a new key would give the extension a new id.

import { copyFileSync, createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { execFileSync } from "node:child_process";
import yazl from "yazl";
import crx3 from "crx3";

const NAME = "tab-manager-plus";
const OUT = "release";

// a fixed timestamp keeps the zip identical for identical input
const MTIME = new Date("2000-01-01T00:00:00Z");

/** Every file under `path`, sorted, without source maps. */
function listFiles(path) {
	if (!statSync(path).isDirectory()) return [path];
	return readdirSync(path)
		.sort()
		.flatMap((name) => listFiles(join(path, name)))
		.filter((file) => !file.endsWith(".map"));
}

/** The manifest as the store gets it: without the development key. */
function storeManifest(dir) {
	// "key" pins the id of the unpacked build; the stores assign their own id
	// and the Chrome Web Store refuses a key that does not match the listing
	const { key, ...manifest } = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
	return Buffer.from(JSON.stringify(manifest, null, "\t") + "\n");
}

/** Zips the contents of `dir`, with its files at the root of the zip. */
function writeZip(dir, zipPath) {
	const files = listFiles(dir);
	const zip = new yazl.ZipFile();
	const options = { mtime: MTIME, compressionLevel: 9 };
	for (const file of files) {
		const name = relative(dir, file).split(sep).join("/");
		zip.addBuffer(name === "manifest.json" ? storeManifest(dir) : readFileSync(file), name, options);
	}
	zip.end();
	return new Promise((resolve, reject) => {
		zip.outputStream.pipe(createWriteStream(zipPath)).on("close", resolve).on("error", reject);
	}).then(() => console.log(`wrote ${zipPath} (${files.length} files)`));
}

function build(browser) {
	execFileSync(process.execPath, ["build.mjs", ...(browser === "firefox" ? ["--firefox"] : [])], { stdio: "inherit" });
	return join("build", browser);
}

function findKey() {
	return [process.env.CRX_KEY, "key.pem", "key.pem.bak"].find((path) => path && existsSync(path));
}

async function main() {
	const { version } = JSON.parse(readFileSync("package.json", "utf8"));
	const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
	if (manifest.version !== version) {
		console.error(`manifest.json is ${manifest.version}, package.json is ${version}; run \`npm run version\``);
		process.exit(1);
	}

	rmSync(OUT, { recursive: true, force: true });
	mkdirSync(OUT);
	const base = join(OUT, `${NAME}-${version}`);

	await writeZip(build("firefox"), `${base}.firefox.zip`);
	// TODO: ship a signed .xpi (AMO signs each approved version; web-ext sign can fetch it) so release Firefox installs it
	copyFileSync(`${base}.firefox.zip`, `${base}.firefox.xpi`);
	console.log(`wrote ${base}.firefox.xpi (unsigned copy of the .zip)`);

	const chrome = build("chrome");
	await writeZip(chrome, `${base}.chrome.zip`);

	const key = findKey();
	if (key) {
		// signs the zip written above, so both carry the exact same files
		await crx3(createReadStream(`${base}.chrome.zip`), { keyPath: key, crxPath: `${base}.chrome.crx` });
		console.log(`wrote ${base}.chrome.crx (signed with ${key})`);
	} else {
		console.log("no key.pem found, skipped the .crx");
	}

	execFileSync("git", ["archive", "--format=zip", "-o", `${base}.source.zip`, "HEAD"]);
	console.log(`wrote ${base}.source.zip (git HEAD)`);
}

await main();
