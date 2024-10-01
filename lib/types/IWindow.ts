import * as browser from "webextension-polyfill";
import {MouseEvent} from "react";
import * as React from "react";

export interface IWindow {
	window?: browser.Windows.Window,
	windowTitles: boolean,
	tabs: browser.Tabs.Tab[],
	searchActive: boolean,
	layout: string,
	tabactions: boolean,
	sessionsFeature?: boolean,
	hoverIcon: (e: MouseEvent<HTMLDivElement> | string) => void,
	hiddenTabs: Set<number>,
	selection: Set<number>,
	filterTabs: boolean,
	lastOpenWindow: number,
	incognito: boolean,
	draggable: boolean,

	hoverHandler: (tab: browser.Tabs.Tab) => void,
	scrollTo: (what: string, id: number) => void,
	parentUpdate: () => void,
	toggleColors: (active: boolean, windowId: number) => void,
	tabMiddleClick: (tabId: number) => void,
	select: (id: number) => void,
	selectTo?: (id: number, tabs: browser.Tabs.Tab[]) => void,
	drag?: (e: React.DragEvent<HTMLDivElement>, id: number) => void,
	drop?: (id: number, before: boolean) => void,
	dropWindow?: (windowId: number) => void,
	dragFavicon?: (icon: string) => string
}