// Shared harness for tools/firefox-check: Firefox launch, extension install,
// fixtures (real windows and tabs, seeded saved windows), page drivers with
// real input (Marionette key and pointer actions, OS mouse for drags).
import {createServer} from 'node:http'
import {mkdirSync, existsSync, readdirSync, readFileSync, rmSync} from 'node:fs'
import {join, resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {Marionette, launchFirefox, sleep} from './marionette.mjs'
import {osDrag, allowFirefoxPid, forgetFirefoxPid} from './osmouse.mjs'

export {sleep}
export const here = dirname(fileURLToPath(import.meta.url))
export const root = resolve(here, '..', '..')
export const OUT = join(here, 'out')
export const GECKO_ID = '{45f2dc53-96cd-4c41-91f6-f4a73a8fb2b0}'
export const UUID = '0b6b5d2e-7a41-4c9e-9a53-5f1d7c2e8a10'
export const EXT = 'moz-extension://' + UUID

// WebDriver key codes
export const K = {Ctrl: '', Shift: '', Alt: '', Meta: '', Delete: '', Backspace: '', Enter: '', Escape: '',
	Left: '', Up: '', Right: '', Down: '', Space: ' ', Tab: '', Home: '', End: ''}

export function servePages() {
	const server = createServer((req, res) => {
		const url = new URL(req.url, 'http://x')
		if (url.pathname === '/drag-selftest') {
			res.writeHead(200, {'content-type': 'text/html; charset=utf-8'})
			return res.end('<!doctype html><title>dragtest</title><body style="margin:0"><div id=a draggable=true style="width:120px;height:60px;background:#f88;position:absolute;left:20px;top:20px">drag</div><div id=b style="width:200px;height:120px;background:#8f8;position:absolute;left:300px;top:100px">drop</div><script>window.log = []; for (const t of ["dragstart", "drop", "dragend"]) document.addEventListener(t, (e) => window.log.push(t + ":" + e.isTrusted), true); document.addEventListener("dragover", (e) => e.preventDefault(), true)</script>')
		}
		const name = decodeURIComponent(url.pathname.replace(/^\/p\//, ''))
		const safe = name.replace(/[<&]/g, '')
		res.writeHead(200, {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'})
		res.end('<!doctype html><title>' + safe + '</title><body>' + safe)
	})
	return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({server, origin: 'http://127.0.0.1:' + server.address().port})))
}

// the body is the text of an async function over `B` (the page's browser API)
// and `A` (the argument); its result goes back as JSON
const wrap = (body) => `const B = window.wrappedJSObject.browser; const A = arguments[0]; return (async () => { ${body} })().then((r) => JSON.stringify(r === undefined ? null : r))`

export class Harness {
	constructor({port = 2871, headless = false, profile, extPath, log = console.log} = {}) {
		this.port = port; this.headless = headless; this.profile = profile; this.extPath = extPath; this.log = log
		this.m = new Marionette(port)
		this.pages = []
		if (headless) this.noDrags = 'headless run: no desktop window for real OS drags, every check that needs a drag is MANUAL'
	}
	async start({prefs = {}, install = true} = {}) {
		const {server, origin} = await servePages()
		this.server = server; this.origin = origin
		this.proc = await launchFirefox({profile: this.profile, port: this.port, headless: this.headless, log: join(this.profile, '..', 'firefox-stdio.log'),
			prefs: {'extensions.webextensions.uuids': JSON.stringify({[GECKO_ID]: UUID}), ...prefs}})
		allowFirefoxPid(this.proc.pid)
		await this.m.connect()
		const caps = await this.m.newSession()
		this.version = caps.capabilities?.browserVersion
		if (install) await this.install(this.extPath)
		return this
	}
	async install(path) {
		await this.m.installAddon(path, true)
		await sleep(1500)
	}
	page(name) { return this.origin + '/p/' + encodeURIComponent(name) }
	async stop() {
		if (this.proc) forgetFirefoxPid(this.proc.pid)
		await this.m.quit()
		this.m.close()
		this.server?.close()
		await sleep(500)
		try { this.proc.kill() } catch {}
	}

	// A real OS drag on a tiny page: false when the drag does not complete (screen locked or asleep, the mouse touched, another window on top)
	async selfTestDrag() {
		const {windowId, handle} = await this.newWindow(this.origin + '/drag-selftest', {width: 700, height: 500, left: 0, top: 0})
		const p = new Page(this, handle, windowId)
		await sleep(800)
		try { await p.drag('#a', '#b') } catch (e) { await p.close(); if (e.manual) throw e; return {ok: false, log: ['drag refused: ' + e.message]} }
		const log = await p.ev('return window.wrappedJSObject.log ? Array.from(window.wrappedJSObject.log) : null')
		await p.close()
		return {ok: !!log && log.join() === 'dragstart:true,drop:true,dragend:true', log}
	}

	// ---- control page: an extension page (PRIVACY.md) that has the browser API
	async openControl() {
		await this.m.setContext('content')
		const hs = await this.m.handles()
		this.ctl = hs[0]
		await this.m.switchTo(this.ctl, false)
		await this.m.navigate(EXT + '/PRIVACY.md')
		await sleep(300)
	}
	// runs async `body` in the control page; result is JSON-parsed
	async api(body, arg) {
		await this.m.switchTo(this.ctl, false)
		const r = await this.m.exec(wrap(body), [arg ?? null])
		return r === null || r === undefined ? null : JSON.parse(r)
	}
	// privileged Firefox UI code (about: tabs, private windows, the sidebar)
	async chrome(body, arg) {
		await this.m.setContext('chrome')
		try { return await this.m.exec(body, [arg ?? null]) } finally { await this.m.setContext('content') }
	}

	// the handle of the first tab matching a URL prefix
	async handleFor(urlPrefix, timeout = 10000) {
		const t0 = Date.now()
		while (Date.now() - t0 < timeout) {
			for (const h of await this.m.handles()) {
				try {
					await this.m.switchTo(h, false)
					if ((await this.m.url()).startsWith(urlPrefix)) return h
				} catch {}
			}
			await sleep(200)
		}
		throw new Error('no tab for ' + urlPrefix)
	}

	// a new browser window with one tab on `url`; returns {windowId, handle}
	async newWindow(url, opts = {}) {
		const before = new Set(await this.m.handles())
		const w = await this.api(`return await B.windows.create(A)`, {url, focused: true, ...opts})
		let handle
		for (let i = 0; i < 100 && !handle; i++) {
			for (const h of await this.m.handles()) if (!before.has(h)) handle = h
			if (!handle) await sleep(100)
		}
		if (!handle) throw new Error('window did not appear: ' + url)
		return {windowId: w.id, handle}
	}

	// closes every window but the control page's
	async closeOthers() {
		await this.api(`const me = await B.tabs.getCurrent(); for (const w of await B.windows.getAll()) if (w.id !== me.windowId) await B.windows.remove(w.id)`)
		// the control page's own window was found through getCurrent
		await sleep(300)
	}

	async shot(page, name) {
		const file = join(OUT, name.replace(/[^\w.-]+/g, '_') + '.png')
		await this.m.switchTo(page.handle ?? page, true)
		await this.m.screenshot(file)
		return 'out/' + name.replace(/[^\w.-]+/g, '_') + '.png'
	}
}

// A page of the extension (or any page) driven with real input
export class Page {
	constructor(h, handle, windowId) { this.h = h; this.m = h.m; this.handle = handle; this.windowId = windowId }
	async focus() { await this.m.switchTo(this.handle, true) }
	async ev(js, ...args) {
		await this.m.switchTo(this.handle, false)
		return this.m.exec(js, args)
	}
	// async function body, result as JSON
	async evj(body, arg) {
		await this.m.switchTo(this.handle, false)
		const r = await this.m.exec(`const A = arguments[0]; return (async () => { ${body} })().then((r) => JSON.stringify(r === undefined ? null : r))`, [arg ?? null])
		return r === null || r === undefined ? null : JSON.parse(r)
	}
	// the page's own browser API, as in the control page
	async api(body, arg) {
		await this.m.switchTo(this.handle, false)
		const r = await this.m.exec(wrap(body), [arg ?? null])
		return r === null || r === undefined ? null : JSON.parse(r)
	}
	async goto(url) { await this.focus(); await this.m.navigate(url) }
	async waitFor(js, timeout = 8000, ...args) {
		const t0 = Date.now()
		let last
		while (Date.now() - t0 < timeout) {
			try { last = await this.ev('return (' + js + ')', ...args) } catch (e) { last = String(e.message) }
			if (last === true || (last && typeof last === 'object' && last !== null) || (typeof last === 'string' && last && !last.startsWith('javascript error'))) return last
			await sleep(100)
		}
		throw new Error('timeout waiting for: ' + js.slice(0, 120) + ' (last ' + JSON.stringify(last) + ')')
	}
	// centre (or fractional point) of the first match, in CSS px of the viewport
	async point(sel, fx = 0.5, fy = 0.5) {
		const r = await this.ev(`const el = document.querySelector(arguments[0]); if (!el) return null; el.scrollIntoView({block: 'nearest', inline: 'nearest'}); const b = el.getBoundingClientRect(); return {x: b.left + b.width * arguments[1], y: b.top + b.height * arguments[2], w: b.width, h: b.height}`, sel, fx, fy)
		if (!r) throw new Error('not on the page: ' + sel)
		return r
	}
	async screenOrigin() {
		return this.ev('return {x: window.mozInnerScreenX * devicePixelRatio, y: window.mozInnerScreenY * devicePixelRatio, d: devicePixelRatio}')
	}
	#ptr(actions) { return this.m.actions([{type: 'pointer', id: 'mouse', parameters: {pointerType: 'mouse'}, actions}]) }
	#keys(actions) { return this.m.actions([{type: 'key', id: 'kb', actions}]) }
	async mod(keys, fn) {
		await this.focus()
		if (keys.length) await this.#keys(keys.map((value) => ({type: 'keyDown', value})))
		try { await fn() } finally {
			if (keys.length) await this.#keys(keys.map((value) => ({type: 'keyUp', value})))
		}
	}
	async clickAt(x, y, button = 0, mods = []) {
		await this.mod(mods, async () => {
			await this.#ptr([{type: 'pointerMove', x: Math.round(x), y: Math.round(y), duration: 0, origin: 'viewport'}, {type: 'pointerDown', button}, {type: 'pointerUp', button}])
		})
		await sleep(120)
	}
	async click(sel, fx, fy) { const p = await this.point(sel, fx, fy); await this.clickAt(p.x, p.y) }
	async ctrlClick(sel) { const p = await this.point(sel); await this.clickAt(p.x, p.y, 0, [K.Ctrl]) }
	// the popup's selection gesture: right-click; Shift+right-click a range
	async rightClick(sel, mods = []) { const p = await this.point(sel); await this.clickAt(p.x, p.y, 2, mods) }
	async hover(sel, fx, fy) {
		await this.focus()
		const p = await this.point(sel, fx, fy)
		await this.#ptr([{type: 'pointerMove', x: Math.round(p.x), y: Math.round(p.y), duration: 0, origin: 'viewport'}])
		await sleep(150)
	}
	async press(...keys) { await this.focus(); for (const k of keys) await this.#keys([{type: 'keyDown', value: k}, {type: 'keyUp', value: k}]); await sleep(80) }
	async chord(modifier, key) {
		await this.focus()
		await this.#keys([{type: 'keyDown', value: modifier}, {type: 'keyDown', value: key}, {type: 'keyUp', value: key}, {type: 'keyUp', value: modifier}])
		await sleep(120)
	}
	async type(text) { await this.focus(); for (const ch of text) await this.#keys([{type: 'keyDown', value: ch}, {type: 'keyUp', value: ch}]); await sleep(150) }
	// a real OS-level drag of `from` onto `to` (selectors, or {sel, fx, fy}); `into`: another page that takes the drop
	async drag(from, to, into = this, opts = {}) {
		if (this.h.noDrags) throw Object.assign(new Error(this.h.noDrags), {manual: true})
		const f = typeof from === 'string' ? {sel: from} : from
		const t = typeof to === 'string' ? {sel: to} : to
		await this.focus()
		const a = await this.point(f.sel, f.fx ?? 0.5, f.fy ?? 0.5)
		const o = await this.screenOrigin()
		const src = {x: Math.round(o.x + a.x * o.d), y: Math.round(o.y + a.y * o.d)}
		let dst
		if (into !== this) {
			await into.focus()
			const b = await into.point(t.sel, t.fx ?? 0.5, t.fy ?? 0.5)
			const o2 = await into.screenOrigin()
			dst = {x: Math.round(o2.x + b.x * o2.d), y: Math.round(o2.y + b.y * o2.d)}
			await this.focus()
		} else {
			const b = await this.point(t.sel, t.fx ?? 0.5, t.fy ?? 0.5)
			dst = {x: Math.round(o.x + b.x * o.d), y: Math.round(o.y + b.y * o.d)}
		}
		// the page may have shifted while measuring (scrolling into view): measure the source again
		const a2 = await this.point(f.sel, f.fx ?? 0.5, f.fy ?? 0.5)
		src.x = Math.round(o.x + a2.x * o.d); src.y = Math.round(o.y + a2.y * o.d)
		osDrag(src, dst, opts)
		await sleep(400)
	}
	async shot(name) { return this.h.shot(this, name) }
	async close() { try { await this.h.api(`await B.windows.remove(A)`, this.windowId) } catch {} }
}

// ---- fixtures
export const tabRec = (page, index, title, extra = {}) => ({id: 9000 + index, index, windowId: 900, title, url: page(title), active: index === 0,
	pinned: false, audible: false, discarded: false, highlighted: index === 0, incognito: false, status: 'complete', ...extra})
export function savedRec(page, id, name, color, age, titles, order, extra = {}) {
	const now = Date.now()
	return {id, name, color, customName: true, incognito: false, date: now - age, sessionStartTime: now - age, order,
		tabs: titles.map((t, i) => typeof t === 'string' ? tabRec(page, i, t) : t),
		windowsInfo: {id: 900, focused: false, incognito: false, type: 'normal', state: 'normal', left: 0, top: 0, width: 900, height: 700}, ...extra}
}
export const DAY = 864e5

export const tabSel = (title) => '.window:not(.session) .tab[data-hover^="' + title + '\\a "]'
export const savedSel = (title) => '.session .tab[data-hover^="' + title + '\\a "]'
