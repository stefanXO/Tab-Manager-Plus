import type {ShowMonitors} from "@helpers/monitors";
import type {Shortcut} from "@helpers/shortcuts";

export interface ITabOptionsState {
	// Firefox: whether the extension may run in private windows (unknown until read)
	incognitoAllowed? : boolean;
	// "Copy to clipboard" of the debug export was just done (shows "Copied" for a moment)
	debugCopied? : boolean;
	// why the debug export / copy just failed (shown under the buttons)
	debugError? : string;
	// why the last backup import failed (shown under the file picker)
	importError? : string;
	// Chrome: "Show all monitors" is on (setting not "off" and the optional
	// system.display permission granted), and the setting itself
	monitorAccess? : boolean;
	showMonitors? : ShowMonitors;
	// the extension's commands and their current keys (unknown until read)
	shortcuts? : Shortcut[];
}
