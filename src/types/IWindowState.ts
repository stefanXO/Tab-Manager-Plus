import { Tab } from "@views";
import * as React from "react";

export interface IWindowState {
	name: string,
	auto_name: string,
	color: string,
	tabsKey: string,
	hover: boolean,
	hidden: boolean,
	tabrefs: Map<number, React.RefObject<Tab>>,
}