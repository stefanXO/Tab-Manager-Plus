// Collects public usage numbers into docs/stats/history.csv (date,metric,value).
//   node tools/stats/fetch.mjs today      adds today's Chrome users, Firefox users and GitHub stars
//   node tools/stats/fetch.mjs backfill   one-time: Wayback Machine snapshots of both store pages
//                                         (about one per month) plus the full GitHub star history
//   node tools/stats/fetch.mjs import-chrome <csv>
//                                         "Weekly users over time" export from the Chrome Web Store
//                                         dashboard (exact numbers); one point per week is kept
// The store page only shows a rounded-down count ("200,000 users" for 280k), so the weekly job
// stores it as chrome_store, and the chart uses the exact dashboard numbers (chrome_users).
// Only public numbers from the stores and GitHub; nothing is collected from users.
import fs from 'node:fs';

const CHROME_ID = 'cnkdjjdmfiffagllbiiilooaoofcoeff';
const CHROME_URLS = [
	`https://chromewebstore.google.com/detail/tab-manager-plus-for-chro/${CHROME_ID}`,
	`https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/${CHROME_ID}`,
];
const AMO_SLUG = 'tab-manager-plus-for-firefox';
const AMO_PAGE = `https://addons.mozilla.org/en-US/firefox/addon/${AMO_SLUG}/`;
const REPO = 'stefanXO/Tab-Manager-Plus';
const CSV = new URL('../../docs/stats/history.csv', import.meta.url);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const day = d => d.toISOString().slice(0, 10);
const num = s => Number(String(s).replace(/[,.\s  ]/g, '')); // archived pages use , . and narrow spaces

async function get(url, opts = {}, tries = 3) {
	for (let i = 0; i < tries; i++) {
		try {
			const r = await fetch(url, { ...opts, headers: { 'user-agent': 'Mozilla/5.0 (tab-manager-plus stats)', ...(opts.headers || {}) } });
			if (r.ok) return r;
			if (r.status === 404) return null;
		} catch { /* retry */ }
		await sleep(2000 * (i + 1));
	}
	return null;
}

// "18,001 users" (old and new store page), "UserDownloads:18,001" (old page metadata)
function chromeUsers(html) {
	const m = html.match(/UserDownloads:(\d[\d,.\s  ]*)/) || html.match(/(\d[\d,.  ]*)\+?\s*users/i);
	return m ? num(m[1]) : null;
}
const amoUsers = html => { const m = html.match(/average_daily_users"\s*:\s*(\d+)/); return m ? +m[1] : null; };

function readRows() {
	if (!fs.existsSync(CSV)) return [];
	return fs.readFileSync(CSV, 'utf8').trim().split('\n').slice(1).filter(Boolean).map(l => { const [date, metric, value] = l.split(','); return { date, metric, value: +value }; });
}
function writeRows(rows) {
	const seen = new Map();
	for (const r of rows) if (r.value > 0) seen.set(r.date + r.metric, r); // last one per day and metric wins
	const out = [...seen.values()].sort((a, b) => a.date.localeCompare(b.date) || a.metric.localeCompare(b.metric));
	fs.mkdirSync(new URL('.', CSV), { recursive: true });
	fs.writeFileSync(CSV, 'date,metric,value\n' + out.map(r => `${r.date},${r.metric},${r.value}`).join('\n') + '\n');
	return out.length;
}

async function today() {
	const date = day(new Date()), rows = [];
	for (const u of CHROME_URLS) {
		const r = await get(u); const v = r && chromeUsers(await r.text());
		if (v) { rows.push({ date, metric: 'chrome_store', value: v }); break; }
	}
	const amo = await get(`https://addons.mozilla.org/api/v5/addons/addon/${AMO_SLUG}/`);
	if (amo) rows.push({ date, metric: 'firefox_users', value: (await amo.json()).average_daily_users });
	const gh = await get(`https://api.github.com/repos/${REPO}`, { headers: process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {} });
	if (gh) rows.push({ date, metric: 'stars', value: (await gh.json()).stargazers_count });
	for (const r of rows) console.log(r.date, r.metric, r.value);
	if (!rows.length) { console.error('no numbers fetched'); process.exit(1); }
	return rows;
}

async function wayback(url, parse, metric) {
	const cdx = await get(`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&fl=timestamp&filter=statuscode:200&collapse=timestamp:6`);
	if (!cdx) return [];
	const stamps = (await cdx.json()).slice(1).map(r => r[0]);
	const rows = [];
	for (const t of stamps) {
		const r = await get(`https://web.archive.org/web/${t}id_/${url}`);
		const v = r && parse(await r.text());
		const date = `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`;
		console.log(metric, date, v ?? '-');
		if (v) rows.push({ date, metric, value: v });
		await sleep(1500); // be gentle with the archive
	}
	return rows;
}

async function stars() {
	const token = process.env.GITHUB_TOKEN;
	const dates = [];
	for (let page = 1; ; page++) {
		const r = await get(`https://api.github.com/repos/${REPO}/stargazers?per_page=100&page=${page}`, { headers: { accept: 'application/vnd.github.star+json', ...(token ? { authorization: `Bearer ${token}` } : {}) } });
		if (!r) break;
		const list = await r.json();
		if (!list.length) break;
		dates.push(...list.map(s => s.starred_at.slice(0, 10)));
	}
	dates.sort();
	const rows = []; // one point per month (last day seen), plus the last day
	dates.forEach((d, i) => { if (i === dates.length - 1 || dates[i + 1].slice(0, 7) !== d.slice(0, 7)) rows.push({ date: d, metric: 'stars', value: i + 1 }); });
	console.log('stars', rows.length, 'points,', dates.length, 'total');
	return rows;
}

const mode = process.argv[2];
let rows = readRows();
if (mode === 'today') rows.push(...await today());
else if (mode === 'backfill') {
	for (const u of CHROME_URLS) rows.push(...await wayback(u, chromeUsers, 'chrome_users'));
	rows.push(...await wayback(AMO_PAGE, amoUsers, 'firefox_users'));
	rows.push(...await stars());
} else if (mode === 'import-chrome') {
	// Date,Weekly users with dates like 10/29/21; zeros are days before the export starts
	const lines = fs.readFileSync(process.argv[3], 'utf8').trim().split(/\r?\n/).filter(l => /^\d+\/\d+\/\d+,\d+$/.test(l));
	const pts = lines.map(l => { const [d, v] = l.split(','); const [m, dd, y] = d.split('/'); return { date: `20${y.padStart(2, '0')}-${m.padStart(2, '0')}-${dd.padStart(2, '0')}`, metric: 'chrome_users', value: +v }; }).filter(r => r.value > 0);
	const first = pts[0].date;
	rows = rows.filter(r => !(r.metric === 'chrome_users' && r.date >= first)); // exact numbers replace the snapshots
	rows.push(...pts.filter((r, i) => i % 7 === 0 || i === pts.length - 1));
	console.log('chrome dashboard', first, 'to', pts.at(-1).date);
} else { console.error('usage: fetch.mjs today|backfill|import-chrome <csv>'); process.exit(2); }
console.log(writeRows(rows), 'rows in', CSV.pathname);
