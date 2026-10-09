# Chrome Web Store listing

Store item: https://chromewebstore.google.com/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff

This folder records what the developer dashboard holds for Tab Manager Plus for Chrome. The
Chrome Web Store API only uploads and publishes the package; the listing text, images,
privacy answers and distribution settings are entered by hand in the dashboard. These files
are the source for that copy and paste.

The files on `master` always describe the live listing. Changes for the next version go in
a branch or pull request that edits these files, and are merged the day they are entered in
the dashboard and the version is submitted.

| File | Dashboard tab | Content |
|------|---------------|---------|
| `listing.md` | Store listing | Name, short description, category, language, graphics, additional fields |
| `description.txt` | Store listing | Detailed description, pasted as is |
| `privacy.md` | Privacy | Single purpose, permission justifications, remote code, data use, privacy policy |
| `distribution.md` | Distribution, Account | Payments, visibility, regions, publisher details |
| `history.md` | Package, Status | Version history, package notes, rejection history |
| `images/` | Store listing | Screenshots and promo tiles, named by size |

Keep the permission justifications in `privacy.md` in sync with `manifest.json`; the review
team reads them.

## Images

The store rejects images of the wrong size, so the size is part of the file name:

| File | Size |
|------|------|
| `images/screenshot-<n>-<size>.png` | 1280×800 or 640×400, up to 5, `<n>` is the store order |
| `images/promo-small-440x280.png` | 440×280 |
| `images/promo-marquee-1400x560.png` | 1400×560 |

The store icon is not duplicated here; it is `images/browsers128.png` in the extension
itself.

### Regenerate

The screenshots and promo tiles are rendered from the real popup, not captured by hand: `npm run store:shots` writes
them under their store names and sizes to `tools/store-shots/out/B/` (copy the ones to upload into `images/`), and
`npm run store:list` prints the plan first. What each image shows, its headline and callouts live in
`tools/store-shots/shots.json`; see `tools/store-shots/README.md`.

Translations are not supported yet. The listing exists in English only.
