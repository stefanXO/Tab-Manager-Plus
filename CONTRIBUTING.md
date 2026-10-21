# Contributing to Tab Manager Plus

Thanks for your interest. This is a one-maintainer project with about 200,000 users,
so the rules below exist to keep review time small and releases safe. Please read
them before opening an issue or a pull request.

## Issues

- **One request per issue.** Search first; duplicates are closed with a link.
- **Use the issue forms.** A bug needs browser, version and steps. A feature needs
  the problem you want solved, not only the solution you have in mind.
- **Check the roadmap first.** See the [roadmap](https://tabmanagerplus.com/roadmap.html)
  (built from [IMPROVEMENTS.md](IMPROVEMENTS.md)) for what is planned, done, or
  deliberately left as is. If your idea is there, comment on the linked issue
  instead of opening a new one.
- **Old issues.** Do not comment on an issue that has been quiet for over a year
  unless you add new information (a reproduction on the current version, or a pull
  request that closes it). "Me too", "any update?" and "I am working on this" do
  not count and will be hidden.
- **Do not announce features on other people's issues.** Only the maintainer says
  what ships. If you have a change, link a pull request.

## Pull requests

- **Fork, branch, PR.** Code is reviewed only as a pull request against `master`.
  Patches, zip files, compiled builds or links to downloads in issue comments are
  not reviewed and will be hidden. Nobody should have to run an unknown binary to
  see a change.
- **One feature or fix per PR.** Small PRs get merged. A PR that touches several
  features, or that reorganises files it did not need to touch, is sent back.
- **Link an issue.** Every PR closes or references an existing issue. For a new
  idea, open the issue first and wait for a go before writing code, so your work
  does not land on something that will not be merged.
- **Keep to the roadmap.** Features not on the
  [roadmap](https://tabmanagerplus.com/roadmap.html) may be declined even if the
  code is good. The extension is kept deliberately small.
- **Firefox and Chrome.** Every change must work in both. Say which you tested on.
- **Describe the change for users**, with a screenshot or short video for anything
  visual, and a line for CHANGELOG.md.

### Before you push

```
npm install            # Node 22.18 or newer
npm test               # all tests pass
npm run build          # Chrome, includes tsc
npm run build:firefox  # Firefox
```

Also:

- No new npm dependencies without discussing it first.
- No new `!important` in CSS (the few left are being removed). No native `window.alert()`
  in the popup, and no unguarded `max-width` media query; tests enforce both.
- After editing icons in `src/icons/`, run `npm run icons:css` and commit the result.
- Do not change `manifest.json` permissions or version numbers.
- Do not commit `build/`, `release/` or anything under `plans/`.

### AI-assisted code

Fine, with the same rules. You are responsible for what you submit: read the
diff, test it in a real browser, and keep it small enough to review. Large
generated PRs are closed.

## Review and merge

Review happens when there is time; there is no response-time promise. A PR with
no activity for 60 days after a review comment is closed and can be reopened.
Everything merged is licensed under MPL-2.0 like the rest of the project.

## Other ways to help

Test release candidates on Firefox, confirm or narrow down open bugs on the
current version, and improve the help page. These are often worth more than
new features.
