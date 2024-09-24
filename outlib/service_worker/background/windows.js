"use strict";

var setupWindowListeners = function () {
	var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						browser.windows.onFocusChanged.removeListener(windowFocus);
						browser.windows.onCreated.removeListener(windowCreated);
						browser.windows.onRemoved.removeListener(windowRemoved);

						browser.windows.onFocusChanged.addListener(windowFocus);
						browser.windows.onCreated.addListener(windowCreated);
						browser.windows.onRemoved.addListener(windowRemoved);

					case 6:
					case "end":
						return _context.stop();
				}
			}
		}, _callee, this);
	}));

	return function setupWindowListeners() {
		return _ref.apply(this, arguments);
	};
}();

var createWindowWithTabs = function () {
	var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(tabs, isIncognito) {
		var pinnedIndex, firstTab, t, i, firstPinned, w, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, oldTabId, oldTab, tabPinned, movedTabs, newTab;

		return regeneratorRuntime.wrap(function _callee2$(_context2) {
			while (1) {
				switch (_context2.prev = _context2.next) {
					case 0:
						pinnedIndex = 0;
						firstTab = tabs.shift();
						t = [];

						for (i = 0; i < tabs.length; i++) {
							t.push(tabs[i].id);
						}
						;

						firstPinned = firstTab.pinned;
						_context2.next = 8;
						return browser.windows.create({ tabId: firstTab.id, incognito: !!isIncognito });

					case 8:
						w = _context2.sent;

						if (!firstPinned) {
							_context2.next = 13;
							break;
						}

						_context2.next = 12;
						return browser.tabs.update(w.tabs[0].id, { pinned: firstPinned });

					case 12:
						pinnedIndex++;

					case 13:
						if (!(t.length > 0)) {
							_context2.next = 60;
							break;
						}

						i = 0;
						_iteratorNormalCompletion2 = true;
						_didIteratorError2 = false;
						_iteratorError2 = undefined;
						_context2.prev = 18;
						_iterator2 = t[Symbol.iterator]();

					case 20:
						if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
							_context2.next = 45;
							break;
						}

						oldTabId = _step2.value;

						i++;
						_context2.next = 25;
						return browser.tabs.get(oldTabId);

					case 25:
						oldTab = _context2.sent;
						tabPinned = oldTab.pinned;
						movedTabs = [];

						if (tabPinned) {
							_context2.next = 34;
							break;
						}

						_context2.next = 31;
						return browser.tabs.move(oldTabId, { windowId: w.id, index: -1 });

					case 31:
						movedTabs = _context2.sent;
						_context2.next = 37;
						break;

					case 34:
						_context2.next = 36;
						return browser.tabs.move(oldTabId, { windowId: w.id, index: pinnedIndex++ });

					case 36:
						movedTabs = _context2.sent;

					case 37:
						if (!(movedTabs.length > 0)) {
							_context2.next = 42;
							break;
						}

						newTab = movedTabs[0];

						if (!tabPinned) {
							_context2.next = 42;
							break;
						}

						_context2.next = 42;
						return browser.tabs.update(newTab.id, { pinned: tabPinned });

					case 42:
						_iteratorNormalCompletion2 = true;
						_context2.next = 20;
						break;

					case 45:
						_context2.next = 51;
						break;

					case 47:
						_context2.prev = 47;
						_context2.t0 = _context2["catch"](18);
						_didIteratorError2 = true;
						_iteratorError2 = _context2.t0;

					case 51:
						_context2.prev = 51;
						_context2.prev = 52;

						if (!_iteratorNormalCompletion2 && _iterator2.return) {
							_iterator2.return();
						}

					case 54:
						_context2.prev = 54;

						if (!_didIteratorError2) {
							_context2.next = 57;
							break;
						}

						throw _iteratorError2;

					case 57:
						return _context2.finish(54);

					case 58:
						return _context2.finish(51);

					case 59:
						;

					case 60:
						_context2.next = 62;
						return browser.windows.update(w.id, { focused: true });

					case 62:
					case "end":
						return _context2.stop();
				}
			}
		}, _callee2, this, [[18, 47, 51, 59], [52,, 54, 58]]);
	}));

	return function createWindowWithTabs(_x, _x2) {
		return _ref2.apply(this, arguments);
	};
}();

var createWindowWithSessionTabs = function () {
	var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(window, tabId) {
		var customName, color, whitelistWindow, whitelistTab, filteredWindow, newWindow, emptyTab, i, newTab, tabCreated;
		return regeneratorRuntime.wrap(function _callee3$(_context3) {
			while (1) {
				switch (_context3.prev = _context3.next) {
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

						_context3.next = 16;
						return browser.windows.create(filteredWindow).catch(function (error) {
							console.error(error);
							console.log(error);
							console.log(error.message);
						});

					case 16:
						newWindow = _context3.sent;
						emptyTab = newWindow.tabs[0].id;
						i = 0;

					case 19:
						if (!(i < window.tabs.length)) {
							_context3.next = 38;
							break;
						}

						newTab = Object.keys(window.tabs[i]).filter(function (key) {
							return whitelistTab.includes(key);
						}).reduce(function (obj, key) {
							obj[key] = window.tabs[i][key];
							return obj;
						}, {});

						if (!(tabId != null && tabId != newTab.index)) {
							_context3.next = 23;
							break;
						}

						return _context3.abrupt("continue", 35);

					case 23:
						newTab.windowId = newWindow.id;

						if (navigator.userAgent.search("Firefox") > -1) {
							if (!!newTab.url && newTab.url.search("about:") > -1) {
								console.log("filtered by about: url", newTab.url);
								newTab.url = "";
							}
						}
						_context3.prev = 25;
						_context3.next = 28;
						return browser.tabs.create(newTab).catch(function (error) {
							console.error(error);
							console.log(error);
							console.log(error.message);
						});

					case 28:
						tabCreated = _context3.sent;
						_context3.next = 35;
						break;

					case 31:
						_context3.prev = 31;
						_context3.t0 = _context3["catch"](25);

						console.log("couldn't restore tab");
						console.error(_context3.t0);

					case 35:
						i++;
						_context3.next = 19;
						break;

					case 38:
						_context3.next = 40;
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

						_context3.next = 44;
						return browser.windows.update(newWindow.id, { focused: true });

					case 44:
					case "end":
						return _context3.stop();
				}
			}
		}, _callee3, this, [[25, 31]]);
	}));

	return function createWindowWithSessionTabs(_x3, _x4) {
		return _ref3.apply(this, arguments);
	};
}();

var focusOnWindow = function () {
	var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(windowId) {
		return regeneratorRuntime.wrap(function _callee4$(_context4) {
			while (1) {
				switch (_context4.prev = _context4.next) {
					case 0:
						_context4.next = 2;
						return browser.windows.update(windowId, { focused: true });

					case 2:
					case "end":
						return _context4.stop();
				}
			}
		}, _callee4, this);
	}));

	return function focusOnWindow(_x5) {
		return _ref4.apply(this, arguments);
	};
}();

var hideWindows = function () {
	var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(windowId) {
		var hideWindows, result;
		return regeneratorRuntime.wrap(function _callee6$(_context6) {
			while (1) {
				switch (_context6.prev = _context6.next) {
					case 0:
						if (!(navigator.userAgent.search("Firefox") > -1)) {
							_context6.next = 2;
							break;
						}

						return _context6.abrupt("return");

					case 2:
						if (!(!windowId || windowId < 0)) {
							_context6.next = 6;
							break;
						}

						return _context6.abrupt("return");

					case 6:
						_context6.next = 8;
						return getLocalStorage("hideWindows", false);

					case 8:
						hideWindows = _context6.sent;

						if (hideWindows) {
							_context6.next = 11;
							break;
						}

						return _context6.abrupt("return");

					case 11:
						_context6.next = 13;
						return browser.permissions.contains({ permissions: ['system.display'] });

					case 13:
						result = _context6.sent;

						if (result) {
							chrome.system.display.getInfo(function () {
								var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(windowId, displaylayouts) {
									var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, displaylayout, windows, monitor, i, a, result;

									return regeneratorRuntime.wrap(function _callee5$(_context5) {
										while (1) {
											switch (_context5.prev = _context5.next) {
												case 0:
													globalDisplayInfo = [];
													_iteratorNormalCompletion = true;
													_didIteratorError = false;
													_iteratorError = undefined;
													_context5.prev = 4;

													for (_iterator = displaylayouts[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
														displaylayout = _step.value;

														globalDisplayInfo.push(displaylayout.bounds);
													}
													_context5.next = 12;
													break;

												case 8:
													_context5.prev = 8;
													_context5.t0 = _context5["catch"](4);

													_didIteratorError = true;
													_iteratorError = _context5.t0;

												case 12:
													_context5.prev = 12;
													_context5.prev = 13;

													if (!_iteratorNormalCompletion && _iterator.return) {
														_iterator.return();
													}

												case 15:
													_context5.prev = 15;

													if (!_didIteratorError) {
														_context5.next = 18;
														break;
													}

													throw _iteratorError;

												case 18:
													return _context5.finish(15);

												case 19:
													return _context5.finish(12);

												case 20:
													_context5.next = 22;
													return browser.windows.getAll({ populate: true });

												case 22:
													windows = _context5.sent;
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
													}
													;

													i = windows.length - 1;

												case 27:
													if (!(i >= 0)) {
														_context5.next = 35;
														break;
													}

													if (!(windows[i].id != windowId)) {
														_context5.next = 32;
														break;
													}

													if (!is_in_bounds(windows[i], globalDisplayInfo[monitor])) {
														_context5.next = 32;
														break;
													}

													_context5.next = 32;
													return browser.windows.update(windows[i].id, { "state": "minimized" });

												case 32:
													i--;
													_context5.next = 27;
													break;

												case 35:
													;

												case 36:
												case "end":
													return _context5.stop();
											}
										}
									}, _callee5, this, [[4, 8, 12, 20], [13,, 15, 19]]);
								}));

								return function (_x7, _x8) {
									return _ref6.apply(this, arguments);
								};
							}().bind(null, windowId));
						}

					case 15:
					case "end":
						return _context6.stop();
				}
			}
		}, _callee6, this);
	}));

	return function hideWindows(_x6) {
		return _ref5.apply(this, arguments);
	};
}();

var windowActive = function () {
	var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(windowId) {
		var windows, windowAge;
		return regeneratorRuntime.wrap(function _callee7$(_context7) {
			while (1) {
				switch (_context7.prev = _context7.next) {
					case 0:
						if (!(windowId < 0)) {
							_context7.next = 2;
							break;
						}

						return _context7.abrupt("return");

					case 2:
						windows = [];
						_context7.next = 5;
						return getLocalStorage("windowAge", []);

					case 5:
						windowAge = _context7.sent;

						if (windowAge instanceof Array) windows = windowAge;

						if (windows.indexOf(windowId) > -1) windows.splice(windows.indexOf(windowId), 1);
						windows.unshift(windowId);
						_context7.next = 11;
						return setLocalStorage("windowAge", windows);

					case 11:
					case "end":
						return _context7.stop();
				}
			}
		}, _callee7, this);
	}));

	return function windowActive(_x9) {
		return _ref7.apply(this, arguments);
	};
}();

var windowFocus = function () {
	var _ref8 = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(windowId) {
		return regeneratorRuntime.wrap(function _callee8$(_context8) {
			while (1) {
				switch (_context8.prev = _context8.next) {
					case 0:
						_context8.prev = 0;

						if (!windowId) {
							_context8.next = 6;
							break;
						}

						_context8.next = 4;
						return windowActive(windowId);

					case 4:
						_context8.next = 6;
						return hideWindows(windowId);

					case 6:
						_context8.next = 10;
						break;

					case 8:
						_context8.prev = 8;
						_context8.t0 = _context8["catch"](0);

					case 10:
					case "end":
						return _context8.stop();
				}
			}
		}, _callee8, this, [[0, 8]]);
	}));

	return function windowFocus(_x10) {
		return _ref8.apply(this, arguments);
	};
}();

var windowCreated = function () {
	var _ref9 = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(window) {
		return regeneratorRuntime.wrap(function _callee9$(_context9) {
			while (1) {
				switch (_context9.prev = _context9.next) {
					case 0:
						_context9.prev = 0;

						if (!(!!window && !!window.id)) {
							_context9.next = 4;
							break;
						}

						_context9.next = 4;
						return windowActive(window.id);

					case 4:
						_context9.next = 8;
						break;

					case 6:
						_context9.prev = 6;
						_context9.t0 = _context9["catch"](0);

					case 8:
						setTimeout(cleanupDebounce, 250);

					case 9:
					case "end":
						return _context9.stop();
				}
			}
		}, _callee9, this, [[0, 6]]);
	}));

	return function windowCreated(_x11) {
		return _ref9.apply(this, arguments);
	};
}();

var windowRemoved = function () {
	var _ref10 = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(windowId) {
		return regeneratorRuntime.wrap(function _callee10$(_context10) {
			while (1) {
				switch (_context10.prev = _context10.next) {
					case 0:
						_context10.prev = 0;

						if (!windowId) {
							_context10.next = 4;
							break;
						}

						_context10.next = 4;
						return windowActive(windowId);

					case 4:
						_context10.next = 8;
						break;

					case 6:
						_context10.prev = 6;
						_context10.t0 = _context10["catch"](0);

					case 8:
					case "end":
						return _context10.stop();
				}
			}
		}, _callee10, this, [[0, 6]]);
	}));

	return function windowRemoved(_x12) {
		return _ref10.apply(this, arguments);
	};
}();

var checkWindow = function () {
	var _ref11 = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(windowId) {
		var storage, names, colors, hashes, window, newHash;
		return regeneratorRuntime.wrap(function _callee11$(_context11) {
			while (1) {
				switch (_context11.prev = _context11.next) {
					case 0:
						if (windowId) {
							_context11.next = 2;
							break;
						}

						return _context11.abrupt("return");

					case 2:
						_context11.next = 4;
						return browser.storage.local.get(['windowNames', 'windowColors', 'windowHashes']);

					case 4:
						storage = _context11.sent;
						names = storage.windowNames || {};
						colors = storage.windowColors || {};
						hashes = storage.windowHashes || {};

						if (!(!names[windowId] && !colors[windowId])) {
							_context11.next = 10;
							break;
						}

						return _context11.abrupt("return");

					case 10:
						_context11.prev = 10;
						_context11.next = 13;
						return browser.windows.get(windowId, { populate: true });

					case 13:
						window = _context11.sent;
						newHash = hashcode(window);

						hashes[windowId] = newHash;
						_context11.next = 18;
						return setLocalStorage('windowHashes', hashes);

					case 18:
						_context11.next = 23;
						break;

					case 20:
						_context11.prev = 20;
						_context11.t0 = _context11["catch"](10);

						console.log(_context11.t0);

					case 23:
					case "end":
						return _context11.stop();
				}
			}
		}, _callee11, this, [[10, 20]]);
	}));

	return function checkWindow(_x13) {
		return _ref11.apply(this, arguments);
	};
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var browser = browser || chrome;

function focusOnWindowDelayed(windowId) {
	setTimeout(focusOnWindow.bind(this, windowId), 125);
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
//# sourceMappingURL=windows.js.map