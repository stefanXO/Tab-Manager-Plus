import * as esbuild from 'esbuild'

await esbuild.build({
	entryPoints: ['lib/popup/popup.tsx'],
	bundle: true,
	sourcemap: true,
	target: 'chrome88',
	outfile: 'outlib/popup/popup.js',
	define: {
		__VERSION__: '"' + process.env.npm_package_version + '"',
		'process.env.NODE_ENV': '"production"'
	}
})

await esbuild.build({
	entryPoints: ['lib/service_worker/service_worker.ts'],
	bundle: true,
	sourcemap: true,
	target: 'chrome88',
	outfile: 'outlib/service_worker/service_worker.js',
	define: {
		__VERSION__: '"' + process.env.npm_package_version + '"',
		'process.env.NODE_ENV': '"production"'
	},
})

await esbuild.build({
	entryPoints: ['lib/popup/options.js'],
	bundle: true,
	sourcemap: true,
	target: 'chrome88',
	outfile: 'outlib/popup/options.js',
	define: {
		__VERSION__: '"' + process.env.npm_package_version + '"',
		'process.env.NODE_ENV': '"production"'
	}
})
