import * as esbuild from 'esbuild'
import { readFileSync } from 'node:fs'

// version comes from package.json so `node build.mjs` works outside `npm run` too
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

async function watch() {
	const ctx = await esbuild.context({
		entryPoints: [
			'src/service_worker/service_worker.ts',  // Main service worker entry point
			'src/popup/popup.tsx'                    // Popup script (JSX or JS)
		],
		bundle: true,
		sourcemap: true,  // Generate source maps for easier debugging
		target: 'chrome88', // Set browser target version
		outdir: 'dist',   // Output directory
		plugins: [{
			name: 'rebuild-notify',
			setup(build) {
				build.onEnd(result => {
					console.log(`build ended with ${result.errors.length} errors`);
					// HERE: somehow restart the server from here, e.g., by sending a signal that you trap and react to inside the server.
				})
			},
		}],
		define: {
			'process.env.VERSION': JSON.stringify(version)
		}
	});

	await ctx.watch();  // Watch mode
	console.log('Watching for changes...');
}

watch();
