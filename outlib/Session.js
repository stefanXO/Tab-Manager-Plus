"use strict";var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();function _asyncToGenerator(fn) {return function () {var gen = fn.apply(this, arguments);return new Promise(function (resolve, reject) {function step(key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {return Promise.resolve(value).then(function (value) {step("next", value);}, function (err) {step("throw", err);});}}return step("next");});};}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self, call) {if (!self) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call && (typeof call === "object" || typeof call === "function") ? call : self;}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;}var

Session = function (_React$Component) {_inherits(Session, _React$Component);
	function Session(props) {_classCallCheck(this, Session);

		//console.log(this.props.window);
		//console.log(this.props.window.name);
		var _this3 = _possibleConstructorReturn(this, (Session.__proto__ || Object.getPrototypeOf(Session)).call(this, props));var name = _this3.props.window.name;
		_this3.state = {
			windowTitles: [],
			name: name,
			tabs: 0 };


		_this3.stop = _this3.stop.bind(_this3);
		_this3.windowClick = _this3.windowClick.bind(_this3);
		_this3.close = _this3.close.bind(_this3);
		_this3.maximize = _this3.maximize.bind(_this3);return _this3;

	}_createClass(Session, [{ key: "render", value: function render()
		{
			var _this = this;
			var name = this.props.window.name;
			var hideWindow = true;
			var titleAdded = false;
			var tabsperrow = this.props.layout.indexOf("blocks") > -1 ? Math.ceil(Math.sqrt(this.props.tabs.length + 2)) : this.props.layout == "vertical" ? 1 : 15;
			var tabs = this.props.tabs.map(function (tab) {
				var tabId = tab.id * tab.id * tab.id * 100;
				var isHidden = !!_this.props.hiddenTabs[tabId] && _this.props.filterTabs;
				var isSelected = !!_this.props.selection[tabId];
				tab.id = tabId;
				hideWindow &= isHidden;
				return (
					React.createElement(Tab, {
						key: "sessiontab_" + _this.props.window.id + "_" + tab.index,
						window: _this.props.window,
						layout: _this.props.layout,
						tab: tab,
						selected: isSelected,
						hidden: isHidden,
						middleClick: _this.props.tabMiddleClick,
						hoverHandler: _this.props.hoverHandler,
						searchActive: _this.props.searchActive,
						select: _this.props.select,
						ref: "sessiontab" + tabId,
						id: "sessiontab-" + tab.id }));


			});
			if (!hideWindow) {
				if (!!this.props.tabactions) {
					tabs.push(
					React.createElement("div", { className: "newliner" }),
					React.createElement("div", { className: "window-actions" },
						React.createElement("div", {
							className: "icon tabaction restore " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
							title: "Restore this saved window\nWill restore " + tabs.length + " tabs. Please note : The tabs will be restored without their history.",
							onClick: this.windowClick,
							onMouseEnter: this.props.hoverIcon }),

						React.createElement("div", {
							className: "icon tabaction delete " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
							title: "Delete this saved window\nWill delete " + tabs.length + " tabs permanently",
							onClick: this.close,
							onMouseEnter: this.props.hoverIcon })));



				}

				if (this.props.windowTitles) {
					if (name) {
						tabs.unshift(
						React.createElement("h3", { key: "session-" + this.props.window.id + "-windowTitle", className: "center windowTitle" },
							name));


						titleAdded = true;
					}
				}
				if (tabsperrow < 3) {
					tabsperrow = 3;
				}
				var children = [];
				if (!!titleAdded) {
					children.push(tabs.shift());
				}
				for (var j = 0; j < tabs.length; j++) {
					children.push(tabs[j]);
					if ((j + 1) % tabsperrow == 0 && j && this.props.layout.indexOf("blocks") > -1) {
						children.push(React.createElement("div", { className: "newliner" }));
					}
				}
				var focused = false;
				if (this.props.window.windowsInfo.focused || this.props.lastOpenWindow == this.props.window.windowsInfo.id) {
					focused = true;
				}
				return (
					React.createElement("div", {
							key: "session-" + this.props.window.id,
							id: "session-" + this.props.window.id,
							className:
							"window " +
							this.props.window.windowsInfo.state +
							" " + (
							focused ? "activeWindow" : "") +
							" session " + (
							this.props.layout.indexOf("blocks") > -1 ? "block" : "") +
							" " +
							this.props.layout +
							" " + (
							this.props.window.windowsInfo.incognito ? " incognito" : "") +
							" " + (
							focused ? " focused" : ""),

							onClick: this.windowClick },

						React.createElement("div", { className: "windowcontainer" }, children)));


			} else {
				return null;
			}
		} }, { key: "shouldComponentUpdate", value: function shouldComponentUpdate(
		nextProps, nextState) {
			//console.log("should update?", nextProps, nextState);
			return true;
		} }, { key: "stop", value: function stop(
		e) {
			this.stopProp(e);
		} }, { key: "windowClick", value: function () {var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(
			e) {var _this2, backgroundPage;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
								_this2 = this;
								this.stopProp(e);
								console.log("source window", this.props.window);
								// chrome.runtime.getBackgroundPage(function callback(tabs, backgroundPage) {
								// 	backgroundPage.createWindowWithTabs(tabs);
								// }.bind(null, this.props.window.tabs));
								_context.next = 5;return (
									browser.runtime.getBackgroundPage());case 5:backgroundPage = _context.sent;
								if (navigator.userAgent.search("Firefox") > -1) {
									backgroundPage.createWindowWithTabsFromSessionDelayed(this.props.window);
								} else {
									backgroundPage.createWindowWithTabsFromSession(this.props.window);
								}

								///////

								console.log("updating parent");

								this.props.parentUpdate();

								if (!!window.inPopup) {
									window.close();
								} else {
									setTimeout(function () {
										this.props.scrollTo("window", browser.windows.WINDOW_ID_CURRENT);
									}.bind(this), 250);
								}

								// , function (tabs, w) {
								// 	browser.tabs.create(first.id, { pinned: first.pinned });
								// 	if (t.length > 0) {
								// 		browser.tabs.move(t, { windowId: w.id, index: -1 }, function (tab) {
								// 			browser.tabs.update(tab.id, { pinned: tab.pinned });
								// 		});
								// 	}
								// 	browser.windows.update(w.id, { focused: true });
								// }.bind(null, this.props.window.tabs));
								// browser.windows.update(this.props.window.windowsInfo.id, {
								// 	"focused": true },
								// function (a) {this.props.parentUpdate();}.bind(this));
							case 10:case "end":return _context.stop();}}}, _callee, this);}));function windowClick(_x) {return _ref.apply(this, arguments);}return windowClick;}() }, { key: "close", value: function () {var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(
			e) {var value;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:
								this.stopProp(e);_context2.next = 3;return (
									browser.storage.local.remove(this.props.window.id));case 3:value = _context2.sent;
								console.log(value);
								this.props.parentUpdate();
								// browser.windows.remove(this.props.window.windowsInfo.id);
							case 6:case "end":return _context2.stop();}}}, _callee2, this);}));function close(_x2) {return _ref2.apply(this, arguments);}return close;}() }, { key: "maximize", value: function maximize(
		e) {
			this.stopProp(e);
			// browser.windows.update(this.props.window.windowsInfo.id, {
			// 	"state": "normal" },
			// function (a) {this.props.parentUpdate();}.bind(this));
		} }, { key: "stopProp", value: function stopProp(
		e) {
			if (e && e.nativeEvent) {
				e.nativeEvent.preventDefault();
				e.nativeEvent.stopPropagation();
			}
			if (e && e.preventDefault) {
				e.preventDefault();
				e.stopPropagation();
			}
		} }]);return Session;}(React.Component);