import { Tab } from "@views";
import * as React from "react";

export interface IWindowState {
	windowTitles: string[];
	name: string,
	auto_name: string,
	color: string,
	tabs: number,
	colorActive: boolean,
	hover: boolean,
	hidden: boolean,
	tabrefs: Map<number, React.RefObject<Tab>>,
}