"use strict";
import * as browser from 'webextension-polyfill';
import {timeAgo} from "@helpers/utils";
import {getTheme, readBootCache} from "@helpers/settings";
import {applyTheme, readTheme} from "@helpers/theme";

// The theme setting, as the popup boots it (popup.tsx): synchronously from the
// boot cache the popup keeps in localStorage, so the first frame already has
// the right colours, then from storage (the cache can be missing or stale),
// and live when it is switched in the popup while this page is open.
const cache = readBootCache();
applyTheme(readTheme(cache.theme, cache.dark));
getTheme().then(applyTheme, () => {});
browser.storage.onChanged.addListener((changes, area) => {
	if (area === "local" && changes.theme) applyTheme(readTheme(changes.theme.newValue));
});

// changelog.html: every version heading carries an empty <time datetime>;
// show how long ago that release was, the exact date stays in the title
for (const el of Array.from(document.querySelectorAll<HTMLTimeElement>("time[datetime]"))) {
	const at = Date.parse(el.dateTime);
	if (!isNaN(at)) el.textContent = timeAgo(at);
}

// Only this browser's lines. A line naming the other browser alone is hidden
// (store links, "Firefox: ..." entries); a line naming both stays.
document.documentElement.classList.add(IS_FIREFOX ? "firefox" : "chrome");

// opened by the worker right after an update (changelog.html?update): say so
if (location.search.indexOf("update") > -1) {
	const banner = document.querySelector<HTMLElement>(".updated-banner");
	if (banner) banner.hidden = false;
}
for (const li of Array.from(document.querySelectorAll<HTMLLIElement>(".optionsBox li"))) {
	const text = li.textContent || "";
	const firefox = /firefox/i.test(text);
	const chrome = /chrom(e|ium)/i.test(text);
	if (firefox && !chrome) li.classList.add("only-firefox");
	if (chrome && !firefox) li.classList.add("only-chrome");
}
