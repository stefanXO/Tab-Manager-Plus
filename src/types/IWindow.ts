import {Layout} from "../helpers/settings";
import {SearchQuery} from "../popup/search";
import * as browser from "webextension-polyfill";

export interface IWindow {
	window?: browser.Windows.Window,
	windowTitles: boolean,
	// compact mode: the automatic name ends in "+ 3" instead of "& 3 more"
	compact?: boolean,
	tabs: browser.Tabs.Tab[],
	searchActive: boolean,
	// the search, for the matched parts of a title (bold in List view)
	query?: SearchQuery | null,
	layout: Layout,
	tabactions: boolean,
	sessionsFeature?: boolean,
	hiddenTabs: Set<number>,
	selection: Set<number>,
	filterTabs: boolean,
	lastOpenWindow: number,
	incognito: boolean,
	draggable: boolean,
	// position in the list, staggers the entrance animation
	order?: number,
	lastActive?: number
}