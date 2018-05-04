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
		var height = document.body.style.minHeight.split("px")[0];
		height = parseInt(height) || 0;
		if(height < 300) {
			height = 400;
			document.body.style.minHeight = height + "px";
		}else{
			height++;
			document.body.style.minHeight = height + "px";
		}
	}

	if(!!window.loaded) return;
	window.loaded = true;
	ReactDOM.render(TabManager({}), document.body);
}

window.addEventListener("contextmenu", function(e) { e.preventDefault(); })