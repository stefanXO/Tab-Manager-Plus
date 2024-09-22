const getLocalStorage = async (key) => {
	return new Promise((resolve, reject) => {
		browser.storage.local.get([key]).then(result => {
			if (result[key] === undefined) {
				var abc;
				resolve(abc);
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