"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var getLocalStorage = function () {
	var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(key) {
		var default_value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						return _context.abrupt("return", new Promise(function (resolve, reject) {
							browser.storage.local.get([key]).then(function (result) {
								if (result[key] === undefined) {
									resolve(default_value);
								} else {
									resolve(result[key]);
								}
							});
						}));

					case 1:
					case "end":
						return _context.stop();
				}
			}
		}, _callee, undefined);
	}));

	return function getLocalStorage(_x) {
		return _ref.apply(this, arguments);
	};
}();

var setLocalStorage = function () {
	var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(key, value) {
		var obj;
		return regeneratorRuntime.wrap(function _callee2$(_context2) {
			while (1) {
				switch (_context2.prev = _context2.next) {
					case 0:
						obj = {};

						obj[key] = value;
						return _context2.abrupt("return", browser.storage.local.set(obj));

					case 3:
					case "end":
						return _context2.stop();
				}
			}
		}, _callee2, undefined);
	}));

	return function setLocalStorage(_x3, _x4) {
		return _ref2.apply(this, arguments);
	};
}();

var removeLocalStorage = function () {
	var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(key) {
		return regeneratorRuntime.wrap(function _callee3$(_context3) {
			while (1) {
				switch (_context3.prev = _context3.next) {
					case 0:
						return _context3.abrupt("return", browser.storage.local.remove(key));

					case 1:
					case "end":
						return _context3.stop();
				}
			}
		}, _callee3, undefined);
	}));

	return function removeLocalStorage(_x5) {
		return _ref3.apply(this, arguments);
	};
}();
//# sourceMappingURL=local.js.map