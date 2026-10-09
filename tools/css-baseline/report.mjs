// report.mjs <beforeDir> <afterDir> <outDir>
//
// Before/after report for a visual change. For every PNG name present in both
// directories it writes <outDir>/strips/<name>.png, a horizontal
// `before | after | diff` strip (diff = changed pixels in magenta over a dimmed
// greyscale of `before`; images of different sizes are padded to the larger
// one), plus <outDir>/report.json and a static <outDir>/index.html that groups
// the pairs by state + scale, shows every changed pair as a strip and collapses
// the unchanged ones into a "0 px" list. Names found in only one directory are
// listed as added / removed. Always exits 0: it reports, it does not judge
// (compare.mjs is the pass/fail gate).
import {mkdirSync, readdirSync, rmSync, writeFileSync} from 'node:fs'
import {basename, join, resolve} from 'node:path'
import {PNG, blank, diffPngs, engine, padTo, readPng} from './pngdiff.mjs'

const argv = process.argv.slice(2)
if (argv.length < 3) {
	console.error('usage: node tools/css-baseline/report.mjs <beforeDir> <afterDir> <outDir>')
	process.exit(2)
}
const [BEFORE, AFTER, OUT] = argv.map((p) => resolve(p))

const GAP = 12
const BG = [128, 128, 128, 255]          // strip background / gap
const PAD = [255, 0, 255, 64]            // fill where one image is smaller than the other
const DIFF = {diffColor: [255, 0, 255], alpha: 0.35}

const pngs = (dir) => {
	try { return readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')).sort() } catch { return [] }
}
const before = pngs(BEFORE), after = pngs(AFTER)
if (!before.length && !after.length) { console.error('no PNGs in either directory'); process.exit(2) }
const afterSet = new Set(after), beforeSet = new Set(before)
const common = before.filter((f) => afterSet.has(f))
const removed = before.filter((f) => !afterSet.has(f))
const added = after.filter((f) => !beforeSet.has(f))

/**
 * Splits `<state>-<layout>-<theme>-<size>[@<scale>].png` into its axes.
 * Unknown shapes fall into group "other".
 */
const LAYOUTS = ['blocks-big', 'blocks', 'horizontal', 'vertical', 'na']
function parse(file) {
	const m = /^(.+)-(light|dark)-(\d+x\d+)(?:@([\w.]+))?\.png$/i.exec(file)
	if (!m) return {state: 'other', layout: '', theme: '', size: '', scale: '', group: 'other'}
	const [, prefix, theme, size, scale = ''] = m
	const layout = LAYOUTS.find((l) => prefix.endsWith('-' + l)) || ''
	const state = layout ? prefix.slice(0, -layout.length - 1) : prefix
	return {state, layout, theme, size, scale: scale || 'dpr1', group: state + ' @ ' + (scale || 'dpr1')}
}

rmSync(OUT, {recursive: true, force: true})
mkdirSync(join(OUT, 'strips'), {recursive: true})

const rows = []
for (const f of common) {
	const a0 = readPng(join(BEFORE, f)), b0 = readPng(join(AFTER, f))
	const w = Math.max(a0.width, b0.width), h = Math.max(a0.height, b0.height)
	const a = padTo(a0, w, h, PAD), b = padTo(b0, w, h, PAD)
	const {px, out} = diffPngs(a, b, DIFF)
	const strip = blank(w * 3 + GAP * 4, h + GAP * 2, BG)
	PNG.bitblt(a, strip, 0, 0, w, h, GAP, GAP)
	PNG.bitblt(b, strip, 0, 0, w, h, GAP * 2 + w, GAP)
	PNG.bitblt(out, strip, 0, 0, w, h, GAP * 3 + w * 2, GAP)
	writeFileSync(join(OUT, 'strips', f), PNG.sync.write(strip))
	rows.push({
		name: f, ...parse(f),
		changedPixels: px, percent: +((px / (w * h)) * 100).toFixed(4),
		width: w, height: h,
		beforeSize: a0.width + 'x' + a0.height, afterSize: b0.width + 'x' + b0.height,
		sizeChanged: a0.width !== b0.width || a0.height !== b0.height,
		strip: 'strips/' + f,
	})
}

const report = {
	before: BEFORE, after: AFTER, engine,
	compared: rows.length,
	changed: rows.filter((r) => r.changedPixels > 0).length,
	added: added.map((f) => ({name: f, ...parse(f)})),
	removed: removed.map((f) => ({name: f, ...parse(f)})),
	images: rows,
}
writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2))

// ---------------------------------------------------------------- index.html
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]))
const scaleOrder = (s) => (s === 'dpr1' ? '' : s)
const groups = new Map()
for (const r of rows) {
	if (!groups.has(r.group)) groups.set(r.group, [])
	groups.get(r.group).push(r)
}
const groupKeys = [...groups.keys()].sort((x, y) => {
	const [sx, cx] = x.split(' @ '), [sy, cy] = y.split(' @ ')
	return sx.localeCompare(sy) || scaleOrder(cx).localeCompare(scaleOrder(cy))
})

const section = (key) => {
	const list = groups.get(key)
	const changed = list.filter((r) => r.changedPixels > 0).sort((x, y) => y.changedPixels - x.changedPixels)
	const same = list.filter((r) => r.changedPixels === 0)
	return `<section>
<h2>${esc(key)} <small>${changed.length} changed / ${list.length}</small></h2>
${changed.map((r) => `<figure>
<figcaption><code>${esc(r.name)}</code> &middot; <b>${r.changedPixels.toLocaleString('en')} px</b> (${r.percent}%)${r.sizeChanged ? ` &middot; size ${r.beforeSize} &rarr; ${r.afterSize}` : ''}</figcaption>
<a href="${esc(r.strip)}"><img loading="lazy" src="${esc(r.strip)}" alt="before, after and diff of ${esc(r.name)}"></a>
</figure>`).join('\n')}
${same.length ? `<details><summary>${same.length} unchanged</summary><ul>${same.map((r) => `<li><a href="${esc(r.strip)}"><code>${esc(r.name)}</code></a> &middot; 0 px</li>`).join('')}</ul></details>` : ''}
</section>`
}
const nameList = (title, list) => list.length
	? `<section><h2>${title} <small>${list.length}</small></h2><ul>${list.map((f) => `<li><code>${esc(f)}</code></li>`).join('')}</ul></section>`
	: ''

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CSS Before/After</title>
<style>
:root{--bg:#fff;--fg:#1a1a1a;--muted:#666;--line:#ddd;--accent:#c0c}
@media (prefers-color-scheme:dark){:root{--bg:#161616;--fg:#eee;--muted:#999;--line:#333;--accent:#f6f}}
body{margin:0;padding:16px;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,sans-serif}
h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:24px 0 8px;border-bottom:1px solid var(--line);padding-bottom:4px}
small{color:var(--muted);font-weight:normal}
figure{margin:0 0 16px}figcaption{margin-bottom:4px}figcaption b{color:var(--accent)}
img{max-width:100%;height:auto;display:block;border:1px solid var(--line)}
ul{columns:2 320px;margin:4px 0;padding-left:20px}code{font-size:12px}
.legend{color:var(--muted)}
</style></head><body>
<h1>CSS before / after</h1>
<p class="legend">${report.changed} of ${report.compared} pairs changed &middot; ${added.length} added &middot; ${removed.length} removed &middot; each strip: <b>before | after | diff</b> (magenta = changed pixel) &middot; ${esc(engine)}<br>
before: <code>${esc(basename(BEFORE))}</code> &middot; after: <code>${esc(basename(AFTER))}</code></p>
${groupKeys.map(section).join('\n')}
${nameList('Added (only in after)', added)}
${nameList('Removed (only in before)', removed)}
</body></html>
`
writeFileSync(join(OUT, 'index.html'), html)

console.log(`compared ${rows.length}, changed ${report.changed}, added ${added.length}, removed ${removed.length} -> ${join(OUT, 'index.html')}`)
