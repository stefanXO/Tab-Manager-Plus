"use strict";

import {getLocalStorageMap} from "@helpers/storage";
import {Tab} from "@views";
import * as S from "@strings";
import {LAYOUT, isBlockLayout} from "@helpers/settings";
import * as React from "react";
import {maybePluralize, timeAgo} from "@helpers/utils";
import * as browser from 'webextension-polyfill';
import {IWindow, IWindowState, ISavedSession} from '@types';
import {ManagerContext, ITabManagerActions} from '../context';
import {windowName, compactName, tabsKey} from '../windowName';
import {sendAndWait} from '../messaging';
import {refusedText} from '../notices';
import {buildSavedWindow, newSessionId} from '@helpers/sessions';
import {isSavedWindowDrag} from '../sessionOrder';
import {isSavedTabDrag} from '../savedDrag';
import {isOpenTabDrag} from '../savedAdd';
import {readTabDrag} from '../dragPayload';
import {tabShow, isHiddenTab, hidesWholeWindow} from '../selectedShown';
import {tabDropBefore} from '../tabDropSide';
import {actionHelp} from '../actionHelp';
import {ACTION_BUTTON} from '../buttonKeys';

export class Window extends React.Component<IWindow, IWindowState> {
	static contextType = ManagerContext;
	declare context : ITabManagerActions;


	constructor(props : IWindow) {
		super(props);

		this.state = {
			color: "default",
			name: "",
			auto_name: "",
			tabsKey: "",
			hover: false,
			hidden: false,
			tabrefs: new Map<number, React.RefObject<Tab>>()
		};

	}

	async componentDidMount() {
		this.tabsSignature = this.signature(this.props.tabs);
		await this.checkSettings();
		await this.update();
	}

	// what the auto title depends on; props.tabs is a new array on every
	// refresh, so compare content, not identity
	private tabsSignature = "";
	signature(tabs : browser.Tabs.Tab[]) : string {
		return tabs.map((t) => t.id + ":" + t.status + ":" + (t.pendingUrl || t.url || "")).join("|");
	}

	// Whether the window has nothing to show: no tab, or (with "Hide
	// non-matching tabs" on) every tab hidden by the search. A selected tab is
	// never hidden (../selectedShown.ts), so it keeps its window on screen.
	private hidesAll() : boolean {
		return hidesWholeWindow(this.props.tabs.map((tab) => tab.id), this.props.hiddenTabs, this.props.filterTabs, this.props.selection);
	}

	async componentDidUpdate(prevProps : IWindow) {
		// Tabs hidden by the search come back when the search ends or the filter
		// goes off, not only when the tabs change: a window whose shown tabs
		// moved away or were closed must show again then
		const hide = this.hidesAll();
		if (hide !== this.state.hidden) this.setState({ hidden: hide });
		const sig = this.signature(this.props.tabs);
		if (sig !== this.tabsSignature) {
			// tabs added, removed or navigated: the auto title may have changed
			this.tabsSignature = sig;
			await this.update();
		}
	}

	// colour and name from storage; also the answer to refresh_windows, which
	// the worker sends after it named or coloured a window (a restored session
	// gets its name only after the window and its tabs exist)
	checkSettings = async () => {
		const [colors, names] = await Promise.all([
			getLocalStorageMap<number, string>(S.windowColors),
			getLocalStorageMap<number, string>(S.windowNames)
		]);
		const color = colors.get(this.props.window.id) || "default";
		const name = names.get(this.props.window.id) || "";
		if (color !== this.state.color) this.setState({ color: color });
		// an empty name means "no custom name": fall back to the auto title
		if (name !== this.state.name) this.setState({ name: name }, () => { if (!name) this.update(); });
	}

	async update() {
		let tabs = this.props.tabs;
		this.setState({ hidden: this.hidesAll() });

		let name : string;
		if (!!this.props.window.title) {
			name = this.props.window.title;
		} else {
			let names : Map<number, string> = await getLocalStorageMap<number, string>(S.windowNames);
			name = names.get(this.props.window.id) || "";
		}

		if (!!name) {
			if (name !== this.state.name) {
				this.setState({
					name: name
				});
			}
			return;
		}

		// the auto name depends on the sites only, so it is recomputed when a tab is
		// added, removed or navigated; a loading tab has no final url yet, so leave
		// the key unset and try again once it settled
		const key = tabsKey(tabs);
		if (key !== this.state.tabsKey) {
			const loading = tabs.some((tab) => tab.status === "loading");
			this.setState({ tabsKey: loading ? "" : key, auto_name: windowName(tabs) });
		}
	}

	// the name as the title bar shows it: the user's name, else the automatic
	// one (shortened in compact mode); the window card (statsHover) shows the same
	shownName() : string {
		if (this.state.name) return this.state.name;
		return this.props.compact ? compactName(this.state.auto_name) : this.state.auto_name;
	}

	render() {
		if (this.state.hidden) return null;

		let color = this.state.color || "default";

		let hideWindow = true;
		let titleAdded = false;
		let tabs = this.props.tabs.map((tab) => {
			// a selected tab is never hidden: it fades like any non-match
			const show = tabShow(tab.id, this.props.hiddenTabs, this.props.filterTabs, this.props.selection);
			const isHidden : boolean = show === "hidden";
			let isSelected : boolean = this.props.selection.has(tab.id);
			let isFaded : boolean = show === "faded";
			if (!isHidden) hideWindow = false;

			let tabRef = this.state.tabrefs.get(tab.id) || React.createRef<Tab>();
			if (!this.state.tabrefs.has(tab.id)) {
				this.state.tabrefs.set(tab.id, tabRef);
			}

			return (
				<Tab
					key={"windowtab_" + this.props.window.id + "_" + tab.id}
					tabs={this.props.tabs}
					onDragChange={this.refreshTabs}
					window={this.props.window}
					layout={this.props.layout}
					tab={tab}
					selected={isSelected}
					hidden={isHidden}
					faded={isFaded}
					searchActive={this.props.searchActive}
					query={this.props.query}
					draggable={true}
					ref={tabRef}
					id={"tab-" + tab.id}
				/>
			);
		});
		if (!hideWindow) {
			if (!!this.props.lastActive) {
				tabs.push(
					<div
						key={"windowage_" + this.props.window.id}
						className="window-age"
						data-hover={"Last active " + timeAgo(this.props.lastActive) + "\n" + new Date(this.props.lastActive).toLocaleString() + "\n "}
					>
						{timeAgo(this.props.lastActive)}
					</div>
				);
			}
			if (!!this.props.tabactions) {
				tabs.push(
					<div key={"windownl_" + this.props.window.id} className="newliner"/>,
					<div key={"windowactions_" + this.props.window.id} className="window-actions">
						{this.props.sessionsFeature ? (
							<div
								className={"icon tabaction save " + (isBlockLayout(this.props.layout) ? "" : "windowaction")}
								role="button"
								{...ACTION_BUTTON}
								aria-label="Save this window for later"
								{...actionHelp(
									"Save this window for later\nWill save " +
									maybePluralize(this.props.tabs.length, "tab") +
									" with this window for later. Please note : The saved tabs will lose their history."
								)}
								onClick={this.save}
							/>
						) : false}
						<div
							className={"icon tabaction add " + (isBlockLayout(this.props.layout) ? "" : "windowaction")}
							role="button"
							{...ACTION_BUTTON}
							aria-label="Open a new tab"
							{...actionHelp("Open a new tab")}
							onClick={this.addTab}
						/>
						<div
							className={"icon tabaction colors " + (isBlockLayout(this.props.layout) ? "" : "windowaction")}
							role="button"
							{...ACTION_BUTTON}
							aria-label="Change window name or color"
							{...actionHelp("Change window name or color")}
							onClick={this.openOptions}
						/>
						{this.props.window.state === "minimized" ? (
							<div
								className={"icon tabaction maximize " + (isBlockLayout(this.props.layout) ? "" : "windowaction")}
								role="button"
								{...ACTION_BUTTON}
								aria-label="Maximize this window"
								{...actionHelp("Maximize this window\nWill maximize " + maybePluralize(this.props.tabs.length, "tab"))}
								onClick={this.maximize}
							/>
						) : (
							<div
								className={"icon tabaction minimize " + (isBlockLayout(this.props.layout) ? "" : "windowaction")}
								role="button"
								{...ACTION_BUTTON}
								aria-label="Minimize this window"
								{...actionHelp("Minimize this window\nWill minimize " + maybePluralize(this.props.tabs.length, "tab"))}
								onClick={this.minimize}
							/>
						)}
						<div
							className={"icon tabaction close " + (isBlockLayout(this.props.layout) ? "" : "windowaction")}
							role="button"
							{...ACTION_BUTTON}
							aria-label="Close this window"
							{...actionHelp("Close this window\nWill close " + maybePluralize(this.props.tabs.length, "tab"))}
							onClick={this.close}
						/>
					</div>
				);
			}
			if (this.props.windowTitles) {
				titleAdded = true;
				tabs.unshift(
					<h3
						key={"window-" + this.props.window.id + "-windowTitle"}
						className="center windowTitle"
					>
						<span
							className="editName windowName"
							onClick={this.openOptions}
							data-hover="Change the name of this window"
						>
							{this.props.window.incognito ? "🕵" : ""}
							{this.shownName()}
						</span>
					</h3>
				);
			}

			let children = [];
			if (!!titleAdded) {
				children.push(tabs.shift());
			}
			// the tab tiles go in one wrapper, so a layout can treat them as a single
			// column (strip view: title | tiles, wrapping | actions); elsewhere the
			// wrapper is display: contents and changes nothing
			let tiles = [];
			for (let j = 0; j < tabs.length; j++) {
				let tab = tabs[j].props.tab;
				if (!tab) {
					// not a tile (the newliner and the actions bar): flush the tiles first
					if (tabs[j].key.startsWith("windowtab_")) continue;
					if (tiles.length) {
						children.push(<div key={"tabs_" + this.props.window.id} className="tabs">{tiles}</div>);
						tiles = [];
					}
					children.push(tabs[j]);
					continue;
				}
				let isHidden = !!tab.id && isHiddenTab(tab.id, this.props.hiddenTabs, this.props.filterTabs, this.props.selection);
				if (isHidden) continue;
				tiles.push(tabs[j]);
			}
			if (tiles.length) {
				children.push(<div key={"tabs_" + this.props.window.id} className="tabs">{tiles}</div>);
			}
			// one definition of "current", decided in TabManager.update()
			const focused = this.props.lastOpenWindow === this.props.window.id;
			return (
				<div
					key={"window-" + this.props.window.id}
					id={"window-" + this.props.window.id}
					className={
						"window " +
						this.props.window.state +
						" window-" +
						this.props.window.id +
						" " +
						(focused ? "activeWindow" : "") +
						" " +
						color +
						" " +
						(isBlockLayout(this.props.layout) ? "block" : "") +
						" " +
						this.props.layout +
						" " +
						(this.props.window.incognito ? " incognito" : "") +
						" " +
						(focused ? " focused" : "")
					}
					style={{ "--i": this.props.order || 0 } as React.CSSProperties}
					onDragEnter={this.dragOver}
					onDragOver={this.dragOver}
					onDragLeave={this.dragLeave}
					onClick={this.windowClick}
					onMouseEnter={this.hoverWindow}
					onMouseLeave={this.hoverWindowOut}
					onDrop={this.drop}
				>
					<div key={"windowcontainer_" + this.props.window.id} className="windowcontainer" data-hover={"Focus this window\nWill select this window with " + maybePluralize(this.props.tabs.length, "tab")}>{children}</div>
				</div>
			);
		} else {
			return null;
		}
	}
	openOptions = (e : React.MouseEvent) => {
		this.stopProp(e);
		this.context.openWindowOptions(this.props.window.id, this.state.auto_name);
	}
	stop = (e) => {
		this.stopProp(e);
	}
	refreshTabs = () => {
		this.forceUpdate();
	}
	addTab = (e) => {
		this.stopProp(e);
		browser.tabs.create({ windowId: this.props.window.id });
	}
	dragOver = (e) => {
		// a saved window card being reordered: no drop here
		if (isSavedWindowDrag(e.dataTransfer?.types)) return;
		// Tabs dragged here that would be refused (private and normal never mix,
		// the dragged saved tabs are gone) or change nothing (one tab on its own
		// place): the browser's not-allowed cursor, no marker (Tab.dragOver) and
		// no outline. A drag that ends here shows the reason (TabManager.dragDone).
		if (isSavedTabDrag(e.dataTransfer?.types) || isOpenTabDrag(e.dataTransfer?.types)) {
			const place = this.dropPlace(e);
			if (!this.context.openDropOver(this.props.window.id, place.tabId, place.before)) {
				this.stopProp(e);
				e.dataTransfer.dropEffect = "none";
				if (this.state.hover) this.setState({hover: false});
				return;
			}
		}
		this.setState({hover: true});
		this.stopProp(e);
		// what the drop does, said outright (as the saved windows do) instead
		// of left to the browser's guess: saved tabs open here as copies, the
		// saved window keeps them; open tabs move here
		if (isSavedTabDrag(e.dataTransfer?.types)) e.dataTransfer.dropEffect = "copy";
		else if (isOpenTabDrag(e.dataTransfer?.types)) e.dataTransfer.dropEffect = "move";
	}
	dragLeave = (e) => {
		this.setState({hover: false});
		this.stopProp(e);
	}
	// Where a drag at the pointer goes in this window: next to the open tab
	// under it (before it in its first half), else next to the tab closest to
	// it (see drop), else (no tab on screen) at the window's end. The same for
	// the verdict on the drag and for the drop.
	dropPlace(e) : { tabId? : number, before : boolean } {
		const over = (e.target as Element)?.closest?.(".tab") as HTMLElement | null;
		if (over && over.id.startsWith("tab-")) {
			const id = Number(over.id.slice(4));
			if (Number.isFinite(id)) {
				const list = this.props.layout === LAYOUT.list;
				return { tabId: id, before: tabDropBefore(list, e.nativeEvent.offsetX, e.nativeEvent.offsetY, over.clientWidth, over.clientHeight) };
			}
		}
		const closest = this.closestTab(e.nativeEvent.clientX, e.nativeEvent.clientY);
		if (!closest) return { before: false };
		const rect = closest.ref.getBoundingClientRect();
		return { tabId: closest.id, before: this.props.layout === LAYOUT.list ? e.nativeEvent.clientY < rect.top : e.nativeEvent.clientX < rect.left };
	}
	// the open tab on screen whose corner is closest to the point
	closestTab(x : number, y : number) : { id : number, ref : HTMLElement } | null {
		let distance = 1000000;
		let closestTab = null;
		let closestRef = null;

		for (let i = 0; i < this.props.tabs.length; i++) {
			let tab = this.props.tabs[i];
			let tabRef = this.state.tabrefs.get(tab.id);
			if (!tabRef) continue;
			let currentRef = tabRef.current?.tabRef?.current;
			if (!currentRef) continue;
			// hidden by the search filter: mounted but display none, no position
			if (currentRef.offsetParent === null) continue;
			let tabRect = currentRef.getBoundingClientRect();
			let dx = tabRect.x - x;
			let dy = tabRect.y - y;
			let d = Math.sqrt(dx * dx + dy * dy);
			if (d < distance) {
				distance = d;
				closestTab = tab.id;
				closestRef = currentRef;
			}
		}
		return closestTab != null ? { id: closestTab, ref: closestRef } : null;
	}
	drop = (e) => {
		this.stopProp(e);
		const dragged = readTabDrag(e.dataTransfer);

		const closest = this.closestTab(e.nativeEvent.clientX, e.nativeEvent.clientY);
		if (closest) {
			let before : boolean;
			let boundingRect = closest.ref.getBoundingClientRect();
			if (this.props.layout === LAYOUT.list) {
				before = e.nativeEvent.clientY < boundingRect.top;
			} else {
				before = e.nativeEvent.clientX < boundingRect.left;
			}
			this.context.drop(closest.id, before, dragged);
		} else {
			this.context.dropWindow(this.props.window.id, dragged);
		}
	}
	hoverWindow = () => {
		this.setState({ hover: true });
	}
	hoverWindowOut = (_) => {
		this.setState({ hover: false });
	}
	windowClick = async (e) => {
		this.stopProp(e);

		let windowId = this.props.window.id;

		if (IS_FIREFOX) {
			await sendAndWait({command: S.focus_on_window_delayed, window_id: windowId});
		} else {
			await sendAndWait({command: S.focus_on_window, window_id: windowId});
		}

		if (!!window.inPopup) {
			window.close();
		} else {
			this.context.reload();
		}
		return false;
	}
	close = async (e) => {
		this.stopProp(e);
		await browser.windows.remove(this.props.window.id);
	}
	save = async (e) => {
		this.stopProp(e);

		let queryInfo : browser.Tabs.QueryQueryInfoType = {
			windowId: this.props.window.id
		};
		//queryInfo.currentWindow = true;

		let tabs : browser.Tabs.Tab[] = await browser.tabs.query(queryInfo);
		const windowsInfo = await browser.windows.get(this.props.window.id);
		// the saved window is built in ../../helpers/sessions.ts (the selection's save uses it too)
		let session : ISavedSession = buildSavedWindow({
			id: newSessionId(),
			now: Date.now(),
			tabs: tabs,
			windowsInfo: windowsInfo,
			name: this.state.name,
			autoName: this.state.auto_name,
			color: this.state.color,
			incognito: this.props.window.incognito,
			firefox: IS_FIREFOX
		});
		// listed first among the saved windows, written by the manager after
		// any other change to them (../sessionStore.ts)
		try {
			await this.context.addSavedWindows([session]);
		} catch (err) {
			console.error("could not save the window", err);
			this.context.showError(refusedText("save the window", err));
			return;
		}
		this.context.reload();

		setTimeout(() => {
			this.context.scrollTo("session", session.id);
		}, 150);
	}
	minimize = async (e) => {
		this.stopProp(e);
		await browser.windows.update(this.props.window.id, {
			state: "minimized"
		});
		this.context.reload();
	}
	maximize = async (e) => {
		this.stopProp(e);
		await browser.windows.update(this.props.window.id, {
			state: "normal"
		});
		this.context.reload();
	}
	stopProp(e) {
		if(e && e.nativeEvent) {
			e.nativeEvent.preventDefault();
			e.nativeEvent.stopPropagation();
		}
		if(e && e.preventDefault) {
			e.preventDefault();
			e.stopPropagation();
		}
	}
}
