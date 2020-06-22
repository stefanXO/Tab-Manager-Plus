"use strict";
window.loaded = false;
if (window.location.search.indexOf("?popup") > -1) {
	window.inPopup = true;
} else {
	window.inPopup = false;
}
if (window.location.search.indexOf("?panel") > -1) {
	window.inPanel = true;
} else {
	window.inPanel = false;
}
window.onload = function() {
	window.requestAnimationFrame(loadApp);
};
setTimeout(loadApp, 75);
setTimeout(loadApp, 125);
setTimeout(loadApp, 250);
setTimeout(loadApp, 375);
setTimeout(loadApp, 700);
setTimeout(loadApp, 1000);
setTimeout(loadApp, 2000);
setTimeout(loadApp, 3000);
setTimeout(loadApp, 5000);
setTimeout(loadApp, 15000);

function loadApp() {
	if (!!window.loaded) return;
	if (window.inPopup) {
		if (!!localStorage["tabHeight"]) {
			var height = JSON.parse(localStorage["tabHeight"]);
			document.body.style.height = height + "px";
		}

		if (!!localStorage["tabWidth"]) {
			var width = JSON.parse(localStorage["tabWidth"]);
			document.body.style.width = width + "px";
		}

		var root = document.getElementById("root");
		if (root != null) {
			var height = document.body.style.height.split("px")[0];
			height = parseInt(height) || 0;
			if (height < 300) {
				height = 400;
				document.body.style.minHeight = height + "px";
			} else {
				height++;
				if (height > 600) height = 600;
				document.body.style.minHeight = height + "px";
			}
		}
	} else {
		if (window.inPanel) {
			document.documentElement.style.maxHeight = "auto";
			document.documentElement.style.maxWidth = "auto";
			document.body.style.maxHeight = "auto";
			document.body.style.maxWidth = "auto";
		}
		document.documentElement.style.maxHeight = "100%";
		document.documentElement.style.maxWidth = "100%";
		document.documentElement.style.height = "100%";
		document.documentElement.style.width = "100%";
		document.body.style.maxHeight = "100%";
		document.body.style.maxWidth = "100%";
		document.body.style.height = "100%";
		document.body.style.width = "100%";
	}

	if (!!window.loaded) return;
	window.loaded = true;
	ReactDOM.render(<TabManager optionsActive={!!window.optionPage} />, document.getElementById("TMP"));
}

window.addEventListener("contextmenu", function (e) {e.preventDefault();});

