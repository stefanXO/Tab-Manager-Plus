"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Tab = function (_React$Component) {
	_inherits(Tab, _React$Component);

	function Tab(props) {
		_classCallCheck(this, Tab);

		var _this = _possibleConstructorReturn(this, (Tab.__proto__ || Object.getPrototypeOf(Tab)).call(this, props));

		_this.state = {
			favIcon: "",
			dragFavIcon: "",
			hovered: false
		};

		_this.onHover = _this.onHover.bind(_this);
		_this.onHoverOut = _this.onHoverOut.bind(_this);
		_this.onMouseDown = _this.onMouseDown.bind(_this);
		_this.click = _this.click.bind(_this);
		_this.dragStart = _this.dragStart.bind(_this);
		_this.dragOver = _this.dragOver.bind(_this);
		_this.dragOut = _this.dragOut.bind(_this);
		_this.drop = _this.drop.bind(_this);
		_this.resolveFavIconUrl = _this.resolveFavIconUrl.bind(_this);
		_this.checkSettings = _this.checkSettings.bind(_this);

		_this.tabRef = React.createRef();
		return _this;
	}

	_createClass(Tab, [{
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
				return regeneratorRuntime.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								_context2.next = 2;
								return this.resolveFavIconUrl();

							case 2:
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
			var children = [];
			if (this.props.layout == "vertical") {
				children.push(React.createElement(
					"div",
					{ key: "tab-pinned-" + this.props.tab.id, className: "tab-pinned " + (!this.props.tab.pinned ? "hidden" : "") },
					"Pinned"
				));
				children.push(React.createElement(
					"div",
					{ key: "tab-highlighted-" + this.props.tab.id, className: "tab-highlighted " + (!this.props.tab.highlighted ? "hidden" : "") },
					"Active"
				));
				children.push(React.createElement(
					"div",
					{ key: "tab-selected-" + this.props.tab.id, className: "tab-selected " + (!this.props.selected ? "hidden" : "") },
					"Selected"
				));
				children.push(React.createElement("div", {
					key: "tab-icon-" + this.props.tab.id,
					className: "iconoverlay ",
					style: {
						backgroundImage: "url(" + this.state.favIcon + ")"
					}
				}));
				children.push(React.createElement(
					"div",
					{ key: "tab-title-" + this.props.tab.id, className: "tabtitle" },
					this.props.tab.title || ""
				));
			}

			var tabDom = {
				className: "icon tab " + (this.props.selected ? "selected " : "") + (this.props.tab.pinned ? "pinned " : "") + (this.props.tab.highlighted ? "highlighted " : "") + (this.props.hidden ? "hidden " : "") + (this.props.tab.mutedInfo && this.props.tab.mutedInfo.muted ? "muted " : "") + (this.props.tab.audible ? "audible " : "") + (this.props.tab.discarded ? "discarded " : "") + (this.props.layout == "vertical" ? "full " : "") + (this.props.tab.incognito ? "incognito " : "") + (this.state.draggingOver || "") + (this.props.searchActive ? "search-active " : "") + " tab-" + this.props.tab.id + " " + (this.props.layout == "vertical" ? "vertical " : "blocks "),
				style: this.props.layout == "vertical" ? {} : { backgroundImage: "url(" + this.state.favIcon + ")" },

				id: this.props.id,
				title: this.props.tab.title,
				onClick: this.click,
				onMouseDown: this.onMouseDown,
				onMouseEnter: this.onHover,
				onMouseOut: this.onHoverOut,
				ref: this.tabRef
			};

			if (!!this.props.draggable) {
				tabDom["onDragStart"] = this.dragStart;
				tabDom["onDragOver"] = this.dragOver;
				tabDom["onDragLeave"] = this.dragOut;
				tabDom["onDrop"] = this.drop;
				tabDom["draggable"] = "true";
			}

			return React.createElement(
				"div",
				tabDom,
				children,
				React.createElement("div", { className: "limiter" })
			);
		}
	}, {
		key: "onHover",
		value: function onHover(e) {
			this.setState({ hover: true });
			this.props.hoverHandler(this.props.tab);
		}
	}, {
		key: "onHoverOut",
		value: function onHoverOut(e) {
			this.setState({ hover: false });
		}
	}, {
		key: "onMouseDown",
		value: function onMouseDown(e) {
			if (e.button === 0) return;
			if (!this.props.draggable) return;
			this.click(e);
		}
	}, {
		key: "click",
		value: function () {
			var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(e) {
				var tabId, windowId;
				return regeneratorRuntime.wrap(function _callee3$(_context3) {
					while (1) {
						switch (_context3.prev = _context3.next) {
							case 0:
								this.stopProp(e);

								tabId = this.props.tab.id;
								windowId = this.props.window.id;


								if (e.button === 1) {
									this.props.middleClick(tabId);
								} else if (e.button === 2 || e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey) {
									e.preventDefault();
									if (e.button === 2 && (e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)) {
										this.props.selectTo(tabId);
									} else {
										this.props.select(tabId);
									}
								} else {
									if (!!this.props.click) {
										this.props.click(e, this.props.tab.id);
									} else {
										if (navigator.userAgent.search("Firefox") > -1) {
											browser.runtime.sendMessage({
												command: "focus_on_tab_and_window_delayed",
												tab: { id: tabId, windowId: windowId }
											});
										} else {
											browser.runtime.sendMessage({
												command: "focus_on_tab_and_window",
												tab: { id: tabId, windowId: windowId }
											});
										}
									}

									if (!!window.inPopup) window.close();
								}
								return _context3.abrupt("return", false);

							case 5:
							case "end":
								return _context3.stop();
						}
					}
				}, _callee3, this);
			}));

			function click(_x) {
				return _ref3.apply(this, arguments);
			}

			return click;
		}()
	}, {
		key: "dragStart",
		value: function dragStart(e) {
			if (!this.props.draggable) return false;
			if (!this.props.drag) return false;

			this.state.dragFavIcon = "";
			this.props.dragFavicon(this.state.favIcon);
			e.dataTransfer.setData("Text", this.props.tab.id);
			e.dataTransfer.setData("text/uri-list", this.props.tab.url || "");
			this.props.drag(e, this.props.tab.id);
		}
	}, {
		key: "dragOver",
		value: function dragOver(e) {
			if (!this.props.draggable) return false;
			if (!this.props.drag) return false;

			this.state.dragFavIcon = this.props.dragFavicon();

			var before = this.state.draggingOver;
			if (this.props.layout == "vertical") {
				this.state.draggingOver = e.nativeEvent.offsetY > ReactDOM.findDOMNode(this).clientHeight / 2 ? "bottom" : "top";
			} else {
				this.state.draggingOver = e.nativeEvent.offsetX > ReactDOM.findDOMNode(this).clientWidth / 2 ? "right" : "left";
			}
			if (before != this.state.draggingOver) {
				this.forceUpdate();
				this.props.parentUpdate();
			}
		}
	}, {
		key: "dragOut",
		value: function dragOut() {
			if (!this.props.draggable) return false;
			if (!this.props.drag) return;
			this.state.dragFavIcon = "";
			delete this.state.draggingOver;
			this.forceUpdate();
			this.props.parentUpdate();
		}
	}, {
		key: "drop",
		value: function drop(e) {
			if (!this.props.draggable) return false;
			if (!this.props.drag) return false;
			if (!this.props.drop) return;

			this.state.dragFavIcon = "";
			this.stopProp(e);
			var before = this.state.draggingOver == "top" || this.state.draggingOver == "left";
			delete this.state.draggingOver;

			this.props.drop(this.props.tab.id, before);
			this.forceUpdate();
			this.props.parentUpdate();
		}
	}, {
		key: "resolveFavIconUrl",
		value: function () {
			var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
				var image, favIcons, iconUrl, iconName;
				return regeneratorRuntime.wrap(function _callee4$(_context4) {
					while (1) {
						switch (_context4.prev = _context4.next) {
							case 0:
								if (!!this.props.tab.url && navigator.userAgent.search("Firefox") == -1) {
									image = "chrome-extension://" + chrome.runtime.id + "/_favicon/?pageUrl=" + encodeURIComponent(this.props.tab.url) + "&size=64&" + Date.now();
								} else if (!!this.props.tab.url && this.props.tab.url.indexOf("chrome://") !== 0 && this.props.tab.url.indexOf("about:") !== 0) {
									image = this.props.tab.favIconUrl ? "" + this.props.tab.favIconUrl + "" : "";
								} else {
									favIcons = ["bookmarks", "chrome", "crashes", "downloads", "extensions", "flags", "history", "settings"];
									iconUrl = this.props.tab.url || "";
									iconName = "";

									if (iconUrl.length > 9) iconName = iconUrl.slice(9).match(/^\w+/g);
									image = !iconName || favIcons.indexOf(iconName[0]) < 0 ? "" : "../images/chrome/" + iconName[0] + ".png";
								}
								this.setState({
									favIcon: image
								});

							case 2:
							case "end":
								return _context4.stop();
						}
					}
				}, _callee4, this);
			}));

			function resolveFavIconUrl() {
				return _ref4.apply(this, arguments);
			}

			return resolveFavIconUrl;
		}()
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

	return Tab;
}(React.Component);
//# sourceMappingURL=Tab.js.map