import {ISavedSession} from "@types";
import * as browser from "webextension-polyfill";
import {ISavedTabOpen} from "../helpers/openTabs";

export interface ICommand
{
	command: string,
	window_ids?: number[],
	window_id?: number,
	tab_id?: number,
	// where in the window (open_saved_tabs; none: at the end)
	index?: number,
	// the display the popup is on (screen.avail*), for placing a restored window
	screen?: IScreenBounds,
	// the displays the popup predicts a restore with (popup/restoreDisplays.ts)
	displays?: IScreenBounds[],
	color?: string,
	name?: string,
	session?: ISavedSession,
	tab?: browser.Tabs.Tab,
	saved_tab?: browser.Tabs.OnActivatedActiveInfoType,
	tabs?: browser.Tabs.Tab[],
	// saved tabs to open in an open window (../helpers/openTabs.ts)
	saved_tabs?: ISavedTabOpen[],
	incognito?: boolean
}

export interface IScreenBounds {
	left: number,
	top: number,
	width: number,
	height: number
}
