"use strict";

import '@helpers/migrate';
import {getLocalStorage} from "@helpers/storage";
import {TabManager} from '@views';
import * as React from 'react';
import * as ReactDOM from "react-dom";

declare global {
	interface Window {
		loaded: boolean;
		inPopup: boolean;
		inPanel: boolean;
		optionPage: boolean;
		extensionVersion: string;
	}
}

window.loaded = false;
window.inPopup = window.location.search.indexOf("?popup") > -1;
window.inPanel = window.location.search.indexOf("?panel") > -1;
window.extensionVersion = process.env.VERSION;

window.onload = () => window.requestAnimationFrame(loadApp);

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

async function loadApp() {
	if (!!window.loaded) return;
	let height : number = await getLocalStorage("tabHeight", 600);
	let width : number = await getLocalStorage("tabWidth", 800);
	console.log(height, width);
	if (window.inPopup) {

		if (height > 0 && width > 0) {
			document.body.style.width = width + "px";
			document.body.style.height = height + "px";
		}

		var root = document.getElementById("root");
		if (root != null) {
			var _height = parseInt(document.body.style.height.split("px")[0]) || 0;
			if (_height < 300) {
				_height = 400;
				document.body.style.minHeight = _height + "px";
			} else {
				_height++;
				if (_height > 600) _height = 600;
				document.body.style.minHeight = _height + "px";
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
	ReactDOM.render(<TabManager optionsActive={!!window.optionPage}/>, document.getElementById("TMP"));
}

window.addEventListener("contextmenu", function (e) {
	e.preventDefault();
});

