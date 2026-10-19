// Upgrade 5.2.4 -> 7.0.0 in a real Firefox, same add-on id.
//
// 5.2.4 (from the GitHub release, treated as data: only its manifest got the
// gecko id added in a copy, because the release file has none and a temporary
// add-on without an id gets a random one) is installed as a temporary add-on.
// Its own popup UI is used (real clicks and keys) to create two saved windows
// and a window name and colour, and its settings are written the way 5.x writes
// them (localStorage of its page). Then 7.0.0 (build/firefox) is installed over
// it with the same id (Addon:Install, temporary, as about:debugging "Load
// Temporary Add-on" does) and the data is read back.
import {existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, cpSync} from 'node:fs'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'
import {Harness, Page, EXT, sleep, GECKO_ID} from './lib.mjs'

export function upgradeChecks({OUT, root, buildDir, headless}) {
	const dl = join(OUT, 'v524')
	const x = join(dl, 'x'), y = join(dl, 'y')
	let state = null
	let failure = null

	function fetch524() {
		if (existsSync(join(y, 'manifest.json'))) return
		mkdirSync(dl, {recursive: true})
		if (!existsSync(join(dl, 'tab-manager-plus-5.2.4.firefox.zip'))) {
			const r = spawnSync('gh', ['release', 'download', '5.2.4', '-R', 'stefanXO/Tab-Manager-Plus', '-p', '*.zip', '--dir', dl], {encoding: 'utf8'})
			if (r.status !== 0) throw new Error('could not download 5.2.4: ' + r.stderr)
		}
		rmSync(x, {recursive: true, force: true}); mkdirSync(x, {recursive: true})
		// unzip with the system tar (Windows 10+ bsdtar reads zip), into its own empty folder
		const t = spawnSync('tar', ['-xf', join(dl, 'tab-manager-plus-5.2.4.firefox.zip'), '-C', x], {encoding: 'utf8'})
		if (t.status !== 0) throw new Error('unzip failed: ' + t.stderr)
		rmSync(y, {recursive: true, force: true})
		cpSync(x, y, {recursive: true})
		const m = JSON.parse(readFileSync(join(y, 'manifest.json'), 'utf8'))
		m.browser_specific_settings = {gecko: {id: GECKO_ID}}
		writeFileSync(join(y, 'manifest.json'), JSON.stringify(m, null, 1))
	}

	const LS = `const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k).slice(0, 60) } return o`

	async function flow() {
		fetch524()
		const profile = join(OUT, 'profile-upgrade')
		rmSync(profile, {recursive: true, force: true})
		const h = new Harness({profile, port: 2872, extPath: y, headless})
		const out = {shots: []}
		try {
			await h.start()
			await h.openControl()
			out.v1 = await h.api(`return (await B.runtime.getManifest()).version`)
			const w1 = (await h.api(`return await B.windows.create(A)`, {url: [h.page('Alpha'), h.page('Bravo'), h.page('Charlie')], width: 800, height: 600})).id
			const w2 = (await h.api(`return await B.windows.create(A)`, {url: [h.page('Delta'), h.page('Echo')], width: 800, height: 600})).id
			const {windowId, handle} = await h.newWindow(EXT + '/popup.html', {width: 1000, height: 800, left: 0, top: 0})
			const p = new Page(h, handle, windowId)
			await sleep(1500)
			// 5.x settings, written the way 5.x writes them (localStorage of its own page)
			await p.ev(`localStorage.sessionsFeature = '1'; localStorage.layout = 'vertical'; localStorage.compact = '1'; localStorage.animations = '0'; localStorage.windowTitles = '1'; localStorage.tabactions = '1'; localStorage.badge = '0'; localStorage.tabLimit = '0'; return 1`)
			await p.goto(EXT + '/popup.html'); await sleep(2000)
			// name and colour of window 1, through 5.2.4's own screen
			await p.click('#window-' + w1 + ' h3.windowTitle'); await sleep(700)
			await p.click('.window-name-input'); await p.type('Reading list'); await p.press('')
			await sleep(500)
			if (!(await p.ev(`return !!document.querySelector('.colors-box')`))) { await p.click('#window-' + w1 + ' h3.windowTitle'); await sleep(700) }
			await p.click('.colors-box .color5'); await sleep(600)
			out.shots.push(await p.shot('U-5.2.4-name-color'))
			await p.goto(EXT + '/popup.html'); await sleep(2000)
			// save both windows with 5.2.4's save buttons
			await p.click('#window-' + w1 + ' .tabaction.save'); await sleep(900)
			await p.click('#window-' + w2 + ' .tabaction.save'); await sleep(900)
			out.shots.push(await p.shot('U-5.2.4-saved'))
			out.before = await p.api(`const s = await B.storage.local.get(null); const keys = Object.keys(s).filter((k) => s[k] && s[k].tabs); return {sessionKeys: keys, tabs: keys.map((k) => [s[k].name, s[k].color, (s[k].tabs || []).map((t) => t.title)]), other: Object.keys(s).filter((k) => !(s[k] && s[k].tabs))}`)
			out.beforeLs = await p.ev(LS)
			// install 7.0.0 over it
			await p.close()
			await h.install(buildDir)
			await sleep(2500)
			await h.openControl().catch(() => {})
			out.v2 = await h.api(`return (await B.runtime.getManifest()).version`)
			const q = await h.newWindow(EXT + '/popup.html', {width: 1000, height: 800, left: 0, top: 0})
			const p2 = new Page(h, q.handle, q.windowId)
			await sleep(3500)
			out.after = await p2.api(`const s = await B.storage.local.get(null); const o = {}; for (const [k, v] of Object.entries(s)) o[k] = (k === 'sessions') ? Object.values(v).map((x) => [x.name, x.color, x.customName, x.tabs.map((t) => t.title)]) : v; return o`)
			out.afterLs = await p2.ev(LS)
			out.cards = await p2.ev(`return [...document.querySelectorAll('.window.session')].map((c) => c.id + ' | ' + (c.querySelector('h3') ? c.querySelector('h3').textContent : '') + ' | ' + c.className.split(' ').filter((x) => /^color/.test(x)).join('') + ' | ' + [...c.querySelectorAll('.tab')].map((t) => (t.getAttribute('data-hover') || '').split('\\n')[0]).join(','))`)
			out.shots.push(await p2.shot('U-7.0.0-after'))
			out.errors = await h.chrome(`const out = []; for (const m of Services.console.getMessageArray()) { if (!(m instanceof Ci.nsIScriptError) || (m.flags & m.warningFlag)) continue; if (!/moz-extension/.test(m.sourceName || '')) continue; if (/PRIVACY|Promise resolved after context unloaded/.test((m.sourceName || '') + m.errorMessage)) continue; out.push((m.errorMessage || '').slice(0, 160) + ' @' + (m.sourceName || '').replace(/moz-extension:\\/\\/[^/]+/, '')) } return out`)
			// the saved windows still work: restore one
			const before = await h.api(`return (await B.windows.getAll()).map((w) => w.id)`)
			await p2.click('.window.session', 0.9, 0.5).catch(() => {})
			await sleep(2500)
			out.restoredNew = await h.api(`const out = []; for (const w of await B.windows.getAll({populate: true})) if (!A.includes(w.id)) out.push(w.tabs.map((t) => t.title || t.url)); return out`, before)
			out.shots.push(await p2.shot('U-7.0.0-restore'))
			state = out
		} finally {
			await h.stop()
		}
	}

	const need = async () => {
		if (state) return state
		if (failure) throw failure
		try { await flow() } catch (e) { failure = e; throw e }
		return state
	}

	return [
		{id: 'U00', name: 'Upgrade: 5.2.4 (temporary add-on, same id) with 2 saved windows, a window name/colour and settings, then 7.0.0 installed over it', patches: 'migrate.ts', noRetry: true,
			async fn() {
				const s = await need()
				if (s.v1 !== '5.2.4' || s.v2 !== '7.0.0') throw new Error('versions ' + s.v1 + ' -> ' + s.v2)
				if (!s.before.tabs.length || s.before.tabs.length < 2) throw new Error('5.2.4 produced ' + JSON.stringify(s.before) + ' (could not create two saved windows through its UI)')
				return '5.2.4 state before: ' + JSON.stringify(s.before.tabs) + ' (' + s.before.sessionKeys.length + ' per-session storage keys), localStorage ' + JSON.stringify(s.beforeLs) + '; then 7.0.0 installed over it with the same id. Method: real 5.2.4 UI + Addon:Install of build/firefox. Screens: ' + s.shots.join(' ')
			}},
		{id: 'U01', name: 'Upgrade: saved windows survived (both, with their tabs)', patches: 'migrate.ts', noRetry: true,
			async fn() {
				const s = await need()
				const want = s.before.tabs.map((t) => JSON.stringify(t[2])).sort()
				const got = (s.after.sessions || []).map((t) => JSON.stringify(t[3])).sort()
				if (JSON.stringify(want) !== JSON.stringify(got)) throw new Error('tabs before ' + want + ' after ' + got + ' ' + s.shots.join(' '))
				if (!s.cards || s.cards.length !== 2) throw new Error('cards shown: ' + JSON.stringify(s.cards))
				return 'sessions after: ' + JSON.stringify(s.after.sessions) + '; popup cards ' + JSON.stringify(s.cards) + ' ' + s.shots[2]
			}},
		{id: 'U02', name: 'Upgrade: window name and colour survived', patches: 'migrate.ts', noRetry: true,
			async fn() {
				const s = await need()
				const after = (s.after.sessions || []).map((t) => [t[0], t[1]])
				const hasName = JSON.stringify(s.after).includes('Reading list') || JSON.stringify(s.cards).includes('Reading list')
				if (!hasName) throw new Error('name "Reading list" not found after the upgrade: sessions ' + JSON.stringify(after) + ' windowNames ' + JSON.stringify(s.after.windowNames) + ' cards ' + JSON.stringify(s.cards) + '; before ' + JSON.stringify(s.before.tabs.map((t) => [t[0], t[1]])))
				const bn = JSON.parse(s.beforeLs.windowNames), bc = JSON.parse(s.beforeLs.windowColors)
				if (JSON.stringify(s.after.windowNames) !== JSON.stringify(bn) || JSON.stringify(s.after.windowColors) !== JSON.stringify(bc)) throw new Error('windowNames/windowColors before ' + JSON.stringify([bn, bc]) + ' after ' + JSON.stringify([s.after.windowNames, s.after.windowColors]))
				return 'windowNames ' + JSON.stringify(s.after.windowNames) + ' and windowColors ' + JSON.stringify(s.after.windowColors) + ' (of the open window) are unchanged; 5.2.4 stores no colour in its saved windows (null before and after), the saved window names kept; before ' + JSON.stringify(s.before.tabs.map((t) => [t[0], t[1]])) + ', after sessions ' + JSON.stringify(after) + ', cards ' + JSON.stringify(s.cards)
			}},
		{id: 'U03', name: 'Upgrade: settings survived (layout vertical, compact on, animations off, badge off, saved windows on) and moved out of localStorage', patches: 'migrate.ts', noRetry: true,
			async fn() {
				const s = await need()
				const a = s.after
				const got = {layout: a.layout, compact: a.compact, animations: a.animations, badge: a.badge, sessionsFeature: a.sessionsFeature, version: a.version}
				const want = {layout: 'vertical', compact: true, animations: false, badge: false, sessionsFeature: true, version: '7.0.0'}
				if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error('settings after: ' + JSON.stringify(got) + ', wanted ' + JSON.stringify(want) + '; localStorage after ' + JSON.stringify(s.afterLs))
				const left = Object.keys(s.afterLs || {}).filter((k) => ['layout', 'compact', 'animations', 'badge', 'sessionsFeature'].includes(k))
				if (left.length) throw new Error('keys left in localStorage: ' + left)
				return JSON.stringify(got) + '; migrated localStorage keys are gone; leftover per-session keys: ' + JSON.stringify(Object.keys(a).filter((k) => a[k] && typeof a[k] === 'object' && a[k].tabs))
			}},
		{id: 'U04', name: 'Upgrade: 7.0.0 shows the old data without extension errors, and a migrated saved window restores', patches: 'migrate.ts', noRetry: true,
			async fn() {
				const s = await need()
				if (s.errors && s.errors.length) throw new Error('errors: ' + JSON.stringify(s.errors))
				if (!s.restoredNew || !s.restoredNew.length) throw new Error('restoring a migrated saved window opened nothing ' + s.shots[3])
				return 'no extension errors; restored a saved window: ' + JSON.stringify(s.restoredNew) + ', ' + s.shots[3]
			}},
	]
}
