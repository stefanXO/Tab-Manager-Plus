"use strict";

import * as React from "react";
import {OptionHelp} from "./shared";

// A titled box of options.
export function OptionsBox({ title, help, children } : { title : string, help? : OptionHelp, children : React.ReactNode }) {
	return (
		<div className="optionsBox" {...help}>
			<h4>{title}</h4>
			{children}
		</div>
	);
}
