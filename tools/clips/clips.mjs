// node clips.mjs [look search saved info options keys]   renders frames into out/work/<name>/frames (needs `node build-app.mjs` first)
// The six clips of the 7.0.0 update page. Every clip is a script: the real popup (bundled from the working folder) in
// headless Chrome, real mouse / keyboard / drag events, a drawn cursor, one screenshot per frame.
import { serve, launch, openPopup, Recorder, FPS, SIZE, sleep, centre, settle, noCards, clickAt, themeFade, typeText, press, key, escape, scrollTo, Drag, work } from "./lib.mjs";
import { join } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";

const LAYOUT = '.icon.windowaction[class*="-view"]';
const THEME = ".icon.windowaction.theme";
const REST = [470, 30];      // blank header: no hover card opens under the waiting mouse
// The pace: every duration below (waits, glides, typing, scrolls, fades) is multiplied by this in the helpers (lib.mjs
// Recorder.pace), so the clips are written at the old quick pace and a calmer or quicker cut is this one number.
export const PACE = 1.5;
const LEAD = 0.4;                              // seconds of untouched popup at the start (the loop blends the end into them when the end state differs)

// every clip: { seed, cards, loopFade (frames blended back into the start; 0 = the end state equals the start state), run(rec) }
export const clips = {};

const focusSearch = (page) => page.focus(".searchBoxInput");

/** Ctrl+click a tab: glide there, press with Control held. */
async function ctrlClick(rec, selector, move = 0.3) {
	await rec.moveTo(await centre(rec.page, selector), move);
	await rec.click({ ctrl: true });
	await settle(rec.page);
	await rec.wait(0.08);
}

// ---------------------------------------------------------------- 1. look
clips.look = {
	seed: { layout: "blocks", theme: "light" },
	cards: false,
	loopFade: 0,
	async run(rec) {
		const { page } = rec;
		await rec.wait(0.2);
		await rec.fade(1, 0.2);
		await clickAt(rec, LAYOUT, { move: 0.5 });           // Block -> Big Block
		await rec.wait(0.45);
		await clickAt(rec, LAYOUT, { move: 0 });             // -> Rows
		await rec.wait(0.45);
		await clickAt(rec, LAYOUT, { move: 0 });             // -> List
		await rec.wait(0.25);
		await scrollTo(rec, ".window-container", 330, 0.55);
		await rec.wait(0.35);
		await clickAt(rec, LAYOUT, { move: 0 });             // -> Block
		await rec.wait(0.3);
		await themeFade(rec, THEME);                         // Light -> Dark
		await rec.wait(0.4);
		await themeFade(rec, THEME, 0.45, 0);                // Dark -> System (light on this machine)
		await rec.wait(0.3);
		await rec.click(); await settle(page);               // System -> Light again: the same state as the start
		await rec.wait(0.25);
		await rec.moveTo(REST, 0.4);
		await rec.fade(0, 0.2);
		await rec.wait(0.1);
	},
};

// ---------------------------------------------------------------- 2. search
clips.search = {
	seed: { layout: "vertical", theme: "light" },
	cards: false,
	loopFade: 0,
	async run(rec) {
		const { page } = rec;
		await rec.wait(0.2);
		// the "?" at the right end of the search box opens the help card (hover); the cursor is hidden at both ends
		await rec.fade(1, 0.15);
		await rec.moveTo(await centre(page, ".search-help-icon"), 0.45);
		await rec.wait(1.5);
		await rec.moveTo(REST, 0.35);
		await rec.fade(0, 0.15);
		await rec.wait(0.2);
		await focusSearch(page);
		await typeText(rec, "react", 11);
		await rec.wait(0.55);
		await escape(rec);
		await rec.wait(0.15);
		await typeText(rec, "u:github", 14);
		await rec.wait(0.35);
		await typeText(rec, " -issues", 14);
		await rec.wait(0.55);
		await escape(rec);
		await rec.wait(0.1);
		await rec.fade(1, 0.15);
		await clickAt(rec, ".icon.windowaction.duplicates", { move: 0.4 });
		await rec.wait(0.7);
		await escape(rec);                                  // duplicates off again
		await clickAt(rec, ".icon.windowaction.recent", { move: 0.35 });
		await rec.wait(0.5);
		await clickAt(rec, ".icon.windowaction.recent", { move: 0 });
		await rec.wait(0.55);
		await escape(rec);
		await rec.wait(0.1);
		await rec.moveTo(REST, 0.3);
		await rec.fade(0, 0.15);
		await rec.wait(0.1);
	},
};

// ---------------------------------------------------------------- 3. saved
clips.saved = {
	seed: { layout: "horizontal", theme: "light", noAsleep: true },
	cards: false,
	loopFade: Math.round(LEAD * PACE * FPS),
	async run(rec) {
		const { page } = rec;
		const sessionIds = () => page.evaluate(() => [...document.querySelectorAll(".session")].map((e) => e.id));
		await rec.wait(LEAD);
		await rec.fade(1, 0.15);
		// 1. three tabs, saved together as a new saved window
		const before = await sessionIds();
		for (const id of ["#tab-3", "#tab-4", "#tab-8"]) await ctrlClick(rec, id, 0.25);
		await clickAt(rec, ".icon.windowaction.save-tabs", { move: 0.4 });
		await rec.wait(0.4);
		const id = (await sessionIds()).find((i) => !before.includes(i));
		// 2. its name opens the name / colour screen; a colour is picked
		await clickAt(rec, "#" + id + " .windowName", { move: 0.35 });
		await rec.wait(0.4);
		await clickAt(rec, ".colors-box .icon.color9", { move: 0.3 });
		await rec.wait(0.2);
		// 3. two saved tabs dragged into an open window (real drag events, the stack follows the pointer)
		await ctrlClick(rec, "#sessiontab_s1_1", 0.3);
		await ctrlClick(rec, "#sessiontab_s1_3", 0.2);
		const drag = new Drag(rec);
		await drag.start("#sessiontab_s1_3", { move: 0.1 });
		await drag.to(await centre(page, "#tab-12"), 0.5);
		await rec.wait(0.2);
		await drag.drop();
		await rec.wait(0.35);
		// 4. s:tax selects the saved matches; Ctrl+Delete deletes them (Undo notice), Ctrl+Z brings them back
		await rec.moveTo(REST, 0.3);
		await focusSearch(page);
		await typeText(rec, "s:tax", 12);
		await rec.wait(0.3);
		await press(rec, "Tab");                     // the focus leaves the box (there Ctrl+Delete would delete a word)
		await press(rec, "Delete", { ctrl: true });
		await rec.wait(0.85);
		await press(rec, "z", { ctrl: true });
		await rec.wait(0.5);
		await escape(rec);
		await rec.fade(0, 0.2);
		await rec.wait(0.1);
	},
};

// ---------------------------------------------------------------- 4. info
clips.info = {
	seed: { layout: "blocks", theme: "light" },
	cards: true,
	loopFade: 0,
	async run(rec) {
		const { page } = rec;
		rec.quiet = true;
		await rec.wait(0.15);
		await rec.fade(1, 0.15);
		await rec.moveTo(await centre(page, "#tab-15"), 0.45);                    // a tab
		await rec.wait(0.95);
		await rec.moveTo(await centre(page, "#window-103 .windowName"), 0.45);    // a window title
		await rec.wait(1.0);
		await rec.moveTo(REST, 0.3);
		await ctrlClick(rec, "#tab-2", 0.35);
		await ctrlClick(rec, "#tab-4", 0.25);
		await rec.moveTo(await centre(page, ".icon.windowaction.trash"), 0.4);    // a button of the bottom bar
		await rec.wait(1.0);
		await escape(rec);
		await rec.moveTo(REST, 0.35);
		await rec.fade(0, 0.15);
		await rec.wait(0.1);
	},
};

// ---------------------------------------------------------------- 6. keys
// The keyboard cursor (new in 7.0.0): the arrows walk a ring from tab to tab, Space selects the ring's tab, Shift+arrow
// selects as it goes, Ctrl+arrow walks out of a search box with text, Tab reaches the buttons. No mouse: the key just
// pressed is shown as a key cap (lib.mjs key(), KEYCAP_JS). Paced so every cap stays >= 0.85 s and every change is
// followed by >= 0.55 s of stillness (TAP: the same key again, NEXT: before another key; both times PACE).
const TAP = 0.37, NEXT = 0.57;
/** The header goes back to its summary when it idles (TabManager.hoverIcon's 15 s timeout, or the pointer moving over the
 *  header): done here as a mouseover on the blank header at once. The real 15 s timeout is switched off in every clip
 *  (noHeaderTimeout): it ran on wall-clock time, which the frame-by-frame recording stretches, so it fired at a random frame
 *  (the "Tip:" line popped up mid-clip in `saved`, and the loop point of `look` / `search` differed by that line). */
const noHeaderTimeout = (page) => page.evaluate(() => { const st = window.setTimeout; window.setTimeout = (f, d, ...a) => (d === 15000 ? 0 : st(f, d, ...a)); });
const headerIdle = (page) => page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })), REST);
clips.keys = {
	seed: { layout: "blocks", theme: "light" },
	cards: false,
	loopFade: Math.round(LEAD * PACE * FPS),      // the header keeps its last line and the focus moved: a short dissolve back
	async run(rec) {
		const { page } = rec;
		await rec.wait(LEAD + 0.4);                   // LEAD is blended into the end; 0.6 s of stillness stays before the first key
		// the ring walks two tabs, Space selects the second
		await key(rec, "ArrowRight"); await rec.wait(TAP);
		await key(rec, "ArrowRight"); await rec.wait(NEXT);
		await key(rec, " "); await rec.wait(NEXT);                       // "Selected 1 tab"
		// two on, Space again: two selected, the first stays
		await key(rec, "ArrowRight"); await rec.wait(TAP);
		await key(rec, "ArrowRight"); await rec.wait(NEXT);
		await key(rec, " "); await rec.wait(NEXT);
		// Shift+arrow selects every tab it lands on
		await key(rec, "ArrowRight", ["Shift"]); await rec.wait(TAP);
		await key(rec, "ArrowRight", ["Shift"]); await rec.wait(NEXT);
		await key(rec, "Escape"); await headerIdle(page); await rec.wait(NEXT);
		// a search, then Ctrl+arrow walks the matches while the text stays
		await page.focus(".searchBoxInput");
		await typeText(rec, "git", 8);
		await rec.wait(0.35);
		await key(rec, "ArrowRight", ["Control"]); await rec.wait(TAP);
		await key(rec, "ArrowRight", ["Control"]); await rec.wait(NEXT);
		await key(rec, "Escape"); await headerIdle(page); await rec.wait(NEXT);
		// Enter with nothing selected switches to the cursor tab: Left from the current window's active tab wraps to the last
		// tab of Research, Enter makes it the active tab and Research the current window (its outline). In the real popup
		// the popup closes; here the fake worker switches (fake-browser.js focus_on_tab_and_window) and the page stays
		await key(rec, "ArrowLeft"); await rec.wait(NEXT);
		await key(rec, "Enter"); await settle(page, 300); await rec.wait(0.6);   // 0.9 s to see the outline move
		// Tab reaches the buttons (focus ring): the first press goes to the header, the second to the first window's star
		await key(rec, "Tab"); await rec.wait(TAP);
		await key(rec, "Tab"); await rec.wait(0.6);
		// Esc (in the real popup it would close it): the focus leaves the button
		await key(rec, "Escape"); await page.evaluate(() => document.activeElement?.blur()); await settle(page);
		await rec.wait(0.5);
	},
};

// ---------------------------------------------------------------- 5. options
// A settings file to import: one setting differs from the defaults (Count Tabs off: the switch flips, the popup itself looks the same after closing the options, which keeps the loop clean)
mkdirSync(work, { recursive: true });
const IMPORT_FILE = join(work, "settings-backup.json");
writeFileSync(IMPORT_FILE, JSON.stringify({
	format: "tab-manager-plus-export", version: 1, kind: "settings", extension: "7.0.0", exported: "2030-06-01T12:00:00.000Z",
	settings: { badge: false },
}, null, 2));

/** Scrolls the options screen so that the element described by `what` ({css} | {box: title} | {sw: switch label}) sits `offset` px under the top of its scroller. */
async function optionsScroll(rec, what, offset, sec) {
	const top = await rec.page.evaluate((what, offset) => {
		const el = what.css ? document.querySelector(what.css)
			: what.box ? [...document.querySelectorAll(".optionsBox h4")].find((h) => h.textContent.trim() === what.box).closest(".optionsBox")
			: [...document.querySelectorAll(".toggle-box")].find((b) => b.querySelector(":scope > .textlabel")?.textContent.trim() === what.sw);
		const c = document.querySelector(".options-container");
		return el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - offset;
	}, what, offset);
	await scrollTo(rec, ".options-container", Math.max(0, top), sec);
}

clips.options = {
	seed: { layout: "blocks", theme: "light" },
	cards: false,
	loopFade: 0,
	async run(rec) {
		const { page } = rec;
		await rec.wait(0.15);
		await rec.fade(1, 0.15);
		await clickAt(rec, ".icon.windowaction.options", { move: 0.4 });
		await rec.wait(0.35);
		// the Donate and Rate switch, then the settings backup: Export, then Import with a prepared file
		await optionsScroll(rec, { sw: "Donate and Rate buttons" }, 150, 0.4);
		await rec.wait(0.4);
		await optionsScroll(rec, { box: "Settings backup" }, -90, 0.4);
		await rec.wait(0.1);
		await clickAt(rec, "#settings_export", { move: 0.4 });
		await rec.wait(0.3);
		await rec.moveTo(await centre(page, "#settings_import", 0.12, 0.5), 0.4);
		const [chooser] = await Promise.all([page.waitForFileChooser(), rec.click()]);
		await chooser.accept([IMPORT_FILE]);
		await settle(page, 300);
		await rec.wait(0.85);
		// and the keyboard shortcuts list
		await optionsScroll(rec, { css: ".shortcut-list" }, 120, 0.45);
		await rec.wait(0.6);
		await page.evaluate(() => document.querySelector(".notice-close")?.click());   // the notice goes away with the options screen
		await clickAt(rec, ".icon.windowaction.options", { move: 0.4 });          // close the options again
		await rec.wait(0.2);
		await rec.moveTo(REST, 0.3);
		await rec.fade(0, 0.2);
		await rec.wait(0.1);
	},
};

const only = process.argv.slice(2);
const names = only.length ? only : Object.keys(clips);
const { server, origin } = await serve();
const browser = await launch();
for (const name of names) {
	const c = clips[name];
	const t0 = Date.now();
	const page = await openPopup(browser, origin, { seed: c.seed });
	if (!c.cards) await noCards(page);
	const dl = join(work, "dl"); mkdirSync(dl, { recursive: true });
	await (await browser.target().createCDPSession()).send("Browser.setDownloadBehavior", { behavior: "allowAndName", downloadPath: dl, browserContextId: page.browserContext().id });
	await noHeaderTimeout(page);
	await page.mouse.move(REST[0], REST[1]);
	await headerIdle(page);                       // every clip starts with the plain header (no "Tip:" line), as it ends
	await sleep(500);
	const dir = join(work, name);
	mkdirSync(dir, { recursive: true });
	const rec = new Recorder(page, join(dir, "frames"));
	rec.pos = [...REST];
	rec.pace = PACE;
	await c.run(rec);
	writeFileSync(join(dir, "meta.json"), JSON.stringify({ frames: rec.n, fps: FPS, loopFade: c.loopFade }));
	console.log(name, rec.n, "frames", (rec.n / FPS).toFixed(2) + "s", "in", ((Date.now() - t0) / 1000).toFixed(0) + "s");
	await page.close();
}
await browser.close(); server.close();
