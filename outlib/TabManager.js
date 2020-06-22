"use strict";var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();function _asyncToGenerator(fn) {return function () {var gen = fn.apply(this, arguments);return new Promise(function (resolve, reject) {function step(key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {return Promise.resolve(value).then(function (value) {step("next", value);}, function (err) {step("throw", err);});}}return step("next");});};}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self, call) {if (!self) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call && (typeof call === "object" || typeof call === "function") ? call : self;}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;}

var browser = browser || chrome;var

TabManager = function (_React$Component) {_inherits(TabManager, _React$Component);
	function TabManager(props) {_classCallCheck(this, TabManager);

		//this.update();
		var _this7 = _possibleConstructorReturn(this, (TabManager.__proto__ || Object.getPrototypeOf(TabManager)).call(this, props));
		if (navigator.userAgent.search("Firefox") > -1) {
		} else {
			var check = browser.permissions.contains({ permissions: ["system.display"] });
			check.then(
			function (result) {
				if (result) {
					// The extension has the permissions.
				} else {
					localStorage["hideWindows"] = "0";
					this.state.hideWindows = false;
				}
			}.bind(_this7));

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

		if (_this7.localStorageAvailable()) {
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
			if (typeof localStorage["version"] === "undefined") localStorage["version"] = "5.2.0";

			layout = localStorage["layout"];
			tabLimit = JSON.parse(localStorage["tabLimit"]);
			tabWidth = JSON.parse(localStorage["tabWidth"]);
			tabHeight = JSON.parse(localStorage["tabHeight"]);
			openInOwnTab = _this7.toBoolean(localStorage["openInOwnTab"]);
			animations = _this7.toBoolean(localStorage["animations"]);
			windowTitles = _this7.toBoolean(localStorage["windowTitles"]);
			compact = _this7.toBoolean(localStorage["compact"]);
			dark = _this7.toBoolean(localStorage["dark"]);
			tabactions = _this7.toBoolean(localStorage["tabactions"]);
			badge = _this7.toBoolean(localStorage["badge"]);
			sessionsFeature = _this7.toBoolean(localStorage["sessionsFeature"]);
			hideWindows = _this7.toBoolean(localStorage["hideWindows"]);
			filterTabs = _this7.toBoolean(localStorage["filter-tabs"]);
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

		_this7.state = {
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
			optionsActive: !!_this7.props.optionsActive,
			filterTabs: filterTabs,
			dupTabs: false,
			colorsActive: false };


		_this7.addWindow = _this7.addWindow.bind(_this7);
		_this7.animationsText = _this7.animationsText.bind(_this7);
		_this7.badgeText = _this7.badgeText.bind(_this7);
		_this7.changelayout = _this7.changelayout.bind(_this7);
		_this7.changeTabHeight = _this7.changeTabHeight.bind(_this7);
		_this7.changeTabLimit = _this7.changeTabLimit.bind(_this7);
		_this7.changeTabWidth = _this7.changeTabWidth.bind(_this7);
		_this7.checkKey = _this7.checkKey.bind(_this7);
		_this7.clearSelection = _this7.clearSelection.bind(_this7);
		_this7.compactText = _this7.compactText.bind(_this7);
		_this7.darkText = _this7.darkText.bind(_this7);
		_this7.deleteTabs = _this7.deleteTabs.bind(_this7);
		_this7.discardTabs = _this7.discardTabs.bind(_this7);
		_this7.donate = _this7.donate.bind(_this7);
		_this7.exportSessions = _this7.exportSessions.bind(_this7);
		_this7.exportSessionsText = _this7.exportSessionsText.bind(_this7);
		_this7.getTip = _this7.getTip.bind(_this7);
		_this7.hideText = _this7.hideText.bind(_this7);
		_this7.highlightDuplicates = _this7.highlightDuplicates.bind(_this7);
		_this7.hoverIcon = _this7.hoverIcon.bind(_this7);
		_this7.importSessions = _this7.importSessions.bind(_this7);
		_this7.importSessionsText = _this7.importSessionsText.bind(_this7);
		_this7.openInOwnTabText = _this7.openInOwnTabText.bind(_this7);
		_this7.pinTabs = _this7.pinTabs.bind(_this7);
		_this7.rateExtension = _this7.rateExtension.bind(_this7);
		_this7.scrollTo = _this7.scrollTo.bind(_this7);
		_this7.search = _this7.search.bind(_this7);
		_this7.sessionsText = _this7.sessionsText.bind(_this7);
		_this7.sessionSync = _this7.sessionSync.bind(_this7);
		_this7.tabActionsText = _this7.tabActionsText.bind(_this7);
		_this7.tabHeightText = _this7.tabHeightText.bind(_this7);
		_this7.tabLimitText = _this7.tabLimitText.bind(_this7);
		_this7.tabWidthText = _this7.tabWidthText.bind(_this7);
		_this7.toggleAnimations = _this7.toggleAnimations.bind(_this7);
		_this7.toggleBadge = _this7.toggleBadge.bind(_this7);
		_this7.toggleCompact = _this7.toggleCompact.bind(_this7);
		_this7.toggleDark = _this7.toggleDark.bind(_this7);
		_this7.toggleFilterMismatchedTabs = _this7.toggleFilterMismatchedTabs.bind(_this7);
		_this7.toggleHide = _this7.toggleHide.bind(_this7);
		_this7.toggleOpenInOwnTab = _this7.toggleOpenInOwnTab.bind(_this7);
		_this7.toggleOptions = _this7.toggleOptions.bind(_this7);
		_this7.toggleSessions = _this7.toggleSessions.bind(_this7);
		_this7.toggleTabActions = _this7.toggleTabActions.bind(_this7);
		_this7.toggleWindowTitles = _this7.toggleWindowTitles.bind(_this7);
		_this7.update = _this7.update.bind(_this7);
		_this7.windowTitlesText = _this7.windowTitlesText.bind(_this7);return _this7;

	}_createClass(TabManager, [{ key: "componentWillMount", value: function componentWillMount()
		{
			this.update();
		} }, { key: "hoverHandler", value: function hoverHandler(
		tab) {
			this.setState({ topText: tab.title });
			this.setState({ bottomText: tab.url });
			// clearTimeout(this.state.closeTimeout);
			// this.state.closeTimeout = setTimeout(function () {
			//  window.close();
			// }, 100000);
			clearTimeout(this.state.resetTimeout);
			this.state.resetTimeout = setTimeout(
			function () {
				this.setState({ topText: "", bottomText: "" });
				this.update();
			}.bind(this),
			15000);

			//this.update();
		} }, { key: "hoverIcon", value: function hoverIcon(
		e) {
			var text = "";
			if (e && e.target && e.target.title) {
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
		} }, { key: "render", value: function render()
		{
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
				React.createElement("div", {
						id: "root",
						className:
						(this.state.compact ? "compact" : "") +
						" " + (
						this.state.animations ? "animations" : "no-animations") +
						" " + (
						this.state.windowTitles ? "windowTitles" : "no-windowTitles"),

						onKeyDown: this.checkKey,
						ref: "root",
						tabIndex: 0 },

					React.createElement("div", { className: "window-container " + this.state.layout + " " + (this.state.optionsActive ? "hidden" : ""), ref: "windowcontainer", tabIndex: 2 },
						this.state.windows.map(function (window) {
							if (window.state == "minimized") return;
							if (!!this.state.colorsActive && this.state.colorsActive !== window.id) return;
							return (
								React.createElement(Window, {
									key: "window" + window.id,
									window: window,
									tabs: window.tabs,
									incognito: window.incognito,
									layout: _this.state.layout,
									selection: _this.state.selection,
									searchActive: _this.state.searchLen > 0,
									sessionsFeature: _this.state.sessionsFeature,
									tabactions: _this.state.tabactions,
									hiddenTabs: _this.state.hiddenTabs,
									filterTabs: _this.state.filterTabs,
									hoverHandler: _this.hoverHandler.bind(_this),
									scrollTo: _this.scrollTo.bind(_this),
									hoverIcon: _this.hoverIcon.bind(_this),
									parentUpdate: _this.update.bind(_this),
									toggleColors: _this.toggleColors.bind(_this),
									tabMiddleClick: _this.deleteTab.bind(_this),
									select: _this.select.bind(_this),
									selectTo: _this.selectTo.bind(_this),
									drag: _this.drag.bind(_this),
									drop: _this.drop.bind(_this),
									dropWindow: _this.dropWindow.bind(_this),
									windowTitles: _this.state.windowTitles,
									lastOpenWindow: _this.state.lastOpenWindow,
									ref: "window" + window.id }));


						}.bind(this)),
						React.createElement("div", { className: "hrCont " + (!haveMin ? "hidden" : "") },
							React.createElement("div", { className: "hrDiv" },
								React.createElement("span", { className: "hrSpan" }, "Minimized windows"))),


						this.state.windows.map(function (window) {
							if (window.state !== "minimized") return;
							if (!!this.state.colorsActive && this.state.colorsActive !== window.id) return;
							return (
								React.createElement(Window, {
									key: "window" + window.id,
									window: window,
									tabs: window.tabs,
									incognito: window.incognito,
									layout: _this.state.layout,
									selection: _this.state.selection,
									searchActive: _this.state.searchLen > 0,
									sessionsFeature: _this.state.sessionsFeature,
									tabactions: _this.state.tabactions,
									hiddenTabs: _this.state.hiddenTabs,
									filterTabs: _this.state.filterTabs,
									hoverHandler: _this.hoverHandler.bind(_this),
									scrollTo: _this.scrollTo.bind(_this),
									hoverIcon: _this.hoverIcon.bind(_this),
									parentUpdate: _this.update.bind(_this),
									toggleColors: _this.toggleColors.bind(_this),
									tabMiddleClick: _this.deleteTab.bind(_this),
									select: _this.select.bind(_this),
									selectTo: _this.selectTo.bind(_this),
									drag: _this.drag.bind(_this),
									drop: _this.drop.bind(_this),
									dropWindow: _this.dropWindow.bind(_this),
									windowTitles: _this.state.windowTitles,
									lastOpenWindow: _this.state.lastOpenWindow,
									ref: "window" + window.id }));


						}.bind(this)),
						React.createElement("div", { className: "hrCont " + (!haveSess ? "hidden" : "") },
							React.createElement("div", { className: "hrDiv" },
								React.createElement("span", { className: "hrSpan" }, "Saved windows"))),


						haveSess ?
						this.state.sessions.map(function (window) {
							if (!!this.state.colorsActive && this.state.colorsActive !== window.id) return;
							return (
								React.createElement(Session, {
									key: "session" + window.id,
									window: window,
									tabs: window.tabs,
									incognito: window.incognito,
									layout: _this.state.layout,
									selection: _this.state.selection,
									searchActive: _this.state.searchLen > 0,
									tabactions: _this.state.tabactions,
									hiddenTabs: _this.state.hiddenTabs,
									filterTabs: _this.state.filterTabs,
									hoverHandler: _this.hoverHandler.bind(_this),
									scrollTo: _this.scrollTo.bind(_this),
									hoverIcon: _this.hoverIcon.bind(_this),
									parentUpdate: _this.update.bind(_this),
									toggleColors: _this.toggleColors.bind(_this),
									tabMiddleClick: _this.deleteTab.bind(_this),
									select: _this.select.bind(_this),
									windowTitles: _this.state.windowTitles,
									lastOpenWindow: _this.state.lastOpenWindow,
									ref: "session" + window.id }));


						}.bind(this)) :
						false),

					React.createElement("div", { className: "options-container " + (this.state.optionsActive ? "" : "hidden"), ref: "options-container" },
						React.createElement(TabOptions, {
							compact: this.state.compact,
							dark: this.state.dark,
							animations: this.state.animations,
							windowTitles: this.state.windowTitles,
							tabLimit: this.state.tabLimit,
							openInOwnTab: this.state.openInOwnTab,
							tabWidth: this.state.tabWidth,
							tabHeight: this.state.tabHeight,
							tabactions: this.state.tabactions,
							badge: this.state.badge,
							hideWindows: this.state.hideWindows,
							sessionsFeature: this.state.sessionsFeature,
							exportSessions: this.exportSessions,
							importSessions: this.importSessions,
							toggleOpenInOwnTab: this.toggleOpenInOwnTab,
							toggleBadge: this.toggleBadge,
							toggleHide: this.toggleHide,
							toggleSessions: this.toggleSessions,
							toggleAnimations: this.toggleAnimations,
							toggleWindowTitles: this.toggleWindowTitles,
							toggleCompact: this.toggleCompact,
							toggleDark: this.toggleDark,
							toggleTabActions: this.toggleTabActions,
							changeTabLimit: this.changeTabLimit,
							changeTabWidth: this.changeTabWidth,
							changeTabHeight: this.changeTabHeight,
							openInOwnTabText: this.openInOwnTabText,
							badgeText: this.badgeText,
							hideText: this.hideText,
							sessionsText: this.sessionsText,
							exportSessionsText: this.exportSessionsText,
							importSessionsText: this.importSessionsText,
							animationsText: this.animationsText,
							windowTitlesText: this.windowTitlesText,
							tabLimitText: this.tabLimitText,
							tabWidthText: this.tabWidthText,
							tabHeightText: this.tabHeightText,
							compactText: this.compactText,
							darkText: this.darkText,
							tabActionsText: this.tabActionsText,
							getTip: this.getTip })),


					React.createElement("div", { className: "window top", ref: "tophover" },
						React.createElement("div", { className: "icon windowaction donate", title: "Donate a Coffee", onClick: this.donate, onMouseEnter: this.hoverIcon }),
						React.createElement("div", {
							className: "icon windowaction rate",
							title: "Rate Tab Manager Plus",
							onClick: this.rateExtension,
							onMouseEnter: this.hoverIcon }),

						React.createElement("div", { className: "icon windowaction options", title: "Options", onClick: this.toggleOptions, onMouseEnter: this.hoverIcon }),
						React.createElement("input", {
							type: "text",
							disabled: true,
							className: "tabtitle",
							ref: "topbox",
							placeholder: maybePluralize(tabCount, 'tab') + " in " + this.state.windows.length + " windows",
							value: this.state.topText }),

						React.createElement("input", { type: "text", disabled: true, className: "taburl", ref: "topboxurl", placeholder: this.getTip(), value: this.state.bottomText })),

					React.createElement("div", { className: "window searchbox " + (this.state.optionsActive || !!this.state.colorsActive ? "hidden" : "") },
						React.createElement("table", null,
							React.createElement("tbody", null,
								React.createElement("tr", null,
									React.createElement("td", { className: "one" },
										React.createElement("input", { className: "searchBoxInput", type: "text", placeholder: "Start typing to search tabs...", tabIndex: "1", onChange: this.search, ref: "searchbox" })),

									React.createElement("td", { className: "two" },
										React.createElement("div", {
											className: "icon windowaction " + this.state.layout + "-view",
											title: "Change to " + this.readablelayout(this.nextlayout()) + " View",
											onClick: this.changelayout,
											onMouseEnter: this.hoverIcon }),

										React.createElement("div", {
											className: "icon windowaction trash",
											title:
											Object.keys(this.state.selection).length > 0 ?
											"Close selected tabs\nWill close " + maybePluralize(Object.keys(this.state.selection).length, 'tab') :
											"Close current Tab",

											onClick: this.deleteTabs,
											onMouseEnter: this.hoverIcon }),

										React.createElement("div", {
											className: "icon windowaction discard",
											title:
											Object.keys(this.state.selection).length > 0 ?
											"Discard selected tabs\nWill discard " + maybePluralize(Object.keys(this.state.selection).length, 'tab') + " - freeing memory" :
											"Select tabs to discard them and free memory",

											style:
											Object.keys(this.state.selection).length > 0 ?
											{} :
											{ opacity: 0.25 },

											onClick: this.discardTabs,
											onMouseEnter: this.hoverIcon }),

										React.createElement("div", {
											className: "icon windowaction pin",
											title:
											Object.keys(this.state.selection).length > 0 ?
											"Pin selected tabs\nWill pin " + maybePluralize(Object.keys(this.state.selection).length, 'tab') :
											"Pin current Tab",

											onClick: this.pinTabs,
											onMouseEnter: this.hoverIcon }),

										React.createElement("div", {
											className: "icon windowaction filter" + (this.state.filterTabs ? " enabled" : ""),
											title:
											(this.state.filterTabs ? "Turn off hiding of" : "Hide") +
											" tabs that do not match search" + (
											this.state.searchLen > 0 ?
											"\n" + (
											this.state.filterTabs ? "Will reveal " : "Will hide ") +
											maybePluralize(Object.keys(this.state.tabsbyid).length - Object.keys(this.state.selection).length, 'tab') :
											""),

											onClick: this.toggleFilterMismatchedTabs,
											onMouseEnter: this.hoverIcon }),

										React.createElement("div", {
											className: "icon windowaction new",
											title:
											Object.keys(this.state.selection).length > 0 ?
											"Move tabs to new window\nWill move " + maybePluralize(Object.keys(this.state.selection).length, 'selected tab') + " to it" :
											"Open new empty window",

											onClick: this.addWindow,
											onMouseEnter: this.hoverIcon }),

										React.createElement("div", {
											className: "icon windowaction duplicates" + (this.state.dupTabs ? " enabled" : ""),
											title: "Highlight Duplicates",
											onClick: this.highlightDuplicates,
											onMouseEnter: this.hoverIcon })))))),






					React.createElement("div", { className: "window placeholder" })));


		} }, { key: "componentDidMount", value: function componentDidMount()
		{

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
			setTimeout(function () {
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
		} }, { key: "sessionSync", value: function () {var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {var values, sessions, key, sess;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.next = 2;return (

									browser.storage.local.get(null));case 2:values = _context.sent;
								// console.log(values);
								sessions = [];
								for (key in values) {
									sess = values[key];
									if (sess.id && sess.tabs && sess.windowsInfo) {
										sessions.push(values[key]);
									}
								}
								this.state.sessions = sessions;
								this.update();case 7:case "end":return _context.stop();}}}, _callee, this);}));function sessionSync() {return _ref.apply(this, arguments);}return sessionSync;}() }, { key: "focusRoot", value: function focusRoot()

		{
			this.state.focusUpdates++;
			setTimeout(
			function () {
				if (document.activeElement == document.body) {
					this.refs.root.focus();
					this.forceUpdate();
					if (this.state.focusUpdates < 5) this.focusRoot();
				}
			}.bind(this),
			500);

		} }, { key: "rateExtension", value: function rateExtension()
		{
			if (navigator.userAgent.search("Firefox") > -1) {
				browser.tabs.create({ url: "https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/" });
			} else {
				browser.tabs.create({ url: "https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff" });
			}
			this.forceUpdate();
		} }, { key: "donate", value: function donate()
		{
			browser.tabs.create({ url: "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW" });
			this.forceUpdate();
		} }, { key: "toggleOptions", value: function toggleOptions()
		{
			this.state.optionsActive = !this.state.optionsActive;
			this.forceUpdate();
		} }, { key: "toggleColors", value: function toggleColors(
		active, windowId) {
			if (!!active) {
				this.state.colorsActive = windowId;
			} else {
				this.state.colorsActive = false;
			}
			console.log("colorsActive", active, windowId, this.state.colorsActive);
			this.forceUpdate();
		} }, { key: "update", value: function () {var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {var windows, tabCount, i, window, j, tab, id;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_context2.next = 2;return (

									browser.windows.getAll({ populate: true }));case 2:windows = _context2.sent;
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
								tabCount = 0;
								for (i = 0; i < windows.length; i++) {
									window = windows[i];
									this.state.windowsbyid[window.id] = window;
									for (j = 0; j < window.tabs.length; j++) {
										tab = window.tabs[j];
										this.state.tabsbyid[tab.id] = tab;
										tabCount++;
									}
								}
								for (id in this.state.selection) {
									if (!this.state.tabsbyid[id]) {
										delete this.state.selection[id];
										this.state.lastSelect = id;
									}
								}
								this.state.tabCount = tabCount;
								this.setState({
									tabCount: tabCount });

								//this.state.searchLen = 0;
								// this.forceUpdate();
							case 13:case "end":return _context2.stop();}}}, _callee2, this);}));function update() {return _ref2.apply(this, arguments);}return update;}() }, { key: "deleteTabs", value: function () {var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {var _this2, tabs, i, t;return regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0:

								_this2 = this;
								tabs = Object.keys(this.state.selection).map(function (id) {
									return _this2.state.tabsbyid[id];
								});if (!
								tabs.length) {_context3.next = 12;break;}
								i = 0;case 4:if (!(i < tabs.length)) {_context3.next = 10;break;}_context3.next = 7;return (
									browser.tabs.remove(tabs[i].id));case 7:i++;_context3.next = 4;break;case 10:_context3.next = 18;break;case 12:_context3.next = 14;return (


									browser.tabs.query({ currentWindow: true, active: true }));case 14:t = _context3.sent;if (!(
								t && t.length > 0)) {_context3.next = 18;break;}_context3.next = 18;return (
									browser.tabs.remove(t[0].id));case 18:


								this.forceUpdate();case 19:case "end":return _context3.stop();}}}, _callee3, this);}));function deleteTabs() {return _ref3.apply(this, arguments);}return deleteTabs;}() }, { key: "deleteTab", value: function deleteTab(

		tabId) {
			browser.tabs.remove(tabId);
		} }, { key: "discardTabs", value: function () {var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {var tabs, i;return regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:

								tabs = Object.keys(this.state.selection).map(function (id) {
									return parseInt(id);
								});
								if (tabs.length) {
									for (i = 0; i < tabs.length; i++) {
										if (!this.state.tabsbyid[tabs[i]].discarded) {
											browser.tabs.discard(tabs[i]).catch(function (e) {
												console.error(e);
												console.log(e.message);
											});
										}
									}
								}
								this.clearSelection();case 3:case "end":return _context4.stop();}}}, _callee4, this);}));function discardTabs() {return _ref4.apply(this, arguments);}return discardTabs;}() }, { key: "discardTab", value: function discardTab(

		tabId) {
			browser.tabs.discard(tabId);
		} }, { key: "addWindow", value: function () {var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {var _this3, count, tabs, backgroundPage;return regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:

								_this3 = this;
								count = Object.keys(this.state.selection).length;
								tabs = Object.keys(this.state.selection).map(function (id) {
									return _this3.state.tabsbyid[id];
								});if (!(

								count == 0)) {_context5.next = 8;break;}_context5.next = 6;return (
									browser.windows.create({}));case 6:_context5.next = 19;break;case 8:if (!(
								count == 1)) {_context5.next = 15;break;}_context5.next = 11;return (
									browser.runtime.getBackgroundPage());case 11:backgroundPage = _context5.sent;
								if (navigator.userAgent.search("Firefox") > -1) {
									backgroundPage.focusOnTabAndWindowDelayed(tabs[0]);
								} else {
									backgroundPage.focusOnTabAndWindow(tabs[0]);
								}_context5.next = 19;break;case 15:_context5.next = 17;return (

									browser.runtime.getBackgroundPage());case 17:backgroundPage = _context5.sent;
								backgroundPage.createWindowWithTabs(tabs);case 19:

								if (!!window.inPopup) window.close();case 20:case "end":return _context5.stop();}}}, _callee5, this);}));function addWindow() {return _ref5.apply(this, arguments);}return addWindow;}() }, { key: "pinTabs", value: function () {var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {var _this4, tabs, i, t;return regeneratorRuntime.wrap(function _callee6$(_context6) {while (1) {switch (_context6.prev = _context6.next) {case 0:


								_this4 = this;
								tabs = Object.keys(this.state.selection).
								map(function (id) {
									return _this4.state.tabsbyid[id];
								}).
								sort(function (a, b) {
									return a.index - b.index;
								});if (!
								tabs.length) {_context6.next = 13;break;}
								if (tabs[0].pinned) tabs.reverse();
								i = 0;case 5:if (!(i < tabs.length)) {_context6.next = 11;break;}_context6.next = 8;return (
									browser.tabs.update(tabs[i].id, { pinned: !tabs[0].pinned }));case 8:i++;_context6.next = 5;break;case 11:_context6.next = 19;break;case 13:_context6.next = 15;return (


									browser.tabs.query({ currentWindow: true, active: true }));case 15:t = _context6.sent;if (!(
								t && t.length > 0)) {_context6.next = 19;break;}_context6.next = 19;return (
									browser.tabs.update(t[0].id, { pinned: !t[0].pinned }));case 19:case "end":return _context6.stop();}}}, _callee6, this);}));function pinTabs() {return _ref6.apply(this, arguments);}return pinTabs;}() }, { key: "highlightDuplicates", value: function highlightDuplicates(



		e) {
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
					bottomText: " " });

			} else {
				this.setState({
					topText: "Highlighted " + dup.length + " duplicate tabs",
					bottomText: "Press enter to move them to a new window" });

			}
			this.state.hiddenCount = hiddenCount;
			this.forceUpdate();
		} }, { key: "search", value: function search(
		e) {
			var hiddenCount = this.state.hiddenCount || 0;
			var searchQuery = e.target.value || "";
			var searchLen = searchQuery.length;

			var searchType = "normal";
			var searchTerms = [];
			if (searchQuery.indexOf(" ") === -1) {
				searchType = "normal";
			} else if (searchQuery.indexOf(" OR ") > -1) {
				searchTerms = searchQuery.split(" OR ");
				searchType = "OR";
			} else if (searchQuery.indexOf(" ") > -1) {
				searchTerms = searchQuery.split(" ");
				searchType = "AND";
			}
			if (searchType != "normal") {
				searchTerms = searchTerms.filter(function (entry) {return entry.trim() != '';});
			}

			if (!searchLen) {
				this.state.selection = {};
				this.state.hiddenTabs = {};
				hiddenCount = 0;
			} else {
				var idList;
				var lastSearchLen = this.state.searchLen;
				idList = this.state.tabsbyid;
				if (searchType == "normal") {
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
					if (searchType == "normal") {
						match = tabSearchTerm.indexOf(e.target.value.toLowerCase()) >= 0;
					} else if (searchType == "OR") {var _iteratorNormalCompletion = true;var _didIteratorError = false;var _iteratorError = undefined;try {
							for (var _iterator = searchTerms[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {var searchOR = _step.value;
								searchOR = searchOR.trim().toLowerCase();
								if (tabSearchTerm.indexOf(searchOR) >= 0) {
									match = true;
									break;
								}
							}} catch (err) {_didIteratorError = true;_iteratorError = err;} finally {try {if (!_iteratorNormalCompletion && _iterator.return) {_iterator.return();}} finally {if (_didIteratorError) {throw _iteratorError;}}}
					} else if (searchType == "AND") {
						var andMatch = true;var _iteratorNormalCompletion2 = true;var _didIteratorError2 = false;var _iteratorError2 = undefined;try {
							for (var _iterator2 = searchTerms[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {var searchAND = _step2.value;
								searchAND = searchAND.trim().toLowerCase();
								if (tabSearchTerm.indexOf(searchAND) >= 0) {

								} else {
									andMatch = false;
									break;
								}
							}} catch (err) {_didIteratorError2 = true;_iteratorError2 = err;} finally {try {if (!_iteratorNormalCompletion2 && _iterator2.return) {_iterator2.return();}} finally {if (_didIteratorError2) {throw _iteratorError2;}}}
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
		} }, { key: "clearSelection", value: function clearSelection()
		{
			this.state.selection = {};
			this.setState({
				lastSelect: false });

		} }, { key: "checkKey", value: function checkKey(
		e) {
			// enter
			if (e.keyCode == 13) this.addWindow();
			// escape key
			if (e.keyCode == 27) {
				if (this.state.searchLen > 0 || Object.keys(this.state.selection).length > 0) {
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
			e.keyCode >= 48 && e.keyCode <= 57 ||
			e.keyCode >= 65 && e.keyCode <= 90 ||
			e.keyCode >= 186 && e.keyCode <= 192 ||
			e.keyCode >= 219 && e.keyCode <= 22 ||
			e.keyCode == 8 ||
			e.keyCode == 46 ||
			e.keyCode == 32)
			{
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
							}var _iteratorNormalCompletion3 = true;var _didIteratorError3 = false;var _iteratorError3 = undefined;try {
								for (var _iterator3 = this.state.windows[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {var _w = _step3.value;
									if (found) break;
									if (_w.state != "minimized") {var _iteratorNormalCompletion5 = true;var _didIteratorError5 = false;var _iteratorError5 = undefined;try {
											for (var _iterator5 = _w.tabs[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {var _t = _step5.value;
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
											}} catch (err) {_didIteratorError5 = true;_iteratorError5 = err;} finally {try {if (!_iteratorNormalCompletion5 && _iterator5.return) {_iterator5.return();}} finally {if (_didIteratorError5) {throw _iteratorError5;}}}
									}
								}} catch (err) {_didIteratorError3 = true;_iteratorError3 = err;} finally {try {if (!_iteratorNormalCompletion3 && _iterator3.return) {_iterator3.return();}} finally {if (_didIteratorError3) {throw _iteratorError3;}}}var _iteratorNormalCompletion4 = true;var _didIteratorError4 = false;var _iteratorError4 = undefined;try {
								for (var _iterator4 = this.state.windows[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {var _w = _step4.value;
									if (found) break;
									if (_w.state == "minimized") {var _iteratorNormalCompletion6 = true;var _didIteratorError6 = false;var _iteratorError6 = undefined;try {
											for (var _iterator6 = _w.tabs[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {var _t = _step6.value;
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
											}} catch (err) {_didIteratorError6 = true;_iteratorError6 = err;} finally {try {if (!_iteratorNormalCompletion6 && _iterator6.return) {_iterator6.return();}} finally {if (_didIteratorError6) {throw _iteratorError6;}}}
									}
								}} catch (err) {_didIteratorError4 = true;_iteratorError4 = err;} finally {try {if (!_iteratorNormalCompletion4 && _iterator4.return) {_iterator4.return();}} finally {if (_didIteratorError4) {throw _iteratorError4;}}}
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
							}var _iteratorNormalCompletion7 = true;var _didIteratorError7 = false;var _iteratorError7 = undefined;try {
								for (var _iterator7 = this.state.windows[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {var _w = _step7.value;
									i = 0;
									if (found) break;
									if (_w.state != "minimized") {
										if (!first) first = _w.id;var _iteratorNormalCompletion9 = true;var _didIteratorError9 = false;var _iteratorError9 = undefined;try {
											for (var _iterator9 = _w.tabs[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {var _t = _step9.value;
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
											}} catch (err) {_didIteratorError9 = true;_iteratorError9 = err;} finally {try {if (!_iteratorNormalCompletion9 && _iterator9.return) {_iterator9.return();}} finally {if (_didIteratorError9) {throw _iteratorError9;}}}
										prev = _w.id;
									}
								}} catch (err) {_didIteratorError7 = true;_iteratorError7 = err;} finally {try {if (!_iteratorNormalCompletion7 && _iterator7.return) {_iterator7.return();}} finally {if (_didIteratorError7) {throw _iteratorError7;}}}var _iteratorNormalCompletion8 = true;var _didIteratorError8 = false;var _iteratorError8 = undefined;try {
								for (var _iterator8 = this.state.windows[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {var _w = _step8.value;
									i = 0;
									if (found) break;
									if (_w.state == "minimized") {
										if (!first) first = _w.id;var _iteratorNormalCompletion10 = true;var _didIteratorError10 = false;var _iteratorError10 = undefined;try {
											for (var _iterator10 = _w.tabs[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {var _t = _step10.value;
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
											}} catch (err) {_didIteratorError10 = true;_iteratorError10 = err;} finally {try {if (!_iteratorNormalCompletion10 && _iterator10.return) {_iterator10.return();}} finally {if (_didIteratorError10) {throw _iteratorError10;}}}
										prev = _w.id;
									}
								}
								// console.log(found, goDown, first);
							} catch (err) {_didIteratorError8 = true;_iteratorError8 = err;} finally {try {if (!_iteratorNormalCompletion8 && _iterator8.return) {_iterator8.return();}} finally {if (_didIteratorError8) {throw _iteratorError8;}}}if (!found && goDown && first) {
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
		} }, { key: "selectWindowTab", value: function selectWindowTab(
		windowId, tabPosition) {
			if (!tabPosition || tabPosition < 1) tabPosition = 1;var _iteratorNormalCompletion11 = true;var _didIteratorError11 = false;var _iteratorError11 = undefined;try {
				for (var _iterator11 = this.state.windows[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {var _w = _step11.value;
					if (_w.id != windowId) continue;
					var i = 0;var _iteratorNormalCompletion12 = true;var _didIteratorError12 = false;var _iteratorError12 = undefined;try {
						for (var _iterator12 = _w.tabs[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {var _t = _step12.value;
							i++;
							if (_w.tabs.length >= tabPosition && tabPosition == i || _w.tabs.length < tabPosition && _w.tabs.length == i) {
								this.state.selection = {};
								this.select(_t.id);
							}
						}} catch (err) {_didIteratorError12 = true;_iteratorError12 = err;} finally {try {if (!_iteratorNormalCompletion12 && _iterator12.return) {_iterator12.return();}} finally {if (_didIteratorError12) {throw _iteratorError12;}}}
				}} catch (err) {_didIteratorError11 = true;_iteratorError11 = err;} finally {try {if (!_iteratorNormalCompletion11 && _iterator11.return) {_iterator11.return();}} finally {if (_didIteratorError11) {throw _iteratorError11;}}}
		} }, { key: "scrollTo", value: function scrollTo(
		what, id) {
			var els = document.getElementById(what + "-" + id);
			if (!!els) {
				if (!this.elVisible(els)) {
					els.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
				}
			}
		} }, { key: "changelayout", value: function changelayout()
		{
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
		} }, { key: "nextlayout", value: function nextlayout()
		{
			if (this.state.layout == "blocks") {
				return "blocks-big";
			} else if (this.state.layout == "blocks-big") {
				return "horizontal";
			} else if (this.state.layout == "horizontal") {
				return "vertical";
			} else {
				return "blocks";
			}
		} }, { key: "readablelayout", value: function readablelayout(
		layout) {
			if (layout == "blocks") {
				return "Block";
			} else if (layout == "blocks-big") {
				return "Big Block";
			} else if (layout == "horizontal") {
				return "Horizontal";
			} else {
				return "Vertical";
			}
		} }, { key: "select", value: function select(
		id) {
			if (this.state.selection[id]) {
				delete this.state.selection[id];
				this.setState({
					lastSelect: id });

			} else {
				this.state.selection[id] = true;
				this.setState({
					lastSelect: id });

			}
			this.scrollTo('tab', id);
			var tab = this.state.tabsbyid[id];
			if (this.refs['window' + tab.windowId] && this.refs['window' + tab.windowId].refs['tab' + id]) {
				this.refs['window' + tab.windowId].refs['tab' + id].resolveFavIconUrl();
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
		} }, { key: "selectTo", value: function selectTo(
		id, tabs) {
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
				lastSelect: tabs[rangeIndex2].id });

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
		} }, { key: "drag", value: function drag(
		e, id) {
			if (!this.state.selection[id]) {
				this.state.selection = {};
				this.state.selection[id] = true;
				this.state.lastSelect = id;
			}
			this.forceUpdate();
		} }, { key: "drop", value: function () {var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(
			id, before) {var _this5, tab, tabs, index, i, t;return regeneratorRuntime.wrap(function _callee7$(_context7) {while (1) {switch (_context7.prev = _context7.next) {case 0:
								_this5 = this;
								tab = this.state.tabsbyid[id];
								tabs = Object.keys(this.state.selection).map(function (id) {
									return _this5.state.tabsbyid[id];
								});
								index = tab.index + (before ? 0 : 1);

								i = 0;case 5:if (!(i < tabs.length)) {_context7.next = 14;break;}
								t = tabs[i];_context7.next = 9;return (
									browser.tabs.move(t.id, { windowId: tab.windowId, index: index }));case 9:_context7.next = 11;return (
									browser.tabs.update(t.id, { pinned: t.pinned }));case 11:i++;_context7.next = 5;break;case 14:

								this.setState({
									selection: {} });

								this.update();case 16:case "end":return _context7.stop();}}}, _callee7, this);}));function drop(_x, _x2) {return _ref7.apply(this, arguments);}return drop;}() }, { key: "dropWindow", value: function () {var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(

			windowId) {var _this6, tabs, i, t;return regeneratorRuntime.wrap(function _callee8$(_context8) {while (1) {switch (_context8.prev = _context8.next) {case 0:
								_this6 = this;
								tabs = Object.keys(this.state.selection).map(function (id) {
									return _this6.state.tabsbyid[id];
								});
								i = 0;case 3:if (!(i < tabs.length)) {_context8.next = 12;break;}
								t = tabs[i];_context8.next = 7;return (
									browser.tabs.move(t.id, { windowId: windowId, index: -1 }));case 7:_context8.next = 9;return (
									browser.tabs.update(t.id, { pinned: t.pinned }));case 9:i++;_context8.next = 3;break;case 12:

								this.setState({
									selection: {} });case 13:case "end":return _context8.stop();}}}, _callee8, this);}));function dropWindow(_x3) {return _ref8.apply(this, arguments);}return dropWindow;}() }, { key: "changeTabLimit", value: function changeTabLimit(


		e) {
			this.state.tabLimit = e.target.value;
			localStorage["tabLimit"] = JSON.stringify(this.state.tabLimit);
			this.tabLimitText();
			this.forceUpdate();
		} }, { key: "tabLimitText", value: function tabLimitText()
		{
			this.setState({
				bottomText: "Limit the number of tabs per window. Will move new tabs into a new window instead. 0 to turn off" });

		} }, { key: "changeTabWidth", value: function changeTabWidth(
		e) {
			this.state.tabWidth = e.target.value;
			localStorage["tabWidth"] = JSON.stringify(this.state.tabWidth);
			document.body.style.width = this.state.tabWidth + "px";
			this.tabWidthText();
			this.forceUpdate();
		} }, { key: "tabWidthText", value: function tabWidthText()
		{
			this.setState({
				bottomText: "Change the width of this window. 800 by default." });

		} }, { key: "changeTabHeight", value: function changeTabHeight(
		e) {
			this.state.tabHeight = e.target.value;
			localStorage["tabHeight"] = JSON.stringify(this.state.tabHeight);
			document.body.style.height = this.state.tabHeight + "px";
			this.tabHeightText();
			this.forceUpdate();
		} }, { key: "tabHeightText", value: function tabHeightText()
		{
			this.setState({
				bottomText: "Change the height of this window. 600 by default." });

		} }, { key: "toggleAnimations", value: function toggleAnimations()
		{
			this.state.animations = !this.state.animations;
			localStorage["animations"] = this.state.animations ? "1" : "0";
			this.animationsText();
			this.forceUpdate();
		} }, { key: "animationsText", value: function animationsText()
		{
			this.setState({
				bottomText: "Enables/disables animations. Default : on" });

		} }, { key: "toggleWindowTitles", value: function toggleWindowTitles()
		{
			this.state.windowTitles = !this.state.windowTitles;
			localStorage["windowTitles"] = this.state.windowTitles ? "1" : "0";
			this.windowTitlesText();
			this.forceUpdate();
		} }, { key: "windowTitlesText", value: function windowTitlesText()
		{
			this.setState({
				bottomText: "Enables/disables window titles. Default : on" });

		} }, { key: "toggleCompact", value: function toggleCompact()
		{
			this.state.compact = !this.state.compact;
			localStorage["compact"] = this.state.compact ? "1" : "0";
			this.compactText();
			this.forceUpdate();
		} }, { key: "compactText", value: function compactText()
		{
			this.setState({
				bottomText: "Compact mode is a more compressed layout. Default : off" });

		} }, { key: "toggleDark", value: function toggleDark()
		{
			this.state.dark = !this.state.dark;
			localStorage["dark"] = this.state.dark ? "1" : "0";
			this.darkText();
			if (this.state.dark) {
				document.body.className = "dark";
			} else {
				document.body.className = "";
			}
			this.forceUpdate();
		} }, { key: "darkText", value: function darkText()
		{
			this.setState({
				bottomText: "Dark mode inverts the layout - better on the eyes. Default : off" });

		} }, { key: "toggleTabActions", value: function toggleTabActions()
		{
			this.state.tabactions = !this.state.tabactions;
			localStorage["tabactions"] = this.state.tabactions ? "1" : "0";
			this.tabActionsText();
			this.forceUpdate();
		} }, { key: "tabActionsText", value: function tabActionsText()
		{
			this.setState({
				bottomText: "Adds 'Open a new tab' and 'Close this window' option to each window. Default : on" });

		} }, { key: "toggleBadge", value: function () {var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9() {var backgroundPage;return regeneratorRuntime.wrap(function _callee9$(_context9) {while (1) {switch (_context9.prev = _context9.next) {case 0:

								this.state.badge = !this.state.badge;
								localStorage["badge"] = this.state.badge ? "1" : "0";
								this.badgeText();_context9.next = 5;return (
									browser.runtime.getBackgroundPage());case 5:backgroundPage = _context9.sent;
								backgroundPage.updateTabCount();
								this.forceUpdate();case 8:case "end":return _context9.stop();}}}, _callee9, this);}));function toggleBadge() {return _ref9.apply(this, arguments);}return toggleBadge;}() }, { key: "badgeText", value: function badgeText()

		{
			this.setState({
				bottomText: "Shows the number of open tabs on the Tab Manager icon. Default : on" });

		} }, { key: "toggleOpenInOwnTab", value: function toggleOpenInOwnTab()
		{
			this.state.openInOwnTab = !this.state.openInOwnTab;
			localStorage["openInOwnTab"] = this.state.openInOwnTab ? "1" : "0";
			this.openInOwnTabText();
			browser.runtime.sendMessage({ command: "reload_popup_controls" });
			this.forceUpdate();
		} }, { key: "openInOwnTabText", value: function openInOwnTabText()
		{
			this.setState({
				bottomText: "Open the Tab Manager by default in own tab, or as a popup?" });

		} }, { key: "toggleSessions", value: function toggleSessions()
		{
			this.state.sessionsFeature = !this.state.sessionsFeature;
			localStorage["sessionsFeature"] = this.state.sessionsFeature ? "1" : "0";
			this.sessionsText();
			this.forceUpdate();
		} }, { key: "sessionsText", value: function sessionsText()
		{
			this.setState({
				bottomText: "Allows you to save/restore windows into sessions. ( Tab History will be lost ) Default : off" });

		} }, { key: "exportSessions", value: function exportSessions()
		{
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
		} }, { key: "exportSessionsText", value: function exportSessionsText()
		{
			this.setState({
				bottomText: "Allows you to export your saved windows to an external backup" });

		} }, { key: "importSessions", value: function importSessions(
		evt) {var _this8 = this;
			if (navigator.userAgent.search("Firefox") > -1) {
				if (window.inPopup) {
					window.alert("Due to a Firefox bug session import does not work in the popup. Please use the options screen or open Tab Manager Plus in its' own tab");
					return;
				}
			}
			try {
				var inputField = evt.target; // #session_import
				var files = evt.target.files;
				if (!files.length) {
					alert("No file selected!");
					this.setState({ bottomText: "Error: Could not read the backup file!" });
					return;
				}
				var file = files[0];
				var reader = new FileReader();
				var self = this;
				reader.onload = function () {var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(event) {var backupFile, success, i, newSession, obj, value;return regeneratorRuntime.wrap(function _callee10$(_context10) {while (1) {switch (_context10.prev = _context10.next) {case 0:


										try {
											backupFile = JSON.parse(event.target.result);
										} catch (err) {
											console.error(err);
											window.alert(err);
											_this8.setState({ bottomText: "Error: Could not read the backup file!" });
										} //console.log('FILE CONTENT', event.target.result);
										if (!(!!backupFile && backupFile.length > 0)) {_context10.next = 18;break;}
										success = backupFile.length;
										i = 0;case 4:if (!(i < backupFile.length)) {_context10.next = 15;break;}
										newSession = backupFile[i];if (!(
										newSession.windowsInfo && newSession.tabs && newSession.id)) {_context10.next = 12;break;}
										obj = {};
										obj[newSession.id] = newSession;
										//this.state.sessions.push(obj);
										_context10.next = 11;return browser.storage.local.set(obj).catch(function (err) {
											console.log(err);
											console.error(err.message);
											success--;
										});case 11:value = _context10.sent;case 12:i++;_context10.next = 4;break;case 15:



										_this8.setState({ bottomText: success + " windows successfully restored!" });_context10.next = 19;break;case 18:

										_this8.setState({ bottomText: "Error: Could not restore any windows from the backup file!" });case 19:

										inputField.value = "";
										_this8.sessionSync();case 21:case "end":return _context10.stop();}}}, _callee10, _this8);}));return function (_x4) {return _ref10.apply(this, arguments);};}();

				reader.readAsText(file);
			} catch (err) {
				console.error(err);
				window.alert(err);
			}
			this.importSessionsText();
			this.forceUpdate();
		} }, { key: "importSessionsText", value: function importSessionsText()
		{
			this.setState({
				bottomText: "Allows you to restore your saved windows from an external backup" });

		} }, { key: "toggleHide", value: function () {var _ref11 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11() {var granted;return regeneratorRuntime.wrap(function _callee11$(_context11) {while (1) {switch (_context11.prev = _context11.next) {case 0:_context11.next = 2;return (

									browser.permissions.request({ permissions: ["system.display"] }));case 2:granted = _context11.sent;
								if (granted) {
									this.state.hideWindows = !this.state.hideWindows;
								} else {
									this.state.hideWindows = false;
								}
								localStorage["hideWindows"] = this.state.hideWindows ? "1" : "0";
								this.hideText();
								this.forceUpdate();case 7:case "end":return _context11.stop();}}}, _callee11, this);}));function toggleHide() {return _ref11.apply(this, arguments);}return toggleHide;}() }, { key: "hideText", value: function hideText()

		{
			this.setState({
				bottomText: "Automatically minimizes inactive chrome windows. Default : off" });

		} }, { key: "toggleFilterMismatchedTabs", value: function toggleFilterMismatchedTabs()
		{
			this.state.filterTabs = !this.state.filterTabs;
			localStorage["filter-tabs"] = this.state.filterTabs ? "1" : "0";
			this.forceUpdate();
		} }, { key: "getTip", value: function getTip()
		{
			var tips = [
			"You can right click on a tab to select it",
			"Press enter to move all selected tabs to a new window",
			"Middle click to close a tab",
			"Tab Manager Plus loves saving time",
			"To see incognito tabs, enable incognito access in the extension settings",
			"You can drag and drop tabs to other windows",
			"You can type to search right away",
			"You can search for different tabs : google OR yahoo"];


			return "Tip: " + tips[Math.floor(Math.random() * tips.length)];
		} }, { key: "toBoolean", value: function toBoolean(
		str) {
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
						return true;}

			} else if (typeof str === "number") {
				return str !== 0;
			} else {
				return true;
			}
		} }, { key: "localStorageAvailable", value: function localStorageAvailable()
		{
			var test = "test";
			try {
				localStorage.setItem(test, test);
				localStorage.removeItem(test);
				return true;
			} catch (e) {
				return false;
			}
		} }, { key: "isInViewport", value: function isInViewport(
		element, ofElement) {
			var rect = element.getBoundingClientRect();
			return rect.top >= 0 && rect.left >= 0 && rect.bottom <= ofElement.height && rect.right <= ofElement.width;
		} }, { key: "elVisible", value: function elVisible(
		elem) {
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
		} }]);return TabManager;}(React.Component);


function debounce(func, wait, immediate) {
	var timeout;
	return function () {
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

var maybePluralize = function maybePluralize(count, noun) {var suffix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 's';return (
		count + " " + noun + (count !== 1 ? suffix : ''));};