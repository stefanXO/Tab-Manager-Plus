# firefox-check: the Firefox pass, in a real Firefox

Automates the "Firefox pass" of `plans/sessions/TESTING.md` against `build/firefox`, plus smoke, search, keyboard,
Minimize inactive windows and an upgrade from 5.2.4. It starts its own Firefox with a fresh profile under `out/`
(never your profile, never Chrome) and loads the add-on as a temporary add-on.

```sh
node tools/firefox-check/run.mjs                 # builds build/firefox, runs everything, ~15 min
node tools/firefox-check/run.mjs --no-build --only F21,K0     # comma separated ids or words
node tools/firefox-check/run.mjs --skip-upgrade  # without the 5.2.4 download and upgrade
node tools/firefox-check/run.mjs --headless      # no desktop window: every check that needs a real drag is MANUAL
```

`FFCHECK_NORETRY=1` runs each check once (no second try on failure). Real mouse input only goes to the Firefox the harness
started: a drag is refused when another process's window (your own Firefox included) is under any point of it.

Needs Firefox at `C:\Program Files\Mozilla Firefox\firefox.exe` (or `FIREFOX_PATH`), `gh` for the 5.2.4 download, Windows
(the drag part uses `user32`). **It moves the real mouse cursor for real OS drags: do not use the mouse while it runs.**

Output: `out/results.md` (table per checklist item, failures, flakiness, MANUAL list), `out/results.json`, a screenshot per check.
Exit code 1 if any check fails. A failing check is re-run once; "passed on the second try" is listed as flaky.

Files: `run.mjs` (runner), `checks.mjs` (the checks), `upgrade.mjs` (5.2.4 to 7.0.0), `lib.mjs` (Firefox, fixtures, page driver),
`marionette.mjs` (Marionette client; BiDi cannot screenshot or type into `moz-extension://` pages), `osmouse.mjs` (real mouse for drags),
`report.mjs` (writes `out/results.md` and `results.json`; an optional `notes.md` next to it is appended to the report).
