"use strict";
import {applyTheme, readTheme} from "@helpers/theme";

// documentation.html: the theme and the browser lines, as changelog.ts does.
// No webextension-polyfill here: it throws outside an extension, and this page
// must also work as a plain file (the screenshot harness opens it that way).
// Without the extension APIs the page follows the boot cache, else the system.

// the popup's boot cache (@helpers/settings readBootCache; tests/documentation.test.ts
// checks the key still matches). Not imported: settings.ts loads the polyfill
const BOOT_CACHE = "tmpBootCache";

function bootCache() : { theme? : unknown, dark? : unknown } {
	try {
		return JSON.parse(localStorage.getItem(BOOT_CACHE) || "{}") || {};
	} catch (e) {
		return {};
	}
}

const cache = bootCache();
applyTheme(readTheme(cache.theme, cache.dark));

// chrome.storage (Firefox has it too, under chrome and browser)
const storage = typeof chrome === "object" && chrome?.storage?.local ? chrome.storage : null;
if (storage) {
	try {
		storage.local.get(["theme", "dark"], (stored) => {
			if (stored) applyTheme(readTheme(stored.theme, stored.dark));
		});
		storage.onChanged.addListener((changes, area) => {
			if (area === "local" && changes.theme) applyTheme(readTheme(changes.theme.newValue));
		});
	} catch (e) {
		// no storage: the cached or system theme stays
	}
}

// Only this browser's lines. A line naming the other browser alone is hidden
// (css/components/changelog.css); a line naming both stays.
document.documentElement.classList.add(IS_FIREFOX ? "firefox" : "chrome");
for (const el of Array.from(document.querySelectorAll<HTMLElement>(".optionsBox li, .optionsBox p, .optionsBox tr"))) {
	if (el.classList.contains("only-chrome") || el.classList.contains("only-firefox")) continue;
	const text = el.textContent || "";
	const firefox = /firefox/i.test(text);
	const chrome = /chrom(e|ium)/i.test(text);
	if (firefox && !chrome) el.classList.add("only-firefox");
	if (chrome && !firefox) el.classList.add("only-chrome");
}

// Clips (plain autoplay, muted, looping videos): with prefers-reduced-motion they
// stay on their first picture, and a clip whose files are missing is hidden.
{
	const reduced = matchMedia("(prefers-reduced-motion: reduce)");
	for (const video of Array.from(document.querySelectorAll<HTMLVideoElement>("figure.clip video"))) {
		if (reduced.matches) {
			video.removeAttribute("autoplay");
			video.pause();
		}
		video.addEventListener("error", () => video.closest("figure")?.setAttribute("hidden", ""), true);
	}
}
