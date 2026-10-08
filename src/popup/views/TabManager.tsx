import {getLocalStorage, setLocalStorage, getLocalStorageMap} from "@helpers/storage";
import {readSettings, writeBootCache, SETTING_DEFAULTS, Settings, Layout, LAYOUT, getSetting, saveSetting} from "@helpers/settings";
import {sortWindows} from "@helpers/windows";
import {groupSelection, buildSavedWindow, newSessionId, savedText} from "@helpers/sessions";
import {parseQuery, matchTab, searchable} from "../search";
import {duplicatesTitle, findDuplicates} from "../duplicates";
import {recentTabs, recentText, recentTitle, RecentTabs, RECENT_LEVELS} from "../recent";
import {onMainScreen} from "../screen";
import {isSavedTabKey, tabKind, keepKind, onlySavedSelected, dropMissingSaved, savedTabKeys} from "../sessionKeys";
import {debounce, maybePluralize} from "@helpers/utils";
import {Window, Session, TabOptions, Tab, WindowOptions} from "@views";
import * as React from "react";
import * as S from "@strings";
import * as browser from 'webextension-polyfill';
import {ICommand, ITabManager, ITabManagerState, ISavedSession} from "@types";
import {ManagerContext, ITabManagerActions, ISettings} from "../context";
import {attachMasonry, Masonry} from "../masonry";
import {sizePopup} from "@helpers/popup_size";
import {applyTheme} from "@helpers/theme";
import {StatsLayer, StatsSource} from "./StatsLayer";
import {UndoNotice} from "./UndoNotice";
import {PendingDeletes, PendingItem, withoutItems, visibleSessions, noticeText, goneUrls} from "../pendingDelete";
import {savedDeleteItems} from "../savedDelete";
import {editSession, SessionEdit} from "../sessionEdit";
import {searchSaved, searchSummary, SavedSearch} from "../searchSaved";
import {draggedSaved, savedTabsToOpen, openedText} from "../savedDrag";
import {moveSession, reorderShown} from "../sessionOrder";
import {tidyStored, listSessions, addSessions} from "../sessionStore";
import {moveSavedTabs, remapSavedKeys, renumberedIndex, movedText, SavedTabMove, SavedDropTarget} from "../savedMove";
import {addOpenTabs, addedText, draggedOpen, SavedAddResult} from "../savedAdd";
import {SavedWrites, SavedChange} from "../savedWrites";
import type {SavedTabRef} from "../sessionKeys";
import {stackTiles, encodeSaved, encodeIds, TabDrag} from "../dragPayload";
import {setStackImage, StackTile} from "../dragImage";

// the saved window and stored index of each of these saved tab keys; keys
// the popup no longer knows are left out
function refsOf(keys : readonly number[]) : SavedTabRef[] {
	return keys.map((key) => savedTabKeys.ref(key)).filter((ref) : ref is SavedTabRef => !!ref);
}

// the ids of these open tabs
function tabIds(tabs : readonly browser.Tabs.Tab[]) : number[] {
	return tabs.map((tab) => tab.id).filter((id) : id is number => typeof id === "number");
}

// the focus is in a text box that holds text: Delete edits that text
function editingText() : boolean {
	const el = document.activeElement as HTMLInputElement | null;
	return !!el && el.tagName === "INPUT" && el.type === "text" && el.value !== "";
}

// the settings the manager holds in its state and applies
type ManagerSettings = Omit<Settings, "showMonitors">;

export class TabManager extends React.Component<ITabManager, ITabManagerState> {

    private readonly rootRef: React.RefObject<HTMLDivElement>;
	private readonly windowContainerRef: React.RefObject<HTMLDivElement>;
	private readonly searchBoxRef: React.RefObject<HTMLInputElement>;
	private readonly topHoverRef: React.RefObject<HTMLDivElement>;
	private readonly topBoxRef: React.RefObject<HTMLInputElement>;
	private readonly topBoxUrlRef: React.RefObject<HTMLInputElement>;
	private readonly actions: ITabManagerActions;
	// row-span packing for the block layouts, attached to whatever container is mounted
	private masonry : Masonry | null = null;
	private masonryTarget : HTMLElement | null = null;
	// The whole `sessions` object as storage has it (../sessionStore.ts tidied
	// it), and every change to it, one after the other (../savedWrites.ts)
	private readonly savedWrites = new SavedWrites<ISavedSession>({
		read: async () => tidyStored<ISavedSession>(await getLocalStorage(S.sessions, {})),
		write: (next) => setLocalStorage(S.sessions, next),
		show: (stored) => this.showSessions(stored),
		loaded: async (stored) => {
			if (this.unmounted) return;
			this.showSessions(stored);
			await this.update();
		}
	});
	// componentWillUnmount ran: the deletes it writes change no state
	private unmounted = false;
	// saved windows deleted and not yet removed from storage (the Undo notice)
	private readonly pending = new PendingDeletes({
		commit: (items, sync) => this.commitDeletes(items, sync),
		onChange: () => { if (!this.unmounted) this.forceUpdate(); }
	});
	// leaving the popup writes the deletes that are still counting down
	private readonly flushPending = () => this.pending.flush(true);
	private readonly flushPendingHidden = () => { if (document.visibilityState === "hidden") this.pending.flush(true); };

	private readonly runUpdate = () => this.setState({ dirty: true });
	// the saved tabs being dragged (../savedDrag.ts), from dragstart until the
	// drop or the drag's end; null while open tabs (or nothing) are dragged
	private draggingSaved : number[] | null = null;
	// the open tabs being dragged (the dragged one, or the selection it is in),
	// from dragstart until the drop or the drag's end: dropped on a saved
	// window they are copied into it (../savedAdd.ts)
	private draggingOpen : browser.Tabs.Tab[] | null = null;
	// the saved window whose card is being dragged (../sessionOrder.ts), from
	// dragstart until the drop or the drag's end
	private draggingSession : string | null = null;
	// saved tabs that a move (../savedMove.ts) just numbered anew, from the
	// change until the write shows it (showSessions carries the selection over)
	private renumbered : SavedTabMove[] | null = null;
	private readonly runSlowUpdate = debounce(this.runUpdate, 250);
	private readonly onRuntimeMessage = (message : unknown) => {
		const request = message as ICommand;

		switch (request.command) {
			case S.refresh_windows:
				const window_ids : number[] = request.window_ids;
				for (const window_id of window_ids) {
					const _window = this.state.windowrefs.get(window_id)?.current;
					if (!_window) continue;
					_window.checkSettings();
				}
				break;
		}
	}
	// the worker records window focus order (windowAge) after the same focus event
	// the popup reacts to; when its write lands, re-sort so the order is never stale
	private readonly onStorageChanged = (changes : Record<string, browser.Storage.StorageChange>, area : string) => {
		if (area !== "local") return;
		if (S.windowAge in changes) this.runUpdate();
		// another popup, sidebar or the options page changed a setting: follow it
		// (showMonitors is not the manager's: the stats card and the options
		// screen read it themselves)
		const changed = (Object.keys(SETTING_DEFAULTS) as (keyof Settings)[]).filter((key) : key is keyof ManagerSettings => key in changes && key !== "showMonitors");
		if (changed.length === 0) return;
		const next = this.currentSettings() as unknown as Record<string, unknown>;
		for (const key of changed) next[key] = changes[key].newValue ?? SETTING_DEFAULTS[key];
		this.applySettings(next as unknown as ManagerSettings);
	}

	constructor(props : ITabManager) {
		super(props);

		// the first render is complete when popup.tsx fetched everything up
		// front; the defaults only apply when the popup is mounted without it
		const boot = props.boot;
		const s = boot ? boot.settings : SETTING_DEFAULTS;
		let layout = s.layout;
		let animations = s.animations;
		let windowTitles = s.windowTitles;
		let compact = s.compact;
		let theme = s.theme;
		let tabactions = s.tabactions;
		let badge = s.badge;
		let sessionsFeature = s.sessionsFeature;
		let hideWindows = s.hideWindows;
		let supportLinks = s.supportLinks;
		let filterTabs = s["filter-tabs"];
		let tabLimit = s.tabLimit;
		let openInOwnTab = s.openInOwnTab;
		let tabWidth = s.tabWidth;
		let tabHeight = s.tabHeight;

		let resetTimeout = -1;

		this.state = {
			layout: layout,
			animations: animations,
			windowTitles: windowTitles,
			tabLimit: tabLimit,
			openInOwnTab: openInOwnTab,
			tabWidth: tabWidth,
			tabHeight: tabHeight,
			compact: compact,
			theme: theme,
			tabactions: tabactions,
			badge: badge,
			hideWindows: hideWindows,
			sessionsFeature: sessionsFeature,
			supportLinks: supportLinks,
			lastOpenWindow: -1,
			windows: [],
			lastActive: boot ? boot.lastActive : new Map(),
			sessions: [],
			selection: new Set(),
			lastSelect: 0,
			hiddenTabs: new Set(),
			tabsbyid: new Map(),
			windowsbyid: new Map(),
			windowrefs: new Map(),
			resetTimeout: resetTimeout,
			height: 600,
			hasScrollBar: false,
			focusUpdates: 0,
			topText: "",
			bottomText: "",
			lastDirection: "",
			optionsActive: !!this.props.optionsActive,
			filterTabs: filterTabs,
			dupTabs: false,
			recentLevel: 0,
			dragFavicon: "",
			colorsActive: 0,
			colorsSession: "",
			colorsAutoName: "",

			tabCount: 0,
			hiddenCount: 0,
			searchLen: 0,
			query: null,

			dirty: false
		};

		if (boot) Object.assign(this.state, this.windowState(sortWindows(boot.windows, boot.windowAge)));

		this.rootRef = React.createRef();
		this.windowContainerRef = React.createRef();
		this.searchBoxRef = React.createRef();

		this.actions = {
			select: (id) => this.select(id),
			selectTo: (id, tabs) => this.selectTo(id, tabs),
			deleteTab: (id) => this.deleteTab(id),
			drag: (e, id) => this.drag(e, id),
			drop: (id, before, dragged) => { this.drop(id, before, dragged); },
			dropWindow: (windowId, dragged) => { this.dropWindow(windowId, dragged); },
			dragFavicon: (icon) => this.dragFavicon(icon),
			dragEnd: () => { this.draggingSaved = null; this.draggingOpen = null; },
			dragSession: (id) => { this.draggingSession = id; if (id) this.draggingOpen = null; },
			sessionDropMoves: (target, before) => this.sessionDropMoves(target, before),
			dropSession: (target, before) => { void this.dropSession(target, before); },
			savedDropMoves: (sessionId, index, before) => this.savedDropMoves(sessionId, index, before),
			dropSaved: (sessionId, index, before, dragged) => { void this.dropSaved(sessionId, index, before, dragged); },
			hoverIcon: (text) => this.hoverIcon(text),
			openWindowOptions: (windowId, autoName) => this.setState({ colorsActive: windowId, colorsAutoName: autoName }),
			openSessionOptions: (id, autoName) => this.setState({ colorsSession: id, colorsAutoName: autoName }),
			editSession: (id, edit) => this.editSession(id, edit),
			closeWindowOptions: () => this.setState({ colorsActive: 0, colorsSession: "", colorsAutoName: "", dirty: true }),
			scrollTo: (what, id) => this.scrollTo(what, id),
			setSetting: (key, value) => this.setSetting(key, value),
			setBottomText: (text) => this.setState({ bottomText: text }),
			sessionSync: () => this.sessionSync(),
			addSavedWindows: (sessions) => this.addSavedWindows(sessions),
			deleteSession: (session) => this.deleteSession(session),
			reload: () => this.setState({ dirty: true }),
			rerender: () => this.forceUpdate()
		};
	}

	async componentDidUpdate(prevProps, prevState) {
		this.syncMasonry();
		if (this.state.dirty) {
			await this.update();
			this.setState({dirty: false});
		}
	}

	componentWillUnmount() {
		this.masonry?.disconnect();

		browser.tabs.onCreated.removeListener(this.runUpdate);
		browser.tabs.onUpdated.removeListener(this.runSlowUpdate);
		browser.tabs.onMoved.removeListener(this.runSlowUpdate);
		browser.tabs.onRemoved.removeListener(this.runUpdate);
		browser.tabs.onReplaced.removeListener(this.runSlowUpdate);
		browser.tabs.onDetached.removeListener(this.runUpdate);
		browser.tabs.onAttached.removeListener(this.runUpdate);
		browser.tabs.onActivated.removeListener(this.runSlowUpdate);

		browser.windows.onFocusChanged.removeListener(this.runUpdate);
		browser.windows.onCreated.removeListener(this.runUpdate);
		browser.windows.onRemoved.removeListener(this.runUpdate);

		browser.runtime.onMessage.removeListener(this.onRuntimeMessage);

		browser.storage.onChanged.removeListener(this.sessionSync);
		browser.storage.onChanged.removeListener(this.onStorageChanged);

		window.removeEventListener("pagehide", this.flushPending);
		document.removeEventListener("visibilitychange", this.flushPendingHidden);
		document.removeEventListener("dragend", this.dragDone);
		document.removeEventListener("drop", this.dragDone);
		// written from the copy; the component is going, its state stays
		this.unmounted = true;
		this.pending.flush(true);
	}

	syncMasonry() {
		const el = this.windowContainerRef.current;
		const wanted = el && this.state.layout !== LAYOUT.rows ? el : null;
		if (wanted === this.masonryTarget) return;
		this.masonry?.disconnect();
		this.masonry = wanted ? attachMasonry(wanted) : null;
		this.masonryTarget = wanted;
	}

	async loadStorage() {
		this.applySettings(await readSettings(window.extensionVersion));
	}

	currentSettings() : ManagerSettings {
		const st = this.state;
		return {
			layout: st.layout, tabLimit: st.tabLimit, tabWidth: st.tabWidth, tabHeight: st.tabHeight,
			animations: st.animations, windowTitles: st.windowTitles, tabactions: st.tabactions, badge: st.badge,
			openInOwnTab: st.openInOwnTab, compact: st.compact, theme: st.theme, sessionsFeature: st.sessionsFeature,
			hideWindows: st.hideWindows, supportLinks: st.supportLinks, "filter-tabs": st.filterTabs
		};
	}

	applySettings(s : ManagerSettings) {
		applyTheme(s.theme);
		if (window.inPopup) sizePopup(s.tabWidth, s.tabHeight);
		writeBootCache(s);
		this.setState({
			layout: s.layout,
			animations: s.animations,
			windowTitles: s.windowTitles,
			tabLimit: s.tabLimit,
			openInOwnTab: s.openInOwnTab,
			tabWidth: s.tabWidth,
			tabHeight: s.tabHeight,
			compact: s.compact,
			theme: s.theme,
			tabactions: s.tabactions,
			badge: s.badge,
			hideWindows: s.hideWindows,
			sessionsFeature: s.sessionsFeature,
			supportLinks: s.supportLinks,
			filterTabs: s["filter-tabs"]
		});
	}

	setSetting<K extends keyof ISettings>(key : K, value : ISettings[K]) {
		this.setState({ [key]: value } as Pick<ITabManagerState, K>, () => {
			// keep the synchronous boot cache current for the next open
			writeBootCache({ tabWidth: this.state.tabWidth, tabHeight: this.state.tabHeight, theme: this.state.theme, layout: this.state.layout, compact: this.state.compact });
		});
	}
	hoverOver = (e : React.MouseEvent<HTMLDivElement>) => {
		const el = (e.target as HTMLElement).closest<HTMLElement>("[data-hover], [title]");
		// data-hover-hold (an options section's help text): no idle clear, the
		// text stays while the pointer is anywhere inside the section and goes
		// once it moves onto something without a hover text
		this.hoverIcon(el ? (el.dataset.hover ?? el.title) : "", !!el && el.dataset.hoverHold !== undefined);
	}

	// The saved windows as shown: without the ones deleted and the tabs of the
	// others that were deleted, while their Undo countdown runs or the write is
	// on its way. The same objects until state.sessions or that changes (the
	// search's memo compares them).
	private shownMemo : { sessions : ISavedSession[], version : number, result : ISavedSession[] } | null = null;
	visibleSessions() : ISavedSession[] {
		const m = this.shownMemo;
		const version = this.pending.version;
		if (m && m.sessions === this.state.sessions && m.version === version) return m.result;
		const result = visibleSessions(this.state.sessions, this.pending.hiding());
		this.shownMemo = { sessions: this.state.sessions, version, result };
		return result;
	}

	// the stats card (StatsLayer, ../statsHover.ts) reads the manager's data
	// through this when a card opens; it listens on #root (its parent) itself
	private readonly statsSource : StatsSource = {
		state: () => this.state,
		searchBox: () => this.searchBoxRef.current,
		sessions: () => this.visibleSessions()
	};
	// What the search (or Highlight Duplicates / recent) does to the saved
	// windows, worked out again only when its inputs change (render runs on
	// every header hover).
	private savedMemo : { sessions : ISavedSession[], query : unknown, openOnly : boolean, result : SavedSearch } | null = null;
	savedSearch(sessions : ISavedSession[]) : SavedSearch {
		const query = this.state.query;
		const openOnly = this.state.dupTabs || this.state.recentLevel > 0;
		const m = this.savedMemo;
		if (m && m.sessions.length === sessions.length && m.sessions.every((s, i) => s === sessions[i]) && m.query === query && m.openOnly === openOnly) return m.result;
		const result = searchSaved(sessions, query, openOnly);
		this.savedMemo = { sessions, query, openOnly, result };
		return result;
	}
	hoverIcon = (text : string, hold = false) => {
		let bottom = " ";
		if (text.indexOf("\n") > -1) {
			const a = text.split("\n");
			text = a[0];
			bottom = a[1];
		}
		if (text === this.state.topText && bottom === this.state.bottomText) {
			// still over the same held help text: no idle clear pending
			if (hold) clearTimeout(this.state.resetTimeout);
			return;
		}
		// idle: clear the header after a while (not a held help text)
		clearTimeout(this.state.resetTimeout);
		this.headerOnly(() => this.setState({
			topText: text,
			bottomText: bottom,
			resetTimeout: hold ? undefined : setTimeout(() => this.headerOnly(() => this.setState({ topText: "", bottomText: "" })), 15000)
		}));
	}
	// ---- the window list, rendered again only when something it shows changed ----
	// The header text follows the pointer from tile to tile (hoverIcon): one
	// setState per mouseover. Re-rendering every window and tile for that
	// (TabManager's render) cost 70-130 ms per hover with ~200 tabs, and any
	// stats card update in the same event waited for it. A setState made
	// through headerOnly() leaves the window list's element as it was, so React
	// skips the whole subtree; every other setState / forceUpdate (all other
	// code paths, including in-place mutations of selection / hiddenTabs
	// followed by a setState or rerender()) bumps listVersion and renders it.
	private listVersion = 0;
	private headerUpdate = false;
	private listCache : { version : number, props : ITabManager, el : React.ReactNode } | null = null;
	headerOnly(fn : () => void) {
		this.headerUpdate = true;
		try { fn(); } finally { this.headerUpdate = false; }
	}
	setState<K extends keyof ITabManagerState>(state : ((prev : Readonly<ITabManagerState>, props : Readonly<ITabManager>) => Pick<ITabManagerState, K> | ITabManagerState | null) | Pick<ITabManagerState, K> | ITabManagerState | null, callback? : () => void) {
		if (!this.headerUpdate) this.listVersion++;
		super.setState(state, callback);
	}
	forceUpdate(callback? : () => void) {
		this.listVersion++;
		super.forceUpdate(callback);
	}
	cachedContainer(build : () => React.ReactNode) : React.ReactNode {
		const c = this.listCache;
		if (c && c.version === this.listVersion && c.props === this.props) return c.el;
		const el = build();
		this.listCache = { version: this.listVersion, props: this.props, el };
		return el;
	}
	render() {
		// let hiddenCount = this.state.hiddenCount || 0;
		let tabCount = this.state.tabCount;

		let haveMin = false;
		let haveSess = false;
		// only saved tabs selected: the open-tab actions below have nothing to act on
		const savedSel = onlySavedSelected(this.state.selection);
		const savedSelTitle = "Saved tabs are selected\nSelect open tabs to use this";
		const savedSelStyle : React.CSSProperties = { opacity: 0.25 };

		for (let i = this.state.windows.length - 1; i >= 0; i--) {
			if (this.state.windows[i].state === "minimized") haveMin = true;
		}

		// a deleted saved window (or tab) is hidden while its Undo countdown runs
		const sessions = this.visibleSessions();
		// the saved window the name / colour screen is open on
		const namedSession = this.state.colorsSession ? this.state.sessions.find((s) => s.id === this.state.colorsSession) : undefined;
		// the search, as far as it reaches saved tabs: which fade or hide
		const saved = this.savedSearch(sessions);
		if (this.state.sessionsFeature) {
			if (sessions.length > 0) haveSess = true;
			// with "Hide non-matching tabs" on, a saved window with no match
			// goes (its tabs hide, ../searchSaved.ts); the divider with the
			// last one
			if (haveSess && this.state.filterTabs && saved.active && saved.shown.size === 0) {
				haveSess = false;
			}
		}

		return (
			<ManagerContext.Provider value={this.actions}>
			<div
				id="root"
				className={
					(this.state.compact ? "compact" : "") +
					" " +
					(this.state.animations ? "animations" : "no-animations") +
					" " +
					(this.state.windowTitles ? "windowTitles" : "no-windowTitles") +
					(this.state.supportLinks ? "" : " no-supportLinks") +
					(this.pending.items.length ? " undo-showing" : "")
				}
				onKeyDown={this.checkKey}
				onMouseOver={this.hoverOver}
				tabIndex={0}
				ref={this.rootRef}
			>
				{!!this.state.colorsActive && <WindowOptions
					windowId={this.state.colorsActive}
					layout={this.state.layout}
					autoName={this.state.colorsAutoName}
				/>}
				{!!namedSession && <WindowOptions
					key={"session-options-" + namedSession.id}
					windowId={0}
					session={namedSession}
					layout={this.state.layout}
					autoName={this.state.colorsAutoName}
				/>}
				{/* keyed by layout: switching layouts remounts every card and tile, so the
				    entrance animation plays again for the new arrangement */}
				{this.cachedContainer(() => onMainScreen(this.state) && <div key={"container-" + this.state.layout} className={"window-container " + this.state.layout} ref={this.windowContainerRef} tabIndex={2}>
					{this.state.windows.map((window : browser.Windows.Window, order : number) => {
						if (window.state === "minimized") return;

						let windowRef = this.state.windowrefs.get(window.id) || React.createRef<Window>();
						if (!this.state.windowrefs.has(window.id)) {
							this.state.windowrefs.set(window.id, windowRef);
						}

						return (
							<Window
								key={"window" + window.id}
								window={window}
								tabs={window.tabs}
								incognito={window.incognito}
								layout={this.state.layout}
								selection={this.state.selection}
								searchActive={this.state.searchLen > 0}
								query={this.state.query}
								sessionsFeature={this.state.sessionsFeature}
								tabactions={this.state.tabactions}
								hiddenTabs={this.state.hiddenTabs}
								filterTabs={this.state.filterTabs}
								draggable={true}
								windowTitles={this.state.windowTitles}
								compact={this.state.compact}
								lastOpenWindow={this.state.lastOpenWindow}
								lastActive={this.state.lastActive.get(window.id)}
								order={order}
								ref={windowRef}
							/>
						);
					})}
					<div className={"hrCont " + (!haveMin ? "hidden" : "")}>
						<div className="hrDiv">
							<span className="hrSpan">Minimized windows</span>
						</div>
					</div>
					{this.state.windows.map((window : browser.Windows.Window, order : number) => {
						if (window.state !== "minimized") return;

						let windowRef = this.state.windowrefs.get(window.id) || React.createRef<Window>();
						if (!this.state.windowrefs.has(window.id)) {
							this.state.windowrefs.set(window.id, windowRef);
						}

						return (
							<Window
								key={"window" + window.id}
								window={window}
								tabs={window.tabs}
								incognito={window.incognito}
								layout={this.state.layout}
								selection={this.state.selection}
								searchActive={this.state.searchLen > 0}
								query={this.state.query}
								sessionsFeature={this.state.sessionsFeature}
								tabactions={this.state.tabactions}
								hiddenTabs={this.state.hiddenTabs}
								filterTabs={this.state.filterTabs}
								draggable={true}
								windowTitles={this.state.windowTitles}
								compact={this.state.compact}
								lastOpenWindow={this.state.lastOpenWindow}
								lastActive={this.state.lastActive.get(window.id)}
								order={order}
								ref={windowRef}
							/>
						);
					})}
					<div className={"hrCont " + (!haveSess ? "hidden" : "")}>
						<div className="hrDiv">
							<span className="hrSpan">Saved windows</span>
						</div>
					</div>
					{haveSess
						? sessions.map((window : ISavedSession) => {
								return (
									<Session
										key={"session" + window.id}
										session={window}
										tabs={window.tabs}
										incognito={window.incognito}
										layout={this.state.layout}
										selection={this.state.selection}
										searchActive={this.state.searchLen > 0}
										query={this.state.query}
										tabactions={this.state.tabactions}
										hiddenTabs={saved.hidden}
										filterTabs={this.state.filterTabs}
										windowTitles={this.state.windowTitles}
									/>
								);
							})
						: false}
				</div>)}
				{this.state.optionsActive && <div className={"options-container"}>
					<TabOptions
						compact={this.state.compact}
						theme={this.state.theme}
						animations={this.state.animations}
						windowTitles={this.state.windowTitles}
						tabLimit={this.state.tabLimit}
						openInOwnTab={this.state.openInOwnTab}
						tabWidth={this.state.tabWidth}
						tabHeight={this.state.tabHeight}
						tabactions={this.state.tabactions}
						badge={this.state.badge}
						hideWindows={this.state.hideWindows}
						sessionsFeature={this.state.sessionsFeature}
						supportLinks={this.state.supportLinks}
						sessions={sessions}
						windowCount={this.state.windows.length}
						tabCount={this.state.tabCount}
					/>
				</div>}
				<div className="window top" ref={this.topHoverRef}>
					{this.state.supportLinks && <div className="icon windowaction donate" title="Donate a Coffee" onClick={this.donate} />}
					{this.state.supportLinks && <div
						className="icon windowaction rate"
						title="Rate Tab Manager Plus"
						onClick={this.rateExtension}
					/>}
					<div className="icon windowaction options" title="Options" onClick={this.toggleOptions} />
					<input
						type="text"
						disabled={true}
						className="tabtitle"
						ref={this.topBoxRef}
						placeholder={maybePluralize(tabCount, 'tab') + " in " + maybePluralize(this.state.windows.length, 'window')}
						value={this.state.topText}
					/>
					<input type="text" disabled={true} className="taburl" ref={this.topBoxUrlRef} placeholder={this.tip} value={this.state.bottomText} />
				</div>
				{onMainScreen(this.state) && <div className={"window searchbox"}>
					<table>
						<tbody>
							<tr>
								<td className="one">
									<input className="searchBoxInput" type="text" placeholder="Start typing to search tabs..." aria-describedby="search-help" tabIndex={1} onChange={this.search} ref={this.searchBoxRef} />
									<div className="search-help" role="tooltip" id="search-help">
										<p className="search-help-intro">Type to search titles and urls, in saved windows too. Every word must match.</p>
										<table className="search-help-table">
											<tbody>
												<tr><td><code>github issue</code></td><td>both words, anywhere</td></tr>
												<tr><td><code>github OR reddit</code></td><td>either word matches</td></tr>
												<tr><td><code>t:release</code></td><td>title only</td></tr>
												<tr><td><code>u:youtube</code></td><td>url only</td></tr>
												<tr><td><code>s:tax</code></td><td>saved windows only</td></tr>
												<tr><td><code>s:</code></td><td>show only saved windows</td></tr>
												<tr><td><code>-reddit</code></td><td>leave out matching tabs</td></tr>
												<tr><td><code>-u:old.reddit</code></td><td>leave out by url</td></tr>
												<tr><td><code>"pull request"</code></td><td>exact phrase</td></tr>
												<tr><td><code>/\(\d+\)/</code></td><td>unread count, like "Inbox (3)"</td></tr>
												<tr><td><code>/localhost:\d+/</code></td><td>local dev servers, any port</td></tr>
												<tr><td><code>/\.pdf$/</code></td><td>urls ending in .pdf</td></tr>
												<tr><td><code>Enter</code></td><td>move matches to new window</td></tr>
												<tr><td><code>Esc</code></td><td>clear the search</td></tr>
											</tbody>
										</table>
									</div>
								</td>
								{/* --bar-count: the number of icons in this bar, 8 + the Save selected tabs one; update it when an icon is added or removed */}
								<td className="two" style={{"--bar-count": this.state.sessionsFeature ? 9 : 8} as React.CSSProperties}>
									<div
										className={"icon windowaction " + this.state.layout + "-view"}
										title={this.readablelayout(this.state.layout) + " View is active\nChange to " + this.readablelayout(this.nextlayout()) + " View"}
										onClick={this.changelayout}
									/>
									<div
										className="icon windowaction trash"
										title={
											savedSel
												? "Delete selected saved tabs\nWill delete " + maybePluralize(this.state.selection.size, "saved tab") + " from their saved windows. Undo is possible for a few seconds"
												: this.state.selection.size > 0
												? "Close selected tabs\nWill close " + maybePluralize(this.state.selection.size, 'tab')
												: "Close current Tab"
										}
										onClick={this.deleteTabs}
									/>
									<div
										className="icon windowaction discard"
										title={
											savedSel ? savedSelTitle : this.state.selection.size > 0
												? "Discard selected tabs\nWill put " + maybePluralize(this.state.selection.size, 'tab') + " to sleep - freeing memory"
												: "Select tabs to put them to sleep and free up memory"
										}
										style={
											this.state.selection.size > 0 && !savedSel
												? {}
												: { opacity: 0.25 }
										}
										onClick={this.discardTabs}
									/>
									<div
										className="icon windowaction pin"
										style={savedSel ? savedSelStyle : {}}
										title={
											savedSel ? savedSelTitle : this.state.selection.size > 0
												? "Pin selected tabs\nWill pin " + maybePluralize(this.state.selection.size, 'tab')
												: "Pin current Tab"
										}
										onClick={this.pinTabs}
									/>
									<div
										className={"icon windowaction filter" + (this.state.filterTabs ? " enabled" : "")}
										title={
											(this.state.filterTabs ? "Turn off hiding of" : "Hide") +
											" tabs that do not match search" +
											(this.state.searchLen > 0
												? "\n" +
													(this.state.filterTabs ? "Will reveal " : "Will hide ") +
													maybePluralize((this.state.tabsbyid.size - this.state.selection.size), 'tab')
												: "")
										}
										onClick={this.toggleFilterMismatchedTabs}
									/>
									{this.state.sessionsFeature && <div
										className="icon windowaction save-tabs"
										style={this.state.selection.size > 0 && !savedSel ? {} : { opacity: 0.25 }}
										title={
											savedSel ? savedSelTitle : this.state.selection.size > 0
												? "Save selected tabs\nWill save " + maybePluralize(this.state.selection.size, 'selected tab') + " as a new saved window. Please note : The saved tabs will lose their history."
												: "Select tabs to save them together as a new saved window"
										}
										onClick={this.saveSelected}
									/>}
									<div
										className="icon windowaction new"
										style={savedSel ? savedSelStyle : {}}
										title={
											savedSel ? savedSelTitle : this.state.selection.size > 0
												? "Move tabs to new window\nWill move " + maybePluralize(this.state.selection.size, 'selected tab') + " to it"
												: "Open new empty window"
										}
										onClick={this.addWindow}
									/>
									<div
										className={"icon windowaction duplicates" + (this.state.dupTabs ? " enabled" : "")}
										title={duplicatesTitle(this.getDuplicates(), !!this.state.dupTabs)}
										onClick={this.highlightDuplicates}
									/>
									<div
										className={"icon windowaction recent" + (this.state.recentLevel ? " enabled" : "")}
										data-level={this.state.recentLevel}
										title={recentTitle(this.state.tabsbyid.values(), Date.now(), this.state.recentLevel)}
										onClick={this.highlightRecent}
									/>
								</td>
							</tr>
						</tbody>
					</table>
				</div>}
				<div className="window placeholder" />
				{this.pending.items.length > 0 && <UndoNotice
					text={noticeText(this.pending.items)}
					deadline={this.pending.deadline}
					countdown={this.pending.countdown}
					onUndo={this.undoDelete}
				/>}
				<StatsLayer source={this.statsSource} version={this.listVersion} />
			</div>
			</ManagerContext.Provider>
		);
	}

	async componentDidMount()
	{
		this.update();
		this.syncMasonry();
		// with boot data the settings are already in place (and cached)
		if (this.props.boot) {
			writeBootCache(this.props.boot.settings);
		} else {
			await this.loadStorage();
		}

		// Chrome: without system.display the setting cannot work, so it is
		// turned off. Firefox needs no permission for it.
		if (!IS_FIREFOX) {
			let result = await browser.permissions.contains({permissions: ["system.display"]});
			if (!result) {
				saveSetting("hideWindows", false);
				this.setState({
					hideWindows: false
				});
			}
		}

		browser.tabs.onCreated.addListener(this.runUpdate);
		browser.tabs.onUpdated.addListener(this.runSlowUpdate);
		browser.tabs.onMoved.addListener(this.runSlowUpdate);
		browser.tabs.onRemoved.addListener(this.runUpdate);
		browser.tabs.onReplaced.addListener(this.runSlowUpdate);
		browser.tabs.onDetached.addListener(this.runUpdate);
		browser.tabs.onAttached.addListener(this.runUpdate);
		browser.tabs.onActivated.addListener(this.runSlowUpdate);

		browser.windows.onFocusChanged.addListener(this.runUpdate);
		browser.windows.onCreated.addListener(this.runUpdate);
		browser.windows.onRemoved.addListener(this.runUpdate);

		browser.runtime.onMessage.addListener(this.onRuntimeMessage);

		browser.storage.onChanged.addListener(this.sessionSync);
		browser.storage.onChanged.addListener(this.onStorageChanged);

		window.addEventListener("pagehide", this.flushPending);
		document.addEventListener("visibilitychange", this.flushPendingHidden);
		// after the cards' and tabs' own handlers (bubbling, on the document)
		document.addEventListener("dragend", this.dragDone);
		document.addEventListener("drop", this.dragDone);

		await this.sessionSync();

		// keys typed while the popup was booting (see src/popup/early.ts)
		const typed = window.takeEarlyKeys ? window.takeEarlyKeys() : "";
		const box = this.searchBoxRef.current;
		if (typed && box) {
			box.value = typed;
			box.focus();
			this.runSearch(typed);
		} else {
			this.rootRef.current?.focus();
		}
		this.focusRoot();

		setTimeout(async function() {
			var scrollArea = document.getElementsByClassName("window-container")[0];
			var activeWindow = document.getElementsByClassName("activeWindow");
			if (!!activeWindow && activeWindow.length > 0) {
				var activeTab = activeWindow[0].getElementsByClassName("highlighted");
				if (!!activeTab && activeTab.length > 0) {
					if (!!scrollArea && scrollArea.scrollTop > 0) {
					} else {
						var animations = await getSetting("animations");
						activeTab[0].scrollIntoView({ behavior: animations ? "smooth" : "instant", block: "center", inline: "nearest" });
					}
				}
			}
		}, 250);

		// box.select();
		// box.focus();
	}
	// Reads the saved windows from storage (on opening, and on every change
	// there: another popup, the options page, the writes started here). A read
	// that a newer read, or a write started here, may have overtaken is
	// dropped and made again once no write is on its way (../savedWrites.ts).
	sessionSync = () => this.savedWrites.sync();
	// Shows `stored`, with the selection kept in step with it
	private showSessions(stored : Record<string, ISavedSession>) {
		// unmounting (its deletes are written from the copy): no state to change
		if (this.unmounted) return;
		// in the order the user gave them (../sessionOrder.ts)
		const sessions = listSessions(stored);
		// saved tabs moved here: the selected ones stay selected at their new
		// places (then their numbers are known, not a rewrite from elsewhere)
		const moves = this.renumbered;
		this.renumbered = null;
		if (moves) remapSavedKeys(this.state.selection, moves);
		// selected saved tabs of a saved window that was deleted, or rewritten
		// with its tabs numbered anew
		dropMissingSaved(this.state.selection, sessions, savedTabKeys, moves ? undefined : this.state.sessions);
		// from the state as it is by then: the name screen may have closed
		// since (its colour pick writes, then closes it)
		this.setState((prev) => ({
			sessions,
			// the saved window being named was deleted (or imported over) meanwhile
			colorsSession: sessions.some((s) => s.id === prev.colorsSession) ? prev.colorsSession : ""
		}));
	}
	// Every change to the stored saved windows goes through here, one after
	// the other: `change` gets the stored object (never changes it) and returns
	// the new one, or null for no change. The copy and the state change at
	// once, then the write; resolves with what was written (null: nothing),
	// rejects when the browser refused it: then the copy and the state go back
	// to what they were (`undo` runs first) and storage is read again.
	mutateSessions(change : SavedChange<ISavedSession>, undo? : () => void) : Promise<Record<string, ISavedSession> | null> {
		return this.savedWrites.mutate(change, undo);
	}
	// Adds saved windows (a window's save button, an import), listed first
	// (../sessionStore.ts); rejects when the browser refused the write.
	async addSavedWindows(sessions : ISavedSession[]) : Promise<void> {
		if (sessions.length === 0) return;
		await this.mutateSessions((stored) => addSessions(stored, sessions));
	}
	// Deletes a saved window: hidden now, removed from storage when the
	// countdown ends (./pendingDelete.ts)
	deleteSession(session : ISavedSession) {
		// the addresses of all its tabs, the ones a pending delete hides too:
		// the write leaves it alone if it holds others by then (imported over,
		// added to elsewhere)
		const all = this.state.sessions.find((s) => s.id === session.id) || session;
		this.pending.add({id: session.id, name: session.name, tabs: session.tabs.length, urls: goneUrls(all.tabs)});
		// its selected tabs go with it
		dropMissingSaved(this.state.selection, this.visibleSessions());
		this.setState(this.selectionText());
	}
	// Deletes the selected saved tabs from their saved windows: hidden now,
	// removed from storage when the countdown ends, with the same Undo notice as
	// a deleted window. A saved window left with no tab goes whole.
	deleteSavedTabs() {
		const items = savedDeleteItems(this.state.selection, this.visibleSessions());
		if (items.length === 0) return;
		for (const item of items) this.pending.add(item);
		// everything selected was just deleted
		this.clearSelection();
		this.setState(this.selectionText());
	}
	// Renames / recolours a saved window (./sessionEdit.ts). The card changes
	// at once; storage.onChanged then brings every other popup along.
	async editSession(id : string, edit : SessionEdit) {
		await this.mutateSessions((stored) => editSession(stored, id, edit));
	}
	// The ids of the saved window cards on screen, in order: not the ones a
	// pending delete hides, nor (with "Hide non-matching tabs") the ones
	// without a search match
	private shownSessionIds() : string[] {
		const sessions = this.visibleSessions();
		const saved = this.savedSearch(sessions);
		const hide = this.state.filterTabs && saved.active;
		return sessions.filter((s) => !hide || saved.shown.has(s.id)).map((s) => s.id);
	}
	// Whether the dragged saved window card would move if dropped before /
	// after `target` (no drop marker, no drop where it already is), among the
	// cards on screen: a card hidden in between does not count.
	sessionDropMoves(target : string, before : boolean) : boolean {
		if (!this.draggingSession) return false;
		return moveSession(this.shownSessionIds(), this.draggingSession, target, before) !== null;
	}
	// The dragged card dropped before / after `target`: every saved window gets
	// its new place as `order` (../sessionOrder.ts), the hidden ones too, right
	// before / after `target` in the stored order (an Undo or the end of the
	// search shows them where they were among the others).
	async dropSession(target : string, before : boolean) {
		const dragged = this.draggingSession;
		this.draggingSession = null;
		if (!dragged) return;
		const shown = this.shownSessionIds();
		await this.mutateSessions((stored) => reorderShown(stored, shown, dragged, target, before));
	}
	// The saved windows as they are on screen, as a stored object: no pending
	// deletes, and with "Hide non-matching tabs" no saved window without a
	// match and no tab the search hides. A drop that changes nothing there
	// shows no marker and does nothing, as for the cards (sessionDropMoves).
	private shownSavedStore() : Record<string, ISavedSession> {
		const sessions = this.visibleSessions();
		const saved = this.savedSearch(sessions);
		const filter = this.state.filterTabs;
		const shown = new Set(this.shownSessionIds());
		const out : Record<string, ISavedSession> = {};
		for (const s of sessions) {
			if (!shown.has(s.id)) continue;
			const tabs = filter ? s.tabs.filter((tab) => !saved.hidden.has(savedTabKeys.key(s.id, tab.index))) : s.tabs;
			out[s.id] = tabs.length === s.tabs.length ? s : { ...s, tabs };
		}
		return out;
	}
	// the saved window and stored index of each saved tab being dragged
	private draggedRefs() : SavedTabRef[] {
		return refsOf(this.draggingSaved || []);
	}
	// the open tabs with these ids, in that order; ids of tabs that are gone
	// are left out
	private openTabsById(ids : readonly number[]) : browser.Tabs.Tab[] {
		return ids.map((id) => this.state.tabsbyid.get(id)).filter((tab) : tab is browser.Tabs.Tab => !!tab);
	}
	// Whether the dragged saved tabs would move if dropped before / after the
	// saved tab `index` of `sessionId` (undefined: at its end), among what is
	// on screen; for dragged open tabs, whether copies of them can go there.
	// Asked on every dragover of every saved tab and card: the answers are
	// kept for as long as the drag, what is shown and the search stay the same.
	private dropMovesMemo : { dragged : readonly unknown[], shown : ISavedSession[], search : SavedSearch, filter : boolean, store : Record<string, ISavedSession>, refs : SavedTabRef[], answers : Map<string, boolean> } | null = null;
	savedDropMoves(sessionId : string, index : number | undefined, before : boolean) : boolean {
		const open = this.draggingOpen;
		const dragged = this.draggingSaved || open;
		if (!dragged) return false;
		const shown = this.visibleSessions();
		const search = this.savedSearch(shown);
		const filter = this.state.filterTabs;
		let m = this.dropMovesMemo;
		if (!m || m.dragged !== dragged || m.shown !== shown || m.search !== search || m.filter !== filter) {
			m = { dragged, shown, search, filter, store: this.shownSavedStore(), refs: this.draggedRefs(), answers: new Map() };
			this.dropMovesMemo = m;
		}
		const key = JSON.stringify([sessionId, index ?? null, before]);
		let answer = m.answers.get(key);
		if (answer === undefined) {
			const target = { sessionId, index, before };
			answer = (open ? this.addOpen(m.store, open, target) : moveSavedTabs(m.store, m.refs, target)) !== null;
			m.answers.set(key, answer);
		}
		return answer;
	}
	// The dragged saved tabs dropped on a saved tab or a saved window card:
	// moved there (../savedMove.ts), every saved window touched written in the
	// one write of `sessions`. The selected ones stay selected, a pending delete
	// keeps hiding its tabs under their new numbers. Dragged open tabs are
	// copied there instead (addOpenTabs).
	// `dragged`: what the drop event carries (../dragPayload.ts); without it,
	// what the popup remembers of the drag.
	async dropSaved(sessionId : string, index : number | undefined, before : boolean, dragged? : TabDrag | null) {
		const target = { sessionId, index, before };
		const open = dragged ? (dragged.kind === "open" ? this.openTabsById(dragged.ids) : null) : this.draggingOpen;
		if (open) {
			this.draggingOpen = null;
			await this.addOpenTabs(target, open);
			return;
		}
		const refs = dragged ? (dragged.kind === "saved" ? dragged.refs : []) : this.draggedRefs();
		this.draggingSaved = null;
		if (refs.length === 0 || !moveSavedTabs(this.shownSavedStore(), refs, target)) return;
		const moved = await this.renumberingChange((stored) => moveSavedTabs(stored, refs, target));
		if (!moved) return;
		const name = Object.values(moved.stored).find((s) => s && s.id === sessionId)?.name || "";
		this.setState({ ...movedText(moved.count, name, moved.emptied.length) });
	}
	// copies of the open tabs `tabs` added at `target` (../savedAdd.ts), in
	// the order the popup lists the open windows
	private addOpen(stored : Record<string, ISavedSession>, tabs : browser.Tabs.Tab[], target : SavedDropTarget) : SavedAddResult<ISavedSession> | null {
		return addOpenTabs(stored, tabs, target, { windowOrder: this.state.windows.map((w) => w.id), firefox: IS_FIREFOX });
	}
	// The dragged open tabs dropped on a saved tab or a saved window card:
	// copies of them go in there (../savedAdd.ts), in one write. The open tabs
	// stay open; the selection they were is done with, as after moving open
	// tabs. The saved window's tabs are numbered anew, as after a move.
	async addOpenTabs(target : SavedDropTarget, tabs : browser.Tabs.Tab[]) {
		if (tabs.length === 0 || !this.addOpen(this.shownSavedStore(), tabs, target)) return;
		const added = await this.renumberingChange((stored) => this.addOpen(stored, tabs, target));
		if (!added) return;
		if (tabs.some((tab) => this.state.selection.has(tab.id))) this.clearSelection();
		const name = Object.values(added.stored).find((s) => s && s.id === target.sessionId)?.name || "";
		this.setState({ ...addedText(added.count, added.skipped, name), dirty: true });
	}
	// A change to the stored saved windows that numbers saved tabs anew (a
	// move, an add), written like any other (mutateSessions). The selection
	// (showSessions) and the pending deletes follow the tabs to their new
	// numbers. Resolves with the change's result; null when it changed nothing
	// or the browser refused the write.
	private async renumberingChange<R extends { stored : Record<string, ISavedSession>, moves : SavedTabMove[] }>(change : (stored : Record<string, ISavedSession>) => R | null) : Promise<R | null> {
		let done : R | null = null;
		try {
			await this.mutateSessions((stored) => {
				const result = change(stored);
				if (!result) return null;
				done = result;
				this.renumbered = result.moves;
				this.pending.renumber(renumberedIndex(result.moves));
				return result.stored;
			}, () => {
				// Refused: the old numbers are shown again. The selection and
				// the pending deletes go back to them (each tab from its new
				// place to its old one), or they would name, hide and later
				// delete the tabs that hold those numbers then.
				const back = done ? done.moves.map((m) => ({ from: m.to, to: m.from })) : [];
				this.renumbered = back;
				this.pending.renumber(renumberedIndex(back));
			});
		} catch (e) {
			console.error(e);
			return null;
		}
		return done;
	}
	undoDelete = () => {
		this.pending.undo();
	}
	// Removes saved windows (or some of their tabs) from storage. The state
	// changes before the promise resolves (the ids stop being hidden right
	// after); a refused write rejects and storage is read again: they show
	// again. Each item is written once (PendingDeletes.claim): the closing
	// flush may have written one whose queued write had not started.
	async commitDeletes(items : PendingItem[], sync : boolean) {
		const change = (stored : Record<string, ISavedSession>) => {
			const mine = this.pending.claim(items);
			return mine.length ? withoutItems(stored, mine) : null;
		};
		// The popup is closing: the write starts now, from the copy, not after
		// the changes queued before it (one on its way already went from the
		// copy, so this one includes it). The ones queued build on it.
		if (sync) await this.savedWrites.writeNow(change);
		else await this.mutateSessions(change);
	}
	focusRoot() {
		this.setState({
			focusUpdates: (this.state.focusUpdates + 1),
			dirty: true
		});
		setTimeout(() => {
			if (document.activeElement === document.body) {
				this.rootRef.current?.focus();
				this.setState({
					dirty: true
				});
				if (this.state.focusUpdates < 5) this.focusRoot();
			}
		}, 500);
	}
	dragFavicon(icon? : string) : string {
		if (!icon) {
			return this.state.dragFavicon;
		} else {
			this.setState({ dragFavicon: icon });
			return icon;
		}
	}
	rateExtension = () => {
		if (IS_FIREFOX) {
			browser.tabs.create({ url: "https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/" });
		} else {
			browser.tabs.create({ url: "https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff" });
		}
	}
	donate = () => {
		browser.tabs.create({ url: "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW" });
	}
	toggleOptions = () => {
		this.setState({
			optionsActive: !this.state.optionsActive,
			dirty: true
		});
	}
	update = async () => {
		const [windows, sort_windows, lastActive] = await Promise.all([
			browser.windows.getAll({ populate: true }),
			getLocalStorage(S.windowAge, []) as Promise<number[]>,
			// when each window was last active, recorded by the worker on focus changes
			getLocalStorageMap<number, number>(S.windowLastActive)
		]);
		const patch = this.windowState(sortWindows(windows, sort_windows instanceof Array ? sort_windows : []));
		for (let id of this.state.selection.keys()) {
			// saved tabs are never in tabsbyid (sessionSync drops the ones that are gone)
			if (!isSavedTabKey(id) && !this.state.tabsbyid.has(id)) {
				this.state.selection.delete(id);
				this.setState({lastSelect: id});
			}
		}
		this.setState({ ...patch, lastActive: lastActive });
	}
	// Fills the id maps from a sorted window list and returns the state that
	// describes it. Used by update() and, through the constructor, for the
	// first render.
	windowState(windows : browser.Windows.Window[]) : Pick<ITabManagerState, "windows" | "lastOpenWindow" | "tabCount"> {
		this.state.windowsbyid.clear();
		this.state.tabsbyid.clear();
		let tabCount = 0;
		for (const window of windows) {
			this.state.windowsbyid.set(window.id, window);
			for (const tab of window.tabs) {
				this.state.tabsbyid.set(tab.id, tab);
				tabCount++;
			}
		}
		for (const id of this.state.windowrefs.keys()) {
			if (!this.state.windowsbyid.has(id)) this.state.windowrefs.delete(id);
		}
		// The "current" window. In own-tab mode the browser reports it as focused; as
		// a browser-action popup every window reports focused: false (the popup has
		// the focus), so fall back to the most recently active one from windowAge.
		const focusedWindow = windows.find((w) => w.focused);
		return {
			windows: windows,
			lastOpenWindow: focusedWindow ? focusedWindow.id : (windows.length > 0 ? windows[0].id : -1),
			tabCount: tabCount
		};
	}
	deleteTabs = async () => {
		// only saved tabs selected: they go from their saved windows (not the
		// current tab either)
		if (onlySavedSelected(this.state.selection)) {
			this.deleteSavedTabs();
			return;
		}
		const tabs = this.selectedTabs();
		if (tabs.length) {
			browser.runtime.sendMessage<ICommand>({command: S.close_tabs, tabs: tabs});
		} else {
			const t = await browser.tabs.query({ currentWindow: true, active: true });
			if (t && t.length > 0) {
				await browser.tabs.remove(t[0].id);
			}
		}
	}
	deleteTab(tabId : number) {
		browser.tabs.remove(tabId);
	}
	discardTabs = async () => {
		if (onlySavedSelected(this.state.selection)) return;
		const tabs = this.selectedTabs();
		if (tabs.length) {
			browser.runtime.sendMessage<ICommand>({command: S.discard_tabs, tabs: tabs});
		}
		this.clearSelection();
	}
	discardTab(tabId) {
		browser.tabs.discard(tabId);
	}
	addWindow = async () => {
		// only saved tabs selected: no new empty window either (Enter lands here too)
		if (onlySavedSelected(this.state.selection)) return;
		const tabs = this.selectedTabs();
		const count = tabs.length;

		const incognito_tabs = tabs.filter(function(tab) {
			return tab.incognito;
		});

		const normal_tabs = tabs.filter(function(tab) {
			return !tab.incognito;
		});

		if (count === 0) {
			await browser.windows.create({});
		} else if (count === 1) {
			if (IS_FIREFOX) {
				await browser.runtime.sendMessage<ICommand>({command: S.focus_on_tab_and_window_delayed, tab: tabs[0]});
			}else{
				await browser.runtime.sendMessage<ICommand>({command: S.focus_on_tab_and_window, tab: tabs[0]});
			}
		} else {
			if (normal_tabs.length > 0) {
				await browser.runtime.sendMessage<ICommand>({command: S.create_window_with_tabs, tabs: normal_tabs, incognito: false});
			}
			if (incognito_tabs.length > 0) {
				await browser.runtime.sendMessage<ICommand>({command: S.create_window_with_tabs, tabs: incognito_tabs, incognito: true});
			}
		}
		if (!!window.inPopup) window.close();
	}
	// Saves the selected open tabs as a new saved window (../../helpers/sessions.ts),
	// or two when private and normal tabs are mixed; the open tabs stay open.
	saveSelected = async () => {
		if (onlySavedSelected(this.state.selection)) return;
		const ids = new Set(this.selectedTabs().map((tab) => tab.id));
		if (ids.size === 0) return;
		// read the tabs again, as saving a window does: the popup's copies may be behind
		const open = (await browser.tabs.query({})).filter((tab) => ids.has(tab.id));
		const groups = groupSelection(open, this.state.windows.map((w) => w.id));
		const saved : ISavedSession[] = [];
		const now = Date.now();
		for (const group of groups) {
			// the size, place and state of the window that holds most of the tabs.
			// Without a window id (or a window that is gone and not known to the
			// popup) this is an empty windowsInfo: such a record still lists, and a
			// restore / the landing preview then use the browser's default placement.
			const info = await browser.windows.get(group.windowId).catch(() => {
				const {tabs, ...rest} = this.state.windowsbyid.get(group.windowId) || {} as browser.Windows.Window;
				return rest as browser.Windows.Window;
			});
			const session : ISavedSession = buildSavedWindow({
				id: newSessionId(),
				now: now,
				tabs: group.tabs,
				windowsInfo: info,
				name: "",
				incognito: group.incognito,
				firefox: IS_FIREFOX
			});
			// nothing Firefox can restore in it
			if (session.tabs.length === 0) continue;
			saved.push(session);
		}
		if (saved.length === 0) return;
		// listed first, in one write queued after the other changes (a delete
		// or an edit meanwhile neither comes back nor loses the new windows).
		// Refused (as for a window's save): nothing saved, the selection stays.
		try {
			await this.addSavedWindows(saved);
		} catch (err) {
			console.error("could not save the window", err);
			return;
		}
		this.clearSelection();
		this.setState({ topText: savedText(saved), bottomText: " ", dirty: true });
		setTimeout(() => this.scrollTo("session", saved[0].id), 150);
	}
	pinTabs = async () => {
		if (onlySavedSelected(this.state.selection)) return;
		const tabs = this.selectedTabs()
			.sort(function(a, b) {
				return a.index - b.index;
			});
		if (tabs.length) {
			if (tabs[0].pinned) tabs.reverse();
			for (let i = 0; i < tabs.length; i++) {
				await browser.tabs.update(tabs[i].id, { pinned: !tabs[0].pinned });
			}
		} else {
			const t = await browser.tabs.query({ currentWindow: true, active: true });
			if (t && t.length > 0) {
				await browser.tabs.update(t[0].id, { pinned: !t[0].pinned });
			}
		}
	}

	getDuplicates() {
		return findDuplicates(this.state.tabsbyid.values());
	}

	highlightDuplicates = (e) => {
		this.state.selection.clear();
		this.clearHiddenTabs()

		let searchLen = 0;
		const dupTabs = !this.state.dupTabs;

		if (this.searchBoxRef.current) {
			this.searchBoxRef.current.value = "";
		}

		if (!dupTabs) {
			this.setState({
				hiddenCount: 0,
				dupTabs: dupTabs,
				searchLen: searchLen,
				query: null,
				dirty: true
			});
			return;
		}
		let hiddenCount = this.state.hiddenCount || 0;

		const duplicates = this.getDuplicates();
		const dup = duplicates.duplicates;
		const orig = duplicates.originals;

		for (const dupItem of dup) {
			searchLen++;
			hiddenCount -= this.state.hiddenTabs.has(dupItem) ? 1 : 0;
			this.state.selection.add(dupItem);
			this.state.hiddenTabs.delete(dupItem);
			this.setState({
				lastSelect: dupItem,
				dirty: true
			});
		}

		const idList : number[] = [...this.state.tabsbyid.keys()];
		for (const tab_id of idList) {
			// var tab = this.state.tabsbyid.get(tab_id);
			if (!dup.has(tab_id) && !orig.has(tab_id)) {
				hiddenCount += 1 - (this.state.hiddenTabs.has(tab_id) ? 1 : 0);
				this.state.hiddenTabs.add(tab_id);
				this.state.selection.delete(tab_id);
				this.setState({
					lastSelect: tab_id,
					dirty: true
				});
			}
		}
		if (dup.size === 0) {
			this.setState({
				topText: "No duplicates found",
				bottomText: " "
			});
		} else {
			this.setState({
				topText: "Found " + maybePluralize(dup.size + orig.size, "tab") + " with duplicates, selected " + maybePluralize(dup.size, "duplicate"),
				bottomText: "Delete closes the duplicates and keeps one of each. Enter moves them to a new window"
			});
		}
		this.setState({
			hiddenCount: hiddenCount,
			searchLen: searchLen,
			dupTabs: dupTabs,
			recentLevel: 0,
			query: null,
			dirty: true
		});
	}

	// "Highlight recently active tabs" (see ../recent): selects them and hides
	// the rest, like Highlight Duplicates, and turns that off. Each click
	// widens it a level (1..RECENT_LEVELS, the clock at 3, 6, 9); the click
	// after the last, Escape or clearing the search ends it; searching
	// meanwhile searches within the tabs it picked.
	private recentIds : number[] = [];
	getRecent(level : number) : RecentTabs {
		return recentTabs(this.state.tabsbyid.values(), Date.now(), level);
	}
	highlightRecent = () => {
		const level = (this.state.recentLevel + 1) % (RECENT_LEVELS + 1);
		const recent = level ? this.getRecent(level) : null;
		if (this.searchBoxRef.current) this.searchBoxRef.current.value = "";
		this.state.selection.clear();
		this.clearHiddenTabs();
		this.recentIds = recent ? recent.ids : [];
		let hiddenCount = 0;
		if (recent && recent.count > 0) {
			const ids = new Set(recent.ids);
			for (const id of this.state.tabsbyid.keys()) {
				if (ids.has(id)) {
					this.state.selection.add(id);
				} else {
					this.state.hiddenTabs.add(id);
					hiddenCount++;
				}
			}
		}
		this.setState({
			hiddenCount: hiddenCount,
			searchLen: recent ? recent.count : 0,
			query: null,
			dupTabs: false,
			recentLevel: recent && recent.count > 0 ? level : 0,
			topText: recent ? recentText(recent) : "",
			bottomText: recent && recent.count > 0 ? "Delete closes them. Enter moves them to a new window" : "",
			dirty: true
		});
	}
	search = (e : React.ChangeEvent<HTMLInputElement>) => {
		this.runSearch(e.target.value);
	}
	runSearch(query : string) {
		let hiddenCount = this.state.hiddenCount || 0;
		const searchQuery = query || "";
		const searchLen = searchQuery.length;
		// see src/popup/search.ts for the grammar
		const parsed = parseQuery(searchQuery);

		if (!searchLen) {
			this.state.selection.clear();
			this.setState({
				hiddenCount: 0,
				dupTabs: false,
				recentLevel: 0,
				dirty: true
			});
			this.clearHiddenTabs();
			hiddenCount = 0;
		} else {
			// search selects open tabs only: selected saved tabs are dropped
			keepKind(this.state.selection, "open");
			let idList : number[] = [ ...this.state.tabsbyid.keys() ];
			if(this.state.dupTabs) {
				const duplicates = this.getDuplicates();
				const dup = duplicates.duplicates;
				const orig = duplicates.originals;
				idList = [...dup, ...orig];
			} else if (this.state.recentLevel) {
				idList = this.recentIds.filter((id) => this.state.tabsbyid.has(id));
			}
			for (const id of idList) {
				const tab = this.state.tabsbyid.get(id);
				const match = matchTab(searchable(tab.title, tab.url || tab.pendingUrl), parsed);
				if (match) {
					hiddenCount -= this.state.hiddenTabs.has(id) ? 1 : 0;
					this.state.selection.add(id);
					this.state.hiddenTabs.delete(id);
				} else {
					hiddenCount += 1 - (this.state.hiddenTabs.has(id) ? 1 : 0);
					this.state.hiddenTabs.add(id);
					this.state.selection.delete(id);
				}
				this.setState({
					lastSelect: id,
					dirty: true
				});
			}
		}

		this.setState({
			hiddenCount: hiddenCount,
			searchLen: searchLen,
			query: searchLen ? parsed : null
		})

		const matches = this.state.tabsbyid.size - hiddenCount;
		if (searchLen === 0) {
			// the field was cleared: no search, no header
			this.setState({
				topText: "",
				bottomText: ""
			});
		} else {
			// saved tabs that match are counted beside the open ones (never selected)
			const saved = searchSaved(
				this.visibleSessions(),
				parsed,
				this.state.dupTabs || this.state.recentLevel > 0
			);
			const summary = searchSummary(searchQuery, matches, saved);
			this.setState({
				topText: summary.top,
				bottomText: summary.bottom
			});
		}
		this.setState({
			dirty: true
		});
	}
	clearHiddenTabs = () => {
		this.state.hiddenTabs.clear();
		this.setState({
			dirty: true
		});
	}
	clearSelection = () => {
		this.state.selection.clear();
		this.setState({
			lastSelect: 0
		});
	}
	checkKey = async (e) => {
		// enter: only on the window list. On the options screen or the window
		// name / colour overlay it must not open or move to a window.
		if (e.keyCode === 13) {
			if (!onMainScreen(this.state)) return;
			await this.addWindow();
			return;
		}
		// escape key
		// (with a stats card open, StatsLayer takes Escape before this sees it)
		if (e.keyCode === 27) {
			if (!!this.state.colorsActive || !!this.state.colorsSession) {
				// the window name / color overlay is open: close that, not the popup
				e.nativeEvent.preventDefault();
				e.nativeEvent.stopPropagation();
				this.actions.closeWindowOptions();
				return;
			}
			if(this.state.searchLen > 0 || this.state.selection.size > 0) {
				// stop popup from closing if we have search text or selection active
				e.nativeEvent.preventDefault();
				e.nativeEvent.stopPropagation();
			}

			this.setState({
				searchLen: 0,
				hiddenCount: 0,
				query: null,
				dupTabs: false,
				recentLevel: 0,
				dirty: true
			});

			if (this.searchBoxRef.current) {
				this.searchBoxRef.current.value = "";
			}
			this.clearSelection();
			this.clearHiddenTabs();
			return;
		}
		// Delete with saved tabs selected removes them from their saved windows,
		// unless it is editing the search text
		if (e.keyCode === 46 && onlySavedSelected(this.state.selection) && onMainScreen(this.state) && !editingText()) {
			e.preventDefault();
			this.deleteSavedTabs();
			return;
		}
		// any typed keys
		if (
			(e.keyCode >= 48 && e.keyCode <= 57) || // 0-9
			(e.keyCode >= 65 && e.keyCode <= 90) || // a-z
			(e.keyCode >= 186 && e.keyCode <= 192) || // ;=,-./`
			(e.keyCode >= 219 && e.keyCode <= 222) || // [ ] \ '
			(e.keyCode >= 96 && e.keyCode <= 111) || // numpad
			(e.keyCode >= 186 && e.keyCode <= 192) || // ;=,-./`
			(e.keyCode >= 219 && e.keyCode <= 222) || // [\]'
			e.keyCode === 8 || // backspace
			e.keyCode === 46 || // delete
			e.keyCode === 32 // space bar
		) {
			if (document.activeElement !== this.searchBoxRef.current) {
				var activeInputElement = document.activeElement as HTMLInputElement;
				if (activeInputElement.type !== "text" && activeInputElement.type !== "input") {
					this.searchBoxRef.current?.focus();
				}
			}
			return;
		}
		// arrow keys
		/*
			left arrow  37
			up arrow  38
			right arrow 39
			down arrow  40
		*/
		if (e.keyCode >= 37 && e.keyCode <= 40) {
			// off the window list the arrows scroll the page as usual
			if (!onMainScreen(this.state)) return;
			if (document.activeElement !== this.windowContainerRef.current && document.activeElement !== this.searchBoxRef.current) {
				this.windowContainerRef.current?.focus();
			}

			if (document.activeElement !== this.searchBoxRef.current || !this.searchBoxRef.current?.value) {
				let goLeft = e.keyCode === 37;
				let goRight = e.keyCode === 39;
				let goUp = e.keyCode === 38;
				let goDown = e.keyCode === 40;
				if (this.state.layout === LAYOUT.list) {
					goLeft = e.keyCode === 38;
					goRight = e.keyCode === 40;
					goUp = e.keyCode === 37;
					goDown = e.keyCode === 39;
				}
				if (goLeft || goRight || goUp || goDown) {
					e.nativeEvent.preventDefault();
					e.nativeEvent.stopPropagation();
				}
				const altKey = e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey;
				if (goLeft || goRight) {
					let selectedTabs = [...this.state.selection.keys()];
					if (!altKey && selectedTabs.length > 1) {
					} else {
						let found = false;
						let selectedNext = false;
						let selectedTab = 0;
						let first = 0;
						let prev = 0;
						let last = 0;
						if (selectedTabs.length === 1) {
							selectedTab = selectedTabs[0];
							// console.log("one tab", selectedTab);
						} else if (selectedTabs.length > 1) {
							if (!!this.state.lastSelect) {
								selectedTab = this.state.lastSelect;
								// console.log("more tabs, last", selectedTab);
							} else {
								selectedTab = selectedTabs[0];
								// console.log("more tabs, first", selectedTab);
							}
						} else if (selectedTabs.length === 0 && !!this.state.lastSelect) {
							selectedTab = this.state.lastSelect;
							// console.log("no tabs, last", selectedTab);
						}
						if (!!this.state.lastDirection) {
							if (goRight && this.state.lastDirection === "goRight") {
							} else if (goLeft && this.state.lastDirection === "goLeft") {
							} else if (selectedTabs.length > 1) {
								// console.log("turned back, last", this.state.lastSelect, selectedTab);
								this.select(this.state.lastSelect);
								this.setState({
									lastDirection: ""
								});
								found = true;
							} else {
								this.setState({
									lastDirection: ""
								});
							}
						}
						if (!this.state.lastDirection) {
							if (goRight) this.setState({ lastDirection: "goRight" });
							if (goLeft) this.setState({ lastDirection: "goLeft" });
						}

						for (const _w of this.state.windows) {
							let _window = this.state.windowrefs.get(_w.id)?.current;
							if (!_window) continue;
							if (_window.state.hidden) continue;
							if (found) break;
							for (const _t of _w.tabs) {
								if (this.state.hiddenTabs.has(_t.id)) continue;
								last = _t.id;
								if (!first) first = _t.id;
								if (!selectedTab) {
									if (!altKey) this.state.selection.clear();
									this.select(_t.id);
									found = true;
									break;
								} else if (selectedTab === _t.id) {
									// console.log("select next one", selectedNext);
									if (goRight) {
										selectedNext = true;
									} else if (!!prev) {
										if (!altKey) this.state.selection.clear();
										this.select(prev);
										found = true;
										break;
									}
								} else if (selectedNext) {
									if (!altKey) this.state.selection.clear();
									this.select(_t.id);
									found = true;
									break;
								}
								prev = _t.id;
								// console.log(_t, _t.id === selectedTab);
							}
						}
						if (!found && goRight && !!first) {
							if (!altKey) this.state.selection.clear();
							this.select(first);
							found = true;
						}
						if (!found && goLeft && !!last) {
							if (!altKey) this.state.selection.clear();
							this.select(last);
							found = true;
						}
					}
				}
				if (goUp || goDown) {
					let selectedTabs = [...this.state.selection.keys()];
					if (selectedTabs.length > 1) {
					} else {
						let found = false;
						let selectedNext = false;
						let selectedTab = -1;
						let first = 0;
						let prev = 0;
						let last = 0;
						let tabPosition = -1;
						let i = -1;
						if (selectedTabs.length === 1) {
							selectedTab = selectedTabs[0];
							// console.log(selectedTab);
						}

						for (const _w of this.state.windows) {
							let _window = this.state.windowrefs.get(_w.id)?.current;
							if (!_window) continue;
							if (_window.state.hidden) continue;
							i = 0;
							if (found) break;
							if (!first) first = _w.id;
							for (const _t of _w.tabs) {
								if (this.state.hiddenTabs.has(_t.id)) continue;
								i++;
								last = _w.id;
								if (!selectedTab) {
									this.selectWindowTab(_w.id, tabPosition);
									found = true;
									break;
								} else if (selectedTab === _t.id) {
									tabPosition = i;
										// console.log("found tab", _w.id, _t.id, selectedTab, i);
									if (goDown) {
										// console.log("select next window ", selectedNext, tabPosition);
										selectedNext = true;
										break;
									} else if (!!prev) {
										// console.log("select prev window ", prev, tabPosition);
										this.selectWindowTab(prev, tabPosition);
										found = true;
										break;
									}
								} else if (selectedNext) {
									// console.log("selecting next window ", _w.id, tabPosition);
									this.selectWindowTab(_w.id, tabPosition);
									found = true;
									break;
								}
								// console.log(_t, _t.id === selectedTab);
							}
							prev = _w.id;
						}
						// console.log(found, goDown, first);
						if (!found && goDown && !!first) {
							// console.log("go first", first);
							this.state.selection.clear();
							this.selectWindowTab(first, tabPosition);
							found = true;
						}
						// console.log(found, goUp, last);
						if (!found && goUp && !!last) {
							// console.log("go last", last);
							this.state.selection.clear();
							this.selectWindowTab(last, tabPosition);
							found = true;
						}
					}
				}
				// (the list view: the selection is the keyboard focus, StatsLayer
				// shows its card, see statsHoverLogic.arrowsMoveCard)
			}
			return;
		}
		// page up / page down
		if (e.keyCode === 33 || e.keyCode === 34) {
			if (document.activeElement != this.windowContainerRef.current) {
				this.windowContainerRef.current?.focus();
			}
			return;
		}
	}
	selectWindowTab(windowId : number, tabPosition : number) {
		if (!tabPosition || tabPosition < 1) tabPosition = 1;
		let _w = this.state.windowsbyid.get(windowId);

		let i = 0;

		// remove tabs that are in this.state.hiddenTabs
		let filteredTabs = _w.tabs.filter(tab => !this.state.hiddenTabs.has(tab.id));

		for (let _t of filteredTabs) {
			i++;
			if ((filteredTabs.length >= tabPosition && tabPosition === i) || (filteredTabs.length < tabPosition && filteredTabs.length === i)) {
				this.state.selection.clear();
				this.select(_t.id);
				return;
			}
		}
	}
	scrollTo = (what : string, id : string) => {
		var els = document.getElementById(what + "-" + id);
		if (!!els) {
			if (!this.elVisible(els)) {
				els.scrollIntoView({ behavior: this.state.animations ? "smooth" : "instant", block: "center", inline: "nearest" });
			}
		}
	}
	// called with a layout (options page) or with a click event (layout button)
	changelayout = async (layout? : Layout | React.MouseEvent) => {
		const newLayout : Layout = (typeof layout === "string") ? layout : this.nextlayout();
		await saveSetting("layout", newLayout);

		// no dirty: the windows did not change, only how they are drawn
		this.setState({
			layout: newLayout,
			topText: "Switched to " + this.readablelayout(newLayout) + " view",
			bottomText: " "
		}, () => writeBootCache({ tabWidth: this.state.tabWidth, tabHeight: this.state.tabHeight, theme: this.state.theme, layout: this.state.layout, compact: this.state.compact }));
	}
	nextlayout() : Layout {
		switch (this.state.layout) {
			case LAYOUT.blocks:
				return LAYOUT.blocksBig;
			case LAYOUT.blocksBig:
				return LAYOUT.rows;
			case LAYOUT.rows:
				return LAYOUT.list;
			default:
				return LAYOUT.blocks;
		}
	}
	readablelayout(layout : Layout) : string {
		switch (layout) {
			case LAYOUT.blocks:
				return "Block";
			case LAYOUT.blocksBig:
				return "Big Block";
			case LAYOUT.rows:
				return "Rows";
			default:
				return "List";
		}
	}
	// The selection may hold ids of tabs that closed since they were selected,
	// and of session tabs, which are not open tabs; neither is in tabsbyid.
	// Sending those on as undefined crashed the worker's close/move/discard.
	selectedTabs() : browser.Tabs.Tab[] {
		const tabs : browser.Tabs.Tab[] = [];
		for (const id of this.state.selection.keys()) {
			const tab = this.state.tabsbyid.get(id);
			if (!!tab) tabs.push(tab);
		}
		return tabs;
	}
	select(id : number) {
		if (this.state.selection.has(id)) {
			this.state.selection.delete(id);
			this.setState({
				lastSelect: id
			});
		} else {
			// open and saved tabs are never selected together (../sessionKeys.ts)
			keepKind(this.state.selection, tabKind(id));
			this.state.selection.add(id);
			this.setState({
				lastSelect: id
			});
		}
		this.scrollTo('tab', id.toString());
		this.setState(this.selectionText());
	}
	// the header while tabs are being selected
	selectionText() : Pick<ITabManagerState, "topText" | "bottomText"> {
		const selected = this.state.selection.size;
		if (selected === 0) return { topText: "No tabs selected", bottomText: " " };
		// saved tabs (all of one kind, see select): Delete removes them, Enter has nothing to do yet
		if (onlySavedSelected(this.state.selection)) return { topText: "Selected " + maybePluralize(selected, "saved tab"), bottomText: "Press delete to remove " + (selected === 1 ? "it" : "them") + " from the saved window" };
		if (selected === 1) return { topText: "Selected " + selected + " tab", bottomText: "Press enter to switch to it" };
		return { topText: "Selected " + selected + " tabs", bottomText: "Press enter to move them to a new window" };
	}
	selectTo(id : number, tabs : browser.Tabs.Tab[]) {
		// a range is of one kind; `tabs` is one window's (or one saved window's)
		keepKind(this.state.selection, tabKind(id));
		let activate = false;
		const lastSelect = this.state.lastSelect;
		if (id === lastSelect) {
			this.select(id);
			return;
		}
		if (!!lastSelect) {
			if (this.state.selection.has(lastSelect)) {
				activate = true;
			}
		} else {
			if (this.state.selection.has(id)) {
				activate = false;
			} else {
				activate = true;
			}
		}

		let rangeIndex1 : number;
		let rangeIndex2 : number;
		for (let i = 0; i < tabs.length; i++) {
			if (tabs[i].id === id) {
				rangeIndex1 = i;
			}
			if (!!lastSelect && tabs[i].id === lastSelect) {
				rangeIndex2 = i;
			}
		}
		// (index 0 is a valid anchor: the first tab of a window)
		if (!!lastSelect && rangeIndex2 === undefined) {
			this.select(id);
			return;
		}
		if (rangeIndex2 === undefined) {
			const neighbours = [];
			for (let i = 0; i < tabs.length; i++) {
				const tabId = tabs[i].id;
				if (tabId !== id) {
					if (this.state.selection.has(tabId)) {
						neighbours.push(tabId);
					}
				}
			}

			if (activate) {
				// find closest selected item that's not connected
				let leftSibling = 0;
				let rightSibling = tabs.length - 1;
				for (let i = 0; i < rangeIndex1; i++) {
					if (neighbours.indexOf(i) > -1) {
						leftSibling = i;
					}
				}
				for (let i = tabs.length - 1; i > rangeIndex1; i--) {
					if (neighbours.indexOf(i) > -1) {
						rightSibling = i;
					}
				}
				let diff1 = rangeIndex1 - leftSibling;
				let diff2 = rightSibling - rangeIndex1;
				if (diff1 > diff2) {
					rangeIndex2 = rightSibling;
				} else {
					rangeIndex2 = leftSibling;
				}
			} else {
				// find furthest selected item that's connected
				let leftSibling = rangeIndex1;
				let rightSibling = rangeIndex1;
				for (let i = rangeIndex1; i > 0; i--) {
					if (neighbours.indexOf(i) > -1) {
						leftSibling = i;
					}
				}
				for (let i = rangeIndex1; i < tabs.length; i++) {
					if (neighbours.indexOf(i) > -1) {
						rightSibling = i;
					}
				}
				let diff1 = rangeIndex1 - leftSibling;
				let diff2 = rightSibling - rangeIndex1;
				if (diff1 > diff2) {
					rangeIndex2 = leftSibling;
				} else {
					rangeIndex2 = rightSibling;
				}
			}
		}

		this.setState({
			lastSelect: tabs[rangeIndex2].id
		});
		if (rangeIndex2 < rangeIndex1) {
			let r1 = rangeIndex2;
			let r2 = rangeIndex1;
			rangeIndex1 = r1;
			rangeIndex2 = r2;
		}

		for (let i = 0; i < tabs.length; i++) {
			if (i >= rangeIndex1 && i <= rangeIndex2) {
				const _tab_id = tabs[i].id;
				if (activate) {
					this.state.selection.add(_tab_id);
				} else {
					this.state.selection.delete(_tab_id);
				}
			}
		}

		this.scrollTo('tab', this.state.lastSelect.toString());
		this.setState({ ...this.selectionText(), dirty: true });
	}
	// a drag ended or dropped anywhere in the page: no card and no saved tab
	// is dragged any more, also when the card or the saved tab that started it
	// went meanwhile (its own dragend never comes then; a saved tab goes when
	// a move numbers it anew). The drops taken in the page stop there and read
	// what they need first.
	private readonly dragDone = () => {
		this.draggingSession = null;
		this.draggingSaved = null;
		this.draggingOpen = null;
	}
	// A tab drag starts: what it takes is remembered for the drop markers, and
	// returned as the drag data (../dragPayload.ts): the saved tabs by saved
	// window and index, or the open tab ids. A drag of several tabs gets a
	// drag image of stacked tiles and their number (../dragImage.ts).
	drag(e : React.DragEvent<HTMLDivElement>, id : number) : string {
		// a tab drag: no saved window card is being dragged
		this.draggingSession = null;
		// With "Hide non-matching tabs" on, selected tabs the search hides stay
		// where they are when dropped on a saved window or (saved tabs) an open
		// one: the drag takes what is on screen, as the drop marker's check
		// does, and the header after the drop counts that.
		const filter = this.state.filterTabs;
		// a saved tab: it and, when it is selected, the other selected saved
		// tabs; it is opened, not moved, so the selection stays as it is
		if (isSavedTabKey(id)) {
			const keys = draggedSaved(id, this.state.selection, filter ? this.savedSearch(this.visibleSessions()).hidden : undefined);
			this.draggingSaved = keys;
			this.draggingOpen = null;
			this.stackImage(e, id, keys);
			return encodeSaved(refsOf(keys));
		}
		this.draggingSaved = null;
		if (!this.state.selection.has(id)) {
			keepKind(this.state.selection, tabKind(id));
			this.state.selection.add(id);
			this.setState({
				lastSelect: id
			});
		}
		// what a drop on a saved window copies (../savedAdd.ts)
		this.draggingOpen = draggedOpen(this.selectedTabs(), id, filter ? this.state.hiddenTabs : undefined);
		const ids = tabIds(this.draggingOpen);
		// moved between open windows, every selected open tab goes
		// (selectedTabs()), also the ones the search hides: the image counts them
		const moved = tabIds(this.selectedTabs());
		this.stackImage(e, id, moved.length > ids.length ? moved : ids);
		return encodeIds(ids);
	}
	// The drag image of a drag that takes several tabs: the tiles on screen
	// of the dragged one and the next ones, as the popup draws them (favicon,
	// title), and how many tabs go.
	private stackImage(e : React.DragEvent<HTMLDivElement>, dragged : number, ids : readonly number[]) {
		const tiles : StackTile[] = [];
		for (const id of stackTiles(dragged, ids)) {
			const ref = isSavedTabKey(id) ? savedTabKeys.ref(id) : undefined;
			const el = document.getElementById(ref ? "sessiontab_" + ref.sessionId + "_" + ref.index : "tab-" + id);
			if (!el) continue;
			const icon = el.querySelector<HTMLElement>(".iconoverlay");
			const fav = el.style.getPropertyValue("--fav") || icon?.style.getPropertyValue("--fav") || "";
			tiles.push({ fav, title: (el.getAttribute("data-hover") || "").split("\n")[0] });
		}
		if (tiles.length > 1) setStackImage(e.dataTransfer, tiles, ids.length);
	}
	// Dropped on the open tab `id`. `dragged`: what the drop event carries
	// (../dragPayload.ts); without it, what the popup remembers of the drag.
	async drop(id : number, before : boolean, dragged? : TabDrag | null) {
		// a saved window card is no tab (open tabs and windows take no drop from it)
		if (this.draggingSession && !dragged) return;
		var tab : browser.Tabs.Tab = this.state.tabsbyid.get(id);
		if (!tab) return;
		const saved = this.droppedSaved(dragged);
		if (saved) {
			await this.openSaved(tab.windowId, tab.index + (before ? 0 : 1), saved);
			return;
		}
		var tabs = this.movedTabs(dragged);
		var index = tab.index + (before ? 0 : 1);

		for (let i = 0; i < tabs.length; i++) {
			const t : browser.Tabs.Tab = tabs[i];
			await browser.tabs.move(t.id, { windowId: tab.windowId, index: index });
			await browser.tabs.update(t.id, { pinned: t.pinned });
		}
		this.state.selection.clear();
		this.update();
	}
	async dropWindow(windowId : number, dragged? : TabDrag | null) {
		if (this.draggingSession && !dragged) return;
		const saved = this.droppedSaved(dragged);
		if (saved) {
			// no tab to go next to: at the end
			await this.openSaved(windowId, undefined, saved);
			return;
		}
		var tabs = this.movedTabs(dragged);

		browser.runtime.sendMessage<ICommand>({command: S.move_tabs_to_window, window_id: windowId, tabs: tabs});

		this.state.selection.clear();
	}
	// The open tabs a drop on an open window moves: the selection (the
	// dragged tab joined it at dragstart; with "Hide non-matching tabs" also
	// the selected tabs the search hides, as in 6.x). A drag that started in
	// another Tab Manager page, whose tabs are not this page's selection: the
	// tabs it carries.
	private movedTabs(dragged? : TabDrag | null) : browser.Tabs.Tab[] {
		if (dragged && dragged.kind === "open" && !dragged.ids.every((id) => this.state.selection.has(id))) return this.openTabsById(dragged.ids);
		return this.selectedTabs();
	}
	// the saved tab keys a drop on an open window opens: the ones the drop
	// carries, else the ones the popup remembers; null for any other drop
	private droppedSaved(dragged? : TabDrag | null) : number[] | null {
		if (dragged) return dragged.kind === "saved" ? dragged.refs.map((ref) => savedTabKeys.key(ref.sessionId, ref.index)) : null;
		return this.draggingSaved && this.draggingSaved.length ? this.draggingSaved : null;
	}
	// Opens the dragged saved tabs in the open window `windowId` at `index`
	// (undefined: at the end), through the worker (../../helpers/openTabs.ts),
	// and waits for it. The saved window is not changed. When the dragged tabs
	// were the selection, the selection is done with.
	async openSaved(windowId : number, index : number | undefined, keys : number[]) {
		this.draggingSaved = null;
		if (keys.length === 0) return;
		const tabs = savedTabsToOpen(keys, this.visibleSessions());
		if (tabs.length === 0) return;
		let opened : number | undefined;
		try {
			opened = await browser.runtime.sendMessage<ICommand, number>({command: S.open_saved_tabs, window_id: windowId, index: index, saved_tabs: tabs});
		} catch (e) {
			console.error(e);
			opened = 0;
		}
		if (keys.some((key) => this.state.selection.has(key))) this.clearSelection();
		const name = this.state.windowrefs.get(windowId)?.current?.shownName() || "";
		this.setState({ ...openedText(typeof opened === "number" ? opened : tabs.length, name), dirty: true });
	}
	toggleFilterMismatchedTabs = async () => {
		var _filter_tabs = !this.state.filterTabs;
		this.setState({
			filterTabs: _filter_tabs,
			dirty: true
		});
		await saveSetting("filter-tabs", _filter_tabs);
	}
	getTip = () => {
		var tips = [
			"You can right click on a tab to select it",
			"Press enter to move all selected tabs to a new window",
			"Middle click to close a tab",
			"Tab Manager Plus loves saving time",
			IS_FIREFOX
				? "To see private tabs, allow Run in Private Windows in the add-on settings"
				: "To see incognito tabs, enable incognito access in the extension settings",
			"You can drag and drop tabs to other windows",
			"You can type to search right away",
			"Search for either of two things: google OR yahoo",
			"Search titles only with t:news, urls only with u:github",
			"Search saved windows only with s:tax, or type s: to see just those",
			"Exclude with a minus: reddit -u:old.reddit",
			"Put a phrase in quotes: \"pull request\"",
			"Find tabs with an unread count, like \"Inbox (3)\": /\\(\\d+\\)/",
			"Find your local dev servers on any port: /localhost:\\d+/",
			"Find open PDFs with a regular expression: /\\.pdf$/",
			"Hover the search box for the whole search syntax",
			"Highlight Duplicates selects the extra copies, Delete closes them all",
			"Search while duplicates are highlighted to narrow them down"
		];

		return "Tip: " + tips[Math.floor(Math.random() * tips.length)];
	}
	// one tip per popup open: picked in render, every startup re-render (settings,
	// windows, favicons...) showed a different one, several in the first second.
	// A field initialiser, so it must stay below getTip.
	private readonly tip : string = this.getTip();
	elVisible(elem : HTMLElement) {
		if (!(elem instanceof Element)) throw Error("DomUtil: elem is not an element.");
		var style = getComputedStyle(elem);
		if (style.display === "none") return false;
		if (style.visibility !== "visible") return false;
		let _opacity : number = parseFloat(style.opacity);
		if (_opacity < 0.1) return false;
		if (elem.offsetWidth + elem.offsetHeight + elem.getBoundingClientRect().height + elem.getBoundingClientRect().width === 0) {
			return false;
		}
		var elemCenter = {
			x: elem.getBoundingClientRect().left + elem.offsetWidth / 2,
			y: elem.getBoundingClientRect().top + elem.offsetHeight / 2
		};

		if (elemCenter.x < 0) return false;
		if (elemCenter.x > (document.documentElement.clientWidth || window.innerWidth)) return false;
		if (elemCenter.y < 0) return false;
		if (elemCenter.y > (document.documentElement.clientHeight || window.innerHeight)) return false;
		var pointContainer : ParentNode = document.elementFromPoint(elemCenter.x, elemCenter.y);
		do {
			if (pointContainer === elem) return true;
		} while ((pointContainer = pointContainer.parentNode))
		return false;
	}
}