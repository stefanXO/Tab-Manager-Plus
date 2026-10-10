// perf-check: what a mouse move costs in the real action popup, with many tabs.
//
// node tools/perf-check/check.mjs [--only tiles|buttons] [--layout blocks|list]
//                                 [--json <file>] [--keep] [--ext <dir>]
//
// Starts its own headless Chrome for Testing (~/.cache/puppeteer, or CHROME_PATH),
// installs build/chrome (or --ext), opens 12 windows with 120 tabs and seeds 10
// saved windows with 60 saved tabs, opens the toolbar button's real popup
// (800x600, dark, animations on) and moves the mouse over tiles and over the
// bottom action buttons. Per move it reads the deltas of Performance.getMetrics
// (RecalcStyleCount, LayoutCount and their durations). Exits 1 when a count
// is over its threshold. See README.md.
//
// It never connects to a running Chrome (--keep starts a visible one of its own
// and leaves it open).

import {createServer} from 'node:http'
import {existsSync, readdirSync, mkdtempSync, writeFileSync} from 'node:fs'
import {tmpdir, homedir} from 'node:os'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

// ------------------------------------------------------------------ thresholds
// Per mouse move (one move = one hover change), popup only. Measured on the
// build of 2026-10-09 (the numbers are in README.md); set with margin.
// The COUNTS are runaway guards only: with animations on, a hover runs the
// transition's frames, each with several style and layout passes (Chrome's 25px
// sizing pass included), and how many frames fit in a move depends on how slow
// the frames are (a slow build gets FEWER counts). What a comeback of the 25px
// bug changes is what each pass costs: the DURATIONS, which are the real gate.
const MAX_MEDIAN_RESTYLES = 100   // median over the moves of a run (measured: up to 47)
const MAX_MEDIAN_LAYOUTS = 70     // (measured: up to 32)
const MAX_P95_RESTYLES = 150      // 95th percentile (measured: up to 74)
const MAX_P95_LAYOUTS = 100       // (measured: up to 51)
// Milliseconds per move, median. The absolute caps leave room for a slow
// machine; the tab comparison is what is machine independent.
const MAX_MEDIAN_RESTYLE_MS = 40  // (measured: up to 6; the 25px bug: 150+)
const MAX_MEDIAN_LAYOUT_MS = 15   // (measured: up to 1.5; the 25px bug: 40+)
const MAX_VS_TAB = 3              // popup median ms <= this x the same page as a plain tab ...
const TAB_FLOOR_RESTYLE_MS = 2    // ... counted as at least this much
const TAB_FLOOR_LAYOUT_MS = 1.5

const MOVES = {tiles: 40, buttons: 20}
const WAIT_MS = 60              // after each move, for the frame to be drawn

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const argv = process.argv.slice(2)
let only = null, layoutOnly = null, jsonFile = null, keep = false, extDir = join(root, 'build', 'chrome')
const usage = () => { console.error('usage: node tools/perf-check/check.mjs [--only tiles|buttons] [--layout blocks|list] [--json <file>] [--keep] [--ext <dir>]'); process.exit(2) }
for (let i = 0; i < argv.length; i++) {
	if (argv[i] === '--only') only = argv[++i]
	else if (argv[i] === '--layout') layoutOnly = argv[++i]
	else if (argv[i] === '--json') jsonFile = argv[++i]
	else if (argv[i] === '--ext') extDir = resolve(argv[++i])
	else if (argv[i] === '--keep') keep = true
	else usage()
}
if (only && !MOVES[only]) usage()
const LAYOUTS = {blocks: 'blocks', list: 'vertical'} // name -> the setting's value
if (layoutOnly && !LAYOUTS[layoutOnly]) usage()
if (!existsSync(join(extDir, 'manifest.json'))) {
	console.error('no ' + extDir + ': run `node build.mjs` first')
	process.exit(2)
}

function chromePath() {
	const pinned = join(homedir(), '.cache', 'puppeteer', 'chrome')
	const pinnedExe = existsSync(pinned) ? readdirSync(pinned).sort().reverse().map((d) => [
		join(pinned, d, 'chrome-win64', 'chrome.exe'),
		join(pinned, d, 'chrome-linux64', 'chrome'),
		join(pinned, d, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
		join(pinned, d, 'chrome-mac-x64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
	]).flat() : []
	const found = [process.env.CHROME_PATH, ...pinnedExe].filter(Boolean).find((p) => existsSync(p))
	if (!found) throw new Error('no Chrome for Testing found: npx @puppeteer/browsers install chrome@stable (see tools/css-baseline/README.md), or set CHROME_PATH')
	return found
}

// local pages: /p/<name> is titled <name>; nothing goes beyond 127.0.0.1
const server = createServer((req, res) => {
	const name = decodeURIComponent(new URL(req.url, 'http://x').pathname.replace(/^\/p\//, ''))
	if (name === '/favicon.ico' || name === 'favicon.ico') { res.writeHead(404); res.end(); return }
	res.writeHead(200, {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'})
	res.end('<!doctype html><title>' + name.replace(/[<&]/g, '') + '</title><body>' + name.replace(/[<&]/g, ''))
})
await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
const origin = 'http://127.0.0.1:' + server.address().port
const page = (name) => origin + '/p/' + encodeURIComponent(name)

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0 }
const p95 = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * 0.95))] : 0 }

const puppeteer = (await import('puppeteer-core')).default
const browser = await puppeteer.launch({
	headless: !keep,
	executablePath: chromePath(),
	userDataDir: mkdtempSync(join(tmpdir(), 'tmp-perf-check-')),
	enableExtensions: true,
	pipe: true,
	defaultViewport: null,
	args: ['--window-size=1400,1000', '--force-color-profile=srgb', '--no-first-run', '--no-default-browser-check'],
})
const started = Date.now()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []

try {
	const extId = await browser.installExtension(extDir)
	const extOrigin = 'chrome-extension://' + extId
	const ctl = await browser.newPage()
	await ctl.goto(extOrigin + '/LICENSE.md')
	const api = (fn, ...args) => ctl.evaluate(fn, ...args)

	// 12 windows, 120 tabs (10 each)
	const lists = Array.from({length: 12}, (_, w) => Array.from({length: 10}, (_, i) => page('Open ' + (w + 1) + '.' + (i + 1) + ' tab number ' + (w * 10 + i + 1))))
	await api(async (lists) => {
		for (const l of lists) {
			const w = await chrome.windows.create({url: l[0], focused: false, width: 900, height: 700})
			for (const u of l.slice(1)) await chrome.tabs.create({windowId: w.id, url: u, active: false})
		}
	}, lists)
	// 10 saved windows, 6 tabs each
	const now = Date.now()
	const sessions = {}
	for (let s = 0; s < 10; s++) {
		const id = 's' + s
		sessions[id] = {id, name: 'Saved ' + (s + 1), color: 'color' + (s % 15 + 1), customName: true, incognito: false, date: now - (s + 1) * 864e5,
			sessionStartTime: now - (s + 1) * 864e5, order: s,
			tabs: Array.from({length: 6}, (_, i) => ({id: 9000 + s * 10 + i, index: i, windowId: 900 + s, title: 'Saved ' + (s + 1) + '.' + (i + 1), url: page('Saved ' + (s + 1) + '.' + (i + 1)),
				active: i === 0, pinned: false, audible: false, discarded: false, highlighted: i === 0, incognito: false, status: 'complete'})),
			windowsInfo: {id: 900 + s, focused: false, incognito: false, type: 'normal', state: 'normal', left: 0, top: 0, width: 900, height: 700}}
	}
	await api(async () => {
		for (let i = 0; i < 300; i++) {
			const t = await chrome.tabs.query({})
			if (t.length >= 121 && t.every((x) => x.status === 'complete')) return
			await new Promise((r) => setTimeout(r, 100))
		}
	})
	const counts = await api(async () => [(await chrome.windows.getAll()).length, (await chrome.tabs.query({})).length])
	console.log('fixture: ' + counts[0] + ' windows (one is the control page), ' + counts[1] + ' tabs, 10 saved windows with 60 saved tabs')

	async function settings(layout) {
		await api(async (values) => { await chrome.storage.local.clear(); await chrome.storage.local.set(values) },
			{layout, theme: 'dark', animations: true, windowTitles: true, tabactions: true, sessionsFeature: true, tabWidth: 800, tabHeight: 600, sessions})
	}
	async function closePopups() {
		for (const t of browser.targets()) {
			if (!t.url().includes('/popup.html')) continue
			const p = await t.asPage().catch(() => null)
			if (p) await p.evaluate(() => window.close()).catch(() => {})
			await p?.close().catch(() => {})
		}
		for (let i = 0; i < 40 && browser.targets().some((t) => t.url().includes('/popup.html')); i++) await sleep(50)
	}
	async function openPopup(mode) {
		let p
		if (mode === 'popup') {
			// the toolbar button's real popup (popup.html?popup=true), sized by the popup itself
			const opened = browser.waitForTarget((t) => t.url().includes('/popup.html?popup'), {timeout: 15000})
			await ctl.bringToFront()
			for (let i = 0; ; i++) {
				const error = await api(async () => {
					const me = await chrome.tabs.getCurrent()
					await chrome.windows.update(me.windowId, {focused: true})
					return chrome.action.openPopup().then(() => '', (e) => e.message)
				})
				if (!error) break
				if (i === 30) throw new Error(error)
				await sleep(100)
			}
			p = await (await opened).asPage()
		} else {
			// the same build as a plain tab, 800x600
			p = await browser.newPage()
			await p.setViewport({width: 800, height: 600})
			await p.goto(extOrigin + '/popup.html?popup')
		}
		await p.waitForFunction(() => document.querySelectorAll('.window:not(.session) .tab').length >= 100, {timeout: 15000})
		// entrance animations over, favicons and titles in
		await p.waitForFunction(() => !document.querySelector('.enter') && document.getAnimations().every((a) => a.playState !== 'running'), {timeout: 15000}).catch(() => {})
		await sleep(2500)
		return p
	}

	// the points to move to: the tiles on screen, or the buttons at the bottom
	async function points(p, part) {
		if (part === 'tiles') {
			return p.$$eval('.window:not(.session) .tab', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.x + Math.min(r.width / 2, 100), r.y + r.height / 2, r.width] })
				.filter(([x, y, w]) => w > 0 && y > 60 && y < innerHeight - 70 && x < innerWidth).map(([x, y]) => [x, y]))
		}
		return p.$$eval('[data-help]', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, r.width] })
			.filter(([x, y, w]) => w > 0 && y > innerHeight - 90 && y < innerHeight && x > 0 && x < innerWidth).map(([x, y]) => [x, y]))
	}

	async function measure(p, mode, layoutName, part) {
		const pts = await points(p, part)
		if (pts.length < 3) throw new Error(mode + ' ' + layoutName + ' ' + part + ': only ' + pts.length + ' targets on screen')
		const cdp = await p.createCDPSession()
		await cdp.send('Performance.enable')
		const met = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]))
		await p.mouse.move(pts[0][0], pts[0][1])
		await sleep(300)
		const out = {mode, layout: layoutName, part, targets: pts.length, restyles: [], layouts: [], restyleMs: [], layoutMs: []}
		for (let i = 0; i < MOVES[part]; i++) {
			// far-apart targets in turn, so that every move changes the hover
			const at = pts[(i * 7 + 1) % pts.length]
			const m0 = await met()
			await p.mouse.move(at[0], at[1], {steps: 2})
			await sleep(WAIT_MS)
			const m1 = await met()
			out.restyles.push(m1.RecalcStyleCount - m0.RecalcStyleCount)
			out.layouts.push(m1.LayoutCount - m0.LayoutCount)
			out.restyleMs.push((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000)
			out.layoutMs.push((m1.LayoutDuration - m0.LayoutDuration) * 1000)
		}
		await cdp.detach().catch(() => {})
		results.push(out)
	}

	for (const [layoutName, layoutValue] of Object.entries(LAYOUTS)) {
		if (layoutOnly && layoutOnly !== layoutName) continue
		for (const mode of ['popup', 'tab']) {
			await settings(layoutValue)
			await closePopups()
			const p = await openPopup(mode)
			const size = await p.evaluate(() => [innerWidth, innerHeight, document.querySelectorAll('.tab').length])
			console.log(mode + ' ' + layoutName + ': ' + size[0] + 'x' + size[1] + ', ' + size[2] + ' tiles')
			for (const part of ['tiles', 'buttons']) if (!only || only === part) await measure(p, mode, layoutName, part)
			if (mode === 'tab') await p.close()
		}
	}

	// ---------------------------------------------------------------- report
	const rows = results.map((r) => ({...r, medRestyles: median(r.restyles), p95Restyles: p95(r.restyles), medLayouts: median(r.layouts), p95Layouts: p95(r.layouts),
		medRestyleMs: median(r.restyleMs), medLayoutMs: median(r.layoutMs)}))
	const f = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2))
	const pad = (s, n) => String(s).padEnd(n)
	const widths = [8, 8, 9, 7, 13, 6, 12, 6, 12, 10]
	const line = (cells) => console.log(cells.map((v, i) => pad(v, widths[i])).join(''))
	console.log('')
	line(['mode', 'layout', 'part', 'moves', 'restyle med', 'p95', 'layout med', 'p95', 'restyle ms', 'layout ms'])
	for (const r of rows) line([r.mode, r.layout, r.part, r.restyles.length, f(r.medRestyles), f(r.p95Restyles), f(r.medLayouts), f(r.p95Layouts), f(r.medRestyleMs), f(r.medLayoutMs)])

	const failures = []
	for (const r of rows) {
		if (r.mode !== 'popup') continue
		const tab = rows.find((t) => t.mode === 'tab' && t.layout === r.layout && t.part === r.part)
		const name = 'popup ' + r.layout + ' ' + r.part
		if (r.medRestyles > MAX_MEDIAN_RESTYLES) failures.push(name + ': median restyles per move ' + f(r.medRestyles) + ' > ' + MAX_MEDIAN_RESTYLES)
		if (r.medLayouts > MAX_MEDIAN_LAYOUTS) failures.push(name + ': median layouts per move ' + f(r.medLayouts) + ' > ' + MAX_MEDIAN_LAYOUTS)
		if (r.p95Restyles > MAX_P95_RESTYLES) failures.push(name + ': p95 restyles per move ' + f(r.p95Restyles) + ' > ' + MAX_P95_RESTYLES)
		if (r.p95Layouts > MAX_P95_LAYOUTS) failures.push(name + ': p95 layouts per move ' + f(r.p95Layouts) + ' > ' + MAX_P95_LAYOUTS)
		if (r.medRestyleMs > MAX_MEDIAN_RESTYLE_MS) failures.push(name + ': median restyle time per move ' + f(r.medRestyleMs) + ' ms > ' + MAX_MEDIAN_RESTYLE_MS)
		if (r.medLayoutMs > MAX_MEDIAN_LAYOUT_MS) failures.push(name + ': median layout time per move ' + f(r.medLayoutMs) + ' ms > ' + MAX_MEDIAN_LAYOUT_MS)
		if (tab) {
			const lr = MAX_VS_TAB * Math.max(tab.medRestyleMs, TAB_FLOOR_RESTYLE_MS), ll = MAX_VS_TAB * Math.max(tab.medLayoutMs, TAB_FLOOR_LAYOUT_MS)
			if (r.medRestyleMs > lr) failures.push(name + ': median restyle time ' + f(r.medRestyleMs) + ' ms > ' + f(lr) + ' (' + MAX_VS_TAB + 'x the tab\'s ' + f(tab.medRestyleMs) + '; the 25px pass?)')
			if (r.medLayoutMs > ll) failures.push(name + ': median layout time ' + f(r.medLayoutMs) + ' ms > ' + f(ll) + ' (' + MAX_VS_TAB + 'x the tab\'s ' + f(tab.medLayoutMs) + '; the 25px pass?)')
		}
	}
	console.log('\nthresholds (popup, per move, median): restyles <= ' + MAX_MEDIAN_RESTYLES + ', layouts <= ' + MAX_MEDIAN_LAYOUTS + ' (p95 ' + MAX_P95_RESTYLES + ' / ' + MAX_P95_LAYOUTS + '); restyle ms <= ' + MAX_MEDIAN_RESTYLE_MS + ', layout ms <= ' + MAX_MEDIAN_LAYOUT_MS + '; ms <= ' + MAX_VS_TAB + 'x the tab\'s')
	if (jsonFile) writeFileSync(jsonFile, JSON.stringify({extDir, thresholds: {MAX_MEDIAN_RESTYLES, MAX_MEDIAN_LAYOUTS, MAX_P95_RESTYLES, MAX_P95_LAYOUTS, MAX_MEDIAN_RESTYLE_MS, MAX_MEDIAN_LAYOUT_MS, MAX_VS_TAB}, rows, failures}, null, 1))
	const secs = Math.round((Date.now() - started) / 1000)
	if (failures.length) {
		console.log('FAIL (' + secs + ' s)')
		for (const x of failures) console.log('  ' + x)
		process.exitCode = 1
	} else console.log('ok (' + secs + ' s)')
} catch (e) {
	console.error(e)
	process.exitCode = 1
} finally {
	if (keep) { console.log('--keep: Chrome stays open; Ctrl+C to quit'); await new Promise(() => {}) }
	await browser.close().catch(() => {})
	server.close()
}
