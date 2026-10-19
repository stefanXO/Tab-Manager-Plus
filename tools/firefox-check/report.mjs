// results.md: the Firefox pass checklist (plans/sessions/TESTING.md) item by item, with what the run found.
import {writeFileSync, readFileSync, existsSync} from 'node:fs'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

// the 27 checklist items (short wording, patch numbers) and the checks that cover them
export const CHECKLIST = [
	[1, '(important) Drag a saved tab onto an open window\'s tab: toolbar popup, sidebar, own tab; opens in background, header "Opened 1 saved tab in ...", marker [11, 18]', ['F01-tab', 'F01-panel', 'F01-small', 'F01h-tab', 'F01h-panel'], 'real toolbar popup and real sidebar: MANUAL M1, M2'],
	[2, 'Drag a saved tab onto a non-target (header, search box): nothing happens, no page, no tab, no address typed [11]', ['F02-searchbox', 'F02-header']],
	[3, 'Drag a saved window card onto the search box: no name typed [13]', ['F03']],
	[4, 'Reorder cards by dragging a card by its title: bar, order changes, kept after reopen [13]', ['F04']],
	[5, 'Saved tab onto saved tab / tab of another saved window / card title: reorder, move, append [15]', ['F05a', 'F05b', 'F05c']],
	[6, 'Open tab onto a saved tab and onto a card title: copy added, "Added 1 tab to ..." [16]', ['F06a', 'F06b']],
	[7, 'Ctrl+click 2 saved tabs and drag one: stack of 2 tiles, "2 tabs" under the pointer [18]', ['F07'], 'how the stack looks under the pointer: MANUAL M5'],
	[8, 'Drag a saved tab from page 1 onto an open tab in page 2 (own tab); open tab across with other tabs selected: only the dragged tab moves [18]', ['F08a', 'F08b']],
	[9, 'Drag all tabs of one saved window onto another: Removed "..." (left empty) with Undo; Undo; "saved just now" [15, 25]', ['F09']],
	[10, 'Save a window with about:blank + about:preferences: keeps about:blank, drops about:preferences; restore opens about:blank [14]', ['F10']],
	[11, 'Select about:preferences + normal tab, drag onto saved window: one copy, header says 1 tab could not be saved [16]', ['F11']],
	[12, 'Select only about:preferences, "Save selected tabs": nothing saved, no error; with a normal tab: saved without it [10]', ['F12']],
	[13, 'Sidebar + own tab: delete 2nd tab (countdown) in one, drag an open tab in front of the first in the other: deleted stays gone, copy stays [17]', ['F13']],
	[14, 'Delete a saved window, close the popup within 8 s, reopen: gone; one saved just before is still there [03, 17]', ['F14']],
	[15, 'Popup Import says use options/own tab; options import notice; Export Sessions + Save debug file download; the everything file imports [02, 19, 24]', ['F15a', 'F15b', 'F24'], 'the real toolbar popup itself: MANUAL M1'],
	[16, 'Private window: select one normal + one private tab, Save selected tabs: two saved windows, normal first; restore the private one: opens private [10]', ['F16'], 'granting the permission through about:addons: MANUAL M3'],
	[17, 'Private open tab onto a normal saved window: not-allowed cursor, no marker, red notice; private saved tab onto a normal open window opens [11, 16, 37, 40]', ['F17a', 'F17b'], 'the not-allowed CURSOR: MANUAL M4'],
	[18, '(important) about:preferences + normal tab onto a saved window: one copy + red "1 of 2 tabs left out: 1 about: page can\'t be saved on Firefox"; only about: tab: "Nothing added ..." [37]', ['F18']],
	[19, 'Type `alpha OR charlie`, Ctrl+click a faded tab, Hide non-matching: selected tab stays; drag a selected match: all selected move, stack counts them [39]', ['F19']],
	[20, 'Saved cards and hover cards look right (dashed edge, saved icon, faded favicons, map with dashed rectangle) [05, 06, 08]', ['F20'], 'MANUAL M6'],
	[21, '(important) Sidebar keys: plain Delete closes nothing, Ctrl+Delete closes all three, text stays; Ctrl+Backspace in the box edits text; Ctrl+Delete on 2 saved tabs: Undo [23, 26, 28]', ['F21a', 'F21a2', 'F21b', 'F21c']],
	[22, 'Ctrl+click saved tabs of two windows + Enter: one window in the order shown; `s:` + word + Enter; filter on with a non-matching selected [23, 26, 39]', ['F22a', 'F22b', 'F22c']],
	[23, 'Delete a saved window: bar stops over the notice, close writes at once; Ctrl+Z brings it back; (important) with text in the box Ctrl+Z restores and leaves the text [24, 36]', ['F23a', 'F23b', 'F23c', 'F23d']],
	[24, 'Options import: non-JSON -> red notice; good file -> grey "N saved windows restored"; format "other" -> grey with "not in Tab Manager Plus\'s format" [24, 34]', ['F24']],
	[25, '`s:`/`-s:` searches as in Chrome, help lists the rows, `s:u:github`, `s: t:tax`, saved windows off: plain text [20, 30, 35]', ['F25a', 'F25b', 'F25c', 'F25d', 'F25e', 'F25f', 'F25g']],
	[26, 'Maximize a window, save, restore: opens maximized on the same monitor, hover card says "restores maximized" [21]', ['F26'], 'same MONITOR (needs 2 monitors): MANUAL M7'],
	[27, 'Ctrl+click 2 open tabs in Blocks, drag one: icon stack with "2 tabs" under the pointer [29]', ['F27'], 'how the stack looks under the pointer: MANUAL M5'],
]
export const EXTRA = [
	['Smoke', ['S01', 'S02', 'S03', 'S04', 'S05', 'S06']],
	['Cross-page drops onto a saved window (Chrome pass section 8, item 3; not in the Firefox list)', ['F08c1', 'F08c2']],
	['Search syntax', ['Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q06']],
	['Keyboard', ['K01', 'K02', 'K03', 'K04', 'K05', 'K06', 'K07']],
	['Minimize inactive windows (changelog, Firefox)', ['F28']],
	['Upgrade 5.2.4 -> 7.0.0', ['U00', 'U01', 'U02', 'U03', 'U04']],
]

const roll = (rs) => {
	if (!rs.length) return 'NOT RUN'
	if (rs.some((r) => r.status === 'FAIL')) return 'FAIL'
	if (rs.some((r) => r.status === 'MANUAL')) return 'MANUAL (rest PASS)'
	return 'PASS'
}
const cell = (s) => String(s).replace(/\|/g, '/').replace(/\n/g, ' ')

export function writeResults({results, env, started, OUT}) {
	const by = new Map(results.map((r) => [r.id, r]))
	const lines = []
	const mins = ((Date.now() - started) / 60000).toFixed(1)
	lines.push('# Tab Manager Plus ' + env.buildVersion + ' on Firefox: automated Firefox pass', '')
	lines.push('Firefox ' + env.version + ' (Windows), build/firefox ' + env.buildVersion + ', loaded as a temporary add-on (Marionette Addon:Install, as about:debugging does), fresh profile under tools/firefox-check/out/, add-on allowed in private windows (granted before install), run took ' + mins + ' min.', '')
	lines.push('## Checklist ("## Firefox pass" in plans/sessions/TESTING.md)', '', '| # | item [patches] | result | evidence |', '|---|---|---|---|')
	for (const [n, text, ids, note] of CHECKLIST) {
		const rs = ids.map((i) => by.get(i)).filter(Boolean)
		const ev = rs.map((r) => r.id + ': ' + r.status + ' - ' + String(r.evidence).slice(0, 260)).join(' // ') + (note ? ' // ' + note : '')
		lines.push(`| ${n} | ${cell(text)} | ${roll(rs)} | ${cell(ev)} |`)
	}
	lines.push('', '## Extra checks', '', '| group | id | check | result | evidence |', '|---|---|---|---|---|')
	for (const [group, ids] of EXTRA) for (const id of ids) {
		const r = by.get(id)
		if (!r) { lines.push(`| ${cell(group)} | ${id} | | NOT RUN | |`); continue }
		lines.push(`| ${cell(group)} | ${id} | ${cell(r.item)} | ${r.status}${r.flaky ? ' (' + r.flaky + ')' : ''} | ${cell(String(r.evidence).slice(0, 600))} |`)
	}
	const fails = results.filter((r) => r.status === 'FAIL')
	lines.push('', '## Failures (raw)', '')
	if (!fails.length) lines.push('none')
	for (const r of fails) lines.push(`- **${r.id}** ${r.item}: ${String(r.evidence).replace(/\n/g, ' ')}${r.firstFailure && r.firstFailure !== r.evidence ? ' (first try: ' + r.firstFailure.replace(/\n/g, ' ') + ')' : ''}`)
	const flaky = results.filter((r) => r.flaky)
	lines.push('', '## Flaky (needed the second try, or failed both)', '')
	if (!flaky.length) lines.push('none')
	for (const r of flaky) lines.push(`- ${r.id}: ${r.flaky}${r.firstFailure ? ' (first failure: ' + String(r.firstFailure).replace(/\n/g, ' ').slice(0, 300) + ')' : ''}`)
	const notes = join(here, 'notes.md')
	if (existsSync(notes)) lines.push('', readFileSync(notes, 'utf8'))
	writeFileSync(join(OUT, 'results.md'), lines.join('\n') + '\n')
	writeFileSync(join(OUT, 'results.json'), JSON.stringify({env, results}, null, 1))
}
