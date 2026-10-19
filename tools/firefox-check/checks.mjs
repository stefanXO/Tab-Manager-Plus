// The checks. Each has {id, name, patches, fn(ctx)}; fn returns an evidence
// string or throws (Error = FAIL, manual(...) = MANUAL).
import {join} from 'node:path'
import {mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, rmSync} from 'node:fs'

export const manual = (why) => Object.assign(new Error(why), {manual: true})
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

export function checks(ctx) {
	const {h, OUT, EXT, sleep, savedRec, DAY, tabSel, savedSel, K, Page, headless} = ctx
	const page = (t) => h.page(t)
	const list = []
	const add = (id, name, patches, fn, extra = {}) => list.push({id, name, patches, fn, ...extra})

	function expect(got, want, what = '') {
		if (!same(got, want)) throw new Error((what ? what + ': ' : '') + 'expected ' + JSON.stringify(want) + ', got ' + JSON.stringify(got))
	}
	// waits until read() equals want (4 s), returns the last value
	async function settle(read, want, ms = 4000) {
		let got
		for (const t0 = Date.now(); Date.now() - t0 < ms;) {
			got = await read()
			if (same(got, want)) return got
			await sleep(100)
		}
		return got
	}
	async function settleExpect(read, want, what) { expect(await settle(read, want), want, what) }

	// ------------------------------------------------------------ fixture
	// 4 windows (First, Second, Spare, Prefs with about:blank + about:preferences + a normal tab),
	// two saved windows. Returns the window ids.
	let ids = {}
	async function fixture(o = {}) {
		const {layout = 'blocks', saved = true, extraStorage = {}, prefsWindow = true} = o
		await h.closeOthers()
		const mk = async (urls) => (await h.api(`return await B.windows.create(A)`, {url: urls, width: 800, height: 600})).id
		const w1 = await mk([page('Alpha'), page('Bravo'), page('Charlie')])
		const w2 = await mk([page('Delta'), page('Echo'), page('Foxtrot')])
		const w3 = await mk([page('SpareOakA'), page('SpareOakB'), page('SparePineC')])
		let w4 = null
		if (prefsWindow) {
			w4 = await mk(['about:blank'])
			await h.chrome(`
				for (const win of Services.wm.getEnumerator('navigator:browser')) {
					if (win.gBrowser.tabs.length === 1 && win.gBrowser.currentURI.spec === 'about:blank') {
						const sp = Services.scriptSecurityManager.getSystemPrincipal()
						win.gBrowser.addTab('about:preferences', {triggeringPrincipal: sp})
						win.gBrowser.addTab(arguments[0], {triggeringPrincipal: sp})
						return true
					}
				}
				return false`, page('Zulu'))
		}
		for (let i = 0; i < 100; i++) {
			const t = await h.api(`return (await B.tabs.query({})).every(t => t.status === 'complete')`)
			if (t) break
			await sleep(100)
		}
		ids = {w1, w2, w3, w4}
		const now = Date.now()
		const sessions = saved ? {
			s1: savedRec(page, 's1', 'Reading', 'color4', 2 * DAY, ['Hotel', 'India', 'Juliett', 'Kilo'], 0),
			s2: savedRec(page, 's2', 'Taxes', 'color15', 21 * DAY, ['Lima', 'Mike', 'November'], 1),
		} : {}
		await h.api(`await B.storage.local.clear(); await B.storage.local.set(A)`, {
			layout, animations: true, windowTitles: true, tabactions: true, sessionsFeature: true, theme: 'light',
			windowNames: {[w1]: 'First', [w2]: 'Second', [w3]: 'Spare'}, sessions, ...extraStorage,
		})
		return ids
	}

	const GEOS = {tab: {left: 0, top: 0, width: 1000, height: 830}, left: {left: 0, top: 0, width: 760, height: 830}, right: {left: 780, top: 0, width: 760, height: 830}}
	async function openPopup(kind = 'tab', geo = 'tab', o = {}) {
		const q = {tab: '', panel: '?panel=true', small: '?popup'}[kind]
		const {windowId, handle} = await h.newWindow(EXT + '/popup.html' + q, GEOS[geo])
		const p = new Page(h, handle, windowId)
		await p.waitFor(`document.querySelectorAll('.window:not(.session) .tab').length >= ${o.openTabs ?? 6}`, 15000)
		if (o.saved !== false) await p.waitFor(`document.querySelector('.session .tab') ? true : false`, 10000)
		await p.waitFor(`(!document.querySelector('.enter') && document.getAnimations().every((a) => a.playState !== 'running')) ? true : false`, 10000)
		p.kind = kind
		return p
	}

	// ------------------------------------------------------------ readers
	const titlesOf = (w) => h.api(`const t = await B.tabs.query({windowId: A}); return t.sort((a, b) => a.index - b.index).map((t) => t.title || t.url)`, w)
	const urlsOf = (w) => h.api(`const t = await B.tabs.query({windowId: A}); return t.sort((a, b) => a.index - b.index).map((t) => t.url)`, w)
	const savedTitles = () => h.api(`const {sessions} = await B.storage.local.get('sessions'); const out = {}; for (const [id, s] of Object.entries(sessions || {})) out[id] = [...s.tabs].sort((a, b) => a.index - b.index).map((t) => t.title); return out`)
	const savedOrder = () => h.api(`const {sessions} = await B.storage.local.get('sessions'); return Object.values(sessions || {}).sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9)).map((s) => s.id)`)
	const allWindowIds = () => h.api(`return (await B.windows.getAll()).map((w) => w.id)`)
	const shownIn = (p, card) => p.ev(`return [...document.querySelectorAll(arguments[0] + ' .tab')].filter((t) => t.offsetParent).map((t) => (t.getAttribute('data-hover') || '').split('\\n')[0])`, card)
	const notices = (p) => p.ev(`return [...document.querySelectorAll('.notice')].map((n) => n.className.split(' ').filter((c) => c === 'error' || c === 'info' || c === 'undo').join('') + ': ' + (n.querySelector('.notice-text') || {}).textContent)`)
	const header = (p) => p.ev(`const t = document.querySelector('.tabtitle'); const u = document.querySelector('.taburl'); return [t.value || t.placeholder, u.value || u.placeholder]`)
	const boxValue = (p) => p.ev(`return document.querySelector('.searchBoxInput').value`)
	const titlesWith = (p, cls) => p.ev(`return [...document.querySelectorAll('.window:not(.session) .tab.' + arguments[0])].map((t) => (t.getAttribute('data-hover') || '').split('\\n')[0]).sort()`, cls)
	const selectedOf = (p) => titlesWith(p, 'selected')
	const savedSelected = (p) => p.ev(`return [...document.querySelectorAll('.session .tab.selected')].map((t) => (t.getAttribute('data-hover') || '').split('\\n')[0]).sort()`)
	const shot = (p, name) => p.shot(name)
	const winTabSel = (w, i) => '#window-' + w + ' .tabs > .tab:nth-child(' + (2 * i + 1) + ')'
	const focusAt = (p) => p.ev(`const a = document.activeElement; return a ? a.tagName + '.' + a.className : null`)
	const waitIdle = (p) => p.waitFor(`(!document.querySelector('.enter') && document.getAnimations().every((a) => a.playState !== 'running')) ? true : false`, 10000)

	// observers: what the page showed while a real drag ran (read-only; the drag is the OS's)
	const watch = (p) => p.ev(`
		const w = window.__w = {markers: 0, drops: 0, ends: [], stacks: [], headers: [], log: []}
		const t0 = performance.now(); const L = (k, v) => { if (w.log.length < 60) w.log.push(Math.round(performance.now() - t0) + ' ' + k + ' ' + v) }
		for (const ty of ['dragstart', 'drop', 'dragend', 'mouseover']) document.addEventListener(ty, (e) => { const t = e.target; if (ty === 'mouseover' && w.log.length && /mouseover/.test(w.log[w.log.length - 1])) return; L(ty, t && t.className ? String(t.className).slice(0, 20) : '') }, true)
		setInterval(() => { const t = document.querySelector('.tabtitle'); if (!t) return; const v = t.value || t.placeholder; if (w.headers[w.headers.length - 1] !== v) { w.headers.push(v); L('header', v) } }, 8)
		const marked = () => document.querySelector('.tab.left, .tab.right, .tab.top, .tab.bottom, .window.session[class*="drop-"]') ? true : false
		document.addEventListener('dragover', (e) => { const tgt = e.target; setTimeout(() => { if (marked()) w.markers++; w.over = {types: Array.from(e.dataTransfer.types), prevented: e.defaultPrevented, effect: e.dataTransfer.dropEffect, target: (tgt.className || tgt.tagName) + ''}; w.overs = (w.overs || 0) + 1 }, 0) }, true)
		document.addEventListener('drop', () => { w.drops++ }, true)
		document.addEventListener('dragend', (e) => { w.ends.push(e.dataTransfer.dropEffect) }, true)
		new MutationObserver((records) => {
			for (const r of records) for (const n of r.addedNodes) {
				if (!n.classList || !n.classList.contains('drag-stack')) continue
				w.stacks.push({tiles: n.querySelectorAll('.drag-tile').length, label: (n.querySelector('.drag-count') || {}).textContent, cls: n.className})
			}
		}).observe(document.body, {childList: true})
		return true`)
	// polls the recorded header texts until one matches (the drop's message comes after the worker answered)
	const seenHeader = async (p, re, ms = 5000) => { for (const t0 = Date.now(); Date.now() - t0 < ms;) { const w = await watched(p); if (w.headers.some((x) => re.test(x))) return w; await sleep(100) } return watched(p) }
	// a vacuous pass guard: the drag must have started and ended
	const awaitDragRan = (w, what) => { if (!w.log.some((x) => / dragstart /.test(x)) || !w.log.some((x) => / dragend /.test(x))) throw new Error(what + ': the drag did not run (no dragstart/dragend seen), so nothing was proved: ' + JSON.stringify(w.log)) }
	const watched = (p) => p.ev(`return JSON.parse(JSON.stringify(window.__w))`)

	// =====================================================================
	// SMOKE
	// =====================================================================
	add('S01', 'Smoke: the background script runs and answers (worker_version)', '-', async () => {
		await fixture({saved: false})
		const r = await h.api(`return await B.runtime.sendMessage({command: 'worker_version'}).catch((e) => 'ERR ' + e.message)`)
		const bg = await h.api(`const p = await B.runtime.getBackgroundPage ? 'has getBackgroundPage' : 'no getBackgroundPage'; return p`)
		if (typeof r === 'string' && r.startsWith('ERR')) throw new Error('no answer from the background: ' + r)
		return 'worker answered ' + JSON.stringify(r).slice(0, 120)
	})
	for (const [id, file, sel] of [['S02', 'options.html', 'input, button'], ['S03', 'changelog.html', 'body'], ['S04', 'documentation.html', 'body'], ['S05', 'popup.html', '.window']]) {
		add(id, 'Smoke: ' + file + ' loads, no uncaught errors in its console', '-', async () => {
			await fixture({saved: false, prefsWindow: false})
			const {windowId, handle} = await h.newWindow(EXT + '/' + file, GEOS.tab)
			const p = new Page(h, handle, windowId)
			// errors: wrapped window.onerror is too late for load-time errors, so reload with a hook
			await p.waitFor(`document.querySelector('${sel}') ? true : false`, 15000)
			const text = await p.ev(`return document.body.innerText.length`)
			if (text < 20 && file !== 'popup.html') throw new Error('page nearly empty: ' + text)
			const errs = await consoleErrors(p)
			const s = await shot(p, id + '-' + file)
			if (errs.length) throw new Error('console errors: ' + JSON.stringify(errs) + ' ' + s)
			return file + ' rendered (' + text + ' chars), ' + s
		})
	}
	// load-time errors cannot be caught from inside, so the console is read from the browser's own console service
	const BENIGN = /Promise (resolved|rejected) after context unloaded/
	async function consoleErrors(p) {
		const r = await h.chrome(`
			const out = []
			for (const m of Services.console.getMessageArray()) {
				if (!(m instanceof Ci.nsIScriptError)) continue
				if (!/moz-extension:\\/\\//.test(m.sourceName || '') && !/moz-extension/.test(m.errorMessage || '')) continue
				if (m.flags & m.warningFlag) continue
				out.push((m.errorMessage || '').slice(0, 200) + ' @' + (m.sourceName || '').replace(/moz-extension:\\/\\/[^/]+/, '') + ':' + m.lineNumber)
			}
			return out`)
		return (r || []).filter((e) => !BENIGN.test(e))
	}
	function benignCount() { return h.chrome(`let n = 0; for (const m of Services.console.getMessageArray()) { if (m instanceof Ci.nsIScriptError && /Promise (resolved|rejected) after context unloaded/.test(m.errorMessage || '')) n++ } return n`) }
	add('S06', 'Smoke: no uncaught extension script errors in the browser console (whole run so far)', '-', async () => {
		const errs = await consoleErrors()
		// the service's own deliberate logging goes through console.error in places; list everything, fail on uncaught-looking ones
		const bad = errs.filter((e) => !/^(session migrating|Could not|NetworkError|ExtensionError: Invalid tab ID)/.test(e))
		if (bad.length) throw new Error('extension errors in the browser console: ' + JSON.stringify(bad.slice(0, 8)))
		return errs.length + ' extension console errors besides ' + (await benignCount()) + ' Firefox warnings "Promise (resolved|rejected) after context unloaded" (a page closed with a call pending; harmless, from window closes in this run)'
	}, {late: true})

	// =====================================================================
	// 1. DRAG: saved tab -> open tab (important)
	// =====================================================================
	const surfaces = [['tab', 'own tab'], ['panel', 'panel=true (stands in for the sidebar)'], ['small', 'popup.html?popup (stands in for the toolbar popup)']]
	for (const [kind, label] of surfaces) {
		add('F01-' + kind, '(important) Drag saved tab onto an open window\'s tab, ' + label, '11, 18', async () => {
			const {w2} = await fixture()
			const p = await openPopup(kind)
			await watch(p)
			await p.drag(savedSel('India'), {sel: tabSel('Echo'), fx: 0.1, fy: 0.1})
			const want = ['Delta', 'India', 'Echo', 'Foxtrot']
			await settleExpect(() => titlesOf(w2), want, 'open window tabs')
			const w = await seenHeader(p, /Opened 1 saved tab in/, 2500)
			const hd = w.headers
			const s = await shot(p, 'F01-' + kind)
			if (!w.markers) throw new Error('no drop marker was shown during the drag ' + s)
			// background: the new tab is not the active one
			const act = await h.api(`return (await B.tabs.query({windowId: A, active: true})).map((t) => t.title)`, w2)
			if (act[0] === 'India') throw new Error('opened in the foreground, not the background ' + s)
			return 'opened in the background, marker shown; header "Opened 1 saved tab in" ' + (hd.some((x) => /Opened 1 saved tab in/.test(x)) ? 'seen' : 'NOT seen this time (see F01h)') + ', markers seen ' + w.markers + ', ' + s
		})
	}

	for (const [kind, label] of surfaces.slice(0, 2)) {
		add('F01h-' + kind, 'Header says "Opened 1 saved tab in ..." after the drop (5 drags, ' + label + ')', '11, 18', async () => {
			let seen = 0; const logs = []
			for (let i = 0; i < 5; i++) {
				await fixture()
				const p = await openPopup(kind)
				await watch(p)
				await p.drag(savedSel('India'), {sel: tabSel('Echo'), fx: 0.1, fy: 0.1})
				const w = await seenHeader(p, /Opened 1 saved tab in/, 3000)
				if (w.headers.some((x) => /Opened 1 saved tab in/.test(x))) seen++
				else logs.push(w.log.slice(-6))
			}
			if (seen < 5) throw new Error('header shown in ' + seen + ' of 5 drops; in the others the hover text replaced it (' + JSON.stringify(logs[0]) + ')')
			return 'header shown in 5 of 5 drops'
		}, {noRetry: true, slow: true})
	}

	// =====================================================================
	// 2. not a drop target
	// =====================================================================
	for (const [target, sel] of [['search box', '.searchBoxInput'], ['header', '.tabtitle']]) {
		add('F02-' + target.replace(' ', ''), 'Drag a saved tab onto a non-target (' + target + '): nothing happens', '11', async () => {
			const {w1} = await fixture()
			const p = await openPopup('tab')
			await watch(p)
			const before = {tabs: await h.api(`return (await B.tabs.query({})).map((t) => t.url).sort()`), saved: await savedTitles(), handles: (await h.m.handles()).length, url: await p.ev('return location.href')}
			await watch(p)
			await p.drag(savedSel('India'), sel)
			await sleep(800)
			awaitDragRan(await watched(p), 'F02')
			const after = {tabs: await h.api(`return (await B.tabs.query({})).map((t) => t.url).sort()`), saved: await savedTitles(), handles: (await h.m.handles()).length, url: await p.ev('return location.href')}
			const val = await boxValue(p)
			const s = await shot(p, 'F02-' + target.replace(' ', ''))
			expect(after, before, 'tabs/saved/handles/url unchanged (' + s + ')')
			if (val !== '') throw new Error('text typed in the search box: ' + JSON.stringify(val) + ' ' + s)
			return 'no tab opened or navigated, nothing typed, ' + s
		})
	}
	add('F03', 'Drag a saved window card onto the search box: no name typed', '13', async () => {
		await fixture()
		const p = await openPopup('tab')
		await watch(p)
		await p.drag('#session-s1 h3.windowTitle', '.searchBoxInput')
		await sleep(500)
		awaitDragRan(await watched(p), 'F03')
		const val = await boxValue(p)
		const names = await h.api(`const {sessions} = await B.storage.local.get('sessions'); return Object.values(sessions).map((s) => s.name)`)
		const s = await shot(p, 'F03')
		if (val !== '') throw new Error('search box holds ' + JSON.stringify(val) + ' ' + s)
		expect(names, ['Reading', 'Taxes'], 'names')
		return 'search box empty, ' + s
	})
	add('F04', 'Reorder cards by dragging a card by its title: bar shows, order changes and is kept after reopen', '13', async () => {
		await fixture()
		const p = await openPopup('tab')
		await watch(p)
		await p.drag('#session-s2 h3.windowTitle', {sel: '#session-s1', fx: 0.1, fy: 0.1})
		await settleExpect(savedOrder, ['s2', 's1'], 'order')
		const w = await watched(p)
		await p.close()
		const q = await openPopup('tab')
		const dom = await q.ev(`return [...document.querySelectorAll('.window.session')].map((e) => e.id)`)
		const s = await shot(q, 'F04')
		expect(dom, ['session-s2', 'session-s1'], 'cards after reopen')
		if (!w.markers) throw new Error('no drop bar shown ' + s)
		return 'order s2,s1 kept after reopen, bar seen ' + w.markers + ', ' + s
	})
	add('F05a', 'Saved tab onto another saved tab: reorder', '15', async () => {
		await fixture()
		const p = await openPopup('tab')
		await p.drag(savedSel('Kilo'), {sel: savedSel('India'), fx: 0.1, fy: 0.1})
		const want = {s1: ['Hotel', 'Kilo', 'India', 'Juliett'], s2: ['Lima', 'Mike', 'November']}
		await settleExpect(savedTitles, want)
		return 'Kilo moved before India, ' + await shot(p, 'F05a')
	})
	add('F05b', 'Saved tab onto a tab of another saved window: move', '15', async () => {
		await fixture()
		const p = await openPopup('tab')
		await p.drag(savedSel('Hotel'), {sel: savedSel('Mike'), fx: 0.1, fy: 0.1})
		const want = {s1: ['India', 'Juliett', 'Kilo'], s2: ['Lima', 'Hotel', 'Mike', 'November']}
		await settleExpect(savedTitles, want)
		return 'Hotel moved into Taxes before Mike, ' + await shot(p, 'F05b')
	})
	add('F05c', 'Saved tab onto another saved window\'s card title: append', '15', async () => {
		await fixture()
		const p = await openPopup('tab')
		await p.drag(savedSel('Hotel'), '#session-s2 h3.windowTitle')
		const want = {s1: ['India', 'Juliett', 'Kilo'], s2: ['Lima', 'Mike', 'November', 'Hotel']}
		await settleExpect(savedTitles, want)
		return 'Hotel appended to Taxes, ' + await shot(p, 'F05c')
	})
	add('F06a', 'Open tab onto a saved tab: copy added', '16', async () => {
		const {w1} = await fixture()
		const p = await openPopup('tab')
		await p.drag(tabSel('Bravo'), {sel: savedSel('Mike'), fx: 0.1, fy: 0.1})
		const want = {s1: ['Hotel', 'India', 'Juliett', 'Kilo'], s2: ['Lima', 'Bravo', 'Mike', 'November']}
		await settleExpect(savedTitles, want)
		expect(await titlesOf(w1), ['Alpha', 'Bravo', 'Charlie'], 'open window untouched')
		return 'copy of Bravo in Taxes, open tab stays, ' + await shot(p, 'F06a')
	})
	add('F06b', 'Open tab onto a card title: copy added, "Added 1 tab to ..."', '16', async () => {
		await fixture()
		const p = await openPopup('tab')
		await watch(p)
		await p.drag(tabSel('Bravo'), '#session-s1 h3.windowTitle')
		await settleExpect(savedTitles, {s1: ['Hotel', 'India', 'Juliett', 'Kilo', 'Bravo'], s2: ['Lima', 'Mike', 'November']})
		const hd = (await seenHeader(p, /Added 1 tab to/)).headers
		const s = await shot(p, 'F06b')
		if (!/Added 1 tab to/.test(hd.join(' | '))) throw new Error('header says ' + JSON.stringify(hd) + ' ' + s)
		return 'header ' + JSON.stringify(hd.find((x) => /Added/.test(x))) + ', ' + s
	})
	for (const [id, what, openSel1, openSel2] of [['F07', 'saved tabs', null], ['F27', 'open tabs', null]]) {
		add(id, id === 'F07' ? 'Ctrl+click 2 saved tabs and drag one: stack of 2 tiles, "2 tabs" (drag image built by the page; look of it under the pointer is MANUAL)' : 'Ctrl+click 2 open tabs in Blocks, drag one: icon stack "2 tabs"', id === 'F07' ? '18' : '29', async () => {
			await fixture()
			const p = await openPopup('tab')
			await watch(p)
			if (id === 'F07') {
				await p.ctrlClick(savedSel('Juliett')); await p.ctrlClick(savedSel('Mike'))
				await p.drag(savedSel('Mike'), tabSel('Charlie'))
			} else {
				await p.ctrlClick(tabSel('Alpha')); await p.ctrlClick(tabSel('Echo'))
				await p.drag(tabSel('Echo'), '#session-s1 h3.windowTitle')
			}
			const w = await watched(p)
			const s = await shot(p, id)
			const st = w.stacks[0]
			if (!st || st.tiles !== 2 || st.label !== '2 tabs') throw new Error('drag stack was ' + JSON.stringify(w.stacks) + ' ' + s)
			return 'stack built with 2 tiles, label "2 tabs", class "' + st.cls + '" (drawn under the pointer: not capturable) ' + s
		})
	}

	// two pages
	add('F08a', '(important) Drag a saved tab from page 1 (panel) onto an open tab in page 2 (own tab): opens there, header "Opened 1 saved tab in ..."', '18', async () => {
		const {w2} = await fixture()
		const p1 = await openPopup('panel', 'left')
		const p2 = await openPopup('tab', 'right')
		await watch(p2)
		await p1.drag(savedSel('India'), {sel: tabSel('Echo'), fx: 0.1, fy: 0.1}, p2)
		await settleExpect(() => titlesOf(w2), ['Delta', 'India', 'Echo', 'Foxtrot'], 'open window')
		const hd = (await seenHeader(p2, /Opened 1 saved tab in/, 2500)).headers
		const s = await shot(p2, 'F08a')
		return 'opened in Second; page 2 header "Opened 1 saved tab in" ' + (hd.some((x) => /Opened 1 saved tab in/.test(x)) ? 'seen' : 'NOT seen this time (same race as F01h)') + ', ' + s
	})
	add('F08b', 'Drag an open tab across pages while other tabs are selected in page 2: only the dragged tab moves', '18', async () => {
		const {w1, w2} = await fixture()
		const p1 = await openPopup('panel', 'left')
		const p2 = await openPopup('tab', 'right')
		await p2.ctrlClick(tabSel('Delta')); await p2.ctrlClick(tabSel('Foxtrot'))
		await p1.drag(tabSel('Alpha'), {sel: tabSel('Echo'), fx: 0.1, fy: 0.1}, p2)
		await settleExpect(() => titlesOf(w2), ['Delta', 'Alpha', 'Echo', 'Foxtrot'], 'target window')
		await settleExpect(() => titlesOf(w1), ['Bravo', 'Charlie'], 'source window')
		return 'only Alpha moved, ' + await shot(p2, 'F08b')
	})
	add('F08c1', 'Drag an open tab from page 1 onto a saved window in page 2: copy added', '18', async () => {
		await fixture()
		const p1 = await openPopup('panel', 'left')
		const p2 = await openPopup('tab', 'right')
		await watch(p1); await watch(p2)
		await p1.drag(tabSel('Bravo'), '#session-s1 h3.windowTitle', p2)
		const want = {s1: ['Hotel', 'India', 'Juliett', 'Kilo', 'Bravo'], s2: ['Lima', 'Mike', 'November']}
		const got = await settle(savedTitles, want)
		if (!same(got, want)) throw new Error('saved is ' + JSON.stringify(got) + '; page 1 saw ' + JSON.stringify(await watched(p1)) + '; page 2 saw ' + JSON.stringify(await watched(p2)) + '; notices p2 ' + JSON.stringify(await notices(p2)) + ' ' + await shot(p2, 'F08c1-p2'))
		return 'copy added, ' + await shot(p2, 'F08c1')
	})
	add('F08c2', 'Drag a saved tab from page 1 onto a saved window in page 2: moved', '18', async () => {
		await fixture()
		const p1 = await openPopup('panel', 'left')
		const p2 = await openPopup('tab', 'right')
		await watch(p1); await watch(p2)
		await p1.drag(savedSel('Mike'), '#session-s1 h3.windowTitle', p2)
		const want = {s1: ['Hotel', 'India', 'Juliett', 'Kilo', 'Mike'], s2: ['Lima', 'November']}
		const got = await settle(savedTitles, want)
		if (!same(got, want)) throw new Error('saved is ' + JSON.stringify(got) + '; page 1 saw ' + JSON.stringify(await watched(p1)) + '; page 2 saw ' + JSON.stringify(await watched(p2)) + '; notices p2 ' + JSON.stringify(await notices(p2)) + ' ' + await shot(p2, 'F08c2-p2'))
		return 'moved, ' + await shot(p2, 'F08c2')
	})

	// 9. emptying drag + Undo
	add('F09', 'Drag all tabs of one saved window onto another: notice Removed (left empty) with Undo; Undo brings it back; other card says "saved just now"', '15, 25', async () => {
		await fixture()
		const p = await openPopup('tab')
		for (const t of ['Lima', 'Mike', 'November']) await p.ctrlClick(savedSel(t))
		await p.drag(savedSel('November'), '#session-s1 h3.windowTitle')
		const all = ['Hotel', 'India', 'Juliett', 'Kilo', 'Lima', 'Mike', 'November']
		await settleExpect(savedTitles, {s1: all}, 'after the move')
		await p.waitFor(`document.querySelector('.notice.undo') ? true : false`, 5000)
		const n = await notices(p)
		if (!n.some((x) => /^undo: Removed .Taxes. \(left empty\)/.test(x))) throw new Error('notices: ' + JSON.stringify(n))
		const age = await p.ev(`return (document.querySelector('#session-s1 .window-age') || {}).textContent`)
		await p.click('.notice.undo .notice-undo')
		// undoMove puts both windows back as they were (tests/moveUndo.test.ts)
		const want = {s1: ['Hotel', 'India', 'Juliett', 'Kilo'], s2: ['Lima', 'Mike', 'November']}
		const after = await settle(savedTitles, want)
		const s = await shot(p, 'F09')
		if (!same(after, want)) throw new Error('after Undo: expected ' + JSON.stringify(want) + ', got ' + JSON.stringify(after) + ' ' + s)
		if (!/just now/.test(age || '')) throw new Error('Reading card age says ' + JSON.stringify(age) + ' ' + s)
		return 'notice ' + JSON.stringify(n[0]) + ', Undo brought Taxes back ' + JSON.stringify(after) + ', Reading says ' + JSON.stringify(age) + ', ' + s
	})

	// 10-12 about: pages
	const aboutTabs = (w) => h.api(`return (await B.tabs.query({windowId: A})).sort((a, b) => a.index - b.index).map((t) => t.url)`, w)
	add('F10', 'Save a window with about:blank and about:preferences tabs: keeps about:blank, drops about:preferences; restore opens about:blank', '14', async () => {
		const {w4} = await fixture({saved: false})
		expect(await aboutTabs(w4), ['about:blank', 'about:preferences', page('Zulu')], 'fixture window')
		const p = await openPopup('tab', 'tab', {saved: false, openTabs: 6})
		await p.click('#window-' + w4 + ' .tabaction.save')
		await p.waitFor(`document.querySelector('.session .tab') ? true : false`, 6000)
		const saved = await h.api(`const {sessions} = await B.storage.local.get('sessions'); return Object.values(sessions).map((s) => s.tabs.map((t) => t.url))`)
		expect(saved, [['about:blank', page('Zulu')]], 'saved urls')
		const before = await allWindowIds()
		await waitIdle(p)
		await p.click('.window.session', 0.9, 0.5)
		await settle(async () => (await allWindowIds()).length, before.length + 1)
		const now = await allWindowIds()
		const nw = now.filter((i) => !before.includes(i))
		const urls = nw.length ? await aboutTabs(nw[0]) : null
		const s = await shot(p, 'F10')
		if (!urls || urls[0] !== 'about:blank') throw new Error('restored window tabs: ' + JSON.stringify(urls) + ' ' + s)
		return 'saved ' + JSON.stringify(saved[0].map((u) => u.replace(/http:\/\/127[^/]+\/p\//, ''))) + '; restored ' + JSON.stringify(urls.map((u) => u.replace(/http:\/\/127[^/]+\/p\//, ''))) + ', ' + s
	})
	add('F11', 'Select about:preferences + a normal tab, drag onto a saved window: one copy, header says 1 tab could not be saved', '16', async () => {
		const {w4} = await fixture()
		const p = await openPopup('tab')
		await p.ctrlClick(tabSel('Settings')); await p.ctrlClick(tabSel('Zulu'))
		await watch(p)
		await p.drag(tabSel('Zulu'), '#session-s1 h3.windowTitle')
		await settleExpect(savedTitles, {s1: ['Hotel', 'India', 'Juliett', 'Kilo', 'Zulu'], s2: ['Lima', 'Mike', 'November']})
		await sleep(500)
		const hd = (await watched(p)).headers; const n = await notices(p)
		const s = await shot(p, 'F11')
		if (!/could not be saved|left out/.test(hd.join(' | ') + n.join(' | '))) throw new Error('header ' + JSON.stringify(hd) + ' notices ' + JSON.stringify(n) + ' ' + s)
		return 'one copy added; header ' + JSON.stringify(hd) + ' notices ' + JSON.stringify(n) + ' ' + s
	})
	add('F12', 'Select only about:preferences, "Save selected tabs": nothing saved, no error; with a normal tab: saved without it', '10', async () => {
		const {w4} = await fixture({saved: false})
		const p = await openPopup('tab', 'tab', {saved: false})
		await p.ctrlClick(tabSel('Settings'))
		const sel0 = JSON.stringify(await selectedOf(p)) + ' dom: ' + JSON.stringify(await p.ev('return [...document.querySelectorAll("#window-" + arguments[0] + " .tabs > *")].map((e) => e.className.split(" ").slice(0,3).join(".") + "=" + (e.getAttribute("data-hover") || "").split(String.fromCharCode(10))[0])', w4))
		await p.click('.windowaction.save-tabs')
		await sleep(800)
		const none = await h.api(`const {sessions} = await B.storage.local.get('sessions'); return Object.keys(sessions || {}).length`)
		const n = await notices(p)
		const s1 = await shot(p, 'F12a')
		if (none !== 0) throw new Error('saved windows after only the about: tab: ' + none + ' (selected before: ' + sel0 + '; stored: ' + JSON.stringify(await h.api('const {sessions} = await B.storage.local.get("sessions"); return Object.values(sessions).map((s) => s.tabs.map((t) => t.url))')) + ') ' + s1)
		if (n.some((x) => /^error/.test(x))) throw new Error('error notice shown: ' + JSON.stringify(n) + ' ' + s1)
		await p.ctrlClick(tabSel('Zulu'))
		await p.click('.windowaction.save-tabs')
		await p.waitFor(`document.querySelector('.session .tab') ? true : false`, 6000)
		const saved = await h.api(`const {sessions} = await B.storage.local.get('sessions'); return Object.values(sessions).map((s) => s.tabs.map((t) => t.title))`)
		expect(saved, [['Zulu']], 'saved titles')
		return 'only about: tab: nothing saved, no error (' + JSON.stringify(n) + '); with normal tab saved ["Zulu"], ' + await shot(p, 'F12b')
	})

	// 13/14 pending delete behaviour
	add('F13', 'Two pages: delete 2nd tab of a saved window in one (countdown), drag an open tab in front of its first tab in the other; wait: deleted stays gone, copy stays', '17', async () => {
		await fixture()
		const p1 = await openPopup('panel', 'left')
		const p2 = await openPopup('tab', 'right')
		await p1.ctrlClick(savedSel('India'))
		await p1.chord(K.Ctrl, K.Delete)
		await p1.waitFor(`document.querySelector('.notice.undo') ? true : false`, 5000)
		await p2.drag(tabSel('Alpha'), {sel: savedSel('Hotel'), fx: 0.1, fy: 0.1})
		await sleep(10500)
		const got = await savedTitles()
		const s = await shot(p2, 'F13')
		expect(got.s1, ['Alpha', 'Hotel', 'Juliett', 'Kilo'], 'Reading after the countdown (' + s + ')')
		return 'India gone, Alpha copy kept: ' + JSON.stringify(got.s1) + ', ' + s
	}, {slow: true})
	add('F14', 'Delete a saved window and close the popup within 8 s, reopen: it is gone; a window saved just before is still there', '3, 17', async () => {
		const {w1} = await fixture()
		const p = await openPopup('tab')
		await p.click('#window-' + w1 + ' .tabaction.save')
		await p.waitFor(`document.querySelectorAll('.window.session').length === 3`, 6000)
		await waitIdle(p)
		await p.click('#session-s2 .tabaction.delete')
		await p.waitFor(`document.querySelector('.notice.undo') ? true : false`, 5000)
		await p.close()
		await sleep(600)
		const q = await openPopup('tab')
		const dom = await q.ev(`return [...document.querySelectorAll('.window.session')].length`)
		const st = await savedTitles()
		const s = await shot(q, 'F14')
		if (st.s2) { await sleep(9500); const later = await savedTitles(); throw new Error('Taxes is still stored right after reopening: ' + JSON.stringify(Object.keys(st)) + ' and still there 9 s later: ' + JSON.stringify(Object.keys(later)) + ' (the delete was lost, not just late) ' + s) }
		expect([dom, Object.keys(st).length], [2, 2], 'cards and stored windows')
		return 'Taxes gone, the just saved window kept, ' + s
	})

	// 15 import / export
	add('F15a', 'In the popup, Import says to use the options page or an own tab', '2, 24', async () => {
		await fixture()
		const p = await openPopup('small')
		await p.click('.windowaction.options')
		await p.waitFor(`document.querySelector('input[type=file]') ? true : false`, 6000)
		const disabled = await p.ev(`const f = [...document.querySelectorAll('input[type=file]')][0]; return f.disabled`)
		await p.hover('input[type=file]')
		const hover = await p.ev(`return document.body.innerText.includes('Please use the options screen or open Tab Manager Plus in its own tab') || (document.querySelector('.taburl') || {}).value + ' / ' + (document.querySelector('.tabtitle') || {}).value`)
		const s = await shot(p, 'F15a')
		if (!disabled) throw new Error('import input is not disabled in the popup ' + s)
		return 'import input disabled in the popup; hover text: ' + JSON.stringify(hover).slice(0, 200) + ', ' + s
	})
	async function exportClick(p, labelIndex) {
		await p.ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === arguments[0]).click()`, labelIndex)
	}
	function downloads() {
		const dir = join(h.profile, 'downloads')
		return existsSync(dir) ? readdirSync(dir) : []
	}
	add('F15b', 'Options (own tab): Export Sessions and Save debug file download tab-manager-plus-sessions-/everything-...json, both with format; "everything" imports too; import notice "N saved windows restored"', '2, 19, 24', async () => {
		await fixture()
		const dir = join(h.profile, 'downloads')
		rmSync(dir, {recursive: true, force: true}); mkdirSync(dir, {recursive: true})
		const {windowId, handle} = await h.newWindow(EXT + '/options.html', GEOS.tab)
		const p = new Page(h, handle, windowId)
		await p.waitFor(`document.querySelector('input[type=file]') ? true : false`, 10000)
		await exportClick(p, 'Export Sessions')
		await sleep(1500)
		await exportClick(p, 'Save debug file')
		await sleep(2500)
		const files = downloads()
		const sess = files.find((f) => /^tab-manager-plus-sessions-\d{4}-\d\d-\d\d-\d\d-\d\d-\d\d\.json$/.test(f))
		const every = files.find((f) => /^tab-manager-plus-everything-\d{4}-\d\d-\d\d-\d\d-\d\d-\d\d\.json$/.test(f))
		const s = await shot(p, 'F15b-export')
		if (!sess || !every) throw new Error('downloads: ' + JSON.stringify(files) + ' ' + s)
		const js = JSON.parse(readFileSync(join(dir, sess), 'utf8')); const je = JSON.parse(readFileSync(join(dir, every), 'utf8'))
		if (js.format !== 'tab-manager-plus-export' || je.format !== 'tab-manager-plus-export') throw new Error('format: ' + js.format + ' / ' + je.format)
		if ((js.sessions || []).length !== 2 || (je.sessions || []).length !== 2) throw new Error('sessions in files: ' + (js.sessions || []).length + ' / ' + (je.sessions || []).length)
		ctx.lastExport = {dir, sess, every}
		return files.join(', ') + ' with format and 2 saved windows each, ' + s
	})
	add('F24', 'Options page imports: non-JSON file -> red notice; after deleting two, a good file -> grey "N saved windows restored"; format "other" -> grey with "not in Tab Manager Plus\'s format"', '24, 34', async () => {
		await fixture()
		const dir = join(h.profile, 'downloads'); mkdirSync(dir, {recursive: true})
		const sessFile = join(dir, 'good-sessions.json')
		const sessions = await h.api(`const {sessions} = await B.storage.local.get('sessions'); return Object.values(sessions)`)
		writeFileSync(sessFile, JSON.stringify({format: 'tab-manager-plus-export', sessions}))
		writeFileSync(join(dir, 'other-format.json'), JSON.stringify({format: 'other', sessions}))
		writeFileSync(join(dir, 'not-json.json'), 'this is not json {')
		const {windowId, handle} = await h.newWindow(EXT + '/options.html', GEOS.tab)
		const p = new Page(h, handle, windowId)
		await p.waitFor(`document.querySelector('input[type=file]') ? true : false`, 10000)
		const upload = async (name) => {
			await p.focus()
			let el; for (let i = 0; i < 5; i++) { try { el = await h.m.send('WebDriver:FindElement', {using: 'css selector', value: 'input[type=file]'}); break } catch (e) { if (i === 4) throw e; await sleep(600) } }
			const ref = Object.values(el.value ?? el)[0]
			await h.m.send('WebDriver:ElementSendKeys', {id: ref, text: join(dir, name)})
			await sleep(1200)
		}
		const read = () => notices(p)
		await upload('not-json.json')
		const n1 = await read(); const s1 = await shot(p, 'F24-nonjson')
		if (!n1.some((x) => /^error/.test(x))) throw new Error('no red notice for a non-JSON file: ' + JSON.stringify(n1) + ' ' + s1)
		await h.api(`await B.storage.local.set({sessions: {}})`)
		await sleep(300)
		await p.ev(`return location.reload()`); await p.waitFor(`document.querySelector('input[type=file]') ? true : false`, 10000)
		await upload('good-sessions.json')
		const n2 = await read(); const s2 = await shot(p, 'F24-good')
		if (!n2.some((x) => /^info: 2 saved windows restored/.test(x))) throw new Error('notices after good import: ' + JSON.stringify(n2) + ' ' + s2)
		await h.api(`await B.storage.local.set({sessions: {}})`)
		await p.ev(`return location.reload()`); await p.waitFor(`document.querySelector('input[type=file]') ? true : false`, 10000)
		await upload('other-format.json')
		const n3 = await read(); const s3 = await shot(p, 'F24-other')
		if (!n3.some((x) => /not in Tab Manager Plus's format/.test(x))) throw new Error('notices after format other: ' + JSON.stringify(n3) + ' ' + s3)
		// the debug (everything) file imports too
		await h.api('await B.storage.local.set({sessions: A})', Object.fromEntries(sessions.map((x) => [x.id, x])))
		await p.ev('return location.reload()'); await sleep(1500); await p.waitFor('document.querySelector("input[type=file]") ? true : false', 10000)
		rmSync(join(dir, 'everything-check'), {recursive: true, force: true})
		const had = new Set(readdirSync(dir))
		await exportClick(p, 'Save debug file'); await sleep(2500)
		const ev = readdirSync(dir).find((f) => !had.has(f) && /^tab-manager-plus-everything-/.test(f))
		if (!ev) throw new Error('no everything file was downloaded')
		await h.api('await B.storage.local.set({sessions: {}})')
		await p.ev('return location.reload()'); await sleep(1500); await p.waitFor('document.querySelector("input[type=file]") ? true : false', 10000)
		await upload(ev)
		const n4 = await read(); const s4 = await shot(p, 'F24-everything')
		if (!n4.some((x) => /^info: 2 saved windows restored/.test(x))) throw new Error('notices after importing the everything file: ' + JSON.stringify(n4) + ' ' + s4)
		return 'everything file import: ' + JSON.stringify(n4) + '; non-JSON: ' + JSON.stringify(n1) + '; good: ' + JSON.stringify(n2) + '; other: ' + JSON.stringify(n3)
	})

	// 18 about: drag notices
	add('F18', '(important) about:preferences + normal tab dragged onto a saved window: one copy + red notice "1 of 2 tabs left out: 1 about: page can\'t be saved on Firefox"; only the about: tab: red "Nothing added ...", no copy', '37', async () => {
		const {w4} = await fixture()
		const p = await openPopup('tab')
		await p.ctrlClick(tabSel('Settings')); await p.ctrlClick(tabSel('Zulu'))
		await p.drag(tabSel('Zulu'), '#session-s1 h3.windowTitle')
		await settleExpect(savedTitles, {s1: ['Hotel', 'India', 'Juliett', 'Kilo', 'Zulu'], s2: ['Lima', 'Mike', 'November']}, 'one copy')
		await p.waitFor(`document.querySelector('.notice.error') ? true : false`, 5000)
		const n1 = await notices(p)
		const s1 = await shot(p, 'F18a')
		if (!n1.some((x) => /^error: 1 of 2 tabs left out: 1 about: page can't be saved on Firefox/.test(x))) throw new Error('first notices: ' + JSON.stringify(n1) + ' ' + s1)
		await p.press(K.Escape); await sleep(300)
		const p2 = await openPopup('tab')
		await p2.ctrlClick(tabSel('Settings'))
		await p2.drag(tabSel('Settings'), '#session-s1 h3.windowTitle')
		await sleep(800)
		const n2 = await notices(p2)
		const s2 = await shot(p2, 'F18b')
		expect((await savedTitles()).s1, ['Hotel', 'India', 'Juliett', 'Kilo', 'Zulu'], 'no new copy')
		if (!n2.some((x) => /^error: Nothing added/.test(x))) throw new Error('second notices: ' + JSON.stringify(n2) + ' ' + s2)
		return JSON.stringify(n1.filter((x) => /error/.test(x))) + ' and ' + JSON.stringify(n2.filter((x) => /error/.test(x))) + ', ' + s1 + ' ' + s2
	})


	// =====================================================================
	// helpers for the next groups
	// =====================================================================
	async function typeIn(p, text) {
		await p.click('.searchBoxInput')
		await p.type(text)
		await sleep(400)
	}
	const noticesOf = async (p, kind) => (await notices(p)).filter((x) => x.startsWith(kind + ':'))
	const newWindowTitles = (before) => h.api(`const out = []; for (const w of await B.windows.getAll({populate: true})) { if (A.includes(w.id)) continue; out.push(w.tabs.sort((a, b) => a.index - b.index).map((t) => t.title || t.url)) } return out`, before)
	const hoverCardText = (p) => p.ev(`return document.body.innerText`)

	// =====================================================================
	// 16 / 17 private windows (the add-on is allowed in private windows, as the checklist sets)
	// =====================================================================
	async function privateFixture() {
		const f = await fixture()
		const pw = await h.api(`return await B.windows.create(A)`, {url: [h.page('PrivOne')], incognito: true, width: 800, height: 600})
		await sleep(1500)
		const inc = await h.api(`return (await B.windows.get(A)).incognito`, pw.id)
		if (!inc) throw new Error('private window not private (extension not allowed in private windows?)')
		return {...f, wp: pw.id}
	}
	add('F16', 'Private window: select one normal and one private tab, Save selected tabs: two saved windows, normal first; restore the private one: opens private', '10', async () => {
		const {wp} = await privateFixture()
		const p = await openPopup('tab', 'tab', {saved: false})
		await p.waitFor(`document.querySelector('.tab[data-hover^="PrivOne"]') ? true : false`, 8000)
		await p.ctrlClick(tabSel('Bravo')); await p.ctrlClick(tabSel('PrivOne'))
		await p.click('.windowaction.save-tabs')
		await sleep(1000)
		const saved = await h.api(`const {sessions} = await B.storage.local.get('sessions'); return Object.values(sessions).filter((s) => !['s1', 's2'].includes(s.id)).sort((a, b) => a.order - b.order).map((s) => [s.incognito, s.tabs.map((t) => t.title)])`)
		const s = await shot(p, 'F16')
		expect(saved, [[false, ['Bravo']], [true, ['PrivOne']]], 'new saved windows, normal first (' + s + ')')
		const before = await allWindowIds()
		await waitIdle(p)
		const privCard = await p.ev(`const c = [...document.querySelectorAll('.window.session')].find((e) => /PrivOne/.test([...e.querySelectorAll('.tab')].map((t) => t.getAttribute('data-hover')).join())); return c ? c.id : null`)
		if (!privCard) throw new Error('private saved card not found ' + s)
		await p.click('#' + privCard, 0.9, 0.5)
		await settle(async () => (await allWindowIds()).length, before.length + 1)
		const now = await allWindowIds()
		const nw = now.find((i) => !before.includes(i))
		const inc = nw ? await h.api(`return (await B.windows.get(A)).incognito`, nw) : null
		if (inc !== true) throw new Error('restored window incognito = ' + inc + ' ' + s)
		return 'two saved windows (normal ' + JSON.stringify(saved[0]) + ', private ' + JSON.stringify(saved[1]) + '), restored window is private, ' + s
	})
	add('F17a', 'Drag a private open tab onto a normal saved window: no copy, red notice "Nothing added: 1 private tab can\'t be added to a normal saved window" (not-allowed cursor: MANUAL)', '11, 16, 37, 40', async () => {
		await privateFixture()
		const p = await openPopup('tab', 'tab')
		await p.waitFor(`document.querySelector('.tab[data-hover^="PrivOne"]') ? true : false`, 8000)
		await watch(p)
		await p.drag(tabSel('PrivOne'), '#session-s1 h3.windowTitle')
		await sleep(800)
		const w = await watched(p)
		const n = await noticesOf(p, 'error')
		const s = await shot(p, 'F17a')
		expect((await savedTitles()).s1, ['Hotel', 'India', 'Juliett', 'Kilo'], 'Reading unchanged')
		if (!n.some((x) => /Nothing added: 1 private tab can't be added to a normal saved window/.test(x))) throw new Error('notices ' + JSON.stringify(n) + ' ' + s)
		if (w.markers) throw new Error('a drop marker was shown over a refusing target (' + w.markers + ') ' + s)
		return 'no copy, no marker, notice ' + JSON.stringify(n[0]) + '; last dragover answer ' + JSON.stringify(w.over && w.over.effect) + ', ' + s
	})
	add('F17b', 'Drag a tab of a private saved window onto a normal open window: it opens there (allowed)', '11, 16', async () => {
		const {w2} = await privateFixture()
		const priv = savedRec(page, 's3', 'Hidden', 'color7', DAY, [{...tabRecP('Priv1', 0), incognito: true}], 2, {incognito: true})
		await h.api(`const {sessions} = await B.storage.local.get('sessions'); sessions.s3 = A; await B.storage.local.set({sessions})`, priv)
		const p = await openPopup('tab')
		await p.waitFor(`document.querySelector('#session-s3 .tab') ? true : false`, 8000)
		await p.drag(savedSel('Priv1'), {sel: tabSel('Echo'), fx: 0.1, fy: 0.1})
		await settleExpect(() => titlesOf(w2), ['Delta', 'Priv1', 'Echo', 'Foxtrot'], 'open window')
		return 'Priv1 opened in the normal window, ' + await shot(p, 'F17b')
	})
	const tabRecP = (title, index) => ({id: 9100 + index, index, windowId: 901, title, url: page(title), active: index === 0, pinned: false, audible: false, discarded: false, highlighted: false, incognito: false, status: 'complete'})

	// =====================================================================
	// 19 filter + selected tabs
	// =====================================================================
	// The checklist says "alpha OR charlie (words in two open windows)"; in this fixture Alpha and Charlie share the First
	// window, so the query is "alpha OR delta" (First and Second) to keep the two-window point of the check.
	add('F19', 'Type "alpha OR delta" (the checklist says "alpha OR charlie"; words in two windows of this fixture), Ctrl+click a faded tab, "Hide non-matching tabs": selected tab stays on screen; drag a selected match to another window: all selected tabs move, the stack counts them', '39', async () => {
		const {w1, w2} = await fixture()
		const p = await openPopup('tab')
		await typeIn(p, 'alpha OR delta')
		expect(await selectedOf(p), ['Alpha', 'Delta'], 'selected by the search')
		await p.ctrlClick(tabSel('Bravo'))
		await p.click('.windowaction.filter')
		await sleep(500)
		const vis = await p.ev(`const v = (t) => { const e = document.querySelector('.window:not(.session) .tab[data-hover^="' + t + '\\\\a "]'); return !!e && !!e.offsetParent }; return {Alpha: v('Alpha'), Bravo: v('Bravo'), Charlie: v('Charlie'), Echo: v('Echo')}`)
		const s0 = await shot(p, 'F19-hide')
		expect(vis, {Alpha: true, Bravo: true, Charlie: false, Echo: false}, 'visible with the filter on (' + s0 + ')')
		await watch(p)
		await p.drag(tabSel('Alpha'), {sel: tabSel('Delta'), fx: 0.1, fy: 0.1})
		await sleep(800)
		const w2t = await titlesOf(w2)
		const w = await watched(p)
		const s = await shot(p, 'F19-drag')
		for (const t of ['Alpha', 'Bravo', 'Delta']) if (!w2t.includes(t)) throw new Error(t + ' did not move: Second has ' + JSON.stringify(w2t) + ' ' + s)
		const st = w.stacks[0]
		if ((await titlesOf(w1)).join() !== 'Charlie') throw new Error('First has ' + JSON.stringify(await titlesOf(w1)) + ' ' + s)
		if (!st || st.label !== '3 tabs') throw new Error('stack ' + JSON.stringify(w.stacks) + ' ' + s)
		return 'selected non-match stayed visible; Alpha and Bravo moved to Second ' + JSON.stringify(w2t) + '; stack "' + st.label + '", ' + s
	})

	// 20 visuals
	add('F20', 'Saved cards and hover cards look right (dashed edge, saved icon, faded favicons, map with a dashed rectangle)', '5, 6, 8', async () => {
		await fixture()
		const p = await openPopup('tab')
		await p.hover('#session-s1', 0.5, 0.8)
		await sleep(900)
		const a = await p.ev(`const c = document.querySelector('#session-s1'); const els = [c, ...c.querySelectorAll('*')].slice(0, 12); const cs = els.map((e) => getComputedStyle(e).borderTopStyle + '/' + getComputedStyle(e).outlineStyle); return {border: cs.some((x) => /dashed/.test(x)) ? 'dashed' : cs.join(','), hover: document.body.innerText.includes('restores at')}`)
		const s = await shot(p, 'F20')
		if (a.border !== 'dashed') throw new Error('saved card border-style is ' + a.border + ' ' + s)
		throw manual('computed checks pass (dashed card edge, hover card shows "restores at"), but how it LOOKS (saved icon, faded favicons, the map\'s dashed rectangle) needs a human eye on ' + s)
	})

	// =====================================================================
	// 21 keys (important)
	// =====================================================================
	add('F21a2', 'Same without the plain Delete in between: search a word two Spare tabs match, right-click a third, Ctrl+Delete: all three close, the text stays', '23, 26, 28', async () => {
		const {w3} = await fixture()
		const p = await openPopup('panel')
		await typeIn(p, 'oak')
		expect(await selectedOf(p), ['SpareOakA', 'SpareOakB'], 'search selected')
		await p.rightClick(tabSel('SparePineC'))
		expect(await selectedOf(p), ['SpareOakA', 'SpareOakB', 'SparePineC'], 'after the right-click')
		await p.chord(K.Ctrl, K.Delete)
		await settle(async () => (await allWindowIds()).includes(w3), false)
		const gone = !(await allWindowIds()).includes(w3)
		const val = await boxValue(p)
		const s = await shot(p, 'F21a2')
		if (!gone) throw new Error('Spare window still open: ' + JSON.stringify(await titlesOf(w3)) + '; focus ' + await focusAt(p) + ', box ' + JSON.stringify(val) + ', selected ' + JSON.stringify(await selectedOf(p)) + ', notices ' + JSON.stringify(await notices(p)) + ' ' + s)
		expect(val, 'oak', 'search text')
		return 'Ctrl+Delete closed all three, text "oak" stayed, ' + s
	})
	add('F21a', '(important) LITERAL SEQUENCE of the checklist: Search a word two Spare tabs match, right-click a third, plain Delete: nothing closes; Ctrl+Delete: all three close, the text stays', '23, 26, 28', async () => {
		const {w3} = await fixture()
		const p = await openPopup('panel')
		await typeIn(p, 'oak')
		expect(await selectedOf(p), ['SpareOakA', 'SpareOakB'], 'search selected')
		await p.rightClick(tabSel('SparePineC'))
		expect(await selectedOf(p), ['SpareOakA', 'SpareOakB', 'SparePineC'], 'after the right-click')
		await p.press(K.Delete); await sleep(700)
		expect((await titlesOf(w3)).length, 3, 'tabs after plain Delete')
		await p.chord(K.Ctrl, K.Delete)
		await settle(async () => (await allWindowIds()).includes(w3), false)
		const gone = !(await allWindowIds()).includes(w3)
		const val = await boxValue(p)
		const s = await shot(p, 'F21a')
		if (!gone) throw new Error('Spare window still open: ' + JSON.stringify(await titlesOf(w3)) + '; focus ' + await focusAt(p) + ', box ' + JSON.stringify(val) + ', selected ' + JSON.stringify(await selectedOf(p)) + ', notices ' + JSON.stringify(await notices(p)) + ' ' + s)
		expect(val, 'oak', 'search text')
		return 'plain Delete closed nothing; Ctrl+Delete closed all three, text "oak" stayed, ' + s
	})
	add('F21b', '(important) Ctrl+click a Spare tab, click into the search box, Ctrl+Backspace: a word goes, nothing closes', '23, 26, 28', async () => {
		const {w3} = await fixture()
		const p = await openPopup('panel')
		await typeIn(p, 'zzz yyy')
		await p.ctrlClick(tabSel('SpareOakA'))
		await p.click('.searchBoxInput')
		await p.chord(K.Ctrl, K.Backspace)
		await sleep(500)
		const val = await boxValue(p)
		const titles = await titlesOf(w3)
		const s = await shot(p, 'F21b')
		expect(titles.length, 3, 'Spare tabs (' + s + ')')
		if (!(val.length < 'zzz yyy'.length)) throw new Error('no word was removed: ' + JSON.stringify(val) + ' ' + s)
		return 'box "zzz yyy" -> ' + JSON.stringify(val) + ', 3 Spare tabs still open, ' + s
	})
	add('F21c', '(important) Ctrl+click two saved tabs, Ctrl+Delete: removed with Undo', '23, 26, 28', async () => {
		await fixture()
		const p = await openPopup('panel')
		await p.ctrlClick(savedSel('Juliett')); await p.ctrlClick(savedSel('Mike'))
		await p.chord(K.Ctrl, K.Delete)
		await p.waitFor(`document.querySelector('.notice.undo') ? true : false`, 5000)
		const shown = await Promise.all([shownIn(p, '#session-s1'), shownIn(p, '#session-s2')])
		const n = await noticesOf(p, 'undo')
		const s = await shot(p, 'F21c')
		expect(shown, [['Hotel', 'India', 'Kilo'], ['Lima', 'November']], 'shown (' + s + ')')
		return 'removed, notice ' + JSON.stringify(n[0]) + ', ' + s
	})

	// 22 Enter
	add('F22a', 'Ctrl+click saved tabs of two saved windows, Enter: one new window, tabs in the order shown', '23', async () => {
		await fixture()
		const p = await openPopup('panel')
		const before = await allWindowIds()
		await p.ctrlClick(savedSel('Mike')); await p.ctrlClick(savedSel('Kilo')); await p.ctrlClick(savedSel('India'))
		await p.press(K.Enter)
		const want = [['India', 'Kilo', 'Mike']]
		const got = await settle(() => newWindowTitles(before), want, 8000)
		expect(got, want, 'new windows')
		return 'one new window ' + JSON.stringify(got[0]) + ', ' + await shot(p, 'F22a')
	})
	add('F22b', '`s:` + a word, Enter: the selected saved matches open in one new window, never an empty one', '23, 26', async () => {
		await fixture()
		const p = await openPopup('panel')
		const before = await allWindowIds()
		await typeIn(p, 's:Kilo')
		await p.press(K.Enter)
		const want = [['Kilo']]
		const got = await settle(() => newWindowTitles(before), want, 8000)
		await sleep(800)
		expect(await newWindowTitles(before), want, 'new windows')
		return 'one new window ' + JSON.stringify(got[0]) + ', ' + await shot(p, 'F22b')
	})
	add('F22c', 'Filter on, `s:` match plus a non-matching saved tab selected: Enter opens both', '26, 39', async () => {
		await fixture()
		const p = await openPopup('panel')
		const before = await allWindowIds()
		await typeIn(p, 's:Kilo')
		await p.ctrlClick(savedSel('Hotel'))
		await p.click('.windowaction.filter')
		await sleep(400)
		await p.press(K.Enter)
		const want = [['Hotel', 'Kilo']]
		const got = await settle(() => newWindowTitles(before), want, 8000)
		expect(got, want, 'new windows')
		return 'opened both: ' + JSON.stringify(got[0]) + ', ' + await shot(p, 'F22c')
	})

	// 23 notices and Ctrl+Z
	add('F23a', 'Delete a saved window in the sidebar: bar stops while the mouse is over the notice; close button writes the delete at once', '24, 36', async () => {
		await fixture()
		const p = await openPopup('panel')
		await p.click('#session-s1 .tabaction.delete')
		await p.waitFor(`document.querySelector('.notice.undo') ? true : false`, 5000)
		const state = () => p.ev(`const f = document.querySelector('.notice.undo .notice-bar-fill'); const a = f.getAnimations()[0]; return {play: a ? a.playState : getComputedStyle(f).animationPlayState, t: a ? a.currentTime : null, held: document.querySelector('.notice.undo').classList.contains('held')}`)
		const running = await state(); await sleep(600); const running2 = await state()
		await p.hover('.notice.undo .notice-text')
		await sleep(300)
		const h1 = await state(); await sleep(1200); const h2 = await state()
		const stored1 = (await savedTitles()).s1
		const s = await shot(p, 'F23a-hover')
		const progressed = running2.t !== null && running.t !== null && running2.t > running.t
		const stopped = h1.held && h2.held && h1.t === h2.t
		if (!progressed) throw new Error('bar did not run before the hover ' + JSON.stringify([running, running2]) + ' ' + s)
		if (!stopped) throw new Error('bar did not stop over the notice ' + JSON.stringify([h1, h2]) + ' ' + s)
		if (!stored1) throw new Error('the delete was written while the notice was held ' + s)
		await p.click('.notice.undo .notice-close')
		await settle(async () => (await savedTitles()).s1 === undefined, true, 2000)
		const stored2 = (await savedTitles()).s1
		if (stored2 !== undefined) throw new Error('close button did not write the delete: ' + JSON.stringify(stored2))
		return 'bar ran (' + running.t + '->' + running2.t + 'ms), stopped while held (' + h1.t + ' = ' + h2.t + '), close wrote the delete at once, ' + s
	})
	add('F23b', 'Delete another saved window, Ctrl+Z with the sidebar focused: it comes back', '24, 36', async () => {
		await fixture()
		const p = await openPopup('panel')
		await p.click('#session-s2 .tabaction.delete')
		await p.waitFor(`document.querySelector('.notice.undo') ? true : false`, 5000)
		await p.chord(K.Ctrl, 'z')
		await settleExpect(() => shownIn(p, '#session-s2'), ['Lima', 'Mike', 'November'], 'Taxes shown again')
		await sleep(9000)
		expect((await savedTitles()).s2, ['Lima', 'Mike', 'November'], 'stored')
		return 'Taxes back (and stays after the countdown), ' + await shot(p, 'F23b')
	}, {slow: true})
	add('F23c', '(important) With text in the search box and an Undo notice up, Ctrl+Z brings the window back and leaves the text', '36', async () => {
		await fixture()
		const p = await openPopup('panel')
		await p.click('#session-s1 .tabaction.delete')
		await p.waitFor(`document.querySelector('.notice.undo') ? true : false`, 5000)
		await typeIn(p, 'Bravo')
		await p.chord(K.Ctrl, 'z')
		await sleep(600)
		const val = await boxValue(p)
		const shown = await shownIn(p, '#session-s1')
		const n = await noticesOf(p, 'undo')
		const s = await shot(p, 'F23c')
		expect(shown, ['Hotel', 'India', 'Juliett', 'Kilo'], 'Reading restored (' + s + ')')
		expect(val, 'Bravo', 'search text (Firefox\'s own undo must not run)')
		return 'Reading back, text "Bravo" kept, notices left ' + JSON.stringify(n) + ', ' + s
	})
	add('F23d', 'With no Undo notice, Ctrl+Z in the search box is the text\'s own undo', '36', async () => {
		await fixture()
		const p = await openPopup('panel')
		await typeIn(p, 'Bravo')
		await p.chord(K.Ctrl, 'z')
		await sleep(400)
		const val = await boxValue(p)
		if (val === 'Bravo') throw new Error('text unchanged, the own undo did not run')
		return 'box "Bravo" -> ' + JSON.stringify(val)
	})

	// 25 s: search
	const header0 = async (p) => (await header(p))[0]
	add('F25a', '`s:` + word selects the saved match only (no open tab)', '20, 30, 35', async () => {
		await fixture()
		const p = await openPopup('panel')
		await typeIn(p, 's:Kilo')
		const r = [await savedSelected(p), await selectedOf(p)]
		expect(r, [['Kilo'], []], 'selected saved / open')
		return 'saved Kilo selected, no open tab, header ' + JSON.stringify(await header0(p)) + ', ' + await shot(p, 'F25a')
	})
	add('F25b', '`s:` alone reads "N tabs in M saved windows"', '20, 30, 35', async () => {
		await fixture()
		const p = await openPopup('panel')
		await typeIn(p, 's:')
		const hd = await header0(p)
		if (!/^7 tabs in 2 saved windows/.test(hd)) throw new Error('header ' + JSON.stringify(hd) + ' ' + await shot(p, 'F25b'))
		return JSON.stringify(hd) + ', ' + await shot(p, 'F25b')
	})
	add('F25c', '`-s:word` matches and selects only open tabs', '20, 30, 35', async () => {
		await fixture()
		const p = await openPopup('panel')
		await typeIn(p, '-s:echo')
		expect([await selectedOf(p), await savedSelected(p)], [['Echo'], []], 'selected open / saved')
		await p.press(K.Escape)
		await typeIn(p, '-s:kilo')
		expect([await selectedOf(p), await savedSelected(p)], [[], []], '-s:kilo selects nothing (Kilo is only saved)')
		return 'ok, ' + await shot(p, 'F25c')
	})
	add('F25d', '`-s:` alone shows open windows and selects nothing', '20, 30, 35', async () => {
		await fixture()
		const p = await openPopup('panel')
		await typeIn(p, '-s:')
		const hd = await header0(p)
		expect([await selectedOf(p), await savedSelected(p)], [[], []], 'selected')
		if (!/tabs? in \d+ open windows?/.test(hd)) throw new Error('header ' + JSON.stringify(hd))
		return 'header ' + JSON.stringify(hd) + ', ' + await shot(p, 'F25d')
	})
	add('F25e', 'The search help lists the `s:` rows', '20, 30, 35', async () => {
		await fixture()
		const p = await openPopup('panel')
		await p.click('.search-help-icon')
		await sleep(400)
		const text = await p.ev(`return document.querySelector('.search-help').innerText`)
		for (const row of ['s:tax', 's:u:github', 's: t:tax', '-s:tax', '-s:']) if (!text.includes(row)) throw new Error('missing row ' + row + ' in ' + JSON.stringify(text.slice(0, 300)))
		return 'rows present, ' + await shot(p, 'F25e')
	})
	add('F25f', '`s:u:` and `s: t:` forms', '20, 30, 35', async () => {
		await fixture()
		const p = await openPopup('panel')
		await typeIn(p, 's:u:p/kilo')
		expect(await savedSelected(p), ['Kilo'], 's:u:')
		await p.press(K.Escape)
		await typeIn(p, 's: t:lima')
		expect(await savedSelected(p), ['Lima'], 's: t:')
		return 'ok, ' + await shot(p, 'F25f')
	})
	add('F25g', 'With saved windows off, `s:foo` is plain text', '20, 30, 35', async () => {
		await fixture({saved: false, extraStorage: {sessionsFeature: false}})
		const p = await openPopup('panel', 'tab', {saved: false})
		await typeIn(p, 's:foo')
		const hd = await header0(p)
		const sessions = await p.ev(`return document.querySelectorAll('.window.session').length`)
		if (/saved/.test(hd) || sessions) throw new Error('header ' + JSON.stringify(hd) + ', saved cards ' + sessions)
		return 'header ' + JSON.stringify(hd) + ', no saved cards, ' + await shot(p, 'F25g')
	})

	// plain search syntax
	const searchCase = (id, q, want, label) => add(id, 'Search ' + label + ': ' + q, '-', async () => {
		await fixture()
		const p = await openPopup('tab')
		await typeIn(p, q)
		const got = await selectedOf(p)
		expect(got, want, 'selected for ' + q + ' (' + await shot(p, id) + ')')
		return JSON.stringify(got) + ', ' + await shot(p, id)
	})
	searchCase('Q01', 't:alpha', ['Alpha'], 'title only')
	searchCase('Q02', 'u:p/delta', ['Delta'], 'url only')
	searchCase('Q03', 'spare -oaka', ['SpareOakB', 'SparePineC'], 'minus word')
	searchCase('Q04', '"SpareOakB"', ['SpareOakB'], 'quoted phrase')
	searchCase('Q05', '/Spare(Oak|Pine)[BC]$/', ['SpareOakB', 'SparePineC'], 'regex')
	searchCase('Q06', 'alpha OR echo', ['Alpha', 'Echo'], 'OR')

	// =====================================================================
	// keyboard
	// =====================================================================
	const ringed = (p) => titlesWith(p, 'key-cursor')
	add('K01', 'Plain arrows move the ring and leave the selection alone', '-', async () => {
		await fixture()
		const p = await openPopup('tab')
		await p.press(K.Right)
		const r1 = await ringed(p)
		await p.press(K.Right)
		const r2 = await ringed(p)
		const sel = await selectedOf(p)
		if (r1.length !== 1 || r2.length !== 1 || r1[0] === r2[0]) throw new Error('ring ' + JSON.stringify([r1, r2]))
		expect(sel, [], 'selection')
		return 'ring ' + JSON.stringify(r1) + ' -> ' + JSON.stringify(r2) + ', nothing selected, ' + await shot(p, 'K01')
	})
	add('K02', 'Shift+arrow twice from a tab with nothing selected selects three tabs', '-', async () => {
		await fixture()
		const p = await openPopup('tab')
		await p.press(K.Right)
		await p.mod([K.Shift], async () => { await p.press(K.Right); await p.press(K.Right) })
		const sel = await selectedOf(p)
		if (sel.length !== 3) throw new Error('selected ' + JSON.stringify(sel) + ' ' + await shot(p, 'K02'))
		return 'selected ' + JSON.stringify(sel) + ', ' + await shot(p, 'K02')
	})
	add('K03', 'Arrow, arrow, Space selects only the third', '-', async () => {
		await fixture()
		const p = await openPopup('tab')
		await p.press(K.Right); const a = await ringed(p)
		await p.press(K.Right)
		await p.press(K.Right); const c = await ringed(p)
		await p.press(K.Space)
		const sel = await selectedOf(p)
		expect(sel, c, 'selected = the tab under the ring')
		return 'ring ' + JSON.stringify(a) + ' ... ' + JSON.stringify(c) + ' selected ' + JSON.stringify(sel) + ', ' + await shot(p, 'K03')
	})
	add('K04', 'Enter after an arrow with nothing selected switches to the ring\'s tab, opens no window', '-', async () => {
		const {w1} = await fixture()
		const p = await openPopup('tab')
		const before = await allWindowIds()
		await p.press(K.Right); await p.press(K.Right)
		const ring = (await ringed(p))[0]
		await p.press(K.Enter)
		await sleep(900)
		const active = await h.api(`return (await B.tabs.query({active: true})).map((t) => t.title)`)
		expect(await allWindowIds(), before, 'windows')
		if (!active.includes(ring)) throw new Error('active tabs ' + JSON.stringify(active) + ', ring was ' + ring)
		return 'switched to ' + JSON.stringify(ring) + ', no window opened'
	})
	add('K05', 'Escape clears the selection; Escape in the search box clears the text', '-', async () => {
		await fixture()
		const p = await openPopup('tab')
		await p.ctrlClick(tabSel('Alpha')); await p.ctrlClick(tabSel('Echo'))
		expect((await selectedOf(p)).length, 2)
		await p.press(K.Escape)
		expect(await selectedOf(p), [], 'selection after Escape')
		await typeIn(p, 'bravo')
		await p.press(K.Escape)
		await sleep(300)
		const v = await boxValue(p)
		if (v !== '') throw new Error('text after Escape: ' + JSON.stringify(v))
		return 'selection and text cleared, ' + await shot(p, 'K05')
	})
	add('K06', 'Ctrl+Backspace closes selected open tabs; Ctrl+Delete too', '23, 28', async () => {
		const {w3} = await fixture()
		const p = await openPopup('tab')
		await p.ctrlClick(tabSel('SpareOakA')); await p.ctrlClick(tabSel('SpareOakB'))
		await p.chord(K.Ctrl, K.Backspace)
		await settleExpect(() => titlesOf(w3), ['SparePineC'], 'Spare after Ctrl+Backspace')
		return 'closed two tabs, ' + await shot(p, 'K06')
	})
	add('K07', 'Plain Delete and Backspace close nothing', '23, 28', async () => {
		const {w3} = await fixture()
		const p = await openPopup('tab')
		await p.ctrlClick(tabSel('SpareOakA')); await p.ctrlClick(tabSel('SpareOakB'))
		await p.press(K.Delete); await p.press(K.Backspace); await sleep(700)
		expect((await titlesOf(w3)).length, 3)
		return 'nothing closed'
	})

	// =====================================================================
	// 26 maximize, minimize inactive
	// =====================================================================
	add('F26', 'Maximize a window, save it, restore it: opens maximized, the hover card says "restores maximized"', '21, 32', async () => {
		const {w1} = await fixture({saved: false})
		await h.api(`await B.windows.update(A, {state: 'maximized'})`, w1)
		await sleep(1200)
		const p = await openPopup('tab', 'tab', {saved: false})
		await p.click('#window-' + w1 + ' .tabaction.save')
		await p.waitFor(`document.querySelector('.session .tab') ? true : false`, 6000)
		await waitIdle(p)
		const st = await h.api(`const {sessions} = await B.storage.local.get('sessions'); return Object.values(sessions).map((s) => s.windowsInfo && s.windowsInfo.state)`)
		await p.hover('.window.session', 0.5, 0.85)
		await sleep(1000)
		const txt = await hoverCardText(p)
		const s1 = await shot(p, 'F26-hover')
		const before = await allWindowIds()
		await p.click('.window.session', 0.9, 0.5)
		await settle(async () => (await allWindowIds()).length, before.length + 1)
		await sleep(2500)
		const nw = (await allWindowIds()).find((i) => !before.includes(i))
		const state = nw ? await h.api(`return (await B.windows.get(A)).state`, nw) : null
		if (st[0] !== 'maximized') throw new Error('saved state ' + JSON.stringify(st) + ' ' + s1)
		if (!/restores maximized/.test(txt)) throw new Error('hover card text lacks "restores maximized" ' + s1)
		if (state !== 'maximized') throw new Error('restored window state ' + state + ' ' + s1)
		await h.api(`await B.windows.update(A, {state: 'normal'})`, nw)
		await sleep(800)
		const st2 = await h.api(`return (await B.windows.get(A)).state`, nw)
		return 'saved maximized, hover says restores maximized, restored window state maximized, un-maximized -> ' + st2 + ' (single monitor; "same monitor" part is MANUAL), ' + s1
	})
	add('F28', 'Minimize inactive windows (Firefox, #28): enabled in Options, focusing a window minimizes all others', '28 (changelog)', async () => {
		const {w1, w2, w3} = await fixture({saved: false})
		const {windowId, handle} = await h.newWindow(EXT + '/options.html', GEOS.tab)
		const op = new Page(h, handle, windowId)
		await op.waitFor(`[...document.querySelectorAll('.textlabel')].some((l) => l.textContent.trim() === 'Minimize inactive windows')`, 10000)
		const before = await h.api(`return (await B.storage.local.get('hideWindows')).hideWindows`)
		await op.ev(`[...document.querySelectorAll('.textlabel')].find((l) => l.textContent.trim() === 'Minimize inactive windows').click()`)
		await sleep(700)
		const on = await h.api(`return (await B.storage.local.get('hideWindows')).hideWindows`)
		const s0 = await shot(op, 'F28-option')
		if (on !== true) throw new Error('setting not stored as on (was ' + JSON.stringify(before) + ', now ' + JSON.stringify(on) + ') ' + s0)
		await h.api(`await B.windows.update(A, {focused: true})`, w1)
		await sleep(3000)
		const states = await h.api(`const out = {}; for (const w of await B.windows.getAll()) out[w.id] = [w.state, w.focused]; return out`)
		const sh = await h.shot(h.ctl, 'F28-after')
		await h.api(`await B.storage.local.set({hideWindows: false})`)
		for (const id of Object.keys(states)) await h.api(`await B.windows.update(A, {state: 'normal'})`, Number(id)).catch(() => {})
		const others = [w2, w3].map((id) => states[id] && states[id][0])
		if (!others.every((x) => x === 'minimized')) throw new Error('window states after focusing First: ' + JSON.stringify(states) + ' ' + s0)
		return 'option stored on; after focusing First, Second and Spare are minimized (' + JSON.stringify(states) + ')'
	})

	return list
}
