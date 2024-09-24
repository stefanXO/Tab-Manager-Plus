var browser = browser || chrome;

function handleMessages(request, sender, sendResponse) {
	switch (request.command) {
		case "reload_popup_controls":
			setupPopup();
			break;
		case "update_tab_count":
			updateTabCount();
			break;
		case "discard_tabs":
			discardTabs(request.tabs);
			break;
		case "move_tabs_to_window":
			moveTabsToWindow(request.window_id, request.tabs);
			break;
		case "focus_on_tab_and_window":
			focusOnTabAndWindow(request.tab);
			break;
		case "focus_on_tab_and_window_delayed":
			focusOnTabAndWindowDelayed(request.tab);
			break;
		case "focus_on_window":
			focusOnWindow(request.window_id);
			break;
		case "focus_on_window_delayed":
			focusOnWindowDelayed(request.window_id);
			break;
		case "set_window_color":
			setWindowColor(request.window_id, request.color);
			break;
		case "set_window_name":
			setWindowName(request.window_id, request.name);
			break;
		case "create_window_with_tabs":
			createWindowWithTabs(request.tabs);
			break;
		case "create_window_with_session_tabs":
			createWindowWithSessionTabs(request.window, request.tab_id);
			break;
		case "close_tabs":
			closeTabs(request.tabs);
			break;
	}
}

function handleCommands(command) {
	if (command == "switch_to_previous_active_tab") {
		if (!!globalTabsActive && globalTabsActive.length > 1) {
			focusOnTabAndWindow(globalTabsActive[globalTabsActive.length - 2]);
		}
	}
}

async function setWindowColor(windowId, color) {
	var colors = await getLocalStorage("windowColors", {});
	if (typeof colors !== 'object') colors = {};
	colors[windowId] = color;
	await setLocalStorage("windowColors", colors);
	await updateWindowHash(windowId);
	browser.runtime.sendMessage({
		command: "refresh_windows",
		window_ids: [windowId]
	});
}

async function setWindowName(windowId, name) {
	var names = await getLocalStorage("windowNames", {});
	if (typeof names !== 'object') names = {};
	names[windowId] = name;
	await setLocalStorage("windowNames", names);
	await updateWindowHash(windowId);
	browser.runtime.sendMessage({
		command: "refresh_windows",
		window_ids: [windowId]
	});
}

async function updateWindowHash(windowId) {
	var window = await browser.windows.get(windowId, {populate: true});
	var hash = hashcode(window);
	var hashes = await getLocalStorage("windowHashes", {});
	hashes[windowId] = hash;
	await setLocalStorage("windowHashes", hashes);
}