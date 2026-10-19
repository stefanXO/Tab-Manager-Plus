// Real OS-level mouse input (Windows user32 SendInput via PowerShell). Needed
// for HTML5 drag and drop: Firefox on Windows runs the drag in the OS's own
// DoDragDrop loop, and Marionette's / BiDi's synthesized pointer actions start
// the drag (dragstart, dragenter, dragover fire) but the release never reaches
// that loop, so no drop / dragend. Moving the real cursor does. It takes over
// the physical mouse for the duration of a drag: do not touch the mouse while
// the harness runs.
import {spawnSync} from 'node:child_process'
import {writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'

const PS = `
param([string]$steps, [string]$owners)
Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public static class M {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, int dx, int dy, uint d, UIntPtr e);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [StructLayout(LayoutKind.Sequential)] public struct PT { public int x; public int y; }
  [DllImport("user32.dll")] public static extern IntPtr WindowFromPoint(PT p);
  [DllImport("user32.dll")] public static extern IntPtr GetAncestor(IntPtr h, uint f);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
}
"@
[M]::SetProcessDPIAware() | Out-Null
if ($owners) {
  foreach ($q in ($owners -split ';')) { $c = $q.Split(','); $pt = New-Object M+PT; $pt.x = [int]$c[0]; $pt.y = [int]$c[1]; $h = [M]::GetAncestor([M]::WindowFromPoint($pt), 2); $procId = 0; [M]::GetWindowThreadProcessId($h, [ref]$procId) | Out-Null; $n = (Get-Process -Id $procId -ErrorAction SilentlyContinue).ProcessName; $parentPid = (Get-CimInstance Win32_Process -Filter "ProcessId = $procId" -ErrorAction SilentlyContinue).ParentProcessId; Write-Output ($q + '=' + $n + '=' + $procId + '=' + $parentPid) }
  exit 0
}
foreach ($s in ($steps -split ';')) {
  $p = $s.Split(',')
  switch ($p[0]) {
    'm' { [M]::SetCursorPos([int]$p[1], [int]$p[2]) | Out-Null }
    'd' { [M]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero) }
    'u' { [M]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero) }
    's' { Start-Sleep -Milliseconds ([int]$p[1]) }
  }
}
`
const script = join(tmpdir(), 'tmp-ffcheck-osmouse.ps1')
writeFileSync(script, PS)

// steps: [['m', x, y], ['d'], ['s', ms], ['u']] in physical screen pixels
export function osMouse(steps) {
	const arg = steps.map((s) => s.join(',')).join(';')
	const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, '-steps', arg], {encoding: 'utf8'})
	if (r.status !== 0) throw new Error('osMouse failed: ' + r.stderr)
}

// The process owning the top window at each screen point (no input is sent): [point, name, pid, parentPid]. A drag is refused unless
// the Firefox this harness started is under every point it will press, pass or release on: otherwise the physical mouse would drag
// things in whatever other window sits there, the developer's own Firefox included. firefox.exe on Windows is a launcher whose
// child is the real browser, so the window owner is often the child of the pid we spawned: the parent pid counts too.
const allowed = new Set()
export function allowFirefoxPid(pid) { allowed.add(pid) }
export function forgetFirefoxPid(pid) { allowed.delete(pid) }
export function windowOwners(points) {
	const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, '-steps', 'x', '-owners', points.map((p) => p.x + ',' + p.y).join(';')], {encoding: 'utf8'})
	if (r.status !== 0) throw new Error('windowOwners failed: ' + r.stderr)
	return r.stdout.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [p, n, pid, ppid] = l.split('='); return [p, n, Number(pid) || 0, Number(ppid) || 0] })
}
export function assertFirefoxAt(points) {
	const ours = ([, n, pid, ppid]) => /^firefox$/i.test(n || '') && (allowed.has(pid) || allowed.has(ppid))
	const bad = windowOwners(points).filter((o) => !ours(o))
	if (bad.length) throw new Error('refusing to move the mouse: the window under ' + bad.map(([p, n, pid, ppid]) => '(' + p + ') is ' + (n || 'unknown') + ' pid ' + pid + ' (parent ' + ppid + ')').join(', ') + ', not the Firefox this harness started (allowed pids: ' + [...allowed].join(', ') + '; something covers the test window)')
}

// a straight drag from a to b (screen px): press, move in steps, hold, release
export function osDrag(a, b, {steps = 14, hold = 250} = {}) {
	const list = [['m', a.x, a.y], ['s', 120], ['d'], ['s', 80]]
	// first nudge starts the drag
	list.push(['m', a.x + 6, a.y + 6], ['s', 60], ['m', a.x + 14, a.y + 12], ['s', 60])
	for (let i = 1; i <= steps; i++) list.push(['m', Math.round(a.x + (b.x - a.x) * i / steps), Math.round(a.y + (b.y - a.y) * i / steps)], ['s', 30])
	list.push(['m', b.x + 1, b.y + 1], ['s', hold], ['m', b.x, b.y], ['s', hold], ['u'])
	// the ownership check covers every point the mouse will actually visit, not a sample of the line
	assertFirefoxAt(list.filter((s) => s[0] === 'm').map(([, x, y]) => ({x, y})))
	osMouse(list)
}
