# 7.0.0 update page clips (2026-10-08)

Six short silent looping clips of the real Tab Manager Plus popup, one per section of the 7.0.0 changelog.
The popup is bundled from the **working folder** (`src/`, `css/`, `popup.html`, uncommitted work included) against a
fake browser, driven in its own headless Chrome (never the maintainer's browser, no port 9222, no real profile) with real
mouse, keyboard and CDP drag events, and a drawn cursor with the v4 click ripple. Nothing in the repo outside this folder is read
for writing or changed; everything generated goes to the gitignored `app/` and `out/`.

## Re-render (one command)

    npm run clips                              # build the popup, record all six clips, encode out/final/
    npm run clips -- info saved                # only some clips
    node tools/clips/render.mjs --list         # the clip names (no build, no Chrome)
    node tools/clips/render.mjs --no-build keys   # reuse app/

That is `build-app.mjs` (popup -> `app/`, Chrome build), `clips.mjs [names]` (frames -> `out/work/<name>/frames/*.png`,
`meta.json`) and `encode.mjs [names]` (frames -> `out/final/`, sheets); each can be run on its own from `tools/clips/`. About 4 minutes for all six. Needs Chrome
(found like `tools/css-baseline`: `CHROME_PATH`, then a pinned build in `~/.cache/puppeteer`, then the system Chrome), `ffmpeg` / `ffprobe`
(on PATH, or `FFMPEG=<path to ffmpeg>`, `FFPROBE` if ffprobe is not next to it), and `puppeteer-core` / `esbuild` from the repo's `node_modules`.

## Output

All six: **1280x960** (the popup at its natural 800x600 CSS size, rendered at scale 1.6, no resampling), 30 fps (24 fps where
the 600 KB webm budget needed it), no audio, light theme unless noted. In `out/final/`: `<name>.webm` (VP9, yuv420p), `<name>.mp4`
(H.264 main, CRF 27, faststart), `<name>.jpg` (poster). Frame strips: `sheet-<name>.png` (8 frames of the finished mp4),
`loop-<name>.png` (the last 3 frames, then the first 3, to check the loop point). `out/final/sizes.json` has the sizes.

| clip | s | shows |
|---|---|---|
| `look` | 9.4 | layout button Block -> Big Block -> Rows -> List (recency bars, playing / muted / asleep badges; scrolled down to the Life window), -> Block; header theme button Light -> Dark -> System -> Light with a smooth crossfade |
| `search` | 10.2 | List view: `react` (bold matches), `u:github`, ` -issues` appended, Esc; Highlight Duplicates (only the extra copies selected); the recent-tabs clock twice (two steps light up); Esc |
| `saved` | 11.6 | Rows view: 3 tabs Ctrl+clicked, "Save selected tabs" (new saved window on top), its name opens the name / colour screen, a colour is picked (it closes); two saved tabs Ctrl+clicked and dragged into the Life window (real drag, the "2 tabs" stack follows the pointer); `s:tax` selects the saved matches, Ctrl+Delete, the Undo notice, Ctrl+Z |
| `info` | 9.4 | hover card of a tab (the muted Lofi tab), the window card of Research with the monitor map (monitor 2 of 2), the bottom-bar trash button with 2 tabs selected: card with the Ctrl Del key caps |
| `options` | 9.8 | options screen: the Donate and Rate switch, Settings backup: Export Settings click, Import Settings with a prepared file (`out/work/settings-backup.json`, written by `clips.mjs`, real file chooser): grey notice "Settings imported: 1 setting changed (Count Tabs)" and the Count Tabs switch flips; then the keyboard shortcuts list; the options close |
| `keys` | 14.9 | the keyboard cursor, no mouse, Block view: Right x2 (the ring walks), Space ("Selected 1 tab"), Right x2, Space (2 selected), Shift+Right x2 (4 selected), Esc; `git` typed, Ctrl+Right x2 (the ring walks the matches, the text stays), Esc; Left (wraps to the last Research tab), Enter (switches to it: Research becomes the current window, its outline moves); Tab x2 (the header, then the focus ring on the Work window's star), Esc. Each key shown as a key cap bottom right |

## Pace

`clips.mjs` `PACE = 1.5`: the scripts keep their old (quick) timings and every duration is multiplied in the helpers
(`Recorder.wait / moveTo / fade`, `themeFade`, `typeText`, `scrollTo`, `Drag.to` read `rec.pace`), so a calmer or quicker cut is
one number. The click ripple and the key-cap hold are absolute. Budget per webm (`encode.mjs` `LIMIT`): 600 KB (was 400 KB
before the slower pace; the ladder stays CRF 34/36/38 at 30 fps, then 24 fps).

## Key caps (`keys`)

`lib.mjs` `key(rec, key, mods)` presses a real key (CDP) and shows it in an overlay drawn by the recorder page, outside the
popup DOM like the cursor: bottom right above the bottom bar, one cap per key joined by "+" ("→", "Space", "Shift + →",
"Ctrl + →", "Tab", "Esc"), styled like the popup's light-theme `<kbd>` (#f3f5f6 on white gradient, #cccccc border, a thicker
bottom edge, 8 px radius, 24-30 px type = 38-48 px in the video). In over 0.08 s, held 0.85 s, out over 0.3 s, pressed look
for 0.1 s; a new key replaces it at once. The script leaves >= 0.55 s after each press (0.85 s before a different key).

## Loops

`look`, `search`, `info`, `options` end in the state they start in (cursor hidden at both ends). `saved` cannot (a new saved window
and two dropped tabs stay): it records 0.4 s of untouched popup first and the last 0.4 s are cross-faded into them
(`loopFade` in `clips.mjs`, handled in `encode.mjs`), so the loop is a short dissolve (0.6 s at PACE 1.5). `keys` does the same
(its header keeps its last line and the focus moved).

## Files

- `render.mjs` (the one command), `build-app.mjs`, `clips.mjs` (one script per clip, timings in seconds), `lib.mjs` (server, Chrome, cursor, recorder, real
  drag helpers), `encode.mjs` (ffmpeg; size ladder 30 fps CRF 34/36/38, then 24 fps CRF 36..43 until <= 600 KB).
- `fake-browser.js`: **its own copy** of `tools/css-baseline/fake-browser.js` (not the one in `tools/store-shots/`, which is data-driven from
  `shots.json` and shows different tab states; this one keeps the css-baseline's pinned / sleeping / playing / muted tabs and its saved
  sessions, which the `look`, `info` and `saved` clips need) with: its import path, `runtime.getManifest` (Export
  Settings needs it), the "Tax 2029" saved tabs retitled so `s:tax` finds them, a `noAsleep` seed, and the worker's
  `focus_on_tab_and_window` (Enter on the keyboard cursor): the tab becomes its window's active tab, that window the focused one
  (`getCurrent` / `getLastFocused` follow), and `tabs.onActivated` / `windows.onFocusChanged` really fire. The harness page
  is not `?popup`, so the popup does not `window.close()` after switching.
- `build-app.mjs` reads esbuild / react from the repo's `node_modules`. Nothing is installed.
- Favicons: the demo icons are third-party logos and are not committed; `build-app.mjs` copies them into `app/fav/` from the shared cache
  `tools/store-shots/fav/` (filled from `tools/css-baseline/fav/` or downloaded on first use, a placeholder square if offline).
- `peek.mjs <name> [n t0 t1]` and `strip.mjs <name> [n from to out]` are debug helpers (they write `out/work/peek-<name>.png` and `out/final/sheet-<name>.png`).
- `app/`, `out/`: generated, gitignored.

## Harness quirks (so they are not rediscovered)

- With `deviceScaleFactor != 1` headless Chrome re-hovers (after layout changes) at pointer / dpr, so a wrong element gets
  :hover. The page therefore runs at dpr 1 and `page.screenshot({clip: {scale: 1.6}})` re-rasterises crisply.
- The Chrome build is used (monitor map in the window card, shortcuts list); its `chrome-extension://.../_favicon/` urls
  cannot load on a web page, so a MutationObserver rewrites them to `/fav/<host>.png`.
- Escape: the first press only closes an open hover card (StatsLayer), so the clips press it twice.
- Ctrl+Delete in a search box with text deletes a word: the clip presses Tab first (focus to the list), as the code intends.
- Hover cards are hidden (`.stats-card`) in the clips that are about something else; `info` shows them and hides them only
  while the pointer travels (`clip-moving`).
- The header's idle clear (TabManager.hoverIcon, `setTimeout(..., 15000)`) runs on wall-clock time, which the frame-by-frame
  recording stretches, so it fired at a random frame ("Tip:" line popping up). Every clip switches that one timeout off
  (`noHeaderTimeout`) and starts with a mouseover on the blank header (`headerIdle`, no "Tip:" line). In `keys` the same
  mouseover after each Esc stands in for the idle clear: in the popup itself Esc clears the selection but leaves "Selected N
  tabs" in the header until the pointer moves or 15 s pass.
- `keys`: the last Esc is followed by a script blur of the focused button (in the real popup Esc there closes the popup).
  The bottom-bar buttons come last in the Tab order (after every window's buttons), so Tab from the list reaches the header,
  then the first window's buttons.
- `encode.mjs` merges `out/final/sizes.json`: encoding some clips keeps the others' entries.
- Downloads (Export Settings) go to `out/work/dl/`, nothing lands in the user's Downloads.
- `out/work/<name>/frames` (PNG, ~120 MB) can be deleted after encoding; `npm run clips` recreates them.
