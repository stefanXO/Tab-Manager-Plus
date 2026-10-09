"use strict";

// The perf overlay (src/popup/perfOverlay.ts) is for development builds only:
// the production popup bundle must not carry it. Built in memory with the
// real options of build.mjs. Run with: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import * as esbuild from "esbuild";
import { appOptions } from "../scripts/bundle.mjs";
import { PERF_MARKER } from "../src/popup/perfOverlay.ts";

async function popupBundle(dev : boolean) : Promise<string> {
	const o = { browser: "chrome" as const, dev, outDir: "build/test", version: "7.0.0", workerVersion: "test" };
	const r = await esbuild.build({ ...appOptions(o), entryPoints: { "popup/popup": "src/popup/popup.tsx" }, write: false, sourcemap: false, logLevel: "silent" });
	return r.outputFiles.filter((f) => f.path.endsWith(".js")).map((f) => f.text).join("\n");
}

test("the production popup bundle has no perf overlay", async () => {
	const code = await popupBundle(false);
	assert.ok(!code.includes(PERF_MARKER), "overlay marker found in the production bundle");
	assert.ok(!code.includes("longtask"), "overlay code found in the production bundle");
});

test("the development popup bundle has it", async () => {
	assert.ok((await popupBundle(true)).includes(PERF_MARKER));
});
