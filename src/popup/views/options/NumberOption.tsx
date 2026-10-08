"use strict";

import * as React from "react";
import {ControlLabel, DescribedOption, Description, LEFT_LABEL_STYLE, OptionTitle} from "./shared";
import {typedNumber, settledNumber, boundsOf} from "../../numberField";

// A number field. `labelFirst`: the title label goes before the field (the
// popup size fields) instead of after it. No description when none is given.
// The field keeps what is typed as a draft and hands `onChange` only a real
// number (../../numberField.ts); when it is left, the draft settles on a
// number in bounds or goes back to the value.
export function NumberOption({ id, help, label, description, notes, icon, value, onChange, min, max, step, className = "", labelFirst = false } : DescribedOption & {
	value : number,
	onChange : (value : number) => void,
	min : string,
	max? : string,
	step? : string,
	className? : string,
	labelFirst? : boolean
}) {
	const [draft, setDraft] = React.useState<string | null>(null);
	// a value changed elsewhere (an import) replaces an untouched draft
	const text = draft === null ? String(value) : draft;
	const change = (e : React.ChangeEvent<HTMLInputElement>) => {
		const typed = e.target.value;
		setDraft(typed);
		const n = typedNumber(typed);
		if (n !== null && n !== value) onChange(n);
	};
	const leave = () => {
		if (draft === null) return;
		const settled = settledNumber(draft, value, boundsOf(min, max));
		setDraft(null);
		if (settled !== value) onChange(settled);
	};
	const title = (
		<label className="textlabel" htmlFor={id} style={LEFT_LABEL_STYLE}>
			<OptionTitle icon={icon}>{label}</OptionTitle>
		</label>
	);
	return (
		<div className={"toggle-box" + (className && " " + className)} {...help}>
			{labelFirst && title}
			<input type="number" min={min} max={max} step={step} onChange={change} onBlur={leave} value={text} id={id} name={id} />
			<ControlLabel id={id} />
			{!labelFirst && title}
			{description !== undefined && <Description text={description} notes={notes} />}
		</div>
	);
}
