import {ISavedSession} from "./ISavedSession";

export interface ITabOptions {
	animations: boolean,
	badge: boolean,
	compact: boolean,
	dark: boolean,
	hideWindows: boolean,
	openInOwnTab: boolean,
	sessionsFeature: boolean,
	tabHeight: number,
	tabLimit: number,
	tabWidth: number,
	tabactions: boolean,
	windowTitles: boolean,
	sessions: ISavedSession[]
}