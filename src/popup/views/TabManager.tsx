import {getLocalStorage, setLocalStorage, getLocalStorageMap} from "@helpers/storage";
import {readSettings, writeBootCache, SETTING_DEFAULTS, Settings, Layout, LAYOUT, getSetting, saveSetting} from "@helpers/settings";
import {sortWindows} from "@helpers/windows";
import {groupSelection, buildSavedWindow, newSessionId, savedText} from "@helpers/sessions";
import {parseQuery, matchTab, searchable, queryReach} from "../search";
import {SAVED_SEARCH_TIP, searchHelpIntro, searchHelpRows, searchTips} from "../searchHelp";
import {duplicatesTitle, findDuplicates} from "../duplicates";
import {recentTabs, recentText, recentTitle, RecentTabs, RECENT_LEVELS} from "../recent";
import {onMainScreen} from "../screen";
import {selectionKeyAction, deleteKeyName} from "../selectionKeys";
import {savedWindowFor} from "../savedRestore";
import {isSavedTabKey, tabKind, keepKind, onlySavedSelected, dropMissingSaved, savedTabKeys} from "../sessionKeys";
import {debounce, maybePluralize} from "@helpers/utils";
import {Window, Session, TabOptions, Tab, WindowOptions} from "@views";
import * as React from "react";
import * as S from "@strings";
import * as browser from 'webextension-polyfill';
import {ICommand, ITabManager, ITabManagerState, ISavedSession} from "@types";
import {ManagerContext, ITabManagerActions, ISettings} from "../context";
import {attachMasonry, Masonry} from "../masonry";
import {sizePopup, popupScreen} from "@helpers/popup_size";
import {restoreDisplays} from "../restoreDisplays";
import {scheduleWorkerCheck, requiredWorkerVersion, staleWorkerText} from "../workerCheck";
import {applyTheme, nextTheme} from "@helpers/theme";
import {actionHelp, trashKeys, newWindowKeys, themeHelp, themeLabel} from "../actionHelp";
import {StatsLayer, StatsSource} from "./StatsLayer";
import {Notice} from "./Notice";
import {MAX_NOTICES, NoticeBoard, NoticeOrder, NoticeRef, isMacPlatform, isUndoKey, undoKeyCaps, undoKeyForField, refusedText, openFailedText} from "../notices";
import {PendingDeletes, PendingItem, withoutItems, visibleSessions, noticeText, goneUrls, UNDO_MS} from "../pendingDelete";
import {savedDeleteItems} from "../savedDelete";
import {editSession, shownSavedName, SessionEdit} from "../sessionEdit";
import {searchSaved, searchSummary, SavedSearch, SummaryKind} from "../searchSaved";
import {isHiddenTab, savedSelectionSignature, shownWithSelection} from "../selectedShown";
import {SearchPicks, searchSelects, searchSelectsSaved, searchTab, keptByHand, movedLeaving} from "../searchPicks";
import {draggedSaved, openableSaved, openedText} from "../savedDrag";
import {moveSession, reorderShown} from "../sessionOrder";
import {tidyStored, listSessions, addSessions, importSessions} from "../sessionStore";
import {moveSavedTabs, remapSavedKeys, movedText, SavedTabMove, SavedDropTarget} from "../savedMove";
import {addOpenTabs, addedText, SavedAddResult} from "../savedAdd";
import {splitByKind, planMove, planAdd, whyUnsavable, dropErrorText, openMoveVerdict, openSavedVerdict, refusalNotice, endedOutside, Left, MovePlan, AddPlan, Refusal, DropVerdict} from "../dropReasons";
import {SavedWrites, SavedChange} from "../savedWrites";
import {stampUpdated} from "../savedUpdated";
import {moveUndoRecord, undoMove, emptiedText, undoneText, UndoOffers, MoveUndo} from "../moveUndo";
import type {SavedTabRef} from "../sessionKeys";
import {stackTiles, stackKind, encodeSaved, encodeIds, TabDrag} from "../dragPayload";
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

// what a drop on a saved tab or card does: moves (or adds) something, is
// refused for a reason that gets an error notice, or changes nothing
type DropAnswer = DropVerdict;

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
	// saved windows deleted and not yet removed from storage (an Undo notice
	// per batch)
	private readonly pending = new PendingDeletes({
		commit: (items, sync) => this.commitDeletes(items, sync),
		onChange: () => { if (!this.unmounted) this.forceUpdate(); },
		onError: (err) => this.board.error(refusedText("delete the saved windows", err))
	});
	// the error and info notices (the Undo notices are `pending`'s and
	// `moveOffers`'). They keep to their own cap (MAX_NOTICES) and stay out
	// of `order`: an error never makes an Undo notice go, so the stack Ctrl+Z
	// takes back stays whole.
	private readonly board = new NoticeBoard({
		onChange: () => { if (!this.unmounted) this.forceUpdate(); },
		limit: () => this.undoNotices().length >= MAX_NOTICES ? MAX_NOTICES - 1 : MAX_NOTICES
	});
	// cancels the pending "is the service worker the one this popup was built
	// for" check (../workerCheck.ts); it runs once, a moment after mounting
	private stopWorkerCheck : (() => void) | null = null;
	// moves that left a saved window without a tab, offered to be taken
	// back for a while (an Undo notice each; ../moveUndo.ts)
	private readonly moveOffers = new UndoOffers<{ record : MoveUndo<ISavedSession>, text : string }>({
		delay: UNDO_MS,
		onChange: () => { if (!this.unmounted) this.forceUpdate(); }
	});
	// the order the Undo notices came up in: they stack, Ctrl+Z takes back
	// the newest first, and a fourth Undo notice makes the oldest go
	// (../notices.ts)
	private readonly order = new NoticeOrder((ref) => this.noticeAlive(ref));
	// Ctrl+Z (Cmd+Z on a Mac) while an Undo notice is up: the newest one.
	// Also in the search box with text in it (the notice wins there); in any
	// other text field with text it stays the field's own undo.
	private readonly mac = isMacPlatform((navigator as any).userAgentData?.platform || navigator.platform);
	private readonly onUndoKey = (e : KeyboardEvent) => {
		if (!isUndoKey(e, this.mac)) return;
		const newest = this.undoNotices().pop();
		if (!newest) return;
		const el = e.target instanceof HTMLElement ? e.target : null;
		if (!undoKeyForField(el && { tag: el.tagName, type: (el as HTMLInputElement).type, value: (el as HTMLInputElement).value, contentEditable: el.isContentEditable, search: el === this.searchBoxRef.current })) return;
		e.preventDefault();
		e.stopPropagation();
		// a held key (auto-repeat) takes back one notice, not the whole
		// stack; the repeats still stay away from the text's own undo
		if (e.repeat) return;
		this.undoNotice(newest);
	};
	// leaving the popup writes the deletes that are still counting down
	private readonly flushPending = () => this.pending.flush(true);
	private readonly flushPendingHidden = () => { if (document.visibilityState === "hidden") this.pending.flush(true); };

	private readonly runUpdate = () => this.setState({ dirty: true });
	// the open tabs the search (or a highlight) selected, as opposed to the
	// ones selected by hand, which a new search leaves selected (../searchPicks.ts)
	private readonly searchPicks = new SearchPicks();
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
	// The last target a dragover was over that refuses the drag for a reason,
	// with the notice that reason gives (cleared at the start of every
	// dragover, so it is only ever the target the pointer is on now): a drag
	// that ends there, dropped nowhere, shows the notice (dragDone)
	private refusal : Refusal | null = null;
	// a drop event came in this drag: whatever dragend then says, it was dropped
	private dropped = false;
	// the dragend event dragDone handled last
	private lastEnd : Event | null = null;
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
			dragSession: (id) => { this.draggingSession = id; if (id) { this.draggingOpen = null; this.refusal = null; this.dropped = false; } },
			sessionDropMoves: (target, before) => this.sessionDropMoves(target, before),
			dropSession: (target, before) => { void this.dropSession(target, before); },
			savedDropOver: (sessionId, index, before) => this.savedDropOver(sessionId, index, before),
			openDropOver: (windowId, tabId, before) => this.openDropOver(windowId, tabId, before),
			dropSaved: (sessionId, index, before, dragged) => { void this.dropSaved(sessionId, index, before, dragged); },
			hoverIcon: (text) => this.hoverIcon(text),
			openWindowOptions: (windowId, autoName) => this.setState({ colorsActive: windowId, colorsAutoName: autoName }),
			openSessionOptions: (id, autoName) => this.setState({ colorsSession: id, colorsAutoName: autoName }),
			editSession: (id, edit) => this.editSession(id, edit),
			closeWindowOptions: () => this.closeWindowOptions(),
			scrollTo: (what, id) => this.scrollTo(what, id),
			setSetting: (key, value) => this.setSetting(key, value),
			setBottomText: (text) => this.setState({ bottomText: text }),
			sessionSync: () => this.sessionSync(),
			addSavedWindows: (sessions) => this.addSavedWindows(sessions),
			importSavedWindows: (sessions) => this.importSavedWindows(sessions),
			deleteSession: (session) => this.deleteSession(session),
			leaveSearchBox: () => this.leaveSearchBox(),
			showError: (text) => { this.board.error(text); },
			showInfo: (text, ms) => { this.board.info(text, ms); },
			closeNotices: () => this.closeNotices(),
			reload: () => this.setState({ dirty: true }),
			rerender: () => this.forceUpdate()
		};
	}

	async componentDidUpdate(prevProps, prevState) {
		this.syncMasonry();
		// s: and -s: are syntax only while saved windows are on: a search typed
		// under the other setting is read again
		if (prevState.sessionsFeature !== this.state.sessionsFeature && this.state.searchLen > 0) {
			const box = this.searchBoxRef.current;
			if (box && box.value) this.runSearch(box.value);
		}
		if (this.state.dirty) {
			await this.update();
			this.setState({dirty: false});
		}
	}

	componentWillUnmount() {
		this.masonry?.disconnect();
		this.stopWorkerCheck?.();

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
		document.removeEventListener("keydown", this.onUndoKey, true);
		document.removeEventListener("dragend", this.dragDone);
		document.removeEventListener("drop", this.dragDone);
		document.removeEventListener("dragover", this.dragOverBegin, true);
		// written from the copy; the component is going, its state stays
		this.unmounted = true;
		this.pending.flush(true);
		this.board.closeAll();
		this.moveOffers.clear();
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
		const target = e.target as HTMLElement;
		// an action button's help is in the hover card (data-help,
		// ../actionHelp.ts, ../statsHover.ts): the header has none for it, not
		// even the hover text of the window card around it
		const el = target.closest("[data-help]") ? null : target.closest<HTMLElement>("[data-hover], [title]");
		// data-hover-hold (an options section's help text): no idle clear, the
		// text stays while the pointer is anywhere inside the section and goes
		// once it moves onto something without a hover text
		this.hoverIcon(el ? (el.dataset.hover ?? el.title) : "", !!el && el.dataset.hoverHold !== undefined);
	}
	// the pointer left the popup: no mouseover follows, so a held help text
	// (an option's) would stay; it goes as on leaving it (not a text something
	// else put there since, e.g. a button's result; read from the pending
	// state, the hover may not have rendered yet)
	leaveRoot = () => {
		const held = this.helpHeld;
		if (held === null) return;
		this.helpHeld = null;
		this.headerOnly(() => this.setState((prev) => prev.topText === held ? { topText: "", bottomText: " " } : null));
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
	// every header hover). A saved window holding a selected tab stays on
	// screen (`shown`): selected tabs are never hidden (../selectedShown.ts).
	// `hidden` stays the tabs that do not match, which fade or hide.
	private savedMemo : { sessions : ISavedSession[], query : unknown, openOnly : boolean, selected : string, result : SavedSearch } | null = null;
	savedSearch(sessions : ISavedSession[]) : SavedSearch {
		const query = this.state.query;
		const openOnly = this.state.dupTabs || this.state.recentLevel > 0;
		const selected = savedSelectionSignature(this.state.selection);
		const m = this.savedMemo;
		if (m && m.sessions.length === sessions.length && m.sessions.every((s, i) => s === sessions[i]) && m.query === query && m.openOnly === openOnly && m.selected === selected) return m.result;
		const found = searchSaved(sessions, query, openOnly);
		const result = selected ? { ...found, shown: shownWithSelection(found.shown, this.state.selection) } : found;
		this.savedMemo = { sessions, query, openOnly, selected, result };
		return result;
	}
	// the first line of the held help text hoverIcon showed last, null when
	// the last one was not held
	private helpHeld : string | null = null;
	hoverIcon = (text : string, hold = false) => {
		let bottom = " ";
		if (text.indexOf("\n") > -1) {
			const a = text.split("\n");
			text = a[0];
			bottom = a[1];
		}
		this.helpHeld = hold ? text : null;
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
					(this.noticeCount() ? " notices-showing" : "")
				}
				style={this.noticeCount() ? {"--notice-count": this.noticeCount()} as React.CSSProperties : undefined}
				onKeyDown={this.checkKey}
				onMouseOver={this.hoverOver}
				onMouseLeave={this.leaveRoot}
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
										compact={this.state.compact}
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
					{/* right to left: options, theme, rate, donate (actions.css); the
					    supportLinks setting hides only donate and rate */}
					{this.state.supportLinks && <div
						className="icon windowaction donate"
						role="button"
						aria-label="Donate a Coffee"
						{...actionHelp("Donate a Coffee\nOpens PayPal in a new tab")}
						onClick={this.donate}
					/>}
					{this.state.supportLinks && <div
						className="icon windowaction rate"
						role="button"
						aria-label="Rate Tab Manager Plus"
						{...actionHelp("Rate Tab Manager Plus\nOpens its page in the " + (IS_FIREFOX ? "Firefox Add-ons site" : "Chrome Web Store") + " in a new tab")}
						onClick={this.rateExtension}
					/>}
					<div
						className="icon windowaction theme"
						data-choice={this.state.theme}
						role="button"
						aria-label={themeLabel(this.state.theme)}
						{...actionHelp(themeHelp(this.state.theme))}
						onClick={this.cycleTheme}
					/>
					<div
						className="icon windowaction options"
						role="button"
						aria-label="Options"
						{...actionHelp(this.optionsHelp(this.state.optionsActive))}
						onClick={this.toggleOptions}
					/>
					<input
						type="text"
						disabled={true}
						className="tabtitle"
						ref={this.topBoxRef}
						placeholder={maybePluralize(tabCount, 'tab') + " in " + maybePluralize(this.state.windows.length, 'window')}
						value={this.state.topText}
					/>
					<input type="text" disabled={true} className="taburl" ref={this.topBoxUrlRef} placeholder={this.getTip()} value={this.state.bottomText} />
				</div>
				{onMainScreen(this.state) && <div className={"window searchbox"}>
					<table>
						<tbody>
							<tr>
								<td className="one">
									<input className="searchBoxInput" type="text" placeholder="Start typing to search tabs..." aria-describedby="search-help" tabIndex={1} onChange={this.search} ref={this.searchBoxRef} />
									<div className="search-help" role="tooltip" id="search-help">
										<p className="search-help-intro">{searchHelpIntro(this.state.sessionsFeature)}</p>
										<table className="search-help-table">
											<tbody>
												{searchHelpRows(this.state.sessionsFeature).map((r) => <tr key={r.code}><td><code>{r.code}</code></td><td>{r.text}</td></tr>)}
											</tbody>
										</table>
									</div>
								</td>
								{/* --bar-count: the number of icons in this bar, 8 + the Save selected tabs one; update it when an icon is added or removed */}
								<td className="two" style={{"--bar-count": this.state.sessionsFeature ? 9 : 8} as React.CSSProperties}>
									{/* each button's help shows in the hover card (actionHelp), with
									    the key caps of a key that does the same (../actionHelp.ts) */}
									<div
										className={"icon windowaction " + this.state.layout + "-view"}
										role="button"
										aria-label={"Change to " + this.readablelayout(this.nextlayout()) + " View"}
										{...actionHelp(this.readablelayout(this.state.layout) + " View is active\nChange to " + this.readablelayout(this.nextlayout()) + " View")}
										onClick={this.changelayout}
									/>
									<div
										className="icon windowaction trash"
										role="button"
										aria-label={savedSel ? "Delete selected saved tabs" : this.state.selection.size > 0 ? "Close selected tabs" : "Close current Tab"}
										{...actionHelp(
											savedSel
												? "Delete selected saved tabs\nWill delete " + maybePluralize(this.state.selection.size, "saved tab") + " from their saved windows. Undo is possible for a few seconds"
												: this.state.selection.size > 0
												? "Close selected tabs\nWill close " + maybePluralize(this.state.selection.size, 'tab')
												: "Close current Tab",
											trashKeys(this.state.selection.size, this.mac)
										)}
										onClick={this.deleteTabs}
									/>
									<div
										className="icon windowaction discard"
										role="button"
										aria-label="Discard selected tabs"
										{...actionHelp(
											savedSel ? savedSelTitle : this.state.selection.size > 0
												? "Discard selected tabs\nWill put " + maybePluralize(this.state.selection.size, 'tab') + " to sleep - freeing memory"
												: "Select tabs to put them to sleep and free up memory"
										)}
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
										role="button"
										aria-label={this.state.selection.size > 0 ? "Pin selected tabs" : "Pin current Tab"}
										{...actionHelp(
											savedSel ? savedSelTitle : this.state.selection.size > 0
												? "Pin selected tabs\nWill pin " + maybePluralize(this.state.selection.size, 'tab')
												: "Pin current Tab"
										)}
										onClick={this.pinTabs}
									/>
									<div
										className={"icon windowaction filter" + (this.state.filterTabs ? " enabled" : "")}
										role="button"
										aria-label="Hide tabs that do not match search"
										aria-pressed={this.state.filterTabs}
										{...actionHelp(
											(this.state.filterTabs ? "Turn off hiding of" : "Hide") +
											" tabs that do not match search" +
											(this.state.searchLen > 0
												? "\n" +
													(this.state.filterTabs ? "Will reveal " : "Will hide ") +
													maybePluralize((this.state.tabsbyid.size - this.state.selection.size), 'tab')
												: "")
										)}
										onClick={this.toggleFilterMismatchedTabs}
									/>
									{this.state.sessionsFeature && <div
										className="icon windowaction save-tabs"
										style={this.state.selection.size > 0 && !savedSel ? {} : { opacity: 0.25 }}
										role="button"
										aria-label="Save selected tabs"
										{...actionHelp(
											savedSel ? savedSelTitle : this.state.selection.size > 0
												? "Save selected tabs\nWill save " + maybePluralize(this.state.selection.size, 'selected tab') + " as a new saved window. Please note : The saved tabs will lose their history."
												: "Select tabs to save them together as a new saved window"
										)}
										onClick={this.saveSelected}
									/>}
									<div
										className="icon windowaction new"
										style={savedSel ? savedSelStyle : {}}
										role="button"
										aria-label={this.state.selection.size > 0 ? "Move tabs to new window" : "Open new empty window"}
										{...actionHelp(
											savedSel ? savedSelTitle : this.state.selection.size > 0
												? "Move tabs to new window\nWill move " + maybePluralize(this.state.selection.size, 'selected tab') + " to it"
												: "Open new empty window",
											newWindowKeys(this.state.selection.size, savedSel, this.state.searchLen > 0)
										)}
										onClick={this.addWindow}
									/>
									<div
										className={"icon windowaction duplicates" + (this.state.dupTabs ? " enabled" : "")}
										role="button"
										aria-label="Highlight duplicates"
										aria-pressed={!!this.state.dupTabs}
										{...actionHelp(duplicatesTitle(this.getDuplicates(), !!this.state.dupTabs))}
										onClick={this.highlightDuplicates}
									/>
									<div
										className={"icon windowaction recent" + (this.state.recentLevel ? " enabled" : "")}
										data-level={this.state.recentLevel}
										role="button"
										aria-label="Highlight recently active tabs"
										aria-pressed={this.state.recentLevel > 0}
										{...actionHelp(recentTitle(this.state.tabsbyid.values(), Date.now(), this.state.recentLevel))}
										onClick={this.highlightRecent}
									/>
								</td>
							</tr>
						</tbody>
					</table>
				</div>}
				<div className="window placeholder" />
				{this.noticeCount() > 0 && <div className="notices">
					{this.board.items.map((n) => <Notice
						key={n.id}
						kind={n.kind}
						text={n.text}
						countdown={n.ms}
						run={this.board.runs(n.id)}
						onClose={() => this.board.close(n.id)}
						onHold={(held) => this.board.hold(n.id, held)}
					/>)}
					{/* oldest first, the newest at the bottom: Ctrl+Z is its
					   Undo, so only it shows the key caps */}
					{this.undoNotices().map((u, at, all) => <Notice
						key={"undo-" + u.source + "-" + u.key}
						kind="undo"
						text={u.text}
						countdown={UNDO_MS}
						run={u.runs}
						onUndo={() => this.undoNotice(u)}
						keys={at === all.length - 1 ? undoKeyCaps(this.mac) : undefined}
						onClose={() => this.endNotice(u)}
						onHold={(held) => this.holdNotice(u, held)}
					/>)}
				</div>}
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

		// not awaited and not before the popup has had time to render: a timer
		this.stopWorkerCheck = scheduleWorkerCheck({
			ask: () => browser.runtime.sendMessage<ICommand>({command: S.worker_version}),
			required: requiredWorkerVersion(),
			onStale: () => { this.board.error(staleWorkerText(IS_FIREFOX)); }
		});

		browser.storage.onChanged.addListener(this.sessionSync);
		browser.storage.onChanged.addListener(this.onStorageChanged);

		window.addEventListener("pagehide", this.flushPending);
		document.addEventListener("visibilitychange", this.flushPendingHidden);
		// first (capturing), before a text field takes Ctrl+Z for its own undo
		document.addEventListener("keydown", this.onUndoKey, true);
		// after the cards' and tabs' own handlers (bubbling, on the document)
		document.addEventListener("dragend", this.dragDone);
		document.addEventListener("drop", this.dragDone);
		// before the cards' and tabs' own dragover handlers, which say what they refuse
		document.addEventListener("dragover", this.dragOverBegin, true);

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
	// An import (the options' backup file): added like a save, except the saved
	// windows whose tabs (addresses, in order) a saved window on screen already
	// has (../sessionStore.ts importSessions). Resolves with how many of those
	// were left out; rejects when the browser refused the write.
	async importSavedWindows(sessions : ISavedSession[]) : Promise<number> {
		let duplicates = 0;
		await this.mutateSessions((stored) => {
			// not the saved windows (or tabs) a pending delete takes away
			const r = importSessions(stored, sessions, withoutItems(stored, this.pending.hiding()));
			duplicates = r.duplicates;
			return r.added.length ? r.stored : null;
		});
		return duplicates;
	}
	// Deletes a saved window: hidden now, removed from storage when the
	// countdown ends (./pendingDelete.ts)
	deleteSession(session : ISavedSession) {
		// the addresses of all its tabs, the ones a pending delete hides too:
		// the write leaves it alone if it holds others by then (imported over,
		// added to elsewhere)
		const all = this.state.sessions.find((s) => s.id === session.id) || session;
		const batch = this.pending.add({id: session.id, name: this.savedName(all), tabs: session.tabs.length, urls: goneUrls(all.tabs)}, this.joinableBatch());
		this.noticeShown({ source: "delete", key: batch });
		// its selected tabs go with it
		dropMissingSaved(this.state.selection, this.visibleSessions());
		this.setState(this.selectionText());
	}
	// Deletes the selected saved tabs from their saved windows: hidden now,
	// removed from storage when the countdown ends, with the same Undo notice as
	// a deleted window. A saved window left with no tab goes whole.
	deleteSavedTabs() {
		const items = savedDeleteItems(this.state.selection, this.visibleSessions().map((s) => ({...s, name: this.savedName(s)})));
		if (items.length === 0) return;
		let batch = this.joinableBatch();
		for (const item of items) batch = this.pending.add(item, batch);
		this.noticeShown({ source: "delete", key: batch! });
		// everything selected was just deleted
		this.clearSelection();
		this.setState(this.selectionText());
	}
	// Closes the name / colour screen. Back from one on a saved window, the
	// popup scrolls to that window (as after saving a window): the screen
	// covers the list, and the window may have been out of view behind it.
	closeWindowOptions() {
		const edited = this.state.colorsSession;
		this.setState({ colorsActive: 0, colorsSession: "", colorsAutoName: "", dirty: true });
		if (edited) setTimeout(() => this.scrollTo("session", edited), 150);
	}
	// A saved window's name as it shows: the name the user gave, else the
	// automatic one as made now (./sessionEdit.ts)
	savedName(s : { name : string, customName : boolean, tabs : browser.Tabs.Tab[] }) : string {
		return shownSavedName(s, this.state.compact);
	}
	// the shown name of the saved window `id` in a stored list ("" when gone)
	private storedName(stored : Record<string, ISavedSession>, id : string) : string {
		const s = Object.values(stored).find((x) => x && x.id === id);
		return s ? this.savedName(s) : "";
	}
	// Opens the selected saved tabs in one new window, in the order shown
	// (../savedRestore.ts), through the worker command a click on a saved tab
	// uses. The popup waits for the worker before it closes (Chrome drops the
	// message of a popup that is gone before the worker is awake).
	// A second Enter while the worker is still answering (double press, held
	// key, cold worker) must not open a second window: `restoring` holds it off.
	private restoring = false;
	async openSelectedSaved() {
		if (this.restoring) return;
		const sessions = this.visibleSessions();
		const keys = [...this.state.selection].filter((key) => isSavedTabKey(key));
		if (keys.length === 0) return;
		const session = savedWindowFor(keys, sessions);
		if (!session) return;
		this.restoring = true;
		let windowId : number | undefined;
		let failure : unknown = null;
		try {
			windowId = await browser.runtime.sendMessage<ICommand, number | undefined>({
				command: S.create_window_with_session_tabs,
				session: session,
				tab_id: null,
				// the worker has no screen; this is the display the popup is on
				screen: popupScreen(),
				// and the monitors the hover card predicted the landing with
				displays: await restoreDisplays()
			});
		} catch (e) {
			console.error(e);
			failure = e;
		} finally {
			// before the failure branch: a refused restore can be retried
			this.restoring = false;
		}
		if (typeof windowId !== "number") {
			// the worker threw, or the browser refused the window: the error
			// notice says so, the popup stays open and the selection stays
			this.board.error(failure ? refusedText("open the saved tabs", failure) : openFailedText(session.tabs.length, 0));
			return;
		}
		// the opened ones are done with
		this.leaveSelection(keys);
		if (!!window.inPopup) {
			window.close();
		} else {
			this.setState(this.selectionText());
			// give the popup a moment to pick up the new window and render it
			setTimeout(() => this.scrollTo("window", String(windowId)), 500);
		}
	}
	// Renames / recolours a saved window (./sessionEdit.ts). The card changes
	// at once; storage.onChanged then brings every other popup along.
	async editSession(id : string, edit : SessionEdit) {
		try {
			await this.mutateSessions((stored) => editSession(stored, id, edit));
		} catch (err) {
			console.error(err);
			this.board.error(refusedText("save the name and colour", err));
		}
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
		try {
			await this.mutateSessions((stored) => reorderShown(stored, shown, dragged, target, before));
		} catch (err) {
			console.error(err);
			this.board.error(refusedText("move the saved window", err));
		}
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
			// a selected tab is shown, whatever the search says
			const tabs = filter ? s.tabs.filter((tab) => !isHiddenTab(savedTabKeys.key(s.id, tab.index), saved.hidden, true, this.state.selection)) : s.tabs;
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
	// A drag is over a saved tab (`index` of saved window `sessionId`, `before`
	// or after it; undefined: its card, the tabs would go at its end): whether
	// the drop is taken. True when the dragged saved tabs would move there
	// among what is on screen (../savedMove.ts), or copies of the dragged open
	// tabs could go there (../savedAdd.ts), at least in part. False when
	// nothing would change or every dragged tab is left out (all private
	// where the saved window is normal or the other way round, no open tab
	// has anything to save): the target then shows the browser's not-allowed
	// cursor and no marker, and a drag that ends there says why (dragDone).
	savedDropOver(sessionId : string, index : number | undefined, before : boolean) : boolean {
		const answer = this.dropAnswer(sessionId, index, before);
		if (answer.verdict === "moves") return true;
		this.noteRefusal(answer.text);
		return false;
	}
	// The same for a drag over an open window (`tabId` undefined) or one of
	// its tabs, `before` it or after: saved tabs open there as copies, open
	// tabs move there. Refused when none can (private and normal never mix; the
	// saved tabs are gone), nothing when one tab is dropped where it is.
	openDropOver(windowId : number, tabId : number | undefined, before : boolean) : boolean {
		const answer = this.openDropAnswer(windowId, tabId, before);
		if (answer.verdict === "moves") return true;
		this.noteRefusal(answer.text);
		return false;
	}
	private openDropAnswer(windowId : number, tabId : number | undefined, before : boolean) : { verdict : DropVerdict, text : string } {
		// a drag started in another Tab Manager page is not known here: taken, the drop reads its data
		const saved = this.draggingSaved;
		if (saved && saved.length > 0) {
			const found = openableSaved(saved, this.visibleSessions());
			const v = openSavedVerdict(found.tabs.length, found.gone, found.blank);
			return { verdict: v.verdict, text: dropErrorText("opened", "saved tab", found.tabs.length + found.gone + found.blank, 0, v.left) };
		}
		const open = this.draggingOpen;
		const target = this.state.windowsbyid.get(windowId);
		if (open && open.length > 0 && target) {
			const next = tabId === undefined ? undefined : this.state.tabsbyid.get(tabId);
			const v = openMoveVerdict(open.map((tab) => ({ id: tab.id!, windowId: tab.windowId!, index: tab.index, incognito: tab.incognito })), {
				windowId,
				incognito: !!target.incognito,
				index: next ? next.index + (before ? 0 : 1) : undefined,
				last: (target.tabs?.length || 0) - 1
			});
			return { verdict: v.verdict, text: dropErrorText("moved", "tab", open.length, 0, v.left) };
		}
		return { verdict: "moves", text: "" };
	}
	// this dragover is over a target that refuses the drag; `text` is the
	// notice if it ends there ("" when there is nothing to say)
	private noteRefusal(text : string) {
		this.refusal = text ? { text, at: Date.now() } : null;
	}
	// Asked on every dragover of every saved tab and card: the answers are
	// kept for as long as the drag, what is shown and the search stay the same.
	private dropMovesMemo : { dragged : readonly unknown[], shown : ISavedSession[], search : SavedSearch, filter : boolean, store : Record<string, ISavedSession>, refs : SavedTabRef[], answers : Map<string, { verdict : DropAnswer, text : string }> } | null = null;
	private dropAnswer(sessionId : string, index : number | undefined, before : boolean) : { verdict : DropAnswer, text : string } {
		const open = this.draggingOpen;
		const dragged = this.draggingSaved || open;
		if (!dragged) return { verdict: "none", text: "" };
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
			let changes : boolean;
			let left : Left[];
			let text : string;
			if (open) {
				const plan = planAdd(m.store, open, target, IS_FIREFOX);
				changes = this.addOpen(m.store, plan.go, target) !== null;
				left = plan.left;
				text = dropErrorText("added", "tab", open.length, 0, left);
			} else {
				const plan = planMove(m.store, m.refs, target);
				changes = moveSavedTabs(m.store, plan.go, target) !== null;
				left = plan.left;
				text = dropErrorText("moved", "saved tab", m.refs.length, 0, left);
			}
			answer = changes ? { verdict: "moves", text: "" } : left.length > 0 ? { verdict: "refused", text } : { verdict: "none", text: "" };
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
		const open = dragged ? (dragged.kind === "open" ? { tabs: this.openTabsById(dragged.ids), asked: dragged.ids.length } : null) : (this.draggingOpen ? { tabs: this.draggingOpen, asked: this.draggingOpen.length } : null);
		if (open) {
			this.draggingOpen = null;
			await this.addOpenTabs(target, open.tabs, open.asked);
			return;
		}
		const refs = dragged ? (dragged.kind === "saved" ? dragged.refs : []) : this.draggedRefs();
		this.draggingSaved = null;
		if (refs.length === 0) return;
		// nothing on screen to move: a drop that changes nothing on purpose (it
		// stays where it is) says nothing, one that is refused says why
		const shown = planMove(this.shownSavedStore(), refs, target);
		if (!moveSavedTabs(this.shownSavedStore(), shown.go, target)) {
			this.leftOut("moved", "saved tab", refs.length, 0, shown.left);
			return;
		}
		// what Undo needs when the move leaves a saved window without a tab
		let undo = null as MoveUndo<ISavedSession> | null;
		// what the move took of the dragged tabs, in what is stored by then
		const seen : { plan : MovePlan | null, nothing : boolean } = { plan: null, nothing: false };
		const moved = await this.renumberingChange("move the saved tabs", (stored) => {
			const plan = seen.plan = planMove(stored, refs, target);
			const result = moveSavedTabs(stored, plan.go, target);
			if (!result) {
				seen.nothing = true;
				return null;
			}
			undo = moveUndoRecord(stored, plan.go, result);
			return { ...result, stored: stampUpdated(stored, result.stored, Date.now()) };
		});
		if (!moved) {
			// stored saved windows changed since the drop marker (a saved window
			// deleted by another popup): not a refused write, which says so itself
			if (seen.nothing && seen.plan) this.leftOut("moved", "saved tab", refs.length, 0, seen.plan.left);
			return;
		}
		const name = this.storedName(moved.stored, sessionId);
		this.setState({ ...movedText(moved.count, name, moved.emptied.length) });
		if (seen.plan) this.leftOut("moved", "saved tab", refs.length, moved.count, seen.plan.left);
		if (undo) this.offerMoveUndo(undo);
	}
	// Offers to take back a move that removed saved windows (left without a
	// tab), with an Undo notice of its own: the deletes still counting down
	// keep theirs (the notices stack).
	private offerMoveUndo(record : MoveUndo<ISavedSession>) {
		const names = record.emptied.map((id) => {
			const s = record.before.find((x) => x.id === id);
			return s ? this.savedName(s) : "";
		});
		const key = this.moveOffers.offer({ record, text: emptiedText(names) });
		this.noticeShown({ source: "move", key });
	}
	// Undo on that notice (`key`, the newest when left out): the moved tabs
	// go back and the removed saved windows come back, from the snapshot, on
	// what is stored by then (../moveUndo.ts); written like any other change.
	// A moved tab whose delete counts down goes back with it hidden (the
	// delete follows it, renumberingChange); one whose old window is being
	// deleted whole stays where it is.
	async undoMove(key? : number) {
		const offer = this.moveOffers.take(key);
		if (!offer) return;
		let nothing = false;
		const done = await this.renumberingChange("undo the move", (stored) => {
			const closed = this.pending.hiding().filter((item) => item.indexes === undefined).map((item) => item.id);
			const result = undoMove(stored, offer.record, Date.now(), closed);
			nothing = !result;
			return result;
		});
		if (nothing) this.board.info("Nothing to move back: the moved tabs were deleted or moved again since");
		if (!done) return;
		const names = done.restored.map((id) => this.storedName(done.stored, id));
		this.setState({ ...undoneText(done.count, names) });
	}
	// copies of the open tabs `tabs` added at `target` (../savedAdd.ts), in
	// the order the popup lists the open windows
	private addOpen(stored : Record<string, ISavedSession>, tabs : browser.Tabs.Tab[], target : SavedDropTarget) : SavedAddResult<ISavedSession> | null {
		return addOpenTabs(stored, tabs, target, { windowOrder: this.state.windows.map((w) => w.id), firefox: IS_FIREFOX });
	}
	// The dragged open tabs dropped on a saved tab or a saved window card:
	// copies of them go in there (../savedAdd.ts), in one write. The open tabs
	// stay open; the selection they were is done with, as after moving open
	// tabs. The saved window's tabs are numbered anew, as after a move. The
	// ones that cannot go in (`asked` were dragged; closed since, private and
	// normal mixed, nothing to save in them) are in the error notice.
	async addOpenTabs(target : SavedDropTarget, tabs : browser.Tabs.Tab[], asked : number = tabs.length) {
		if (asked === 0) return;
		const gone : Left[] = asked > tabs.length ? [{ reason: "dragged-open-gone", n: asked - tabs.length }] : [];
		const shown = planAdd(this.shownSavedStore(), tabs, target, IS_FIREFOX);
		if (!this.addOpen(this.shownSavedStore(), shown.go, target)) {
			this.leftOut("added", "tab", asked, 0, [...gone, ...shown.left]);
			return;
		}
		const seen : { plan : AddPlan<browser.Tabs.Tab> | null, nothing : boolean } = { plan: null, nothing: false };
		const added = await this.renumberingChange("add the tabs to the saved window", (stored) => {
			const plan = seen.plan = planAdd(stored, tabs, target, IS_FIREFOX);
			const result = this.addOpen(stored, plan.go, target);
			if (!result) {
				seen.nothing = true;
				return null;
			}
			return { ...result, stored: stampUpdated(stored, result.stored, Date.now()) };
		});
		if (!added) {
			// stored saved windows changed since the drop marker (not a refused write)
			if (seen.nothing && seen.plan) this.leftOut("added", "tab", asked, 0, [...gone, ...seen.plan.left]);
			return;
		}
		// the tabs that went in are done with; selected ones left out stay selected
		if (seen.plan) this.leaveSelection(seen.plan.go.filter((tab) => !whyUnsavable(tab, IS_FIREFOX)).map((tab) => tab.id));
		const name = this.storedName(added.stored, target.sessionId);
		this.setState({ ...addedText(added.count, name, asked), dirty: true });
		if (seen.plan) this.leftOut("added", "tab", asked, added.count, [...gone, ...seen.plan.left]);
	}
	// A change to the stored saved windows that numbers saved tabs anew (a
	// move, an add), written like any other (mutateSessions). The selection
	// (showSessions) and the pending deletes follow the tabs to their new
	// numbers. Resolves with the change's result; null when it changed nothing
	// or the browser refused the write.
	private async renumberingChange<R extends { stored : Record<string, ISavedSession>, moves : SavedTabMove[] }>(what : string, change : (stored : Record<string, ISavedSession>) => R | null) : Promise<R | null> {
		let done : R | null = null;
		try {
			await this.mutateSessions((stored) => {
				const result = change(stored);
				if (!result) return null;
				done = result;
				this.renumbered = result.moves;
				// (an Undo of a move takes hidden tabs to another window too)
				this.pending.relocate(result.moves);
				return result.stored;
			}, () => {
				// Refused: the old numbers are shown again. The selection and
				// the pending deletes go back to them (each tab from its new
				// place to its old one), or they would name, hide and later
				// delete the tabs that hold those numbers then.
				const back = done ? done.moves.map((m) => ({ from: m.to, to: m.from })) : [];
				this.renumbered = back;
				this.pending.relocate(back);
			});
		} catch (e) {
			console.error(e);
			this.board.error(refusedText(what, e));
			return null;
		}
		return done;
	}
	// Undo of the delete batch `key` (the newest when left out)
	undoDelete(key? : number) {
		this.pending.undo(key);
	}
	// The Undo notices on screen, oldest first: a batch of deletes each, a
	// move's offer each, in the order they came up (../notices.ts NoticeOrder)
	private undoNotices() : (NoticeRef & { text : string, runs : number })[] {
		return this.order.sort([
			...this.pending.groups.map((g) => ({ source: "delete" as const, key: g.key, text: noticeText(g.items), runs: g.runs })),
			...this.moveOffers.items.map((o) => ({ source: "move" as const, key: o.key, text: o.value.text, runs: o.runs })),
		]);
	}
	// The newest Undo notice, when it is a batch of deletes: a delete made
	// now joins it (one notice, one Undo for both); otherwise null, a batch
	// of its own, so that Ctrl+Z still takes back the newest first.
	private joinableBatch() : number | null {
		const newest = this.undoNotices().pop();
		return newest && newest.source === "delete" ? newest.key : null;
	}
	private noticeAlive(ref : NoticeRef) : boolean {
		if (ref.source === "delete") return this.pending.has(ref.key);
		if (ref.source === "move") return this.moveOffers.has(ref.key);
		return this.board.has(ref.key);
	}
	// A notice came up (or started over): it is the newest; a fourth one
	// makes the oldest go, as its close button would
	private noticeShown(ref : NoticeRef) {
		for (const old of this.order.push(ref)) this.endNotice(old);
		this.board.trim();
	}
	// The Undo of an Undo notice (its button, or Ctrl+Z on the newest)
	private undoNotice(ref : NoticeRef) {
		if (ref.source === "delete") this.undoDelete(ref.key);
		else if (ref.source === "move") void this.undoMove(ref.key);
	}
	// A notice's close button, or it made room for a newer one: a delete
	// stands and is written now, a move stands (it is stored), an error or
	// info goes
	private endNotice(ref : NoticeRef) {
		if (ref.source === "delete") this.pending.flush(false, ref.key);
		else if (ref.source === "move") this.moveOffers.clear(ref.key);
		else this.board.close(ref.key);
	}
	private holdNotice(ref : NoticeRef, held : boolean) {
		if (ref.source === "delete") this.pending.hold(held, ref.key);
		else if (ref.source === "move") this.moveOffers.hold(held, ref.key);
		else this.board.hold(ref.key, held);
	}
	private noticeCount() : number {
		return this.board.items.length + this.pending.groups.length + this.moveOffers.items.length;
	}
	// Starting an import: the notices go, what is pending is written first (the
	// import's own write is queued after it, savedWrites.ts)
	closeNotices() {
		this.pending.flush();
		this.board.closeAll();
		this.moveOffers.clear();
	}
	// Removes saved windows (or some of their tabs) from storage. The state
	// changes before the promise resolves (the ids stop being hidden right
	// after); a refused write rejects and storage is read again: they show
	// again. Each item is written once (PendingDeletes.claim): the closing
	// flush may have written one whose queued write had not started.
	async commitDeletes(items : PendingItem[], sync : boolean) {
		const change = (stored : Record<string, ISavedSession>) => {
			const mine = this.pending.claim(items);
			// the tabs another batch still hides stay for its own Undo, also
			// when this one takes their whole window (../pendingDelete.ts)
			const others = this.pending.hiding().filter((item) => !mine.includes(item));
			// saved windows that lose some tabs were last saved now
			return mine.length ? stampUpdated(stored, withoutItems(stored, mine, others), Date.now()) : null;
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
	// the options button's help (its hover card changes with a click)
	optionsHelp(optionsActive : boolean) : string {
		return optionsActive ? "Close the options\nBack to your tabs" : "Options\nThe settings of Tab Manager Plus";
	}
	// The header's theme button: System -> Light -> Dark, the same setting as
	// the options' Theme choice (TabOptions.changeTheme), applied at once
	cycleTheme = async () => {
		const theme = nextTheme(this.state.theme);
		applyTheme(theme);
		this.setSetting("theme", theme);
		await saveSetting("theme", theme);
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
			this.board.error(refusedText(saved.length === 1 ? "save the window" : "save the windows", err));
			return;
		}
		this.clearSelection();
		this.setState({ topText: savedText(saved.map((x) => ({ name: this.savedName(x), tabs: x.tabs }))), bottomText: " ", dirty: true });
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
			this.searchPicks.pick(this.state.selection, dupItem);
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
				bottomText: deleteKeyName(this.mac) + " closes the duplicates and keeps one of each. Enter moves them to a new window"
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
		this.searchPicks.clear();
		this.clearHiddenTabs();
		this.recentIds = recent ? recent.ids : [];
		let hiddenCount = 0;
		if (recent && recent.count > 0) {
			const ids = new Set(recent.ids);
			for (const id of this.state.tabsbyid.keys()) {
				if (ids.has(id)) {
					this.searchPicks.pick(this.state.selection, id);
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
			bottomText: recent && recent.count > 0 ? deleteKeyName(this.mac) + " closes them. Enter moves them to a new window" : "",
			dirty: true
		});
	}
	search = (e : React.ChangeEvent<HTMLInputElement>) => {
		this.runSearch(e.target.value);
	}
	runSearch(query : string) {
		let hiddenCount = this.state.hiddenCount || 0;
		let saved : SavedSearch | null = null;
		let savedPicked = false;
		const searchQuery = query || "";
		const searchLen = searchQuery.length;
		// see src/popup/search.ts for the grammar; s: and -s: are syntax only
		// while the saved windows feature is on
		const parsed = parseQuery(searchQuery, this.state.sessionsFeature);

		if (!searchLen) {
			// what the search selected leaves; the tabs selected by hand stay
			this.searchPicks.unpickAll(this.state.selection);
			this.setState({
				hiddenCount: 0,
				dupTabs: false,
				recentLevel: 0,
				dirty: true
			});
			this.clearHiddenTabs();
			hiddenCount = 0;
		} else {
			// The search selects the open tabs it matches, or the saved ones when
			// no open tab matches, and takes back what an earlier search selected;
			// tabs selected by hand stay selected, and so on screen, matching or
			// not (saved tabs by hand: then it selects no open tab, the selection
			// never mixes them, see ../searchPicks.ts)
			this.searchPicks.unpickSaved(this.state.selection);
			const selects = searchSelects(this.state.selection, parsed.scopeOnly);
			let openMatches = 0;
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
					openMatches++;
					hiddenCount -= this.state.hiddenTabs.has(id) ? 1 : 0;
					this.state.hiddenTabs.delete(id);
				} else {
					hiddenCount += 1 - (this.state.hiddenTabs.has(id) ? 1 : 0);
					this.state.hiddenTabs.add(id);
				}
				// a query of only -s: shows every open tab and selects none
				searchTab(this.state.selection, this.searchPicks, id, match, selects);
				this.setState({
					lastSelect: id,
					dirty: true
				});
			}
			saved = searchSaved(
				this.visibleSessions(),
				parsed,
				this.state.dupTabs || this.state.recentLevel > 0
			);
			if (searchSelectsSaved(this.state.selection, openMatches, parsed.scopeOnly)) {
				for (const key of saved.matched) this.searchPicks.pick(this.state.selection, key);
				savedPicked = saved.matched.length > 0;
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
			// saved tabs that match are counted beside the open ones (selected
			// only when no open tab matches)
			if (!saved) saved = searchSaved(
				this.visibleSessions(),
				parsed,
				this.state.dupTabs || this.state.recentLevel > 0
			);
			// only saved tabs can match (a bare s:, s:word...): the saved part
			// of the header alone. Only -s:: the open tabs shown, none selected
			const reach = queryReach(parsed);
			let kind : SummaryKind = "all";
			let openWindows = 0;
			if (parsed.scopeOnly && !reach.saved && reach.open) {
				kind = "open list";
				const shown = new Set<number>();
				for (const [id, tab] of this.state.tabsbyid) if (!this.state.hiddenTabs.has(id)) shown.add(tab.windowId);
				openWindows = shown.size;
			} else if (reach.saved && !reach.open) kind = "saved";
			const summary = searchSummary(searchQuery, matches, saved, kind, openWindows, savedPicked);
			this.setState({
				topText: summary.top,
				// tabs selected by hand go along with Enter: say what Enter does
				bottomText: keptByHand(this.state.selection, this.searchPicks) ? this.selectionText().bottomText : summary.bottom
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
		this.searchPicks.clear();
		this.setState({
			lastSelect: 0
		});
	}
	// A selection by right-click or a modifier click (whose mousedown is
	// prevented, so the focus would stay where it was) moves the focus from
	// the search box to the window list, as a left click does: Ctrl/Cmd+Delete
	// then closes the selection instead of deleting a word of the search text. Typing moves
	// it back in (checkKey).
	leaveSearchBox() {
		const search = this.searchBoxRef.current;
		if (!!search && document.activeElement === search) this.windowContainerRef.current?.focus();
	}
	checkKey = async (e) => {
		// enter: only on the window list. On the options screen or the window
		// name / colour overlay it must not open or move to a window.
		// Ctrl/Cmd+Delete / Backspace and Enter with a selection (../selectionKeys.ts).
		// Plain Delete / Backspace are typing and fall through to the typed keys below
		const search = this.searchBoxRef.current;
		const searchFocused = !!search && document.activeElement === search;
		const action = selectionKeyAction({
			keyCode: e.keyCode,
			cmd: (e.ctrlKey || e.metaKey) && !e.altKey,
			mainScreen: onMainScreen(this.state),
			searchFocused: searchFocused,
			searchHasText: searchFocused && !!search.value,
			selection: this.state.selection
		});
		// a held key (auto-repeat) acts once: only the first press counts
		if (action === "open-saved") {
			e.preventDefault();
			if (e.repeat) return;
			await this.openSelectedSaved();
			return;
		}
		if (action === "delete-saved") {
			e.preventDefault();
			if (e.repeat) return;
			this.deleteSavedTabs();
			return;
		}
		if (action === "close-open") {
			e.preventDefault();
			if (e.repeat) return;
			// straight to the worker: the shortcut never falls back to closing
			// the current tab the way the trash button does (deleteTabs)
			const tabs = this.selectedTabs();
			if (tabs.length) {
				browser.runtime.sendMessage<ICommand>({command: S.close_tabs, tabs: tabs});
			}
			return;
		}
		if (e.keyCode === 13) {
			if (!onMainScreen(this.state)) return;
			// a search that selected no open tab (no match, or an s: search,
			// which never matches open tabs): Enter does nothing, instead of
			// opening an empty window
			if (this.state.searchLen > 0 && this.state.selection.size === 0) return;
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
			// the arrows select: the focus goes to the window list, unless they
			// move the caret in a search box that holds text (an empty box
			// gives the focus up too, so Ctrl/Cmd+Delete then closes the selection)
			if (document.activeElement !== this.windowContainerRef.current && (document.activeElement !== this.searchBoxRef.current || !this.searchBoxRef.current?.value)) {
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
								// the arrows walk the matches, and the selected
								// tabs, which are on screen whatever they match
								if (this.offArrowPath(_t.id)) continue;
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
								if (this.offArrowPath(_t.id)) continue;
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
	// The arrows skip the tabs that do not match (faded or hidden), as always,
	// but not a selected one: it is on screen (../selectedShown.ts) and the
	// arrows go on from it.
	private offArrowPath(id : number) : boolean {
		return isHiddenTab(id, this.state.hiddenTabs, true, this.state.selection);
	}
	selectWindowTab(windowId : number, tabPosition : number) {
		if (!tabPosition || tabPosition < 1) tabPosition = 1;
		let _w = this.state.windowsbyid.get(windowId);

		let i = 0;

		// the tabs the arrows walk (offArrowPath)
		let filteredTabs = _w.tabs.filter(tab => !this.offArrowPath(tab.id));

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
		// selected or deselected by hand: a new search leaves it as it is now
		this.searchPicks.touch(id);
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
		// saved tabs (all of one kind, see select): Ctrl+Delete removes them, Enter opens them
		if (onlySavedSelected(this.state.selection)) return { topText: "Selected " + maybePluralize(selected, "saved tab"), bottomText: "Press enter to open " + (selected === 1 ? "it" : "them") + " in a new window, " + deleteKeyName(this.mac) + " to remove " + (selected === 1 ? "it" : "them") };
		if (selected === 1) return { topText: "Selected " + selected + " tab", bottomText: "Press enter to switch to it" };
		return { topText: "Selected " + selected + " tabs", bottomText: "Press enter to move them to a new window" };
	}
	// The tabs of `tabs` (one window's, or one saved window's) that are on
	// screen: with "Hide non-matching tabs" on, not the ones it hides.
	private tabsOnScreen(tabs : browser.Tabs.Tab[]) : browser.Tabs.Tab[] {
		if (!this.state.filterTabs || tabs.length === 0) return tabs;
		const raw = isSavedTabKey(tabs[0].id) ? this.savedSearch(this.visibleSessions()).hidden : this.state.hiddenTabs;
		return tabs.filter((tab) => !isHiddenTab(tab.id, raw, true, this.state.selection));
	}
	selectTo(id : number, tabs : browser.Tabs.Tab[]) {
		// a range is of one kind; `tabs` is one window's (or one saved window's)
		keepKind(this.state.selection, tabKind(id));
		// A range takes only what is on screen: the tabs "Hide non-matching
		// tabs" hides between its ends stay out (selected, they would show up
		// and shift the tiles under the pointer, and go along in every action).
		tabs = this.tabsOnScreen(tabs);
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
				// selected or deselected by hand (../searchPicks.ts)
				this.searchPicks.touch(_tab_id);
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
	private readonly dragDone = (e? : Event) => {
		// A drag that ended over a target that refuses it, dropped nowhere (the
		// browser delivered no drop: dropEffect none), says why, once: the
		// cursor showed it was not allowed, this tells the reason. The dragged
		// tab's own listener (drag) and the document's both get the event, and a
		// tab that went meanwhile only reaches its own.
		if (e && e.type === "dragend") {
			if (e === this.lastEnd) return;
			this.lastEnd = e;
			// a drag that left the page from a refusing target and ended out
			// there (another window, the desktop) says nothing
			const end = e as DragEvent;
			const outside = endedOutside(end.clientX, end.clientY, window.innerWidth, window.innerHeight);
			const text = refusalNotice(this.refusal, Date.now(), end.dataTransfer?.dropEffect, this.dropped, outside);
			if (text) this.board.error(text);
			this.refusal = null;
			this.dropped = false;
		} else if (e && e.type === "drop") {
			this.dropped = true;
		}
		this.draggingSession = null;
		this.draggingSaved = null;
		this.draggingOpen = null;
	}
	// every dragover starts without a refusing target: the handlers of the
	// target under the pointer set it again (noteRefusal)
	private readonly dragOverBegin = () => {
		this.refusal = null;
	}
	// A tab drag starts: what it takes is remembered for the drop markers, and
	// returned as the drag data (../dragPayload.ts): the saved tabs by saved
	// window and index, or the open tab ids. A drag of several tabs gets a
	// drag image of stacked tiles and their number (../dragImage.ts).
	drag(e : React.DragEvent<HTMLDivElement>, id : number) : string {
		// a tab drag: no saved window card is being dragged
		this.draggingSession = null;
		this.refusal = null;
		this.dropped = false;
		// A tab that is deleted or moved meanwhile (a saved tab another popup
		// deletes) is no longer in the page, and its dragend never reaches the
		// document: listen on the tab itself too.
		const source = e.currentTarget;
		if (source instanceof Element) source.addEventListener("dragend", this.dragDone, { once: true });
		// a saved tab: it and, when it is selected, the other selected saved
		// tabs; it is opened, not moved, so the selection stays as it is
		if (isSavedTabKey(id)) {
			const keys = draggedSaved(id, this.state.selection);
			this.draggingSaved = keys;
			this.draggingOpen = null;
			this.stackImage(e, id, keys);
			return encodeSaved(refsOf(keys));
		}
		this.draggingSaved = null;
		// An unselected open tab while saved tabs are selected goes alone, and
		// the saved selection stays: dropping it here would take off screen the
		// saved windows shown only for a selected tab (../selectedShown.ts),
		// under the pointer, in the middle of the drag.
		if (!this.state.selection.has(id) && onlySavedSelected(this.state.selection)) {
			const tab = this.state.tabsbyid.get(id);
			this.draggingOpen = tab ? [tab] : [];
			return encodeIds(tabIds(this.draggingOpen));
		}
		if (!this.state.selection.has(id)) {
			this.searchPicks.touch(id);
			this.state.selection.add(id);
			this.setState({
				lastSelect: id
			});
		}
		// What a drop takes, on a saved window (copies) as on an open window
		// (moved): the selected open tabs, all on screen (../selectedShown.ts).
		// The drag image counts the same tabs.
		this.draggingOpen = this.selectedTabs();
		const ids = tabIds(this.draggingOpen);
		this.stackImage(e, id, ids);
		return encodeIds(ids);
	}
	// The drag image of a drag that takes several tabs: the tiles on screen
	// of the dragged one and the next ones, as the popup draws them (favicon,
	// title), and how many tabs go. In the layouts that show tabs as icons the
	// tiles are icons only (stackKind).
	private stackImage(e : React.DragEvent<HTMLDivElement>, dragged : number, ids : readonly number[]) {
		const tiles : StackTile[] = [];
		for (const id of stackTiles(dragged, ids)) {
			const ref = isSavedTabKey(id) ? savedTabKeys.ref(id) : undefined;
			const el = document.getElementById(ref ? "sessiontab_" + ref.sessionId + "_" + ref.index : "tab-" + id);
			if (!el) continue;
			const icon = el.querySelector<HTMLElement>(".iconoverlay");
			let fav = el.style.getPropertyValue("--fav") || icon?.style.getPropertyValue("--fav") || "";
			// a tab without a favicon shows the icon set's page icon: the
			// image its tile draws (on ::after, in List on .iconoverlay)
			if (!fav) {
				const image = (icon ? getComputedStyle(icon) : getComputedStyle(el, "::after")).backgroundImage;
				if (image && image !== "none") fav = image;
			}
			// the favicon's tone class (a white or black icon needs its filter)
			const tone = Array.from((icon || el).classList).find((c) => c.startsWith("icon-")) || "";
			tiles.push({ fav, title: (el.getAttribute("data-hover") || "").split("\n")[0], tone });
		}
		if (tiles.length > 1) setStackImage(e.dataTransfer, tiles, ids.length, stackKind(this.state.layout));
	}
	// Dropped on the open tab `id`. `dragged`: what the drop event carries
	// (../dragPayload.ts); without it, what the popup remembers of the drag.
	async drop(id : number, before : boolean, dragged? : TabDrag | null) {
		// a saved window card is no tab (open tabs and windows take no drop from it)
		if (this.draggingSession && !dragged) return;
		var tab : browser.Tabs.Tab = this.state.tabsbyid.get(id);
		const saved = this.droppedSaved(dragged);
		if (saved) {
			if (!tab) {
				this.leftOut("opened", "saved tab", saved.length, 0, [{ reason: "target-open-tab-gone", n: saved.length }]);
				return;
			}
			await this.openSaved(tab.windowId, tab.index + (before ? 0 : 1), saved);
			return;
		}
		const { tabs, asked } = this.movedTabs(dragged);
		if (asked === 0) return;
		if (!tab) {
			this.leftOut("moved", "tab", asked, 0, [{ reason: "target-open-tab-gone", n: asked }]);
			return;
		}
		await this.moveOpen(tabs, asked, tab.windowId, tab.index + (before ? 0 : 1));
	}
	async dropWindow(windowId : number, dragged? : TabDrag | null) {
		if (this.draggingSession && !dragged) return;
		const saved = this.droppedSaved(dragged);
		if (saved) {
			// no tab to go next to: at the end
			await this.openSaved(windowId, undefined, saved);
			return;
		}
		const { tabs, asked } = this.movedTabs(dragged);
		if (asked === 0) return;
		await this.moveOpen(tabs, asked, windowId, undefined);
	}
	// Moves the open tabs `tabs` (of `asked` dragged) to the open window
	// `windowId`, at `index` (undefined: its end, through the worker). Private
	// tabs go only to a private window and normal tabs to a normal one: the
	// others stay where they are, as does every tab the browser refuses, and the
	// error notice says how many and why (../dropReasons.ts). The tabs that
	// moved leave the selection, except the ones the search does not match;
	// selected tabs that did not move (left out) stay selected.
	private async moveOpen(tabs : browser.Tabs.Tab[], asked : number, windowId : number, index : number | undefined) {
		const target = this.state.windowsbyid.get(windowId);
		if (!target) {
			this.leftOut("moved", "tab", asked, 0, [{ reason: "target-open-window-gone", n: asked }]);
			return;
		}
		const left : Left[] = [];
		if (asked > tabs.length) left.push({ reason: "dragged-open-gone", n: asked - tabs.length });
		const kinds = splitByKind(tabs, !!target.incognito, "window");
		left.push(...kinds.left);
		const moved = new Set<number>();
		if (index !== undefined) {
			for (const t of kinds.go) {
				try {
					await browser.tabs.move(t.id, { windowId: windowId, index: index });
					moved.add(t.id);
					await browser.tabs.update(t.id, { pinned: t.pinned });
				} catch (e) {
					console.error("could not move the tab", t.id, e);
				}
			}
		} else if (kinds.go.length > 0) {
			let count : number | undefined;
			try {
				count = await browser.runtime.sendMessage<ICommand, number>({command: S.move_tabs_to_window, window_id: windowId, tabs: kinds.go});
			} catch (e) {
				console.error(e);
			}
			if (count === kinds.go.length) {
				for (const t of kinds.go) moved.add(t.id);
			} else {
				// some did not (or the worker did not say): the window shows which
				const there = await browser.tabs.query({ windowId: windowId }).catch(() => [] as browser.Tabs.Tab[]);
				const ids = new Set(there.map((t) => t.id));
				for (const t of kinds.go) if (ids.has(t.id)) moved.add(t.id);
			}
		}
		if (moved.size < kinds.go.length) left.push({ reason: "move-refused", n: kinds.go.length - moved.size });
		// a moved tab the search does not match stays selected, and so on
		// screen (../searchPicks.ts movedLeaving); it is the user's now
		this.leaveSelection(movedLeaving(moved, this.state.hiddenTabs));
		for (const id of moved) if (this.state.hiddenTabs.has(id)) this.searchPicks.touch(id);
		this.leftOut("moved", "tab", asked, moved.size, left);
		this.update();
	}
	// The tabs a drop took are done with: they leave the selection. Selected
	// tabs it did not take (left out) stay selected.
	private leaveSelection(ids : Iterable<number>) {
		let changed = false;
		for (const id of ids) if (this.state.selection.delete(id)) changed = true;
		if (!changed) return;
		if (this.state.selection.size === 0) this.clearSelection();
		else this.setState({ dirty: true });
	}
	// The error notice for a drop that did nothing or only part (nothing: no
	// notice), see ../dropReasons.ts
	private leftOut(verb : string, noun : string, asked : number, done : number, left : readonly Left[]) {
		const text = dropErrorText(verb, noun, asked, done, left);
		if (text) this.board.error(text);
	}
	// The open tabs a drop on an open window or tab moves: the ones the drop
	// carries (dragstart took the selected open tabs); without that, what the
	// popup remembers of the drag, else the selection. This also covers a drag that started
	// in another Tab Manager page, whose tabs are not this page's selection.
	// `asked`: how many were dragged; the ones closed since are not in `tabs`.
	private movedTabs(dragged? : TabDrag | null) : { tabs : browser.Tabs.Tab[], asked : number } {
		if (dragged && dragged.kind === "open") return { tabs: this.openTabsById(dragged.ids), asked: dragged.ids.length };
		const tabs = this.draggingOpen ?? this.selectedTabs();
		return { tabs, asked: tabs.length };
	}
	// the saved tab keys a drop on an open window opens: the ones the drop
	// carries, else the ones the popup remembers; null for any other drop
	private droppedSaved(dragged? : TabDrag | null) : number[] | null {
		if (dragged) return dragged.kind === "saved" ? dragged.refs.map((ref) => savedTabKeys.key(ref.sessionId, ref.index)) : null;
		return this.draggingSaved && this.draggingSaved.length ? this.draggingSaved : null;
	}
	// Opens the dragged saved tabs in the open window `windowId` at `index`
	// (undefined: at the end), through the worker (../../helpers/openTabs.ts),
	// and waits for it. The saved window is not changed. The selected ones
	// that opened are done with and leave the selection; the ones left out
	// (gone, no address, or none opened) stay selected.
	async openSaved(windowId : number, index : number | undefined, keys : number[]) {
		this.draggingSaved = null;
		if (keys.length === 0) return;
		const { tabs, keys: openable, gone, blank } = openableSaved(keys, this.visibleSessions());
		const asked = tabs.length + gone + blank;
		if (asked === 0) return;
		// what cannot open, and why (../dropReasons.ts)
		const left : Left[] = [];
		if (!this.state.windowsbyid.has(windowId)) {
			this.leftOut("opened", "saved tab", asked, 0, [{ reason: "target-open-window-gone", n: asked }]);
			return;
		}
		if (gone) left.push({ reason: "dragged-saved-gone", n: gone });
		if (blank) left.push({ reason: "no-address", n: blank });
		if (tabs.length === 0) {
			this.leftOut("opened", "saved tab", asked, 0, left);
			return;
		}
		let opened : number | undefined;
		try {
			opened = await browser.runtime.sendMessage<ICommand, number>({command: S.open_saved_tabs, window_id: windowId, index: index, saved_tabs: tabs});
		} catch (e) {
			console.error(e);
			opened = 0;
		}
		const name = this.state.windowrefs.get(windowId)?.current?.shownName() || "";
		const count = typeof opened === "number" ? opened : tabs.length;
		// the worker says only how many opened: with some, the openable ones
		// leave the selection (which of them failed is not known)
		if (count > 0) this.leaveSelection(openable);
		if (count < tabs.length) left.push({ reason: "open-failed", n: tabs.length - count });
		// none opened, or only some: an error notice says so and why, not the header
		this.leftOut("opened", "saved tab", asked, count, left);
		if (count > 0) this.setState({ ...openedText(count, name), dirty: true });
		else this.setState({ dirty: true });
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
			SAVED_SEARCH_TIP,
			"Exclude with a minus: reddit -u:old.reddit",
			"Put a phrase in quotes: \"pull request\"",
			"Find tabs with an unread count, like \"Inbox (3)\": /\\(\\d+\\)/",
			"Find your local dev servers on any port: /localhost:\\d+/",
			"Find open PDFs with a regular expression: /\\.pdf$/",
			"Hover the search box for the whole search syntax",
			"Highlight Duplicates selects the extra copies, " + deleteKeyName(this.mac) + " closes them all",
			"Search while duplicates are highlighted to narrow them down"
		];

		// the list follows the saved windows setting, which can be switched
		// while the popup is open
		const fit = searchTips(tips, this.state.sessionsFeature);
		return "Tip: " + fit[Math.floor(this.tipPick * fit.length)];
	}
	// one tip per popup open: the pick is made once, every startup re-render
	// (settings, windows, favicons...) showed a different one, several in the
	// first second. The list is worked out in render, from the settings.
	private readonly tipPick = Math.random();
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