import {ISavedSession} from "./ISavedSession";
import {Layout} from "../helpers/settings";
export interface IWindowOptions {
	// an open window (its id), or a saved window (windowId 0, session set)
	windowId: number,
	session?: ISavedSession,
	autoName: string,
	layout: Layout
}
