// Draws docs/stats/history.csv as docs/stats/users.svg: three panels (Chrome users,
// Firefox users, GitHub stars) on one shared time axis. Mid-tone colours, so it reads on
// GitHub's light and dark backgrounds alike (an <img> SVG cannot see GitHub's theme).
import fs from 'node:fs';

const CSV = new URL('../../docs/stats/history.csv', import.meta.url);
const SVG = new URL('../../docs/stats/users.svg', import.meta.url);
const PANELS = [
	{ metric: 'chrome_users', label: 'Chrome weekly users', color: '#3b78e7' },
	{ metric: 'firefox_users', label: 'Firefox users', color: '#e8743b' },
	{ metric: 'stars', label: 'GitHub stars', color: '#c9a227' },
];
const W = 820, PH = 130, GAP = 48, L = 64, R = 70, TOP = 30, AXIS = 26;
const H = TOP + PANELS.length * PH + (PANELS.length - 1) * GAP + AXIS;

const rows = fs.readFileSync(CSV, 'utf8').trim().split('\n').slice(1).map(l => { const [d, m, v] = l.split(','); return { t: Date.parse(d), d, m, v: +v }; });
const t0 = Math.min(...rows.map(r => r.t)), t1 = Math.max(...rows.map(r => r.t));
const x = t => L + (t - t0) / (t1 - t0 || 1) * (W - L - R);
const fmt = v => v >= 1e6 ? (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : v >= 1e4 ? Math.round(v / 1e3) + 'k' : v >= 1e3 ? (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'k' : String(v);
const nice = max => { const p = 10 ** Math.floor(Math.log10(max || 1)); for (const s of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (s * p >= max) return s * p; return 10 * p; };

let body = '';
PANELS.forEach((p, i) => {
	const pts = rows.filter(r => r.m === p.metric).sort((a, b) => a.t - b.t);
	const y0 = TOP + i * (PH + GAP), max = nice(Math.max(1, ...pts.map(r => r.v)) * 1.08);
	const y = v => y0 + PH - v / max * PH;
	body += `<text class="title" x="${L}" y="${y0 - 16}" fill="${p.color}">${p.label}</text>`;
	for (const f of [0, 0.5, 1]) body += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(max * f)}" y2="${y(max * f)}"/><text class="tick" x="${L - 8}" y="${y(max * f) + 4}" text-anchor="end">${fmt(max * f)}</text>`;
	if (!pts.length) return;
	const line = pts.map((r, k) => k ? (p.step ? `H${x(r.t).toFixed(1)}V${y(r.v).toFixed(1)}` : `L${x(r.t).toFixed(1)},${y(r.v).toFixed(1)}`) : `M${x(r.t).toFixed(1)},${y(r.v).toFixed(1)}`).join('');
	body += `<path d="${line}L${x(pts.at(-1).t).toFixed(1)},${y(0)}L${x(pts[0].t).toFixed(1)},${y(0)}Z" fill="${p.color}" fill-opacity="0.14"/>`;
	body += `<path d="${line}" fill="none" stroke="${p.color}" stroke-width="2" stroke-linejoin="round"/>`;
	const last = pts.at(-1);
	body += `<circle cx="${x(last.t)}" cy="${y(last.v)}" r="3.5" fill="${p.color}"/><text class="value" x="${x(last.t) + 8}" y="${y(last.v) + 4}">${fmt(last.v)}</text>`;
});
const axisY = TOP + PANELS.length * PH + (PANELS.length - 1) * GAP + 18;
for (let yr = new Date(t0).getUTCFullYear() + 1; yr <= new Date(t1).getUTCFullYear(); yr++) {
	const t = Date.UTC(yr, 0, 1);
	body += `<line class="grid" x1="${x(t)}" x2="${x(t)}" y1="${TOP}" y2="${axisY - 12}" stroke-dasharray="2 4"/><text class="tick" x="${x(t)}" y="${axisY}" text-anchor="middle">${yr}</text>`;
}
const updated = rows.reduce((a, r) => r.d > a ? r.d : a, '');
body += `<text class="tick" x="${W - R}" y="${axisY}" text-anchor="end" dx="${R - 4}">updated ${updated}</text>`;

fs.writeFileSync(SVG, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="-apple-system, Segoe UI, Helvetica, Arial, sans-serif">
<style>
.title{font-size:13px;font-weight:600}.tick{font-size:11px;fill:#848d97;font-variant-numeric:tabular-nums}.value{font-size:12px;font-weight:600;fill:#848d97}.grid{stroke:#848d97;stroke-opacity:.35;stroke-width:1}
</style>
${body}
</svg>
`);
console.log('wrote', SVG.pathname, rows.length, 'rows');
