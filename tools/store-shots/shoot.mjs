// node tools/store-shots/shoot.mjs [--list] [--only 2,5] [--style A,B] [--tiles chaos,purple,windows|all] [--ring N]
//                                  [--out DIR] [--no-build] [--no-sheets] [--scale N]
//
// Renders the Chrome Web Store screenshots, promo tiles and contact sheets of the REAL popup (bundled against a fake browser)
// into tools/store-shots/out/. Everything a person tweaks lives in shots.json (see README.md).
//
//   --list | --dry-run   print the shot plan (id, style, size, output file, what the shot does) and exit; no build, no Chrome
//   --only 2,5           just these shot ids (ids: see --list; "small" and "marquee" are the promo tiles); a shot that is only
//                        on request in a style (shot 6, style B) renders when it is named here
//   --style A,B          which style to render (default B, the one picked for the store; A is the dark "brag" look)
//   --tiles NAME|all     the alternative promo tiles of shots.json `tiles` (chaos, purple, windows) into out/tiles-<name>/
//                        instead of the shots
//   --ring N             callout shots only (those with a `crop`), style B, N px ring padding, into out/B-ringN/ + out/_ring-compare.png
//   --out DIR            write under DIR instead of tools/store-shots/out
//   --no-build           reuse the popup bundle in app/ (default: rebuild it from the repo's src/ and css/ every run)
//   --no-sheets          skip the contact sheets (they are also skipped when --only or --tiles is given)
//   --scale N            render the shots at device scale N instead of their `scales`, named by the final size, into
//                        out/<style>-<W>x<H>/ (1.875 gives 2400x1500, the largest 16:10 size Firefox Add-ons takes)
//
// Needs Chrome (CHROME_PATH overrides; else a pinned build in ~/.cache/puppeteer, then the system Chrome) and puppeteer-core
// from the repo's node_modules.
import {createServer} from 'node:http'
import {existsSync, mkdirSync, readdirSync, readFileSync} from 'node:fs'
import {readFile, writeFile} from 'node:fs/promises'
import {homedir} from 'node:os'
import {dirname, extname, join, normalize, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {app, buildApp} from './build-app.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const cfg = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'))

// ------------------------------------------------------------------ arguments
const argv = process.argv.slice(2)
const flag = (n) => argv.includes(n)
const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null }
if (flag('--help') || flag('-h')) {
	console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).slice(0, 20).map((l) => l.slice(3)).join('\n'))
	process.exit(0)
}
const only = arg('--only')?.split(',')
const styles = arg('--style') ? arg('--style').toUpperCase().split(',') : ['B']
const ring = arg('--ring')
const outRoot = arg('--out') ? resolve(arg('--out')) : join(here, 'out')
const scaleArg = arg('--scale') ? Number(arg('--scale')) : null
if (scaleArg !== null && !(scaleArg > 0)) throw new Error('--scale takes a positive number, got ' + arg('--scale'))
const tileArg = arg('--tiles')
const tileIds = tileArg ? (tileArg === 'all' ? cfg.tiles.map((t) => t.id) : tileArg.split(',')) : null
for (const s of styles) if (!['A', 'B'].includes(s)) throw new Error('--style takes A and/or B, got ' + s)
for (const id of tileIds || []) if (!cfg.tiles.some((t) => t.id === id)) throw new Error(`no tile "${id}" in shots.json (have: ${cfg.tiles.map((t) => t.id).join(', ')})`)
for (const id of only || []) if (!cfg.shots.some((s) => s.id === id)) throw new Error(`no shot "${id}" in shots.json (have: ${cfg.shots.map((s) => s.id).join(', ')})`)

// ------------------------------------------------------------------ the plan
const merged = (shot, style) => ({...shot, ...(shot[style] || {})})
const sizeName = (name, w, h, scale) => `${name}-${w}x${h}${scale > 1 ? `-${scale}x` : ''}.png`

/** The renders a run makes: {shot, style, scale, w, h, rel} with rel the path under the output folder. */
function plan() {
	const jobs = []
	if (tileIds) {
		for (const id of tileIds) {
			const t = cfg.tiles.find((x) => x.id === id)
			for (const [kind, [w, h]] of Object.entries(t.sizes)) for (const scale of [1, 2]) {
				jobs.push({tile: t, kind, w, h, scale, rel: `${t.out}/promo-${kind}-${w}x${h}${scale > 1 ? '-2x' : ''}.png`})
			}
		}
		return jobs
	}
	for (const style of ring ? ['B'] : styles) {
		for (const shot of cfg.shots) {
			const named = only?.includes(shot.id)
			const wanted = ring ? shot.crop && (!only || named)
				: only ? named && (shot.styles.includes(style) || (shot.onRequest || []).includes(style)) : shot.styles.includes(style)
			if (!wanted) continue
			const s = merged(shot, style)
			for (const scale of ring ? [1] : scaleArg ? [scaleArg] : s.scales || [1]) {
				const [w, h] = s.size
				const rel = ring ? `B-ring${ring}/${sizeName(s.file, w, h, 1)}`
					: scaleArg ? `${style}-${w * scale}x${h * scale}/${sizeName(s.file, w * scale, h * scale, 1)}`
					: `${style}/${sizeName(s.file, w, h, scale)}`
				jobs.push({shot, style, scale, w: w * scale, h: h * scale, vw: w, vh: h, rel})
			}
		}
	}
	return jobs
}

const describe = (shot, style) => {
	const s = merged(shot, style)
	const bits = [s.frame]
	for (const k of ['layout', 'theme']) if (s[k]) bits.push(`${k} ${s[k]}`)
	if (s.query) bits.push(`search "${s.query}"`)
	if (s.recent) bits.push(`clock x${s.recent}`)
	if (s.duplicates) bits.push('duplicates')
	if (s.selections) bits.push(`${s.selections.length} tabs selected`)
	if (s.keys) bits.push(`${s.keys.length} key presses`)
	if (s.saved) bits.push('saved windows')
	if (s.grid) bits.push(`${s.grid.length} popups`)
	if (s.callouts) bits.push(`callouts: ${s.callouts.map((c) => `"${c.text}"`).join(', ')}`)
	if (s.script) bits.push('own script')
	if (s.title) bits.push(`"${s.title.replace(/[{}]/g, '').replace(/\n/g, ' / ')}"`)
	return bits.join(' | ')
}

function printPlan(jobs) {
	console.log(`${cfg.windows.length} fake windows, ${cfg.windows.reduce((n, w) => n + w.tabs.length, 0)} tabs, ${cfg.saved.length} saved windows (shots.json)`)
	console.log(`output: ${outRoot}\n`)
	for (const j of jobs) {
		if (j.tile) console.log(`tile ${j.tile.id.padEnd(8)} ${j.kind.padEnd(8)} ${`${j.w}x${j.h}`.padEnd(10)} x${j.scale}  ${j.rel}  (${j.tile.note})`)
		else console.log(`${j.shot.id.padEnd(8)} ${j.style} ${`${j.vw}x${j.vh}`.padEnd(10)} x${j.scale}  ${j.rel}  ${describe(j.shot, j.style)}`)
	}
	console.log(`\n${jobs.length} image(s)` + (flag('--no-sheets') || only || tileIds || ring ? '' : ` + contact sheet(s) ${styles.map((s) => `sheet-${s}.png`).join(', ')}`))
}

const jobs = plan()
if (flag('--list') || flag('--dry-run')) {
	printPlan(jobs)
	process.exit(0)
}
if (!jobs.length) throw new Error('nothing to render (see --list)')

// ------------------------------------------------------------------ Chrome and the server
async function launch() {
	const puppeteer = (await import('puppeteer-core')).default
	// a pinned build from `npx @puppeteer/browsers install chrome@<version>` wins over the system Chrome, which auto-updates
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
	if (!executablePath) throw new Error('no Chrome found; install Chrome or set CHROME_PATH')
	return puppeteer.launch({headless: true, executablePath, args: ['--hide-scrollbars', '--force-color-profile=srgb']})
}

const types = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml',
	'.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf'}
// /app/* is the popup bundle, /out/* the output folder (contact sheets), everything else is this folder
function serve() {
	const server = createServer(async (req, res) => {
		const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\\/]\.\.)+/, '')
		const file = path.startsWith('/app/') ? join(app, path.slice(4)) : path.startsWith('/out/') ? join(outRoot, path.slice(4)) : join(here, path)
		try {
			const body = await readFile(file)
			res.writeHead(200, {'content-type': types[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store'})
			res.end(body)
		} catch { res.writeHead(404); res.end() }
	})
	return new Promise((r) => server.listen(0, '127.0.0.1', () => r({server, origin: 'http://127.0.0.1:' + server.address().port})))
}

if (!flag('--no-build') || !existsSync(join(app, 'dist'))) {
	await buildApp()
	console.log('built the popup bundle in', app)
}
const {server, origin} = await serve()
const browser = await launch()
const page = await browser.newPage()
page.on('pageerror', (e) => console.log('pageerror:', e.message))
// the popup's theme defaults to "system": pin the system to light so shots do not follow this PC's dark mode
await page.emulateMediaFeatures([{name: 'prefers-color-scheme', value: 'light'}])

const outPath = (rel) => join(outRoot, rel)
const pngSize = (file) => { const b = readFileSync(file); return [b.readUInt32BE(16), b.readUInt32BE(20), b.length] }  // IHDR width / height

async function open(url, w, h, scale) {
	await page.setViewport({width: w, height: h, deviceScaleFactor: scale})
	await page.goto(origin + url, {waitUntil: 'load'})
	await page.waitForFunction(() => typeof window.ready === 'function', {timeout: 30000})
	await page.evaluate(() => window.ready())
	await page.evaluate(() => document.fonts.ready)
}

async function shoot(job) {
	const {shot, style, vw, vh, scale} = job
	await open(`/shot.html?shot=${shot.id}&style=${style}${ring ? '&ring=' + ring : ''}`, vw, vh, scale)
	const out = outPath(job.rel)
	mkdirSync(dirname(out), {recursive: true})
	await page.screenshot({path: out})
	const suffix = ring ? `-ring${ring}` : ''
	if (shot.hitsCrop) {
		// 1:1 crop of the matching rows (the ones with bold search hits)
		const r = await page.evaluate(() => {
			const f = document.getElementById('frame'), c = f.getBoundingClientRect(), s = c.width / f.offsetWidth
			const rows = [...f.contentDocument.querySelectorAll('b.search-hit')].map((b) => b.closest('.tabtitle').parentElement.getBoundingClientRect())
			const y0 = Math.min(...rows.map((r) => r.top)), y1 = Math.max(...rows.map((r) => r.bottom))
			return {x: c.left, y: c.top + s * y0 - 10, width: c.width, height: s * (y1 - y0) + 20}
		})
		await page.screenshot({path: outPath(`_hits-crop-${style}${suffix}.png`), clip: r})
	}
	if (shot.crop) {
		// ring + tag + 30 px around, at 1:1
		const r = await page.evaluate(() => {
			const [a, b] = ['.ring', '.tag'].map((s) => document.querySelector(s).getBoundingClientRect())
			const x = Math.min(a.x, b.x) - 30, y = Math.min(a.y, b.y) - 30
			return {x, y, width: Math.max(a.right, b.right) + 30 - x, height: Math.min(800, Math.max(a.bottom, b.bottom) + 30) - y}
		})
		await page.screenshot({path: outPath(`_${shot.crop}-crop-${style}${suffix}.png`), clip: r})
	}
	console.log('wrote', out)
}

async function shootTile(job) {
	await open(`/${job.tile.html}?tile=${job.kind}`, job.w / job.scale, job.h / job.scale, job.scale)
	const out = outPath(job.rel)
	mkdirSync(dirname(out), {recursive: true})
	await page.screenshot({path: out})
	console.log('wrote', out)
}

/** A plain page lays the images out in a grid at 640x400 with labels, screenshots it. */
async function sheet(style) {
	const imgs = cfg.shots.filter((s) => s.styles.includes(style) && s.frame !== 'tile').map((s) => `${style}/${sizeName(s.file, ...s.size, 1)}`)
	const cols = imgs.length > 6 && imgs.length !== 9 ? 4 : 3, rows = Math.ceil(imgs.length / cols)
	const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/app/font.css"><style>
		body{margin:0;padding:24px;background:${style === 'A' ? '#0a0c1a' : '#dddbe6'};font-family:interfont,sans-serif;color:${style === 'A' ? '#c9c3ec' : '#333'}}
		.g{display:grid;grid-template-columns:repeat(${cols},640px);gap:20px}.c img{width:640px;height:400px;display:block;border-radius:6px}
		.c div{font-size:15px;margin:6px 2px 0}</style></head><body><div class="g">
		${imgs.map((p) => `<div class="c"><img src="/out/${p}?${Date.now()}"><div>${p.split('/').pop()}</div></div>`).join('')}
		</div></body></html>`
	await writeFile(outPath(`_sheet-${style}.html`), html)
	await page.setViewport({width: 24 * 2 + 640 * cols + 20 * (cols - 1), height: 24 * 2 + rows * 426 + 20 * (rows - 1), deviceScaleFactor: 1})
	await page.goto(`${origin}/out/_sheet-${style}.html`, {waitUntil: 'networkidle0'})
	await page.screenshot({path: outPath(`sheet-${style}.png`)})
	console.log('wrote', outPath(`sheet-${style}.png`))
}

/** --ring N: the crops of the callout shots at the default 7 px padding next to N px. */
async function ringCompare() {
	const crops = cfg.shots.filter((s) => s.crop).map((s) => s.crop)
	const row = (suf, label) => `<div class="lab">${label}</div>` + crops.map((c) => `<img src="/out/_${c}-crop-B${suf}.png?${Date.now()}">`).join('')
	await writeFile(outPath('_ring-compare.html'), `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/app/font.css"><style>
		body{margin:0;padding:20px;background:#fff;font-family:interfont,sans-serif;color:#1b1d3a;display:inline-block}
		.g{display:grid;grid-template-columns:repeat(${crops.length + 1},auto);gap:16px 20px;align-items:center}.lab{font-size:18px;font-weight:700;white-space:nowrap}
		img{display:block;border:1px solid #ddd}</style></head><body><div class="g" id="g">
		${row('', '7 px (default)')}${row(`-ring${ring}`, `${ring} px`)}</div></body></html>`)
	await page.setViewport({width: 1600, height: 600, deviceScaleFactor: 1})
	await page.goto(`${origin}/out/_ring-compare.html`, {waitUntil: 'networkidle0'})
	const box = await page.evaluate(() => { const r = document.body.getBoundingClientRect(); return {x: 0, y: 0, width: Math.ceil(r.width), height: Math.ceil(r.height)} })
	await page.screenshot({path: outPath('_ring-compare.png'), clip: box})
}

try {
	for (const j of jobs) await (j.tile ? shootTile(j) : shoot(j))
	if (ring) {
		// the 7 px crops of an earlier run without --ring are the other row of the compare
		if (existsSync(outPath('_clock-crop-B.png'))) await ringCompare()
		else console.log('(no 7 px crops in the output folder yet; run a plain B render first for the compare row)')
	} else if (!only && !tileIds && !flag('--no-sheets')) for (const style of styles) await sheet(style)
} finally {
	await browser.close()
	server.close()
}

// verify sizes from the PNG header against the size in each file name (-2x: twice that)
const rows = []
const check = (dir) => {
	if (!existsSync(dir)) return
	for (const f of readdirSync(dir).filter((f) => f.endsWith('.png'))) {
		const [w, h, bytes] = pngSize(join(dir, f))
		const m = f.match(/(\d+)x(\d+)(-2x)?\.png$/), k = m && m[3] ? 2 : 1
		const ok = m ? (k * m[1] === w && k * m[2] === h ? 'ok' : 'WRONG SIZE') : ''
		rows.push(`${join(dir.slice(outRoot.length) || '.', f).padEnd(44)} ${String(w).padStart(5)}x${String(h).padEnd(5)} ${String(Math.round(bytes / 1024)).padStart(5)} KB  ${ok}`)
	}
}
const dirs = new Set(jobs.map((j) => dirname(outPath(j.rel))))
dirs.add(outRoot)
for (const d of dirs) check(d)
console.log(rows.join('\n'))
