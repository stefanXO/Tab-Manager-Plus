"use strict";

var browser = browser || chrome;

class TabManager extends React.Component {
	constructor(props) {
		super(props);
		//this.update();

		if (navigator.userAgent.search("Firefox") > -1) {
		} else {
			var check = browser.permissions.contains({ permissions: ["system.display"] });
			check.then(
				function(result) {
					if (result) {
						// The extension has the permissions.
					} else {
						localStorage["hideWindows"] = "0";
						this.state.hideWindows = false;
					}
				}.bind(this)
			);
		}

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

		if (this.localStorageAvailable()) {
			if (!localStorage["layout"]) localStorage["layout"] = "blocks";
			if (typeof localStorage["tabLimit"] === "undefined") localStorage["tabLimit"] = "0";
			if (typeof localStorage["openInOwnTab"] === "undefined") localStorage["openInOwnTab"] = "0";
			if (typeof localStorage["tabWidth"] === "undefined") localStorage["tabWidth"] = "800";
			if (typeof localStorage["tabHeight"] === "undefined") localStorage["tabHeight"] = "600";
			if (typeof localStorage["animations"] === "undefined") localStorage["animations"] = "1";
			if (typeof localStorage["windowTitles"] === "undefined") localStorage["windowTitles"] = "1";
			if (typeof localStorage["compact"] === "undefined") localStorage["compact"] = "0";
			if (typeof localStorage["dark"] === "undefined") localStorage["dark"] = "0";
			if (typeof localStorage["tabactions"] === "undefined") localStorage["tabactions"] = "1";
			if (typeof localStorage["badge"] === "undefined") localStorage["badge"] = "1";
			if (typeof localStorage["sessionsFeature"] === "undefined") localStorage["sessionsFeature"] = "0";
			if (typeof localStorage["hideWindows"] === "undefined") localStorage["hideWindows"] = "0";
			if (typeof localStorage["filter-tabs"] === "undefined") localStorage["filter-tabs"] = "0";
			if (typeof localStorage["version"] === "undefined") localStorage["version"] = __VERSION__;

			layout = localStorage["layout"];
			tabLimit = JSON.parse(localStorage["tabLimit"]);
			tabWidth = JSON.parse(localStorage["tabWidth"]);
			tabHeight = JSON.parse(localStorage["tabHeight"]);
			openInOwnTab = this.toBoolean(localStorage["openInOwnTab"]);
			animations = this.toBoolean(localStorage["animations"]);
			windowTitles = this.toBoolean(localStorage["windowTitles"]);
			compact = this.toBoolean(localStorage["compact"]);
			dark = this.toBoolean(localStorage["dark"]);
			tabactions = this.toBoolean(localStorage["tabactions"]);
			badge = this.toBoolean(localStorage["badge"]);
			sessionsFeature = this.toBoolean(localStorage["sessionsFeature"]);
			hideWindows = this.toBoolean(localStorage["hideWindows"]);
			filterTabs = this.toBoolean(localStorage["filter-tabs"]);
		}

		if (dark) {
			document.body.className = "dark";
		} else {
			document.body.className = "";
		}

		// var closeTimeout = setTimeout(function () {
		//  window.close();
		// }, 100000);
		var closeTimeout;
		var resetTimeout;

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
			selection: {},
			lastSelect: false,
			hiddenTabs: {},
			tabsbyid: {},
			windowsbyid: {},
			closeTimeout: closeTimeout,
			resetTimeout: resetTimeout,
			height: 600,
			hasScrollBar: false,
			focusUpdates: 0,
			topText: "",
			bottomText: "",
			lastDirection: false,
			optionsActive: !!this.props.optionsActive,
			filterTabs: filterTabs,
			dupTabs: false,
			colorsActive: false
		};

		this.addWindow = this.addWindow.bind(this);
		this.animationsText = this.animationsText.bind(this);
		this.badgeText = this.badgeText.bind(this);
		this.changelayout = this.changelayout.bind(this);
		this.changeTabHeight = this.changeTabHeight.bind(this);
		this.changeTabLimit = this.changeTabLimit.bind(this);
		this.changeTabWidth = this.changeTabWidth.bind(this);
		this.checkKey = this.checkKey.bind(this);
		this.clearSelection = this.clearSelection.bind(this);
		this.compactText = this.compactText.bind(this);
		this.darkText = this.darkText.bind(this);
		this.deleteTabs = this.deleteTabs.bind(this);
		this.discardTabs = this.discardTabs.bind(this);
		this.donate = this.donate.bind(this);
		this.exportSessions = this.exportSessions.bind(this);
		this.exportSessionsText = this.exportSessionsText.bind(this);
		this.getTip = this.getTip.bind(this);
		this.hideText = this.hideText.bind(this);
		this.highlightDuplicates = this.highlightDuplicates.bind(this);
		this.hoverIcon = this.hoverIcon.bind(this);
		this.importSessions = this.importSessions.bind(this);
		this.importSessionsText = this.importSessionsText.bind(this);
		this.openInOwnTabText = this.openInOwnTabText.bind(this);
		this.pinTabs = this.pinTabs.bind(this);
		this.rateExtension = this.rateExtension.bind(this);
		this.scrollTo = this.scrollTo.bind(this);
		this.search = this.search.bind(this);
		this.sessionsText = this.sessionsText.bind(this);
		this.sessionSync = this.sessionSync.bind(this);
		this.tabActionsText = this.tabActionsText.bind(this);
		this.tabHeightText = this.tabHeightText.bind(this);
		this.tabLimitText = this.tabLimitText.bind(this);
		this.tabWidthText = this.tabWidthText.bind(this);
		this.toggleAnimations = this.toggleAnimations.bind(this);
		this.toggleBadge = this.toggleBadge.bind(this);
		this.toggleCompact = this.toggleCompact.bind(this);
		this.toggleDark = this.toggleDark.bind(this);
		this.toggleFilterMismatchedTabs = this.toggleFilterMismatchedTabs.bind(this);
		this.toggleHide = this.toggleHide.bind(this);
		this.toggleOpenInOwnTab = this.toggleOpenInOwnTab.bind(this);
		this.toggleOptions = this.toggleOptions.bind(this);
		this.toggleSessions = this.toggleSessions.bind(this);
		this.toggleTabActions = this.toggleTabActions.bind(this);
		this.toggleWindowTitles = this.toggleWindowTitles.bind(this);
		this.update = this.update.bind(this);
		this.windowTitlesText = this.windowTitlesText.bind(this);

	}
	componentWillMount() {
		this.update();
	}
	hoverHandler(tab) {
		this.setState({ topText: tab.title });
		this.setState({ bottomText: tab.url });
		// clearTimeout(this.state.closeTimeout);
		// this.state.closeTimeout = setTimeout(function () {
		//  window.close();
		// }, 100000);
		clearTimeout(this.state.resetTimeout);
		this.state.resetTimeout = setTimeout(
			function() {
				this.setState({ topText: "", bottomText: "" });
				this.update();
			}.bind(this),
			15000
		);
		//this.update();
	}
	hoverIcon(e) {
		var text = "";
		if(e && e.target && e.target.title) {
			text = e.target.title;
		}
		var bottom = " ";
		if (text.indexOf("\n") > -1) {
			var a = text.split("\n");
			text = a[0];
			bottom = a[1];
		}
		this.setState({ topText: text });
		this.setState({ bottomText: bottom });
		//this.update();
		this.forceUpdate();
	}
	render() {
		var _this = this;

		var hiddenCount = this.state.hiddenCount || 0;
		var tabCount = this.state.tabCount || 0;

		var haveMin = false;
		var haveSess = false;

		for (var i = this.state.windows.length - 1; i >= 0; i--) {
			if (this.state.windows[i].state == "minimized") haveMin = true;
		}

		if (this.state.sessionsFeature) {
			if (this.state.sessions.length > 0) haveSess = true;
			// disable session window if we have filtering enabled
			// and filter active
			if (haveSess && this.state.filterTabs) {
				if (this.state.searchLen > 0 || Object.keys(this.state.hiddenTabs).length > 0) {
					haveSess = false;
				}
			}
		}

		return (
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
				ref="root"
				tabIndex={0}
			>
				<div className={"window-container " + this.state.layout + " " + (this.state.optionsActive ? "hidden" : "")} ref="windowcontainer" tabIndex={2}>
					{this.state.windows.map(function(window) {
						if (window.state == "minimized") return;
						if (!!this.state.colorsActive && this.state.colorsActive !== window.id) return;
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
								hoverHandler={_this.hoverHandler.bind(_this)}
								scrollTo={_this.scrollTo.bind(_this)}
								hoverIcon={_this.hoverIcon.bind(_this)}
								parentUpdate={_this.update.bind(_this)}
								toggleColors={_this.toggleColors.bind(_this)}
								tabMiddleClick={_this.deleteTab.bind(_this)}
								select={_this.select.bind(_this)}
								selectTo={_this.selectTo.bind(_this)}
								drag={_this.drag.bind(_this)}
								drop={_this.drop.bind(_this)}
								dropWindow={_this.dropWindow.bind(_this)}
								windowTitles={_this.state.windowTitles}
								lastOpenWindow={_this.state.lastOpenWindow}
								ref={"window" + window.id}
							/>
						);
					}.bind(this))}
					<div className={"hrCont " + (!haveMin ? "hidden" : "")}>
						<div className="hrDiv">
							<span className="hrSpan">Minimized windows</span>
						</div>
					</div>
					{this.state.windows.map(function(window) {
						if (window.state !== "minimized") return;
						if (!!this.state.colorsActive && this.state.colorsActive !== window.id) return;
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
								hoverHandler={_this.hoverHandler.bind(_this)}
								scrollTo={_this.scrollTo.bind(_this)}
								hoverIcon={_this.hoverIcon.bind(_this)}
								parentUpdate={_this.update.bind(_this)}
								toggleColors={_this.toggleColors.bind(_this)}
								tabMiddleClick={_this.deleteTab.bind(_this)}
								select={_this.select.bind(_this)}
								selectTo={_this.selectTo.bind(_this)}
								drag={_this.drag.bind(_this)}
								drop={_this.drop.bind(_this)}
								dropWindow={_this.dropWindow.bind(_this)}
								windowTitles={_this.state.windowTitles}
								lastOpenWindow={_this.state.lastOpenWindow}
								ref={"window" + window.id}
							/>
						);
					}.bind(this))}
					<div className={"hrCont " + (!haveSess ? "hidden" : "")}>
						<div className="hrDiv">
							<span className="hrSpan">Saved windows</span>
						</div>
					</div>
					{haveSess
						? this.state.sessions.map(function(window) {
								if (!!this.state.colorsActive && this.state.colorsActive !== window.id) return;
								return (
									<Session
										key={"session" + window.id}
										window={window}
										tabs={window.tabs}
										incognito={window.incognito}
										layout={_this.state.layout}
										selection={_this.state.selection}
										searchActive={_this.state.searchLen > 0}
										tabactions={_this.state.tabactions}
										hiddenTabs={_this.state.hiddenTabs}
										filterTabs={_this.state.filterTabs}
										hoverHandler={_this.hoverHandler.bind(_this)}
										scrollTo={_this.scrollTo.bind(_this)}
										hoverIcon={_this.hoverIcon.bind(_this)}
										parentUpdate={_this.update.bind(_this)}
										toggleColors={_this.toggleColors.bind(_this)}
										tabMiddleClick={_this.deleteTab.bind(_this)}
										select={_this.select.bind(_this)}
										windowTitles={_this.state.windowTitles}
										lastOpenWindow={_this.state.lastOpenWindow}
										ref={"session" + window.id}
									/>
								);
							}.bind(this))
						: false}
				</div>
				<div className={"options-container " + (this.state.optionsActive ? "" : "hidden")} ref="options-container">
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
						exportSessions={this.exportSessions}
						importSessions={this.importSessions}
						toggleOpenInOwnTab={this.toggleOpenInOwnTab}
						toggleBadge={this.toggleBadge}
						toggleHide={this.toggleHide}
						toggleSessions={this.toggleSessions}
						toggleAnimations={this.toggleAnimations}
						toggleWindowTitles={this.toggleWindowTitles}
						toggleCompact={this.toggleCompact}
						toggleDark={this.toggleDark}
						toggleTabActions={this.toggleTabActions}
						changeTabLimit={this.changeTabLimit}
						changeTabWidth={this.changeTabWidth}
						changeTabHeight={this.changeTabHeight}
						openInOwnTabText={this.openInOwnTabText}
						badgeText={this.badgeText}
						hideText={this.hideText}
						sessionsText={this.sessionsText}
						exportSessionsText={this.exportSessionsText}
						importSessionsText={this.importSessionsText}
						animationsText={this.animationsText}
						windowTitlesText={this.windowTitlesText}
						tabLimitText={this.tabLimitText}
						tabWidthText={this.tabWidthText}
						tabHeightText={this.tabHeightText}
						compactText={this.compactText}
						darkText={this.darkText}
						tabActionsText={this.tabActionsText}
						getTip={this.getTip}
					/>
				</div>
				<div className="window top" ref="tophover">
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
						ref="topbox"
						placeholder={maybePluralize(tabCount, 'tab') + " in " + this.state.windows.length + " windows"}
						value={this.state.topText}
					/>
					<input type="text" disabled={true} className="taburl" ref="topboxurl" placeholder={this.getTip()} value={this.state.bottomText} />
				</div>
				<div className={"window searchbox " + (this.state.optionsActive || !!this.state.colorsActive ? "hidden" : "")}>
					<table>
						<tbody>
							<tr>
								<td className="one">
									<input className="searchBoxInput" type="text" placeholder="Start typing to search tabs..." tabIndex="1" onChange={this.search} ref="searchbox" />
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
											Object.keys(this.state.selection).length > 0
												? "Close selected tabs\nWill close " + maybePluralize(Object.keys(this.state.selection).length, 'tab')
												: "Close current Tab"
										}
										onClick={this.deleteTabs}
										onMouseEnter={this.hoverIcon}
									/>
									<div
										className="icon windowaction discard"
										title={
											Object.keys(this.state.selection).length > 0
												? "Discard selected tabs\nWill discard " + maybePluralize(Object.keys(this.state.selection).length, 'tab') + " - freeing memory"
												: "Select tabs to discard them and free memory"
										}
										style={
											Object.keys(this.state.selection).length > 0
												? {}
												: { opacity: 0.25 }
										}
										onClick={this.discardTabs}
										onMouseEnter={this.hoverIcon}
									/>
									<div
										className="icon windowaction pin"
										title={
											Object.keys(this.state.selection).length > 0
												? "Pin selected tabs\nWill pin " + maybePluralize(Object.keys(this.state.selection).length, 'tab')
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
													maybePluralize((Object.keys(this.state.tabsbyid).length - Object.keys(this.state.selection).length), 'tab')
												: "")
										}
										onClick={this.toggleFilterMismatchedTabs}
										onMouseEnter={this.hoverIcon}
									/>
									<div
										className="icon windowaction new"
										title={
											Object.keys(this.state.selection).length > 0
												? "Move tabs to new window\nWill move " + maybePluralize(Object.keys(this.state.selection).length, 'selected tab') + " to it"
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
				</div>
				<div className="window placeholder" />
			</div>
		);
	}
	componentDidMount() {

		var runUpdate = debounce(this.update, 250);
		runUpdate = runUpdate.bind(this);

		browser.tabs.onCreated.addListener(runUpdate);
		browser.tabs.onUpdated.addListener(runUpdate);
		browser.tabs.onMoved.addListener(runUpdate);
		browser.tabs.onRemoved.addListener(runUpdate);
		browser.tabs.onReplaced.addListener(runUpdate);
		browser.tabs.onDetached.addListener(runUpdate);
		browser.tabs.onAttached.addListener(runUpdate);
		browser.tabs.onActivated.addListener(runUpdate);
		browser.windows.onFocusChanged.addListener(runUpdate);
		browser.windows.onCreated.addListener(runUpdate);
		browser.windows.onRemoved.addListener(runUpdate);

		browser.storage.onChanged.addListener(this.sessionSync);

		this.sessionSync();

		this.refs.root.focus();
		this.focusRoot();
		setTimeout(function() {
			var scrollArea = document.getElementsByClassName("window-container")[0];
			var activeWindow = document.getElementsByClassName("activeWindow");
			if (!!activeWindow && activeWindow.length > 0) {
				var activeTab = activeWindow[0].getElementsByClassName("highlighted");
				if (!!activeTab && activeTab.length > 0) {
					if (!!scrollArea && scrollArea.scrollTop > 0) {
					} else {
						activeTab[0].scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
					}
				}
			}
		}, 1000);

		// box.select();
		// box.focus();
	}
	async sessionSync() {
		var values = await browser.storage.local.get(null);
		// console.log(values);
		var sessions = [];
		for (var key in values) {
			var sess = values[key];
			if (sess.id && sess.tabs && sess.windowsInfo) {
				sessions.push(values[key]);
			}
		}
		this.state.sessions = sessions;
		this.update();
	}
	focusRoot() {
		this.state.focusUpdates++;
		setTimeout(
			function() {
				if (document.activeElement == document.body) {
					this.refs.root.focus();
					this.forceUpdate();
					if (this.state.focusUpdates < 5) this.focusRoot();
				}
			}.bind(this),
			500
		);
	}
	rateExtension() {
		if (navigator.userAgent.search("Firefox") > -1) {
			browser.tabs.create({ url: "https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/" });
		} else {
			browser.tabs.create({ url: "https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff" });
		}
		this.forceUpdate();
	}
	donate() {
		browser.tabs.create({ url: "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW" });
		this.forceUpdate();
	}
	toggleOptions() {
		this.state.optionsActive = !this.state.optionsActive;
		this.forceUpdate();
	}
	toggleColors(active, windowId) {
		if(!!active) {
			this.state.colorsActive = windowId;
		}else{
			this.state.colorsActive = false;
		}
		console.log("colorsActive", active, windowId, this.state.colorsActive);
		this.forceUpdate();
	}
	async update() {
		var windows = await browser.windows.getAll({ populate: true });
		windows.sort(function(a, b) {
			var windows = [];
			if (!!localStorage["windowAge"]) {
				windows = JSON.parse(localStorage["windowAge"]);
			}
			var aSort = windows.indexOf(a.id);
			var bSort = windows.indexOf(b.id);
			if (a.state == "minimized" && b.state != "minimized") return 1;
			if (b.state == "minimized" && a.state != "minimized") return -1;
			if (aSort < bSort) return -1;
			if (aSort > bSort) return 1;
			return 0;
		});

		this.state.lastOpenWindow = windows[0].id;
		this.state.windows = windows;
		this.state.windowsbyid = {};
		this.state.tabsbyid = {};
		var tabCount = 0;
		for (var i = 0; i < windows.length; i++) {
			var window = windows[i];
			this.state.windowsbyid[window.id] = window;
			for (var j = 0; j < window.tabs.length; j++) {
				var tab = window.tabs[j];
				this.state.tabsbyid[tab.id] = tab;
				tabCount++;
			}
		}
		for (var id in this.state.selection) {
			if (!this.state.tabsbyid[id]) {
				delete this.state.selection[id];
				this.state.lastSelect = id;
			}
		}
		this.state.tabCount = tabCount;
		this.setState({
			tabCount: tabCount
		});
		//this.state.searchLen = 0;
		// this.forceUpdate();
	}
	async deleteTabs() {
		var _this2 = this;
		var tabs = Object.keys(this.state.selection).map(function(id) {
			return _this2.state.tabsbyid[id];
		});
		if (tabs.length) {
			for (var i = 0; i < tabs.length; i++) {
				await browser.tabs.remove(tabs[i].id);
			}
		} else {
			var t = await browser.tabs.query({ currentWindow: true, active: true });
			if (t && t.length > 0) {
				await browser.tabs.remove(t[0].id);
			}
		}
		this.forceUpdate();
	}
	deleteTab(tabId) {
		browser.tabs.remove(tabId);
	}
	async discardTabs() {
		var tabs = Object.keys(this.state.selection).map(function(id) {
			return parseInt(id);
		});
		if (tabs.length) {
			for (var i = 0; i < tabs.length; i++) {
					if(!this.state.tabsbyid[tabs[i]].discarded) {
					browser.tabs.discard(tabs[i]).catch(function(e) {
						console.error(e);
						console.log(e.message);
					});
				}
			}
		}
		this.clearSelection();
	}
	discardTab(tabId) {
		browser.tabs.discard(tabId);
	}
	async addWindow() {
		var _this3 = this;
		var count = Object.keys(this.state.selection).length;
		var tabs = Object.keys(this.state.selection).map(function(id) {
			return _this3.state.tabsbyid[id];
		});

		if (count == 0) {
			await browser.windows.create({});
		} else if (count == 1) {
			var backgroundPage = await browser.runtime.getBackgroundPage();
			if (navigator.userAgent.search("Firefox") > -1) {
				backgroundPage.focusOnTabAndWindowDelayed(tabs[0]);
			}else{
				backgroundPage.focusOnTabAndWindow(tabs[0]);
			}
		} else {
			var backgroundPage = await browser.runtime.getBackgroundPage();
			backgroundPage.createWindowWithTabs(tabs);
		}
		if (!!window.inPopup) window.close();
	}
	async pinTabs() {
		var _this4 = this;
		var tabs = Object.keys(this.state.selection)
			.map(function(id) {
				return _this4.state.tabsbyid[id];
			})
			.sort(function(a, b) {
				return a.index - b.index;
			});
		if (tabs.length) {
			if (tabs[0].pinned) tabs.reverse();
			for (var i = 0; i < tabs.length; i++) {
				await browser.tabs.update(tabs[i].id, { pinned: !tabs[0].pinned });
			}
		} else {
			var t = await browser.tabs.query({ currentWindow: true, active: true });
			if (t && t.length > 0) {
				await browser.tabs.update(t[0].id, { pinned: !t[0].pinned });
			}
		}
	}
	highlightDuplicates(e) {
		this.state.selection = {};
		this.state.hiddenTabs = {};
		this.state.searchLen = 0;
		this.state.dupTabs = !this.state.dupTabs;
		this.refs.searchbox.value = "";
		if (!this.state.dupTabs) {
			this.state.hiddenCount = 0;
			this.forceUpdate();
			return;
		}
		var hiddenCount = this.state.hiddenCount || 0;
		var idList = this.state.tabsbyid;
		var dup = [];
		for (var id in idList) {
			var tab = this.state.tabsbyid[id];
			for (var id2 in idList) {
				if (id == id2) continue;
				var tab2 = this.state.tabsbyid[id2];
				if (tab.url == tab2.url) {
					dup.push(id);
					break;
				}
			}
		}
		for (var id in dup) {
			this.state.searchLen++;
			hiddenCount -= this.state.hiddenTabs[dup[id]] || 0;
			this.state.selection[dup[id]] = true;
			delete this.state.hiddenTabs[dup[id]];
			this.state.lastSelect = dup[id];
		}
		for (var id in idList) {
			var tab = this.state.tabsbyid[id];
			if (dup.indexOf(id) === -1) {
				hiddenCount += 1 - (this.state.hiddenTabs[id] || 0);
				this.state.hiddenTabs[id] = true;
				delete this.state.selection[id];
				this.state.lastSelect = id;
			}
		}
		if (dup.length == 0) {
			this.setState({
				topText: "No duplicates found",
				bottomText: " "
			});
		} else {
			this.setState({
				topText: "Highlighted " + dup.length + " duplicate tabs",
				bottomText: "Press enter to move them to a new window"
			});
		}
		this.state.hiddenCount = hiddenCount;
		this.forceUpdate();
	}
	search(e) {
		var hiddenCount = this.state.hiddenCount || 0;
		var searchQuery = e.target.value || "";
		var searchLen = searchQuery.length;

		var searchType = "normal";
		var searchTerms = [];
		if(searchQuery.indexOf(" ") === -1) {
			searchType = "normal";
		}else if(searchQuery.indexOf(" OR ") > -1) {
			searchTerms = searchQuery.split(" OR ");
			searchType = "OR";
		}else if(searchQuery.indexOf(" ") > -1) {
			searchTerms = searchQuery.split(" ");
			searchType = "AND";
		}
		if(searchType != "normal") {
			searchTerms = searchTerms.filter(function(entry) { return entry.trim() != ''; });
		}

		if (!searchLen) {
			this.state.selection = {};
			this.state.hiddenTabs = {};
			hiddenCount = 0;
		} else {
			var idList;
			var lastSearchLen = this.state.searchLen;
			idList = this.state.tabsbyid;
			if(searchType == "normal") {
				if (!lastSearchLen) {
					idList = this.state.tabsbyid;
				} else if (lastSearchLen > searchLen) {
					idList = this.state.hiddenTabs;
				} else if (lastSearchLen < searchLen) {
					idList = this.state.selection;
				}
			}
			for (var id in idList) {
				var tab = this.state.tabsbyid[id];
				var tabSearchTerm = (tab.title + tab.url).toLowerCase();
				var match = false;
				if(searchType == "normal") {
					match = (tabSearchTerm.indexOf(e.target.value.toLowerCase()) >= 0);
				}else if(searchType == "OR") {
					for (var searchOR of searchTerms) {
						searchOR = searchOR.trim().toLowerCase();
						if(tabSearchTerm.indexOf(searchOR) >= 0) {
							match = true;
							break;
						}
					}
				}else if(searchType == "AND") {
					var andMatch = true;
					for (var searchAND of searchTerms) {
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
					hiddenCount -= this.state.hiddenTabs[id] || 0;
					this.state.selection[id] = true;
					delete this.state.hiddenTabs[id];
					this.state.lastSelect = id;
				} else {
					hiddenCount += 1 - (this.state.hiddenTabs[id] || 0);
					this.state.hiddenTabs[id] = true;
					delete this.state.selection[id];
					this.state.lastSelect = id;
				}
			}
		}
		this.state.hiddenCount = hiddenCount;
		this.state.searchLen = searchLen;
		var matches = Object.keys(this.state.selection).length;
		var matchtext = "";
		if (matches == 0 && searchLen > 0) {
			this.setState({
				topText: "No matches for '" + e.target.value + "'",
				bottomText: ""
			});
		} else if (matches == 0) {
			this.setState({
				topText: "",
				bottomText: ""
			});
		} else if (matches > 1) {
			this.setState({
				topText: Object.keys(this.state.selection).length + " matches for '" + e.target.value + "'",
				bottomText: "Press enter to move them to a new window"
			});
		} else if (matches == 1) {
			this.setState({
				topText: Object.keys(this.state.selection).length + " match for '" + e.target.value + "'",
				bottomText: "Press enter to switch to the tab"
			});
		}
		this.forceUpdate();
	}
	clearSelection() {
		this.state.selection = {};
		this.setState({
			lastSelect: false
		});
	}
	checkKey(e) {
		// enter
		if (e.keyCode == 13) this.addWindow();
		// escape key
		if (e.keyCode == 27) {
			if(this.state.searchLen > 0 || Object.keys(this.state.selection).length > 0) {
				// stop popup from closing if we have search text or selection active
				e.nativeEvent.preventDefault();
				e.nativeEvent.stopPropagation();
			}
			this.state.hiddenTabs = {};
			this.state.searchLen = 0;
			this.refs.searchbox.value = "";
			this.clearSelection();
		}
		// any typed keys
		if (
			(e.keyCode >= 48 && e.keyCode <= 57) ||
			(e.keyCode >= 65 && e.keyCode <= 90) ||
			(e.keyCode >= 186 && e.keyCode <= 192) ||
			(e.keyCode >= 219 && e.keyCode <= 22) ||
			e.keyCode == 8 ||
			e.keyCode == 46 ||
			e.keyCode == 32
		) {
			if (document.activeElement != this.refs.searchbox) {
				if (document.activeElement.type != "text" && document.activeElement.type != "input") {
					this.refs.searchbox.focus();
				}
			}
		}
		// arrow keys
		/*
			left arrow  37
			up arrow  38
			right arrow 39
			down arrow  40
		*/
		if (e.keyCode >= 37 && e.keyCode <= 40) {
			if (document.activeElement != this.refs.windowcontainer && document.activeElement != this.refs.searchbox) {
				this.refs.windowcontainer.focus();
			}

			if (document.activeElement != this.refs.searchbox || !this.refs.searchbox.value) {
				var goLeft = e.keyCode == 37;
				var goRight = e.keyCode == 39;
				var goUp = e.keyCode == 38;
				var goDown = e.keyCode == 40;
				if (this.state.layout == "vertical") {
					goLeft = e.keyCode == 38;
					goRight = e.keyCode == 40;
					goUp = e.keyCode == 37;
					goDown = e.keyCode == 39;
				}
				if (goLeft || goRight || goUp || goDown) {
					e.nativeEvent.preventDefault();
					e.nativeEvent.stopPropagation();
				}
				var altKey = e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey;
				if (goLeft || goRight) {
					var selectedTabs = Object.keys(this.state.selection);
					if (!altKey && selectedTabs.length > 1) {
					} else {
						var found = false;
						var selectedNext = false;
						var selectedTab = false;
						var first = false;
						var prev = false;
						var last = false;
						if (selectedTabs.length == 1) {
							selectedTab = selectedTabs[0];
							// console.log("one tab", selectedTab);
						} else if (selectedTabs.length > 1) {
							if (this.state.lastSelect) {
								selectedTab = this.state.lastSelect;
								// console.log("more tabs, last", selectedTab);
							} else {
								selectedTab = selectedTabs[0];
								// console.log("more tabs, first", selectedTab);
							}
						} else if (selectedTabs.length == 0 && this.state.lastSelect) {
							selectedTab = this.state.lastSelect;
							// console.log("no tabs, last", selectedTab);
						}
						if (this.state.lastDirection) {
							if (goRight && this.state.lastDirection == "goRight") {
							} else if (goLeft && this.state.lastDirection == "goLeft") {
							} else if (selectedTabs.length > 1) {
								// console.log("turned back, last", this.state.lastSelect, selectedTab);
								this.select(this.state.lastSelect);
								this.state.lastDirection = false;
								found = true;
							} else {
								this.state.lastDirection = false;
							}
						}
						if (!this.state.lastDirection) {
							if (goRight) this.state.lastDirection = "goRight";
							if (goLeft) this.state.lastDirection = "goLeft";
						}
						for (var _w of this.state.windows) {
							if (found) break;
							if (_w.state != "minimized") {
								for (var _t of _w.tabs) {
									last = _t.id;
									if (!first) first = _t.id;
									if (!selectedTab) {
										if (!altKey) this.state.selection = {};
										this.select(_t.id);
										found = true;
										break;
									} else if (selectedTab == _t.id) {
										// console.log("select next one", selectedNext);
										if (goRight) {
											selectedNext = true;
										} else if (prev) {
											if (!altKey) this.state.selection = {};
											this.select(prev);
											found = true;
											break;
										}
									} else if (selectedNext) {
										if (!altKey) this.state.selection = {};
										this.select(_t.id);
										found = true;
										break;
									}
									prev = _t.id;
									// console.log(_t, _t.id == selectedTab);
								}
							}
						}
						for (var _w of this.state.windows) {
							if (found) break;
							if (_w.state == "minimized") {
								for (var _t of _w.tabs) {
									last = _t.id;
									if (!first) first = _t.id;
									if (!selectedTab) {
										if (!altKey) this.state.selection = {};
										this.select(_t.id);
										found = true;
										break;
									} else if (selectedTab == _t.id) {
										if (goRight) {
											selectedNext = true;
										} else if (prev) {
											if (!altKey) this.state.selection = {};
											this.select(prev);
											found = true;
											break;
										}
									} else if (selectedNext) {
										if (!altKey) this.state.selection = {};
										this.select(_t.id);
										found = true;
										break;
									}
									prev = _t.id;
									// console.log(_t, _t.id == selectedTab);
								}
							}
						}
						if (!found && goRight && first) {
							if (!altKey) this.state.selection = {};
							this.select(first);
							found = true;
						}
						if (!found && goLeft && last) {
							if (!altKey) this.state.selection = {};
							this.select(last);
							found = true;
						}
					}
				}
				if (goUp || goDown) {
					var selectedTabs = Object.keys(this.state.selection);
					if (selectedTabs.length > 1) {
					} else {
						var found = false;
						var selectedNext = false;
						var selectedTab = -1;
						var first = false;
						var prev = false;
						var last = false;
						var tabPosition = -1;
						var i = -1;
						if (selectedTabs.length == 1) {
							selectedTab = selectedTabs[0];
							// console.log(selectedTab);
						}
						for (var _w of this.state.windows) {
							i = 0;
							if (found) break;
							if (_w.state != "minimized") {
								if (!first) first = _w.id;
								for (var _t of _w.tabs) {
									i++;
									last = _w.id;
									if (!selectedTab) {
										this.selectWindowTab(_w.id, tabPosition);
										found = true;
										break;
									} else if (selectedTab == _t.id) {
										tabPosition = i;
										// console.log("found tab", _w.id, _t.id, selectedTab, i);
										if (goDown) {
											// console.log("select next window ", selectedNext, tabPosition);
											selectedNext = true;
											break;
										} else if (prev) {
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

									// console.log(_t, _t.id == selectedTab);
								}
								prev = _w.id;
							}
						}
						for (var _w of this.state.windows) {
							i = 0;
							if (found) break;
							if (_w.state == "minimized") {
								if (!first) first = _w.id;
								for (var _t of _w.tabs) {
									i++;
									last = _w.id;
									if (!selectedTab) {
										this.selectWindowTab(_w.id, tabPosition);
										found = true;
										break;
									} else if (selectedTab == _t.id) {
										tabPosition = i;
										// console.log("found tab", _w.id, _t.id, selectedTab, i);
										if (goDown) {
											// console.log("select next window ", selectedNext, tabPosition);
											selectedNext = true;
											break;
										} else if (prev) {
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
									// console.log(_t, _t.id == selectedTab);
								}
								prev = _w.id;
							}
						}
						// console.log(found, goDown, first);
						if (!found && goDown && first) {
							// console.log("go first", first);
							this.state.selection = {};
							this.selectWindowTab(first, tabPosition);
							found = true;
						}
						// console.log(found, goUp, last);
						if (!found && goUp && last) {
							// console.log("go last", last);
							this.state.selection = {};
							this.selectWindowTab(last, tabPosition);
							found = true;
						}
					}
				}
			}
		}
		// page up / page down
		if (e.keyCode == 33 || e.keyCode == 34) {
			if (document.activeElement != this.refs.windowcontainer) {
				this.refs.windowcontainer.focus();
			}
		}
	}
	selectWindowTab(windowId, tabPosition) {
		if (!tabPosition || tabPosition < 1) tabPosition = 1;
		for (var _w of this.state.windows) {
			if (_w.id != windowId) continue;
			var i = 0;
			for (var _t of _w.tabs) {
				i++;
				if ((_w.tabs.length >= tabPosition && tabPosition == i) || (_w.tabs.length < tabPosition && _w.tabs.length == i)) {
					this.state.selection = {};
					this.select(_t.id);
				}
			}
		}
	}
	scrollTo(what, id) {
		var els = document.getElementById(what + "-" + id);
		if (!!els) {
			if (!this.elVisible(els)) {
				els.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
			}
		}
	}
	changelayout() {
		if (this.state.layout == "blocks") {
			localStorage["layout"] = this.state.layout = "blocks-big";
		} else if (this.state.layout == "blocks-big") {
			localStorage["layout"] = this.state.layout = "horizontal";
		} else if (this.state.layout == "horizontal") {
			localStorage["layout"] = this.state.layout = "vertical";
		} else {
			localStorage["layout"] = this.state.layout = "blocks";
		}
		this.setState({ topText: "Switched to " + this.readablelayout(this.state.layout) + " view" });
		this.setState({ bottomText: " " });
		this.forceUpdate();
	}
	nextlayout() {
		if (this.state.layout == "blocks") {
			return "blocks-big";
		} else if (this.state.layout == "blocks-big") {
			return "horizontal";
		} else if (this.state.layout == "horizontal") {
			return "vertical";
		} else {
			return "blocks";
		}
	}
	readablelayout(layout) {
		if (layout == "blocks") {
			return "Block";
		} else if (layout == "blocks-big") {
			return "Big Block";
		} else if (layout == "horizontal") {
			return "Horizontal";
		} else {
			return "Vertical";
		}
	}
	select(id) {
		if (this.state.selection[id]) {
			delete this.state.selection[id];
			this.setState({
				lastSelect: id
			});
		} else {
			this.state.selection[id] = true;
			this.setState({
				lastSelect: id
			});
		}
		this.scrollTo('tab', id);
		var tab = this.state.tabsbyid[id];
		if(this.refs['window' + tab.windowId] && this.refs['window' + tab.windowId].refs['tab' + id]) {
			this.refs['window' + tab.windowId].refs['tab' + id].resolveFavIconUrl();
		}

		var selected = Object.keys(this.state.selection).length;
		if (selected == 0) {
			this.setState({
				topText: "No tabs selected",
				bottomText: " "
			});
		} else if (selected == 1) {
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
	selectTo(id, tabs) {
		var activate = false;
		var lastSelect = this.state.lastSelect;
		if (id == lastSelect) {
			this.select(id);
			return;
		}
		if (!!lastSelect) {
			if (this.state.selection[lastSelect]) {
				activate = true;
			}
		} else {
			if (this.state.selection[id]) {
				activate = false;
			} else {
				activate = true;
			}
		}

		var rangeIndex1;
		var rangeIndex2;
		var selectedTabs = [];
		for (var i = 0; i < tabs.length; i++) {
			if (tabs[i].id == id) {
				rangeIndex1 = i;
			}
			if (!!lastSelect && tabs[i].id == lastSelect) {
				rangeIndex2 = i;
			}
		}
		if (!!lastSelect && !rangeIndex2) {
			this.select(id);
			return;
		}
		if (!rangeIndex2) {
			var neighbours = [];
			for (var i = 0; i < tabs.length; i++) {
				var tabId = tabs[i].id;
				if (tabId != id) {
					if (this.state.selection[tabId]) {
						neighbours.push(tabId);
					}
				}
			}

			if (activate) {
				// find closest selected item that's not connected
				var leftSibling = 0;
				var rightSibling = tabs.length - 1;
				for (var i = 0; i < rangeIndex1; i++) {
					if (neighbours.indexOf(i) > -1) {
						leftSibling = i;
					}
				}
				for (var i = tabs.length - 1; i > rangeIndex1; i--) {
					if (neighbours.indexOf(i) > -1) {
						rightSibling = i;
					}
				}
				var diff1 = rangeIndex1 - leftSibling;
				var diff2 = rightSibling - rangeIndex1;
				if (diff1 > diff2) {
					rangeIndex2 = rightSibling;
				} else {
					rangeIndex2 = leftSibling;
				}
			} else {
				// find furthest selected item that's connected
				var leftSibling = rangeIndex1;
				var rightSibling = rangeIndex1;
				for (var i = rangeIndex1; i > 0; i--) {
					if (neighbours.indexOf(i) > -1) {
						leftSibling = i;
					}
				}
				for (var i = rangeIndex1; i < tabs.length; i++) {
					if (neighbours.indexOf(i) > -1) {
						rightSibling = i;
					}
				}
				var diff1 = rangeIndex1 - leftSibling;
				var diff2 = rightSibling - rangeIndex1;
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
			var r1 = rangeIndex2;
			var r2 = rangeIndex1;
			rangeIndex1 = r1;
			rangeIndex2 = r2;
		}

		for (var i = 0; i < tabs.length; i++) {
			if (i >= rangeIndex1 && i <= rangeIndex2) {
				var tabId = tabs[i].id;
				if (activate) {
					this.state.selection[tabId] = true;
				} else {
					delete this.state.selection[tabId];
				}
			}
		}

		this.scrollTo('tab', this.state.lastSelect);

		var selected = Object.keys(this.state.selection).length;
		if (selected == 0) {
			this.setState({
				topText: "No tabs selected",
				bottomText: " "
			});
		} else if (selected == 1) {
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
		this.forceUpdate();
	}
	drag(e, id) {
		if (!this.state.selection[id]) {
			this.state.selection = {};
			this.state.selection[id] = true;
			this.state.lastSelect = id;
		}
		this.forceUpdate();
	}
	async drop(id, before) {
		var _this5 = this;
		var tab = this.state.tabsbyid[id];
		var tabs = Object.keys(this.state.selection).map(function(id) {
			return _this5.state.tabsbyid[id];
		});
		var index = tab.index + (before ? 0 : 1);

		for (var i = 0; i < tabs.length; i++) {
			var t = tabs[i];
			await browser.tabs.move(t.id, { windowId: tab.windowId, index: index });
			await browser.tabs.update(t.id, { pinned: t.pinned });
		}
		this.setState({
			selection: {}
		});
		this.update();
	}
	async dropWindow(windowId) {
		var _this6 = this;
		var tabs = Object.keys(this.state.selection).map(function(id) {
			return _this6.state.tabsbyid[id];
		});
		for (var i = 0; i < tabs.length; i++) {
			var t = tabs[i];
			await browser.tabs.move(t.id, { windowId: windowId, index: -1 });
			await browser.tabs.update(t.id, { pinned: t.pinned });
		}
		this.setState({
			selection: {}
		});
	}
	changeTabLimit(e) {
		this.state.tabLimit = e.target.value;
		localStorage["tabLimit"] = JSON.stringify(this.state.tabLimit);
		this.tabLimitText();
		this.forceUpdate();
	}
	tabLimitText() {
		this.setState({
			bottomText: "Limit the number of tabs per window. Will move new tabs into a new window instead. 0 to turn off"
		});
	}
	changeTabWidth(e) {
		this.state.tabWidth = e.target.value;
		localStorage["tabWidth"] = JSON.stringify(this.state.tabWidth);
		document.body.style.width = this.state.tabWidth + "px";
		this.tabWidthText();
		this.forceUpdate();
	}
	tabWidthText() {
		this.setState({
			bottomText: "Change the width of this window. 800 by default."
		});
	}
	changeTabHeight(e) {
		this.state.tabHeight = e.target.value;
		localStorage["tabHeight"] = JSON.stringify(this.state.tabHeight);
		document.body.style.height = this.state.tabHeight + "px";
		this.tabHeightText();
		this.forceUpdate();
	}
	tabHeightText() {
		this.setState({
			bottomText: "Change the height of this window. 600 by default."
		});
	}
	toggleAnimations() {
		this.state.animations = !this.state.animations;
		localStorage["animations"] = this.state.animations ? "1" : "0";
		this.animationsText();
		this.forceUpdate();
	}
	animationsText() {
		this.setState({
			bottomText: "Enables/disables animations. Default : on"
		});
	}
	toggleWindowTitles() {
		this.state.windowTitles = !this.state.windowTitles;
		localStorage["windowTitles"] = this.state.windowTitles ? "1" : "0";
		this.windowTitlesText();
		this.forceUpdate();
	}
	windowTitlesText() {
		this.setState({
			bottomText: "Enables/disables window titles. Default : on"
		});
	}
	toggleCompact() {
		this.state.compact = !this.state.compact;
		localStorage["compact"] = this.state.compact ? "1" : "0";
		this.compactText();
		this.forceUpdate();
	}
	compactText() {
		this.setState({
			bottomText: "Compact mode is a more compressed layout. Default : off"
		});
	}
	toggleDark() {
		this.state.dark = !this.state.dark;
		localStorage["dark"] = this.state.dark ? "1" : "0";
		this.darkText();
		if (this.state.dark) {
			document.body.className = "dark";
		} else {
			document.body.className = "";
		}
		this.forceUpdate();
	}
	darkText() {
		this.setState({
			bottomText: "Dark mode inverts the layout - better on the eyes. Default : off"
		});
	}
	toggleTabActions() {
		this.state.tabactions = !this.state.tabactions;
		localStorage["tabactions"] = this.state.tabactions ? "1" : "0";
		this.tabActionsText();
		this.forceUpdate();
	}
	tabActionsText() {
		this.setState({
			bottomText: "Adds 'Open a new tab' and 'Close this window' option to each window. Default : on"
		});
	}
	async toggleBadge() {
		this.state.badge = !this.state.badge;
		localStorage["badge"] = this.state.badge ? "1" : "0";
		this.badgeText();
		var backgroundPage = await browser.runtime.getBackgroundPage();
		backgroundPage.updateTabCount();
		this.forceUpdate();
	}
	badgeText() {
		this.setState({
			bottomText: "Shows the number of open tabs on the Tab Manager icon. Default : on"
		});
	}
	toggleOpenInOwnTab() {
		this.state.openInOwnTab = !this.state.openInOwnTab;
		localStorage["openInOwnTab"] = this.state.openInOwnTab ? "1" : "0";
		this.openInOwnTabText();
		browser.runtime.sendMessage({ command: "reload_popup_controls" });
		this.forceUpdate();
	}
	openInOwnTabText() {
		this.setState({
			bottomText: "Open the Tab Manager by default in own tab, or as a popup?"
		});
	}
	toggleSessions() {
		this.state.sessionsFeature = !this.state.sessionsFeature;
		localStorage["sessionsFeature"] = this.state.sessionsFeature ? "1" : "0";
		this.sessionsText();
		this.forceUpdate();
	}
	sessionsText() {
		this.setState({
			bottomText: "Allows you to save/restore windows into sessions. ( Tab History will be lost ) Default : off"
		});
	}
	exportSessions() {
		if (this.state.sessions.length == 0) {
			window.alert("You have currently no windows saved for later. There is nothing to export.");
			return;
		}
		var exportName = "tab-manager-plus-backup";
		var today = new Date();
		var y = today.getFullYear();
		// JavaScript months are 0-based.
		var m = ("0" + (today.getMonth() + 1)).slice(-2);
		var d = ("0" + today.getDate()).slice(-2);
		var h = ("0" + today.getHours()).slice(-2);
		var mi = ("0" + today.getMinutes()).slice(-2);
		var s = ("0" + today.getSeconds()).slice(-2);
		exportName += "-" + y + m + d + "-" + h + mi + "-" + s;
		var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state.sessions, null, 2));
		var downloadAnchorNode = document.createElement("a");
		downloadAnchorNode.setAttribute("href", dataStr);
		downloadAnchorNode.setAttribute("download", exportName + ".json");
		document.body.appendChild(downloadAnchorNode); // required for firefox
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
		this.exportSessionsText();
		this.forceUpdate();
	}
	exportSessionsText() {
		this.setState({
			bottomText: "Allows you to export your saved windows to an external backup"
		});
	}
	importSessions(evt) {
		if (navigator.userAgent.search("Firefox") > -1) {
			if(window.inPopup) {
				window.alert("Due to a Firefox bug session import does not work in the popup. Please use the options screen or open Tab Manager Plus in its' own tab");
				return;
			}
		}
		try {
			let inputField = evt.target; // #session_import
			let files = evt.target.files;
			if (!files.length) {
				alert("No file selected!");
				this.setState({ bottomText: "Error: Could not read the backup file!" });
				return;
			}
			let file = files[0];
			let reader = new FileReader();
			const self = this;
			reader.onload = async event => {
				//console.log('FILE CONTENT', event.target.result);
				var backupFile;
				try {
					backupFile = JSON.parse(event.target.result);
				} catch (err) {
					console.error(err);
					window.alert(err);
					this.setState({ bottomText: "Error: Could not read the backup file!" });
				}
				if (!!backupFile && backupFile.length > 0) {
					var success = backupFile.length;
					for (var i = 0; i < backupFile.length; i++) {
						var newSession = backupFile[i];
						if (newSession.windowsInfo && newSession.tabs && newSession.id) {
							var obj = {};
							obj[newSession.id] = newSession;
							//this.state.sessions.push(obj);
							var value = await browser.storage.local.set(obj).catch(function(err) {
								console.log(err);
								console.error(err.message);
								success--;
							});
							//console.log(value);
						}
					}
					this.setState({ bottomText: success + " windows successfully restored!" });
				} else {
					this.setState({ bottomText: "Error: Could not restore any windows from the backup file!" });
				}
				inputField.value = "";
				this.sessionSync();
			};
			reader.readAsText(file);
		} catch (err) {
			console.error(err);
			window.alert(err);
		}
		this.importSessionsText();
		this.forceUpdate();
	}
	importSessionsText() {
		this.setState({
			bottomText: "Allows you to restore your saved windows from an external backup"
		});
	}
	async toggleHide() {
		var granted = await browser.permissions.request({ permissions: ["system.display"] });
		if (granted) {
			this.state.hideWindows = !this.state.hideWindows;
		} else {
			this.state.hideWindows = false;
		}
		localStorage["hideWindows"] = this.state.hideWindows ? "1" : "0";
		this.hideText();
		this.forceUpdate();
	}
	hideText() {
		this.setState({
			bottomText: "Automatically minimizes inactive chrome windows. Default : off"
		});
	}
	toggleFilterMismatchedTabs() {
		this.state.filterTabs = !this.state.filterTabs;
		localStorage["filter-tabs"] = this.state.filterTabs ? "1" : "0";
		this.forceUpdate();
	}
	getTip() {
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
	toBoolean(str) {
		if (typeof str === "undefined" || str === null) {
			return false;
		} else if (typeof str === "string") {
			switch (str.toLowerCase()) {
				case "false":
				case "no":
				case "0":
				case "":
					return false;
				default:
					return true;
			}
		} else if (typeof str === "number") {
			return str !== 0;
		} else {
			return true;
		}
	}
	localStorageAvailable() {
		var test = "test";
		try {
			localStorage.setItem(test, test);
			localStorage.removeItem(test);
			return true;
		} catch (e) {
			return false;
		}
	}
	isInViewport(element, ofElement) {
		var rect = element.getBoundingClientRect();
		return rect.top >= 0 && rect.left >= 0 && rect.bottom <= ofElement.height && rect.right <= ofElement.width;
	}
	elVisible(elem) {
		if (!(elem instanceof Element)) throw Error("DomUtil: elem is not an element.");
		var style = getComputedStyle(elem);
		if (style.display === "none") return false;
		if (style.visibility !== "visible") return false;
		if (style.opacity < 0.1) return false;
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
		var pointContainer = document.elementFromPoint(elemCenter.x, elemCenter.y);
		do {
			if (pointContainer === elem) return true;
		} while ((pointContainer = pointContainer.parentNode));
		return false;
	}
}

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this,
			args = arguments;
		var later = function later() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

const maybePluralize = (count, noun, suffix = 's') =>
  `${count} ${noun}${count !== 1 ? suffix : ''}`;