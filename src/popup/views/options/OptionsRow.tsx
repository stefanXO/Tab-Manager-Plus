"use strict";

import * as React from "react";

// Options side by side: two equal columns while the options box is wide
// enough, one above the other when it is narrow (a container query in
// css/components/options.css, so it follows the box, not the window).
export function OptionsRow({ children } : { children : React.ReactNode }) {
	return (
		<div className="options-row">
			<div className="options-row-grid">{children}</div>
		</div>
	);
}
