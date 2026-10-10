import {BootData} from "../popup/boot";

export interface ITabManager
{
	optionsActive: boolean,
	// settings and windows fetched before the first render (popup.tsx)
	boot?: BootData
}