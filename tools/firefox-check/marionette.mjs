// Minimal Marionette client (Firefox's WebDriver classic transport) plus a
// launcher. Used because WebDriver BiDi refuses screenshots and input on
// moz-extension:// pages ("privileged scope"); Marionette drives them like
// selenium does. Input is Marionette's "Perform Actions" (real pointer and key
// actions through Firefox's input pipeline), never synthetic DOM events.
import net from 'node:net'
import {spawn} from 'node:child_process'
import {mkdirSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

export const FIREFOX = process.env.FIREFOX_PATH || 'C:\\Program Files\\Mozilla Firefox\\firefox.exe'
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function launchFirefox({profile, port, headless, prefs = {}, log}) {
	mkdirSync(profile, {recursive: true})
	const base = {
		'marionette.port': port,
		'marionette.enabled': true,
		'xpinstall.signatures.required': false,
		'extensions.autoDisableScopes': 0,
		'extensions.enabledScopes': 15,
		'browser.shell.checkDefaultBrowser': false,
		'browser.startup.homepage': 'about:blank',
		'browser.startup.page': 0,
		'browser.aboutwelcome.enabled': false,
		'browser.tabs.warnOnClose': false,
		'browser.warnOnQuit': false,
		'datareporting.policy.dataSubmissionEnabled': false,
		'toolkit.telemetry.reportingpolicy.firstRun': false,
		'app.update.auto': false,
		'app.update.enabled': false,
		'browser.download.folderList': 2,
		'browser.download.dir': join(profile, 'downloads'),
		'browser.download.useDownloadDir': true,
		'browser.download.alwaysOpenPanel': false,
		'network.proxy.type': 0,
		'dom.disable_beforeunload': true,
		'devtools.chrome.enabled': true,
		'extensions.getAddons.cache.enabled': false,
		'extensions.update.enabled': false,
		'browser.newtabpage.enabled': false,
		'startup.homepage_welcome_url': '',
		'startup.homepage_welcome_url.additional': '',
		...prefs,
	}
	const user = Object.entries(base).map(([k, v]) => `user_pref(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join('\n')
	writeFileSync(join(profile, 'user.js'), user + '\n')
	const args = ['--marionette', '--remote-allow-system-access', '--profile', profile, '--no-remote', '--new-instance', 'about:blank']
	if (headless) args.unshift('--headless')
	const env = {...process.env, MOZ_CRASHREPORTER_DISABLE: '1'}
	const proc = spawn(FIREFOX, args, {env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: false})
	const out = []
	proc.stdout.on('data', (d) => out.push(String(d)))
	proc.stderr.on('data', (d) => out.push(String(d)))
	if (log) proc.on('exit', () => { try { writeFileSync(log, out.join('')) } catch {} })
	return proc
}

export class Marionette {
	constructor(port) { this.port = port; this.id = 0; this.pending = new Map(); this.buf = Buffer.alloc(0) }
	async connect(timeout = 60000) {
		const t0 = Date.now()
		for (;;) {
			try { await this.#open(); return } catch (e) {
				if (Date.now() - t0 > timeout) throw e
				await sleep(300)
			}
		}
	}
	#open() {
		return new Promise((ok, fail) => {
			const s = net.connect(this.port, '127.0.0.1')
			this.sock = s
			let hello = false
			s.on('error', (e) => { if (!hello) fail(e) })
			s.on('close', () => { for (const p of this.pending.values()) p.fail(new Error('marionette closed')); this.pending.clear() })
			s.on('data', (d) => {
				this.buf = Buffer.concat([this.buf, d])
				for (;;) {
					const i = this.buf.indexOf(0x3a)
					if (i < 0) return
					const len = Number(this.buf.subarray(0, i).toString())
					if (this.buf.length < i + 1 + len) return
					const msg = this.buf.subarray(i + 1, i + 1 + len).toString('utf8')
					this.buf = this.buf.subarray(i + 1 + len)
					const data = JSON.parse(msg)
					if (!hello) { hello = true; ok(data); continue }
					const [, id, err, res] = data
					const p = this.pending.get(id)
					if (!p) continue
					this.pending.delete(id)
					if (err) p.fail(Object.assign(new Error((err.error || 'error') + ': ' + (err.message || '')), {marionette: err}))
					else p.ok(res)
				}
			})
		})
	}
	send(name, params = {}) {
		const id = ++this.id
		const body = JSON.stringify([0, id, name, params])
		return new Promise((ok, fail) => {
			this.pending.set(id, {ok, fail})
			this.sock.write(Buffer.byteLength(body) + ':' + body)
		})
	}
	close() { try { this.sock.destroy() } catch {} }

	newSession() { return this.send('WebDriver:NewSession', {capabilities: {acceptInsecureCerts: true}}) }
	navigate(url) { return this.send('WebDriver:Navigate', {url}) }
	url() { return this.send('WebDriver:GetCurrentURL').then((r) => r.value ?? r) }
	title() { return this.send('WebDriver:GetTitle').then((r) => r.value ?? r) }
	handles() { return this.send('WebDriver:GetWindowHandles') }
	handle() { return this.send('WebDriver:GetWindowHandle').then((r) => r.value ?? r) }
	switchTo(handle, focus = true) { return this.send('WebDriver:SwitchToWindow', {handle, focus}) }
	newWindow(type = 'tab', focus = false) { return this.send('WebDriver:NewWindow', {type, focus}) }
	closeWindow() { return this.send('WebDriver:CloseWindow') }
	setRect(r) { return this.send('WebDriver:SetWindowRect', r) }
	getRect() { return this.send('WebDriver:GetWindowRect') }
	setContext(value) { return this.send('Marionette:SetContext', {value}) }
	async exec(script, args = []) {
		const r = await this.send('WebDriver:ExecuteScript', {script, args, sandbox: 'default'})
		return r && typeof r === 'object' && 'value' in r ? r.value : r
	}
	async execAsync(script, args = []) {
		const r = await this.send('WebDriver:ExecuteAsyncScript', {script, args, sandbox: 'default'})
		return r && typeof r === 'object' && 'value' in r ? r.value : r
	}
	async screenshot(file) {
		const r = await this.send('WebDriver:TakeScreenshot', {full: false})
		writeFileSync(file, Buffer.from(r.value, 'base64'))
		return file
	}
	actions(list) { return this.send('WebDriver:PerformActions', {actions: list}) }
	releaseActions() { return this.send('WebDriver:ReleaseActions') }
	installAddon(path, temporary = true) { return this.send('Addon:Install', {path, temporary}) }
	uninstallAddon(id) { return this.send('Addon:Uninstall', {id}) }
	async quit() { try { await this.send('Marionette:Quit', {flags: ['eForceQuit']}) } catch {} }
}
