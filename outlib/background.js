"use strict";var discardTabs = function () {var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(
















	function _callee2(tabs) {var i;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:
						for (i = 0; i < tabs.length; i++) {
							if (!tabs[i].discarded) {
								browser.tabs.discard(tabs[i].id).catch(function (e) {
									console.error(e);
									console.log(e.message);
								});
							}
						}case 1:case "end":return _context2.stop();}}}, _callee2, this);}));return function discardTabs(_x) {return _ref2.apply(this, arguments);};}();var closeTabs = function () {var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(


	function _callee3(tabs) {var i;return regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0:
						i = 0;case 1:if (!(i < tabs.length)) {_context3.next = 7;break;}_context3.next = 4;return (
							browser.tabs.remove(tabs[i].id));case 4:i++;_context3.next = 1;break;case 7:case "end":return _context3.stop();}}}, _callee3, this);}));return function closeTabs(_x2) {return _ref3.apply(this, arguments);};}();var moveTabsToWindow = function () {var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(



	function _callee4(windowId, tabs) {var i, t;return regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:
						i = 0;case 1:if (!(i < tabs.length)) {_context4.next = 10;break;}
						t = tabs[i];_context4.next = 5;return (
							browser.tabs.move(t.id, { windowId: windowId, index: -1 }));case 5:_context4.next = 7;return (
							browser.tabs.update(t.id, { pinned: t.pinned }));case 7:i++;_context4.next = 1;break;case 10:case "end":return _context4.stop();}}}, _callee4, this);}));return function moveTabsToWindow(_x3, _x4) {return _ref4.apply(this, arguments);};}();var createWindowWithTabs = function () {var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(



	function _callee5(tabs, isIncognito) {var pinnedIndex, firstTab, t, i, firstPinned, w, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, oldTabId, oldTab, tabPinned, movedTabs, newTab;return regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:

						pinnedIndex = 0;
						firstTab = tabs.shift();
						t = [];
						for (i = 0; i < tabs.length; i++) {
							t.push(tabs[i].id);
						};

						firstPinned = firstTab.pinned;_context5.next = 8;return (
							browser.windows.create({ tabId: firstTab.id, incognito: !!isIncognito }));case 8:w = _context5.sent;if (!
						firstPinned) {_context5.next = 13;break;}_context5.next = 12;return (
							browser.tabs.update(w.tabs[0].id, { pinned: firstPinned }));case 12:
						pinnedIndex++;case 13:if (!(


						t.length > 0)) {_context5.next = 60;break;}
						i = 0;_iteratorNormalCompletion2 = true;_didIteratorError2 = false;_iteratorError2 = undefined;_context5.prev = 18;_iterator2 =
						t[Symbol.iterator]();case 20:if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {_context5.next = 45;break;}oldTabId = _step2.value;
						i++;_context5.next = 25;return (
							browser.tabs.get(oldTabId));case 25:oldTab = _context5.sent;
						tabPinned = oldTab.pinned;
						movedTabs = [];if (
						tabPinned) {_context5.next = 34;break;}_context5.next = 31;return (
							browser.tabs.move(oldTabId, { windowId: w.id, index: -1 }));case 31:movedTabs = _context5.sent;_context5.next = 37;break;case 34:_context5.next = 36;return (

							browser.tabs.move(oldTabId, { windowId: w.id, index: pinnedIndex++ }));case 36:movedTabs = _context5.sent;case 37:if (!(

						movedTabs.length > 0)) {_context5.next = 42;break;}
						newTab = movedTabs[0];if (!
						tabPinned) {_context5.next = 42;break;}_context5.next = 42;return (
							browser.tabs.update(newTab.id, { pinned: tabPinned }));case 42:_iteratorNormalCompletion2 = true;_context5.next = 20;break;case 45:_context5.next = 51;break;case 47:_context5.prev = 47;_context5.t0 = _context5["catch"](18);_didIteratorError2 = true;_iteratorError2 = _context5.t0;case 51:_context5.prev = 51;_context5.prev = 52;if (!_iteratorNormalCompletion2 && _iterator2.return) {_iterator2.return();}case 54:_context5.prev = 54;if (!_didIteratorError2) {_context5.next = 57;break;}throw _iteratorError2;case 57:return _context5.finish(54);case 58:return _context5.finish(51);case 59:


						;case 60:_context5.next = 62;return (

							browser.windows.update(w.id, { focused: true }));case 62:case "end":return _context5.stop();}}}, _callee5, this, [[18, 47, 51, 59], [52,, 54, 58]]);}));return function createWindowWithTabs(_x5, _x6) {return _ref5.apply(this, arguments);};}();var createWindowWithSessionTabs = function () {var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(


	function _callee6(window) {var customName, whitelistWindow, whitelistTab, filteredWindow, newWindow, emptyTab, i, newTab, tabCreated, names;return regeneratorRuntime.wrap(function _callee6$(_context6) {while (1) {switch (_context6.prev = _context6.next) {case 0:

						customName = false;
						if (window && window.name && window.customName) {
							customName = window.name;
						}

						whitelistWindow = ["left", "top", "width", "height", "incognito", "type"];

						if (navigator.userAgent.search("Firefox") > -1) {
							whitelistWindow = ["left", "top", "width", "height", "incognito", "type"];
						}

						whitelistTab = ["url", "active", "selected", "pinned"];

						if (navigator.userAgent.search("Firefox") > -1) {
							whitelistTab = ["url", "active", "pinned"];
						}

						filteredWindow = Object.keys(window.windowsInfo).
						filter(function (key) {
							return whitelistWindow.includes(key);
						}).
						reduce(function (obj, key) {
							console.log("key : " + key + " - " + window.windowsInfo[key]);
							obj[key] = window.windowsInfo[key];
							return obj;
						}, {});
						console.log("filtered window", filteredWindow);_context6.next = 10;return (

							browser.windows.create(filteredWindow).catch(function (error) {
								console.error(error);
								console.log(error);
								console.log(error.message);
							}));case 10:newWindow = _context6.sent;

						emptyTab = newWindow.tabs[0].id;

						i = 0;case 13:if (!(i < window.tabs.length)) {_context6.next = 31;break;}
						newTab = Object.keys(window.tabs[i]).
						filter(function (key) {
							return whitelistTab.includes(key);
						}).
						reduce(function (obj, key) {
							console.log("key : " + key + " - " + window.tabs[i][key]);
							obj[key] = window.tabs[i][key];
							return obj;
						}, {});
						console.log("source tab", newTab);
						if (navigator.userAgent.search("Firefox") > -1) {
							if (!!newTab.url && newTab.url.search("about:") > -1) {
								console.log("filtered by about: url", newTab.url);
								newTab.url = "";
							}
						}
						newTab.windowId = newWindow.id;_context6.prev = 18;_context6.next = 21;return (

							browser.tabs.create(newTab).catch(function (error) {
								console.error(error);
								console.log(error);
								console.log(error.message);
							}));case 21:tabCreated = _context6.sent;_context6.next = 28;break;case 24:_context6.prev = 24;_context6.t0 = _context6["catch"](18);

						console.log("couldn't restore tab");
						console.error(_context6.t0);case 28:i++;_context6.next = 13;break;case 31:_context6.next = 33;return (



							browser.tabs.remove(emptyTab).catch(function (error) {
								console.error(error);
								console.log(error);
								console.log(error.message);
							}));case 33:if (!

						customName) {_context6.next = 41;break;}_context6.next = 36;return (
							getLocalStorage("windowNames"));case 36:names = _context6.sent;
						if (!!names) {
							names = JSON.parse(names);
						} else {
							names = {};
						}
						names[newWindow.id] = customName || "";_context6.next = 41;return (
							setLocalStorage("windowNames", JSON.stringify(names)));case 41:_context6.next = 43;return (


							browser.windows.update(newWindow.id, { focused: true }));case 43:case "end":return _context6.stop();}}}, _callee6, this, [[18, 24]]);}));return function createWindowWithSessionTabs(_x7) {return _ref6.apply(this, arguments);};}();var focusOnTabAndWindow = function () {var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(







	function _callee7(tab) {var windowId, tabId;return regeneratorRuntime.wrap(function _callee7$(_context7) {while (1) {switch (_context7.prev = _context7.next) {case 0:
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
						}.bind(this, tabId, windowId));case 3:case "end":return _context7.stop();}}}, _callee7, this);}));return function focusOnTabAndWindow(_x8) {return _ref7.apply(this, arguments);};}();var updateTabCount = function () {var _ref8 = _asyncToGenerator(regeneratorRuntime.mark(










	function _callee8() {var run, badge, result, count, toRemove, i, t, found, j;return regeneratorRuntime.wrap(function _callee8$(_context8) {while (1) {switch (_context8.prev = _context8.next) {case 0:
						run = true;if (!
						localStorageAvailable()) {_context8.next = 10;break;}_context8.next = 4;return (
							getLocalStorage("badge"));case 4:badge = _context8.sent;if (!(
						typeof badge === "undefined")) {_context8.next = 9;break;}
						badge = "1";_context8.next = 9;return (
							setLocalStorage("badge", badge));case 9:

						if (badge == "0") run = false;case 10:if (!


						run) {_context8.next = 26;break;}_context8.next = 13;return (
							browser.tabs.query({}));case 13:result = _context8.sent;
						count = 0;
						if (!!result && !!result.length) {
							count = result.length;
						}_context8.next = 18;return (
							browser.action.setBadgeText({ text: count + "" }));case 18:_context8.next = 20;return (
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
						};_context8.next = 28;break;case 26:_context8.next = 28;return (

							browser.action.setBadgeText({ text: "" }));case 28:case "end":return _context8.stop();}}}, _callee8, this);}));return function updateTabCount() {return _ref8.apply(this, arguments);};}();var tabAdded = function () {var _ref9 = _asyncToGenerator(regeneratorRuntime.mark(









	function _callee9(tab) {var tL, tabLimit, tabCount;return regeneratorRuntime.wrap(function _callee9$(_context9) {while (1) {switch (_context9.prev = _context9.next) {case 0:_context9.next = 2;return (
							getLocalStorage("tabLimit"));case 2:tL = _context9.sent;if (!(
						typeof tL === "undefined" || tL == null)) {_context9.next = 7;break;}
						tL = "0";_context9.next = 7;return (
							setLocalStorage("tabLimit", tL));case 7:

						try {
							tabLimit = JSON.parse(tL);
						} catch (e) {
							tabLimit = 0;
						}if (!(

						tabLimit > 0)) {_context9.next = 16;break;}if (!(
						tab.id != browser.tabs.TAB_ID_NONE)) {_context9.next = 16;break;}_context9.next = 12;return (
							browser.tabs.query({ currentWindow: true }));case 12:tabCount = _context9.sent;if (!(
						tabCount.length > tabLimit)) {_context9.next = 16;break;}_context9.next = 16;return (
							createWindowWithTabs([tab], tab.incognito));case 16:



						updateTabCountDebounce();case 17:case "end":return _context9.stop();}}}, _callee9, this);}));return function tabAdded(_x9) {return _ref9.apply(this, arguments);};}();var openSidebar = function () {var _ref10 = _asyncToGenerator(regeneratorRuntime.mark(


























	function _callee10() {return regeneratorRuntime.wrap(function _callee10$(_context10) {while (1) {switch (_context10.prev = _context10.next) {case 0:_context10.next = 2;return (
							browser.sidebarAction.open());case 2:case "end":return _context10.stop();}}}, _callee10, this);}));return function openSidebar() {return _ref10.apply(this, arguments);};}();var openPopup = function () {var _ref11 = _asyncToGenerator(regeneratorRuntime.mark(


	function _callee11() {var openInOwnTabValue, openInOwnTab;return regeneratorRuntime.wrap(function _callee11$(_context11) {while (1) {switch (_context11.prev = _context11.next) {case 0:_context11.next = 2;return (

							getLocalStorage("openInOwnTab"));case 2:openInOwnTabValue = _context11.sent;if (!(
						typeof openInOwnTabValue === "undefined")) {_context11.next = 7;break;}
						openInOwnTabValue = "0";_context11.next = 7;return (
							setLocalStorage("openInOwnTab", openInOwnTabValue));case 7:


						openInOwnTab = false;
						try {
							openInOwnTab = !!JSON.parse(openInOwnTabValue);
						} catch (e) {
							openInOwnTab = false;
						}if (!
						openInOwnTab) {_context11.next = 18;break;}_context11.next = 12;return (
							browser.action.setPopup({ popup: "popup.html?popup=true" }));case 12:_context11.next = 14;return (
							browser.action.openPopup());case 14:_context11.next = 16;return (
							browser.action.setPopup({ popup: "" }));case 16:_context11.next = 20;break;case 18:_context11.next = 20;return (

							browser.action.openPopup());case 20:case "end":return _context11.stop();}}}, _callee11, this);}));return function openPopup() {return _ref11.apply(this, arguments);};}();var openAsOwnTab = function () {var _ref12 = _asyncToGenerator(regeneratorRuntime.mark(



	function _callee12() {var popup_page, tabs, currentTab, previousTab, i, tab;return regeneratorRuntime.wrap(function _callee12$(_context12) {while (1) {switch (_context12.prev = _context12.next) {case 0:
						popup_page = browser.runtime.getURL("popup.html");_context12.next = 3;return (
							browser.tabs.query({}));case 3:tabs = _context12.sent;



						if (!!globalTabsActive && globalTabsActive.length > 1) {
							currentTab = globalTabsActive[globalTabsActive.length - 1];
							previousTab = globalTabsActive[globalTabsActive.length - 2];
						}

						i = 0;case 6:if (!(i < tabs.length)) {_context12.next = 17;break;}
						tab = tabs[i];if (!(
						tab.url.indexOf("popup.html") > -1 && tab.url.indexOf(popup_page) > -1)) {_context12.next = 14;break;}if (!(
						currentTab && currentTab.tabId && tab.id == currentTab.tabId && previousTab && previousTab.tabId)) {_context12.next = 13;break;}return _context12.abrupt("return",
						focusOnTabAndWindow(previousTab));case 13:return _context12.abrupt("return",

						browser.windows.update(tab.windowId, { focused: true }).then(
						function () {
							browser.tabs.highlight({ windowId: tab.windowId, tabs: tab.index });
						}.bind(this)));case 14:i++;_context12.next = 6;break;case 17:return _context12.abrupt("return",




						browser.tabs.create({ url: "popup.html" }));case 18:case "end":return _context12.stop();}}}, _callee12, this);}));return function openAsOwnTab() {return _ref12.apply(this, arguments);};}();var setupPopup = function () {var _ref13 = _asyncToGenerator(regeneratorRuntime.mark(


	function _callee13() {var openInOwnTabValue, openInOwnTab;return regeneratorRuntime.wrap(function _callee13$(_context13) {while (1) {switch (_context13.prev = _context13.next) {case 0:_context13.next = 2;return (

							getLocalStorage("openInOwnTab"));case 2:openInOwnTabValue = _context13.sent;if (!(
						typeof openInOwnTabValue === "undefined")) {_context13.next = 7;break;}
						openInOwnTabValue = "0";_context13.next = 7;return (
							setLocalStorage("openInOwnTab", openInOwnTabValue));case 7:


						openInOwnTab = false;
						try {
							openInOwnTab = !!JSON.parse(openInOwnTabValue);
						} catch (e) {
							openInOwnTab = false;
						}_context13.next = 11;return (

							browser.action.onClicked.removeListener(openAsOwnTab));case 11:if (!
						openInOwnTab) {_context13.next = 18;break;}_context13.next = 14;return (
							browser.action.setPopup({ popup: "" }));case 14:_context13.next = 16;return (
							browser.action.onClicked.addListener(openAsOwnTab));case 16:_context13.next = 20;break;case 18:_context13.next = 20;return (

							browser.action.setPopup({ popup: "popup.html?popup=true" }));case 20:

						if (browser.sidebarAction) {
							browser.sidebarAction.setPanel({ panel: "popup.html?panel=true" });
						}case 21:case "end":return _context13.stop();}}}, _callee13, this);}));return function setupPopup() {return _ref13.apply(this, arguments);};}();var setupListeners = function () {var _ref14 = _asyncToGenerator(regeneratorRuntime.mark(


	function _callee14() {return regeneratorRuntime.wrap(function _callee14$(_context14) {while (1) {switch (_context14.prev = _context14.next) {case 0:_context14.next = 2;return (

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

						setTimeout(cleanUp, 5000);case 43:case "end":return _context14.stop();}}}, _callee14, this);}));return function setupListeners() {return _ref14.apply(this, arguments);};}();var checkLocalStorageAvailable = function () {var _ref15 = _asyncToGenerator(regeneratorRuntime.mark(

























	function _callee15() {var test;return regeneratorRuntime.wrap(function _callee15$(_context15) {while (1) {switch (_context15.prev = _context15.next) {case 0:
						test = 'test';_context15.prev = 1;_context15.next = 4;return (

							setLocalStorage(test, test));case 4:_context15.next = 6;return (
							removeLocalStorage(test));case 6:
						console.log("local storage available");
						globalLocalStorageAvailable = true;return _context15.abrupt("return",
						true);case 11:_context15.prev = 11;_context15.t0 = _context15["catch"](1);

						console.log(_context15.t0);
						console.log("no local storage");
						globalLocalStorageAvailable = false;return _context15.abrupt("return",
						false);case 17:case "end":return _context15.stop();}}}, _callee15, this, [[1, 11]]);}));return function checkLocalStorageAvailable() {return _ref15.apply(this, arguments);};}();var hideWindows = function () {var _ref16 = _asyncToGenerator(regeneratorRuntime.mark(



































	function _callee17(windowId) {var hideWindows, result;return regeneratorRuntime.wrap(function _callee17$(_context17) {while (1) {switch (_context17.prev = _context17.next) {case 0:if (!(
						navigator.userAgent.search("Firefox") > -1)) {_context17.next = 2;break;}return _context17.abrupt("return");case 2:if (!(



						!windowId || windowId < 0)) {_context17.next = 6;break;}return _context17.abrupt("return");case 6:if (!


						localStorageAvailable()) {_context17.next = 15;break;}
						hideWindows = getLocalStorage("hideWindows") || "0";
						if (typeof hideWindows === "undefined") hideWindows = "0";_context17.next = 11;return (
							setLocalStorage("hideWindows", hideWindows));case 11:if (!(
						hideWindows == "0")) {_context17.next = 13;break;}return _context17.abrupt("return");case 13:_context17.next = 16;break;case 15:return _context17.abrupt("return");case 16:_context17.next = 18;return (




							browser.permissions.contains({ permissions: ['system.display'] }));case 18:result = _context17.sent;
						if (result) {

							chrome.system.display.getInfo(function () {var _ref17 = _asyncToGenerator(regeneratorRuntime.mark(function _callee16(windowId, displaylayouts) {var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, displaylayout, windows, monitor, i, a, result;return regeneratorRuntime.wrap(function _callee16$(_context16) {while (1) {switch (_context16.prev = _context16.next) {case 0:
													globalDisplayInfo = [];
													_iteratorNormalCompletion = true;
													_didIteratorError = false;
													_iteratorError = undefined;_context16.prev = 4;

													for (_iterator = displaylayouts[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {displaylayout = _step.value;
														globalDisplayInfo.push(displaylayout.bounds);
													}_context16.next = 12;break;case 8:_context16.prev = 8;_context16.t0 = _context16["catch"](4);

													_didIteratorError = true;
													_iteratorError = _context16.t0;case 12:_context16.prev = 12;_context16.prev = 13;


													if (!_iteratorNormalCompletion && _iterator.return) {
														_iterator.return();
													}case 15:_context16.prev = 15;if (!

													_didIteratorError) {_context16.next = 18;break;}throw (
														_iteratorError);case 18:return _context16.finish(15);case 19:return _context16.finish(12);case 20:_context16.next = 22;return (



														browser.windows.getAll({ populate: true }));case 22:windows = _context16.sent;
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

													i = windows.length - 1;case 27:if (!(i >= 0)) {_context16.next = 35;break;}if (!(
													windows[i].id != windowId)) {_context16.next = 32;break;}if (!
													is_in_bounds(windows[i], globalDisplayInfo[monitor])) {_context16.next = 32;break;}_context16.next = 32;return (
														browser.windows.update(windows[i].id, { "state": "minimized" }));case 32:i--;_context16.next = 27;break;case 35:


													;case 36:case "end":return _context16.stop();}}}, _callee16, this, [[4, 8, 12, 20], [13,, 15, 19]]);}));return function (_x11, _x12) {return _ref17.apply(this, arguments);};}().
							bind(null, windowId));
						}case 20:case "end":return _context17.stop();}}}, _callee17, this);}));return function hideWindows(_x10) {return _ref16.apply(this, arguments);};}();var windowActive = function () {var _ref18 = _asyncToGenerator(regeneratorRuntime.mark(













	function _callee18(windowId) {var windows, windowAge;return regeneratorRuntime.wrap(function _callee18$(_context18) {while (1) {switch (_context18.prev = _context18.next) {case 0:if (!(
						windowId < 0)) {_context18.next = 2;break;}return _context18.abrupt("return");case 2:

						windows = [];if (!
						localStorageAvailable()) {_context18.next = 9;break;}_context18.next = 6;return (
							getLocalStorage("windowAge"));case 6:windowAge = _context18.sent;
						windows = JSON.parse(windowAge);
						if (windows instanceof Array) {

						} else {
							windows = [];
						}case 9:


						if (windows.indexOf(windowId) > -1) windows.splice(windows.indexOf(windowId), 1);
						windows.unshift(windowId);_context18.next = 13;return (
							setLocalStorage("windowAge", JSON.stringify(windows)));case 13:case "end":return _context18.stop();}}}, _callee18, this);}));return function windowActive(_x13) {return _ref18.apply(this, arguments);};}();var cleanUp = function () {var _ref20 = _asyncToGenerator(regeneratorRuntime.mark(















































































	function _callee20() {var activewindows, windowids, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, w, windowAge, windows, i, names, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, id;return regeneratorRuntime.wrap(function _callee20$(_context20) {while (1) {switch (_context20.prev = _context20.next) {case 0:_context20.next = 2;return (
							browser.windows.getAll({ populate: true }));case 2:activewindows = _context20.sent;
						windowids = [];_iteratorNormalCompletion3 = true;_didIteratorError3 = false;_iteratorError3 = undefined;_context20.prev = 7;
						for (_iterator3 = activewindows[Symbol.iterator](); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {w = _step3.value;
							windowids.push(w.id);
						}_context20.next = 15;break;case 11:_context20.prev = 11;_context20.t0 = _context20["catch"](7);_didIteratorError3 = true;_iteratorError3 = _context20.t0;case 15:_context20.prev = 15;_context20.prev = 16;if (!_iteratorNormalCompletion3 && _iterator3.return) {_iterator3.return();}case 18:_context20.prev = 18;if (!_didIteratorError3) {_context20.next = 21;break;}throw _iteratorError3;case 21:return _context20.finish(18);case 22:return _context20.finish(15);case 23:_context20.next = 25;return (


							getLocalStorage("windowAge"));case 25:windowAge = _context20.sent;

						windows = JSON.parse(windowAge);
						if (windows instanceof Array) {

						} else {
							windows = [];
						}


						for (i = windows.length - 1; i >= 0; i--) {
							if (windowids.indexOf(windows[i]) < 0) {

								windows.splice(i, 1);
							}
						};_context20.next = 32;return (

							setLocalStorage("windowAge", JSON.stringify(windows)));case 32:_context20.next = 34;return (

							getLocalStorage("windowNames"));case 34:names = _context20.sent;
						if (!!names) {
							names = JSON.parse(names);
						} else {
							names = {};
						}_iteratorNormalCompletion4 = true;_didIteratorError4 = false;_iteratorError4 = undefined;_context20.prev = 39;


						for (_iterator4 = Object.keys(names)[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {id = _step4.value;
							if (windowids.indexOf(parseInt(id)) < 0) {

								delete names[id];
							}
						}_context20.next = 47;break;case 43:_context20.prev = 43;_context20.t1 = _context20["catch"](39);_didIteratorError4 = true;_iteratorError4 = _context20.t1;case 47:_context20.prev = 47;_context20.prev = 48;if (!_iteratorNormalCompletion4 && _iterator4.return) {_iterator4.return();}case 50:_context20.prev = 50;if (!_didIteratorError4) {_context20.next = 53;break;}throw _iteratorError4;case 53:return _context20.finish(50);case 54:return _context20.finish(47);case 55:_context20.next = 57;return (

							setLocalStorage("windowNames", JSON.stringify(names)));case 57:case "end":return _context20.stop();}}}, _callee20, this, [[7, 11, 15, 23], [16,, 18, 22], [39, 43, 47, 55], [48,, 50, 54]]);}));return function cleanUp() {return _ref20.apply(this, arguments);};}();function _asyncToGenerator(fn) {return function () {var gen = fn.apply(this, arguments);return new Promise(function (resolve, reject) {function step(key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {return Promise.resolve(value).then(function (value) {step("next", value);}, function (err) {step("throw", err);});}}return step("next");});};}var browser = browser || chrome;var globalTabsActive = [];var globalDisplayInfo = [];var globalLocalStorageAvailable = true;browser.runtime.onStartup.addListener(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:console.log(" ON STARTUP ");_context.next = 3;return checkLocalStorageAvailable();case 3:case "end":return _context.stop();}}}, _callee, this);})));function focusOnTabAndWindowDelayed(tab) {var tab = JSON.parse(JSON.stringify(tab));setTimeout(focusOnTabAndWindow.bind(this, tab), 125);}function focusOnWindowDelayed(windowId) {setTimeout(focusOnWindow.bind(this, windowId), 125);}function focusOnWindow(windowId) {browser.windows.update(windowId, { focused: true });}var updateTabCountDebounce = debounce(updateTabCount, 250);function tabRemoved() {updateTabCountDebounce();}function tabActiveChanged(tab) {if (!!tab && !!tab.tabId) {if (!globalTabsActive) globalTabsActive = [];if (!!globalTabsActive && globalTabsActive.length > 0) {var lastActive = globalTabsActive[globalTabsActive.length - 1];if (!!lastActive && lastActive.tabId == tab.tabId && lastActive.windowId == tab.windowId) {return;}}while (globalTabsActive.length > 20) {globalTabsActive.shift();}for (var i = globalTabsActive.length - 1; i >= 0; i--) {if (globalTabsActive[i].tabId == tab.tabId) {globalTabsActive.splice(i, 1);}};globalTabsActive.push(tab);}updateTabCountDebounce();}function debounce(func, wait, immediate) {var timeout;return function () {var context = this,args = arguments;var later = function later() {timeout = null;if (!immediate) func.apply(context, args);};var callNow = immediate && !timeout;clearTimeout(timeout);timeout = setTimeout(later, wait);if (callNow) func.apply(context, args);};};function localStorageAvailable() {return globalLocalStorageAvailable;}function windowFocus(windowId) {try {if (!!windowId) {windowActive(windowId);hideWindows(windowId);}} catch (e) {}}function windowCreated(window) {try {if (!!window && !!window.id) {windowActive(window.id);}} catch (e) {}}function windowRemoved(windowId) {try {if (!!windowId) {windowActive(windowId);}} catch (e) {}}function is_in_bounds(object, bounds) {var C = object,B = bounds;if (C.left >= B.left && C.left <= B.left + B.width) {if (C.top >= B.top && C.top <= B.top + B.height) {return true;}}return false;};browser.commands.onCommand.addListener(function (command) {if (command == "switch_to_previous_active_tab") {if (!!globalTabsActive && globalTabsActive.length > 1) {focusOnTabAndWindow(globalTabsActive[globalTabsActive.length - 2]);}}});browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {switch (request.command) {case "reload_popup_controls":setupPopup();break;case "update_tab_count":updateTabCount();break;case "discard_tabs":discardTabs(request.tabs);break;case "move_tabs_to_window":moveTabsToWindow(request.window_id, request.tabs);break;case "focus_on_tab_and_window":focusOnTabAndWindow(request.tab);break;case "focus_on_tab_and_window_delayed":focusOnTabAndWindowDelayed(request.tab);break;case "focus_on_window":focusOnWindow(request.window_id);break;case "focus_on_window_delayed":focusOnWindowDelayed(request.window_id);break;case "create_window_with_tabs":createWindowWithTabs(request.tabs);break;case "create_window_with_session_tabs":createWindowWithSessionTabs(request.window);break;case "close_tabs":closeTabs(request.tabs);break;}});_asyncToGenerator(regeneratorRuntime.mark(function _callee19() {var windows, i;return regeneratorRuntime.wrap(function _callee19$(_context19) {while (1) {switch (_context19.prev = _context19.next) {case 0:_context19.next = 2;return checkLocalStorageAvailable();case 2:_context19.next = 4;return browser.windows.getAll({ populate: true });case 4:windows = _context19.sent;_context19.next = 7;return setLocalStorage("windowAge", JSON.stringify([]));case 7:if (!!windows && windows.length > 0) {windows.sort(function (a, b) {if (a.id < b.id) return 1;if (a.id > b.id) return -1;return 0;});for (i = 0; i < windows.length; i++) {if (!!windows[i].id) windowActive(windows[i].id);};}case 8:case "end":return _context19.stop();}}}, _callee19, this);}))();


setInterval(setupListeners, 300000);

setupListeners();