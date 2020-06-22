"use strict";var createWindowWithTabs = function () {var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(





	function _callee(tabs, isIncognito) {var pinnedIndex, firstTab, t, i, firstPinned, w, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, oldTabId, oldTab, tabPinned, movedTabs, newTab;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:

						pinnedIndex = 0;
						firstTab = tabs.shift();
						t = [];
						for (i = 0; i < tabs.length; i++) {
							t.push(tabs[i].id);
						};

						firstPinned = firstTab.pinned;_context.next = 8;return (
							browser.windows.create({ tabId: firstTab.id, incognito: !!isIncognito }));case 8:w = _context.sent;if (!
						firstPinned) {_context.next = 13;break;}_context.next = 12;return (
							browser.tabs.update(w.tabs[0].id, { pinned: firstPinned }));case 12:
						pinnedIndex++;case 13:if (!(


						t.length > 0)) {_context.next = 60;break;}
						i = 0;_iteratorNormalCompletion2 = true;_didIteratorError2 = false;_iteratorError2 = undefined;_context.prev = 18;_iterator2 =
						t[Symbol.iterator]();case 20:if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {_context.next = 45;break;}oldTabId = _step2.value;
						i++;_context.next = 25;return (
							browser.tabs.get(oldTabId));case 25:oldTab = _context.sent;
						tabPinned = oldTab.pinned;
						movedTabs = [];if (
						tabPinned) {_context.next = 34;break;}_context.next = 31;return (
							browser.tabs.move(oldTabId, { windowId: w.id, index: -1 }));case 31:movedTabs = _context.sent;_context.next = 37;break;case 34:_context.next = 36;return (

							browser.tabs.move(oldTabId, { windowId: w.id, index: pinnedIndex++ }));case 36:movedTabs = _context.sent;case 37:if (!(

						movedTabs.length > 0)) {_context.next = 42;break;}
						newTab = movedTabs[0];if (!
						tabPinned) {_context.next = 42;break;}_context.next = 42;return (
							browser.tabs.update(newTab.id, { pinned: tabPinned }));case 42:_iteratorNormalCompletion2 = true;_context.next = 20;break;case 45:_context.next = 51;break;case 47:_context.prev = 47;_context.t0 = _context["catch"](18);_didIteratorError2 = true;_iteratorError2 = _context.t0;case 51:_context.prev = 51;_context.prev = 52;if (!_iteratorNormalCompletion2 && _iterator2.return) {_iterator2.return();}case 54:_context.prev = 54;if (!_didIteratorError2) {_context.next = 57;break;}throw _iteratorError2;case 57:return _context.finish(54);case 58:return _context.finish(51);case 59:


						;case 60:_context.next = 62;return (

							browser.windows.update(w.id, { focused: true }));case 62:case "end":return _context.stop();}}}, _callee, this, [[18, 47, 51, 59], [52,, 54, 58]]);}));return function createWindowWithTabs(_x, _x2) {return _ref.apply(this, arguments);};}();var focusOnTabAndWindow = function () {var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(







	function _callee2(tab) {var windowId, tabId;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:
						windowId = tab.windowId;

						if (!!tab.tabId) {
							tabId = tab.tabId;
						} else {
							tabId = tab.id;
						}

						browser.windows.update(windowId, { focused: true }).then(function (tabId, windowId) {
							browser.tabs.update(tabId, { active: true }).then(function (tabId, windowId) {
								tabActiveChanged({ tabId: tabId, windowId: windowId });
							}.bind(this, tabId, windowId));
						}.bind(this, tabId, windowId));case 3:case "end":return _context2.stop();}}}, _callee2, this);}));return function focusOnTabAndWindow(_x3) {return _ref2.apply(this, arguments);};}();var updateTabCount = function () {var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(










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









	function _callee4(tab) {var tabLimit, tabCount;return regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:
						if (typeof localStorage["tabLimit"] === "undefined") localStorage["tabLimit"] = "0";
						try {
							tabLimit = JSON.parse(localStorage["tabLimit"]);
						} catch (e) {
							tabLimit = 0;
						}if (!(
						tabLimit > 0)) {_context4.next = 10;break;}if (!(
						tab.id != browser.tabs.TAB_ID_NONE)) {_context4.next = 10;break;}_context4.next = 6;return (
							browser.tabs.query({ currentWindow: true }));case 6:tabCount = _context4.sent;if (!(
						tabCount.length > tabLimit)) {_context4.next = 10;break;}_context4.next = 10;return (
							createWindowWithTabs([tab], tab.incognito));case 10:



						updateTabCountDebounce();case 11:case "end":return _context4.stop();}}}, _callee4, this);}));return function tabAdded(_x4) {return _ref4.apply(this, arguments);};}();var openSidebar = function () {var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(


























	function _callee5() {return regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:_context5.next = 2;return (
							browser.sidebarAction.open());case 2:case "end":return _context5.stop();}}}, _callee5, this);}));return function openSidebar() {return _ref5.apply(this, arguments);};}();var openPopup = function () {var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(


	function _callee6() {var openInOwnTab;return regeneratorRuntime.wrap(function _callee6$(_context6) {while (1) {switch (_context6.prev = _context6.next) {case 0:
						if (typeof localStorage["openInOwnTab"] === "undefined") localStorage["openInOwnTab"] = "0";
						openInOwnTab = false;
						try {
							openInOwnTab = !!JSON.parse(localStorage["openInOwnTab"]);
						} catch (e) {
							openInOwnTab = false;
						}if (!
						openInOwnTab) {_context6.next = 12;break;}_context6.next = 6;return (
							browser.browserAction.setPopup({ popup: "popup.html?popup=true" }));case 6:_context6.next = 8;return (
							browser.browserAction.openPopup());case 8:_context6.next = 10;return (
							browser.browserAction.setPopup({ popup: "" }));case 10:_context6.next = 14;break;case 12:_context6.next = 14;return (

							browser.browserAction.openPopup());case 14:case "end":return _context6.stop();}}}, _callee6, this);}));return function openPopup() {return _ref6.apply(this, arguments);};}();var openAsOwnTab = function () {var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(



	function _callee7() {var popup_page, tabs, currentTab, previousTab, i, tab;return regeneratorRuntime.wrap(function _callee7$(_context7) {while (1) {switch (_context7.prev = _context7.next) {case 0:
						popup_page = browser.runtime.getURL("popup.html");_context7.next = 3;return (
							browser.tabs.query({}));case 3:tabs = _context7.sent;



						if (!!window.tabsActive && window.tabsActive.length > 1) {
							currentTab = window.tabsActive[window.tabsActive.length - 1];
							previousTab = window.tabsActive[window.tabsActive.length - 2];
						}

						i = 0;case 6:if (!(i < tabs.length)) {_context7.next = 17;break;}
						tab = tabs[i];if (!(
						tab.url.indexOf("popup.html") > -1 && tab.url.indexOf(popup_page) > -1)) {_context7.next = 14;break;}if (!(
						currentTab && currentTab.tabId && tab.id == currentTab.tabId && previousTab && previousTab.tabId)) {_context7.next = 13;break;}return _context7.abrupt("return",
						focusOnTabAndWindow(previousTab));case 13:return _context7.abrupt("return",

						browser.windows.update(tab.windowId, { focused: true }).then(
						function () {
							browser.tabs.highlight({ windowId: tab.windowId, tabs: tab.index });
						}.bind(this)));case 14:i++;_context7.next = 6;break;case 17:return _context7.abrupt("return",




						browser.tabs.create({ url: "popup.html" }));case 18:case "end":return _context7.stop();}}}, _callee7, this);}));return function openAsOwnTab() {return _ref7.apply(this, arguments);};}();var setupPopup = function () {var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(


	function _callee8() {var openInOwnTab;return regeneratorRuntime.wrap(function _callee8$(_context8) {while (1) {switch (_context8.prev = _context8.next) {case 0:
						if (typeof localStorage["openInOwnTab"] === "undefined") localStorage["openInOwnTab"] = "0";
						openInOwnTab = false;
						try {
							openInOwnTab = !!JSON.parse(localStorage["openInOwnTab"]);
						} catch (e) {
							openInOwnTab = false;
						}
						console.log(openInOwnTab);_context8.next = 6;return (
							browser.browserAction.onClicked.removeListener(openAsOwnTab));case 6:if (!
						openInOwnTab) {_context8.next = 13;break;}_context8.next = 9;return (
							browser.browserAction.setPopup({ popup: "" }));case 9:_context8.next = 11;return (
							browser.browserAction.onClicked.addListener(openAsOwnTab));case 11:_context8.next = 15;break;case 13:_context8.next = 15;return (

							browser.browserAction.setPopup({ popup: "popup.html?popup=true" }));case 15:

						if (browser.sidebarAction) {
							browser.sidebarAction.setPanel({ panel: "popup.html?panel=true" });
						}case 16:case "end":return _context8.stop();}}}, _callee8, this);}));return function setupPopup() {return _ref8.apply(this, arguments);};}();var setupListeners = function () {var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(


	function _callee9() {return regeneratorRuntime.wrap(function _callee9$(_context9) {while (1) {switch (_context9.prev = _context9.next) {case 0:_context9.next = 2;return (

							browser.contextMenus.removeAll());case 2:
						browser.contextMenus.create({
							title: "📔 Open in own tab",
							contexts: ["browser_action"],
							onclick: openAsOwnTab });

						if (!!browser.browserAction.openPopup) {
							browser.contextMenus.create({
								title: "📑 Open popup",
								contexts: ["browser_action"],
								onclick: openPopup });
						}

						if (!!browser.sidebarAction) {
							browser.contextMenus.create({
								title: "🗂 Open sidebar",
								contexts: ["browser_action"],
								onclick: openSidebar });
						}

						browser.contextMenus.create({
							type: "separator",
							contexts: ["browser_action"] });

						browser.contextMenus.create({
							title: "😍 Support this extension",
							id: "support_menu",
							"contexts": ["browser_action"] });


						browser.contextMenus.create({
							title: "⭐ Leave a review",
							"contexts": ["browser_action"],
							parentId: "support_menu",
							onclick: function onclick(info, tab) {
								if (navigator.userAgent.search("Firefox") > -1) {
									browser.tabs.create({ url: 'https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/' });
								} else {
									browser.tabs.create({ url: 'https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff' });
								}
							} });

						browser.contextMenus.create({
							title: "☕ Donate to keep Extensions Alive",
							"contexts": ["browser_action"],
							parentId: "support_menu",
							onclick: function onclick(info, tab) {
								browser.tabs.create({ url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW' });
							} });

						browser.contextMenus.create({
							title: "💰 Become a Patron",
							"contexts": ["browser_action"],
							parentId: "support_menu",
							onclick: function onclick(info, tab) {
								browser.tabs.create({ url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW' });
							} });

						browser.contextMenus.create({
							title: "🐦 Follow on Twitter",
							"contexts": ["browser_action"],
							parentId: "support_menu",
							onclick: function onclick(info, tab) {
								browser.tabs.create({ url: 'https://www.twitter.com/mastef' });
							} });

						browser.contextMenus.create({
							title: "🤔 Issues and Suggestions",
							id: "code_menu",
							"contexts": ["browser_action"] });


						browser.contextMenus.create({
							title: "🆕 View recent changes",
							"contexts": ["browser_action"],
							parentId: "code_menu",
							onclick: function onclick(info, tab) {
								browser.tabs.create({ url: 'changelog.html' });
							} });

						browser.contextMenus.create({
							title: "⚙ Edit Options",
							"contexts": ["browser_action"],
							parentId: "code_menu",
							onclick: function onclick(info, tab) {
								browser.tabs.create({ url: 'options.html' });
							} });

						browser.contextMenus.create({
							title: "💻 View source code",
							"contexts": ["browser_action"],
							parentId: "code_menu",
							onclick: function onclick(info, tab) {
								browser.tabs.create({ url: 'https://github.com/stefanXO/Tab-Manager-Plus' });
							} });

						browser.contextMenus.create({
							title: "🤔 Report an issue",
							"contexts": ["browser_action"],
							parentId: "code_menu",
							onclick: function onclick(info, tab) {
								browser.tabs.create({ url: 'https://github.com/stefanXO/Tab-Manager-Plus/issues' });
							} });

						browser.contextMenus.create({
							title: "💡 Send a suggestion",
							"contexts": ["browser_action"],
							parentId: "code_menu",
							onclick: function onclick(info, tab) {
								browser.tabs.create({ url: 'https://github.com/stefanXO/Tab-Manager-Plus/issues' });
								browser.tabs.create({ url: 'mailto:markus+tmp@stefanxo.com' });
							} });

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
						updateTabCountDebounce();

						setTimeout(cleanUp, 5000);case 42:case "end":return _context9.stop();}}}, _callee9, this);}));return function setupListeners() {return _ref9.apply(this, arguments);};}();


// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
var hideWindows = function () {var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(

























































	function _callee11(windowId) {var result;return regeneratorRuntime.wrap(function _callee11$(_context11) {while (1) {switch (_context11.prev = _context11.next) {case 0:if (!(
						navigator.userAgent.search("Firefox") > -1)) {_context11.next = 2;break;}return _context11.abrupt("return");case 2:if (!(



						!windowId || windowId < 0)) {_context11.next = 6;break;}return _context11.abrupt("return");case 6:if (!


						localStorageAvailable()) {_context11.next = 12;break;}
						if (typeof localStorage["hideWindows"] === "undefined") localStorage["hideWindows"] = "0";if (!(
						localStorage["hideWindows"] == "0")) {_context11.next = 10;break;}return _context11.abrupt("return");case 10:_context11.next = 14;break;case 12:

						console.log("no local storage");return _context11.abrupt("return");case 14:_context11.next = 16;return (



							browser.permissions.contains({ permissions: ['system.display'] }));case 16:result = _context11.sent;
						if (result) {
							// The extension has the permissions.
							chrome.system.display.getInfo(function () {var _ref11 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(windowId, displaylayouts) {var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, displaylayout, windows, monitor, i, a, result;return regeneratorRuntime.wrap(function _callee10$(_context10) {while (1) {switch (_context10.prev = _context10.next) {case 0:
													window.displayInfo = [];
													_iteratorNormalCompletion = true;
													_didIteratorError = false;
													_iteratorError = undefined;_context10.prev = 4;

													for (_iterator = displaylayouts[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {displaylayout = _step.value;
														window.displayInfo.push(displaylayout.bounds);
													}_context10.next = 12;break;case 8:_context10.prev = 8;_context10.t0 = _context10["catch"](4);

													_didIteratorError = true;
													_iteratorError = _context10.t0;case 12:_context10.prev = 12;_context10.prev = 13;


													if (!_iteratorNormalCompletion && _iterator.return) {
														_iterator.return();
													}case 15:_context10.prev = 15;if (!

													_didIteratorError) {_context10.next = 18;break;}throw (
														_iteratorError);case 18:return _context10.finish(15);case 19:return _context10.finish(12);case 20:_context10.next = 22;return (



														browser.windows.getAll({ populate: true }));case 22:windows = _context10.sent;
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

													i = windows.length - 1;case 27:if (!(i >= 0)) {_context10.next = 35;break;}if (!(
													windows[i].id != windowId)) {_context10.next = 32;break;}if (!
													is_in_bounds(windows[i], window.displayInfo[monitor])) {_context10.next = 32;break;}_context10.next = 32;return (
														browser.windows.update(windows[i].id, { "state": "minimized" }));case 32:i--;_context10.next = 27;break;case 35:


													;case 36:case "end":return _context10.stop();}}}, _callee10, this, [[4, 8, 12, 20], [13,, 15, 19]]);}));return function (_x6, _x7) {return _ref11.apply(this, arguments);};}().
							bind(null, windowId));
						}case 18:case "end":return _context11.stop();}}}, _callee11, this);}));return function hideWindows(_x5) {return _ref10.apply(this, arguments);};}();var cleanUp = function () {var _ref13 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(







































































	function _callee13() {var activewindows, windowids, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, w, windows, i, names, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, id;return regeneratorRuntime.wrap(function _callee13$(_context13) {while (1) {switch (_context13.prev = _context13.next) {case 0:_context13.next = 2;return (
							browser.windows.getAll({ populate: true }));case 2:activewindows = _context13.sent;
						windowids = [];_iteratorNormalCompletion3 = true;_didIteratorError3 = false;_iteratorError3 = undefined;_context13.prev = 7;
						for (_iterator3 = activewindows[Symbol.iterator](); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {w = _step3.value;
							windowids.push(w.id);
						}
						// console.log("window ids...", windowids);
						_context13.next = 15;break;case 11:_context13.prev = 11;_context13.t0 = _context13["catch"](7);_didIteratorError3 = true;_iteratorError3 = _context13.t0;case 15:_context13.prev = 15;_context13.prev = 16;if (!_iteratorNormalCompletion3 && _iterator3.return) {_iterator3.return();}case 18:_context13.prev = 18;if (!_didIteratorError3) {_context13.next = 21;break;}throw _iteratorError3;case 21:return _context13.finish(18);case 22:return _context13.finish(15);case 23:windows = JSON.parse(localStorage["windowAge"]);
						if (windows instanceof Array) {

						} else {
							windows = [];
						}
						// console.log("before", JSON.parse(JSON.stringify(windows)));
						for (i = windows.length - 1; i >= 0; i--) {
							if (windowids.indexOf(windows[i]) < 0) {
								// console.log("did not find", windows[i], i);
								windows.splice(i, 1);
							}
						};
						// console.log("after", JSON.parse(JSON.stringify(windows)));
						localStorage["windowAge"] = JSON.stringify(windows);

						names = localStorage["windowNames"];
						if (!!names) {
							names = JSON.parse(names);
						} else {
							names = {};
						}

						// console.log("before", JSON.parse(JSON.stringify(names)));
						_iteratorNormalCompletion4 = true;_didIteratorError4 = false;_iteratorError4 = undefined;_context13.prev = 33;for (_iterator4 = Object.keys(names)[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {id = _step4.value;
							if (windowids.indexOf(parseInt(id)) < 0) {
								// console.log("did not find", id);
								delete names[id];
							}
						}
						// console.log("after", JSON.parse(JSON.stringify(names)));
						_context13.next = 41;break;case 37:_context13.prev = 37;_context13.t1 = _context13["catch"](33);_didIteratorError4 = true;_iteratorError4 = _context13.t1;case 41:_context13.prev = 41;_context13.prev = 42;if (!_iteratorNormalCompletion4 && _iterator4.return) {_iterator4.return();}case 44:_context13.prev = 44;if (!_didIteratorError4) {_context13.next = 47;break;}throw _iteratorError4;case 47:return _context13.finish(44);case 48:return _context13.finish(41);case 49:localStorage["windowNames"] = JSON.stringify(names);case 50:case "end":return _context13.stop();}}}, _callee13, this, [[7, 11, 15, 23], [16,, 18, 22], [33, 37, 41, 49], [42,, 44, 48]]);}));return function cleanUp() {return _ref13.apply(this, arguments);};}();function _asyncToGenerator(fn) {return function () {var gen = fn.apply(this, arguments);return new Promise(function (resolve, reject) {function step(key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {return Promise.resolve(value).then(function (value) {step("next", value);}, function (err) {step("throw", err);});}}return step("next");});};}var browser = browser || chrome;window.tabsActive = [];window.displayInfo = [];function focusOnTabAndWindowDelayed(tab) {var tab = JSON.parse(JSON.stringify(tab));setTimeout(focusOnTabAndWindow.bind(this, tab), 125);}function focusOnWindowDelayed(windowId) {setTimeout(focusOnWindow.bind(this, windowId), 125);}function focusOnWindow(windowId) {browser.windows.update(windowId, { focused: true });}var updateTabCountDebounce = debounce(updateTabCount, 250);function tabRemoved() {updateTabCountDebounce();}function tabActiveChanged(tab) {if (!!tab && !!tab.tabId) {if (!window.tabsActive) window.tabsActive = [];if (!!window.tabsActive && window.tabsActive.length > 0) {var lastActive = window.tabsActive[window.tabsActive.length - 1];if (!!lastActive && lastActive.tabId == tab.tabId && lastActive.windowId == tab.windowId) {return;}}while (window.tabsActive.length > 20) {window.tabsActive.shift();}for (var i = window.tabsActive.length - 1; i >= 0; i--) {if (window.tabsActive[i].tabId == tab.tabId) {window.tabsActive.splice(i, 1);}};window.tabsActive.push(tab);}updateTabCountDebounce();}function debounce(func, wait, immediate) {var timeout;return function () {var context = this,args = arguments;var later = function later() {timeout = null;if (!immediate) func.apply(context, args);};var callNow = immediate && !timeout;clearTimeout(timeout);timeout = setTimeout(later, wait);if (callNow) func.apply(context, args);};};function localStorageAvailable() {var test = 'test';try {localStorage.setItem(test, test);localStorage.removeItem(test);return true;} catch (e) {return false;}}function windowFocus(windowId) {try {if (!!windowId) {windowActive(windowId); // console.log("onFocused", windowId);
			hideWindows(windowId);}} catch (e) {}}function windowCreated(window) {try {if (!!window && !!window.id) {windowActive(window.id);}} catch (e) {} // console.log("onCreated", window.id);
}function windowRemoved(windowId) {try {if (!!windowId) {windowActive(windowId);}} catch (e) {} // console.log("onRemoved", windowId);
}function is_in_bounds(object, bounds) {var C = object,B = bounds;if (C.left >= B.left && C.left <= B.left + B.width) {if (C.top >= B.top && C.top <= B.top + B.height) {return true;}}return false;};function windowActive(windowId) {if (windowId < 0) return;var windows = JSON.parse(localStorage["windowAge"]);if (windows instanceof Array) {} else {windows = [];}if (windows.indexOf(windowId) > -1) windows.splice(windows.indexOf(windowId), 1);windows.unshift(windowId);localStorage["windowAge"] = JSON.stringify(windows); // browser.windows.getLastFocused({ populate: true }, function (w) {
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
}browser.commands.onCommand.addListener(function (command) {if (command == "switch_to_previous_active_tab") {if (!!window.tabsActive && window.tabsActive.length > 1) {focusOnTabAndWindow(window.tabsActive[window.tabsActive.length - 2]);}}});browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {if (request.command == "reload_popup_controls") {setupPopup();}});_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12() {var windows, i;return regeneratorRuntime.wrap(function _callee12$(_context12) {while (1) {switch (_context12.prev = _context12.next) {case 0:_context12.next = 2;return browser.windows.getAll({ populate: true });case 2:windows = _context12.sent;localStorage["windowAge"] = JSON.stringify([]);if (!!windows && windows.length > 0) {windows.sort(function (a, b) {if (a.id < b.id) return 1;if (a.id > b.id) return -1;return 0;});for (i = 0; i < windows.length; i++) {if (!!windows[i].id) windowActive(windows[i].id);};}case 5:case "end":return _context12.stop();}}}, _callee12, this);}))();setInterval(setupListeners, 300000);setupListeners();