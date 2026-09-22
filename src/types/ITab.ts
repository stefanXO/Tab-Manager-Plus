import * as browser from "webextension-polyfill";
import {ISavedSession} from "./ISavedSession";
import {TabManager, Window, Session} from "@views";

export interface ITab {
	tab: browser.Tabs.Tab,
	window?: browser.Windows.Window,
	session?: ISavedSession,
	selected: boolean,
	hidden: boolean,
	faded: boolean,
	id: string,

	searchActive: boolean,
	layout: string,
	draggable: boolean,

	manager: TabManager,
	parentWindow?: Window,
	parentSession?: Session,
}