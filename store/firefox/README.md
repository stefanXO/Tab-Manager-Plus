# Firefox Add-ons (AMO) listing

Add-on: https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/
Developer hub: https://addons.mozilla.org/developers/ (Manage listing).

AMO is updated after Chrome. 7.0.0 is Chrome-first. The Firefox build exists:
`npm run build:firefox` (overlay `manifest.firefox.json` on `manifest.json`).
Submit the new version, then paste these texts. Nothing here is posted automatically.

Text is written at about 8th-grade level (Flesch-Kincaid grade of `description.txt`: 3.3 by vowel-group count).

| File | AMO field (Edit Product Page) | Limit / notes |
|------|-------------------------------|---------------|
| `summary.txt` | Summary | 250 chars max (186 used) |
| `description.txt` | Description | Plain text with the same ➤ / ★ style. AMO allows b, i, a, ul, li, blockquote, code, br, abbr, acronym, strong, em; none are used |
| `version-notes.txt` | Version > Release notes | Per version, short |
| `permissions.md` | Reviewer notes (Source/Notes to reviewer) | For the review team, not public |
| `current-amo-listing.md` | none | Raw text live on 2026-10-08 (5.2.4), to diff against |

Fields that stay as they are (live values in `current-amo-listing.md`):

- Homepage: https://stefanxo.com
- Support site: https://github.com/stefanXO/Tab-Manager-Plus/ ; support email as listed
- Categories: Appearance, Tabs. Tags: none yet; suggested: tabs, tab manager, duplicates, search, windows, sessions (AMO takes up to 20)
- Screenshots: 4 now (1280x800). AMO accepts PNG/JPG/GIF; recommended at least 700x525, any size shown scaled. Reuse `../images/screenshot-<n>-1280x800.png` after checking they show Firefox UI if you want. The icon comes from the package
- Privacy policy: https://github.com/stefanXO/Tab-Manager-Plus/blob/master/PRIVACY.md
- License: as listed
