import {RefObject} from "react";
import {FaviconTone} from "@helpers/favicon";

export interface ITabState {
	draggingOver: string,
	dragFavIcon: string,
	favIcon: string,
	iconTone: FaviconTone,
	favIconInverted: string,
	hovered: boolean
}