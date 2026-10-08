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
import {existsSync, readdirSync, readFileSync, mkdtempSync, rmSync} from 'node:fs'
import {tmpdir, homedir} from 'node:os'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {monitorChecks} from './monitors.mjs'

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
	async function fixture(layout, theme = 'light') {
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
			layout, animations: true, windowTitles: true, tabactions: true, sessionsFeature: true, theme,
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

	// runs in the popup before its scripts: windows.getAll says the window with
	// this id, and its tabs, are private
	function makePrivate(id) {
		const orig = chrome.windows.getAll
		chrome.windows.getAll = function (...args) {
			const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null
			const fix = (ws) => ws.map((w) => w.id === id ? {...w, incognito: true, tabs: (w.tabs || []).map((t) => ({...t, incognito: true}))} : w)
			if (!cb) return orig.apply(chrome.windows, args).then(fix)
			return orig.call(chrome.windows, ...args, (ws) => cb(fix(ws)))
		}
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
	// `opts.privateWindow`: the id of an open window the popup is told is private
	// (the headless browser has no private windows the extension may see);
	// `opts.beforeLoad(arg)`, with `opts.beforeLoadArg`: runs in the popup before its scripts
	async function openPopup(opts = {}) {
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
			if (opts.privateWindow) await p.evaluateOnNewDocument(makePrivate, opts.privateWindow)
			if (opts.beforeLoad) await p.evaluateOnNewDocument(opts.beforeLoad, opts.beforeLoadArg)
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
	// `opts.afterStart` runs once the drag has started and before it moves on: a
	// change made behind the drag's back (a saved tab deleted by another popup).
	// `opts.moveOn` (a selector, or {selector, fx, fy}): after a few dragovers on
	// `to`, the pointer moves on there, and the drop / the release happens there.
	// `opts.cancel`: no drop; the drag leaves the page and ends outside it (the
	// way Chrome reports a release over another window, or Escape).
	async function drag(p, from, to, into = p, opts = {}) {
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
			if (opts.afterStart) await opts.afterStart()
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
			let end = dst
			if (opts.moveOn) {
				const on = opts.moveOn
				end = await point(into, on.selector || on, on.fx, on.fy)
				const n = Math.max(1, Math.round(Math.hypot(end.x - dst.x, end.y - dst.y) / 24))
				for (let i = 1; i <= n; i++) {
					await dragEvent('dragOver', {x: dst.x + (end.x - dst.x) * i / n, y: dst.y + (end.y - dst.y) * i / n})
					await new Promise((r) => setTimeout(r, 8))
				}
				for (let i = 0; i < 3; i++) {
					await dragEvent('dragOver', end)
					await new Promise((r) => setTimeout(r, 30))
				}
			}
			if (opts.cancel) {
				// out of the viewport, left of it, then the end out there
				const out = {x: -40, y: end.y}
				await dragEvent('dragOver', out)
				await new Promise((r) => setTimeout(r, 30))
				await dragEvent('dragCancel', out)
			}
			else await dragEvent('drop', end)
			// the page it left: the drag ends there, dropped elsewhere
			if (into !== p) await cdp.send('Input.dispatchDragEvent', {type: 'dragCancel', x: 0, y: 0, data})
			await mouse('mouseReleased', into === p ? end : src, {buttons: 0, clickCount: 1})
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
	// several-tab drag image, src/popup/dragImage.ts), as it looks while it
	// is built: its kind (titled / icons / icons-big, the class on the
	// stack), the tiles front first (their title, '' when the stack has
	// none), the count, whether every tile has a favicon image, whether the
	// tiles are the size of the popup's own tab tiles (icon stacks; and the
	// favicon in them the size of the favicon in a tab tile), and whether the
	// front tile has the theme's tile colours. Resolves to the list once called.
	async function watchStacks(p) {
		await p.evaluate(() => {
			window.__stacks = []
			new MutationObserver((records) => {
				for (const r of records) for (const n of r.addedNodes) {
					if (!(n instanceof HTMLElement) || !n.classList.contains('drag-stack')) continue
					const tiles = [...n.querySelectorAll('.drag-tile')].reverse()
					const kind = ['titled', 'icons', 'icons-big'].find((k) => n.classList.contains(k)) || '?'
					const size = (el) => { const c = getComputedStyle(el); return c.width + 'x' + c.height }
					// the real tab tile and its favicon, as the layout draws them
					const real = document.querySelector('.window:not(.session) .tab')
					const realIcon = getComputedStyle(real, '::after').backgroundSize
					const probe = document.createElement('div')
					probe.style.cssText = 'background-color: var(--tile-bg); border: 1px solid var(--tile-border)'
					document.body.append(probe)
					const want = getComputedStyle(probe)
					const front = getComputedStyle(tiles[0])
					const colours = front.backgroundColor === want.backgroundColor && front.borderTopColor === want.borderTopColor
					probe.remove()
					const sized = kind === 'titled' || tiles.every((t) => {
						const fav = getComputedStyle(t.querySelector('.drag-fav'))
						return size(t) === size(real) && fav.width + ' ' + fav.height === realIcon
					})
					window.__stacks.push({
						kind,
						tiles: tiles.map((t) => t.querySelector('.drag-title')?.textContent ?? ''),
						label: n.querySelector('.drag-count')?.textContent,
						favicons: tiles.every((t) => { const bg = getComputedStyle(t.querySelector('.drag-fav')).backgroundImage; return bg !== 'none' && bg !== '' }),
						sized,
						colours,
					})
				}
			}).observe(document.body, {childList: true})
		})
		return () => p.evaluate(() => window.__stacks)
	}
	// What watchStacks records for a drag of `titles` (front first) in `layout`
	const KIND = {blocks: 'icons', 'blocks-big': 'icons-big', horizontal: 'icons', vertical: 'titled'}
	const stackWant = (layout, titles) => ({kind: KIND[layout], tiles: titles.map((t) => KIND[layout] === 'titled' ? t : ''),
		label: titles.length + ' tabs', favicons: true, sized: true, colours: true})
	// Records what the page answers to a drag, as the browser decides it: the
	// last dragover's operation (none unless the page cancelled it with a
	// dropEffect other than none), the drop markers on screen after it, how many
	// drop events came, and the dropEffect of every dragend. Chrome delivers a
	// drop only where the last dragover allowed one, so `drops` 0 with an
	// operation none is what a refused drop does. Resolves to a reader.
	async function watchDrag(p) {
		await p.evaluate(() => {
			const markers = () => document.querySelectorAll('.tab.left, .tab.right, .tab.top, .tab.bottom, .window.session[class*="drop-"]').length
			const seen = window.__seen = {last: null, drops: 0, ends: []}
			document.addEventListener('dragover', (e) => {
				const rec = seen.last = {operation: 'none', markers: 0}
				// after the page's handlers (and React's render) have run
				setTimeout(() => { rec.operation = e.defaultPrevented ? e.dataTransfer.dropEffect : 'none'; rec.markers = markers() }, 0)
			}, true)
			document.addEventListener('drop', () => { seen.drops++ }, true)
			document.addEventListener('dragend', (e) => { seen.ends.push(e.dataTransfer.dropEffect) }, true)
		})
		// [operation, marker?, drop events, dragend effects], each reduced to
		// allowed / none
		return () => p.evaluate(() => {
			const s = window.__seen
			const op = s.last ? s.last.operation : 'no dragover'
			return [op === 'none' || op === 'no dragover' ? op : 'allowed', s.last && s.last.markers > 0 ? 'marker' : 'no marker', s.drops, s.ends.map((e) => e === 'none' ? 'none' : 'allowed')]
		})
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

	// Shift+right-click: selects the range from the last selected tab
	async function rangeClick(p, selector) {
		const at = await point(p, selector)
		const cdp = await p.createCDPSession()
		await cdp.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: at.x, y: at.y, modifiers: 8})
		await cdp.send('Input.dispatchMouseEvent', {type: 'mousePressed', x: at.x, y: at.y, button: 'right', buttons: 2, clickCount: 1, modifiers: 8})
		await cdp.send('Input.dispatchMouseEvent', {type: 'mouseReleased', x: at.x, y: at.y, button: 'right', buttons: 0, clickCount: 1, modifiers: 8})
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
			// the drag image: two tiles, Mike (dragged) in front, and the count (titled
			// in List, icons only in the layouts that show tabs as icons)
			return {got: [await settle(() => titlesOf(w1), want), await stacks()], want: [want, [stackWant(layout, ['Mike', 'Juliett'])]]}
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
			return {got: [await settle(savedTitles, want), await stacks()], want: [want, [stackWant(layout, ['Delta', 'Charlie'])]]}
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

	// The drag image of a drag that takes several tabs follows the layout:
	// titled rows in List, icon tiles only (the size of that layout's tab
	// tiles) in Blocks, Big blocks and Rows. Three tabs, saved and open, light
	// and dark, in the own tab; what the page builds for setDragImage is
	// recorded (watchStacks), the drag runs as every other check's does.
	for (const layout of ['blocks', 'blocks-big', 'horizontal', 'vertical']) {
		for (const theme of ['light', 'dark']) {
			const image = (name, fn) => checks.push({name: 'drag image ' + layout + ' ' + theme + ': ' + name, fn, mode: 'tab'})
			image('three saved tabs', async () => {
				await fixture(layout, theme)
				const p = await openPopup()
				await ctrlClick(p, savedSel('Hotel'))
				await ctrlClick(p, savedSel('Juliett'))
				await ctrlClick(p, savedSel('Mike'))
				const stacks = await watchStacks(p)
				await drag(p, savedSel('Mike'), {selector: tabSel('Charlie'), fx: 0.9, fy: 0.9})
				// Mike is dragged: in front, the other two behind him in saved order
				return {got: await stacks(), want: [stackWant(layout, ['Mike', 'Hotel', 'Juliett'])]}
			})
			image('three open tabs', async () => {
				await fixture(layout, theme)
				const p = await openPopup()
				await ctrlClick(p, tabSel('Alpha'))
				await ctrlClick(p, tabSel('Bravo'))
				await ctrlClick(p, tabSel('Echo'))
				const stacks = await watchStacks(p)
				await drag(p, tabSel('Echo'), '#session-s1 h3.windowTitle')
				// Echo in front; the two behind it are the other selected tabs
				const got = (await stacks()).map((st) => ({...st, tiles: st.tiles[0] === 'Echo' || st.tiles[0] === '' ? [st.tiles[0], ...st.tiles.slice(1).sort()] : st.tiles}))
				return {got, want: [stackWant(layout, ['Echo', 'Alpha', 'Bravo'])]}
			})
		}
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
		// the arrow that walks to the next tab (the list view's run down the list)
		const NEXT = layout === 'vertical' ? 'ArrowDown' : 'ArrowRight'
		// the open tabs the popup shows selected, and the one with the cursor ring
		const titlesWith = (p, cls) => p.evaluate((cls) => [...document.querySelectorAll('.window:not(.session) .tab.' + cls)]
			.map((t) => (t.getAttribute('data-hover') || '').split('\n')[0]).sort(), cls)
		const selectedOf = (p) => titlesWith(p, 'selected')
		const ringed = (p) => titlesWith(p, 'key-cursor')
		// the title of a window's active tab
		const activeOf = (windowId) => api(async (id) => {
			const [t] = await chrome.tabs.query({windowId: id, active: true})
			return t ? t.title : null
		}, windowId)
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
		// 7.0: the arrows move the cursor, not the selection: Ctrl+Delete closes
		// what is selected (Alpha), not the tab the arrow went to (Bravo)
		key('Ctrl+Delete after an arrow from the empty search box: it closes the selection, not the cursor tab', async () => {
			const [w1] = await fixture(layout)
			const p = await openPopup()
			await ctrlClick(p, tabSel('Alpha'))
			await p.focus('.searchBoxInput')
			// the next tab: Bravo (the list view's arrows run down the list)
			await p.keyboard.press(NEXT)
			await withMod(p, 'Delete')
			const want = ['Bravo', 'Charlie']
			return {got: await settle(() => titlesOf(w1), want), want}
		})
		// The keyboard cursor (7.0, src/popup/arrowWalk.ts): a plain arrow moves
		// the ring and leaves the selection; Shift+arrow selects as it goes; Space
		// selects the cursor tab; Enter with nothing selected switches to it. A
		// Ctrl+click twice on Alpha leaves the cursor there and nothing selected.
		key('plain arrows move the ring and leave the selection alone', async () => {
			await fixture(layout)
			const p = await openPopup()
			await ctrlClick(p, tabSel('Alpha'))
			await p.keyboard.press(NEXT)
			await p.keyboard.press(NEXT)
			const want = [['Charlie'], ['Alpha']]
			return {got: [await settle(() => ringed(p), want[0]), await selectedOf(p)], want}
		})
		key('Shift+arrow twice from a tab with nothing selected selects three tabs', async () => {
			await fixture(layout)
			const p = await openPopup()
			await ctrlClick(p, tabSel('Alpha'))
			await ctrlClick(p, tabSel('Alpha'))
			const before = await selectedOf(p)
			await p.keyboard.down('Shift')
			await p.keyboard.press(NEXT)
			await p.keyboard.press(NEXT)
			await p.keyboard.up('Shift')
			const want = [[], ['Alpha', 'Bravo', 'Charlie'], ['Charlie']]
			return {got: [before, await settle(() => selectedOf(p), want[1]), await ringed(p)], want}
		})
		key('arrow, arrow, Space selects only the third tab', async () => {
			await fixture(layout)
			const p = await openPopup()
			await ctrlClick(p, tabSel('Alpha'))
			await ctrlClick(p, tabSel('Alpha'))
			await p.keyboard.press(NEXT)
			await p.keyboard.press(NEXT)
			await p.keyboard.press('Space')
			const want = [['Charlie'], ['Charlie'], '']
			return {got: [await settle(() => selectedOf(p), want[0]), await ringed(p), await p.$eval('.searchBoxInput', (i) => i.value)], want}
		})
		key('Enter after an arrow with nothing selected switches to the cursor tab, no window opens', async () => {
			const [w1] = await fixture(layout)
			const p = await openPopup()
			const before = await windowsNow()
			const activeBefore = await activeOf(w1)
			await ctrlClick(p, tabSel('Alpha'))
			await ctrlClick(p, tabSel('Alpha'))
			await p.keyboard.press(NEXT)
			await p.keyboard.press('Enter')
			await new Promise((r) => setTimeout(r, 600))
			const want = ['Alpha', 'Bravo', []]
			return {got: [activeBefore, await settle(() => activeOf(w1), want[1]), await newWindow(before, [])], want}
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
		// Ctrl+Z (Cmd+Z on a Mac) and the Undo notices (patch notices3)
		const undoNotices = (p) => p.evaluate(() => [...document.querySelectorAll('.notice.undo .notice-text')].map((n) => n.textContent))
		const boxValue = (p) => p.$eval('.searchBoxInput', (i) => i.value)
		const typeInBox = async (p, text) => {
			await p.focus('.searchBoxInput')
			await p.keyboard.type(text)
			await p.waitForFunction((t) => document.querySelector('.searchBoxInput').value === t, {}, text)
			await new Promise((r) => setTimeout(r, 300))
		}
		key('undo: Ctrl+Z with text in the focused search box takes back the delete, the text stays', async () => {
			await fixture(layout)
			const p = await openPopup()
			await ctrlClick(p, savedSel('Juliett'))
			await withMod(p, 'Delete')
			await p.waitForSelector('.notice.undo')
			await typeInBox(p, 'Bravo')
			await withMod(p, 'KeyZ')
			const want = [['Hotel', 'India', 'Juliett', 'Kilo'], 'Bravo', []]
			return {got: [await settle(() => shownIn(p, '#session-s1'), want[0]), await boxValue(p), await undoNotices(p)], want}
		})
		key('undo: with no Undo notice, Ctrl+Z in the search box is the text\'s own undo', async () => {
			await fixture(layout)
			const p = await openPopup()
			await typeInBox(p, 'Bravo')
			await withMod(p, 'KeyZ')
			await new Promise((r) => setTimeout(r, 300))
			const want = [true, ['Hotel', 'India', 'Juliett', 'Kilo']]
			return {got: [(await boxValue(p)) !== 'Bravo', await shownIn(p, '#session-s1')], want}
		})
		key('undo: two stacked Undo notices, Ctrl+Z takes back the newest first, then the next', async () => {
			await fixture(layout)
			const p = await openPopup()
			// every tab of "Taxes" dragged into "Reading": "Taxes" is removed, Undo notice 1
			await ctrlClick(p, savedSel('Lima'))
			await ctrlClick(p, savedSel('Mike'))
			await ctrlClick(p, savedSel('November'))
			await drag(p, savedSel('November'), '#session-s1 h3.windowTitle')
			const all = ['Hotel', 'India', 'Juliett', 'Kilo', 'Lima', 'Mike', 'November']
			await settle(savedTitles, {s1: all})
			// then "Reading" deleted: Undo notice 2, under the first
			await click(p, '#session-s1 .icon.tabaction.delete')
			const shown = () => Promise.all([shownIn(p, '#session-s1'), shownIn(p, '#session-s2'), undoNotices(p)])
			const both = await settle(shown, [[], [], ['Removed “Taxes” (left empty)', 'Deleted “Reading” (7 tabs)']])
			await withMod(p, 'KeyZ')
			const first = await settle(shown, [all, [], ['Removed “Taxes” (left empty)']])
			await withMod(p, 'KeyZ')
			const second = await settle(shown, [['Hotel', 'India', 'Juliett', 'Kilo'], ['Lima', 'Mike', 'November'], []])
			const want = [
				[[], [], ['Removed “Taxes” (left empty)', 'Deleted “Reading” (7 tabs)']],
				[all, [], ['Removed “Taxes” (left empty)']],
				[['Hotel', 'India', 'Juliett', 'Kilo'], ['Lima', 'Mike', 'November'], []],
				{s1: ['Hotel', 'India', 'Juliett', 'Kilo'], s2: ['Lima', 'Mike', 'November']},
			]
			return {got: [both, first, second, await settle(savedTitles, want[3])], want}
		})
		// a held Ctrl+Z (auto-repeat) takes back one notice, not the whole stack
		key('undo: Ctrl+Z held down takes back only the newest notice', async () => {
			await fixture(layout)
			const p = await openPopup()
			await ctrlClick(p, savedSel('Lima'))
			await ctrlClick(p, savedSel('Mike'))
			await ctrlClick(p, savedSel('November'))
			await drag(p, savedSel('November'), '#session-s1 h3.windowTitle')
			const all = ['Hotel', 'India', 'Juliett', 'Kilo', 'Lima', 'Mike', 'November']
			await settle(savedTitles, {s1: all})
			await click(p, '#session-s1 .icon.tabaction.delete')
			await settle(() => undoNotices(p), ['Removed “Taxes” (left empty)', 'Deleted “Reading” (7 tabs)'])
			// the second and third keydowns carry repeat: true
			await p.keyboard.down(MOD)
			for (let i = 0; i < 4; i++) {
				await p.keyboard.down('KeyZ')
				await new Promise((r) => setTimeout(r, 60))
			}
			await p.keyboard.up('KeyZ')
			await p.keyboard.up(MOD)
			await new Promise((r) => setTimeout(r, 600))
			const want = [all, ['Removed “Taxes” (left empty)'], {s1: all}]
			return {got: [await settle(() => shownIn(p, '#session-s1'), want[0]), await undoNotices(p), await savedTitles()], want}
		})
		key('undo: a delete and then a move each keep their notice; the older Undo button still works', async () => {
			await fixture(layout)
			const p = await openPopup()
			await ctrlClick(p, savedSel('Hotel'))
			await withMod(p, 'Delete')
			await p.waitForSelector('.notice.undo')
			// every tab of "Taxes" into "Reading": the delete is not written, its notice stays
			await ctrlClick(p, savedSel('Lima'))
			await ctrlClick(p, savedSel('Mike'))
			await ctrlClick(p, savedSel('November'))
			await drag(p, savedSel('November'), '#session-s1 h3.windowTitle')
			const notices = await settle(() => undoNotices(p), ['Deleted 1 tab from “Reading”', 'Removed “Taxes” (left empty)'])
			// Undo on the older notice (the delete): Hotel is back, the move stays
			await click(p, '.notice.undo .notice-undo')
			const want = [['Deleted 1 tab from “Reading”', 'Removed “Taxes” (left empty)'],
				['Hotel', 'India', 'Juliett', 'Kilo', 'Lima', 'Mike', 'November'], ['Removed “Taxes” (left empty)']]
			return {got: [notices, await settle(() => shownIn(p, '#session-s1'), want[1]), await undoNotices(p)], want}
		})
	}

	// Round 3, drops3, with real drags and real keys, and Round 4. (a) Selected
	// tabs are always shown: tabs selected and then non-matching under "Hide
	// non-matching tabs" stay on screen (faded, selected, with their window), so
	// every selected tab takes part in every move, and the drag image counts them
	// all. (b) A drop that does nothing, or only part of what was dragged, says
	// why in the red notice: private and normal never mix (a saved window marked
	// private is seeded; the headless browser has no private windows), the
	// dragged saved tab is gone (deleted behind the drag's back). A drop refused
	// for a reason shows no marker, but must still be taken by the page (the drop
	// event has to come for the notice to be shown). Own tab, Blocks and List.
	for (const layout of ['blocks', 'vertical']) {
		const drops = (name, fn) => checks.push({name: 'drops ' + layout + ': ' + name, fn, mode: 'tab'})
		const SEARCH = 'Alpha OR Charlie OR Delta'
		const windowsNow = () => api(async () => (await chrome.windows.getAll()).map((w) => w.id))
		const newWindows = (known, want) => settle(() => api(async (known) => {
			const out = []
			for (const w of await chrome.windows.getAll({populate: true})) {
				if (known.includes(w.id)) continue
				out.push(w.tabs.map((t) => t.title || t.pendingUrl || t.url).sort())
			}
			return out
		}, known), want)
		const sorted = (titles) => [...titles].sort()
		const selectedIn = (p, card) => p.evaluate((card) => [...document.querySelectorAll(card + ' .tab.selected')]
			.map((t) => (t.getAttribute('data-hover') || '').split('\n')[0]).sort(), card)
		const noticesOf = (p) => p.evaluate(() => [...document.querySelectorAll('.notice.error .notice-text')].map((e) => e.textContent))
		// Selected tabs are always shown (Round 4): a search, a Ctrl+click on a tab
		// it fades (Bravo) and "Hide non-matching tabs" leave that tab on screen,
		// faded and still selected, with its window; the unselected non-matches hide.
		async function shownSelected(p, query = SEARCH, extra = [], hides = tabSel('Echo')) {
			await p.focus('.searchBoxInput')
			await p.keyboard.type(query)
			await p.waitForFunction((q) => document.querySelector('.searchBoxInput').value === q, {}, query)
			await new Promise((r) => setTimeout(r, 400))
			for (const sel of extra) await ctrlClick(p, sel)
			await click(p, '.windowaction.filter')
			await p.waitForFunction(() => document.querySelector('.windowaction.filter.enabled'), {timeout: 3000})
			// an unselected non-match is gone (Echo), so the filter is on
			await p.waitForFunction((sel) => [...document.querySelectorAll(sel)].every((t) => !t.offsetParent), {timeout: 3000}, hides)
		}
		// the faded tabs on screen of a card
		const fadedIn = (p, card) => p.evaluate((card) => [...document.querySelectorAll(card + ' .tab.search-faded')]
			.filter((t) => t.offsetParent).map((t) => (t.getAttribute('data-hover') || '').split('\n')[0]).sort(), card)
		// the drag image's count and its front tile, as the page built them
		const stackOf = async (stacks) => (await stacks()).map((st) => ({label: st.label, tiles: st.tiles.length, front: st.tiles[0]}))
		const stackIs = (count, front) => [{label: count + ' tabs', tiles: Math.min(count, 3), front: layout === 'vertical' ? front : ''}]
		// a saved window, as the fixture makes them
		const savedWindow = (id, name, titles, extra = {}) => {
			const now = Date.now()
			return {id, name, color: 'color9', customName: true, incognito: false, date: now - 864e5, sessionStartTime: now - 864e5, order: 5,
				tabs: titles.map((t, i) => ({id: 9100 + i, index: i, windowId: 900, title: t, url: page(t), active: i === 0, pinned: false, audible: false,
					discarded: false, highlighted: i === 0, incognito: !!extra.incognito, status: 'complete'})),
				windowsInfo: {id: 900, focused: false, incognito: !!extra.incognito, type: 'normal', state: 'normal', left: 0, top: 0, width: 900, height: 700}, ...extra}
		}
		// the stored saved windows changed before the popup opens (patch: fields to set by id; add: new ones)
		const seedSaved = (patch = {}, add = {}) => api(async (patch, add) => {
			const {sessions} = await chrome.storage.local.get('sessions')
			for (const [id, fields] of Object.entries(patch)) Object.assign(sessions[id], fields)
			Object.assign(sessions, add)
			await chrome.storage.local.set({sessions})
		}, patch, add)
		const SAVED = {s1: ['Hotel', 'India', 'Juliett', 'Kilo'], s2: ['Lima', 'Mike', 'November']}
		const WINDOWS = '.window:not(.session)'

		// (a) selected tabs are always shown, and every one of them takes part
		drops('selected non-matching tab: stays on screen, faded and selected, with the others it was selected with', async () => {
			await fixture(layout)
			const p = await openPopup()
			await shownSelected(p, SEARCH, [tabSel('Bravo')])
			const want = [['Alpha', 'Bravo', 'Charlie', 'Delta'], ['Alpha', 'Bravo', 'Charlie', 'Delta'], ['Bravo'], false]
			// Bravo fades like Echo would (Alpha, Charlie and Delta match); Echo and Foxtrot are not selected: still hidden
			const got = [sorted(await shownIn(p, WINDOWS)), await selectedIn(p, WINDOWS), await fadedIn(p, WINDOWS)]
			got.push(await p.evaluate((sel) => [...document.querySelectorAll(sel)].some((t) => t.offsetParent), tabSel('Echo')))
			return {got, want}
		})
		drops('selected non-matching tab: dropped on a tab, all four selected tabs move, the stack says 4', async () => {
			const [, w2] = await fixture(layout)
			const p = await openPopup()
			await shownSelected(p, SEARCH, [tabSel('Bravo')])
			const stacks = await watchStacks(p)
			await drag(p, tabSel('Alpha'), {selector: tabSel('Delta'), fx: 0.1, fy: 0.1})
			const want = [['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'], stackIs(4, 'Alpha')]
			const got = [await settle(async () => sorted(await titlesOf(w2)), want[0])]
			got.push(await stackOf(stacks))
			return {got, want}
		})
		drops('selected non-matching tab: dropped on a saved window, the copies are all four', async () => {
			const [w1] = await fixture(layout)
			const p = await openPopup()
			// (Hotel matches too, so the saved window stays on screen to be dropped on)
			await shownSelected(p, SEARCH + ' OR Hotel', [tabSel('Bravo')])
			const stacks = await watchStacks(p)
			await drag(p, tabSel('Alpha'), '#session-s1 h3.windowTitle')
			const want = [['Alpha', 'Bravo', 'Charlie', 'Delta', 'Hotel', 'India', 'Juliett', 'Kilo'], ['Alpha', 'Bravo', 'Charlie'], stackIs(4, 'Alpha')]
			const got = [await settle(async () => sorted((await savedTitles()).s1), want[0])]
			got.push(sorted(await titlesOf(w1)))
			got.push(await stackOf(stacks))
			return {got, want}
		})
		// Enter, the other way tabs move to a new window
		drops('selected non-matching tab: Enter moves all four to a new window', async () => {
			const [, w2] = await fixture(layout)
			const p = await openPopup()
			const known = await windowsNow()
			await shownSelected(p, SEARCH, [tabSel('Bravo')])
			await p.focus('.searchBoxInput')
			await p.keyboard.press('Enter')
			const want = [[['Alpha', 'Bravo', 'Charlie', 'Delta']], ['Echo', 'Foxtrot']]
			const got = [await newWindows(known, want[0])]
			got.push(await settle(() => titlesOf(w2), want[1]))
			return {got, want}
		})
		drops('selected non-matching tab alone: stays on screen, Enter switches to it, no window opens', async () => {
			const [w1] = await fixture(layout)
			const p = await openPopup()
			const known = await windowsNow()
			// Alpha is the only match (selected); Bravo is added, Alpha deselected again
			await shownSelected(p, 'Alpha', [tabSel('Bravo')], tabSel('Charlie'))
			await ctrlClick(p, tabSel('Alpha'))
			const shown = sorted(await shownIn(p, WINDOWS))
			await p.focus('.searchBoxInput')
			await p.keyboard.press('Enter')
			await new Promise((r) => setTimeout(r, 600))
			const want = [['Alpha', 'Bravo'], [], ['Alpha', 'Bravo', 'Charlie'], []]
			const got = [shown, await newWindows(known, []), sorted(await titlesOf(w1)), await noticesOf(p)]
			return {got, want}
		})
		// A new search replaces only what the search selected: the tab selected
		// by hand (Bravo) stays selected, so on screen, though it matches neither
		// search; Charlie, selected by the first search, leaves and hides.
		drops('selected non-matching tab: a new search keeps it selected and on screen, and takes back only what the last search selected', async () => {
			await fixture(layout)
			const p = await openPopup()
			await shownSelected(p, SEARCH, [tabSel('Bravo')])
			await p.focus('.searchBoxInput')
			await p.keyboard.down('Control')
			await p.keyboard.press('KeyA')
			await p.keyboard.up('Control')
			await p.keyboard.type('Alpha OR Delta OR Echo')
			const want = [['Alpha', 'Bravo', 'Delta', 'Echo'], ['Alpha', 'Bravo', 'Delta', 'Echo'], ['Bravo']]
			const got = [await settle(async () => sorted(await shownIn(p, WINDOWS)), want[0])]
			got.push(await selectedIn(p, WINDOWS))
			got.push(await fadedIn(p, WINDOWS))
			return {got, want}
		})
		// a range takes only the tabs on screen: Bravo, hidden between Alpha and
		// Charlie, is not selected (and so does not show up under the pointer)
		drops('a range with Hide non-matching tabs on skips the hidden tabs between its ends', async () => {
			await fixture(layout)
			const p = await openPopup()
			await shownSelected(p, SEARCH, [], tabSel('Bravo'))
			// Alpha deselected and selected again by hand: the range starts there
			await ctrlClick(p, tabSel('Alpha'))
			await ctrlClick(p, tabSel('Alpha'))
			await rangeClick(p, tabSel('Charlie'))
			await new Promise((r) => setTimeout(r, 300))
			const want = [['Alpha', 'Charlie', 'Delta'], ['Alpha', 'Charlie', 'Delta']]
			return {got: [sorted(await shownIn(p, WINDOWS)), await selectedIn(p, WINDOWS)], want}
		})
		// the arrows go on from a selected tab that does not match (it is on
		// screen): the cursor (the Ctrl+click left it on Bravo) goes to Charlie, not
		// back to the first match, and the selection stays as it is (7.0)
		drops('the arrow keys go on from a selected non-matching tab to the next match', async () => {
			await fixture(layout)
			const p = await openPopup()
			await shownSelected(p, 'Alpha OR Charlie', [tabSel('Alpha'), tabSel('Charlie'), tabSel('Bravo')], tabSel('Delta'))
			const before = await selectedIn(p, WINDOWS)
			await p.keyboard.press(layout === 'vertical' ? 'ArrowDown' : 'ArrowRight')
			const ring = () => p.evaluate(() => [...document.querySelectorAll('.window:not(.session) .tab.key-cursor')].map((t) => (t.getAttribute('data-hover') || '').split('\n')[0]))
			const want = [['Bravo'], ['Charlie'], ['Bravo']]
			return {got: [before, await settle(ring, want[1]), await selectedIn(p, WINDOWS)], want}
		})
		// an open tab dragged while saved tabs are selected goes alone: the saved
		// selection, and the saved window it keeps on screen, stay
		drops('an unselected open tab dragged while a saved tab is selected: it moves alone, the saved tab stays selected and on screen', async () => {
			const [, w2] = await fixture(layout)
			const p = await openPopup()
			await shownSelected(p, 'Alpha OR Delta', [savedSel('Kilo')])
			const before = sorted(await shownIn(p, '.session'))
			let during = null
			await drag(p, tabSel('Alpha'), {selector: tabSel('Delta'), fx: 0.1, fy: 0.1}, p, {afterStart: async () => {
				await new Promise((r) => setTimeout(r, 200))
				during = sorted(await shownIn(p, '.session'))
			}})
			const want = [['Kilo'], ['Kilo'], ['Alpha', 'Delta', 'Echo', 'Foxtrot'], ['Kilo'], ['Kilo']]
			const got = [before, during, await settle(async () => sorted(await titlesOf(w2)), want[2])]
			got.push(await selectedIn(p, '.session'))
			got.push(sorted(await shownIn(p, '.session')))
			return {got, want}
		})
		// the saved side of the same rule
		drops('selected non-matching saved tab: dragged out with the others, all three open, the saved window is unchanged', async () => {
			const [, w2] = await fixture(layout)
			const p = await openPopup()
			// Hotel and India match (and Delta, the target), Kilo does not: Ctrl+clicked, then shown anyway
			await shownSelected(p, 'Hotel OR India OR Delta', [savedSel('Hotel'), savedSel('India'), savedSel('Kilo')], savedSel('Juliett'))
			const shown = sorted(await shownIn(p, '.session'))
			const stacks = await watchStacks(p)
			await drag(p, savedSel('Hotel'), {selector: tabSel('Delta'), fx: 0.1, fy: 0.1})
			const want = [['Hotel', 'India', 'Kilo'], ['Delta', 'Echo', 'Foxtrot', 'Hotel', 'India', 'Kilo'], SAVED, stackIs(3, 'Hotel')]
			const got = [shown]
			got.push(await settle(async () => sorted(await titlesOf(w2)), want[1]))
			got.push(await savedTitles())
			got.push(await stackOf(stacks))
			return {got, want}
		})
		// Enter on saved tabs follows the same rule
		drops('selected non-matching saved tab: Enter opens all three', async () => {
			await fixture(layout)
			const p = await openPopup()
			const known = await windowsNow()
			await shownSelected(p, 'Hotel OR India OR Delta', [savedSel('Hotel'), savedSel('India'), savedSel('Kilo')], savedSel('Juliett'))
			await p.focus('.searchBoxInput')
			await p.keyboard.press('Enter')
			const want = [[['Hotel', 'India', 'Kilo']], SAVED]
			const got = [await newWindows(known, want[0])]
			got.push(await savedTitles())
			return {got, want}
		})
		drops('only a non-matching saved tab selected: it stays on screen with its saved window, Enter opens it', async () => {
			await fixture(layout)
			const p = await openPopup()
			const known = await windowsNow()
			await shownSelected(p, 'Hotel OR India OR Delta', [savedSel('Kilo')], savedSel('Juliett'))
			// "Taxes" has no match and no selected tab: gone; "Reading" stays with Hotel, India and Kilo
			const want = [['Hotel', 'India', 'Kilo'], [['Kilo']], SAVED, []]
			const got = [sorted(await shownIn(p, '.session'))]
			await p.focus('.searchBoxInput')
			await p.keyboard.press('Enter')
			got.push(await newWindows(known, want[1]))
			got.push(await savedTitles())
			got.push(await noticesOf(p))
			return {got, want}
		})

		// (b) drops that do nothing, or only part, say why
		drops('normal saved tab dropped on a private saved window: refused, nothing moves, the notice says why', async () => {
			await fixture(layout)
			await seedSaved({s2: {incognito: true}})
			const p = await openPopup()
			await drag(p, savedSel('Hotel'), '#session-s2 h3.windowTitle')
			const want = [["Nothing moved: 1 normal saved tab can't move into a private saved window"], SAVED]
			return {got: [await settle(() => noticesOf(p), want[0]), await savedTitles()], want}
		})
		drops('normal open tab dropped on a private saved window: refused, nothing is added, the notice says why', async () => {
			const [w1] = await fixture(layout)
			await seedSaved({s2: {incognito: true}})
			const p = await openPopup()
			await drag(p, tabSel('Bravo'), '#session-s2 h3.windowTitle')
			const want = [["Nothing added: 1 normal tab can't be added to a private saved window"], SAVED, ['Alpha', 'Bravo', 'Charlie']]
			return {got: [await settle(() => noticesOf(p), want[0]), await savedTitles(), await titlesOf(w1)], want}
		})
		drops('private and normal saved tabs selected, dropped on a normal saved window: the normal one moves, the private one is reported', async () => {
			await fixture(layout)
			await seedSaved({}, {s3: savedWindow('s3', 'Private', ['Oscar', 'Papa'], {incognito: true})})
			const p = await openPopup()
			await ctrlClick(p, savedSel('Hotel'))
			await ctrlClick(p, savedSel('Oscar'))
			await drag(p, savedSel('Hotel'), '#session-s2 h3.windowTitle')
			const want = [["1 of 2 saved tabs left out: 1 private saved tab can't move into a normal saved window"],
				{s1: ['India', 'Juliett', 'Kilo'], s2: ['Lima', 'Mike', 'November', 'Hotel'], s3: ['Oscar', 'Papa']}]
			return {got: [await settle(() => noticesOf(p), want[0]), await settle(savedTitles, want[1])], want}
		})
		drops('the dragged saved tab is deleted meanwhile, dropped on a saved window: nothing moves, the notice says so', async () => {
			await fixture(layout)
			const p = await openPopup()
			await drag(p, savedSel('Kilo'), '#session-s2 h3.windowTitle', p, {afterStart: async () => {
				await seedSaved({s1: {tabs: [0, 1, 2].map((i) => ({index: i, id: 9000 + i, windowId: 900, title: SAVED.s1[i], url: page(SAVED.s1[i]), active: false, pinned: false, audible: false, discarded: false, highlighted: false, incognito: false, status: 'complete'}))}})
				await p.waitForFunction((sel) => !document.querySelector(sel), {timeout: 5000}, savedSel('Kilo'))
			}})
			const want = [['Nothing moved: the dragged saved tab is gone'], ['Hotel', 'India', 'Juliett'], SAVED.s2]
			const stored = await savedTitles()
			return {got: [await settle(() => noticesOf(p), want[0]), stored.s1, stored.s2], want}
		})
		drops('the dragged saved tab is deleted meanwhile, dropped on an open tab: nothing opens, the notice says so', async () => {
			const [, w2] = await fixture(layout)
			const p = await openPopup()
			await drag(p, savedSel('Kilo'), {selector: tabSel('Echo'), fx: 0.1, fy: 0.1}, p, {afterStart: async () => {
				await seedSaved({s1: {tabs: [0, 1, 2].map((i) => ({index: i, id: 9000 + i, windowId: 900, title: SAVED.s1[i], url: page(SAVED.s1[i]), active: false, pinned: false, audible: false, discarded: false, highlighted: false, incognito: false, status: 'complete'}))}})
				await p.waitForFunction((sel) => !document.querySelector(sel), {timeout: 5000}, savedSel('Kilo'))
			}})
			const want = [['Nothing opened: the dragged saved tab is gone'], ['Delta', 'Echo', 'Foxtrot']]
			return {got: [await settle(() => noticesOf(p), want[0]), await titlesOf(w2)], want}
		})
	}

	// Round 4, notallowed: a drag over a target that refuses it (private and
	// normal never mix, nothing to add, a tab dropped where it already is) shows
	// the browser's not-allowed cursor (dropEffect none) and no drop marker, and
	// delivers no drop; the reason comes as the red notice once, when the drag
	// ends there. Allowed targets keep their cursor, marker and drop. The
	// private windows are seeded (saved) or told to the popup (open).
	for (const layout of ['blocks', 'vertical']) {
		const na = (name, fn) => checks.push({name: 'notallowed ' + layout + ': ' + name, fn, mode: 'tab'})
		const noticesOf = (p) => p.evaluate(() => [...document.querySelectorAll('.notice.error .notice-text')].map((e) => e.textContent))
		const seedSaved = (patch = {}, add = {}) => api(async (patch, add) => {
			const {sessions} = await chrome.storage.local.get('sessions')
			for (const [id, fields] of Object.entries(patch)) Object.assign(sessions[id], fields)
			Object.assign(sessions, add)
			await chrome.storage.local.set({sessions})
		}, patch, add)
		const SAVED = {s1: ['Hotel', 'India', 'Juliett', 'Kilo'], s2: ['Lima', 'Mike', 'November']}
		// a saved window, as the fixture makes them
		const savedWindowOf = (id, name, titles, extra = {}) => {
			const now = Date.now()
			return {id, name, color: 'color9', customName: true, incognito: false, date: now - 864e5, sessionStartTime: now - 864e5, order: 5,
				tabs: titles.map((t, i) => ({id: 9100 + i, index: i, windowId: 900, title: t, url: page(t), active: i === 0, pinned: false, audible: false,
					discarded: false, highlighted: i === 0, incognito: !!extra.incognito, status: 'complete'})),
				windowsInfo: {id: 900, focused: false, incognito: !!extra.incognito, type: 'normal', state: 'normal', left: 0, top: 0, width: 900, height: 700}, ...extra}
		}
		const REFUSED = ['none', 'no marker', 0, ['none']]
		// what a refused drag leaves: the pointer is held a moment after the
		// release for a notice that would come late
		const quiet = (ms = 500) => new Promise((r) => setTimeout(r, ms))
		const first = {fx: 0.1, fy: 0.1}

		na('a normal saved tab over a private saved window (title): not allowed, no marker, no drop, the notice once at the end', async () => {
			await fixture(layout)
			await seedSaved({s2: {incognito: true}})
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, savedSel('Hotel'), '#session-s2 h3.windowTitle')
			const want = [REFUSED, ["Nothing moved: 1 normal saved tab can't move into a private saved window"], SAVED]
			const got = [await settle(seen, REFUSED), await settle(() => noticesOf(p), want[1]), await savedTitles()]
			await quiet()
			got[1] = await noticesOf(p)
			return {got, want}
		})
		na('a normal saved tab over a tab of a private saved window: not allowed, no marker, the notice at the end', async () => {
			await fixture(layout)
			await seedSaved({s2: {incognito: true}})
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, savedSel('Hotel'), {selector: savedSel('Mike'), ...first})
			const want = [REFUSED, ["Nothing moved: 1 normal saved tab can't move into a private saved window"], SAVED]
			const got = [await settle(seen, REFUSED), await settle(() => noticesOf(p), want[1]), await savedTitles()]
			await quiet()
			got[1] = await noticesOf(p)
			return {got, want}
		})
		na('a normal open tab over a private saved window (title): not allowed, no marker, the notice at the end', async () => {
			const [w1] = await fixture(layout)
			await seedSaved({s2: {incognito: true}})
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, tabSel('Bravo'), '#session-s2 h3.windowTitle')
			const want = [REFUSED, ["Nothing added: 1 normal tab can't be added to a private saved window"], SAVED, ['Alpha', 'Bravo', 'Charlie']]
			const got = [await settle(seen, REFUSED), await settle(() => noticesOf(p), want[1]), await savedTitles(), await titlesOf(w1)]
			await quiet()
			got[1] = await noticesOf(p)
			return {got, want}
		})
		na('a normal open tab over a tab of a private saved window: not allowed, no marker, the notice at the end', async () => {
			await fixture(layout)
			await seedSaved({s2: {incognito: true}})
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, tabSel('Bravo'), {selector: savedSel('Mike'), ...first})
			const want = [REFUSED, ["Nothing added: 1 normal tab can't be added to a private saved window"], SAVED]
			return {got: [await settle(seen, REFUSED), await settle(() => noticesOf(p), want[1]), await savedTitles()], want}
		})
		na('a private saved tab over a normal saved window: not allowed, no marker, the notice at the end', async () => {
			await fixture(layout)
			await seedSaved({}, {s3: savedWindowOf('s3', 'Private', ['Oscar', 'Papa'], {incognito: true})})
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, savedSel('Oscar'), {selector: savedSel('Mike'), ...first})
			const want = [REFUSED, ["Nothing moved: 1 private saved tab can't move into a normal saved window"], {...SAVED, s3: ['Oscar', 'Papa']}]
			return {got: [await settle(seen, REFUSED), await settle(() => noticesOf(p), want[1]), await savedTitles()], want}
		})
		// open windows: the popup is told that the second window is private
		na('a normal open tab over a tab of a private open window: not allowed, no marker, no move, the notice at the end', async () => {
			const [w1, w2] = await fixture(layout)
			const p = await openPopup({privateWindow: w2})
			const seen = await watchDrag(p)
			await drag(p, tabSel('Alpha'), {selector: tabSel('Echo'), ...first})
			const want = [REFUSED, ["Nothing moved: 1 normal tab can't move to a private window"], ['Alpha', 'Bravo', 'Charlie'], ['Delta', 'Echo', 'Foxtrot']]
			const got = [await settle(seen, REFUSED), await settle(() => noticesOf(p), want[1]), await titlesOf(w1), await titlesOf(w2)]
			await quiet()
			got[1] = await noticesOf(p)
			return {got, want}
		})
		na('a normal open tab over the private window itself, away from its tabs: not allowed, no outline, the notice at the end', async () => {
			const [w1, w2] = await fixture(layout)
			const p = await openPopup({privateWindow: w2})
			const seen = await watchDrag(p)
			await drag(p, tabSel('Alpha'), {selector: '#window-' + w2, fx: 0.97, fy: 0.97})
			const want = [REFUSED, ["Nothing moved: 1 normal tab can't move to a private window"], ['Alpha', 'Bravo', 'Charlie'], ['Delta', 'Echo', 'Foxtrot']]
			return {got: [await settle(seen, REFUSED), await settle(() => noticesOf(p), want[1]), await titlesOf(w1), await titlesOf(w2)], want}
		})
		na('a private open tab over a tab of a normal open window: not allowed, no marker, the notice at the end', async () => {
			const [w1, w2] = await fixture(layout)
			const p = await openPopup({privateWindow: w2})
			const seen = await watchDrag(p)
			await drag(p, tabSel('Echo'), {selector: tabSel('Alpha'), ...first})
			const want = [REFUSED, ["Nothing moved: 1 private tab can't move to a normal window"], ['Alpha', 'Bravo', 'Charlie'], ['Delta', 'Echo', 'Foxtrot']]
			return {got: [await settle(seen, REFUSED), await settle(() => noticesOf(p), want[1]), await titlesOf(w1), await titlesOf(w2)], want}
		})
		na('a private open tab over a tab of its private window: allowed, with its marker, the drop comes, no notice', async () => {
			const [, w2] = await fixture(layout)
			const p = await openPopup({privateWindow: w2})
			const seen = await watchDrag(p)
			await drag(p, tabSel('Delta'), {selector: tabSel('Foxtrot'), fx: 0.9, fy: 0.9})
			const want = [['allowed', 'marker', 1, ['allowed']], ['Echo', 'Foxtrot', 'Delta'], []]
			const got = [await settle(seen, want[0]), await settle(() => titlesOf(w2), want[1])]
			await quiet()
			got.push(await noticesOf(p))
			return {got, want}
		})
		// a drop on itself that changes nothing: not allowed, but nothing to say
		na('an open tab over its own place (before itself): not allowed, no marker, nothing moves, no notice', async () => {
			const [, w2] = await fixture(layout)
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, tabSel('Echo'), {selector: tabSel('Echo'), ...first})
			await quiet()
			return {got: [await seen(), await titlesOf(w2), await noticesOf(p)], want: [REFUSED, ['Delta', 'Echo', 'Foxtrot'], []]}
		})
		// the marker's gap right after the tab is its own place too (tabs.move counts the tab itself)
		na('an open tab over its own right half, and over the left half of its right neighbour: not allowed, no marker, nothing moves, no notice', async () => {
			const [, w2] = await fixture(layout)
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, tabSel('Delta'), {selector: tabSel('Delta'), fx: 0.9, fy: 0.9})
			await quiet()
			const own = [await seen(), await titlesOf(w2), await noticesOf(p)]
			const seen2 = await watchDrag(p)
			await drag(p, tabSel('Delta'), {selector: tabSel('Echo'), ...first})
			await quiet()
			const next = [await seen2(), await titlesOf(w2), await noticesOf(p)]
			const want = [REFUSED, ['Delta', 'Echo', 'Foxtrot'], []]
			return {got: [own, next], want: [want, want]}
		})
		na('an open tab over the left half of the tab two places right: allowed, with its marker, it lands right before that tab', async () => {
			const [, w2] = await fixture(layout)
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, tabSel('Delta'), {selector: tabSel('Foxtrot'), ...first})
			const want = [['allowed', 'marker', 1, ['allowed']], ['Echo', 'Delta', 'Foxtrot'], []]
			const got = [await settle(seen, want[0]), await settle(() => titlesOf(w2), want[1])]
			await quiet()
			got.push(await noticesOf(p))
			return {got, want}
		})
		na('a saved tab over its own place (before itself, and at the end of the window it ends): not allowed, no marker, no notice', async () => {
			await fixture(layout)
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, savedSel('India'), {selector: savedSel('India'), ...first})
			await quiet()
			const got = [await seen(), await noticesOf(p), await savedTitles()]
			return {got, want: [REFUSED, [], SAVED]}
		})
		na('the last saved tab over the title of its own saved window: not allowed, no marker, no notice', async () => {
			await fixture(layout)
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, savedSel('Kilo'), '#session-s1 h3.windowTitle')
			await quiet()
			return {got: [await seen(), await noticesOf(p), await savedTitles()], want: [REFUSED, [], SAVED]}
		})
		na('a saved window card over itself: not allowed, no marker, no notice', async () => {
			await fixture(layout)
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, '#session-s1 h3.windowTitle', '#session-s1 h3.windowTitle')
			await quiet()
			return {got: [await seen(), await noticesOf(p), await savedOrder()], want: [REFUSED, [], ['s1', 's2']]}
		})
		// the reason belongs to the target the pointer was last on
		na('over a refusing target, then off it into nothing, released there: no notice', async () => {
			await fixture(layout)
			await seedSaved({s2: {incognito: true}})
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, tabSel('Bravo'), '#session-s2 h3.windowTitle', p, {moveOn: {selector: '.window-container', fx: 0.5, fy: 0.97}})
			await quiet(900)
			return {got: [await seen(), await noticesOf(p), await savedTitles()], want: [['none', 'no marker', 0, ['none']], [], SAVED]}
		})
		// the pointer leaves the page over a refusing target and the drag ends
		// out there (dragend's position is outside the page): nothing to say
		na('over a refusing target, then out of the page, ended there: no notice', async () => {
			await fixture(layout)
			await seedSaved({s2: {incognito: true}})
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, tabSel('Bravo'), '#session-s2 h3.windowTitle', p, {cancel: true})
			await quiet(900)
			const want = [['none', 'no marker', 0, ['none']], [], SAVED]
			return {got: [await seen(), await noticesOf(p), await savedTitles()], want}
		})
		na('over a refusing target, then on an allowed one, dropped there: it drops, no notice', async () => {
			const [w1] = await fixture(layout)
			await seedSaved({s2: {incognito: true}})
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, tabSel('Bravo'), '#session-s2 h3.windowTitle', p, {moveOn: '#session-s1 h3.windowTitle'})
			const want = [['allowed', 'marker', 1, ['allowed']], {s1: [...SAVED.s1, 'Bravo'], s2: SAVED.s2}, []]
			const got = [await settle(seen, want[0]), await settle(savedTitles, want[1])]
			await quiet()
			got.push(await noticesOf(p))
			return {got, want}
		})
		// what was allowed stays allowed
		na('a saved tab over an open tab: allowed (copy), with its marker, the drop comes, it opens', async () => {
			const [, w2] = await fixture(layout)
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, savedSel('India'), {selector: tabSel('Echo'), ...first})
			const want = [['allowed', 'marker', 1, ['allowed']], ['Delta', 'India', 'Echo', 'Foxtrot'], []]
			const got = [await settle(seen, want[0]), await settle(() => titlesOf(w2), want[1])]
			await quiet()
			got.push(await noticesOf(p))
			return {got, want}
		})
		na('an open tab over a tab of another open window: allowed (move), with its marker, the drop comes, it moves', async () => {
			const [, w2] = await fixture(layout)
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, tabSel('Alpha'), {selector: tabSel('Echo'), ...first})
			const want = [['allowed', 'marker', 1, ['allowed']], ['Delta', 'Alpha', 'Echo', 'Foxtrot'], []]
			const got = [await settle(seen, want[0]), await settle(() => titlesOf(w2), want[1])]
			await quiet()
			got.push(await noticesOf(p))
			return {got, want}
		})
		na('an open tab over a normal saved window: allowed, outlined, the drop comes, a copy goes in', async () => {
			await fixture(layout)
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, tabSel('Bravo'), '#session-s2 h3.windowTitle')
			const want = [['allowed', 'marker', 1, ['allowed']], {s1: SAVED.s1, s2: [...SAVED.s2, 'Bravo']}, []]
			const got = [await settle(seen, want[0]), await settle(savedTitles, want[1])]
			await quiet()
			got.push(await noticesOf(p))
			return {got, want}
		})
		na('a saved tab over another saved window: allowed, outlined, the drop comes, it moves', async () => {
			await fixture(layout)
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, savedSel('Hotel'), '#session-s2 h3.windowTitle')
			const want = [['allowed', 'marker', 1, ['allowed']], {s1: ['India', 'Juliett', 'Kilo'], s2: [...SAVED.s2, 'Hotel']}, []]
			const got = [await settle(seen, want[0]), await settle(savedTitles, want[1])]
			await quiet()
			got.push(await noticesOf(p))
			return {got, want}
		})
		na('a saved card over the other card: allowed, with its marker, the drop comes, the order changes', async () => {
			await fixture(layout)
			const p = await openPopup()
			const seen = await watchDrag(p)
			await drag(p, '#session-s2 h3.windowTitle', {selector: '#session-s1', ...first})
			const want = [['allowed', 'marker', 1, ['allowed']], ['s2', 's1']]
			return {got: [await settle(seen, want[0]), await settle(savedOrder, want[1])], want}
		})
		// part of it possible: still allowed, 37's partial notice at the drop
		na('private and normal saved tabs over a normal saved window: allowed, the drop comes, the normal one moves, the partial notice', async () => {
			await fixture(layout)
			await seedSaved({}, {s3: savedWindowOf('s3', 'Private', ['Oscar', 'Papa'], {incognito: true})})
			const p = await openPopup()
			await ctrlClick(p, savedSel('Hotel'))
			await ctrlClick(p, savedSel('Oscar'))
			const seen = await watchDrag(p)
			await drag(p, savedSel('Hotel'), '#session-s2 h3.windowTitle')
			const want = [['allowed', 'marker', 1, ['allowed']], ["1 of 2 saved tabs left out: 1 private saved tab can't move into a normal saved window"],
				{s1: ['India', 'Juliett', 'Kilo'], s2: ['Lima', 'Mike', 'November', 'Hotel'], s3: ['Oscar', 'Papa']}]
			const got = [await settle(seen, want[0]), await settle(() => noticesOf(p), want[1]), await settle(savedTitles, want[2])]
			await quiet()
			got[1] = await noticesOf(p)
			return {got, want}
		})
	}

	// Real clicks on a saved window's title (patch sesstitle, a fix to 22): the
	// title opens the name / colour screen and restores nothing, wherever on the
	// text the click lands (start, middle, end), for a title that is far longer
	// than the card and for a short one, in every layout; a click on the card
	// away from the title still restores the window. In the own tab and in both
	// kinds of popup.
	const LONG_NAME = 'Conference reading list for the quarterly planning review in Berlin and Lisbon, to finish before the end of October, then the notes for the whole team and the travel plans after that'
	for (const [layout, m] of [['blocks', 'tab'], ['blocks-big', 'tab'], ['horizontal', 'tab'], ['vertical', 'tab'],
		['blocks', 'small'], ['horizontal', 'small'], ['vertical', 'small'], ['blocks-big', 'action'], ['vertical', 'action']]) {
		checks.push({name: 'title ' + (m === 'tab' ? '' : m + ' ') + layout + ': a click on a saved window title opens the name screen, on the card it restores', mode: m, fn: async () => {
			await fixture(layout)
			// s1 gets the long name, s2 keeps "Taxes"
			await api(async (name) => {
				const {sessions} = await chrome.storage.local.get('sessions')
				sessions.s1.name = name
				await chrome.storage.local.set({sessions})
			}, LONG_NAME)
			const p = await openPopup()
			await p.waitForFunction((name) => [...document.querySelectorAll('#session-s1 .windowName')].some((e) => e.textContent.includes(name.slice(0, 20))), {timeout: 5000}, LONG_NAME)
			const windowsNow = () => api(async () => (await chrome.windows.getAll()).map((w) => w.id).sort())
			const before = await windowsNow()
			const got = [], want = []
			// the title's box on the page (inside the title bar, not spilling out of it
			// to be cut off by it), and what the click lands on there
			const probe = (sel, fx) => p.evaluate((sel, fx) => {
				const el = document.querySelector(sel)
				if (!el) return null
				el.scrollIntoView({block: 'nearest', inline: 'nearest'})
				const h3 = el.closest('h3'), r = el.getBoundingClientRect(), bar = h3.getBoundingClientRect()
				const x = r.left + r.width * fx, y = r.top + r.height / 2
				return {x, y, // nothing spills out of the bar: its own ellipsis (which would replace the name
					// with a bare "...") is not in play, the name truncates itself
					inCard: r.left >= bar.left - 1 && r.right <= bar.right + 1 && h3.scrollWidth <= h3.clientWidth + 1, wide: r.width,
					hit: !!document.elementFromPoint(x, y)?.closest(sel)}
			}, sel, fx)
			const clickAt = async (at) => {
				const cdp = await p.createCDPSession()
				await cdp.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: at.x, y: at.y})
				await cdp.send('Input.dispatchMouseEvent', {type: 'mousePressed', x: at.x, y: at.y, button: 'left', buttons: 1, clickCount: 1})
				await cdp.send('Input.dispatchMouseEvent', {type: 'mouseReleased', x: at.x, y: at.y, button: 'left', buttons: 0, clickCount: 1})
				await cdp.detach()
			}
			for (const [which, card] of [['long', 's1'], ['short', 's2']]) {
				for (const [where, fx] of [['start', 0.04], ['middle', 0.5], ['end', 0.96]]) {
					const sel = '#session-' + card + ' .windowName'
					const at = await probe(sel, fx)
					// the title shows inside its card, wide enough to read, and is under the click
					got.push(which + ' ' + where + ': ' + (at && at.inCard && at.wide > 40 && at.hit ? 'title under the click' : 'title missing ' + JSON.stringify(at)))
					want.push(which + ' ' + where + ': title under the click')
					if (!at) continue
					const known = await windowsNow()
					await clickAt(at)
					const opened = await p.waitForSelector('.window-colors', {timeout: 2000}).then(() => true, () => false)
					await new Promise((r) => setTimeout(r, 300))
					got.push(which + ' ' + where + ': ' + (opened ? 'name screen' : 'no name screen') + ', ' + ((await windowsNow()).join() === known.join() ? 'no window' : 'a window was created'))
					want.push(which + ' ' + where + ': name screen, no window')
					if (opened) {
						await p.keyboard.press('Escape')
						await p.waitForFunction(() => !document.querySelector('.window-colors'), {timeout: 3000}).catch(() => {})
						// the popup scrolls back by itself after 150 ms
						await new Promise((r) => setTimeout(r, 400))
					}
				}
			}
			// a click on the card, not on its title: the window is restored
			const edge = await p.evaluate(() => {
				const el = document.querySelector('#session-s2')
				el.scrollIntoView({block: 'nearest', inline: 'nearest'})
				const r = el.getBoundingClientRect()
				return {x: r.left + 3, y: r.top + r.height / 2}
			})
			await clickAt(edge)
			const created = await settle(async () => (await windowsNow()).filter((id) => !before.includes(id)).length, 1)
			got.push('card body: ' + created + ' new window')
			want.push('card body: 1 new window')
			return {got, want}
		}})
	}

	// The service worker's version (src/popup/workerCheck.ts, scripts/bundle.mjs): the built
	// worker reports the hash the build stamped into it, the popup was built to require the
	// same, and so no notice shows; a worker that answers another version, nothing (an older
	// worker, which does not know the command) or an error shows the red notice, once.
	// Own tab, and the toolbar button's popup, which share the code path with the options page.
	{
		const dist = (file) => readFileSync(join(extDir, 'dist', file), 'utf8')
		const stamped = /self\.TMP_WORKER_VERSION="([0-9a-f]{12})";\s*$/.exec(dist('service_worker/service_worker.js'))?.[1]
		const noticeTexts = (p) => p.evaluate(() => [...document.querySelectorAll('.notice')].map((n) => n.className.split(' ').filter((c) => c === 'error' || c === 'info' || c === 'undo').join('') + ': ' + n.querySelector('.notice-text')?.textContent))
		const worker = (name, m, fn) => checks.push({name: 'worker (' + m + '): ' + name, fn, mode: m})
		// replaces the answer to worker_version in the popup, before its scripts run (a page
		// of ours: the toolbar button's own popup cannot be reached before its scripts)
		const answering = (kind) => {
			const original = chrome.runtime.sendMessage.bind(chrome.runtime)
			chrome.runtime.sendMessage = (message, ...rest) => {
				if (!message || message.command !== 'worker_version') return original(message, ...rest)
				if (kind === 'reject') return Promise.reject(new Error('Could not establish connection. Receiving end does not exist.'))
				return Promise.resolve(kind === 'undefined' ? undefined : 'built-before-the-worker-changed')
			}
		}
		for (const m of ['tab', 'action']) {
			worker('the worker answers the version the build stamped; the popup requires it and shows no notice', m, async () => {
				await fixture('blocks')
				const p = await openPopup()
				const answer = await p.evaluate(() => chrome.runtime.sendMessage({command: 'worker_version'}))
				// well after the check ran (1.5 s after the popup rendered)
				await new Promise((r) => setTimeout(r, 3000))
				return {got: [answer, dist('popup/popup.js').includes(stamped), await noticeTexts(p)], want: [stamped, true, []]}
			})
			for (const [kind, what] of m === 'tab' ? [['undefined', 'does not answer (an older worker)'], ['other', 'answers another version'], ['reject', 'cannot be reached']] : []) {
				worker('a worker that ' + what + ': one red notice naming chrome://extensions', m, async () => {
					await fixture('blocks')
					const want = ['error: The background part of Tab Manager Plus is out of date. Reload the extension in chrome://extensions.']
					const p = await openPopup({beforeLoad: answering, beforeLoadArg: kind})
					const first = await settle(() => noticeTexts(p), want)
					// it is asked once: the notice closes, nothing brings it back
					await p.evaluate(() => document.querySelector('.notice .notice-close')?.click())
					await new Promise((r) => setTimeout(r, 2500))
					return {got: [first, await noticeTexts(p)], want: [want, []]}
				})
			}
		}
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
// restoring saved windows on two screens: a browser of its own (monitors.mjs)
try {
	await monitorChecks({puppeteer, executablePath: chromePath(), extDir, only, report(name, ok, detail, ms) {
		if (!ok) failures++
		results.push({name, ok})
		console.log((ok ? 'ok   ' : 'FAIL ') + name + '  (' + ms + ' ms)' + (detail ? '\n      ' + detail : ''))
	}})
} catch (e) {
	failures++
	console.error(e)
}
console.log((failures ? failures + ' failed' : 'all ' + results.length + ' passed') + ' in ' + Math.round((Date.now() - started) / 1000) + ' s')
process.exit(failures ? 1 : 0)
