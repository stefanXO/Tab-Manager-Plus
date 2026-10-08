import * as browser from "webextension-polyfill";

export interface ISavedSession {
	tabs: browser.Tabs.Tab[],
	windowsInfo: browser.Windows.Window,
	name: string,
	color: string,
	date: number,
	sessionStartTime: number,
	id: string,
	customName: boolean,
	incognito: boolean,
	// where it is listed among the saved windows, lowest first; saved windows
	// without one come after (src/popup/sessionOrder.ts)
	order?: number
}