"use strict";

// The number fields of the options (tab limit, popup width and height). While
// the field is typed into it holds text that is not always a number: emptied
// to type a new value, a lone minus, letters. Only a real number reaches the
// setting, and while typing only one inside the limits (typing 6 on the way to
// 600 must not shrink the popup to 6 pixels); the field keeps the rest as a
// draft and settles on a number inside the limits when it is left.
// Before, parseInt of the emptied field stored NaN, which React then wrote
// back into the field ("The specified value "NaN" cannot be parsed") and the
// popup size took as its width. Pure, unit tested in tests/numberField.test.ts.

export interface NumberBounds {
	min? : number;
	max? : number;
}

// The whole number the typed text stands for, or null while it is not one
export function typedNumber(text : string) : number | null {
	if (!/^\s*-?\d+\s*$/.test(text)) return null;
	const n = parseInt(text, 10);
	return Number.isFinite(n) ? n : null;
}

// The number to hand over while typing: the typed whole number, but only when
// it is inside the bounds; null otherwise (the draft stays until the field is left)
export function typedInBounds(text : string, bounds : NumberBounds = {}) : number | null {
	const n = typedNumber(text);
	if (n === null) return null;
	if (bounds.min !== undefined && n < bounds.min) return null;
	if (bounds.max !== undefined && n > bounds.max) return null;
	return n;
}

// What the field settles on when it is left: a number inside the bounds
// stays, one outside is clamped to them, anything else goes back to `current`
export function settledNumber(text : string, current : number, bounds : NumberBounds = {}) : number {
	const n = typedNumber(text);
	if (n === null) return current;
	if (bounds.min !== undefined && n < bounds.min) return bounds.min;
	if (bounds.max !== undefined && n > bounds.max) return bounds.max;
	return n;
}

// A stored setting that should be a number but is not a finite one (a NaN
// that older versions saved comes back as null) falls back to the default
export function finiteOr(value : unknown, fallback : number) : number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// The bounds an input's min / max attributes give, for settledNumber
export function boundsOf(min? : string, max? : string) : NumberBounds {
	const bounds : NumberBounds = {};
	if (min !== undefined && min !== "") bounds.min = Number(min);
	if (max !== undefined && max !== "") bounds.max = Number(max);
	return bounds;
}
