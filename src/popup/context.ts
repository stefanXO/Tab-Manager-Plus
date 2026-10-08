import * as React from "react";
import * as browser from "webextension-polyfill";
import {ITabManagerState, ISavedSession} from "@types";
import {SessionEdit} from "./sessionEdit";

// Settings that live in TabManager state and can be changed from the options screen
export type ISettings = Pick<ITabManagerState,
	"layout" | "animations" | "windowTitles" | "tabLimit" | "openInOwnTab" |
	"tabWidth" | "tabHeight" | "compact" | "theme" | "tabactions" | "badge" |
	"hideWindows" | "sessionsFeature" | "filterTabs" | "supportLinks">;

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
	// a drag ended, dropped or not
	dragEnd() : void;
	hoverIcon(text : string) : void;
	openWindowOptions(windowId : number, autoName : string) : void;
	// the same screen on a saved window
	openSessionOptions(id : string, autoName : string) : void;
	// rename / recolour a saved window (written to storage at once)
	editSession(id : string, edit : SessionEdit) : Promise<void>;
	closeWindowOptions() : void;
	scrollTo(what : string, id : string) : void;
	setSetting<K extends keyof ISettings>(key : K, value : ISettings[K]) : void;
	setBottomText(text : string) : void;
	sessionSync() : Promise<void>;
	// delete a saved window, with an Undo countdown before it leaves storage
	deleteSession(session : ISavedSession) : void;
	// browser state changed (windows/tabs/sessions): refetch and re-render
	reload() : void;
	// only in-place mutated state (selection, hiddenTabs) changed: re-render without refetch
	rerender() : void;
}

export const ManagerContext = React.createContext<ITabManagerActions>(null!);
