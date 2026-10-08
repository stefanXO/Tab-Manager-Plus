7.0.0 (2026-10-09)
=====
A Brand New Look!
![Layouts, badges, recency bars and the new theme button](features/7.0.0/look.webm)
- Every layout is redesigned, so you can pick the one that fits how you work. Block view is now a grid, List view (was Vertical) shows one tab per line, and Rows view (was Horizontal) shows one window per row (#264)
- The dark theme is rebuilt with consistent colors, so scrollbars and controls are dark too instead of flashing white. Window colors show as a colored edge, and the active tab has a clear outline so that you can find it at a glance (#45, #67, #99, #147, #151, #241)
- You can pick a theme: System, Light or Dark. System is the new default and follows your computer's dark mode, even while the popup is open, and if you had dark mode on before, it stays dark (#84, #182)
- A new theme button sits at the top, between Rate and the options, so you can switch themes without opening the options. Each click moves to the next theme (System, Light, Dark) and changes the same setting as the options, right away
- The theme button's icon tells you which theme is active: half sun and half moon for System, a sun for Light, and a moon for Dark. The button stays visible when you turn off the Donate and Rate buttons
- Windows get a new color palette, with a matching set for the dark theme, so that colored windows look good in both themes
- Every toolbar, window and options icon is redrawn, so the icons stay sharp at any zoom level in both light and dark. Each setting also has its own icon, which makes the options easier to scan
- The recent tabs clock has three steps that light up as it reaches further back in time, so you can see how far back it is looking. An eye icon shows when tabs that don't match your search are hidden
- White favicons now stay visible in the light theme instead of vanishing into the background. Favicons also update when a tab finishes loading, so you no longer see an outdated icon (#220, #251)
- Badges show a tab's state at a glance, so you can see which tabs are playing sound, muted, asleep (put to sleep by the browser), pinned, active or selected. In List view they appear as chips with a colored edge on the left (#171)
- List view shows how recently you used each tab with four small bars at the right of the row, so you can spot old tabs quickly. The bars fill from the right and fade with age, from green for the last few minutes to grey after a week, and hovering them shows the exact time (#40)
- Windows show when they were last active, and saved sessions show when they were saved, so you can tell at a glance what you have not touched in a while
- When animations are on, they are now subtle: windows and tabs fade in, changes ease in instead of jumping, and a row that plays sound gently breathes

Faster
- The popup now opens with its final layout, theme and windows in the very first frame, so nothing jumps or fills in after it appears
- The popup script is about 40% smaller, so the popup has less to load each time you open it
- Changes to your tabs show up in the popup right away, so you never act on an outdated list
- When you start typing right after you open the popup, the first letters are no longer lost, so your search finds what you meant (#122)

Searching And Duplicates
![Search with u: and -word, Highlight Duplicates and the recent tabs clock](features/7.0.0/search.webm)
- Highlight Duplicates now selects only the extra copies and keeps the one you used last. That way, Ctrl+Delete (Cmd+Delete on a Mac) closes just the duplicates and leaves one copy of each page open (#54, #142, #188, #240, #248, #260)
- The header shows how many tabs have duplicates and how many of them are selected. While duplicates are highlighted, a search looks only within them, so you can narrow the list down before you close anything
- Pasting a search, or editing in the middle of it, now finds the right tabs instead of matching the old text. Clearing the search box no longer shows matches for an empty search
- You can search only in titles with `t:word`, or only in web addresses with `u:word`, so that common words in links don't clutter the results. To leave tabs out of a search, put a minus in front, as in `-word` or `-u:word`
- To search for words that contain a space, put them in quotes, for example `"pull request"`, so that the words must appear together (#224)
- You can also search with a pattern (a regular expression) when plain words are not enough. For example, `/\(\d+\)/` finds tabs with an unread count, `/localhost:\d+/` finds local dev servers, and `/\.pdf$/` finds open PDFs (#156, #194, #247)
- When you hover the search box, it lists all the search options, so you don't have to remember them. In List view, the matching part of each title is shown in bold, so that you can see at a glance why a tab matched your search
- The new clock button in the bar highlights the tabs you used most recently, so you can get back to your current work quickly. It picks the shortest time span with more than one tab: 15 minutes, an hour, 3 hours, 12 hours, a day, 2 days and so on (#203)
- Clicking the clock again reaches further back in time, up to two more times, and each click lights up one more step under the clock. A fourth click turns the highlighting off completely

Keyboard
![Arrow keys move the cursor, Space selects, Shift+arrows select a range, Enter switches, Tab reaches the buttons](features/7.0.0/keys.webm)
- The arrow keys now move a cursor instead of the selection, so whatever you selected stays selected while you look around
- The tab under the cursor is lifted and gets a ring, so you always know where you are in the list. In List view, the row gets the ring on the inside, together with a colored edge on its left side
- Space selects or unselects the tab under the cursor, so you can pick tabs one by one without the mouse
- Holding Shift while you press an arrow key (Shift+arrow) selects every tab the cursor lands on, which makes it quick to select a range
- When nothing is selected, Enter switches to the tab under the cursor, so arrow, arrow, Enter works just as it did in 6.x
- Clicking a tab puts the cursor on it, so you can carry on with the keyboard from there. Escape clears both the cursor and the selection when you want to start over
- Ctrl+arrow keys move the cursor even while you type in the search box, and they also move the focus from the search box to the tabs. Alt+arrow keys do the same thing, except on a Mac
- Plain arrows and Shift+arrows keep editing the search text, so typing and fixing a search works the way you would expect
- The Tab key now reaches the buttons in the bottom bar, at the top, and on windows and saved windows, so you can use every button without the mouse
- Enter or Space presses the button that has the focus. A ring shows which button has the focus, but only while you use the keyboard, so that it never gets in the way when you use the mouse
- Ctrl+Delete and Ctrl+Backspace (Cmd on a Mac) close the selected tabs, whether they are open tabs or saved tabs. Ctrl+Backspace in the search box never closes tabs, even when the box is empty. Ctrl+Z undoes a change to a saved window, as the Saved Windows section below describes
- New installs get new default keys, because the browser took over the old ones. Alt+Shift+M opens Tab Manager Plus, and Alt+Shift+, switches to the previous tab
- On a Mac, the new keys are Ctrl+Shift+M and Ctrl+Shift+, instead. Existing installs keep the keys they already had, so nothing about your shortcuts changes when you install the update
- The "switch to previous tab" shortcut works again, so you can jump back and forth between your two latest tabs (#37, #108, #238)

Windows
- Windows get automatic names from their sites, spelled the way the sites spell them: GitHub, Stack Overflow, Gmail, Google Docs. You no longer see names like "Facebook, facebook & 5 more"
- Window names and colors now survive a browser restart, even when the window's tabs changed in the meantime, so you don't have to set them up again (#16, #50, #103, #159, #178, #195, #223, #232, #236, #244)
- Names and colors of windows that were closed for more than a day are cleaned up, so that a new window can't pick up an old name by mistake (#103, #244)
- When you drag several tabs, open or saved, they show as a small stack under the mouse with their number, so you can see what you are moving. The stack shows titles in List view and icons in the icon views, as big as that view's tabs
- A tab dropped on its own right half, or on the left half of the tab to its right, stays where it is. Every other drop lands exactly where the marker shows, even when you move several tabs inside their window, where they used to land one place off
- The window order no longer resets on its own, so windows stay where you expect them. The current window is always listed first and marked, even when Tab Manager Plus opens as a popup window
- When Tab Manager Plus is already open in a tab, clicking its icon in the toolbar takes you to that tab. You no longer get a second copy

Saved Windows
![Save selected tabs, recolor the new saved window, drag saved tabs out, s: search, delete and Ctrl+Z](features/7.0.0/saved.webm)
- Saved windows are now on by default, and the update from 6.x turns them on too, unless you had turned them off while you had saved windows. They are no longer called beta or experimental, and you can still turn them off in the options
- Saved windows now look different from open windows, so you can tell them apart at once. They have a dashed edge, a saved icon before the name, and faded favicons that get their color back under the mouse. They are no longer dimmed as a whole or marked as the active window, so their tabs stay easy to read
- When you rest the mouse on a saved tab, a card appears, just like for an open tab. It shows when the tab was saved, its place in the saved window, and the windows it is open in now, while an open tab's card lists the saved windows that also hold it
- When you rest the mouse on a saved window, its card shows its tabs and sites, when it was saved, and the size and state it was saved with. A map of your monitors shows where the window would land if you restored it now
- Saved windows remember when their tabs last changed, whether tabs were moved in, out or within them, added or deleted, but not when the name or color changed. The card's "saved … ago" counts from that moment, and the cards show "created … ago" and "last saved … ago" when the two differ
- A new button next to "Move tabs to new window" in the bottom bar saves the selected tabs as a new saved window, so you can put tabs aside without closing a whole window. The new saved window is named after their sites (#201)
- You can rename and recolor a saved window with the same screen you use for open windows. To open it, use the color button on the saved window's card, or click anywhere on its name, however long the name is (#172)
- A long name shows as much as fits and then "…", just like an open window's name. After a rename, the popup scrolls back to the saved window, and a saved window without its own name always shows the automatic name from its current tabs
- Restored windows keep their size and position, fitted to the screen you restore them on. A window saved maximized comes back maximized on the monitor it was saved on when that monitor is connected, or else on the monitor you restore from (#205, #207, #208)
- The hover card of a saved window shows where it will land, and Restore uses the same monitors as the card. So a window saved maximized on a second monitor no longer comes back on the current one. The debug file also explains how each saved window would be restored, and in own-tab mode the popup scrolls to a window you restore
- To delete saved tabs, select them and then use the trash button, or press Ctrl+Delete or Ctrl+Backspace (Cmd on a Mac). A saved window with no tabs left is deleted with the same Undo notice, and the same keys close selected open tabs, like the trash button (#180)
- Plain Delete and Backspace are kept for typing and go to the search box. While the search box has the focus, Ctrl+Backspace only deletes a word and closes nothing, even when the box is empty. Ctrl+Delete deletes a word while the box has text. To close search results, first right-click a result or use the arrow keys. Selecting moves the focus out of the search box, and typing moves it back
- Ctrl+click or right-click on a saved tab now selects that tab, instead of an unrelated open tab that Ctrl+Delete would then close. Enter with saved tabs selected opens them in one new window in the order shown, and Enter after a search that selected no open tab no longer opens an empty window
- You can undo deleting a saved window, so a slip of the mouse costs you nothing. The window disappears at once, and a notice offers Undo for 8 seconds while a bar drains, with the countdown pausing while the mouse is over the notice
- The window is deleted for good when the countdown ends, when the popup closes, or right away when you click the notice's close button
- Undo notices stack, for example one for a delete and one for a move, so you can undo either of them. Up to three show at a time, and a fourth makes the oldest one go, which keeps its change
- Ctrl+Z (Cmd+Z on a Mac) undoes the newest change first and then the next one, one per press, even if you hold the keys down. It also works while you type in the search box, the newest notice shows it as keys, and each Undo puts back only what its own change did
- Errors now show in the same kind of notice, with a red edge, for 8 seconds, and info notes such as an import summary show for 5 seconds. They replace the red text in the header and the note under the file picker. Error notices never push out an Undo notice, and while three Undo notices show, at most two error or info notices show
- An error appears when the browser refuses a save or rename, for example when the browser has no room left. It also appears when a saved windows file can't be read or imported, when saved tabs can't be opened, or when a saved window can't be restored
- An error also appears when a drag and drop only partly works, or when you drop somewhere that isn't allowed. In those places the cursor shows the browser's "not allowed" sign and no drop marker appears, just as in places where a drop would change nothing
- Each error says why it happened, so you know what to do next: the saved window or tab is gone, private and normal tabs can't mix, Firefox can't save about: pages, or there is nothing to add. It also says how many tabs were left out
- You can drag saved tabs into an open window, either onto the window or next to one of its tabs, and they open there while the saved window keeps them. If the tab you drag is selected, all selected saved tabs come along. This also works when you drop them in another Tab Manager tab or sidebar
- You can reorder saved tabs by dragging one before or after another tab of the same saved window. Dropping it on a tab of another saved window moves it there, and dropping it on that window's title or edge adds it at the end. Selected saved tabs move together and stay selected, but tabs don't move between private and normal saved windows
- A saved window left with no tabs is removed with an Undo notice, so you can still change your mind. Undo puts the tabs back and brings back the window with its name and color
- You can add open tabs to a saved window by dragging a tab onto a saved tab, which puts a copy before or after it, or onto the saved window's title or edge, which adds it at the end. If the tab you drag is selected, all selected tabs come along, and they stay open (#192)
- You can put saved windows in any order by dragging one by its edge or title and dropping it before or after another, where a marker shows. New and imported saved windows are listed first, and older ones follow with the newest first
- Search now finds tabs in saved windows too, and the header counts them. Matching saved tabs stay clear while the others fade, and with Hide non-matching tabs on, saved tabs that don't match are hidden, along with saved windows that have no match and no selected tab, instead of all saved windows disappearing
- A search selects the open tabs it matches, and it selects saved tabs only when no open tab matches, so that Enter then opens them in a new window. This way, open and saved tabs are never selected together
- Selected tabs, open or saved, are always shown, so you never act on tabs you cannot see. Hide non-matching tabs never hides them, and neither does the hide mode of Highlight Duplicates or Highlight recently active tabs
- A selected tab that doesn't match stays on screen and selected, as if hiding were off. It looks a bit paler than a match but not as pale as other non-matches, and it stays with its window or saved window, even after you move it, until the next search or Escape. That way, every selected tab takes part in every move and close, and the drag stack counts them all
- A new search keeps the tabs you selected yourself with Ctrl+click, right-click, Shift+right-click for a range, a drag or the arrow keys, and it only replaces the tabs an earlier search selected. A range only takes the tabs on screen, and the arrow keys also stop on a selected tab that doesn't match
- Use `s:` to look only in saved tabs, as in `s:tax` (title or web address), `s:u:github` (web address only), `s:t:tax` (title only), `s:"pull request"` and `s:/\.pdf$/`. Its opposite, `-s:`, looks only in open tabs, as in `-s:tax`, `-s:u:github` and `-s:t:tax`
- When `s:` or `-s:` stands on its own before other words, it limits the whole search to saved or to open windows, for example `s: u:github t:tax` or `-s: tax`. With Hide non-matching tabs on, the other kind is hidden, and just `s:` or `-s:` alone shows those windows and selects nothing
- When a search can only match saved tabs, the header shows "N tabs in M saved windows". `s:` and `-s:` only work while saved windows are on, so when they are off, `s:tax` is plain text and the search help and tip don't show the `s:` lines
- Import now tells you how many saved windows it restored and how many it skipped, and why. Saved windows you already have, with the same tabs in the same order, are not imported twice and are counted as already there, and starting an import closes the notices and finishes a pending delete first (#39)
- Exports carry the date and time in their file name, so a new export never overwrites an older one. Saved windows go to `tab-manager-plus-sessions-YYYY-MM-DD-HH-MM-SS.json`, and the debug export, which also holds your saved windows, goes to `tab-manager-plus-everything-YYYY-MM-DD-HH-MM-SS.json`
- Both files are marked as Tab Manager Plus exports along with their kind, "sessions" or "everything". Import Sessions reads both of them, as well as older backups and files from earlier test builds
- A file from another app that holds a list of saved windows is imported too, with a note that it was not a Tab Manager Plus file. If it restores nothing, you get a note instead of an error, while a file that can't be read, or that the browser refuses to save, still shows the red notice
- Saved windows are no longer lost when the update from version 5 is cut short, for example when you close the popup too early. On Firefox, saving a window now keeps its about:blank tabs
- Saved windows no longer have to fit into the browser's 10 MB limit, so you can keep many large ones. Showing a saved window no longer changes it, which could break exports, and turning on saved windows shows them right away

Tab And Window Info
![Hover cards for a tab, a window with its monitor map, and a button with its keys](features/7.0.0/info.webm)
- When you hold the mouse on a tab, a card shows when you last used it and its state: asleep, muted and why, playing, or pinned. The card also shows its position, which tab opened it, copies in other windows and its zoom level, so you can decide whether to keep it
- When you hold the mouse on a window, its card shows the tab counts, sites, last activity, oldest and newest tab, and the window size. A small map of your monitors shows where the window is, which helps when you have several screens
- The card follows the mouse and switches instantly from one tab to the next, so you can skim through many tabs quickly, and pressing Escape closes it
- In Chrome, the "Show all monitors" option draws every monitor on that map, instead of only the ones with windows on them. It asks for permission to see your monitors first
- Hovering and switching layouts are much faster now, even in a popup with many windows and tabs

Options
![Options: Donate and Rate switch, settings export and import, keyboard shortcuts](features/7.0.0/options.webm)
- The options list each keyboard shortcut with its current key, or "Not set", so you can see at once which keys are active
- The new "Donate and Rate buttons" option hides those two buttons at the top of the popup if you would rather not see them
- The switches are easy to read in the dark theme, and they grow and shrink with the browser's zoom, so they stay usable at any size (#69)
- When you hover anywhere over an option, its help text shows in the header for as long as the mouse is there. Popup size, Incognito, Shortcut and What's new now have help texts too
- Enter no longer opens a new window while the options or the window color screen are open. Pressing it there now does nothing that you didn't expect
- Limit Tabs Per Window and the popup width and height no longer break when you clear them to type a new number. The field used to show "NaN" and the popup lost its size, and now a number outside the limits is fixed when you leave the field. A width or height outside the limits is not applied while you type; it is corrected when you leave the field
- The changelog page now follows the dark theme, and the tip in the header no longer changes while the popup is loading
- Export tabs for debugging, in the options, saves a file with your windows, tabs and settings, so that you can attach it to a bug report
- The new "Settings backup" lets you keep a copy of your settings, because Export Settings saves them to `tab-manager-plus-settings-YYYY-MM-DD-HH-MM-SS.json`. The file doesn't hold your saved windows, and it doesn't hold window names or colors either
- Import Settings restores your settings from that file or from a debug file, which helps when you move to a new computer. The notice lists what changed, what was skipped and why
- Import skips settings that are unknown, of the wrong type or out of range. It also skips Minimize inactive windows and Show all monitors if the browser hasn't given the monitor permission, so turn them on in the options first
- Import Sessions and Import Settings each refuse the other's file and show a message, so you can't load the wrong file by accident

Firefox
- "Minimize inactive windows" now works on Firefox, so you can keep one window open in front of you. All the other windows are minimized, on every monitor (#28)
- The options explain how to allow Tab Manager Plus in private windows and show whether it is allowed already. "Change shortcut key" opens Firefox's shortcut settings, so you can change the keys there (#33, #166)

Smaller fixes
- Escape clears the header line that shows the selection, together with the selection
- Settings, window names and colors no longer go back to an older state when the popup opens while you are changing them (#126, #131)
- Clicking a tab or a window in the popup now switches to it every time, and clicking a tab of a saved session opens it. After the browser sat idle, the first click used to only close the popup (#242, #246, #252)
- Closing, discarding or moving selected tabs now works even when one of them was closed in the meantime. Window names and colors that change in the background also update in the popup
- Hover texts are back when you move from a tab to its window, and sessions now have one too, while tab counts and plurals are shown correctly again (#121, #183)
- The buttons in the bottom bar, at the top, and on windows and saved windows now show their help in a hover card, like tabs and windows do. The card says what the button does and shows its key, for example Ctrl+Delete (Cmd+Delete on a Mac) on the trash button with tabs selected, and Enter on the new window button
- The button card stays clear of the button and follows the mouse, so it never covers what you want to click. It changes when you click the theme button, and it switches straight to a tab's or window's card when you move on to one
- With one tab selected, the new window button now says that it switches to that tab, which is what it always did. It never moved a single tab, even though its help text used to describe it that way
- The drop marker you see while dragging a tab now fits every layout and shows in the dark theme. The color picker also lists its colors in order (#97)
- A tab dragged from one Tab Manager tab or sidebar into another now moves that tab, instead of the tabs selected in the other one
- A window whose tabs were all hidden by Hide non-matching tabs shows again when the search ends or you turn hiding off, and this also works when its tabs changed in the meantime
- The window name and color screen now covers the whole popup. Its close button shows a pointer, and Escape closes only that screen instead of the whole popup
- Browsers built on Firefox, such as LibreWolf, Zen and Waterfox, are now treated as Firefox. So the Firefox fixes apply to them too
- The popup warns once, with a red notice, when the extension was rebuilt but not reloaded, and tells you where to reload it (chrome://extensions, or about:debugging in Firefox). It only warns when the extension's background code really changed
- The header icons (Donate, Rate, theme and options) now stay visible in a narrow popup and in the sidebar. At 450 px wide or less they used to be hidden, which left no way into the options
- On the changelog page, a section whose lines are only for the other browser no longer shows as an empty heading
- A user name and password in a web address (user:password@) no longer show in the popup or in the debug export file

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
