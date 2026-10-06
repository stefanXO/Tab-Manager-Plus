"use strict";

import * as React from "react";
import {ControlLabel, DescribedOption, Description, LEFT_LABEL_STYLE, OptionTitle} from "./shared";

// A number field. `labelFirst`: the title label goes before the field (the
// popup size fields) instead of after it. No description when none is given.
export function NumberOption({ id, help, label, description, notes, icon, value, onChange, min, max, step, className = "", labelFirst = false } : DescribedOption & {
	value : number,
	onChange : (e : React.ChangeEvent<HTMLInputElement>) => void,
	min : string,
	max? : string,
	step? : string,
	className? : string,
	labelFirst? : boolean
}) {
	const title = (
		<label className="textlabel" htmlFor={id} style={LEFT_LABEL_STYLE}>
			<OptionTitle icon={icon}>{label}</OptionTitle>
		</label>
	);
	return (
		<div className={"toggle-box" + (className && " " + className)} {...help}>
			{labelFirst && title}
			<input type="number" min={min} max={max} step={step} onChange={onChange} value={value} id={id} name={id} />
			<ControlLabel id={id} />
			{!labelFirst && title}
			{description !== undefined && <Description text={description} notes={notes} />}
		</div>
	);
}
