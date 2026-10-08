# drag-check: real drags against the built extension

The css-baseline harness (`tools/css-baseline/`) drives drags with synthetic DOM events
and a hand-made `DataTransfer`. Those reach the page's handlers whatever the page does
with them, so a drop the browser would never deliver still "works" there. `check.mjs`
runs the drags through Chrome itself instead, against the built extension.

```sh
node build.mjs                          # build/chrome
node tools/drag-check/check.mjs         # every check (185), ~7 min
node tools/drag-check/check.mjs --only "saved tab -> open"
```

It exits 1 when any check fails (and 2 when `build/chrome` is missing). Run it in the gate
of every step that touches drag code.

Forty-two more checks (`--only keys`, own tab, blocks and vertical) press keys with the browser's own
key events (`page.keyboard`) after a ctrl+click: Ctrl+Delete (Cmd on a Mac) deletes selected saved tabs
from their saved windows, Ctrl+Backspace closes selected open tabs, plain Delete and Backspace close and
delete nothing (the search box takes the key, as in 6.x), nothing closes while the search box is focused
and empty and gets plain keys, Ctrl+Backspace in the focused box with text edits the text and closes
nothing, Ctrl+Delete in the focused, empty box closes the selection, and holding, repeating or tapping
Ctrl or Cmd alone leaves the focus where it is. Ctrl+Delete also closes the selection after a search plus
a right-click select (text in the box, focus moved out by the popup) and after an arrow-key select
started in the empty, focused search box. Enter opens the selected saved tabs in one new window in the
shown order, Enter with open tabs still moves them; a double press and a held Enter still open one
window; Enter after an `s:` search (which selects no open tab) opens no window. Ten of them
(`--only undo`) press Ctrl+Z (Cmd+Z on a Mac): with an Undo notice up and text in the focused search box
it takes back the delete and leaves the text; with no Undo notice it is the text's own undo; with two
stacked Undo notices (a move that empties "Taxes", then "Reading" deleted) it takes back the delete
first, then the move, and storage is as before; Ctrl+Z held down (auto-repeat) takes back only the newest of
the two; a delete followed by an emptying move keeps both
notices, and the older notice's Undo button still takes back its delete.

Thirty-four more checks (`--only "drops "`, own tab, Blocks and List) are the drops of Round 3 (patch drops3) and the rule of
Round 4 that selected tabs are always shown: a search, a Ctrl+click on a tab it fades (Bravo) and "Hide non-matching tabs"
leave that tab on screen, faded and selected, with its window (the unselected non-matches, Echo, stay hidden); a real drag
of the four selected tabs onto an open tab, onto a saved window, and Enter, move or copy all four (the drag image says
"4 tabs"); one selected non-matching tab alone is switched to by Enter and opens no window; a new search keeps the tab
selected by hand (selected and on screen, though it matches neither search) and takes back only what the last search
selected (Charlie leaves and hides); a range (Shift+right-click) with the hiding on skips the hidden tab between its ends;
the arrow keys go on from a selected non-matching tab to the next match; an unselected open tab dragged while a saved tab
is selected moves alone, and the saved tab stays selected and on screen with its saved window, also during the drag; the
same for saved tabs (a non-matching Kilo selected with two
matches is dragged out and opened with them by a drag and by Enter, and alone by Enter, the saved window unchanged). Drops that do nothing or only part say why in the red notice:
a normal saved tab or a normal open tab dropped on a saved window that is private (seeded, the headless browser has no
private windows), private and normal saved tabs selected together and dropped on a normal saved window (the normal one moves,
the notice says "1 of 2 saved tabs left out: ..."), and a saved tab deleted from storage after the drag started, dropped on a
saved window and on an open tab. Before Round 4 a drop that is refused for a reason was still taken by the page (to have a drop event to show the notice
with); it is no longer: the notice comes when the drag ends there (see the `notallowed` checks below), and these checks read it after
the release.

Forty-four more checks (`--only notallowed`, own tab, Blocks and List) are the not-allowed cursor of Round 4 (patch notallowed).
Over a target that refuses a drag (a normal tab or saved tab over a private saved window, a private saved tab over a normal one,
a normal open tab over a private open window and the other way round, seeded or, for open windows, told to the popup in
`makePrivate`, as the headless browser has no private windows the extension may see) the page's answer to the last dragover,
read in the page after its handlers have run (`watchDrag`), is a cancelled dragover whose dropEffect is none, no drop marker
or outline anywhere, no drop event at all (the browser delivers none), and a dragend with dropEffect none; the red notice with
the reason comes once, after the release (and not before), and nothing moved. A drag that is not allowed but has no reason to
give (an open tab over its own place, a saved tab over its own place, the last saved tab over the title of its own saved window,
a saved window card over itself) is refused the same way and shows no notice. A refusing target the pointer left again before the
release (onto nothing; onto an allowed target, where it is then dropped; out of the page, where the drag ends) gives no notice. Allowed targets are unchanged: saved
tab over an open tab, open tab over an open tab, open tab over a saved window, saved tab over a saved window, card over card:
allowed, marker, a drop event, the result, no notice; a private tab over its own private window; a drop that is only partly
possible (private and normal saved tabs together over a normal saved window) is allowed and keeps its partial notice.
`drag()` takes `opts.moveOn` (the pointer moves on to another target before the release) and `opts.cancel` (the pointer
leaves the viewport and the drag ends out there with dragCancel, no drop: the page's dragend reports that position).
A dragleave without relatedTarget does not mean the pointer left the page: Chrome sends one to a target that refuses
the release, too.

Sixteen more checks (`--only "drag image"`, own tab) cover the drag image of a several-tab drag in every layout
(blocks, blocks-big, horizontal, vertical), light and dark, for three saved and three open tabs: the stack is
titled rows in List and icon tiles only in the three icon layouts, three tiles with the dragged tab in front and
the count "3 tabs", every tile has a favicon (the page icon for a tab without one), the icon tiles and their
favicons are the size of that layout's own tab tiles, and the front tile has the theme's tile colours.

Nine more checks (`--only title`, every layout: Blocks, Big blocks, Rows, List; own tab, small and real popup) click
a saved window's title with real mouse events (`Input.dispatchMouseEvent`): a title far longer than its card and a
short one, at the start, middle and end of the text. Each click must open the name / colour screen and create no
window, the title must show inside its bar (no bare "..." from the bar's own ellipsis), and a click on the card
away from the title still restores the window.

Six more checks (`--only restore:`, `monitors.mjs`) restore saved windows on two screens: a second
headless Chrome started with `--screen-info={0,0 1920x1080 workAreaBottom=40}{1920,0 1920x1080 workAreaBottom=40}`
(two monitors side by side, a 40 px taskbar each). The popup (`popup.html` in a tab on screen 1) is
hovered over a saved window, the card's landing line is read ("restores maximized on monitor 2 of 2"),
the saved window's restore icon is clicked, and the new window's state and monitor are read back with
`chrome.windows.get`: a window saved maximized on monitor 2 (as Chrome on Windows saves it, -8,-8 and
1936x1056) is maximized on monitor 2, one saved on monitor 1 on monitor 1, a normal one keeps its place,
one saved on a monitor that is not connected is maximized on the popup's, and the card says the same
each time. Two of them give the worker no monitors (an empty list, or an error) while the popup knows
both, the case where a window saved maximized on monitor 2 used to come back on monitor 1: it must
still land on monitor 2. `system.display.getInfo()` crashes headless Chrome on Windows (Chrome 154), so
these checks run a temporary copy of `build/chrome` with the permission granted at install and its
`getInfo()` calls answering the two screens (in the worker: the screens, nothing, or an error); the
placement itself is Chrome's.

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
| selected saved tabs -> open tab * | 11 | Juliett and Mike (two saved windows) open after Charlie; the drag image shows two tiles (titled in List, icons only in the icon layouts), Mike in front, and "2 tabs" |
| saved tab -> open window (no tab) ** | 11 | dropped on the window card's corner, away from its tabs: Kilo opens at the end |
| saved tab -> saved tab (reorder) * | 15 | Kilo moves before India |
| saved tab -> saved card * | 15 | Hotel moves to the end of "Taxes" |
| open tab -> saved tab * | 16 | a copy of Bravo goes before Mike |
| selected open tabs -> saved card * | 16 | copies of Charlie and Delta (two windows) go to the end of "Reading", in the order the popup lists the windows; the drag image shows two tiles (titled or icons only, by layout) and "2 tabs" |
| saved card reorder * | 13 | "Taxes" is listed before "Reading" |
| open tab -> open tab in another Tab Manager page | | the same across pages: Alpha moves before Echo (before this, the other page moved its own selection, here nothing) |
| open tab -> open tab | 6.x | Alpha moves before Echo (a control) |

## Debugging

`DRAG_DEBUG=1` prints the drag data Chrome intercepted, the page's console, and every drag
event the page gets (target, types, `effectAllowed` / `dropEffect`).

What it cannot show: the OS part of a drag (on Windows, the OLE drag loop and its drop
effect negotiation), which `setInterceptDrags` replaces, and Firefox. The drag image is
recorded as the element the page builds, not as the picture the OS draws.
