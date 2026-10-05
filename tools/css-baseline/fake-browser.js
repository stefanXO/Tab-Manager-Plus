// Stand-in for webextension-polyfill: the real popup code runs as a plain page,
// fed three believable windows. Storage lives in memory.
//
// Copied from brag-output/work/fake-browser.js (which is gitignored) so the
// css-baseline harness is self-contained, then extended with the tab states the
// CSS needs to exercise: pinned, discarded, audible, muted, duplicate urls, and
// a couple of saved sessions.

const F = (d) => "/fav/" + d + ".png";
let nextId = 1;
function tab(windowId, title, url, fav, extra = {}) {
	return { id: nextId++, windowId, title, url, favIconUrl: fav, active: false, pinned: false, audible: false,
		discarded: false, highlighted: false, incognito: false, status: "complete", mutedInfo: { muted: false }, ...extra };
}

const W1 = 101, W2 = 102, W3 = 103;
const all = [
	// work
	tab(W1, "Fix login redirect loop · Issue #412 · acme/webapp", "https://github.com/acme/webapp/issues/412", F("github.com"), { active: true, pinned: true }),
	tab(W1, "Add dark mode tokens · Pull Request #418 · acme/webapp", "https://github.com/acme/webapp/pull/418", F("github.com")),
	tab(W1, "Array.prototype.findLast() - JavaScript | MDN", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findLast", F("developer.mozilla.org")),
	tab(W1, "How do I debounce a React input? - Stack Overflow", "https://stackoverflow.com/questions/23123138/debounce-react", F("stackoverflow.com")),
	tab(W1, "Fix login redirect loop · Issue #412 · acme/webapp", "https://github.com/acme/webapp/issues/412", F("github.com")),
	tab(W1, "Sprint board – Notion", "https://www.notion.so/acme/sprint-board", F("notion.so")),
	tab(W1, "Design system – Figma", "https://www.figma.com/file/acme-design-system", F("figma.com"), { discarded: true }),
	tab(W1, "react - npm", "https://www.npmjs.com/package/react", F("npmjs.com")),
	tab(W1, "Q3 planning - Google Docs", "https://docs.google.com/document/d/q3-planning", F("docs.google.com"), { discarded: true }),
	// life
	tab(W2, "Inbox (3) - you@acme.dev - Gmail", "https://mail.google.com/mail/u/0/#inbox", F("mail.google.com"), { active: true }),
	tab(W2, "Lofi beats to code to - YouTube", "https://www.youtube.com/watch?v=jfKfPfyJRdk", F("youtube.com"), { audible: true }),
	tab(W2, "(12) Home / X", "https://x.com/home", F("x.com")),
	tab(W2, "r/webdev - Reddit", "https://www.reddit.com/r/webdev/", F("reddit.com")),
	tab(W2, "Calendar - Week of Sep 28", "https://calendar.google.com/calendar/r/week", F("calendar.google.com")),
	tab(W2, "Lofi beats to code to - YouTube", "https://www.youtube.com/watch?v=jfKfPfyJRdk", F("youtube.com"), { audible: true, mutedInfo: { muted: true } }),
	tab(W2, "Discover Weekly - Spotify", "https://open.spotify.com/playlist/discover-weekly", F("spotify.com"), { audible: true, mutedInfo: { muted: true } }),
	tab(W2, "Mechanical keyboard - Amazon.com", "https://www.amazon.com/s?k=mechanical+keyboard", F("amazon.com"), { discarded: true }),
	// research
	tab(W3, "Hacker News", "https://news.ycombinator.com/", F("news.ycombinator.com"), { active: true }),
	tab(W3, "Tab (interface) - Wikipedia", "https://en.wikipedia.org/wiki/Tab_(interface)", F("wikipedia.org"), { pinned: true }),
	tab(W3, "Information overload - Wikipedia", "https://en.wikipedia.org/wiki/Information_overload", F("wikipedia.org")),
	tab(W3, "Hacker News", "https://news.ycombinator.com/", F("news.ycombinator.com")),
	tab(W3, "Browser extension - Wikipedia", "https://en.wikipedia.org/wiki/Browser_extension", F("wikipedia.org"), { discarded: true }),
	tab(W3, "Ask HN: How many tabs do you keep open?", "https://news.ycombinator.com/item?id=41234567", F("news.ycombinator.com")),
];
for (const w of [W1, W2, W3]) all.filter((t) => t.windowId === w).forEach((t, i) => (t.index = i));

// positions for the window card's monitor map: Work and Life on the primary
// monitor, Research on the second one (see `displays` below)
const bounds = { [W1]: [0, 0, 1600, 900], [W2]: [400, 120, 1200, 800], [W3]: [2200, 100, 1800, 1000] };
const winList = [W1, W2, W3].map((id, i) => ({ id, focused: i === 0, incognito: false, type: "normal", state: "normal",
	left: bounds[id][0], top: bounds[id][1], width: bounds[id][2], height: bounds[id][3] }));

// Two monitors: chrome.system.display.getInfo() (the Chrome build, with the
// permission granted below) and, for the Firefox build, the popup's own
// screen (popupScreen() reads screen.avail*): the primary one
const displays = [
	{ id: "1", isPrimary: true, bounds: { left: 0, top: 0, width: 1920, height: 1080 }, workArea: { left: 0, top: 0, width: 1920, height: 1040 } },
	{ id: "2", isPrimary: false, bounds: { left: 1920, top: -180, width: 2560, height: 1440 }, workArea: { left: 1920, top: -180, width: 2560, height: 1400 } },
];
for (const [k, v] of Object.entries({ availLeft: 0, availTop: 0, availWidth: 1920, availHeight: 1040 })) {
	Object.defineProperty(screen, k, { get: () => v, configurable: true });
}
const withTabs = (w) => ({ ...w, tabs: all.filter((t) => t.windowId === w.id) });

// One frozen clock. It is an absolute constant, not `Date.now()` at load time,
// so every "x ago" label — including the <time> elements changelog.js fills in
// from real release dates — is identical on every run, forever.
const now = Date.parse("2030-06-01T12:00:00.000Z");
Date.now = () => now;

// Fields only the stats card reads (hover a tab / a window's age label), none
// of them drawn anywhere else. lastAccessed also picks the duplicate kept by
// Highlight Duplicates, so every first copy of a url stays the most recent
// one, exactly as it was without timestamps (first in order wins).
const MIN = 60e3, HOUR = 60 * MIN, DAY = 24 * HOUR;
const lastUsed = {
	// work
	1: 0, 2: 12 * MIN, 3: 95 * MIN, 4: 4 * HOUR, 5: 2 * DAY, 6: 30 * MIN, 7: 6 * DAY, 8: 3 * HOUR, 9: 9 * DAY,
	// life
	10: 25 * MIN, 11: 40 * MIN, 12: 45 * MIN, 13: 20 * HOUR, 14: 5 * HOUR, 15: 26 * HOUR, 16: 2 * DAY, 17: 12 * DAY,
	// research
	18: 3 * HOUR, 19: 7 * HOUR, 20: 2 * DAY, 21: 3 * DAY, 22: 14 * DAY, 23: 10 * HOUR,
};
for (const t of all) t.lastAccessed = now - lastUsed[t.id];
// opened from: the PR from the issue, the second Lofi tab from r/webdev, an
// article from another
Object.assign(all.find((t) => t.id === 2), { openerTabId: 1 });
Object.assign(all.find((t) => t.id === 15), { openerTabId: 13 });
Object.assign(all.find((t) => t.id === 20), { openerTabId: 19 });
// why the muted tabs are muted
all.find((t) => t.id === 15).mutedInfo.reason = "user";
all.find((t) => t.id === 16).mutedInfo.reason = "extension";
// page zoom (tabs.getZoom); 1 everywhere else
const zoom = { 2: 1.25, 15: 1.1 };

// two saved windows, so the "Saved windows" section and the session cards render
const sessionTab = (i, title, url, fav, extra = {}) =>
	({ id: 9000 + i, index: i, windowId: 900, title, url, favIconUrl: fav, active: false, pinned: false, audible: false,
		discarded: false, highlighted: false, incognito: false, status: "complete", mutedInfo: { muted: false }, ...extra });
const session = (id, name, color, ageMs, tabs) => ({
	id, name, color, customName: true, incognito: false, date: now - ageMs, sessionStartTime: now - ageMs,
	tabs, windowsInfo: { id: 900, focused: false, incognito: false, type: "normal", state: "normal", left: 0, top: 0, width: 1600, height: 900 },
});
const sessions = {
	s1: session("s1", "Conference reading", "color4", 2 * 24 * 3600e3, [
		sessionTab(0, "Hacker News", "https://news.ycombinator.com/", F("news.ycombinator.com"), { pinned: true }),
		sessionTab(1, "Tab (interface) - Wikipedia", "https://en.wikipedia.org/wiki/Tab_(interface)", F("wikipedia.org")),
		sessionTab(2, "react - npm", "https://www.npmjs.com/package/react", F("npmjs.com"), { discarded: true }),
		sessionTab(3, "Lofi beats to code to - YouTube", "https://www.youtube.com/watch?v=jfKfPfyJRdk", F("youtube.com")),
	]),
	s2: session("s2", "Tax 2029", "color15", 21 * 24 * 3600e3, [
		sessionTab(0, "Q3 planning - Google Docs", "https://docs.google.com/document/d/q3-planning", F("docs.google.com")),
		sessionTab(1, "Inbox (3) - you@acme.dev - Gmail", "https://mail.google.com/mail/u/0/#inbox", F("mail.google.com")),
		sessionTab(2, "Mechanical keyboard - Amazon.com", "https://www.amazon.com/s?k=mechanical+keyboard", F("amazon.com")),
	]),
};

const store = {
	layout: "blocks", tabWidth: 800, tabHeight: 600, animations: false, windowTitles: true, tabactions: true, badge: true,
	openInOwnTab: false, compact: false, dark: false, theme: "light", sessionsFeature: true, hideWindows: false, "filter-tabs": false, tabLimit: 0,
	version: "7.0.0", migrated: true,
	windowNames: { [W1]: "Work", [W2]: "Life", [W3]: "Research" },
	windowColors: { [W1]: "color9", [W2]: "color1", [W3]: "color6" },
	windowAge: [W1, W2, W3],
	windowLastActive: { [W1]: now - 60e3, [W2]: now - 25 * 60e3, [W3]: now - 3 * 3600e3 },
	sessions,
};
// a page shot with its own theme (shoot.mjs, `ownTheme`) seeds settings here
// before any script runs, the way the extension's storage would already hold them
Object.assign(store, globalThis.__fakeSeed || {});

const listeners = new Set();
const event = () => ({ addListener() {}, removeListener() {}, hasListener: () => false });
const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export const storage = {
	local: {
		async get(keys) {
			const out = {};
			if (keys == null) return clone(store);
			if (typeof keys === "string") keys = [keys];
			if (Array.isArray(keys)) { for (const k of keys) if (k in store) out[k] = clone(store[k]); return out; }
			for (const [k, def] of Object.entries(keys)) out[k] = k in store ? clone(store[k]) : def;
			return out;
		},
		async set(obj) {
			const changes = {};
			for (const [k, v] of Object.entries(obj)) { changes[k] = { oldValue: store[k], newValue: clone(v) }; store[k] = clone(v); }
			for (const l of listeners) l(changes, "local");
		},
		async remove(keys) { for (const k of [].concat(keys)) delete store[k]; },
	},
	session: { async get(d) { return d || {}; }, async set() {} },
	onChanged: { addListener: (l) => listeners.add(l), removeListener: (l) => listeners.delete(l) },
};

export const windows = {
	async getAll() { return winList.map(withTabs); },
	async get(id) { return withTabs(winList.find((w) => w.id === id)); },
	async getLastFocused() { return withTabs(winList[0]); },
	async getCurrent() { return withTabs(winList[0]); },
	async update() {}, async remove() {}, async create() { return withTabs(winList[0]); },
	onCreated: event(), onRemoved: event(), onFocusChanged: event(),
};

export const tabs = {
	async query(q = {}) {
		return all.filter((t) => (q.windowId == null || t.windowId === q.windowId) && (q.active == null || t.active === q.active));
	},
	async update() {}, async remove() {}, async move() {}, async discard() {}, async create() {}, async captureTab() { return ""; },
	async getZoom(id) { return zoom[id] || 1; },
	onCreated: event(), onUpdated: event(), onRemoved: event(), onMoved: event(), onActivated: event(),
	onAttached: event(), onDetached: event(), onReplaced: event(),
};

export const runtime = {
	id: "demo",
	getURL: (p) => location.origin + "/" + p,
	async sendMessage() { return undefined; },
	onMessage: event(),
	openOptionsPage() {},
};
// the only permission the app asks about is the optional system.display:
// granted, unless a shot sets globalThis.__fakeGranted = false (shoot.mjs)
export const permissions = { async contains() { return globalThis.__fakeGranted !== false; }, async request() { return globalThis.__fakeGranted !== false; }, async remove() { return true; }, onAdded: event(), onRemoved: event() };
export const action = { async setPopup() {}, async openPopup() {} };
export const sidebarAction = undefined;
export const extension = { async isAllowedIncognitoAccess() { return false; } };
// one bound and one unbound command, so the options screen's shortcut list
// shows both a key and its "Not set" state
export const commands = {
	async openShortcutSettings() {},
	async getAll() {
		return [
			{ name: "_execute_action", description: "", shortcut: "Alt+Shift+M" },
			{ name: "switch_to_previous_active_tab", description: "Switches to previously active tab", shortcut: "" },
		];
	},
};

// the video drives settings through the same storage the options page writes
globalThis.__fake = { storage };
// The header tip is picked with Math.random() once per popup open (TabManager.tsx;
// it used to be on every render, which this pin hid). A constant pins the tip
// across runs whatever else draws random numbers first.
Math.random = () => 0.4218;
// headless Chrome already defines window.chrome (without .runtime), so merge
globalThis.chrome = Object.assign({}, globalThis.chrome, { runtime: { id: "demo" }, permissions, system: { display: { async getInfo() { return clone(displays); } } } });
export default { storage, windows, tabs, runtime, permissions, action, extension, commands };
