"use strict";

import * as React from "react";

// Pieces every option control shares. The inline styles are the ones the
// options markup always had; they move to the stylesheet with the options
// redesign, not here.

// What TabOptions.help() returns: the section's hover/focus help text.
export interface OptionHelp {
	"data-hover" : string;
	"data-hover-hold" : string;
	onFocus : () => void;
}

// The props every described option takes.
export interface DescribedOption {
	id : string;
	help : OptionHelp;
	label : string;
	description? : React.ReactNode;
	notes? : string[];
}

export const LABEL_STYLE : React.CSSProperties = { whiteSpace: "pre", lineHeight: "2rem" };
export const LEFT_LABEL_STYLE : React.CSSProperties = { textAlign: "left", whiteSpace: "pre", lineHeight: "2rem" };

// The empty label after every control (styled by the stylesheet).
export function ControlLabel({ id } : { id : string }) {
	return <label htmlFor={id} style={LABEL_STYLE} />;
}

// The option's description, each note (e.g. "By default: disabled") on its
// own line in italics.
export function Description({ text, notes = [] } : { text : React.ReactNode, notes? : string[] }) {
	return (
		<div className="option-description">
			{text}
			{notes.map((note) => (
				<React.Fragment key={note}>
					<br />
					<i>{note}</i>
				</React.Fragment>
			))}
		</div>
	);
}
