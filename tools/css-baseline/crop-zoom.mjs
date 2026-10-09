// node crop-zoom.mjs <in.png> <out.png> <x> <y> <w> <h> [factor]: nearest-neighbour zoom of a region
import {PNG} from 'pngjs'
import {readFileSync, writeFileSync} from 'node:fs'
const [inp, out, x, y, w, h, f = 3] = process.argv.slice(2)
const src = PNG.sync.read(readFileSync(inp))
const X = +x, Y = +y, W = +w, H = +h, F = +f
const dst = new PNG({width: W * F, height: H * F})
for (let j = 0; j < H * F; j++) for (let i = 0; i < W * F; i++) {
	const s = ((Y + Math.floor(j / F)) * src.width + X + Math.floor(i / F)) * 4, d = (j * W * F + i) * 4
	for (let k = 0; k < 4; k++) dst.data[d + k] = src.data[s + k]
}
writeFileSync(out, PNG.sync.write(dst))
