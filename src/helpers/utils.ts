// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
export function debounce(func, wait, immediate = false) {
	var timeout;
	return function () {
		var context = this, args = arguments;
		var later = function later() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	}
}

export function is_in_bounds(object, bounds) {
	var C = object, B = bounds;
	if (C.left >= B.left && C.left <= B.left + B.width) {
		if (C.top >= B.top && C.top <= B.top + B.height) {
			return true;
		}
	}
	return false;
}

export function isInViewport(element, ofElement) {
	var rect = element.getBoundingClientRect();
	return rect.top >= 0 && rect.left >= 0 && rect.bottom <= ofElement.height && rect.right <= ofElement.width;
}

export function stringHashcode(string) : number {
	var hash = 0;
	for (var i = 0; i < string.length; i++) {
		var code = string.charCodeAt(i);
		hash = ((hash << 5) - hash) + code;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

export function maybePluralize(count, noun, suffix = 's') {
	return `${count} ${noun}${count !== 1 ? suffix : ''}`;
}

export function toBoolean(str) {
	if (typeof str === "undefined" || str === null) {
		return false;
	} else if (typeof str === "string") {
		switch (str.toLowerCase()) {
			case "false":
			case "no":
			case "0":
			case "":
				return false;
			default:
				return true;
		}
	} else if (typeof str === "number") {
		return str !== 0;
	} else {
		return true;
	}
}