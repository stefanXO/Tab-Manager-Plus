// node tools/icons/sheet.mjs muted [out.png]   (npm run icons:sheet)
// A contact sheet of one family, for checking drawings by eye: every icon
// the family has at 16px in a toolbar-sized box and at 64px on a 16x16 grid,
// light and dark. The family is validated first: its errors are printed and
// the exit code is 1, so a drawer gets readable errors instead of a bad sheet.
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { launchChrome } from './chrome.mjs'
import { iconSvg } from '../../src/icons/svg.ts'
import { validateFamily } from '../../src/icons/validate.ts'
import { ICON_NAMES } from '../../src/icons/types.ts'

// without an output path the sheet goes to the temp folder
const [id, outArg] = process.argv.slice(2)
const out = outArg || join(tmpdir(), 'icons-sheet-' + id + '.png')
if (!id) {
	console.error('usage: node tools/icons/sheet.mjs <family> [out.png]')
	process.exit(1)
}
const { family } = await import(new URL(id + '.ts', new URL('../../src/icons/families/', import.meta.url)).href)
const errors = validateFamily(family)
if (errors.length) {
	console.error(id + ': ' + errors.length + ' error(s)')
	for (const e of errors) console.error('  ' + e)
	process.exit(1)
}
const names = ICON_NAMES.filter((n) => family.icons[n])

const GRID = 'background-image:linear-gradient(#8883 1px,transparent 1px),linear-gradient(90deg,#8883 1px,transparent 1px);background-size:4px 4px'
const cell = (name, theme) => {
	const def = family.icons[name]
	const bg = theme === 'dark' ? '#1e2227' : '#ffffff'
	const fg = theme === 'dark' ? '#e6e6e6' : '#1f2328'
	return `<div style="background:${bg};color:${fg};padding:6px;display:flex;gap:8px;align-items:center">
		<span style="width:22px;height:22px;display:grid;place-items:center;border:1px solid #8886;border-radius:3px">${iconSvg(def, 16)}</span>
		<span style="${GRID}">${iconSvg(def, 64)}</span>
		<span style="font:11px sans-serif;width:90px;overflow-wrap:anywhere">${name}</span></div>`
}
const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;font:11px sans-serif">
	<div style="display:grid;grid-template-columns:repeat(4,auto);gap:2px;background:#888">
	${names.map((n) => cell(n, 'light') + cell(n, 'dark')).join('')}</div>`
const file = join(mkdtempSync(join(tmpdir(), 'icon-sheet-')), 'sheet.html')
writeFileSync(file, html)
const browser = await launchChrome()
try {
	const page = await browser.newPage()
	await page.setViewport({ width: 760, height: 400 })
	await page.goto(pathToFileURL(file).href)
	await page.screenshot({ path: out, fullPage: true })
} finally {
	await browser.close()
}
console.log('sheet ->', out)
