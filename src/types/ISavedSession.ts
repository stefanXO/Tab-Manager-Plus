import * as browser from "webextension-polyfill";

export interface ISavedSession {
	tabs: browser.Tabs.Tab[],
	windowsInfo: browser.Windows.Window,
	name: string,
	color: string,
	// when it was saved
	date: number,
	// when its tabs last changed (moved in, out or within it, added, deleted;
	// not a new name or colour); restoring ignores it (src/popup/savedUpdated.ts)
	updated?: number,
	sessionStartTime: number,
	id: string,
	customName: boolean,
	incognito: boolean,
	// where it is listed among the saved windows, lowest first; saved windows
	// without one come after, newest first (src/popup/sessionOrder.ts)
	order?: number
}