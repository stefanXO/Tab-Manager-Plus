"use strict";var loadApp = function () {var _ref = _asyncToGenerator(regeneratorRuntime.mark(

























	function _callee() {var height, width, root;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:if (
						!window.loaded) {_context.next = 2;break;}return _context.abrupt("return");case 2:if (!
						window.inPopup) {_context.next = 14;break;}_context.next = 5;return (
							getLocalStorage("tabHeight", 0));case 5:height = _context.sent;_context.next = 8;return (
							getLocalStorage("tabWidth", 0));case 8:width = _context.sent;
						if (height > 0 && width > 0) {
							document.body.style.width = width + "px";
							document.body.style.height = height + "px";
						}

						root = document.getElementById("root");
						if (root != null) {
							height = document.body.style.height.split("px")[0];
							height = parseInt(height) || 0;
							if (height < 300) {
								height = 400;
								document.body.style.minHeight = height + "px";
							} else {
								height++;
								if (height > 600) height = 600;
								document.body.style.minHeight = height + "px";
							}
						}_context.next = 23;break;case 14:

						if (window.inPanel) {
							document.documentElement.style.maxHeight = "auto";
							document.documentElement.style.maxWidth = "auto";
							document.body.style.maxHeight = "auto";
							document.body.style.maxWidth = "auto";
						}
						document.documentElement.style.maxHeight = "100%";
						document.documentElement.style.maxWidth = "100%";
						document.documentElement.style.height = "100%";
						document.documentElement.style.width = "100%";
						document.body.style.maxHeight = "100%";
						document.body.style.maxWidth = "100%";
						document.body.style.height = "100%";
						document.body.style.width = "100%";case 23:if (


						!window.loaded) {_context.next = 25;break;}return _context.abrupt("return");case 25:
						window.loaded = true;
						ReactDOM.render(React.createElement(TabManager, { optionsActive: !!window.optionPage }), document.getElementById("TMP"));case 27:case "end":return _context.stop();}}}, _callee, this);}));return function loadApp() {return _ref.apply(this, arguments);};}();function _asyncToGenerator(fn) {return function () {var gen = fn.apply(this, arguments);return new Promise(function (resolve, reject) {function step(key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {return Promise.resolve(value).then(function (value) {step("next", value);}, function (err) {step("throw", err);});}}return step("next");});};}window.loaded = false;if (window.location.search.indexOf("?popup") > -1) {window.inPopup = true;} else {window.inPopup = false;}if (window.location.search.indexOf("?panel") > -1) {window.inPanel = true;} else {window.inPanel = false;}window.onload = function () {window.requestAnimationFrame(loadApp);};setTimeout(loadApp, 75);setTimeout(loadApp, 125);setTimeout(loadApp, 250);setTimeout(loadApp, 375);setTimeout(loadApp, 700);setTimeout(loadApp, 1000);setTimeout(loadApp, 2000);setTimeout(loadApp, 3000);setTimeout(loadApp, 5000);setTimeout(loadApp, 15000);


window.addEventListener("contextmenu", function (e) {e.preventDefault();});