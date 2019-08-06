"use strict";var TabManager = React.createFactory(React.createClass({
	getInitialState: function getInitialState() {
		this.update();

		if (navigator.userAgent.search("Firefox") > -1) {

		} else {
			browser.permissions.contains({
				permissions: ['system.display'] },
			function (result) {
				if (result) {
					// The extension has the permissions.
				} else {
					localStorage["hideWindows"] = "0";
					this.state.hideWindows = false;
				}
			}.bind(this));
		}

		var layout = "horizontal";
		var animations = true;
		var windowTitles = true;
		var compact = false;
		var tabactions = true;
		var badge = true;
		var hideWindows = false;
		var filterTabs = false;
		var tabLimit = 0;
		var tabWidth = 530;
		var tabHeight = 450;

		if (this.localStorageAvailable()) {
			if (!localStorage["layout"]) localStorage["layout"] = "horizontal";
			if (typeof localStorage["tabLimit"] === "undefined") localStorage["tabLimit"] = "0";
			if (typeof localStorage["tabWidth"] === "undefined") localStorage["tabWidth"] = "530";
			if (typeof localStorage["tabHeight"] === "undefined") localStorage["tabHeight"] = "450";
			if (typeof localStorage["animations"] === "undefined") localStorage["animations"] = "1";
			if (typeof localStorage["windowTitles"] === "undefined") localStorage["windowTitles"] = "1";
			if (typeof localStorage["compact"] === "undefined") localStorage["compact"] = "0";
			if (typeof localStorage["tabactions"] === "undefined") localStorage["tabactions"] = "1";
			if (typeof localStorage["badge"] === "undefined") localStorage["badge"] = "1";
			if (typeof localStorage["hideWindows"] === "undefined") localStorage["hideWindows"] = "0";
			if (typeof localStorage["filter-tabs"] === "undefined") localStorage["filter-tabs"] = "0";
			if (typeof localStorage["version"] === "undefined") localStorage["version"] = "5.0.1";

			layout = localStorage["layout"];
			tabLimit = JSON.parse(localStorage["tabLimit"]);
			tabWidth = JSON.parse(localStorage["tabWidth"]);
			tabHeight = JSON.parse(localStorage["tabHeight"]);
			animations = this.toBoolean(localStorage["animations"]);
			windowTitles = this.toBoolean(localStorage["windowTitles"]);
			compact = this.toBoolean(localStorage["compact"]);
			tabactions = this.toBoolean(localStorage["tabactions"]);
			badge = this.toBoolean(localStorage["badge"]);
			hideWindows = this.toBoolean(localStorage["hideWindows"]);
			filterTabs = this.toBoolean(localStorage["filter-tabs"]);
		}

		var closeTimeout = setTimeout(function () {
			window.close();
		}, 100000);

		return {
			layout: layout,
			animations: animations,
			windowTitles: windowTitles,
			tabLimit: tabLimit,
			tabWidth: tabWidth,
			tabHeight: tabHeight,
			compact: compact,
			tabactions: tabactions,
			transitionRunning: false,
			badge: badge,
			hideWindows: hideWindows,
			lastOpenWindow: -1,
			windows: [],
			selection: {},
			hiddenTabs: {},
			tabsbyid: {},
			windowsbyid: {},
			closeTimeout: closeTimeout,
			height: 400,
			hasScrollBar: false,
			focusUpdates: 0,
			topText: "",
			bottomText: "",
			optionsActive: !!this.props.optionsActive,
			filterTabs: filterTabs,
			dupTabs: false };

	},
	shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
		//console.log("should update?", nextProps, nextState);
		return true;
	},
	hoverHandler: function hoverHandler(tab) {
		this.setState({ topText: tab.title });
		this.setState({ bottomText: tab.url });
		clearTimeout(this.state.closeTimeout);
		this.state.closeTimeout = setTimeout(function () {
			window.close();
		}, 100000);
	},
	hoverIcon: function hoverIcon(e) {
		var text = e.target.title || " ";
		var bottom = " ";
		if (text.indexOf("\n") > -1) {
			var a = text.split("\n");
			text = a[0];
			bottom = a[1];
		}
		this.setState({ topText: text });
		this.setState({ bottomText: bottom });
	},
	render: function render() {var _this = this;
		var hiddenCount = this.state.hiddenCount || 0;
		var tabCount = this.state.tabCount || 0;

		var haveMin = false;

		for (var i = this.state.windows.length - 1; i >= 0; i--) {
			if (this.state.windows[i].state == "minimized") haveMin = true;
		};

		return React.DOM.div({ id: "root", className: (this.state.compact ? "compact" : "") + " " + (this.state.animations ? "animations" : "no-animations") + " " + (this.state.windowTitles ? "windowTitles" : "no-windowTitles"), onKeyDown: this.checkKey, ref: "root", tabIndex: 0 },
		React.DOM.div({ className: "window-container " + this.state.layout + " " + (this.state.optionsActive ? "hidden" : ""), ref: "windowcontainer", tabIndex: 2 },
		this.state.windows.map(function (window) {
			if (window.state == "minimized") return;
			return Window({
				window: window,
				tabs: window.tabs,
				incognito: window.incognito,
				layout: _this.state.layout,
				selection: _this.state.selection,
				searchActive: _this.state.searchLen > 0,
				tabactions: _this.state.tabactions,
				hiddenTabs: _this.state.hiddenTabs,
				filterTabs: _this.state.filterTabs,
				hoverHandler: _this.hoverHandler,
				hoverIcon: _this.hoverIcon,
				parentUpdate: _this.update.bind(_this),
				tabMiddleClick: _this.deleteTab.bind(_this),
				parentScrollUpdate: _this.scrollUpdate.bind(_this),
				select: _this.select.bind(_this),
				drag: _this.drag.bind(_this),
				drop: _this.drop.bind(_this),
				dropWindow: _this.dropWindow.bind(_this),
				windowTitles: _this.state.windowTitles,
				lastOpenWindow: _this.state.lastOpenWindow,
				ref: "window" + window.id });

		}),
		React.DOM.div({ className: "hrCont " + (!haveMin ? "hidden" : "") },
		React.DOM.div({ className: "hrDiv" },
		React.DOM.span({ className: "hrSpan" },
		"Minimized windows"))),



		this.state.windows.map(function (window) {
			if (window.state !== "minimized") return;
			return Window({
				window: window,
				tabs: window.tabs,
				incognito: window.incognito,
				layout: _this.state.layout,
				selection: _this.state.selection,
				searchActive: _this.state.searchLen > 0,
				tabactions: _this.state.tabactions,
				hiddenTabs: _this.state.hiddenTabs,
				filterTabs: _this.state.filterTabs,
				hoverHandler: _this.hoverHandler,
				hoverIcon: _this.hoverIcon,
				parentUpdate: _this.update.bind(_this),
				tabMiddleClick: _this.deleteTab.bind(_this),
				parentScrollUpdate: _this.scrollUpdate.bind(_this),
				select: _this.select.bind(_this),
				drag: _this.drag.bind(_this),
				drop: _this.drop.bind(_this),
				dropWindow: _this.dropWindow.bind(_this),
				windowTitles: _this.state.windowTitles,
				lastOpenWindow: _this.state.lastOpenWindow,
				ref: "window" + window.id });

		})),

		React.DOM.div({ className: "options-container " + (this.state.optionsActive ? "" : "hidden"), ref: "options-container" },
		TabOptions({
			compact: this.state.compact,
			animations: this.state.animations,
			windowTitles: this.state.windowTitles,
			tabLimit: this.state.tabLimit,
			tabWidth: this.state.tabWidth,
			tabHeight: this.state.tabHeight,
			tabactions: this.state.tabactions,
			badge: this.state.badge,
			hideWindows: this.state.hideWindows,
			toggleBadge: this.toggleBadge,
			toggleHide: this.toggleHide,
			toggleAnimations: this.toggleAnimations,
			toggleWindowTitles: this.toggleWindowTitles,
			toggleCompact: this.toggleCompact,
			toggleTabActions: this.toggleTabActions,
			changeTabLimit: this.changeTabLimit,
			changeTabWidth: this.changeTabWidth,
			changeTabHeight: this.changeTabHeight,
			badgeText: this.badgeText,
			hideText: this.hideText,
			animationsText: this.animationsText,
			windowTitlesText: this.windowTitlesText,
			tabLimitText: this.tabLimitText,
			tabWidthText: this.tabWidthText,
			tabHeightText: this.tabHeightText,
			compactText: this.compactText,
			tabActionsText: this.tabActionsText,
			getTip: this.getTip })),


		React.DOM.div({ className: "window top", ref: "tophover" },
		React.DOM.div({ className: "icon windowaction donate", title: "Donate a Coffee", onClick: this.donate, onMouseEnter: this.hoverIcon }),
		React.DOM.div({ className: "icon windowaction rate", title: "Rate Tab Manager Plus", onClick: this.rateExtension, onMouseEnter: this.hoverIcon }),
		React.DOM.div({ className: "icon windowaction options", title: "Options", onClick: this.toggleOptions, onMouseEnter: this.hoverIcon }),
		React.DOM.input({ type: "text", disabled: true, className: "tabtitle", ref: "topbox", placeholder: tabCount + " tabs in " + this.state.windows.length + " windows", value: this.state.topText }),
		React.DOM.input({ type: "text", disabled: true, className: "taburl", ref: "topboxurl", placeholder: this.getTip(), value: this.state.bottomText })),

		React.DOM.div({ className: "window searchbox " + (this.state.optionsActive ? "hidden" : "") },
		React.DOM.input({ type: "text", placeholder: "Search tabs...", tabIndex: "1", onChange: this.search, ref: "searchbox" }),
		React.DOM.div({ className: "icon windowaction " + this.state.layout + "-view", title: "Change to " + this.readablelayout(this.nextlayout()) + " View", onClick: this.changelayout, onMouseEnter: this.hoverIcon }),
		React.DOM.div({ className: "icon windowaction trash",
			title: Object.keys(this.state.selection).length > 0 ? "Close selected tabs\nWill close " + Object.keys(this.state.selection).length + " tabs" : "Close current Tab", onClick: this.deleteTabs, onMouseEnter: this.hoverIcon }),
		React.DOM.div({ className: "icon windowaction pin",
			title: Object.keys(this.state.selection).length > 0 ? "Pin selected tabs\nWill pin " + Object.keys(this.state.selection).length + " tabs" : "Pin current Tab", onClick: this.pinTabs, onMouseEnter: this.hoverIcon }),
		React.DOM.div({ className: "icon windowaction filter" + (this.state.filterTabs ? " enabled" : ""),
			title: (this.state.filterTabs ? "Do not hide" : "Hide") + " tabs that do not match search" + (this.state.searchLen > 0 ? "\n" + (this.state.filterTabs ? "Will reveal " : "Will hide ") + (Object.keys(this.state.tabsbyid).length - Object.keys(this.state.selection).length) + " tabs" : ""),
			onClick: this.toggleFilterMismatchedTabs, onMouseEnter: this.hoverIcon }),
		React.DOM.div({ className: "icon windowaction new",
			title: Object.keys(this.state.selection).length > 0 ? "Move tabs to new window\nWill move " + Object.keys(this.state.selection).length + " selected tabs to it" : "Open new empty window", onClick: this.addWindow, onMouseEnter: this.hoverIcon }),
		React.DOM.div({ className: "icon windowaction duplicates" + (this.state.dupTabs ? " enabled" : ""), title: "Highlight Duplicates", onClick: this.highlightDuplicates, onMouseEnter: this.hoverIcon })),

		React.DOM.div({ className: "window placeholder" }));

	},
	componentDidMount: function componentDidMount() {
		browser.windows.onCreated.addListener(this.update.bind(this));
		browser.windows.onRemoved.addListener(this.update.bind(this));
		browser.tabs.onCreated.addListener(this.update.bind(this));
		browser.tabs.onUpdated.addListener(this.update.bind(this));
		browser.tabs.onMoved.addListener(this.update.bind(this));
		browser.tabs.onDetached.addListener(this.update.bind(this));
		browser.tabs.onRemoved.addListener(this.update.bind(this));
		browser.tabs.onReplaced.addListener(this.update.bind(this));
		this.refs.root.focus();
		this.focusRoot();
		setTimeout(function () {
			var activeWindow = document.getElementsByClassName('activeWindow');
			if (!!activeWindow && activeWindow.length > 0) {
				var activeTab = activeWindow[0].getElementsByClassName('highlighted');
				if (!!activeTab && activeTab.length > 0) {
					activeTab[0].scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
				}
			}
		}, 1000);

		// box.select();
		// box.focus();
	},
	focusRoot: function focusRoot() {
		this.state.focusUpdates++;
		setTimeout(function () {
			if (document.activeElement == document.body) {
				this.refs.root.focus();
				this.forceUpdate();
				if (this.state.focusUpdates < 5) this.focusRoot();
			}
		}.bind(this), 500);
	},
	componentWillUpdate: function componentWillUpdate() {
		this.scrollUpdate();
	},
	scrollUpdate: function scrollUpdate() {

		return;


		if (!!this.state) {
			if (!!this.state.transitionRunning) return;
			this.state.hasScrollBar = this.refs.windowcontainer.scrollHeight > this.refs.windowcontainer.offsetHeight || this.refs.windowcontainer.scrollHeight > this.refs.windowcontainer.clientHeight;
			if (this.state.hasScrollBar) {
				//console.log("has scrollbar");
				var oldHeight = this.state.height;
				if (this.state.height < 600) {
					this.state.height += 50;
					if (this.state.height > 600) this.state.height = 600;
					if (this.state.height == oldHeight) return;
					this.state.transitionRunning = true;
					document.body.addEventListener("transitionend", this.transitionEnd);
					document.body.className = "c" + this.state.height;
					document.documentElement.className = "c" + this.state.height;
					//this.forceUpdate();
				}
			} else {

				if (!this.refs.windowcontainer.lastChild) return;
				//console.log("has no scrollbar");
				document.getElementsByClassName('window-container');
				var parentRect = this.refs.windowcontainer.getBoundingClientRect();
				var parentRectBot = parentRect.y + parentRect.height;
				var lastRect = this.refs.windowcontainer.lastChild.getBoundingClientRect();
				var lastRectBot = lastRect.y + lastRect.height;

				if (lastRectBot > parentRectBot) {
					//console.log("scroll present", lastRectBot, parentRectBot);
				} else {
					//console.log("no scroll present", lastRectBot, parentRectBot);
					//console.log("space...", parentRectBot-lastRectBot);
					var diff = parentRectBot - lastRectBot;
					//console.log("diff", diff);
					diff = Math.ceil(diff / 50) * 50 - 50;
					//console.log("diff", diff);
					if (diff > 0) {
						var oldHeight = this.state.height;
						if (this.state.height > 400) {
							this.state.height -= diff;
							if (this.state.height < 400) this.state.height = 400;
							if (this.state.height == oldHeight) return;
							this.state.transitionRunning = true;
							document.body.addEventListener("transitionend", this.transitionEnd);
							document.body.className = "c" + this.state.height;
							document.documentElement.className = "c" + this.state.height;
							//this.forceUpdate();
						}
					}
				}
				return;


			}
			//console.log(this.state.hasScrollBar);
		}
	},
	transitionEnd: function transitionEnd() {
		//console.log("transition ended");
		document.body.removeEventListener("transitionend", this.transitionEnd);
		this.state.transitionRunning = false;
		this.forceUpdate();
	},
	rateExtension: function rateExtension() {
		if (navigator.userAgent.search("Firefox") > -1) {
			browser.tabs.create({ url: 'https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/' });
		}else{
			browser.tabs.create({ url: 'https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff' });
		}
		this.forceUpdate();
	},
	donate: function donate() {
		browser.tabs.create({ url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW' });
		this.forceUpdate();
	},
	toggleOptions: function toggleOptions() {
		this.state.optionsActive = !this.state.optionsActive;
		this.forceUpdate();
	},
	update: function update() {
		browser.windows.getAll({ populate: true }, function (windows) {
			windows.sort(function (a, b) {
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
				if (!this.state.tabsbyid[id]) delete this.state.selection[id];
			}
			this.state.tabCount = tabCount;
			//this.state.searchLen = 0;
			this.forceUpdate();
		}.bind(this));
	},
	deleteTabs: function deleteTabs() {var _this2 = this;
		var tabs = Object.keys(this.state.selection).map(function (id) {return _this2.state.tabsbyid[id];});
		if (tabs.length) {
			for (var i = 0; i < tabs.length; i++) {
				browser.tabs.remove(tabs[i].id);
			}
		} else {
			browser.tabs.query({ currentWindow: true, active: true }, function (t) {
				if (t && t.length > 0) {
					browser.tabs.remove(t[0].id);
				}
			});
		}
		this.forceUpdate();
	},
	deleteTab: function deleteTab(tabId) {
		browser.tabs.remove(tabId);
	},
	addWindow: function addWindow() {var _this3 = this;
		var count = Object.keys(this.state.selection).length;
		var tabs = Object.keys(this.state.selection).map(function (id) {return _this3.state.tabsbyid[id];});

		if (count == 0) {
			browser.windows.create({});
		} else if (count == 1) {
			browser.runtime.getBackgroundPage(function callback(tabs, backgroundPage) {
				backgroundPage.focusOnTabAndWindow(tabs[0]);
			}.bind(null, tabs));
		} else {
			browser.runtime.getBackgroundPage(function callback(tabs, backgroundPage) {
				backgroundPage.createWindowWithTabs(tabs);
			}.bind(null, tabs));
		}
	},
	pinTabs: function pinTabs() {var _this4 = this;
		var tabs = Object.keys(this.state.selection).map(function (id) {return _this4.state.tabsbyid[id];}).sort(function (a, b) {return a.index - b.index;});
		if (tabs.length) {
			if (tabs[0].pinned) tabs.reverse();
			for (var i = 0; i < tabs.length; i++) {
				browser.tabs.update(tabs[i].id, { pinned: !tabs[0].pinned });
			}

		} else {
			browser.tabs.query({ currentWindow: true, active: true }, function (t) {
				if (t && t.length > 0) {
					browser.tabs.update(t[0].id, { pinned: !t[0].pinned });
				}
			});
		}
	},
	highlightDuplicates: function highlightDuplicates(e) {
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
		}
		for (var id in idList) {
			var tab = this.state.tabsbyid[id];
			if (dup.indexOf(id) === -1) {
				hiddenCount += 1 - (this.state.hiddenTabs[id] || 0);
				this.state.hiddenTabs[id] = true;
				delete this.state.selection[id];
			}
		}
		if (dup.length == 0) {
			this.setState({
				topText: "No duplicates found",
				bottomText: " " });

		} else {
			this.setState({
				topText: "Highlighted " + dup.length + " duplicate tabs",
				bottomText: "Press enter to move them to a new window" });

		}
		this.state.hiddenCount = hiddenCount;
		this.forceUpdate();
	},
	search: function search(e) {
		var hiddenCount = this.state.hiddenCount || 0;
		var searchLen = (e.target.value || "").length;
		if (!searchLen) {
			this.state.selection = {};
			this.state.hiddenTabs = {};
			hiddenCount = 0;
		} else {
			var idList;
			var lastSearchLen = this.state.searchLen;
			if (!lastSearchLen) {
				idList = this.state.tabsbyid;
			} else if (lastSearchLen > searchLen) {
				idList = this.state.hiddenTabs;
			} else if (lastSearchLen < searchLen) {
				idList = this.state.selection;
			} else {
				return;
			}
			for (var id in idList) {
				var tab = this.state.tabsbyid[id];
				if ((tab.title + tab.url).toLowerCase().indexOf(e.target.value.toLowerCase()) >= 0) {
					hiddenCount -= this.state.hiddenTabs[id] || 0;
					this.state.selection[id] = true;
					delete this.state.hiddenTabs[id];
				} else {
					hiddenCount += 1 - (this.state.hiddenTabs[id] || 0);
					this.state.hiddenTabs[id] = true;
					delete this.state.selection[id];
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
				bottomText: "" });

		} else if (matches == 0) {
			this.setState({
				topText: "",
				bottomText: "" });

		} else if (matches > 1) {
			this.setState({
				topText: Object.keys(this.state.selection).length + " matches for '" + e.target.value + "'",
				bottomText: "Press enter to move them to a new window" });

		} else if (matches == 1) {
			this.setState({
				topText: Object.keys(this.state.selection).length + " match for '" + e.target.value + "'",
				bottomText: "Press enter to switch to the tab" });

		}
		this.forceUpdate();
	},
	checkKey: function checkKey(e) {
		if (e.keyCode == 13) this.addWindow();
		// any typed keys
		if (e.keyCode >= 48 && e.keyCode <= 57 || e.keyCode >= 65 && e.keyCode <= 90 || e.keyCode >= 186 && e.keyCode <= 192 || e.keyCode >= 219 && e.keyCode <= 22 || e.keyCode == 8 || e.keyCode == 46 || e.keyCode == 32) {
			if (document.activeElement != this.refs.searchbox) {
				if (document.activeElement.type != "text" && document.activeElement.type != "input") {
					this.refs.searchbox.focus();
				}
			}
		}
		// arrow keys
		if (e.keyCode >= 37 && e.keyCode <= 40) {
			if (document.activeElement != this.refs.windowcontainer && document.activeElement != this.refs.searchbox) {
				this.refs.windowcontainer.focus();
			}
		}
		// page up / page down
		if (e.keyCode == 33 || e.keyCode == 34) {
			if (document.activeElement != this.refs.windowcontainer) {
				this.refs.windowcontainer.focus();
			}
		}
		this.forceUpdate();
	},
	changelayout: function changelayout() {
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
	},
	nextlayout: function nextlayout() {
		if (this.state.layout == "blocks") {
			return "blocks-big";
		} else if (this.state.layout == "blocks-big") {
			return "horizontal";
		} else if (this.state.layout == "horizontal") {
			return "vertical";
		} else {
			return "blocks";
		}
	},
	readablelayout: function readablelayout(layout) {
		if (layout == "blocks") {
			return "Block";
		} else if (layout == "blocks-big") {
			return "Big Block";
		} else if (layout == "horizontal") {
			return "Horizontal";
		} else {
			return "Vertical";
		}
	},
	select: function select(id) {
		if (this.state.selection[id]) {
			delete this.state.selection[id];
		} else {
			this.state.selection[id] = true;
		}
		var selected = Object.keys(this.state.selection).length;
		if (selected == 0) {
			this.setState({
				topText: "No tabs selected",
				bottomText: " " });

		} else if (selected == 1) {
			this.setState({
				topText: "Selected " + selected + " tab",
				bottomText: "Press enter to switch to it" });

		} else {
			this.setState({
				topText: "Selected " + selected + " tabs",
				bottomText: "Press enter to move them to a new window" });

		}

		this.forceUpdate();
	},
	drag: function drag(e, id) {
		if (!this.state.selection[id]) {
			this.state.selection = {};
			this.state.selection[id] = true;
		}
		this.forceUpdate();
	},
	drop: function drop(id, before) {
		var _this5 = this;
		var tab = this.state.tabsbyid[id];
		var tabs = Object.keys(this.state.selection).map(function (id) {return _this5.state.tabsbyid[id];});
		var index = tab.index + (before ? 0 : 1);

		for (var i = 0; i < tabs.length; i++) {
			(function (t) {
				browser.tabs.move(t.id, { windowId: tab.windowId, index: index }, function () {
					browser.tabs.update(t.id, { pinned: t.pinned });
				});
			})(tabs[i]);
		}
		this.state.selection = {};
	},
	dropWindow: function dropWindow(windowId) {var _this6 = this;
		var tabs = Object.keys(this.state.selection).map(function (id) {return _this6.state.tabsbyid[id];});
		for (var i = 0; i < tabs.length; i++) {
			(function (t, windowId) {
				browser.tabs.move(t.id, { windowId: windowId, index: -1 }, function () {
					browser.tabs.update(t.id, { pinned: t.pinned });
				});
			})(tabs[i], windowId);
		}
		this.state.selection = {};
	},
	changeTabLimit: function changeTabLimit(e) {
		this.state.tabLimit = e.target.value;
		localStorage["tabLimit"] = JSON.stringify(this.state.tabLimit);
		this.tabLimitText();
		this.forceUpdate();
	},
	tabLimitText: function tabLimitText() {
		this.setState({
			bottomText: "Limit the number of tabs per window. Will move new tabs into a new window instead. 0 to turn off" });

	},
	changeTabWidth: function changeTabWidth(e) {
		this.state.tabWidth = e.target.value;
		localStorage["tabWidth"] = JSON.stringify(this.state.tabWidth);
		document.body.style.width = this.state.tabWidth + "px";
		this.tabWidthText();
		this.forceUpdate();
	},
	tabWidthText: function tabWidthText() {
		this.setState({
			bottomText: "Change the width of this window. 530 by default." });

	},
	changeTabHeight: function changeTabHeight(e) {
		this.state.tabHeight = e.target.value;
		localStorage["tabHeight"] = JSON.stringify(this.state.tabHeight);
		document.body.style.height = this.state.tabHeight + "px";
		this.tabHeightText();
		this.forceUpdate();
	},
	tabHeightText: function tabHeightText() {
		this.setState({
			bottomText: "Change the height of this window. 400 by default." });

	},
	toggleAnimations: function toggleAnimations() {
		this.state.animations = !this.state.animations;
		localStorage["animations"] = this.state.animations ? "1" : "0";
		this.animationsText();
		this.forceUpdate();
	},
	animationsText: function animationsText() {
		this.setState({
			bottomText: "Enables/disables animations. Default : on" });

	},
	toggleWindowTitles: function toggleWindowTitles() {
		this.state.windowTitles = !this.state.windowTitles;
		localStorage["windowTitles"] = this.state.windowTitles ? "1" : "0";
		this.windowTitlesText();
		this.forceUpdate();
	},
	windowTitlesText: function windowTitlesText() {
		this.setState({
			bottomText: "Enables/disables window titles. Default : on" });

	},
	toggleCompact: function toggleCompact() {
		this.state.compact = !this.state.compact;
		localStorage["compact"] = this.state.compact ? "1" : "0";
		this.compactText();
		this.forceUpdate();
	},
	compactText: function compactText() {
		this.setState({
			bottomText: "Compact mode is a more compressed layout. Default : off" });

	},
	toggleTabActions: function toggleTabActions() {
		this.state.tabactions = !this.state.tabactions;
		localStorage["tabactions"] = this.state.tabactions ? "1" : "0";
		this.tabActionsText();
		this.forceUpdate();
	},
	tabActionsText: function tabActionsText() {
		this.setState({
			bottomText: "Adds 'Open a new tab' and 'Close this window' option to each window. Default : on" });

	},
	toggleBadge: function toggleBadge() {
		this.state.badge = !this.state.badge;
		localStorage["badge"] = this.state.badge ? "1" : "0";
		this.badgeText();
		browser.runtime.getBackgroundPage(function callback(backgroundPage) {
			backgroundPage.updateTabCount();
		});
		this.forceUpdate();
	},
	badgeText: function badgeText() {
		this.setState({
			bottomText: "Shows the number of open tabs on the Tab Manager icon. Default : on" });

	},
	toggleHide: function toggleHide() {
		browser.permissions.request({ permissions: ["system.display"] }, function (granted) {
			if (granted) {
				this.state.hideWindows = !this.state.hideWindows;
			} else {
				this.state.hideWindows = false;
			}
			localStorage["hideWindows"] = this.state.hideWindows ? "1" : "0";
			this.hideText();
			this.forceUpdate();
		}.bind(this));
	},
	hideText: function hideText() {
		this.setState({
			bottomText: "Automatically minimizes inactive chrome windows. Default : off" });

	},
	toggleFilterMismatchedTabs: function toggleFilterMismatchedTabs() {
		this.state.filterTabs = !this.state.filterTabs;
		localStorage["filter-tabs"] = this.state.filterTabs ? "1" : "0";
		this.forceUpdate();
	},
	getTip: function getTip() {
		var tips = [
		"You can right click on a tab to select it",
		"Press enter to move all selected tabs to a new window",
		"Middle click to close a tab",
		"Tab Manager Plus loves saving time",
		"To see incognito tabs, enable incognito access in the extension settings",
		"You can drag and drop tabs to other windows"];

		return "Tip: " + tips[Math.floor(Math.random() * tips.length)];
	},
	toBoolean: function toBoolean(str) {
		if (typeof str === 'undefined' || str === null) {
			return false;
		} else if (typeof str === 'string') {
			switch (str.toLowerCase()) {
				case 'false':
				case 'no':
				case '0':
				case "":
					return false;
				default:
					return true;}

		} else if (typeof str === 'number') {
			return str !== 0;
		} else
		{return true;}
	},
	localStorageAvailable: function localStorageAvailable() {
		var test = 'test';
		try {
			localStorage.setItem(test, test);
			localStorage.removeItem(test);
			return true;
		} catch (e) {
			return false;
		}
	},
	isInViewport: function isInViewport(element, ofElement) {
		var rect = element.getBoundingClientRect();
		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= ofElement.height &&
			rect.right <= ofElement.width);

	},
	elVisible: function elVisible(elem) {
		if (!(elem instanceof Element)) throw Error('DomUtil: elem is not an element.');
		var style = getComputedStyle(elem);
		if (style.display === 'none') return false;
		if (style.visibility !== 'visible') return false;
		if (style.opacity < 0.1) return false;
		if (elem.offsetWidth + elem.offsetHeight + elem.getBoundingClientRect().height +
		elem.getBoundingClientRect().width === 0) {
			return false;
		}
		var elemCenter = {
			x: elem.getBoundingClientRect().left + elem.offsetWidth / 2,
			y: elem.getBoundingClientRect().top + elem.offsetHeight / 2 };

		if (elemCenter.x < 0) return false;
		if (elemCenter.x > (document.documentElement.clientWidth || window.innerWidth)) return false;
		if (elemCenter.y < 0) return false;
		if (elemCenter.y > (document.documentElement.clientHeight || window.innerHeight)) return false;
		var pointContainer = document.elementFromPoint(elemCenter.x, elemCenter.y);
		do {
			if (pointContainer === elem) return true;
		} while (pointContainer = pointContainer.parentNode);
		return false;
	} }));

