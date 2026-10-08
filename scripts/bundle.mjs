// The esbuild options of the extension bundles and the service worker's version,
// shared by build.mjs and tests/workerVersion.test.ts.
//
// The service worker is bundled first, on its own. Its version is a hash of the
// bytes that bundle came out as, so it changes exactly when worker code (or code
// bundled into it) changes, and never on a plain rebuild. That version is then
//   * appended to the written worker file (`self.TMP_WORKER_VERSION="…";`), which
//     is what the worker answers the `worker_version` command with, and
//   * baked into the popup/options bundles (REQUIRED_WORKER_VERSION), which ask
//     the worker for it a moment after they have rendered (src/popup/workerCheck.ts)
//     and tell the user to reload the extension when the two differ.
// The hash is taken before the version line is appended, so the line does not
// feed back into it.

import { createHash } from 'node:crypto'
import { join } from 'node:path'

export const WORKER_ENTRIES = {
	'service_worker/service_worker': 'src/service_worker/service_worker.ts',
}

export const APP_ENTRIES = {
	'popup/early': 'src/popup/early.ts',
	'popup/changelog': 'src/popup/changelog.ts',
	'popup/popup': 'src/popup/popup.tsx',
	'popup/options': 'src/popup/options.js',
}

/**
 * Options both kinds of bundle share.
 * @param {{browser: 'chrome' | 'firefox', dev: boolean, outDir: string, version: string, workerVersion?: string}} o
 * @returns {import('esbuild').BuildOptions}
 */
function common({ browser, dev, outDir, version, workerVersion }) {
	return {
		outdir: join(outDir, 'dist'),
		bundle: true,
		// the manifests' minimum versions, like the stylesheet (scripts/css.mjs)
		target: ['chrome104', 'firefox140'],
		minify: !dev,
		sourcemap: dev,
		define: {
			'process.env.VERSION': JSON.stringify(version),
			'process.env.BROWSER': JSON.stringify(browser),
			// compile-time constants, like C#'s #if: the other browser's branches are removed
			IS_FIREFOX: String(browser === 'firefox'),
			IS_CHROME: String(browser === 'chrome'),
			// React picks its production or development build from this
			'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production'),
			// only the popup side reads this; the worker bundle must stay free of it
			...(workerVersion === undefined ? {} : { REQUIRED_WORKER_VERSION: JSON.stringify(workerVersion) }),
		},
		logLevel: 'info',
	}
}

/** The service worker bundle. Build it with `write: false` and write it with stampWorkerOutputs(). */
export function workerOptions(o) {
	return { ...common(o), entryPoints: WORKER_ENTRIES, write: false }
}

/** The popup, options and changelog bundles, which require the worker `workerVersion`. */
export function appOptions(o) {
	return { ...common(o), entryPoints: APP_ENTRIES }
}

/** sha256 of the bundle's bytes, first 12 hex characters. */
export function hashWorker(code) {
	return createHash('sha256').update(code).digest('hex').slice(0, 12)
}

/** The line that makes the worker report its version. */
export function versionLine(version) {
	return `self.TMP_WORKER_VERSION=${JSON.stringify(version)};`
}

/**
 * The worker's code with the version line added at the end. A development build
 * ends with a `//# sourceMappingURL=` comment, which has to stay the last line,
 * so the line goes in front of it (and shifts no mapped line).
 */
export function stampWorker(code, version) {
	const line = versionLine(version)
	const tail = /\n\/\/# sourceMappingURL=[^\n]*\n?$/.exec(code)
	if (!tail) return code + (code.endsWith('\n') ? '' : '\n') + line + '\n'
	return code.slice(0, tail.index) + '\n' + line + tail[0]
}

/**
 * From the in-memory outputs of the worker build (esbuild `outputFiles`): the
 * version, and the files to write, the .js with the version line added.
 * @param {{path: string, contents: Uint8Array, text: string}[]} outputFiles
 * @returns {{version: string, files: {path: string, contents: Uint8Array | string}[]}}
 */
export function stampWorkerOutputs(outputFiles) {
	const js = outputFiles.filter((file) => file.path.endsWith('.js'))
	if (js.length !== 1) throw new Error(`expected one service worker bundle, got ${js.length}`)
	const version = hashWorker(js[0].contents)
	const files = outputFiles.map((file) => ({
		path: file.path,
		contents: file === js[0] ? stampWorker(file.text, version) : file.contents,
	}))
	return { version, files }
}
