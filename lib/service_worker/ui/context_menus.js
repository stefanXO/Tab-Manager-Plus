var browser = browser || chrome;

async function setupContextMenus() {
	await browser.contextMenus.removeAll();
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

	browser.contextMenus.onClicked.addListener(
		function (info, tab) {
			if (info.menuItemId == "open_in_own_tab") openAsOwnTab();
			if (info.menuItemId == "open_popup") openPopup();
			if (info.menuItemId == "open_sidebar") openSidebar();

			if (info.menuItemId == "donate") browser.tabs.create({url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW'});
			if (info.menuItemId == "patron") browser.tabs.create({url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW'});
			if (info.menuItemId == "changelog") browser.tabs.create({url: 'changelog.html'});
			if (info.menuItemId == "options") browser.tabs.create({url: 'options.html'});
			if (info.menuItemId == "report") browser.tabs.create({url: 'https://github.com/stefanXO/Tab-Manager-Plus/issues'});

			if (info.menuItemId == "source") browser.tabs.create({url: 'https://github.com/stefanXO/Tab-Manager-Plus'});

			if (info.menuItemId == "twitter") browser.tabs.create({url: 'https://www.twitter.com/mastef'});

			if (info.menuItemId == "send") {
				browser.tabs.create({url: 'https://github.com/stefanXO/Tab-Manager-Plus/issues'});
				browser.tabs.create({url: 'mailto:markus+tmp@stefanxo.com'});
			}

			if (info.menuItemId == "review") {
				if (navigator.userAgent.search("Firefox") > -1) {
					browser.tabs.create({url: 'https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/'});
				} else {
					browser.tabs.create({url: 'https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff'});
				}
			}
		}
	);
}