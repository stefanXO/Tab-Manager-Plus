// The stylesheet bundle, shared by build.mjs and the CSS screenshot harness
// (tools/css-baseline/build-app.mjs) so both ship the same CSS.
//
// css/popup.css is only an entry: the @layer order and @imports of the real
// files under css/. esbuild inlines the imports (keeping each in its layer)
// and lowers native CSS nesting.
//
// Target: Chrome 104 (the manifest's minimum_chrome_version) and
// Firefox 140 (manifest.firefox.json). Both support @layer (Chrome 99+), so it
// is kept as written; Chrome 104 predates CSS nesting (Chrome 112/120), so
// esbuild flattens nested rules into plain selectors. It does not lower
// @layer; a target below Chrome 99 would ship layers that the browser drops.
//
// url() references stay as written and are not copied or inlined: they are
// relative to the bundled file (css/popup.css → ../images/…), and images/ is
// copied next to css/ by the build.

/** Image types a stylesheet may reference; all of them live in images/. */
const IMAGES = ['*.png', '*.svg', '*.jpg', '*.gif', '*.webp']

export const CSS_ENTRY = 'css/popup.css'
export const CSS_TARGET = ['chrome104', 'firefox140']

/**
 * esbuild options for the stylesheet bundle.
 * @param {{outfile: string, dev?: boolean, absWorkingDir?: string}} o
 * @returns {import('esbuild').BuildOptions}
 */
export function cssOptions({ outfile, dev = false, absWorkingDir }) {
	return {
		entryPoints: [CSS_ENTRY],
		outfile,
		absWorkingDir,
		bundle: true,
		target: CSS_TARGET,
		external: IMAGES,
		// production: minified; development: readable, with a source map back
		// to the file under css/ a rule came from
		minify: !dev,
		sourcemap: dev,
		logLevel: 'info',
	}
}
