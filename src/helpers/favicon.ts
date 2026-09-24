// Looks at a favicon's pixels so the popup can keep it visible on its tile.
//
//   mono-light  nothing but white/light grey (github, nytimes, ⌘…): invisible
//               on the light tile → the CSS inverts the icon (filter)
//   light       mostly white but not only (black-and-white, white with a blue
//               mark…): kept as is, the tile is tinted instead
//   mono-dark   nothing but black/dark grey: inverted in dark mode
//   dark        mostly black but not only: classified, not acted on (the
//               dark tile is teal rather than black and shows it fine)
//   normal      leave alone
//
// Anything that fails (no CORS on a remote favicon in Firefox, load error)
// comes back as "normal", so the worst case is today's behaviour.

export type FaviconTone = "normal" | "light" | "dark" | "mono-light" | "mono-dark";


const SIZE = 32;
const cache = new Map<string, Promise<FaviconTone>>();

let canvas : HTMLCanvasElement | null = null;

function context() : CanvasRenderingContext2D | null {
	if (!canvas) {
		canvas = document.createElement("canvas");
		canvas.width = SIZE;
		canvas.height = SIZE;
	}
	return canvas.getContext("2d", { willReadFrequently: true });
}

function load(url : string) : Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		// A remote icon (Firefox: tab.favIconUrl) can only be read from the canvas
		// when loaded in CORS mode and the site allows it; sites that don't log a
		// CORS error and the icon is simply left as it is. Same-origin sources
		// (Chrome's _favicon cache, data:, bundled images) need nothing.
		if (/^https?:/i.test(url)) img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("favicon load failed: " + url));
		img.src = url;
	});
}

function analyze(img : HTMLImageElement) : FaviconTone {
	const ctx = context();
	if (!ctx) return "normal";
	ctx.clearRect(0, 0, SIZE, SIZE);
	ctx.drawImage(img, 0, 0, SIZE, SIZE);
	// throws on a tainted canvas (cross-origin image without CORS)
	const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

	let opaque = 0, light = 0, dark = 0, grey = 0;
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] < 64) continue;
		opaque++;
		const r = data[i], g = data[i + 1], b = data[i + 2];
		// Rec. 601 luma, 0..255
		const luma = 0.299 * r + 0.587 * g + 0.114 * b;
		if (luma > 200) light++;
		else if (luma < 55) dark++;
		// no hue to speak of
		if (Math.max(r, g, b) - Math.min(r, g, b) < 40) grey++;
	}
	// too little drawn to judge
	if (opaque < SIZE * SIZE * 0.04) return "normal";

	// "mono" = one tone only (plus transparency): practically every drawn pixel
	// is grey AND near-white (or near-black). A black-and-white icon has both
	// tones and must not be inverted, it gets the chip instead.
	const grey_ratio = grey / opaque, light_ratio = light / opaque, dark_ratio = dark / opaque;
	if (grey_ratio > 0.95 && light_ratio > 0.95 && dark_ratio < 0.01) {
		return "mono-light";
	}
	// only-black icons get the mirror treatment in dark mode; black-and-white
	// and dark-but-coloured icons are left alone there, the teal tile shows them
	if (grey_ratio > 0.95 && dark_ratio > 0.95 && light_ratio < 0.01) {
		return "mono-dark";
	}
	if (light_ratio > 0.7) return "light";
	if (dark_ratio > 0.7) return "dark";
	return "normal";
}

export function faviconTone(url : string) : Promise<FaviconTone> {
	if (!url) return Promise.resolve("normal");
	let pending = cache.get(url);
	if (!pending) {
		pending = load(url).then(analyze).catch(() => "normal" as FaviconTone);
		cache.set(url, pending);
	}
	return pending;
}
