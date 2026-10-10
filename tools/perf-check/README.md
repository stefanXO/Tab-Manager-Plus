# perf-check: what a mouse move costs in the real action popup

```sh
node build.mjs                                 # build/chrome
npm run perf:check                             # ~40 s
node tools/perf-check/check.mjs --only tiles --layout blocks
node tools/perf-check/check.mjs --json perf.json --keep
node tools/perf-check/check.mjs --ext some/other/build
```

Exits 1 when a threshold is broken (2 when `build/chrome` is missing). Run it in the gate of
any change to `css/` or to the popup's frame (`popup.html`, `src/helpers/popup_size.ts`,
`css/layout/frame.css`, `css/popup.css`).

Flags: `--only tiles|buttons`, `--layout blocks|list`, `--json <file>` (the numbers per move and
the verdict), `--keep` (visible Chrome, left open), `--ext <dir>` (an unpacked build other than
`build/chrome`).

## Why

Chrome lays an extension's action popup out at 25 px wide first, on every frame that changes
anything (a hover included). A width query that matches at 25 px and not at the popup's own
width (an unguarded `@media (max-width: 540px)`), or `width: 100%` on the frame's fixed
parts, switches on and off twice per frame and restyles and lays out every tile each time. On
2026-10-09 that made a hover with 149 tabs take 0.5-3 s per frame (3 fps) in the popup, while
the same page in a tab was fine. It was fixed by the guard in `css/documentation.css`,
`--popup-width` (`src/helpers/popup_size.ts`) and `tests/popupWidthQueries.test.ts`; this check
catches a comeback that the CSS test does not see (a new query form, a new fixed part).

## What it does

Its own headless Chrome for Testing (newest under `~/.cache/puppeteer/chrome`, or
`CHROME_PATH`), a fresh profile, `build/chrome` installed unpacked. Fixture: 12 windows with 120
tabs (pages from a local server on 127.0.0.1, distinct titles), 10 saved windows with 60 saved
tabs (written to `storage.local` in the extension's own format), Blocks and List layout, dark
theme, animations on, popup size 800x600. Then, per layout:

1. opens the toolbar button's real popup (`chrome.action.openPopup()`), waits for the tiles
   and the entrance animations, and makes 40 mouse moves from tile to tile and 20 across the
   bottom action buttons, each followed by 60 ms; the deltas of `RecalcStyleCount`,
   `LayoutCount`, `RecalcStyleDuration` and `LayoutDuration` (CDP `Performance.getMetrics`) are
   taken per move;
2. does the same with the same build as a plain tab (`popup.html?popup`, 800x600).

No CPU throttle.

## Reading the table

```
mode    layout  part     moves  restyle med  p95   layout med  p95   restyle ms  layout ms
popup   blocks  tiles    40     50           71    34          49    4.89        1.28
tab     blocks  tiles    40     17           25    2           3     4.51        0.59
```

Per move: median and 95th percentile of the restyle and layout counts, and the median time
they took (ms). Measured 2026-10-09, healthy build (three runs, within a few percent):

| | restyles med | layouts med | restyle ms | layout ms |
|---|---|---|---|---|
| popup, Blocks, tiles | 50 | 34 | 4.4-4.9 | 1.2-1.3 |
| popup, Blocks, buttons | 14 | 9 | 0.8 | 0.4 |
| popup, List, tiles | 22 | 10 | 5.6-6.8 | 0.7 |
| popup, List, buttons | 18 | 14 | 0.8 | 0.5 |
| tab, Blocks, tiles | 17 | 2 | 4 | 0.5 |
| tab, List, tiles | 16 | 2 | 6-8 | 0.6 |

With the bug put back (`@media (max-width:540px){body{color:inherit}}` at the end of
`popup.css`): popup restyle 134-587 ms and layout 34-89 ms per move, tab unchanged.

**The counts do not show the bug; the times do.** With animations on, a hover runs the
transition's frames, each with several style and layout passes (the popup has the 25 px pass
too, so it counts more layouts than the tab even when healthy), and how many frames fit in a
move depends on how slow they are: the broken build has fewer counts (it draws fewer frames).
What the bug changes is what each pass costs. So:

- counts are runaway guards only: median restyles <= 100, layouts <= 70, p95 <= 150 / 100
  (about 2x the highest measured);
- times are the gate: median restyle time per move <= 40 ms and layout <= 15 ms (the healthy
  build is under 7 and 1.5), and the popup's median time <= 3x the same page as a tab (the
  tab counted as at least 2 ms restyle, 1.5 ms layout, so a quiet tab does not make the limit
  silly). The tab comparison is what carries over to a slower machine.

The thresholds are the constants at the top of `check.mjs`; `tests/perfCheck.test.ts` checks
they are numbers in sane bounds. Retune them from a run's table (and `--json`), never by
guessing.

## Notes

- Needs a Chrome for Testing (`npx @puppeteer/browsers install chrome@stable`); branded Chrome
  ignores unpacked extensions on the command line.
- The real popup needs a focused window: do not use the machine's mouse while it runs
  (the mouse is CDP-driven, so it is not affected, but a window opened over Chrome may be).
- It never connects to a running Chrome and never starts a visible browser (`--keep` starts one
  of its own).
