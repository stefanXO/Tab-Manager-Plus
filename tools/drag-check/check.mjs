// drag-check: real drags against the built extension (build/chrome).
//
// node tools/drag-check/check.mjs [--only <substring>]
//
// Starts its own headless Chrome (Chrome for Testing from ~/.cache/puppeteer,
// or CHROME_PATH) with a fresh temporary profile, installs build/chrome
// unpacked, opens real windows and tabs (pages from a small local server),
// seeds two saved windows, and opens the popup: in its own tab, as
// popup.html?popup at 800x600, and as the toolbar button's real popup. Every
// drag goes through Chrome's own drag pipeline: the mouse is pressed and
// moved over the source with Input.dispatchMouseEvent, Chrome starts the
// html5 drag (dragstart in the page, with the page's own DataTransfer data
// and effectAllowed), Input.setInterceptDrags hands that drag back here
// instead of to the OS, and Input.dispatchDragEvent delivers dragenter /
// dragover / drop where the OS would. So a drop the page does not accept (no
// preventDefault on dragover, a dropEffect that effectAllowed does not
// allow) never fires, as in a real drag. The result is read back from the
// real tabs, storage.local and what the popup shows. Exits 1 on any failure.
// See README.md.
//
// It never connects to a running Chrome (no port 9222, no DevToolsActivePort)
// and never starts a visible browser.

import {createServer} from 'node:http'
import {existsSync, readdirSync, mkdtempSync, rmSync} from 'node:fs'
import {tmpdir, homedir} from 'node:os'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const extDir = join(root, 'build', 'chrome')

const argv = process.argv.slice(2)
let only = null
for (let i = 0; i < argv.length; i++) {
	if (argv[i] === '--only') only = argv[++i]
	else { console.error('usage: node tools/drag-check/check.mjs [--only <substring>]'); process.exit(2) }
}
if (!existsSync(join(extDir, 'manifest.json'))) {
	console.error('no build/chrome: run `node build.mjs` first')
	process.exit(2)
}

// ------------------------------------------------------------------ chrome
// Branded Chrome ignores unpacked extensions given on the command line since
// 137; Chrome for Testing (npx @puppeteer/browsers install chrome@stable)
// takes them, through the pipe's Extensions.loadUnpacked.
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

// ------------------------------------------------------------------ pages
// Real pages for the open tabs and the saved tabs: /p/<name> has the title
// <name>. Restored or opened saved tabs load them too.
function servePages() {
	const server = createServer((req, res) => {
		const name = decodeURIComponent(new URL(req.url, 'http://x').pathname.replace(/^\/p\//, ''))
		res.writeHead(200, {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'})
		res.end('<!doctype html><title>' + name.replace(/[<&]/g, '') + '</title><body>' + name.replace(/[<&]/g, ''))
	})
	return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({server, origin: 'http://127.0.0.1:' + server.address().port})))
}

// ------------------------------------------------------------------ run
const puppeteer = (await import('puppeteer-core')).default
const {server, origin} = await servePages()
const page = (name) => origin + '/p/' + encodeURIComponent(name)
const profile = mkdtempSync(join(tmpdir(), 'tmp-drag-check-'))
const browser = await puppeteer.launch({
	headless: true,
	executablePath: chromePath(),
	userDataDir: profile,
	enableExtensions: true,
	pipe: true,
	defaultViewport: null,
	args: ['--window-size=1200,1500', '--force-color-profile=srgb', '--no-first-run', '--no-default-browser-check'],
})
const started = Date.now()
let failures = 0
const results = []

try {
	const extId = await browser.installExtension(extDir)
	const extOrigin = 'chrome-extension://' + extId
	// a page of the extension to drive the real APIs from (chrome.tabs, storage)
	const ctl = await browser.newPage()
	await ctl.goto(extOrigin + '/LICENSE.md')
	const api = (fn, ...args) => ctl.evaluate(fn, ...args)

	// The fixture, made fresh before every check: two open windows with real
	// pages, two saved windows, settings for the layout under test.
	async function fixture(layout) {
		// close every window but the control page's
		await api(async () => {
			const me = await chrome.tabs.getCurrent()
			for (const w of await chrome.windows.getAll()) if (w.id !== me.windowId) await chrome.windows.remove(w.id)
		})
		const windows = await api(async (urls) => {
			const out = []
			for (const list of urls) {
				const w = await chrome.windows.create({url: list, focused: false, width: 900, height: 700})
				out.push(w.id)
			}
			return out
		}, [[page('Alpha'), page('Bravo'), page('Charlie')], [page('Delta'), page('Echo'), page('Foxtrot')]])
		const now = Date.now()
		const tab = (index, title, extra = {}) => ({id: 9000 + index, index, windowId: 900, title, url: page(title), active: index === 0,
			pinned: false, audible: false, discarded: false, highlighted: index === 0, incognito: false, status: 'complete', ...extra})
		const saved = (id, name, color, age, titles, order) => ({id, name, color, customName: true, incognito: false, date: now - age,
			sessionStartTime: now - age, order, tabs: titles.map((t, i) => tab(i, t)),
			windowsInfo: {id: 900, focused: false, incognito: false, type: 'normal', state: 'normal', left: 0, top: 0, width: 900, height: 700}})
		await api(async (values) => {
			await chrome.storage.local.clear()
			await chrome.storage.local.set(values)
		}, {
			layout, animations: true, windowTitles: true, tabactions: true, sessionsFeature: true, theme: 'light',
			windowNames: {[windows[0]]: 'First', [windows[1]]: 'Second'},
			sessions: {
				s1: saved('s1', 'Reading', 'color4', 2 * 864e5, ['Hotel', 'India', 'Juliett', 'Kilo'], 0),
				s2: saved('s2', 'Taxes', 'color15', 21 * 864e5, ['Lima', 'Mike', 'November'], 1),
			},
		})
		// wait until the pages have their titles (the popup shows them)
		await api(async () => {
			for (let i = 0; i < 100; i++) {
				const tabs = await chrome.tabs.query({})
				if (tabs.every((t) => t.status === 'complete')) return
				await new Promise((r) => setTimeout(r, 50))
			}
		})
		return windows
	}

	// the page's own drag events, logged (DRAG_DEBUG=1)
	function debugDrags() {
		for (const type of ['dragstart', 'dragenter', 'dragover', 'dragleave', 'drop', 'dragend']) {
			document.addEventListener(type, (e) => {
				if (type === 'dragover' && window.__lastOver === e.target) return
				if (type === 'dragover') window.__lastOver = e.target
				const t = e.target
				console.log(type + ' ' + (t.id || t.className || t.tagName) + ' types=' + [...(e.dataTransfer?.types || [])].join(',') + ' effect=' + e.dataTransfer?.effectAllowed + '/' + e.dataTransfer?.dropEffect + ' prevented=' + e.defaultPrevented)
			}, true)
		}
	}
	async function openPopup() {
		let p
		if (mode === 'action') {
			// the toolbar button's popup itself (popup.html?popup=true, sized by
			// the popup at 800x600), opened as a click on the button opens it
			const opened = browser.waitForTarget((t) => t.url().includes('/popup.html?popup'), {timeout: 10000})
			await ctl.bringToFront()
			for (let i = 0; ; i++) {
				const error = await api(async () => {
					const me = await chrome.tabs.getCurrent()
					await chrome.windows.update(me.windowId, {focused: true})
					return chrome.action.openPopup().then(() => '', (e) => e.message)
				})
				if (!error) break
				if (i === 20) throw new Error(error)
				await new Promise((r) => setTimeout(r, 100))
			}
			p = await (await opened).asPage()
			if (process.env.DRAG_DEBUG) {
				p.on('console', (m) => console.log('      [popup] ' + m.text()))
				await p.evaluate(debugDrags)
			}
		} else {
			p = await browser.newPage()
			await p.setViewport(mode === 'small' ? {width: 800, height: 600} : {width: 1100, height: 1400})
			if (process.env.DRAG_DEBUG) {
				p.on('console', (m) => console.log('      [popup] ' + m.text()))
				await p.evaluateOnNewDocument(debugDrags)
			}
			await p.goto(extOrigin + '/popup.html' + (mode === 'small' ? '?popup' : ''))
		}
		await p.waitForSelector('.session .tab', {timeout: 10000})
		await p.waitForFunction(() => document.querySelectorAll('.window:not(.session) .tab').length >= 6, {timeout: 10000})
		// the entrance animation (animations are on, as by default) moves the
		// tiles for a moment: a press then lands beside them
		await p.waitForFunction(() => !document.querySelector('.enter') && document.getAnimations().every((a) => a.playState !== 'running'), {timeout: 10000})
		return p
	}

	// closes every popup page (the toolbar popup too) and waits until they are gone
	async function closePopups() {
		for (const t of browser.targets()) {
			if (!t.url().includes('/popup.html')) continue
			const p = await t.asPage().catch(() => null)
			if (p) await p.evaluate(() => window.close()).catch(() => {})
			await p?.close().catch(() => {})
		}
		for (let i = 0; i < 40 && browser.targets().some((t) => t.url().includes('/popup.html')); i++) await new Promise((r) => setTimeout(r, 50))
	}

	// the centre (or a point at fx / fy of its box) of the first match
	async function point(p, selector, fx = 0.5, fy = 0.5) {
		const box = await p.evaluate((sel, fx, fy) => {
			const el = document.querySelector(sel)
			if (!el) return null
			el.scrollIntoView({block: 'nearest', inline: 'nearest'})
			const r = el.getBoundingClientRect()
			return {x: r.left + r.width * fx, y: r.top + r.height * fy}
		}, selector, fx, fy)
		if (!box) throw new Error('not on the page: ' + selector)
		return box
	}

	// A real drag from `from` to `to` (selectors, or {selector, fx, fy}).
	// With `into` (another page), the drag leaves `p` and is dropped in
	// `into`, as when a drag crosses from one window to another: the page
	// that takes the drop never saw it start.
	async function drag(p, from, to, into = p) {
		const cdp = await p.createCDPSession()
		const target = into === p ? cdp : await into.createCDPSession()
		try {
			await cdp.send('Input.setInterceptDrags', {enabled: true})
			const src = await point(p, from.selector || from, from.fx, from.fy)
			const intercepted = new Promise((ok, fail) => {
				const timer = setTimeout(() => fail(new Error('no drag started at ' + (from.selector || from))), 3000)
				cdp.once('Input.dragIntercepted', (e) => { clearTimeout(timer); ok(e.data) })
			})
			const mouse = (type, at, extra = {}) => cdp.send('Input.dispatchMouseEvent', {type, x: at.x, y: at.y, button: 'left', ...extra})
			await mouse('mouseMoved', src, {button: 'none'})
			await mouse('mousePressed', src, {buttons: 1, clickCount: 1})
			for (let i = 1; i <= 5; i++) await mouse('mouseMoved', {x: src.x + i * 3, y: src.y + i * 3}, {buttons: 1})
			const data = await intercepted
			if (process.env.DRAG_DEBUG) console.log('      [drag data] ' + JSON.stringify(data))
			// measured once the drag runs (dragstart may re-render), and scrolled
			// to, as a user does in a small popup
			const dst = await point(into, to.selector || to, to.fx, to.fy)
			const dragEvent = (type, at) => target.send('Input.dispatchDragEvent', {type, x: at.x, y: at.y, data})
			// the way there, as the OS reports it: dragenter where it starts, a
			// dragover every ~24 px (Chrome works out the enters and leaves of the
			// elements on the way), then a few on the target, as a hand that stops
			const from0 = into === p ? {x: src.x + 15, y: src.y + 15} : {x: dst.x, y: 0}
			await dragEvent('dragEnter', from0)
			const steps = Math.max(1, Math.round(Math.hypot(dst.x - from0.x, dst.y - from0.y) / 24))
			for (let i = 1; i <= steps; i++) {
				await dragEvent('dragOver', {x: from0.x + (dst.x - from0.x) * i / steps, y: from0.y + (dst.y - from0.y) * i / steps})
				await new Promise((r) => setTimeout(r, 8))
			}
			for (let i = 0; i < 3; i++) {
				await dragEvent('dragOver', dst)
				await new Promise((r) => setTimeout(r, 30))
			}
			await dragEvent('drop', dst)
			// the page it left: the drag ends there, dropped elsewhere
			if (into !== p) await cdp.send('Input.dispatchDragEvent', {type: 'dragCancel', x: 0, y: 0, data})
			await mouse('mouseReleased', into === p ? dst : src, {buttons: 0, clickCount: 1})
			return data
		} finally {
			await cdp.send('Input.setInterceptDrags', {enabled: false}).catch(() => {})
			await cdp.detach().catch(() => {})
			if (target !== cdp) await target.detach().catch(() => {})
		}
	}

	async function click(p, selector) {
		const at = await point(p, selector)
		const cdp = await p.createCDPSession()
		await cdp.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: at.x, y: at.y})
		await cdp.send('Input.dispatchMouseEvent', {type: 'mousePressed', x: at.x, y: at.y, button: 'left', buttons: 1, clickCount: 1})
		await cdp.send('Input.dispatchMouseEvent', {type: 'mouseReleased', x: at.x, y: at.y, button: 'left', buttons: 0, clickCount: 1})
		await cdp.detach()
	}
	// Records every drag image of stacked tiles the page builds (the
	// several-tab drag image, src/popup/dragImage.ts): its tile titles, front
	// first, and its count. Resolves to the list once called.
	async function watchStacks(p) {
		await p.evaluate(() => {
			window.__stacks = []
			new MutationObserver((records) => {
				for (const r of records) for (const n of r.addedNodes) {
					if (!(n instanceof HTMLElement) || !n.classList.contains('drag-stack')) continue
					window.__stacks.push({tiles: [...n.querySelectorAll('.drag-title')].map((t) => t.textContent).reverse(), label: n.querySelector('.drag-count')?.textContent})
				}
			}).observe(document.body, {childList: true})
		})
		return () => p.evaluate(() => window.__stacks)
	}
	async function ctrlClick(p, selector) {
		const at = await point(p, selector)
		const cdp = await p.createCDPSession()
		const mods = process.platform === 'darwin' ? 4 : 2
		await cdp.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: at.x, y: at.y, modifiers: mods})
		await cdp.send('Input.dispatchMouseEvent', {type: 'mousePressed', x: at.x, y: at.y, button: 'left', buttons: 1, clickCount: 1, modifiers: mods})
		await cdp.send('Input.dispatchMouseEvent', {type: 'mouseReleased', x: at.x, y: at.y, button: 'left', buttons: 0, clickCount: 1, modifiers: mods})
		await cdp.detach()
	}

	async function rightClick(p, selector) {
		const at = await point(p, selector)
		const cdp = await p.createCDPSession()
		await cdp.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: at.x, y: at.y})
		await cdp.send('Input.dispatchMouseEvent', {type: 'mousePressed', x: at.x, y: at.y, button: 'right', buttons: 2, clickCount: 1})
		await cdp.send('Input.dispatchMouseEvent', {type: 'mouseReleased', x: at.x, y: at.y, button: 'right', buttons: 0, clickCount: 1})
		await cdp.detach()
	}

	const titlesOf = (windowId) => api(async (id) => {
		const tabs = await chrome.tabs.query({windowId: id})
		return tabs.sort((a, b) => a.index - b.index).map((t) => t.title || t.pendingUrl || t.url)
	}, windowId)
	// the titles the popup shows in a window card (open or saved), in order
	const shownIn = (p, card) => p.evaluate((card) => [...document.querySelectorAll(card + ' .tab')]
		.filter((t) => t.offsetParent).map((t) => (t.getAttribute('data-hover') || '').split('\n')[0]), card)
	const savedTitles = () => api(async () => {
		const {sessions} = await chrome.storage.local.get('sessions')
		const out = {}
		for (const [id, s] of Object.entries(sessions || {})) out[id] = [...s.tabs].sort((a, b) => a.index - b.index).map((t) => t.title)
		return out
	})
	const savedOrder = () => api(async () => {
		const {sessions} = await chrome.storage.local.get('sessions')
		return Object.values(sessions || {}).sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9)).map((s) => s.id)
	})
	// waits until `read()` gives `want` (as JSON), up to 4 s
	async function settle(read, want) {
		let got
		for (let i = 0; i < 80; i++) {
			got = await read()
			if (JSON.stringify(got) === JSON.stringify(want)) return got
			await new Promise((r) => setTimeout(r, 50))
		}
		return got
	}
	// a tab by its title (its data-hover is "<title>\n<url>")
	const tabSel = (title) => '.window:not(.session) .tab[data-hover^="' + title + '\\a "]'
	const savedSel = (title) => '.session .tab[data-hover^="' + title + '\\a "]'

	const checks = []
	// the popup under test: 'tab', its own tab (tall, nothing to scroll);
	// 'small', popup.html?popup in a tab at 800x600, scrolled during drags;
	// 'action', the toolbar button's real popup
	let mode = 'tab'

	for (const [layout, m] of [['blocks', 'tab'], ['vertical', 'tab'], ['blocks', 'small'], ['vertical', 'action']]) {
		// every check in the own tab; in the small and the real popup the ones
		// where the popup's size or kind could matter
		const check = (name, fn, everywhere = true) => {
			if (m === 'tab' || everywhere) checks.push({name: (m === 'tab' ? '' : m + ' ') + layout + ': ' + name, fn, mode: m})
		}
		// patch 11: a saved tab dropped on an open tab opens there
		check('saved tab -> open tab', async () => {
			const [, w2] = await fixture(layout)
			const p = await openPopup()
			await drag(p, savedSel('India'), {selector: tabSel('Echo'), fx: 0.1, fy: 0.1})
			const want = ['Delta', 'India', 'Echo', 'Foxtrot']
			return {got: [await settle(() => titlesOf(w2), want), await settle(() => shownIn(p, '#window-' + w2), want)], want: [want, want],
				extra: {saved: await savedTitles()}}
		})
		// patch 11, end to end: a window saved with its save button, one of its
		// saved tabs dropped on a tab of another window
		check('saved by the save button -> open tab', async () => {
			const [w1, w2] = await fixture(layout)
			const p = await openPopup()
			await click(p, '#window-' + w1 + ' .tabaction.save')
			await p.waitForSelector(savedSel('Bravo'), {timeout: 5000})
			await p.waitForFunction(() => !document.querySelector('.enter') && document.getAnimations().every((a) => a.playState !== 'running'), {timeout: 10000})
			await drag(p, savedSel('Bravo'), {selector: tabSel('Echo'), fx: 0.1, fy: 0.1})
			const want = ['Delta', 'Bravo', 'Echo', 'Foxtrot']
			return {got: [await settle(() => titlesOf(w2), want), await settle(() => shownIn(p, '#window-' + w2), want)], want: [want, want]}
		}, m === 'action')
		// patch 11, across pages: a saved tab dragged out of one Tab Manager
		// page and dropped on an open tab in another (two own tabs in two
		// windows, the Firefox sidebar and an own tab). The page that takes
		// the drop has no memory of the drag: the drop's own data says what.
		check('saved tab -> open tab in another Tab Manager page', async () => {
			const [, w2] = await fixture(layout)
			const p = await openPopup()
			const other = await openPopup()
			await p.bringToFront()
			await drag(p, savedSel('India'), {selector: tabSel('Echo'), fx: 0.1, fy: 0.1}, other)
			const want = ['Delta', 'India', 'Echo', 'Foxtrot']
			return {got: await settle(() => titlesOf(w2), want), want}
		}, false)
		// patch 11: the selected saved tabs (two windows) dropped on an open tab
		check('selected saved tabs -> open tab', async () => {
			const [w1] = await fixture(layout)
			const p = await openPopup()
			await ctrlClick(p, savedSel('Juliett'))
			await ctrlClick(p, savedSel('Mike'))
			const stacks = await watchStacks(p)
			await drag(p, savedSel('Mike'), {selector: tabSel('Charlie'), fx: 0.9, fy: 0.9})
			const want = ['Alpha', 'Bravo', 'Charlie', 'Juliett', 'Mike']
			// the drag image: two tiles, Mike (dragged) in front, and the count
			return {got: [await settle(() => titlesOf(w1), want), await stacks()], want: [want, [{tiles: ['Mike', 'Juliett'], label: '2 tabs'}]]}
		})
		// patch 11: dropped on the open window card away from its tabs (its
		// bottom right corner): next to the nearest tab, the last one
		check('saved tab -> open window (no tab)', async () => {
			const [w1] = await fixture(layout)
			const p = await openPopup()
			await drag(p, savedSel('Kilo'), {selector: '#window-' + w1, fx: 0.97, fy: 0.97})
			const want = ['Alpha', 'Bravo', 'Charlie', 'Kilo']
			return {got: await settle(() => titlesOf(w1), want), want}
		}, m === 'small')
		// patch 15: a saved tab dropped on another tab of its saved window
		check('saved tab -> saved tab (reorder)', async () => {
			await fixture(layout)
			const p = await openPopup()
			await drag(p, savedSel('Kilo'), {selector: savedSel('India'), fx: 0.1, fy: 0.1})
			const want = {s1: ['Hotel', 'Kilo', 'India', 'Juliett'], s2: ['Lima', 'Mike', 'November']}
			return {got: await settle(savedTitles, want), want}
		})
		// patch 15: a saved tab dropped on another saved window's title: at its end
		check('saved tab -> saved card', async () => {
			await fixture(layout)
			const p = await openPopup()
			await drag(p, savedSel('Hotel'), '#session-s2 h3.windowTitle')
			const want = {s1: ['India', 'Juliett', 'Kilo'], s2: ['Lima', 'Mike', 'November', 'Hotel']}
			return {got: await settle(savedTitles, want), want}
		})
		// patch 16: an open tab dropped on a saved tab: a copy goes there
		check('open tab -> saved tab', async () => {
			const [w1] = await fixture(layout)
			const p = await openPopup()
			await drag(p, tabSel('Bravo'), {selector: savedSel('Mike'), fx: 0.1, fy: 0.1})
			const want = {s1: ['Hotel', 'India', 'Juliett', 'Kilo'], s2: ['Lima', 'Bravo', 'Mike', 'November']}
			return {got: await settle(savedTitles, want), want, extra: {open: await titlesOf(w1)}}
		})
		// patch 16: the selected open tabs (two windows) dropped on a saved card
		check('selected open tabs -> saved card', async () => {
			await fixture(layout)
			const p = await openPopup()
			await ctrlClick(p, tabSel('Charlie'))
			await ctrlClick(p, tabSel('Delta'))
			const stacks = await watchStacks(p)
			await drag(p, tabSel('Delta'), '#session-s1 h3.windowTitle')
			// copies go in the order the popup lists the windows (by last focus)
			const listed = (await shownIn(p, '.window:not(.session)')).filter((t) => t === 'Charlie' || t === 'Delta')
			const want = {s1: ['Hotel', 'India', 'Juliett', 'Kilo', ...listed], s2: ['Lima', 'Mike', 'November']}
			return {got: [await settle(savedTitles, want), await stacks()], want: [want, [{tiles: ['Delta', 'Charlie'], label: '2 tabs'}]]}
		})
		// patch 13: a saved card dragged by its title before the other one
		check('saved card reorder', async () => {
			await fixture(layout)
			const p = await openPopup()
			await drag(p, '#session-s2 h3.windowTitle', {selector: '#session-s1', fx: 0.1, fy: 0.1})
			const want = ['s2', 's1']
			return {got: await settle(savedOrder, want), want}
		})
		// across pages: an open tab dragged out of one Tab Manager page onto an
		// open tab in another moves the tab it carries (not the other page's
		// selection)
		check('open tab -> open tab in another Tab Manager page', async () => {
			const [, w2] = await fixture(layout)
			const p = await openPopup()
			const other = await openPopup()
			await p.bringToFront()
			await drag(p, tabSel('Alpha'), {selector: tabSel('Echo'), fx: 0.1, fy: 0.1}, other)
			const want = ['Delta', 'Alpha', 'Echo', 'Foxtrot']
			return {got: await settle(() => titlesOf(w2), want), want}
		}, false)
		// the 6.x behaviour, as a control: an open tab moved to another window
		check('open tab -> open tab', async () => {
			const [, w2] = await fixture(layout)
			const p = await openPopup()
			await drag(p, tabSel('Alpha'), {selector: tabSel('Echo'), fx: 0.1, fy: 0.1})
			const want = ['Delta', 'Alpha', 'Echo', 'Foxtrot']
			return {got: await settle(() => titlesOf(w2), want), want}
		}, false)
	}

	// The keys (Ctrl+Delete, Ctrl+Backspace, Enter with a selection), pressed with the
	// browser's own key events on the focus a click left behind. Own tab only.
	// Ctrl+Delete / Ctrl+Backspace are checked on what the popup shows (a saved tab is
	// hidden at once, written when the Undo countdown ends) and on the open tabs.
	for (const layout of ['blocks', 'vertical']) {
		const key = (name, fn) => checks.push({name: 'keys ' + layout + ': ' + name, fn, mode: 'tab'})
		const windowsNow = () => api(async () => (await chrome.windows.getAll()).map((w) => w.id))
		// the tab titles of the windows that were not there before
		const newWindow = (before, want) => settle(() => api(async (known) => {
			const out = []
			for (const w of await chrome.windows.getAll({populate: true})) {
				if (known.includes(w.id)) continue
				out.push(w.tabs.sort((a, b) => a.index - b.index).map((t) => t.title || t.pendingUrl || t.url))
			}
			return out.length === 1 ? out[0] : out
		}, before), want)
		// Ctrl (Cmd on a Mac) held while `name` is pressed
		const MOD = process.platform === 'darwin' ? 'Meta' : 'Control'
		const withMod = async (p, name) => {
			await p.keyboard.down(MOD)
			await p.keyboard.press(name)
			await p.keyboard.up(MOD)
		}
		// where the keyboard focus is, as the page names it
		const focusAt = (p) => p.evaluate(() => {
			const a = document.activeElement
			return a ? a.tagName + '.' + a.className : null
		})
		key('Ctrl+Delete, saved tabs selected: they go from their saved windows', async () => {
			await fixture(layout)
			const p = await openPopup()
			await ctrlClick(p, savedSel('Juliett'))
			await ctrlClick(p, savedSel('Mike'))
			await withMod(p, 'Delete')
			const want = [['Hotel', 'India', 'Kilo'], ['Lima', 'November']]
			return {got: await settle(async () => [await shownIn(p, '#session-s1'), await shownIn(p, '#session-s2')], want), want}
		})
		key('Ctrl+Backspace, open tabs selected: they close', async () => {
			const [w1] = await fixture(layout)
			const p = await openPopup()
			await ctrlClick(p, tabSel('Alpha'))
			await ctrlClick(p, tabSel('Bravo'))
			await withMod(p, 'Backspace')
			const want = ['Charlie']
			return {got: await settle(() => titlesOf(w1), want), want}
		})
		// 6.x: Delete and Backspace are typing, they go to the search box
		for (const name of ['Delete', 'Backspace']) {
			key('plain ' + name + ', open tabs selected: nothing closes, the search box takes the key', async () => {
				const [w1] = await fixture(layout)
				const p = await openPopup()
				await ctrlClick(p, tabSel('Alpha'))
				await ctrlClick(p, tabSel('Bravo'))
				await p.keyboard.press(name)
				await new Promise((r) => setTimeout(r, 600))
				const want = [['Alpha', 'Bravo', 'Charlie'], 'INPUT.searchBoxInput']
				return {got: [await titlesOf(w1), await focusAt(p)], want}
			})
			key('plain ' + name + ', saved tabs selected: they stay, the search box takes the key', async () => {
				await fixture(layout)
				const p = await openPopup()
				await ctrlClick(p, savedSel('Juliett'))
				await ctrlClick(p, savedSel('Mike'))
				await p.keyboard.press(name)
				await new Promise((r) => setTimeout(r, 600))
				const want = [['Hotel', 'India', 'Juliett', 'Kilo'], ['Lima', 'Mike', 'November'], 'INPUT.searchBoxInput']
				return {got: [await shownIn(p, '#session-s1'), await shownIn(p, '#session-s2'), await focusAt(p)], want}
			})
		}
		key('plain Delete and Backspace in the focused search box edit it: nothing closes', async () => {
			const [w1] = await fixture(layout)
			const p = await openPopup()
			await ctrlClick(p, tabSel('Alpha'))
			await ctrlClick(p, savedSel('Kilo'))
			await ctrlClick(p, tabSel('Bravo'))
			await p.focus('.searchBoxInput')
			await p.keyboard.press('Delete')
			await p.keyboard.press('Backspace')
			await new Promise((r) => setTimeout(r, 600))
			const want = [['Alpha', 'Bravo', 'Charlie'], ['Hotel', 'India', 'Juliett', 'Kilo']]
			return {got: [await titlesOf(w1), await shownIn(p, '#session-s1')], want}
		})
		// the search box holds text: Ctrl+Backspace deletes a word there, and
		// the tabs the search selected stay open
		key('Ctrl+Backspace in the focused search box with text edits the text: nothing closes', async () => {
			const [w1] = await fixture(layout)
			const p = await openPopup()
			await p.focus('.searchBoxInput')
			await p.keyboard.type('Bravo')
			await p.waitForFunction(() => document.querySelector('.searchBoxInput').value === 'Bravo')
			await new Promise((r) => setTimeout(r, 300))
			await withMod(p, 'Backspace')
			await new Promise((r) => setTimeout(r, 600))
			const want = [['Alpha', 'Bravo', 'Charlie'], '']
			return {got: [await titlesOf(w1), await p.$eval('.searchBoxInput', (i) => i.value)], want}
		})
		key('Ctrl+Delete in the focused, empty search box closes the selection', async () => {
			const [w1] = await fixture(layout)
			const p = await openPopup()
			await ctrlClick(p, tabSel('Alpha'))
			await ctrlClick(p, tabSel('Bravo'))
			await p.focus('.searchBoxInput')
			await withMod(p, 'Delete')
			const want = ['Charlie']
			return {got: await settle(() => titlesOf(w1), want), want}
		})
		// Ctrl / Cmd on its own (held, auto-repeating, tapped) never moves the focus
		key('holding Ctrl (or Cmd) does not move the focus', async () => {
			await fixture(layout)
			const p = await openPopup()
			await ctrlClick(p, tabSel('Alpha'))
			const before = await focusAt(p)
			for (const name of ['Control', 'Meta']) {
				await p.keyboard.down(name)
				await p.keyboard.down(name)
				await p.keyboard.down(name)
				await p.keyboard.up(name)
				await p.keyboard.down(name)
				await p.keyboard.up(name)
			}
			await new Promise((r) => setTimeout(r, 300))
			return {got: [await focusAt(p), before === 'INPUT.searchBoxInput'], want: [before, false]}
		})
		// patch 26: the search text does not hold the keys back, only the focus,
		// and selecting takes the focus out of the box
		key('Ctrl+Delete after a search and a right-click select: they close', async () => {
			const [w1] = await fixture(layout)
			const p = await openPopup()
			// the search selects Bravo; the right-click adds Alpha, its mousedown
			// is prevented, so the popup itself must move the focus
			await p.focus('.searchBoxInput')
			await p.keyboard.type('Bravo')
			await p.waitForFunction(() => document.querySelector('.searchBoxInput').value === 'Bravo')
			await new Promise((r) => setTimeout(r, 300))
			await rightClick(p, tabSel('Alpha'))
			await withMod(p, 'Delete')
			const want = [['Charlie'], 'Bravo']
			return {got: [await settle(() => titlesOf(w1), want[0]), await p.$eval('.searchBoxInput', (i) => i.value)], want}
		})
		key('Ctrl+Delete after an arrow select from the empty search box: it closes', async () => {
			const [w1] = await fixture(layout)
			const p = await openPopup()
			await ctrlClick(p, tabSel('Alpha'))
			await p.focus('.searchBoxInput')
			// the next tab: Bravo (the list view's arrows run down the list)
			await p.keyboard.press(layout === 'vertical' ? 'ArrowDown' : 'ArrowRight')
			await withMod(p, 'Delete')
			const want = ['Alpha', 'Charlie']
			return {got: await settle(() => titlesOf(w1), want), want}
		})
		key('Enter, saved tabs selected: one new window, in the order shown', async () => {
			await fixture(layout)
			const p = await openPopup()
			const before = await windowsNow()
			// clicked in the opposite order, from two saved windows
			await ctrlClick(p, savedSel('Mike'))
			await ctrlClick(p, savedSel('Kilo'))
			await ctrlClick(p, savedSel('India'))
			await p.keyboard.press('Enter')
			const want = ['India', 'Kilo', 'Mike']
			const got = await newWindow(before, want)
			return {got: [got, await savedTitles()], want: [want, {s1: ['Hotel', 'India', 'Juliett', 'Kilo'], s2: ['Lima', 'Mike', 'November']}]}
		})
		// a second Enter before the worker answers (quick double press, held key)
		// must not open the same saved tabs in a second window
		for (const how of ['two quick presses', 'a held key']) {
			key('Enter, saved tabs selected, ' + how + ': still one window', async () => {
				await fixture(layout)
				const p = await openPopup()
				const before = await windowsNow()
				await ctrlClick(p, savedSel('India'))
				await ctrlClick(p, savedSel('Kilo'))
				if (how === 'a held key') {
					// down twice without up: the second keydown has repeat set
					await p.keyboard.down('Enter')
					await p.keyboard.down('Enter')
					await p.keyboard.up('Enter')
				} else {
					await Promise.all([p.keyboard.press('Enter'), p.keyboard.press('Enter')])
				}
				const want = ['India', 'Kilo']
				await newWindow(before, want)
				// a duplicate would show up a moment later
				await new Promise((r) => setTimeout(r, 800))
				return {got: await newWindow(before, want), want}
			})
		}
		// an s: search never selects an open tab: Enter must not open an empty window
		key('Enter after an s: search that selected nothing: no new window', async () => {
			await fixture(layout)
			const p = await openPopup()
			const before = await windowsNow()
			await p.focus('.searchBoxInput')
			await p.keyboard.type('s:Kilo')
			await new Promise((r) => setTimeout(r, 300))
			await p.keyboard.press('Enter')
			await new Promise((r) => setTimeout(r, 800))
			const want = []
			return {got: await newWindow(before, want), want}
		})
		key('Enter, open tabs selected: the old move to a new window', async () => {
			await fixture(layout)
			const p = await openPopup()
			const before = await windowsNow()
			await ctrlClick(p, tabSel('Bravo'))
			await ctrlClick(p, tabSel('Charlie'))
			await p.keyboard.press('Enter')
			const want = ['Bravo', 'Charlie']
			return {got: await newWindow(before, want), want}
		})
	}

	for (const c of checks) {
		if (only && !c.name.includes(only)) continue
		mode = c.mode
		const t0 = Date.now()
		let ok = false, detail = ''
		try {
			const {got, want, extra} = await c.fn()
			ok = JSON.stringify(got) === JSON.stringify(want)
			if (!ok) detail = 'want ' + JSON.stringify(want) + '\n      got  ' + JSON.stringify(got) + (extra ? '\n      ' + JSON.stringify(extra) : '')
		} catch (e) {
			detail = String(e && e.message || e)
		}
		await closePopups()
		if (!ok) failures++
		results.push({name: c.name, ok})
		console.log((ok ? 'ok   ' : 'FAIL ') + c.name + '  (' + (Date.now() - t0) + ' ms)' + (detail ? '\n      ' + detail : ''))
	}
} catch (e) {
	failures++
	console.error(e)
} finally {
	await browser.close().catch(() => {})
	server.close()
	try { rmSync(profile, {recursive: true, force: true}) } catch {}
}
console.log((failures ? failures + ' failed' : 'all ' + results.length + ' passed') + ' in ' + Math.round((Date.now() - started) / 1000) + ' s')
process.exit(failures ? 1 : 0)
