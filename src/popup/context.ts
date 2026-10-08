import * as React from "react";
import * as browser from "webextension-polyfill";
import {ITabManagerState, ISavedSession} from "@types";
import {SessionEdit} from "./sessionEdit";
import type {TabDrag} from "./dragPayload";

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
	// a tab drag starts: its drag data, the tabs it takes (./dragPayload.ts)
	drag(e : React.DragEvent<HTMLDivElement>, id : number) : string;
	// dropped on an open tab / on an open window with no tab next to it;
	// `dragged`: what the drop event carries (null: none of this popup's tab
	// drags, or nothing readable)
	drop(id : number, before : boolean, dragged : TabDrag | null) : void;
	dropWindow(windowId : number, dragged : TabDrag | null) : void;
	dragFavicon(icon? : string) : string;
	// a drag ended, dropped or not
	dragEnd() : void;
	// a saved window card is being dragged (its id), or no longer (null)
	dragSession(id : string | null) : void;
	// whether dropping the dragged card before / after this saved window moves it
	sessionDropMoves(target : string, before : boolean) : boolean;
	// the dragged card dropped before / after this saved window: the new order is stored
	dropSession(target : string, before : boolean) : void;
	// whether dropping the dragged saved tabs before / after the saved tab with
	// this stored index (undefined: on the card, at its end) changes anything;
	// for dragged open tabs, whether copies of them can go there
	savedDropMoves(sessionId : string, index : number | undefined, before : boolean) : boolean;
	// the dragged saved tabs dropped there: moved, in one write; dragged open
	// tabs: copied there, and they stay open
	dropSaved(sessionId : string, index : number | undefined, before : boolean, dragged : TabDrag | null) : void;
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
	// add saved windows (a save, an import), listed first; every change to the
	// stored saved windows goes through the manager, one after the other.
	// Rejects when the browser refused the write.
	addSavedWindows(sessions : ISavedSession[]) : Promise<void>;
	// delete a saved window, with an Undo countdown before it leaves storage
	deleteSession(session : ISavedSession) : void;
	// An error notice (red edge and tint, closes by itself after a while or
	// with its close button): for what the user asked and did not happen, a
	// refused write or a failure. The text says what, e.g. refusedText() in
	// ./notices.ts.
	showError(text : string) : void;
	// a neutral notice of the same kind, for what an action did (an import)
	showInfo(text : string) : void;
	// closes every notice and writes what an Undo notice still holds (an
	// import starts: nothing may be pending under it)
	closeNotices() : void;
	// browser state changed (windows/tabs/sessions): refetch and re-render
	reload() : void;
	// only in-place mutated state (selection, hiddenTabs) changed: re-render without refetch
	rerender() : void;
}

export const ManagerContext = React.createContext<ITabManagerActions>(null!);
