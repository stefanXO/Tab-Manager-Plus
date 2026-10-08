import {Layout} from "../helpers/settings";
import {SearchQuery} from "../popup/search";
import * as browser from "webextension-polyfill";
import {ISavedSession} from "./ISavedSession";
import {MouseEvent} from "react";

export interface ITab {
	tab: browser.Tabs.Tab,
	window?: browser.Windows.Window,
	session?: ISavedSession,
	selected: boolean,
	// the arrow keys are on this tab
	keyCursor?: boolean,
	hidden: boolean,
	faded: boolean,
	id: string,

	searchActive: boolean,
	// the search, for the matched parts of a title (bold in List view)
	query?: SearchQuery | null,
	layout: Layout,
	draggable: boolean,

	tabs?: browser.Tabs.Tab[],
	onOpen?: (e : MouseEvent<HTMLDivElement>, index : number) => void | Promise<void>,
	onDragChange?: () => void
}