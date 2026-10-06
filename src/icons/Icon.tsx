"use strict";

import * as React from "react";
import type { IconDef } from "./types.ts";
import { iconSvg } from "./svg.ts";

// One icon, live in the page: the same inline SVG as the stylesheet's
// images, every part in its named colour.
export function Icon({ def, size = 16 } : { def : IconDef, size? : number }) {
	return <span className="ico" aria-hidden="true" dangerouslySetInnerHTML={{ __html: iconSvg(def, size) }} />;
}
