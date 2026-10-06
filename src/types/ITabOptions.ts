import {ISavedSession} from "./ISavedSession";
import {Theme} from "../helpers/theme";

export interface ITabOptions {
	animations: boolean,
	badge: boolean,
	compact: boolean,
	theme: Theme,
	hideWindows: boolean,
	openInOwnTab: boolean,
	sessionsFeature: boolean,
	supportLinks: boolean,
	tabHeight: number,
	tabLimit: number,
	tabWidth: number,
	tabactions: boolean,
	windowTitles: boolean,
	sessions: ISavedSession[],
	// the open windows and tabs, for the debug export's note
	windowCount: number,
	tabCount: number
}