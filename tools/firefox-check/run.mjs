// firefox-check: the Firefox pass of plans/sessions/TESTING.md, automated in a
// real Firefox. See README.md.
//
//   node tools/firefox-check/run.mjs [--only <substring>] [--headless] [--skip-upgrade] [--no-build]
//
// Never touches your own Firefox profile (a fresh one under out/), never
// starts or connects to Chrome. Outside tools/firefox-check/ it only rebuilds
// build/firefox (node build.mjs --firefox; skip with --no-build).
import {mkdirSync, rmSync, writeFileSync, existsSync, readdirSync, readFileSync} from 'node:fs'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'
import {Harness, Page, root, OUT, EXT, sleep, savedRec, DAY, tabSel, savedSel, K, GECKO_ID} from './lib.mjs'
import {checks} from './checks.mjs'
import {upgradeChecks} from './upgrade.mjs'
import {writeResults} from './report.mjs'

const argv = process.argv.slice(2)
const opt = (n) => argv.includes(n)
const val = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null }
const only = val('--only')
const headless = opt('--headless')

mkdirSync(OUT, {recursive: true})
const buildDir = join(root, 'build', 'firefox')
if (!opt('--no-build')) {
	const r = spawnSync('node', ['build.mjs', '--firefox'], {cwd: root, encoding: 'utf8', shell: false})
	if (r.status !== 0) { console.error('build failed\n' + r.stdout + r.stderr); process.exit(2) }
}
if (!existsSync(join(buildDir, 'manifest.json'))) { console.error('no build/firefox'); process.exit(2) }

const results = []
const started = Date.now()
const profile = join(OUT, 'profile-main')
rmSync(profile, {recursive: true, force: true})

const h = new Harness({profile, extPath: buildDir, headless})
const env = {version: null, buildVersion: JSON.parse(readFileSync(join(buildDir, 'manifest.json'), 'utf8')).version}
try {
	await h.start({install: false})
	// the checklist sets Run in Private Windows: Allow; granted before the install so the add-on starts with it
	await h.chrome(`return (async () => { const {ExtensionPermissions} = ChromeUtils.importESModule('resource://gre/modules/ExtensionPermissions.sys.mjs'); await ExtensionPermissions.add(arguments[0], {permissions: ['internal:privateBrowsingAllowed'], origins: []}); return 1 })()`, GECKO_ID)
	await h.install(h.extPath)
	env.version = h.version
	await h.openControl()
	await h.api(`await B.storage.local.clear()`)
	if (!headless) {
		let st = await h.selfTestDrag()
		if (!st.ok) { await sleep(3000); st = await h.selfTestDrag() }
		if (!st.ok) { h.noDrags = 'real OS drags do not complete in this session (self-test log ' + JSON.stringify(st.log) + '): screen locked or asleep, mouse touched, or another window on top. Every check that needs a drag is MANUAL for this run.'; console.error('WARNING: ' + h.noDrags) }
		if (!h.noDrags) console.log('drag self-test ok')
	}
	const ctx = {h, OUT, EXT, sleep, savedRec, DAY, tabSel, savedSel, K, Page, headless}
	const all = checks(ctx)
	all.sort((a, b) => (a.late ? 1 : 0) - (b.late ? 1 : 0))
	for (const c of all) {
		if (!wanted(c)) continue
		results.push(await runCheck(c, ctx))
	}
} finally {
	await h.stop()
}

// U01-U04 run the shared upgrade flow lazily, so any one of them works alone
if (!opt('--skip-upgrade')) {
	for (const c of upgradeChecks({OUT, root, buildDir, headless})) {
		if (!wanted(c)) continue
		results.push(await runCheck(c, {}))
	}
}

// --only: comma separated tokens, a check runs when one appears in its id or name
function wanted(c) {
	return !only || only.split(',').some((o) => (c.id + ' ' + c.name).toLowerCase().includes(o.trim().toLowerCase()))
}

async function runCheck(c, ctx) {
	let last, firstFail
	for (let attempt = 1; attempt <= 2; attempt++) {
		const t0 = Date.now()
		try {
			if (c.manual) { last = {status: 'MANUAL', evidence: c.manual}; break }
			const ev = await c.fn(ctx)
			last = {status: 'PASS', evidence: typeof ev === 'string' ? ev : JSON.stringify(ev), flaky: attempt === 2 ? 'passed on the second try' : undefined, firstFailure: firstFail}
			break
		} catch (e) {
			if (e && e.manual) { last = {status: 'MANUAL', evidence: e.message}; break }
			last = {status: 'FAIL', evidence: String(e && e.message || e).slice(0, 1500), flaky: attempt === 2 ? 'failed twice' : undefined, firstFailure: firstFail}
			if (attempt === 1 && !c.noRetry && !process.env.FFCHECK_NORETRY) { firstFail = last.evidence.slice(0, 400); console.log('  retry', c.id, last.evidence.slice(0, 200)); continue }
			break
		}
		finally { c.ms = Date.now() - t0 }
	}
	const r = {id: c.id, item: c.name, patches: c.patches, ...last}
	console.log((r.status + '     ').slice(0, 7), r.id, r.item.slice(0, 80), '-', String(r.evidence).slice(0, 140), r.flaky ? '[' + r.flaky + ']' : '')
	return r
}

writeResults({results, env, started, OUT})
const failed = results.filter((r) => r.status === 'FAIL').length
console.log(`\n${results.filter((r) => r.status === 'PASS').length} pass, ${failed} fail, ${results.filter((r) => r.status === 'MANUAL').length} manual; see tools/firefox-check/out/results.md`)
process.exit(failed ? 1 : 0)
