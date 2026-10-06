"use strict";

import { family } from "@icons/families/muted";

// The family the popup uses (family F, "flat muted"): the options screen's
// row icons (views/options) draw it live, and css/components/icons.css,
// generated from the same file (npm run icons:css), draws the toolbar,
// window and favicon icons and holds the --icon-* palette the live <Icon>s
// paint their role colours with, so the two always match.
export const ICON_FAMILY = family;
