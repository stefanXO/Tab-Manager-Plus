"use strict";

import * as browser from 'webextension-polyfill';
import * as S from "@strings";
import {getLocalStorage, getLocalStorageMap} from "@helpers/storage";
import {readSettings, Settings} from "@helpers/settings";

// Everything the first render needs, fetched in parallel before the popup
// mounts, so the first frame already shows the final layout, theme and every
// window. Without this the popup painted an empty shell with default
// settings first and re-flowed when the real ones arrived.
export interface BootData {
	settings : Settings;
	windows : browser.Windows.Window[];
	windowAge : number[];
	lastActive : Map<number, number>;
}

export async function fetchBootData(version : string) : Promise<BootData> {
	const [settings, windows, windowAge, lastActive] = await Promise.all([
		readSettings(version),
		browser.windows.getAll({ populate: true }),
		getLocalStorage(S.windowAge, []) as Promise<number[]>,
		getLocalStorageMap<number, number>(S.windowLastActive)
	]);
	return { settings, windows, windowAge: windowAge instanceof Array ? windowAge : [], lastActive };
}
