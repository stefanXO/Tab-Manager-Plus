5.2.0
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

5.1.6
=====
- Fix: Pressing "enter" or "return" when only one tab is selected, should focus that tab properly in Firefox
- Reduce options that would be restored in sessions, to limit conflicts
- Make inputs selectable in Firefox! You can now select text again in title, search and option inputs, etc. 

5.1.5
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

5.1.4
=====
- Moving multiple tabs would sometimes not work when using the button or [Enter] key. This should be fixed now

5.1.3
=====
- Fix: Popup width adjustable again instead of stuck to 800px
- Fix: Only open the popup from context menu if current browser supports it

5.1.2
=====
- Overworked and more friendlier context menu. You can now open the popup from the context menu, if opening as own tab is the default. You can now also access the changelog from the context menu
- Increase popup size/width steps to 25
- Fix: Hide saved windows when a filter is active
- Fix: Don't break rows on tabs based on the hidden tabs
- Fix: Sometimes when using the keyboard the tabs would not highlight properly. This should be resolved now.
- Fix: Background color for dark mode.
- Performance improvements, such as not rendering hidden tabs to the DOM

5.1.1
=====

- Fix: The "highlight duplicate tabs" button may have disappeared - it should be back now

5.1.0
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

5.0.8
=====

- You can now backup and restore your saved windows
- You can now select multiple tabs by using right mouse click while holding shift/ctrl or command. Select the first tab with a right click, and then select the last tab with shift+right mouse click, to select all the tabs in between.
- You can now set in the options if you'd like to have the Tab Manager open as a popup by default, or in its' own tab
- Design fixes to have the right amount of tabs per row displayed in the block view
- Stops auto-scrolling to the first active tab, if the user has already started scrolling
- Some small fixes to make sure we load correctly also on slower machines
- Fixes to dark mode in its' own tab - the background was not displayed in the full window
- Removed buggy animation transitions that would get stuck on hover

5.0.7
=====

- Dark mode - you can now enable the dark mode in the options!
- Close the popup when clicking on a tab, window or restoring a session, but don't close it when we're in a Tab Manager page of its own

5.0.6
=====

- Fixed issue where current tab wouldn't be closed when pressing the "close tabs" button
- Backwards compatibility with older browser versions

5.0.5
=====

- Removed unnecessary chrome permission
- Slight performance improvements

5.0.4
=====

- Save/restore windows ( beta ) - you can now save and restore windows into your local storage. Please note : History of the tabs will not be preserved. ( Disabled by default )
- Fixes for search box displays on some configurations
- Adjustments for wide screens
- Various other small fixes
- Close popup after pressing enter

5.0.3
=====

- Added context menu to open Tab Manager in its' own tab
- Small fixes for icon borders not rendering properly
- Fixes for the search bar when the popup is too narrow
- Added popup title and favicon
- Disable popup auto-closing until we have a better solution
- Fixed Firefox error where a new window would not be created

5.0.2
=====

- Fixes for Chrome to support the browser based api

5.0.1
=====

- Fixes to rate and review buttons
- Added donate option - thank you for keeping this extension alive!
- Launched for Firefox
- Added title detection for firefox about: protocol
- Change description of colorize button to include hint that the window name can be changed as well
- Change colorize button to settings
- Adjust fonts, so they look nicer
- Font changes in options menu

5.0.0
=====

- Rate and review button
- Updated depreciated chrome api calls to the new ones
- Prepared Firefox compatibility

4.9.9
=====

- If the current tab is not in the initial popup screen, then we'll scroll down to it
- "Minimize inactive windows" will only minimize windows on the same monitor ( requires additional permission )
- Small fixes to window titles from last update

4.9.8
=====

- Add option to enable/disable window titles
- Smarter window title detection, especially for super-long titles

4.9.7
=====

- Fix small rendering issues
- Re-arrange some options

4.9.6
=====

- Nicer wrapping of windows
- Show the tabs with the highest count first in the title
- Fixes in list views for high width popups, sometimes the titles were cut off

4.9.5
=====

- Unnamed windows will show now the top domains in it instead
- Added a close option to the naming and color popups

4.9.4
=====

- Fixes to stuck tab counters
- Auto-close forgotten tab managers after 100 seconds
- Various bugfixes and style changes

4.9.3
=====

- Fixes for older browsers

4.9.2
=====

- Fixes a bug when localStorage is empty

4.9.1
=====

- New options page
- Added option to allow for auto-minimizing of windows
- fixes to window coloring
- clicking on a window will activate it now
- minimized windows are now moved to their own section

4.9.0
=====

- Allows you to give windows colors
- You can now minimize and maximize windows from Tab Manager
- Minimized windows are now shown as faded out and at the end of the list
- You can now set the width and height of the popup in the options
