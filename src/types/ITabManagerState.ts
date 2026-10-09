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
	supportLinks: boolean,
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
	// the keyboard cursor: the open tab the arrow keys are on, or the one last
	// clicked (ringed, see css/components/tab.css .key-cursor), or 0. Not the
	// selection: Space selects it, Enter with nothing selected switches to it
	keyCursor: number,
	// the cursor's ring is drawn: an arrow key moved it (a click sets the cursor
	// and hides the ring, so the mouse alone never shows it)
	keyCursorShown: boolean,
	searchLen: number,
	query: SearchQuery | null,
	height: number,
	hasScrollBar: boolean,
	focusUpdates: number,
	topText: string,
	bottomText: string,
	optionsActive: boolean,
	// the search help card is held open by a click on its icon
	searchHelpOpen?: boolean,
	dupTabs: boolean,
	// "Highlight recently active tabs": 0 off, else its level (see popup/recent)
	recentLevel: number,
	dragFavicon: string,
	colorsActive: number,
	// id of the saved window the same overlay is open on ("" when closed)
	colorsSession: string,
	colorsAutoName: string,


	resetTimeout: number,

	dirty: boolean
}