# Tab Manager Plus — Improvement Roadmap

**7.0.0 shipped. Half of this list is done. Here is the other half.**

| **50** fixed | **51** open | **11** up next |
|:-:|:-:|:-:|
| 32 roadmap items and 18 review findings closed in 7.0.0 | bugs, ideas and cleanups still on the list | the 7.0.1 shortlist, [P0](#p0--next-release-701-shortlist) |

How it works: a code review on 2026-09-22 listed everything wrong with 6.0.0. On 2026-10-10, after the 7.0.0 release (Chrome Web Store 2026-10-09, Firefox Add-ons and GitHub 2026-10-10, PR #273), every item was checked again against `master` at `e246082`. Items keep their number and first wording, so old links work. Each open item says in plain words what is wrong, where it is now, and how to fix it; the original review text sits in a fold under it. Done items are one line each, folded away. Click any id, like [**1.15**](#i-1-15), to jump to its entry.

**Colours mean urgency**

| | Meaning |
|:-:|---|
| 🔴 | High. Users lose data or settings, or see the wrong thing. |
| 🟠 | Medium. A visible bug with a workaround. |
| 🟡 | Low. Hygiene, polish, rare cases. |
| 🔵 | An idea or a larger effort, not a bug. |
| 🟢 | Done in 7.0.0. |
| ⚪ | Left as is, by decision. |

Each section has three groups: **Do next** (on the 7.0.1 shortlist), **Open**, and **Done in 7.0.0** (folded).

| | Section | Done | Open | Changed | Items |
|:-:|---------|------|------|---------|-------|
| 🟢 | **7.0.0 release (2026-10-09/10)**: 32 roadmap items done (9 of them another way than proposed), 18 of 28 review findings fixed before the merge | **50** | — | 1 | see [7.0.0 — what shipped](#700--what-shipped) |
| 🟠 | [P0 Next release (7.0.1) shortlist](#p0--next-release-701-shortlist) | — | 11 | — | pointers only |
| | [P1 Remaining correctness bugs](#p1--remaining-correctness-bugs-small-low-risk) | 10 | 11 | 0 | 21 |
| | [P1b Findings of the PR #273 review](#p1b--findings-of-the-review-of-pr-273-2026-10-0910) | 18 | 5 | 4 left as is | 28 |
| | [P2 Tooling and build](#p2--tooling--build) | 11 | 2 | 0 | 13 |
| | [P3 Firefox notes](#p3--firefox-build-notes-informational) | 6 | 0 | 0 | 6 |
| | [P4 Modernization](#p4--modernization-larger-efforts) | 4 | 4 | 0 | 8 |
| | [P5 Salvaged from 5.3.0](#p5--salvaged-from-the-abandoned-530-branch) | 1 | 7 | 1 | 9 |
| | [P6 Found after the release](#p6--found-after-the-release-2026-10-0910) | — | 12 | — | 12 |
| | [P7 Milestone 7.1.0](#p7--milestone-710-2026-10-10) | — | 10 | — | 10 |
| | **Total** | **50** | **51** | 1, plus 4 left as is | **107** |

## 7.0.0 — what shipped

7.0.0 is PR #273: 364 commits on top of 6.0.0, with about 1,580 tests. Against this list it closed:

- **Correctness (P1)**: 10 of 21. Search rewritten as a parsed query (1.1, 1.16), keycode fix (1.2), one storage queue in the worker and no whole-storage writes from the popup (1.4, 1.5), hash update under the queue (1.9), listener cleanup on unmount (1.10), restore scrolls to the new window (1.18), one shared settings module (1.21), `rel="noopener"` on the external links (1.12).
- **Review of PR #273 (P1b)**: 18 of 28 findings fixed before the merge. One regression was caught and reverted.
- **Tooling (P2)**: 11 of 13. One esbuild config, lockfile, CI on Node 22 and 24, no committed `dist/`, minified release, modern `tsconfig`, a test suite, one version source, React types that match the runtime (2.8), and screenshot, drag and Firefox harnesses (2.13, built differently than proposed).
- **Firefox (P3)**: 6 of 6. Firefox builds as MV3 from this repo, and 7.0.0 is on AMO.
- **Modernization (P4)**: 4 of 8. React 19, no string refs, CSS tokens with OS dark mode, and a deterministic popup boot (4.8).
- **Salvaged ideas (P5)**: 1 of 9. Favicons that arrive after first paint (5.6).

Also in the release, though not on this list: saved windows (save, restore, drag between open and saved, Undo), search syntax (`t:`, `u:`, `s:`, `-`, quotes, regex, OR), keyboard cursor, System/Light/Dark themes, a new icon set, recent-tab highlighting, stats card, settings export and import, public-suffix window names, and the Firefox build. See `CHANGELOG.md`.

The worst 6.0.0 bugs were fixed in their own PRs before the 7.0.0 work:

- **PR #268** — window names and colors lost across restarts (`checkWindow` Map bracket-access bug and cleanup fixes). Merged.
- **PR #269** — MV3 service worker lifecycle. Merged. It added:
  - previous-tab shortcut history in `storage.session`
  - an hourly `chrome.alarms` cleanup that purges only entries without a window for over 24 h
  - stored window ids forgotten at browser start
  - all window bookkeeping serialized through one queue in the worker
  - synchronous listener registration
  - `windowAge` reconciled instead of wiped
  - awaited message handlers
- **PR #270** — non-destructive, re-entrant localStorage migration. Merged.
- **PR #271** — popup crash paths and an `onMessage` race. Merged.
- **PR #273** — 7.0.0: saved windows, search syntax, keyboard cursor, themes, icon set, Firefox MV3 build, tests and CI. Merged 2026-10-10.

---

## P0 — Next release (7.0.1) shortlist

> [!WARNING]
> **Eleven things to do first.** Click the id at the end of a line to jump to its full entry.

1. After a restart, a window can get another window's name or color. Also raised by Copilot on #273. [**1.15**](#i-1-15)
2. Importing a saved-windows file can replace a stored window with the same id, with no notice and no Undo. [**P1b #2**](#r-2)
3. Sites under seven country domains are named "COM", because the public suffix list drops bare wildcard rules. [**P1b #3**](#r-3)
4. A drag from outside the app (link, image, text) moves the current selection. [**P1b #7**](#r-7)
5. If saving an option fails, no notice shows. [**P1b #18**](#r-18)
6. When a notice that has focus goes away, focus falls to the page body. [**P1b #26**](#r-26)
7. The "just used" label goes stale in own-tab and sidebar modes. [**6.1**](#i-6-1)
8. Dropping our own drag types on the search box types text into it (Firefox harness). [**6.2**](#i-6-2)
9. Drops across two pages onto a saved window do nothing. [**6.3**](#i-6-3)
10. Make `system.display` a required permission and turn "Show all monitors" on by default. [**6.7**](#i-6-7)
11. Popup `sendMessage` calls without a catch log "Receiving end does not exist". [**1.6**](#i-1-6)

Four review findings stay as they are unless a user runs into them: [#1](#r-1), [#10](#r-10), [#11](#r-11), [#19](#r-19). The maintainer decided this on release day.

## P1 — Remaining correctness bugs (small, low-risk)

> [!TIP]
> **7.0.0:** 🟢 10 done · 11 open (of 21). The search rewrite, the shared settings module, the storage queue, listener cleanup and the restore scroll closed the ones with user-visible effects. What is left is worker hygiene (catches, logging, the hash) and small popup races.

### Do next (7.0.1 shortlist)

| | Item | What is wrong | Where | Fix |
|:-:|---|---|---|---|
| 🟡 | <a id="i-1-6"></a>**1.6** Popup messages can fail with no catch | When the popup is closed, `runtime.sendMessage` fails with "Receiving end does not exist". The worker side is fixed; the popup side is not. | `TabManager.tsx:1709,1724,2144` and more | add `.catch(() => {})` or a small `sendMessageSafe` helper. |
| 🔴 | <a id="i-1-15"></a>**1.15** A restored window can get another window's name or colour | Two windows with the same set of addresses hash to the same value, so after a restart the name and colour can go to the wrong one. Copilot raised the same thing on PR #273 (2026-10-09). | `src/helpers/windows.ts:28-43` and more | store a canonical url fingerprint and reattach only when the match is unique; otherwise keep the orphan. |

<details><summary>Full locations and original findings for these 2 items</summary>

#### 1.6 · Popup messages can fail with no catch

- **Where:** 23 popup call sites. Fire-and-forget without a catch: `TabManager.tsx:1709,1724,2144`, `TabOptions.tsx:608,612,862,863`. Awaited without a catch in the same function: `TabManager.tsx:991,1160,1752,1755,2300,2302,2709,2786`, `WindowOptions.tsx:99,119`, `Session.tsx:322`
- **Fix:** add `.catch(() => {})` or a small `sendMessageSafe` helper.

<details><summary>Original finding (2026-09-22)</summary>

- **Issue:** ~13 fire-and-forget `runtime.sendMessage` calls without `.catch()` — "Receiving end does not exist" rejections whenever the popup is closed (very common for background window renames)
- **Where:** `background/actions.ts:104,119`, `background/tracking.ts:105`, `Window.tsx:605,607,718,740`, `Tab.tsx:154,159`, `TabManager.tsx` (several)
- **Impact / suggested fix:** Append `.catch(() => {})` or a small `sendMessageSafe` helper
- **Status (2026-10-10):** **Open** for the popup. The worker side is done (PR #269; `notifyRefresh` in `actions.ts` has the `.catch`). Now 23 popup call sites: wrapped are `src/popup/messaging.ts:15` (`sendAndWait`, try/catch and timeout) and `TabOptions.tsx:642`; fire-and-forget without a catch: `TabManager.tsx:1709,1724,2144`, `TabOptions.tsx:608,612,862,863`; awaited without a catch in the same function: `TabManager.tsx:991,1160,1752,1755,2300,2302,2709,2786`, `WindowOptions.tsx:99,119`, `Session.tsx:322`

</details>

#### 1.15 · A restored window can get another window's name or colour

- **Where:** `src/helpers/windows.ts:28-43` (`hashcode()`: sorted urls, tabs without a url skipped, no tab count), `background/tracking.ts:91-94` (`cleanUpLocked` reattaches on the first hash match, with no uniqueness check)
- **Fix:** store a canonical url fingerprint and reattach only when the match is unique; otherwise keep the orphan.

<details><summary>Original finding (2026-09-22)</summary>

- **Issue:** Weak URL-set hash (`h*31+c` fold) means two windows with identical URL sets (e.g. two windows with one new tab each) collide, so a name/color can be transplanted onto the wrong window after restart
- **Where:** `src/helpers/utils.ts:35-43`, `background/windows.ts:310-325`
- **Impact / suggested fix:** Include tab count / use a stronger hash, or require unique matches before transplanting
- **Status (2026-10-10):** **Open**, and on the 7.0.1 shortlist. The fold now lives in `hashcode()` in `src/helpers/windows.ts:28-43` (sorted urls, tabs without a url skipped, no tab count); `cleanUpLocked` in `background/tracking.ts:91-94` reattaches on the first hash match with no uniqueness check. Copilot raised the same thing on PR #273 (2026-10-09): store a canonical url fingerprint and reattach only when the match is unique, otherwise keep the orphan

</details>

</details>

### Open

| | Item | What is wrong | Where | Fix |
|:-:|---|---|---|---|
| 🟠 | <a id="i-1-3"></a>**1.3** The tab limit checks the wrong window | In a service worker, `tabs.query({currentWindow: true})` means the last-focused window, not the window that got the new tab. | `src/service_worker/background/tabs.ts:157` | use `tabs.query({windowId: tab.windowId})`. |
| 🟡 | <a id="i-1-7"></a>**1.7** Empty catch blocks hide every error | Three empty `catch (e) {}` blocks in the window listeners swallow all errors. | `background/windows.ts:355,365,377` (the third is in `windowRemoved`) | log with `console.error`. |
| 🟡 | <a id="i-1-8"></a>**1.8** `createWindowWithTabs` changes its input and fails on an empty list | It calls `tabs.shift()` on the list it gets, and it crashes on `firstTab.pinned` when the list is empty. | `windows.ts:28-36` | guard empty input and work on a copy. |
| 🟠 | <a id="i-1-11"></a>**1.11** A tab icon address goes into CSS without quotes | On Firefox the address comes from the page (`tab.favIconUrl`), so a page can shape the CSS. | `Tab.tsx:394` (`favIconStyle`), fed by `resolveFavIconUrl` (`Tab.tsx:397`) | quote and escape the address (`url("…")`) and reject `javascript:` schemes. |
| 🟡 | <a id="i-1-13"></a>**1.13** `openPopup` can race the popup's own load | `setPopup("")` runs right after `openPopup()` resolves, which is at show time, not at close. `openPopup` also needs a user gesture and Chrome 127+, and it has no `.catch`. | `src/service_worker/ui/open.ts:17-19` (a throw from `openPopup` leaves the popup URL set) | reset the popup URL from the popup itself, or after a delay, and catch failures. |
| 🟡 | <a id="i-1-14"></a>**1.14** The search tip flickers while you type | `getTip()` calls `Math.random()` on every render. | `TabManager.tsx:776` (`getTip()` is defined at 2810) | pick the tip once in the constructor. |
| 🟡 | <a id="i-1-17"></a>**1.17** Error logging is copied and repeated | Some code logs the same error two or three times, and there is no shared error helper. | `background/tabs.ts:54-55` (double), `background/windows.ts:146-148,157-159` (triple) | one shared error helper. The `Session.tsx` and `Window.tsx` cases are gone. |
| 🟡 | <a id="i-1-19"></a>**1.19** The last half second before a window closes is not hashed | `checkWindowDebounced` drops the last 500 ms of tab changes before a window close or browser quit, so the stored hash can be stale on restart. The log noise part was fixed in PR #269. | `tabs.ts:201` and more | cancel the window's pending timer in `windowRemoved`; on `tabs.onRemoved` with `isWindowClosing`, flush the hash at once (the window is still queryable on Chrome; verify Firefox). |
| 🟡 | <a id="i-1-20"></a>**1.20** Renaming an open window sends a message on every key | Since PR #269 the popup also waits for the full round trip each time (two storage reads, `windows.get`, hash write, `refresh_windows` broadcast). Saved windows are already debounced at 300 ms. | `src/popup/views/WindowOptions.tsx:99-100` (the debounce is at `:96`, only `if (this.props.session)`) | debounce the message (~300 ms) or send it on blur or Enter; keep the local state update immediate. |

<details><summary>Full locations and original findings for these 9 items</summary>

#### 1.3 · The tab limit checks the wrong window

- **Where:** `src/service_worker/background/tabs.ts:157`
- **Fix:** use `tabs.query({windowId: tab.windowId})`.

<details><summary>Original finding (2026-09-22)</summary>

- **Issue:** Tab limit checks the wrong window: `tabs.query({currentWindow: true})` resolves against the last-focused window in a service worker, not the window the tab was added to
- **Where:** `src/service_worker/background/tabs.ts:129`
- **Impact / suggested fix:** `tabs.query({windowId: tab.windowId})`
- **Status (2026-10-10):** **Open**. Now `tabs.ts:157`

</details>

#### 1.7 · Empty catch blocks hide every error

- **Where:** `background/windows.ts:355,365,377` (the third is in `windowRemoved`)
- **Fix:** log with `console.error`.

<details><summary>Original finding (2026-09-22)</summary>

- **Issue:** Three empty `catch (e) {}` blocks swallow every error in the window listeners
- **Where:** `background/windows.ts:261,271,283`
- **Impact / suggested fix:** Log with `console.error`
- **Status (2026-10-10):** **Open**. Now `windows.ts:355,365,377` (the third is in `windowRemoved`)

</details>

#### 1.8 · `createWindowWithTabs` changes its input and fails on an empty list

- **Where:** `windows.ts:28-36`
- **Fix:** guard empty input and work on a copy.

<details><summary>Original finding (2026-09-22)</summary>

- **Issue:** `createWindowWithTabs` mutates its input (`tabs.shift()`) and crashes on an empty array (`firstTab.pinned`)
- **Where:** `background/windows.ts:21-29`
- **Impact / suggested fix:** Guard empty input; operate on a copy
- **Status (2026-10-10):** **Open**. Now `windows.ts:28-36`

</details>

#### 1.11 · A tab icon address goes into CSS without quotes

- **Where:** `Tab.tsx:394` (`favIconStyle`), fed by `resolveFavIconUrl` (`Tab.tsx:397`)
- **Fix:** quote and escape the address (`url("…")`) and reject `javascript:` schemes.

<details><summary>Original finding (2026-09-22)</summary>

- **Issue:** Favicon URL interpolated into CSS unescaped: `"url(" + favIcon + ")"` where the Firefox path uses page-controlled `tab.favIconUrl`
- **Where:** `src/popup/views/Tab.tsx:62,94,249`
- **Impact / suggested fix:** Quote + escape (`url("…")`), reject `javascript:` schemes
- **Status (2026-10-10):** **Open**. Now `Tab.tsx:394` (`favIconStyle`), still unquoted; the value comes from `resolveFavIconUrl` (`Tab.tsx:397`)

</details>

#### 1.13 · `openPopup` can race the popup's own load

- **Where:** `src/service_worker/ui/open.ts:17-19` (a throw from `openPopup` leaves the popup URL set)
- **Fix:** reset the popup URL from the popup itself, or after a delay, and catch failures.

<details><summary>Original finding (2026-09-22)</summary>

- **Issue:** `openPopup` race: `setPopup("") ` immediately after `openPopup()` resolves (which is at *show*, not close) can race the popup's own load; `openPopup` also needs a user gesture and Chrome 127+, with no `.catch`
- **Where:** `src/service_worker/ui/open.ts:12-21`
- **Impact / suggested fix:** Reset the popup URL from the popup itself (or on a delay), catch failures
- **Status (2026-10-10):** **Open**. `open.ts:17-19` has the same shape; a throw from `openPopup` leaves the popup URL set

</details>

#### 1.14 · The search tip flickers while you type

- **Where:** `TabManager.tsx:776` (`getTip()` is defined at 2810)
- **Fix:** pick the tip once in the constructor.

<details><summary>Original finding (2026-09-22)</summary>

- **Issue:** Search placeholder tip calls `getTip()` → `Math.random()` on every render, so the tip flickers while typing
- **Where:** `src/popup/views/TabManager.tsx:464,1897-1910`
- **Impact / suggested fix:** Pick the tip once in the constructor
- **Status (2026-10-10):** **Open**. Now `TabManager.tsx:776` calls `getTip()` (defined at 2810) in `render`

</details>

#### 1.17 · Error logging is copied and repeated

- **Where:** `background/tabs.ts:54-55` (double), `background/windows.ts:146-148,157-159` (triple)
- **Fix:** one shared error helper. The `Session.tsx` and `Window.tsx` cases are gone.

<details><summary>Original finding (2026-09-22)</summary>

- **Issue:** `Session.close`/`Window.save` log `value` from a `.catch`-ed await that is `undefined` on error; triple-logging (`console.error(e); console.log(e); console.log(e.message)`) is copy-pasted ~5×
- **Where:** `Session.tsx:178-183`, `Window.tsx`, `background/windows.ts`
- **Impact / suggested fix:** Consolidate into one error helper
- **Status (2026-10-10):** **Open** for the worker. The `Session.tsx` and `Window.tsx` cases are gone, but the double logging remains at `background/tabs.ts:54-55` and the triple at `background/windows.ts:146-148,157-159`; there is no shared error helper

</details>

#### 1.19 · The last half second before a window closes is not hashed

- **Where:** `tabs.ts:201` (`checkTabRemove` returns on `isWindowClosing`), `windows.ts:372` (`windowRemoved` never clears `checkWindowTimers`, `tabs.ts:178`)
- **Fix:** cancel the window's pending timer in `windowRemoved`; on `tabs.onRemoved` with `isWindowClosing`, flush the hash at once (the window is still queryable on Chrome; verify Firefox).

<details><summary>Original finding (2026-09-22)</summary>

- **Issue:** `checkWindowDebounced` (PR #268) can fire after its window closed (`windows.get` rejects, logged as noise) and drops the last <500ms of tab changes before a window close or browser quit, so that window's stored hash can be stale on restart
- **Where:** `background/tabs.ts`
- **Impact / suggested fix:** Cancel the window's pending timer in `windowRemoved`; on `tabs.onRemoved` with `isWindowClosing` flush the hash immediately instead of skipping (the window is still queryable at that point on Chrome; verify Firefox)
- **Status (2026-10-10):** **Open**, half. The noise part was fixed in PR #269 (a closed window is caught and ignored in `checkWindow`). The last <500 ms before a close is still not hashed: `checkTabRemove` (`tabs.ts:201`) returns on `isWindowClosing`, and `windowRemoved` (`windows.ts:372`) never clears `checkWindowTimers` (`tabs.ts:178`)

</details>

#### 1.20 · Renaming an open window sends a message on every key

- **Where:** `src/popup/views/WindowOptions.tsx:99-100` (the debounce is at `:96`, only `if (this.props.session)`)
- **Fix:** debounce the message (~300 ms) or send it on blur or Enter; keep the local state update immediate.

<details><summary>Original finding (2026-09-22)</summary>

- **Issue:** `WindowOptions.changeName` sends `set_window_name` on every keystroke, and since PR #269 the popup awaits the full round trip (two storage reads, `windows.get`, hash write, `refresh_windows` broadcast) per key
- **Where:** `src/popup/views/WindowOptions.tsx:73-79`
- **Impact / suggested fix:** Debounce the message (~300 ms) or send it on blur/Enter; keep the local state update immediate
- **Status (2026-10-10):** **Open** for open windows. Saved windows are debounced at 300 ms (`WindowOptions.tsx:96`, only `if (this.props.session)`); the open-window path (`:99-100`) still sends `set_window_name` per keystroke

</details>

</details>

### Done in 7.0.0

<details><summary>10 items</summary>

- <a id="i-1-1"></a>🟢 **1.1** Search term started as `undefined`. Search was rewritten as `parseQuery`/`matchTab` in `src/popup/search.ts`; there is no concatenated search string any more.
- <a id="i-1-2"></a>🟢 **1.2** Bracket and quote keys never focused the search box. `checkKey` in `TabManager.tsx` uses `e.keyCode <= 222`.
- <a id="i-1-4"></a>🟢 **1.4** Storage write races on window data. Worker side by `serialized()` in `src/helpers/storage.ts` (one queue, not per key; PR #269); popup side by 1.5, the popup writes none of these keys any more.
- <a id="i-1-5"></a>🟢 **1.5** The popup wrote all of storage when saving settings. `readSettings` in `src/helpers/settings.ts` reads only the setting keys and writes back only the missing ones.
- <a id="i-1-9"></a>🟢 **1.9** Hash update for a just-closed window. The hash update runs inside `setWindowName`/`setWindowColor` under the queue, and `handleMessages` catches a rejection (PR #269).
- <a id="i-1-10"></a>🟢 **1.10** Listener leak on remount. Handlers are class fields, removed in `componentWillUnmount` (`TabManager.tsx`).
- <a id="i-1-12"></a>🟢 **1.12** External links without `rel`. Done another way: the six links are now one `link()` helper (`TabOptions.tsx:535`) with `rel="noopener"`; `noreferrer` is not set.
- <a id="i-1-16"></a>🟢 **1.16** Incremental search used the wrong subset. `lastSearchLen` is gone; `src/popup/search.ts` matches every tab against the parsed query.
- <a id="i-1-18"></a>🟢 **1.18** Restore scrolled to a window that does not exist. `createWindowWithSessionTabs` (`windows.ts`) returns the new window id and `Session.tsx` scrolls to it.
- <a id="i-1-21"></a>🟢 **1.21** Setting defaults restated at every read site. `src/helpers/settings.ts` (`Settings`, `SETTING_DEFAULTS`, `readSettings`, `getSetting`/`saveSetting`, `Layout`/`LAYOUT`) is used by worker and popup. Leftover: the storage key `"filter-tabs"` (`settings.ts:45`) still maps to the state field `filterTabs` (`TabManager.tsx:228,270`).

</details>

## P1b — Findings of the review of PR #273 (2026-10-09/10)

> [!TIP]
> **7.0.0:** 🟢 18 of 28 fixed before the merge · 5 open · 4 left by decision · 1 regression found and reverted (#24).

A code review of the 7.0.0 branch (two passes, 9 reviewers and 3 verifiers) found 28 things: 0 blockers, 4 high, 5 medium, 19 low. The full text with steps to reproduce and fixes is in `REVIEW-7_0_0.md` on the branch `review-7_0_0-findings`. Numbers are the review's. 18 were fixed before the merge. The rest follow, in the order the maintainer wants them done.

**Open, planned for 7.0.1**

| | Finding | What is wrong |
|:-:|---|---|
| 🔴 | <a id="r-2"></a>**#2** high | importing a saved-windows file replaces a stored saved window with the same id, with no notice and no Undo (`src/popup/sessionStore.ts:91`; `TabOptions.tsx` dedups only on equal tab urls, `importCount.ts`). Rule: skip when the stored one is newer, say "kept yours" in the notice, offer Undo. |
| 🔴 | <a id="r-3"></a>**#3** high | `scripts/psl.mjs:69` drops bare wildcard rules (`*.np`, `*.jm`, `*.mm`, `*.pg`, `*.ck`, `*.er`, `*.fk`), so sites there are named "COM" (`windowName.ts` skips the bare `*` lookup). Script fix plus data regeneration. |
| 🟠 | <a id="r-7"></a>**#7** medium | a drag that is not Tab Manager's (a link, image or text from a page) is accepted by windows and tabs and moves the current selection. `movedTabs` in `TabManager.tsx:2748-2753` falls back to `this.draggingOpen ?? this.selectedTabs()` when the drop carries no payload. Accept only our own drag types (`isOpenTabDrag`/`isSavedTabDrag` in `src/popup/dragPayload.ts` already exist for the marker). |
| 🟡 | <a id="r-18"></a>**#18** low | no option handler catches a rejected `storage.local.set`. `store()` (`TabOptions.tsx:573-576`) and the bare `saveSetting` calls at `:879,899` show the new value while storage keeps the old. |
| 🟡 | <a id="r-26"></a>**#26** low | when the notice that holds focus unmounts, focus falls to `document.body` and the keyboard handler on `#root` stops seeing keys. `Notice.tsx:39-42` only releases the hold. Call `focusRoot()` (`TabManager.tsx:1583`). |

**Left as they are, unless a user runs into them**

| | Finding | What it is |
|:-:|---|---|
| ⚪ | <a id="r-1"></a>**#1** by decision | the debug export strips only `user:password@`; query strings and fragments stay. The file is for bug reports, not for import. A query-stripping version was tried and reverted in `9c6178c`. |
| ⚪ | <a id="r-10"></a>**#10** by decision | dropping a pinned tab among unpinned ones shows "moves", but the browser clamps it (`dropReasons.ts`). |
| ⚪ | <a id="r-11"></a>**#11** by decision | every `xn--` label is decoded, including whole-script confusables that Chrome keeps as punycode (`punycode.ts:4-5`). |
| ⚪ | <a id="r-19"></a>**#19** by decision | fixed frame parts take `--popup-width` in px. The premise (a viewport narrower than requested) has never been seen. |

<details><summary>18 fixed before the merge</summary>

- #4 Enter and Space on the three native buttons (`buttonKeys.ts` `nativeButtonKeyDown`)
- #5 prefix-only query selected every tab
- #6 dragged tabs in click order (`openMovePlan.ts` `shownOrder`)
- #8 punycode RangeError
- #9 negative match count
- #12 bidi controls in names
- #13 saved window without a date
- #14 number settings stored as text
- #15 popup size clamp
- #16 `importSessions` without `reader.onerror`
- #17 visibilitychange flush in own-tab mode
- #20 prefers-reduced-motion (`css/motion.css:203`)
- #21 text contrast 4.5:1
- #22 `key.pem` not ignored
- #23 AMO text on monitors
- #24 debug export round trip overwrote saved windows (regression of the #1 attempt, gone with the revert)
- #25 created date fell back to now
- #27 ZWJ stripped from names
- #28 `.mcp.json` not ignored

Copilot's four review rounds on #273 (9 inline comments) were resolved. The two it called "previously missed" are 1.15 and P6.1.

</details>

## P2 — Tooling & build

> [!TIP]
> **7.0.0:** 🟢 11 done · 2 open (of 13). The build chain is rebuilt: one esbuild config, lockfile, CI on two Node versions, no committed `dist/`, minified release, modern `tsconfig`, a test suite of about 1,580 tests, one version source, and screenshot, drag and Firefox harnesses. Left: `package.json` leftovers and BOMs.

### Open

| | Item | What is wrong | Where | Fix |
|:-:|---|---|---|---|
| 🟡 | <a id="i-2-9"></a>**2.9** Leftovers in `package.json` | `webextension-polyfill` ships in the runtime bundle but is listed as a devDependency. `"main": "index.js"` points at a file that does not exist. The license is fixed (now `MPL-2.0`), and `crx3` is now used by `scripts/package.mjs` to build the `.crx`. | `package.json` (`"main"` at `package.json:5`) | move `webextension-polyfill` to the right group and remove the `"main"` line. |
| 🟡 | <a id="i-2-12"></a>**2.12** Stray BOMs and an unused `outDir` | 20 of the 133 files under `src/`, plus `tsconfig.json`, start with a BOM (`src/types/ICommand.ts` and `src/service_worker/ui/open.ts` among them). | `tsconfig.json:4` and more | strip the BOMs and gitignore `ts-built/`. |

<details><summary>Full locations and original findings for these 2 items</summary>

#### 2.9 · Leftovers in `package.json`

- **Where:** `package.json` (`"main"` at `package.json:5`)
- **Fix:** move `webextension-polyfill` to the right group and remove the `"main"` line.

<details><summary>Original finding (2026-09-22)</summary>

- **Issue:** `webextension-polyfill` is a devDependency but ships in the runtime bundle; `crx3` appears unused by any tracked script; `"main": "index.js"` points at a nonexistent file; `"license": "ISC"` contradicts `LICENSE.md` (MPL-2.0)
- **Where:** `package.json`
- **Impact / suggested fix:** Reclassify/remove/fix
- **Status (2026-10-10):** **Open**, except the license (now `MPL-2.0`) and `crx3`, which `scripts/package.mjs` now uses to build the `.crx`. `webextension-polyfill` is still a devDependency and `"main": "index.js"` (`package.json:5`) is still there

</details>

#### 2.12 · Stray BOMs and an unused `outDir`

- **Where:** `tsconfig.json:4` (`outDir: ts-built` is still set and not in `.gitignore`; `noEmit` is on, so the folder is never created)
- **Fix:** strip the BOMs and gitignore `ts-built/`.

<details><summary>Original finding (2026-09-22)</summary>

- **Issue:** Mixed BOMs (`tsconfig.json`, `src/popup/views/index.ts`, `src/service_worker/ui/open.ts`); `outDir: ts-built` is never used and not gitignored
- **Where:** —
- **Impact / suggested fix:** Strip BOMs, gitignore `ts-built/`
- **Status (2026-10-10):** **Open**: 20 of the 133 files under `src/` plus `tsconfig.json` start with a BOM (`src/types/ICommand.ts` and `src/service_worker/ui/open.ts` among them); `outDir: ts-built` (`tsconfig.json:4`) is still set and not in `.gitignore` (`noEmit` is on, so the folder is never created)

</details>

</details>

### Done in 7.0.0

<details><summary>11 items</summary>

- <a id="i-2-1"></a>🟢 **2.1** `watch.mjs` was broken. `watch.mjs` is removed; `build.mjs` (including `--watch`) uses the shared `scripts/bundle.mjs`.
- <a id="i-2-2"></a>🟢 **2.2** No lockfile. `package-lock.json` is tracked and no longer ignored.
- <a id="i-2-3"></a>🟢 **2.3** No CI. `.github/workflows/build.yml` runs `npm ci`, the version and changelog checks, `npm test`, both builds and `web-ext lint` on Node 22 and 24.
- <a id="i-2-4"></a>🟢 **2.4** Stale committed `dist/`. `dist/` is gitignored and not tracked; builds go to `build/chrome` and `build/firefox`.
- <a id="i-2-5"></a>🟢 **2.5** No minification, full source maps shipped. `scripts/bundle.mjs` sets `minify: !dev` and `sourcemap: dev`.
- <a id="i-2-6"></a>🟢 **2.6** Weak `tsconfig.json`. It has `module: ESNext`, `moduleResolution: Bundler`, `isolatedModules`, `esModuleInterop` and `strict: true`; `strictNullChecks` and `noImplicitAny` are still switched off (see 4.5).
- <a id="i-2-7"></a>🟢 **2.7** Abandoned `react-jsx` package. Not in `package.json`.
- <a id="i-2-8"></a>🟢 **2.8** React types did not match the React runtime. Done another way: React is now 19 and `react`, `react-dom`, `@types/react`, `@types/react-dom` are all `^19.3.0`, so the mismatch is gone.
- <a id="i-2-10"></a>🟢 **2.10** No tests. `npm test` runs `node --test "tests/**/*.test.ts"` (83 files in `tests/`, about 1,580 tests, no vitest) and CI runs it.
- <a id="i-2-11"></a>🟢 **2.11** Version hardcoded in five places. `package.json` is the source; `scripts/sync-version.mjs` copies it to `manifest.json`, `readme.md` and `changelog.html`, `npm run check-version` runs in CI, and the Firefox manifest is an overlay that takes the version from the base.
- <a id="i-2-13"></a>🟢 **2.13** No visual checks. Done another way: built with `puppeteer-core` instead of Playwright, under `tools/`: `npm run css:baseline` and `css:compare` (pixel diff against stored baselines, 894 shots), `store:shots`, `clips`, `perf:check`, plus `tools/drag-check` (real CDP drags, 212 checks) and `tools/firefox-check` (real Firefox through Marionette, 78 checks). None of them runs in CI, and there is no `npm run screenshots`.

</details>

## P3 — Firefox build notes (informational)

> [!TIP]
> **7.0.0:** 🟢 6 done (of 6). The whole section is closed: Firefox is built from this repo as MV3 and 7.0.0 is on AMO.

Firefox ships as MV3 from this repo since 7.0.0. `manifest.firefox.json` is an overlay merged onto `manifest.json` by `scripts/manifest.mjs`, `npm run build:firefox` emits `build/firefox`, and `npm run release` writes the zip and an unsigned `.xpi`. 7.0.0 is on AMO (addon 2593012, auto-approved 2026-10-10). Most of the notes below were written for the old MV2 build and no longer apply.

### Done in 7.0.0

<details><summary>6 items</summary>

- <a id="i-3-1"></a>🟢 **3.1** Firefox manifest pointed at files that do not exist (`vendor/babel-polyfill.js`, `dist/background.js`). Done another way: the file is now `manifest.firefox.json`, an overlay with `background.scripts: ["dist/service_worker/service_worker.js"]` and no `vendor/` reference; the build lives in this repo.
- <a id="i-3-2"></a>🟢 **3.2** `browser.action` is `undefined` on Firefox MV2. Done another way: Firefox builds are MV3 (`strict_min_version` 140), where `browser.action` exists; the code still calls `browser.action` directly and no shim was added.
- <a id="i-3-3"></a>🟢 **3.3** Context-menu items used the wrong context for Firefox MV2. Done another way: `"action"` is the valid context on Firefox MV3.
- <a id="i-3-4"></a>🟢 **3.4** No `gecko.id` and no way to grant `system.display`. Done another way: `manifest.firefox.json` now has `gecko.id`, `strict_min_version` and `data_collection_permissions`. `system.display` is deliberately removed (`optional_permissions: null`); on Firefox the code skips the permission (`IS_FIREFOX` branches in `windows.ts` and `TabManager.tsx`).
- <a id="i-3-5"></a>🟢 **3.5** MV2 is deprecated on AMO. Firefox runs as MV3 with `background.scripts` and `action` (`manifest.firefox.json`).
- <a id="i-3-6"></a>🟢 **3.6** PR #269 changes on Firefox MV2. Done another way: Firefox is no longer MV2, and `alarms` is in the Firefox permissions list. The 7.0.0 Firefox harness run (72 pass, 6 fail, none Firefox-only; see P6) covered saved windows, search, keys and the 5.2.4 to 7.0.0 upgrade, not the PR #269 restart paths.

</details>

## P4 — Modernization (larger efforts)

> [!TIP]
> **7.0.0:** 🟢 4 done · 4 open (of 8). React 19, no string refs, CSS tokens with OS dark mode and a deterministic boot are in. The `TabManager` split, immutable state, strict TypeScript and the dead-code sweep remain.

### Open

| | Item | What is wrong | Where | Fix |
|:-:|---|---|---|---|
| 🔵 | <a id="i-4-2"></a>**4.2** Break up `TabManager` by concern | `TabManager.tsx` has grown to 2,867 lines. Steps 2, 3 and 5 exist (`popup/duplicates.ts`, `popup/search.ts`, `helpers/settings.ts`), with small pure helpers such as `arrowWalk.ts`, `selectionKeys.ts`, `openMovePlan.ts`, `dragPayload.ts`, `pendingDelete.ts`. Steps 1, 4, 6, 7 and 8 do not exist. | `src/popup/views/TabManager.tsx` (no `browserEvents.ts`, `tabActions.ts`, `selection.ts` or `keyboard.ts` yet) | keep it a class component and move logic into plain modules, in the eight steps listed in the original below. Target about 400 lines. |
| 🔵 | <a id="i-4-3"></a>**4.3** State is changed in place | `hiddenTabs` is still mutated in place. Calls to `forceUpdate(` are down from 29 to 12 (`TabManager.tsx` 6, `Tab.tsx` 4, `StatsLayer.tsx` 1, `Window.tsx` 1). | `TabManager.tsx:1666,1862,1874,1927,2001,2004,2062` | replace collections through `setState(prev => …)`, so `PureComponent` or `memo` can work. |
| 🔵 | <a id="i-4-5"></a>**4.5** TypeScript is not fully strict | `strict` is on, but two key checks are off. Messages use one loose `ICommand` type. `helpers/utils.ts` is still untyped in places. The `createWindowWithSessionTabs` reduce-and-cast was not re-checked. | `tsconfig.json:42-44`, `src/types/ICommand.ts:5`, `helpers/utils.ts` | turn on `strictNullChecks` and `noImplicitAny`; make `ICommand` a discriminated union. |
| 🟡 | <a id="i-4-7"></a>**4.7** Dead code is left | `TabOptionsFirefox`, the dead `#root` block and `Session.maximize` are gone, and `TabManager.tsx` has 0 `console.log`s. Still there: 22 `console.log`s elsewhere in `src/`, and no `drop: ['console']` in `scripts/bundle.mjs`. Also unused but shipped in `images/`: `patron.png`, `donate.gif`, `get-the-addon.png`, `webstore.png`. | `getLocalStorageStringMap` and more | remove them, drop the unused images, and add esbuild `drop: ['console']` for release. |

<details><summary>Full locations and original findings for these 4 items</summary>

#### 4.2 · Break up `TabManager` by concern

- **Where:** `src/popup/views/TabManager.tsx` (no `browserEvents.ts`, `tabActions.ts`, `selection.ts` or `keyboard.ts` yet)
- **Fix:** keep it a class component and move logic into plain modules, in the eight steps listed in the original below. Target about 400 lines.

<details><summary>Original finding (2026-09-22)</summary>

- **Effort:** Break up `TabManager` by concern, not by component
- **Notes:** `TabManager.tsx` is ~1,560 lines on `7_0_0` (`render` 250, `checkKey` 249, `selectTo` 133, `search` 126, `loadStorage` 78); the same `<Window>` element is written twice for minimized/normal passes; the tab-walk loop in `checkKey` is pasted 4×. Keep it a class component and move logic into plain modules, each step independent, in this order: (1) `popup/browserEvents.ts`, `subscribe({fast, slow, message, storage})` returning an unsubscribe, mount/unmount become two lines; (2) `popup/duplicates.ts`, `getDuplicates(tabs)` is already pure; (3) `popup/search.ts`, `parseQuery` / `matchTab` / `searchTabs(tabs, query)` returning the hidden ids, pure, fixes 1.16 by construction, first candidate for vitest (2.10); (4) `popup/tabActions.ts`, typed wrappers `closeTabs` / `discardTabs` / `moveToWindow` / `openInNewWindow` / `focusTab` around `sendMessage<ICommand>`, so `deleteTabs` / `discardTabs` / `addWindow` / `pinTabs` / `drop` / `dropWindow` shrink to selection + call; (5) settings, see 1.21; (6) `popup/selection.ts`, a `Selection` class over the Set with `toggle`, `range` (today `selectTo`), `tabs(tabsbyid)`, `clear`, replacing the in-place mutation of `state.selection` (feeds 4.3); (7) `popup/keyboard.ts`, `checkKey` as a key → action table, the handler becomes a dispatch, the 4× tab-walk collapses, and the B4 cursor model lives here; (8) last, `render` split into `Toolbar`, `HoverHeader`, `WindowList` function components fed by props/context. Target: `TabManager` ≈ 400 lines (state, lifecycle, `update()`, the actions object, render composition). Not planned: hooks rewrite, a state library, or splitting the context into several providers; no gain at this size
- **Status (2026-10-10):** **Open**. `TabManager.tsx` has grown to 2,867 lines. Steps 2, 3 and 5 exist (`popup/duplicates.ts`, `popup/search.ts`, `helpers/settings.ts`), along with small pure helpers such as `arrowWalk.ts`, `selectionKeys.ts`, `openMovePlan.ts`, `dragPayload.ts`, `pendingDelete.ts`. Steps 1, 4, 6, 7 and 8 do not exist (no `browserEvents.ts`, `tabActions.ts`, `selection.ts` or `keyboard.ts`)

</details>

#### 4.3 · State is changed in place

- **Where:** `TabManager.tsx:1666,1862,1874,1927,2001,2004,2062`
- **Fix:** replace collections through `setState(prev => …)`, so `PureComponent` or `memo` can work.

<details><summary>Original finding (2026-09-22)</summary>

- **Effort:** Immutable state
- **Notes:** `selection`/`hiddenTabs`/`tabsbyid`/`windowsbyid` are mutated in place, papered over by 29 `forceUpdate()` calls and per-tab `setState` storms in `search`/`highlightDuplicates`; replacing collections via `setState(prev => …)` enables `PureComponent`/`memo` and removes whole classes of re-render bugs
- **Status (2026-10-10):** **Open**. `hiddenTabs` is still mutated in place (`TabManager.tsx:1666,1862,1874,1927,2001,2004,2062`). `forceUpdate(` calls are down from 29 to 12 (`TabManager.tsx` 6, `Tab.tsx` 4, `StatsLayer.tsx` 1, `Window.tsx` 1)

</details>

#### 4.5 · TypeScript is not fully strict

- **Where:** `tsconfig.json:42-44`, `src/types/ICommand.ts:5`, `helpers/utils.ts`
- **Fix:** turn on `strictNullChecks` and `noImplicitAny`; make `ICommand` a discriminated union.

<details><summary>Original finding (2026-09-22)</summary>

- **Effort:** `strict` TypeScript
- **Notes:** Most handlers and all of `helpers/utils.ts` are implicitly `any`; the whitelist-`reduce`-then-cast in `createWindowWithSessionTabs` launders untrusted persisted data into typed APIs; convert `ICommand` to a discriminated union so the message layer is checked
- **Status (2026-10-10):** **Open**. `tsconfig.json:42-44` has `strict: true` but `strictNullChecks: false` and `noImplicitAny: false`; `ICommand` (`src/types/ICommand.ts:5`) is still one interface with `command: string` and optional fields; `helpers/utils.ts` is still untyped in places. The `createWindowWithSessionTabs` reduce-and-cast was not re-checked

</details>

#### 4.7 · Dead code is left

- **Where:** `getLocalStorageStringMap` (`helpers/storage.ts:22`), `removeLocalStorage` (`:47`), `isInViewport` (`helpers/utils.ts:30`), each used only by its own test
- **Fix:** remove them, drop the unused images, and add esbuild `drop: ['console']` for release.

<details><summary>Original finding (2026-09-22)</summary>

- **Effort:** Dead code sweep
- **Notes:** `TabOptionsFirefox.jsx` (400 lines, unreferenced, doesn't compile — kept for now at the maintainer's request pending the Firefox build review), `popup.tsx:49-60` dead `#root` block, `Session.maximize` commented-out body, unused helpers (`getLocalStorageStringMap`, `removeLocalStorage`, `isInViewport`), ~37 `console.log`s in `TabManager.tsx` (esbuild `drop: ['console']` for release)
- **Status (2026-10-10):** **Open**, partly. `TabOptionsFirefox`, the dead `#root` block and `Session.maximize` are gone, and `TabManager.tsx` has 0 `console.log`s. Still there: `getLocalStorageStringMap` (`helpers/storage.ts:22`), `removeLocalStorage` (`:47`), `isInViewport` (`helpers/utils.ts:30`), each referenced only by its own test; 22 `console.log`s elsewhere in `src/`; no `drop: ['console']` in `scripts/bundle.mjs`. Also unused but shipped in `images/`: `patron.png`, `donate.gif`, `get-the-addon.png`, `webstore.png`

</details>

</details>

### Done in 7.0.0

<details><summary>4 items</summary>

- <a id="i-4-1"></a>🟢 **4.1** React 16 to 19. React 19.3, `createRoot` in `src/popup/popup.tsx`.
- <a id="i-4-4"></a>🟢 **4.4** String refs and ref reach-ins. No string refs remain (all refs are `createRef` objects or callbacks) and `dirtyWindow` / `runTabUpdate` no longer exist.
- <a id="i-4-6"></a>🟢 **4.6** CSS custom properties and OS dark mode. Tokens in `css/base/tokens.css` (about 500 `var(--` uses); `css/themes/dark.css` redefines them under `html[data-theme="dark"]`; `src/helpers/theme.ts` follows the OS live through `matchMedia("(prefers-color-scheme: dark)")` (System / Light / Dark). `popup.css` is now a 65-line entry and `css/` has 14 `!important`s. Leftover: `css/fun.css` still exists and nothing references it (delete it; planned as "Phase B2" of the scale work together with the last `!important`s).
- <a id="i-4-8"></a>🟢 **4.8** Popup boot. Done another way: `loadApp()` is called once behind a `booting` guard, with settings, windows and the own-tab check fetched in parallel (`popup/boot.ts`). It retries only after a failed boot, up to 10 times with growing delays; `window.loaded` is gone.

</details>

## P5 — Salvaged from the abandoned "5.3.0" branch

> [!TIP]
> **7.0.0:** 🟢 1 done · 1 to redo · 7 open (of 9). Favicons after first paint shipped. The rest are feature ideas that were not in scope for 7.0.0.

Before the 6.0.0 TypeScript rewrite, an uncommitted "5.3.0" working tree on the old JSX codebase (September 2024) prototyped a first MV3 port plus several features that never shipped. The MV3 port, storage migration, favicon API, AND/OR search, single-tab session restore, name-popup keyboard handling and dark-mode fixes all landed in 6.0.0 in better form. The items below are the parts that did **not** make it into 6.x. They are specs to reimplement in TypeScript, not code to copy. The prototype had bugs, noted per item.

### Open

| | Item | What is wrong | Where | Fix |
|:-:|---|---|---|---|
| 🔵 | <a id="i-5-1"></a>**5.1** Sort windows by more than age | Windows are still sorted by `windowAge` only, minimized last. No `sortOrder` or `sortDirection` setting exists. | `sortWindows` in `src/helpers/windows.ts:13` | add a "Sort Windows" menu next to Options with eight orders (click the active one again to flip direction; keys `1`–`8` pick, `Esc` closes). Save `sortOrder` and `sortDirection` in `storage.local`. Minimized windows always sort last. |
| 🔵 | <a id="i-5-2"></a>**5.2** Ctrl/Cmd keyboard shortcuts | Only two exist: `Ctrl`/`Cmd`+`Delete` and `+Backspace` close the selected tabs, and `Ctrl`/`Cmd`+`Z` undoes the last notice. The letter and number shortcuts do not. 7.0.0 added a keyboard cursor instead (arrows move, Space selects, Enter switches). | `src/popup/selectionKeys.ts:124` and more | add the shortcuts (layouts, duplicates, hide, discard, options, pin, sort menu, close) before the type-to-search branch. Check `Ctrl+D` and `Ctrl+H` on Firefox. |
| 🔵 | <a id="i-5-3"></a>**5.3** Shortcut hints in tooltips | There are no bracketed hints in the tooltips yet. The hover card of each action button now has a help text, which is where the hint would go. | `title=` strings in `TabManager.render()` (`src/popup/views/TabManager.tsx:448-541`) | once 5.2 exists, add the key in brackets (`[O]ptions`, `[S]ort Windows`, `[Del] Close selected tabs`, and so on). Do both in the same PR. |
| 🟡 | <a id="i-5-5"></a>**5.5** The drag favicon state is never shown | `Tab` tracks `dragFavIcon`, but nothing renders it. The drop marker is still the bare 2px `limiter` element. 7.0.0 added a drag image of the dragged tabs (a stack of tiles with a count) and a drop marker, so the ghost idea is half there. | `Tab.tsx:179` and more | finish the ghost, or delete the dead `dragFavIcon`/`dragFavicon` code. |
| 🟡 | <a id="i-5-7"></a>**5.7** Heavier text weight for selected tabs | Use `font-weight: 800` instead of `bold` for selected and highlighted tabs and for the info box. `font-weight: 800` is not used anywhere in `css/`. 7.0.0 changed the font to Noto Sans, so judge it again before changing. | `css/components/tab.css` (`.icon.highlighted`), `css/layout/frame.css` (`.infobox`) | a one-line CSS change, once the new font has been judged. |
| 🔵 | <a id="i-5-8"></a>**5.8** Automatic backups of saved windows | Export and import of saved windows and of settings exist, but nothing writes backups on a schedule. The only alarm is the hourly cleanup. It was listed for years in `changelog.html` as "planned for future versions" (removed there on 25 Sep 2026). Related: #161 (automatic session saving), #39 (restore error message), #53. | `src/popup/views/TabOptions.tsx` (export/import), `service_worker.ts:31` (hourly cleanup alarm) | on a schedule, write the `sessions` object to a rolling set of backups (downloads API, or an export the user can restore from the options page). |
| 🔵 | <a id="i-5-9"></a>**5.9** Font size and weight settings | No font settings exist in `helpers/settings.ts`, and `--tmp-font-size` is not in `css/` or `src/`. 7.0.0 shipped a `compact` switch (`settings.ts:36`), which is density, not text size or weight. Asked in #58 (with the Rows view), #197 (bigger titles), #99 (font options for dark mode). | `src/helpers/settings.ts`, `src/popup/views/TabOptions.tsx`, `css/popup.css` root tokens | two options-page settings, text size (small / normal / large) and text weight (normal / bold), applied as `--tmp-font-size` and `--tmp-font-weight` on the popup root. Keep tile grid metrics in `rem`. |
| 🔵 | <a id="i-5-4"></a>**5.4** Auto-title length cap (needs testing) | `Window.topEntries()` no longer exists. The automatic name is now built in `src/popup/windowName.ts` (public-suffix site names, up to 3 sites, then " & N more", compact form "+ N") with no character cap. Seen in 7.0.0: in the Rows view a long automatic name is cut by the fixed title column, so the "+ N" can disappear. | `src/popup/windowName.ts` | render the count as its own element. Re-test the 36-character cap (14 in `blocks`) against the new naming and the title trimming at `Window.tsx:138-160`. |

<details><summary>Full locations and original findings for these 8 items</summary>

#### 5.1 · Sort windows by more than age

- **Where:** `sortWindows` in `src/helpers/windows.ts:13`
- **Fix:** add a "Sort Windows" menu next to Options with eight orders (click the active one again to flip direction; keys `1`–`8` pick, `Esc` closes). Save `sortOrder` and `sortDirection` in `storage.local`. Minimized windows always sort last.

<details><summary>Original finding (2026-09-22)</summary>

- **Feature / fix:** **Window sort menu**
- **Spec:** A "Sort Windows" icon in the top bar (next to Options) toggles a small dropdown listing sort orders: Last Active (current default), Window Title, Color, Id, Tab Count, Left Position, Top Position, Window Size. Clicking the active order again flips direction. While the menu is open, keys `1`–`8` pick an order and close the menu; `Esc` closes it. Persist `sortOrder` (string) and `sortDirection` (boolean) in `storage.local` with the other settings. Minimized windows always sort after normal windows regardless of order.
- **Where in 6.x:** Comparator in `TabManager.update()` (`src/popup/views/TabManager.tsx:731-743`) currently sorts by `windowAge` only; `checkKey` (`:1050`) handles `Esc` and should close the menu first if it is open before clearing the search
- **Notes:** Prototype bugs not to repeat: the "Window Size" comparator computed `b.width * a.height`; a ninth "Fixed" order was identical to "Id"; the dropdown CSS was placeholder colours. Title/Color orders read `windowNames`/`windowColors` from storage, so the comparator needs those maps loaded once before sorting, not per compare
- **Status (2026-10-10):** **Open**. Windows are still sorted by `windowAge` only, minimized last (`sortWindows` in `src/helpers/windows.ts:13`); no `sortOrder` / `sortDirection` setting exists

</details>

#### 5.2 · Ctrl/Cmd keyboard shortcuts

- **Where:** `src/popup/selectionKeys.ts:124` (the two that exist); the rest goes in `checkKey`, `src/popup/views/TabManager.tsx:1050-1120`
- **Fix:** add the shortcuts (layouts, duplicates, hide, discard, options, pin, sort menu, close) before the type-to-search branch. Check `Ctrl+D` and `Ctrl+H` on Firefox.

<details><summary>Original finding (2026-09-22)</summary>

- **Feature / fix:** **Ctrl/Cmd keyboard shortcuts**
- **Spec:** With the popup focused, `Ctrl`/`Cmd` + key triggers the toolbar actions: `1`/`2`/`3`/`4` → horizontal / vertical / blocks / blocks-big layout, `D` highlight duplicates, `H` toggle hide-unmatched-tabs, `L` cycle layout, `M` discard selected tabs, `O` toggle options, `P` pin selected tabs, `S` toggle the sort menu (5.1), `Del`/`Backspace` close selected tabs (or the current tab). Handle in `checkKey` before the "any typed key focuses the search box" branch.
- **Where in 6.x:** `src/popup/views/TabManager.tsx:1050-1120` (`checkKey`); `changelayout(layout)` already accepts an explicit layout argument
- **Notes:** Needs testing on Firefox: the popup owns focus so most combos are safe, but `Ctrl+D` (bookmark) and `Ctrl+H` (history sidebar) may still reach the browser on some platforms — verify and remap if so
- **Status (2026-10-10):** **Open**, except two keys: `Ctrl`/`Cmd`+`Delete` and `+Backspace` close the selected tabs (`src/popup/selectionKeys.ts:124`) and `Ctrl`/`Cmd`+`Z` undoes the last notice. The letter and number shortcuts do not exist. 7.0.0 added a keyboard cursor instead (arrows move, Space selects, Enter switches)

</details>

#### 5.3 · Shortcut hints in tooltips

- **Where:** `title=` strings in `TabManager.render()` (`src/popup/views/TabManager.tsx:448-541`)
- **Fix:** once 5.2 exists, add the key in brackets (`[O]ptions`, `[S]ort Windows`, `[Del] Close selected tabs`, and so on). Do both in the same PR.

<details><summary>Original finding (2026-09-22)</summary>

- **Feature / fix:** **Shortcut hints in tooltips**
- **Spec:** Once 5.2 exists, annotate the toolbar tooltips with the key in brackets so the shortcuts are discoverable: `[O]ptions`, `[S]ort Windows`, `Change [L]ayout to … View`, `[Del] Close selected tabs`, `[M] Discard selected tabs … free [M]emory`, `[P]in selected tabs`, `[H]ide tabs that do not match search`, `[Enter] Move tabs to new window`, `Highlight [D]uplicates`.
- **Where in 6.x:** `title=` strings in `TabManager.render()` (`src/popup/views/TabManager.tsx:448-541`)
- **Notes:** Trivial once 5.2 lands; keep the two in the same PR
- **Status (2026-10-10):** **Open**: no bracketed hints in the tooltips. The hover card of each action button now has a help text, which is where the hint would go

</details>

#### 5.5 · The drag favicon state is never shown

- **Where:** `Tab.tsx:179` (`<div className="limiter" />`), `css/components/tab.css:285-311`; `dragFavIcon` is set at `Tab.tsx:31,258,313,325,340` and read by nothing
- **Fix:** finish the ghost, or delete the dead `dragFavIcon`/`dragFavicon` code.

<details><summary>Original finding (2026-09-22)</summary>

- **Feature / fix:** **Render the drag-favicon state**
- **Spec:** `Tab` already tracks `dragFavIcon` (set in `dragStart` from the dragged tab's favicon, updated in `dragOver`, cleared in `dragOut`/`drop` — `src/popup/views/Tab.tsx:13,170-232`) and `TabManager.dragFavicon()` shares it across tabs, but nothing renders it: the drop indicator is still the bare 2px `<div className="limiter" />` (`Tab.tsx:117`, `css/popup.css:508-533`). Prototype: render a left and a right (or top and bottom in vertical layout) drop-zone element per tab, sized like a tab (~2.5rem square), hidden by default and shown on the side matching `draggingOver`, with `background-image` set to the dragged favicon so the user sees a ghost of the tab at its future position.
- **Where in 6.x:** `Tab.tsx` render + `popup.css` limiter rules
- **Notes:** Either finish this or delete the dead `dragFavIcon`/`dragFavicon` plumbing. Prototype bug not to repeat: its horizontal `dragOver` compared `offsetX > clientWidth` (never true), so always use `clientWidth / 2` as 6.x does
- **Status (2026-10-10):** **Open**. Now `Tab.tsx:179` (`<div className="limiter" />`), CSS in `css/components/tab.css:285-311`; `dragFavIcon` is still set (`Tab.tsx:31,258,313,325,340`) and read by nothing. 7.0.0 added a drag image of the dragged tabs (a stack of tiles with a count) and a drop marker, so the ghost idea is half there; the dead state can go

</details>

#### 5.7 · Heavier text weight for selected tabs

- **Where:** `css/components/tab.css` (`.icon.highlighted`), `css/layout/frame.css` (`.infobox`)
- **Fix:** a one-line CSS change, once the new font has been judged.

<details><summary>Original finding (2026-09-22)</summary>

- **Feature / fix:** **Heavier selection weight**
- **Spec:** Use `font-weight: 800` instead of `bold` for selected and highlighted tabs (`.icon.selected`, `.icon.highlighted`) and for the info box, so selection reads more clearly at the 12px title size.
- **Where in 6.x:** `css/popup.css:226` (`.icon.highlighted`), `:671,727` (`.infobox`); `.icon.selected` has no weight rule today
- **Notes:** Cosmetic; one-line CSS change
- **Status (2026-10-10):** **Open**. Now `css/components/tab.css` (`.icon.highlighted`) and `css/layout/frame.css` (`.infobox`); `font-weight: 800` is not used anywhere in `css/`. 7.0.0 changed the font to Noto Sans, so judge it again before changing

</details>

#### 5.8 · Automatic backups of saved windows

- **Where:** `src/popup/views/TabOptions.tsx` (export/import), `service_worker.ts:31` (hourly cleanup alarm)
- **Fix:** on a schedule, write the `sessions` object to a rolling set of backups (downloads API, or an export the user can restore from the options page).

<details><summary>Original finding (2026-09-22)</summary>

- **Feature / fix:** **Auto-backups of saved sessions**
- **Spec:** Listed for years at the top of `changelog.html` as "planned for future versions" (removed from there on 25 Sep 2026). Periodically write the `sessions` object to a rolling set of backup files (downloads API, or an export the user can restore from the options page), so a lost profile or a bad migration does not take the saved windows with it
- **Where in 6.x:** `src/popup/views/TabOptions.tsx` (export/import already exist there), worker alarm
- **Notes:** Related: #161 (automatic session saving), #39 (restore error message), #53
- **Status (2026-10-10):** **Open**: export and import of saved windows and of settings exist in `TabOptions.tsx`, but nothing writes backups on a schedule (the only alarm is the hourly cleanup in `service_worker.ts:31`)

</details>

#### 5.9 · Font size and weight settings

- **Where:** `src/helpers/settings.ts`, `src/popup/views/TabOptions.tsx`, `css/popup.css` root tokens
- **Fix:** two options-page settings, text size (small / normal / large) and text weight (normal / bold), applied as `--tmp-font-size` and `--tmp-font-weight` on the popup root. Keep tile grid metrics in `rem`.

<details><summary>Original finding (2026-09-22)</summary>

- **Feature / fix:** **Font size and weight settings**
- **Spec:** Asked in #58 (with the Rows view), #197 (bigger titles), #99 (font options for dark mode). Two settings on the options page: text size (small / normal / large) and text weight (normal / bold), stored like the other settings (`helpers/settings.ts`) and applied as `--tmp-font-size` / `--tmp-font-weight` custom properties on the popup root, so every layout picks them up (list rows, strip titles, window titles, chips scale with `em`). Also mirror them in the boot cache so the first frame is right
- **Where in 6.x:** `src/helpers/settings.ts`, `src/popup/views/TabOptions.tsx`, `css/popup.css` root tokens
- **Notes:** Keep the tile grid metrics in `rem`, only text in `em`, or the block layouts reflow with the setting
- **Status (2026-10-10):** **Open**: no font settings in `helpers/settings.ts`, and no `--tmp-font-size` in `css/` or `src/`. 7.0.0 shipped a `compact` switch (`settings.ts:36`), which is density, not text size or weight

</details>

#### 5.4 · Auto-title length cap (needs testing)

- **Where:** `src/popup/windowName.ts`
- **Fix:** render the count as its own element. Re-test the 36-character cap (14 in `blocks`) against the new naming and the title trimming at `Window.tsx:138-160`.

<details><summary>Original finding (2026-09-22)</summary>

- **Feature / fix:** **Auto-title length cap** (needs testing)
- **Spec:** `Window.topEntries()` currently keeps at most 2–3 hostnames and appends "& N more", regardless of how long they are, so a window with two long hostnames overflows the title bar. Prototype: after sorting by frequency, sum the entry lengths and pop entries from the end while the total exceeds a cap — 36 characters normally, 14 in the `blocks` layout — always keeping at least one, and count the popped ones in "& N more".
- **Where in 6.x:** `src/popup/views/Window.tsx:761-790` (`topEntries`)
- **Notes:** Test against the existing 3-entry special case and against the newer title-trimming logic at `Window.tsx:138-160`, which already shortens individual entries; the cap may need to be a prop from the layout, since `topEntries` has no access to it today
- **Status (2026-10-10):** **Changed**: `Window.topEntries()` no longer exists. The automatic name is built in `src/popup/windowName.ts` (public-suffix site names, up to 3 sites, then " & N more", compact form "+ N") with no character cap. Seen in 7.0.0: in the Rows view a long automatic name is cut by the fixed title column, so the "+ N" can disappear; render the count as its own element

</details>

</details>

### Done in 7.0.0

<details><summary>1 item</summary>

- <a id="i-5-6"></a>🟢 **5.6** Favicons that arrive after first paint. `Tab.tsx` `componentDidUpdate` re-resolves when `status`, `favIconUrl`, `url` or `pendingUrl` changed. The optional delayed retry was not added.

</details>

Items from the same branch that were reviewed and deliberately **not** carried over: an opaque `.color1`–`.color25` palette with `!important` (6.x uses a translucent palette on purpose), a Tahoma/Geneva font stack, removed box-shadows, a `react-tooltip` integration that was already disabled in the prototype, a `focusOnTabAndWindow` that moved windows to `left: 0, top: 0` on every focus (a bug), and a tab-number prefix (`1. Title`) in tab titles.

## P6 — Found after the release (2026-10-09/10)

> [!NOTE]
> **12 new items.** Four are on the 7.0.1 shortlist. The rest wait.

New since the review. Sources: Copilot's last pass on PR #273, the Firefox test run (`tools/firefox-check`, Firefox 157: 72 pass, 6 fail, none caused by Firefox-only code), and things seen while recording the update clips and store shots.

### Do next (7.0.1 shortlist)

| | Item | What is wrong | Where | Fix |
|:-:|---|---|---|---|
| 🟠 | <a id="i-6-1"></a>**6.1** The "just used" label goes stale | In own-tab mode and the Firefox sidebar, the freshness label ("just used", "5 min ago") only updates on a render, so a page left open shows an old label. | `src/popup/freshness.ts` (pure functions), rendered in `Tab.tsx` | schedule one refresh at the next threshold (a timer per page, not per tab). |
| 🟠 | <a id="i-6-2"></a>**6.2** Dropping our own drag on the search box types text into it | Dropping a saved tab or a saved window card on the search box types its address or name into the box (Firefox harness F02, F03; predicted in the saved windows review). | search box in `TabManager.tsx`; `src/popup/dragPayload.ts` | cancel drops of our own drag types over inputs. |
| 🟠 | <a id="i-6-3"></a>**6.3** Drops onto a saved window in another page do nothing | Across two Tab Manager pages, an open or saved tab dropped on a **saved** window in the other page does nothing (F08c1, F08c2, failed twice). Drops on open tabs work. | `src/popup/dragPayload.ts` (the drop reads the page's own memory of the drag) | read the saved-window drop target from the payload, as the open-tab path does; add it to `tools/drag-check`. |
| 🟠 | <a id="i-6-7"></a>**6.7** `system.display` is optional and "Show all monitors" is off | `system.display` is an optional permission (`manifest.json:26-27`) and "Show all monitors" defaults to unset (`settings.ts:63`). There is no prompt either way. | manifest, settings | move it to required permissions and default the switch to on (maintainer decision on publish day). |

<details><summary>Full locations and original findings for these 4 items</summary>

#### 6.1 · The "just used" label goes stale

- **Where:** `src/popup/freshness.ts` (pure functions), rendered in `Tab.tsx`
- **Fix:** schedule one refresh at the next threshold (a timer per page, not per tab).

#### 6.2 · Dropping our own drag on the search box types text into it

- **Where:** search box in `TabManager.tsx`; `src/popup/dragPayload.ts`
- **Fix:** cancel drops of our own drag types over inputs.

#### 6.3 · Drops onto a saved window in another page do nothing

- **Where:** `src/popup/dragPayload.ts` (the drop reads the page's own memory of the drag)
- **Fix:** read the saved-window drop target from the payload, as the open-tab path does; add it to `tools/drag-check`.

#### 6.7 · `system.display` is optional and "Show all monitors" is off

- **Where:** manifest, settings
- **Fix:** move it to required permissions and default the switch to on (maintainer decision on publish day).

</details>

### Open

| | Item | What is wrong | Where | Fix |
|:-:|---|---|---|---|
| 🟡 | <a id="i-6-4"></a>**6.4** The "Opened 1 saved tab" header is replaced by hover text | After a saved-tab drop, the header "Opened 1 saved tab in …" is replaced by the hover text in about half the drops (mouseover on the target and the new tile). | hover header in `TabManager.tsx` | keep a fresh notice in front of hover text for its first second. |
| 🟠 | <a id="i-6-5"></a>**6.5** A deleted saved window can stay stored | Deleting a saved window and closing an own-tab Tab Manager window right away sometimes keeps the window stored (the flush on close is lost; about half the tries in some runs, F14). | `src/popup/pendingDelete.ts` (`pagehide` flush) | check in the real popup first; write the delete at once and keep only the Undo in memory. |
| 🟡 | <a id="i-6-6"></a>**6.6** Firefox checklist item 21 is in the wrong order | In `plans/sessions/TESTING.md`, plain Delete returns focus to the box, so the following Ctrl+Delete deletes a word. | the checklist, not the code | fix the checklist. |
| 🟡 | <a id="i-6-8"></a>**6.8** The popup flips narrow rules at 540 px or less | A popup at 540 px or less flips the narrow rules every frame (Chrome lays an extension popup out at 25 px first). The search field is 42 px narrower at 541-700 px. | `css/layout/narrow.css`, guarded by `tests/popupWidthQueries.test.ts` | container queries on a stable element. |
| 🟡 | <a id="i-6-9"></a>**6.9** The new-window icon blurs at 16 px | The title-bar dots of the new-window icon blur into a stripe at 16 px. | `src/icons/families/muted.ts` | redraw the 16 px variant. |
| 🟡 | <a id="i-6-10"></a>**6.10** Firefox minimized-window restore is untested on multiple monitors | Restore bounds for minimized windows on Firefox are untested on a real multi-monitor setup. | `background/windows.ts` restore path | hand check. |
| 🔵 | <a id="i-6-11"></a>**6.11** No Undo for closing tabs and windows | Undo does not exist for closing tabs and windows (Ctrl+Delete, middle click, the close buttons). The `sessions` API (`sessions.getRecentlyClosed` + `sessions.restore`) would bring tabs back with history. | new feature; needs the `sessions` permission (optional, requested on first use) | show the Undo notice after a close and restore on Undo or Ctrl+Z. Without the permission, reopen the urls at the old index. |
| 🔵 | <a id="i-6-12"></a>**6.12** Saved windows, later | The name screen could show tab count and saved date. Also open: pin and unpin saved tabs; keyboard moves for tabs (Alt+arrows, focusable cards); the Undo of an emptying move lives only in the popup that offered it (8 s); the multi-tab drag image keeps its size in compact mode and at popup zoom. | `Session.tsx`, `WindowOptions.tsx`, `pendingDelete.ts`, drag image in `TabManager.tsx` | decisions of 2026-10-07, in the maintainer's queue. |

<details><summary>Full locations and original findings for these 8 items</summary>

#### 6.4 · The "Opened 1 saved tab" header is replaced by hover text

- **Where:** hover header in `TabManager.tsx`
- **Fix:** keep a fresh notice in front of hover text for its first second.

#### 6.5 · A deleted saved window can stay stored

- **Where:** `src/popup/pendingDelete.ts` (`pagehide` flush)
- **Fix:** check in the real popup first; write the delete at once and keep only the Undo in memory.

#### 6.6 · Firefox checklist item 21 is in the wrong order

- **Where:** the checklist, not the code
- **Fix:** fix the checklist.

#### 6.8 · The popup flips narrow rules at 540 px or less

- **Where:** `css/layout/narrow.css`, guarded by `tests/popupWidthQueries.test.ts`
- **Fix:** container queries on a stable element.

#### 6.9 · The new-window icon blurs at 16 px

- **Where:** `src/icons/families/muted.ts`
- **Fix:** redraw the 16 px variant.

#### 6.10 · Firefox minimized-window restore is untested on multiple monitors

- **Where:** `background/windows.ts` restore path
- **Fix:** hand check.

#### 6.11 · No Undo for closing tabs and windows

- **Where:** new feature; needs the `sessions` permission (optional, requested on first use)
- **Fix:** show the Undo notice after a close and restore on Undo or Ctrl+Z. Without the permission, reopen the urls at the old index.

#### 6.12 · Saved windows, later

- **Where:** `Session.tsx`, `WindowOptions.tsx`, `pendingDelete.ts`, drag image in `TabManager.tsx`
- **Fix:** decisions of 2026-10-07, in the maintainer's queue.

</details>

Fixed between the review and the release, so not listed above: the discarded-tab icons that stayed at 80 % opacity during a search (`css/components/tab.css:271`), the prefix-only search that selected every tab, the hover slowdown with many tabs (an unguarded `max-width` media query made the popup restyle on every mouse move), and the popup size clamp.

## P7 — Milestone 7.1.0 (2026-10-10)

> [!NOTE]
> **10 items for 7.1.0.** Six are the issues on the [7.1.0 milestone](https://github.com/stefanXO/Tab-Manager-Plus/milestone/2), four come from the maintainer's own notes on release day.

| | Item | What is wrong | Where | Fix |
|:-:|---|---|---|---|
| 🟠 | <a id="i-7-1"></a>**7.1** A missed click between two tabs closes the popup ([#152](https://github.com/stefanXO/Tab-Manager-Plus/issues/152)) | While selecting tabs (Shift held, or a few tabs already selected), a click that lands in the gap between two tabs counts as a click on the window. The popup closes, the window gets focus, and the selection is lost. | `Window.tsx:322` (`onClick={this.windowClick}` on the whole window), handler at `Window.tsx:433` | do not focus the window when Shift, Ctrl or Cmd is held or when any tab is selected; only a plain click on empty window space focuses it. #152 also asks to keep the selection when the popup is opened again (idea, later). |
| 🟡 | <a id="i-7-2"></a>**7.2** Side padding is too wide at tiny widths | In very narrow pages, like the Firefox sidebar, the side padding takes space the tabs need. | `css/layout/narrow.css:15` (`max-width: 450px` block) | smaller side padding below about 320 px. |
| 🟠 | <a id="i-7-3"></a>**7.3** The options break out of their box at small widths | At small widths the Theme choice (System, Light, Dark) runs past the box, and the "Donate and Rate buttons" text wraps under its switch instead of staying next to it. | `css/components/controls.css:96` (`.choice`), `css/components/options.css:170` (`@container (min-width: 26rem)`) | let the choice shrink (smaller padding, then wrap), and keep each switch and its label on one row. |
| 🟡 | <a id="i-7-4"></a>**7.4** Text is a little large at small widths | Together with 7.2 and 7.3: at small widths a slightly smaller font would fit more. | `css/layout/narrow.css`, `css/base/typography.css` | lower the base size a step in the narrow rules (watch the 25 px first-layout rule in `tests/popupWidthQueries.test.ts`). |
| 🔵 | <a id="i-7-5"></a>**7.5** Show which window a dragged tab will land in ([#97](https://github.com/stefanXO/Tab-Manager-Plus/issues/97)) | While dragging tabs there is a marker between tabs, but nothing shows which window is under the pointer. | `Window.tsx:319-321` (`dragOver`, `dragLeave`), `css/components/drag.css` | add a class on the window under the pointer during a drag (outline or tinted background), cleared on leave and drop. |
| 🔵 | <a id="i-7-6"></a>**7.6** Font size and weight options ([#99](https://github.com/stefanXO/Tab-Manager-Plus/issues/99)) | Users ask for a font size setting and bold or normal titles. The selected-tab colours in the issue are fixed in 7.0.0. | options, `css/base/tokens.css` | same as [**5.9**](#i-5-9): a size and a weight setting that set CSS variables. |
| 🔵 | <a id="i-7-7"></a>**7.7** A switch to stop window reordering ([#160](https://github.com/stefanXO/Tab-Manager-Plus/issues/160)) | Windows move around as focus changes, which is disorienting while managing tabs. | `sortWindows` in `src/helpers/windows.ts:13` | a "Keep window order" option; see also #136 and #253. |
| 🔵 | <a id="i-7-8"></a>**7.8** Custom window sorting ([#266](https://github.com/stefanXO/Tab-Manager-Plus/issues/266)) | Users want to sort windows by number of tabs, age and so on, so the layout does not shift when they focus a big window. | `sortWindows` in `src/helpers/windows.ts:13` | a sort setting next to 7.7; see [**5.1**](#i-5-1). |
| 🟡 | <a id="i-7-9"></a>**7.9** The tab count badge cuts off above 999 ([#250](https://github.com/stefanXO/Tab-Manager-Plus/issues/250)) | With more than 999 tabs the number on the toolbar icon is cut off. | `src/service_worker/background/tabs.ts:115` (`setBadgeText`) | show a short form above 999, like "1.6k", and keep the full number in the icon's tooltip. |
| 🔴 | <a id="i-7-10"></a>**7.10** Firefox window names can be lost after a restart ([#159](https://github.com/stefanXO/Tab-Manager-Plus/issues/159)) | After quitting and restarting Firefox, names given to windows are not always kept. | window matching in `src/helpers/windows.ts` | same cause as [**1.15**](#i-1-15); fix there, then test on Firefox. |
