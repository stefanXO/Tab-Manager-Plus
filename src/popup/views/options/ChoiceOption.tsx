"use strict";

import * as React from "react";
import { Icon } from "@icons/Icon";
import type { IconName } from "@icons/types";
import { ICON_FAMILY } from "../../icons";
import {DescribedOption, Description, LABEL_STYLE, OptionTitle} from "./shared";

// One of a few values: a segmented row of radio buttons, on the line where a
// switch would be, the title label after it. A choice may carry an icon, drawn
// (16px) before its label when the installed icon family has it.
export function ChoiceOption<T extends string>({ id, help, label, description, notes, icon, value, choices, onChange } : DescribedOption & {
	value : T,
	choices : readonly { value : T, label : string, icon? : IconName }[],
	onChange : (value : T) => void
}) {
	return (
		<div className="toggle-box" {...help}>
			<div className="choice" role="radiogroup" aria-labelledby={id + "_label"}>
				{choices.map((c) => {
					const def = c.icon && ICON_FAMILY.icons[c.icon];
					return (
						<label key={c.value}>
							<input type="radio" name={id} value={c.value} checked={value === c.value} onChange={() => onChange(c.value)} />
							<span>{def && <Icon def={def} size={16} />}{c.label}</span>
						</label>
					);
				})}
			</div>
			<span className="textlabel" id={id + "_label"} style={LABEL_STYLE}>
				<OptionTitle icon={icon}>{label}</OptionTitle>
			</span>
			<Description text={description} notes={notes} />
		</div>
	);
}
