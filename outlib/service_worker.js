"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var discardTabs = function () {
	var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(tabs) {
		var i;
		return regeneratorRuntime.wrap(function _callee3$(_context3) {
			while (1) {
				switch (_context3.prev = _context3.next) {
					case 0:
						for (i = 0; i < tabs.length; i++) {
							if (!tabs[i].discarded) {
								browser.tabs.discard(tabs[i].id).catch(function (e) {
									console.error(e);
									console.log(e.message);
								});
							}
						}

					case 1:
					case 'end':
						return _context3.stop();
				}
			}
		}, _callee3, this);
	}));

	return function discardTabs(_x) {
		return _ref3.apply(this, arguments);
	};
}();

var closeTabs = function () {
	var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(tabs) {
		var i;
		return regeneratorRuntime.wrap(function _callee4$(_context4) {
			while (1) {
				switch (_context4.prev = _context4.next) {
					case 0:
						i = 0;

					case 1:
						if (!(i < tabs.length)) {
							_context4.next = 7;
							break;
						}

						_context4.next = 4;
						return browser.tabs.remove(tabs[i].id);

					case 4:
						i++;
						_context4.next = 1;
						break;

					case 7:
					case 'end':
						return _context4.stop();
				}
			}
		}, _callee4, this);
	}));

	return function closeTabs(_x2) {
		return _ref4.apply(this, arguments);
	};
}();

var moveTabsToWindow = function () {
	var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(windowId, tabs) {
		var i, t;
		return regeneratorRuntime.wrap(function _callee5$(_context5) {
			while (1) {
				switch (_context5.prev = _context5.next) {
					case 0:
						i = 0;

					case 1:
						if (!(i < tabs.length)) {
							_context5.next = 10;
							break;
						}

						t = tabs[i];
						_context5.next = 5;
						return browser.tabs.move(t.id, { windowId: windowId, index: -1 });

					case 5:
						_context5.next = 7;
						return browser.tabs.update(t.id, { pinned: t.pinned });

					case 7:
						i++;
						_context5.next = 1;
						break;

					case 10:
					case 'end':
						return _context5.stop();
				}
			}
		}, _callee5, this);
	}));

	return function moveTabsToWindow(_x3, _x4) {
		return _ref5.apply(this, arguments);
	};
}();

var createWindowWithTabs = function () {
	var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(tabs, isIncognito) {
		var pinnedIndex, firstTab, t, i, firstPinned, w, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, oldTabId, oldTab, tabPinned, movedTabs, newTab;

		return regeneratorRuntime.wrap(function _callee6$(_context6) {
			while (1) {
				switch (_context6.prev = _context6.next) {
					case 0:
						pinnedIndex = 0;
						firstTab = tabs.shift();
						t = [];

						for (i = 0; i < tabs.length; i++) {
							t.push(tabs[i].id);
						};

						firstPinned = firstTab.pinned;
						_context6.next = 8;
						return browser.windows.create({ tabId: firstTab.id, incognito: !!isIncognito });

					case 8:
						w = _context6.sent;

						if (!firstPinned) {
							_context6.next = 13;
							break;
						}

						_context6.next = 12;
						return browser.tabs.update(w.tabs[0].id, { pinned: firstPinned });

					case 12:
						pinnedIndex++;

					case 13:
						if (!(t.length > 0)) {
							_context6.next = 60;
							break;
						}

						i = 0;
						_iteratorNormalCompletion2 = true;
						_didIteratorError2 = false;
						_iteratorError2 = undefined;
						_context6.prev = 18;
						_iterator2 = t[Symbol.iterator]();

					case 20:
						if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
							_context6.next = 45;
							break;
						}

						oldTabId = _step2.value;

						i++;
						_context6.next = 25;
						return browser.tabs.get(oldTabId);

					case 25:
						oldTab = _context6.sent;
						tabPinned = oldTab.pinned;
						movedTabs = [];

						if (tabPinned) {
							_context6.next = 34;
							break;
						}

						_context6.next = 31;
						return browser.tabs.move(oldTabId, { windowId: w.id, index: -1 });

					case 31:
						movedTabs = _context6.sent;
						_context6.next = 37;
						break;

					case 34:
						_context6.next = 36;
						return browser.tabs.move(oldTabId, { windowId: w.id, index: pinnedIndex++ });

					case 36:
						movedTabs = _context6.sent;

					case 37:
						if (!(movedTabs.length > 0)) {
							_context6.next = 42;
							break;
						}

						newTab = movedTabs[0];

						if (!tabPinned) {
							_context6.next = 42;
							break;
						}

						_context6.next = 42;
						return browser.tabs.update(newTab.id, { pinned: tabPinned });

					case 42:
						_iteratorNormalCompletion2 = true;
						_context6.next = 20;
						break;

					case 45:
						_context6.next = 51;
						break;

					case 47:
						_context6.prev = 47;
						_context6.t0 = _context6['catch'](18);
						_didIteratorError2 = true;
						_iteratorError2 = _context6.t0;

					case 51:
						_context6.prev = 51;
						_context6.prev = 52;

						if (!_iteratorNormalCompletion2 && _iterator2.return) {
							_iterator2.return();
						}

					case 54:
						_context6.prev = 54;

						if (!_didIteratorError2) {
							_context6.next = 57;
							break;
						}

						throw _iteratorError2;

					case 57:
						return _context6.finish(54);

					case 58:
						return _context6.finish(51);

					case 59:
						;

					case 60:
						_context6.next = 62;
						return browser.windows.update(w.id, { focused: true });

					case 62:
					case 'end':
						return _context6.stop();
				}
			}
		}, _callee6, this, [[18, 47, 51, 59], [52,, 54, 58]]);
	}));

	return function createWindowWithTabs(_x5, _x6) {
		return _ref6.apply(this, arguments);
	};
}();

var createWindowWithSessionTabs = function () {
	var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(window, tabId) {
		var customName, color, whitelistWindow, whitelistTab, filteredWindow, newWindow, emptyTab, i, newTab, tabCreated;
		return regeneratorRuntime.wrap(function _callee7$(_context7) {
			while (1) {
				switch (_context7.prev = _context7.next) {
					case 0:
						customName = false;

						if (window && window.name && window.customName) {
							customName = window.name;
						}
						color = "default";

						if (window && window.color) {
							color = window.color;
						}

						whitelistWindow = ["left", "top", "width", "height", "incognito", "type"];


						if (navigator.userAgent.search("Firefox") > -1) {
							whitelistWindow = ["left", "top", "width", "height", "incognito", "type"];
						}

						whitelistTab = ["url", "active", "selected", "pinned", "index"];


						if (navigator.userAgent.search("Firefox") > -1) {
							whitelistTab = ["url", "active", "pinned", "index"];
						}

						filteredWindow = Object.keys(window.windowsInfo).filter(function (key) {
							return whitelistWindow.includes(key);
						}).reduce(function (obj, key) {
							obj[key] = window.windowsInfo[key];
							return obj;
						}, {});


						if (filteredWindow.left < 0 || filteredWindow.left > 800) filteredWindow.left = 0;
						if (filteredWindow.top < 0 || filteredWindow.top > 600) filteredWindow.top = 0;
						if (filteredWindow.width > 800) filteredWindow.width = 800;
						if (filteredWindow.height > 600) filteredWindow.height = 600;

						filteredWindow.type = "normal";

						_context7.next = 16;
						return browser.windows.create(filteredWindow).catch(function (error) {
							console.error(error);
							console.log(error);
							console.log(error.message);
						});

					case 16:
						newWindow = _context7.sent;
						emptyTab = newWindow.tabs[0].id;
						i = 0;

					case 19:
						if (!(i < window.tabs.length)) {
							_context7.next = 38;
							break;
						}

						newTab = Object.keys(window.tabs[i]).filter(function (key) {
							return whitelistTab.includes(key);
						}).reduce(function (obj, key) {
							obj[key] = window.tabs[i][key];
							return obj;
						}, {});

						if (!(tabId != null && tabId != newTab.index)) {
							_context7.next = 23;
							break;
						}

						return _context7.abrupt('continue', 35);

					case 23:
						newTab.windowId = newWindow.id;

						if (navigator.userAgent.search("Firefox") > -1) {
							if (!!newTab.url && newTab.url.search("about:") > -1) {
								console.log("filtered by about: url", newTab.url);
								newTab.url = "";
							}
						}
						_context7.prev = 25;
						_context7.next = 28;
						return browser.tabs.create(newTab).catch(function (error) {
							console.error(error);
							console.log(error);
							console.log(error.message);
						});

					case 28:
						tabCreated = _context7.sent;
						_context7.next = 35;
						break;

					case 31:
						_context7.prev = 31;
						_context7.t0 = _context7['catch'](25);

						console.log("couldn't restore tab");
						console.error(_context7.t0);

					case 35:
						i++;
						_context7.next = 19;
						break;

					case 38:
						_context7.next = 40;
						return browser.tabs.remove(emptyTab).catch(function (error) {
							console.error(error);
							console.log(error);
							console.log(error.message);
						});

					case 40:

						if (customName) {
							console.log("setting name");
							setWindowName(newWindow.id, customName);
						}

						if (color != "default") {
							console.log("setting color");
							setWindowColor(newWindow.id, color);
						}

						_context7.next = 44;
						return browser.windows.update(newWindow.id, { focused: true });

					case 44:
					case 'end':
						return _context7.stop();
				}
			}
		}, _callee7, this, [[25, 31]]);
	}));

	return function createWindowWithSessionTabs(_x7, _x8) {
		return _ref7.apply(this, arguments);
	};
}();

var focusOnTabAndWindow = function () {
	var _ref8 = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(tab) {
		var windowId, tabId;
		return regeneratorRuntime.wrap(function _callee8$(_context8) {
			while (1) {
				switch (_context8.prev = _context8.next) {
					case 0:
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
						}.bind(this, tabId, windowId));

					case 3:
					case 'end':
						return _context8.stop();
				}
			}
		}, _callee8, this);
	}));

	return function focusOnTabAndWindow(_x9) {
		return _ref8.apply(this, arguments);
	};
}();

var setWindowColor = function () {
	var _ref9 = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(windowId, color) {
		var colors;
		return regeneratorRuntime.wrap(function _callee9$(_context9) {
			while (1) {
				switch (_context9.prev = _context9.next) {
					case 0:
						_context9.next = 2;
						return getLocalStorage("windowColors", {});

					case 2:
						colors = _context9.sent;

						if ((typeof colors === 'undefined' ? 'undefined' : _typeof(colors)) !== 'object') colors = {};
						colors[windowId] = color;
						_context9.next = 7;
						return setLocalStorage("windowColors", colors);

					case 7:
						_context9.next = 9;
						return updateWindowHash(windowId);

					case 9:
						browser.runtime.sendMessage({
							command: "refresh_windows",
							window_ids: [windowId]
						});

					case 10:
					case 'end':
						return _context9.stop();
				}
			}
		}, _callee9, this);
	}));

	return function setWindowColor(_x10, _x11) {
		return _ref9.apply(this, arguments);
	};
}();

var setWindowName = function () {
	var _ref10 = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(windowId, name) {
		var names;
		return regeneratorRuntime.wrap(function _callee10$(_context10) {
			while (1) {
				switch (_context10.prev = _context10.next) {
					case 0:
						_context10.next = 2;
						return getLocalStorage("windowNames", {});

					case 2:
						names = _context10.sent;

						if ((typeof names === 'undefined' ? 'undefined' : _typeof(names)) !== 'object') names = {};
						names[windowId] = name;
						_context10.next = 7;
						return setLocalStorage("windowNames", names);

					case 7:
						_context10.next = 9;
						return updateWindowHash(windowId);

					case 9:
						browser.runtime.sendMessage({
							command: "refresh_windows",
							window_ids: [windowId]
						});

					case 10:
					case 'end':
						return _context10.stop();
				}
			}
		}, _callee10, this);
	}));

	return function setWindowName(_x12, _x13) {
		return _ref10.apply(this, arguments);
	};
}();

var updateWindowHash = function () {
	var _ref11 = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(windowId) {
		var window, hash, hashes;
		return regeneratorRuntime.wrap(function _callee11$(_context11) {
			while (1) {
				switch (_context11.prev = _context11.next) {
					case 0:
						_context11.next = 2;
						return browser.windows.get(windowId, { populate: true });

					case 2:
						window = _context11.sent;
						hash = hashcode(window);
						_context11.next = 6;
						return getLocalStorage("windowHashes", {});

					case 6:
						hashes = _context11.sent;

						hashes[windowId] = hash;
						_context11.next = 10;
						return setLocalStorage("windowHashes", hashes);

					case 10:
					case 'end':
						return _context11.stop();
				}
			}
		}, _callee11, this);
	}));

	return function updateWindowHash(_x14) {
		return _ref11.apply(this, arguments);
	};
}();

var updateTabCount = function () {
	var _ref12 = _asyncToGenerator(regeneratorRuntime.mark(function _callee12() {
		var run, badge, result, count, toRemove, i, t, found, j;
		return regeneratorRuntime.wrap(function _callee12$(_context12) {
			while (1) {
				switch (_context12.prev = _context12.next) {
					case 0:
						run = true;
						_context12.next = 3;
						return getLocalStorage("badge", true);

					case 3:
						badge = _context12.sent;

						if (!badge) run = false;

						if (!run) {
							_context12.next = 21;
							break;
						}

						_context12.next = 8;
						return browser.tabs.query({});

					case 8:
						result = _context12.sent;
						count = 0;

						if (!!result && !!result.length) {
							count = result.length;
						}
						_context12.next = 13;
						return browser.action.setBadgeText({ text: count + "" });

					case 13:
						_context12.next = 15;
						return browser.action.setBadgeBackgroundColor({ color: "purple" });

					case 15:
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
						};
						_context12.next = 23;
						break;

					case 21:
						_context12.next = 23;
						return browser.action.setBadgeText({ text: "" });

					case 23:
					case 'end':
						return _context12.stop();
				}
			}
		}, _callee12, this);
	}));

	return function updateTabCount() {
		return _ref12.apply(this, arguments);
	};
}();

var tabAdded = function () {
	var _ref13 = _asyncToGenerator(regeneratorRuntime.mark(function _callee13(tab) {
		var tabLimit, tabCount;
		return regeneratorRuntime.wrap(function _callee13$(_context13) {
			while (1) {
				switch (_context13.prev = _context13.next) {
					case 0:
						_context13.next = 2;
						return getLocalStorage("tabLimit", 0);

					case 2:
						tabLimit = _context13.sent;

						if (!(tabLimit > 0)) {
							_context13.next = 11;
							break;
						}

						if (!(tab.id != browser.tabs.TAB_ID_NONE)) {
							_context13.next = 11;
							break;
						}

						_context13.next = 7;
						return browser.tabs.query({ currentWindow: true });

					case 7:
						tabCount = _context13.sent;

						if (!(tabCount.length > tabLimit)) {
							_context13.next = 11;
							break;
						}

						_context13.next = 11;
						return createWindowWithTabs([tab], tab.incognito);

					case 11:
						updateTabCountDebounce();

					case 12:
					case 'end':
						return _context13.stop();
				}
			}
		}, _callee13, this);
	}));

	return function tabAdded(_x15) {
		return _ref13.apply(this, arguments);
	};
}();

var openSidebar = function () {
	var _ref14 = _asyncToGenerator(regeneratorRuntime.mark(function _callee14() {
		return regeneratorRuntime.wrap(function _callee14$(_context14) {
			while (1) {
				switch (_context14.prev = _context14.next) {
					case 0:
						_context14.next = 2;
						return browser.sidebarAction.open();

					case 2:
					case 'end':
						return _context14.stop();
				}
			}
		}, _callee14, this);
	}));

	return function openSidebar() {
		return _ref14.apply(this, arguments);
	};
}();

var openPopup = function () {
	var _ref15 = _asyncToGenerator(regeneratorRuntime.mark(function _callee15() {
		var openInOwnTab;
		return regeneratorRuntime.wrap(function _callee15$(_context15) {
			while (1) {
				switch (_context15.prev = _context15.next) {
					case 0:
						_context15.next = 2;
						return getLocalStorage("openInOwnTab", false);

					case 2:
						openInOwnTab = _context15.sent;

						if (!openInOwnTab) {
							_context15.next = 12;
							break;
						}

						_context15.next = 6;
						return browser.action.setPopup({ popup: "popup.html?popup=true" });

					case 6:
						_context15.next = 8;
						return browser.action.openPopup();

					case 8:
						_context15.next = 10;
						return browser.action.setPopup({ popup: "" });

					case 10:
						_context15.next = 14;
						break;

					case 12:
						_context15.next = 14;
						return browser.action.openPopup();

					case 14:
					case 'end':
						return _context15.stop();
				}
			}
		}, _callee15, this);
	}));

	return function openPopup() {
		return _ref15.apply(this, arguments);
	};
}();

var openAsOwnTab = function () {
	var _ref16 = _asyncToGenerator(regeneratorRuntime.mark(function _callee16() {
		var popup_page, tabs, currentTab, previousTab, i, tab;
		return regeneratorRuntime.wrap(function _callee16$(_context16) {
			while (1) {
				switch (_context16.prev = _context16.next) {
					case 0:
						popup_page = browser.runtime.getURL("popup.html");
						_context16.next = 3;
						return browser.tabs.query({});

					case 3:
						tabs = _context16.sent;

						if (!!globalTabsActive && globalTabsActive.length > 1) {
							currentTab = globalTabsActive[globalTabsActive.length - 1];
							previousTab = globalTabsActive[globalTabsActive.length - 2];
						}

						i = 0;

					case 6:
						if (!(i < tabs.length)) {
							_context16.next = 17;
							break;
						}

						tab = tabs[i];

						if (!(tab.url.indexOf("popup.html") > -1 && tab.url.indexOf(popup_page) > -1)) {
							_context16.next = 14;
							break;
						}

						if (!(currentTab && currentTab.tabId && tab.id == currentTab.tabId && previousTab && previousTab.tabId)) {
							_context16.next = 13;
							break;
						}

						return _context16.abrupt('return', focusOnTabAndWindow(previousTab));

					case 13:
						return _context16.abrupt('return', browser.windows.update(tab.windowId, { focused: true }).then(function () {
							browser.tabs.highlight({ windowId: tab.windowId, tabs: tab.index });
						}.bind(this)));

					case 14:
						i++;
						_context16.next = 6;
						break;

					case 17:
						return _context16.abrupt('return', browser.tabs.create({ url: "popup.html" }));

					case 18:
					case 'end':
						return _context16.stop();
				}
			}
		}, _callee16, this);
	}));

	return function openAsOwnTab() {
		return _ref16.apply(this, arguments);
	};
}();

var setupPopup = function () {
	var _ref17 = _asyncToGenerator(regeneratorRuntime.mark(function _callee17() {
		var openInOwnTab;
		return regeneratorRuntime.wrap(function _callee17$(_context17) {
			while (1) {
				switch (_context17.prev = _context17.next) {
					case 0:
						_context17.next = 2;
						return getLocalStorage("openInOwnTab", false);

					case 2:
						openInOwnTab = _context17.sent;
						_context17.next = 5;
						return browser.action.onClicked.removeListener(openAsOwnTab);

					case 5:
						if (!openInOwnTab) {
							_context17.next = 12;
							break;
						}

						_context17.next = 8;
						return browser.action.setPopup({ popup: "" });

					case 8:
						_context17.next = 10;
						return browser.action.onClicked.addListener(openAsOwnTab);

					case 10:
						_context17.next = 14;
						break;

					case 12:
						_context17.next = 14;
						return browser.action.setPopup({ popup: "popup.html?popup=true" });

					case 14:
						if (browser.sidebarAction) {
							browser.sidebarAction.setPanel({ panel: "popup.html?panel=true" });
						}

					case 15:
					case 'end':
						return _context17.stop();
				}
			}
		}, _callee17, this);
	}));

	return function setupPopup() {
		return _ref17.apply(this, arguments);
	};
}();

var setupListeners = function () {
	var _ref18 = _asyncToGenerator(regeneratorRuntime.mark(function _callee18() {
		return regeneratorRuntime.wrap(function _callee18$(_context18) {
			while (1) {
				switch (_context18.prev = _context18.next) {
					case 0:
						_context18.next = 2;
						return browser.contextMenus.removeAll();

					case 2:
						browser.contextMenus.create({
							id: "open_in_own_tab",
							title: "📔 Open in own tab",
							contexts: ["action"]
						});

						if (!!browser.action.openPopup) {
							browser.contextMenus.create({
								id: "open_popup",
								title: "📑 Open popup",
								contexts: ["action"]
							});
						}

						if (!!browser.sidebarAction) {
							browser.contextMenus.create({
								id: "open_sidebar",
								title: "🗂 Open sidebar",
								contexts: ["action"]
							});
						}

						browser.contextMenus.create({
							id: "sep1",
							type: "separator",
							contexts: ["action"]
						});

						browser.contextMenus.create({
							title: "😍 Support this extension",
							id: "support_menu",
							"contexts": ["action"]
						});

						browser.contextMenus.create({
							id: "review",
							title: "⭐ Leave a review",
							"contexts": ["action"],
							parentId: "support_menu"
						});

						browser.contextMenus.create({
							id: "donate",
							title: "☕ Donate to keep Extensions Alive",
							"contexts": ["action"],
							parentId: "support_menu"
						});

						browser.contextMenus.create({
							id: "patron",
							title: "💰 Become a Patron",
							"contexts": ["action"],
							parentId: "support_menu"
						});

						browser.contextMenus.create({
							id: "twitter",
							title: "🐦 Follow on Twitter",
							"contexts": ["action"],
							parentId: "support_menu"
						});

						browser.contextMenus.create({
							title: "🤔 Issues and Suggestions",
							id: "code_menu",
							"contexts": ["action"]
						});

						browser.contextMenus.create({
							id: "changelog",
							title: "🆕 View recent changes",
							"contexts": ["action"],
							parentId: "code_menu"
						});

						browser.contextMenus.create({
							id: "options",
							title: "⚙ Edit Options",
							"contexts": ["action"],
							parentId: "code_menu"
						});

						browser.contextMenus.create({
							id: "source",
							title: "💻 View source code",
							"contexts": ["action"],
							parentId: "code_menu"
						});

						browser.contextMenus.create({
							id: "report",
							title: "🤔 Report an issue",
							"contexts": ["action"],
							parentId: "code_menu"
						});

						browser.contextMenus.create({
							id: "send",
							title: "💡 Send a suggestion",
							"contexts": ["action"],
							parentId: "code_menu"
						});

						browser.contextMenus.onClicked.addListener(function (info, tab) {
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
						browser.tabs.onUpdated.removeListener(tabCountChanged);
						browser.tabs.onRemoved.removeListener(tabCountChanged);
						browser.tabs.onReplaced.removeListener(tabCountChanged);
						browser.tabs.onDetached.removeListener(tabCountChanged);
						browser.tabs.onAttached.removeListener(tabCountChanged);
						browser.tabs.onActivated.removeListener(tabActiveChanged);
						browser.tabs.onMoved.removeListener(tabCountChanged);

						browser.tabs.onCreated.removeListener(checkTabCreate);
						browser.tabs.onUpdated.removeListener(checkTabUpdate);
						browser.tabs.onRemoved.removeListener(checkTabRemove);
						browser.tabs.onDetached.removeListener(checkTabDetached);
						browser.tabs.onAttached.removeListener(checkTabAttached);
						browser.tabs.onMoved.removeListener(checkTabMoved);

						browser.windows.onFocusChanged.removeListener(windowFocus);
						browser.windows.onCreated.removeListener(windowCreated);
						browser.windows.onRemoved.removeListener(windowRemoved);

						browser.tabs.onCreated.addListener(tabAdded);
						browser.tabs.onUpdated.addListener(tabCountChanged);
						browser.tabs.onRemoved.addListener(tabCountChanged);
						browser.tabs.onReplaced.addListener(tabCountChanged);
						browser.tabs.onDetached.addListener(tabCountChanged);
						browser.tabs.onAttached.addListener(tabCountChanged);
						browser.tabs.onActivated.addListener(tabActiveChanged);
						browser.tabs.onMoved.addListener(tabCountChanged);

						browser.tabs.onCreated.addListener(checkTabCreate);
						browser.tabs.onUpdated.addListener(checkTabUpdate);
						browser.tabs.onRemoved.addListener(checkTabRemove);
						browser.tabs.onDetached.addListener(checkTabDetached);
						browser.tabs.onAttached.addListener(checkTabAttached);
						browser.tabs.onMoved.addListener(checkTabMoved);

						browser.windows.onFocusChanged.addListener(windowFocus);
						browser.windows.onCreated.addListener(windowCreated);
						browser.windows.onRemoved.addListener(windowRemoved);
						updateTabCountDebounce();

						setTimeout(cleanupDebounce, 2500);

					case 55:
					case 'end':
						return _context18.stop();
				}
			}
		}, _callee18, this);
	}));

	return function setupListeners() {
		return _ref18.apply(this, arguments);
	};
}();

var checkWindow = function () {
	var _ref19 = _asyncToGenerator(regeneratorRuntime.mark(function _callee19(windowId) {
		var storage, names, colors, hashes, window, newHash;
		return regeneratorRuntime.wrap(function _callee19$(_context19) {
			while (1) {
				switch (_context19.prev = _context19.next) {
					case 0:
						if (windowId) {
							_context19.next = 2;
							break;
						}

						return _context19.abrupt('return');

					case 2:
						_context19.next = 4;
						return browser.storage.local.get(['windowNames', 'windowColors', 'windowHashes']);

					case 4:
						storage = _context19.sent;
						names = storage.windowNames || {};
						colors = storage.windowColors || {};
						hashes = storage.windowHashes || {};

						if (!(!names[windowId] && !colors[windowId])) {
							_context19.next = 10;
							break;
						}

						return _context19.abrupt('return');

					case 10:
						_context19.prev = 10;
						_context19.next = 13;
						return browser.windows.get(windowId, { populate: true });

					case 13:
						window = _context19.sent;
						newHash = hashcode(window);

						hashes[windowId] = newHash;
						_context19.next = 18;
						return setLocalStorage('windowHashes', hashes);

					case 18:
						_context19.next = 23;
						break;

					case 20:
						_context19.prev = 20;
						_context19.t0 = _context19['catch'](10);

						console.log(_context19.t0);

					case 23:
					case 'end':
						return _context19.stop();
				}
			}
		}, _callee19, this, [[10, 20]]);
	}));

	return function checkWindow(_x16) {
		return _ref19.apply(this, arguments);
	};
}();

var checkTabCreate = function () {
	var _ref20 = _asyncToGenerator(regeneratorRuntime.mark(function _callee20(tab) {
		return regeneratorRuntime.wrap(function _callee20$(_context20) {
			while (1) {
				switch (_context20.prev = _context20.next) {
					case 0:
						checkWindow(tab.windowId);

					case 1:
					case 'end':
						return _context20.stop();
				}
			}
		}, _callee20, this);
	}));

	return function checkTabCreate(_x17) {
		return _ref20.apply(this, arguments);
	};
}();

var checkTabUpdate = function () {
	var _ref21 = _asyncToGenerator(regeneratorRuntime.mark(function _callee21(tabid, changeinfo, tab) {
		return regeneratorRuntime.wrap(function _callee21$(_context21) {
			while (1) {
				switch (_context21.prev = _context21.next) {
					case 0:
						checkWindow(tab.windowId);

					case 1:
					case 'end':
						return _context21.stop();
				}
			}
		}, _callee21, this);
	}));

	return function checkTabUpdate(_x18, _x19, _x20) {
		return _ref21.apply(this, arguments);
	};
}();

var checkTabRemove = function () {
	var _ref22 = _asyncToGenerator(regeneratorRuntime.mark(function _callee22(tabid, removeinfo) {
		return regeneratorRuntime.wrap(function _callee22$(_context22) {
			while (1) {
				switch (_context22.prev = _context22.next) {
					case 0:
						if (!removeinfo.isWindowClosing) {
							_context22.next = 2;
							break;
						}

						return _context22.abrupt('return');

					case 2:
						checkWindow(removeinfo.windowId);

					case 3:
					case 'end':
						return _context22.stop();
				}
			}
		}, _callee22, this);
	}));

	return function checkTabRemove(_x21, _x22) {
		return _ref22.apply(this, arguments);
	};
}();

var checkTabDetached = function () {
	var _ref23 = _asyncToGenerator(regeneratorRuntime.mark(function _callee23(tabid, detachinfo) {
		return regeneratorRuntime.wrap(function _callee23$(_context23) {
			while (1) {
				switch (_context23.prev = _context23.next) {
					case 0:
						checkWindow(detachinfo.oldWindowId);

					case 1:
					case 'end':
						return _context23.stop();
				}
			}
		}, _callee23, this);
	}));

	return function checkTabDetached(_x23, _x24) {
		return _ref23.apply(this, arguments);
	};
}();

var checkTabAttached = function () {
	var _ref24 = _asyncToGenerator(regeneratorRuntime.mark(function _callee24(tabid, attachinfo) {
		return regeneratorRuntime.wrap(function _callee24$(_context24) {
			while (1) {
				switch (_context24.prev = _context24.next) {
					case 0:
						checkWindow(attachinfo.newWindowId);

					case 1:
					case 'end':
						return _context24.stop();
				}
			}
		}, _callee24, this);
	}));

	return function checkTabAttached(_x25, _x26) {
		return _ref24.apply(this, arguments);
	};
}();

var checkTabMoved = function () {
	var _ref25 = _asyncToGenerator(regeneratorRuntime.mark(function _callee25(tabid, moveinfo) {
		return regeneratorRuntime.wrap(function _callee25$(_context25) {
			while (1) {
				switch (_context25.prev = _context25.next) {
					case 0:
						checkWindow(moveinfo.windowId);

					case 1:
					case 'end':
						return _context25.stop();
				}
			}
		}, _callee25, this);
	}));

	return function checkTabMoved(_x27, _x28) {
		return _ref25.apply(this, arguments);
	};
}();

var hideWindows = function () {
	var _ref26 = _asyncToGenerator(regeneratorRuntime.mark(function _callee27(windowId) {
		var hideWindows, result;
		return regeneratorRuntime.wrap(function _callee27$(_context27) {
			while (1) {
				switch (_context27.prev = _context27.next) {
					case 0:
						if (!(navigator.userAgent.search("Firefox") > -1)) {
							_context27.next = 2;
							break;
						}

						return _context27.abrupt('return');

					case 2:
						if (!(!windowId || windowId < 0)) {
							_context27.next = 6;
							break;
						}

						return _context27.abrupt('return');

					case 6:
						_context27.next = 8;
						return getLocalStorage("hideWindows", false);

					case 8:
						hideWindows = _context27.sent;

						if (hideWindows) {
							_context27.next = 11;
							break;
						}

						return _context27.abrupt('return');

					case 11:
						_context27.next = 13;
						return browser.permissions.contains({ permissions: ['system.display'] });

					case 13:
						result = _context27.sent;

						if (result) {
							chrome.system.display.getInfo(function () {
								var _ref27 = _asyncToGenerator(regeneratorRuntime.mark(function _callee26(windowId, displaylayouts) {
									var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, displaylayout, windows, monitor, i, a, result;

									return regeneratorRuntime.wrap(function _callee26$(_context26) {
										while (1) {
											switch (_context26.prev = _context26.next) {
												case 0:
													globalDisplayInfo = [];
													_iteratorNormalCompletion = true;
													_didIteratorError = false;
													_iteratorError = undefined;
													_context26.prev = 4;

													for (_iterator = displaylayouts[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
														displaylayout = _step.value;

														globalDisplayInfo.push(displaylayout.bounds);
													}
													_context26.next = 12;
													break;

												case 8:
													_context26.prev = 8;
													_context26.t0 = _context26['catch'](4);

													_didIteratorError = true;
													_iteratorError = _context26.t0;

												case 12:
													_context26.prev = 12;
													_context26.prev = 13;

													if (!_iteratorNormalCompletion && _iterator.return) {
														_iterator.return();
													}

												case 15:
													_context26.prev = 15;

													if (!_didIteratorError) {
														_context26.next = 18;
														break;
													}

													throw _iteratorError;

												case 18:
													return _context26.finish(15);

												case 19:
													return _context26.finish(12);

												case 20:
													_context26.next = 22;
													return browser.windows.getAll({ populate: true });

												case 22:
													windows = _context26.sent;
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

													i = windows.length - 1;

												case 27:
													if (!(i >= 0)) {
														_context26.next = 35;
														break;
													}

													if (!(windows[i].id != windowId)) {
														_context26.next = 32;
														break;
													}

													if (!is_in_bounds(windows[i], globalDisplayInfo[monitor])) {
														_context26.next = 32;
														break;
													}

													_context26.next = 32;
													return browser.windows.update(windows[i].id, { "state": "minimized" });

												case 32:
													i--;
													_context26.next = 27;
													break;

												case 35:
													;

												case 36:
												case 'end':
													return _context26.stop();
											}
										}
									}, _callee26, this, [[4, 8, 12, 20], [13,, 15, 19]]);
								}));

								return function (_x30, _x31) {
									return _ref27.apply(this, arguments);
								};
							}().bind(null, windowId));
						}

					case 15:
					case 'end':
						return _context27.stop();
				}
			}
		}, _callee27, this);
	}));

	return function hideWindows(_x29) {
		return _ref26.apply(this, arguments);
	};
}();

var windowActive = function () {
	var _ref28 = _asyncToGenerator(regeneratorRuntime.mark(function _callee28(windowId) {
		var windows, windowAge;
		return regeneratorRuntime.wrap(function _callee28$(_context28) {
			while (1) {
				switch (_context28.prev = _context28.next) {
					case 0:
						if (!(windowId < 0)) {
							_context28.next = 2;
							break;
						}

						return _context28.abrupt('return');

					case 2:
						windows = [];
						_context28.next = 5;
						return getLocalStorage("windowAge", []);

					case 5:
						windowAge = _context28.sent;

						if (windowAge instanceof Array) windows = windowAge;

						if (windows.indexOf(windowId) > -1) windows.splice(windows.indexOf(windowId), 1);
						windows.unshift(windowId);
						_context28.next = 11;
						return setLocalStorage("windowAge", windows);

					case 11:
					case 'end':
						return _context28.stop();
				}
			}
		}, _callee28, this);
	}));

	return function windowActive(_x32) {
		return _ref28.apply(this, arguments);
	};
}();

var cleanUp = function () {
	var _ref30 = _asyncToGenerator(regeneratorRuntime.mark(function _callee30() {
		var activewindows, windowids, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, w, windows, i, names, colors, tocheck, exists, to_refresh, id, hashes, found, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, windowhash;

		return regeneratorRuntime.wrap(function _callee30$(_context30) {
			while (1) {
				switch (_context30.prev = _context30.next) {
					case 0:
						_context30.next = 2;
						return browser.windows.getAll({ populate: true });

					case 2:
						activewindows = _context30.sent;
						windowids = [];
						_iteratorNormalCompletion3 = true;
						_didIteratorError3 = false;
						_iteratorError3 = undefined;
						_context30.prev = 7;

						for (_iterator3 = activewindows[Symbol.iterator](); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
							w = _step3.value;

							windowids.push(w.id);
						}
						_context30.next = 15;
						break;

					case 11:
						_context30.prev = 11;
						_context30.t0 = _context30['catch'](7);
						_didIteratorError3 = true;
						_iteratorError3 = _context30.t0;

					case 15:
						_context30.prev = 15;
						_context30.prev = 16;

						if (!_iteratorNormalCompletion3 && _iterator3.return) {
							_iterator3.return();
						}

					case 18:
						_context30.prev = 18;

						if (!_didIteratorError3) {
							_context30.next = 21;
							break;
						}

						throw _iteratorError3;

					case 21:
						return _context30.finish(18);

					case 22:
						return _context30.finish(15);

					case 23:
						_context30.next = 25;
						return getLocalStorage("windowAge", []);

					case 25:
						windows = _context30.sent;

						if (!(windows instanceof Array)) windows = [];

						for (i = windows.length - 1; i >= 0; i--) {
							if (windowids.indexOf(windows[i]) < 0) {
								windows.splice(i, 1);
							}
						};
						_context30.next = 31;
						return setLocalStorage("windowAge", windows);

					case 31:
						_context30.next = 33;
						return getLocalStorage("windowNames", {});

					case 33:
						names = _context30.sent;
						_context30.next = 36;
						return getLocalStorage("windowColors", {});

					case 36:
						colors = _context30.sent;
						tocheck = new Set();
						exists = new Set();
						to_refresh = [];

						for (id in names) {
							if (windowids.indexOf(parseInt(id)) < 0) {
								tocheck.add(id);
							} else {
								exists.add(id);
							}
						}

						for (id in colors) {
							if (windowids.indexOf(parseInt(id)) < 0) {
								tocheck.add(id);
							} else {
								exists.add(id);
							}
						}

						if (!(tocheck.size > 0)) {
							_context30.next = 112;
							break;
						}

						_context30.next = 45;
						return getLocalStorage("windowHashes", {});

					case 45:
						hashes = _context30.sent;

						console.log(hashes);
						console.log(names);
						console.log(colors);

						for (id in hashes) {
							if (!hashes[id]) delete hashes[id];
						}for (id in colors) {
							if (!colors[id]) delete colors[id];
						}found = false;
						_iteratorNormalCompletion4 = true;
						_didIteratorError4 = false;
						_iteratorError4 = undefined;
						_context30.prev = 55;
						_iterator4 = activewindows[Symbol.iterator]();

					case 57:
						if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
							_context30.next = 84;
							break;
						}

						w = _step4.value;
						windowhash = hashcode(w);
						_context30.t1 = regeneratorRuntime.keys(hashes);

					case 61:
						if ((_context30.t2 = _context30.t1()).done) {
							_context30.next = 81;
							break;
						}

						id = _context30.t2.value;

						if (tocheck.has(id)) {
							_context30.next = 65;
							break;
						}

						return _context30.abrupt('continue', 61);

					case 65:
						if (!exists.has(id)) {
							_context30.next = 67;
							break;
						}

						return _context30.abrupt('continue', 61);

					case 67:
						if (!(w.id == id)) {
							_context30.next = 69;
							break;
						}

						return _context30.abrupt('break', 81);

					case 69:
						if (!(hashes[id] == windowhash)) {
							_context30.next = 79;
							break;
						}

						console.log("found by hash, old id " + id + " new id " + w.id);
						to_refresh.push(w.id);
						if (!!names[id]) {
							names[w.id] = names[id];
							delete names[id];
						}
						if (!!colors[id]) {
							colors[w.id] = colors[id];
							delete colors[id];
						}
						hashes[w.id] = names[id];
						delete hashes[id];
						found = true;
						tocheck.delete(id);
						return _context30.abrupt('break', 81);

					case 79:
						_context30.next = 61;
						break;

					case 81:
						_iteratorNormalCompletion4 = true;
						_context30.next = 57;
						break;

					case 84:
						_context30.next = 90;
						break;

					case 86:
						_context30.prev = 86;
						_context30.t3 = _context30['catch'](55);
						_didIteratorError4 = true;
						_iteratorError4 = _context30.t3;

					case 90:
						_context30.prev = 90;
						_context30.prev = 91;

						if (!_iteratorNormalCompletion4 && _iterator4.return) {
							_iterator4.return();
						}

					case 93:
						_context30.prev = 93;

						if (!_didIteratorError4) {
							_context30.next = 96;
							break;
						}

						throw _iteratorError4;

					case 96:
						return _context30.finish(93);

					case 97:
						return _context30.finish(90);

					case 98:

						for (id in tocheck) {
							console.log("did not find by hash", id);
						}

						if (!found) {
							_context30.next = 107;
							break;
						}

						_context30.next = 102;
						return setLocalStorage("windowNames", names);

					case 102:
						_context30.next = 104;
						return setLocalStorage("windowColors", colors);

					case 104:
						_context30.next = 106;
						return setLocalStorage("windowHashes", hashes);

					case 106:
						browser.runtime.sendMessage({
							command: "refresh_windows",
							window_ids: to_refresh
						});

					case 107:

						console.log(tocheck);
						console.log(exists);
						console.log(hashes);
						console.log(names);
						console.log(colors);

					case 112:
					case 'end':
						return _context30.stop();
				}
			}
		}, _callee30, this, [[7, 11, 15, 23], [16,, 18, 22], [55, 86, 90, 98], [91,, 93, 97]]);
	}));

	return function cleanUp() {
		return _ref30.apply(this, arguments);
	};
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

importScripts('../vendor/babel-polyfill.js');
importScripts('../vendor/browser-polyfill.min.js');
importScripts('./local.js');

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

function focusOnTabAndWindowDelayed(tab) {
	var tab = JSON.parse(JSON.stringify(tab));
	setTimeout(focusOnTabAndWindow.bind(this, tab), 125);
}

function focusOnWindowDelayed(windowId) {
	setTimeout(focusOnWindow.bind(this, windowId), 125);
}

function focusOnWindow(windowId) {
	browser.windows.update(windowId, { focused: true });
}

var updateTabCountDebounce = debounce(updateTabCount, 250);
var cleanupDebounce = debounce(cleanUp, 500);

function tabCountChanged() {
	updateTabCountDebounce();
}

function tabActiveChanged(tab) {
	if (!!tab && !!tab.tabId) {
		if (!globalTabsActive) globalTabsActive = [];
		if (!!globalTabsActive && globalTabsActive.length > 0) {
			var lastActive = globalTabsActive[globalTabsActive.length - 1];
			if (!!lastActive && lastActive.tabId == tab.tabId && lastActive.windowId == tab.windowId) {
				return;
			}
		}
		while (globalTabsActive.length > 20) {
			globalTabsActive.shift();
		}
		for (var i = globalTabsActive.length - 1; i >= 0; i--) {
			if (globalTabsActive[i].tabId == tab.tabId) {
				globalTabsActive.splice(i, 1);
			}
		};
		globalTabsActive.push(tab);
	}
	updateTabCountDebounce();
}

function stringHashcode(string) {
	var hash = 0;
	for (var i = 0; i < string.length; i++) {
		var code = string.charCodeAt(i);
		hash = (hash << 5) - hash + code;
		hash = hash & hash;
	}
	return hash;
}

function hashcode(window) {
	var urls = [];
	for (var i = 0; i < window.tabs.length; i++) {
		if (!window.tabs[i].url) continue;
		urls.push(window.tabs[i].url);
	}
	urls.sort();

	var hash = 0;
	for (var i = 0; i < urls.length; i++) {
		var code = stringHashcode(urls[i]);
		hash = (hash << 5) - hash + code;
		hash = hash & hash;
	}
	return hash;
}

function debounce(func, wait, immediate) {
	var timeout;
	return function () {
		var context = this,
		    args = arguments;
		var later = function later() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

function windowFocus(windowId) {
	try {
		if (!!windowId) {
			windowActive(windowId);

			hideWindows(windowId);
		}
	} catch (e) {}
}
function windowCreated(window) {
	try {
		if (!!window && !!window.id) {
			windowActive(window.id);
		}
	} catch (e) {}

	setTimeout(cleanupDebounce, 250);
}
function windowRemoved(windowId) {
	try {
		if (!!windowId) {
			windowActive(windowId);
		}
	} catch (e) {}
}

function is_in_bounds(object, bounds) {
	var C = object,
	    B = bounds;
	if (C.left >= B.left && C.left <= B.left + B.width) {
		if (C.top >= B.top && C.top <= B.top + B.height) {
			return true;
		}
	}
	return false;
};

browser.commands.onCommand.addListener(function (command) {
	if (command == "switch_to_previous_active_tab") {
		if (!!globalTabsActive && globalTabsActive.length > 1) {
			focusOnTabAndWindow(globalTabsActive[globalTabsActive.length - 2]);
		}
	}
});

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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
});

_asyncToGenerator(regeneratorRuntime.mark(function _callee29() {
	var windows, i;
	return regeneratorRuntime.wrap(function _callee29$(_context29) {
		while (1) {
			switch (_context29.prev = _context29.next) {
				case 0:
					_context29.next = 2;
					return browser.windows.getAll({ populate: true });

				case 2:
					windows = _context29.sent;
					_context29.next = 5;
					return setLocalStorage("windowAge", []);

				case 5:
					if (!(!!windows && windows.length > 0)) {
						_context29.next = 16;
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
						_context29.next = 15;
						break;
					}

					if (!windows[i].id) {
						_context29.next = 12;
						break;
					}

					_context29.next = 12;
					return windowActive(windows[i].id);

				case 12:
					i++;
					_context29.next = 8;
					break;

				case 15:
					;

				case 16:
				case 'end':
					return _context29.stop();
			}
		}
	}, _callee29, this);
}))();

setInterval(setupListeners, 300000);

setupListeners();
//# sourceMappingURL=service_worker.js.map