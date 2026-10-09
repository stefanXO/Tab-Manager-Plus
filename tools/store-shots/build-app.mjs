// Bundles the CURRENT repo popup against ./fake-browser.js (which inlines ./shots.json) into ./app/ (gitignored).
// shoot.mjs calls this first; run it by hand with: node tools/store-shots/build-app.mjs
import {cpSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {fetchFavicons} from './fetch-favicons.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')
export const app = join(here, 'app')

/** Every favicon file name shots.json mentions (windows' tabs and saved windows' tabs). */
export function faviconFiles(cfg = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'))) {
	const tabs = [...cfg.windows.flatMap((w) => w.tabs), ...cfg.saved.flatMap((s) => s.tabs)]
	return [...new Set(tabs.map((t) => t.favicon))]
}

export async function buildApp() {
	const esbuild = await import(pathToFileURL(join(repo, 'node_modules', 'esbuild', 'lib', 'main.js')).href)
	const {cssOptions} = await import(pathToFileURL(join(repo, 'scripts', 'css.mjs')).href)

	rmSync(app, {recursive: true, force: true})
	mkdirSync(app, {recursive: true})
	for (const f of ['popup.html', 'images', 'fonts']) cpSync(join(repo, f), join(app, f), {recursive: true})
	await fetchFavicons(join(app, 'fav'), faviconFiles())
	// the stylesheet bundle, the way the real build makes it (css/popup.css -> ../images/)
	await esbuild.build({...cssOptions({outfile: join(app, 'css', 'popup.css'), absWorkingDir: repo}), logLevel: 'warning'})
	// font.css = the old "interfont" (interfont-old.css, so the frame text of the approved creative is unchanged)
	// + the popup's Noto Sans faces, for the frames and tiles that load /app/font.css
	const css = readFileSync(join(repo, 'css', 'base', 'typography.css'), 'utf8')
	const faces = css.match(/@font-face\s*\{[^}]*\}/g).join('\n').replaceAll('../fonts/', 'fonts/')
	writeFileSync(join(app, 'font.css'), readFileSync(join(here, 'interfont-old.css'), 'utf8') + '\n' + faces)

	await esbuild.build({
		absWorkingDir: repo,
		entryPoints: {'popup/early': 'src/popup/early.ts', 'popup/popup': 'src/popup/popup.tsx'},
		outdir: join(app, 'dist'),
		bundle: true,
		target: 'chrome110',
		minify: true,
		alias: {'webextension-polyfill': join(here, 'fake-browser.js')},
		define: {
			'process.env.VERSION': JSON.stringify('7.0.0'),
			'process.env.BROWSER': JSON.stringify('firefox'),
			'process.env.NODE_ENV': JSON.stringify('production'),
			// the popup asks the worker for this version (src/popup/workerCheck.ts); fake-browser.js answers with it
			REQUIRED_WORKER_VERSION: JSON.stringify('store-shots-worker'),
			IS_FIREFOX: 'true',
			IS_CHROME: 'false',
		},
		logLevel: 'warning',
	})
	return app
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) console.log('built ' + (await buildApp()))
