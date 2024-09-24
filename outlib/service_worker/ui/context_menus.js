"use strict";

var setupContextMenus = function () {
	var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						_context.next = 2;
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

					case 18:
					case "end":
						return _context.stop();
				}
			}
		}, _callee, this);
	}));

	return function setupContextMenus() {
		return _ref.apply(this, arguments);
	};
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var browser = browser || chrome;
//# sourceMappingURL=context_menus.js.map