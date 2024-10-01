"use strict";

import {openPopup, openAsOwnTab, openSidebar} from "@ui/open";
import * as S from "@strings";
import * as browser from 'webextension-polyfill';

export async function setupContextMenus() {
	await browser.contextMenus.removeAll();

	browser.contextMenus.create({
		id: S.open_in_own_tab,
		title: "📔 Open in own tab",
		contexts: ["action"]
	});

	if (!!browser.action.openPopup) {
		browser.contextMenus.create({
			id: S.open_popup,
			title: "📑 Open popup",
			contexts: ["action"]
		});
	}

	if (!!browser.sidebarAction) {
		browser.contextMenus.create({
			id: S.open_sidebar,
			title: "🗂 Open sidebar",
			contexts: ["action"]
		});
	}

	browser.contextMenus.create({
		id: S.sep1,
		type: "separator",
		contexts: ["action"]
	});

	browser.contextMenus.create({
		title: "😍 Support this extension",
		id: S.support_menu,
		"contexts": ["action"]
	});

	browser.contextMenus.create({
		id: S.review,
		title: "⭐ Leave a review",
		"contexts": ["action"],
		parentId: "support_menu"
	});

	browser.contextMenus.create({
		id: S.donate,
		title: "☕ Donate to keep Extensions Alive",
		"contexts": ["action"],
		parentId: "support_menu"
	});

	browser.contextMenus.create({
		id: S.patron,
		title: "💰 Become a Patron",
		"contexts": ["action"],
		parentId: "support_menu"
	});

	browser.contextMenus.create({
		id: S.twitter,
		title: "🐦 Follow on Twitter",
		"contexts": ["action"],
		parentId: "support_menu"
	});

	browser.contextMenus.create({
		title: "🤔 Issues and Suggestions",
		id: S.code_menu,
		"contexts": ["action"]
	});

	browser.contextMenus.create({
		id: S.changelog,
		title: "🆕 View recent changes",
		"contexts": ["action"],
		parentId: "code_menu"
	});

	browser.contextMenus.create({
		id: S.options,
		title: "⚙ Edit Options",
		"contexts": ["action"],
		parentId: "code_menu"
	});

	browser.contextMenus.create({
		id: S.source,
		title: "💻 View source code",
		"contexts": ["action"],
		parentId: "code_menu"
	});

	browser.contextMenus.create({
		id: S.report,
		title: "🤔 Report an issue",
		"contexts": ["action"],
		parentId: "code_menu"
	});

	browser.contextMenus.create({
		id: S.send,
		title: "💡 Send a suggestion",
		"contexts": ["action"],
		parentId: "code_menu"
	});

	browser.contextMenus.onClicked.removeListener(contextListeners);
	browser.contextMenus.onClicked.addListener(contextListeners);
}

async function contextListeners(info: browser.Menus.OnClickData, tab?: browser.Tabs.Tab)
{
	switch (info.menuItemId) {
		case S.open_in_own_tab:
			await openAsOwnTab();
			break;
		case S.open_popup:
			await openPopup();
			break;
		case S.open_sidebar:
			await openSidebar();
			break;
		case S.donate:
			await browser.tabs.create({url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW'});
			break;
		case S.patron:
			await browser.tabs.create({url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW'});
			break;
		case S.changelog:
			await browser.tabs.create({url: 'changelog.html'});
			break;
		case S.options:
			await browser.tabs.create({url: 'options.html'});
			break;
		case S.report:
			await browser.tabs.create({url: 'https://github.com/stefanXO/Tab-Manager-Plus/issues'});
			break;
		case S.source:
			await browser.tabs.create({url: 'https://github.com/stefanXO/Tab-Manager-Plus'});
			break;
		case S.twitter:
			await browser.tabs.create({url: 'https://www.twitter.com/mastef'});
			break;
		case S.send:
			await browser.tabs.create({url: 'https://github.com/stefanXO/Tab-Manager-Plus/issues'});
			await browser.tabs.create({url: 'mailto:markus+tmp@stefanxo.com'});
			break;
		case S.review:
			if (navigator.userAgent.search("Firefox") > -1) {
				await browser.tabs.create({url: 'https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/'});
			} else {
				await browser.tabs.create({url: 'https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff'});
			}
			break;

	}
}