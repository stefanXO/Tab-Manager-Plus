"use strict";

import * as browser from 'webextension-polyfill';
import {ITabManagerState, ISavedSession} from "@types";
import {LAYOUT, currentShowMonitors} from "@helpers/settings";
import {popupScreen} from "@helpers/popup_size";
import {onMainScreen} from "./screen";
import {tabStats, savedTabStats, savedWindowStats, savedWindowsWith, windowStats, topSites, monitorMap, Bounds, MonitorMap, Rect} from "./stats";
import {predictLanding, knownDisplayList} from "@helpers/geometry";
import {savedTabKeys} from "./sessionKeys";
import {savedTile} from "./savedTiles";
import {shownSavedName} from "./sessionEdit";
import {hoverKey, hoverAction, isWarm, parseKey, arrowsMoveCard, STATS_KEYBOARD_DELAY} from "./statsHoverLogic";
import type {IStatsFavicon, IStatsCardContent} from "./views/StatsCard";

// how many site favicons the window card shows
const STATS_WINDOW_SITES = 4;
// the window card's monitor map, CSS px (several monitors side by side get
// the full width; the height limit keeps stacked ones in bounds)
const STATS_MAP_WIDTH = 180;
const STATS_MAP_HEIGHT = 90;
// the landing preview's rect in the map goes by this window id (no open
// window has a negative one)
const LANDING_ID = -2;

// what the open card is for, and where it opened: at the pointer (it then
// follows it) or next to an element (the keyboard's selected row)
export interface IStatsTarget {
	// "saved": a tab of a saved window, id is its selection key (sessionKeys.ts);
	// "session": a saved window, `session` is its id (and id is -1)
	kind : "tab" | "window" | "saved" | "session";
	id : number;
	session? : string;
	pointer? : { x : number, y : number };
	anchor? : Rect;
}

// the manager's data the cards are built from, read when a card opens
export type StatsState = Pick<ITabManagerState,
	"tabsbyid" | "windowsbyid" | "windows" | "windowrefs" | "lastActive" | "lastOpenWindow" |
	"selection" | "layout" | "optionsActive" | "colorsActive" | "colorsSession" | "compact">;
export interface StatsSource {
	state() : StatsState;
	searchBox() : HTMLInputElement | null;
	// the saved windows on show (one waiting for its Undo countdown is not)
	sessions() : ISavedSession[];
}

// the card (StatsLayer): what the controller drives
export interface StatsView {
	isOpen() : boolean;
	current() : IStatsTarget | null;
	show(target : IStatsTarget, zoom : number | undefined) : void;
	setZoom(tabId : number, zoom : number) : void;
	reanchor(anchor : Rect) : void;
	close() : void;
	follow(x : number, y : number) : void;
	// the data behind an open card changed (the monitors arrived)
	refresh() : void;
}

// The stats card's hover controller: when a card opens, swaps, follows,
// closes (statsHoverLogic.ts has the rules), and what it shows. It listens on
// the popup's root element itself (native listeners, no React handlers), so
// none of this goes through TabManager: TabManager only mounts StatsLayer,
// which owns one of these.
export class StatsHover {
	private readonly view : StatsView;
	private readonly source : StatsSource;
	private root : HTMLElement | null = null;
	// what the pending or open card is for ("t<id>", "w<id>", "key", "" none),
	// so moving around inside the same tile does not restart the delay
	private key = "";
	// when the pointer last left every target with a card open (chaining)
	private leftAt = 0;
	private timer = 0;
	// the last pointer position over the popup: a card opens next to the
	// pointer (which may have moved since mouseover) and then follows it
	private readonly pointer = { x: 0, y: 0 };
	// tabs.getZoom answers, per tab, for this popup's life
	private readonly zoomCache = new Map<number, number>();
	// the monitors for the window card's map, and the ones a restore knows
	// (`restore`, for the saved window card's landing preview), see loadDisplays()
	private displays : { list : Bounds[], onlyPopup : boolean, restore : Bounds[] } | null = null;

	constructor(view : StatsView, source : StatsSource) {
		this.view = view;
		this.source = source;
	}

	attach(root : HTMLElement) {
		this.detach();
		this.root = root;
		root.addEventListener("mouseover", this.onOver);
		root.addEventListener("mousemove", this.onMove);
		root.addEventListener("mouseleave", this.close);
		root.addEventListener("mousedown", this.close, true);
		root.addEventListener("scroll", this.onScroll, true);
		root.addEventListener("keydown", this.onKey);
		// the monitors, once, off the first render
		this.loadDisplays();
		if (!IS_FIREFOX) {
			browser.permissions.onAdded?.addListener(this.onPermission);
			browser.permissions.onRemoved?.addListener(this.onPermission);
			browser.storage.onChanged.addListener(this.onStorage);
		}
	}

	detach() {
		clearTimeout(this.timer);
		const root = this.root;
		if (!root) return;
		this.root = null;
		root.removeEventListener("mouseover", this.onOver);
		root.removeEventListener("mousemove", this.onMove);
		root.removeEventListener("mouseleave", this.close);
		root.removeEventListener("mousedown", this.close, true);
		root.removeEventListener("scroll", this.onScroll, true);
		root.removeEventListener("keydown", this.onKey);
		if (!IS_FIREFOX) {
			browser.permissions.onAdded?.removeListener(this.onPermission);
			browser.permissions.onRemoved?.removeListener(this.onPermission);
			browser.storage.onChanged.removeListener(this.onStorage);
		}
	}

	// ---- the events ----

	private readonly onOver = (e : MouseEvent) => {
		this.track(e);
		const key = hoverKey(e.target as Element);
		const action = hoverAction(key, this.key, this.view.isOpen(), isWarm(this.view.isOpen(), Date.now(), this.leftAt));
		if (action.kind === "none") return;
		clearTimeout(this.timer);
		if (action.kind === "close") {
			if (action.left) this.leftAt = Date.now();
			this.close();
			return;
		}
		this.key = key;
		const parsed = parseKey(key);
		if (!parsed) return;
		// a saved tab goes by the selection key its tile was given, a saved
		// window by its id
		const kind = parsed.kind;
		const id = parsed.kind === "saved" ? savedTabKeys.key(parsed.sessionId, parsed.index) : parsed.kind === "session" ? -1 : parsed.id;
		const session = parsed.kind === "session" ? parsed.sessionId : undefined;
		if (action.delay === 0) this.show(kind, id, false, session);
		else this.timer = window.setTimeout(() => this.show(kind, id, false, session), action.delay);
	}

	// the card follows the pointer right away, in the same event, straight
	// on the card's element (a transform: no React render, no layout)
	private readonly onMove = (e : MouseEvent) => {
		this.track(e);
	}

	private track(e : MouseEvent) {
		this.pointer.x = e.clientX;
		this.pointer.y = e.clientY;
		this.view.follow(e.clientX, e.clientY);
	}

	private readonly onKey = (e : KeyboardEvent) => {
		if (e.keyCode === 27) {
			if (this.view.isOpen()) {
				// a card is open: Escape closes just that, not the popup (and
				// TabManager's own Escape handling never sees the key)
				e.preventDefault();
				e.stopPropagation();
			}
			this.close();
			return;
		}
		const st = this.source.state();
		const search = this.source.searchBox();
		const caret = !!search && document.activeElement === search && !!search.value;
		if (arrowsMoveCard(e.keyCode, st.layout === LAYOUT.list, onMainScreen(st), caret)) this.keyboard();
	}

	// the list scrolled under the keyboard's card: keep it next to its row
	// (a card at the pointer stays with the pointer)
	private readonly onScroll = () => {
		const t = this.view.current();
		if (!t || !t.anchor) return;
		const anchor = this.anchor(t.id);
		if (!anchor) this.close();
		else this.view.reanchor(anchor);
	}

	// ---- opening and closing ----

	// the arrows moved the selection in the list view: the card follows it,
	// once the keys have rested (TabManager has moved the selection by then)
	private keyboard() {
		this.close();
		this.key = "key";
		this.timer = window.setTimeout(() => {
			const selection = this.source.state().selection;
			if (selection.size !== 1) return;
			this.show("tab", [...selection][0], true);
		}, STATS_KEYBOARD_DELAY);
	}

	readonly close = () => {
		clearTimeout(this.timer);
		this.key = "";
		this.view.close();
	}

	// the keyboard's card sits next to the selected row
	private anchor(id : number) : Rect | null {
		const el = document.getElementById("tab-" + id);
		// hidden by the search filter
		if (!el || el.offsetParent === null) return null;
		return el.getBoundingClientRect();
	}

	private show(kind : IStatsTarget["kind"], id : number, keyboard = false, session? : string) {
		const st = this.source.state();
		if (!onMainScreen(st)) return;
		const exists = kind === "saved" ? !!this.savedTab(id)
			: kind === "session" ? this.source.sessions().some((s) => s.id === session)
			: kind === "tab" ? st.tabsbyid.has(id) : st.windowsbyid.has(id);
		if (!exists) return;
		let target : IStatsTarget;
		if (keyboard) {
			const anchor = this.anchor(id);
			if (!anchor) return;
			target = { kind, id, anchor };
		} else {
			target = { kind, id, session, pointer: { ...this.pointer } };
		}
		// a zoom asked for before (this popup) is shown at once, no line popping in
		const cached = kind === "tab" ? this.zoomCache.get(id) : undefined;
		this.view.show(target, cached);
		if (kind !== "tab" || cached !== undefined || !browser.tabs.getZoom) return;
		// async and allowed to fail (a sleeping tab, a restricted page): the
		// line is simply added when the answer comes, if the card is still up
		browser.tabs.getZoom(id).then((z) => {
			this.zoomCache.set(id, z);
			this.view.setZoom(id, z);
		}, () => {});
	}

	// ---- what a card shows ----

	private windowName(windowId : number) : string {
		const w = this.source.state().windowrefs.get(windowId)?.current;
		return w ? w.shownName() : "";
	}

	// the favicon the tile resolved (Tab.resolveFavIconUrl), with the tone the
	// tile measured; none (src null): the card draws the tile's page icon
	private favicon(tab : browser.Tabs.Tab) : IStatsFavicon {
		return this.tileFavicon(this.source.state().windowrefs.get(tab.windowId)?.current?.state.tabrefs.get(tab.id)?.current);
	}

	private tileFavicon(tile : { state : { favIcon : string, iconTone : IStatsFavicon["tone"] } } | null | undefined) : IStatsFavicon {
		if (!tile || !tile.state.favIcon) return { src: null, tone: "normal" };
		return { src: tile.state.favIcon, tone: tile.state.iconTone };
	}

	// ---- saved windows ----

	// a saved window's name as its title shows it (shownSavedName: its own
	// name, else the automatic one from its sites as made now)
	private savedName(s : ISavedSession) : string {
		return shownSavedName(s, this.source.state().compact) || "Saved window";
	}

	// the saved tab a selection key was handed out for, with its saved window
	private savedTab(key : number) : { session : ISavedSession, tab : browser.Tabs.Tab } | null {
		const ref = savedTabKeys.ref(key);
		if (!ref) return null;
		const session = this.source.sessions().find((s) => s.id === ref.sessionId);
		const tab = session && session.tabs.find((t) => t.index === ref.index);
		return session && tab ? { session, tab } : null;
	}

	// The monitors for the window card's map: fetched once, right after the
	// popup has loaded (never when a card opens), and again when the
	// system.display permission or the "Show all monitors" setting changes
	// while the popup is open. Chrome with that optional permission (options:
	// "Show all monitors", or "Minimize inactive windows") and the setting not
	// "off": every monitor, the primary one first; else (Chrome without it or
	// switched off, Firefox) the popup's own monitor, `onlyPopup`. Applies the
	// setting's unset -> on rule on the way (helpers/monitors.ts).
	// The landing preview needs what the worker will know when it restores:
	// every monitor's work area whenever the permission is granted (whatever
	// the setting), after the popup's own (helpers/geometry.ts knownDisplayList).
	private displaysRun = 0;
	private async loadDisplays() {
		const run = ++this.displaysRun;
		let list : Bounds[] = [];
		let restore = knownDisplayList(popupScreen(), []);
		if (!IS_FIREFOX) {
			try {
				const show = (await currentShowMonitors()).enabled;
				const granted = show || await browser.permissions.contains({ permissions: ["system.display"] });
				const info = granted ? await chrome.system.display.getInfo() : [];
				restore = knownDisplayList(popupScreen(), info);
				if (show) {
					list = info
						.map((d, i) => ({ d, i }))
						.sort((a, b) => (Number(!!b.d.isPrimary) - Number(!!a.d.isPrimary)) || a.i - b.i)
						.map(({d}) => ({ left: d.bounds.left, top: d.bounds.top, width: d.bounds.width, height: d.bounds.height }));
				}
			} catch {
				// no permission API / no displays: the popup's monitor
			}
		}
		// only the latest load counts: an older one may have read the setting
		// from before a switch
		if (run !== this.displaysRun) return;
		this.displays = list.length ? { list, onlyPopup: false, restore } : { list: [popupScreen()], onlyPopup: true, restore };
		// an open window card picks the map up
		this.view.refresh();
	}

	// granted (options) or given back while the popup is open: fetch again
	// (a grant also turns an "unset" setting "on")
	private readonly onPermission = (p : browser.Permissions.Permissions) => {
		if (p.permissions && (p.permissions as string[]).indexOf("system.display") > -1) this.loadDisplays();
	}
	// "Show all monitors" switched in the options screen of this popup
	private readonly onStorage = (changes : Record<string, browser.Storage.StorageChange>, area : string) => {
		if (area === "local" && changes.showMonitors) this.loadDisplays();
	}

	private map(windowId : number) : MonitorMap | null {
		if (!this.displays) return null;
		return monitorMap(this.displays.list, this.source.state().windows, windowId, STATS_MAP_WIDTH, STATS_MAP_HEIGHT);
	}

	// The card of a saved window. Its landing preview: where Restore would put
	// it now (helpers/geometry.ts predictLanding, the worker's own placement,
	// over the displays the worker will know), drawn in the monitor map over
	// the open windows. Once the monitors are known, as for the window card.
	private resolveSession(id : string | undefined, now : number) : IStatsCardContent | null {
		const s = this.source.sessions().find((x) => x.id === id);
		if (!s) return null;
		const info = s.windowsInfo || {} as ISavedSession["windowsInfo"];
		let map : MonitorMap | null = null;
		let landing : Parameters<typeof savedWindowStats>[2]["landing"];
		if (this.displays) {
			const l = predictLanding(info, this.displays.restore);
			const windows = this.source.state().windows;
			map = monitorMap(this.displays.list, l.bounds ? [...windows, { id: LANDING_ID, ...l.bounds }] : windows, LANDING_ID, STATS_MAP_WIDTH, STATS_MAP_HEIGHT);
			landing = { bounds: l.bounds, maximized: l.maximized, monitor: map ? map.monitor : null };
		}
		const card = savedWindowStats(info, s.tabs, { now, name: this.savedName(s), savedAt: s.date, updatedAt: s.updated, landing });
		const sites = topSites(s.tabs, STATS_WINDOW_SITES).map((tab) => this.tileFavicon(savedTile(savedTabKeys.key(s.id, tab.index))));
		return { card, sites, saved: true, map: map && map.target ? map : null };
	}

	// the card of a target, from the manager's data; null: nothing to show
	resolve(t : IStatsTarget, zoom : number | undefined) : IStatsCardContent | null {
		const st = this.source.state();
		if (!onMainScreen(st)) return null;
		const now = Date.now();
		if (t.kind === "tab") {
			const tab = st.tabsbyid.get(t.id);
			if (!tab) return null;
			const win = st.windowsbyid.get(tab.windowId);
			const card = tabStats(tab, {
				now,
				windowTabs: win && win.tabs ? win.tabs : [tab],
				allTabs: st.tabsbyid.values(),
				windowName: (id) => this.windowName(id),
				zoom,
				savedIn: savedWindowsWith(tab.url || tab.pendingUrl, this.source.sessions().map((s) => ({ name: this.savedName(s), tabs: s.tabs })))
			});
			return { card, icon: this.favicon(tab), url: tab.url || tab.pendingUrl || "" };
		}
		if (t.kind === "saved") {
			const saved = this.savedTab(t.id);
			if (!saved) return null;
			const card = savedTabStats(saved.tab, {
				now,
				savedAt: saved.session.date,
				updatedAt: saved.session.updated,
				windowName: this.savedName(saved.session),
				windowTabs: saved.session.tabs,
				allTabs: st.tabsbyid.values(),
				openWindowName: (id) => this.windowName(id)
			});
			return { card, icon: this.tileFavicon(savedTile(t.id)), url: saved.tab.url || saved.tab.pendingUrl || "" };
		}
		if (t.kind === "session") return this.resolveSession(t.session, now);
		const win = st.windowsbyid.get(t.id);
		if (!win) return null;
		const map = this.map(t.id);
		const card = windowStats(win, win.tabs || [], {
			now,
			name: this.windowName(t.id),
			lastActive: st.lastActive.get(t.id),
			focused: st.lastOpenWindow === t.id,
			offscreen: !!map && map.offscreen,
			monitor: map ? map.monitor : null,
			// Chrome only: Firefox has no way to know the other monitors
			monitorHint: !IS_FIREFOX && !!this.displays && this.displays.onlyPopup
		});
		const sites = topSites(win.tabs || [], STATS_WINDOW_SITES).map((tab) => this.favicon(tab));
		return { card, sites, map: map && !map.offscreen ? map : null };
	}
}
