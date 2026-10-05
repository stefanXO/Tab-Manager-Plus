// Builds tools/css-baseline/app/ — a runnable copy of the REAL popup, options
// page and changelog page, bundled against fake-browser.js so they run as plain
// web pages with no extension host.
//
// The stylesheet is bundled from css/ on EVERY build with the same esbuild
// options as the extension build (scripts/css.mjs), and images and html are
// copied from the repo, so the screenshots always reflect the css that is on
// disk right now. That is the whole point: shoot.mjs calls this first.
//
// Derived from brag-output/work/build-app.mjs (gitignored), extended with the
// options + changelog entry points.
import {cpSync, mkdirSync, rmSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {fetchFavicons} from './fetch-favicons.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')
const app = join(here, 'app')

// chrome: bundle with IS_FIREFOX=false (shoot.mjs --chrome). Favicons then
// point at chrome-extension://<id>/_favicon/ and render icon-less, but the
// Chrome-only markup (e.g. the options screen) is what gets shot.
export async function buildApp({chrome = false} = {}) {
	const esbuild = await import(pathToFileURL(join(repo, 'node_modules', 'esbuild', 'lib', 'main.js')).href)
	const {cssOptions} = await import(pathToFileURL(join(repo, 'scripts', 'css.mjs')).href)

	rmSync(app, {recursive: true, force: true})
	mkdirSync(app, {recursive: true})
	// current images / markup straight from the repo
	for (const f of ['popup.html', 'options.html', 'changelog.html', 'images']) {
		cpSync(join(repo, f), join(app, f), {recursive: true})
	}
	// the demo favicons: downloaded into fav/ on first use, never committed
	await fetchFavicons(join(app, 'fav'))

	await esbuild.build({
		absWorkingDir: repo,
		entryPoints: {
			'popup/early': 'src/popup/early.ts',
			'popup/popup': 'src/popup/popup.tsx',
			'popup/options': 'src/popup/options.js',
			'popup/changelog': 'src/popup/changelog.ts',
		},
		outdir: join(app, 'dist'),
		bundle: true,
		target: 'chrome110',
		minify: true,
		alias: {'webextension-polyfill': join(here, 'fake-browser.js')},
		define: {
			'process.env.VERSION': JSON.stringify('7.0.0'),
			'process.env.BROWSER': JSON.stringify(chrome ? 'chrome' : 'firefox'),
			'process.env.NODE_ENV': JSON.stringify('production'),
			// The Firefox build is the one that can run outside an extension: the
			// Chrome build resolves favicons through `chrome-extension://<id>/_favicon/`,
			// which does not exist on a plain page, so every tab would render
			// icon-less and the favicon CSS would go untested. Layout and theme css
			// are identical between the two builds.
			IS_FIREFOX: String(!chrome),
			IS_CHROME: String(chrome),
		},
		logLevel: 'warning',
	})
	// the stylesheet bundle, exactly as a production build makes it
	await esbuild.build({...cssOptions({outfile: join(app, 'css', 'popup.css'), absWorkingDir: repo}), logLevel: 'warning'})
	return app
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
	console.log('built ' + (await buildApp()))
}
