// compare.mjs <baseline> <candidate> [--tolerance <pixels>]
//
// Pixel-compares every PNG the two directories have in common, writes a diff PNG
// for each mismatch into <candidate>/diff/, prints a table and exits 1 if any
// image differs by more than --tolerance pixels (default 0).
import {mkdirSync, readdirSync, rmSync, writeFileSync} from 'node:fs'
import {basename, join, resolve} from 'node:path'
import {PNG, diffPngs, engine, readPng} from './pngdiff.mjs'

const argv = process.argv.slice(2)
const positional = []
let tolerance = 0
for (let i = 0; i < argv.length; i++) {
	if (argv[i] === '--tolerance') tolerance = Number(argv[++i])
	else if (argv[i].startsWith('--tolerance=')) tolerance = Number(argv[i].split('=')[1])
	else positional.push(argv[i])
}
if (positional.length < 2 || !Number.isFinite(tolerance)) {
	console.error('usage: node tools/css-baseline/compare.mjs <baseline> <candidate> [--tolerance <pixels>]')
	process.exit(2)
}
const [BASE, CAND] = positional.map((p) => resolve(p))

const pngs = (dir) => {
	try { return readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')) } catch { return [] }
}
const baseFiles = pngs(BASE)
const candFiles = new Set(pngs(CAND))
if (!baseFiles.length) { console.error('no PNGs in baseline: ' + BASE); process.exit(2) }

const diffDir = join(CAND, 'diff')
rmSync(diffDir, {recursive: true, force: true})

const rows = []
const missing = []
const extra = [...candFiles].filter((f) => !baseFiles.includes(f))

for (const f of baseFiles) {
	if (!candFiles.has(f)) { missing.push(f); continue }
	const a = readPng(join(BASE, f))
	const b = readPng(join(CAND, f))
	if (a.width !== b.width || a.height !== b.height) {
		rows.push({name: f, px: Infinity, pct: 100, note: `size ${a.width}x${a.height} -> ${b.width}x${b.height}`})
		continue
	}
	const {px, out} = diffPngs(a, b)
	const pct = (px / (a.width * a.height)) * 100
	rows.push({name: f, px, pct, note: ''})
	if (px > tolerance) {
		mkdirSync(diffDir, {recursive: true})
		writeFileSync(join(diffDir, f), PNG.sync.write(out))
	}
}

const failing = rows.filter((r) => r.px > tolerance)

// ---- table ----
const w = Math.max(4, ...rows.map((r) => r.name.length))
const pad = (s, n) => String(s).padEnd(n)
const lpad = (s, n) => String(s).padStart(n)
console.log(pad('name', w) + '  ' + lpad('pixels', 9) + '  ' + lpad('%', 8) + '  note')
console.log('-'.repeat(w) + '  ' + '-'.repeat(9) + '  ' + '-'.repeat(8) + '  ----')
for (const r of (failing.length ? failing : rows).sort((x, y) => y.px - x.px)) {
	console.log(pad(r.name, w) + '  ' + lpad(r.px === Infinity ? 'n/a' : r.px, 9) + '  ' + lpad(r.pct.toFixed(4), 8) + '  ' + r.note)
}
if (!failing.length) console.log('(all identical)')

console.log('')
console.log('engine     : ' + engine)
console.log('compared   : ' + rows.length + ' images   tolerance: ' + tolerance + ' px')
console.log('differing  : ' + failing.length)
if (missing.length) console.log('missing in candidate (' + missing.length + '): ' + missing.slice(0, 10).join(', ') + (missing.length > 10 ? ' ...' : ''))
if (extra.length) console.log('only in candidate (' + extra.length + '): ' + extra.slice(0, 10).join(', ') + (extra.length > 10 ? ' ...' : ''))
if (failing.length) console.log('diffs      : ' + diffDir)

if (failing.length || missing.length) process.exit(1)
console.log('\nOK - ' + rows.length + ' images identical (' + basename(BASE) + ' vs ' + basename(CAND) + ')')
