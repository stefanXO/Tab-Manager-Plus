import {IWindow, ISavedSession} from "@types";

// a saved window is never the active or focused one, so it has no lastOpenWindow
export interface ISession extends Omit<IWindow, "lastOpenWindow"> {
	session: ISavedSession
}