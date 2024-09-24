"use strict";

var openSidebar = function () {
	var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
		return regeneratorRuntime.wrap(function _callee3$(_context3) {
			while (1) {
				switch (_context3.prev = _context3.next) {
					case 0:
						_context3.next = 2;
						return browser.sidebarAction.open();

					case 2:
					case 'end':
						return _context3.stop();
				}
			}
		}, _callee3, this);
	}));

	return function openSidebar() {
		return _ref3.apply(this, arguments);
	};
}();

var setup = function () {
	var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
		return regeneratorRuntime.wrap(function _callee4$(_context4) {
			while (1) {
				switch (_context4.prev = _context4.next) {
					case 0:
						_context4.next = 2;
						return setupContextMenus();

					case 2:
						_context4.next = 4;
						return setupPopup();

					case 4:
						_context4.next = 6;
						return setupTabListeners();

					case 6:
						_context4.next = 8;
						return setupWindowListeners();

					case 8:

						updateTabCountDebounce();

						setTimeout(cleanupDebounce, 2500);

					case 10:
					case 'end':
						return _context4.stop();
				}
			}
		}, _callee4, this);
	}));

	return function setup() {
		return _ref4.apply(this, arguments);
	};
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

importScripts('../../vendor/babel-polyfill.js');
importScripts('../../vendor/browser-polyfill.min.js');

importScripts('../helpers/storage.js');
importScripts('../helpers/utils.js');

importScripts('./background/actions.js');
importScripts('./background/windows.js');
importScripts('./background/tabs.js');
importScripts('./background/tracking.js');

importScripts('./ui/context_menus.js');
importScripts('./ui/open.js');

var browser = browser || chrome;
var globalTabsActive = [];
var globalDisplayInfo = [];

browser.runtime.onStartup.addListener(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
	return regeneratorRuntime.wrap(function _callee$(_context) {
		while (1) {
			switch (_context.prev = _context.next) {
				case 0:
					console.log(" ON STARTUP");

				case 1:
				case 'end':
					return _context.stop();
			}
		}
	}, _callee, this);
})));

browser.runtime.onSuspend.addListener(_asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
	return regeneratorRuntime.wrap(function _callee2$(_context2) {
		while (1) {
			switch (_context2.prev = _context2.next) {
				case 0:
					console.log(" ON SUSPEND");

				case 1:
				case 'end':
					return _context2.stop();
			}
		}
	}, _callee2, this);
})));

var updateTabCountDebounce = debounce(updateTabCount, 250);
var cleanupDebounce = debounce(cleanUp, 500);

browser.commands.onCommand.addListener(handleCommands);
browser.runtime.onMessage.addListener(handleMessages);

_asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
	var windows, i;
	return regeneratorRuntime.wrap(function _callee5$(_context5) {
		while (1) {
			switch (_context5.prev = _context5.next) {
				case 0:
					_context5.next = 2;
					return browser.windows.getAll({ populate: true });

				case 2:
					windows = _context5.sent;
					_context5.next = 5;
					return setLocalStorage("windowAge", []);

				case 5:
					if (!(!!windows && windows.length > 0)) {
						_context5.next = 16;
						break;
					}

					windows.sort(function (a, b) {
						if (a.id < b.id) return 1;
						if (a.id > b.id) return -1;
						return 0;
					});
					i = 0;

				case 8:
					if (!(i < windows.length)) {
						_context5.next = 15;
						break;
					}

					if (!windows[i].id) {
						_context5.next = 12;
						break;
					}

					_context5.next = 12;
					return windowActive(windows[i].id);

				case 12:
					i++;
					_context5.next = 8;
					break;

				case 15:
					;

				case 16:
				case 'end':
					return _context5.stop();
			}
		}
	}, _callee5, this);
}))();

setInterval(setup, 300000);

setup();
//# sourceMappingURL=service_worker.js.map