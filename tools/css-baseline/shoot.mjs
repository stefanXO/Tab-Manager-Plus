// shoot.mjs <outdir> [--only <substring>] [--keep] [--scales | --scales-only | --no-scales] [--ext-css] [--scrollbars] [--chrome] [--jobs <n>]
//
//   <outdir> / --out <dir>  where the PNGs go (wiped first unless --keep)
//   --only <substring>      shoot only the names containing it
//   --keep                  do not wipe the output directory first
//   --no-scales             (default) the dpr-1 matrix only, exactly as before
//   --scales                the dpr-1 matrix plus the scale axis (SCALES below)
//   --scales-only           the scale axis only
//   --ext-css               emulate the stylesheet Chrome injects into every
//                           extension page (see EXT_CSS below); off by default
//   --scrollbars            classic (non-overlay) scrollbars, as Chrome on
//                           Windows draws them; off by default (puppeteer
//                           launches with --hide-scrollbars)
//   --chrome                bundle the popup as the Chrome build (see README)
//   --jobs <n>              page loads run at once over the one shared browser
//                           (default min(6, availableParallelism); 1 = strictly
//                           one after the other)
//
// Rebuilds tools/css-baseline/app from the CSS that is on disk right now, serves
// it, and screenshots a fixed matrix of the REAL popup in headless Chrome.
//
// Everything that could drift between two runs is pinned:
//   * Date.now() is frozen to a fixed absolute instant in fake-browser.js, so
//     every "x ago" label (window age, saved-session age, changelog <time>) is
//     constant forever, not just within a run.
//   * Math.random() is seeded in fake-browser.js.
//   * animations: false in the fake store -> the app renders with
//     #root.no-animations, and prefers-reduced-motion: reduce is emulated too.
//   * Fixed viewport, fixed deviceScaleFactor (1, or the scale's), srgb colour
//     profile, no font hinting.
//   * Every page gets its own fresh browser context, so the app's boot cache in
//     localStorage cannot carry the previous page's theme/layout into the first
//     frame. The same isolation is what makes --jobs safe: one task is one
//     page load (one size x state[, scale], or one standalone page) in its own
//     context, with its own viewport, media emulation, init scripts and
//     virtual mouse, so tasks share nothing but the browser process and run
//     through a small concurrency pool. Output names do not depend on order.
//   * The virtual mouse is never moved, except in `options-hover`: every other
//     interaction is an in-page element.click(), so no :hover state is entered.
//   * activeElement is blurred and caret-color is forced transparent before each
//     shot, so no text caret is caught half-blinked.
//   * Before every shot we wait for fonts, for every <img> to be complete, for
//     the transient .tab.enter class to clear, and for two animation frames.
//
// Output file names: <state>-<layout>-<theme>-<width>.png, and for the scale
// axis <state>-<layout>-<theme>-<width>@<scale>.png (e.g. @z125, @os150).
import {mkdirSync, rmSync} from 'node:fs'
import {availableParallelism} from 'node:os'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {buildApp} from './build-app.mjs'
import {serve} from './serve.mjs'

const here = dirname(fileURLToPath(import.meta.url))

const USAGE = 'usage: node tools/css-baseline/shoot.mjs <outdir> [--only <substring>] [--keep] [--scales | --scales-only | --no-scales] [--ext-css] [--scrollbars] [--chrome] [--jobs <n>]'
const argv = process.argv.slice(2)
let outArg = null, only = null, keep = false, scaleMode = 'none', extCss = false, scrollbars = false, chrome = false
let jobs = Math.min(6, availableParallelism())
for (let i = 0; i < argv.length; i++) {
	const a = argv[i]
	if (a === '--only') only = argv[++i]
	else if (a === '--out') outArg = argv[++i]
	else if (a === '--keep') keep = true
	else if (a === '--scales') scaleMode = 'both'
	else if (a === '--scales-only') scaleMode = 'only'
	else if (a === '--no-scales') scaleMode = 'none'
	else if (a === '--ext-css') extCss = true
	else if (a === '--scrollbars') scrollbars = true
	else if (a === '--chrome') chrome = true
	else if (a === '--jobs') {
		jobs = Number(argv[++i])
		if (!Number.isInteger(jobs) || jobs < 1) { console.error('--jobs needs a positive integer\n' + USAGE); process.exit(2) }
	}
	else if (a.startsWith('--')) { console.error('unknown flag ' + a + '\n' + USAGE); process.exit(2) }
	else if (!outArg) outArg = a
}
if (!outArg) {
	console.error(USAGE)
	process.exit(2)
}
const OUT = resolve(outArg)

// ---------------------------------------------------------------- the matrix
const WIDTHS = [
	{name: '800x600', w: 800, h: 600},   // the popup's own default size
	{name: '1100x700', w: 1100, h: 700}, // above the 1001px breakpoint
	{name: '380x900', w: 380, h: 900},   // below the 540px breakpoint (sidebar)
]
const THEMES = ['light', 'dark']
const LAYOUTS = ['blocks', 'blocks-big', 'horizontal', 'vertical']

/**
 * A popup state. `layouts` limits which layouts it is shot in at dpr 1,
 * `scaleLayouts` which layouts it is shot in on the scale axis.
 */
const STATES = [
	{name: 'plain', layouts: LAYOUTS, scaleLayouts: LAYOUTS, apply: {}},
	{name: 'search', layouts: LAYOUTS, scaleLayouts: ['blocks'], apply: {search: 'github'}},
	{name: 'dup', layouts: LAYOUTS, scaleLayouts: ['blocks'], apply: {dup: true}},
	// a search that hits inside title words ("redirect", "Request", "React",
	// "reddit"): the List view shows the matched parts in bold. dpr 1, List only
	{name: 'search-title', layouts: ['vertical'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {search: 're'}},
	// "Highlight recently active tabs" clicked (the fixture's lastAccessed: 6
	// tabs within the hour). dpr 1, blocks + List, 800x600 and 380x900 only
	{name: 'recent', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {recent: 1}},
	// its second and third click (recent: the level, 0..3)
	{name: 'recent2', layouts: ['blocks'], scaleLayouts: [], widths: ['800x600'], apply: {recent: 2}},
	{name: 'recent3', layouts: ['blocks'], scaleLayouts: [], widths: ['800x600'], apply: {recent: 3}},
	// the options screen replaces the whole window container, so the layout
	// underneath it makes no difference: one layout is enough
	{name: 'options', layouts: ['blocks'], scaleLayouts: ['blocks'], apply: {overlay: 'options'}},
	// the same screen scrolled to the "Popup size" box (width and height side by
	// side when the options box is wide enough, stacked when it is narrow)
	{name: 'options-popupsize', layouts: ['blocks'], scaleLayouts: [], apply: {overlay: 'options', scrollTo: 'Popup size'}},
	// the same screen scrolled to the "Window style" box, whose switches sit
	// below the fold of `options`: dark (on in the dark theme), compact (off),
	// animations (off) and window titles (on), so both switch states show
	{name: 'options-switches', layouts: ['blocks'], scaleLayouts: ['blocks'], apply: {overlay: 'options', scrollTo: 'Window style'}},
	// the same screen scrolled to the "Advanced settings" box (incognito /
	// private windows, shortcut key, changelog links); dpr 1 only
	{name: 'options-advanced', layouts: ['blocks'], scaleLayouts: ['blocks'], scales: ['z150'], apply: {overlay: 'options', scrollTo: 'Advanced settings'}},
	// the same box with the `compact` setting on (shortcut list in compact mode); also at z150
	{name: 'options-advanced-compact', layouts: ['blocks'], scaleLayouts: ['blocks'], scales: ['z150'], apply: {overlay: 'options', scrollTo: 'Advanced settings', store: {compact: true}}},
	// the same screen scrolled to the "Window settings" box: "Minimize inactive
	// windows" (its Firefox note) and, in the Chrome build, "Show all monitors":
	// on (fake permission granted, setting "unset" -> "on"), off when the
	// setting is "off", off when the permission is not granted. dpr 1 only
	{name: 'options-window', layouts: ['blocks'], scaleLayouts: [], apply: {overlay: 'options', scrollTo: 'Window settings'}},
	{name: 'options-window-monitors-off', chromeOnly: true, layouts: ['blocks'], scaleLayouts: [], apply: {overlay: 'options', scrollTo: 'Window settings', store: {showMonitors: 'off'}}},
	{name: 'options-window-denied', chromeOnly: true, layouts: ['blocks'], scaleLayouts: [], apply: {overlay: 'options', scrollTo: 'Window settings', store: {showMonitors: 'unset'}, granted: false}},
	// the same screen scrolled to the "Session Management" box (export/import
	// with the fixture's two saved sessions) and to the "Export tabs for
	// debugging" box (its two buttons and the window/tab count). dpr 1 only
	{name: 'options-sessions', layouts: ['blocks'], scaleLayouts: [], apply: {overlay: 'options', scrollTo: 'Session Management'}},
	// no saved windows: Export/Backup Sessions is disabled, its note says why
	{name: 'options-sessions-empty', layouts: ['blocks'], scaleLayouts: [], apply: {overlay: 'options', scrollTo: 'Session Management', store: {sessions: {}}}},
	// importing a backup with one good window, one without tabs and one without
	// an id: the note under the picker says what was restored and skipped
	{name: 'options-sessions-imported', layouts: ['blocks'], scaleLayouts: [], apply: {overlay: 'options', scrollTo: 'Session Management', importFile: JSON.stringify([
		{id: 'imp1', name: 'Imported', color: '#888', date: 1, sessionStartTime: 1, customName: false, incognito: false, windowsInfo: {id: 1}, tabs: [{id: 1, index: 0, url: 'https://example.com', title: 'Example'}]},
		{id: 'imp2', windowsInfo: {id: 2}, tabs: []},
		{windowsInfo: {id: 3}, tabs: [{id: 1, index: 0, url: 'https://example.org'}]}])}},
	{name: 'options-sessions-badimport', layouts: ['blocks'], scaleLayouts: [], apply: {overlay: 'options', scrollTo: 'Session Management', importFile: '{"a":1}'}},
	{name: 'options-debug', layouts: ['blocks'], scaleLayouts: [], apply: {overlay: 'options', scrollTo: 'Export tabs for debugging'}},
	// the window colour/name screen does take the layout as a prop
	{name: 'windowopts', layouts: ['blocks', 'vertical'], scaleLayouts: ['blocks'], apply: {overlay: 'colors'}},
	// the same screen opened on the saved window "Conference reading" (its
	// colour action), empty and with a name typed; then the card after the
	// name was typed and a colour picked (src/popup/sessionEdit.ts)
	{name: 'saved-opts', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {overlay: 'session-colors'}},
	{name: 'saved-opts-typed', layouts: ['blocks'], scaleLayouts: [], widths: ['800x600'], apply: {overlay: 'session-colors', typeName: 'Q3 conference notes'}},
	{name: 'saved-renamed', layouts: ['blocks', 'vertical', 'horizontal', 'blocks-big'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {overlay: 'session-colors', typeName: 'Q3 conference notes', pickColor: 'color9', scrollInto: '#session-s1'}},
	// the "Window style" box with the real mouse on it: over the Compact mode
	// switch (which shows its help text in the header), then onto that option's
	// description text. The only state that moves the mouse, so :hover applies.
	// On the scale axis only at `scales`.
	{name: 'options-hover', layouts: ['blocks'], scaleLayouts: ['blocks'], scales: ['z150'], apply: {overlay: 'options', scrollTo: 'Window style'}, hover: 'Compact mode'},
	// the stats cards: the real mouse rests on a tab (the muted second Lofi tab
	// in "Life": every line of the tab card) / on the title of "Work" (the
	// window card opens anywhere on a window that is not a tab, under the
	// pointer) until the card is open. dpr 1, 800x600 and 380x900 only
	{name: 'tab-stats', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {}, stats: '#tab-15'},
	// the same card for a tab of a saved window (src/popup/stats.ts savedTabStats):
	// the pinned Hacker News tab of "Conference reading" (open twice in Research),
	// its Wikipedia tab (open once), the unopened react tab, and an open tab that
	// is also saved ("Also saved in"). dpr 1, 800x600 and 380x900 only
	{name: 'saved-tab-stats', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {}, stats: '#sessiontab_s1_0'},
	{name: 'saved-tab-stats-wiki', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600'], apply: {}, stats: '#sessiontab_s1_1'},
	{name: 'saved-tab-stats-s2', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600'], apply: {}, stats: '#sessiontab_s2_2'},
	{name: 'tab-stats-saved', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {}, stats: '#tab-19'},
	{name: 'window-stats', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {}, stats: '#window-101 .windowTitle'},
	// the saved window's card (src/popup/stats.ts savedWindowStats) with its
	// landing preview (helpers/geometry.ts predictLanding), the mouse on the
	// title: "Conference reading" (saved at 0,0 1600x900: lands as saved),
	// "Tax 2029" (saved on the second monitor: the default Firefox build knows
	// only the popup's monitor, so it is moved onto it), "Conference reading"
	// saved maximized (fills the popup's monitor), and, Chrome build only
	// (--chrome, every monitor known), "Tax 2029" landing on monitor 2 of 2.
	// dpr 1
	{name: 'saved-window-stats', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {}, stats: '#session-s1 .windowTitle'},
	{name: 'saved-window-stats-s2', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600'], apply: {}, stats: '#session-s2 .windowTitle'},
	{name: 'saved-window-stats-max', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600'], apply: {savedInfo: {id: 's1', info: {state: 'maximized'}}}, stats: '#session-s1 .windowTitle'},
	{name: 'saved-window-stats-monitors', chromeOnly: true, layouts: ['blocks'], scaleLayouts: [], widths: ['800x600'], apply: {}, stats: '#session-s2 .windowTitle'},
	// the List view's freshness bars (src/popup/freshness.ts; every List view
	// shot has them, the fixture's lastAccessed spans 0 min .. 14 days), here
	// also in compact mode. dpr 1, 800x600 only
	{name: 'fresh', layouts: ['vertical'], scaleLayouts: [], widths: ['800x600'], apply: {}},
	{name: 'fresh-compact', layouts: ['vertical'], scaleLayouts: [], widths: ['800x600'], apply: {store: {compact: true}}},
	// selecting saved tabs (src/popup/sessionKeys.ts): Ctrl+click the muted Lofi
	// tab in "Life", then Ctrl+click the second tab of the saved window
	// "Conference reading" and Shift+right-click its fourth. A saved tab clears
	// the open-tab selection; the range stays inside the saved window. The saved
	// windows are scrolled into view. dpr 1, blocks + List, 800x600 and 380x900
	{name: 'saved-select', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {
		clicks: [{sel: '#tab-15', ctrl: true}, {sel: '#sessiontab_s1_1', ctrl: true}, {sel: '#sessiontab_s1_3', shift: true, button: 2}],
		scrollInto: '#session-s1'}},
	// deleting saved windows (src/popup/pendingDelete.ts): the card is hidden at
	// once and the Undo notice shows over the bottom bar. The clock is frozen
	// after the click so the countdown reads 8s and the bar is full. One delete
	// (blocks + List, 800x600 and 380x900), then a second one on top of it: the
	// notice names both. dpr 1
	{name: 'saved-delete', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {
		clicks: [{sel: '#session-s1 .icon.tabaction.delete'}], freezeClock: true, scrollEnd: true}},
	{name: 'saved-delete-two', layouts: ['blocks'], scaleLayouts: [], widths: ['800x600'], apply: {
		clicks: [{sel: '#session-s1 .icon.tabaction.delete'}, {sel: '#session-s2 .icon.tabaction.delete'}], freezeClock: true}},
	// deleting selected saved tabs (src/popup/savedDelete.ts): Ctrl+click two tabs
	// of "Conference reading", then the trash button; the tabs are hidden at once
	// and the Undo notice names them. The clock is frozen as for saved-delete.
	// dpr 1, blocks + List, 800x600 and 380x900
	{name: 'saved-tabs-delete', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {
		clicks: [{sel: '#sessiontab_s1_1', ctrl: true}, {sel: '#sessiontab_s1_3', ctrl: true}, {sel: '.icon.windowaction.trash'}],
		freezeClock: true, scrollInto: '#session-s1'}},
	// the same with the Delete key instead of the button
	{name: 'saved-tabs-delete-key', layouts: ['blocks'], scaleLayouts: [], widths: ['800x600'], apply: {
		clicks: [{sel: '#sessiontab_s1_0', ctrl: true}, {key: 46}], freezeClock: true, scrollInto: '#session-s1'}},
	// every tab of "Tax 2029" selected (Ctrl+click the first, Shift+right-click
	// the last) and deleted: the saved window goes with them
	{name: 'saved-tabs-delete-all', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {
		clicks: [{sel: '#sessiontab_s2_0', ctrl: true}, {sel: '#sessiontab_s2_2', shift: true, button: 2}, {sel: '.icon.windowaction.trash'}],
		freezeClock: true, scrollEnd: true}},
	// tabs of both saved windows at once
	{name: 'saved-tabs-delete-two', layouts: ['blocks'], scaleLayouts: [], widths: ['800x600'], apply: {
		clicks: [{sel: '#sessiontab_s1_2', ctrl: true}, {sel: '#sessiontab_s2_1', ctrl: true}, {sel: '#sessiontab_s2_2', ctrl: true}, {sel: '.icon.windowaction.trash'}],
		freezeClock: true, scrollEnd: true}},
	// tabs deleted, then Undo clicked: everything is back
	{name: 'saved-tabs-undo', layouts: ['blocks'], scaleLayouts: [], widths: ['800x600'], apply: {
		clicks: [{sel: '#sessiontab_s1_1', ctrl: true}, {sel: '.icon.windowaction.trash'}, {sel: '.undo-button', optional: true}], scrollInto: '#session-s1'}},
	// saving selected open tabs as a saved window (src/helpers/sessions.ts):
	// Ctrl+click three tabs of "Work" and one of "Life", so the bottom bar shows
	// its "Save selected tabs" button lit. dpr 1, blocks + List, 800x600 and 380x900
	{name: 'save-sel', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {
		clicks: [{sel: '#tab-2', ctrl: true}, {sel: '#tab-4', ctrl: true}, {sel: '#tab-6', ctrl: true}, {sel: '#tab-11', ctrl: true}]}},
	// the same, then the button clicked: a new saved window named from its sites
	// is in the saved windows (scrolled to the end), the selection is cleared
	{name: 'save-sel-done', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {
		clicks: [{sel: '#tab-2', ctrl: true}, {sel: '#tab-4', ctrl: true}, {sel: '#tab-6', ctrl: true}, {sel: '#tab-11', ctrl: true}, {sel: '.icon.windowaction.save-tabs', optional: true}],
		scrollEnd: true}},
	// nothing selected: the button is dimmed
	{name: 'save-sel-none', layouts: ['blocks'], scaleLayouts: [], widths: ['800x600', '380x900'], apply: {}},
	// a saved window that was the focused window when it was saved (its stored
	// windowsInfo says focused, with the id of the focused open window "Work"):
	// it must not look like the active window. dpr 1, blocks + List, 800x600
	{name: 'saved-focused', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600'], apply: {savedFocused: 's1', scrollInto: '#session-s1'}},
	// the foot of the window list: the last open window above the "Saved
	// windows" divider and both saved windows under it, to compare how the two
	// kinds of card look (css/components/session.css). dpr 1, every layout,
	// 800x600 and 380x900
	{name: 'saved-look', layouts: LAYOUTS, scaleLayouts: [], widths: ['800x600', '380x900'], apply: {scrollEnd: true}},
	// searching with saved windows (src/popup/searchSaved.ts): "google" matches
	// open tabs and two tabs of "Tax 2029"; "Conference reading" has none, so its
	// tabs fade. The saved windows are scrolled into view. dpr 1, every layout,
	// 800x600 and 380x900
	{name: 'search-saved', layouts: LAYOUTS, scaleLayouts: [], widths: ['800x600', '380x900'], apply: {search: 'google', scrollEnd: true}},
	// the same with "Hide non-matching tabs" on: "react" leaves one tab of
	// "Conference reading" and hides "Tax 2029" (and the rest of the card)
	{name: 'search-saved-hide', layouts: LAYOUTS, scaleLayouts: [], widths: ['800x600', '380x900'], apply: {search: 'react', store: {'filter-tabs': true}, scrollEnd: true}},
	// hide on, nothing saved matches: the "Saved windows" divider goes too
	{name: 'search-saved-none', layouts: ['blocks'], scaleLayouts: [], widths: ['800x600'], apply: {search: 'github', store: {'filter-tabs': true}, scrollEnd: true}},
	// Highlight Duplicates with saved windows around: they are not part of it
	{name: 'dup-saved', layouts: ['blocks', 'vertical'], scaleLayouts: [], widths: ['800x600'], apply: {dup: true, scrollEnd: true}},
]

/**
 * The scale axis, modelled on how Chrome scales an extension popup.
 *   Browser zoom z:     deviceScaleFactor = z, CSS viewport = popup size / z
 *                       (the 800x600 popup at 125% lays out in 640x480 CSS px).
 *   OS display scale s: deviceScaleFactor = s, CSS viewport unchanged.
 * Both combine multiplicatively. What this cannot emulate: Chrome caps a popup
 * at 800x600 DIP, so at zoom > 100% the real popup cannot grow to fit the app's
 * 800 CSS px body. Here the viewport simply is size / z, and anything wider
 * than that overflows as it would inside the capped popup.
 *
 * Every scale is shot at 800x600; `narrow` adds 380x900 too.
 */
const SCALES = [
	{name: 'z110', os: 1, zoom: 1.1},
	{name: 'z125', os: 1, zoom: 1.25},
	{name: 'z150', os: 1, zoom: 1.5, narrow: true},
	{name: 'z175', os: 1, zoom: 1.75},
	{name: 'z200', os: 1, zoom: 2},
	{name: 'os125', os: 1.25, zoom: 1},
	{name: 'os150', os: 1.5, zoom: 1},
	{name: 'os200', os: 2, zoom: 1},
	{name: 'os150z125', os: 1.5, zoom: 1.25},
]
const DPR1 = {name: '', os: 1, zoom: 1}

/**
 * Standalone pages from the same build. `ownTheme`: the theme is not forced
 * onto the page; the `theme` setting (and 6.x's `dark`; storage + the localStorage boot cache) is
 * seeded before load and the page has to apply it itself, so a page that
 * ignores the setting shows up as light in its dark shot. `scales`: also shot
 * at these scales (800x600 and, where the scale has `narrow`, 380x900).
 */
const PAGES = [
	{name: 'page-options', url: 'options.html', themes: THEMES},
	{name: 'page-changelog', url: 'changelog.html', themes: THEMES, ownTheme: true, scales: ['z150']},
]

// ------------------------------------------------------------------ browser
async function launch() {
	const puppeteer = (await import('puppeteer-core')).default
	const {existsSync, readdirSync} = await import('node:fs')
	const {homedir} = await import('node:os')
	// a pinned build from `npx @puppeteer/browsers install chrome@<version>`
	// (see README) wins over the system Chrome, which auto-updates
	const pinned = join(homedir(), '.cache', 'puppeteer', 'chrome')
	const pinnedExe = existsSync(pinned) ? readdirSync(pinned).sort().reverse().map((d) => [
		join(pinned, d, 'chrome-win64', 'chrome.exe'),
		join(pinned, d, 'chrome-linux64', 'chrome'),
		join(pinned, d, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
		join(pinned, d, 'chrome-mac-x64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
	]).flat() : []
	const candidates = [
		process.env.CHROME_PATH,
		...pinnedExe,
		'C:/Program Files/Google/Chrome/Application/chrome.exe',
		'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
		'/usr/bin/google-chrome',
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
	].filter(Boolean)
	const executablePath = candidates.find((p) => existsSync(p))
	if (!executablePath) throw new Error('no Chrome found; install Chrome, set CHROME_PATH, or see README "First-time setup"')
	return await puppeteer.launch({headless: true, executablePath, args: BROWSER_ARGS, ...LAUNCH_EXTRA})
}
const BROWSER_ARGS = ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text', '--disable-features=PaintHolding']
// --scrollbars: puppeteer adds --hide-scrollbars by default, which leaves the
// page with no scrollbar at all (not even an overlay one), so the width a
// classic Windows scrollbar takes from `overflow-y: scroll` boxes is never seen
const LAUNCH_EXTRA = scrollbars ? {ignoreDefaultArgs: ['--hide-scrollbars']} : {}

// --ext-css: Chrome injects this stylesheet into every extension page (popup,
// options, changelog), ahead of the page's own sheets and unlayered. It is read
// off a real popup through CDP (CSS.getMatchedStylesForNode, origin
// "injected"); the family is the platform's UI font, this is the Windows one.
// Being unlayered it beats every rule in an @layer, so a body font that lives
// in a layer loses to it - which a plain web page (this harness without the
// flag) never shows. Prepended to <head>, so the page's unlayered rules still
// win by order, as they do over the real injected sheet.
const EXT_CSS = 'body{font-family:"Segoe UI",Tahoma,sans-serif;font-size:75%}'

// ------------------------------------------------------------------ helpers
const KILL_CARET = '*,*::before,*::after{caret-color:transparent !important}'

/** Resolves once nothing on the page is still settling. */
async function settle(page) {
	await page.evaluate(() => document.fonts.ready)
	await page.waitForFunction(
		() => Array.from(document.images).every((i) => i.complete) && !document.querySelector('.tab.enter'),
		{timeout: 20000, polling: 50},
	)
	await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
	await new Promise((r) => setTimeout(r, 120))
}

/** Applies a popup state absolutely: the result never depends on what came before. */
async function apply(page, {layout, dark, search = '', dup = false, recent = 0, overlay = null, scrollTo = null, store = {}, granted = true, savedFocused = null, clicks = [], scrollInto = null, importFile = null, freezeClock = false, scrollEnd = false, typeName = null, pickColor = null, savedInfo = null}) {
	await page.evaluate(async (s) => {
		const q = (sel) => document.querySelector(sel)
		const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

		// 0. an Undo notice from the state before: unfreeze the clock, take it back
		if (window.__realNow) { Date.now = window.__realNow; window.__realNow = null }
		q('.undo-notice .undo-button')?.click()
		await frame()

		// 1. close whatever overlay is up, so the window container is reachable
		if (q('.window-colors')) { q('.window-colors h2.window-x')?.click(); await frame() }
		if (q('.options-window')) { q('.icon.windowaction.options')?.click(); await frame() }

		// 2. layout + theme (+ a state's own settings) through the same storage
		// the app reads; the fake system.display permission
		window.__fakeGranted = s.granted
		await window.__fake.storage.local.set({...s.store, layout: s.layout, dark: s.dark, theme: s.dark ? 'dark' : 'light', animations: false})
		await frame()

		// 3. search text, through a real input event
		const input = q('.searchBoxInput')
		if (input && input.value !== s.search) {
			Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, s.search)
			input.dispatchEvent(new Event('input', {bubbles: true}))
			await frame()
		}

		// 4. Highlight Duplicates is live state, not a setting: toggle the button
		const dupBtn = q('.icon.windowaction.duplicates')
		if (dupBtn && dupBtn.classList.contains('enabled') !== s.dup) { dupBtn.click(); await frame() }
		const recentBtn = q('.icon.windowaction.recent')
		// older builds: an on/off button without data-level
		const level = () => +(q('.icon.windowaction.recent')?.dataset.level ?? (q('.icon.windowaction.recent.enabled') ? 1 : 0))
		for (let i = 0; recentBtn && level() !== s.recent && i < 4; i++) { q('.icon.windowaction.recent').click(); await frame() }

		// 5. open the requested overlay
		if (s.overlay === 'options') { q('.icon.windowaction.options')?.click(); await frame() }
		if (s.overlay === 'colors') { q('.icon.tabaction.colors')?.click(); await frame() }
		// the same screen on the saved window "Conference reading"
		if (s.overlay === 'session-colors') { q('#session-s1 .icon.tabaction.colors')?.click(); await frame() }
		// a name typed into it, a colour picked (which writes and closes it)
		if (s.typeName !== null) {
			const input = q('.window-name-input')
			if (!input) throw new Error('no .window-name-input')
			Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, s.typeName)
			input.dispatchEvent(new Event('input', {bubbles: true}))
			await new Promise((r) => setTimeout(r, 450))
			await frame()
		}
		if (s.pickColor) {
			const sw = q('.colors-box .icon.' + s.pickColor)
			if (!sw) throw new Error('no colour ' + s.pickColor)
			sw.click()
			await frame()
		}

		// 6. no scroll offset, no focus ring, no caret
		document.querySelectorAll('.window-container, #root').forEach((e) => { e.scrollTop = 0; e.scrollLeft = 0 })
		document.documentElement.scrollTop = 0
		if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur()

		// 7. a saved window stored as the focused window, with the id of the
		// focused open window (the first in windowAge)
		if (s.savedFocused) {
			const {sessions, windowAge} = await window.__fake.storage.local.get(['sessions', 'windowAge'])
			const info = sessions[s.savedFocused].windowsInfo
			Object.assign(info, {focused: true, id: windowAge[0]})
			await window.__fake.storage.local.set({sessions})
			await frame()
		}
		// 7b. a saved window's stored windowsInfo changed (its state, bounds)
		if (s.savedInfo) {
			const {sessions} = await window.__fake.storage.local.get(['sessions'])
			Object.assign(sessions[s.savedInfo.id].windowsInfo, s.savedInfo.info)
			await window.__fake.storage.local.set({sessions})
			await frame()
		}

		// 8. clicks with modifiers, as the user makes them: a left click is a
		// click event, any other button a mousedown (Tab.tsx onMouseDown)
		for (const c of s.clicks) {
			if (c.key) {
				// a key press on the list, as the root's onKeyDown sees it
				q('#root').dispatchEvent(new KeyboardEvent('keydown', {bubbles: true, cancelable: true, keyCode: c.key, which: c.key}))
				await frame()
				continue
			}
			const el = q(c.sel)
			if (!el && c.optional) continue
			if (!el) throw new Error('nothing to click at ' + c.sel)
			const init = {bubbles: true, cancelable: true, button: c.button || 0, ctrlKey: !!c.ctrl, shiftKey: !!c.shift}
			el.dispatchEvent(new MouseEvent(c.button ? 'mousedown' : 'click', init))
			await frame()
		}
		// 9. a backup file chosen in the options' session import (needs overlay options)
		if (s.importFile) {
			const input = q('#session_import')
			if (!input) throw new Error('no #session_import')
			const dt = new DataTransfer()
			dt.items.add(new File([s.importFile], 'backup.json', {type: 'application/json'}))
			input.files = dt.files
			input.dispatchEvent(new Event('change', {bubbles: true}))
			for (let i = 0; i < 20; i++) await frame()
		}
		// 10. a still countdown: Date.now stops where it is (the notice reads it)
		if (s.freezeClock) {
			await frame()
			const t = Date.now()
			window.__realNow = Date.now
			Date.now = () => t
			await frame()
		}
		if (s.scrollInto) q(s.scrollInto)?.scrollIntoView({block: 'nearest', inline: 'nearest'})
		// the list scrolled to its very end: the padding the notice makes room with shows
		if (s.scrollEnd) { const c = q('.window-container'); if (c) c.scrollTop = c.scrollHeight }
	}, {layout, dark, search, dup, recent, overlay, store, granted, savedFocused, clicks, scrollInto, importFile, freezeClock, scrollEnd, typeName, pickColor, savedInfo})
	await settle(page)
	// 7. scroll the options box headed `scrollTo` to the top of its scroller
	if (scrollTo) {
		await page.evaluate((title) => {
			const h = Array.from(document.querySelectorAll('.optionsBox h4')).find((e) => e.textContent.trim() === title)
			if (!h) throw new Error('no options box headed ' + JSON.stringify(title))
			h.closest('.optionsBox').scrollIntoView({block: 'start', inline: 'nearest'})
		}, scrollTo)
		await settle(page)
	}
	// blur again: React may have re-focused the root while re-rendering
	await page.evaluate(() => { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur() })
}

/**
 * Moves the real mouse onto the switch of the option labelled `label`, then in
 * small steps down onto that option's description text and around inside it.
 */
async function hoverOption(page, label) {
	const at = await page.evaluate((label) => {
		const box = Array.from(document.querySelectorAll('.toggle-box')).find((b) => b.querySelector(':scope > .textlabel')?.textContent.trim() === label)
		if (!box) throw new Error('no option labelled ' + JSON.stringify(label))
		const c = (el) => { const r = el.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height} }
		return {sw: c(box.querySelector('.toggle')), desc: c(box.querySelector('.option-description'))}
	}, label)
	await page.mouse.move(1, 1)
	await page.mouse.move(at.sw.x, at.sw.y, {steps: 4})
	await settle(page)
	await page.mouse.move(at.desc.x - at.desc.w / 4, at.desc.y, {steps: 8})
	await page.mouse.move(at.desc.x + at.desc.w / 4, at.desc.y - at.desc.h / 4, {steps: 8})
	await settle(page)
	await page.evaluate(() => { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur() })
}

/**
 * Moves the real mouse onto `selector` and keeps it there until the stats card
 * is open (and its async zoom line, for a tab, has arrived). False when the
 * element is not shown at all (the age label at the narrow width).
 */
async function hoverStats(page, selector) {
	const at = await page.evaluate((sel) => {
		const el = document.querySelector(sel)
		if (!el || el.offsetParent === null) return null
		el.scrollIntoView({block: 'nearest', inline: 'nearest'})
		const r = el.getBoundingClientRect()
		return {x: r.left + Math.min(r.width / 2, 20), y: r.top + r.height / 2}
	}, selector)
	if (!at) return false
	await page.mouse.move(1, 1)
	await page.waitForFunction(() => !document.querySelector('.stats-card.shown'), {timeout: 5000})
	await page.mouse.move(at.x, at.y, {steps: 4})
	await page.waitForSelector('.stats-card.shown', {timeout: 5000})
	// the async zoom line: only some tabs have one
	if (selector.startsWith('#tab-')) await page.waitForSelector('.stats-card .stats-line-zoom', {timeout: 1500}).catch(() => {})
	await settle(page)
	await page.evaluate(() => { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur() })
	return true
}

// --------------------------------------------------------------------- main
console.log('building app from the current css...')
await buildApp({chrome})

if (!keep) rmSync(OUT, {recursive: true, force: true})
mkdirSync(OUT, {recursive: true})

const {server, origin} = await serve()
const browser = await launch()
console.log('chrome:', await browser.version() + (extCss ? ' +ext-css' : '') + (scrollbars ? ' +scrollbars' : '') + (chrome ? ' +chrome-build' : ''))

let shot = 0, skipped = []
const want = (name) => !only || name.includes(only)

/** A fresh page in its own browser context; dispose of it with closePage(). */
async function newPage(size, scale = DPR1, seed = null) {
	const context = await browser.createBrowserContext()
	const page = await context.newPage()
	page.on('pageerror', (e) => console.log('  pageerror:', e.message))
	await page.setViewport({
		width: Math.round(size.w / scale.zoom),
		height: Math.round(size.h / scale.zoom),
		deviceScaleFactor: scale.os * scale.zoom,
	})
	await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'reduce'}])
	await page.evaluateOnNewDocument((css, ext) => {
		document.addEventListener('DOMContentLoaded', () => {
			const s = document.createElement('style')
			s.textContent = css
			document.head.appendChild(s)
			if (ext) {
				const e = document.createElement('style')
				e.textContent = ext
				document.head.prepend(e)
			}
		})
	}, KILL_CARET, extCss ? EXT_CSS : '')
	if (seed) await page.evaluateOnNewDocument((s) => {
		window.__fakeSeed = s
		try { localStorage.setItem('tmpBootCache', JSON.stringify(s)) } catch {}
	}, seed)
	return page
}
const closePage = (page) => page.browserContext().close()

async function shoot(page, name) {
	const file = join(OUT, name + '.png')
	await page.screenshot({path: file, captureBeyondViewport: false})
	shot++
	if (shot % 10 === 0) console.log('  ' + shot + ' shots')
}

// ---- the task list and its pool ----
// Every unit of work is one page load in its own browser context, queued by
// shootPopup / shootPages and run afterwards by runTasks().
const tasks = []
/** Runs the tasks `n` at a time over the shared browser; the first failure stops the queue and is rethrown. */
async function runTasks(list, n) {
	let next = 0, failed = null
	const worker = async () => {
		while (!failed && next < list.length) {
			const task = list[next++]
			try { await task() } catch (e) { failed = failed || e }
		}
	}
	await Promise.all(Array.from({length: Math.max(1, Math.min(n, list.length))}, worker))
	if (failed) throw failed
}

// ---- the popup ----
// One fresh page load (in a fresh browser context) per (width, state). Some
// popup state is not a setting and does not get reset by re-applying the
// others - Highlight Duplicates leaves its count in the header bar - so a state
// must not inherit the page another state left behind. Themes and layouts are
// pure settings and are looped inside.
function shootPopup(scale, sizes, layoutsOf) {
	const suffix = scale.name ? '@' + scale.name : ''
	for (const size of sizes) {
		for (const state of STATES) {
			if (scale.name && state.scales && !state.scales.includes(scale.name)) continue
			if (state.widths && !state.widths.includes(size.name)) continue
			if (state.chromeOnly && !chrome) continue
			const names = []
			for (const theme of THEMES) for (const layout of layoutsOf(state)) names.push([theme, layout, `${state.name}-${layout}-${theme}-${size.name}${suffix}`])
			if (!names.some(([, , n]) => want(n))) continue

			tasks.push(async () => {
				const page = await newPage(size, scale)
				try {
					await page.goto(origin + '/popup.html', {waitUntil: 'load'})
					await page.waitForFunction(() => document.querySelector('.searchBoxInput') && document.querySelectorAll('.window').length >= 3, {timeout: 20000})
					// warm-up: mounting every tab once resolves and caches every favicon tone,
					// so the first shot is not raced by the async icon classification
					await settle(page)
					await new Promise((r) => setTimeout(r, 900))

					for (const [theme, layout, name] of names) {
						if (!want(name)) continue
						await apply(page, {layout, dark: theme === 'dark', ...state.apply})
						// sanity: the overlay states must really be open, else skip
						if (state.apply.overlay === 'options' && !(await page.$('.options-window'))) { skipped.push(name + ' (options screen did not open)'); continue }
						if (state.apply.overlay === 'session-colors' && state.apply.pickColor && await page.$('.window-colors')) { skipped.push(name + ' (window colour screen did not close)'); continue }
						if (state.apply.overlay === 'session-colors' && !state.apply.pickColor && !(await page.$('.window-colors'))) { skipped.push(name + ' (saved window colour screen did not open)'); continue }
						if (state.apply.overlay === 'colors' && !(await page.$('.window-colors'))) { skipped.push(name + ' (window colour screen did not open)'); continue }
						if (state.hover) await hoverOption(page, state.hover)
						if (state.stats && !(await hoverStats(page, state.stats))) { skipped.push(name + ' (' + state.stats + ' not shown)'); continue }
						await shoot(page, name)
					}
				} finally {
					await closePage(page)
				}
			})
		}
	}
}

if (scaleMode !== 'only') shootPopup(DPR1, WIDTHS, (st) => st.layouts)

// ---- the standalone pages (dpr 1, plus the scales a page lists) ----
function shootPages(scale, sizes, defs) {
	const suffix = scale.name ? '@' + scale.name : ''
	for (const pageDef of defs) {
		for (const size of sizes) {
			for (const theme of pageDef.themes) {
				const name = `${pageDef.name}-na-${theme}-${size.name}${suffix}`
				if (!want(name)) continue
				const dark = theme === 'dark'
				tasks.push(async () => {
					const page = await newPage(size, scale, pageDef.ownTheme ? {dark, theme} : null)
					try {
						const res = await page.goto(origin + '/' + pageDef.url, {waitUntil: 'load'})
						if (!res || !res.ok()) { skipped.push(name + ' (' + pageDef.url + ' did not load)'); return }
						await page.evaluate((dark, force) => {
							if (force) {
								// the theme attribute src/helpers/theme.ts sets; the body/html class
								// is what the stylesheet keyed on before the css restructure
								document.documentElement.dataset.theme = dark ? 'dark' : 'light'
								document.body.classList.toggle('dark', dark)
								document.documentElement.classList.toggle('dark', dark)
							}
							if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur()
						}, dark, !pageDef.ownTheme)
						await settle(page)
						await new Promise((r) => setTimeout(r, 400))
						await shoot(page, name)
					} finally {
						await closePage(page)
					}
				})
			}
		}
	}
}
if (scaleMode !== 'only') shootPages(DPR1, WIDTHS, PAGES)

// ---- the scale axis (popup only) ----
if (scaleMode !== 'none') {
	const popup = WIDTHS.find((w) => w.name === '800x600')
	const narrow = WIDTHS.find((w) => w.name === '380x900')
	for (const scale of SCALES) {
		const sizes = scale.narrow ? [popup, narrow] : [popup]
		shootPopup(scale, sizes, (st) => st.scaleLayouts)
		shootPages(scale, sizes, PAGES.filter((p) => p.scales?.includes(scale.name)))
	}
}

console.log(tasks.length + ' page loads, ' + Math.min(jobs, tasks.length || 1) + ' at a time')
try {
	await runTasks(tasks, jobs)
} finally {
	await browser.close()
	server.close()
}

console.log('\n' + shot + ' screenshots -> ' + OUT)
// tasks finish in any order; list the skips in a stable one
if (skipped.length) console.log('skipped:\n  ' + skipped.sort().join('\n  '))
