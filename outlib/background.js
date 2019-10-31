"use strict";var createWindowWithTabs = function () {var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(



	function _callee(tabs, isIncognito) {var first, t, i, w, tab;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
						first = tabs.shift();
						t = [];
						for (i = 0; i < tabs.length; i++) {
							t.push(tabs[i].id);
						};_context.next = 6;return (
							browser.windows.create({ tabId: first.id, incognito: !!isIncognito }));case 6:w = _context.sent;_context.next = 9;return (
							browser.tabs.update(first.id, { pinned: first.pinned }));case 9:if (!(
						t.length > 0)) {_context.next = 15;break;}_context.next = 12;return (
							browser.tabs.move(t, { windowId: w.id, index: -1 }));case 12:tab = _context.sent;_context.next = 15;return (
							browser.tabs.update(tab.id, { pinned: tab.pinned }));case 15:_context.next = 17;return (

							browser.windows.update(w.id, { focused: true }));case 17:case "end":return _context.stop();}}}, _callee, this);}));return function createWindowWithTabs(_x, _x2) {return _ref.apply(this, arguments);};}();var focusOnTabAndWindow = function () {var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(


	function _callee2(tab) {return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_context2.next = 2;return (
							browser.windows.update(tab.windowId, { focused: true }));case 2:if (
						!tab.tabId) {_context2.next = 8;break;}_context2.next = 5;return (
							browser.tabs.update(tab.tabId, { active: true }));case 5:
						tabActiveChanged(tab);_context2.next = 11;break;case 8:_context2.next = 10;return (

							browser.tabs.update(tab.id, { active: true }));case 10:
						tabActiveChanged({ tabId: tab.id, windowId: tab.windowId });case 11:case "end":return _context2.stop();}}}, _callee2, this);}));return function focusOnTabAndWindow(_x3) {return _ref2.apply(this, arguments);};}();var updateTabCount = function () {var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(



	function _callee3() {var run, result, count, toRemove, i, t, found, j;return regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0:
						run = true;
						if (localStorageAvailable()) {
							if (typeof localStorage["badge"] === "undefined") localStorage["badge"] = "1";
							if (localStorage["badge"] == "0") run = false;
						}if (!

						run) {_context3.next = 18;break;}_context3.next = 5;return (
							browser.tabs.query({}));case 5:result = _context3.sent;
						count = 0;
						if (!!result && !!result.length) {
							count = result.length;
						}_context3.next = 10;return (
							browser.browserAction.setBadgeText({ text: count + "" }));case 10:_context3.next = 12;return (
							browser.browserAction.setBadgeBackgroundColor({ color: "purple" }));case 12:
						toRemove = [];
						if (!!window.tabsActive) {
							for (i = 0; i < window.tabsActive.length; i++) {
								t = window.tabsActive[i];
								found = false;
								if (!!result && !!result.length) {
									for (j = 0; j < result.length; j++) {
										if (result[j].id == t.tabId) found = true;
									};
								}
								if (!found) toRemove.push(i);
							};
						}
						// console.log("to remove", toRemove);
						for (i = toRemove.length - 1; i >= 0; i--) {
							// console.log("removing", toRemove[i]);
							if (!!window.tabsActive && window.tabsActive.length > 0) {
								if (!!window.tabsActive[toRemove[i]]) window.tabsActive.splice(toRemove[i], 1);
							}
						};_context3.next = 20;break;case 18:_context3.next = 20;return (

							browser.browserAction.setBadgeText({ text: "" }));case 20:case "end":return _context3.stop();}}}, _callee3, this);}));return function updateTabCount() {return _ref3.apply(this, arguments);};}();var tabAdded = function () {var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(











	function _callee4(tab) {var tabLimit;return regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:
						if (typeof localStorage["tabLimit"] === "undefined") localStorage["tabLimit"] = "0";
						try {
							tabLimit = JSON.parse(localStorage["tabLimit"]);
						} catch (e) {
							tabLimit = 0;
						}if (!(
						tabLimit > 0)) {_context4.next = 6;break;}if (!(
						tab.index >= tabLimit)) {_context4.next = 6;break;}_context4.next = 6;return (
							createWindowWithTabs([tab], tab.incognito));case 6:


						updateTabCountDebounce();case 7:case "end":return _context4.stop();}}}, _callee4, this);}));return function tabAdded(_x4) {return _ref4.apply(this, arguments);};}();var openAsOwnTab = function () {var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(


























	function _callee5() {var tabs, i, tab;return regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:_context5.next = 2;return (
							browser.tabs.query({}));case 2:tabs = _context5.sent;
						i = 0;case 4:if (!(i < tabs.length)) {_context5.next = 11;break;}
						tab = tabs[i];if (!(
						tab.url.indexOf("popup.html") > -1)) {_context5.next = 8;break;}return _context5.abrupt("return",
						browser.windows.update(tab.windowId, { focused: true }).then(
						function () {
							browser.tabs.highlight({ windowId: tab.windowId, tabs: tab.index });
						}.bind(this)));case 8:i++;_context5.next = 4;break;case 11:return _context5.abrupt("return",



						browser.tabs.create({ url: "popup.html" }));case 12:case "end":return _context5.stop();}}}, _callee5, this);}));return function openAsOwnTab() {return _ref5.apply(this, arguments);};}();var setupPopup = function () {var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(


	function _callee6() {var openInOwnTab;return regeneratorRuntime.wrap(function _callee6$(_context6) {while (1) {switch (_context6.prev = _context6.next) {case 0:
						if (typeof localStorage["openInOwnTab"] === "undefined") localStorage["openInOwnTab"] = "0";
						openInOwnTab = false;
						try {
							openInOwnTab = !!JSON.parse(localStorage["openInOwnTab"]);
						} catch (e) {
							openInOwnTab = false;
						}
						console.log(openInOwnTab);if (!
						openInOwnTab) {_context6.next = 11;break;}_context6.next = 7;return (
							browser.browserAction.setPopup({ popup: "" }));case 7:_context6.next = 9;return (
							browser.browserAction.onClicked.addListener(openAsOwnTab));case 9:_context6.next = 15;break;case 11:_context6.next = 13;return (

							browser.browserAction.setPopup({ popup: "popup.html?popup=true" }));case 13:_context6.next = 15;return (
							browser.browserAction.onClicked.removeListener(openAsOwnTab));case 15:case "end":return _context6.stop();}}}, _callee6, this);}));return function setupPopup() {return _ref6.apply(this, arguments);};}();var setupListeners = function () {var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(



	function _callee7() {return regeneratorRuntime.wrap(function _callee7$(_context7) {while (1) {switch (_context7.prev = _context7.next) {case 0:_context7.next = 2;return (

							browser.contextMenus.removeAll());case 2:_context7.next = 4;return (
							browser.contextMenus.create({
								title: "Open in own tab",
								contexts: ["browser_action"],
								onclick: openAsOwnTab }));case 4:_context7.next = 6;return (
							browser.contextMenus.create({
								type: "separator",
								contexts: ["browser_action"] }));case 6:_context7.next = 8;return (
							browser.contextMenus.create({
								title: "Donate to keep Extensions Alive",
								"contexts": ["browser_action"],
								onclick: function onclick(info, tab) {
									browser.tabs.create({ url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW' });
								} }));case 8:_context7.next = 10;return (


							browser.contextMenus.create({
								title: "Leave a review",
								"contexts": ["browser_action"],
								onclick: function onclick(info, tab) {
									if (navigator.userAgent.search("Firefox") > -1) {
										browser.tabs.create({ url: 'https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/' });
									} else {
										browser.tabs.create({ url: 'https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff' });
									}
								} }));case 10:_context7.next = 12;return (


							browser.contextMenus.create({
								title: "Report an issue",
								"contexts": ["browser_action"],
								onclick: function onclick(info, tab) {
									browser.tabs.create({ url: 'https://github.com/stefanXO/Tab-Manager-Plus/issues' });
								} }));case 12:_context7.next = 14;return (


							browser.contextMenus.create({
								title: "Send a suggestion",
								"contexts": ["browser_action"],
								onclick: function onclick(info, tab) {
									browser.tabs.create({ url: 'https://github.com/stefanXO/Tab-Manager-Plus/issues' });
									browser.tabs.create({ url: 'mailto:markus+tmp@stefanxo.com' });
								} }));case 14:

						setupPopup();

						browser.tabs.onCreated.removeListener(tabAdded);
						browser.tabs.onUpdated.removeListener(tabRemoved);
						browser.tabs.onRemoved.removeListener(tabRemoved);
						browser.tabs.onReplaced.removeListener(tabRemoved);
						browser.tabs.onDetached.removeListener(tabRemoved);
						browser.tabs.onAttached.removeListener(tabRemoved);
						browser.tabs.onActivated.removeListener(tabActiveChanged);
						browser.tabs.onMoved.removeListener(tabRemoved);
						browser.windows.onFocusChanged.removeListener(windowFocus);
						browser.windows.onCreated.removeListener(windowCreated);
						browser.windows.onRemoved.removeListener(windowRemoved);

						browser.tabs.onCreated.addListener(tabAdded);
						browser.tabs.onUpdated.addListener(tabRemoved);
						browser.tabs.onRemoved.addListener(tabRemoved);
						browser.tabs.onReplaced.addListener(tabRemoved);
						browser.tabs.onDetached.addListener(tabRemoved);
						browser.tabs.onAttached.addListener(tabRemoved);
						browser.tabs.onActivated.addListener(tabActiveChanged);
						browser.tabs.onMoved.addListener(tabRemoved);
						browser.windows.onFocusChanged.addListener(windowFocus);
						browser.windows.onCreated.addListener(windowCreated);
						browser.windows.onRemoved.addListener(windowRemoved);
						updateTabCountDebounce();case 38:case "end":return _context7.stop();}}}, _callee7, this);}));return function setupListeners() {return _ref7.apply(this, arguments);};}();


// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
var hideWindows = function () {var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(



























































	function _callee9(windowId) {var result;return regeneratorRuntime.wrap(function _callee9$(_context9) {while (1) {switch (_context9.prev = _context9.next) {case 0:if (!(
						!windowId || windowId < 0)) {_context9.next = 4;break;}return _context9.abrupt("return");case 4:if (!


						localStorageAvailable()) {_context9.next = 10;break;}
						if (typeof localStorage["hideWindows"] === "undefined") localStorage["hideWindows"] = "0";if (!(
						localStorage["hideWindows"] == "0")) {_context9.next = 8;break;}return _context9.abrupt("return");case 8:_context9.next = 12;break;case 10:

						console.log("no local storage");return _context9.abrupt("return");case 12:if (!(



						navigator.userAgent.search("Firefox") > -1)) {_context9.next = 14;break;}return _context9.abrupt("return");case 14:_context9.next = 16;return (



							browser.permissions.contains({ permissions: ['system.display'] }));case 16:result = _context9.sent;
						if (result) {
							// The extension has the permissions.
							chrome.system.display.getInfo(function () {var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(windowId, displaylayouts) {var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, displaylayout, windows, monitor, i, a, result;return regeneratorRuntime.wrap(function _callee8$(_context8) {while (1) {switch (_context8.prev = _context8.next) {case 0:
													window.displayInfo = [];
													_iteratorNormalCompletion = true;
													_didIteratorError = false;
													_iteratorError = undefined;_context8.prev = 4;

													for (_iterator = displaylayouts[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {displaylayout = _step.value;
														window.displayInfo.push(displaylayout.bounds);
													}_context8.next = 12;break;case 8:_context8.prev = 8;_context8.t0 = _context8["catch"](4);

													_didIteratorError = true;
													_iteratorError = _context8.t0;case 12:_context8.prev = 12;_context8.prev = 13;


													if (!_iteratorNormalCompletion && _iterator.return) {
														_iterator.return();
													}case 15:_context8.prev = 15;if (!

													_didIteratorError) {_context8.next = 18;break;}throw (
														_iteratorError);case 18:return _context8.finish(15);case 19:return _context8.finish(12);case 20:_context8.next = 22;return (



														browser.windows.getAll({ populate: true }));case 22:windows = _context8.sent;
													monitor = -1;
													for (i = windows.length - 1; i >= 0; i--) {
														if (windows[i].id == windowId) {
															for (a in window.displayInfo) {
																result = is_in_bounds(windows[i], window.displayInfo[a]);
																if (result) {
																	monitor = a;
																}
															}
														}
													};

													i = windows.length - 1;case 27:if (!(i >= 0)) {_context8.next = 35;break;}if (!(
													windows[i].id != windowId)) {_context8.next = 32;break;}if (!
													is_in_bounds(windows[i], window.displayInfo[monitor])) {_context8.next = 32;break;}_context8.next = 32;return (
														browser.windows.update(windows[i].id, { "state": "minimized" }));case 32:i--;_context8.next = 27;break;case 35:


													;case 36:case "end":return _context8.stop();}}}, _callee8, this, [[4, 8, 12, 20], [13,, 15, 19]]);}));return function (_x6, _x7) {return _ref9.apply(this, arguments);};}().
							bind(null, windowId));
						}case 18:case "end":return _context9.stop();}}}, _callee9, this);}));return function hideWindows(_x5) {return _ref8.apply(this, arguments);};}();function _asyncToGenerator(fn) {return function () {var gen = fn.apply(this, arguments);return new Promise(function (resolve, reject) {function step(key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {return Promise.resolve(value).then(function (value) {step("next", value);}, function (err) {step("throw", err);});}}return step("next");});};}var browser = browser || chrome;var updateTabCountDebounce = debounce(updateTabCount, 250);function tabRemoved() {updateTabCountDebounce();}window.tabsActive = [];function tabActiveChanged(tab) {if (!!tab && !!tab.tabId) {if (!window.tabsActive) window.tabsActive = [];if (!!window.tabsActive && window.tabsActive.length > 0) {var lastActive = window.tabsActive[window.tabsActive.length - 1];if (!!lastActive && lastActive.tabId == tab.tabId && lastActive.windowId == tab.windowId) {return;}}while (window.tabsActive.length > 20) {window.tabsActive.shift();}for (var i = window.tabsActive.length - 1; i >= 0; i--) {if (window.tabsActive[i].tabId == tab.tabId) {window.tabsActive.splice(i, 1);}};window.tabsActive.push(tab);}updateTabCountDebounce();}function debounce(func, wait, immediate) {var timeout;return function () {var context = this,args = arguments;var later = function later() {timeout = null;if (!immediate) func.apply(context, args);};var callNow = immediate && !timeout;clearTimeout(timeout);timeout = setTimeout(later, wait);if (callNow) func.apply(context, args);};};function localStorageAvailable() {var test = 'test';try {localStorage.setItem(test, test);localStorage.removeItem(test);return true;} catch (e) {return false;}}function windowFocus(windowId) {try {if (!!windowId) {windowActive(windowId); // console.log("onFocused", windowId);
			hideWindows(windowId);}} catch (e) {}}function windowCreated(window) {try {if (!!window && !!window.id) {windowActive(window.id);}} catch (e) {} // console.log("onCreated", window.id);
}function windowRemoved(windowId) {try {if (!!windowId) {windowActive(windowId);}} catch (e) {} // console.log("onRemoved", windowId);
}window.displayInfo = [];


function is_in_bounds(object, bounds) {
	var C = object,B = bounds;
	if (C.left >= B.left && C.left <= B.left + B.width) {
		if (C.top >= B.top && C.top <= B.top + B.height) {
			return true;
		}
	}
	return false;
};

function windowActive(windowId) {
	if (windowId < 0) return;
	var windows = JSON.parse(localStorage["windowAge"]);
	if (windows instanceof Array) {

	} else {
		windows = [];
	}
	if (windows.indexOf(windowId) > -1) windows.splice(windows.indexOf(windowId), 1);
	windows.unshift(windowId);
	localStorage["windowAge"] = JSON.stringify(windows);

	// browser.windows.getLastFocused({ populate: true }, function (w) {
	// 	for (var i = 0; i < w.tabs.length; i++) {
	// 		var tab = w.tabs[i];
	// 		if (tab.active == true) {
	// 			// console.log("get last focused", tab.id);
	// 			// tabActiveChanged({
	// 			// 	tabId: tab.id,
	// 			// 	windowId: tab.windowId
	// 			// });
	// 		}
	// 	};
	// });
	// console.log(windows);
}

browser.commands.onCommand.addListener(function (command) {
	if (command == "switch_to_previous_active_tab") {
		if (!!window.tabsActive && window.tabsActive.length > 1) {
			focusOnTabAndWindow(window.tabsActive[window.tabsActive.length - 2]);
		}
	}
});

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.command == "reload_popup_controls") {
		setupPopup();
	}
});

_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10() {var windows, i;return regeneratorRuntime.wrap(function _callee10$(_context10) {while (1) {switch (_context10.prev = _context10.next) {case 0:_context10.next = 2;return (
						browser.windows.getAll({ populate: true }));case 2:windows = _context10.sent;
					localStorage["windowAge"] = JSON.stringify([]);
					if (!!windows && windows.length > 0) {
						windows.sort(function (a, b) {
							if (a.id < b.id) return 1;
							if (a.id > b.id) return -1;
							return 0;
						});
						for (i = 0; i < windows.length; i++) {
							if (!!windows[i].id) windowActive(windows[i].id);
						};
					}case 5:case "end":return _context10.stop();}}}, _callee10, this);}))();


setInterval(setupListeners, 300000);
setupListeners();