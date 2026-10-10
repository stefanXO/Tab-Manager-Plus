# Permissions (manifest.firefox.json)

Facts match `../privacy.md`. No host permissions, no remote code, no data collected
(`data_collection_permissions.required: ["none"]`). Firefox build has no optional
permissions (`system.display` is Chrome only; the monitor options are unavailable).

| Permission | Why |
|------------|-----|
| `tabs` | Lists the open tabs and windows; moves, closes, pins, discards and saves them. |
| `contextMenus` | Menu on the toolbar icon with further options. |
| `storage` | Saves settings, window names and colors in the browser. |
| `unlimitedStorage` | Saved windows hold the title and address of every tab; many of them exceed the 10 MB `storage.local` quota. |
| `alarms` | Hourly cleanup that forgets names and colors of windows closed more than a day ago. The background script is event-driven and does not stay alive. |

Other manifest parts: `sidebar_action` (the Firefox sidebar panel, `popup.html?panel=true`),
background `scripts` (no service worker), gecko id `{45f2dc53-96cd-4c41-91f6-f4a73a8fb2b0}`,
`strict_min_version` 140.0 (Android 142.0).

## Build from source (for the reviewer)

The uploaded package is bundled with esbuild (not minified by hand). The source code
package `tab-manager-plus-7.0.0.source.zip` is the git tree it was built from (tag 7.0.0 plus build-script and text changes). To rebuild:

1. Node.js 22.18 or newer (tested with 24.21), npm 10 or newer, any OS.
2. `npm ci`
3. `npm run build:firefox`
4. The add-on is in `build/firefox/`; its files are identical to the uploaded package.
