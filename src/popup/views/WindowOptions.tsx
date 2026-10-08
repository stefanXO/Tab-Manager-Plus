"use strict";

import * as React from "react";
import * as browser from "webextension-polyfill";
import {getLocalStorageMap} from "@helpers/storage";
import * as S from "@strings";
import {ICommand, IWindowOptions, IWindowOptionsState} from "@types";
import {ManagerContext, ITabManagerActions} from "../context";
import {editableName} from "../sessionEdit";

// "default" plus the 25 palette entries from css/popup.css
export const WINDOW_COLORS = ["default", ...Array.from({ length: 25 }, (_, i) => "color" + (i + 1))];

export class WindowOptions extends React.Component<IWindowOptions, IWindowOptionsState> {
	static contextType = ManagerContext;
	declare context : ITabManagerActions;

	constructor(props : IWindowOptions) {
		super(props);
		this.state = {
			// a saved window has its name at hand; an open one's is read in componentDidMount
			name: props.session ? editableName(props.session) : ""
		};
		this.color = props.session?.color || "default";
	}

	// a saved window: the colour as picked, and the name write still waiting
	private color : string;
	private nameTimer : number | undefined;

	async componentDidMount() {
		if (this.props.session) {
			// a popup that closes by losing focus never unmounts React: the
			// pending name write goes out on pagehide / when the page is hidden
			window.addEventListener("pagehide", this.flushName);
			document.addEventListener("visibilitychange", this.flushNameHidden);
			return;
		}
		const names = await getLocalStorageMap<number, string>(S.windowNames);
		this.setState({ name: names.get(this.props.windowId) || "" });
	}

	render() {
		return (
			<div className="window-colors" onClick={this.stop} onKeyDown={this.checkKey} tabIndex={-1}>
				<h2 className="window-x" onClick={this.close}>
					x
				</h2>
				<h3 className="center">{this.props.session ? "Name the saved window" : "Name the window"}</h3>
				<input
					className="window-name-input"
					type="text"
					dir="auto"
					onChange={this.changeName}
					value={this.state.name}
					placeholder={this.props.autoName || "Name window..."}
					tabIndex={1}
					autoFocus={true}
				/>
				<h3 className="center">Pick a color</h3>
				<div className="colors-box">
					{WINDOW_COLORS.map((color) => (
						<div
							key={color}
							className={"icon tabaction " + color}
							title="Change background color"
							onClick={() => this.changeColor(color)}
						/>
					))}
				</div>
			</div>
		);
	}

	// a click on the overlay's background must not reach the windows behind
	// it, and keeps the focus inside the overlay so Escape closes only this
	stop = (e : React.MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		if (e.target === e.currentTarget) e.currentTarget.focus();
	}

	checkKey = (e : React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === "Escape") {
			e.preventDefault();
			e.stopPropagation();
			this.close();
		}
	}

	changeName = async (e : React.ChangeEvent<HTMLInputElement>) => {
		const name = e.target.value || "";
		this.setState({ name: name });
		if (this.props.session) {
			// the whole saved windows list is rewritten: not on every keystroke
			window.clearTimeout(this.nameTimer);
			this.nameTimer = window.setTimeout(this.saveSession, 300);
			return;
		}
		await browser.runtime.sendMessage<ICommand>({
			command: S.set_window_name,
			window_id: this.props.windowId,
			name: name
		});
		// Firefox shows the name in the window title
		if (IS_FIREFOX) {
			await browser.windows.update(this.props.windowId, {
				titlePreface: name ? name + " - " : ""
			});
		}
	}

	changeColor = async (color : string) => {
		if (this.props.session) {
			this.color = color;
			this.saveSession();
			this.close();
			return;
		}
		await browser.runtime.sendMessage<ICommand>({
			command: S.set_window_color,
			window_id: this.props.windowId,
			color: color
		});
		this.close();
	}

	// writes the saved window's name and colour now (a pending name write is
	// replaced by this one)
	saveSession = () => {
		window.clearTimeout(this.nameTimer);
		this.nameTimer = undefined;
		void this.context.editSession(this.props.session!.id, { name: this.state.name, color: this.color });
	}

	private readonly flushName = () => {
		if (this.nameTimer !== undefined) this.saveSession();
	}
	private readonly flushNameHidden = () => {
		if (document.visibilityState === "hidden") this.flushName();
	}

	componentWillUnmount() {
		window.removeEventListener("pagehide", this.flushName);
		document.removeEventListener("visibilitychange", this.flushNameHidden);
		if (this.nameTimer !== undefined) this.saveSession();
	}

	close = () => {
		if (this.nameTimer !== undefined) this.saveSession();
		this.context.closeWindowOptions();
	}
}
