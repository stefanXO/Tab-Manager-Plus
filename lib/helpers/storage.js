var browser = browser || chrome;

export async function getLocalStorage(key, default_value = null){
	return new Promise((resolve, reject) => {
		browser.storage.local.get([key]).then(result => {
			if (result[key] === undefined) {
				resolve(default_value);
			} else {
				resolve(result[key]);
			}
		});
	});
};

export async function setLocalStorage(key, value){
	var obj = {};
	obj[key] = value;
	return browser.storage.local.set(obj);
};

export async function removeLocalStorage(key){
	return browser.storage.local.remove(key);
};