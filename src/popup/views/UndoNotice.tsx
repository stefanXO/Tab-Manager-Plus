"use strict"

import * as React from "react";
import {secondsLeft, fractionLeft} from "../pendingDelete";

export interface IUndoNotice {
	text : string;
	// when the countdown ends and how long it is (ms, Date.now()'s clock)
	deadline : number;
	countdown : number;
	onUndo() : void;
}

// The in-page notice over the bottom bar after a delete: what was deleted, the
// seconds left, a bar that drains with them, and Undo.
export class UndoNotice extends React.Component<IUndoNotice, {now : number}> {
	private timer : ReturnType<typeof setInterval> | undefined;
	state = {now: Date.now()};

	componentDidMount() {
		this.timer = setInterval(() => this.setState({now: Date.now()}), 200);
	}
	componentWillUnmount() {
		clearInterval(this.timer);
	}
	render() {
		const {text, deadline, countdown, onUndo} = this.props;
		// read at render time, so a restarted countdown shows at once
		const now = Date.now();
		const seconds = secondsLeft(deadline, now);
		return (
			<div className="undo-notice" role="status" aria-live="polite">
				<span className="undo-text">{text}</span>
				<span className="undo-seconds" aria-hidden="true">{seconds}s</span>
				<button type="button" className="undo-button" onClick={onUndo}>Undo</button>
				<div className="undo-bar" aria-hidden="true">
					<div className="undo-bar-fill" style={{width: Math.round(fractionLeft(deadline, now, countdown) * 100) + "%"}} />
				</div>
			</div>
		);
	}
}
