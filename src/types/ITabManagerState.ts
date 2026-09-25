import {Layout} from "../helpers/settings";
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
	dark: boolean,
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
	height: number,
	hasScrollBar: boolean,
	focusUpdates: number,
	topText: string,
	bottomText: string,
	lastDirection: string,
	optionsActive: boolean,
	dupTabs: boolean,
	dragFavicon: string,
	colorsActive: number,
	colorsAutoName: string,

	resetTimeout: number,

	dirty: boolean
}