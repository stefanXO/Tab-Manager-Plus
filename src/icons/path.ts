"use strict";

// SVG path data -> every absolute point it names (end points and control
// points; an arc contributes its end point). Used to keep icons on the
// 16x16 grid. Throws an Error naming the problem for anything that is not
// plain path data.

const ARITY : Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
const TOKEN = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)|([\s,]+)|(.)/g;

export function pathPoints(d : string) : [number, number][] {
	const tokens : (string | number)[] = [];
	for (const m of d.matchAll(TOKEN)) {
		if (m[1]) tokens.push(m[1]);
		else if (m[2]) tokens.push(Number(m[2]));
		else if (m[4]) throw new Error("unexpected " + JSON.stringify(m[4]) + " at " + m.index);
	}
	if (typeof tokens[0] !== "string" || tokens[0].toLowerCase() !== "m") throw new Error("must start with M");

	const points : [number, number][] = [];
	let x = 0, y = 0, startX = 0, startY = 0, i = 0;
	while (i < tokens.length) {
		const cmd = tokens[i++] as string;
		if (typeof cmd !== "string") throw new Error("number without a command");
		const lower = cmd.toLowerCase(), rel = cmd === lower, n = ARITY[lower];
		if (n === 0) {
			x = startX; y = startY;
			continue;
		}
		let first = true;
		do {
			const args = tokens.slice(i, i + n);
			if (args.length < n || args.some((a) => typeof a !== "number")) throw new Error(cmd + " needs " + n + " numbers" + (lower === "a" ? "; arc flags must be 0 or 1, written as separate numbers" : ""));
			const a = args as number[];
			if (lower === "a" && ((a[3] !== 0 && a[3] !== 1) || (a[4] !== 0 && a[4] !== 1))) {
				throw new Error("arc flags must be 0 or 1, written as separate numbers");
			}
			i += n;
			const ox = rel ? x : 0, oy = rel ? y : 0;
			if (lower === "h") {
				x = ox + a[0];
			} else if (lower === "v") {
				y = oy + a[0];
			} else {
				// control points first (pairs before the last), then the end point
				const pairs = lower === "a" ? [[a[5], a[6]]] : Array.from({ length: n / 2 }, (_, k) => [a[2 * k], a[2 * k + 1]]);
				for (const [px, py] of pairs.slice(0, -1)) points.push([ox + px, oy + py]);
				const [ex, ey] = pairs[pairs.length - 1];
				x = ox + ex; y = oy + ey;
			}
			points.push([x, y]);
			if (lower === "m" && first) {
				startX = x; startY = y;
			}
			first = false;
		} while (i < tokens.length && typeof tokens[i] === "number");
	}
	return points;
}
