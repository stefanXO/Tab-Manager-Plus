# Store images (Tab Manager Plus 7.0)

Renders the Chrome Web Store screenshots and promo tiles from the **real popup** (bundled from the working folder against a
fake browser), framed with a headline, in headless Chrome. Everything a person tweaks (the fake windows and tabs, the saved
windows, every shot's headline, state and callouts, the tiles) is in [`shots.json`](shots.json).

## Regenerate

    npm run store:list                       # the plan: id, style, size, output file, what each shot does (no build, no Chrome)
    npm run store:shots                      # default: style B (the store pick): shots 0-5, 7-9, both promo tiles (1x and 2x), sheet-B.png
    npm run store:shots -- --only 2,4        # just some shots (ids as in --list; "small" and "marquee" are the tiles)
    npm run store:shots -- --style A         # style A (dark "brag" look): shots 1-6 and tiles; --style A,B for both
    npm run store:shots -- --only 6          # shot 6 (the Alt + Shift + M key caps) renders in B only when named
    npm run store:shots -- --tiles all       # the alternative promo tiles (chaos, purple, windows) into out/tiles-<name>/
    npm run store:shots -- --ring 4          # callout shots only (2, 3, 4) with 4 px ring padding into out/B-ring4/ + out/_ring-compare.png
    npm run store:shots -- --out some/dir    # write under another folder instead of tools/store-shots/out
    npm run store:shots -- --no-build        # reuse app/ instead of rebuilding the popup (default: rebuilt every run, so the shots always show the current src/ and css/)

Output goes to `tools/store-shots/out/` and the popup bundle to `tools/store-shots/app/`; both are gitignored. The images carry the
store names and sizes (`screenshot-<n>-1280x800.png`, `promo-small-440x280.png`, `promo-marquee-1400x560.png`, and `-2x` versions of the
tiles); at the end the script prints every PNG's size read from its header and checks it against the size in its name.

Needs Chrome (found like `tools/css-baseline`: `CHROME_PATH`, then a pinned build in `~/.cache/puppeteer`, then the system Chrome) and
`puppeteer-core` / `esbuild` from the repo's `node_modules`. The popup's theme is "system"; the page pins `prefers-color-scheme: light`
so the shots do not follow this PC's dark mode.

## Output

| File | Content |
|------|---------|
| `out/B/screenshot-0-1280x800.png` | Hero, no headline: large app icon + "Tab Manager Plus" + Alt Shift M key caps + "open it from any tab" left, overview popup right |
| `out/{A,B}/screenshot-1-...` | Overview, all three windows: "Every window. One view." |
| `out/{A,B}/screenshot-2-...` | **Highlight recently active tabs**: the clock clicked once, "New in 7.0" pill, ring + "Click the clock" tag on the clock button |
| `out/{A,B}/screenshot-3-...` | Search `react` in list view: bold hits (`b.search-hit`), tag "Type to search" right-aligned so it does not cover the npm row |
| `out/{A,B}/screenshot-4-...` | **Highlight Duplicates**: "Click to select duplicates" on the toolbar button, 3 duplicates selected |
| `out/{A,B}/screenshot-5-...` | "Light or dark? Up to you.": list view, dark theme |
| `out/A/screenshot-6-...` (B on request) | Default popup + Alt Shift M key caps |
| `out/B/screenshot-7-...` | "Four layouts. Light or dark.": four popups 2x2 (Block, Big Block, Rows, List), checkerboard of light and dark |
| `out/B/screenshot-8-...` | "Save windows for later. Restore them anywhere.": Rows view with two saved windows (dashed edge), three Life tabs Ctrl+clicked, callout "Save the selected tabs" |
| `out/B/screenshot-9-...` | "Keyboard first.": card left, key caps right, the keyboard cursor with a tag above it |
| `out/{A,B}/promo-small-440x280.png`, `promo-marquee-1400x560.png` | Promo tiles; B also at `-2x` (880x560, 2800x1120) |
| `out/sheet-{A,B}.png` | Contact sheets (640x400 per image) of a full run |
| `out/_hits-crop-*.png`, `_clock-crop-*.png`, `_search-crop-*.png`, `_dups-crop-*.png` | 1:1 crops of the callout shots (ring + tag + 30 px), to check the ring is concentric |

Style B "clean light" (light neutral gradient, headlines centered above the card) is the store pick and the default. Style A "brag"
(dark navy, like the update video) is kept behind `--style A`.

## Store images wanted (from TODO.md "Store images", 2026-10-09)

The wishes, as how-tos. Upload by copying the rendered file over the store name in `store/images/` (the store wants the size in the name).

- **Store screenshot 3 = Highlight Duplicates** (not saved windows): `npm run store:shots -- --only 4`, then copy
  `out/B/screenshot-4-1280x800.png` to `store/images/screenshot-3-1280x800.png`.
- **Store screenshot 4 = Highlight recently active tabs** (the clock, new in 7.0; not the keyboard cursor): `npm run store:shots -- --only 2`, then copy
  `out/B/screenshot-2-1280x800.png` to `store/images/screenshot-4-1280x800.png`. It has the "New in 7.0" pill and the callout "Click the clock".
- **Promo tiles with the nice background style**: the tiles of the current store set have the light gradient of **style B**. A regenerated set lost it
  when the default style was not B; style B is now the default, so `npm run store:shots -- --only small,marquee` gives them back
  (`out/B/promo-small-440x280.png`, `out/B/promo-marquee-1400x560.png`; the `-2x` files are the same layout at device scale 2).
  Compare with `store/images/promo-*.png` before replacing them. The alternative backgrounds are `--tiles chaos|purple|windows`.
- Saved windows (shot 8) and keyboard (shot 9) stay available in `out/B/` for later use.
- Check each result by eye; the tabs shown come from `shots.json`, the UI from the current `src/` and `css/`.

(The 2026-10-08 store set was `screenshot-1..5` = shots 0, 3, 8, 9, 7; the maintainer's wishes above change 3 and 4.)

## `shots.json`

Read in two places: `fake-browser.js` (windows, saved, settings; esbuild inlines the file into the popup bundle at build time) and
`shot.html` (shots, keycaps; fetched from the harness server at run time). The top-level `_comment` key is ignored.

| Key | Content |
|-----|---------|
| `settings` | the popup's stored settings (`layout`, `supportLinks: false` hides Donate / Rate, ...) |
| `windows[]` | `id`, `name`, `color` (`colorN`), `focused`, `lastActiveMinutes`, `tabs[]`: `title`, `url`, `favicon` (file in `fav/`, `<domain>.png`), `ageMinutes` (how long ago it was used: drives the clock / recent highlight), `active`, `pinned`, `discarded`, `audible`, `muted` (booleans, omit when false). Tab ids count 1.. through the windows in this order (`#tab-11` is the 11th tab) |
| `saved[]` | saved windows, only loaded for shots with `saved`: `id`, `name`, `color`, `ageDays`, `tabs[]` (`title`, `url`, `favicon`) |
| `keycaps` | the shortcut drawn as key caps |
| `shots[]` | see below |
| `tiles[]` | the alternative promo tiles: `id`, `html` (file here), `out` (folder under `out/`), `note`, `sizes` |

A **shot**: `id` (what `--only` takes), `file` (output name; the size `-WxH` and `-2x` are appended), `size` (`[1280,800]`, `[440,280]` or `[1400,560]`: the
store sizes, `tests/storeShots.test.ts` checks them), `frame`, `styles` (styles that render it by default), `onRequest` (styles that render it only
when named with `--only`), optional `A` / `B` objects whose keys override the shot's own for that style, and the content:

| Key | Content |
|-----|---------|
| `frame` | `card` (headline + sub-line + the popup), `hero` (icon + name left, popup right), `side` (small popup left, `keypanel` key caps right), `grid` (four popups, `grid[]`: `layout`, `caption`, `theme`), `tile` (promo tile) |
| `title`, `sub`, `pill` | headline, sub-line, the "New in 7.0" pill. In text, `{words}` are drawn in the accent colour and `\n` is a line break. `twoLine` shrinks a two-line headline |
| `heroName`, `hint` | text of the `hero` frame; `name`, `line` are the text of a `tile` (per style via `A` / `B`) |
| `keycaps` | draw the `keycaps` row (headline row of a card, below the name on a tile, under the name on the hero) |
| `layout`, `theme` | popup settings applied first: `blocks`, `blocks-big`, `horizontal`, `vertical`; `system`, `light`, `dark` |
| `recent` | click the clock (Highlight recent tabs) this many times |
| `duplicates` | click Highlight Duplicates |
| `query` | type this into the search box |
| `selections` | Ctrl+click these popup selectors (the "selections" of a shot) |
| `keys` | key presses on the tab list: `Left`, `Up`, `Right`, `Down`, `Space`, `Enter`, `Escape`, `Tab` (or a key code) |
| `callouts[]` | `selector` (in the popup), `text`, `align` (`center` / `right`), `ring` (false: tag only), `below` (tag under the target), `above` (popup selector: tag above that element, line down to the target) |
| `saved`, `popH` | load the popup with the saved windows; make the popup this tall (px) |
| `crop`, `hitsCrop` | also write 1:1 crops of the callout (`_<crop>-crop-<style>.png`) / of the search hits |
| `scales` | (in `A` / `B`) device scales to render, `[1,2]` also writes the `-2x` file |
| `script` | optional escape hatch, see below |

Order of a shot's steps: `layout`, 0.6 s, `theme`, `recent`, `duplicates`, `query`, `selections`, `keys`, `script`, 0.9 s to settle, then the `callouts`
are drawn (they sit in the page around the card, the popup DOM is untouched). Setting layout and theme together drops one of them, hence the pause.

### `script`

A string, the body of an async function with `TM`, `q` (querySelector in the popup), `sleep`, `frame` (the popup iframe) and `S` (the shot) in scope,
run after the declarative steps. No shot needs one today; use it for a step the keys cannot say, e.g.
`"script": "q('.icon.windowaction.theme').click(); await sleep(300);"`. If the same step turns up twice, give it a key in `shot.html` instead.

`TM` (in `shot.html`): `clickRecent(n)`, `duplicates()`, `search(text)`, `setting({layout, theme}, iframe?)`, `ctrlClick(...selectors)`, `keys(...names)`.

## Files

- `shoot.mjs`: the CLI (plan, server, Chrome, crops, contact sheets, size check). The three old `shoot-tile-*.mjs` scripts are merged into it as `--tiles`.
- `shot.html`: the page of one shot, `shot.html?shot=<id>&style=<A|B>`. The design constants (card positions, gradients, fonts) are in here; the content is in `shots.json`.
- `build-app.mjs`: bundles the repo popup into `app/` (also `node tools/store-shots/build-app.mjs`).
- `fake-browser.js`: the `webextension-polyfill` stand-in. Differs from `tools/css-baseline/fake-browser.js`: its content comes from `shots.json`, it has `supportLinks: false` (no
  Donate / Rate in the header), `sessionsFeature: true`, a `lastAccessed` per tab (the clock), saved windows with `?saved`, and answers the popup's `worker_version`
  message with the `REQUIRED_WORKER_VERSION` that `build-app.mjs` defines (otherwise the popup shows an "out of date" notice).
- `fetch-favicons.mjs`: fills `fav/` (also used by `tools/clips`). The icons are third-party logos and not committed: copied from `tools/css-baseline/fav/` when that exists,
  else downloaded from Google's favicon service on first use; offline, a coloured placeholder square is used for that run.
- `logo2.png`, `logo2.svg`: the logo for the B tiles. `logo2.png` is a 128 px raster of `tabmanagerlogo2.png` (no bigger source exists); `logo2.svg` is a hand-drawn vector of it
  (three 60x52 windows offset 17,19, colours sampled from the PNG). The marquee and every 2x tile use the SVG, the 1x small tile the PNG at 1:1.
- `interfont-old.css`: the "interfont" face (base64) of the approved creative; `build-app.mjs` prepends it to the popup's own Noto Sans faces as `app/font.css`, which the frames and
  tiles use for their text. Kept (141 KB) so the headline type does not change.
- `tile-chaos.html`, `tile-purple.html`, `tile-windows.html`: the three alternative tile designs (`--tiles`); their text is in the files, not in `shots.json`.

## Checks

`node --test tests/storeShots.test.ts` (also part of `npm test`) validates the shape of `shots.json`: unique shot ids, sizes among the store's 1280x800 / 440x280 /
1400x560, every favicon a `<domain>.png` matching its tab's host (and present in the favicon cache once a shoot has filled it), every url parseable, selections and callouts well formed.
