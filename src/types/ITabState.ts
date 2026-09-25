import {RefObject} from "react";
import {FaviconTone} from "@helpers/favicon";

export interface ITabState {
	draggingOver: string,
	dragFavIcon: string,
	favIcon: string,
	iconTone: FaviconTone,
	hovered: boolean,
	// carries the entrance animation for the first moment after mount; a
	// tile shown again after being hidden by the search must not replay it
	entering: boolean
}