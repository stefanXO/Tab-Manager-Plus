"use strict";window.loaded = false;
window.onload = function () {
	window.requestAnimationFrame(loadApp);
};
setTimeout(loadApp, 75);
setTimeout(loadApp, 125);
setTimeout(loadApp, 250);
setTimeout(loadApp, 375);
setTimeout(loadApp, 700);

function loadApp() {

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
			if(height > 600) height = 600;
			document.body.style.minHeight = height + "px";
		}
	}

	if (!!window.loaded) return;
	window.loaded = true;
	ReactDOM.render(TabManager({ optionsActive: !!window.optionPage }), document.body);
}

window.addEventListener("contextmenu", function (e) {e.preventDefault();});

