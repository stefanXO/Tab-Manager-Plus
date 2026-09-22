# Tab Manager Plus — Improvement Roadmap

Findings from a full code review (popup UI, MV3 service worker, helpers, build tooling), prioritized by impact. The biggest bugs are already addressed in separate PRs:

- **PR #268** — window names/colors lost across restarts (`checkWindow` Map bracket-access bug + cleanup fixes)
- **PR #269** — MV3 service worker lifecycle (previous-tab shortcut history in `storage.session`, `chrome.alarms` cleanup, synchronous listener registration, `windowAge` no longer wiped on every wake, awaited message handlers)
- **PR #270** — non-destructive, re-entrant localStorage migration
- **PR #271** — popup crash paths + `onMessage` race

Everything below is still open, ordered **P1** (small, low-risk correctness fixes) → **P4** (large modernization efforts).

Line numbers refer to `master` at the time of review and will drift as the PRs above merge.

---

## P1 — Remaining correctness bugs (small, low-risk)

| # | Issue | Where | Impact / suggested fix |
|---|-------|-------|------------------------|
| 1.1 | Search term starts as `undefined`: `tabSearchTerm += " " + tab.url` produces `"undefined https://…"` for title-less tabs, so searching "undefined" matches them | `src/popup/views/TabManager.tsx:971-974` | Initialize `tabSearchTerm = ""` |
| 1.2 | Impossible keycode range `e.keyCode >= 219 && e.keyCode <= 22` is always false — bracket/quote keys never focus the search box | `src/popup/views/TabManager.tsx:1074` | `<= 222` |
| 1.3 | Tab limit checks the wrong window: `tabs.query({currentWindow: true})` resolves against the last-focused window in a service worker, not the window the tab was added to | `src/service_worker/background/tabs.ts:129` | `tabs.query({windowId: tab.windowId})` |
| 1.4 | Read-modify-write races on `windowAge` / `windowNames` / `windowColors` / `windowHashes`: worker listeners, cleanup and the popup all `get → mutate → set` with awaits in between; concurrent writers lose updates | `background/windows.ts:232-237`, `background/tracking.ts`, `background/actions.ts:96-131` | Add an `update(key, fn)` per-key promise-chain mutex to `src/helpers/storage.ts` and route all read-modify-write sites through it |
| 1.5 | The popup saves settings with `storage.local.get(null)` → mutate → `set(everything)`, which can clobber any concurrent worker write to *any* key | `src/popup/views/TabManager.tsx:145-166` | Set only the specific keys that changed |
| 1.6 | ~13 fire-and-forget `runtime.sendMessage` calls without `.catch()` — "Receiving end does not exist" rejections whenever the popup is closed (very common for background window renames) | `background/actions.ts:104,119`, `background/tracking.ts:105`, `Window.tsx:605,607,718,740`, `Tab.tsx:154,159`, `TabManager.tsx` (several) | Append `.catch(() => {})` or a small `sendMessageSafe` helper |
| 1.7 | Three empty `catch (e) {}` blocks swallow every error in the window listeners | `background/windows.ts:261,271,283` | Log with `console.error` |
| 1.8 | `createWindowWithTabs` mutates its input (`tabs.shift()`) and crashes on an empty array (`firstTab.pinned`) | `background/windows.ts:21-29` | Guard empty input; operate on a copy |
| 1.9 | `updateWindowHash` awaits `browser.windows.get()` for a just-closed window with no catch, so the subsequent `refresh_windows` notification never sends | `background/actions.ts:125-131` | try/catch around the `windows.get` |
| 1.10 | 14 tab/window/storage listeners registered in `componentDidMount` with no `componentWillUnmount` — leaks on remount (long-lived "own tab" mode) | `src/popup/views/TabManager.tsx:587-622` | Store handler refs and remove them in `componentWillUnmount` |
| 1.11 | Favicon URL interpolated into CSS unescaped: `"url(" + favIcon + ")"` where the Firefox path uses page-controlled `tab.favIconUrl` | `src/popup/views/Tab.tsx:62,94,249` | Quote + escape (`url("…")`), reject `javascript:` schemes |
| 1.12 | Six `<a target="_blank">` links without `rel="noopener noreferrer"` | `src/popup/views/TabOptions.tsx:374-401` | Add the rel attribute |
| 1.13 | `openPopup` race: `setPopup("") ` immediately after `openPopup()` resolves (which is at *show*, not close) can race the popup's own load; `openPopup` also needs a user gesture and Chrome 127+, with no `.catch` | `src/service_worker/ui/open.ts:12-21` | Reset the popup URL from the popup itself (or on a delay), catch failures |
| 1.14 | Search placeholder tip calls `getTip()` → `Math.random()` on every render, so the tip flickers while typing | `src/popup/views/TabManager.tsx:464,1897-1910` | Pick the tip once in the constructor |
| 1.15 | Weak URL-set hash (`h*31+c` fold) means two windows with identical URL sets (e.g. two windows with one new tab each) collide, so a name/color can be transplanted onto the wrong window after restart | `src/helpers/utils.ts:35-43`, `background/windows.ts:310-325` | Include tab count / use a stronger hash, or require unique matches before transplanting |
| 1.16 | Incremental search narrows the candidate set based only on query length (`lastSearchLen`), so paste, mid-string edits or `or`/`and` queries search the wrong subset until cleared | `src/popup/views/TabManager.tsx:958-967` | Always search the full tab set (it is small); drop the length heuristic |
| 1.17 | `Session.close`/`Window.save` log `value` from a `.catch`-ed await that is `undefined` on error; triple-logging (`console.error(e); console.log(e); console.log(e.message)`) is copy-pasted ~5× | `Session.tsx:178-183`, `Window.tsx`, `background/windows.ts` | Consolidate into one error helper |
| 1.18 | `scrollTo` after session restore passes `WINDOW_ID_CURRENT` (`-2`), looking up `#window--2` — a no-op | `src/popup/views/Session.tsx:168` | Use the id of the newly created window (needs the restore message to return it) |

## P2 — Tooling & build

| # | Issue | Where | Impact / suggested fix |
|---|-------|-------|------------------------|
| 2.1 | `watch.mjs` is broken: missing `process.env.NODE_ENV` define → bundled React throws `process is not defined`; missing `src/popup/options.js` entry → stale options bundle | `watch.mjs:5-24` vs `build.mjs:11,27-37` | Extract one shared esbuild config used by both scripts |
| 2.2 | No lockfile: `.gitignore:8` ignores `package-lock.json`, so builds aren't reproducible and `npm audit`/Dependabot have no baseline. A fresh `npm install` today already picks up a newer `@types/webextension-polyfill` that fails `tsc` on master | `.gitignore` | Commit the lockfile |
| 2.3 | No CI: `.github/` contains only `FUNDING.yml`; nothing verifies `npm run build` on a clean checkout (which is how the stale `dist/` and broken watch script went unnoticed) | `.github/` | Add a workflow running `npm ci && npm run build` |
| 2.4 | Committed `dist/` is stale relative to `src/` (last "Update dist" commit predates later src changes), so loading the repo unpacked runs different code than the source shows | `dist/` | Either rebuild `dist` on every release commit (CI check) or stop committing it |
| 2.5 | No minification, and full source maps ship: `popup.js` is 405 KB unminified + 591 KB `.map` | `build.mjs` | `minify: true`, `sourcemap: false` (or external + stripped) for release |
| 2.6 | `tsconfig.json` has no `module`/`moduleResolution` (silently defaults to *Classic*, which doesn't look in `node_modules`), no `isolatedModules` (needed for esbuild's per-file transpile), no `esModuleInterop`; `strict`/`noImplicitAny` off | `tsconfig.json` | Add `module: esnext`, `moduleResolution: bundler`, `isolatedModules`, `esModuleInterop`; adopt `strict` incrementally |
| 2.7 | `react-jsx@^1.0.0` is an unrelated, abandoned 2014 package imported by nothing — a supply-chain liability | `package.json:38` | Remove |
| 2.8 | `@types/react@18` / `@types/react-dom@18` against a React **16.11** runtime: React-18-only APIs typecheck and crash at runtime | `package.json:27-28,36-37` | Pin `@types/react@^16` until the React upgrade (P4) |
| 2.9 | `webextension-polyfill` is a devDependency but ships in the runtime bundle; `crx3` appears unused by any tracked script; `"main": "index.js"` points at a nonexistent file; `"license": "ISC"` contradicts `LICENSE.md` (MPL-2.0) | `package.json` | Reclassify/remove/fix |
| 2.10 | No tests (`npm test` is the npm stub). The pure layer (`helpers/utils.ts`, `helpers/storage.ts`, `helpers/migrate.ts`, `hashcode`) is easily unit-testable | `package.json:10` | Add vitest + a small suite; run in CI |
| 2.11 | Version `6.0.0` is hardcoded independently in `package.json`, `manifest.json`, `manifest-firefox.json`, `readme.md` and `changelog.html` | — | Single source of truth + build-time injection or a release script check |
| 2.12 | Mixed BOMs (`tsconfig.json`, `src/popup/views/index.ts`, `src/service_worker/ui/open.ts`); `outDir: ts-built` is never used and not gitignored | — | Strip BOMs, gitignore `ts-built/` |

## P3 — Firefox build notes (informational)

The Firefox build script lives outside this repo, so these are findings to check against that script rather than changes made here:

- `manifest-firefox.json:22` references `vendor/babel-polyfill.js` (the `vendor/` directory was removed from the repo — commits `d8a7377`, `2c3c01f`) and `dist/background.js` (not produced by `build.mjs`, which emits `dist/service_worker/service_worker.js`). Whatever the external build script does, the manifest in *this* repo cannot load as-is.
- `browser.action` is `undefined` on Firefox MV2 — `webextension-polyfill` does **not** alias `browserAction` to `action`. Affected: `background/tabs.ts` badge calls, `ui/open.ts` (`setPopup`/`openPopup`/`onClicked`), and the feature-detect at `ui/context_menus.ts:16` (`!!browser.action.openPopup`), which itself throws before the `sidebarAction` check below it can run. A `const action = browser.action ?? browser.browserAction` shim would cover both.
- All 15 context-menu items use `contexts: ["action"]`; Firefox MV2 requires `"browser_action"`, so no menu is created there.
- `manifest-firefox.json` has no `browser_specific_settings.gecko.id` (required by AMO, and needed for stable identity across updates) and no `optional_permissions` for `system.display` (the popup queries for it but it can never be granted).
- Mozilla has deprecated MV2 on AMO — a migration to MV3 (`background.scripts` → event page or worker, `browser_action` → `action`) is on borrowed time.
- The `switch_to_previous_active_tab` storage.session mirroring and `chrome.alarms` cleanup added in PR #269 degrade gracefully on Firefox MV2 (in-memory array / plain timers on the persistent page), so those PRs are Firefox-neutral.

## P4 — Modernization (larger efforts)

| # | Effort | Notes |
|---|--------|-------|
| 4.1 | React 16 → 18/19 | `ReactDOM.render` (`popup.tsx:80`) is removed in React 19 → `createRoot`; unlocks concurrent features and current tooling; resolves the types mismatch (2.8) properly |
| 4.2 | Break up god components | `TabManager.tsx` is 1,935 lines (`checkKey` 302, `render` 301, `selectTo` 130, `search` 111); `Window.tsx` render is 345 lines of which ~158 are 25 copy-pasted color buttons (→ `COLORS.map(...)`); the same `<Window>` element is written twice for minimized/normal passes; the tab-walk loop in `checkKey` is pasted 4× |
| 4.3 | Immutable state | `selection`/`hiddenTabs`/`tabsbyid`/`windowsbyid` are mutated in place, papered over by 29 `forceUpdate()` calls and per-tab `setState` storms in `search`/`highlightDuplicates`; replacing collections via `setState(prev => …)` enables `PureComponent`/`memo` and removes whole classes of re-render bugs |
| 4.4 | Remove string refs & ref reach-ins | 27 string refs (removed in React 19); parent calls `setState` on child instances (`dirtyWindow`) and reaches two levels deep (`runTabUpdate`, `select`) — lift that state into props |
| 4.5 | `strict` TypeScript | Most handlers and all of `helpers/utils.ts` are implicitly `any`; the whitelist-`reduce`-then-cast in `createWindowWithSessionTabs` launders untrusted persisted data into typed APIs; convert `ICommand` to a discriminated union so the message layer is checked |
| 4.6 | CSS custom properties + `prefers-color-scheme` | `css/dark.css` is 152 hand-mirrored override lines with zero CSS variables anywhere; variables collapse it to a few `:root` overrides and enable automatic OS dark mode; also: `css/fun.css` is referenced by nothing, `changelog.html` has dark.css commented out, duplicate `.window.vertical`/`.icon.vertical` blocks in `popup.css` (877 lines, 55 `!important`s) |
| 4.7 | Dead code sweep | `TabOptionsFirefox.jsx` (400 lines, unreferenced, doesn't compile — kept for now at the maintainer's request pending the Firefox build review), `popup.tsx:49-60` dead `#root` block, `Session.maximize` commented-out body, unused helpers (`getLocalStorageStringMap`, `removeLocalStorage`, `isInViewport`), ~37 `console.log`s in `TabManager.tsx` (esbuild `drop: ['console']` for release) |
| 4.8 | Popup boot | `popup.tsx` retries `loadApp` via ten staggered `setTimeout`s up to 15s with a double-checked `window.loaded` flag — replace with a single deterministic entry point |
