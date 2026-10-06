"use strict";

import * as React from "react";
import {ControlLabel, DescribedOption, Description, LABEL_STYLE, OptionTitle} from "./shared";

// A control that runs an action (a button, a file picker), titled by an <h4>
// in its label. `children` is the control; it must carry `id`.
export function ActionOption({ id, help, label, description, notes, icon, children } : DescribedOption & { children : React.ReactNode }) {
	return (
		<div className="toggle-box" {...help}>
			<div className="toggle-box">
				<label className="textlabel" htmlFor={id} style={LABEL_STYLE}>
					<h4><OptionTitle icon={icon}>{label}</OptionTitle></h4>
				</label>
				{children}
				<ControlLabel id={id} />
			</div>
			<Description text={description} notes={notes} />
		</div>
	);
}
