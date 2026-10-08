"use strict";
import * as browser from 'webextension-polyfill';
import {timeAgo} from "@helpers/utils";
import {getSetting, getTheme, readBootCache} from "@helpers/settings";
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

// Clips: <figure class="clip"><video preload="none" poster=…> under a 7.0.0
// subsection (generated from CHANGELOG.md by scripts/changelog.mjs). Nothing
// but the small poster is fetched until a clip is half on screen; it plays
// there, silent and looping, and pauses when it scrolls away. Motion is off
// with prefers-reduced-motion or the "animations" setting off: the poster stays
// and the video is never loaded. A clip whose files are missing is hidden, so
// the page never shows a broken box.
interface Clip {
	figure : HTMLElement;
	video : HTMLVideoElement;
	userPaused : boolean;
}

const clips : Clip[] = Array.from(document.querySelectorAll<HTMLElement>("figure.clip")).flatMap((figure) => {
	const video = figure.querySelector("video");
	return video ? [{ figure, video, userPaused: false }] : [];
});

if (clips.length) {
	const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
	let animations = true; // the popup's default, until storage says otherwise
	const motionAllowed = () => animations && !reducedMotion.matches;

	const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver((entries) => {
		for (const entry of entries) {
			const clip = clips.find((c) => c.figure === entry.target);
			if (!clip || clip.figure.hidden) continue;
			if (entry.intersectionRatio >= 0.5 && motionAllowed()) {
				if (!clip.userPaused) playClip(clip);
			} else {
				clip.video.pause();
			}
		}
	}, { threshold: [0, 0.5] }) : null;

	const hideClip = ({ figure, video }: Clip) => {
		figure.hidden = true;
		video.pause();
		observer?.unobserve(figure);
	};

	const playClip = ({ video }: Clip) => {
		if (video.preload === "none") {
			video.preload = "auto";
			video.load();
		}
		video.play().catch(() => {}); // an autoplay refusal leaves the poster, nothing to report
	};

	// the observer reports a clip afresh when it is observed again
	const watchClips = () => {
		for (const { figure, video } of clips) {
			figure.classList.toggle("still", !motionAllowed());
			if (figure.hidden) continue;
			if (!motionAllowed()) video.pause();
			observer?.unobserve(figure);
			observer?.observe(figure);
		}
	};

	for (const clip of clips) {
		const { figure, video } = clip;
		// a source that fails to load (404) reports on the <source>, which does
		// not bubble; the last one failing means no format could be loaded
		const sources = video.querySelectorAll("source");
		video.addEventListener("error", (e) => {
			if (e.target === video || e.target === sources[sources.length - 1]) hideClip(clip);
		}, true);
		// the poster shows before and without motion; a missing one means the
		// clip is not shipped (a poster raises no event, so probe it)
		const poster = new Image();
		poster.onerror = () => hideClip(clip);
		poster.src = video.poster;
		// a click pauses and resumes; a pause stays through scrolling away and back
		figure.addEventListener("click", () => {
			if (!motionAllowed()) return;
			clip.userPaused = !video.paused;
			if (clip.userPaused) video.pause();
			else playClip(clip);
		});
	}

	reducedMotion.addEventListener("change", watchClips);
	browser.storage.onChanged.addListener((changes, area) => {
		if (area !== "local" || !changes.animations) return;
		animations = changes.animations.newValue !== false;
		watchClips();
	});
	// the setting is read before the first clip is looked at, so a user who
	// turned animations off never loads a video
	getSetting("animations").then((on) => { animations = on !== false; }, () => {}).then(watchClips);
}
