// Tiny static server rooted at tools/css-baseline/app.
import {createServer} from 'node:http'
import {readFile} from 'node:fs/promises'
import {dirname, extname, join, normalize} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), 'app')
const types = {
	'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
	'.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json',
	'.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.ico': 'image/x-icon',
}

/** Serves app/ on a free port; resolves to {server, origin}. */
export function serve(port = 0) {
	const server = createServer(async (req, res) => {
		try {
			const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\\/]\.\.)+/, '')
			const body = await readFile(join(root, path))
			res.writeHead(200, {'content-type': types[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store'})
			res.end(body)
		} catch {
			res.writeHead(404)
			res.end()
		}
	})
	return new Promise((resolve) => server.listen(port, '127.0.0.1', () => {
		resolve({server, origin: 'http://127.0.0.1:' + server.address().port})
	}))
}
