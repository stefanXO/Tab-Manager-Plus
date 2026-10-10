# fonts

Noto Sans (variable, weight 400 to 700), SIL Open Font License 1.1, https://fonts.google.com/noto/specimen/Noto+Sans.

One woff2 per script subset, as Google Fonts serves them (css2 API, `family=Noto+Sans:wght@400..700`).
The `@font-face` rules in `css/base/typography.css` give each file a `unicode-range`, so the browser
loads a file only when a title or page shows a character in that range: Latin pages load `latin` alone.
