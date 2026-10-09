// Shared harness for the clips: static server for ./app, headless Chrome (puppeteer-core), a drawn cursor with the
// click ripple, and a frame recorder that steps the script clock one frame at a time.
// Never connects to a running browser: it launches its own headless Chrome with a throw-away profile.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { readdirSync } from "node:fs";
import puppeteerCore from "puppeteer-core";

export const here = dirname(fileURLToPath(import.meta.url));
export const puppeteer = puppeteerCore;   // from the repo's node_modules
// everything generated goes under out/ (gitignored): work/<clip>/frames + meta.json, final/ (webm, mp4, jpg, sheets, sizes.json)
export const out = join(here, "out");
export const work = join(out, "work");
export const final = join(out, "final");
// ffmpeg / ffprobe from PATH, or FFMPEG (path of ffmpeg; ffprobe is looked up next to it, or FFPROBE)
export const ffmpeg = process.env.FFMPEG || "ffmpeg";
export const ffprobe = process.env.FFPROBE || (process.env.FFMPEG ? process.env.FFMPEG.replace(/ffmpeg(\.exe)?$/i, "ffprobe$1") : "ffprobe");

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff" };
export function serve(root = join(here, "app")) {
	const server = createServer(async (req, res) => {
		const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([\\/]\.\.)+/, "");
		try {
			const body = await readFile(join(root, path));
			res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream", "cache-control": "no-store" });
			res.end(body);
		} catch { res.writeHead(404); res.end(); }
	});
	return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, origin: "http://127.0.0.1:" + server.address().port })));
}

// 800x600 popup, shot at scale 1.6 -> 1280x960. (The viewport stays at devicePixelRatio 1: with dpr != 1 headless Chrome
// hit-tests its own re-hover after layout changes at pointer/dpr, which hovers the wrong element.)
export const SIZE = { w: 800, h: 600, dpr: 1 };
export const OUT_SCALE = 1.6;
export const FPS = 30;

export function chromePath() {
	// a pinned build from `npx @puppeteer/browsers install chrome@<version>` wins over the system Chrome, which auto-updates
	const pinned = join(homedir(), ".cache", "puppeteer", "chrome");
	const pinnedExe = existsSync(pinned) ? readdirSync(pinned).sort().reverse().map((d) => [
		join(pinned, d, "chrome-win64", "chrome.exe"),
		join(pinned, d, "chrome-linux64", "chrome"),
		join(pinned, d, "chrome-mac-arm64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"),
		join(pinned, d, "chrome-mac-x64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"),
	]).flat() : [];
	const exe = [process.env.CHROME_PATH, ...pinnedExe, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
		"/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean).find(existsSync);
	if (!exe) throw new Error("no Chrome found; install Chrome or set CHROME_PATH");
	return exe;
}
export async function launch() {
	// own headless instance, own temp profile (puppeteer's default): never the maintainer's browser
	return puppeteer.launch({ executablePath: chromePath(), headless: true, args: ["--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text", "--disable-features=PaintHolding"] });
}

// The in-page cursor: arrow + ripple, as in the v4 video (click ripple 0.3 s, press 0.08 s). Drawn by us because headless Chrome draws no pointer.
const CURSOR_JS = () => {
	const mk = () => {
		if (document.getElementById("clip-cursor") || !document.documentElement) return;
		const w = document.createElement("div");
		w.id = "clip-cursor";
		w.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none;";
		w.innerHTML = '<div id="clip-ripple" style="position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:2.5px solid #9b7bd4;opacity:0;box-sizing:border-box"></div>' +
			'<svg id="clip-pointer" viewBox="0 0 24 24" style="position:absolute;left:0;top:0;width:22px;height:22px;opacity:0;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35));transform-origin:4px 2px"><path d="M4 2 L4 20 L9 15.5 L12.5 22.5 L15.5 21 L12 14 L19 14 Z" fill="#fff" stroke="#1b1d3a" stroke-width="1.4" stroke-linejoin="round"/></svg>';
		document.documentElement.appendChild(w);
	};
	window.__cursor = (x, y, vis, press, ripple) => {
		mk();
		const p = document.getElementById("clip-pointer"), r = document.getElementById("clip-ripple");
		p.style.opacity = vis;
		p.style.transform = "translate(" + (x - 4) + "px, " + (y - 2) + "px) scale(" + press + ")";
		if (ripple >= 0 && ripple <= 1) { r.style.opacity = (1 - ripple) * vis; r.style.left = x + "px"; r.style.top = y + "px"; r.style.transform = "scale(" + (0.4 + ripple * 1.15) + ")"; }
		else r.style.opacity = 0;
	};
};

// The key-cap overlay (clips about the keyboard): the key just pressed, drawn by us in the bottom right corner above the
// bottom bar, outside the popup's DOM like the cursor. Styled like the popup's <kbd> key caps (light theme: --kbd-bg
// #f3f5f6, --kbd-border #cccccc, a thicker bottom edge as in the notice's key caps), large enough for 1280x960.
export const CAP_HOLD = 0.85, CAP_FADE = 0.3;
const KEYCAP_JS = () => {
	window.__keycap = (keys, op, down) => {
		let w = document.getElementById("clip-keycap");
		if (!w) {
			if (!document.documentElement || !document.body) return;
			w = document.createElement("div");
			w.id = "clip-keycap";
			w.style.cssText = "position:fixed;right:18px;bottom:68px;z-index:2147483645;pointer-events:none;display:flex;align-items:center;gap:9px;" +
				"font-family:" + getComputedStyle(document.body).fontFamily + ";";
			document.documentElement.appendChild(w);
		}
		const sig = keys.join("");
		if (w.dataset.sig !== sig) {
			w.dataset.sig = sig;
			w.innerHTML = keys.map((k) => '<span class="clip-cap" style="display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:50px;height:50px;padding:0 15px;' +
				'border:1px solid #cccccc;border-bottom-width:4px;border-bottom-color:#b4b8bd;border-radius:8px;background:linear-gradient(#ffffff,#f3f5f6);color:#1b1d22;' +
				'font-size:' + (k.length > 1 ? 24 : 30) + 'px;font-weight:600;line-height:1;box-shadow:0 3px 10px rgba(0,0,0,.16)">' + k + '</span>')
				.join('<span style="font-size:26px;font-weight:600;color:#555555">+</span>');
		}
		w.style.opacity = op;
		for (const c of w.querySelectorAll(".clip-cap")) {
			c.style.transform = down ? "translateY(2px)" : "none";
			c.style.borderBottomWidth = down ? "2px" : "4px";
			c.style.background = down ? "linear-gradient(#f3f5f6,#e8eaec)" : "linear-gradient(#ffffff,#f3f5f6)";
		}
	};
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * A fresh page on its own context: the popup at SIZE, light colour scheme pinned (theme "system" would follow this PC),
 * the fake store seeded with `seed` before any script runs. Resolves once the 3 windows are on screen.
 */
export async function openPopup(browser, origin, { seed = {}, url = "/popup.html", size = SIZE, chrome = true } = {}) {
	const context = await browser.createBrowserContext();
	const page = await context.newPage();
	page.on("pageerror", (e) => console.log("  pageerror:", e.message));
	await page.setViewport({ width: size.w, height: size.h, deviceScaleFactor: size.dpr });
	await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
	await page.evaluateOnNewDocument((seed) => { globalThis.__fakeSeed = seed; }, { tabWidth: size.w, tabHeight: size.h, animations: false, ...seed });
	await page.evaluateOnNewDocument(CURSOR_JS);
	await page.evaluateOnNewDocument(KEYCAP_JS);
	await page.evaluateOnNewDocument(DRAG_HOOK_JS);
	await page.evaluateOnNewDocument(() => {
		// no text caret blinking in frames
		document.addEventListener("DOMContentLoaded", () => {
			const s = document.createElement("style");
			s.textContent = "*,*::before,*::after{caret-color:transparent !important} html.clip-moving .stats-card{visibility:hidden !important}";
			document.head.appendChild(s);
		});
	});
	if (chrome) {
		// the Chrome build asks chrome-extension://<id>/_favicon/?pageUrl=..., which a web page cannot load: the url is
		// rewritten to the demo favicon of the same host (/fav/<host>.png) as the popup writes it into the DOM
		await page.evaluateOnNewDocument(() => {
			const re = /chrome-extension:\/\/[^\/]*\/_favicon\/\?pageUrl=([^&)"']*)[^)"']*/g;
			const fix = (el) => {
				const st = el.getAttribute && el.getAttribute("style");
				if (!st || !st.includes("chrome-extension://")) return;
				const out = st.replace(re, (m, enc) => {
					let host = "";
					try { host = new URL(decodeURIComponent(enc)).hostname.replace(/^(www|en|open)\./, ""); } catch {}
					return "/fav/" + host + ".png";
				});
				if (out !== st) el.setAttribute("style", out);
			};
			const all = (n) => { if (n.nodeType === 1) { fix(n); n.querySelectorAll && n.querySelectorAll("[style*='chrome-extension']").forEach(fix); } };
			new MutationObserver((ms) => { for (const m of ms) { if (m.type === "attributes") fix(m.target); else m.addedNodes.forEach(all); } })
				.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["style"] });
		});
	}
	await page.goto(origin + url, { waitUntil: "load" });
	await page.waitForFunction(() => document.querySelectorAll(".window").length >= 3 && document.querySelector(".searchBoxInput"), { timeout: 20000 });
	await page.evaluate(() => document.fonts.ready);
	await sleep(600);
	return page;
}

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeSine = (x) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x));

/** Records frames at FPS into `dir`; `t` is the script clock (seconds). */
export class Recorder {
	constructor(page, dir, { quality = 92 } = {}) {
		this.page = page; this.dir = dir; this.quality = quality;
		rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
		this.n = 0; this.t = 0;
		this.pos = [SIZE.w - 150, SIZE.h - 130];       // where the cursor rests
		this.vis = 0; this.clickT = -9;
		this.hooks = [];                               // called before every frame: drive paused animations etc.
		this.quiet = false;
		this.pace = 1;                                 // every duration of the script is multiplied by this (clips.mjs PACE)
		this.cap = null;                               // the key-cap overlay: { keys: ["Shift", "→"], t } (see key())
	}
	async frame() {
		const { page } = this;
		for (const h of this.hooks) await h(this);
		const rip = (this.t - this.clickT) / 0.3;
		const press = this.t > this.clickT - 0.02 && this.t < this.clickT + 0.08 ? 0.85 : 1;
		await page.evaluate((x, y, v, p, r) => window.__cursor(x, y, v, p, r), this.pos[0], this.pos[1], this.vis, press, rip);
		if (this.cap) {
			// the key cap: in over 0.08 s, held to CAP_HOLD, out over CAP_FADE (absolute seconds, not paced); pressed look for 0.1 s
			const a = this.t - this.cap.t + 1 / FPS;    // the frame right after the press already shows it
			const op = a < 0.08 ? easeSine(a / 0.08) : a < CAP_HOLD ? 1 : 1 - easeSine((a - CAP_HOLD) / CAP_FADE);
			const down = a < 0.1 ? 1 : 0;
			await page.evaluate((keys, op, down) => window.__keycap(keys, op, down), this.cap.keys, Math.max(0, op), down);
			if (a > CAP_HOLD + CAP_FADE) this.cap = null;
		}
		await page.screenshot({ path: join(this.dir, String(this.n).padStart(4, "0") + ".png"), type: "png", clip: { x: 0, y: 0, width: SIZE.w, height: SIZE.h, scale: OUT_SCALE } });
		this.n++; this.t = this.n / FPS;
	}
	async wait(sec) { const k = Math.round(sec * this.pace * FPS); for (let i = 0; i < k; i++) await this.frame(); }
	/** Cursor (and real mouse) glide to [x,y] over `sec`. */
	async moveTo([x, y], sec = 0.6, { real = true } = {}) {
		const [x0, y0] = this.pos, k = Math.max(1, Math.round(sec * this.pace * FPS));
		// `quiet`: the hover cards of the things passed on the way stay hidden until the pointer has arrived
		if (this.quiet) await this.page.evaluate(() => document.documentElement.classList.add("clip-moving"));
		for (let i = 1; i <= k; i++) {
			const m = easeIO(i / k);
			this.pos = [x0 + (x - x0) * m, y0 + (y - y0) * m];
			if (real) await this.page.mouse.move(this.pos[0], this.pos[1]);
			await this.frame();
		}
		if (this.quiet) { await settle(this.page, 150); await this.page.evaluate(() => document.documentElement.classList.remove("clip-moving")); }
	}
	async fade(to, sec = 0.3) {
		const v0 = this.vis, k = Math.max(1, Math.round(sec * this.pace * FPS));
		for (let i = 1; i <= k; i++) { this.vis = v0 + (to - v0) * easeSine(i / k); await this.frame(); }
	}
	/** Real mouse press + release at the cursor, ripple starting at the next frame. */
	async click({ ctrl = false } = {}) {
		const { page } = this;
		this.clickT = this.t;
		if (ctrl) await page.keyboard.down("Control");
		await page.mouse.down();
		await page.mouse.up();
		if (ctrl) await page.keyboard.up("Control");
	}
}

/** Position of the element matching `sel` in viewport CSS px (fx, fy = fraction inside it); scrolls it into view. */
export async function centre(page, sel, fx = 0.5, fy = 0.5) {
	const r = await page.evaluate((sel) => {
		const el = document.querySelector(sel);
		if (!el) return null;
		el.scrollIntoView({ block: "nearest", inline: "nearest" });
		const b = el.getBoundingClientRect();
		return [b.left, b.top, b.width, b.height];
	}, sel);
	if (!r) throw new Error("no element " + sel);
	return [r[0] + r[2] * fx, r[1] + r[3] * fy];
}

// ---- helpers the clips share ----

/** Two animation frames + a little real time, so React and the fake storage have rendered what a click did. */
export async function settle(page, ms = 60) {
	await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
	await sleep(ms);
}

/** Hide the hover cards (clips that are about something else keep the page clean). */
export async function noCards(page) {
	await page.evaluate(() => {
		const s = document.createElement("style");
		s.id = "clip-nocards";
		s.textContent = ".stats-card{display:none !important}";
		document.head.appendChild(s);
	});
}

/** A click on `sel` (real mouse at the cursor): move there, press, wait for the render. */
export async function clickAt(rec, sel, { move = 0.5, fx = 0.5, fy = 0.5, ctrl = false } = {}) {
	if (move > 0) await rec.moveTo(await centre(rec.page, sel, fx, fy), move);
	await rec.click({ ctrl });
	await settle(rec.page);
}

/**
 * A theme change as a smooth crossfade: transitions on the colour properties, started by the real click on `sel`,
 * then paused and driven frame by frame (the frames stay deterministic).
 */
export async function themeFade(rec, sel, dur = 0.45, move = 0.5) {
	const { page } = rec;
	dur *= rec.pace;
	await page.evaluate((dur) => {
		const st = document.createElement("style");
		st.id = "clip-xfade";
		const D = dur + "s linear";
		st.textContent = "*, *::before, *::after { transition: background-color " + D + ", color " + D + ", border-color " + D + ", box-shadow " + D + ", fill " + D + ", stroke " + D + ", filter " + D + ", outline-color " + D + " !important; }";
		document.head.appendChild(st);
		document.documentElement.getBoundingClientRect();
	}, dur);
	if (move > 0) await rec.moveTo(await centre(page, sel), move);
	await rec.click();
	await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => {
		window.__tx = document.getAnimations().filter((a) => a instanceof CSSTransition);
		window.__tx.forEach((a) => { a.pause(); a.currentTime = 0; });
		r();
	}))));
	const k = Math.max(1, Math.round(dur * FPS));
	for (let i = 1; i <= k; i++) {
		await page.evaluate((ms) => window.__tx.forEach((a) => { a.currentTime = ms; }), (i / k) * dur * 1000);
		await rec.frame();
	}
	await page.evaluate(() => { window.__tx.forEach((a) => a.finish()); window.__tx = []; document.getElementById("clip-xfade")?.remove(); });
}

/** Type `text` into whatever has the focus, `cps` characters a second, a frame per step. */
export async function typeText(rec, text, cps = 12) {
	const per = Math.max(1, Math.round((FPS / cps) * rec.pace));
	for (const ch of text) {
		await rec.page.keyboard.type(ch);
		for (let i = 0; i < per; i++) { if (i === 1) await settle(rec.page, 30); await rec.frame(); }
	}
	await settle(rec.page, 120);
}

export async function press(rec, key, { ctrl = false } = {}) {
	if (ctrl) await rec.page.keyboard.down("Control");
	await rec.page.keyboard.press(key);
	if (ctrl) await rec.page.keyboard.up("Control");
	await settle(rec.page, 100);
}

const CAP_NAMES = { ArrowRight: "→", ArrowLeft: "←", ArrowUp: "↑", ArrowDown: "↓", " ": "Space", Escape: "Esc", Control: "Ctrl", Enter: "Enter", Tab: "Tab", Shift: "Shift" };
/** A real key press (`mods` held: "Shift", "Control"), shown in the key-cap overlay. */
export async function key(rec, k, mods = []) {
	for (const m of mods) await rec.page.keyboard.down(m);
	await rec.page.keyboard.press(k);
	for (const m of [...mods].reverse()) await rec.page.keyboard.up(m);
	rec.cap = { keys: [...mods, k].map((x) => CAP_NAMES[x] || x), t: rec.t };
	await settle(rec.page, 100);
}

/** Smoothly scrolls the element matching `sel` to `top` over `sec`. */
export async function scrollTo(rec, sel, top, sec = 0.6) {
	const y0 = await rec.page.evaluate((s) => document.querySelector(s).scrollTop, sel);
	const k = Math.max(1, Math.round(sec * rec.pace * FPS));
	for (let i = 1; i <= k; i++) {
		const y = y0 + (top - y0) * easeIO(i / k);
		await rec.page.evaluate((s, y) => { document.querySelector(s).scrollTop = y; }, sel, y);
		await rec.frame();
	}
}

// ---- real drags (CDP Input.dispatchDragEvent), with the drag image drawn by us ----
// Headless Chrome shows no OS drag image, so setDragImage is hooked: the element the page hands over (the drag stack) is
// cloned and follows the pointer. The events themselves are real: dragstart fires from a real mouse press + move, then
// dragenter / dragover / drop reach the page through the browser.
export const DRAG_HOOK_JS = () => {
	const orig = DataTransfer.prototype.setDragImage;
	DataTransfer.prototype.setDragImage = function (el, x, y) {
		try { window.__dragImage = { node: el.cloneNode(true), x, y }; } catch {}
		return orig.call(this, el, x, y);
	};
	window.__dragShow = (px, py) => {
		let el = document.getElementById("clip-dragimg");
		const d = window.__dragImage;
		if (!d) return;
		if (!el) {
			el = document.createElement("div");
			el.id = "clip-dragimg";
			el.style.cssText = "position:fixed;left:0;top:0;z-index:2147483646;pointer-events:none;";
			d.node.style.position = "absolute"; d.node.style.left = "0px"; d.node.style.top = "0px"; d.node.style.right = "auto"; d.node.style.bottom = "auto"; d.node.style.transform = "none";
			el.appendChild(d.node);
			document.documentElement.appendChild(el);
		}
		el.style.transform = "translate(" + (px - d.x) + "px," + (py - d.y) + "px)";
	};
	window.__dragHide = () => { document.getElementById("clip-dragimg")?.remove(); window.__dragImage = null; };
};

export class Drag {
	constructor(rec) { this.rec = rec; this.data = null; this.entered = false; }
	/** Press on the element and pull it a few pixels: the browser starts the drag (dragstart reaches the page). */
	async start(sel, { fx = 0.5, fy = 0.5, move = 0.5 } = {}) {
		const { rec } = this, { page } = rec;
		await page.setDragInterception(true);
		await rec.moveTo(await centre(page, sel, fx, fy), move);
		const got = new Promise((res) => page._client().once("Input.dragIntercepted", (e) => res(e.data)));
		await page.mouse.down();
		await page.mouse.move(rec.pos[0] + 6, rec.pos[1] + 6, { steps: 3 });
		rec.pos = [rec.pos[0] + 6, rec.pos[1] + 6];
		this.data = await Promise.race([got, sleep(3000).then(() => null)]);
		if (!this.data) throw new Error("no drag started on " + sel);
		this.hook = async (r) => { await r.page.evaluate((x, y) => window.__dragShow && window.__dragShow(x, y), r.pos[0], r.pos[1]); };
		rec.hooks.push(this.hook);
		await settle(page, 80);
	}
	/** Carry it to [x,y] over `sec`: dragenter once, then dragover on every frame. */
	async to([x, y], sec = 0.6) {
		const { rec } = this, { page } = rec;
		const [x0, y0] = rec.pos, k = Math.max(1, Math.round(sec * rec.pace * FPS));
		for (let i = 1; i <= k; i++) {
			const m = easeIO(i / k);
			rec.pos = [x0 + (x - x0) * m, y0 + (y - y0) * m];
			const at = { x: rec.pos[0], y: rec.pos[1] };
			if (!this.entered) { await page.mouse.dragEnter(at, this.data); this.entered = true; }
			await page.mouse.dragOver(at, this.data);
			await rec.frame();
		}
	}
	async drop() {
		const { rec } = this, { page } = rec;
		const at = { x: rec.pos[0], y: rec.pos[1] };
		await page.mouse.drop(at, this.data);
		await page.mouse.up();
		rec.hooks = rec.hooks.filter((h) => h !== this.hook);
		await page.evaluate(() => window.__dragHide && window.__dragHide());
		await page.setDragInterception(false);
		await settle(page, 200);
	}
}

/** Escape the way the user would: the first press only closes a hover card when one is open, so press it twice. */
export async function escape(rec) {
	await rec.page.focus(".searchBoxInput");
	await press(rec, "Escape");
	await press(rec, "Escape");
}
