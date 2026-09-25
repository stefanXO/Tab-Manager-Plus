"use strict";
import {timeAgo} from "@helpers/utils";

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
