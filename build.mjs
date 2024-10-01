import * as esbuild from 'esbuild'

await esbuild.build({
	entryPoints: ['src/popup/popup.tsx'],
	bundle: true,
	sourcemap: true,
	target: 'chrome88',
	outfile: 'dist/popup/popup.js',
	define: {
		'process.env.VERSION': '"' + process.env.npm_package_version + '"',
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
		'process.env.VERSION': '"' + process.env.npm_package_version + '"',
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
		'process.env.VERSION': '"' + process.env.npm_package_version + '"',
		'process.env.NODE_ENV': '"production"'
	}
})
