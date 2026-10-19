// Collects public usage numbers into docs/stats/history.csv (date,metric,value).
//   node tools/stats/fetch.mjs today      adds today's Chrome users, Firefox users and GitHub stars
//   node tools/stats/fetch.mjs backfill   one-time: Wayback Machine snapshots of both store pages
//                                         (about one per month) plus the full GitHub star history
//   node tools/stats/fetch.mjs import-chrome <csv>
//                                         "Weekly users over time" export from the Chrome Web Store
//                                         dashboard (exact numbers); one point per week is kept
//   node tools/stats/fetch.mjs import-chrome-ratings <csv>
//                                         "Ratings over time" export from the dashboard (new ratings
//                                         per day and star value); kept as the running total
//                                         (chrome_ratings) and running average (chrome_rating_avg),
//                                         one point per week, plus new ratings per month and star
//                                         (chrome_new_1 .. chrome_new_5, dated the month's last day)
// The store page only shows a rounded-down count ("200,000 users" for 280k), so the weekly job
// stores it as chrome_store, and the chart uses the exact dashboard numbers (chrome_users).
// Ratings: the weekly job stores the average the store page shows (chrome_rating, one decimal) and
// the Firefox average and count from the AMO API (firefox_rating, firefox_ratings). It also reads
// every Firefox rating from the public AMO ratings API (date and score, no names) and rewrites the
// Firefox history from them: new ratings per month and star (firefox_new_1 .. firefox_new_5) and
// the running average (firefox_rating_avg), one point per month.
//   node tools/stats/fetch.mjs firefox-ratings   only that part
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
// 'Average rating 4.5 out of 5 stars' (new store page); the count is rounded ("1.1K ratings"), so it is not kept
// AMO page JSON: "ratings":{"average":4.5019,...,"count":261}
const amoRatings = html => { const m = html.match(/"ratings"\s*:\s*\{[^}]*"average"\s*:\s*([\d.]+)[^}]*"count"\s*:\s*(\d+)/); return m ? { firefox_rating: +(+m[1]).toFixed(2), firefox_ratings: +m[2] } : null; };
const chromeRating = html => { const m = html.match(/Average rating (\d(?:\.\d)?) out of 5/); return m ? +m[1] : null; };

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
		const r = await get(u); if (!r) continue;
		const html = await r.text(), v = chromeUsers(html), rating = chromeRating(html);
		if (rating) rows.push({ date, metric: 'chrome_rating', value: rating });
		if (v) { rows.push({ date, metric: 'chrome_store', value: v }); break; }
	}
	const amo = await get(`https://addons.mozilla.org/api/v5/addons/addon/${AMO_SLUG}/`);
	if (amo) {
		const a = await amo.json();
		rows.push({ date, metric: 'firefox_users', value: a.average_daily_users });
		if (a.ratings) rows.push({ date, metric: 'firefox_rating', value: +(+a.ratings.average).toFixed(2) }, { date, metric: 'firefox_ratings', value: a.ratings.count });
	}
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
		console.log(metric, date, v && typeof v === 'object' ? JSON.stringify(v) : v ?? '-');
		if (v && typeof v === 'object') for (const [m, value] of Object.entries(v)) rows.push({ date, metric: m, value });
		else if (v) rows.push({ date, metric, value: v });
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

async function firefoxRatings(rows) {
	const scores = []; // [date, score]
	for (let url = `https://addons.mozilla.org/api/v5/ratings/rating/?addon=${AMO_SLUG}&page_size=50`; url;) {
		const r = await get(url); if (!r) break;
		const j = await r.json();
		scores.push(...j.results.map(x => [x.created.slice(0, 10), x.score]));
		url = j.next;
	}
	if (!scores.length) { console.error('no Firefox ratings fetched'); return rows; }
	scores.sort((a, b) => a[0].localeCompare(b[0]));
	rows = rows.filter(r => !(r.metric === 'firefox_rating_avg' || /^firefox_new_\d$/.test(r.metric)));
	let count = 0, sum = 0, month = {}, key = '';
	const flush = date => { for (let st = 1; st <= 5; st++) if (month[st]) rows.push({ date, metric: `firefox_new_${st}`, value: month[st] }); rows.push({ date, metric: 'firefox_rating_avg', value: +(sum / count).toFixed(2) }); };
	let last = '';
	for (const [date, score] of scores) {
		if (date.slice(0, 7) !== key) { if (key) flush(last); key = date.slice(0, 7); month = {}; }
		count++; sum += score; month[score] = (month[score] || 0) + 1; last = date;
	}
	flush(last);
	console.log('firefox ratings', scores[0][0], 'to', last, '=', count, 'ratings, average', (sum / count).toFixed(2));
	return rows;
}

const mode = process.argv[2];
let rows = readRows();
if (mode === 'today') { rows.push(...await today()); rows = await firefoxRatings(rows); }
else if (mode === 'firefox-ratings') rows = await firefoxRatings(rows);
else if (mode === 'backfill') {
	for (const u of CHROME_URLS) rows.push(...await wayback(u, chromeUsers, 'chrome_users'));
	rows.push(...await wayback(AMO_PAGE, amoUsers, 'firefox_users'));
	rows.push(...await wayback(AMO_PAGE, amoRatings, 'firefox_rating'));
	rows.push(...await stars());
} else if (mode === 'import-chrome') {
	// Date,Weekly users with dates like 10/29/21; zeros are days before the export starts
	const lines = fs.readFileSync(process.argv[3], 'utf8').trim().split(/\r?\n/).filter(l => /^\d+\/\d+\/\d+,\d+$/.test(l));
	const pts = lines.map(l => { const [d, v] = l.split(','); const [m, dd, y] = d.split('/'); return { date: `20${y.padStart(2, '0')}-${m.padStart(2, '0')}-${dd.padStart(2, '0')}`, metric: 'chrome_users', value: +v }; }).filter(r => r.value > 0);
	const first = pts[0].date;
	rows = rows.filter(r => !(r.metric === 'chrome_users' && r.date >= first)); // exact numbers replace the snapshots
	rows.push(...pts.filter((r, i) => i % 7 === 0 || i === pts.length - 1));
	console.log('chrome dashboard', first, 'to', pts.at(-1).date);
} else if (mode === 'import-chrome-ratings') {
	// Date,Five stars,Four stars,One star,Three stars,Two stars (one line per day, mostly zeros)
	const lines = fs.readFileSync(process.argv[3], 'utf8').trim().split(/\r?\n/);
	const head = lines.find(l => /^Date,/.test(l)).split(',');
	const stars = head.map(h => ({ five: 5, four: 4, three: 3, two: 2, one: 1 })[h.split(' ')[0].toLowerCase()] || 0);
	let count = 0, sum = 0, month = {}, key = '';
	const pts = [];
	for (const l of lines.filter(l => /^\d+\/\d+\/\d+,/.test(l))) {
		const c = l.split(',');
		const [m, dd, y] = c[0].split('/');
		const date = `20${y.padStart(2, '0')}-${m.padStart(2, '0')}-${dd.padStart(2, '0')}`;
		if (date.slice(0, 7) !== key) { key = date.slice(0, 7); month = {}; }
		for (let i = 1; i < c.length; i++) { count += +c[i]; sum += stars[i] * +c[i]; month[stars[i]] = (month[stars[i]] || 0) + +c[i]; }
		pts.push({ date, count, avg: count ? +(sum / count).toFixed(2) : 0, month });
	}
	const first = pts[0].date;
	rows = rows.filter(r => !((['chrome_ratings', 'chrome_rating_avg'].includes(r.metric) || /^chrome_new_\d$/.test(r.metric)) && r.date >= first));
	for (const [i, p] of pts.entries()) if (i % 7 === 0 || i === pts.length - 1) rows.push({ date: p.date, metric: 'chrome_ratings', value: p.count }, { date: p.date, metric: 'chrome_rating_avg', value: p.avg });
	for (const [i, p] of pts.entries()) if (i === pts.length - 1 || pts[i + 1].date.slice(0, 7) !== p.date.slice(0, 7)) for (let st = 1; st <= 5; st++) if (p.month[st]) rows.push({ date: p.date, metric: `chrome_new_${st}`, value: p.month[st] });
	console.log('chrome ratings', first, 'to', pts.at(-1).date, '=', count, 'ratings, average', pts.at(-1).avg);
} else { console.error('usage: fetch.mjs today|firefox-ratings|backfill|import-chrome <csv>|import-chrome-ratings <csv>'); process.exit(2); }
console.log(writeRows(rows), 'rows in', CSV.pathname);
