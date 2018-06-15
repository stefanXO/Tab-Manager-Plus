function createWindowWithTabs(tabs, isIncognito){
	var first = tabs.shift();
	var t = [];
	for (var i = 0; i < tabs.length; i++) {
		t.push(tabs[i].id);
	};
	chrome.windows.create({tabId:first.id, incognito: !!isIncognito, focused: true},function(first, t, w){
		chrome.tabs.update(first.id,{pinned:first.pinned});
		if(t.length > 0) {
			chrome.tabs.move(t,{windowId:w.id,index:-1},function(tab){
				chrome.tabs.update(tab.id,{pinned:tab.pinned});
			});
		}
		chrome.windows.update(w.id,{focused:true});
	}.bind(null, first, t));
}

function focusOnTabAndWindow(tab){
	chrome.windows.update(tab.windowId,{focused:true});
	if(!!tab.tabId) {
		chrome.tabs.update(tab.tabId,{active:true})
		tabActiveChanged(tab);
	}else{
		chrome.tabs.update(tab.id,{active:true})
		tabActiveChanged({tabId: tab.id, windowId: tab.windowId});
	}
}

function updateTabCount(){
	var run = true;
	if(localStorageAvailable()) {
		if(typeof localStorage["badge"] === "undefined") localStorage["badge"] = "1";
		if(localStorage["badge"] == "0") run = false;
	}
	
	if(run) {
		chrome.tabs.query({}, function(result){
			chrome.browserAction.setBadgeText({ text: result.length + "" });
			chrome.browserAction.setBadgeBackgroundColor({ color: "purple" });
			var toRemove = [];
			for (var i = 0; i < window.tabsActive.length; i++) {
				var t = window.tabsActive[i];
				var found = false;
				for (var j = 0; j < result.length; j++) {
					if(result[j].id == t.tabId) found = true;
				};
				if(!found) toRemove.push(i);
			};
			// console.log("to remove", toRemove);
			for (var i = toRemove.length - 1; i >= 0; i--) {
				// console.log("removing", toRemove[i]);
				window.tabsActive.splice(toRemove[i], 1);
			};
		});
	} else {
		chrome.browserAction.setBadgeText({ text: "" });
	}
}

var updateTabCountDebounce = debounce(updateTabCount, 250);

window.tabsActive = [];

function tabAdded(tab){
	if(typeof localStorage["tabLimit"] === "undefined") localStorage["tabLimit"] = "0";
	var tabLimit = JSON.parse(localStorage["tabLimit"]);
	if(tabLimit > 0) {
		if(tab.index >= tabLimit) {
			createWindowWithTabs([tab], tab.incognito);
		}
	}
	updateTabCountDebounce();
}

function tabActiveChanged(tab){
	//console.log("tabActiveChanged", tab.tabId);
	if(window.tabsActive.length > 0) {
		if(window.tabsActive[window.tabsActive.length-1].tabId == tab.tabId && window.tabsActive[window.tabsActive.length-1].windowId == tab.windowId){
			return;
		}
	}
	while(window.tabsActive.length > 20) {
		window.tabsActive.shift();
	}
	for (var i = window.tabsActive.length - 1; i >= 0; i--) {
		if(window.tabsActive[i].tabId == tab.tabId) {
			window.tabsActive.splice(i, 1);
		}
	};
	window.tabsActive.push(tab);
}

chrome.tabs.onCreated.addListener(tabAdded);
chrome.tabs.onRemoved.addListener(updateTabCountDebounce);
chrome.tabs.onActivated.addListener(tabActiveChanged);
chrome.windows.onFocusChanged.addListener(windowFocus);
chrome.windows.onCreated.addListener(windowCreated);
chrome.windows.onRemoved.addListener(windowRemoved);
updateTabCountDebounce();

chrome.windows.getAll({populate:true},function(windows){
	localStorage["windowAge"] = JSON.stringify([]);
	windows.sort(function(a, b){
		if(a.id < b.id) return 1;
		if(a.id > b.id) return -1;
		return 0;
	});
	for (var i = 0; i < windows.length; i++) {
		windowActive(windows[i].id);
	};
});

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

function localStorageAvailable(){
	var test = 'test';
	try {
		localStorage.setItem(test, test);
		localStorage.removeItem(test);
		return true;
	} catch(e) {
		return false;
	}
}

function windowFocus(windowId) {
	windowActive(windowId);
	// console.log("onFocused", windowId);
	hideWindows(windowId);
}
function windowCreated(window) {
	windowActive(window.id);
	// console.log("onCreated", window.id);
}
function windowRemoved(windowId) {
	windowActive(windowId);
	// console.log("onRemoved", windowId);
}
function hideWindows(windowId) {
	if(!windowId || windowId < 0) return;
	if(localStorageAvailable()) {
		console.log(localStorage["hideWindows"]);
		if(typeof localStorage["hideWindows"] === "undefined") localStorage["hideWindows"] = "0";
			console.log(localStorage["hideWindows"]);
		if(localStorage["hideWindows"] == "0") return;
	}else{
		console.log("no local storage");
		return;
	}
	console.log("hide windows", windowId);
	chrome.windows.getAll({populate:true},function(windowId, windows){
		for (var i = windows.length - 1; i >= 0; i--) {
			if(windows[i].id != windowId) {
				chrome.windows.update(windows[i].id, {
					"state": "minimized"
				});
			}
		};
	}.bind(null, windowId));
}

function windowActive(windowId) {
	if(windowId < 0) return;
	var windows = JSON.parse(localStorage["windowAge"]);
	if(windows instanceof Array) {
		// console.log("windows was array", windows);
	}else{
		// console.log("windows was not array", windows);
		windows = [];
	}
	// console.log(windows);
	if(windows.indexOf(windowId) > -1) windows.splice(windows.indexOf(windowId), 1);
	windows.unshift(windowId);
	localStorage["windowAge"] = JSON.stringify(windows);

	chrome.windows.getLastFocused({ populate: true }, function(w){
		for (var i = 0; i < w.tabs.length; i++) {
			var tab = w.tabs[i];
			if(tab.active == true) {
				// console.log("get last focused", tab.id);
				// tabActiveChanged({
				// 	tabId: tab.id,
				// 	windowId: tab.windowId
				// });
			}
		};
	});
	// console.log(windows);
}

chrome.commands.onCommand.addListener(function(command) {
	if(command == "switch_to_previous_active_tab") {
		//console.log(window.tabsActive);
		if(window.tabsActive.length > 1) {
			// console.log("switch to ", window.tabsActive[window.tabsActive.length-2]);
			focusOnTabAndWindow(window.tabsActive[window.tabsActive.length-2]);
		}
	}
});