// Writes css/components/icons.css: the popup's icons (the --icon-* palette
// and the family's images for the .icon classes) from src/icons/families/muted.ts.
// The text comes from iconsCss() (src/icons/stylesheet.ts); this only writes
// it. Run after changing a drawing: tests/iconsStylesheet.test.ts fails while
// the file is stale.
//
//   node scripts/icons-css.mjs   (npm run icons:css)
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { iconsCss } from '../src/icons/stylesheet.ts'

const out = fileURLToPath(new URL('../css/components/icons.css', import.meta.url))
const css = iconsCss()
writeFileSync(out, css)
console.log('icons ->', out, (css.length / 1024).toFixed(0) + ' KiB')
