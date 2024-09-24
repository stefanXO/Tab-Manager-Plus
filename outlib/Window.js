"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Window = function (_React$Component) {
	_inherits(Window, _React$Component);

	function Window(props) {
		_classCallCheck(this, Window);

		var _this2 = _possibleConstructorReturn(this, (Window.__proto__ || Object.getPrototypeOf(Window)).call(this, props));

		_this2.state = {
			colorActive: false,
			windowTitles: [],
			color: "default",
			name: "",
			tabs: 0,
			hover: false
		};

		_this2.addTab = _this2.addTab.bind(_this2);
		_this2.changeColors = _this2.changeColors.bind(_this2);
		_this2.changeName = _this2.changeName.bind(_this2);
		_this2.checkKey = _this2.checkKey.bind(_this2);
		_this2.closePopup = _this2.closePopup.bind(_this2);
		_this2.close = _this2.close.bind(_this2);
		_this2.colors = _this2.colors.bind(_this2);
		_this2.dragOver = _this2.dragOver.bind(_this2);
		_this2.dragLeave = _this2.dragLeave.bind(_this2);
		_this2.drop = _this2.drop.bind(_this2);
		_this2.maximize = _this2.maximize.bind(_this2);
		_this2.minimize = _this2.minimize.bind(_this2);
		_this2.save = _this2.save.bind(_this2);
		_this2.stop = _this2.stop.bind(_this2);
		_this2.windowClick = _this2.windowClick.bind(_this2);
		_this2.selectToFromTab = _this2.selectToFromTab.bind(_this2);
		_this2.hoverWindow = _this2.hoverWindow.bind(_this2);
		_this2.hoverWindowOut = _this2.hoverWindowOut.bind(_this2);
		_this2.checkSettings = _this2.checkSettings.bind(_this2);
		return _this2;
	}

	_createClass(Window, [{
		key: "componentDidMount",
		value: function () {
			var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								_context.next = 2;
								return this.checkSettings();

							case 2:
							case "end":
								return _context.stop();
						}
					}
				}, _callee, this);
			}));

			function componentDidMount() {
				return _ref.apply(this, arguments);
			}

			return componentDidMount;
		}()
	}, {
		key: "checkSettings",
		value: function () {
			var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
				var colors, color, name, names;
				return regeneratorRuntime.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								_context2.next = 2;
								return getLocalStorage("windowColors", {});

							case 2:
								colors = _context2.sent;
								color = colors[this.props.window.id] || "default";
								name = "";

								if (!this.props.window.titlePreface) {
									_context2.next = 9;
									break;
								}

								name = this.props.window.titlePreface;
								_context2.next = 17;
								break;

							case 9:
								_context2.next = 11;
								return getLocalStorage("windowNames", {});

							case 11:
								names = _context2.sent;

								if (!((typeof names === "undefined" ? "undefined" : _typeof(names)) !== 'object')) {
									_context2.next = 16;
									break;
								}

								_context2.next = 15;
								return setLocalStorage("windowNames", {});

							case 15:
								names = {};

							case 16:
								name = names[this.props.window.id] || "";

							case 17:

								this.setState({
									color: color,
									name: name
								});

							case 18:
							case "end":
								return _context2.stop();
						}
					}
				}, _callee2, this);
			}));

			function checkSettings() {
				return _ref2.apply(this, arguments);
			}

			return checkSettings;
		}()
	}, {
		key: "render",
		value: function render() {
			var _this = this;

			var color = this.state.color;
			var name = this.state.name;

			var hideWindow = true;
			var titleAdded = false;
			var tabsperrow = this.props.layout.indexOf("blocks") > -1 ? Math.ceil(Math.sqrt(this.props.tabs.length + 2)) : this.props.layout == "vertical" ? 1 : 15;
			var tabs = this.props.tabs.map(function (tab) {
				var isHidden = !!_this.props.hiddenTabs[tab.id] && _this.props.filterTabs;
				var isSelected = !!_this.props.selection[tab.id];
				hideWindow &= isHidden;
				return React.createElement(Tab, {
					key: "windowtab_" + _this.props.window.id + "_" + tab.id,
					window: _this.props.window,
					layout: _this.props.layout,
					tab: tab,
					selected: isSelected,
					hidden: isHidden,
					middleClick: _this.props.tabMiddleClick,
					hoverHandler: _this.props.hoverHandler,
					searchActive: _this.props.searchActive,
					select: _this.props.select,
					selectTo: _this.selectToFromTab,
					draggable: true,
					drag: _this.props.drag,
					drop: _this.props.drop,
					dropWindow: _this.props.dropWindow,
					dragFavicon: _this.props.dragFavicon,
					parentUpdate: _this.forceUpdate.bind(_this),
					ref: "tab" + tab.id,
					id: "tab-" + tab.id
				});
			});
			if (!hideWindow) {
				if (!!this.props.tabactions) {
					tabs.push(React.createElement("div", { key: "windownl_" + _this.props.window.id, className: "newliner" }), React.createElement(
						"div",
						{ key: "windowactions_" + this.props.window.id, className: "window-actions" },
						this.props.sessionsFeature ? React.createElement("div", {
							className: "icon tabaction save " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
							title: "Save this window for later\nWill save " + tabs.length + " tabs with this window for later. Please note : The saved tabs will lose their history.",
							onClick: this.save,
							onMouseEnter: this.props.hoverIcon
						}) : false,
						React.createElement("div", {
							className: "icon tabaction add " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
							title: "Open a new tab",
							onClick: this.addTab,
							onMouseEnter: this.props.hoverIcon
						}),
						React.createElement("div", {
							className: "icon tabaction colors " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
							title: "Change window name or color",
							onClick: this.colors,
							onMouseEnter: this.props.hoverIcon
						}),
						this.props.window.state == "minimized" ? React.createElement("div", {
							className: "icon tabaction maximize " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
							title: "Maximize this window\nWill maximize " + tabs.length + " tabs",
							onClick: this.maximize,
							onMouseEnter: this.props.hoverIcon
						}) : React.createElement("div", {
							className: "icon tabaction minimize " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
							title: "Minimize this window\nWill minimize " + tabs.length + " tabs",
							onClick: this.minimize,
							onMouseEnter: this.props.hoverIcon
						}),
						React.createElement("div", {
							className: "icon tabaction close " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
							title: "Close this window\nWill close " + tabs.length + " tabs",
							onClick: this.close,
							onMouseEnter: this.props.hoverIcon
						})
					));
				}
				if (this.state.colorActive) {
					tabs.push(React.createElement(
						"div",
						{ key: "windowcolors_" + _this.props.window.id, className: "window-colors " + (this.state.colorActive ? "" : "hidden"), onClick: this.stop, onKeyDown: this.checkKey },
						React.createElement(
							"h2",
							{ className: "window-x", onClick: this.closePopup },
							"x"
						),
						React.createElement(
							"h3",
							{ className: "center" },
							"Name the window"
						),
						React.createElement("input", {
							className: "window-name-input",
							type: "text",
							onChange: this.changeName,
							value: this.state.name,
							placeholder: this.state.windowTitles ? this.topEntries(this.state.windowTitles).join("") : "Name window...",
							tabIndex: "1",
							ref: "namebox",
							onKeyDown: this.checkKey
						}),
						React.createElement(
							"h3",
							{ className: "center" },
							"Pick a color"
						),
						React.createElement(
							"div",
							{ className: "colors-box" },
							React.createElement("div", {
								className: "icon tabaction default " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "default" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color1 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color1" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color2 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color2" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color3 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color3" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color4 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color4" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color5 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color5" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color6 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color6" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color7 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color7" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color8 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color8" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color9 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color9" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color10 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color10" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color11 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color11" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color12 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color12" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color13 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color13" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color14 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color14" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color15 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color15" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color16 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color16" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color17 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color17" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color18 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color18" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color19 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color19" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color20 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color20" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color21 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color21" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color22 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color22" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color23 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color23" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color24 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color24" }),
								onMouseEnter: this.props.hoverIcon
							}),
							React.createElement("div", {
								className: "icon tabaction color25 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
								title: "Change background color",
								onClick: this.changeColors.bind(this, { colorActive: false, color: "color25" }),
								onMouseEnter: this.props.hoverIcon
							})
						)
					));
				}

				if (this.props.windowTitles) {
					if (!!name) {
						tabs.unshift(React.createElement(
							"h3",
							{
								key: "window-" + this.props.window.id + "-windowTitle",
								className: "editName center windowTitle",
								onClick: this.colors,
								title: "Change the name of this window",
								onMouseEnter: this.props.hoverIcon
							},
							name
						));
						titleAdded = true;
					} else {
						if (this.state.windowTitles.length == 0 || this.state.tabs != tabs.length + this.props.window.id * 99) {
							this.state.windowTitles = [];
							this.state.tabs = tabs.length + this.props.window.id * 99;
							for (var i = 0; i < tabs.length; i++) {

								if (!!tabs[i].props && !!tabs[i].props.tab && !!tabs[i].props.tab.url) {
									var url = new URL(tabs[i].props.tab.url);
									var protocol = url.protocol || "";
									var hostname = url.hostname || "";
									if (protocol.indexOf("view-source") > -1 && !!url.pathname) {
										url = new URL(url.pathname);
										hostname = url.hostname || "source";
									} else if (protocol.indexOf("chrome-extension") > -1) {
										hostname = tabs[i].props.tab.title || "extension";
									} else if (protocol.indexOf("about") > -1) {
										hostname = tabs[i].props.tab.title || "about";
									} else if (hostname.indexOf("mail.google") > -1) {
										hostname = "gmail";
									} else {
										if (!hostname) hostname = "";
										hostname = hostname.replace("www.", "");
										var regex_var = new RegExp(/(\.[^\.]{0,2})(\.[^\.]{0,2})(\.*$)|(\.[^\.]*)(\.*$)/);
										hostname = hostname.replace(regex_var, "").split(".").pop();
									}

									if (!!hostname && hostname.length > 18) {
										hostname = tabs[i].props.tab.title || "";

										while (hostname.length > 18 && hostname.indexOf("—") > -1) {
											hostname = hostname.split("—");
											hostname.pop();
											hostname = hostname.join("—");
										}

										while (hostname.length > 18 && hostname.indexOf("-") > -1) {
											hostname = hostname.split("-");
											hostname.pop();
											hostname = hostname.join("-");
										}

										while (hostname.length > 18 && hostname.indexOf(" ") > -1) {
											hostname = hostname.split(" ");
											hostname.pop();
											hostname = hostname.join(" ");
										}
									}
									this.state.windowTitles.push(hostname);
								}
							}
						}

						if (this.state.windowTitles.length > 0) {
							tabs.unshift(React.createElement(
								"h3",
								{
									key: "window-" + this.props.window.id + "-windowTitle",
									className: "editName center windowTitle",
									onClick: this.colors,
									title: "Change the name of this window",
									onMouseEnter: this.props.hoverIcon
								},
								this.topEntries(this.state.windowTitles).join("")
							));
							titleAdded = true;
						}
					}
				}

				if (tabsperrow < 5) {
					tabsperrow = 5;
				}
				var children = [];
				if (!!titleAdded) {
					children.push(tabs.shift());
				}
				var z = -1;
				for (var j = 0; j < tabs.length; j++) {
					var tab = tabs[j].props.tab;
					var isHidden = !!tab && !!tab.id && !!this.props.hiddenTabs[tab.id] && this.props.filterTabs;
					if (!isHidden) {
						z++;
						children.push(tabs[j]);
					}
					if ((z + 1) % tabsperrow == 0 && z && this.props.layout.indexOf("blocks") > -1) {
						children.push(React.createElement("div", { className: "newliner", key: "windownlz_" + _this.props.window.id + "_" + z }));
					}
				}
				var focused = false;
				if (this.props.window.focused || this.props.lastOpenWindow == this.props.window.id) {
					focused = true;
				}
				return React.createElement(
					"div",
					{
						key: "window-" + this.props.window.id,
						id: "window-" + this.props.window.id,
						className: "window " + this.props.window.state + " window-" + this.props.window.id + " " + (focused ? "activeWindow" : "") + " " + this.state.color + " " + (this.props.layout.indexOf("blocks") > -1 ? "block" : "") + " " + this.props.layout + " " + (this.props.window.incognito ? " incognito" : "") + " " + (focused ? " focused" : ""),
						onDragEnter: this.dragOver,
						onDragOver: this.dragOver,
						onDragLeave: this.dragLeave,
						onClick: this.windowClick,
						title: "",
						onMouseEnter: this.hoverWindow.bind(null, tabs),
						onMouseLeave: this.hoverWindowOut,
						onDrop: this.drop
					},
					React.createElement(
						"div",
						{ key: "windowcontainer_" + this.props.window.id, className: "windowcontainer", title: "Focus this window\nWill select this window with " + tabs.length + " tabs" },
						children
					)
				);
			} else {
				return null;
			}
		}
	}, {
		key: "stop",
		value: function stop(e) {
			this.stopProp(e);
		}
	}, {
		key: "addTab",
		value: function addTab(e) {
			this.stopProp(e);
			browser.tabs.create({ windowId: this.props.window.id });
		}
	}, {
		key: "dragOver",
		value: function dragOver(e) {
			this.state.hover = true;
			this.stopProp(e);
		}
	}, {
		key: "dragLeave",
		value: function dragLeave(e) {
			this.state.hover = false;
			e.nativeEvent.preventDefault();
		}
	}, {
		key: "drop",
		value: function drop(e) {
			var distance = 1000000;
			var closestTab = null;
			var closestRef = null;

			for (var i = 0; i < this.props.tabs.length; i++) {
				var tab = this.props.tabs[i];
				var tabRef = this.refs["tab" + tab.id].tabRef.current;
				var tabRect = tabRef.getBoundingClientRect();
				var x = e.nativeEvent.clientX;
				var y = e.nativeEvent.clientY;
				var dx = tabRect.x - x;
				var dy = tabRect.y - y;
				var d = Math.sqrt(dx * dx + dy * dy);
				if (d < distance) {
					distance = d;
					closestTab = tab.id;
					closestRef = tabRef;
				}
			}

			this.stopProp(e);

			if (closestTab != null) {
				var before = null;
				var boundingRect = closestRef.getBoundingClientRect();
				if (this.props.layout == "vertical") {
					before = e.nativeEvent.clientY < boundingRect.top ? true : false;
				} else {
					before = e.nativeEvent.clientX < boundingRect.left ? true : false;
				}
				this.props.drop(closestTab, before);
			} else {
				this.props.dropWindow(this.props.window.id);
			}
		}
	}, {
		key: "hoverWindow",
		value: function hoverWindow(tabs, e) {
			this.state.hover = true;
			this.props.hoverIcon("Focus this window\nWill select this window with " + tabs.length + " tabs");
		}
	}, {
		key: "hoverWindowOut",
		value: function hoverWindowOut(e) {
			this.state.hover = false;
		}
	}, {
		key: "checkKey",
		value: function checkKey(e) {
			if (e.keyCode == 13 || e.keyCode == 27) {
				this.stopProp(e);
				this.closePopup();
			}
		}
	}, {
		key: "windowClick",
		value: function () {
			var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(e) {
				var windowId;
				return regeneratorRuntime.wrap(function _callee3$(_context3) {
					while (1) {
						switch (_context3.prev = _context3.next) {
							case 0:
								this.stopProp(e);

								windowId = this.props.window.id;


								if (navigator.userAgent.search("Firefox") > -1) {
									browser.runtime.sendMessage({ command: "focus_on_window_delayed", window_id: windowId });
								} else {
									browser.runtime.sendMessage({ command: "focus_on_window", window_id: windowId });
								}

								this.props.parentUpdate();
								if (!!window.inPopup) window.close();
								return _context3.abrupt("return", false);

							case 6:
							case "end":
								return _context3.stop();
						}
					}
				}, _callee3, this);
			}));

			function windowClick(_x) {
				return _ref3.apply(this, arguments);
			}

			return windowClick;
		}()
	}, {
		key: "selectToFromTab",
		value: function selectToFromTab(tabId) {
			if (tabId) this.props.selectTo(tabId, this.props.tabs);
		}
	}, {
		key: "close",
		value: function () {
			var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(e) {
				return regeneratorRuntime.wrap(function _callee4$(_context4) {
					while (1) {
						switch (_context4.prev = _context4.next) {
							case 0:
								this.stopProp(e);
								_context4.next = 3;
								return browser.windows.remove(this.props.window.id);

							case 3:
							case "end":
								return _context4.stop();
						}
					}
				}, _callee4, this);
			}));

			function close(_x2) {
				return _ref4.apply(this, arguments);
			}

			return close;
		}()
	}, {
		key: "uuidv4",
		value: function uuidv4() {
			return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
				var r = Math.random() * 16 | 0,
				    v = c == "x" ? r : r & 0x3 | 0x8;
				return v.toString(16);
			});
		}
	}, {
		key: "save",
		value: function () {
			var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(e) {
				var sessionName, sessionColor, session, queryInfo, tabs, tabkey, newTab, sessions, value;
				return regeneratorRuntime.wrap(function _callee5$(_context5) {
					while (1) {
						switch (_context5.prev = _context5.next) {
							case 0:
								this.stopProp(e);

								console.log("session name", this.state.name);
								sessionName = this.state.name || this.topEntries(this.state.windowTitles).join("");
								sessionColor = this.state.color || "default";


								console.log("session name", sessionName);

								session = {
									tabs: [],
									windowsInfo: {},
									name: sessionName,
									color: sessionColor,
									date: Date.now(),
									sessionStartTime: Date.now(),
									id: this.uuidv4()
								};


								if (this.state.name) {
									session.customName = true;
								}

								queryInfo = {};

								queryInfo.windowId = this.props.window.id;
								console.log(queryInfo);

								_context5.next = 12;
								return browser.tabs.query(queryInfo);

							case 12:
								tabs = _context5.sent;

								console.log(tabs);
								_context5.t0 = regeneratorRuntime.keys(tabs);

							case 15:
								if ((_context5.t1 = _context5.t0()).done) {
									_context5.next = 24;
									break;
								}

								tabkey = _context5.t1.value;

								if (!(navigator.userAgent.search("Firefox") > -1)) {
									_context5.next = 21;
									break;
								}

								newTab = tabs[tabkey];

								if (!(!!newTab.url && newTab.url.search("about:") > -1)) {
									_context5.next = 21;
									break;
								}

								return _context5.abrupt("continue", 15);

							case 21:
								session.tabs.push(tabs[tabkey]);
								_context5.next = 15;
								break;

							case 24:
								console.log(session.tabs);
								_context5.next = 27;
								return browser.windows.get(this.props.window.id);

							case 27:
								session.windowsInfo = _context5.sent;


								console.log(session);

								_context5.next = 31;
								return getLocalStorage('sessions', {});

							case 31:
								sessions = _context5.sent;

								sessions[session.id] = session;

								_context5.next = 35;
								return setLocalStorage('sessions', sessions).catch(function (err) {
									console.log(err);
									console.error(err.message);
								});

							case 35:
								value = _context5.sent;

								this.props.parentUpdate();
								console.log("Value is set to " + value);

								setTimeout(function () {
									this.props.scrollTo("session", session.id);
								}.bind(this), 150);

							case 39:
							case "end":
								return _context5.stop();
						}
					}
				}, _callee5, this);
			}));

			function save(_x3) {
				return _ref5.apply(this, arguments);
			}

			return save;
		}()
	}, {
		key: "minimize",
		value: function () {
			var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(e) {
				return regeneratorRuntime.wrap(function _callee6$(_context6) {
					while (1) {
						switch (_context6.prev = _context6.next) {
							case 0:
								this.stopProp(e);
								_context6.next = 3;
								return browser.windows.update(this.props.window.id, {
									state: "minimized"
								});

							case 3:
								this.props.parentUpdate();

							case 4:
							case "end":
								return _context6.stop();
						}
					}
				}, _callee6, this);
			}));

			function minimize(_x4) {
				return _ref6.apply(this, arguments);
			}

			return minimize;
		}()
	}, {
		key: "maximize",
		value: function () {
			var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(e) {
				return regeneratorRuntime.wrap(function _callee7$(_context7) {
					while (1) {
						switch (_context7.prev = _context7.next) {
							case 0:
								this.stopProp(e);
								_context7.next = 3;
								return browser.windows.update(this.props.window.id, {
									state: "normal"
								});

							case 3:
								this.props.parentUpdate();

							case 4:
							case "end":
								return _context7.stop();
						}
					}
				}, _callee7, this);
			}));

			function maximize(_x5) {
				return _ref7.apply(this, arguments);
			}

			return maximize;
		}()
	}, {
		key: "colors",
		value: function colors(e) {
			this.stopProp(e);
			this.props.toggleColors(!this.state.colorActive, this.props.window.id);
			this.setState({
				colorActive: !this.state.colorActive
			});
			setTimeout(function () {
				if (this.state.colorActive) {
					this.refs.namebox.focus();
				}
			}.bind(this), 150);
		}
	}, {
		key: "changeColors",
		value: function () {
			var _ref8 = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(a) {
				var color;
				return regeneratorRuntime.wrap(function _callee8$(_context8) {
					while (1) {
						switch (_context8.prev = _context8.next) {
							case 0:
								this.setState(a);
								this.props.toggleColors(!this.state.colorActive, this.props.window.id);

								color = a.color || "default";


								browser.runtime.sendMessage({
									command: "set_window_color",
									window_id: this.props.window.id,
									color: color
								});

								this.state.color = color;
								this.setState({
									color: color
								});
								this.closePopup();

							case 7:
							case "end":
								return _context8.stop();
						}
					}
				}, _callee8, this);
			}));

			function changeColors(_x6) {
				return _ref8.apply(this, arguments);
			}

			return changeColors;
		}()
	}, {
		key: "closePopup",
		value: function closePopup() {
			this.props.toggleColors(!this.state.colorActive, this.props.window.id);
			this.setState({
				colorActive: !this.state.colorActive
			});
			this.props.parentUpdate();
		}
	}, {
		key: "changeName",
		value: function () {
			var _ref9 = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(e) {
				var name;
				return regeneratorRuntime.wrap(function _callee9$(_context9) {
					while (1) {
						switch (_context9.prev = _context9.next) {
							case 0:
								name = "";

								if (e && e.target && e.target.value) name = e.target.value;

								browser.runtime.sendMessage({
									command: "set_window_name",
									window_id: this.props.window.id,
									name: name
								});

								this.state.name = name;
								this.setState({
									name: name
								});

								if (!(navigator.userAgent.search("Firefox") > -1)) {
									_context9.next = 13;
									break;
								}

								if (!name) {
									_context9.next = 11;
									break;
								}

								_context9.next = 9;
								return browser.windows.update(this.props.window.id, {
									titlePreface: name + " - "
								});

							case 9:
								_context9.next = 13;
								break;

							case 11:
								_context9.next = 13;
								return browser.windows.update(this.props.window.id, {
									titlePreface: name
								});

							case 13:
							case "end":
								return _context9.stop();
						}
					}
				}, _callee9, this);
			}));

			function changeName(_x7) {
				return _ref9.apply(this, arguments);
			}

			return changeName;
		}()
	}, {
		key: "topEntries",
		value: function topEntries(arr) {
			var cnts = arr.reduce(function (obj, val) {
				obj[val] = (obj[val] || 0) + 1;
				return obj;
			}, {});
			var sorted = Object.keys(cnts).sort(function (a, b) {
				return cnts[b] - cnts[a];
			});

			var more = 0;
			if (sorted.length == 3) {} else {
				while (sorted.length > 2) {
					sorted.pop();
					more++;
				}
			}
			for (var i = 0; i < sorted.length; i++) {
				if (i > 0) {
					sorted[i] = ", " + sorted[i];
				}
			}
			if (more > 0) {
				sorted.push(" & " + more + " more");
			}
			return sorted;
		}
	}, {
		key: "stopProp",
		value: function stopProp(e) {
			if (e && e.nativeEvent) {
				e.nativeEvent.preventDefault();
				e.nativeEvent.stopPropagation();
			}
			if (e && e.preventDefault) {
				e.preventDefault();
				e.stopPropagation();
			}
		}
	}]);

	return Window;
}(React.Component);