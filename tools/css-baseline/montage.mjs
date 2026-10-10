// node montage.mjs <out.png> <x> <y> <w> <h> <factor> <in1.png> [in2.png ...]: the same region of
// each input, nearest-neighbour zoomed, side by side with a 6px gap
import {PNG} from 'pngjs'
import {readFileSync, writeFileSync} from 'node:fs'
const [out, x, y, w, h, f, ...ins] = process.argv.slice(2)
const X = +x, Y = +y, W = +w, H = +h, F = +f, G = 6
const dst = new PNG({width: ins.length * (W * F + G) - G, height: H * F})
dst.data.fill(255)
ins.forEach((inp, n) => {
	const src = PNG.sync.read(readFileSync(inp))
	for (let j = 0; j < H * F; j++) for (let i = 0; i < W * F; i++) {
		const s = ((Y + Math.floor(j / F)) * src.width + X + Math.floor(i / F)) * 4, d = (j * dst.width + n * (W * F + G) + i) * 4
		for (let k = 0; k < 4; k++) dst.data[d + k] = src.data[s + k]
	}
})
writeFileSync(out, PNG.sync.write(dst))
