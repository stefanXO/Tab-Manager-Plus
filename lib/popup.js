window.loaded = false;
window.onload = function() {
	window.requestAnimationFrame(loadApp);
}
setTimeout(loadApp, 75);
setTimeout(loadApp, 125);
setTimeout(loadApp, 250);
setTimeout(loadApp, 375);
function loadApp() {
	var root = document.getElementById("root");
	if(root != null) {
		var bodyHeight = window.getComputedStyle(root).getPropertyValue('height').split("px")[0];
		// console.log(parseInt(bodyHeight));
		if(parseInt(bodyHeight) < 300) {
			document.body.style.minHeight = "401px";
		}
	}

	if(!!window.loaded) return;
	window.loaded = true;
	ReactDOM.render(TabManager({}), document.body);
}

window.addEventListener("contextmenu", function(e) { e.preventDefault(); })