import {IWindow, ISavedSession} from "@types";

export interface ISession extends IWindow {
	session: ISavedSession
}