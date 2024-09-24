"use strict";

var openPopup = function () {
	var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
		var openInOwnTab;
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						_context.next = 2;
						return getLocalStorage("openInOwnTab", false);

					case 2:
						openInOwnTab = _context.sent;

						if (!openInOwnTab) {
							_context.next = 12;
							break;
						}

						_context.next = 6;
						return browser.action.setPopup({ popup: "popup.html?popup=true" });

					case 6:
						_context.next = 8;
						return browser.action.openPopup();

					case 8:
						_context.next = 10;
						return browser.action.setPopup({ popup: "" });

					case 10:
						_context.next = 14;
						break;

					case 12:
						_context.next = 14;
						return browser.action.openPopup();

					case 14:
					case "end":
						return _context.stop();
				}
			}
		}, _callee, this);
	}));

	return function openPopup() {
		return _ref.apply(this, arguments);
	};
}();

var openAsOwnTab = function () {
	var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
		var popup_page, tabs, currentTab, previousTab, i, tab;
		return regeneratorRuntime.wrap(function _callee2$(_context2) {
			while (1) {
				switch (_context2.prev = _context2.next) {
					case 0:
						popup_page = browser.runtime.getURL("popup.html");
						_context2.next = 3;
						return browser.tabs.query({});

					case 3:
						tabs = _context2.sent;

						if (!!globalTabsActive && globalTabsActive.length > 1) {
							currentTab = globalTabsActive[globalTabsActive.length - 1];
							previousTab = globalTabsActive[globalTabsActive.length - 2];
						}

						i = 0;

					case 6:
						if (!(i < tabs.length)) {
							_context2.next = 17;
							break;
						}

						tab = tabs[i];

						if (!(tab.url.indexOf("popup.html") > -1 && tab.url.indexOf(popup_page) > -1)) {
							_context2.next = 14;
							break;
						}

						if (!(currentTab && currentTab.tabId && tab.id == currentTab.tabId && previousTab && previousTab.tabId)) {
							_context2.next = 13;
							break;
						}

						return _context2.abrupt("return", focusOnTabAndWindow(previousTab));

					case 13:
						return _context2.abrupt("return", browser.windows.update(tab.windowId, { focused: true }).then(function () {
							browser.tabs.highlight({ windowId: tab.windowId, tabs: tab.index });
						}.bind(this)));

					case 14:
						i++;
						_context2.next = 6;
						break;

					case 17:
						return _context2.abrupt("return", browser.tabs.create({ url: "popup.html" }));

					case 18:
					case "end":
						return _context2.stop();
				}
			}
		}, _callee2, this);
	}));

	return function openAsOwnTab() {
		return _ref2.apply(this, arguments);
	};
}();

var setupPopup = function () {
	var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
		var openInOwnTab;
		return regeneratorRuntime.wrap(function _callee3$(_context3) {
			while (1) {
				switch (_context3.prev = _context3.next) {
					case 0:
						_context3.next = 2;
						return getLocalStorage("openInOwnTab", false);

					case 2:
						openInOwnTab = _context3.sent;
						_context3.next = 5;
						return browser.action.onClicked.removeListener(openAsOwnTab);

					case 5:
						if (!openInOwnTab) {
							_context3.next = 12;
							break;
						}

						_context3.next = 8;
						return browser.action.setPopup({ popup: "" });

					case 8:
						_context3.next = 10;
						return browser.action.onClicked.addListener(openAsOwnTab);

					case 10:
						_context3.next = 14;
						break;

					case 12:
						_context3.next = 14;
						return browser.action.setPopup({ popup: "popup.html?popup=true" });

					case 14:
						if (browser.sidebarAction) {
							browser.sidebarAction.setPanel({ panel: "popup.html?panel=true" });
						}

					case 15:
					case "end":
						return _context3.stop();
				}
			}
		}, _callee3, this);
	}));

	return function setupPopup() {
		return _ref3.apply(this, arguments);
	};
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var browser = browser || chrome;
//# sourceMappingURL=open.js.map