"use strict";

function debounce(func, wait, immediate) {
	var timeout;
	return function () {
		var context = this,
		    args = arguments;
		var later = function later() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

function is_in_bounds(object, bounds) {
	var C = object,
	    B = bounds;
	if (C.left >= B.left && C.left <= B.left + B.width) {
		if (C.top >= B.top && C.top <= B.top + B.height) {
			return true;
		}
	}
	return false;
}

function stringHashcode(string) {
	var hash = 0;
	for (var i = 0; i < string.length; i++) {
		var code = string.charCodeAt(i);
		hash = (hash << 5) - hash + code;
		hash = hash & hash;
	}
	return hash;
}
//# sourceMappingURL=utils.js.map