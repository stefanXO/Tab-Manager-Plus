"use strict"

import {getLocalStorage, setLocalStorage} from "@helpers/storage";
import {Tab} from "@views";
import {isBlockLayout} from "@helpers/settings";
import * as React from "react";
import {maybePluralize} from "@helpers/utils";
import * as browser from 'webextension-polyfill';
import {ICommand, ISession, ISessionState} from '@types';
import * as S from "@strings";
import {ManagerContext, ITabManagerActions} from '../context';

export class Session extends React.Component<ISession, ISessionState> {
	static contextType = ManagerContext;
	declare context : ITabManagerActions;
	constructor(props : ISession) {
		super(props);

		let name = this.props.session.name;
		let color = this.props.session.color || "default";

		this.state = {
			name: name,
			color: color
		};

	}
	render() {
		let hideWindow = true;
		let titleAdded = false;
		let tabs = this.props.tabs.map((tab) => {
			let tabId = tab.id * tab.id * tab.id * 100;
			let isHidden = this.props.hiddenTabs.has(tabId) && this.props.filterTabs;
			let isSelected = this.props.selection.has(tabId);
			let isFaded: boolean = this.props.hiddenTabs.has(tab.id) && !this.props.filterTabs;
			// session tabs are addressed by their index when restoring; render
			// a copy so the stored session (and the tabId derived above) is
			// never changed by rendering
			const sessionTab = Object.assign({}, tab, {id: tab.index});
			if (!isHidden) hideWindow = false;
			return (
				<Tab
					id={"sessiontab_" + this.props.session.id + "_" + tab.index}
					key={"sessiontab_" + this.props.session.id + "_" + tab.index}
					onOpen={this.openTab}
					session={this.props.session}
					layout={this.props.layout}
					tab={sessionTab}
					selected={isSelected}
					hidden={isHidden}
					faded={isFaded}
					draggable={false}
					searchActive={this.props.searchActive}
				/>
			);
		});
		if (!hideWindow) {
			if (!!this.props.tabactions) {
				tabs.push(
					<div key={"sessionnl_" + this.props.session.id} className="newliner" />,
					<div key={"sessionwa_" + this.props.session.id} className="window-actions">
						<div
							className={"icon tabaction restore " + (isBlockLayout(this.props.layout) ? "" : "windowaction")}
							title={"Restore this saved window\nWill restore " + maybePluralize(this.props.tabs.length, "tab") + ". Please note : The tabs will be restored without their history."}
							onClick={this.windowClick}
						/>
						<div
							className={"icon tabaction delete " + (isBlockLayout(this.props.layout) ? "" : "windowaction")}
							title={"Delete this saved window\nWill delete " + maybePluralize(this.props.tabs.length, "tab") + " permanently"}
							onClick={this.close}
						/>
					</div>
				);
			}

			if (this.props.windowTitles) {
				if (this.state.name) {
					tabs.unshift(
						<h3 key={"session-" + this.props.session.id + "-windowTitle"} className="center windowTitle">
							{this.state.name}
						</h3>
					);
					titleAdded = true;
				}
			}
			var children = [];
			if (!!titleAdded) {
				children.push(tabs.shift());
			}
			for (var j = 0; j < tabs.length; j++) {
				children.push(tabs[j]);
			}
			var focused = false;
			if (this.props.session.windowsInfo.focused || this.props.lastOpenWindow === this.props.session.windowsInfo.id) {
				focused = true;
			}
			return (
				<div
					key={"session-" + this.props.session.id}
					id={"session-" + this.props.session.id}
					className={
						"window " +
						this.props.session.windowsInfo.state +
						" " +
						(focused ? "activeWindow" : "") +
						" session " +
						(isBlockLayout(this.props.layout) ? "block" : "") +
						" " +
						this.props.layout +
						" " +
						this.state.color +
						" " +
						(this.props.session.windowsInfo.incognito ? " incognito" : "") +
						" " +
						(focused ? " focused" : "")
					}
					onClick={this.windowClick}
				>
					<div className="windowcontainer" title={"Restore this saved window\nWill restore " + maybePluralize(this.props.tabs.length, "tab") + " in a new window. Click a single tab to restore only that one"}>{children}</div>
				</div>
			);
		} else {
			return null;
		}
	}
	shouldComponentUpdate(nextProps, nextState) {
		//console.log("should update?", nextProps, nextState);
		return true;
	}
	stop = (e) => {
		e.stopPropagation();
	}
	windowTabClick = async (e : React.MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
	}
	windowClick = async (e : React.MouseEvent<HTMLDivElement>) => {
		this.restoreSession(e, null);
	}
	openTab = async (e : React.MouseEvent<HTMLDivElement>, index : number) => {
		this.restoreSession(e, index);
	}
	async restoreSession(e : React.MouseEvent<HTMLDivElement>, tabId : number) {
		e.stopPropagation();

		// the worker answers with the id of the window it created
		const windowId : number | undefined = await browser.runtime.sendMessage<ICommand, number | undefined>({
			command: S.create_window_with_session_tabs,
			session: this.props.session,
			tab_id: tabId,
			// the worker has no screen; this is the display the popup is on
			screen: {
				left: (screen as Screen & { availLeft?: number }).availLeft || 0,
				top: (screen as Screen & { availTop?: number }).availTop || 0,
				width: screen.availWidth,
				height: screen.availHeight
			}
		});

		if (!!window.inPopup) {
			window.close();
		} else if (typeof windowId === "number") {
			// give the popup a moment to pick up the new window and render it
			setTimeout(() => {
				this.context.scrollTo("window", windowId.toString());
			}, 500);
		}
	}
	close = async (e) => {
		e.stopPropagation();

		var sessions = await getLocalStorage(S.sessions, {});
		delete sessions[this.props.session.id];

		var value = await setLocalStorage(S.sessions, sessions).catch(function (err) {
			console.log(err);
			console.error(err.message);
		});

		console.log(value);
		this.context.reload();
		// browser.windows.remove(this.props.session.windowsInfo.id);
	}
}