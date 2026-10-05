import type {ShowMonitors} from "@helpers/monitors";

export interface ITabOptionsState {
	// Firefox: whether the extension may run in private windows (unknown until read)
	incognitoAllowed? : boolean;
	// Chrome: "Show all monitors" is on (setting not "off" and the optional
	// system.display permission granted), and the setting itself
	monitorAccess? : boolean;
	showMonitors? : ShowMonitors;
}