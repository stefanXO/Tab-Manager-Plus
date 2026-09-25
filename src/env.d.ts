declare const process: { env: { VERSION: string; NODE_ENV: "development" | "production" | "test"; BROWSER: "chrome" | "firefox" } };

// Replaced by true/false at build time (build.mjs), so esbuild drops the other
// browser's branches: `if (IS_FIREFOX) { ... }` works like C#'s #if FIREFOX.
declare const IS_FIREFOX: boolean;
declare const IS_CHROME: boolean;
