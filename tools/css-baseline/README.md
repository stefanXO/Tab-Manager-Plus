# css-baseline — visual regression harness for the popup's CSS

Screenshots the **real** popup (the code in `src/popup`, the css in `css/`) in a
headless Chrome and pixel-compares two runs. It exists so a CSS refactor can be
proved to be a pixel no-op.

Nothing under `src/`, `css/` or the root html files is touched: the popup is
bundled against `fake-browser.js`, a stand-in for `webextension-polyfill` that
feeds it three windows / 23 tabs / two saved sessions from memory.

## Run it

```sh
# 1. record the baseline from the css that is on disk now
node tools/css-baseline/shoot.mjs tools/css-baseline/baseline

# 2. ... refactor the css ...

# 3. shoot again and compare
node tools/css-baseline/shoot.mjs /tmp/candidate
node tools/css-baseline/compare.mjs tools/css-baseline/baseline /tmp/candidate
```

On Windows `/tmp` does not exist — use any scratch path, e.g. `%TEMP%\candidate`
(cmd) or `$env:TEMP\candidate` (PowerShell).

npm shortcuts:

```sh
npm run css:baseline                      # -> tools/css-baseline/baseline
npm run css:compare -- /tmp/candidate     # compares baseline vs /tmp/candidate
```

`compare.mjs` exits **1** if any image differs by more than the tolerance, so it
drops straight into CI or a pre-merge check.

```sh
node tools/css-baseline/compare.mjs <baseline> <candidate> [--tolerance <pixels>]
```

`--tolerance` defaults to `0` (any differing pixel fails). Diff PNGs for every
mismatch are written to `<candidate>/diff/`.

`shoot.mjs` flags:

| flag | effect |
| --- | --- |
| `<outdir>` or `--out <dir>` | where the PNGs go |
| `--only <substring>` | shoot just the names containing it (e.g. `@z150`, `plain-vertical`) |
| `--keep` | do not wipe the output directory first |
| `--no-scales` | **default** — the 114-shot dpr-1 matrix only (the original 99 are byte-identical to before the scale axis and `options-switches` existed) |
| `--scales` | the dpr-1 matrix **plus** the scale axis |
| `--scales-only` | the scale axis only |
| `--ext-css` | emulate the stylesheet Chrome injects into every extension page (`body { font-family: "Segoe UI", Tahoma, sans-serif; font-size: 75% }` on Windows, unlayered, ahead of the page's sheets). Without it the harness is a plain web page and cannot show a body rule that loses to it — e.g. a body font inside an `@layer`. Also makes body 12px, as in the real popup |
| `--scrollbars` | classic scrollbars (drops puppeteer's `--hide-scrollbars`), so `overflow-y: scroll` boxes lose their 15px as on Windows |
| `--jobs <n>` | page loads run at once over the one shared browser (default `min(6, availableParallelism())`; `--jobs 1` shoots strictly one after the other). Each page load is its own browser context, so tasks are isolated; the 192-shot default matrix takes ~45 s at the default vs ~245 s with `--jobs 1`, and the two outputs are pixel-identical apart from the same 1–4 px anti-aliasing noise two sequential runs show |
| `--chrome` | bundle the popup as the Chrome build (`IS_FIREFOX=false`) instead of the default Firefox build; favicons then render icon-less (they resolve through `chrome-extension://`), so compare only `--chrome` runs with each other |

`--ext-css` and `--scrollbars` change every shot, so compare only runs shot
with the same flags (e.g. `after-b1b-ext/dpr1` vs `after-fix1-ext/dpr1`).

### Scale axis (browser zoom / OS display scale)

The popup was only ever checked at 100%. `--scales` / `--scales-only` add 180
shots, named like the dpr-1 ones plus an `@<scale>` suffix
(`plain-blocks-light-800x600@z125.png`), modelled on how Chrome scales an
extension popup:

| scale | kind | deviceScaleFactor | CSS viewport for the 800x600 popup |
| --- | --- | --- | --- |
| `z110` `z125` `z150` `z175` `z200` | browser zoom z | z | popup size / z (125% -> 640x480) |
| `os125` `os150` `os200` | OS display scale s | s | unchanged (800x600) |
| `os150z125` | both | 1.875 | / 1.25 (640x480) |

Covered per scale: `plain` in all 4 layouts, `search` / `dup` / `options` /
`options-switches` / `windowopts` in `blocks`, light + dark, at 800x600 — plus
380x900 at `z150` only (9 × 2 × 9 + 18 = 180). At `z150` only, also
`options-hover` and `page-changelog` (light + dark, 800x600 and 380x900: +8 =
188). `page-options` is not on the scale axis.

Limitation: Chrome caps a popup at 800x600 **DIP**, so at zoom > 100% the real
popup cannot grow to fit the app's 800 CSS px body. The harness just sets the
viewport to size / z; whatever does not fit overflows exactly as it would inside
the capped popup, but the harness cannot show how Chrome itself would size a
popup whose requested size is below the cap.

Determinism on the scale axis is slightly weaker than at dpr 1: re-shooting
gave 0 px on 30 of 32 `@z150` shots, with 13-14 stray anti-aliasing pixels on
two `options-*` shots, so compare scale runs with e.g. `--tolerance 50`. Also,
favicons are downsampled differently depending on which layouts the page has
already rendered, so a `--only` subset (which skips the earlier layouts) is not
pixel-comparable with a full run (1385 px on `plain-vertical-light-380x900@z150`).
Compare full runs against full runs.

The scale baseline lives in `tools/css-baseline/baseline-scale/` (gitignored):

```sh
node tools/css-baseline/shoot.mjs tools/css-baseline/baseline-scale --scales-only
```

### Before/after report

```sh
node tools/css-baseline/report.mjs <beforeDir> <afterDir> <outDir>
# e.g. after a css change:
node tools/css-baseline/shoot.mjs $TEMP/after-scale --scales-only
node tools/css-baseline/report.mjs tools/css-baseline/baseline-scale $TEMP/after-scale tools/css-baseline/report
```

For every PNG name in both dirs it writes `<outDir>/strips/<name>.png`, a
`before | after | diff` strip (diff = changed pixels magenta over a dimmed
before; differently sized pairs are padded to the larger size), plus
`report.json` (per image: `name`, `changedPixels`, `percent`, `width`/`height`,
`group`, the parsed axes, `strip`) and a static `index.html` grouped by
`<state> @ <scale>`: changed pairs as strips, unchanged pairs collapsed into a
"0 px" list, names found in only one dir listed as added / removed. It always
exits 0 — `compare.mjs` is the pass/fail gate. `tools/css-baseline/report/` and
`reports/` are gitignored.

## First-time setup

The harness drives Chrome through `puppeteer-core`, which downloads no browser,
so `npm install` (locally and in CI) stays small. `shoot.mjs` looks for Chrome in
this order:

1. `$CHROME_PATH`
2. a pinned build in `~/.cache/puppeteer/chrome/` (newest first)
3. the system Chrome in its usual install location

The system Chrome works but auto-updates, and text renders slightly differently
between Chrome versions (see "Chrome version" below). Take the baseline and the
compare with the same build. For results that stay put across updates, install a
pinned build once (about 435 MB):

```sh
npm install
npx @puppeteer/browsers install chrome@154.0.8037.57 --path ~/.cache/puppeteer
```

## What it captures

`shoot.mjs` first runs `build-app.mjs`, which **re-bundles the stylesheet from
`css/` (with the extension build's own esbuild options, `scripts/css.mjs`),
re-copies `images/`, `popup.html`, `options.html` and `changelog.html` from the
repo and re-bundles `src/popup` on every run**. The screenshots therefore always reflect the CSS
currently on disk — there is no stale copy to forget about.

114 PNGs, named `<state>-<layout>-<theme>-<width>.png`:

| axis | values |
| --- | --- |
| layout | `blocks`, `blocks-big`, `horizontal` (Rows), `vertical` (List) — set through the `layout` storage key the app reads |
| theme | `light`, `dark` — the `theme` storage key (and 6.x's boolean `dark`, so older commits shoot too), i.e. `<html data-theme="dark">` |
| width | `800x600` (popup default), `1100x700` (above the 1001px query), `380x900` (below the 540px query) |
| state | `plain`, `search` (`github` typed into `.searchBoxInput`), `dup` (Highlight Duplicates clicked), `options` (the wrench screen), `options-switches` (the wrench screen scrolled to the "Window style" box: its on/off switches), `options-advanced` (the wrench screen scrolled to the "Advanced settings" box: incognito / private windows, shortcut key, changelog; dpr 1 only), `options-hover` (the same as `options-switches`, with the real mouse moved onto the Compact mode switch and then onto its description text: the header shows that option's help text), `windowopts` (the window colour/name screen) |

- `plain` / `search` / `dup`: all 4 layouts × 2 themes × 3 widths = 72
- `options`, `options-switches`, `options-hover`: the options screen replaces the whole window
  container, so the layout underneath makes no difference — `blocks` only ×
  2 × 3 = 6 each. At `@z200` only the first switch (Dark mode) fits: on in
  dark, off in light
- `options-window`: the wrench screen scrolled to "Window settings" (Minimize inactive windows + its Firefox note; Chrome: "Show all monitors" on), `blocks` × 2 × 3, dpr 1 only. Chrome build only (`--chrome`): `options-window-monitors-off` (setting `showMonitors: "off"`: switch off although granted) and `options-window-denied` (fake permission not granted: `window.__fakeGranted = false`, read by `permissions.contains/request` in `fake-browser.js`)
- `recent`: "Highlight recently active tabs" clicked (the fixture's `lastAccessed`: 23 tabs, target 5, the 6 used within the hour), `blocks` + `vertical` × 2 themes × `800x600` + `380x900`, dpr 1 only
- `options-sessions` / `options-debug`: the wrench screen scrolled to "Session Management" (the export note for the fixture's two saved sessions) / "Export tabs for debugging" (its button row and the window/tab note), `blocks` × 2 × 3, dpr 1 only
- `windowopts`: takes the layout as a prop, so `blocks` + `vertical` × 2 × 3 = 12
- `tab-stats` / `window-stats`: the real mouse rests on a tab (`#tab-15`, the muted
  second Lofi tab: every line of the tab card, zoom from the fake `tabs.getZoom`) /
  on the title of Work (the window card opens anywhere on a window that is not
  a tab, under the pointer) until the stats card is open. `blocks` +
  `vertical` × 2 themes × `800x600` + `380x900`, dpr 1 only. The fixture
  tabs carry `lastAccessed` (first copy of every duplicate url the most recent,
  so Highlight Duplicates keeps the same originals), `openerTabId` and
  `mutedInfo.reason` for this
- `saved-window-stats` (+ `-s2`, `-max`, and Chrome build only `-monitors`): the mouse on a
  saved window's title, its card with the landing preview (where Restore would put it,
  `src/helpers/geometry.ts` `predictLanding`). The fixture's saved windows carry the bounds
  they were saved at ("Tax 2029" on the second monitor); `-max` stores "Conference reading"
  as maximized (`apply.savedInfo`)
- `saved-tabs-delete` (+ `-key`, `-all`, `-two`, `-undo`): deleting selected saved tabs
  (`src/popup/savedDelete.ts`): Ctrl+click tabs of a saved window, then the trash button
  (`-key`: the Delete key, via a `{key: 46}` entry in `apply.clicks`); `-all` selects every
  tab of "Tax 2029", so the window goes whole; `-two` takes tabs of both saved windows;
  `-undo` clicks Undo (`optional: true`: skipped when there is no such button, as before
  the step). The `-undo` shot equals the plain list
- `save-sel` (+ `-done`, `-none`): saving selected open tabs as a saved window
  (`src/helpers/sessions.ts`): Ctrl+click three tabs of "Work" and one of "Life", so the
  bottom bar's save-tabs button is lit; `-done` also clicks it (`optional: true`), so the new
  saved window is the first saved window (scrolled to it); `-none` has nothing selected (the
  button is dimmed)
- `saved-drag-over` (+ `saved-drag-drop`, `saved-drag-sel`): dragging saved tabs into an open
  window (`src/popup/savedDrag.ts`, `src/helpers/openTabs.ts`), through a
  `{drag: <source>, over: <target>, side?: 'before', drop?: true}` entry in `apply.clicks`
  (synthetic html5 drag events with a `DataTransfer`). `-over` holds the second tab of
  "Conference reading" over the third tab of "Research" (the drop marker); `-drop` drops it
  there; `-sel` Ctrl+clicks two saved tabs and drops the second in front of "Browser
  extension". The fake `runtime.sendMessage` answers `open_saved_tabs` with the worker's
  own `openTabsAt` over a fake `tabs.create`; since layouts and themes share one page, each
  drop first closes the tabs the shot before opened
- `saved-order-over` (+ `-drop`, `-noop`): reordering saved windows
  (`src/popup/sessionOrder.ts`) with the same `{drag, over, side, drop}` entry, the source
  being the card `#session-s2` itself (as a grab on its edge, not on a tab or an icon).
  `-over` holds "Tax 2029" over the left / top quarter of "Conference reading": the dragged
  card fades and the drop marker shows in the gap before the target (every layout, 800x600
  and 380x900); `-drop` drops it, so "Tax 2029" is listed first (the order is stored, so the
  page's later shots drop it where it already is); `-noop` holds "Conference reading" right
  before "Tax 2029", where it already is: no marker
- `saved-reorder-over` (+ `-drop`) and `saved-move-over` (+ `-drop`, `saved-move-card-over`,
  `saved-move-card-drop`, `saved-move-sel`): moving saved tabs (`src/popup/savedMove.ts`) with
  the same `{drag, over, side, drop}` entry. The tabs are picked by title
  (`.tab[data-hover^="…"]`), since a move renumbers the indexes the ids carry; the later
  shots on a page drop a tab where it already is (no change). `saved-reorder-*`: "Lofi beats"
  before "Tab (interface)" in "Conference reading" (blocks + List, 800x600 and 380x900);
  `saved-move-*`: "Inbox (3)" from "Tax 2029" before "react - npm" in "Conference reading"
  (same matrix); `-card-*`: "Hacker News" held over / dropped on the title of "Tax 2029"
  (the card is outlined; it goes at the end); `-sel`: Escape (clears what the run before
  left selected), Ctrl+click "Tab (interface)" and "react - npm", drop the second on "Tax
  2029": both move to its end and stay selected
- `fresh` / `fresh-compact`: the List view's freshness bars (`src/popup/freshness.ts`, drawn at the end of every List row from the fixture's `lastAccessed`, 0 min .. 14 days: all five levels) — `fresh` as `plain`, `fresh-compact` with the `compact` setting on. `vertical` × 2 themes × `800x600`, dpr 1 only
- `page-options-na-<theme>-<width>`: `options.html` standalone, 2 × 3 = 6
- `page-changelog-na-<theme>-<width>`: `changelog.html` standalone, 2 × 3 = 6.
  Unlike `page-options` (whose theme the harness forces onto `<html>`), the
  changelog gets the `dark` setting seeded into the fake storage and the boot
  cache before load and has to apply it itself, so a changelog that ignores the
  setting shows up light in its dark shot

**Deliberately skipped:** widths above 1500px are also not shot — the
1501/2001/2501/3001px `@media` steps in `css/layout/wide.css` are not covered; add another
entry to `WIDTHS` in `shoot.mjs` if a refactor touches them.

### Fixture states covered

`fake-browser.js` gives the CSS something to render for every tab chip/badge:
`pinned` (2 tabs), `discarded` / "Asleep" (4), `audible` / "Media" (1),
`audible + mutedInfo.muted` / "Muted" (2), `highlighted` (the active tab of each
window), duplicate URLs (3 pairs, so Highlight Duplicates has work to do), named
and coloured windows, and two saved sessions so the "Saved windows" section and
the session cards render.

## What makes it deterministic

Two consecutive runs produce **105/105 byte-identical images**. The things that
would otherwise drift, and how they are pinned:

- **`timeAgo` labels** — `fake-browser.js` freezes `Date.now()` to a fixed
  *absolute* instant (`2030-06-01T12:00:00Z`), not "now at load time". So window
  ages, "saved 2 days ago" and the `<time>` elements `changelog.js` fills from
  real release dates read the same today and next year.
- **The random header tip** — `TabManager` picks it with `Math.random()` on every
  render, so even a seeded *sequence* would drift when the number of renders
  changes. `Math.random` is replaced by a constant.
- **Animations** — the `animations` setting is `false` in the fake store, so the
  app renders with `#root.no-animations`; `prefers-reduced-motion: reduce` is
  emulated as well (nothing in `css/` reads it yet, but it costs nothing).
- **Hover** — the virtual mouse is never moved, except in `options-hover`
  (fixed coordinates taken from the laid-out page). Every other interaction is
  an in-page `element.click()`, so no `:hover` rule is entered.
- **Caret / focus** — `caret-color` is forced transparent by a stylesheet
  injected at shoot time, and `document.activeElement` is blurred before each
  shot.
- **Entrance classes** — `Tab` carries a transient `.enter` class for 800ms after
  mount, and switching layouts remounts every tile; the harness waits for
  `.tab.enter` to be gone, for `document.fonts.ready`, for every `<img>` to be
  `complete`, and for two animation frames before shooting.
- **Scroll** — `.window-container` scroll offsets are reset to 0 (the app
  scrolls to the active tab 250ms after mount).
- **State bleed** — one fresh page load per (width, state). Highlight Duplicates
  leaves its "Found 6 tabs with duplicates" message in the header bar, which is
  not a setting and is not undone by toggling it back off, so a state never
  inherits the page another state left behind.
- **Boot cache** — every page is opened in its own fresh
  `browser.createBrowserContext()` (closed right after), so the app's boot cache
  in `localStorage` cannot carry the previous page's dark/layout into the first
  frame.

### Chrome version

Text rasterisation is Chrome-version-specific, so a baseline is only comparable
against a run on the **same Chrome build** (this one was recorded on
`Chrome/154.0.8037.57`). A Chrome update, or switching between the pinned build
and the system Chrome, means re-recording the baseline. This is also why regenerating the baseline (see
below) beats committing it: both sides of the comparison then come from the same
machine and the same browser.

## The baseline is not committed

`tools/css-baseline/baseline/` is **5.7 MB** (99 PNGs) and is listed in
`tools/css-baseline/.gitignore`, along with the generated `app/` directory.
5.7 MB of binaries that churn on every Chrome upgrade does not belong in a git
history this size — regenerate it instead.

To get a baseline for the commit *before* a refactor, without stashing anything,
check that commit out in a worktree and shoot there:

```sh
# <ref> = the last commit before the refactor, e.g. HEAD~1 or a branch point
git worktree add ../tmp-css-base <ref>
cd ../tmp-css-base
npm ci && npx @puppeteer/browsers install chrome@154.0.8037.57 --path ~/.cache/puppeteer
node tools/css-baseline/shoot.mjs "$PWD/../css-baseline-ref"
cd -

node tools/css-baseline/shoot.mjs /tmp/candidate
node tools/css-baseline/compare.mjs ../css-baseline-ref /tmp/candidate

git worktree remove ../tmp-css-base
```

(That requires the harness itself to have been committed before the refactor
branch — commit `tools/css-baseline/` first, then start the refactor.)

## Files

| file | what it is |
| --- | --- |
| `shoot.mjs` | builds, serves, drives and screenshots the matrix |
| `compare.mjs` | pixel-compares two directories, writes diffs, exits 1 on any difference |
| `report.mjs` | before/after strips + `report.json` + `index.html` for two directories |
| `crop-zoom.mjs` | `node crop-zoom.mjs <in.png> <out.png> <x> <y> <w> <h> [factor]`: one region of a shot, nearest-neighbour zoomed, to judge small details pixel by pixel |
| `montage.mjs` | `node montage.mjs <out.png> <x> <y> <w> <h> <factor> <in.png>...`: the same region of several shots, zoomed, side by side (e.g. light / dark, before / after) |
| `pngdiff.mjs` | PNG read / diff / pad helpers shared by `compare.mjs` and `report.mjs` |
| `build-app.mjs` | bundles `src/popup` + the stylesheet from current `css/` + the html into `app/` |
| `serve.mjs` | static file server rooted at `app/` |
| `fake-browser.js` | the `webextension-polyfill` stand-in: demo windows, tabs, sessions, settings, frozen clock |
| `fetch-favicons.mjs` | downloads the favicons the fake tabs point at into `fav/` on first use (called by `build-app.mjs`); a failed download gets a colored placeholder for that run, so compare only runs made under the same conditions |
| `fav/` | downloaded favicon cache, gitignored (third-party logos, never committed) |
| `app/` | generated, gitignored |
| `baseline/` | generated, gitignored |
| `baseline-scale/` | generated (`--scales-only`), gitignored |
| `after-*/` | after-shots of a change (e.g. `after-b1/dpr1`, `after-b1/scale`), gitignored |
| `report/`, `reports/` | `report.mjs` output, gitignored |
