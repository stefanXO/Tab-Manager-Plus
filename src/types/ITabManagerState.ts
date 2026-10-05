import {Layout} from "../helpers/settings";
import {Theme} from "../helpers/theme";
import {SearchQuery} from "../popup/search";
﻿import * as browser from "webextension-polyfill";
import { ISavedSession} from "@types";
import { Window } from "@views";
import * as React from "react";

export interface ITabManagerState {
	tabCount: number,
	hiddenCount: number,

	animations: boolean,
	badge: boolean,
	compact: boolean,
	theme: Theme,
	filterTabs: boolean,
	hideWindows: boolean,
	lastOpenWindow: number,
	layout: Layout,
	openInOwnTab: boolean,
	sessionsFeature: boolean,
	tabHeight: number,
	tabLimit: number,
	tabWidth: number,
	tabactions: boolean,
	windowTitles: boolean,

	windows: browser.Windows.Window[],
	lastActive: Map<number, number>,
	sessions: ISavedSession[],
	selection: Set<number>,
	hiddenTabs: Set<number>,
	tabsbyid: Map<number, browser.Tabs.Tab>,
	windowsbyid: Map<number, browser.Windows.Window>,
	windowrefs: Map<number, React.RefObject<Window>>,

	lastSelect: number,
	searchLen: number,
	query: SearchQuery | null,
	height: number,
	hasScrollBar: boolean,
	focusUpdates: number,
	topText: string,
	bottomText: string,
	lastDirection: string,
	optionsActive: boolean,
	dupTabs: boolean,
	// "Highlight recently active tabs": 0 off, else its level (see popup/recent)
	recentLevel: number,
	dragFavicon: string,
	colorsActive: number,
	colorsAutoName: string,


	resetTimeout: number,

	dirty: boolean
}