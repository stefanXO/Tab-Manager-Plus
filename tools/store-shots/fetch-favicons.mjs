// Fills a fav/ folder with the favicons the fake tabs point at (shots.json `favicon` names; tools/clips uses it too).
//
// The icons are third-party brand logos, so they are never committed (fav/ is gitignored): they come from a cache in
// tools/store-shots/fav/, which is filled from tools/css-baseline/fav/ when that exists and else downloaded from Google's
// favicon service. A name whose download fails (offline, blocked) gets a plain colored square for that run instead,
// so a render never breaks (the placeholder goes only to the output folder, never into the cache).
import {cpSync, existsSync, mkdirSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
export const favCache = join(here, 'fav')
const baselineCache = join(here, '..', 'css-baseline', 'fav')

async function download(file) {
	const domain = file.replace(/\.png$/, '')
	const res = await fetch('https://www.google.com/s2/favicons?sz=32&domain=' + encodeURIComponent(domain), {signal: AbortSignal.timeout(10000)})
	if (!res.ok) throw new Error('HTTP ' + res.status)
	const buf = Buffer.from(await res.arrayBuffer())
	if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG')
	return buf
}

// 32x32 square in a color hashed from the name
async function placeholder(file) {
	const {PNG} = (await import('pngjs')).default
	let h = 0
	for (const c of file) h = (h * 31 + c.charCodeAt(0)) >>> 0
	const [r, g, b] = [h & 0xff, (h >> 8) & 0xff, (h >> 16) & 0xff].map((v) => 64 + (v % 160))
	const png = new PNG({width: 32, height: 32})
	for (let i = 0; i < png.data.length; i += 4) png.data.set([r, g, b, 255], i)
	return PNG.sync.write(png)
}

/** Makes sure every file name in `files` ("github.com.png") is in the cache, then copies the cache to `out`. */
export async function fetchFavicons(out, files) {
	mkdirSync(favCache, {recursive: true})
	const failed = []
	let fetched = 0
	await Promise.all(files.filter((f) => !existsSync(join(favCache, f))).map(async (f) => {
		try {
			if (existsSync(join(baselineCache, f))) cpSync(join(baselineCache, f), join(favCache, f))
			else writeFileSync(join(favCache, f), await download(f))
			fetched++
		} catch (e) {
			console.warn(`favicon ${f}: ${e.message}, using placeholder`)
			failed.push(f)
		}
	}))
	if (fetched) console.log(`filled ${fetched} favicon(s) into tools/store-shots/fav/`)
	if (!out) return
	mkdirSync(out, {recursive: true})
	for (const f of files) if (!failed.includes(f)) cpSync(join(favCache, f), join(out, f))
	for (const f of failed) writeFileSync(join(out, f), await placeholder(f))
}
