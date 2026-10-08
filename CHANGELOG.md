7.0.0
=====
A Brand New Look!
- Every layout redesigned: Block view is a grid, List view (was Vertical) shows one tab per line, Rows view (was Horizontal) one window per row (#264)
- Dark theme rebuilt with consistent colors; window colors show as a colored edge; scrollbars and controls are dark too; the active tab has a clear outline (#45, #67, #99, #147, #151, #241)
- Theme: System, Light or Dark. System is the new default and follows your operating system's dark mode, also while the popup is open; if you had dark mode on, it stays dark (#84, #182)
- New window color palette, with a matching set for the dark theme
- New icons: every toolbar, window and options icon redrawn, crisp at any zoom in light and dark, with an icon for each setting, a recent-tabs clock whose three steps light up as it reaches further back, and an eye that shows when non-matching tabs are hidden
- Favicons: white icons stay visible in the light theme, and icons refresh when a tab finishes loading (#220, #251)
- Badges show a tab's state: playing sound, muted, asleep (put to sleep by the browser), pinned, active, selected. In List view as chips with a colored edge on the left (#171)
- List view shows how recently each tab was used: four small bars at the right of the row, filled from the right and fading with age (green for the last minutes, grey after a week); hover them for the exact time (#40)
- Windows show when they were last active, saved sessions when they were saved
- Subtle animations when they are on: windows and tabs fade in, state changes ease instead of snapping, a playing row breathes

Faster
- The popup opens with its final layout, theme and windows in the first frame instead of filling in afterwards
- The popup script is about 40% smaller
- Tab changes show up immediately
- Typing right after opening the popup no longer loses the first characters (#122)

Searching And Duplicates
- Highlight Duplicates selects only the extra copies and keeps the one you used last, so Ctrl+Delete (Cmd+Delete on a Mac) closes just the duplicates (#54, #142, #188, #240, #248, #260)
- The header shows how many tabs have duplicates and how many are selected
- Searching while duplicates are highlighted searches within them
- Pasting a search term, or editing in the middle of it, now searches the right tabs
- Clearing the search field no longer shows matches for an empty search
- Search in titles only with `t:word`, in urls only with `u:word`
- Exclude tabs from a search with `-word`, also `-u:word`
- Search for a phrase with a space by quoting it: `"pull request"` (#224)
- Search with a regular expression: `/\(\d+\)/` finds tabs with an unread count, `/localhost:\d+/` local dev servers, `/\.pdf$/` open PDFs (#156, #194, #247)
- Hover the search box for the whole search syntax
- List view shows the part of a title that matched the search in bold
- Highlight recently active tabs: the new clock button in the bar selects the tabs you used last: the shortest span (15 minutes, an hour, 3 hours, 12 hours, a day, 2 days ...) with more than one tab in it. Click again to reach further back, twice more (one more step lights up under the clock each time), a fourth click turns it off (#203)

Windows And Sessions
- Automatic window names come from the sites in the window, with proper spelling (GitHub, Stack Overflow, Gmail, Google Docs), no more "Facebook, facebook & 5 more"
- Window names and colors survive a browser restart, even when the window's tabs changed since (#16, #50, #103, #159, #178, #195, #223, #232, #236, #244)
- Names and colors of windows closed for more than a day are cleaned up, so a new window cannot inherit an old name (#103, #244)
- Restored windows keep their size and position, fitted to the screen they are restored on; a window saved maximized comes back maximized on the monitor it was saved on when that monitor is connected, else on the monitor you restore from; the hover card of a saved window shows the same (#205, #207, #208)
- Restoring a window in own-tab mode scrolls to it
- Saved sessions could be lost when the update from version 5 was interrupted, e.g. by closing the popup
- Saved sessions are no longer limited by the browser's 10 MB storage quota, and showing a session no longer changes it (which could corrupt exports)
- Enabling the sessions feature shows your saved windows right away
- Importing a backup says how many saved windows it restored and how many it skipped, and why (#39); saved windows that are already there (the same tabs in the same order) are not imported twice and are counted as already there
- Exported files are named sessions-YYYY-MM-DD-HH-MM-SS.json (saved windows) and everything-YYYY-MM-DD-HH-MM-SS.json (debug export, which also holds your saved windows); both files carry the format "tab-manager-plus-export", and Import Sessions reads both, older backup files and the files of earlier test builds
- Deleting a saved window can be undone: it disappears at once and a notice offers Undo, with Ctrl+Z (Cmd+Z on a Mac) shown as key caps, while a bar drains smoothly over 8 seconds; the countdown waits while the mouse is over the notice, its close button removes the window for good at once, and it is also removed when the countdown ends or the popup closes
- Errors show in the same kind of notice, with a red edge: a save or rename the browser refused (full browser storage), a sessions file that could not be read or imported, saved tabs that could not be opened, a saved window that could not be restored; they replace the red text in the header and the note under the file picker. Starting an import closes the notices and writes a pending delete first
- Saved windows can be renamed and recolored with the same name and color screen as open windows, from the color button on the saved window's card or by clicking its name; the popup scrolls back to the saved window afterwards, and a saved window without a name of its own always shows the automatic name made from its tabs now (#172)
- Saved windows are switched on by default (no longer called beta or experimental in the settings), also after the update from 6.x when no saved window is stored; the switch in the options still turns them off
- Ctrl+click or right-click on a tab of a saved window selects it, instead of an unrelated open tab that Ctrl+Delete would then close; saved windows are no longer marked as the active window
- Tabs of saved windows can be deleted: select them, then use the trash button or Ctrl+Delete or Ctrl+Backspace (Cmd on a Mac); a saved window with no tab left is deleted, and the same Undo notice applies (#180). The same keys close selected open tabs, as the trash button does. Plain Delete and Backspace stay typing and go to the search box; in a search box that has the focus and holds text, Ctrl+Backspace and Ctrl+Delete delete a word as usual and close nothing, so "search, select results, Ctrl+Delete" works once you right-click a result or use the arrow keys (selecting takes the focus out of the search box, typing puts it back). Enter with saved tabs selected opens them in one new window, in the order shown; Enter after a search that selected no open tab does nothing instead of opening an empty window
- Selected tabs can be saved as a new saved window, named from their sites: the new button next to "Move tabs to new window" in the bottom bar (#201)
- Tabs of saved windows can be dragged into an open window: dropped on a window or next to one of its tabs, the tab opens there (all selected saved tabs, when the dragged one is selected), and the saved window keeps it, also when dropped in a Tab Manager tab or sidebar other than the one the drag started in
- Dragging several tabs (open or saved) shows them as a small stack of tabs with their number under the mouse: with titles in the List view, icons only in the views that show tabs as icons, as big as that view's tabs
- Tabs of saved windows can be reordered: drag one before or after another tab of the same saved window, onto a tab of another saved window to move it there, or onto another saved window's title or edge to add it at the end; selected saved tabs move together and stay selected, a saved window left with no tab is removed with an Undo notice that puts the tabs back and brings the window back with its name and color, and tabs do not move between private and normal saved windows
- Open tabs can be added to a saved window: drag a tab (all selected tabs, when the dragged one is selected) onto a tab of a saved window to put a copy before or after it, or onto the saved window's title or edge to add it at the end; the open tabs stay open (#192)
- Saved windows can be put in any order: drag a saved window by its edge or title and drop it before or after another one; a marker shows where it goes, newly saved and imported windows are listed first, and the ones saved before are listed newest first
- On Firefox, saving a window keeps its about:blank tabs
- Saved windows look different from open windows: a dashed edge, a saved icon before the name, and faded favicons that regain their color under the mouse; they are no longer dimmed as a whole, so their tabs stay readable
- Resting the mouse on a tab of a saved window shows a card like an open tab's: when it was saved, its place in the saved window, and the windows it is open in right now; an open tab's card lists the saved windows that also hold it
- Resting the mouse on a saved window shows a card like an open window's: its tabs and sites, when it was saved, the size and state it was saved with, and a map of the monitors showing where it would land if restored now
- Saved windows remember when their tabs last changed (tabs moved in, out or within them, added or deleted; not a new name or color): the card's "saved … ago" counts from then, and the hover cards show "created … ago" and "last saved … ago" when the two differ
- Search finds tabs in saved windows too: matching saved tabs stay clear while the others fade (or hide, with Hide non-matching tabs on, together with saved windows that have no match, instead of all saved windows disappearing), and the header counts them; a search never selects them
- `s:` in the search box limits what follows it to saved windows: `s:tax` (title or url), `s:u:github` (url only), `s:t:tax` (title only), `s:"pull request"` and `s:/\.pdf$/` match saved tabs only, never open ones, and with Hide non-matching tabs on, the open windows hide. A bare `s:` followed by other terms (`s: u:github t:tax`) limits the whole search to saved windows. `-s:` leaves the saved windows out (open tabs only), `-s:word`, `-s:u:x` and `-s:t:x` leave out the matching saved tabs. The `s:` rows of the search help and its tip are hidden while saved windows are switched off
- The window order no longer resets on its own; the current window is always listed first and marked, also as a popup
- Clicking the icon while Tab Manager Plus is already open in a tab switches to that tab
- The "switch to previous tab" shortcut works again (#37, #108, #238)

Smaller fixes
- Settings, window names and colors no longer revert to an older state when the popup opens while they are being changed (#126, #131)
- Clicking a tab or a window in the popup switches to it every time, and clicking a tab of a saved session opens it; after the browser sat idle for a while, the first click only closed the popup (#242, #246, #252)
- Closing, discarding or moving selected tabs works even when one of them was closed in the meantime
- Window names and colors changed in the background refresh in the popup
- Hover texts: restored when moving from a tab back to its window, sessions have one too, tab counts and plurals are right (#121, #183)
- The drop indicator when dragging a tab fits every layout and shows in the dark theme; the color picker lists colors in order (#97)
- A tab dragged from one Tab Manager tab or sidebar into another moves that tab, instead of the tabs selected in the other one
- The window name and color screen covers the whole popup, its close button shows a pointer and Escape closes only that screen
- Firefox-based browsers (LibreWolf, Zen, Waterfox) are detected as Firefox

Tab And Window Info
- Hold the mouse on a tab to see when it was last used, its state (asleep, muted and why, playing, pinned), its position, which tab opened it, copies in other windows and its zoom
- Hold the mouse on a window for its tab counts, sites, last activity, oldest and newest tab, size, and a small map of your monitors showing where the window is
- The card follows the mouse and switches instantly between tabs; Escape closes it
- Chrome: "Show all monitors" in the options draws every monitor on that map (asks for the monitor permission)
- Hovering and switching layouts are much faster in the popup with many windows and tabs

Options
- The options list each keyboard shortcut with its current key, or "Not set"
- "Donate and Rate buttons" in the options hides those two buttons at the top of the popup
- New default keys for new installs, as the browser took the old ones: Alt+Shift+M opens Tab Manager Plus, Alt+Shift+, switches to the previous tab (Ctrl+Shift+M and Ctrl+Shift+, on Mac). Existing installs keep their keys
- The switches are readable in the dark theme and scale with the browser's zoom (#69)
- Hovering anywhere over an option shows its help text in the header, and it stays while the mouse is there; Popup size, Incognito, Shortcut and What's new have help texts too
- Enter no longer opens a new window while the options or the window color screen are open
- The changelog page follows the dark theme
- The tip in the header no longer changes while the popup is loading
- Advanced settings: Export tabs for debugging saves a JSON file with your windows, tabs and settings, to attach to a bug report

Firefox
- "Minimize inactive windows" works on Firefox: keeps one window active, the others (on every monitor) are minimized (#28)
- The options explain how to allow Tab Manager Plus in private windows and show whether it is allowed; "Change shortcut key" opens Firefox's shortcut settings (#33, #166)

6.0.0 (2024-10-01)
=====
- You can now open single tabs from your saved sessions
- Experimental: Try to restore window names and colors after a browser restart
- Fix: Vertical layout takes now the full width in popups
- Fix: Vertical view has now nicer separators when used in full window, that take the whole screen width
- Fix: Sometimes favicons would not load properly
- Fix: Make sure session tabs are fully restored before closing the popup
- Fix: Moving many tabs could stop early because of popup closing in the meantime
- Fix: Closing many tabs could stop early because of popup closing in the meantime
- Fix: Discarding many tabs could stop early because of popup closing in the meantime
- Fix: Selecting a color for a window would hide all other windows until the next open
- Fix: Windows that were saved out of bounds of the current monitor, could not be restored
- Fix: Windows that were too big for the current monitor, would not be restored
- Fix: Don't animate scrolling if animations are disabled
- Fix: Dragging tabs would sometimes drop them in the wrong location, now they will be added to the closest tab in the new window
- Fix: Favicons sometimes stuck, based on browser cache
- Fix: Also use favicon url based on pending url if tab is loading
- Fix: Don't attempt to show empty favicon
- Fix: pending urls not being read when calculating window title
- Fix: window title not updating after tabs fully loaded
- Fix: IPs being shown as weird numbers in window title/name
- Fix: title being based on whole url, instead of hostname while tab was loading
- Fix: Try to find nicer window title if it matches hostname
- Fix: Group by top-Ips, like 192.168.*.*
- Fix: If you selected incognito tabs and normal tabs based on a search, and tried to move them to one window then it
  would fail because they can't be mixed together. Now it will open 2 windows - one with normal tabs, one with incognito
  tabs.

5.3.0 (2024-09-22)
=====
- Fix: Move to manifest v3

5.2.1 (2024-09-22)
=====
- Fix: White page crash when tab had no hostname / title

5.2.0 (2020-06-22)
=====
- Improves search! Searching for "google mail" will highlight tabs that have both words included #107
- Improves search! Searching for "google OR mail" will highlight tabs that have either of the worlds included #106
- Fix: Searching for the same string length would not trigger another search, but that could have stopped an accent selection #93
- Shift-right click will now select tabs in between the last selected tab #104 #94
- Design Fix: default font size set to 16px
- Firefox: Experimental Sidebar/Panel support added! #60
- Firefox: Restore sessions will throw warning when trying in the popup
- Default popup size increased to 800x600
- Default design changed to blocks
- Improvements: Background clean up added, to keep resources low
- Improvements: Don't render windows in the background while the color/title selection is active
- Improvements: Warn when trying to backup empty sessions #98
- Fix: Doesn't allow users to export empty session files, shows a warning instead
- Fix: Don't show import/export options for sessions if the feature is not enabled #98
- Fix: Make it more obvious that you can type right away #86
- Fix: Pluralization fixes when only 1 tab was selected #87
- Firefox: Fix: Don't allow to import from the popup due to a Firefox bug. Show warning instead #57 #96

5.1.6 (2020-04-28)
=====
- Fix: Pressing "enter" or "return" when only one tab is selected, should focus that tab properly in Firefox
- Reduce options that would be restored in sessions, to limit conflicts
- Make inputs selectable in Firefox! You can now select text again in title, search and option inputs, etc.

5.1.5 (2020-04-26)
=====
- Feature: Changing the name of a window will set change the windows' title in Firefox as well
- Dark mode has now dark input fields, to ease the eye strain
- Slight design and color adjustments
- Fix: Clicking on a window/tab would not focus it properly in Firefox
- Fix: Rendering fixes in Firefox for vertical scrolling
- Fix: Properly close title/color popup after pressing enter/escape ( instead of closing the TMP popup )
- Fix: When selecting a tab in dark mode, the text was unreadable
- Fix: Changed the way how tabs are counted - sometimes it was possible to open more tabs per window than allowed
- Fix: When hovering in Firefox, the window help text would not be displayed in the top

5.1.4 (2020-04-16)
=====
- Moving multiple tabs would sometimes not work when using the button or [Enter] key. This should be fixed now

5.1.3 (2019-11-04)
=====
- Fix: Popup width adjustable again instead of stuck to 800px
- Fix: Only open the popup from context menu if current browser supports it

5.1.2 (2019-11-04)
=====
- Overworked and more friendlier context menu. You can now open the popup from the context menu, if opening as own tab is the default. You can now also access the changelog from the context menu
- Increase popup size/width steps to 25
- Fix: Hide saved windows when a filter is active
- Fix: Don't break rows on tabs based on the hidden tabs
- Fix: Sometimes when using the keyboard the tabs would not highlight properly. This should be resolved now.
- Fix: Background color for dark mode.
- Performance improvements, such as not rendering hidden tabs to the DOM

5.1.1 (2019-11-01)
=====

- Fix: The "highlight duplicate tabs" button may have disappeared - it should be back now

5.1.0 (2019-10-31)
=====

- You can now see which tabs are playing sounds and/or music. For this you need to have the "animations" option turned on. The tabs with active sounds will pulsate
- You can see now which tabs have been discarded by the browser to save memory - the icons will lose their color if they are in a discarded / memory-saving state
- You can also discard tabs well. Simply select one or more tabs, and press the "discard tabs" button in the bottom right corner
- New keyboard possibilities : Use the arrow keys to jump between tabs and windows. Use shift+arrow keys to select tabs. Press Escape to delete a search / unselect everything at once.
- The big block view has now bigger icons. Easier to read on TVs and big resolutions
- Small design fixes for dark and compact modes and the options page
- Fix: Sometimes switching to a tab would not focus the new window properly
- Fix: Sometimes "open in own tab" would not focus on the tab correctly if it was already open
- Fix: Sometimes the bottom search bar would disappear / be pushed below. This should be resolved now
- Scroll to the new window when restoring it from saved windows
- Scroll to the new saved window when saving it
- When drag and dropping a tab outside of Tab Manager Plus into another program or the browser ( which is not really intended/supported ) it will now paste the URL on drop
- Under the hood : A rewrite of the extension and upgrade to the latest React version. A big change under the hood with slight performance improvements
- General performance improvements
- More options texts regarding shortcuts

5.0.8 (2019-10-28)
=====

- You can now backup and restore your saved windows
- You can now select multiple tabs by using right mouse click while holding shift/ctrl or command. Select the first tab with a right click, and then select the last tab with shift+right mouse click, to select all the tabs in between.
- You can now set in the options if you'd like to have the Tab Manager open as a popup by default, or in its' own tab
- Design fixes to have the right amount of tabs per row displayed in the block view
- Stops auto-scrolling to the first active tab, if the user has already started scrolling
- Some small fixes to make sure we load correctly also on slower machines
- Fixes to dark mode in its' own tab - the background was not displayed in the full window
- Removed buggy animation transitions that would get stuck on hover

5.0.7 (2019-10-25)
=====

- Dark mode - you can now enable the dark mode in the options!
- Close the popup when clicking on a tab, window or restoring a session, but don't close it when we're in a Tab Manager page of its own

5.0.6 (2019-10-25)
=====

- Fixed issue where current tab wouldn't be closed when pressing the "close tabs" button
- Backwards compatibility with older browser versions

5.0.5 (2019-10-23)
=====

- Removed unnecessary chrome permission
- Slight performance improvements

5.0.4 (2019-10-23)
=====

- Save/restore windows ( beta ) - you can now save and restore windows into your local storage. Please note : History of the tabs will not be preserved. ( Disabled by default )
- Fixes for search box displays on some configurations
- Adjustments for wide screens
- Various other small fixes
- Close popup after pressing enter

5.0.3 (2019-08-15)
=====

- Added context menu to open Tab Manager in its' own tab
- Small fixes for icon borders not rendering properly
- Fixes for the search bar when the popup is too narrow
- Added popup title and favicon
- Disable popup auto-closing until we have a better solution
- Fixed Firefox error where a new window would not be created

5.0.2 (2019-08-06)
=====

- Fixes for Chrome to support the browser based api

5.0.1 (2019-08-06)
=====

- Fixes to rate and review buttons
- Added donate option - thank you for keeping this extension alive!
- Launched for Firefox
- Added title detection for firefox about: protocol
- Change description of colorize button to include hint that the window name can be changed as well
- Change colorize button to settings
- Adjust fonts, so they look nicer
- Font changes in options menu

5.0.0 (2019-08-05)
=====

- Rate and review button
- Updated depreciated chrome api calls to the new ones
- Prepared Firefox compatibility

4.9.9 (2019-02-27)
=====

- If the current tab is not in the initial popup screen, then we'll scroll down to it
- "Minimize inactive windows" will only minimize windows on the same monitor ( requires additional permission )
- Small fixes to window titles from last update

4.9.8 (2019-02-27)
=====

- Add option to enable/disable window titles
- Smarter window title detection, especially for super-long titles

4.9.7 (2019-01-24)
=====

- Fix small rendering issues
- Re-arrange some options

4.9.6 (2019-01-24)
=====

- Nicer wrapping of windows
- Show the tabs with the highest count first in the title
- Fixes in list views for high width popups, sometimes the titles were cut off

4.9.5 (2019-01-23)
=====

- Unnamed windows will show now the top domains in it instead
- Added a close option to the naming and color popups

4.9.4 (2019-01-23)
=====

- Fixes to stuck tab counters
- Auto-close forgotten tab managers after 100 seconds
- Various bugfixes and style changes

4.9.3 (2018-06-15)
=====

- Fixes for older browsers

4.9.2 (2018-06-15)
=====

- Fixes a bug when localStorage is empty

4.9.1 (2018-06-15)
=====

- New options page
- Added option to allow for auto-minimizing of windows
- fixes to window coloring
- clicking on a window will activate it now
- minimized windows are now moved to their own section

4.9.0 (2019-01-24)
=====

- Allows you to give windows colors
- You can now minimize and maximize windows from Tab Manager
- Minimized windows are now shown as faded out and at the end of the list
- You can now set the width and height of the popup in the options
