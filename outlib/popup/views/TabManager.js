"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var browser = browser || chrome;

var TabManager = function (_React$Component) {
	_inherits(TabManager, _React$Component);

	function TabManager(props) {
		_classCallCheck(this, TabManager);

		var _this7 = _possibleConstructorReturn(this, (TabManager.__proto__ || Object.getPrototypeOf(TabManager)).call(this, props));

		if (navigator.userAgent.search("Firefox") > -1) {} else {
			var check = browser.permissions.contains({ permissions: ["system.display"] });
			check.then(function (result) {
				if (result) {} else {
					setLocalStorage("hideWindows", false);
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
			dragFavicon: "",
			colorsActive: false
		};

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
		_this7.windowTitlesText = _this7.windowTitlesText.bind(_this7);

		return _this7;
	}

	_createClass(TabManager, [{
		key: "UNSAFE_componentWillMount",
		value: function UNSAFE_componentWillMount() {
			this.update();
		}
	}, {
		key: "loadStorage",
		value: function () {
			var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
				var layout, animations, windowTitles, compact, dark, tabactions, badge, sessionsFeature, hideWindows, filterTabs, tabLimit, openInOwnTab, tabWidth, tabHeight, storage;
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								layout = "blocks";
								animations = true;
								windowTitles = true;
								compact = false;
								dark = false;
								tabactions = true;
								badge = true;
								sessionsFeature = false;
								hideWindows = false;
								filterTabs = false;
								tabLimit = 0;
								openInOwnTab = false;
								tabWidth = 800;
								tabHeight = 600;
								_context.next = 16;
								return browser.storage.local.get(null);

							case 16:
								storage = _context.sent;


								if (!storage["layout"]) storage["layout"] = "blocks";
								if (typeof storage["tabLimit"] === "undefined") storage["tabLimit"] = 0;
								if (typeof storage["tabWidth"] === "undefined") storage["tabWidth"] = 800;
								if (typeof storage["tabHeight"] === "undefined") storage["tabHeight"] = 600;

								if (typeof storage["animations"] === "undefined") storage["animations"] = true;
								if (typeof storage["windowTitles"] === "undefined") storage["windowTitles"] = true;
								if (typeof storage["tabactions"] === "undefined") storage["tabactions"] = true;
								if (typeof storage["badge"] === "undefined") storage["badge"] = true;

								if (typeof storage["openInOwnTab"] === "undefined") storage["openInOwnTab"] = false;
								if (typeof storage["compact"] === "undefined") storage["compact"] = false;
								if (typeof storage["dark"] === "undefined") storage["dark"] = false;
								if (typeof storage["sessionsFeature"] === "undefined") storage["sessionsFeature"] = false;
								if (typeof storage["hideWindows"] === "undefined") storage["hideWindows"] = false;
								if (typeof storage["filter-tabs"] === "undefined") storage["filter-tabs"] = false;

								if (typeof storage["version"] === "undefined") storage["version"] = "5.3.1";

								layout = storage["layout"];
								tabLimit = storage["tabLimit"];
								tabWidth = storage["tabWidth"];
								tabHeight = storage["tabHeight"];
								openInOwnTab = storage["openInOwnTab"];
								animations = storage["animations"];
								windowTitles = storage["windowTitles"];
								compact = storage["compact"];
								dark = storage["dark"];
								tabactions = storage["tabactions"];
								badge = storage["badge"];
								sessionsFeature = storage["sessionsFeature"];
								hideWindows = storage["hideWindows"];
								filterTabs = storage["filter-tabs"];

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

							case 48:
							case "end":
								return _context.stop();
						}
					}
				}, _callee, this);
			}));

			function loadStorage() {
				return _ref.apply(this, arguments);
			}

			return loadStorage;
		}()
	}, {
		key: "hoverHandler",
		value: function hoverHandler(tab) {
			this.setState({ topText: tab.title || "" });
			this.setState({ bottomText: tab.url || "" });

			clearTimeout(this.state.resetTimeout);
			this.state.resetTimeout = setTimeout(function () {
				this.setState({ topText: "", bottomText: "" });
				this.update();
			}.bind(this), 15000);
		}
	}, {
		key: "hoverIcon",
		value: function hoverIcon(e) {
			if (e && e.nativeEvent) {
				e.nativeEvent.preventDefault();
				e.nativeEvent.stopPropagation();
			}

			var text = "";
			if (e && e.target && !!e.target.title) {
				text = e.target.title;
			} else if (typeof e == "string") {
				text = e;
			}
			var bottom = " ";
			if (text.indexOf("\n") > -1) {
				var a = text.split("\n");
				text = a[0];
				bottom = a[1];
			}
			this.setState({ topText: text });
			this.setState({ bottomText: bottom });

			this.forceUpdate();
		}
	}, {
		key: "render",
		value: function render() {
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

				if (haveSess && this.state.filterTabs) {
					if (this.state.searchLen > 0 || Object.keys(this.state.hiddenTabs).length > 0) {
						haveSess = false;
					}
				}
			}

			return React.createElement(
				"div",
				{
					id: "root",
					className: (this.state.compact ? "compact" : "") + " " + (this.state.animations ? "animations" : "no-animations") + " " + (this.state.windowTitles ? "windowTitles" : "no-windowTitles"),
					onKeyDown: this.checkKey,
					ref: "root",
					tabIndex: 0
				},
				!this.state.optionsActive && React.createElement(
					"div",
					{ className: "window-container " + this.state.layout, ref: "windowcontainer", tabIndex: 2 },
					this.state.windows.map(function (window) {
						if (window.state == "minimized") return;
						if (!!this.state.colorsActive && this.state.colorsActive !== window.id) return;
						return React.createElement(Window, {
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
							draggable: true,
							drag: _this.drag.bind(_this),
							drop: _this.drop.bind(_this),
							dropWindow: _this.dropWindow.bind(_this),
							windowTitles: _this.state.windowTitles,
							lastOpenWindow: _this.state.lastOpenWindow,
							dragFavicon: _this.dragFavicon.bind(_this),
							ref: "window" + window.id
						});
					}.bind(this)),
					React.createElement(
						"div",
						{ className: "hrCont " + (!haveMin ? "hidden" : "") },
						React.createElement(
							"div",
							{ className: "hrDiv" },
							React.createElement(
								"span",
								{ className: "hrSpan" },
								"Minimized windows"
							)
						)
					),
					this.state.windows.map(function (window) {
						if (window.state !== "minimized") return;
						if (!!this.state.colorsActive && this.state.colorsActive !== window.id) return;
						return React.createElement(Window, {
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
							draggable: true,
							drag: _this.drag.bind(_this),
							drop: _this.drop.bind(_this),
							dropWindow: _this.dropWindow.bind(_this),
							windowTitles: _this.state.windowTitles,
							lastOpenWindow: _this.state.lastOpenWindow,
							dragFavicon: _this.dragFavicon.bind(_this),
							ref: "window" + window.id
						});
					}.bind(this)),
					React.createElement(
						"div",
						{ className: "hrCont " + (!haveSess ? "hidden" : "") },
						React.createElement(
							"div",
							{ className: "hrDiv" },
							React.createElement(
								"span",
								{ className: "hrSpan" },
								"Saved windows"
							)
						)
					),
					haveSess ? this.state.sessions.map(function (window) {
						if (!!this.state.colorsActive && this.state.colorsActive !== window.id) return;
						return React.createElement(Session, {
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
							ref: "session" + window.id
						});
					}.bind(this)) : false
				),
				this.state.optionsActive && React.createElement(
					"div",
					{ className: "options-container", ref: "options-container" },
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
						getTip: this.getTip
					})
				),
				React.createElement(
					"div",
					{ className: "window top", ref: "tophover" },
					React.createElement("div", { className: "icon windowaction donate", title: "Donate a Coffee", onClick: this.donate, onMouseEnter: this.hoverIcon }),
					React.createElement("div", {
						className: "icon windowaction rate",
						title: "Rate Tab Manager Plus",
						onClick: this.rateExtension,
						onMouseEnter: this.hoverIcon
					}),
					React.createElement("div", { className: "icon windowaction options", title: "Options", onClick: this.toggleOptions, onMouseEnter: this.hoverIcon }),
					React.createElement("input", {
						type: "text",
						disabled: true,
						className: "tabtitle",
						ref: "topbox",
						placeholder: maybePluralize(tabCount, 'tab') + " in " + this.state.windows.length + " windows",
						value: this.state.topText
					}),
					React.createElement("input", { type: "text", disabled: true, className: "taburl", ref: "topboxurl", placeholder: this.getTip(), value: this.state.bottomText })
				),
				!this.state.optionsActive && !this.state.colorsActive && React.createElement(
					"div",
					{ className: "window searchbox" },
					React.createElement(
						"table",
						null,
						React.createElement(
							"tbody",
							null,
							React.createElement(
								"tr",
								null,
								React.createElement(
									"td",
									{ className: "one" },
									React.createElement("input", { className: "searchBoxInput", type: "text", placeholder: "Start typing to search tabs...", tabIndex: "1", onChange: this.search, ref: "searchbox" })
								),
								React.createElement(
									"td",
									{ className: "two" },
									React.createElement("div", {
										className: "icon windowaction " + this.state.layout + "-view",
										title: "Change to " + this.readablelayout(this.nextlayout()) + " View",
										onClick: this.changelayout,
										onMouseEnter: this.hoverIcon
									}),
									React.createElement("div", {
										className: "icon windowaction trash",
										title: Object.keys(this.state.selection).length > 0 ? "Close selected tabs\nWill close " + maybePluralize(Object.keys(this.state.selection).length, 'tab') : "Close current Tab",
										onClick: this.deleteTabs,
										onMouseEnter: this.hoverIcon
									}),
									React.createElement("div", {
										className: "icon windowaction discard",
										title: Object.keys(this.state.selection).length > 0 ? "Discard selected tabs\nWill discard " + maybePluralize(Object.keys(this.state.selection).length, 'tab') + " - freeing memory" : "Select tabs to discard them and free memory",
										style: Object.keys(this.state.selection).length > 0 ? {} : { opacity: 0.25 },
										onClick: this.discardTabs,
										onMouseEnter: this.hoverIcon
									}),
									React.createElement("div", {
										className: "icon windowaction pin",
										title: Object.keys(this.state.selection).length > 0 ? "Pin selected tabs\nWill pin " + maybePluralize(Object.keys(this.state.selection).length, 'tab') : "Pin current Tab",
										onClick: this.pinTabs,
										onMouseEnter: this.hoverIcon
									}),
									React.createElement("div", {
										className: "icon windowaction filter" + (this.state.filterTabs ? " enabled" : ""),
										title: (this.state.filterTabs ? "Turn off hiding of" : "Hide") + " tabs that do not match search" + (this.state.searchLen > 0 ? "\n" + (this.state.filterTabs ? "Will reveal " : "Will hide ") + maybePluralize(Object.keys(this.state.tabsbyid).length - Object.keys(this.state.selection).length, 'tab') : ""),
										onClick: this.toggleFilterMismatchedTabs,
										onMouseEnter: this.hoverIcon
									}),
									React.createElement("div", {
										className: "icon windowaction new",
										title: Object.keys(this.state.selection).length > 0 ? "Move tabs to new window\nWill move " + maybePluralize(Object.keys(this.state.selection).length, 'selected tab') + " to it" : "Open new empty window",
										onClick: this.addWindow,
										onMouseEnter: this.hoverIcon
									}),
									React.createElement("div", {
										className: "icon windowaction duplicates" + (this.state.dupTabs ? " enabled" : ""),
										title: "Highlight Duplicates",
										onClick: this.highlightDuplicates,
										onMouseEnter: this.hoverIcon
									})
								)
							)
						)
					)
				),
				React.createElement("div", { className: "window placeholder" })
			);
		}
	}, {
		key: "componentDidMount",
		value: function () {
			var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
				var _this, runUpdate, runTabUpdate;

				return regeneratorRuntime.wrap(function _callee3$(_context3) {
					while (1) {
						switch (_context3.prev = _context3.next) {
							case 0:
								_context3.next = 2;
								return this.loadStorage();

							case 2:
								_this = this;
								runUpdate = debounce(this.update, 250);

								runUpdate = runUpdate.bind(this);

								runTabUpdate = function runTabUpdate(tabid, changeinfo, tab) {
									if (!!_this.refs["window" + tab.windowId]) {
										var window = _this.refs["window" + tab.windowId];
										if (!!window.refs["tab" + tabid]) {
											var tab = window.refs["tab" + tabid];
											tab.checkSettings();
										}
									}
								};

								browser.tabs.onCreated.addListener(runUpdate);
								browser.tabs.onUpdated.addListener(runUpdate);
								browser.tabs.onUpdated.addListener(runTabUpdate);
								browser.tabs.onMoved.addListener(runUpdate);
								browser.tabs.onRemoved.addListener(runUpdate);
								browser.tabs.onReplaced.addListener(runUpdate);
								browser.tabs.onDetached.addListener(runUpdate);
								browser.tabs.onAttached.addListener(runUpdate);
								browser.tabs.onActivated.addListener(runUpdate);
								browser.windows.onFocusChanged.addListener(runUpdate);
								browser.windows.onCreated.addListener(runUpdate);
								browser.windows.onRemoved.addListener(runUpdate);

								browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
									console.log(request.command);
									switch (request.command) {
										case "refresh_windows":
											var _iteratorNormalCompletion = true;
											var _didIteratorError = false;
											var _iteratorError = undefined;

											try {
												for (var _iterator = request.window_ids[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
													var window_id = _step.value;

													if (!_this.refs["window" + window_id]) continue;
													_this.refs["window" + window_id].checkSettings();
												}
											} catch (err) {
												_didIteratorError = true;
												_iteratorError = err;
											} finally {
												try {
													if (!_iteratorNormalCompletion && _iterator.return) {
														_iterator.return();
													}
												} finally {
													if (_didIteratorError) {
														throw _iteratorError;
													}
												}
											}

											break;
									}
								});

								browser.storage.onChanged.addListener(this.sessionSync);

								this.sessionSync();

								this.refs.root.focus();
								this.focusRoot();

								_this = this;


								setTimeout(_asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
									var scrollArea, activeWindow, activeTab, animations;
									return regeneratorRuntime.wrap(function _callee2$(_context2) {
										while (1) {
											switch (_context2.prev = _context2.next) {
												case 0:
													scrollArea = document.getElementsByClassName("window-container")[0];
													activeWindow = document.getElementsByClassName("activeWindow");

													if (!(!!activeWindow && activeWindow.length > 0)) {
														_context2.next = 12;
														break;
													}

													activeTab = activeWindow[0].getElementsByClassName("highlighted");

													if (!(!!activeTab && activeTab.length > 0)) {
														_context2.next = 12;
														break;
													}

													if (!(!!scrollArea && scrollArea.scrollTop > 0)) {
														_context2.next = 8;
														break;
													}

													_context2.next = 12;
													break;

												case 8:
													_context2.next = 10;
													return getLocalStorage("animations", false);

												case 10:
													animations = _context2.sent;

													activeTab[0].scrollIntoView({ behavior: animations ? "smooth" : "instant", block: "center", inline: "nearest" });

												case 12:
												case "end":
													return _context2.stop();
											}
										}
									}, _callee2, this);
								})), 250);

							case 25:
							case "end":
								return _context3.stop();
						}
					}
				}, _callee3, this);
			}));

			function componentDidMount() {
				return _ref2.apply(this, arguments);
			}

			return componentDidMount;
		}()
	}, {
		key: "sessionSync",
		value: function () {
			var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
				var values, sessions, key, sess;
				return regeneratorRuntime.wrap(function _callee4$(_context4) {
					while (1) {
						switch (_context4.prev = _context4.next) {
							case 0:
								_context4.next = 2;
								return getLocalStorage('sessions', {});

							case 2:
								values = _context4.sent;
								sessions = [];

								for (key in values) {
									sess = values[key];

									if (sess.id && sess.tabs && sess.windowsInfo) {
										sessions.push(values[key]);
									}
								}
								this.state.sessions = sessions;
								this.update();

							case 7:
							case "end":
								return _context4.stop();
						}
					}
				}, _callee4, this);
			}));

			function sessionSync() {
				return _ref4.apply(this, arguments);
			}

			return sessionSync;
		}()
	}, {
		key: "focusRoot",
		value: function focusRoot() {
			this.state.focusUpdates++;
			setTimeout(function () {
				if (document.activeElement == document.body) {
					this.refs.root.focus();
					this.forceUpdate();
					if (this.state.focusUpdates < 5) this.focusRoot();
				}
			}.bind(this), 500);
		}
	}, {
		key: "dragFavicon",
		value: function dragFavicon(val) {
			if (!val) {
				return this.state.dragFavicon;
			} else {
				this.state.dragFavicon = val;
			}
		}
	}, {
		key: "rateExtension",
		value: function rateExtension() {
			if (navigator.userAgent.search("Firefox") > -1) {
				browser.tabs.create({ url: "https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/" });
			} else {
				browser.tabs.create({ url: "https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff" });
			}
			this.forceUpdate();
		}
	}, {
		key: "donate",
		value: function donate() {
			browser.tabs.create({ url: "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW" });
			this.forceUpdate();
		}
	}, {
		key: "toggleOptions",
		value: function toggleOptions() {
			this.state.optionsActive = !this.state.optionsActive;
			this.forceUpdate();
		}
	}, {
		key: "toggleColors",
		value: function toggleColors(active, windowId) {
			if (!!active) {
				this.state.colorsActive = windowId;
			} else {
				this.state.colorsActive = false;
			}
			console.log("colorsActive", active, windowId, this.state.colorsActive);
			this.forceUpdate();
		}
	}, {
		key: "update",
		value: function () {
			var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
				var windows, sort_windows, tabCount, i, window, j, tab, id;
				return regeneratorRuntime.wrap(function _callee5$(_context5) {
					while (1) {
						switch (_context5.prev = _context5.next) {
							case 0:
								_context5.next = 2;
								return browser.windows.getAll({ populate: true });

							case 2:
								windows = _context5.sent;
								_context5.next = 5;
								return getLocalStorage("windowAge", []);

							case 5:
								sort_windows = _context5.sent;


								windows.sort(function (a, b) {
									var aSort = sort_windows.indexOf(a.id);
									var bSort = sort_windows.indexOf(b.id);
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
									tabCount: tabCount
								});

							case 16:
							case "end":
								return _context5.stop();
						}
					}
				}, _callee5, this);
			}));

			function update() {
				return _ref5.apply(this, arguments);
			}

			return update;
		}()
	}, {
		key: "deleteTabs",
		value: function () {
			var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
				var _this2, tabs, t;

				return regeneratorRuntime.wrap(function _callee6$(_context6) {
					while (1) {
						switch (_context6.prev = _context6.next) {
							case 0:
								_this2 = this;
								tabs = Object.keys(this.state.selection).map(function (id) {
									return _this2.state.tabsbyid[id];
								});

								if (!tabs.length) {
									_context6.next = 6;
									break;
								}

								browser.runtime.sendMessage({ command: "close_tabs", tabs: tabs });
								_context6.next = 12;
								break;

							case 6:
								_context6.next = 8;
								return browser.tabs.query({ currentWindow: true, active: true });

							case 8:
								t = _context6.sent;

								if (!(t && t.length > 0)) {
									_context6.next = 12;
									break;
								}

								_context6.next = 12;
								return browser.tabs.remove(t[0].id);

							case 12:
								this.forceUpdate();

							case 13:
							case "end":
								return _context6.stop();
						}
					}
				}, _callee6, this);
			}));

			function deleteTabs() {
				return _ref6.apply(this, arguments);
			}

			return deleteTabs;
		}()
	}, {
		key: "deleteTab",
		value: function deleteTab(tabId) {
			browser.tabs.remove(tabId);
		}
	}, {
		key: "discardTabs",
		value: function () {
			var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee7() {
				var _this2, tabs;

				return regeneratorRuntime.wrap(function _callee7$(_context7) {
					while (1) {
						switch (_context7.prev = _context7.next) {
							case 0:
								_this2 = this;
								tabs = Object.keys(this.state.selection).map(function (id) {
									return _this2.state.tabsbyid[id];
								});

								if (tabs.length) {
									browser.runtime.sendMessage({ command: "discard_tabs", tabs: tabs });
								}
								this.clearSelection();

							case 4:
							case "end":
								return _context7.stop();
						}
					}
				}, _callee7, this);
			}));

			function discardTabs() {
				return _ref7.apply(this, arguments);
			}

			return discardTabs;
		}()
	}, {
		key: "discardTab",
		value: function discardTab(tabId) {
			browser.tabs.discard(tabId);
		}
	}, {
		key: "addWindow",
		value: function () {
			var _ref8 = _asyncToGenerator(regeneratorRuntime.mark(function _callee8() {
				var _this3, count, tabs;

				return regeneratorRuntime.wrap(function _callee8$(_context8) {
					while (1) {
						switch (_context8.prev = _context8.next) {
							case 0:
								_this3 = this;
								count = Object.keys(this.state.selection).length;
								tabs = Object.keys(this.state.selection).map(function (id) {
									return _this3.state.tabsbyid[id];
								});

								if (!(count == 0)) {
									_context8.next = 8;
									break;
								}

								_context8.next = 6;
								return browser.windows.create({});

							case 6:
								_context8.next = 9;
								break;

							case 8:
								if (count == 1) {
									if (navigator.userAgent.search("Firefox") > -1) {
										browser.runtime.sendMessage({ command: "focus_on_tab_and_window_delayed", tab: tabs[0] });
									} else {
										browser.runtime.sendMessage({ command: "focus_on_tab_and_window", tab: tabs[0] });
									}
								} else {
									browser.runtime.sendMessage({ command: "create_window_with_tabs", tabs: tabs });
								}

							case 9:
								if (!!window.inPopup) window.close();

							case 10:
							case "end":
								return _context8.stop();
						}
					}
				}, _callee8, this);
			}));

			function addWindow() {
				return _ref8.apply(this, arguments);
			}

			return addWindow;
		}()
	}, {
		key: "pinTabs",
		value: function () {
			var _ref9 = _asyncToGenerator(regeneratorRuntime.mark(function _callee9() {
				var _this4, tabs, i, t;

				return regeneratorRuntime.wrap(function _callee9$(_context9) {
					while (1) {
						switch (_context9.prev = _context9.next) {
							case 0:
								_this4 = this;
								tabs = Object.keys(this.state.selection).map(function (id) {
									return _this4.state.tabsbyid[id];
								}).sort(function (a, b) {
									return a.index - b.index;
								});

								if (!tabs.length) {
									_context9.next = 13;
									break;
								}

								if (tabs[0].pinned) tabs.reverse();
								i = 0;

							case 5:
								if (!(i < tabs.length)) {
									_context9.next = 11;
									break;
								}

								_context9.next = 8;
								return browser.tabs.update(tabs[i].id, { pinned: !tabs[0].pinned });

							case 8:
								i++;
								_context9.next = 5;
								break;

							case 11:
								_context9.next = 19;
								break;

							case 13:
								_context9.next = 15;
								return browser.tabs.query({ currentWindow: true, active: true });

							case 15:
								t = _context9.sent;

								if (!(t && t.length > 0)) {
									_context9.next = 19;
									break;
								}

								_context9.next = 19;
								return browser.tabs.update(t[0].id, { pinned: !t[0].pinned });

							case 19:
							case "end":
								return _context9.stop();
						}
					}
				}, _callee9, this);
			}));

			function pinTabs() {
				return _ref9.apply(this, arguments);
			}

			return pinTabs;
		}()
	}, {
		key: "highlightDuplicates",
		value: function highlightDuplicates(e) {
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
	}, {
		key: "search",
		value: function search(e) {
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
				searchTerms = searchTerms.filter(function (entry) {
					return entry.trim() != '';
				});
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
					var tabSearchTerm;
					if (!!tab.title) tabSearchTerm = tab.title;
					if (!!tab.url) tabSearchTerm += " " + tab.url;
					tabSearchTerm = tabSearchTerm.toLowerCase();
					var match = false;
					if (searchType == "normal") {
						match = tabSearchTerm.indexOf(e.target.value.toLowerCase()) >= 0;
					} else if (searchType == "OR") {
						var _iteratorNormalCompletion2 = true;
						var _didIteratorError2 = false;
						var _iteratorError2 = undefined;

						try {
							for (var _iterator2 = searchTerms[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
								var searchOR = _step2.value;

								searchOR = searchOR.trim().toLowerCase();
								if (tabSearchTerm.indexOf(searchOR) >= 0) {
									match = true;
									break;
								}
							}
						} catch (err) {
							_didIteratorError2 = true;
							_iteratorError2 = err;
						} finally {
							try {
								if (!_iteratorNormalCompletion2 && _iterator2.return) {
									_iterator2.return();
								}
							} finally {
								if (_didIteratorError2) {
									throw _iteratorError2;
								}
							}
						}
					} else if (searchType == "AND") {
						var andMatch = true;
						var _iteratorNormalCompletion3 = true;
						var _didIteratorError3 = false;
						var _iteratorError3 = undefined;

						try {
							for (var _iterator3 = searchTerms[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
								var searchAND = _step3.value;

								searchAND = searchAND.trim().toLowerCase();
								if (tabSearchTerm.indexOf(searchAND) >= 0) {} else {
									andMatch = false;
									break;
								}
							}
						} catch (err) {
							_didIteratorError3 = true;
							_iteratorError3 = err;
						} finally {
							try {
								if (!_iteratorNormalCompletion3 && _iterator3.return) {
									_iterator3.return();
								}
							} finally {
								if (_didIteratorError3) {
									throw _iteratorError3;
								}
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
					topText: "No matches for '" + searchQuery + "'",
					bottomText: ""
				});
			} else if (matches == 0) {
				this.setState({
					topText: "",
					bottomText: ""
				});
			} else if (matches > 1) {
				this.setState({
					topText: Object.keys(this.state.selection).length + " matches for '" + searchQuery + "'",
					bottomText: "Press enter to move them to a new window"
				});
			} else if (matches == 1) {
				this.setState({
					topText: Object.keys(this.state.selection).length + " match for '" + searchQuery + "'",
					bottomText: "Press enter to switch to the tab"
				});
			}
			this.forceUpdate();
		}
	}, {
		key: "clearSelection",
		value: function clearSelection() {
			this.state.selection = {};
			this.setState({
				lastSelect: false
			});
		}
	}, {
		key: "checkKey",
		value: function checkKey(e) {
			if (e.keyCode == 13) this.addWindow();

			if (e.keyCode == 27) {
				if (this.state.searchLen > 0 || Object.keys(this.state.selection).length > 0) {
					e.nativeEvent.preventDefault();
					e.nativeEvent.stopPropagation();
				}
				this.state.hiddenTabs = {};
				this.state.searchLen = 0;
				this.refs.searchbox.value = "";
				this.clearSelection();
			}

			if (e.keyCode >= 48 && e.keyCode <= 57 || e.keyCode >= 65 && e.keyCode <= 90 || e.keyCode >= 186 && e.keyCode <= 192 || e.keyCode >= 219 && e.keyCode <= 22 || e.keyCode == 8 || e.keyCode == 46 || e.keyCode == 32) {
				if (document.activeElement != this.refs.searchbox) {
					if (document.activeElement.type != "text" && document.activeElement.type != "input") {
						this.refs.searchbox.focus();
					}
				}
			}

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
						if (!altKey && selectedTabs.length > 1) {} else {
							var found = false;
							var selectedNext = false;
							var selectedTab = false;
							var first = false;
							var prev = false;
							var last = false;
							if (selectedTabs.length == 1) {
								selectedTab = selectedTabs[0];
							} else if (selectedTabs.length > 1) {
								if (this.state.lastSelect) {
									selectedTab = this.state.lastSelect;
								} else {
									selectedTab = selectedTabs[0];
								}
							} else if (selectedTabs.length == 0 && this.state.lastSelect) {
								selectedTab = this.state.lastSelect;
							}
							if (this.state.lastDirection) {
								if (goRight && this.state.lastDirection == "goRight") {} else if (goLeft && this.state.lastDirection == "goLeft") {} else if (selectedTabs.length > 1) {
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
							var _iteratorNormalCompletion4 = true;
							var _didIteratorError4 = false;
							var _iteratorError4 = undefined;

							try {
								for (var _iterator4 = this.state.windows[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
									var _w = _step4.value;

									if (found) break;
									if (_w.state != "minimized") {
										var _iteratorNormalCompletion6 = true;
										var _didIteratorError6 = false;
										var _iteratorError6 = undefined;

										try {
											for (var _iterator6 = _w.tabs[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
												var _t = _step6.value;

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
											}
										} catch (err) {
											_didIteratorError6 = true;
											_iteratorError6 = err;
										} finally {
											try {
												if (!_iteratorNormalCompletion6 && _iterator6.return) {
													_iterator6.return();
												}
											} finally {
												if (_didIteratorError6) {
													throw _iteratorError6;
												}
											}
										}
									}
								}
							} catch (err) {
								_didIteratorError4 = true;
								_iteratorError4 = err;
							} finally {
								try {
									if (!_iteratorNormalCompletion4 && _iterator4.return) {
										_iterator4.return();
									}
								} finally {
									if (_didIteratorError4) {
										throw _iteratorError4;
									}
								}
							}

							var _iteratorNormalCompletion5 = true;
							var _didIteratorError5 = false;
							var _iteratorError5 = undefined;

							try {
								for (var _iterator5 = this.state.windows[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
									var _w = _step5.value;

									if (found) break;
									if (_w.state == "minimized") {
										var _iteratorNormalCompletion7 = true;
										var _didIteratorError7 = false;
										var _iteratorError7 = undefined;

										try {
											for (var _iterator7 = _w.tabs[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
												var _t = _step7.value;

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
											}
										} catch (err) {
											_didIteratorError7 = true;
											_iteratorError7 = err;
										} finally {
											try {
												if (!_iteratorNormalCompletion7 && _iterator7.return) {
													_iterator7.return();
												}
											} finally {
												if (_didIteratorError7) {
													throw _iteratorError7;
												}
											}
										}
									}
								}
							} catch (err) {
								_didIteratorError5 = true;
								_iteratorError5 = err;
							} finally {
								try {
									if (!_iteratorNormalCompletion5 && _iterator5.return) {
										_iterator5.return();
									}
								} finally {
									if (_didIteratorError5) {
										throw _iteratorError5;
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
						if (selectedTabs.length > 1) {} else {
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
							}
							var _iteratorNormalCompletion8 = true;
							var _didIteratorError8 = false;
							var _iteratorError8 = undefined;

							try {
								for (var _iterator8 = this.state.windows[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
									var _w = _step8.value;

									i = 0;
									if (found) break;
									if (_w.state != "minimized") {
										if (!first) first = _w.id;
										var _iteratorNormalCompletion10 = true;
										var _didIteratorError10 = false;
										var _iteratorError10 = undefined;

										try {
											for (var _iterator10 = _w.tabs[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
												var _t = _step10.value;

												i++;
												last = _w.id;
												if (!selectedTab) {
													this.selectWindowTab(_w.id, tabPosition);
													found = true;
													break;
												} else if (selectedTab == _t.id) {
													tabPosition = i;

													if (goDown) {
														selectedNext = true;
														break;
													} else if (prev) {
														this.selectWindowTab(prev, tabPosition);
														found = true;
														break;
													}
												} else if (selectedNext) {
													this.selectWindowTab(_w.id, tabPosition);
													found = true;
													break;
												}
											}
										} catch (err) {
											_didIteratorError10 = true;
											_iteratorError10 = err;
										} finally {
											try {
												if (!_iteratorNormalCompletion10 && _iterator10.return) {
													_iterator10.return();
												}
											} finally {
												if (_didIteratorError10) {
													throw _iteratorError10;
												}
											}
										}

										prev = _w.id;
									}
								}
							} catch (err) {
								_didIteratorError8 = true;
								_iteratorError8 = err;
							} finally {
								try {
									if (!_iteratorNormalCompletion8 && _iterator8.return) {
										_iterator8.return();
									}
								} finally {
									if (_didIteratorError8) {
										throw _iteratorError8;
									}
								}
							}

							var _iteratorNormalCompletion9 = true;
							var _didIteratorError9 = false;
							var _iteratorError9 = undefined;

							try {
								for (var _iterator9 = this.state.windows[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
									var _w = _step9.value;

									i = 0;
									if (found) break;
									if (_w.state == "minimized") {
										if (!first) first = _w.id;
										var _iteratorNormalCompletion11 = true;
										var _didIteratorError11 = false;
										var _iteratorError11 = undefined;

										try {
											for (var _iterator11 = _w.tabs[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
												var _t = _step11.value;

												i++;
												last = _w.id;
												if (!selectedTab) {
													this.selectWindowTab(_w.id, tabPosition);
													found = true;
													break;
												} else if (selectedTab == _t.id) {
													tabPosition = i;

													if (goDown) {
														selectedNext = true;
														break;
													} else if (prev) {
														this.selectWindowTab(prev, tabPosition);
														found = true;
														break;
													}
												} else if (selectedNext) {
													this.selectWindowTab(_w.id, tabPosition);
													found = true;
													break;
												}
											}
										} catch (err) {
											_didIteratorError11 = true;
											_iteratorError11 = err;
										} finally {
											try {
												if (!_iteratorNormalCompletion11 && _iterator11.return) {
													_iterator11.return();
												}
											} finally {
												if (_didIteratorError11) {
													throw _iteratorError11;
												}
											}
										}

										prev = _w.id;
									}
								}
							} catch (err) {
								_didIteratorError9 = true;
								_iteratorError9 = err;
							} finally {
								try {
									if (!_iteratorNormalCompletion9 && _iterator9.return) {
										_iterator9.return();
									}
								} finally {
									if (_didIteratorError9) {
										throw _iteratorError9;
									}
								}
							}

							if (!found && goDown && first) {
								this.state.selection = {};
								this.selectWindowTab(first, tabPosition);
								found = true;
							}

							if (!found && goUp && last) {
								this.state.selection = {};
								this.selectWindowTab(last, tabPosition);
								found = true;
							}
						}
					}
				}
			}

			if (e.keyCode == 33 || e.keyCode == 34) {
				if (document.activeElement != this.refs.windowcontainer) {
					this.refs.windowcontainer.focus();
				}
			}
		}
	}, {
		key: "selectWindowTab",
		value: function selectWindowTab(windowId, tabPosition) {
			if (!tabPosition || tabPosition < 1) tabPosition = 1;
			var _iteratorNormalCompletion12 = true;
			var _didIteratorError12 = false;
			var _iteratorError12 = undefined;

			try {
				for (var _iterator12 = this.state.windows[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
					var _w = _step12.value;

					if (_w.id != windowId) continue;
					var i = 0;
					var _iteratorNormalCompletion13 = true;
					var _didIteratorError13 = false;
					var _iteratorError13 = undefined;

					try {
						for (var _iterator13 = _w.tabs[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
							var _t = _step13.value;

							i++;
							if (_w.tabs.length >= tabPosition && tabPosition == i || _w.tabs.length < tabPosition && _w.tabs.length == i) {
								this.state.selection = {};
								this.select(_t.id);
							}
						}
					} catch (err) {
						_didIteratorError13 = true;
						_iteratorError13 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion13 && _iterator13.return) {
								_iterator13.return();
							}
						} finally {
							if (_didIteratorError13) {
								throw _iteratorError13;
							}
						}
					}
				}
			} catch (err) {
				_didIteratorError12 = true;
				_iteratorError12 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion12 && _iterator12.return) {
						_iterator12.return();
					}
				} finally {
					if (_didIteratorError12) {
						throw _iteratorError12;
					}
				}
			}
		}
	}, {
		key: "scrollTo",
		value: function scrollTo(what, id) {
			var els = document.getElementById(what + "-" + id);
			if (!!els) {
				if (!this.elVisible(els)) {
					els.scrollIntoView({ behavior: this.state.animations ? "smooth" : "instant", block: "center", inline: "nearest" });
				}
			}
		}
	}, {
		key: "changelayout",
		value: function () {
			var _ref10 = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(layout) {
				var newLayout;
				return regeneratorRuntime.wrap(function _callee10$(_context10) {
					while (1) {
						switch (_context10.prev = _context10.next) {
							case 0:
								if (layout && typeof layout == "string") {
									newLayout = layout;
								} else {
									if (this.state.layout == "blocks") {
										newLayout = this.state.layout = "blocks-big";
									} else if (this.state.layout == "blocks-big") {
										newLayout = this.state.layout = "horizontal";
									} else if (this.state.layout == "horizontal") {
										newLayout = this.state.layout = "vertical";
									} else {
										newLayout = this.state.layout = "blocks";
									}
								}
								this.state.layout = newLayout;
								_context10.next = 4;
								return setLocalStorage("layout", newLayout);

							case 4:

								this.setState({
									layout: newLayout,
									topText: "Switched to " + this.readablelayout(this.state.layout) + " view",
									bottomText: " "
								});

								this.forceUpdate();

							case 6:
							case "end":
								return _context10.stop();
						}
					}
				}, _callee10, this);
			}));

			function changelayout(_x) {
				return _ref10.apply(this, arguments);
			}

			return changelayout;
		}()
	}, {
		key: "nextlayout",
		value: function nextlayout() {
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
	}, {
		key: "readablelayout",
		value: function readablelayout(layout) {
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
	}, {
		key: "select",
		value: function select(id) {
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
			if (this.refs['window' + tab.windowId] && this.refs['window' + tab.windowId].refs['tab' + id]) {
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
	}, {
		key: "selectTo",
		value: function selectTo(id, tabs) {
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
	}, {
		key: "drag",
		value: function drag(e, id) {
			if (!this.state.selection[id]) {
				this.state.selection = {};
				this.state.selection[id] = true;
				this.state.lastSelect = id;
			}
			this.forceUpdate();
		}
	}, {
		key: "drop",
		value: function () {
			var _ref11 = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(id, before) {
				var _this5, tab, tabs, index, i, t;

				return regeneratorRuntime.wrap(function _callee11$(_context11) {
					while (1) {
						switch (_context11.prev = _context11.next) {
							case 0:
								_this5 = this;
								tab = this.state.tabsbyid[id];
								tabs = Object.keys(this.state.selection).map(function (id) {
									return _this5.state.tabsbyid[id];
								});
								index = tab.index + (before ? 0 : 1);
								i = 0;

							case 5:
								if (!(i < tabs.length)) {
									_context11.next = 14;
									break;
								}

								t = tabs[i];
								_context11.next = 9;
								return browser.tabs.move(t.id, { windowId: tab.windowId, index: index });

							case 9:
								_context11.next = 11;
								return browser.tabs.update(t.id, { pinned: t.pinned });

							case 11:
								i++;
								_context11.next = 5;
								break;

							case 14:
								this.setState({
									selection: {}
								});
								this.update();

							case 16:
							case "end":
								return _context11.stop();
						}
					}
				}, _callee11, this);
			}));

			function drop(_x2, _x3) {
				return _ref11.apply(this, arguments);
			}

			return drop;
		}()
	}, {
		key: "dropWindow",
		value: function () {
			var _ref12 = _asyncToGenerator(regeneratorRuntime.mark(function _callee12(windowId) {
				var _this6, tabs;

				return regeneratorRuntime.wrap(function _callee12$(_context12) {
					while (1) {
						switch (_context12.prev = _context12.next) {
							case 0:
								_this6 = this;
								tabs = Object.keys(this.state.selection).map(function (id) {
									return _this6.state.tabsbyid[id];
								});


								browser.runtime.sendMessage({ command: "move_tabs_to_window", window_id: windowId, tabs: tabs });

								this.setState({
									selection: {}
								});

							case 4:
							case "end":
								return _context12.stop();
						}
					}
				}, _callee12, this);
			}));

			function dropWindow(_x4) {
				return _ref12.apply(this, arguments);
			}

			return dropWindow;
		}()
	}, {
		key: "changeTabLimit",
		value: function () {
			var _ref13 = _asyncToGenerator(regeneratorRuntime.mark(function _callee13(e) {
				return regeneratorRuntime.wrap(function _callee13$(_context13) {
					while (1) {
						switch (_context13.prev = _context13.next) {
							case 0:
								this.state.tabLimit = e.target.value;
								_context13.next = 3;
								return setLocalStorage("tabLimit", this.state.tabLimit);

							case 3:
								this.tabLimitText();
								this.forceUpdate();

							case 5:
							case "end":
								return _context13.stop();
						}
					}
				}, _callee13, this);
			}));

			function changeTabLimit(_x5) {
				return _ref13.apply(this, arguments);
			}

			return changeTabLimit;
		}()
	}, {
		key: "tabLimitText",
		value: function tabLimitText() {
			this.setState({
				bottomText: "Limit the number of tabs per window. Will move new tabs into a new window instead. 0 to turn off"
			});
		}
	}, {
		key: "changeTabWidth",
		value: function () {
			var _ref14 = _asyncToGenerator(regeneratorRuntime.mark(function _callee14(e) {
				return regeneratorRuntime.wrap(function _callee14$(_context14) {
					while (1) {
						switch (_context14.prev = _context14.next) {
							case 0:
								this.state.tabWidth = e.target.value;
								_context14.next = 3;
								return setLocalStorage("tabWidth", this.state.tabWidth);

							case 3:
								document.body.style.width = this.state.tabWidth + "px";
								this.tabWidthText();
								this.forceUpdate();

							case 6:
							case "end":
								return _context14.stop();
						}
					}
				}, _callee14, this);
			}));

			function changeTabWidth(_x6) {
				return _ref14.apply(this, arguments);
			}

			return changeTabWidth;
		}()
	}, {
		key: "tabWidthText",
		value: function tabWidthText() {
			this.setState({
				bottomText: "Change the width of this window. 800 by default."
			});
		}
	}, {
		key: "changeTabHeight",
		value: function () {
			var _ref15 = _asyncToGenerator(regeneratorRuntime.mark(function _callee15(e) {
				return regeneratorRuntime.wrap(function _callee15$(_context15) {
					while (1) {
						switch (_context15.prev = _context15.next) {
							case 0:
								this.state.tabHeight = e.target.value;
								_context15.next = 3;
								return setLocalStorage("tabHeight", this.state.tabHeight);

							case 3:
								document.body.style.height = this.state.tabHeight + "px";
								this.tabHeightText();
								this.forceUpdate();

							case 6:
							case "end":
								return _context15.stop();
						}
					}
				}, _callee15, this);
			}));

			function changeTabHeight(_x7) {
				return _ref15.apply(this, arguments);
			}

			return changeTabHeight;
		}()
	}, {
		key: "tabHeightText",
		value: function tabHeightText() {
			this.setState({
				bottomText: "Change the height of this window. 600 by default."
			});
		}
	}, {
		key: "toggleAnimations",
		value: function () {
			var _ref16 = _asyncToGenerator(regeneratorRuntime.mark(function _callee16() {
				return regeneratorRuntime.wrap(function _callee16$(_context16) {
					while (1) {
						switch (_context16.prev = _context16.next) {
							case 0:
								this.state.animations = !this.state.animations;
								_context16.next = 3;
								return setLocalStorage("animations", this.state.animations);

							case 3:
								this.animationsText();
								this.forceUpdate();

							case 5:
							case "end":
								return _context16.stop();
						}
					}
				}, _callee16, this);
			}));

			function toggleAnimations() {
				return _ref16.apply(this, arguments);
			}

			return toggleAnimations;
		}()
	}, {
		key: "animationsText",
		value: function animationsText() {
			this.setState({
				bottomText: "Enables/disables animations. Default : on"
			});
		}
	}, {
		key: "toggleWindowTitles",
		value: function () {
			var _ref17 = _asyncToGenerator(regeneratorRuntime.mark(function _callee17() {
				return regeneratorRuntime.wrap(function _callee17$(_context17) {
					while (1) {
						switch (_context17.prev = _context17.next) {
							case 0:
								this.state.windowTitles = !this.state.windowTitles;
								_context17.next = 3;
								return setLocalStorage("windowTitles", this.state.windowTitles);

							case 3:
								this.windowTitlesText();
								this.forceUpdate();

							case 5:
							case "end":
								return _context17.stop();
						}
					}
				}, _callee17, this);
			}));

			function toggleWindowTitles() {
				return _ref17.apply(this, arguments);
			}

			return toggleWindowTitles;
		}()
	}, {
		key: "windowTitlesText",
		value: function windowTitlesText() {
			this.setState({
				bottomText: "Enables/disables window titles. Default : on"
			});
		}
	}, {
		key: "toggleCompact",
		value: function () {
			var _ref18 = _asyncToGenerator(regeneratorRuntime.mark(function _callee18() {
				return regeneratorRuntime.wrap(function _callee18$(_context18) {
					while (1) {
						switch (_context18.prev = _context18.next) {
							case 0:
								this.state.compact = !this.state.compact;
								_context18.next = 3;
								return setLocalStorage("compact", this.state.compact);

							case 3:
								this.compactText();
								this.forceUpdate();

							case 5:
							case "end":
								return _context18.stop();
						}
					}
				}, _callee18, this);
			}));

			function toggleCompact() {
				return _ref18.apply(this, arguments);
			}

			return toggleCompact;
		}()
	}, {
		key: "compactText",
		value: function compactText() {
			this.setState({
				bottomText: "Compact mode is a more compressed layout. Default : off"
			});
		}
	}, {
		key: "toggleDark",
		value: function () {
			var _ref19 = _asyncToGenerator(regeneratorRuntime.mark(function _callee19() {
				return regeneratorRuntime.wrap(function _callee19$(_context19) {
					while (1) {
						switch (_context19.prev = _context19.next) {
							case 0:
								this.state.dark = !this.state.dark;
								_context19.next = 3;
								return setLocalStorage("dark", this.state.dark);

							case 3:
								this.darkText();
								if (this.state.dark) {
									document.body.className = "dark";
									document.documentElement.className = "dark";
								} else {
									document.body.className = "";
									document.documentElement.className = "";
								}
								this.forceUpdate();

							case 6:
							case "end":
								return _context19.stop();
						}
					}
				}, _callee19, this);
			}));

			function toggleDark() {
				return _ref19.apply(this, arguments);
			}

			return toggleDark;
		}()
	}, {
		key: "darkText",
		value: function darkText() {
			this.setState({
				bottomText: "Dark mode inverts the layout - better on the eyes. Default : off"
			});
		}
	}, {
		key: "toggleTabActions",
		value: function () {
			var _ref20 = _asyncToGenerator(regeneratorRuntime.mark(function _callee20() {
				return regeneratorRuntime.wrap(function _callee20$(_context20) {
					while (1) {
						switch (_context20.prev = _context20.next) {
							case 0:
								this.state.tabactions = !this.state.tabactions;
								_context20.next = 3;
								return setLocalStorage("tabactions", this.state.tabactions);

							case 3:
								this.tabActionsText();
								this.forceUpdate();

							case 5:
							case "end":
								return _context20.stop();
						}
					}
				}, _callee20, this);
			}));

			function toggleTabActions() {
				return _ref20.apply(this, arguments);
			}

			return toggleTabActions;
		}()
	}, {
		key: "tabActionsText",
		value: function tabActionsText() {
			this.setState({
				bottomText: "Adds 'Open a new tab' and 'Close this window' option to each window. Default : on"
			});
		}
	}, {
		key: "toggleBadge",
		value: function () {
			var _ref21 = _asyncToGenerator(regeneratorRuntime.mark(function _callee21() {
				return regeneratorRuntime.wrap(function _callee21$(_context21) {
					while (1) {
						switch (_context21.prev = _context21.next) {
							case 0:
								this.state.badge = !this.state.badge;
								_context21.next = 3;
								return setLocalStorage("badge", this.state.badge);

							case 3:
								this.badgeText();
								browser.runtime.sendMessage({ command: "update_tab_count" });
								this.forceUpdate();

							case 6:
							case "end":
								return _context21.stop();
						}
					}
				}, _callee21, this);
			}));

			function toggleBadge() {
				return _ref21.apply(this, arguments);
			}

			return toggleBadge;
		}()
	}, {
		key: "badgeText",
		value: function badgeText() {
			this.setState({
				bottomText: "Shows the number of open tabs on the Tab Manager icon. Default : on"
			});
		}
	}, {
		key: "toggleOpenInOwnTab",
		value: function () {
			var _ref22 = _asyncToGenerator(regeneratorRuntime.mark(function _callee22() {
				return regeneratorRuntime.wrap(function _callee22$(_context22) {
					while (1) {
						switch (_context22.prev = _context22.next) {
							case 0:
								this.state.openInOwnTab = !this.state.openInOwnTab;
								_context22.next = 3;
								return setLocalStorage("openInOwnTab", this.state.openInOwnTab);

							case 3:
								this.openInOwnTabText();
								browser.runtime.sendMessage({ command: "reload_popup_controls" });
								this.forceUpdate();

							case 6:
							case "end":
								return _context22.stop();
						}
					}
				}, _callee22, this);
			}));

			function toggleOpenInOwnTab() {
				return _ref22.apply(this, arguments);
			}

			return toggleOpenInOwnTab;
		}()
	}, {
		key: "openInOwnTabText",
		value: function openInOwnTabText() {
			this.setState({
				bottomText: "Open the Tab Manager by default in own tab, or as a popup?"
			});
		}
	}, {
		key: "toggleSessions",
		value: function () {
			var _ref23 = _asyncToGenerator(regeneratorRuntime.mark(function _callee23() {
				return regeneratorRuntime.wrap(function _callee23$(_context23) {
					while (1) {
						switch (_context23.prev = _context23.next) {
							case 0:
								this.state.sessionsFeature = !this.state.sessionsFeature;
								_context23.next = 3;
								return setLocalStorage("sessionsFeature", this.state.sessionsFeature);

							case 3:
								this.sessionsText();
								this.forceUpdate();

							case 5:
							case "end":
								return _context23.stop();
						}
					}
				}, _callee23, this);
			}));

			function toggleSessions() {
				return _ref23.apply(this, arguments);
			}

			return toggleSessions;
		}()
	}, {
		key: "sessionsText",
		value: function sessionsText() {
			this.setState({
				bottomText: "Allows you to save/restore windows into sessions. ( Tab History will be lost ) Default : off"
			});
		}
	}, {
		key: "exportSessions",
		value: function exportSessions() {
			if (this.state.sessions.length == 0) {
				window.alert("You have currently no windows saved for later. There is nothing to export.");
				return;
			}
			var exportName = "tab-manager-plus-backup";
			var today = new Date();
			var y = today.getFullYear();

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
			document.body.appendChild(downloadAnchorNode);
			downloadAnchorNode.click();
			downloadAnchorNode.remove();
			this.exportSessionsText();
			this.forceUpdate();
		}
	}, {
		key: "exportSessionsText",
		value: function exportSessionsText() {
			this.setState({
				bottomText: "Allows you to export your saved windows to an external backup"
			});
		}
	}, {
		key: "importSessions",
		value: function importSessions(evt) {
			var _this8 = this;

			if (navigator.userAgent.search("Firefox") > -1) {
				if (window.inPopup) {
					window.alert("Due to a Firefox bug session import does not work in the popup. Please use the options screen or open Tab Manager Plus in its' own tab");
					return;
				}
			}
			try {
				var inputField = evt.target;
				var files = evt.target.files;
				if (!files.length) {
					alert("No file selected!");
					this.setState({ bottomText: "Error: Could not read the backup file!" });
					return;
				}
				var file = files[0];
				var reader = new FileReader();
				var self = this;
				reader.onload = function () {
					var _ref24 = _asyncToGenerator(regeneratorRuntime.mark(function _callee24(event) {
						var backupFile, success, i, newSession, sessions, value;
						return regeneratorRuntime.wrap(function _callee24$(_context24) {
							while (1) {
								switch (_context24.prev = _context24.next) {
									case 0:
										try {
											backupFile = JSON.parse(event.target.result);
										} catch (err) {
											console.error(err);
											window.alert(err);
											_this8.setState({ bottomText: "Error: Could not read the backup file!" });
										}

										if (!(!!backupFile && backupFile.length > 0)) {
											_context24.next = 20;
											break;
										}

										success = backupFile.length;
										i = 0;

									case 4:
										if (!(i < backupFile.length)) {
											_context24.next = 17;
											break;
										}

										newSession = backupFile[i];

										if (!(newSession.windowsInfo && newSession.tabs && newSession.id)) {
											_context24.next = 14;
											break;
										}

										_context24.next = 9;
										return getLocalStorage('sessions', {});

									case 9:
										sessions = _context24.sent;

										sessions[newSession.id] = newSession;
										_context24.next = 13;
										return setLocalStorage('sessions', sessions).catch(function (err) {
											console.log(err);
											console.error(err.message);
											success--;
										});

									case 13:
										value = _context24.sent;

									case 14:
										i++;
										_context24.next = 4;
										break;

									case 17:
										_this8.setState({ bottomText: success + " windows successfully restored!" });
										_context24.next = 21;
										break;

									case 20:
										_this8.setState({ bottomText: "Error: Could not restore any windows from the backup file!" });

									case 21:
										inputField.value = "";
										_this8.sessionSync();

									case 23:
									case "end":
										return _context24.stop();
								}
							}
						}, _callee24, _this8);
					}));

					return function (_x8) {
						return _ref24.apply(this, arguments);
					};
				}();
				reader.readAsText(file);
			} catch (err) {
				console.error(err);
				window.alert(err);
			}
			this.importSessionsText();
			this.forceUpdate();
		}
	}, {
		key: "importSessionsText",
		value: function importSessionsText() {
			this.setState({
				bottomText: "Allows you to restore your saved windows from an external backup"
			});
		}
	}, {
		key: "toggleHide",
		value: function () {
			var _ref25 = _asyncToGenerator(regeneratorRuntime.mark(function _callee25() {
				var granted;
				return regeneratorRuntime.wrap(function _callee25$(_context25) {
					while (1) {
						switch (_context25.prev = _context25.next) {
							case 0:
								if (!(navigator.userAgent.search("Firefox") > -1)) {
									_context25.next = 4;
									break;
								}

								this.state.hideWindows = false;
								_context25.next = 8;
								break;

							case 4:
								_context25.next = 6;
								return browser.permissions.request({ permissions: ["system.display"] });

							case 6:
								granted = _context25.sent;

								if (granted) {
									this.state.hideWindows = !this.state.hideWindows;
								} else {
									this.state.hideWindows = false;
								}

							case 8:
								_context25.next = 10;
								return setLocalStorage("hideWindows", this.state.hideWindows);

							case 10:
								this.hideText();
								this.forceUpdate();

							case 12:
							case "end":
								return _context25.stop();
						}
					}
				}, _callee25, this);
			}));

			function toggleHide() {
				return _ref25.apply(this, arguments);
			}

			return toggleHide;
		}()
	}, {
		key: "hideText",
		value: function hideText() {
			this.setState({
				bottomText: "Automatically minimizes inactive chrome windows. Default : off"
			});
		}
	}, {
		key: "toggleFilterMismatchedTabs",
		value: function () {
			var _ref26 = _asyncToGenerator(regeneratorRuntime.mark(function _callee26() {
				return regeneratorRuntime.wrap(function _callee26$(_context26) {
					while (1) {
						switch (_context26.prev = _context26.next) {
							case 0:
								this.state.filterTabs = !this.state.filterTabs;
								_context26.next = 3;
								return setLocalStorage("filter-tabs", this.state.filterTabs);

							case 3:
								this.forceUpdate();

							case 4:
							case "end":
								return _context26.stop();
						}
					}
				}, _callee26, this);
			}));

			function toggleFilterMismatchedTabs() {
				return _ref26.apply(this, arguments);
			}

			return toggleFilterMismatchedTabs;
		}()
	}, {
		key: "getTip",
		value: function getTip() {
			var tips = ["You can right click on a tab to select it", "Press enter to move all selected tabs to a new window", "Middle click to close a tab", "Tab Manager Plus loves saving time", "To see incognito tabs, enable incognito access in the extension settings", "You can drag and drop tabs to other windows", "You can type to search right away", "You can search for different tabs : google OR yahoo"];

			return "Tip: " + tips[Math.floor(Math.random() * tips.length)];
		}
	}, {
		key: "isInViewport",
		value: function isInViewport(element, ofElement) {
			var rect = element.getBoundingClientRect();
			return rect.top >= 0 && rect.left >= 0 && rect.bottom <= ofElement.height && rect.right <= ofElement.width;
		}
	}, {
		key: "elVisible",
		value: function elVisible(elem) {
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
			} while (pointContainer = pointContainer.parentNode);
			return false;
		}
	}]);

	return TabManager;
}(React.Component);

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

var maybePluralize = function maybePluralize(count, noun) {
	var suffix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 's';
	return count + " " + noun + (count !== 1 ? suffix : '');
};
//# sourceMappingURL=TabManager.js.map