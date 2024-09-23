"use strict";var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();function _asyncToGenerator(fn) {return function () {var gen = fn.apply(this, arguments);return new Promise(function (resolve, reject) {function step(key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {return Promise.resolve(value).then(function (value) {step("next", value);}, function (err) {step("throw", err);});}}return step("next");});};}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self, call) {if (!self) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call && (typeof call === "object" || typeof call === "function") ? call : self;}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;}var

Session = function (_React$Component) {_inherits(Session, _React$Component);
	function Session(props) {_classCallCheck(this, Session);var _this3 = _possibleConstructorReturn(this, (Session.__proto__ || Object.getPrototypeOf(Session)).call(this,
		props));


		var name = _this3.props.window.name;
		_this3.state = {
			windowTitles: [],
			name: name,
			tabs: 0 };


		_this3.stop = _this3.stop.bind(_this3);
		_this3.windowClick = _this3.windowClick.bind(_this3);
		_this3.windowTabClick = _this3.windowTabClick.bind(_this3);
		_this3.close = _this3.close.bind(_this3);
		_this3.openTab = _this3.openTab.bind(_this3);
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
				tab.id = tab.index;
				hideWindow &= isHidden;
				return (
					React.createElement(Tab, {
						id: "sessiontab_" + _this.props.window.id + "_" + tab.index,
						key: "sessiontab_" + _this.props.window.id + "_" + tab.index,
						window: _this.props.window,
						layout: _this.props.layout,
						tab: tab,
						selected: isSelected,
						hidden: isHidden,
						draggable: false,
						click: _this.openTab,
						middleClick: _this.props.tabMiddleClick,
						hoverHandler: _this.props.hoverHandler,
						searchActive: _this.props.searchActive,
						select: _this.props.select,
						ref: "sessiontab" + tabId }));


			});
			if (!hideWindow) {
				if (!!this.props.tabactions) {
					tabs.push(
					React.createElement("div", { key: "sessionnl_" + _this.props.window.id, className: "newliner" }),
					React.createElement("div", { key: "sessionwa_" + _this.props.window.id, className: "window-actions" },
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
						children.push(React.createElement("div", { key: "sessionnl_" + _this.props.window.id + "_" + j, className: "newliner" }));
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

			return true;
		} }, { key: "stop", value: function stop(
		e) {
			e.stopPropagation();
		} }, { key: "windowTabClick", value: function () {var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(
			e) {return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
								e.stopPropagation();case 1:case "end":return _context.stop();}}}, _callee, this);}));function windowTabClick(_x) {return _ref.apply(this, arguments);}return windowTabClick;}() }, { key: "windowClick", value: function () {var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(

			e) {return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:
								this.restoreSession(e, null);case 1:case "end":return _context2.stop();}}}, _callee2, this);}));function windowClick(_x2) {return _ref2.apply(this, arguments);}return windowClick;}() }, { key: "openTab", value: function () {var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(

			e, index) {return regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0:
								console.log(index);
								this.restoreSession(e, index);case 2:case "end":return _context3.stop();}}}, _callee3, this);}));function openTab(_x3, _x4) {return _ref3.apply(this, arguments);}return openTab;}() }, { key: "restoreSession", value: function () {var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(

			e, tabId) {var _this2;return regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:
								_this2 = this;
								e.stopPropagation();
								console.log("source window", this.props.window);




								browser.runtime.sendMessage({ command: "create_window_with_session_tabs", window: this.props.window, tab_id: tabId });



								this.props.parentUpdate();

								if (!!window.inPopup) {
									window.close();
								} else {
									setTimeout(function () {
										this.props.scrollTo("window", browser.windows.WINDOW_ID_CURRENT);
									}.bind(this), 500);
								}case 6:case "end":return _context4.stop();}}}, _callee4, this);}));function restoreSession(_x5, _x6) {return _ref4.apply(this, arguments);}return restoreSession;}() }, { key: "close", value: function () {var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(














			e) {var value;return regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:
								e.stopPropagation();_context5.next = 3;return (
									browser.storage.local.remove(this.props.window.id));case 3:value = _context5.sent;
								console.log(value);
								this.props.parentUpdate();case 6:case "end":return _context5.stop();}}}, _callee5, this);}));function close(_x7) {return _ref5.apply(this, arguments);}return close;}() }, { key: "maximize", value: function maximize(


		e) {
			e.stopPropagation();



		} }]);return Session;}(React.Component);