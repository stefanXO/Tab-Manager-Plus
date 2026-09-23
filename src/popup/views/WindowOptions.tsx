"use strict";

import * as React from "react";
import * as browser from "webextension-polyfill";
import {getLocalStorageMap} from "@helpers/storage";
import * as S from "@strings";
import {ICommand, IWindowOptions, IWindowOptionsState} from "@types";
import {ManagerContext, ITabManagerActions} from "../context";

// "default" plus the 25 palette entries from css/popup.css
export const WINDOW_COLORS = ["default", ...Array.from({ length: 25 }, (_, i) => "color" + (i + 1))];

export class WindowOptions extends React.Component<IWindowOptions, IWindowOptionsState> {
	static contextType = ManagerContext;
	declare context : ITabManagerActions;

	constructor(props : IWindowOptions) {
		super(props);
		this.state = {
			name: ""
		};
	}

	async componentDidMount() {
		const names = await getLocalStorageMap<number, string>(S.windowNames);
		this.setState({ name: names.get(this.props.windowId) || "" });
	}

	render() {
		const actionClass = this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction";
		return (
			<div className="window-colors" onClick={this.stop} onKeyDown={this.checkKey}>
				<h2 className="window-x" onClick={this.close}>
					x
				</h2>
				<h3 className="center">Name the window</h3>
				<input
					className="window-name-input"
					type="text"
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
							className={"icon tabaction " + color + " " + actionClass}
							title="Change background color"
							onClick={() => this.changeColor(color)}
							onMouseEnter={this.context.hoverIcon}
						/>
					))}
				</div>
			</div>
		);
	}

	stop = (e : React.MouseEvent) => {
		e.stopPropagation();
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
		await browser.runtime.sendMessage<ICommand>({
			command: S.set_window_name,
			window_id: this.props.windowId,
			name: name
		});
		// Firefox shows the name in the window title
		if (navigator.userAgent.search("Firefox") > -1) {
			await browser.windows.update(this.props.windowId, {
				titlePreface: name ? name + " - " : ""
			});
		}
	}

	changeColor = async (color : string) => {
		await browser.runtime.sendMessage<ICommand>({
			command: S.set_window_color,
			window_id: this.props.windowId,
			color: color
		});
		this.close();
	}

	close = () => {
		this.context.closeWindowOptions();
	}
}
