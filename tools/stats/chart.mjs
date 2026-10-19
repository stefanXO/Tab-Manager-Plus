// Draws docs/stats/history.csv as docs/stats/users.svg: six panels (Chrome users,
// Firefox users, GitHub stars, new Chrome and Firefox ratings per month by star, average rating)
// on one shared time axis, with the milestones from
// docs/stats/milestones.csv (date,kind,label; kind release or store) as dashed lines through
// every panel, releases in yellow. Mid-tone
// colours, so it reads on GitHub's light and dark backgrounds alike (an <img> SVG cannot
// see GitHub's theme).
import fs from 'node:fs';

const CSV = new URL('../../docs/stats/history.csv', import.meta.url);
const MILESTONES = new URL('../../docs/stats/milestones.csv', import.meta.url);
const SVG = new URL('../../docs/stats/users.svg', import.meta.url);
const CHROME = '#3b78e7', FIREFOX = '#e8743b', STARS = '#c9a227', GREY = '#848d97', RELEASE = '#d9a521';
const PANELS = [
	{ label: 'Chrome weekly users', series: [{ metric: 'chrome_users', color: CHROME, area: true }] },
	{ label: 'Firefox users', series: [{ metric: 'firefox_users', color: FIREFOX, area: true }] },
	{ label: 'GitHub stars', series: [{ metric: 'stars', color: STARS, area: true }] },
	// new Chrome ratings per month and star: 4 and 5 stars stack upwards, 1 to 3 stars downwards
	{ label: 'New Chrome ratings per month', stars: true, series: [
		{ metric: 'chrome_new_5', color: '#2e9e5b', name: '5 stars', up: true },
		{ metric: 'chrome_new_4', color: '#8fd19e', name: '4 stars', up: true },
		{ metric: 'chrome_new_3', color: '#d9a521', name: '3 stars' },
		{ metric: 'chrome_new_2', color: '#e8743b', name: '2 stars' },
		{ metric: 'chrome_new_1', color: '#d64545', name: '1 star' },
	] },
	{ label: 'New Firefox ratings per month', stars: true, series: [
		{ metric: 'firefox_new_5', color: '#2e9e5b', name: '5 stars', up: true },
		{ metric: 'firefox_new_4', color: '#8fd19e', name: '4 stars', up: true },
		{ metric: 'firefox_new_3', color: '#d9a521', name: '3 stars' },
		{ metric: 'firefox_new_2', color: '#e8743b', name: '2 stars' },
		{ metric: 'firefox_new_1', color: '#d64545', name: '1 star' },
	] },
	// averages on their own scale, so a 4.6 is not read against a user count
	{
		label: 'Average rating', min: 4, max: 5,
		series: [
			{ metric: 'chrome_rating_avg', color: CHROME, name: 'Chrome' },
			{ metric: 'firefox_rating_avg', color: FIREFOX, name: 'Firefox' },
		],
	},
];
const W = 820, PH = 130, GAP = 48, L = 64, R = 70, AXIS = 26, LANE = 15;

const rows = fs.readFileSync(CSV, 'utf8').trim().split('\n').slice(1).map(l => { const [d, m, v] = l.split(','); return { t: Date.parse(d), d, m, v: +v }; });
const milestones = fs.existsSync(MILESTONES) ? fs.readFileSync(MILESTONES, 'utf8').trim().split('\n').slice(1).filter(Boolean).map(l => { const [date, kind, ...rest] = l.split(','); return { t: Date.parse(date), kind, label: rest.join(',').trim() }; }).sort((a, b) => a.t - b.t) : [];
const t0 = Math.min(...rows.map(r => r.t)), t1 = Math.max(...rows.map(r => r.t), ...milestones.map(m => m.t));
const x = t => L + (t - t0) / (t1 - t0 || 1) * (W - L - R);
const fmt = v => v >= 1e6 ? (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : v >= 1e4 ? Math.round(v / 1e3) + 'k' : v >= 1e3 ? (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'k' : String(v);
const nice = max => { const p = 10 ** Math.floor(Math.log10(max || 1)); for (const s of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (s * p >= max) return s * p; return 10 * p; };
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// milestone labels sit in lanes above the first panel; a label moves down a lane when it would overlap
const lanes = [];
for (const m of milestones) {
	const w = m.label.length * 6.2 + 10, left = x(m.t) - w / 2;
	let lane = lanes.findIndex(end => end < left);
	if (lane < 0) { lane = lanes.length; lanes.push(0); }
	lanes[lane] = left + w; m.lane = lane;
}
const TOP = 30 + lanes.length * LANE;
const H = TOP + PANELS.length * PH + (PANELS.length - 1) * GAP + AXIS;
const axisY = TOP + PANELS.length * PH + (PANELS.length - 1) * GAP + 18;

let body = '';
PANELS.forEach((p, i) => {
	const y0 = TOP + i * (PH + GAP);
	const data = p.series.map(s => ({ s, pts: rows.filter(r => r.m === s.metric).sort((a, b) => a.t - b.t) }));
	if (p.stars) { // one stacked bar per month, keyed by month
		const months = new Map();
		for (const { s, pts } of data) for (const r of pts) { const k = r.d.slice(0, 7); if (!months.has(k)) months.set(k, { t: Date.parse(k + '-01'), up: 0, down: 0, parts: [] }); const m = months.get(k); m.parts.push({ s, v: r.v }); if (s.up) m.up += r.v; else m.down += r.v; }
		const upMax = nice(Math.max(1, ...[...months.values()].map(m => m.up)) * 1.08), downMax = nice(Math.max(1, ...[...months.values()].map(m => m.down)) * 1.08);
		const y = v => y0 + PH * upMax / (upMax + downMax) - v / (upMax + downMax) * PH;
		const bw = Math.max(1, (W - L - R) / ((t1 - t0) / (30.44 * 864e5)) - 1);
		body += `<text class="title" x="${L}" y="${y0 - 16}" fill="${p.series[0].color}">${esc(p.label)}</text>`;
		for (const v of [upMax, upMax / 2, 0, -downMax / 2, -downMax]) body += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"${v ? '' : ' stroke-opacity=".8"'}/><text class="tick" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v < 0 ? '-' + -v : v}</text>`;
		let last;
		for (const m of [...months.values()].sort((a, b) => a.t - b.t)) {
			let up = 0, down = 0;
			for (const { s, v } of m.parts) {
				const top = s.up ? up + v : -down, bottom = s.up ? up : -down - v;
				const bx = Math.max(L, x(m.t)), bwid = Math.max(1, x(m.t) + bw - bx); // the first month may start before the axis
				body += `<rect x="${bx.toFixed(1)}" y="${y(top).toFixed(1)}" width="${bwid.toFixed(1)}" height="${(y(bottom) - y(top)).toFixed(1)}" fill="${s.color}"/>`;
				if (s.up) up += v; else down += v;
			}
			last = m;
		}
		if (last) body += `<text class="value" x="${x(last.t) + bw + 6}" y="${y(last.up) + 4}" fill="${p.series[0].color}">${last.up}</text>`;
		let lx = L + p.label.length * 7.5 + 24;
		for (const s of p.series) { body += `<rect x="${lx}" y="${y0 - 25}" width="10" height="10" fill="${s.color}"/><text class="tick" x="${lx + 14}" y="${y0 - 16}">${esc(s.name)}</text>`; lx += 14 + s.name.length * 6.2 + 12; }
		return;
	}
	const min = p.min || 0;
	const max = p.max || nice(Math.max(1, ...data.flatMap(d => d.pts.map(r => r.v))) * 1.08);
	const y = v => y0 + PH - (v - min) / (max - min) * PH;
	const tick = v => p.max ? v.toFixed(1) : fmt(v);
	body += `<text class="title" x="${L}" y="${y0 - 16}" fill="${p.series[0].color}">${esc(p.label)}</text>`;
	for (const f of [0, 0.5, 1]) {
		const v = min + (max - min) * f;
		body += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="tick" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${tick(v)}</text>`;
	}
	const labels = [];
	for (const { s, pts } of data) {
		if (!pts.length) continue;
		const last = pts.at(-1);
		const line = pts.map((r, k) => `${k ? 'L' : 'M'}${x(r.t).toFixed(1)},${y(r.v).toFixed(1)}`).join('');
		if (s.area) body += `<path d="${line}L${x(last.t).toFixed(1)},${y(min)}L${x(pts[0].t).toFixed(1)},${y(min)}Z" fill="${s.color}" fill-opacity="0.14"/>`;
		body += `<path d="${line}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round"/>`;
		body += `<circle cx="${x(last.t)}" cy="${y(last.v)}" r="3" fill="${s.color}"/>`;
		labels.push({ x: x(last.t) + 8, y: y(last.v) + 4, text: p.max ? last.v.toFixed(2) : s.exact ? String(last.v) : fmt(last.v), color: s.color });
	}
	// keep the end labels of one panel from sitting on each other
	labels.sort((a, b) => a.y - b.y);
	for (let k = 1; k < labels.length; k++) if (labels[k].y - labels[k - 1].y < 13) labels[k].y = labels[k - 1].y + 13;
	for (const l of labels) body += `<text class="value" x="${l.x}" y="${l.y}" fill="${l.color}">${l.text}</text>`;
	if (p.series.length > 1) { // legend in the title row
		let lx = L + p.label.length * 7.5 + 24;
		for (const s of p.series) {
			body += `<line x1="${lx}" x2="${lx + 14}" y1="${y0 - 20}" y2="${y0 - 20}" stroke="${s.color}" stroke-width="2"/><text class="tick" x="${lx + 18}" y="${y0 - 16}">${esc(s.name)}</text>`;
			lx += 18 + s.name.length * 6.2 + 14;
		}
	}
});
for (let yr = new Date(t0).getUTCFullYear() + 1; yr <= new Date(t1).getUTCFullYear(); yr++) {
	const t = Date.UTC(yr, 0, 1);
	body += `<line class="grid" x1="${x(t)}" x2="${x(t)}" y1="${TOP}" y2="${axisY - 12}" stroke-dasharray="2 4"/><text class="tick" x="${x(t)}" y="${axisY}" text-anchor="middle">${yr}</text>`;
}
for (const m of milestones) {
	const mx = x(m.t).toFixed(1), ly = 14 + m.lane * LANE, color = m.kind === 'release' ? RELEASE : GREY;
	body += `<line x1="${mx}" x2="${mx}" y1="${ly + 4}" y2="${axisY - 12}" stroke="${color}" stroke-opacity=".9" stroke-width="1" stroke-dasharray="3 3"/>`;
	body += `<text class="milestone" x="${mx}" y="${ly}" text-anchor="middle" fill="${color}">${esc(m.label)}</text>`;
}
const updated = rows.reduce((a, r) => r.d > a ? r.d : a, '');
body += `<text class="tick" x="${W - R}" y="${axisY}" text-anchor="end" dx="${R - 4}">updated ${updated}</text>`;

fs.writeFileSync(SVG, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="-apple-system, Segoe UI, Helvetica, Arial, sans-serif">
<style>
.title{font-size:13px;font-weight:600}.tick{font-size:11px;fill:${GREY};font-variant-numeric:tabular-nums}.value{font-size:12px;font-weight:600}.milestone{font-size:11px;font-weight:600}.grid{stroke:${GREY};stroke-opacity:.35;stroke-width:1}
</style>
${body}
</svg>
`);
console.log('wrote', SVG.pathname, rows.length, 'rows,', milestones.length, 'milestones, height', H);
