"use strict"

import {Tab} from "@views";
import {isBlockLayout} from "@helpers/settings";
import * as React from "react";
import {maybePluralize} from "@helpers/utils";
import * as browser from 'webextension-polyfill';
import {ICommand, ISession} from '@types';
import * as S from "@strings";
import {popupScreen} from "@helpers/popup_size";
import {restoreDisplays} from "../restoreDisplays";
import {ManagerContext, ITabManagerActions} from '../context';
import {savedTabKeys} from '../sessionKeys';
import {refusedText} from '../notices';
import {savedTileRef} from '../savedTiles';
import {windowName} from '../windowName';
import {shownSavedName} from '../sessionEdit';
import {Icon} from "@icons/Icon";
import {ICON_FAMILY} from "../icons";
import {dropSide, isSavedWindowDrag, SAVED_WINDOW_DRAG} from "../sessionOrder";
import {isSavedTabDrag} from "../savedDrag";
import {isOpenTabDrag} from "../savedAdd";
import {readTabDrag} from "../dragPayload";
import {savedLabel, savedHover} from "../savedUpdated";

interface ISessionState {
	// this card is being dragged (it fades)
	dragging : boolean;
	// another card held over this one: the side its drop marker shows on;
	// "into": saved tabs (or open tabs, copied) held over it (not over a tab),
	// they would go at its end
	dropMarker : "" | "left" | "right" | "top" | "bottom" | "into";
}

export class Session extends React.Component<ISession, ISessionState> {
	static contextType = ManagerContext;
	declare context : ITabManagerActions;
	// the last mouse press on the card was on a tab or an action icon: a drag
	// from there is not a drag of the card
	private grabbedPart = false;
	constructor(props : ISession) {
		super(props);
		this.state = { dragging: false, dropMarker: "" };
	}
	render() {
		// straight from the stored window, so a rename or recolour shows at once;
		// without a custom name, the automatic name as it is made now
		const name = this.shownName();
		const color = this.props.session.color || "default";
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
					ref={savedTileRef(tab.id) as React.RefObject<Tab>}
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
						data-hover={savedHover(this.props.session, Date.now())}
					>
						{savedLabel(this.props.session, Date.now())}
					</div>,
					<div key={"sessionwa_" + this.props.session.id} className="window-actions">
						<div
							className={"icon tabaction restore " + (isBlockLayout(this.props.layout) ? "" : "windowaction")}
							title={"Restore this saved window\nWill restore " + maybePluralize(this.props.tabs.length, "tab") + ". Please note : The tabs will be restored without their history."}
							onClick={this.windowClick}
						/>
						<div
							className={"icon tabaction colors " + (isBlockLayout(this.props.layout) ? "" : "windowaction")}
							title="Change the name or color of this saved window"
							onClick={this.openOptions}
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
				if (name) {
					tabs.unshift(
						<h3 key={"session-" + this.props.session.id + "-windowTitle"} className="center windowTitle">
							{/* The name opens the name / colour screen, as an open window's does.
							    The saved marker goes inside the name's span, not beside it: the span
							    is an atomic inline (max-width 100%, ellipsis of its own), and next to
							    the marker a long name no longer fitted the title bar, so the bar's
							    own text-overflow dropped the whole span for a bare "..." (which is
							    not the span: a click on it went to the card and restored the window). */}
							<span
								className="editName windowName"
								onClick={this.openOptions}
								data-hover="Change the name of this saved window"
							>
								{savedMark()}
								{name}
							</span>
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
						color +
						" " +
						(this.props.session.windowsInfo.incognito ? " incognito" : "") +
						(this.state.dragging ? " dragging" : "") +
						(this.state.dropMarker ? " drop-" + this.state.dropMarker : "")
					}
					onClick={this.windowClick}
					draggable={true}
					onMouseDown={this.mouseDown}
					onDragStart={this.dragStart}
					onDragEnd={this.dragEnd}
					onDragEnter={this.dragOver}
					onDragOver={this.dragOver}
					onDragLeave={this.dragLeave}
					onDrop={this.drop}
				>
					{/* data-hover (the header's hover text), not title: a native tooltip
					would cover the saved window's hover card (../statsHover.ts) */}
					<div className="windowcontainer" data-hover={"Restore this saved window\nWill restore " + maybePluralize(this.props.tabs.length, "tab") + " in a new window. Click a single tab to restore only that one"}>{children}</div>
				</div>
			);
		} else {
			return null;
		}
	}
	// the name as the title shows it (./sessionEdit.ts shownSavedName)
	shownName() : string {
		return shownSavedName(this.props.session, !!this.props.compact);
	}
	shouldComponentUpdate(nextProps, nextState) {
		//console.log("should update?", nextProps, nextState);
		return true;
	}
	stop = (e) => {
		e.stopPropagation();
	}
	// Reordering (../sessionOrder.ts): the card is dragged by any part that is
	// not a tab (a tab drags itself, into an open window) or an action icon.
	mouseDown = (e : React.MouseEvent<HTMLDivElement>) => {
		this.grabbedPart = !!(e.target as Element).closest?.(".tab, .icon, .window-actions");
	}
	dragStart = (e : React.DragEvent<HTMLDivElement>) => {
		// a saved tab's own drag, on its way up
		if ((e.target as Element).closest?.(".tab")) return;
		if (this.grabbedPart || (e.target as Element).closest?.(".icon, .window-actions")) {
			e.preventDefault();
			return;
		}
		e.stopPropagation();
		e.dataTransfer.setData(SAVED_WINDOW_DRAG, this.props.session.id);
		// some text too: Firefox starts no drag without data it knows
		e.dataTransfer.setData("Text", this.shownName());
		e.dataTransfer.effectAllowed = "move";
		this.context.dragSession(this.props.session.id);
		// faded after the browser took the drag image, so the image is not
		setTimeout(() => this.setState({ dragging: true }), 0);
	}
	dragEnd = () => {
		this.grabbedPart = false;
		this.context.dragSession(null);
		this.setState({ dragging: false, dropMarker: "" });
	}
	dragOver = (e : React.DragEvent<HTMLDivElement>) => {
		if (isSavedTabDrag(e.dataTransfer?.types) || isOpenTabDrag(e.dataTransfer?.types)) {
			this.savedTabOver(e);
			return;
		}
		if (!isSavedWindowDrag(e.dataTransfer?.types)) return;
		const card = e.currentTarget;
		// the cards stand side by side while their grid has more than one column
		const grid = card.parentElement ? getComputedStyle(card.parentElement).gridTemplateColumns : "none";
		const across = !!grid && grid !== "none" && grid.trim().split(/\s+/).length > 1;
		const side = dropSide(card.getBoundingClientRect(), e.clientX, e.clientY, across);
		const before = side === "before";
		if (!this.context.sessionDropMoves(this.props.session.id, before)) {
			if (this.state.dropMarker) this.setState({ dropMarker: "" });
			return;
		}
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = "move";
		const marker = across ? (before ? "left" : "right") : (before ? "top" : "bottom");
		if (marker !== this.state.dropMarker) this.setState({ dropMarker: marker });
	}
	// Saved tabs (../savedMove.ts) held over the card but not over one of its
	// tabs (its title, its edge, the gaps): they would go at its end; open tabs
	// (../savedAdd.ts) too, as copies. Over a tab, the tab shows where they go
	// (Tab.savedDragOver) and the card shows nothing.
	savedTabOver(e : React.DragEvent<HTMLDivElement>) {
		const onTab = !!(e.target as Element).closest?.(".tab");
		if (onTab || !this.context.savedDropMoves(this.props.session.id, undefined, false)) {
			if (this.state.dropMarker) this.setState({ dropMarker: "" });
			return;
		}
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = isOpenTabDrag(e.dataTransfer.types) ? "copy" : "move";
		if (this.state.dropMarker !== "into") this.setState({ dropMarker: "into" });
	}
	dragLeave = (e : React.DragEvent<HTMLDivElement>) => {
		// moving onto a part of this card is no leaving
		if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
		if (this.state.dropMarker) this.setState({ dropMarker: "" });
	}
	drop = (e : React.DragEvent<HTMLDivElement>) => {
		if (isSavedTabDrag(e.dataTransfer?.types) || isOpenTabDrag(e.dataTransfer?.types)) {
			const into = this.state.dropMarker === "into";
			this.setState({ dropMarker: "" });
			if (!into) return;
			e.preventDefault();
			e.stopPropagation();
			this.context.dropSaved(this.props.session.id, undefined, false, readTabDrag(e.dataTransfer));
			return;
		}
		if (!isSavedWindowDrag(e.dataTransfer?.types)) return;
		e.preventDefault();
		e.stopPropagation();
		const marker = this.state.dropMarker;
		this.setState({ dropMarker: "" });
		if (!marker || marker === "into") return;
		this.context.dropSession(this.props.session.id, marker === "left" || marker === "top");
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
		let windowId : number | undefined;
		try {
			windowId = await browser.runtime.sendMessage<ICommand, number | undefined>({
				command: S.create_window_with_session_tabs,
				session: this.props.session,
				tab_id: tabId,
				// the worker has no screen; this is the display the popup is on
				screen: popupScreen(),
				// and the monitors the hover card predicted the landing with
				displays: await restoreDisplays()
			});
		} catch (err) {
			// the worker did not take it: the popup stays open to say so
			console.error(err);
			this.context.showError(refusedText(tabId === null ? "restore the saved window" : "restore the saved tab", err));
			return;
		}
		if (typeof windowId !== "number") {
			// the worker answered without a window: the browser refused both
			// windows.create calls. The popup stays open to say so.
			this.context.showError(tabId === null ? "Could not restore the saved window" : "Could not restore the saved tab");
			return;
		}

		if (!!window.inPopup) {
			window.close();
		} else {
			// give the popup a moment to pick up the new window and render it
			setTimeout(() => {
				this.context.scrollTo("window", windowId.toString());
			}, 500);
		}
	}
	openOptions = (e : React.MouseEvent) => {
		e.stopPropagation();
		this.context.openSessionOptions(this.props.session.id, windowName(this.props.tabs));
	}
	close = (e) => {
		e.stopPropagation();
		// hidden at once; removed from storage when the Undo countdown ends
		this.context.deleteSession(this.props.session);
	}
}

// The "saved" marker in front of a saved window's name: the options screen's
// Saved windows icon (a stack of windows with the star of Save), so a saved
// card reads as one at a glance next to the open windows. Nothing when the
// icon family lacks the icon; the dashed edge (css/components/session.css)
// still tells the two kinds of card apart.
function savedMark() : React.ReactNode {
	const def = ICON_FAMILY.icons["sessions"];
	if (!def) return null;
	return <span className="saved-mark" role="img" aria-label="Saved window"><Icon def={def} size={14} /></span>;
}
