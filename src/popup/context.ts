import * as React from "react";
import * as browser from "webextension-polyfill";
import {ITabManagerState} from "@types";

// Settings that live in TabManager state and can be changed from the options screen
export type ISettings = Pick<ITabManagerState,
	"layout" | "animations" | "windowTitles" | "tabLimit" | "openInOwnTab" |
	"tabWidth" | "tabHeight" | "compact" | "dark" | "tabactions" | "badge" |
	"hideWindows" | "sessionsFeature" | "filterTabs">;

// What child views may ask the TabManager to do. Children get this through
// ManagerContext instead of a reference to the component instance, so they
// cannot reach into its state or call setState on it.
export interface ITabManagerActions {
	select(id : number) : void;
	selectTo(id : number, tabs : browser.Tabs.Tab[]) : void;
	deleteTab(id : number) : void;
	drag(e : React.DragEvent<HTMLDivElement>, id : number) : void;
	drop(id : number, before : boolean) : void;
	dropWindow(windowId : number) : void;
	dragFavicon(icon? : string) : string;
	hoverIcon(e : React.MouseEvent<HTMLDivElement> | string) : void;
	hoverHandler(tab : browser.Tabs.Tab) : void;
	toggleColors(active : boolean, windowId : number) : void;
	scrollTo(what : string, id : string) : void;
	setSetting<K extends keyof ISettings>(key : K, value : ISettings[K]) : void;
	setBottomText(text : string) : void;
	sessionSync() : Promise<void>;
	// browser state changed (windows/tabs/sessions): refetch and re-render
	reload() : void;
	// only in-place mutated state (selection, hiddenTabs) changed: re-render without refetch
	rerender() : void;
}

export const ManagerContext = React.createContext<ITabManagerActions>(null!);
