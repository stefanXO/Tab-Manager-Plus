import {getLocalStorage, setLocalStorage} from "@helpers/storage";
import {debounce, maybePluralize} from "@helpers/utils";
import {Window, Session, TabOptions, Tab, WindowOptions} from "@views";
import * as React from "react";
import * as S from "@strings";
import * as browser from 'webextension-polyfill';
import {ICommand, ITabManager, ITabManagerState, ISavedSession} from "@types";
import {ManagerContext, ITabManagerActions, ISettings} from "../context";

export class TabManager extends React.Component<ITabManager, ITabManagerState> {

    private readonly rootRef: React.RefObject<HTMLDivElement>;
	private readonly windowContainerRef: React.RefObject<HTMLDivElement>;
	private readonly searchBoxRef: React.RefObject<HTMLInputElement>;
	private readonly topHoverRef: React.RefObject<HTMLDivElement>;
	private readonly topBoxRef: React.RefObject<HTMLInputElement>;
	private readonly topBoxUrlRef: React.RefObject<HTMLInputElement>;
	private readonly actions: ITabManagerActions;

	constructor(props : ITabManager) {
		super(props);

		let layout = "blocks";
		let animations = true;
		let windowTitles = true;
		let compact = false;
		let dark = false;
		let tabactions = true;
		let badge = true;
		let sessionsFeature = false;
		let hideWindows = false;
		let filterTabs = false;
		let tabLimit = 0;
		let openInOwnTab = false;
		let tabWidth = 800;
		let tabHeight = 600;

		let resetTimeout = -1;
		// var closeTimeout;

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
			hoverIcon: (e) => this.hoverIcon(e),
			hoverHandler: (tab) => this.hoverHandler(tab),
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

	async UNSAFE_componentWillMount() {
		await this.update();
	}

	async componentDidUpdate(prevProps, prevState) {
		if (this.state.dirty) {
			await this.update();
			this.setState({dirty: false});
		}
	}

	async loadStorage() {
		var layout = "blocks";
		var animations = true;
		var windowTitles = true;
		var compact = false;
		var dark = false;
		var tabactions = true;
		var badge = true;
		var sessionsFeature = false;
		var hideWindows = false;
		var filterTabs = false;
		var tabLimit = 0;
		var openInOwnTab = false;
		var tabWidth = 800;
		var tabHeight = 600;

		var storage = await browser.storage.local.get(null);

		if (!storage["layout"]) storage["layout"] = layout;
		if (typeof storage["tabLimit"] === "undefined") storage["tabLimit"] = tabLimit;
		if (typeof storage["tabWidth"] === "undefined") storage["tabWidth"] = tabWidth;
		if (typeof storage["tabHeight"] === "undefined") storage["tabHeight"] = tabHeight;

		if (typeof storage["animations"] === "undefined") storage["animations"] = animations;
		if (typeof storage["windowTitles"] === "undefined") storage["windowTitles"] = windowTitles;
		if (typeof storage["tabactions"] === "undefined") storage["tabactions"] = tabactions;
		if (typeof storage["badge"] === "undefined") storage["badge"] = badge;

		if (typeof storage["openInOwnTab"] === "undefined") storage["openInOwnTab"] = openInOwnTab;
		if (typeof storage["compact"] === "undefined") storage["compact"] = compact;
		if (typeof storage["dark"] === "undefined") storage["dark"] = dark;
		if (typeof storage["sessionsFeature"] === "undefined") storage["sessionsFeature"] = sessionsFeature;
		if (typeof storage["hideWindows"] === "undefined") storage["hideWindows"] = hideWindows;
		if (typeof storage["filter-tabs"] === "undefined") storage["filter-tabs"] = filterTabs;

		storage["version"] = window.extensionVersion;

		await browser.storage.local.set(storage);

		layout = storage["layout"] as string;
		tabLimit = storage["tabLimit"] as number;
		tabWidth = storage["tabWidth"] as number;
		tabHeight = storage["tabHeight"] as number;
		openInOwnTab = storage["openInOwnTab"] as boolean;
		animations = storage["animations"] as boolean;
		windowTitles = storage["windowTitles"] as boolean;
		compact = storage["compact"] as boolean;
		dark = storage["dark"] as boolean;
		tabactions = storage["tabactions"] as boolean;
		badge = storage["badge"] as boolean;
		sessionsFeature = storage["sessionsFeature"] as boolean;
		hideWindows = storage["hideWindows"] as boolean;
		filterTabs = storage["filter-tabs"] as boolean;

		if (dark) {
			document.body.className = "dark";
		} else {
			document.body.className = "";
		}

		this.setState({
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
			filterTabs: filterTabs
		});
	}

	setSetting<K extends keyof ISettings>(key : K, value : ISettings[K]) {
		this.setState({ [key]: value } as Pick<ITabManagerState, K>);
	}
	hoverHandler(tab : browser.Tabs.Tab) {
		this.setState({ topText: tab.title || "" });
		this.setState({ bottomText: tab.url || tab.pendingUrl || "" });
		// clearTimeout(this.state.closeTimeout);
		// this.state.closeTimeout = setTimeout(function () {
		//  window.close();
		// }, 100000);
		var _reset_timeout = this.state.resetTimeout;
		clearTimeout(_reset_timeout);
		_reset_timeout = setTimeout(() => {
			this.setState({ topText: "", bottomText: "" });
			this.update();
		}, 15000);
		this.setState({resetTimeout: _reset_timeout});
		//this.update();
	}
	hoverIcon = (e : React.MouseEvent<HTMLDivElement> | string) => {
		var text = "";
		if (typeof (e) === "string") {
			text = e;
		} else {
			if (e && e.nativeEvent) {
				e.nativeEvent.preventDefault();
				e.nativeEvent.stopPropagation();
			}

			if (e && e.target && !!(e.target as HTMLDivElement).title) {
				text = (e.target as HTMLDivElement).title;
			}
		}

		var bottom = " ";
		if (text.indexOf("\n") > -1) {
			var a = text.split("\n");
			text = a[0];
			bottom = a[1];
		}
		this.setState({
			topText: text,
			bottomText: bottom,
			dirty: true
		 });
	}
	render() {
		let _this = this;

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
				tabIndex={0}
				ref={this.rootRef}
			>
				{!!this.state.colorsActive && <WindowOptions
					windowId={this.state.colorsActive}
					layout={this.state.layout}
					autoName={this.state.colorsAutoName}
				/>}
				{!this.state.optionsActive && !this.state.colorsActive && <div className={"window-container " + this.state.layout} ref={this.windowContainerRef} tabIndex={2}>
					{this.state.windows.map((window : browser.Windows.Window) => {
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
								layout={_this.state.layout}
								selection={_this.state.selection}
								searchActive={_this.state.searchLen > 0}
								sessionsFeature={_this.state.sessionsFeature}
								tabactions={_this.state.tabactions}
								hiddenTabs={_this.state.hiddenTabs}
								filterTabs={_this.state.filterTabs}
								draggable={true}
								windowTitles={_this.state.windowTitles}
								lastOpenWindow={_this.state.lastOpenWindow}
								ref={windowRef}
							/>
						);
					})}
					<div className={"hrCont " + (!haveMin ? "hidden" : "")}>
						<div className="hrDiv">
							<span className="hrSpan">Minimized windows</span>
						</div>
					</div>
					{this.state.windows.map((window : browser.Windows.Window) => {
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
								layout={_this.state.layout}
								selection={_this.state.selection}
								searchActive={_this.state.searchLen > 0}
								sessionsFeature={_this.state.sessionsFeature}
								tabactions={_this.state.tabactions}
								hiddenTabs={_this.state.hiddenTabs}
								filterTabs={_this.state.filterTabs}
								draggable={true}
								windowTitles={_this.state.windowTitles}
								lastOpenWindow={_this.state.lastOpenWindow}
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
										layout={_this.state.layout}
										selection={_this.state.selection}
										searchActive={_this.state.searchLen > 0}
										tabactions={_this.state.tabactions}
										hiddenTabs={_this.state.hiddenTabs}
										filterTabs={_this.state.filterTabs}
										windowTitles={_this.state.windowTitles}
										lastOpenWindow={_this.state.lastOpenWindow}
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
					<div className="icon windowaction donate" title="Donate a Coffee" onClick={this.donate} onMouseEnter={this.hoverIcon} />
					<div
						className="icon windowaction rate"
						title="Rate Tab Manager Plus"
						onClick={this.rateExtension}
						onMouseEnter={this.hoverIcon}
					/>
					<div className="icon windowaction options" title="Options" onClick={this.toggleOptions} onMouseEnter={this.hoverIcon} />
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
									<input className="searchBoxInput" type="text" placeholder="Start typing to search tabs..." tabIndex={1} onChange={this.search} ref={this.searchBoxRef} />
								</td>
								<td className="two">
									<div
										className={"icon windowaction " + this.state.layout + "-view"}
										title={"Change to " + this.readablelayout(this.nextlayout()) + " View"}
										onClick={this.changelayout}
										onMouseEnter={this.hoverIcon}
									/>
									<div
										className="icon windowaction trash"
										title={
											this.state.selection.size > 0
												? "Close selected tabs\nWill close " + maybePluralize(this.state.selection.size, 'tab')
												: "Close current Tab"
										}
										onClick={this.deleteTabs}
										onMouseEnter={this.hoverIcon}
									/>
									<div
										className="icon windowaction discard"
										title={
											this.state.selection.size > 0
												? "Discard selected tabs\nWill discard " + maybePluralize(this.state.selection.size, 'tab') + " - freeing memory"
												: "Select tabs to discard them and free memory"
										}
										style={
											this.state.selection.size > 0
												? {}
												: { opacity: 0.25 }
										}
										onClick={this.discardTabs}
										onMouseEnter={this.hoverIcon}
									/>
									<div
										className="icon windowaction pin"
										title={
											this.state.selection.size > 0
												? "Pin selected tabs\nWill pin " + maybePluralize(this.state.selection.size, 'tab')
												: "Pin current Tab"
										}
										onClick={this.pinTabs}
										onMouseEnter={this.hoverIcon}
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
										onMouseEnter={this.hoverIcon}
									/>
									<div
										className="icon windowaction new"
										title={
											this.state.selection.size > 0
												? "Move tabs to new window\nWill move " + maybePluralize(this.state.selection.size, 'selected tab') + " to it"
												: "Open new empty window"
										}
										onClick={this.addWindow}
										onMouseEnter={this.hoverIcon}
									/>
									<div
										className={"icon windowaction duplicates" + (this.state.dupTabs ? " enabled" : "")}
										title="Highlight Duplicates"
										onClick={this.highlightDuplicates}
										onMouseEnter={this.hoverIcon}
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
		await this.loadStorage();

		if (navigator.userAgent.search("Firefox") > -1) {
		} else {
			let result = await browser.permissions.contains({permissions: ["system.display"]});
			if (!result) {
				setLocalStorage("hideWindows", false);
				this.setState({
					hideWindows: false
				});
			}
		}

		let _this = this;

		var runUpdate = () => {
			_this.setState({ dirty: true });
		}

		var runSlowUpdate = debounce(() => {
			_this.setState({dirty: true});
		}, 250);

		browser.tabs.onCreated.addListener(runUpdate);
		browser.tabs.onUpdated.addListener(runSlowUpdate);
		browser.tabs.onMoved.addListener(runSlowUpdate);
		browser.tabs.onRemoved.addListener(runUpdate);
		browser.tabs.onReplaced.addListener(runSlowUpdate);
		browser.tabs.onDetached.addListener(runUpdate);
		browser.tabs.onAttached.addListener(runUpdate);
		browser.tabs.onActivated.addListener(runSlowUpdate);

		browser.windows.onFocusChanged.addListener(runUpdate);
		browser.windows.onCreated.addListener(runUpdate);
		browser.windows.onRemoved.addListener(runUpdate);

		browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
			const request = message as ICommand;

			console.log(request.command);
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
			// undefined = "not answering this message"; true or a promise would claim the response channel
			return undefined;
		});


		browser.storage.onChanged.addListener(this.sessionSync);

		await this.sessionSync();

		this.rootRef.current?.focus();
		this.focusRoot();

		setTimeout(async function() {
			var scrollArea = document.getElementsByClassName("window-container")[0];
			var activeWindow = document.getElementsByClassName("activeWindow");
			if (!!activeWindow && activeWindow.length > 0) {
				var activeTab = activeWindow[0].getElementsByClassName("highlighted");
				if (!!activeTab && activeTab.length > 0) {
					if (!!scrollArea && scrollArea.scrollTop > 0) {
					} else {
						var animations = await getLocalStorage("animations", false);
						activeTab[0].scrollIntoView({ behavior: animations ? "smooth" : "instant", block: "center", inline: "nearest" });
					}
				}
			}
		}, 250);

		// box.select();
		// box.focus();
	}
	sessionSync = async () => {
		let values = await getLocalStorage('sessions', {});
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
		if (navigator.userAgent.search("Firefox") > -1) {
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
		const windows : browser.Windows.Window[] = await browser.windows.getAll({ populate: true });
		const sort_windows = await getLocalStorage("windowAge", []);

		windows.sort(function(a, b) {
			var aSort = sort_windows.indexOf(a.id);
			var bSort = sort_windows.indexOf(b.id);
			if (a.state === "minimized" && b.state !== "minimized") return 1;
			if (b.state === "minimized" && a.state !== "minimized") return -1;
			if (aSort < bSort) return -1;
			if (aSort > bSort) return 1;
			return 0;
		});

		this.state.windowsbyid.clear();
		this.state.tabsbyid.clear();

		this.setState({
			lastOpenWindow: windows[0].id,
			windows: windows
		});

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
		for (let id of this.state.selection.keys()) {
			if (!this.state.tabsbyid.has(id)) {
				this.state.selection.delete(id);
				this.setState({lastSelect: id});
			}
		}
		this.setState({
			tabCount: tabCount
		});
		//this.state.searchLen = 0;
		// this.forceUpdate();
	}
	deleteTabs = async () => {
		const _this = this;
		const tabs: browser.Tabs.Tab[] = [...this.state.selection.keys()].map(function(id) {
			return _this.state.tabsbyid.get(id);
		});
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
		const _this = this;
		const tabs : browser.Tabs.Tab[] = [...this.state.selection.keys()].map(function(id) {
			return _this.state.tabsbyid.get(id);
		});
		if (tabs.length) {
			browser.runtime.sendMessage<ICommand>({command: S.discard_tabs, tabs: tabs});
		}
		this.clearSelection();
	}
	discardTab(tabId) {
		browser.tabs.discard(tabId);
	}
	addWindow = async () => {
		const _this = this;
		const count = this.state.selection.size;
		const tabs : browser.Tabs.Tab[] = [...this.state.selection.keys()].map(function(id) {
			return _this.state.tabsbyid.get(id);
		});

		const incognito_tabs = tabs.filter(function(tab) {
			return tab.incognito;
		});

		const normal_tabs = tabs.filter(function(tab) {
			return !tab.incognito;
		});

		if (count === 0) {
			await browser.windows.create({});
		} else if (count === 1) {
			if (navigator.userAgent.search("Firefox") > -1) {
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
		const _this = this;
		const tabs : browser.Tabs.Tab[] = [...this.state.selection.keys()]
			.map(function(id) {
				return _this.state.tabsbyid.get(id);
			})
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
		const idList : number[] = [...this.state.tabsbyid.keys()];
		const orig : Set<number> = new Set();
		const dup : Set<number> = new Set();
		for (const id of idList) {
			if (dup.has(id)) continue;
			var tab = this.state.tabsbyid.get(id);
			for (const id2 of idList) {
				if (id === id2) continue;
				if (orig.has(id2)) continue;
				var tab2 = this.state.tabsbyid.get(id2);
				if (tab.url === tab2.url) {
					dup.add(id2);
					orig.add(id);
				}
			}
		}
		// return both original and duplicate tabs
		return {
			originals: orig,
			duplicates: dup
		};
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
				topText: "Highlighted " + dup.size + " duplicate tabs",
				bottomText: "Press enter to move them to a new window"
			});
		}
		this.setState({
			hiddenCount: hiddenCount,
			searchLen: searchLen,
			dupTabs: dupTabs,
			dirty: true
		});
	}
	search = (e) => {
		let hiddenCount = this.state.hiddenCount || 0;
		const searchQuery = e.target.value || "";
		const searchLen = searchQuery.length;

		let searchType = "normal";
		let searchTerms = [];
		if(searchQuery.indexOf(" ") === -1) {
			searchType = "normal";
		}else if(searchQuery.indexOf(" OR ") > -1) {
			searchTerms = searchQuery.split(" OR ");
			searchType = "OR";
		}else if(searchQuery.indexOf(" ") > -1) {
			searchTerms = searchQuery.split(" ");
			searchType = "AND";
		}
		if(searchType !== "normal") {
			searchTerms = searchTerms.filter(function(entry) { return entry.trim() !== ''; });
		}

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
			let idList : number[];
			const lastSearchLen = this.state.searchLen;
			idList = [ ...this.state.tabsbyid.keys() ];
			// if(searchType === "normal") {
			// 	if (!lastSearchLen) {
			// 		idList = [ ...this.state.tabsbyid.keys() ];
			// 	} else if (lastSearchLen > searchLen) {
			// 		idList = [ ...this.state.hiddenTabs.keys() ];
			// 	} else if (lastSearchLen < searchLen) {
			// 		idList = [ ...this.state.selection.keys() ];
			// 	}
			// }
			if(this.state.dupTabs) {
				const duplicates = this.getDuplicates();
				const dup = duplicates.duplicates;
				const orig = duplicates.originals;
				idList = [...dup, ...orig];
			}
			for (const id of idList) {
				const tab = this.state.tabsbyid.get(id);
				let tabSearchTerm;
				if (!!tab.title) tabSearchTerm = tab.title;
				if (!!tab.url) tabSearchTerm += " " + tab.url;
				tabSearchTerm = tabSearchTerm.toLowerCase();
				let match = false;
				if(searchType === "normal") {
					match = (tabSearchTerm.indexOf(e.target.value.toLowerCase()) >= 0);
				}else if(searchType === "OR") {
					for (let searchOR of searchTerms) {
						searchOR = searchOR.trim().toLowerCase();
						if(tabSearchTerm.indexOf(searchOR) >= 0) {
							match = true;
							break;
						}
					}
				}else if(searchType === "AND") {
					let andMatch = true;
					for (let searchAND of searchTerms) {
						searchAND = searchAND.trim().toLowerCase();
						if(tabSearchTerm.indexOf(searchAND) >= 0) {

						}else{
							andMatch = false;
							break;
						}
					}
					match = andMatch;
				}
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
		// var matchtext = "";
		if (matches === 0 && searchLen > 0) {
			this.setState({
				topText: "No matches for '" + searchQuery + "'",
				bottomText: ""
			});
		} else if (matches === 0) {
			this.setState({
				topText: "",
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
			(e.keyCode >= 48 && e.keyCode <= 57) ||
			(e.keyCode >= 65 && e.keyCode <= 90) ||
			(e.keyCode >= 186 && e.keyCode <= 192) ||
			(e.keyCode >= 219 && e.keyCode <= 22) ||
			e.keyCode === 8 ||
			e.keyCode === 46 ||
			e.keyCode === 32
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
				if (this.state.layout === "vertical") {
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
	changelayout = async (layout) => {
		var newLayout;
		if (layout && typeof (layout) === "string") {
			newLayout = layout;
		} else {
			newLayout = this.nextlayout();
		}
		await setLocalStorage("layout", newLayout);

		this.setState({
			layout: newLayout,
			topText: "Switched to " + this.readablelayout(newLayout) + " view",
			bottomText: " ",
			dirty: true
		});
	}
	nextlayout() {
		switch (this.state.layout) {
			case "blocks":
				return "blocks-big";
			case "blocks-big":
				return "horizontal";
			case "horizontal":
				return "vertical";
			default:
				return "blocks";
		}
	}
	readablelayout(layout) {
		switch (layout) {
			case "blocks":
				return "Block";
			case "blocks-big":
				return "Big Block";
			case "horizontal":
				return "Horizontal";
			default:
				return "Vertical";
		}
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
		var _this = this;
		var tab : browser.Tabs.Tab = this.state.tabsbyid.get(id);
		var tabs : browser.Tabs.Tab[] = [...this.state.selection.keys()].map(function(id) {
			return _this.state.tabsbyid.get(id);
		});
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
		var _this = this;
		var tabs : browser.Tabs.Tab[] = [...this.state.selection.keys()].map(function(id) {
			return _this.state.tabsbyid.get(id);
		});

		browser.runtime.sendMessage<ICommand>({command: S.move_tabs_to_window, window_id: windowId, tabs: tabs});

		this.state.selection.clear();
	}
	toggleFilterMismatchedTabs = async () => {
		var _filter_tabs = !this.state.filterTabs;
		this.setState({
			filterTabs: _filter_tabs,
			dirty: true
		});
		await setLocalStorage("filter-tabs", _filter_tabs);
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
			"You can search for different tabs : google OR yahoo"
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