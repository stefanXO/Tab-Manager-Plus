"use strict";

var cleanUp = function () {
	var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
		var activewindows, windowids, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, w, windows, i, names, colors, tocheck, exists, to_refresh, id, hashes, found, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, windowhash;

		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						_context.next = 2;
						return browser.windows.getAll({ populate: true });

					case 2:
						activewindows = _context.sent;
						windowids = [];
						_iteratorNormalCompletion = true;
						_didIteratorError = false;
						_iteratorError = undefined;
						_context.prev = 7;

						for (_iterator = activewindows[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							w = _step.value;

							windowids.push(w.id);
						}
						_context.next = 15;
						break;

					case 11:
						_context.prev = 11;
						_context.t0 = _context["catch"](7);
						_didIteratorError = true;
						_iteratorError = _context.t0;

					case 15:
						_context.prev = 15;
						_context.prev = 16;

						if (!_iteratorNormalCompletion && _iterator.return) {
							_iterator.return();
						}

					case 18:
						_context.prev = 18;

						if (!_didIteratorError) {
							_context.next = 21;
							break;
						}

						throw _iteratorError;

					case 21:
						return _context.finish(18);

					case 22:
						return _context.finish(15);

					case 23:
						_context.next = 25;
						return getLocalStorage("windowAge", []);

					case 25:
						windows = _context.sent;

						if (!(windows instanceof Array)) windows = [];

						for (i = windows.length - 1; i >= 0; i--) {
							if (windowids.indexOf(windows[i]) < 0) {
								windows.splice(i, 1);
							}
						}
						;
						_context.next = 31;
						return setLocalStorage("windowAge", windows);

					case 31:
						_context.next = 33;
						return getLocalStorage("windowNames", {});

					case 33:
						names = _context.sent;
						_context.next = 36;
						return getLocalStorage("windowColors", {});

					case 36:
						colors = _context.sent;
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
							_context.next = 112;
							break;
						}

						_context.next = 45;
						return getLocalStorage("windowHashes", {});

					case 45:
						hashes = _context.sent;

						console.log(hashes);
						console.log(names);
						console.log(colors);

						for (id in hashes) {
							if (!hashes[id]) delete hashes[id];
						}for (id in colors) {
							if (!colors[id]) delete colors[id];
						}found = false;
						_iteratorNormalCompletion2 = true;
						_didIteratorError2 = false;
						_iteratorError2 = undefined;
						_context.prev = 55;
						_iterator2 = activewindows[Symbol.iterator]();

					case 57:
						if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
							_context.next = 84;
							break;
						}

						w = _step2.value;
						windowhash = hashcode(w);
						_context.t1 = regeneratorRuntime.keys(hashes);

					case 61:
						if ((_context.t2 = _context.t1()).done) {
							_context.next = 81;
							break;
						}

						id = _context.t2.value;

						if (tocheck.has(id)) {
							_context.next = 65;
							break;
						}

						return _context.abrupt("continue", 61);

					case 65:
						if (!exists.has(id)) {
							_context.next = 67;
							break;
						}

						return _context.abrupt("continue", 61);

					case 67:
						if (!(w.id == id)) {
							_context.next = 69;
							break;
						}

						return _context.abrupt("break", 81);

					case 69:
						if (!(hashes[id] == windowhash)) {
							_context.next = 79;
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
						return _context.abrupt("break", 81);

					case 79:
						_context.next = 61;
						break;

					case 81:
						_iteratorNormalCompletion2 = true;
						_context.next = 57;
						break;

					case 84:
						_context.next = 90;
						break;

					case 86:
						_context.prev = 86;
						_context.t3 = _context["catch"](55);
						_didIteratorError2 = true;
						_iteratorError2 = _context.t3;

					case 90:
						_context.prev = 90;
						_context.prev = 91;

						if (!_iteratorNormalCompletion2 && _iterator2.return) {
							_iterator2.return();
						}

					case 93:
						_context.prev = 93;

						if (!_didIteratorError2) {
							_context.next = 96;
							break;
						}

						throw _iteratorError2;

					case 96:
						return _context.finish(93);

					case 97:
						return _context.finish(90);

					case 98:

						for (id in tocheck) {
							console.log("did not find by hash", id);
						}

						if (!found) {
							_context.next = 107;
							break;
						}

						_context.next = 102;
						return setLocalStorage("windowNames", names);

					case 102:
						_context.next = 104;
						return setLocalStorage("windowColors", colors);

					case 104:
						_context.next = 106;
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
					case "end":
						return _context.stop();
				}
			}
		}, _callee, this, [[7, 11, 15, 23], [16,, 18, 22], [55, 86, 90, 98], [91,, 93, 97]]);
	}));

	return function cleanUp() {
		return _ref.apply(this, arguments);
	};
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var browser = browser || chrome;
//# sourceMappingURL=tracking.js.map