# drag-check: real drags against the built extension

The css-baseline harness (`tools/css-baseline/`) drives drags with synthetic DOM events
and a hand-made `DataTransfer`. Those reach the page's handlers whatever the page does
with them, so a drop the browser would never deliver still "works" there. `check.mjs`
runs the drags through Chrome itself instead, against the built extension.

```sh
node build.mjs                          # build/chrome
node tools/drag-check/check.mjs         # every check, ~75 s
node tools/drag-check/check.mjs --only "saved tab -> open"
```

It exits 1 when any check fails (and 2 when `build/chrome` is missing). Run it in the gate
of every step that touches drag code.

Thirty-four more checks (`--only keys`, own tab, blocks and vertical) press keys with the browser's own
key events (`page.keyboard`) after a ctrl+click: Ctrl+Delete (Cmd on a Mac) deletes selected saved tabs
from their saved windows, Ctrl+Backspace closes selected open tabs, plain Delete and Backspace close and
delete nothing (the search box takes the key, as in 6.x), nothing closes while the search box is focused
and empty and gets plain keys, Ctrl+Backspace in the focused box with text edits the text and closes
nothing, Ctrl+Delete in the focused, empty box closes the selection, and holding, repeating or tapping
Ctrl or Cmd alone leaves the focus where it is. Ctrl+Delete also closes the selection after a search plus
a right-click select (text in the box, focus moved out by the popup) and after an arrow-key select
started in the empty, focused search box. Enter opens the selected saved tabs in one new window in the
shown order, Enter with open tabs still moves them; a double press and a held Enter still open one
window; Enter after an `s:` search (which selects no open tab) opens no window.

## What it does

- Starts its **own headless** Chrome for Testing (the newest under `~/.cache/puppeteer/chrome`,
  or `CHROME_PATH`) with a fresh temporary profile, and installs `build/chrome` unpacked
  (`Extensions.loadUnpacked` over the pipe; branded Chrome ignores unpacked extensions on the
  command line since 137). It never connects to a running Chrome (no port 9222, no
  `DevToolsActivePort`) and never opens a visible window.
- Serves a few pages from `127.0.0.1` (`/p/<name>`, titled `<name>`), and before every check
  makes the same fixture with the real APIs: two open windows (Alpha, Bravo, Charlie / Delta,
  Echo, Foxtrot), two saved windows in `storage.local` ("Reading": Hotel, India, Juliett,
  Kilo; "Taxes": Lima, Mike, November), saved windows on, animations on (the default).
- Opens the popup three ways: in its own tab (1100x1400, everything visible), as
  `popup.html?popup` in a tab at 800x600 (the target is scrolled to during the drag), and as
  the toolbar button's real popup (`chrome.action.openPopup()`, `popup.html?popup=true`).
- Each drag: the mouse is moved, pressed and moved over the source with
  `Input.dispatchMouseEvent`. Chrome starts the html5 drag itself (dragstart runs in the page
  with the page's own `DataTransfer` and `effectAllowed`); `Input.setInterceptDrags` hands the
  drag back to the script instead of to the OS, and `Input.dispatchDragEvent` delivers
  dragenter, a dragover every ~24 px along the way, a few on the target and the drop, where
  the OS would. Chrome then does what it does for any drag: the elements on the way get their
  enter / leave events, a target that does not accept the drop (no `preventDefault` on
  dragover, a `dropEffect` the source does not allow) gets no drop, and the drop event's
  data is the data the page set.
- The result is read back from the real tabs (`chrome.tabs.query`), from `storage.local` and,
  for drops on open windows, from what the popup shows.

## The checks

In the own tab, blocks and List; the ones marked * also in the small popup (blocks) and the
real popup (List), ** only in one of them:

| Check | Patch | Expects |
|---|---|---|
| saved tab -> open tab * | 11 | India opens before Echo; the popup shows it there |
| saved by the save button -> open tab ** | 11 | a window saved with its save button; its Bravo dropped before Echo opens there |
| saved tab -> open tab in another Tab Manager page | 11 | the drag leaves one popup tab and is dropped in another one, which never saw it start: India still opens before Echo |
| selected saved tabs -> open tab * | 11 | Juliett and Mike (two saved windows) open after Charlie; the drag image shows two tiles, Mike in front, and "2 tabs" |
| saved tab -> open window (no tab) ** | 11 | dropped on the window card's corner, away from its tabs: Kilo opens at the end |
| saved tab -> saved tab (reorder) * | 15 | Kilo moves before India |
| saved tab -> saved card * | 15 | Hotel moves to the end of "Taxes" |
| open tab -> saved tab * | 16 | a copy of Bravo goes before Mike |
| selected open tabs -> saved card * | 16 | copies of Charlie and Delta (two windows) go to the end of "Reading", in the order the popup lists the windows; the drag image shows two tiles and "2 tabs" |
| saved card reorder * | 13 | "Taxes" is listed before "Reading" |
| open tab -> open tab in another Tab Manager page | | the same across pages: Alpha moves before Echo (before this, the other page moved its own selection, here nothing) |
| open tab -> open tab | 6.x | Alpha moves before Echo (a control) |

## Debugging

`DRAG_DEBUG=1` prints the drag data Chrome intercepted, the page's console, and every drag
event the page gets (target, types, `effectAllowed` / `dropEffect`).

What it cannot show: the OS part of a drag (on Windows, the OLE drag loop and its drop
effect negotiation), which `setInterceptDrags` replaces, and Firefox. The drag image is
recorded as the element the page builds, not as the picture the OS draws.
