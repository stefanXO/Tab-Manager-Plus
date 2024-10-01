"use strict"

import {getLocalStorage, setLocalStorage} from "@helpers/storage";
import {Tab} from "@views";
import * as React from "react";
import * as browser from 'webextension-polyfill';
import {ICommand, ISession, ISessionState} from '@types';
import * as S from "@strings";

export class Session extends React.Component<ISession, ISessionState> {
	constructor(props : ISession) {
		super(props);

		let name = this.props.session.name;
		let color = this.props.session.color || "default";

		this.state = {
			name: name,
			color: color
		};

		this.stop = this.stop.bind(this);
		this.windowClick = this.windowClick.bind(this);
		this.windowTabClick = this.windowTabClick.bind(this);
		this.close = this.close.bind(this);
		this.openTab = this.openTab.bind(this);
		this.maximize = this.maximize.bind(this);

	}
	render() {
		let _this = this;
		let hideWindow = true;
		let titleAdded = false;
		let tabsperrow = this.props.layout.indexOf("blocks") > -1 ? Math.ceil(Math.sqrt(this.props.tabs.length + 2)) : this.props.layout === "vertical" ? 1 : 15;
		let tabs = this.props.tabs.map(function(tab) {
			let tabId = tab.id * tab.id * tab.id * 100;
			let isHidden = _this.props.hiddenTabs.has(tabId) && _this.props.filterTabs;
			let isSelected = _this.props.selection.has(tabId);
			tab.id = tab.index;
			if (!isHidden) hideWindow = false;
			return (
				<Tab
					id={"sessiontab_" + _this.props.session.id + "_" + tab.index}
					key={"sessiontab_" + _this.props.session.id + "_" + tab.index}
					session={_this.props.session}
					layout={_this.props.layout}
					tab={tab}
					selected={isSelected}
					hidden={isHidden}
					draggable={false}
					click={_this.openTab}
					middleClick={_this.props.tabMiddleClick}
					hoverHandler={_this.props.hoverHandler}
					searchActive={_this.props.searchActive}
					select={_this.props.select}
					ref={"sessiontab" + tabId}
				/>
			);
		});
		if (!hideWindow) {
			if (!!this.props.tabactions) {
				tabs.push(
					<div key={"sessionnl_" + _this.props.session.id} className="newliner" />,
					<div key={"sessionwa_" + _this.props.session.id} className="window-actions">
						<div
							className={"icon tabaction restore " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
							title={"Restore this saved window\nWill restore " + tabs.length + " tabs. Please note : The tabs will be restored without their history."}
							onClick={this.windowClick}
							onMouseEnter={this.props.hoverIcon}
						/>
						<div
							className={"icon tabaction delete " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
							title={"Delete this saved window\nWill delete " + tabs.length + " tabs permanently"}
							onClick={this.close}
							onMouseEnter={this.props.hoverIcon}
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
			if (tabsperrow < 3) {
				tabsperrow = 3;
			}
			var children = [];
			if (!!titleAdded) {
				children.push(tabs.shift());
			}
			for (var j = 0; j < tabs.length; j++) {
				children.push(tabs[j]);
				if ((j + 1) % tabsperrow === 0 && j && this.props.layout.indexOf("blocks") > -1) {
					children.push(<div key={"sessionnl_" + _this.props.session.id + "_" + j} className="newliner" />);
				}
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
						(this.props.layout.indexOf("blocks") > -1 ? "block" : "") +
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
					<div className="windowcontainer">{children}</div>
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
	stop(e) {
		e.stopPropagation();
	}
	async windowTabClick(e : React.MouseEvent<HTMLDivElement>) {
		e.stopPropagation();
	}
	async windowClick(e : React.MouseEvent<HTMLDivElement>) {
		this.restoreSession(e, null);
	}
	async openTab(e : React.MouseEvent<HTMLDivElement>, index : number) {
		this.restoreSession(e, index);
	}
	async restoreSession(e : React.MouseEvent<HTMLDivElement>, tabId : number) {
		e.stopPropagation();

		await browser.runtime.sendMessage<ICommand>({
			command: S.create_window_with_session_tabs,
			session: this.props.session,
			tab_id: tabId
		});

		this.props.parentUpdate();

		if (!!window.inPopup) {
			window.close();
		}else{
			setTimeout(function() {
				this.props.scrollTo("window", browser.windows.WINDOW_ID_CURRENT);
			}.bind(this), 500);
		}
	}
	async close(e) {
		e.stopPropagation();

		var sessions = await getLocalStorage('sessions', {});
		delete sessions[this.props.session.id];

		var value = await setLocalStorage('sessions', sessions).catch(function (err) {
			console.log(err);
			console.error(err.message);
		});

		console.log(value);
		this.props.parentUpdate();
		// browser.windows.remove(this.props.session.windowsInfo.id);
	}
	maximize(e) {
		e.stopPropagation();
		// browser.windows.update(this.props.session.windowsInfo.id, {
		// 	"state": "normal" },
		// function (a) {this.props.parentUpdate();}.bind(this));
	}
}
