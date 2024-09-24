var browser = browser || chrome;

async function cleanUp() {
	var activewindows = await browser.windows.getAll({populate: true});
	var windowids = [];
	for (var w of activewindows) {
		windowids.push(w.id);
	}
	// console.log("window ids...", windowids);

	var windows = await getLocalStorage("windowAge", []);
	if (!(windows instanceof Array)) windows = [];

	// console.log("before", JSON.parse(JSON.stringify(windows)));
	for (var i = windows.length - 1; i >= 0; i--) {
		if (windowids.indexOf(windows[i]) < 0) {
			// console.log("did not find", windows[i], i);
			windows.splice(i, 1);
		}
	}
	;
	// console.log("after", JSON.parse(JSON.stringify(windows)));
	await setLocalStorage("windowAge", windows);

	var names = await getLocalStorage("windowNames", {});
	var colors = await getLocalStorage("windowColors", {});
	var tocheck = new Set();
	var exists = new Set();
	var to_refresh = [];

	// console.log("before", JSON.parse(JSON.stringify(names)));
	for (var id in names) {
		if (windowids.indexOf(parseInt(id)) < 0) {
			// console.log("did not find", id);
			tocheck.add(id);
		} else {
			exists.add(id);
		}
	}

	for (var id in colors) {
		if (windowids.indexOf(parseInt(id)) < 0) {
			// console.log("did not find", id);
			tocheck.add(id);
		} else {
			exists.add(id);
		}
	}

	if (tocheck.size > 0) {
		var hashes = await getLocalStorage("windowHashes", {});
		console.log(hashes);
		console.log(names);
		console.log(colors);

		// delete hashes with empty values
		for (var id in hashes) if (!hashes[id]) delete hashes[id];
		for (var id in colors) if (!colors[id]) delete colors[id];

		var found = false;

		for (var w of activewindows) {
			var windowhash = hashcode(w);
			for (var id in hashes) {
				if (!tocheck.has(id)) continue;
				if (exists.has(id)) continue;
				if (w.id == id) break;
				if (hashes[id] == windowhash) {
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
					tocheck.delete(id);
					break;
				}
			}
		}

		for (var id in tocheck) {
			console.log("did not find by hash", id);
			//delete colors[id];
			//delete names[id];
			//delete hashes[id];
		}

		if (found) {
			await setLocalStorage("windowNames", names);
			await setLocalStorage("windowColors", colors);
			await setLocalStorage("windowHashes", hashes);
			browser.runtime.sendMessage({
				command: "refresh_windows",
				window_ids: to_refresh
			});
		}

		console.log(tocheck)
		console.log(exists)
		console.log(hashes);
		console.log(names);
		console.log(colors);
	}
}