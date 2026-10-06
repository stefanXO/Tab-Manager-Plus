// The system / pinned Chrome, found the same way tools/css-baseline/shoot.mjs does.
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export async function launchChrome() {
	const puppeteer = (await import('puppeteer-core')).default
	const pinned = join(homedir(), '.cache', 'puppeteer', 'chrome')
	const pinnedExe = existsSync(pinned) ? readdirSync(pinned).sort().reverse().map((d) => [
		join(pinned, d, 'chrome-win64', 'chrome.exe'),
		join(pinned, d, 'chrome-linux64', 'chrome'),
	]).flat() : []
	const executablePath = [
		process.env.CHROME_PATH,
		...pinnedExe,
		'C:/Program Files/Google/Chrome/Application/chrome.exe',
		'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
		'/usr/bin/google-chrome',
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
	].filter(Boolean).find((p) => existsSync(p))
	if (!executablePath) throw new Error('no Chrome found; set CHROME_PATH')
	return puppeteer.launch({ headless: true, executablePath })
}
