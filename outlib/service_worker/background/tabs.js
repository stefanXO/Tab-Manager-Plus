"use strict";

var setupTabListeners = function () {
	var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
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
					case 28:
					case "end":
						return _context.stop();
				}
			}
		}, _callee, this);
	}));

	return function setupTabListeners() {
		return _ref.apply(this, arguments);
	};
}();

var discardTabs = function () {
	var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(tabs) {
		var i;
		return regeneratorRuntime.wrap(function _callee2$(_context2) {
			while (1) {
				switch (_context2.prev = _context2.next) {
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
					case "end":
						return _context2.stop();
				}
			}
		}, _callee2, this);
	}));

	return function discardTabs(_x) {
		return _ref2.apply(this, arguments);
	};
}();

var closeTabs = function () {
	var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(tabs) {
		var i;
		return regeneratorRuntime.wrap(function _callee3$(_context3) {
			while (1) {
				switch (_context3.prev = _context3.next) {
					case 0:
						i = 0;

					case 1:
						if (!(i < tabs.length)) {
							_context3.next = 7;
							break;
						}

						_context3.next = 4;
						return browser.tabs.remove(tabs[i].id);

					case 4:
						i++;
						_context3.next = 1;
						break;

					case 7:
					case "end":
						return _context3.stop();
				}
			}
		}, _callee3, this);
	}));

	return function closeTabs(_x2) {
		return _ref3.apply(this, arguments);
	};
}();

var moveTabsToWindow = function () {
	var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(windowId, tabs) {
		var i, t;
		return regeneratorRuntime.wrap(function _callee4$(_context4) {
			while (1) {
				switch (_context4.prev = _context4.next) {
					case 0:
						i = 0;

					case 1:
						if (!(i < tabs.length)) {
							_context4.next = 10;
							break;
						}

						t = tabs[i];
						_context4.next = 5;
						return browser.tabs.move(t.id, { windowId: windowId, index: -1 });

					case 5:
						_context4.next = 7;
						return browser.tabs.update(t.id, { pinned: t.pinned });

					case 7:
						i++;
						_context4.next = 1;
						break;

					case 10:
					case "end":
						return _context4.stop();
				}
			}
		}, _callee4, this);
	}));

	return function moveTabsToWindow(_x3, _x4) {
		return _ref4.apply(this, arguments);
	};
}();

var focusOnTabAndWindow = function () {
	var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(tab) {
		var windowId, tabId;
		return regeneratorRuntime.wrap(function _callee5$(_context5) {
			while (1) {
				switch (_context5.prev = _context5.next) {
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
					case "end":
						return _context5.stop();
				}
			}
		}, _callee5, this);
	}));

	return function focusOnTabAndWindow(_x5) {
		return _ref5.apply(this, arguments);
	};
}();

var updateTabCount = function () {
	var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
		var run, badge, result, count, toRemove, i, t, found, j;
		return regeneratorRuntime.wrap(function _callee6$(_context6) {
			while (1) {
				switch (_context6.prev = _context6.next) {
					case 0:
						run = true;
						_context6.next = 3;
						return getLocalStorage("badge", true);

					case 3:
						badge = _context6.sent;

						if (!badge) run = false;

						if (!run) {
							_context6.next = 21;
							break;
						}

						_context6.next = 8;
						return browser.tabs.query({});

					case 8:
						result = _context6.sent;
						count = 0;

						if (!!result && !!result.length) {
							count = result.length;
						}
						_context6.next = 13;
						return browser.action.setBadgeText({ text: count + "" });

					case 13:
						_context6.next = 15;
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
									}
									;
								}
								if (!found) toRemove.push(i);
							}
							;
						}

						for (i = toRemove.length - 1; i >= 0; i--) {
							if (!!globalTabsActive && globalTabsActive.length > 0) {
								if (!!globalTabsActive[toRemove[i]]) globalTabsActive.splice(toRemove[i], 1);
							}
						}
						;
						_context6.next = 23;
						break;

					case 21:
						_context6.next = 23;
						return browser.action.setBadgeText({ text: "" });

					case 23:
					case "end":
						return _context6.stop();
				}
			}
		}, _callee6, this);
	}));

	return function updateTabCount() {
		return _ref6.apply(this, arguments);
	};
}();

var tabAdded = function () {
	var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(tab) {
		var tabLimit, tabCount;
		return regeneratorRuntime.wrap(function _callee7$(_context7) {
			while (1) {
				switch (_context7.prev = _context7.next) {
					case 0:
						_context7.next = 2;
						return getLocalStorage("tabLimit", 0);

					case 2:
						tabLimit = _context7.sent;

						if (!(tabLimit > 0)) {
							_context7.next = 11;
							break;
						}

						if (!(tab.id != browser.tabs.TAB_ID_NONE)) {
							_context7.next = 11;
							break;
						}

						_context7.next = 7;
						return browser.tabs.query({ currentWindow: true });

					case 7:
						tabCount = _context7.sent;

						if (!(tabCount.length > tabLimit)) {
							_context7.next = 11;
							break;
						}

						_context7.next = 11;
						return createWindowWithTabs([tab], tab.incognito);

					case 11:
						updateTabCountDebounce();

					case 12:
					case "end":
						return _context7.stop();
				}
			}
		}, _callee7, this);
	}));

	return function tabAdded(_x6) {
		return _ref7.apply(this, arguments);
	};
}();

var checkTabCreate = function () {
	var _ref8 = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(tab) {
		return regeneratorRuntime.wrap(function _callee8$(_context8) {
			while (1) {
				switch (_context8.prev = _context8.next) {
					case 0:
						_context8.next = 2;
						return checkWindow(tab.windowId);

					case 2:
					case "end":
						return _context8.stop();
				}
			}
		}, _callee8, this);
	}));

	return function checkTabCreate(_x7) {
		return _ref8.apply(this, arguments);
	};
}();

var checkTabUpdate = function () {
	var _ref9 = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(tabid, changeinfo, tab) {
		return regeneratorRuntime.wrap(function _callee9$(_context9) {
			while (1) {
				switch (_context9.prev = _context9.next) {
					case 0:
						_context9.next = 2;
						return checkWindow(tab.windowId);

					case 2:
					case "end":
						return _context9.stop();
				}
			}
		}, _callee9, this);
	}));

	return function checkTabUpdate(_x8, _x9, _x10) {
		return _ref9.apply(this, arguments);
	};
}();

var checkTabRemove = function () {
	var _ref10 = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(tabid, removeinfo) {
		return regeneratorRuntime.wrap(function _callee10$(_context10) {
			while (1) {
				switch (_context10.prev = _context10.next) {
					case 0:
						if (!removeinfo.isWindowClosing) {
							_context10.next = 2;
							break;
						}

						return _context10.abrupt("return");

					case 2:
						_context10.next = 4;
						return checkWindow(removeinfo.windowId);

					case 4:
					case "end":
						return _context10.stop();
				}
			}
		}, _callee10, this);
	}));

	return function checkTabRemove(_x11, _x12) {
		return _ref10.apply(this, arguments);
	};
}();

var checkTabDetached = function () {
	var _ref11 = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(tabid, detachinfo) {
		return regeneratorRuntime.wrap(function _callee11$(_context11) {
			while (1) {
				switch (_context11.prev = _context11.next) {
					case 0:
						_context11.next = 2;
						return checkWindow(detachinfo.oldWindowId);

					case 2:
					case "end":
						return _context11.stop();
				}
			}
		}, _callee11, this);
	}));

	return function checkTabDetached(_x13, _x14) {
		return _ref11.apply(this, arguments);
	};
}();

var checkTabAttached = function () {
	var _ref12 = _asyncToGenerator(regeneratorRuntime.mark(function _callee12(tabid, attachinfo) {
		return regeneratorRuntime.wrap(function _callee12$(_context12) {
			while (1) {
				switch (_context12.prev = _context12.next) {
					case 0:
						_context12.next = 2;
						return checkWindow(attachinfo.newWindowId);

					case 2:
					case "end":
						return _context12.stop();
				}
			}
		}, _callee12, this);
	}));

	return function checkTabAttached(_x15, _x16) {
		return _ref12.apply(this, arguments);
	};
}();

var checkTabMoved = function () {
	var _ref13 = _asyncToGenerator(regeneratorRuntime.mark(function _callee13(tabid, moveinfo) {
		return regeneratorRuntime.wrap(function _callee13$(_context13) {
			while (1) {
				switch (_context13.prev = _context13.next) {
					case 0:
						_context13.next = 2;
						return checkWindow(moveinfo.windowId);

					case 2:
					case "end":
						return _context13.stop();
				}
			}
		}, _callee13, this);
	}));

	return function checkTabMoved(_x17, _x18) {
		return _ref13.apply(this, arguments);
	};
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var browser = browser || chrome;

function focusOnTabAndWindowDelayed(tab) {
	var tab = JSON.parse(JSON.stringify(tab));
	setTimeout(focusOnTabAndWindow.bind(this, tab), 125);
}

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
		}
		globalTabsActive.push(tab);
	}
	updateTabCountDebounce();
}
//# sourceMappingURL=tabs.js.map