import {getLocalStorage, setLocalStorage, getLocalStorageMap} from "@helpers/storage";
import {readSettings, writeBootCache, SETTING_DEFAULTS, Settings, Layout, LAYOUT, getSetting, saveSetting} from "@helpers/settings";
import {sortWindows} from "@helpers/windows";
import {parseQuery, matchTab, searchable} from "../search";
import {findDuplicates} from "../duplicates";
import {debounce, maybePluralize} from "@helpers/utils";
import {Window, Session, TabOptions, Tab, WindowOptions} from "@views";
import * as React from "react";
import * as S from "@strings";
import * as browser from 'webextension-polyfill';
import {ICommand, ITabManager, ITabManagerState, ISavedSession} from "@types";
import {ManagerContext, ITabManagerActions, ISettings} from "../context";
import {IS_FIREFOX} from "@helpers/browser";
import {attachMasonry, Masonry} from "../masonry";

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

	private readonly runUpdate = () => this.setState({ dirty: true });
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
	private readonly onStorageChanged = (changes : Record<string, unknown>, area : string) => {
		if (area === "local" && S.windowAge in changes) this.runUpdate();
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
		let dark = s.dark;
		let tabactions = s.tabactions;
		let badge = s.badge;
		let sessionsFeature = s.sessionsFeature;
		let hideWindows = s.hideWindows;
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
			dark: dark,
			tabactions: tabactions,
			badge: badge,
			hideWindows: hideWindows,
			sessionsFeature: sessionsFeature,
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
			dragFavicon: "",
			colorsActive: 0,
			colorsAutoName: "",

			tabCount: 0,
			hiddenCount: 0,
			searchLen: 0,

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
			drop: (id, before) => { this.drop(id, before); },
			dropWindow: (windowId) => { this.dropWindow(windowId); },
			dragFavicon: (icon) => this.dragFavicon(icon),
			hoverIcon: (text) => this.hoverIcon(text),
			openWindowOptions: (windowId, autoName) => this.setState({ colorsActive: windowId, colorsAutoName: autoName }),
			closeWindowOptions: () => this.setState({ colorsActive: 0, colorsAutoName: "", dirty: true }),
			scrollTo: (what, id) => this.scrollTo(what, id),
			setSetting: (key, value) => this.setSetting(key, value),
			setBottomText: (text) => this.setState({ bottomText: text }),
			sessionSync: () => this.sessionSync(),
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

	applySettings(s : Settings) {
		document.body.className = s.dark ? "dark" : "";
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
			dark: s.dark,
			tabactions: s.tabactions,
			badge: s.badge,
			hideWindows: s.hideWindows,
			sessionsFeature: s.sessionsFeature,
			filterTabs: s["filter-tabs"]
		});
	}

	setSetting<K extends keyof ISettings>(key : K, value : ISettings[K]) {
		this.setState({ [key]: value } as Pick<ITabManagerState, K>, () => {
			// keep the synchronous boot cache current for the next open
			writeBootCache({ tabWidth: this.state.tabWidth, tabHeight: this.state.tabHeight, dark: this.state.dark, layout: this.state.layout, compact: this.state.compact });
		});
	}
	hoverOver = (e : React.MouseEvent<HTMLDivElement>) => {
		const el = (e.target as HTMLElement).closest<HTMLElement>("[data-hover], [title]");
		this.hoverIcon(el ? (el.dataset.hover ?? el.title) : "");
	}
	hoverIcon = (text : string) => {
		let bottom = " ";
		if (text.indexOf("\n") > -1) {
			const a = text.split("\n");
			text = a[0];
			bottom = a[1];
		}
		if (text === this.state.topText && bottom === this.state.bottomText) return;
		this.setState({
			topText: text,
			bottomText: bottom
		});
		// idle: clear the header after a while
		clearTimeout(this.state.resetTimeout);
		this.setState({
			resetTimeout: setTimeout(() => this.setState({ topText: "", bottomText: "" }), 15000)
		});
	}
	render() {
		// let hiddenCount = this.state.hiddenCount || 0;
		let tabCount = this.state.tabCount;

		let haveMin = false;
		let haveSess = false;

		for (let i = this.state.windows.length - 1; i >= 0; i--) {
			if (this.state.windows[i].state === "minimized") haveMin = true;
		}

		if (this.state.sessionsFeature) {
			if (this.state.sessions.length > 0) haveSess = true;
			// disable session window if we have filtering enabled
			// and filter active
			if (haveSess && this.state.filterTabs) {
				if (this.state.searchLen > 0 || this.state.hiddenTabs.size > 0) {
					haveSess = false;
				}
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
					(this.state.windowTitles ? "windowTitles" : "no-windowTitles")
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
				{/* keyed by layout: switching layouts remounts every card and tile, so the
				    entrance animation plays again for the new arrangement */}
				{!this.state.optionsActive && !this.state.colorsActive && <div key={"container-" + this.state.layout} className={"window-container " + this.state.layout} ref={this.windowContainerRef} tabIndex={2}>
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
								sessionsFeature={this.state.sessionsFeature}
								tabactions={this.state.tabactions}
								hiddenTabs={this.state.hiddenTabs}
								filterTabs={this.state.filterTabs}
								draggable={true}
								windowTitles={this.state.windowTitles}
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
								sessionsFeature={this.state.sessionsFeature}
								tabactions={this.state.tabactions}
								hiddenTabs={this.state.hiddenTabs}
								filterTabs={this.state.filterTabs}
								draggable={true}
								windowTitles={this.state.windowTitles}
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
						? this.state.sessions.map((window : ISavedSession) => {
								return (
									<Session
										key={"session" + window.id}
										session={window}
										tabs={window.tabs}
										incognito={window.incognito}
										layout={this.state.layout}
										selection={this.state.selection}
										searchActive={this.state.searchLen > 0}
										tabactions={this.state.tabactions}
										hiddenTabs={this.state.hiddenTabs}
										filterTabs={this.state.filterTabs}
										windowTitles={this.state.windowTitles}
										lastOpenWindow={this.state.lastOpenWindow}
										draggable={false}
									/>
								);
							})
						: false}
				</div>}
				{this.state.optionsActive && <div className={"options-container"}>
					<TabOptions
						compact={this.state.compact}
						dark={this.state.dark}
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
						sessions={this.state.sessions}
					/>
				</div>}
				<div className="window top" ref={this.topHoverRef}>
					<div className="icon windowaction donate" title="Donate a Coffee" onClick={this.donate} />
					<div
						className="icon windowaction rate"
						title="Rate Tab Manager Plus"
						onClick={this.rateExtension}
					/>
					<div className="icon windowaction options" title="Options" onClick={this.toggleOptions} />
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
				{!this.state.optionsActive && !this.state.colorsActive && <div className={"window searchbox"}>
					<table>
						<tbody>
							<tr>
								<td className="one">
									<input className="searchBoxInput" type="text" placeholder="Start typing to search tabs..." title={SEARCH_HELP} tabIndex={1} onChange={this.search} ref={this.searchBoxRef} />
								</td>
								<td className="two">
									<div
										className={"icon windowaction " + this.state.layout + "-view"}
										title={this.readablelayout(this.state.layout) + " View is active\nChange to " + this.readablelayout(this.nextlayout()) + " View"}
										onClick={this.changelayout}
									/>
									<div
										className="icon windowaction trash"
										title={
											this.state.selection.size > 0
												? "Close selected tabs\nWill close " + maybePluralize(this.state.selection.size, 'tab')
												: "Close current Tab"
										}
										onClick={this.deleteTabs}
									/>
									<div
										className="icon windowaction discard"
										title={
											this.state.selection.size > 0
												? "Discard selected tabs\nWill put " + maybePluralize(this.state.selection.size, 'tab') + " to sleep - freeing memory"
												: "Select tabs to put them to sleep and free up memory"
										}
										style={
											this.state.selection.size > 0
												? {}
												: { opacity: 0.25 }
										}
										onClick={this.discardTabs}
									/>
									<div
										className="icon windowaction pin"
										title={
											this.state.selection.size > 0
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
									<div
										className="icon windowaction new"
										title={
											this.state.selection.size > 0
												? "Move tabs to new window\nWill move " + maybePluralize(this.state.selection.size, 'selected tab') + " to it"
												: "Open new empty window"
										}
										onClick={this.addWindow}
									/>
									<div
										className={"icon windowaction duplicates" + (this.state.dupTabs ? " enabled" : "")}
										title="Highlight Duplicates"
										onClick={this.highlightDuplicates}
									/>
								</td>
							</tr>
						</tbody>
					</table>
				</div>}
				<div className="window placeholder" />
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

		if (IS_FIREFOX) {
		} else {
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
	sessionSync = async () => {
		let values = await getLocalStorage(S.sessions, {});
		//console.log(values);
		let sessions : ISavedSession[] = [];
		for (let key in values) {
			let sess = values[key];
			if (sess.id && sess.tabs && sess.windowsInfo) {
				sessions.push(sess);
			}
		}
		this.setState({
			sessions: sessions
		});
		await this.update();
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
			if (!this.state.tabsbyid.has(id)) {
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
	pinTabs = async () => {
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
				dirty: true
			});
			this.clearHiddenTabs();
			hiddenCount = 0;
		} else {
			let idList : number[] = [ ...this.state.tabsbyid.keys() ];
			if(this.state.dupTabs) {
				const duplicates = this.getDuplicates();
				const dup = duplicates.duplicates;
				const orig = duplicates.originals;
				idList = [...dup, ...orig];
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
			searchLen: searchLen
		})

		const matches = this.state.tabsbyid.size - hiddenCount;
		if (searchLen === 0) {
			// the field was cleared: no search, no header
			this.setState({
				topText: "",
				bottomText: ""
			});
		} else if (matches === 0) {
			this.setState({
				topText: "No matches for '" + searchQuery + "'",
				bottomText: ""
			});
		} else if (matches > 1) {
			this.setState({
				topText: matches + " matches for '" + searchQuery + "'",
				bottomText: "Press enter to move them to a new window"
			});
		} else if (matches === 1) {
			this.setState({
				topText: matches + " match for '" + searchQuery + "'",
				bottomText: "Press enter to switch to the tab"
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
		// enter
		if (e.keyCode === 13) {
			await this.addWindow();
			return;
		}
		// escape key
		if (e.keyCode === 27) {
			if (!!this.state.colorsActive) {
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
				dupTabs: false,
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
			if (this.state.colorsActive) return;
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
		}, () => writeBootCache({ tabWidth: this.state.tabWidth, tabHeight: this.state.tabHeight, dark: this.state.dark, layout: this.state.layout, compact: this.state.compact }));
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
			this.state.selection.add(id);
			this.setState({
				lastSelect: id
			});
		}
		this.scrollTo('tab', id.toString());

		var selected = this.state.selection.size;
		if (selected === 0) {
			this.setState({
				topText: "No tabs selected",
				bottomText: " "
			});
		} else if (selected === 1) {
			this.setState({
				topText: "Selected " + selected + " tab",
				bottomText: "Press enter to switch to it"
			});
		} else {
			this.setState({
				topText: "Selected " + selected + " tabs",
				bottomText: "Press enter to move them to a new window"
			});
		}
	}
	selectTo(id : number, tabs : browser.Tabs.Tab[]) {
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
		if (!!lastSelect && !rangeIndex2) {
			this.select(id);
			return;
		}
		if (!rangeIndex2) {
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

		const selected = this.state.selection.size;
		if (selected === 0) {
			this.setState({
				topText: "No tabs selected",
				bottomText: " ",
				dirty: true
			});
		} else if (selected === 1) {
			this.setState({
				topText: "Selected " + selected + " tab",
				bottomText: "Press enter to switch to it",
				dirty: true
			});
		} else {
			this.setState({
				topText: "Selected " + selected + " tabs",
				bottomText: "Press enter to move them to a new window",
				dirty: true
			});
		}
	}
	drag(e : React.DragEvent<HTMLDivElement>, id : number) {
		if (!this.state.selection.has(id)) {
			this.state.selection.add(id);
			this.setState({
				lastSelect: id
			});
		}
	}
	async drop(id : number, before : boolean) {
		var tab : browser.Tabs.Tab = this.state.tabsbyid.get(id);
		if (!tab) return;
		var tabs = this.selectedTabs();
		var index = tab.index + (before ? 0 : 1);

		for (let i = 0; i < tabs.length; i++) {
			const t : browser.Tabs.Tab = tabs[i];
			await browser.tabs.move(t.id, { windowId: tab.windowId, index: index });
			await browser.tabs.update(t.id, { pinned: t.pinned });
		}
		this.state.selection.clear();
		this.update();
	}
	async dropWindow(windowId : number) {
		var tabs = this.selectedTabs();

		browser.runtime.sendMessage<ICommand>({command: S.move_tabs_to_window, window_id: windowId, tabs: tabs});

		this.state.selection.clear();
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
			"To see incognito tabs, enable incognito access in the extension settings",
			"You can drag and drop tabs to other windows",
			"You can type to search right away",
			"Search for either of two things: google OR yahoo",
			"Search titles only with t:news, urls only with u:github",
			"Exclude with a minus: reddit -u:old.reddit",
			"Put a phrase in quotes: \"pull request\"",
			"Search with a regular expression: /issue\\/\\d+/",
			"Hover the search box for the whole search syntax",
			"Highlight Duplicates selects the extra copies, Delete closes them all",
			"Search while duplicates are highlighted to narrow them down"
		];

		return "Tip: " + tips[Math.floor(Math.random() * tips.length)];
	}
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