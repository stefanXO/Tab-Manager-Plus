import browser from "webextension-polyfill"


export async function getItem(name: string) {
	return (await browser.storage.local.get(name))[name];
}
export function setItem(name: string, value: unknown) {
	return browser.storage.local.set({ [name]: value });
}
