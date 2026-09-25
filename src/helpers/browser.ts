"use strict";

// Which browser this bundle is for: set at build time (build.mjs --firefox),
// so it is a constant and esbuild drops the other browser's code paths.
export const IS_FIREFOX : boolean = process.env.BROWSER === "firefox";
