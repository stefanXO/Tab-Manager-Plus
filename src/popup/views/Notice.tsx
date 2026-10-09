"use strict"

import * as React from "react";
import type {NoticeKind} from "../notices";

export interface INotice {
	kind : NoticeKind;
	text : string;
	// the countdown's length (ms)
	countdown : number;
	// changes when the countdown starts over: the bar runs again
	run : number;
	// the Undo button and its key caps (an Undo notice only)
	onUndo? : () => void;
	keys? : string[];
	// the close button; an Undo notice commits its change at once
	onClose() : void;
	// the mouse is over the notice (true) or left it: the countdown waits
	onHold(held : boolean) : void;
}

// One notice over the bottom bar, for the Undo after a delete and for errors:
// the text, Undo with the keys that trigger it, a close button, and a line
// along the foot that drains over the countdown. The line is a CSS animation
// (smooth, no ticking); the mouse over the notice pauses it, and the owner's
// countdown, so the two stay together.
export class Notice extends React.Component<INotice, {held : boolean}> {
	state = {held: false};
	// the two reasons to hold, kept apart so one ending does not end the other
	private hovered = false;
	private focused = false;

	private hold(held : boolean) {
		if (held === this.state.held) return;
		this.setState({held});
		this.props.onHold(held);
	}
	componentWillUnmount() {
		// a notice taken away under the mouse never sees it leave
		if (this.state.held) this.props.onHold(false);
	}
	render() {
		const {kind, text, countdown, run, onUndo, keys, onClose} = this.props;
		return (
			<div
				className={"notice " + kind + (this.state.held ? " held" : "")}
				role={kind === "error" ? "alert" : "status"}
				aria-live={kind === "error" ? "assertive" : "polite"}
				onMouseEnter={() => { this.hovered = true; this.hold(true); }}
				onMouseLeave={() => { this.hovered = false; this.hold(this.focused); }}
				onFocus={() => { this.focused = true; this.hold(true); }}
				onBlur={(e) => {
					// focus moving between the notice's own buttons keeps the hold; the
					// hold ends only when neither the mouse nor the focus is on the notice
					if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
					this.focused = false;
					this.hold(this.hovered);
				}}
			>
				<span className="notice-text">{text}</span>
				{onUndo && <button type="button" className="notice-undo" onClick={onUndo} title={keys ? "Undo (" + keys.join("+") + ")" : "Undo"}>
					<span className="notice-undo-label">Undo</span>
					{keys && <span className="notice-keys" aria-hidden="true">{keys.map((k) => <kbd key={k}>{k}</kbd>)}</span>}
				</button>}
				<button type="button" className="notice-close" onClick={onClose} aria-label="Close" title="Close">
					<span aria-hidden="true">{"\u00d7"}</span>
				</button>
				<div className="notice-bar" aria-hidden="true">
					<div key={run} className="notice-bar-fill" style={{animationDuration: countdown + "ms"}} />
				</div>
			</div>
		);
	}
}
