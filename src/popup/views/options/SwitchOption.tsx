"use strict";

import * as React from "react";
import {ControlLabel, DescribedOption, Description, LABEL_STYLE, OptionTitle} from "./shared";

// An on/off switch.
export function SwitchOption({ id, help, label, description, notes, icon, checked, onChange } : DescribedOption & {
	checked : boolean,
	onChange : () => void
}) {
	return (
		<div className="toggle-box" {...help}>
			<div className="toggle">
				<input type="checkbox" onChange={onChange} checked={checked} id={id} name={id} />
				<ControlLabel id={id} />
			</div>
			<label className="textlabel" htmlFor={id} style={LABEL_STYLE}>
				<OptionTitle icon={icon}>{label}</OptionTitle>
			</label>
			<Description text={description} notes={notes} />
		</div>
	);
}
