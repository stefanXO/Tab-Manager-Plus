import * as browser from "webextension-polyfill";
import {DragEvent, MouseEvent} from "react";

export interface ITab {
	tab: browser.Tabs.Tab,
	window: browser.Windows.Window,
	selected: boolean,
	hidden: boolean,
	id: string,

	searchActive: boolean,
	layout: string,
	draggable: boolean,

	middleClick: (tabId: number) => void,

	hoverHandler: (tab: browser.Tabs.Tab) => void,
	parentUpdate?: () => void,
	select: (id: number) => void,
	selectTo?: (id: number) => void,
	drag?: (e: DragEvent<HTMLDivElement>, id: number) => void,
	drop?: (id: number, before: boolean) => void,
	dropWindow?: (windowId: number) => void,
	dragFavicon?: (icon?: string) => string
	click?: (e: MouseEvent<HTMLDivElement>, index: number) => void
}