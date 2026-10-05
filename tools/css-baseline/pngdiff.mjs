// Shared PNG diff helpers for compare.mjs and report.mjs.
//
// pngjs is required; pixelmatch is used when present, otherwise an exact
// per-channel comparison with the same output shape.
import {readFileSync} from 'node:fs'

let PNG
try {
	;({PNG} = await import('pngjs'))
} catch {
	console.error('the css-baseline tools need pngjs: npm i -D pngjs pixelmatch')
	process.exit(2)
}
let pixelmatch = null
try {
	pixelmatch = (await import('pixelmatch')).default
} catch { /* fall back to plainDiff below */ }

export {PNG, pixelmatch}
export const engine = pixelmatch ? 'pixelmatch' : 'plain exact PNG diff (pixelmatch not installed)'

export const readPng = (file) => PNG.sync.read(readFileSync(file))

/** Fallback when pixelmatch is not installed: exact per-channel comparison. */
function plainDiff(a, b, out, width, height, {diffColor, alpha}) {
	let n = 0
	for (let i = 0; i < a.length; i += 4) {
		const same = a[i] === b[i] && a[i + 1] === b[i + 1] && a[i + 2] === b[i + 2] && a[i + 3] === b[i + 3]
		if (same) {
			// faded greyscale backdrop, like pixelmatch's
			const grey = 255 - (255 - (a[i] * 0.299 + a[i + 1] * 0.587 + a[i + 2] * 0.114)) * alpha
			out[i] = out[i + 1] = out[i + 2] = grey
			out[i + 3] = 255
		} else {
			out[i] = diffColor[0]; out[i + 1] = diffColor[1]; out[i + 2] = diffColor[2]; out[i + 3] = 255
			n++
		}
	}
	return n
}

/**
 * Diffs two same-sized PNGs. Returns {px, out}: the number of differing pixels
 * and a PNG with differing pixels in `diffColor` over a faded greyscale of `a`
 * (`alpha` = how much of `a` shows through, 0..1).
 */
export function diffPngs(a, b, {diffColor = [255, 0, 0], alpha = 0.1} = {}) {
	if (a.width !== b.width || a.height !== b.height) throw new Error('diffPngs: size mismatch')
	const out = new PNG({width: a.width, height: a.height})
	const px = pixelmatch
		? pixelmatch(a.data, b.data, out.data, a.width, a.height, {threshold: 0, includeAA: true, diffColor, alpha})
		: plainDiff(a.data, b.data, out.data, a.width, a.height, {diffColor, alpha})
	return {px, out}
}

/** A new w×h PNG filled with `rgba`. */
export function blank(width, height, rgba = [0, 0, 0, 0]) {
	const p = new PNG({width, height})
	for (let i = 0; i < p.data.length; i += 4) {
		p.data[i] = rgba[0]; p.data[i + 1] = rgba[1]; p.data[i + 2] = rgba[2]; p.data[i + 3] = rgba[3]
	}
	return p
}

/** `png` copied into the top-left of a w×h canvas filled with `rgba` (no-op if already that size). */
export function padTo(png, width, height, rgba = [0, 0, 0, 0]) {
	if (png.width === width && png.height === height) return png
	const p = blank(width, height, rgba)
	PNG.bitblt(png, p, 0, 0, png.width, png.height, 0, 0)
	return p
}
