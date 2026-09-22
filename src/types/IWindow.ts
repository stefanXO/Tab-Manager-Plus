import * as browser from "webextension-polyfill";
import {TabManager} from "@views";

export interface IWindow {
	window?: browser.Windows.Window,
	windowTitles: boolean,
	tabs: browser.Tabs.Tab[],
	searchActive: boolean,
	layout: string,
	tabactions: boolean,
	sessionsFeature?: boolean,
	hiddenTabs: Set<number>,
	selection: Set<number>,
	filterTabs: boolean,
	lastOpenWindow: number,
	incognito: boolean,
	draggable: boolean,

	manager: TabManager
}