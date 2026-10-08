"use strict";

import type { ColorKey, IconFamily, IconPart } from "../types.ts";

// F: family D (flat.ts) in a calmer palette. The colours follow the old
// images (coral close / delete, lime minimize / restore, soft blue add, warm
// gold star): softer and warmer than D, still clearly red / green / blue at
// 16px. Same ink outline and highlights as D. "new" is a browser window with
// a plus, "colors" a window with a coloured title bar and a pencil, "discard"
// the old diagonal RAM stick. Parts paint in the listed order: fills,
// details, highlights, the ink outline last.

const n = (v : number) : string => String(+v.toFixed(3));

// rounded rectangle, top left (x, y), size w x h, corner r
function rr(x : number, y : number, w : number, h : number, r = 0) : string {
	if (!r) return "M" + n(x) + " " + n(y) + "h" + n(w) + "v" + n(h) + "h" + n(-w) + "z";
	return "M" + n(x + r) + " " + n(y) + "h" + n(w - 2 * r) + "a" + n(r) + " " + n(r) + " 0 0 1 " + n(r) + " " + n(r)
		+ "v" + n(h - 2 * r) + "a" + n(r) + " " + n(r) + " 0 0 1 " + n(-r) + " " + n(r)
		+ "h" + n(-(w - 2 * r)) + "a" + n(r) + " " + n(r) + " 0 0 1 " + n(-r) + " " + n(-r)
		+ "v" + n(-(h - 2 * r)) + "a" + n(r) + " " + n(r) + " 0 0 1 " + n(r) + " " + n(-r) + "z";
}

// circle centred on (cx, cy)
function circ(cx : number, cy : number, r : number) : string {
	return "M" + n(cx - r) + " " + n(cy) + "a" + n(r) + " " + n(r) + " 0 1 0 " + n(2 * r) + " 0a" + n(r) + " " + n(r) + " 0 1 0 " + n(-2 * r) + " 0z";
}

type Pt = [number, number];

// a closed polygon through the points
const poly = (pts : Pt[]) : string => "M" + pts.map(([x, y]) => n(x) + " " + n(y)).join("L") + "z";
const open = (pts : Pt[]) : string => "M" + pts.map(([x, y]) => n(x) + " " + n(y)).join("L");

// points turned by `deg` (clockwise on screen) around (cx, cy), then moved by (dx, dy)
function turn(pts : Pt[], deg : number, cx = 8, cy = 8, dx = 0, dy = 0) : Pt[] {
	const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
	return pts.map(([x, y]) => [cx + dx + (x - cx) * c - (y - cy) * s, cy + dy + (x - cx) * s + (y - cy) * c]);
}
// an axis-aligned rectangle as points, to turn
const box = (x : number, y : number, w : number, h : number) : Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

const fill = (d : string, color : ColorKey, opacity? : number) : IconPart => opacity === undefined ? { kind: "fill", d, color } : { kind: "fill", d, color, opacity };
const line = (d : string, color : ColorKey, width : number, opacity? : number) : IconPart => opacity === undefined ? { kind: "stroke", d, color, width } : { kind: "stroke", d, color, width, opacity };
const ink = (d : string, width = 1) : IconPart => ({ kind: "stroke", d, color: "ink", width });
// the layout tiles get a darker blue edge instead of ink, so they read as solid blue tiles
const rim = (d : string, width = 1) : IconPart => line(d, "blue-soft-dark", width);

// an X centred on (8, 8): arm tips e from the centre, arms 2k·√2 wide
function cross(e : number, k : number, cx = 8, cy = 8) : string {
	return poly([[cx - e + k, cy - e - k], [cx, cy - 2 * k], [cx + e - k, cy - e - k], [cx + e + k, cy - e + k], [cx + 2 * k, cy],
		[cx + e + k, cy + e - k], [cx + e - k, cy + e + k], [cx, cy + 2 * k], [cx - e + k, cy + e + k], [cx - e - k, cy + e - k],
		[cx - 2 * k, cy], [cx - e - k, cy - e + k]]);
}

// the round buttons: a coloured disc, a lighter crescent on the left, the white glyph, the ink rim
const DISC = circ(8, 8, 6.5);
// left crescent between the disc (r 6) and the same disc 1.6 to the right
const CRESCENT = "M8.8 2.053A6 6 0 0 0 8.8 13.947A6 6 0 0 1 8.8 2.053z";
function disc(color : ColorKey, glyph : IconPart[]) : IconPart[] {
	return [fill(DISC, color), fill(CRESCENT, "white", 0.3), ...glyph, ink(DISC)];
}

// the five-pointed star, centre (8, 8.85), points R 7.4, valleys r 3.6
const STAR_PTS : Pt[] = Array.from({ length: 10 }, (_, i) => {
	const r = i % 2 ? 3.6 : 7.4, a = (i * 36 - 90) * Math.PI / 180;
	return [8 + r * Math.cos(a), 8.85 + r * Math.sin(a)];
});
const STAR = poly(STAR_PTS);
// its right half: the top point round to the bottom valley
const STAR_RIGHT = poly(STAR_PTS.slice(0, 6));

// the push pin, drawn upright (cap on top, needle down) and turned 45° so the cap points up-right
const PIN_UP = {
	cap: [[4, 1.2], [12, 1.2], [12, 4.2], [4, 4.2]] as Pt[],
	neck: [[5.8, 4.2], [10.2, 4.2], [10.4, 7.6], [5.6, 7.6]] as Pt[],
	base: [[3.6, 7.6], [12.4, 7.6], [12.4, 9.9], [3.6, 9.9]] as Pt[],
	needle: [[8, 9.9], [8, 15]] as Pt[],
};
const pin = (pts : Pt[]) => turn(pts, 45, 8, 8, -0.9, 1);
// coral head (cap and neck) on a soft blue base, like the old red + blue pin
const PIN_HEAD = poly(pin(PIN_UP.cap)) + poly(pin(PIN_UP.neck));
const PIN_BASE = poly(pin(PIN_UP.base));
const PIN_BODY = PIN_HEAD + PIN_BASE;
// the shadow side (lower right once turned): right half of the neck and of the base
const PIN_SHADE_HEAD = poly(pin([[8, 4.2], [10.2, 4.2], [10.4, 7.6], [8, 7.6]]));
const PIN_SHADE_BASE = poly(pin([[8, 7.6], [12.4, 7.6], [12.4, 9.9], [8, 9.9]]));
const PIN_NEEDLE = open(pin(PIN_UP.needle));

// a browser window: frame, title bar (to y 5.5), content
const WIN = rr(1.5, 2, 13, 12, 1.2);
const WIN_BAR = "M2.7 2h10.6a1.2 1.2 0 0 1 1.2 1.2V5.5H1.5V3.2a1.2 1.2 0 0 1 1.2 -1.2z";
// "colors": a taller title bar (to y 7) in the window's colour, a white name line on it
const NAME_BAR = "M2.7 2h10.6a1.2 1.2 0 0 1 1.2 1.2V7H1.5V3.2a1.2 1.2 0 0 1 1.2 -1.2z";

// the pencil of "colors": drawn lying (tip at the origin, pointing left, 11 long, 3.2 thick)
// and turned -45° with its tip at (6.2, 14.6), so it writes down-left over the window's corner
const pencil = (pts : Pt[]) => turn(pts, -45, 0, 0, 6.2, 14.6);
const PENCIL_BODY = poly(pencil(box(2.6, -1.6, 6.8, 3.2)));
const PENCIL_SHADE = poly(pencil(box(2.6, 0.2, 6.8, 1.4)));
const PENCIL_END = poly(pencil(box(9.4, -1.6, 1.6, 3.2)));
const PENCIL_TIP = poly(pencil([[0, 0], [2.6, -1.6], [2.6, 1.6]]));
const PENCIL_LEAD = poly(pencil([[0, 0], [1.1, -0.7], [1.1, 0.7]]));
const PENCIL = poly(pencil([[0, 0], [2.6, -1.6], [11, -1.6], [11, 1.6], [2.6, 1.6]]));

// the RAM stick of "discard", like the old ram64.png: drawn lying (14 x 7.2,
// contacts along the bottom) and turned -45° so it runs from bottom left to
// top right with the gold contacts on the lower right edge
const ram = (pts : Pt[]) => turn(pts, -45, 8, 8);
const RAM_L = 1, RAM_R = 15, RAM_TOP = 4.4, RAM_BOT = 11.6, RAM_MID = 7.4;
// the board: a clip notch in both short ends, the key notch (x 7.7..8.9) in the contact edge
const RAM_BOARD = poly(ram([
	[RAM_L, RAM_TOP], [RAM_R, RAM_TOP], [RAM_R, RAM_MID - 0.6], [RAM_R - 0.8, RAM_MID], [RAM_R, RAM_MID + 0.6], [RAM_R, RAM_BOT],
	[8.9, RAM_BOT], [8.9, RAM_BOT - 0.8], [7.7, RAM_BOT - 0.8], [7.7, RAM_BOT],
	[RAM_L, RAM_BOT], [RAM_L, RAM_MID + 0.6], [RAM_L + 0.8, RAM_MID], [RAM_L, RAM_MID - 0.6],
]));
// three chips (the old one has four), 3 x 2.4 with 1.2 gaps, a band of board above and below
// them so at 16px the board shows round the chips instead of chips filling the stick
const RAM_CHIPS = [2.3, 6.5, 10.7].map((x) => poly(ram(box(x, RAM_TOP + 1.3, 3, 2.4)))).join("");
// the gold contacts, 2.2 thick, either side of the key notch
const RAM_CONTACTS = poly(ram(box(1.9, 9.2, 5.5, 2.2))) + poly(ram(box(9.2, 9.2, 4.9, 2.2)));

// the eye of "filter"
const EYE = "M1 8C3 4.3 5.3 3 8 3C10.7 3 13 4.3 15 8C13 11.7 10.7 13 8 13C5.3 13 3 11.7 1 8z";
// its strike-through, top left to bottom right
const STRIKE = "M2.2 2.2L13.8 13.8";
const EYE_PARTS : IconPart[] = [
	fill(EYE, "white"),
	fill(circ(8, 8, 3.1), "blue-soft"), fill(circ(8, 8, 1.4), "ink"), fill(circ(9.2, 6.8, 0.7), "white"),
	ink(EYE),
];

// the wrench of "options": head with an open jaw (top right), handle with a round end
const WRENCH_HEAD = "M14.124 3.574A3.7 3.7 0 1 1 12.426 1.876L10.163 4.139L11.861 5.837z";
const WRENCH_HANDLE = "M8.369 5.369L2.069 11.669A1.6 1.6 0 0 0 4.331 13.931L10.631 7.631z";
const WRENCH_SHADE = "M9.5 6.5L10.631 7.631L4.331 13.931A1.6 1.6 0 0 1 2.069 13.931L9.5 6.5z";

const HEART = "M8 14.2L2.6 8.9C1 7.3 1 4.6 2.7 3.1C4.3 1.7 6.7 2 8 3.8C9.3 2 11.7 1.7 13.3 3.1C15 4.6 15 7.3 13.4 8.9z";

// the bin of "trash", under a lid at y 3.5..6.5
const BIN = "M3.5 6.5h9l-.8 7.2a1 1 0 0 1 -1 .8H5.3a1 1 0 0 1 -1 -.8z";

const PAGE = "M2.5 1.5h7l4 4v9h-11z";

const tiles = (xs : number[], ys : number[], w : number, h : number, r : number) => ys.flatMap((y) => xs.map((x) => rr(x, y, w, h, r))).join("");

// ---- the options screen icons ----

// a path whose commands are all absolute x y pairs (M L C), scaled by s about (ox, oy) and moved to (x, y)
function place(d : string, s : number, ox : number, oy : number, x : number, y : number) : string {
	let i = 0;
	return d.replace(/-?\d*\.?\d+/g, (v) => n(i++ % 2 ? y + (+v - oy) * s : x + (+v - ox) * s));
}

// the title bar of a window rr(x, y, w, ·, r): rounded top corners, down to y + h
function bar(x : number, y : number, w : number, h : number, r : number) : string {
	return "M" + n(x + r) + " " + n(y) + "h" + n(w - 2 * r) + "a" + n(r) + " " + n(r) + " 0 0 1 " + n(r) + " " + n(r)
		+ "V" + n(y + h) + "H" + n(x) + "V" + n(y + r) + "a" + n(r) + " " + n(r) + " 0 0 1 " + n(r) + " " + n(-r) + "z";
}

// a window as parts: white body, coloured title bar, ink frame and bar line
function win(x : number, y : number, w : number, h : number, barH : number, barColor : ColorKey, body : ColorKey = "white", r = 1) : IconPart[] {
	return [fill(rr(x, y, w, h, r), body), fill(bar(x, y, w, barH, r), barColor), ink(rr(x, y, w, h, r)), ink("M" + n(x) + " " + n(y + barH) + "H" + n(x + w), 0.8)];
}

// a star: points R, valleys r, centre (cx, cy)
const star = (cx : number, cy : number, R : number, r = R * 0.48) : string => poly(Array.from({ length: 10 }, (_, i) => {
	const k = i % 2 ? r : R, a = (i * 36 - 90) * Math.PI / 180;
	return [cx + k * Math.cos(a), cy + k * Math.sin(a)] as Pt;
}));
// a four-pointed sparkle
const sparkle = (cx : number, cy : number, R : number, r = R * 0.3) : string => poly(Array.from({ length: 8 }, (_, i) => {
	const k = i % 2 ? r : R, a = (i * 45 - 90) * Math.PI / 180;
	return [cx + k * Math.cos(a), cy + k * Math.sin(a)] as Pt;
}));

// the extension's own mark (images/browsers.svg): three cascading windows, amber at the back, lime, coral in front
function mark(x : number, y : number, w : number, h : number, step : number, barH : number, width = 0.8) : IconPart[] {
	return (["amber", "lime", "coral"] as ColorKey[]).flatMap((c, i) => {
		const o = (2 - i) * step;
		return [fill(rr(x + o, y + o, w, h, 0.6), c), ...(barH ? [fill(bar(x + o, y + o, w, barH, 0.6), "steel")] : []), ink(rr(x + o, y + o, w, h, 0.6), width)];
	});
}

// a lightning bolt, on the key cap of "shortcuts"
const BOLT = poly([[9.6, 2.6], [4.6, 7.6], [7.4, 7.6], [6.2, 11.6], [11.3, 6.2], [8.4, 6.2]]);

// a browser tab with rounded top corners, x .. x + TAB_W, y TAB_TOP .. bottom; `openBottom`
// leaves out the bottom edge. The edges sit on pixel centres so the tabs stay crisp at 16px
const TAB_TOP = 5.5, TAB_BOT = 11.5, TAB_W = 5, TAB_R = 1.5;
function tab(x : number, openBottom = false, bottom = TAB_BOT) : string {
	const d = "M" + n(x) + " " + n(bottom) + "V" + n(TAB_TOP + TAB_R) + "a" + n(TAB_R) + " " + n(TAB_R) + " 0 0 1 " + n(TAB_R) + " " + n(-TAB_R)
		+ "h" + n(TAB_W - 2 * TAB_R) + "a" + n(TAB_R) + " " + n(TAB_R) + " 0 0 1 " + n(TAB_R) + " " + n(TAB_R) + "V" + n(bottom);
	return openBottom ? d : d + "z";
}
// the line the tabs stand on
const TAB_LINE = "M0.5 " + n(TAB_BOT) + "H13";

// a key cap seen from a little above: a darker skirt, a white top face
const KEY = rr(1.5, 1.5, 13, 13, 2.2);
const KEY_FACE = rr(3, 2.4, 10, 9.4, 1.5);
const keycap = (glyph : IconPart[]) : IconPart[] => [fill(KEY, "steel"), fill(KEY_FACE, "white"), line(KEY_FACE, "grey", 0.6), ...glyph, ink(KEY)];

// the mouse: 9 x 13, left edge at x, buttons split at y 7, the wheel between them
const MOUSE_W = 9, MOUSE_SPLIT = 7;
function mouse(x : number, button : "right" | "middle") : IconPart[] {
	const c = x + MOUSE_W / 2, R = x + MOUSE_W, k = 1.6, S = MOUSE_SPLIT;
	const body = "M" + n(c) + " 1.5C" + n(R - k) + " 1.5 " + n(R) + " 3.3 " + n(R) + " 5.9V10.1C" + n(R) + " 12.7 " + n(R - k) + " 14.5 " + n(c) + " 14.5C"
		+ n(x + k) + " 14.5 " + n(x) + " 12.7 " + n(x) + " 10.1V5.9C" + n(x) + " 3.3 " + n(x + k) + " 1.5 " + n(c) + " 1.5z";
	const right = "M" + n(c) + " 1.5C" + n(R - k) + " 1.5 " + n(R) + " 3.3 " + n(R) + " 5.9V" + n(S) + "H" + n(c) + "z";
	// the clicked wheel is bigger (3 x 4, its coral two clean pixels wide at 16px), so it
	// reads as a wheel and not as a filled button like mouse-right
	const wheel = button === "middle" ? rr(c - 1.5, 2.5, 3, 4, 1.5) : rr(c - 1, 3, 2, 3.2, 1);
	return [
		fill(body, "white"),
		fill("M" + n(R - 1.6) + " " + n(S) + "H" + n(R) + "V10.1C" + n(R) + " 12.7 " + n(R - k) + " 14.5 " + n(c) + " 14.5z", "grey-light"),
		...(button === "right" ? [fill(right, "coral")] : []),
		ink("M" + n(x) + " " + n(S) + "H" + n(R) + "M" + n(c) + " 1.5V" + n(S), 0.8),
		fill(wheel, button === "middle" ? "coral" : "steel"), ink(wheel, 0.7),
		ink(body),
	];
}

// the clock of "recent": a thick peach rim around a white face, hands on whole pixels (the
// minute hand the 1-wide column at mx, up from the hub; the hour hand 2 high from the hub
// row hy, to the right), over a three-step meter: levels 1..3 light one more coral step.
// Off is the same clock over three faint steps. The steps echo the list view's freshness bars.
function face(cx : number, cy : number, R : number, mx : number, hy : number, minute = 3, hour = 3) : IconPart[] {
	return [
		fill(circ(cx, cy, R), "peach"), fill(circ(cx, cy, R - 1.6), "white"),
		fill(rr(mx, hy + 1 - minute, 1, minute + 1), "ink"), fill(rr(mx, hy, hour + 1, 2), "ink"),
		ink(circ(cx, cy, R)),
	];
}
const METER = [0, 6, 12];
const clock = (level : number) : IconPart[] => [
	...face(8, 6, 5.5, 7, 5),
	...METER.map((x, i) => i < level ? fill(rr(x, 13, 4, 3, 1), "coral") : fill(rr(x, 13, 4, 3, 1), "grey", 0.45)),
];

// the sun of "theme-light": the warm-gold half of "theme" made whole, eight rays
const SUN_RAYS = Array.from({ length: 8 }, (_, i) => open(turn([[8, 2.9], [8, 1.2]], i * 45))).join("");
// the crescent moon of "theme-dark": disc (cx, cy, r) less a disc (kx, ky, kr) cut from its upper right
function crescent(cx : number, cy : number, r : number, kx : number, ky : number, kr : number) : string {
	const d = Math.hypot(kx - cx, ky - cy), ux = (kx - cx) / d, uy = (ky - cy) / d;
	const a = (r * r - kr * kr + d * d) / (2 * d), h = Math.sqrt(r * r - a * a);
	const mx = cx + a * ux, my = cy + a * uy;
	const p1 : Pt = [mx - h * uy, my + h * ux], p2 : Pt = [mx + h * uy, my - h * ux];
	return "M" + n(p1[0]) + " " + n(p1[1]) + "A" + n(r) + " " + n(r) + " 0 1 1 " + n(p2[0]) + " " + n(p2[1])
		+ "A" + n(kr) + " " + n(kr) + " 0 " + (d - a < 0 ? 1 : 0) + " 0 " + n(p1[0]) + " " + n(p1[1]) + "z";
}
const MOON = crescent(7.3, 8.7, 5.6, 10.8, 5.2, 4.3);
// a lit band just inside its outer edge (lower left), so it holds on a dark background too
const MOON_LIT = "M" + [205, 65].map((deg) => { const a = deg * Math.PI / 180; return n(7.3 + 4.5 * Math.cos(a)) + " " + n(8.7 + 4.5 * Math.sin(a)); }).join("A4.5 4.5 0 0 0 ");

// a page with a folded corner, x 1.5..10.5
const DOC = "M1.5 1.5h6l3 3v10h-9z";
const doc = () : IconPart[] => [fill(DOC, "white"), fill("M7.5 1.5v3h3z", "grey-light"), line("M3.5 7H8.5M3.5 9H6", "grey", 1), ink(DOC), ink("M7.5 1.5v3h3", 0.8)];
// the page of "export-settings" / "import-settings": two slider tracks with a knob each, where the
// sessions' page has its text lines
const sliders = () : IconPart[] => [
	fill(DOC, "white"), fill("M7.5 1.5v3h3z", "grey-light"),
	line("M3.5 6.6H8.5M3.5 8.6H8.5", "grey", 0.9),
	fill(circ(5.2, 6.6, 1), "amber"), fill(circ(7, 8.6, 1), "coral"),
	ink(circ(5.2, 6.6, 1), 0.6), ink(circ(7, 8.6, 1), 0.6),
	ink(DOC), ink("M7.5 1.5v3h3", 0.8),
];
// a fat arrow from x0 to the tip at x1 (either way), centred on y
function arrow(x0 : number, x1 : number, y : number, shaft = 1.5, head = 3.3, headLen = 3.6) : string {
	const s = Math.sign(x1 - x0), b = x1 - s * headLen;
	return poly([[x0, y - shaft], [b, y - shaft], [b, y - head], [x1, y], [b, y + head], [b, y + shaft], [x0, y + shaft]]);
}

export const family : IconFamily = {
	id: "muted",
	label: "F — flat muted",
	scope: "all",
	icons: {
		"save": { parts: [
			fill(STAR, "amber"), fill(STAR_RIGHT, "amber-dark"),
			fill(circ(6.3, 6.9, 0.8), "white", 0.7),
			ink(STAR),
		] },
		"restore": { parts: disc("lime", [line("M4.9 8.2L7.1 10.4L11.2 6.2", "white", 2.2)]) },
		"delete": { parts: [
			fill(cross(5, 1.5), "coral"),
			ink(cross(5, 1.5), 0.9),
		] },
		"add": { parts: disc("blue-soft", [line("M8 4.6V11.4M4.6 8H11.4", "white", 2)]) },
		"close": { parts: disc("coral", [line("M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5", "white", 2)]) },
		"minimize": { parts: disc("lime", [line("M8 4.4V11M5.2 8.4L8 11.2L10.8 8.4", "white", 2.2)]) },
		"maximize": { parts: disc("lime", [line("M8 11.6V5M5.2 7.6L8 4.8L10.8 7.6", "white", 2.2)]) },
		"colors": { parts: [
			// this window's name (the white line) on its colour (the title bar), and a pencil to change them
			fill(WIN, "white"), fill(NAME_BAR, "blue-soft"), line("M3.6 4.5H8.6", "white", 1.4),
			// a second colour, a coral swatch on the bar (pixel-aligned, no rim, so it stays crisp at 16px): "colour", not just a blue window
			fill(rr(10, 3, 3, 3, 0.5), "coral"),
			ink(WIN),
			fill(PENCIL_BODY, "amber"), fill(PENCIL_SHADE, "amber-dark"), fill(PENCIL_END, "steel"),
			fill(PENCIL_TIP, "cream"), fill(PENCIL_LEAD, "ink"),
			ink(PENCIL, 0.9),
		] },
		"new": { parts: [
			// a new browser window: grey title bar with three dots, a plus badge
			fill(WIN, "white"), fill(WIN_BAR, "steel"),
			fill(circ(3.5, 3.75, 0.8), "coral"), fill(circ(5.7, 3.75, 0.8), "amber-dark"), fill(circ(7.9, 3.75, 0.8), "lime-dark"),
			ink(WIN), ink("M1.5 5.5H14.5", 0.8),
			fill(circ(11.8, 11.8, 3.4), "lime-dark"), line("M11.8 10V13.6M10 11.8H13.6", "white", 1.6), ink(circ(11.8, 11.8, 3.4)),
		] },
		"save-tabs": { parts: [
			// the selected tabs saved as a window: a window with its tab lines, the gold star of "save" as a badge
			...win(1.5, 2, 12, 10.5, 3, "blue-soft", "white", 1.2),
			line("M3.8 7H10M3.8 9.4H7", "grey", 1),
			fill(star(11.2, 11.3, 4.5), "amber"), ink(star(11.2, 11.3, 4.5), 0.9),
		] },
		"trash": { parts: [
			fill(BIN, "slate"), fill("M4.6 6.5H6.2L6.6 14.5H5.3a1 1 0 0 1 -1 -.8z", "steel", 0.45),
			line("M7 8.5V12.5M10 8.5V12.5", "steel", 1),
			ink(BIN),
			fill(rr(5.5, 1.5, 5, 2, 0.5), "coral"), ink(rr(5.5, 1.5, 5, 2, 0.5)),
			fill(rr(1.5, 3.5, 13, 3, 0.6), "grey-light"), ink(rr(1.5, 3.5, 13, 3, 0.6)),
		] },
		"discard": { parts: [
			fill(RAM_BOARD, "lime"), fill(RAM_CHIPS, "slate"), fill(RAM_CONTACTS, "amber"),
			ink(RAM_BOARD),
		] },
		"pin": { parts: [
			// the ink under-strokes first: the fills on top leave one outline round the whole pin
			line(PIN_NEEDLE, "ink", 2.4), ink(PIN_BODY, 2),
			line(PIN_NEEDLE, "sky-soft", 1),
			fill(PIN_HEAD, "coral"), fill(PIN_BASE, "blue-soft"), fill(PIN_SHADE_HEAD, "coral-dark"), fill(PIN_SHADE_BASE, "blue-soft-dark"),
			line(open(pin([[5.2, 2.3], [8, 2.3]])), "white", 1, 0.7),
		] },
		"duplicates": { parts: [
			fill(rr(1.5, 1.5, 9, 9, 1), "grey-light"), fill("M2.5 1.5h7a1 1 0 0 1 1 1V4H1.5V2.5a1 1 0 0 1 1 -1z", "amber"), ink(rr(1.5, 1.5, 9, 9, 1)),
			fill(rr(5.5, 5.5, 9, 9, 1), "white"), fill("M6.5 5.5h7a1 1 0 0 1 1 1V8H5.5V6.5a1 1 0 0 1 1 -1z", "blue-soft"),
			fill(rr(2, 5, 3, 2), "peach"), line("M2.5 8.5H4", "grey", 1),
			line("M7.5 9.5V13.5H8.9A1 1 0 0 0 8.9 11.5H7.5M7.5 9.5H8.7A1 1 0 0 1 8.7 11.5", "blue-soft", 1),
			line("M11.5 10.5h1.5M11.5 12.5h1.5", "grey", 1),
			ink(rr(5.5, 5.5, 9, 9, 1)),
		] },
		// "hide tabs that do not match": off shows the open eye, on the same eye struck through
		// (eye-off), the strike coral, ink-edged; one eye geometry so the button does not shift
		"filter": { parts: EYE_PARTS },
		"filter-on": { parts: [
			...EYE_PARTS,
			line(STRIKE, "ink", 2.4), line(STRIKE, "coral", 1.2),
		] },
		"options": { parts: [
			ink(WRENCH_HEAD, 2), ink(WRENCH_HANDLE, 2),
			fill(WRENCH_HEAD, "grey"), fill(WRENCH_HANDLE, "grey"), fill(WRENCH_SHADE, "slate"),
			// a light edge along the handle keeps it metal: darker than D so it holds on white
			line("M3.2 11.7L8.6 6.3", "steel", 0.8),
		] },
		"rate": { parts: [
			fill(HEART, "coral"),
			line("M3.5 6.6C3.5 5.3 4.3 4.5 5.4 4.4", "white", 1, 0.7),
			ink(HEART),
		] },
		"view-big-blocks": { parts: [
			fill(tiles([1.5, 9.5], [1.5, 9.5], 5, 5, 1), "blue-soft"), rim(tiles([1.5, 9.5], [1.5, 9.5], 5, 5, 1)),
		] },
		"view-blocks": { parts: [
			// fills to the pixel grid with a thin rim, so the small tiles read as tiles, not rings
			fill(tiles([1, 6, 11], [1, 6, 11], 4, 4, 0.6), "blue-soft"), rim(tiles([1.3, 6.3, 11.3], [1.3, 6.3, 11.3], 3.4, 3.4, 0.5), 0.6),
		] },
		"view-horizontal": { parts: [
			fill(tiles([1.5], [1.5, 6.5, 11.5], 13, 3, 0.8), "blue-soft"), rim(tiles([1.5], [1.5, 6.5, 11.5], 13, 3, 0.8)),
		] },
		"view-vertical": { parts: [
			fill(tiles([1.5], [1.5, 6.5, 11.5], 3, 3, 0.6), "blue-soft"), rim(tiles([1.5], [1.5, 6.5, 11.5], 3, 3, 0.6)),
			line("M7 3H14M7 8H14M7 13H14", "blue-soft", 2),
		] },
		"favicon": { parts: [
			fill(PAGE, "white"), fill("M9.5 1.5v4h4z", "grey-light"),
			line("M5 8.5H11M5 10.5H11M5 12.5H9", "grey", 1),
			ink(PAGE), ink("M9.5 1.5v4h4"),
		] },
		"recent": { parts: clock(0) },
		// recent's levels: one, two, three steps of the meter lit
		"recent-1": { parts: clock(1) },
		"recent-2": { parts: clock(2) },
		"recent-3": { parts: clock(3) },

		// ---- options screen ----
		"tab-limit": { parts: [
			// a tab strip: two lighter back tabs, the blue active tab open at the bottom
			// (it breaks the line they stand on), then a coral stop bar. Short tabs with
			// round tops a step of 4 apart, so they read as tabs and not as columns
			fill(tab(8.5), "sky-soft"), ink(tab(8.5), 0.8),
			fill(tab(4.5), "sky-soft"), ink(tab(4.5), 0.8),
			ink(TAB_LINE),
			fill(tab(0.5, false, TAB_BOT + 0.5), "blue-soft"), ink(tab(0.5, true)),
			fill(rr(13.5, 2.5, 2, 11, 0.6), "coral"), ink(rr(13.5, 2.5, 2, 11, 0.6)),
		] },
		"popup-width": { parts: [
			...win(1.5, 3.5, 13, 9, 2.5, "steel"),
			line("M3.6 9.3H12.4M5.3 7.6L3.6 9.3L5.3 11M10.7 7.6L12.4 9.3L10.7 11", "blue-soft-dark", 1.3),
		] },
		"popup-height": { parts: [
			...win(3.5, 1.5, 9, 13, 2.5, "steel"),
			line("M8 5.8V12.6M6.3 7.5L8 5.8L9.7 7.5M6.3 10.9L8 12.6L9.7 10.9", "blue-soft-dark", 1.3),
		] },
		"theme": { parts: [
			line("M2.8 8H1.2M3.5 4.6L2.4 3.5M3.5 11.4L2.4 12.5M5.6 2.6L5 1.2M5.6 13.4L5 14.8", "amber-dark", 1.2),
			fill("M8 3.6A4.4 4.4 0 0 0 8 12.4z", "amber"),
			fill("M8 3.6A4.4 4.4 0 0 1 8 12.4z", "slate"), fill(circ(10.1, 6.3, 0.6), "white"),
			ink(circ(8, 8, 4.4)), ink("M8 3.6V12.4", 0.8),
		] },
		// theme's two halves on their own, for the Light and Dark segments
		"theme-light": { parts: [
			line(SUN_RAYS, "amber-dark", 1.2),
			fill(circ(8, 8, 3.7), "amber"), fill(circ(6.7, 6.7, 0.8), "white", 0.7),
			ink(circ(8, 8, 3.7)),
		] },
		"theme-dark": { parts: [
			fill(MOON, "slate"), line(MOON_LIT, "sky-soft", 1.3), fill(circ(6.6, 8.2, 0.8), "white", 0.7),
			ink(MOON),
		] },
		"compact": { parts: [
			// rows pressed together: pixel-aligned fills, like view-blocks, and two coral chevrons pushing in
			fill(tiles([1], [4, 7, 10], 14, 2, 0.6), "blue-soft"),
			line("M5.5 1.2L8 3L10.5 1.2M5.5 14.8L8 13L10.5 14.8", "coral", 1.4),
		] },
		"animations": { parts: [
			// a ball flying right, speed lines behind it
			line("M3 5.5H6M0.8 8H5.4M3 10.5H6", "blue-soft", 1.3),
			fill(circ(11, 8, 4), "coral"), fill(circ(9.7, 6.7, 1.1), "white", 0.7),
			ink(circ(11, 8, 3.9)),
		] },
		"window-titles": { parts: [
			// a window whose title bar is highlighted, its title written on it
			...win(1.5, 1.5, 13, 13, 5, "amber", "white", 1.2),
			line("M3.8 4H9.8", "ink", 1.5),
			line("M4 9.5H12M4 12H9.5", "grey", 1),
		] },
		"support-links": { parts: [
			// donate (a coffee cup) and rate (a heart, its steam)
			fill(circ(11.3, 10.3, 2.5) + circ(11.3, 10.3, 1), "blue-soft"), ink(circ(11.3, 10.3, 2.5) + circ(11.3, 10.3, 1), 0.9),
			fill("M1.5 7.5h9v3a3.5 3.5 0 0 1 -3.5 3.5h-2a3.5 3.5 0 0 1 -3.5 -3.5z", "blue-soft"),
			line("M3.2 9V10.8", "white", 1, 0.7),
			ink("M1.5 7.5h9v3a3.5 3.5 0 0 1 -3.5 3.5h-2a3.5 3.5 0 0 1 -3.5 -3.5z"),
			fill(place(HEART, 0.45, 8, 1.7, 6, 0.8), "coral"), ink(place(HEART, 0.45, 8, 1.7, 6, 0.8), 0.9),
		] },
		"sessions": { parts: [
			// saved windows (a stack) with the gold star of "save"
			...win(4.5, 1.5, 10, 7, 2, "steel"),
			...win(1.5, 4.5, 10, 9, 2.5, "blue-soft"),
			fill(star(11.7, 11.3, 3.9), "amber"), ink(star(11.7, 11.3, 3.9), 0.9),
		] },
		"export-sessions": { parts: [
			...doc(),
			fill(arrow(6, 15, 11), "lime"), ink(arrow(6, 15, 11), 0.9),
		] },
		"import-sessions": { parts: [
			...doc(),
			fill(arrow(15, 6, 11), "blue-soft"), ink(arrow(15, 6, 11), 0.9),
		] },
		"export-settings": { parts: [
			...sliders(),
			fill(arrow(6, 15, 11), "lime"), ink(arrow(6, 15, 11), 0.9),
		] },
		"import-settings": { parts: [
			...sliders(),
			fill(arrow(15, 6, 11), "blue-soft"), ink(arrow(15, 6, 11), 0.9),
		] },
		"badge": { parts: [
			// the toolbar icon (the extension's mark) with a coral count bubble. The count is
			// a bold "1", its stem on a pixel column: a "3" blurred to a blob at 16px
			...mark(0.5, 3, 8, 6, 2.5, 1.6),
			fill(rr(8.5, 0.5, 7, 6, 3), "coral"),
			line("M11.3 2.5L12.5 1.6V5.4", "white", 1.4),
			ink(rr(8.5, 0.5, 7, 6, 3), 0.9),
		] },
		"own-tab": { parts: [
			// a browser window with a steel tab strip; its active tab, soft blue like the
			// page under it, opens onto the extension's mark
			fill(rr(1.5, 2, 13, 12, 1.2), "blue-soft"), fill(bar(1.5, 2, 13, 4, 1.2), "steel"),
			fill("M2.5 6V4.5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1V6z", "blue-soft"),
			ink("M2.5 6V4.5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1V6", 0.8), ink("M1.5 6H2.5M8.5 6H14.5", 0.8),
			...mark(3.5, 7.5, 6, 3, 1.5, 0, 0.7),
			ink(rr(1.5, 2, 13, 12, 1.2)),
		] },
		"minimize-inactive": { parts: [
			// an inactive (grey) window and the lime minimize button
			...win(1.5, 1.5, 11, 9, 2.5, "steel", "grey-light"),
			fill(circ(11.5, 11.5, 3.6), "lime"), line("M11.5 9.5V13.3M9.9 11.8L11.5 13.4L13.1 11.8", "white", 1.3), ink(circ(11.5, 11.5, 3.6)),
		] },
		"monitors": { parts: [
			// two screens side by side on slate stands
			fill("M3 9.5H5V11.5H6.5V13H1.5V11.5H3zM11 9.5H13V11.5H14.5V13H9.5V11.5H11z", "slate"),
			ink("M3 9.5H5V11.5H6.5V13H1.5V11.5H3zM11 9.5H13V11.5H14.5V13H9.5V11.5H11z", 0.8),
			fill(rr(0.5, 2.5, 7, 7, 0.8), "blue-soft"), fill(rr(8.5, 2.5, 7, 7, 0.8), "sky-soft"),
			line("M2 5L3.6 3.6M10 5L11.6 3.6", "white", 0.9, 0.7),
			ink(rr(0.5, 2.5, 7, 7, 0.8)), ink(rr(8.5, 2.5, 7, 7, 0.8)),
		] },
		"action-buttons": { parts: [
			// a window header with the three coloured window buttons
			...win(1.5, 1.5, 13, 13, 6, "steel", "white", 1.2),
			fill(circ(4.5, 4.5, 1.8), "coral"), fill(circ(8, 4.5, 1.8), "lime"), fill(circ(11.5, 4.5, 1.8), "blue-soft"),
			ink(circ(4.5, 4.5, 1.8) + circ(8, 4.5, 1.8) + circ(11.5, 4.5, 1.8), 0.8),
			line("M4 10.5H12M4 12.5H9", "grey", 1),
		] },
		"private-windows": { parts: [
			// the incognito hat and glasses: a light steel crown over the slate brim, so the
			// hat holds on a dark background too
			fill(poly([[4.3, 6.6], [5.3, 2], [10.7, 2], [11.7, 6.6]]), "steel"), fill("M4.75 4.5H11.25L11.7 6.6H4.3z", "coral"),
			ink(poly([[4.3, 6.6], [5.3, 2], [10.7, 2], [11.7, 6.6]])),
			fill(rr(1, 6.4, 14, 1.8, 0.9), "slate"), ink(rr(1, 6.4, 14, 1.8, 0.9)),
			fill(circ(4.8, 11.6, 2.4) + circ(11.2, 11.6, 2.4), "sky-soft"), fill(circ(4.1, 10.9, 0.6) + circ(10.5, 10.9, 0.6), "white"),
			ink(circ(4.8, 11.6, 2.4) + circ(11.2, 11.6, 2.4)), ink("M7.2 11.2C7.7 10.7 8.3 10.7 8.8 11.2", 0.9),
		] },
		"shortcuts": { parts: keycap([
			fill(BOLT, "amber"), ink(BOLT, 0.8),
		]) },
		"changelog": { parts: [
			// a clipboard of notes and a "new" sparkle
			fill(rr(1.5, 2.5, 10.5, 12, 1.2), "peach"), fill(rr(3, 4, 7.5, 9, 0.4), "white"),
			line("M4.5 6.5H9M4.5 8.5H9M4.5 10.5H7", "grey", 1),
			ink(rr(1.5, 2.5, 10.5, 12, 1.2)),
			fill(rr(4.25, 1, 5, 2.6, 0.8), "slate"), ink(rr(4.25, 1, 5, 2.6, 0.8), 0.9),
			fill(sparkle(12, 11.8, 3.5), "amber"), ink(sparkle(12, 11.8, 3.5), 0.9),
		] },
		"debug-export": { parts: [
			// a page with a ladybug on it
			...doc(),
			fill(circ(11, 7.4, 1.6), "slate"), ink(circ(11, 7.4, 1.6), 0.8),
			fill(circ(11, 11.2, 3.8), "coral"),
			fill(circ(9.4, 10.3, 0.75) + circ(12.6, 10.3, 0.75) + circ(9.6, 12.8, 0.7) + circ(12.4, 12.8, 0.7), "ink"),
			ink("M11 7.6V15", 0.8), ink(circ(11, 11.2, 3.8)),
		] },
		// one mouse, the same size in all three: the clicked part coral
		"mouse-right": { parts: mouse(3.5, "right") },
		"mouse-middle": { parts: mouse(3.5, "middle") },
		"mouse-shift-right": { parts: [
			// the Shift key's hollow arrow, 1.7 left of the mouse
			fill(poly([[2.7, 4.8], [4.8, 7.6], [3.7, 7.6], [3.7, 11], [1.7, 11], [1.7, 7.6], [0.6, 7.6]]), "white"),
			ink(poly([[2.7, 4.8], [4.8, 7.6], [3.7, 7.6], [3.7, 11], [1.7, 11], [1.7, 7.6], [0.6, 7.6]]), 0.9),
			...mouse(6.5, "right"),
		] },
		"key-enter": { parts: keycap([
			line("M10.6 4.4V7.6H5.6M7.2 6L5.6 7.6L7.2 9.2", "blue-soft-dark", 1.4),
		]) },
	},
};
