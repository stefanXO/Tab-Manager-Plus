// Build the roadmap page from IMPROVEMENTS.md (moved from plans/roadmap/build.mjs).
// Library: buildRoadmap(mdText, {sha, date, source, log}) -> html (single file, data inlined).
// CLI, from the repo root:  node tools/site/roadmap.mjs [out.html] [--master]
//   reads the IMPROVEMENTS.md working copy (or master with --master), writes out.html (default _site/roadmap.html).
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {execSync} from 'node:child_process'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const GH = 'https://github.com/stefanXO/Tab-Manager-Plus/blob/master/IMPROVEMENTS.md#'

export function buildRoadmap(mdText, {sha = 'local', date = new Date().toISOString().slice(0, 10), source: srcLabel = 'master', log = () => {}} = {}) {
const md = mdText.replace(/\r\n/g, '\n')
const today = date

// ---------------------------------------------------------------- helpers
const DOTS = {'🔴': 'high', '🟠': 'medium', '🟡': 'low', '🔵': 'idea', '🟢': 'done', '⚪': 'asis'}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const slug = (h) => h.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-')

// minimal inline markdown -> html (code, bold, links). Internal #links point at GitHub.
function inline(s) {
	s = s.replace(/<a id="[^"]*"><\/a>/g, '')
	const codes = []
	s = s.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`)
	s = esc(s)
	s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
		const href = u.startsWith('#') ? GH + u.slice(1) : u
		return `<a href="${href}" target="_blank" rel="noopener">${t}</a>`
	})
	s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
	s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[+i])}</code>`)
	return s
}
const plain = (s) => s.replace(/<a id="[^"]*"><\/a>/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '').replace(/`/g, '').trim()
function cells(line) {
	const t = line.trim().replace(/^\|/, '').replace(/\|$/, '')
	// split on pipes that are not inside backticks
	const out = []; let cur = '', inCode = false
	for (const ch of t) {
		if (ch === '`') inCode = !inCode
		if (ch === '|' && !inCode) { out.push(cur.trim()); cur = '' } else cur += ch
	}
	out.push(cur.trim())
	return out
}
function issuesOf(s) {
	const out = []
	for (const m of s.matchAll(/\[#(\d+)\]\((https:\/\/github\.com\/[^)]+\/issues\/\d+)\)/g)) out.push({n: +m[1], url: m[2]})
	return out
}

// ---------------------------------------------------------------- parse
const lines = md.split('\n')
const items = []
const failed = []
const overview = {}
const p0 = []
let section = null, sectionTitle = '', sectionAnchor = '', group = 'open'
let detail = null, inOrig = false, detailDepth = 0
const details = {} // num -> {where, fix, orig}

for (let i = 0; i < lines.length; i++) {
	const line = lines[i]
	let m
	if ((m = line.match(/^## (.+)$/))) {
		const h = m[1]
		sectionTitle = h
		sectionAnchor = slug(h)
		const k = h.match(/^(P\d+b?)\b/)
		section = k ? k[1] : (h.startsWith('7.0.0') ? 'R700' : h)
		group = 'open'
		detail = null; inOrig = false
		continue
	}
	if ((m = line.match(/^### (.+)$/))) {
		const h = m[1].toLowerCase()
		group = h.startsWith('do next') ? 'next' : h.startsWith('done') ? 'done' : 'open'
		continue
	}
	// P1b uses bold lines and a fold instead of ### groups
	if (/^\*\*Open, planned/.test(line)) { group = 'open'; continue }
	if (/^\*\*Left as they are/.test(line)) { group = 'asis'; continue }
	if (section === 'P1b' && /^<details><summary>\d+ fixed/.test(line)) { group = 'done'; continue }

	// overview table (before the first ## section)
	if (!section) {
		if ((m = line.match(/^\| \*\*(\d+)\*\* fixed \| \*\*(\d+)\*\* open \| \*\*(\d+)\*\* up next/))) overview.headline = {fixed: +m[1], open: +m[2], next: +m[3]}
	}
	if (!section && line.startsWith('|')) {
		const c = cells(line)
		if (c.length >= 6 && /\[P\d/.test(c[1])) {
			const mm = c[1].match(/\[(P\d+b?) ([^\]]+)\]\(#([^)]+)\)/)
			if (mm) overview[mm[1]] = {name: mm[2], anchor: mm[3], done: parseInt(c[2]) || 0, open: parseInt(c[3]) || 0, changed: c[4], items: parseInt(c[5]) || 0}
		}
		if (c.length >= 6 && /\*\*Total\*\*/.test(c[1])) overview.total = {done: parseInt(c[2].replace(/\*/g, '')), open: parseInt(c[3].replace(/\*/g, '')), items: parseInt(c[5].replace(/\*/g, ''))}
		if (c.length >= 6 && /7\.0\.0 release/.test(c[1])) overview.R700 = {done: parseInt(c[2].replace(/\*/g, ''))}
		continue
	}
	if (!section) {
		continue
	}

	// P0 shortlist
	if (section === 'P0' && (m = line.match(/^(\d+)\. (.+)$/))) {
		const links = [...m[2].matchAll(/\]\(#([^)]+)\)/g)].map((x) => x[1])
		p0.push({rank: +m[1], anchor: links[links.length - 1] || null, text: m[2]})
		continue
	}

	// detail blocks: "#### 1.6 · title"
	if ((m = line.match(/^#### (\S+) · (.+)$/))) {
		detail = details[m[1]] = {where: '', fix: '', orig: []}
		inOrig = false
		continue
	}
	if (detail) {
		if (/^<details><summary>Original finding/.test(line)) { inOrig = true; continue }
		if (line.trim() === '</details>') { if (inOrig) inOrig = false; else detail = null; continue }
		if (inOrig) { if (line.trim()) detail.orig.push(line); continue }
		if ((m = line.match(/^- \*\*Where:\*\* (.+)$/))) { detail.where = m[1]; continue }
		if ((m = line.match(/^- \*\*Fix:\*\* (.+)$/))) { detail.fix = m[1]; continue }
		continue
	}
	if (/^<details><summary>/.test(line) || line.trim() === '</details>') continue

	// table rows
	if (line.startsWith('|')) {
		const c = cells(line)
		if (/^:?-+:?$/.test(c[0]) || /^:?-+:?$/.test(c[1] || '')) continue
		if (!c[0] && /^(Item|Finding|Meaning)$/.test(c[1])) continue
		const urg = DOTS[c[0]]
		const a = (c[1] || '').match(/<a id="([^"]+)"><\/a>\*\*([^*]+)\*\*\s*(.*)$/)
		if (!urg || !a) {
			failed.push({section, line: i + 1, text: line})
			items.push({key: `raw-${i}`, raw: true, section, group, urg: urg || 'low', num: '?', anchor: sectionAnchor, title: inline(line), titleText: plain(line), what: '', where: '', fix: '', orig: '', issues: []})
			continue
		}
		const [, anchor, num, rest] = a
		const issues = issuesOf(rest)
		let titleSrc = rest.replace(/\s*\(\[#\d+\]\([^)]+\)\)/g, '').trim()
		let it = {key: anchor, section, group, urg, num, anchor, issues, raw: false}
		if (c.length >= 5) {
			it.title = inline(titleSrc); it.titleText = plain(titleSrc)
			it.what = inline(c[2]); it.where = inline(c[3]); it.fix = inline(c[4])
		} else {
			// P1b: "**#2** high | text"
			it.num = num
			it.severity = titleSrc
			const text = c[2] || ''
			const first = plain(text).split(/(?<=\.)\s|;\s|\s\(/)[0].replace(/\.$/, '')
			const short = first.length > 110 ? first.slice(0, 107).replace(/\s\S*$/, '') + '…' : first
			it.title = esc(short.charAt(0).toUpperCase() + short.slice(1)); it.titleText = short
			it.what = inline(text); it.where = ''; it.fix = ''
		}
		items.push(it)
		continue
	}

	// done lines
	if (group === 'done' && line.startsWith('- ')) {
		let mm
		if ((mm = line.match(/^- <a id="([^"]+)"><\/a>🟢 \*\*([^*]+)\*\* (.+)$/))) {
			const [, anchor, num, rest] = mm
			const dot = rest.indexOf('. ')
			const t = dot > 0 ? rest.slice(0, dot) : rest
			items.push({key: anchor, section, group: 'done', urg: 'done', num, anchor, issues: [], raw: false, title: inline(t), titleText: plain(t), what: inline(rest), where: '', fix: '', orig: ''})
		} else if (section === 'P1b' && (mm = line.match(/^- #(\d+) (.+)$/))) {
			const reverted = /regression/.test(mm[2])
			items.push({key: `r-done-${mm[1]}`, section, group: reverted ? 'reverted' : 'done', urg: 'done', num: '#' + mm[1], anchor: sectionAnchor, issues: [], raw: false, title: inline(mm[2]), titleText: plain(mm[2]), what: reverted ? inline('Found during the review and reverted before the merge: ' + mm[2]) : '', where: '', fix: '', orig: ''})
		} else {
			failed.push({section, line: i + 1, text: line})
			items.push({key: `raw-${i}`, raw: true, section, group: 'done', urg: 'done', num: '?', anchor: sectionAnchor, title: inline(line.slice(2)), titleText: plain(line.slice(2)), what: '', where: '', fix: '', orig: '', issues: []})
		}
	}
}

// merge detail folds (full Where/Fix + original finding)
for (const it of items) {
	const d = details[it.num]
	if (!d) continue
	if (d.where) it.where = inline(d.where)
	if (d.fix) it.fix = inline(d.fix)
	if (d.orig.length) it.orig = d.orig.map((l) => '<li>' + inline(l.replace(/^- /, '')) + '</li>').join('')
	it.hasDetail = true
}
for (const it of items) if (!it.orig) it.orig = ''

// P0 rank + lanes
const byAnchor = new Map(items.map((it) => [it.anchor, it]))
const p0missing = []
for (const p of p0) {
	const it = p.anchor && byAnchor.get(p.anchor)
	if (it) { it.p0 = p.rank; it.p0text = inline(p.text.replace(/\s*\[\*\*[^\]]+\*\*\]\([^)]+\)\s*$/, '')) } else p0missing.push(p)
}
for (const it of items) {
	it.lane = it.group === 'done' || it.group === 'reverted' ? 'shipped'
		: it.group === 'asis' ? 'asis'
		: it.p0 ? 'next'
		: it.section === 'P7' ? 'milestone'
		: it.urg === 'idea' ? 'ideas'
		: 'later'
	it.link = GH + it.anchor
	it.status = it.group === 'reverted' ? 'reverted' : it.group === 'done' ? 'done' : it.group === 'asis' ? 'asis' : 'open'
}
// "1 to redo" in P5: the overview counts 5.4 ("needs testing") as changed, not open
const redo = items.find((it) => it.section === 'P5' && it.status === 'open' && /needs testing/.test(it.titleText))
if (redo) redo.redo = true

// ---------------------------------------------------------------- report
const SECTIONS = ['P1', 'P1b', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']
const count = (f) => items.filter(f).length
const report = []
report.push(`IMPROVEMENTS.md (${srcLabel} ${sha}): ${lines.length} lines, ${items.length} cards`)
report.push('section  next open done asis  | overview done/open')
for (const s of SECTIONS) {
	const g = (gr) => count((it) => it.section === s && it.group === gr)
	const o = overview[s] || {}
	const redoN = count((it) => it.section === s && it.redo)
	const open = g('next') + g('open') - redoN
	const done = g('done')
	const flag = (o.done ?? 0) === done && (o.open ?? 0) === open ? 'ok' : 'DIFF'
	report.push(`${s.padEnd(6)} ${String(g('next')).padStart(5)} ${String(g('open')).padStart(4)} ${String(done).padStart(4)} ${String(g('asis')).padStart(4)}  | ${o.done ?? '-'}/${o.open ?? '-'} ${flag}${redoN ? ` (+${redoN} to redo)` : ''}${g('reverted') ? ` (+${g('reverted')} reverted)` : ''}`)
}
const tDone = count((it) => it.status === 'done')
const tOpen = count((it) => it.status === 'open')
const tRedo = count((it) => it.redo)
report.push(`total done ${tDone} (overview ${overview.total?.done}), open ${tOpen} incl. ${tRedo} to redo -> ${tOpen - tRedo} (overview ${overview.total?.open}), left as is ${count((it) => it.status === 'asis')}, reverted ${count((it) => it.status === 'reverted')}`)
report.push(`P0 shortlist ${p0.length} (headline ${overview.headline?.next ?? '?'}), unresolved links ${p0missing.length}`)
report.push(`lanes: ` + ['shipped', 'next', 'milestone', 'later', 'ideas', 'asis'].map((l) => `${l} ${count((it) => it.lane === l)}`).join(', '))
report.push(`rows kept as raw text: ${failed.length}` + failed.map((f) => `\n  ${f.section} line ${f.line}: ${f.text.slice(0, 100)}`).join(''))
log(report.join('\n'))

const sectionMeta = SECTIONS.map((s) => ({id: s, name: overview[s]?.name || s, anchor: overview[s]?.anchor || '', done: overview[s]?.done ?? 0, open: overview[s]?.open ?? 0, changed: overview[s]?.changed || ''}))
const data = {
	built: today, sha, source: srcLabel, shipped: '2026-10-09',
	headline: {fixed: tDone, open: tOpen - tRedo, next: p0.length, milestone: count((it) => it.section === 'P7' && it.status === 'open')},
	overview: overview.total || null,
	sections: sectionMeta, items, report,
}

// ---------------------------------------------------------------- page
const CSS = `
:root{color-scheme:light;
 --page:#f9f9f7;--surface:#fcfcfb;--raised:#ffffff;--ink:#0b0b0b;--ink2:#52514e;--muted:#6b6a65;
 --grid:#e1e0d9;--base:#c3c2b7;--ring:rgba(11,11,11,.10);--accent:#2a78d6;--focus:#2a78d6;
 --u-high:#d03b3b;--u-medium:#ec835a;--u-low:#fab219;--u-idea:#2a78d6;--u-done:#0ca30c;--u-asis:#898781;--u-reverted:#898781;
 --bar-done:#0ca30c;--bar-open:#2a78d6;--chip-on:#e9f1fc;--code:#f0efec}
@media (prefers-color-scheme:dark){:root:where(:not([data-theme="light"])){color-scheme:dark;
 --page:#0d0d0d;--surface:#1a1a19;--raised:#21211f;--ink:#ffffff;--ink2:#c3c2b7;--muted:#a3a29b;
 --grid:#2c2c2a;--base:#383835;--ring:rgba(255,255,255,.10);--accent:#3987e5;--focus:#6da7ec;
 --u-idea:#3987e5;--bar-open:#3987e5;--chip-on:#1c2b40;--code:#2c2c2a}}
:root[data-theme="dark"]{color-scheme:dark;
 --page:#0d0d0d;--surface:#1a1a19;--raised:#21211f;--ink:#ffffff;--ink2:#c3c2b7;--muted:#a3a29b;
 --grid:#2c2c2a;--base:#383835;--ring:rgba(255,255,255,.10);--accent:#3987e5;--focus:#6da7ec;
 --u-idea:#3987e5;--bar-open:#3987e5;--chip-on:#1c2b40;--code:#2c2c2a}
*{box-sizing:border-box}
body{margin:0;background:var(--page);color:var(--ink);font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:var(--accent)}
code{font:12px/1.4 ui-monospace,"Cascadia Mono",Consolas,monospace;background:var(--code);padding:0 3px;border-radius:3px;overflow-wrap:anywhere}
:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
header{padding:24px 28px 8px;max-width:1600px;margin:0 auto}
h1{font-size:24px;margin:0 0 4px;font-weight:650}
.sub{color:var(--ink2);margin:0 0 16px}
.top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
.theme{border:1px solid var(--ring);background:var(--surface);color:var(--ink);border-radius:8px;padding:6px 10px;font:inherit;cursor:pointer}
.tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 16px}
.tile{background:var(--surface);border:1px solid var(--ring);border-radius:10px;padding:12px 16px}
.tile .label{color:var(--ink2);font-size:13px}
.tile .value{font-size:32px;font-weight:600;line-height:1.2}
.tile .note{color:var(--muted);font-size:12px}
.filters{position:sticky;top:0;z-index:5;background:var(--page);border-bottom:1px solid var(--grid);padding:10px 28px}
.frow{max-width:1600px;margin:0 auto;display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}
.fgroup{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.fgroup>span{color:var(--ink2);font-size:12px;margin-right:2px}
input[type=search]{font:inherit;color:var(--ink);background:var(--surface);border:1px solid var(--base);border-radius:8px;padding:6px 10px;width:240px}
.chip{font:inherit;font-size:12px;color:var(--ink);background:var(--surface);border:1px solid var(--base);border-radius:999px;padding:3px 10px;cursor:pointer;display:inline-flex;gap:6px;align-items:center}
.chip[aria-pressed=true]{background:var(--chip-on);border-color:var(--accent);font-weight:600}
.chip .sw{width:8px;height:8px;border-radius:50%;display:inline-block}
.views{display:inline-flex;border:1px solid var(--base);border-radius:8px;overflow:hidden}
.views button{font:inherit;font-size:13px;border:0;background:var(--surface);color:var(--ink);padding:5px 12px;cursor:pointer}
.views button[aria-pressed=true]{background:var(--accent);color:#fff}
.count{color:var(--ink2);font-size:13px;margin-left:auto}
main{padding:16px 28px 40px;max-width:1600px;margin:0 auto}
.lanes{display:grid;grid-template-columns:minmax(200px,.8fr) repeat(3,minmax(240px,1fr)) minmax(200px,.75fr);gap:12px;align-items:start}
.lane{background:var(--surface);border:1px solid var(--ring);border-radius:12px;padding:10px;min-width:0}
.lane h2{font-size:14px;margin:2px 4px 2px;font-weight:650;display:flex;justify-content:space-between;gap:8px}
.lane h2 .n{color:var(--ink2);font-weight:500}
.lane .lsub{color:var(--muted);font-size:12px;margin:0 4px 8px}
.stack{display:flex;flex-direction:column;gap:8px}
.card{background:var(--raised);border:1px solid var(--ring);border-left:4px solid var(--u);border-radius:8px}
.card>button{all:unset;box-sizing:border-box;display:block;width:100%;padding:8px 10px;cursor:pointer;border-radius:6px}
.card>button:focus-visible{outline:2px solid var(--focus);outline-offset:1px}
.meta{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;font-size:12px;color:var(--ink2)}
.meta .id{font-weight:650;color:var(--ink)}
.meta .tag{border:1px solid var(--base);border-radius:4px;padding:0 5px}
.meta .rank{background:var(--accent);color:#fff;border-radius:4px;padding:0 5px;font-weight:600}
.urgw{display:inline-flex;gap:4px;align-items:center}
.urgw::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--u)}
.title{display:block;margin-top:3px;font-weight:550}
.issues{display:flex;gap:6px;flex-wrap:wrap;padding:0 10px 8px;font-size:12px}
.body{padding:0 12px 10px;border-top:1px solid var(--grid);font-size:13px}
.body h3{font-size:12px;color:var(--ink2);margin:10px 0 2px;font-weight:600;text-transform:none}
.body .where{font-family:ui-monospace,"Cascadia Mono",Consolas,monospace;font-size:12px;overflow-wrap:anywhere}
.body details{margin-top:8px}
.body summary{cursor:pointer;color:var(--ink2)}
.body ul{padding-left:18px;margin:6px 0}
.body .gh{display:inline-block;margin-top:8px;font-size:12px}
.card[hidden],.lane[hidden],.area[hidden]{display:none}
.shipbtn{font:inherit;width:100%;text-align:left;background:var(--raised);color:var(--ink);border:1px dashed var(--base);border-radius:8px;padding:10px;cursor:pointer}
.shipbtn strong{font-size:22px;display:block}
.asis{margin-top:16px;background:var(--surface);border:1px solid var(--ring);border-radius:12px;padding:10px}
.asis h2{font-size:14px;margin:2px 4px 8px}
.asis .stack{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
.areas{display:flex;flex-direction:column;gap:16px}
.area{background:var(--surface);border:1px solid var(--ring);border-radius:12px;padding:12px}
.area h2{font-size:16px;margin:0 0 6px}
.tally{display:flex;gap:2px;height:8px;margin:4px 0 4px;max-width:520px}
.tally i{display:block;height:100%}
.tally i:first-child{border-radius:4px 0 0 4px}.tally i:last-child{border-radius:0 4px 4px 0}.tally i:only-child{border-radius:4px}
.tlabel{font-size:12px;color:var(--ink2);margin-bottom:10px}
.tlabel .k{display:inline-flex;align-items:center;gap:4px;margin-right:12px}
.tlabel .k::before{content:"";width:10px;height:8px;border-radius:2px;background:var(--c)}
.agrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px;align-items:start}
.empty{color:var(--muted);font-size:12px;padding:4px}
.legend{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:var(--ink2);margin:0 0 4px}
.legend span{display:inline-flex;gap:5px;align-items:center}
.legend span::before{content:"";width:10px;height:10px;border-radius:2px;background:var(--u)}
footer{color:var(--muted);font-size:12px;max-width:1600px;margin:0 auto;padding:0 28px 30px}
@media (max-width:1100px){.lanes{grid-template-columns:1fr 1fr}.tiles{grid-template-columns:repeat(2,1fr)}}
@media (forced-colors:active){.card{border-left-width:6px}}
@media print{
 .filters,.theme,.shipbtn,.views{display:none!important}
 body{background:#fff;color:#000}
 .lanes{display:block}.lane{break-inside:auto;margin-bottom:12px}
 .card{break-inside:avoid}.card .body{display:block!important}
 .card[data-lane=shipped]{display:block!important}
 header,main{max-width:none}
}
`

function client() {
	const D = JSON.parse(document.getElementById('data').textContent)
	const URG = {high: 'High', medium: 'Medium', low: 'Low', idea: 'Idea or larger effort', done: 'Done', asis: 'Left as is', reverted: 'Reverted'}
	const URG_CHIPS = ['high', 'medium', 'low', 'idea', 'done', 'asis']
	const LANES = [
		{id: 'shipped', name: 'Shipped · 7.0.0', sub: 'Fixed in the 7.0.0 release.'},
		{id: 'next', name: 'Next · 7.0.1', sub: 'The shortlist, in the order to do it.'},
		{id: 'milestone', name: 'Milestone · 7.1.0', sub: 'Issues on the 7.1.0 milestone and release-day notes.'},
		{id: 'later', name: 'Later · open', sub: 'Bugs and cleanups with no release yet.'},
		{id: 'ideas', name: 'Ideas / larger efforts', sub: 'New features and big changes.'},
	]
	const $ = (s, el = document) => el.querySelector(s)
	const h = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (html) e.innerHTML = html; return e }
	const state = {view: 'lanes', q: '', u: new Set(), s: new Set(), hd: false, ship: false}

	// ---- state <-> hash
	function readHash() {
		const p = new URLSearchParams(location.hash.slice(1))
		state.view = p.get('view') === 'area' ? 'area' : 'lanes'
		state.q = p.get('q') || ''
		state.u = new Set((p.get('u') || '').split(',').filter((x) => URG[x]))
		state.s = new Set((p.get('s') || '').split(',').filter((x) => D.sections.some((s) => s.id === x)))
		state.hd = p.get('hd') === '1'
		state.ship = p.get('ship') === '1'
	}
	function writeHash() {
		const p = new URLSearchParams()
		if (state.view !== 'lanes') p.set('view', state.view)
		if (state.q) p.set('q', state.q)
		if (state.u.size) p.set('u', [...state.u].join(','))
		if (state.s.size) p.set('s', [...state.s].join(','))
		if (state.hd) p.set('hd', '1')
		if (state.ship) p.set('ship', '1')
		const s = p.toString()
		history.replaceState(null, '', s ? '#' + s : location.pathname + location.search)
	}

	// ---- header
	$('#sub').textContent = `7.0.0 shipped ${D.shipped} · built from IMPROVEMENTS.md at ${D.source} ${D.sha} on ${D.built}`
	const tiles = [
		['Fixed in 7.0.0', D.headline.fixed, 'roadmap items and review findings'],
		['Open', D.headline.open, 'bugs, ideas and cleanups left'],
		['Up next (7.0.1)', D.headline.next, 'the shortlist for the next fix release'],
		['7.1.0 milestone', D.headline.milestone, 'planned for the next feature release'],
	]
	$('#tiles').innerHTML = tiles.map(([l, v, n]) => `<div class="tile"><div class="label">${l}</div><div class="value">${v}</div><div class="note">${n}</div></div>`).join('')

	// ---- filters
	const uWrap = $('#f-urg')
	for (const u of URG_CHIPS) {
		const b = h('button', {class: 'chip', type: 'button', 'data-u': u, 'aria-pressed': 'false', style: `--u:var(--u-${u})`}, `<span class="sw" style="background:var(--u-${u})"></span>${URG[u]}`)
		b.onclick = () => { state.u.has(u) ? state.u.delete(u) : state.u.add(u); update() }
		uWrap.append(b)
	}
	const sWrap = $('#f-sec')
	for (const s of D.sections) {
		const b = h('button', {class: 'chip', type: 'button', 'data-s': s.id, 'aria-pressed': 'false', title: s.name}, s.id)
		b.onclick = () => { state.s.has(s.id) ? state.s.delete(s.id) : state.s.add(s.id); update() }
		sWrap.append(b)
	}
	$('#q').oninput = (e) => { state.q = e.target.value; update() }
	$('#hd').onchange = (e) => { state.hd = e.target.checked; update() }
	for (const b of document.querySelectorAll('.views button')) b.onclick = () => { state.view = b.dataset.view; update() }
	$('#clear').onclick = () => { state.q = ''; state.u.clear(); state.s.clear(); state.hd = false; update() }

	// ---- theme toggle: system -> light -> dark
	const THEMES = ['system', 'light', 'dark']
	let theme = localStorage.getItem('rm-theme') || 'system'
	function applyTheme() {
		if (theme === 'system') document.documentElement.removeAttribute('data-theme')
		else document.documentElement.setAttribute('data-theme', theme)
		$('#theme').textContent = 'Theme: ' + theme[0].toUpperCase() + theme.slice(1)
	}
	$('#theme').onclick = () => { theme = THEMES[(THEMES.indexOf(theme) + 1) % 3]; try { localStorage.setItem('rm-theme', theme) } catch {} applyTheme() }
	applyTheme()

	// ---- cards
	const secName = Object.fromEntries(D.sections.map((s) => [s.id, s.name]))
	function card(it, where) {
		const u = it.status === 'reverted' ? 'reverted' : it.urg
		const c = h('article', {class: 'card', 'data-key': it.key, 'data-lane': where, style: `--u:var(--u-${u})`})
		const bodyId = 'b-' + where + '-' + it.key
		const label = it.section === 'P1b' ? `P1b ${it.num}` : it.num
		const btn = h('button', {type: 'button', 'aria-expanded': 'false', 'aria-controls': bodyId})
		btn.innerHTML = `<span class="meta">${it.p0 && where === 'next' ? `<span class="rank" title="Shortlist position">#${it.p0}</span>` : ''}<span class="id">${label}</span><span class="tag" title="${secName[it.section] || ''}">${it.section}</span><span class="urgw">${URG[u]}${it.severity ? ' · review: ' + it.severity : ''}</span>${it.redo ? '<span class="tag">to redo</span>' : ''}</span><span class="title">${it.title}</span>`
		c.append(btn)
		if (it.issues.length) {
			const iss = h('div', {class: 'issues'}, it.issues.map((x) => `<a href="${x.url}" target="_blank" rel="noopener">Issue #${x.n}</a>`).join(''))
			c.append(iss)
		}
		const body = h('div', {class: 'body', id: bodyId, hidden: ''})
		let html = ''
		if (it.p0text) html += `<h3>Why it is next</h3><div>${it.p0text}</div>`
		if (it.what) html += `<h3>${it.status === 'done' ? 'What was done' : it.status === 'asis' ? 'What it is' : 'What is wrong'}</h3><div>${it.what}</div>`
		if (it.where) html += `<h3>Where</h3><div class="where">${it.where}</div>`
		if (it.fix) html += `<h3>Fix</h3><div>${it.fix}</div>`
		if (it.orig) html += `<details><summary>Original finding (2026-09-22)</summary><ul>${it.orig}</ul></details>`
		if (it.raw) html += `<p>This row could not be read. It is shown as written.</p>`
		html += `<a class="gh" href="${it.link}" target="_blank" rel="noopener">Open in IMPROVEMENTS.md on GitHub</a>`
		body.innerHTML = html
		c.append(body)
		btn.onclick = () => { const open = btn.getAttribute('aria-expanded') === 'true'; btn.setAttribute('aria-expanded', String(!open)); body.hidden = open }
		return c
	}

	// ---- lanes view
	const lanesEl = $('#lanes')
	const laneStacks = {}
	for (const l of LANES) {
		const sec = h('section', {class: 'lane', 'data-lane': l.id, 'aria-labelledby': 'lh-' + l.id})
		sec.innerHTML = `<h2 id="lh-${l.id}"><span>${l.name}</span><span class="n"></span></h2><p class="lsub">${l.sub}</p>`
		const stack = h('div', {class: 'stack'})
		if (l.id === 'shipped') {
			const sb = h('button', {class: 'shipbtn', type: 'button', 'aria-expanded': 'false', id: 'shipbtn'})
			sb.onclick = () => { state.ship = !state.ship; update() }
			sec.append(sb)
		}
		sec.append(stack); lanesEl.append(sec); laneStacks[l.id] = stack
	}
	const sortKey = (it) => it.lane === 'next' ? it.p0 : 0
	const laneItems = (id) => D.items.filter((it) => it.lane === id).sort((a, b) => sortKey(a) - sortKey(b))
	for (const l of LANES) for (const it of laneItems(l.id)) laneStacks[l.id].append(card(it, l.id))
	const asisStack = $('#asis .stack')
	for (const it of laneItems('asis')) asisStack.append(card(it, 'asis'))

	// ---- area view
	const areasEl = $('#areas')
	for (const s of D.sections) {
		const a = h('section', {class: 'area', 'data-s': s.id, 'aria-labelledby': 'ah-' + s.id})
		const tot = s.done + s.open || 1
		const extra = s.changed && !/^[0—-]$/.test(s.changed) ? ` · ${s.changed} changed` : ''
		a.innerHTML = `<h2 id="ah-${s.id}">${s.id} · ${s.name}</h2>
		<div class="tally" role="img" aria-label="${s.done} done, ${s.open} open">${s.done ? `<i style="width:${s.done / tot * 100}%;background:var(--bar-done)"></i>` : ''}${s.open ? `<i style="width:${s.open / tot * 100}%;background:var(--bar-open)"></i>` : ''}</div>
		<div class="tlabel"><span class="k" style="--c:var(--bar-done)">${s.done} done</span><span class="k" style="--c:var(--bar-open)">${s.open} open</span>${extra}<span class="shown"></span></div>`
		const g = h('div', {class: 'agrid'})
		const order = {next: 0, open: 1, asis: 2, reverted: 3, done: 4}
		D.items.filter((it) => it.section === s.id).sort((x, y) => (order[x.group] - order[y.group]) || ((x.p0 || 99) - (y.p0 || 99))).forEach((it) => g.append(card(it, 'area')))
		a.append(g); areasEl.append(a)
	}

	// ---- filtering
	const text = (it) => (it.num + ' ' + it.section + ' ' + it.titleText + ' ' + (it.what + ' ' + it.where + ' ' + it.fix).replace(/<[^>]+>/g, '') + ' ' + it.issues.map((x) => '#' + x.n).join(' ')).toLowerCase()
	const T = new Map(D.items.map((it) => [it.key, text(it)]))
	const byKey = new Map(D.items.map((it) => [it.key, it]))
	function match(it) {
		const u = it.status === 'reverted' ? 'done' : it.urg
		if (state.hd && (it.status === 'done' || it.status === 'reverted')) return false
		if (state.u.size && !state.u.has(u)) return false
		if (state.s.size && !state.s.has(it.section)) return false
		if (state.q) { const t = T.get(it.key); for (const w of state.q.toLowerCase().split(/\s+/).filter(Boolean)) if (!t.includes(w)) return false }
		return true
	}
	function update() {
		writeHash()
		$('#q').value = state.q
		$('#hd').checked = state.hd
		for (const b of document.querySelectorAll('[data-u]')) if (b.classList.contains('chip')) b.setAttribute('aria-pressed', String(state.u.has(b.dataset.u)))
		for (const b of document.querySelectorAll('#f-sec .chip')) b.setAttribute('aria-pressed', String(state.s.has(b.dataset.s)))
		for (const b of document.querySelectorAll('.views button')) b.setAttribute('aria-pressed', String(b.dataset.view === state.view))
		$('#lanesview').hidden = state.view !== 'lanes'
		$('#areas').hidden = state.view !== 'area'
		let shown = 0
		const seen = new Set()
		for (const c of document.querySelectorAll('.card')) {
			const it = byKey.get(c.dataset.key)
			const ok = match(it)
			const inView = state.view === 'lanes' ? c.dataset.lane !== 'area' : c.dataset.lane === 'area'
			c.hidden = !ok || (c.dataset.lane === 'shipped' && !state.ship)
			if (ok && inView && !seen.has(it.key)) { seen.add(it.key); shown++ }
		}
		for (const l of [...LANES, {id: 'asis'}]) {
			const n = D.items.filter((it) => it.lane === l.id && match(it)).length
			const box = l.id === 'asis' ? $('#asis') : $(`.lane[data-lane="${l.id}"]`)
			$('h2 .n', box).textContent = n
			const stack = $('.stack', box)
			let empty = $('.empty', box)
			if (!empty) { empty = h('div', {class: 'empty'}, 'Nothing matches the filters.'); stack.after(empty) }
			empty.hidden = n > 0 || (l.id === 'shipped')
			if (l.id === 'asis') box.hidden = n === 0
		}
		const sb = $('#shipbtn'); const ns = D.items.filter((it) => it.lane === 'shipped' && match(it)).length
		sb.innerHTML = `<strong>${ns}</strong>${state.ship ? 'Hide the shipped items' : 'items shipped. Show them'}`
		sb.setAttribute('aria-expanded', String(state.ship))
		for (const a of document.querySelectorAll('.area')) {
			const n = D.items.filter((it) => it.section === a.dataset.s && match(it)).length
			a.hidden = n === 0
			$('.shown', a).textContent = ` · ${n} shown`
		}
		$('#count').textContent = `${shown} of ${D.items.length} items shown`
	}
	window.addEventListener('hashchange', () => { readHash(); update() })
	window.addEventListener('beforeprint', () => { for (const b of document.querySelectorAll('.card>button')) { b.setAttribute('aria-expanded', 'true'); b.nextElementSibling && (document.getElementById(b.getAttribute('aria-controls')).hidden = false) } })
	readHash(); update()
	document.body.dataset.ready = '1'
}

const json = JSON.stringify(data).replace(/</g, '\\u003c')
const legend = Object.entries({high: 'High: users lose data or see the wrong thing', medium: 'Medium: a visible bug with a workaround', low: 'Low: polish and rare cases', idea: 'Idea or larger effort', done: 'Done in 7.0.0', asis: 'Left as is, by decision'})
	.map(([k, v]) => `<span style="--u:var(--u-${k})">${v}</span>`).join('')
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tab Manager Plus roadmap</title>
<style>${CSS}</style></head>
<body>
<header>
 <div class="top"><div><h1>Tab Manager Plus roadmap</h1><p class="sub" id="sub"></p></div>
 <button class="theme" id="theme" type="button">Theme</button></div>
 <div class="tiles" id="tiles"></div>
 <div class="legend" aria-label="Colour key">${legend}</div>
</header>
<div class="filters" role="search">
 <div class="frow">
  <div class="views" role="group" aria-label="View"><button type="button" data-view="lanes" aria-pressed="true">By release</button><button type="button" data-view="area" aria-pressed="false">By area</button></div>
  <input type="search" id="q" placeholder="Search items" aria-label="Search items">
  <div class="fgroup" id="f-urg" role="group" aria-label="Urgency"><span>Urgency</span></div>
  <div class="fgroup" id="f-sec" role="group" aria-label="Section"><span>Section</span></div>
  <label class="fgroup"><input type="checkbox" id="hd"> Hide done</label>
  <button class="chip" type="button" id="clear">Clear filters</button>
  <span class="count" id="count" aria-live="polite"></span>
 </div>
</div>
<main>
 <div id="lanesview"><div class="lanes" id="lanes"></div>
 <section class="asis" id="asis" aria-labelledby="asis-h"><h2 id="asis-h"><span>Left as is</span> · <span class="n"></span></h2><div class="stack"></div></section></div>
 <div class="areas" id="areas" hidden></div>
</main>
<footer>Click a card to see what is wrong, where it is and how to fix it. Each card links to its entry in IMPROVEMENTS.md on GitHub. The page link keeps your filters, so you can share it.</footer>
<script type="application/json" id="data">${json}</script>
<script>(${client.toString()})()</script>
</body></html>
`
return html
}

// short sha of the checked-out commit: GITHUB_SHA in CI, else git, else "local"
export function currentSha(root) {
	if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
	try { return execSync('git rev-parse --short HEAD', {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim() } catch { return 'local' }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
	const args = process.argv.slice(2)
	const out = resolve(ROOT, args.find((a) => !a.startsWith('--')) || '_site/roadmap.html')
	let md, sha, source = 'working copy'
	if (args.includes('--master')) {
		const git = (c) => execSync('git ' + c, {cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']})
		for (const ref of ['origin/master', 'master']) { try { md = git(`show ${ref}:IMPROVEMENTS.md`); sha = git(`rev-parse --short ${ref}`).trim(); source = 'master'; break } catch {} }
	}
	if (md === undefined) { md = readFileSync(join(ROOT, 'IMPROVEMENTS.md'), 'utf8'); sha = currentSha(ROOT) }
	const html = buildRoadmap(md, {sha, source, log: console.log})
	mkdirSync(dirname(out), {recursive: true})
	writeFileSync(out, html)
	console.log(`wrote ${out} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`)
}
