// manifest.json is the complete Chrome manifest and the only source of truth in
// the repo. The Firefox manifest is that file merged with the manifest.firefox.json
// overlay, at build time, by firefoxManifest() below.
//
// The merge rule (mergeManifest):
//   plain objects  deep-merge, key by key
//   arrays         are replaced wholesale, never concatenated
//   null           deletes the key
// Keys starting with "$" in the overlay are comments and are dropped.
//
// The version is never in the overlay: it comes from the base, which
// scripts/sync-version.mjs keeps in step with package.json.

// permissions Chrome has and Firefox does not; Firefox warns about each of them.
// Anything else dropped from the Firefox permissions is a mistake, see below.
export const CHROME_ONLY_PERMISSIONS = ["favicon"];

/** True for a plain object, i.e. something to merge into rather than replace. */
function isPlainObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Merges `overlay` onto `base` and returns a new object. Neither argument is
 * modified. See the rule at the top of this file.
 */
export function mergeManifest(base, overlay) {
	const merged = structuredClone(base);
	for (const [key, value] of Object.entries(overlay)) {
		if (value === null) {
			delete merged[key];
		} else if (isPlainObject(value) && isPlainObject(merged[key])) {
			merged[key] = mergeManifest(merged[key], value);
		} else {
			merged[key] = structuredClone(value);
		}
	}
	return merged;
}

/**
 * Throws if the merged manifest lost a permission that is not documented as
 * Chrome only, so a permission added to manifest.json later cannot go missing
 * in Firefox without anyone noticing.
 */
export function checkPermissions(base, merged) {
	const kept = new Set(merged.permissions ?? []);
	const lost = (base.permissions ?? []).filter((p) => !kept.has(p) && !CHROME_ONLY_PERMISSIONS.includes(p));
	if (lost.length) {
		throw new Error(
			`manifest.firefox.json drops the permission(s) ${lost.join(", ")} that manifest.json asks for. ` +
				`Add them to the overlay's "permissions" array, or, if Firefox genuinely does not have them, ` +
				`to CHROME_ONLY_PERMISSIONS in scripts/manifest.mjs.`,
		);
	}
}

/** The Firefox manifest: the Chrome one with the overlay applied and checked. */
export function firefoxManifest(base, overlay) {
	const data = Object.fromEntries(Object.entries(overlay).filter(([key]) => !key.startsWith("$")));
	const merged = mergeManifest(base, data);
	checkPermissions(base, merged);
	return merged;
}
