// Checks a built site in headless Chrome for Testing (puppeteer-core, the build in
// ~/.cache/puppeteer; never a running browser). Run after tools/site/build.mjs:
//   node tools/site/check.mjs [siteDir] [shotDir]     defaults _site/ and plans/site-shots/
// Reports console errors and failed file loads per page, relative links that do not
// resolve to a file, and writes 1280x800 screenshots (light, plus dark for index).
import puppeteer from 'puppeteer-core'
import {readdirSync, readFileSync, existsSync, mkdirSync} from 'node:fs'
import {homedir} from 'node:os'
import {join, dirname, resolve} from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SITE = resolve(ROOT, process.argv[2] || '_site')
const SHOTS = resolve(ROOT, process.argv[3] || 'plans/site-shots')
mkdirSync(SHOTS, {recursive: true})

// relative links and sources of every html page must exist
const missing = []
for (const f of readdirSync(SITE).filter((f) => f.endsWith('.html') && f !== '404.html')) {
	const html = readFileSync(join(SITE, f), 'utf8')
	for (const [, url] of html.matchAll(/(?:href|src|poster)="([^"]+)"/g)) {
		if (/^(https?:|mailto:|#|data:)/.test(url) || url.includes("${")) continue // ${...}: roadmap client templates
		const path = decodeURIComponent(url.replace(/[?#].*$/, ''))
		if (!existsSync(join(SITE, path))) missing.push(`${f}: ${url}`)
	}
}

const pinned = join(homedir(), '.cache', 'puppeteer', 'chrome')
const exe = process.env.CHROME_PATH || join(pinned, readdirSync(pinned).sort().reverse()[0], 'chrome-win64', 'chrome.exe')
const browser = await puppeteer.launch({executablePath: exe, headless: true, args: ['--no-first-run', '--autoplay-policy=no-user-gesture-required']})
const result = {}
async function visit(file, scheme = 'light') {
	const page = await browser.newPage()
	const errors = []
	page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
	page.on('pageerror', (e) => errors.push(e.message))
	page.on('requestfailed', (r) => { if (!/net::ERR_ABORTED/.test(r.failure()?.errorText || '')) errors.push(`failed ${r.url()}`) })
	await page.setViewport({width: 1280, height: 800})
	await page.emulateMediaFeatures([{name: 'prefers-color-scheme', value: scheme}])
	await page.goto(pathToFileURL(join(SITE, file)).href, {waitUntil: 'load'})
	await new Promise((r) => setTimeout(r, 600))
	const info = await page.evaluate(() => ({
		theme: document.documentElement.dataset.theme || '',
		nav: !!document.querySelector('nav.site-nav'),
		bg: getComputedStyle(document.body).backgroundColor,
		hiddenClips: document.querySelectorAll('figure.clip[hidden]').length,
		clips: document.querySelectorAll('figure.clip').length,
		playing: [...document.querySelectorAll('figure.clip video')].filter((v) => !v.paused).length,
		height: document.documentElement.scrollHeight,
	}))
	const shot = join(SHOTS, `${file.replace('.html', '')}${scheme === 'dark' ? '-dark' : ''}.png`)
	await page.screenshot({path: shot})
	result[`${file} ${scheme}`] = {...info, errors}
	await page.close()
}
for (const f of ['index.html', 'help.html', 'changelog.html', 'stats.html', 'roadmap.html', 'privacy.html', 'license.html', '404.html']) await visit(f)
for (const f of ['index.html', 'changelog.html', 'help.html']) await visit(f, 'dark')
await browser.close()
console.log(JSON.stringify({missing, result}, null, 1))
