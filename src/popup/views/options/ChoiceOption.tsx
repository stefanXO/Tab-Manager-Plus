"use strict";

import * as React from "react";
import {DescribedOption, Description, LABEL_STYLE} from "./shared";

// One of a few values: a segmented row of radio buttons, on the line where a
// switch would be, the title label after it.
export function ChoiceOption<T extends string>({ id, help, label, description, notes, value, choices, onChange } : DescribedOption & {
	value : T,
	choices : readonly { value : T, label : string }[],
	onChange : (value : T) => void
}) {
	return (
		<div className="toggle-box" {...help}>
			<div className="choice" role="radiogroup" aria-labelledby={id + "_label"}>
				{choices.map((c) => (
					<label key={c.value}>
						<input type="radio" name={id} value={c.value} checked={value === c.value} onChange={() => onChange(c.value)} />
						<span>{c.label}</span>
					</label>
				))}
			</div>
			<span className="textlabel" id={id + "_label"} style={LABEL_STYLE}>
				{label}
			</span>
			<Description text={description} notes={notes} />
		</div>
	);
}
