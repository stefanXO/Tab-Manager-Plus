import * as esbuild from 'esbuild'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync('package.json', 'utf8'))

await esbuild.build({
	entryPoints: ['src/popup/popup.tsx'],
	bundle: true,
	sourcemap: true,
	target: 'chrome88',
	outfile: 'dist/popup/popup.js',
	define: {
		'process.env.VERSION': JSON.stringify(version),
		'process.env.NODE_ENV': '"production"'
	}
})

await esbuild.build({
	entryPoints: ['src/service_worker/service_worker.ts'],
	bundle: true,
	sourcemap: true,
	target: 'chrome88',
	outfile: 'dist/service_worker/service_worker.js',
	define: {
		'process.env.VERSION': JSON.stringify(version),
		'process.env.NODE_ENV': '"production"'
	},
})

await esbuild.build({
	entryPoints: ['src/popup/options.js'],
	bundle: true,
	sourcemap: true,
	target: 'chrome88',
	outfile: 'dist/popup/options.js',
	define: {
		'process.env.VERSION': JSON.stringify(version),
		'process.env.NODE_ENV': '"production"'
	}
})
