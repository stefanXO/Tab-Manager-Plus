// Builds the GitHub Pages site (https://stefanxo.github.io/Tab-Manager-Plus/).
//   node tools/site/build.mjs [outDir]      default _site/
// Uses the extension build in build/chrome (runs `npm run build` when it is missing or older
// than changelog.html / documentation.html), then writes:
//   index.html     landing page: pitch, store buttons, screenshots, links
//   help.html      site copy of documentation.html (nav bar, no extension scripts)
//   changelog.html site copy of changelog.html (same)
//   roadmap.html   from IMPROVEMENTS.md (tools/site/roadmap.mjs)
//   stats.html     docs/stats/users.svg (with docs/stats/milestones.csv) and the latest numbers from docs/stats/history.csv
//   privacy.html, license.html   from PRIVACY.md and LICENSE.md
//   404.html, .nojekyll, site.css, site-ext.js, css/ images/ fonts/ features/
// No dependencies. The repo originals are never changed.
import {readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, statSync, readdirSync} from 'node:fs'
import {execSync} from 'node:child_process'
import {dirname, join, resolve, relative} from 'node:path'
import {fileURLToPath} from 'node:url'
import {buildRoadmap, currentSha} from './roadmap.mjs'

const SITE_URL = process.env.SITE_URL || 'https://stefanxo.github.io/Tab-Manager-Plus/'
const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const OUT = resolve(ROOT, process.argv[2] || '_site')
const EXT = join(ROOT, 'build', 'chrome')
const REPO = 'https://github.com/stefanXO/Tab-Manager-Plus'
const CHROME = 'https://chromewebstore.google.com/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff'
const FIREFOX = 'https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/'
const BASE_PATH = '/Tab-Manager-Plus/' // for 404.html, which GitHub serves at any depth
const OG_IMAGE = 'images/store/screenshot-1-1280x800.png'
const DESCS = {
	'index.html': 'Tab Manager Plus is a free browser extension that lets you search your tabs fast, save windows for later, and sort tabs your way.',
	'help.html': 'Learn how to use Tab Manager Plus to search tabs, use the keyboard, and save windows, with short examples.',
	'changelog.html': 'See what is new in each version of Tab Manager Plus, with short clips of the new features.',
	'roadmap.html': 'See which Tab Manager Plus fixes are done, which are planned next, and which ideas are still open.',
	'stats.html': 'See how many people use Tab Manager Plus each week, how it is rated, and how many GitHub stars it has.',
	'privacy.html': 'Read the privacy policy for Tab Manager Plus: it does not track you, and your tabs stay in your browser.',
	'license.html': 'Read the license for Tab Manager Plus, which is free and open source under the Mozilla Public License 2.0.',
}
const pageUrl = (file) => file === 'index.html' ? SITE_URL : SITE_URL + file
function seo(file, title) {
	const url = pageUrl(file), d = esc(DESCS[file]), t = esc(title)
	return [`<link rel="canonical" href="${url}">`, `<meta name="description" content="${d}">`,
		`<meta property="og:title" content="${t}">`, `<meta property="og:description" content="${d}">`,
		`<meta property="og:url" content="${url}">`, `<meta property="og:image" content="${SITE_URL}${OG_IMAGE}">`,
		'<meta property="og:type" content="website">', '<meta name="twitter:card" content="summary_large_image">'].join('\n')
}

const read = (p) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n')
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const write = (name, text) => { const p = join(OUT, name); mkdirSync(dirname(p), {recursive: true}); writeFileSync(p, text) }
const version = JSON.parse(read('manifest.json')).version
const today = new Date().toISOString().slice(0, 10)
const sha = currentSha(ROOT)

// ---------------------------------------------------------------- 1. extension build
const mtime = (p) => existsSync(p) ? statSync(p).mtimeMs : 0
const stale = ['changelog.html', 'documentation.html'].some((f) => mtime(join(EXT, f)) < mtime(join(ROOT, f)))
if (process.argv.includes('--rebuild') || stale) {
	console.log('running npm run build ...')
	execSync('npm run build', {cwd: ROOT, stdio: 'inherit'})
} else console.log('reusing build/chrome')

// the output folder is wiped: refuse the repository itself, anything above it, or a drive root
const rel = relative(OUT, ROOT)
if (!rel.startsWith('..') || OUT === dirname(OUT)) { console.error(`refusing to wipe ${OUT}: it contains the repository`); process.exit(2) }
rmSync(OUT, {recursive: true, force: true})
mkdirSync(OUT, {recursive: true})
for (const dir of ['css', 'images', 'fonts', 'features']) cpSync(join(EXT, dir), join(OUT, dir), {recursive: true})

// ---------------------------------------------------------------- 2. shared parts
const NAV = [['index.html', 'Home'], ['help.html', 'Help'], ['changelog.html', "What's new"], ['roadmap.html', 'Roadmap'], ['stats.html', 'Stats']]
function nav(current, base = '') {
	const links = NAV.map(([href, label]) => `<a href="${base}${href}"${href === current ? ' aria-current="page"' : ''}>${label}</a>`).join('')
	return `<nav class="site-nav" aria-label="Site"><div class="site-nav-in"><a class="site-home" href="${base}index.html"><img src="${base}images/browsers.svg" alt="" width="22" height="22"><span>Tab Manager Plus</span></a><div class="site-links">${links}<a href="${REPO}">GitHub</a></div></div></nav>`
}

const SITE_CSS = `/* Tab Manager Plus site. Same palette as the roadmap page. The nav bar is also
   injected into help.html, changelog.html and roadmap.html, so its rules are scoped. */
:root{--s-page:#f9f9f7;--s-surface:#fcfcfb;--s-raised:#fff;--s-ink:#0b0b0b;--s-ink2:#52514e;--s-muted:#6b6a65;
 --s-grid:#e1e0d9;--s-ring:rgba(11,11,11,.10);--s-accent:#2a78d6;--s-accent-ink:#fff;--s-code:#f0efec}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--s-page:#0d0d0d;--s-surface:#1a1a19;--s-raised:#21211f;--s-ink:#fff;--s-ink2:#c3c2b7;--s-muted:#a3a29b;
 --s-grid:#2c2c2a;--s-ring:rgba(255,255,255,.10);--s-accent:#3987e5;--s-accent-ink:#fff;--s-code:#2c2c2a}}
:root[data-theme="dark"]{--s-page:#0d0d0d;--s-surface:#1a1a19;--s-raised:#21211f;--s-ink:#fff;--s-ink2:#c3c2b7;--s-muted:#a3a29b;
 --s-grid:#2c2c2a;--s-ring:rgba(255,255,255,.10);--s-accent:#3987e5;--s-accent-ink:#fff;--s-code:#2c2c2a}

.site-nav *{box-sizing:border-box}
.site-nav{background:var(--s-surface);border-bottom:1px solid var(--s-grid);font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;position:relative;z-index:10}
.site-nav-in{box-sizing:border-box;max-width:1100px;margin:0 auto;padding:10px 20px;display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center;justify-content:space-between}
.site-nav a{color:var(--s-ink2);text-decoration:none;padding:4px 6px;border-radius:6px}
.site-nav a:hover{color:var(--s-ink);background:var(--s-code)}
.site-nav a[aria-current]{color:var(--s-ink);font-weight:600}
.site-nav .site-home{display:flex;align-items:center;gap:8px;color:var(--s-ink);font-weight:650}
.site-nav .site-home img{width:22px;height:22px}
.site-links{display:flex;flex-wrap:wrap;gap:2px 6px}
.site-nav a:focus-visible{outline:2px solid var(--s-accent);outline-offset:2px}

body.site{margin:0;background:var(--s-page);color:var(--s-ink);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:light dark}
body.site *{box-sizing:border-box}
.site main{max-width:1100px;margin:0 auto;padding:28px 20px 48px}
.site main.narrow{max-width:760px}
.site main a,.site-foot a{color:var(--s-accent)}
.site main a:focus-visible{outline:2px solid var(--s-accent);outline-offset:2px}
.site h1{font-size:32px;line-height:1.2;margin:0 0 8px;font-weight:700}
.site h2{font-size:22px;margin:36px 0 12px;font-weight:650}
.site h3{font-size:17px;margin:24px 0 8px}
.site code{font:13px/1.4 ui-monospace,"Cascadia Mono",Consolas,monospace;background:var(--s-code);padding:1px 4px;border-radius:4px}
.site pre{background:var(--s-code);padding:12px;border-radius:8px;overflow:auto}
.site pre code{background:none;padding:0}
.lead{font-size:19px;color:var(--s-ink2);margin:0 0 6px;max-width:44em}
.muted{color:var(--s-muted)}
.hero{display:grid;grid-template-columns:1fr;gap:20px;padding:20px 0 8px}
.hero .logo{width:64px;height:64px}
.buttons{display:flex;flex-wrap:wrap;gap:12px;margin:20px 0 6px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;font-weight:600;text-decoration:none;border:1px solid var(--s-grid);background:var(--s-raised);color:var(--s-ink)!important}
.btn.primary{background:var(--s-accent);border-color:var(--s-accent);color:var(--s-accent-ink)!important}
.btn:hover{box-shadow:0 2px 8px var(--s-ring)}
.gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:24px}
.gallery a:first-child{grid-column:1/-1}
.gallery img{display:block;width:100%;height:auto;border-radius:10px;border:1px solid var(--s-grid);box-shadow:0 1px 3px var(--s-ring)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin-top:12px}
.card{display:block;padding:16px 18px;border-radius:12px;background:var(--s-raised);border:1px solid var(--s-grid);box-shadow:0 1px 2px var(--s-ring);text-decoration:none;color:var(--s-ink)!important}
.card:hover{border-color:var(--s-accent)}
.card strong{display:block;font-size:17px;margin-bottom:4px;color:var(--s-accent)}
.card span{color:var(--s-ink2);font-size:15px}
.stat-chart{background:#fff;border:1px solid var(--s-grid);border-radius:12px;padding:12px;margin:16px 0}
.stat-chart img{display:block;width:100%;height:auto}
table.latest{border-collapse:collapse;margin:12px 0;min-width:min(100%,460px)}
table.latest th,table.latest td{text-align:left;padding:8px 14px;border-bottom:1px solid var(--s-grid)}
table.latest td.n{text-align:right;font-variant-numeric:tabular-nums}
.md li{margin:4px 0}
footer.site-foot{max-width:1100px;margin:0 auto;padding:20px;border-top:1px solid var(--s-grid);color:var(--s-muted);font-size:14px}
@media (max-width:640px){.gallery{grid-template-columns:repeat(2,1fr)}.site h1{font-size:26px}}
`

// Replaces dist/popup/changelog.js and documentation.js on the site copies: those need the
// extension APIs (changelog.js imports webextension-polyfill, which throws on a web page)
// and hide the other browser's lines. Here: theme follows the system, clips play on screen.
const SITE_EXT_JS = `// site copies of help.html / changelog.html: theme + clips, no extension APIs
(function () {
	var q = matchMedia('(prefers-color-scheme: dark)')
	function theme() { document.documentElement.setAttribute('data-theme', q.matches ? 'dark' : 'light') }
	theme(); q.addEventListener('change', theme)
	function clips() {
		var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
		var figs = Array.prototype.slice.call(document.querySelectorAll('figure.clip'))
		function play(v) { if (v.preload === 'none') { v.preload = 'auto'; v.load() } var p = v.play(); if (p) p.catch(function () {}) }
		figs.forEach(function (fig) {
			var v = fig.querySelector('video'); if (!v) return
			v.addEventListener('error', function () { fig.hidden = true }, true)
			if (reduced) { v.removeAttribute('autoplay'); v.pause(); fig.classList.add('still'); return }
			fig.addEventListener('click', function () { if (v.paused) { fig.dataset.paused = ''; play(v) } else { fig.dataset.paused = '1'; v.pause() } })
		})
		if (reduced || !('IntersectionObserver' in window)) return
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (e) {
				var v = e.target.querySelector('video'); if (!v) return
				if (e.intersectionRatio >= 0.5 && e.target.dataset.paused !== '1') play(v); else v.pause()
			})
		}, {threshold: [0, 0.5]})
		figs.forEach(function (f) { io.observe(f) })
	}
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', clips); else clips()
})()
`

function page({file, title, desc = '', body, narrow = false, base = ''}) {
	return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
${DESCS[file] ? seo(file, title) + '\n' : '<meta name="robots" content="noindex">\n'}<link rel="icon" type="image/png" href="${base}images/browsers128.png">
<link rel="stylesheet" href="${base}site.css">
</head>
<body class="site">
${nav(file, base)}
<main${narrow ? ' class="narrow"' : ''}>
${body}
</main>
<footer class="site-foot">Tab Manager Plus ${esc(version)} · free and open source under the <a href="${base}license.html">MPL 2.0</a> · <a href="${base}privacy.html">Privacy</a> · <a href="${REPO}">Source on GitHub</a></footer>
</body></html>
`
}

// ---------------------------------------------------------------- 3. tiny markdown
// headings (# and setext), paragraphs, lists (*, -, +, 1.), fenced code, hr, links,
// bare URLs, bold, italics, inline code. Indented lines continue the block above.
export function markdown(md, links = {}) {
	const lines = md.replace(/\r\n/g, '\n').split('\n')
	const out = []
	let para = null, list = null, item = null
	const flushPara = () => { if (para) { out.push(`<p>${inline(para.join(' '))}</p>`); para = null } }
	const flushItem = () => { if (item) { list.items.push(inline(item.join(' '))); item = null } }
	const flushList = () => { flushItem(); if (list) { out.push(`<${list.tag}>${list.items.map((i) => `<li>${i}</li>`).join('')}</${list.tag}>`); list = null } }
	const flush = () => { flushPara(); flushList() }
	function inline(s) {
		const keep = []
		const hold = (html) => `\u0000${keep.push(html) - 1}\u0000`
		s = s.replace(/`([^`]+)`/g, (_, c) => hold(`<code>${esc(c)}</code>`))
		s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => hold(`<a href="${esc(links[u] || u)}">${inline(t)}</a>`))
		s = s.replace(/<?(https?:\/\/[^\s<>)]+[^\s<>).,;:])>?/g, (_, u) => hold(`<a href="${esc(u)}">${esc(u)}</a>`))
		s = esc(s)
		s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>')
		s = s.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>').replace(/(^|[\s(])_([^_\s][^_]*)_/g, '$1<em>$2</em>')
		return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i])
	}
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i], next = lines[i + 1] ?? ''
		if (/^```/.test(line)) {
			flush(); const code = []
			while (++i < lines.length && !/^```/.test(lines[i])) code.push(lines[i])
			out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`); continue
		}
		if (!line.trim()) { flushPara(); flushItem(); if (list && !/^\s*([*+-]|\d+\.)\s/.test(next) && !/^\s+\S/.test(next)) flushList(); continue }
		let m
		if ((m = line.match(/^(#{1,6})\s+(.*?)\s*#*$/))) { flush(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); continue }
		if (line.trim() && /^(=+|-+)\s*$/.test(next) && !para && !list) { flush(); const h = next[0] === '=' ? 1 : 2; out.push(`<h${h}>${inline(line.trim())}</h${h}>`); i++; continue }
		if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) { flush(); out.push('<hr>'); continue }
		if ((m = line.match(/^\s{0,3}([*+-]|\d+\.)\s+(.*)$/))) {
			flushPara(); const tag = /\d/.test(m[1]) ? 'ol' : 'ul'
			if (list && list.tag !== tag) flushList()
			if (!list) list = {tag, items: []}
			flushItem(); item = [m[2]]; continue
		}
		if (item && /^\s+\S/.test(line)) { item.push(line.trim()); continue }
		if (list) flushList()
		;(para ||= []).push(line.trim())
	}
	flush()
	return out.join('\n')
}

// ---------------------------------------------------------------- 4. extension page copies
const longDate = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'})
function siteCopy(src, file, {title, rename}) {
	let html = readFileSync(join(EXT, src), 'utf8')
	const scripts = (html.match(/<script\b[^>]*src="dist\/[^"]*"[^>]*><\/script>\s*/g) || []).length
	html = html.replace(/<script\b[^>]*src="dist\/[^"]*"[^>]*><\/script>\s*/g, '')
	for (const [from, to] of rename) html = html.split(from).join(to)
	// the extension fills <time> with "x days ago"; here the plain date is written in
	html = html.replace(/<time datetime="(\d{4}-\d{2}-\d{2})"([^>]*)><\/time>/g, (_, d, rest) => `<time datetime="${d}"${rest}>${longDate(d)}</time>`)
	if (!/name="viewport"/.test(html)) html = html.replace(/<head>/, '<head>\n\t<meta name="viewport" content="width=device-width, initial-scale=1"/>')
	html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
	html = html.replace(/<\/head>/, seo(file, title).replace(/^/gm, '\t') + '\n\t<link rel="stylesheet" href="site.css"/>\n\t<script src="site-ext.js"></script>\n</head>')
	html = html.replace(/<body([^>]*)>/, (m) => `${m}\n${nav(file)}`)
	write(file, html)
	return scripts
}
const stripped = [
	siteCopy('documentation.html', 'help.html', {title: 'How to use Tab Manager Plus', rename: [
		['\t\t\t\t\t\t<a href="options.html">Options</a>\n', ''], ['<a href="options.html">Options</a>', ''],
		['href="PRIVACY.md"', 'href="privacy.html"'], ['href="changelog.html"', 'href="changelog.html"']]}),
	siteCopy('changelog.html', 'changelog.html', {title: "What's new in Tab Manager Plus", rename: [
		['href="documentation.html"', 'href="help.html"'], ['href="PRIVACY.md"', 'href="privacy.html"']]}),
]

// ---------------------------------------------------------------- 5. own pages
write('site.css', SITE_CSS)
write('site-ext.js', SITE_EXT_JS)
write('.nojekyll', '')

// pitch from the readme: the ##### line under the title and the first plain paragraph
const readme = read('readme.md')
const tagline = (readme.match(/^#####\s+(.+)$/m) || [, 'Search your tabs fast, save windows for later, and more.'])[1].trim()
const intro = (readme.match(/^Tab Manager Plus shows .+$/m) || [''])[0].replace(/\s*It is an extended version.*$/, '')

mkdirSync(join(OUT, 'images', 'store'), {recursive: true})
const shots = readdirSync(join(ROOT, 'store', 'images')).filter((f) => /^screenshot-\d+-1280x800\.png$/.test(f)).sort()
for (const f of shots) cpSync(join(ROOT, 'store', 'images', f), join(OUT, 'images', 'store', f))
const SHOT_ALT = ['Tab Manager Plus in Block view', 'Tab Manager Plus screenshot 2', 'Tab Manager Plus screenshot 3', 'Tab Manager Plus screenshot 4', 'Tab Manager Plus screenshot 5']
const gallery = shots.map((f, i) => `<a href="images/store/${f}"><img src="images/store/${f}" width="1280" height="800" alt="${esc(SHOT_ALT[i] || `Screenshot ${i + 1}`)}"${i ? ' loading="lazy"' : ''}></a>`).join('\n')

const CARDS = [
	['help.html', 'Help', 'How to search, use the keyboard, and save windows. With short examples.'],
	['changelog.html', "What's new", `Every change in ${version} and the versions before it, with short clips.`],
	['roadmap.html', 'Roadmap', 'What is fixed, what comes next, and what is still an idea.'],
	['stats.html', 'Stats', 'Users, ratings and GitHub stars over time.'],
	['privacy.html', 'Privacy', 'No tracking. Your tabs and settings never leave your browser.'],
	[REPO, 'Source', 'The full code on GitHub. Report a bug or ask for a feature there.'],
]
write('index.html', page({file: 'index.html', title: 'Tab Manager Plus: find and sort your tabs fast', desc: tagline, body: `
<section class="hero">
 <div>
  <img class="logo" src="images/browsers.svg" alt="" width="64" height="64">
  <h1>Tab Manager Plus</h1>
  <p class="lead">${esc(tagline)}</p>
  <p class="muted">${esc(intro)} It is free and open source, with no tracking.</p>
  <div class="buttons">
   <a class="btn primary" href="${CHROME}">Add to Chrome</a>
   <a class="btn primary" href="${FIREFOX}">Add to Firefox</a>
   <a class="btn" href="${REPO}">View on GitHub</a>
  </div>
  <p class="muted">Works in Chrome, Edge, Brave and other browsers built on Chromium, and in Firefox.</p>
 </div>
</section>
<div class="gallery">
${gallery}
</div>
<h2>Learn more</h2>
<div class="cards">
${CARDS.map(([href, t, s]) => `<a class="card" href="${href}"><strong>${t}</strong><span>${s}</span></a>`).join('\n')}
</div>`}))

// stats: latest value per metric
const LABELS = {chrome_users: 'Chrome weekly users', chrome_store: 'Chrome Web Store page (rounded down)', firefox_users: 'Firefox daily users', stars: 'GitHub stars', chrome_ratings: 'Chrome ratings', chrome_rating_avg: 'Chrome rating, average of all ratings', chrome_rating: 'Chrome rating shown on the store page', firefox_ratings: 'Firefox ratings', firefox_rating: 'Firefox rating', firefox_rating_avg: 'Firefox rating, average of all ratings'}
const latest = new Map()
for (const row of read('docs/stats/history.csv').trim().split('\n').slice(1)) {
	const [date, metric, value] = row.split(',')
	if (!latest.has(metric) || latest.get(metric).date <= date) latest.set(metric, {date, value: +value})
}
mkdirSync(join(OUT, 'stats'), {recursive: true})
cpSync(join(ROOT, 'docs', 'stats', 'users.svg'), join(OUT, 'stats', 'users.svg'))
cpSync(join(ROOT, 'docs', 'stats', 'history.csv'), join(OUT, 'stats', 'history.csv'))
cpSync(join(ROOT, 'docs', 'stats', 'milestones.csv'), join(OUT, 'stats', 'milestones.csv'))
const svgHeight = +(read('docs/stats/users.svg').match(/height="(\d+)"/) || [, 542])[1]
const order = Object.keys(LABELS).filter((k) => latest.has(k)).concat([...latest.keys()].filter((k) => !LABELS[k] && !/^(chrome|firefox)_new_\d$/.test(k))) // per-star monthly counts are only in the chart
write('stats.html', page({file: 'stats.html', title: 'Tab Manager Plus stats', desc: 'Weekly users, store ratings and GitHub stars for Tab Manager Plus.', narrow: true, body: `
<h1>Stats</h1>
<p class="lead">How many people use Tab Manager Plus, week by week, how they rate it, and what happened when.</p>
<div class="stat-chart"><img src="stats/users.svg" width="820" height="${svgHeight}" alt="Chart of Chrome users, Firefox users, GitHub stars, new Chrome and Firefox ratings per month by star and average rating over time, with releases and store events marked"></div>
<h2>Latest numbers</h2>
<table class="latest"><thead><tr><th>What</th><th>Number</th><th>Date</th></tr></thead><tbody>
${order.map((k) => { const r = latest.get(k); return `<tr><td>${esc(LABELS[k] || k)}</td><td class="n">${r.value.toLocaleString('en-US')}</td><td>${r.date}</td></tr>` }).join('\n')}
</tbody></table>
<h2>Where the numbers come from</h2>
<p>All numbers are public. They come from the Chrome Web Store, from Firefox Add-ons, and from GitHub. The extension does not count you or send anything. Nothing is collected from users.</p>
<p>A job on GitHub reads the numbers once a week and adds them to a <a href="stats/history.csv">CSV file</a>. The Chrome store page rounds its count down, so the chart uses the weekly numbers from the store's own dashboard. Older points come from saved copies of the store pages.</p>
<p>New ratings per month: 4 and 5 stars stack upwards, 1 to 3 stars downwards, on the same scale. Chrome ratings come from the store's dashboard, Firefox ratings from the public Firefox Add-ons API (date and stars only). The averages are the plain average of all ratings ever given. The Chrome store page shows its own, slightly different average, kept as a separate number below. The dashed vertical lines are releases (yellow) and store events (grey), listed in <a href="stats/milestones.csv">milestones.csv</a>.</p>`}))

const mdLinks = {'PRIVACY.md': 'privacy.html', 'LICENSE.md': 'license.html', './CHANGELOG.md': 'changelog.html', 'CHANGELOG.md': 'changelog.html'}
write('privacy.html', page({file: 'privacy.html', title: 'Tab Manager Plus privacy policy', narrow: true, body: `<div class="md">${markdown(read('PRIVACY.md'), mdLinks)}</div>`}))
write('license.html', page({file: 'license.html', title: 'Tab Manager Plus license (MPL 2.0)', narrow: true, body: `<div class="md">${markdown(read('LICENSE.md'), mdLinks)}</div>`}))

// roadmap, with the same nav bar
let roadmap = buildRoadmap(read('IMPROVEMENTS.md'), {sha, date: today, source: 'master'})
roadmap = roadmap.replace('</head>', seo('roadmap.html', (roadmap.match(/<title>([^<]*)<\/title>/) || [, 'Tab Manager Plus roadmap'])[1]) + '\n<link rel="stylesheet" href="site.css">\n<link rel="icon" type="image/png" href="images/browsers128.png">\n</head>').replace(/<body([^>]*)>/, (m) => `${m}\n${nav('roadmap.html')}`)
write('roadmap.html', roadmap)

// 404 is served at any depth, so it links with absolute paths
const notFound = page({file: '', title: 'Page not found · Tab Manager Plus', narrow: true, base: BASE_PATH, body: `
<h1>Page not found</h1>
<p class="lead">This page does not exist. It may have moved.</p>
<p><a class="btn primary" href="${BASE_PATH}">Go to the home page</a></p>`})
write('404.html', notFound)

write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(DESCS).map((f) => `<url><loc>${pageUrl(f)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`)
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}sitemap.xml\n`)

// ---------------------------------------------------------------- 6. report
function size(p) { const s = statSync(p); return s.isDirectory() ? readdirSync(p).reduce((n, f) => n + size(join(p, f)), 0) : s.size }
const kb = (n) => n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1024).toFixed(0)} KB`
console.log(`site ${relative(ROOT, OUT) || '.'} (version ${version}, ${sha}, ${today}); removed ${stripped.join('+')} extension script tags from help/changelog`)
for (const f of readdirSync(OUT).sort()) console.log(`  ${f.padEnd(16)} ${kb(size(join(OUT, f))).padStart(8)}`)
console.log(`  total            ${kb(size(OUT)).padStart(8)}`)
