import {IWindow, ISavedSession} from "@types";

// a saved window is never the active or focused one, so it has no
// lastOpenWindow; its card is always draggable (to reorder it) and its tabs
// drag themselves, so it takes no draggable either
export interface ISession extends Omit<IWindow, "lastOpenWindow" | "draggable"> {
	session: ISavedSession
}