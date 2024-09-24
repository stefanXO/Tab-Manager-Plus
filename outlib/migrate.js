"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var browser = browser || chrome;

var stringkeys = ["layout"];

var jsonkeys = ["tabLimit", "tabWidth", "tabHeight", "windowAge", "windowNames", "windowColors"];

var boolkeys = ["openInOwnTab", "animations", "windowTitles", "compact", "dark", "tabactions", "badge", "sessionsFeature", "hideWindows", "filter-tabs"];

_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
	var hasLocalStorage, key, keyValue, values;
	return regeneratorRuntime.wrap(function _callee$(_context) {
		while (1) {
			switch (_context.prev = _context.next) {
				case 0:
					hasLocalStorage = false;


					for (key in stringkeys) {
						if (!!localStorage[key]) hasLocalStorage = true;
					}

					for (key in boolkeys) {
						if (!!localStorage[key]) hasLocalStorage = true;
					}

					for (key in jsonkeys) {
						if (!!localStorage[key]) hasLocalStorage = true;
					}

					if (!hasLocalStorage) {
						_context.next = 34;
						break;
					}

					keyValue = {};
					_context.next = 8;
					return browser.storage.local.get(null);

				case 8:
					values = _context.sent;

					values = values || {};
					_context.t0 = regeneratorRuntime.keys(values);

				case 11:
					if ((_context.t1 = _context.t0()).done) {
						_context.next = 21;
						break;
					}

					key = _context.t1.value;

					if (!values[key].tabs) {
						_context.next = 18;
						break;
					}

					_context.next = 16;
					return browser.storage.local.remove(key);

				case 16:
					_context.next = 19;
					break;

				case 18:
					delete values[key];

				case 19:
					_context.next = 11;
					break;

				case 21:
					keyValue = {};

					keyValue["sessions"] = values;
					_context.next = 25;
					return browser.storage.local.set(keyValue);

				case 25:
					keyValue = {};

					for (key in stringkeys) {
						if (!!localStorage[key]) keyValue[key] = localStorage[key];
					}

					for (key in boolkeys) {
						if (!!localStorage[key]) keyValue[key] = toBoolean(localStorage[key]);
					}

					for (key in jsonkeys) {
						if (!!localStorage[key]) keyValue[key] = JSON.parse(localStorage[key]);
					}

					_context.next = 31;
					return browser.storage.local.set(keyValue);

				case 31:
					for (key in stringkeys) {
						localStorage.removeItem(key);
					}for (key in boolkeys) {
						localStorage.removeItem(key);
					}for (key in jsonkeys) {
						localStorage.removeItem(key);
					}
				case 34:
				case "end":
					return _context.stop();
			}
		}
	}, _callee, this);
}))();

function toBoolean(str) {
	if (typeof str === "undefined" || str === null) {
		return false;
	} else if (typeof str === "string") {
		switch (str.toLowerCase()) {
			case "false":
			case "no":
			case "0":
			case "":
				return false;
			default:
				return true;
		}
	} else if (typeof str === "number") {
		return str !== 0;
	} else {
		return true;
	}
}