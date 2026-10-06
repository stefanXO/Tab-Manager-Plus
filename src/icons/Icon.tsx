"use strict";

import * as React from "react";
import type { IconDef } from "./types.ts";
import { iconSvg, cssPaint } from "./svg.ts";

// One icon, live in the page: strokes in currentColor, tints and fills
// from the --icon-* properties (palette.ts paletteCss), so it follows the theme.
export function Icon({ def, size = 16 } : { def : IconDef, size? : number }) {
	return <span className="ico" aria-hidden="true" dangerouslySetInnerHTML={{ __html: iconSvg(def, size, cssPaint(def.role)) }} />;
}
