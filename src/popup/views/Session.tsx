"use strict"

import {Tab} from "@views";
import {isBlockLayout} from "@helpers/settings";
import * as React from "react";
import {maybePluralize, timeAgo} from "@helpers/utils";
import * as browser from 'webextension-polyfill';
import {ICommand, ISession, ISessionState} from '@types';
import * as S from "@strings";
import {popupScreen} from "@helpers/popup_size";
import {ManagerContext, ITabManagerActions} from '../context';
import {savedTabKeys} from '../sessionKeys';

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
		// A saved tab's stored id belonged to an open tab when the window was
		// saved, and its index is an ordinary open tab id too: in the selection
		// and hiddenTabs it goes by a key that never clashes with an open tab
		// (../sessionKeys.ts). Render copies carrying the key, so the stored
		// session is never changed by rendering; restoring still sends the index.
		const sessionTabs = this.props.tabs.map((tab) => Object.assign({}, tab, {id: savedTabKeys.key(this.props.session.id, tab.index)}));
		let tabs = sessionTabs.map((tab) => {
			let isHidden = this.props.hiddenTabs.has(tab.id) && this.props.filterTabs;
			let isSelected = this.props.selection.has(tab.id);
			let isFaded: boolean = this.props.hiddenTabs.has(tab.id) && !this.props.filterTabs;
			if (!isHidden) hideWindow = false;
			return (
				<Tab
					id={"sessiontab_" + this.props.session.id + "_" + tab.index}
					key={"sessiontab_" + this.props.session.id + "_" + tab.index}
					onOpen={this.openTab}
					session={this.props.session}
					layout={this.props.layout}
					tab={tab}
					tabs={sessionTabs}
					selected={isSelected}
					hidden={isHidden}
					faded={isFaded}
					draggable={false}
					searchActive={this.props.searchActive}
					query={this.props.query}
				/>
			);
		});
		if (!hideWindow) {
			if (!!this.props.tabactions) {
				tabs.push(
					<div key={"sessionnl_" + this.props.session.id} className="newliner" />,
					<div
						key={"sessionage_" + this.props.session.id}
						className="window-age"
						data-hover={"Saved " + timeAgo(this.props.session.date) + "\n" + new Date(this.props.session.date).toLocaleString()}
					>
						{"saved " + timeAgo(this.props.session.date)}
					</div>,
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
			return (
				<div
					key={"session-" + this.props.session.id}
					id={"session-" + this.props.session.id}
					className={
						"window " +
						this.props.session.windowsInfo.state +
						" session " +
						(isBlockLayout(this.props.layout) ? "block" : "") +
						" " +
						this.props.layout +
						" " +
						this.state.color +
						" " +
						(this.props.session.windowsInfo.incognito ? " incognito" : "")
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
		await this.restoreSession(e, null);
	}
	openTab = async (e : React.MouseEvent<HTMLDivElement>, index : number) => {
		await this.restoreSession(e, index);
	}
	async restoreSession(e : React.MouseEvent<HTMLDivElement>, tabId : number) {
		e.stopPropagation();

		// the worker answers with the id of the window it created
		const windowId : number | undefined = await browser.runtime.sendMessage<ICommand, number | undefined>({
			command: S.create_window_with_session_tabs,
			session: this.props.session,
			tab_id: tabId,
			// the worker has no screen; this is the display the popup is on
			screen: popupScreen()
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
	close = (e) => {
		e.stopPropagation();
		// hidden at once; removed from storage when the Undo countdown ends
		this.context.deleteSession(this.props.session);
	}
}