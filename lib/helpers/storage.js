var browser = browser || chrome;

const getLocalStorage = async (key, default_value = null) => {
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

const setLocalStorage = async (key, value) => {
	var obj = {};
	obj[key] = value;
	return browser.storage.local.set(obj);
};

const removeLocalStorage = async (key) => {
	return browser.storage.local.remove(key);
};