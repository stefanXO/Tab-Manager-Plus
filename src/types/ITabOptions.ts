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
	tabCount: number,
	// closes the options (the header options button's function); absent on the standalone options page (options.html), which has no tabs to go back to
	onBack?: () => void
}