// Stand-in for webextension-polyfill: the real popup code runs as a plain page, fed the windows, tabs and saved windows
// of shots.json (that file is inlined here by esbuild at build time). Storage lives in memory.
// Differences from tools/css-baseline/fake-browser.js: supportLinks: false (no Donate / Rate in the header), sessionsFeature: true
// (the 7.0 default: the bottom bar has "Save selected tabs"), a lastAccessed per tab (the clock / recent tabs highlight),
// two saved windows with ?saved, and the worker version answer.
import cfg from "./shots.json";

const F = (file) => "/app/fav/" + file;
let nextId = 1;
const NOW = Date.now();
const all = [];
const winList = cfg.windows.map((w) => ({ id: w.id, focused: !!w.focused, incognito: false, type: "normal", state: "normal", left: 0, top: 0, width: 1600, height: 900 }));
for (const w of cfg.windows) {
	w.tabs.forEach((t, index) => all.push({ id: nextId++, index, windowId: w.id, title: t.title, url: t.url, favIconUrl: F(t.favicon),
		lastAccessed: NOW - (t.ageMinutes ?? 0) * 60e3, active: !!t.active, pinned: !!t.pinned, audible: !!t.audible,
		discarded: !!t.discarded, highlighted: false, incognito: false, status: "complete", mutedInfo: { muted: !!t.muted } }));
}
const withTabs = (w) => ({ ...w, tabs: all.filter((t) => t.windowId === w.id) });

// one frozen clock, so "1 minute ago" stays put however long the render takes
const now = NOW;
Date.now = () => now;
const store = {
	...cfg.settings,
	windowNames: Object.fromEntries(cfg.windows.map((w) => [w.id, w.name])),
	windowColors: Object.fromEntries(cfg.windows.map((w) => [w.id, w.color])),
	windowAge: cfg.windows.map((w) => w.id),
	windowLastActive: Object.fromEntries(cfg.windows.map((w) => [w.id, now - (w.lastActiveMinutes ?? 0) * 60e3])),
};

// The saved windows (named, coloured), only when the popup is loaded as /app/popup.html?saved (shot 8):
// the other shots stay without the "Saved windows" section. Same shape as tools/css-baseline/fake-browser.js
if (/[?&]saved(&|=|$)/.test(location.search)) {
	const sTab = (i, t) => ({ id: 9000 + i, index: i, windowId: 900, title: t.title, url: t.url, favIconUrl: F(t.favicon), active: false, pinned: false,
		audible: false, discarded: false, highlighted: false, incognito: false, status: "complete", mutedInfo: { muted: false } });
	store.sessions = {};
	cfg.saved.forEach((s, order) => {
		const ageMs = s.ageDays * 24 * 3600e3;
		store.sessions[s.id] = { id: s.id, name: s.name, color: s.color, customName: true, incognito: false, date: now - ageMs,
			sessionStartTime: now - ageMs, order: order + 1, tabs: s.tabs.map((t, i) => sTab(i, t)),
			windowsInfo: { id: 900, focused: false, incognito: false, type: "normal", state: "normal", left: 0, top: 0, width: 1600, height: 900 } };
	});
}

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
	onCreated: event(), onUpdated: event(), onRemoved: event(), onMoved: event(), onActivated: event(),
	onAttached: event(), onDetached: event(), onReplaced: event(),
};

export const runtime = {
	id: "demo",
	getURL: (p) => location.origin + "/" + p,
	// the worker this popup was built for (build-app.mjs defines REQUIRED_WORKER_VERSION), so no "out of date" notice
	async sendMessage(msg) { return msg && msg.command === "worker_version" ? REQUIRED_WORKER_VERSION : undefined; },
	onMessage: event(),
	openOptionsPage() {},
};
export const commands = { async getAll() { return [
	{ name: "_execute_action", description: "Open Tab Manager Plus", shortcut: "Alt+Shift+M" },
	{ name: "switch_to_previous_active_tab", description: "Switches to previously active tab", shortcut: "Alt+Shift+Comma" } ]; } };
export const extension = { async isAllowedIncognitoAccess() { return false; } };
export const permissions = { async contains() { return false; }, async request() { return false; } };
export const action = { async setPopup() {}, async openPopup() {} };
export const sidebarAction = undefined;

// the video drives settings through the same storage the options page writes
globalThis.__fake = { storage };
// the same tip every render
let seed = 7;
Math.random = () => 6.5 / 18; // always the tip "You can type to search right away"
globalThis.chrome = globalThis.chrome || { runtime: { id: "demo" }, permissions, system: {} };
export default { storage, windows, tabs, runtime, permissions, action, commands, extension };
