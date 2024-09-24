"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var setWindowColor = function () {
	var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(windowId, color) {
		var colors;
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						_context.next = 2;
						return getLocalStorage("windowColors", {});

					case 2:
						colors = _context.sent;

						if ((typeof colors === "undefined" ? "undefined" : _typeof(colors)) !== 'object') colors = {};
						colors[windowId] = color;
						_context.next = 7;
						return setLocalStorage("windowColors", colors);

					case 7:
						_context.next = 9;
						return updateWindowHash(windowId);

					case 9:
						browser.runtime.sendMessage({
							command: "refresh_windows",
							window_ids: [windowId]
						});

					case 10:
					case "end":
						return _context.stop();
				}
			}
		}, _callee, this);
	}));

	return function setWindowColor(_x, _x2) {
		return _ref.apply(this, arguments);
	};
}();

var setWindowName = function () {
	var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(windowId, name) {
		var names;
		return regeneratorRuntime.wrap(function _callee2$(_context2) {
			while (1) {
				switch (_context2.prev = _context2.next) {
					case 0:
						_context2.next = 2;
						return getLocalStorage("windowNames", {});

					case 2:
						names = _context2.sent;

						if ((typeof names === "undefined" ? "undefined" : _typeof(names)) !== 'object') names = {};
						names[windowId] = name;
						_context2.next = 7;
						return setLocalStorage("windowNames", names);

					case 7:
						_context2.next = 9;
						return updateWindowHash(windowId);

					case 9:
						browser.runtime.sendMessage({
							command: "refresh_windows",
							window_ids: [windowId]
						});

					case 10:
					case "end":
						return _context2.stop();
				}
			}
		}, _callee2, this);
	}));

	return function setWindowName(_x3, _x4) {
		return _ref2.apply(this, arguments);
	};
}();

var updateWindowHash = function () {
	var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(windowId) {
		var window, hash, hashes;
		return regeneratorRuntime.wrap(function _callee3$(_context3) {
			while (1) {
				switch (_context3.prev = _context3.next) {
					case 0:
						_context3.next = 2;
						return browser.windows.get(windowId, { populate: true });

					case 2:
						window = _context3.sent;
						hash = hashcode(window);
						_context3.next = 6;
						return getLocalStorage("windowHashes", {});

					case 6:
						hashes = _context3.sent;

						hashes[windowId] = hash;
						_context3.next = 10;
						return setLocalStorage("windowHashes", hashes);

					case 10:
					case "end":
						return _context3.stop();
				}
			}
		}, _callee3, this);
	}));

	return function updateWindowHash(_x5) {
		return _ref3.apply(this, arguments);
	};
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var browser = browser || chrome;

function handleMessages(request, sender, sendResponse) {
	switch (request.command) {
		case "reload_popup_controls":
			setupPopup();
			break;
		case "update_tab_count":
			updateTabCount();
			break;
		case "discard_tabs":
			discardTabs(request.tabs);
			break;
		case "move_tabs_to_window":
			moveTabsToWindow(request.window_id, request.tabs);
			break;
		case "focus_on_tab_and_window":
			focusOnTabAndWindow(request.tab);
			break;
		case "focus_on_tab_and_window_delayed":
			focusOnTabAndWindowDelayed(request.tab);
			break;
		case "focus_on_window":
			focusOnWindow(request.window_id);
			break;
		case "focus_on_window_delayed":
			focusOnWindowDelayed(request.window_id);
			break;
		case "set_window_color":
			setWindowColor(request.window_id, request.color);
			break;
		case "set_window_name":
			setWindowName(request.window_id, request.name);
			break;
		case "create_window_with_tabs":
			createWindowWithTabs(request.tabs);
			break;
		case "create_window_with_session_tabs":
			createWindowWithSessionTabs(request.window, request.tab_id);
			break;
		case "close_tabs":
			closeTabs(request.tabs);
			break;
	}
}

function handleCommands(command) {
	if (command == "switch_to_previous_active_tab") {
		if (!!globalTabsActive && globalTabsActive.length > 1) {
			focusOnTabAndWindow(globalTabsActive[globalTabsActive.length - 2]);
		}
	}
}
//# sourceMappingURL=actions.js.map