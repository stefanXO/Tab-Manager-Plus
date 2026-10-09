// drag-check, restore checks: a saved window restores where its hover card
// says, on a headless Chrome with two screens.
//
// Its own headless Chrome (same binary as check.mjs, its own temporary
// profile) with two 1920x1080 screens side by side, each with a 40 px taskbar
// (--screen-info). system.display.getInfo() crashes headless Chrome on Windows
// (Chrome 154), so the extension runs from a temporary copy of build/chrome
// whose system.display permission is granted at install and whose getInfo()
// calls answer the same two screens (in the worker: those, or nothing at all,
// or an error). Everything else is the real thing: the popup (popup.html in a
// tab, on screen 1), its hover card, the click on the saved window's restore
// icon, the worker's restore, and Chrome's own window placement, read back
// with chrome.windows.get. See README.md.

import {cpSync, readFileSync, writeFileSync, mkdtempSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

const SCREENS = [
	{id: '1', name: 'Screen 1', isPrimary: true, bounds: {left: 0, top: 0, width: 1920, height: 1080}, workArea: {left: 0, top: 0, width: 1920, height: 1040}},
	{id: '2', name: 'Screen 2', isPrimary: false, bounds: {left: 1920, top: 0, width: 1920, height: 1080}, workArea: {left: 1920, top: 0, width: 1920, height: 1040}},
]
const SCREEN_INFO = '{0,0 1920x1080 workAreaBottom=40}{1920,0 1920x1080 workAreaBottom=40}'

// saved windows as Chrome on Windows saves them (a maximized one overhangs its monitor by 8 px)
const SAVED = {
	max2: {state: 'maximized', left: 1912, top: -8, width: 1936, height: 1056},
	max1: {state: 'maximized', left: -8, top: -8, width: 1936, height: 1056},
	norm2: {state: 'normal', left: 2100, top: 100, width: 900, height: 700},
	gone: {state: 'maximized', left: 5752, top: -8, width: 1936, height: 1056},
}

// the worker's getInfo(): the two screens, none (an empty list), or an error
const WORKER = {
	both: 'async () => ' + JSON.stringify(SCREENS),
	none: 'async () => []',
	error: 'async () => { throw new TypeError("system.display is not available here") }',
}

const CHECKS = [
	{name: 'restore: saved maximized on monitor 2 -> maximized on monitor 2, as the card says', worker: 'both', saved: 'max2',
		want: {card: 'restores maximized on monitor 2 of 2', window: ['maximized', 2]}},
	{name: 'restore: saved maximized on monitor 1 -> maximized on monitor 1', worker: 'both', saved: 'max1',
		want: {card: 'restores maximized on monitor 1 of 2', window: ['maximized', 1]}},
	{name: 'restore: saved normal on monitor 2 -> the same place', worker: 'both', saved: 'norm2',
		want: {card: 'restores at 900×700 on monitor 2 of 2', window: ['normal', 2, 2100, 100, 900, 700]}},
	{name: 'restore: saved maximized on a monitor not connected -> maximized on the popup\'s', worker: 'both', saved: 'gone',
		want: {card: 'restores maximized on monitor 1 of 2', window: ['maximized', 1]}},
	// the field bug: the worker saw fewer monitors than the popup
	{name: 'restore: worker knows no monitors -> still maximized on monitor 2', worker: 'none', saved: 'max2',
		want: {card: 'restores maximized on monitor 2 of 2', window: ['maximized', 2]}},
	{name: 'restore: worker\'s monitor query fails -> still maximized on monitor 2', worker: 'error', saved: 'max2',
		want: {card: 'restores maximized on monitor 2 of 2', window: ['maximized', 2]}},
]

// the extension, copied, with the permission granted and getInfo() answered
function extensionCopy(extDir, worker) {
	const dir = mkdtempSync(join(tmpdir(), 'tmp-drag-check-ext-'))
	cpSync(extDir, dir, {recursive: true})
	const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'))
	manifest.permissions = [...manifest.permissions, 'system.display']
	delete manifest.optional_permissions
	writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, '\t'))
	for (const [file, answer] of [['dist/service_worker/service_worker.js', WORKER[worker]], ['dist/popup/popup.js', WORKER.both]]) {
		const path = join(dir, file)
		const src = readFileSync(path, 'utf8')
		if (!src.includes('chrome.system.display.getInfo()')) throw new Error('no system.display.getInfo() call in ' + file)
		writeFileSync(path, 'globalThis.__screens = ' + answer + ';\n' + src.replaceAll('chrome.system.display.getInfo()', 'globalThis.__screens()'))
	}
	return dir
}

// the monitor (1-based) holding the window's centre, 0: none
function monitorOf(w) {
	const x = w.left + w.width / 2, y = w.top + w.height / 2
	return SCREENS.findIndex((s) => x >= s.bounds.left && x < s.bounds.left + s.bounds.width && y >= s.bounds.top && y < s.bounds.top + s.bounds.height) + 1
}

export async function monitorChecks({puppeteer, executablePath, extDir, only, report}) {
	const checks = CHECKS.filter((c) => !only || c.name.includes(only))
	for (const worker of Object.keys(WORKER)) {
		const mine = checks.filter((c) => c.worker === worker)
		if (mine.length === 0) continue
		const ext = extensionCopy(extDir, worker)
		const profile = mkdtempSync(join(tmpdir(), 'tmp-drag-check-'))
		const browser = await puppeteer.launch({
			headless: true, executablePath, userDataDir: profile, enableExtensions: true, pipe: true, defaultViewport: null,
			args: ['--screen-info=' + SCREEN_INFO, '--force-color-profile=srgb', '--no-first-run', '--no-default-browser-check'],
		})
		try {
			const id = await browser.installExtension(ext)
			const ctl = await browser.newPage()
			await ctl.goto('chrome-extension://' + id + '/LICENSE.md')
			const api = (fn, ...args) => ctl.evaluate(fn, ...args)
			const now = Date.now()
			const sessions = Object.fromEntries(Object.entries(SAVED).map(([sid, info], i) => [sid, {
				id: sid, name: sid, customName: true, color: 'default', incognito: false, date: now - i * 1000, order: i,
				tabs: [{id: 9000 + i, index: 0, windowId: 900, title: sid + ' page', url: 'about:blank', active: true, pinned: false}],
				windowsInfo: {id: 900, focused: false, incognito: false, type: 'normal', alwaysOnTop: false, ...info},
			}]))
			await api(async (sessions) => {
				await chrome.storage.local.clear()
				await chrome.storage.local.set({layout: 'blocks', animations: false, windowTitles: true, sessionsFeature: true, theme: 'light', sessions})
			}, sessions)
			// the popup in its own tab, in the control page's window on screen 1
			const p = await browser.newPage()
			await p.setViewport({width: 1100, height: 1000})
			await p.goto('chrome-extension://' + id + '/popup.html')
			await p.waitForSelector('#session-max2', {timeout: 10000})
			for (const c of mine) {
				const t0 = Date.now()
				let ok = false, detail = ''
				try {
					// only the control page's window; it has the focus (a window created
					// maximized without bounds opens on the monitor of the focused one)
					await api(async () => {
						const me = await chrome.windows.getCurrent()
						for (const w of await chrome.windows.getAll()) if (w.id !== me.id) await chrome.windows.remove(w.id)
						await chrome.windows.update(me.id, {focused: true})
					})
					const before = await api(async () => (await chrome.windows.getAll()).map((w) => w.id))
					await p.bringToFront()
					// the hover card's landing line
					await p.mouse.move(2, 2)
					const sel = '#session-' + c.saved + ' .window-age'
					const box = await p.evaluate((sel) => {
						const el = document.querySelector(sel)
						el.scrollIntoView({block: 'nearest'})
						const r = el.getBoundingClientRect()
						return {x: r.left + r.width / 2, y: r.top + r.height / 2}
					}, sel)
					await p.mouse.move(box.x, box.y, {steps: 4})
					const card = await p.waitForFunction((name) => {
						const text = document.querySelector('.stats-layer')?.textContent || ''
						return text.includes(name) && (/restores[^·]*?(?=click|$)/.exec(text) || [])[0]
					}, {timeout: 5000}, c.saved).then((h) => h.jsonValue(), () => 'no card')
					// the restore icon, as a user clicks it
					await p.click('#session-' + c.saved + ' .icon.tabaction.restore')
					const w = await api(async (before) => {
						for (let i = 0; i < 100; i++) {
							const found = (await chrome.windows.getAll()).find((x) => !before.includes(x.id))
							if (found) {
								// the worker maximizes (and checks) right after creating it
								await new Promise((r) => setTimeout(r, 600))
								return chrome.windows.get(found.id)
							}
							await new Promise((r) => setTimeout(r, 50))
						}
						return null
					}, before)
					const got = {card: card.trim(), window: w ? [w.state, monitorOf(w)] : null}
					if (w && c.want.window.length > 2) got.window.push(w.left, w.top, w.width, w.height)
					ok = JSON.stringify(got) === JSON.stringify(c.want)
					if (!ok) detail = 'want ' + JSON.stringify(c.want) + '\n      got  ' + JSON.stringify(got) + (w ? '\n      window ' + JSON.stringify([w.state, w.left, w.top, w.width, w.height]) : '')
				} catch (e) {
					detail = String(e && e.message || e)
				}
				report(c.name, ok, detail, Date.now() - t0)
			}
		} finally {
			await browser.close().catch(() => {})
			try { rmSync(profile, {recursive: true, force: true}) } catch {}
			try { rmSync(ext, {recursive: true, force: true}) } catch {}
		}
	}
}
