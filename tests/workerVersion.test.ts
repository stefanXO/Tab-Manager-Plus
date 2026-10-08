"use strict";

// The service worker's version (scripts/bundle.mjs): a hash of the built worker
// bundle, so it changes exactly when worker code, or code bundled into it,
// changes, and never on a plain rebuild or a change that only the popup sees.
// The bundles are built in memory with the real options of build.mjs; a "change"
// is a line a plugin appends to one source file while it is loaded, nothing on disk.
// Run with: npm test

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as esbuild from "esbuild";
import { workerOptions, appOptions, hashWorker, stampWorker, stampWorkerOutputs, versionLine } from "../scripts/bundle.mjs";
import { workerVersion } from "../src/helpers/workerVersion.ts";

type Browser = "chrome" | "firefox";
const base = { browser: "chrome" as Browser, dev: false, outDir: "build/test", version: "7.0.0" };
const PROBE = "(globalThis as any).__probe = 1;";

// appends `extra` to the source file at `suffix` as it is read by the bundler
function touch(suffix : string, extra : string) : esbuild.Plugin {
	return {
		name: "touch",
		setup(build) {
			build.onLoad({ filter: /\.(ts|tsx|js)$/ }, (args) => {
				if (!args.path.replaceAll("\\", "/").endsWith(suffix)) return undefined;
				const loader = args.path.endsWith("x") ? "tsx" : args.path.endsWith(".js") ? "js" : "ts";
				return { contents: readFileSync(args.path, "utf8") + "\n" + extra + "\n", loader };
			});
		}
	};
}

async function buildWorker(plugins : esbuild.Plugin[] = [], o = base) {
	return esbuild.build({ ...workerOptions(o), logLevel: "silent", plugins });
}
async function workerHash(plugins : esbuild.Plugin[] = [], o = base) : Promise<string> {
	return stampWorkerOutputs((await buildWorker(plugins, o)).outputFiles).version;
}

describe("the worker's version is a hash of its bundle", () => {
	test("two builds without a change give the same version", async () => {
		const a = await workerHash();
		const b = await workerHash();
		assert.match(a, /^[0-9a-f]{12}$/);
		assert.equal(a, b);
	});

	test("a change in a file only the worker uses changes it", async () => {
		const before = await workerHash();
		const after = await workerHash([touch("src/service_worker/background/tracking.ts", PROBE)]);
		assert.notEqual(after, before);
	});

	test("a change in a helper bundled into both the worker and the popup changes it", async () => {
		const before = await workerHash();
		const after = await workerHash([touch("src/helpers/geometry.ts", PROBE)]);
		assert.notEqual(after, before);
	});

	test("a change in a file only the popup uses does not", async () => {
		const before = await workerHash();
		for (const file of ["src/popup/notices.ts", "src/popup/views/TabManager.tsx", "src/popup/workerCheck.ts"]) {
			assert.equal(await workerHash([touch(file, PROBE)]), before, file);
		}
	});

	test("the version the popup requires is not in the worker bundle", async () => {
		const result = await buildWorker();
		assert.ok(!result.outputFiles[0].text.includes("REQUIRED_WORKER_VERSION"));
	});

	test("the other browser is its own bundle", async () => {
		const chrome = await workerHash();
		const firefox = await workerHash([], { ...base, browser: "firefox" });
		assert.notEqual(chrome, firefox);
	});

	test("a development build has its own version, stable too", async () => {
		const dev = { ...base, dev: true };
		assert.equal(await workerHash([], dev), await workerHash([], dev));
		assert.notEqual(await workerHash([], dev), await workerHash());
	});
});

describe("the written worker", () => {
	test("ends with the version line, and the version is the hash of the code without it", async () => {
		const result = await buildWorker();
		const raw = result.outputFiles[0];
		const { version, files } = stampWorkerOutputs(result.outputFiles);
		assert.equal(version, hashWorker(raw.contents));
		const written = files[0].contents as string;
		assert.ok(written.startsWith(raw.text));
		assert.equal(written.slice(raw.text.length).trim(), versionLine(version));
		assert.equal(versionLine("abc"), 'self.TMP_WORKER_VERSION="abc";');
	});

	test("the line goes in front of a source map comment, which stays the last line", () => {
		const code = "(()=>{})();\n//# sourceMappingURL=service_worker.js.map\n";
		assert.equal(stampWorker(code, "abc"), '(()=>{})();\nself.TMP_WORKER_VERSION="abc";\n//# sourceMappingURL=service_worker.js.map\n');
		assert.equal(stampWorker("(()=>{})();", "abc"), '(()=>{})();\nself.TMP_WORKER_VERSION="abc";\n');
	});

	test("a development build writes its map unchanged next to the stamped worker", async () => {
		const result = await buildWorker([], { ...base, dev: true });
		const { files } = stampWorkerOutputs(result.outputFiles);
		assert.equal(files.length, 2);
		const js = files.find((f) => f.path.endsWith(".js"))!.contents as string;
		assert.ok(js.trimEnd().endsWith("//# sourceMappingURL=service_worker.js.map"));
		assert.ok(js.includes('self.TMP_WORKER_VERSION="'));
	});

	test("the worker reports the stamped version, and an unstamped one reports none", () => {
		const g = globalThis as { TMP_WORKER_VERSION? : unknown };
		assert.equal(workerVersion(), "");
		g.TMP_WORKER_VERSION = "abc";
		try {
			assert.equal(workerVersion(), "abc");
		} finally {
			delete g.TMP_WORKER_VERSION;
		}
	});

	test("the popup bundle requires the version the worker was built with", async () => {
		const out = await esbuild.build({ ...appOptions({ ...base, workerVersion: "feedfacec0de" }), write: false, logLevel: "silent" });
		const popup = out.outputFiles.find((f) => f.path.replaceAll("\\", "/").endsWith("popup/popup.js"))!;
		assert.ok(popup.text.includes("feedfacec0de"));
	});
});
