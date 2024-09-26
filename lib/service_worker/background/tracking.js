var browser = browser || chrome;

async function cleanUp() {
	var activewindows = await browser.windows.getAll({populate: true});
	var windowids = [];
	for (let _w of activewindows) {
		windowids.push(_w.id);
	}
	// console.log("window ids...", windowids);

	var windows = await getLocalStorage("windowAge", []);
	if (!(windows instanceof Array)) windows = [];

	// console.log("before", JSON.parse(JSON.stringify(windows)));
	for (let i = windows.length - 1; i >= 0; i--) {
		if (windowids.indexOf(windows[i]) < 0) {
			// console.log("did not find", windows[i], i);
			windows.splice(i, 1);
		}
	}

	// console.log("after", JSON.parse(JSON.stringify(windows)));
	await setLocalStorage("windowAge", windows);

	var names = await getLocalStorage("windowNames", {});
	var colors = await getLocalStorage("windowColors", {});
	var to_check = new Set();
	var exists = new Set();
	var to_refresh = [];

	// console.log("before", JSON.parse(JSON.stringify(names)));
	for (let n_id in names) {
		if (windowids.indexOf(parseInt(n_id)) < 0) {
			// console.log("did not find", n_id);
			to_check.add(n_id);
		} else {
			exists.add(n_id);
		}
	}

	for (let c_id in colors) {
		if (windowids.indexOf(parseInt(c_id)) < 0) {
			// console.log("did not find", c_id);
			to_check.add(c_id);
		} else {
			exists.add(c_id);
		}
	}

	if (to_check.size > 0) {
		var hashes = await getLocalStorage("windowHashes", {});
		console.log(hashes);
		console.log(names);
		console.log(colors);

		// delete hashes with empty values
		for (let _h_id in hashes) if (!hashes[_h_id]) delete hashes[_h_id];
		for (let _c_id in colors) if (!colors[_c_id]) delete colors[_c_id];

		var found = false;

		for (let w of activewindows) {
			var windowhash = hashcode(w);
			for (let id in hashes) {
				if (!to_check.has(id)) continue;
				if (exists.has(id)) continue;
				if (w.id === id) break;
				if (hashes[id] === windowhash) {
					console.log("found by hash, old id " + id + " new id " + w.id);
					to_refresh.push(w.id);
					if (!!names[id]) {
						names[w.id] = names[id];
						delete names[id];
					}
					if (!!colors[id]) {
						colors[w.id] = colors[id];
						delete colors[id];
					}
					hashes[w.id] = names[id];
					delete hashes[id];
					found = true;
					to_check.delete(id);
					break;
				}
			}
		}

		var save = false;
		if (remove_old) {
			for (let _id in to_check) {
				delete colors[_id];
				delete names[_id];
				delete hashes[_id];
				save = true;
			}
		}

		if (found || save) {
			await setLocalStorage("windowNames", names);
			await setLocalStorage("windowColors", colors);
			await setLocalStorage("windowHashes", hashes);
			if (found) {
				browser.runtime.sendMessage({
					command: "refresh_windows",
					window_ids: to_refresh
				});
			}
		}

		console.log(to_check)
		console.log(exists)
		console.log(hashes);
		console.log(names);
		console.log(colors);
	}
}