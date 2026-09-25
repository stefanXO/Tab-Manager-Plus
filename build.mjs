// Builds the popup, options page and service worker with esbuild.
//
//   node build.mjs            production: minified, no source maps
//   node build.mjs --dev      development: readable output, source maps
//   node build.mjs --watch    development + rebuild on change
//
// npm scripts: build (prod), build:dev, watch.

import * as esbuild from 'esbuild'
import { readFileSync, rmSync } from 'node:fs'

const args = new Set(process.argv.slice(2))
const watch = args.has('--watch')
const dev = watch || args.has('--dev')

// version comes from package.json so this works outside `npm run` too
const { version } = JSON.parse(readFileSync('package.json', 'utf8'))

const entries = {
	'popup/early': 'src/popup/early.ts',
	'popup/popup': 'src/popup/popup.tsx',
	'popup/options': 'src/popup/options.js',
	'service_worker/service_worker': 'src/service_worker/service_worker.ts',
}

/** @type {esbuild.BuildOptions} */
const options = {
	entryPoints: entries,
	outdir: 'dist',
	bundle: true,
	target: 'chrome88',
	minify: !dev,
	sourcemap: dev,
	define: {
		'process.env.VERSION': JSON.stringify(version),
		// React picks its production or development build from this
		'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production'),
	},
	logLevel: 'info',
}

// esbuild never deletes old output, so a production build would keep the
// source maps of an earlier development build around
rmSync('dist', { recursive: true, force: true })

if (watch) {
	const ctx = await esbuild.context(options)
	await ctx.watch()
	console.log(`watching (${version}, development)…`)
} else {
	await esbuild.build(options)
	console.log(`built ${version} (${dev ? 'development' : 'production'})`)
}
