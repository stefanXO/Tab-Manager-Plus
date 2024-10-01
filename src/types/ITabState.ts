import {RefObject} from "react";

export interface ITabState {
	draggingOver: string,
	dragFavIcon: string,
	favIcon: string,
	hovered: boolean,
	tabRef: RefObject<HTMLDivElement>
}