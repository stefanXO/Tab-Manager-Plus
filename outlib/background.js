"use strict";var createWindowWithTabs = function () {var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(
















	function _callee2(tabs, isIncognito) {var pinnedIndex, firstTab, t, i, firstPinned, w, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, oldTabId, oldTab, tabPinned, movedTabs, newTab;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:

						pinnedIndex = 0;
						firstTab = tabs.shift();
						t = [];
						for (i = 0; i < tabs.length; i++) {
							t.push(tabs[i].id);
						};

						firstPinned = firstTab.pinned;_context2.next = 8;return (
							browser.windows.create({ tabId: firstTab.id, incognito: !!isIncognito }));case 8:w = _context2.sent;if (!
						firstPinned) {_context2.next = 13;break;}_context2.next = 12;return (
							browser.tabs.update(w.tabs[0].id, { pinned: firstPinned }));case 12:
						pinnedIndex++;case 13:if (!(


						t.length > 0)) {_context2.next = 60;break;}
						i = 0;_iteratorNormalCompletion2 = true;_didIteratorError2 = false;_iteratorError2 = undefined;_context2.prev = 18;_iterator2 =
						t[Symbol.iterator]();case 20:if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {_context2.next = 45;break;}oldTabId = _step2.value;
						i++;_context2.next = 25;return (
							browser.tabs.get(oldTabId));case 25:oldTab = _context2.sent;
						tabPinned = oldTab.pinned;
						movedTabs = [];if (
						tabPinned) {_context2.next = 34;break;}_context2.next = 31;return (
							browser.tabs.move(oldTabId, { windowId: w.id, index: -1 }));case 31:movedTabs = _context2.sent;_context2.next = 37;break;case 34:_context2.next = 36;return (

							browser.tabs.move(oldTabId, { windowId: w.id, index: pinnedIndex++ }));case 36:movedTabs = _context2.sent;case 37:if (!(

						movedTabs.length > 0)) {_context2.next = 42;break;}
						newTab = movedTabs[0];if (!
						tabPinned) {_context2.next = 42;break;}_context2.next = 42;return (
							browser.tabs.update(newTab.id, { pinned: tabPinned }));case 42:_iteratorNormalCompletion2 = true;_context2.next = 20;break;case 45:_context2.next = 51;break;case 47:_context2.prev = 47;_context2.t0 = _context2["catch"](18);_didIteratorError2 = true;_iteratorError2 = _context2.t0;case 51:_context2.prev = 51;_context2.prev = 52;if (!_iteratorNormalCompletion2 && _iterator2.return) {_iterator2.return();}case 54:_context2.prev = 54;if (!_didIteratorError2) {_context2.next = 57;break;}throw _iteratorError2;case 57:return _context2.finish(54);case 58:return _context2.finish(51);case 59:


						;case 60:_context2.next = 62;return (

							browser.windows.update(w.id, { focused: true }));case 62:case "end":return _context2.stop();}}}, _callee2, this, [[18, 47, 51, 59], [52,, 54, 58]]);}));return function createWindowWithTabs(_x, _x2) {return _ref2.apply(this, arguments);};}();var focusOnTabAndWindow = function () {var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(







	function _callee3(tab) {var windowId, tabId;return regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0:
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
						}.bind(this, tabId, windowId));case 3:case "end":return _context3.stop();}}}, _callee3, this);}));return function focusOnTabAndWindow(_x3) {return _ref3.apply(this, arguments);};}();var updateTabCount = function () {var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(










	function _callee4() {var run, badge, result, count, toRemove, i, t, found, j;return regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:
						run = true;if (!
						localStorageAvailable()) {_context4.next = 10;break;}_context4.next = 4;return (
							getLocalStorage("badge"));case 4:badge = _context4.sent;if (!(
						typeof badge === "undefined")) {_context4.next = 9;break;}
						badge = "1";_context4.next = 9;return (
							setLocalStorage("badge", badge));case 9:

						if (badge == "0") run = false;case 10:if (!


						run) {_context4.next = 26;break;}_context4.next = 13;return (
							browser.tabs.query({}));case 13:result = _context4.sent;
						count = 0;
						if (!!result && !!result.length) {
							count = result.length;
						}_context4.next = 18;return (
							browser.action.setBadgeText({ text: count + "" }));case 18:_context4.next = 20;return (
							browser.action.setBadgeBackgroundColor({ color: "purple" }));case 20:
						toRemove = [];
						if (!!globalTabsActive) {
							for (i = 0; i < globalTabsActive.length; i++) {
								t = globalTabsActive[i];
								found = false;
								if (!!result && !!result.length) {
									for (j = 0; j < result.length; j++) {
										if (result[j].id == t.tabId) found = true;
									};
								}
								if (!found) toRemove.push(i);
							};
						}

						for (i = toRemove.length - 1; i >= 0; i--) {

							if (!!globalTabsActive && globalTabsActive.length > 0) {
								if (!!globalTabsActive[toRemove[i]]) globalTabsActive.splice(toRemove[i], 1);
							}
						};_context4.next = 28;break;case 26:_context4.next = 28;return (

							browser.action.setBadgeText({ text: "" }));case 28:case "end":return _context4.stop();}}}, _callee4, this);}));return function updateTabCount() {return _ref4.apply(this, arguments);};}();var tabAdded = function () {var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(









	function _callee5(tab) {var tL, tabLimit, tabCount;return regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:_context5.next = 2;return (
							getLocalStorage("tabLimit"));case 2:tL = _context5.sent;if (!(
						typeof tL === "undefined" || tL == null)) {_context5.next = 7;break;}
						tL = "0";_context5.next = 7;return (
							setLocalStorage("tabLimit", tL));case 7:

						try {
							tabLimit = JSON.parse(tL);
						} catch (e) {
							tabLimit = 0;
						}if (!(

						tabLimit > 0)) {_context5.next = 16;break;}if (!(
						tab.id != browser.tabs.TAB_ID_NONE)) {_context5.next = 16;break;}_context5.next = 12;return (
							browser.tabs.query({ currentWindow: true }));case 12:tabCount = _context5.sent;if (!(
						tabCount.length > tabLimit)) {_context5.next = 16;break;}_context5.next = 16;return (
							createWindowWithTabs([tab], tab.incognito));case 16:



						updateTabCountDebounce();case 17:case "end":return _context5.stop();}}}, _callee5, this);}));return function tabAdded(_x4) {return _ref5.apply(this, arguments);};}();var openSidebar = function () {var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(


























	function _callee6() {return regeneratorRuntime.wrap(function _callee6$(_context6) {while (1) {switch (_context6.prev = _context6.next) {case 0:_context6.next = 2;return (
							browser.sidebarAction.open());case 2:case "end":return _context6.stop();}}}, _callee6, this);}));return function openSidebar() {return _ref6.apply(this, arguments);};}();var openPopup = function () {var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(


	function _callee7() {var openInOwnTabValue, openInOwnTab;return regeneratorRuntime.wrap(function _callee7$(_context7) {while (1) {switch (_context7.prev = _context7.next) {case 0:_context7.next = 2;return (

							getLocalStorage("openInOwnTab"));case 2:openInOwnTabValue = _context7.sent;if (!(
						typeof openInOwnTabValue === "undefined")) {_context7.next = 7;break;}
						openInOwnTabValue = "0";_context7.next = 7;return (
							setLocalStorage("openInOwnTab", openInOwnTabValue));case 7:


						openInOwnTab = false;
						try {
							openInOwnTab = !!JSON.parse(openInOwnTabValue);
						} catch (e) {
							openInOwnTab = false;
						}if (!
						openInOwnTab) {_context7.next = 18;break;}_context7.next = 12;return (
							browser.action.setPopup({ popup: "popup.html?popup=true" }));case 12:_context7.next = 14;return (
							browser.action.openPopup());case 14:_context7.next = 16;return (
							browser.action.setPopup({ popup: "" }));case 16:_context7.next = 20;break;case 18:_context7.next = 20;return (

							browser.action.openPopup());case 20:case "end":return _context7.stop();}}}, _callee7, this);}));return function openPopup() {return _ref7.apply(this, arguments);};}();var openAsOwnTab = function () {var _ref8 = _asyncToGenerator(regeneratorRuntime.mark(



	function _callee8() {var popup_page, tabs, currentTab, previousTab, i, tab;return regeneratorRuntime.wrap(function _callee8$(_context8) {while (1) {switch (_context8.prev = _context8.next) {case 0:
						popup_page = browser.runtime.getURL("popup.html");_context8.next = 3;return (
							browser.tabs.query({}));case 3:tabs = _context8.sent;



						if (!!globalTabsActive && globalTabsActive.length > 1) {
							currentTab = globalTabsActive[globalTabsActive.length - 1];
							previousTab = globalTabsActive[globalTabsActive.length - 2];
						}

						i = 0;case 6:if (!(i < tabs.length)) {_context8.next = 17;break;}
						tab = tabs[i];if (!(
						tab.url.indexOf("popup.html") > -1 && tab.url.indexOf(popup_page) > -1)) {_context8.next = 14;break;}if (!(
						currentTab && currentTab.tabId && tab.id == currentTab.tabId && previousTab && previousTab.tabId)) {_context8.next = 13;break;}return _context8.abrupt("return",
						focusOnTabAndWindow(previousTab));case 13:return _context8.abrupt("return",

						browser.windows.update(tab.windowId, { focused: true }).then(
						function () {
							browser.tabs.highlight({ windowId: tab.windowId, tabs: tab.index });
						}.bind(this)));case 14:i++;_context8.next = 6;break;case 17:return _context8.abrupt("return",




						browser.tabs.create({ url: "popup.html" }));case 18:case "end":return _context8.stop();}}}, _callee8, this);}));return function openAsOwnTab() {return _ref8.apply(this, arguments);};}();var setupPopup = function () {var _ref9 = _asyncToGenerator(regeneratorRuntime.mark(


	function _callee9() {var openInOwnTabValue, openInOwnTab;return regeneratorRuntime.wrap(function _callee9$(_context9) {while (1) {switch (_context9.prev = _context9.next) {case 0:_context9.next = 2;return (

							getLocalStorage("openInOwnTab"));case 2:openInOwnTabValue = _context9.sent;if (!(
						typeof openInOwnTabValue === "undefined")) {_context9.next = 7;break;}
						openInOwnTabValue = "0";_context9.next = 7;return (
							setLocalStorage("openInOwnTab", openInOwnTabValue));case 7:


						openInOwnTab = false;
						try {
							openInOwnTab = !!JSON.parse(openInOwnTabValue);
						} catch (e) {
							openInOwnTab = false;
						}_context9.next = 11;return (

							browser.action.onClicked.removeListener(openAsOwnTab));case 11:if (!
						openInOwnTab) {_context9.next = 18;break;}_context9.next = 14;return (
							browser.action.setPopup({ popup: "" }));case 14:_context9.next = 16;return (
							browser.action.onClicked.addListener(openAsOwnTab));case 16:_context9.next = 20;break;case 18:_context9.next = 20;return (

							browser.action.setPopup({ popup: "popup.html?popup=true" }));case 20:

						if (browser.sidebarAction) {
							browser.sidebarAction.setPanel({ panel: "popup.html?panel=true" });
						}case 21:case "end":return _context9.stop();}}}, _callee9, this);}));return function setupPopup() {return _ref9.apply(this, arguments);};}();var setupListeners = function () {var _ref10 = _asyncToGenerator(regeneratorRuntime.mark(


	function _callee10() {return regeneratorRuntime.wrap(function _callee10$(_context10) {while (1) {switch (_context10.prev = _context10.next) {case 0:_context10.next = 2;return (

							browser.contextMenus.removeAll());case 2:
						browser.contextMenus.create({
							id: "open_in_own_tab",
							title: "📔 Open in own tab",
							contexts: ["action"] });


						if (!!browser.action.openPopup) {
							browser.contextMenus.create({
								id: "open_popup",
								title: "📑 Open popup",
								contexts: ["action"] });

						}

						if (!!browser.sidebarAction) {
							browser.contextMenus.create({
								id: "open_sidebar",
								title: "🗂 Open sidebar",
								contexts: ["action"] });

						}

						browser.contextMenus.create({
							id: "sep1",
							type: "separator",
							contexts: ["action"] });


						browser.contextMenus.create({
							title: "😍 Support this extension",
							id: "support_menu",
							"contexts": ["action"] });


						browser.contextMenus.create({
							id: "review",
							title: "⭐ Leave a review",
							"contexts": ["action"],
							parentId: "support_menu" });


						browser.contextMenus.create({
							id: "donate",
							title: "☕ Donate to keep Extensions Alive",
							"contexts": ["action"],
							parentId: "support_menu" });


						browser.contextMenus.create({
							id: "patron",
							title: "💰 Become a Patron",
							"contexts": ["action"],
							parentId: "support_menu" });


						browser.contextMenus.create({
							id: "twitter",
							title: "🐦 Follow on Twitter",
							"contexts": ["action"],
							parentId: "support_menu" });


						browser.contextMenus.create({
							title: "🤔 Issues and Suggestions",
							id: "code_menu",
							"contexts": ["action"] });


						browser.contextMenus.create({
							id: "changelog",
							title: "🆕 View recent changes",
							"contexts": ["action"],
							parentId: "code_menu" });


						browser.contextMenus.create({
							id: "options",
							title: "⚙ Edit Options",
							"contexts": ["action"],
							parentId: "code_menu" });


						browser.contextMenus.create({
							id: "source",
							title: "💻 View source code",
							"contexts": ["action"],
							parentId: "code_menu" });


						browser.contextMenus.create({
							id: "report",
							title: "🤔 Report an issue",
							"contexts": ["action"],
							parentId: "code_menu" });


						browser.contextMenus.create({
							id: "send",
							title: "💡 Send a suggestion",
							"contexts": ["action"],
							parentId: "code_menu" });


						browser.contextMenus.onClicked.addListener(
						function (info, tab) {
							if (info.menuItemId == "open_in_own_tab") openAsOwnTab();
							if (info.menuItemId == "open_popup") openPopup();
							if (info.menuItemId == "open_sidebar") openSidebar();

							if (info.menuItemId == "donate") browser.tabs.create({ url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW' });
							if (info.menuItemId == "patron") browser.tabs.create({ url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW' });
							if (info.menuItemId == "changelog") browser.tabs.create({ url: 'changelog.html' });
							if (info.menuItemId == "options") browser.tabs.create({ url: 'options.html' });
							if (info.menuItemId == "report") browser.tabs.create({ url: 'https://github.com/stefanXO/Tab-Manager-Plus/issues' });

							if (info.menuItemId == "source") browser.tabs.create({ url: 'https://github.com/stefanXO/Tab-Manager-Plus' });

							if (info.menuItemId == "twitter") browser.tabs.create({ url: 'https://www.twitter.com/mastef' });

							if (info.menuItemId == "send") {
								browser.tabs.create({ url: 'https://github.com/stefanXO/Tab-Manager-Plus/issues' });
								browser.tabs.create({ url: 'mailto:markus+tmp@stefanxo.com' });
							}

							if (info.menuItemId == "review") {
								if (navigator.userAgent.search("Firefox") > -1) {
									browser.tabs.create({ url: 'https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/' });
								} else {
									browser.tabs.create({ url: 'https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff' });
								}
							}
						});


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

						setTimeout(cleanUp, 5000);case 43:case "end":return _context10.stop();}}}, _callee10, this);}));return function setupListeners() {return _ref10.apply(this, arguments);};}();var checkLocalStorageAvailable = function () {var _ref11 = _asyncToGenerator(regeneratorRuntime.mark(

























	function _callee11() {var test;return regeneratorRuntime.wrap(function _callee11$(_context11) {while (1) {switch (_context11.prev = _context11.next) {case 0:
						test = 'test';_context11.prev = 1;_context11.next = 4;return (

							setLocalStorage(test, test));case 4:_context11.next = 6;return (
							removeLocalStorage(test));case 6:
						console.log("local storage available");
						globalLocalStorageAvailable = true;return _context11.abrupt("return",
						true);case 11:_context11.prev = 11;_context11.t0 = _context11["catch"](1);

						console.log(_context11.t0);
						console.log("no local storage");
						globalLocalStorageAvailable = false;return _context11.abrupt("return",
						false);case 17:case "end":return _context11.stop();}}}, _callee11, this, [[1, 11]]);}));return function checkLocalStorageAvailable() {return _ref11.apply(this, arguments);};}();var hideWindows = function () {var _ref12 = _asyncToGenerator(regeneratorRuntime.mark(



































	function _callee13(windowId) {var hideWindows, result;return regeneratorRuntime.wrap(function _callee13$(_context13) {while (1) {switch (_context13.prev = _context13.next) {case 0:if (!(
						navigator.userAgent.search("Firefox") > -1)) {_context13.next = 2;break;}return _context13.abrupt("return");case 2:if (!(



						!windowId || windowId < 0)) {_context13.next = 6;break;}return _context13.abrupt("return");case 6:if (!


						localStorageAvailable()) {_context13.next = 15;break;}
						hideWindows = getLocalStorage("hideWindows") || "0";
						if (typeof hideWindows === "undefined") hideWindows = "0";_context13.next = 11;return (
							setLocalStorage("hideWindows", hideWindows));case 11:if (!(
						hideWindows == "0")) {_context13.next = 13;break;}return _context13.abrupt("return");case 13:_context13.next = 16;break;case 15:return _context13.abrupt("return");case 16:_context13.next = 18;return (




							browser.permissions.contains({ permissions: ['system.display'] }));case 18:result = _context13.sent;
						if (result) {

							chrome.system.display.getInfo(function () {var _ref13 = _asyncToGenerator(regeneratorRuntime.mark(function _callee12(windowId, displaylayouts) {var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, displaylayout, windows, monitor, i, a, result;return regeneratorRuntime.wrap(function _callee12$(_context12) {while (1) {switch (_context12.prev = _context12.next) {case 0:
													globalDisplayInfo = [];
													_iteratorNormalCompletion = true;
													_didIteratorError = false;
													_iteratorError = undefined;_context12.prev = 4;

													for (_iterator = displaylayouts[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {displaylayout = _step.value;
														globalDisplayInfo.push(displaylayout.bounds);
													}_context12.next = 12;break;case 8:_context12.prev = 8;_context12.t0 = _context12["catch"](4);

													_didIteratorError = true;
													_iteratorError = _context12.t0;case 12:_context12.prev = 12;_context12.prev = 13;


													if (!_iteratorNormalCompletion && _iterator.return) {
														_iterator.return();
													}case 15:_context12.prev = 15;if (!

													_didIteratorError) {_context12.next = 18;break;}throw (
														_iteratorError);case 18:return _context12.finish(15);case 19:return _context12.finish(12);case 20:_context12.next = 22;return (



														browser.windows.getAll({ populate: true }));case 22:windows = _context12.sent;
													monitor = -1;
													for (i = windows.length - 1; i >= 0; i--) {
														if (windows[i].id == windowId) {
															for (a in globalDisplayInfo) {
																result = is_in_bounds(windows[i], globalDisplayInfo[a]);
																if (result) {
																	monitor = a;
																}
															}
														}
													};

													i = windows.length - 1;case 27:if (!(i >= 0)) {_context12.next = 35;break;}if (!(
													windows[i].id != windowId)) {_context12.next = 32;break;}if (!
													is_in_bounds(windows[i], globalDisplayInfo[monitor])) {_context12.next = 32;break;}_context12.next = 32;return (
														browser.windows.update(windows[i].id, { "state": "minimized" }));case 32:i--;_context12.next = 27;break;case 35:


													;case 36:case "end":return _context12.stop();}}}, _callee12, this, [[4, 8, 12, 20], [13,, 15, 19]]);}));return function (_x6, _x7) {return _ref13.apply(this, arguments);};}().
							bind(null, windowId));
						}case 20:case "end":return _context13.stop();}}}, _callee13, this);}));return function hideWindows(_x5) {return _ref12.apply(this, arguments);};}();var windowActive = function () {var _ref14 = _asyncToGenerator(regeneratorRuntime.mark(













	function _callee14(windowId) {var windows, windowAge;return regeneratorRuntime.wrap(function _callee14$(_context14) {while (1) {switch (_context14.prev = _context14.next) {case 0:if (!(
						windowId < 0)) {_context14.next = 2;break;}return _context14.abrupt("return");case 2:

						windows = [];if (!
						localStorageAvailable()) {_context14.next = 9;break;}_context14.next = 6;return (
							getLocalStorage("windowAge"));case 6:windowAge = _context14.sent;
						windows = JSON.parse(windowAge);
						if (windows instanceof Array) {

						} else {
							windows = [];
						}case 9:


						if (windows.indexOf(windowId) > -1) windows.splice(windows.indexOf(windowId), 1);
						windows.unshift(windowId);_context14.next = 13;return (
							setLocalStorage("windowAge", JSON.stringify(windows)));case 13:case "end":return _context14.stop();}}}, _callee14, this);}));return function windowActive(_x8) {return _ref14.apply(this, arguments);};}();var cleanUp = function () {var _ref16 = _asyncToGenerator(regeneratorRuntime.mark(








































































	function _callee16() {var activewindows, windowids, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, w, windowAge, windows, i, names, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, id;return regeneratorRuntime.wrap(function _callee16$(_context16) {while (1) {switch (_context16.prev = _context16.next) {case 0:_context16.next = 2;return (
							browser.windows.getAll({ populate: true }));case 2:activewindows = _context16.sent;
						windowids = [];_iteratorNormalCompletion3 = true;_didIteratorError3 = false;_iteratorError3 = undefined;_context16.prev = 7;
						for (_iterator3 = activewindows[Symbol.iterator](); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {w = _step3.value;
							windowids.push(w.id);
						}_context16.next = 15;break;case 11:_context16.prev = 11;_context16.t0 = _context16["catch"](7);_didIteratorError3 = true;_iteratorError3 = _context16.t0;case 15:_context16.prev = 15;_context16.prev = 16;if (!_iteratorNormalCompletion3 && _iterator3.return) {_iterator3.return();}case 18:_context16.prev = 18;if (!_didIteratorError3) {_context16.next = 21;break;}throw _iteratorError3;case 21:return _context16.finish(18);case 22:return _context16.finish(15);case 23:_context16.next = 25;return (


							getLocalStorage("windowAge"));case 25:windowAge = _context16.sent;

						windows = JSON.parse(windowAge);
						if (windows instanceof Array) {

						} else {
							windows = [];
						}


						for (i = windows.length - 1; i >= 0; i--) {
							if (windowids.indexOf(windows[i]) < 0) {

								windows.splice(i, 1);
							}
						};_context16.next = 32;return (

							setLocalStorage("windowAge", JSON.stringify(windows)));case 32:_context16.next = 34;return (

							getLocalStorage("windowNames"));case 34:names = _context16.sent;
						if (!!names) {
							names = JSON.parse(names);
						} else {
							names = {};
						}_iteratorNormalCompletion4 = true;_didIteratorError4 = false;_iteratorError4 = undefined;_context16.prev = 39;


						for (_iterator4 = Object.keys(names)[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {id = _step4.value;
							if (windowids.indexOf(parseInt(id)) < 0) {

								delete names[id];
							}
						}_context16.next = 47;break;case 43:_context16.prev = 43;_context16.t1 = _context16["catch"](39);_didIteratorError4 = true;_iteratorError4 = _context16.t1;case 47:_context16.prev = 47;_context16.prev = 48;if (!_iteratorNormalCompletion4 && _iterator4.return) {_iterator4.return();}case 50:_context16.prev = 50;if (!_didIteratorError4) {_context16.next = 53;break;}throw _iteratorError4;case 53:return _context16.finish(50);case 54:return _context16.finish(47);case 55:_context16.next = 57;return (

							setLocalStorage("windowNames", JSON.stringify(names)));case 57:case "end":return _context16.stop();}}}, _callee16, this, [[7, 11, 15, 23], [16,, 18, 22], [39, 43, 47, 55], [48,, 50, 54]]);}));return function cleanUp() {return _ref16.apply(this, arguments);};}();function _asyncToGenerator(fn) {return function () {var gen = fn.apply(this, arguments);return new Promise(function (resolve, reject) {function step(key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {return Promise.resolve(value).then(function (value) {step("next", value);}, function (err) {step("throw", err);});}}return step("next");});};}var browser = browser || chrome;var globalTabsActive = [];var globalDisplayInfo = [];var globalLocalStorageAvailable = true;browser.runtime.onStartup.addListener(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:console.log(" ON STARTUP ");_context.next = 3;return checkLocalStorageAvailable();case 3:case "end":return _context.stop();}}}, _callee, this);})));function focusOnTabAndWindowDelayed(tab) {var tab = JSON.parse(JSON.stringify(tab));setTimeout(focusOnTabAndWindow.bind(this, tab), 125);}function focusOnWindowDelayed(windowId) {setTimeout(focusOnWindow.bind(this, windowId), 125);}function focusOnWindow(windowId) {browser.windows.update(windowId, { focused: true });}var updateTabCountDebounce = debounce(updateTabCount, 250);function tabRemoved() {updateTabCountDebounce();}function tabActiveChanged(tab) {if (!!tab && !!tab.tabId) {if (!globalTabsActive) globalTabsActive = [];if (!!globalTabsActive && globalTabsActive.length > 0) {var lastActive = globalTabsActive[globalTabsActive.length - 1];if (!!lastActive && lastActive.tabId == tab.tabId && lastActive.windowId == tab.windowId) {return;}}while (globalTabsActive.length > 20) {globalTabsActive.shift();}for (var i = globalTabsActive.length - 1; i >= 0; i--) {if (globalTabsActive[i].tabId == tab.tabId) {globalTabsActive.splice(i, 1);}};globalTabsActive.push(tab);}updateTabCountDebounce();}function debounce(func, wait, immediate) {var timeout;return function () {var context = this,args = arguments;var later = function later() {timeout = null;if (!immediate) func.apply(context, args);};var callNow = immediate && !timeout;clearTimeout(timeout);timeout = setTimeout(later, wait);if (callNow) func.apply(context, args);};};function localStorageAvailable() {return globalLocalStorageAvailable;}function windowFocus(windowId) {try {if (!!windowId) {windowActive(windowId);hideWindows(windowId);}} catch (e) {}}function windowCreated(window) {try {if (!!window && !!window.id) {windowActive(window.id);}} catch (e) {}}function windowRemoved(windowId) {try {if (!!windowId) {windowActive(windowId);}} catch (e) {}}function is_in_bounds(object, bounds) {var C = object,B = bounds;if (C.left >= B.left && C.left <= B.left + B.width) {if (C.top >= B.top && C.top <= B.top + B.height) {return true;}}return false;};browser.commands.onCommand.addListener(function (command) {if (command == "switch_to_previous_active_tab") {if (!!globalTabsActive && globalTabsActive.length > 1) {focusOnTabAndWindow(globalTabsActive[globalTabsActive.length - 2]);}}});browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {switch (request.command) {case "reload_popup_controls":setupPopup();break;case "update_tab_count":updateTabCount();break;case "focus_on_tab_and_window":focusOnTabAndWindow(request.tab);break;case "focus_on_tab_and_window_delayed":focusOnTabAndWindowDelayed(request.tab);break;case "focus_on_window":focusOnWindow(request.window_id);break;case "focus_on_window_delayed":focusOnWindowDelayed(request.window_id);break;case "create_window_with_tabs":createWindowWithTabs(request.tabs);break;case "close_tabs":for (var i = 0; i < request.tabs.length; i++) {browser.tabs.remove(request.tabs[i]);}break;}});_asyncToGenerator(regeneratorRuntime.mark(function _callee15() {var windows, i;return regeneratorRuntime.wrap(function _callee15$(_context15) {while (1) {switch (_context15.prev = _context15.next) {case 0:_context15.next = 2;return checkLocalStorageAvailable();case 2:_context15.next = 4;return browser.windows.getAll({ populate: true });case 4:windows = _context15.sent;_context15.next = 7;return setLocalStorage("windowAge", JSON.stringify([]));case 7:if (!!windows && windows.length > 0) {windows.sort(function (a, b) {if (a.id < b.id) return 1;if (a.id > b.id) return -1;return 0;});for (i = 0; i < windows.length; i++) {if (!!windows[i].id) windowActive(windows[i].id);};}case 8:case "end":return _context15.stop();}}}, _callee15, this);}))();


setInterval(setupListeners, 300000);

setupListeners();