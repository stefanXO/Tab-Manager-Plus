import * as browser from 'webextension-polyfill';

export async function getLocalStorage(key, default_value = null){
	const result = await browser.storage.local.get([key]);
	return result[key] === undefined ? default_value : result[key];
}

export async function getLocalStorageMap<T extends number, V>(key: string): Promise<Map<T, V>>{
	const result = await browser.storage.local.get([key]);
	if (result[key] === undefined) {
		return new Map<T, V>();
	}
	let newMap = new Map<T, V>();
	let obj: Object = result[key];
	for (const [k, v] of Object.entries(obj)) {
		let key = parseInt(k);
		newMap.set(key as T, v as V);
	}
	return newMap;
}

export async function getLocalStorageStringMap<T, V>(key : string) : Promise<Map<T, V>> {
	const result = await browser.storage.local.get([key]);
	if (result[key] === undefined) {
		return new Map<T, V>();
	}
	let newMap = new Map<T, V>();
	let obj : Object = result[key];
	for (const [k, v] of Object.entries(obj)) {
		newMap.set(k as T, v as V);
	}
	return newMap;
}

export async function setLocalStorage(key : string, value){
	const obj = {};
	obj[key] = value;
	return browser.storage.local.set(obj);
}

export async function setLocalStorageMap<T, V>(key : string, value : Map<T,V>) {
	const obj = {};
	obj[key] = Object.fromEntries(value);
	return browser.storage.local.set(obj);
}

export async function removeLocalStorage(key){
	return browser.storage.local.remove(key);
}