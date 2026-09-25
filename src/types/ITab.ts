import {Layout} from "../helpers/settings";
import * as browser from "webextension-polyfill";
import {ISavedSession} from "./ISavedSession";
import {MouseEvent} from "react";

export interface ITab {
	tab: browser.Tabs.Tab,
	window?: browser.Windows.Window,
	session?: ISavedSession,
	selected: boolean,
	hidden: boolean,
	faded: boolean,
	id: string,

	searchActive: boolean,
	layout: Layout,
	draggable: boolean,

	tabs?: browser.Tabs.Tab[],
	onOpen?: (e : MouseEvent<HTMLDivElement>, index : number) => void,
	onDragChange?: () => void
}