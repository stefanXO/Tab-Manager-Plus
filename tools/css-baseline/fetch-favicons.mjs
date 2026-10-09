// Fills fav/ with the favicons the fake tabs in fake-browser.js point at.
//
// The icons are third-party brand logos, so they are never committed (fav/ is
// gitignored): they are downloaded on first use and cached. A domain whose
// download fails (offline, blocked) gets a plain colored square for that run
// instead, so a shoot never breaks. Placeholder runs differ from runs with real
// icons, so take a baseline and its compare under the same conditions.
import {cpSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dir = join(here, 'fav')

// read from fake-browser.js so the list can't drift from the tabs
function domains() {
	const src = readFileSync(join(here, 'fake-browser.js'), 'utf8')
	return [...new Set([...src.matchAll(/\bF\("([^"]+)"\)/g)].map((m) => m[1]))]
}

async function download(domain) {
	const res = await fetch('https://www.google.com/s2/favicons?sz=32&domain=' + encodeURIComponent(domain),
		{signal: AbortSignal.timeout(10000)})
	if (!res.ok) throw new Error('HTTP ' + res.status)
	const buf = Buffer.from(await res.arrayBuffer())
	if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG')
	return buf
}

// 32x32 square in a color hashed from the domain
async function placeholder(domain) {
	const {PNG} = (await import('pngjs')).default
	let h = 0
	for (const c of domain) h = (h * 31 + c.charCodeAt(0)) >>> 0
	const [r, g, b] = [h & 0xff, (h >> 8) & 0xff, (h >> 16) & 0xff].map((v) => 64 + (v % 160))
	const png = new PNG({width: 32, height: 32})
	for (let i = 0; i < png.data.length; i += 4) png.data.set([r, g, b, 255], i)
	return PNG.sync.write(png)
}

/**
 * Downloads every missing favicon into fav/ (existing files are kept), then
 * copies fav/ to `out`. Placeholders go only to `out`, never into the cache,
 * so the next online run retries the download.
 */
export async function fetchFavicons(out) {
	mkdirSync(dir, {recursive: true})
	const missing = domains().filter((d) => !existsSync(join(dir, d + '.png')))
	const failed = []
	await Promise.all(missing.map(async (d) => {
		try {
			writeFileSync(join(dir, d + '.png'), await download(d))
		} catch (e) {
			console.warn(`favicon ${d}: ${e.message}, using placeholder`)
			failed.push(d)
		}
	}))
	if (missing.length > failed.length) console.log(`fetched ${missing.length - failed.length} favicon(s) into fav/`)
	if (!out) return
	cpSync(dir, out, {recursive: true})
	for (const d of failed) writeFileSync(join(out, d + '.png'), await placeholder(d))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await fetchFavicons()
