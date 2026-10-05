# Privacy practices

> Version 6.0.0 (published 2024-10-01)

## Single Purpose

Tab Manager Plus helps working with many tabs in Chrome at the same time. Search through your tabs instantly, save windows for later, limit open tabs per window - and many more features to make working with a lot of tabs much easier.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `tabs` | permissions | Tab Manager Plus will need the tab permission to access the active open tabs in your Chrome and display them in a list. It will also allow you to move them between windows, close them, open new ones, save them, and more. |
| `contextMenus` | permissions | When right-clicking on the Tab Manager Plus popup icon, a context menu is displayed with further options. |
| `storage` | permissions | We save your settings to the Chrome storage. This way when you restart your browser, or open Tab Manager again, your settings are saved properly. |
| `unlimitedStorage` | permissions | Saved sessions hold the titles and urls of every tab of a saved window. Users with many saved windows exceeded the 10 MB `storage.local` quota and lost sessions; this lifts the quota. |
| `favicon` | permissions | We show the favicons of all tabs in the Tab Manager Plus overview. |
| `alarms` | permissions | Runs an hourly cleanup that forgets the names and colors of windows closed more than a day ago, so a new window cannot inherit an old name. An alarm is used because the background worker does not stay alive. |
| `system.display` | optional_permissions | Reads the screen layout for three optional features: (a) restoring a saved window on the screen it was saved on and fitting it to that screen; (b) the "Show all monitors" option, which shows a map of all monitors in the window's stats card and which monitor the window is on; (c) "Minimize inactive windows" on Chrome, which minimizes the other windows on the monitor of the window that got focus. It is requested at runtime only when the user turns one of these on in the settings. Without it, windows are restored on the current screen, the map shows only the current screen, and minimize does nothing. |

**Are you using remote code?** No, I am not using remote code.

## Data Collection

**Does the extension collect user data?** No. No data type is checked, so the store page
shows "The developer has disclosed that it will not collect or use your data."

| Data Type | Collected? |
|-----------|-----------|
| Personally identifiable information | No |
| Health information | No |
| Financial and payment information | No |
| Authentication information | No |
| Personal communications | No |
| Location | No |
| Web history | No |
| User activity | No |
| Website content | No |

## Data Use Certification

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

## Privacy Policy

**Privacy Policy URL**

https://github.com/stefanXO/Tab-Manager-Plus/blob/master/PRIVACY.md
