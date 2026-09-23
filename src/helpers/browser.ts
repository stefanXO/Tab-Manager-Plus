import * as browser from "webextension-polyfill";

function detectFirefox() : boolean {
	try {
		return browser.runtime.getURL("").startsWith("moz-extension://");
	} catch {
		return navigator.userAgent.indexOf("Firefox") > -1;
	}
}

export const IS_FIREFOX : boolean = detectFirefox();
