// Builds a complete, loadable extension folder per browser with esbuild.
//
//   node build.mjs             production Chrome  -> build/chrome
//   node build.mjs --firefox   production Firefox -> build/firefox
//   node build.mjs --dev       development: readable output, source maps
//   node build.mjs --watch     development + rebuild on change (bundle and static files)
//   node build.mjs --devtools  dev only, Chrome only: adds the localhost CSP that
//                              React DevTools (`npx react-devtools`) needs to connect
//
// A folder holds everything the browser needs: the merged manifest, the three
// html pages, css/popup.css (the stylesheet bundle, see scripts/css.mjs), images/,
// dist/ (the esbuild output; it keeps that subpath so the <script src="dist/…">
// references in the html files stay as they are) and the two legal documents. Load build/chrome unpacked in Chrome, and point
// web-ext or about:debugging at build/firefox. readme.md and CHANGELOG.md stay
// out: the stores want the extension, not its documentation.
//
// The browser is a compile-time constant: IS_FIREFOX and IS_CHROME are replaced
// by true/false before bundling, so a bundle carries only its own browser's code.
//
// manifest.json is the complete Chrome manifest and the single source of truth;
// Firefox gets it merged with the manifest.firefox.json overlay, see
// scripts/manifest.mjs. The committed manifest.json must never carry the
// --devtools policy; the check below refuses to build if it does.
//
// npm scripts: build (prod), build:dev, watch, watch:dev, and :firefox variants.

import * as esbuild from 'esbuild'
import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, existsSync, statSync, watch as watchPath } from 'node:fs'
import { dirname, join } from 'node:path'
import { firefoxManifest } from './scripts/manifest.mjs'
import { cssOptions } from './scripts/css.mjs'

const args = new Set(process.argv.slice(2))
const watch = args.has('--watch')
const dev = watch || args.has('--dev')
const devtools = args.has('--devtools')
const browser = args.has('--firefox') ? 'firefox' : 'chrome'

// version comes from package.json so this works outside `npm run` too
const { version } = JSON.parse(readFileSync('package.json', 'utf8'))

const outDir = join('build', browser)

// copied verbatim next to the manifest; directories go in whole. css/ is not
// here: the stylesheet is bundled (below), the raw files under css/ never ship
const STATIC = ['popup.html', 'options.html', 'changelog.html', 'images', 'LICENSE.md', 'PRIVACY.md']

// the sources watch mode keeps an eye on: the static files plus both manifests
// (css/ is watched by the esbuild context of the stylesheet bundle)
const WATCHED = ['popup.html', 'options.html', 'changelog.html', 'images', 'manifest.json', 'manifest.firefox.json']

// React DevTools talks to the page over a websocket on 8097; only a dev build
// may allow it, and only Chrome needs a policy for it at all
const DEVTOOLS_CSP = { extension_pages: "script-src 'self' http://localhost:8097; object-src 'self'" }

const entries = {
	'popup/early': 'src/popup/early.ts',
	'popup/changelog': 'src/popup/changelog.ts',
	'popup/popup': 'src/popup/popup.tsx',
	'popup/options': 'src/popup/options.js',
	'service_worker/service_worker': 'src/service_worker/service_worker.ts',
}

/** @type {esbuild.BuildOptions} */
const options = {
	entryPoints: entries,
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
	},
	logLevel: 'info',
}

/** The stylesheet bundle: css/popup.css and its imports -> build/<browser>/css/popup.css */
const css = cssOptions({ outfile: join(outDir, 'css', 'popup.css'), dev })

function fail(message) {
	console.error(message)
	process.exit(1)
}

/** Writes build/<browser>/manifest.json from manifest.json (+ the overlay, for Firefox). */
function writeManifest() {
	const base = JSON.parse(readFileSync('manifest.json', 'utf8'))

	// the development policy is injected below, never committed: with it in
	// manifest.json the store would reject the package
	if (JSON.stringify(base.content_security_policy ?? null).includes('localhost')) {
		fail('manifest.json carries a content_security_policy that mentions localhost. That belongs in a --devtools development build only; remove it from the committed manifest.')
	}

	let manifest = base
	if (browser === 'firefox') {
		const overlay = JSON.parse(readFileSync('manifest.firefox.json', 'utf8'))
		try {
			manifest = firefoxManifest(base, overlay)
		} catch (error) {
			fail(String(error.message))
		}
	} else if (dev && devtools) {
		manifest = { ...base, content_security_policy: DEVTOOLS_CSP }
	}

	writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, '\t') + '\n')
}

/** Copies one static source, file or directory, into the output folder. */
function copy(path) {
	const dest = join(outDir, path)
	mkdirSync(dirname(dest), { recursive: true })
	cpSync(path, dest, { recursive: true })
}

function copyStatic() {
	for (const path of STATIC) copy(path)
}

if (devtools && browser === 'firefox') console.log('--devtools only applies to Chrome, ignoring it')
if (devtools && !dev) console.log('--devtools only applies to a development build, ignoring it')

// esbuild never deletes old output, and a stale manifest or image would ship
// with the next package, so the folder starts empty every time
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })
copyStatic()
writeManifest()

if (watch) {
	const ctx = await esbuild.context(options)
	await ctx.watch()
	// a second context for the stylesheet: rebuilds on any change under css/
	const cssCtx = await esbuild.context(css)
	await cssCtx.watch()

	// one watcher per watched directory, recursively (Node 22+ can do that on
	// Windows and Linux), plus one on the repo root for the watched files:
	// editors that rewrite a file in place break a watcher on the file itself
	const dirs = WATCHED.filter((source) => existsSync(source) && statSync(source).isDirectory())
	const files = new Set(WATCHED.filter((source) => !dirs.includes(source)))

	const pending = new Set()
	let timer = null

	function changed(path) {
		pending.add(path)
		clearTimeout(timer)
		// a save often arrives as several events; wait for them to stop
		timer = setTimeout(flush, 50)
	}

	function flush() {
		for (const path of pending) {
			try {
				if (path === 'manifest.json' || path === 'manifest.firefox.json') {
					writeManifest()
					console.log(`merged ${path} -> ${join(outDir, 'manifest.json')}`)
				} else if (existsSync(path)) {
					copy(path)
					console.log(`copied ${path} -> ${join(outDir, path)}`)
				} else {
					rmSync(join(outDir, path), { recursive: true, force: true })
					console.log(`removed ${join(outDir, path)}`)
				}
			} catch (error) {
				console.error(`could not update ${path}: ${error.message}`)
			}
		}
		pending.clear()
	}

	/** fs.watch reports a native path; the rest of this file speaks posix. */
	const posix = (name) => name.split('\\').join('/')

	for (const dir of dirs) {
		watchPath(dir, { recursive: true }, (_event, name) => {
			if (name) changed(`${dir}/${posix(name)}`)
		})
	}
	watchPath('.', (_event, name) => {
		if (name && files.has(posix(name))) changed(posix(name))
	})

	console.log(`watching ${outDir} (${version}, development)…`)
} else {
	await Promise.all([esbuild.build(options), esbuild.build(css)])
	console.log(`built ${version} for ${browser} into ${outDir} (${dev ? 'development' : 'production'})`)
}
