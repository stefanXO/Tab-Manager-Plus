"use strict";

import * as S from "@strings";
import {LAYOUT} from "@helpers/settings";
import * as React from "react";
import {ITab, ITabState} from '@types';
import {ManagerContext, ITabManagerActions} from '../context';
import {faviconTone} from '@helpers/favicon';
import {tabFreshness} from "../freshness";
import {titleHits} from "../search";
import {sendAndWait} from "../messaging";
import {isSavedWindowDrag} from "../sessionOrder";
import {SAVED_TAB_DRAG, isSavedTabDrag} from "../savedDrag";
import {OPEN_TAB_DRAG, isOpenTabDrag} from "../savedAdd";
import {readTabDrag} from "../dragPayload";

export class Tab extends React.Component<ITab, ITabState> {
	static contextType = ManagerContext;
	declare context : ITabManagerActions;

    tabRef: React.RefObject<HTMLDivElement> = React.createRef();

	constructor(props : ITab) {
		super(props);
		this.state = {
			favIcon: "",
			iconTone: "normal",
			dragFavIcon: "",
			draggingOver: "",
			hovered: false,
			entering: true
		};

	}

	private enterTimer = 0;

	componentDidMount() {
		this.update();
		this.enterTimer = window.setTimeout(() => this.setState({ entering: false }), 800);
	}

	componentWillUnmount() {
		clearTimeout(this.enterTimer);
	}

	update = () => {
		this.resolveFavIconUrl();
	}

	componentDidUpdate(prevProps, prevState) {
		const p = prevProps.tab, t = this.props.tab;
		if (p.status !== t.status || p.favIconUrl !== t.favIconUrl || p.url !== t.url || p.pendingUrl !== t.pendingUrl) {
			this.resolveFavIconUrl();
		}
	}

	render() {
		const children = [];
		if (this.props.layout === LAYOUT.list) {
			children.push(
				<div key={"tab-pinned-" + this.props.tab.id} className={"tab-pinned " + (!this.props.tab.pinned ? "hidden" : "")}>
					Pinned
				</div>
			);
			children.push(
				<div key={"tab-highlighted-" + this.props.tab.id} className={"tab-highlighted " + (!this.props.tab.highlighted ? "hidden" : "")}>
					Active
				</div>
			);
			children.push(
				<div key={"tab-selected-" + this.props.tab.id} className={"tab-selected " + (!this.props.selected ? "hidden" : "")}>
					Selected
				</div>
			);
			const muted = !!this.props.tab.mutedInfo && this.props.tab.mutedInfo.muted;
			children.push(
				<div key={"tab-audible-" + this.props.tab.id} className={"tab-audible " + (!this.props.tab.audible && !muted ? "hidden" : "")}>
					{muted ? "Muted" : "Media"}
				</div>
			);
			children.push(
				<div key={"tab-discarded-" + this.props.tab.id} className={"tab-discarded " + (!this.props.tab.discarded ? "hidden" : "")}>
					Asleep
				</div>
			);
			children.push(
				<div
					key={"tab-icon-" + this.props.tab.id}
					className={"iconoverlay icon-" + this.state.iconTone}
					style={this.favIconStyle()}
				/>
			);
			children.push(
				<div key={"tab-title-" + this.props.tab.id} className="tabtitle">
					{this.title()}
				</div>
			);
			// how recently the tab was used (../freshness.ts): four bars, filled
			// from the right and fading with age (css/layout/view-list.css). An svg
			// so crispEdges can snap the bars to whole device pixels: html boxes
			// get antialiased edges at 110% / 125% scale and the gaps look uneven
			const fresh = tabFreshness(this.props.tab.lastAccessed);
			if (fresh) {
				children.push(
					<svg
						key={"tab-fresh-" + this.props.tab.id}
						className={"tab-fresh fresh-" + fresh.level}
						role="img"
						aria-label={fresh.label}
						data-hover={fresh.label + "\n" + (this.props.tab.title || "")}
					>
						<rect /><rect /><rect /><rect />
					</svg>
				);
			}
		}

		var tabDom : React.HTMLAttributes<HTMLDivElement> & { "data-hover"?: string } = {
			className:
				"icon tab " +
				(this.props.selected ? "selected " : "") +
				(this.props.tab.pinned ? "pinned " : "") +
				(this.props.tab.highlighted ? "highlighted " : "") +
				(this.props.hidden ? "hidden " : "") +
				((this.props.tab.mutedInfo && this.props.tab.mutedInfo.muted) ? "muted " : "") +
				(this.props.tab.audible ? "audible " : "") +
				(this.props.tab.discarded ? "discarded " : "") +
				(this.state.entering ? "enter " : "") +
				(this.props.layout === LAYOUT.list ? "full " : "") +
				(this.props.tab.incognito ? "incognito " : "") +
				(this.state.draggingOver ? this.state.draggingOver + " " : "") +
				(this.props.searchActive ? "search-active " : "") +
				(this.props.faded ? "search-faded " : "") +
				"icon-" + this.state.iconTone + " " +
				" tab-" +
				this.props.tab.id +
				" " +
				(this.props.layout === LAYOUT.list ? "vertical " : "blocks "),
			style: {
				...(this.props.layout === LAYOUT.list ? {} : this.favIconStyle()),
				// position in the window, staggers the entrance animation
				"--i": this.props.tab.index
			} as React.CSSProperties,
			id: this.props.id,
			onClick: this.click,
			onMouseDown: this.onMouseDown,
			"data-hover": (this.props.tab.title || "") + "\n" + (this.props.tab.url || this.props.tab.pendingUrl || ""),
			onMouseEnter: this.onHover,
			onMouseLeave: this.onHoverOut
		};

		if (!!this.props.draggable) {
			tabDom.onDragStart = this.dragStart;
			tabDom.onDragOver = this.dragOver;
			tabDom.onDragLeave = this.dragOut;
			tabDom.onDrop = this.drop;
			tabDom.draggable = "true";
		} else if (!!this.props.onOpen) {
			// a saved tab: dropped on an open window or tab it opens there
			// (TabManager.drop); dropped on a saved tab it moves there
			// (../savedMove.ts). Open tabs dropped on it are copied in next to
			// it (../savedAdd.ts); saved tabs take no other drop
			tabDom.onDragStart = this.dragStart;
			tabDom.onDragEnd = this.dragEnd;
			tabDom.onDragEnter = this.savedDragOver;
			tabDom.onDragOver = this.savedDragOver;
			tabDom.onDragLeave = this.savedDragOut;
			tabDom.onDrop = this.savedDrop;
			tabDom.draggable = "true";
		}

		return (
			<div {...tabDom} ref={this.tabRef}>
				{children}
				<div className="limiter" />
			</div>
		);
	}
	// the title, with the parts the search matched in bold
	title() : React.ReactNode {
		const title = this.props.tab.title || "";
		const hits = titleHits(title, this.props.query, !this.props.draggable && !!this.props.onOpen);
		if (hits.length === 0) return title;
		const parts : React.ReactNode[] = [];
		let at = 0;
		for (const [start, end] of hits) {
			if (start > at) parts.push(title.slice(at, start));
			parts.push(<b key={start} className="search-hit">{title.slice(start, end)}</b>);
			at = end;
		}
		if (at < title.length) parts.push(title.slice(at));
		return parts;
	}
	onHover = () => {
		this.setState({hovered: true});
	}
	onHoverOut = () => {
		this.setState({hovered: false});
	}
	onMouseDown = async (e : React.MouseEvent<HTMLDivElement>) => {
		if (e.button === 0) return;
		// open tabs, and saved tabs (onOpen): right-click selects them too
		if (!this.props.draggable && !this.props.onOpen) return;
		await this.click(e);
	}
	click = async (e : React.MouseEvent<HTMLDivElement>) => {
		this.stopProp(e);

		// an open tab's id, or a saved tab's key (../sessionKeys.ts), which
		// select / selectTo take alike
		var tabId : number = this.props.tab.id;

		if (e.button === 1) {
			// middle click closes an open tab; a saved tab is not closed that way
			if (!this.props.onOpen) this.context.deleteTab(tabId);
		} else if (e.button === 2 || e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey) {
			e.preventDefault();
			// the prevented mousedown leaves the focus where it was: take it out of
			// the search box, so Ctrl/Cmd+Delete closes the selection
			this.context.leaveSearchBox();
			if (e.button === 2 && (e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)) {
				this.selectTo(tabId);
			} else {
				this.context.select(tabId);
			}
		} else {
			if (!!this.props.onOpen) {
				// a saved session's tab, restored by its index: restoreSession() waits
				// for the worker and closes the popup itself
				await this.props.onOpen(e, this.props.tab.index);
				return false;
			} else {
				let windowId = this.props.window.id;

				if (IS_FIREFOX) {
					await sendAndWait({
						command: S.focus_on_tab_and_window_delayed,
						saved_tab: {tabId: tabId, windowId: windowId}
					});
				} else {
					await sendAndWait({
						command: S.focus_on_tab_and_window,
						saved_tab: {tabId: tabId, windowId: windowId}
					});
				}
			}

			if (!!window.inPopup) window.close();
		}
		return false;
	}
	dragStart = (e : React.DragEvent<HTMLDivElement>) => {
		const saved = !this.props.draggable && !!this.props.onOpen;
		if (!this.props.draggable && !saved) return false;

		this.setState({
			dragFavIcon: ""
		});
		this.context.dragFavicon(this.state.favIcon);
		// every tab the drag takes (this one, or the selection it is in): the
		// drop reads them from its own event (../dragPayload.ts)
		const taken = this.context.drag(e, this.props.tab.id);
		if (saved) {
			// a saved tab's key means nothing outside the popup: its address. It
			// is copied (opened) into an open window, linked by the browser's tab
			// strip, and moved only among saved windows (the drag type says so)
			e.dataTransfer.setData("Text", this.props.tab.url || "");
			e.dataTransfer.setData(SAVED_TAB_DRAG, taken);
			e.dataTransfer.effectAllowed = "all";
		} else {
			e.dataTransfer.setData("Text", this.props.tab.id.toString());
			// saved windows take copies of them (../savedAdd.ts)
			e.dataTransfer.setData(OPEN_TAB_DRAG, taken);
		}
		e.dataTransfer.setData("text/uri-list", this.props.tab.url || "");
	}
	dragEnd = () => {
		this.context.dragEnd();
	}
	dragOver = (e : React.DragEvent<HTMLDivElement>) => {
		if (!this.props.draggable) return false;
		// a saved window card being reordered: no drop marker on open tabs
		if (isSavedWindowDrag(e.dataTransfer?.types)) return false;

		let favicon = this.context.dragFavicon();
		let draggingover;

		var before = this.state.draggingOver;
		if (this.props.layout === LAYOUT.list) {
			draggingover = e.nativeEvent.offsetY > this.tabRef.current.clientHeight / 2 ? "bottom" : "top";
		} else {
			draggingover = e.nativeEvent.offsetX > this.tabRef.current.clientWidth / 2 ? "right" : "left";
		}

		this.setState({
			draggingOver: draggingover,
			dragFavIcon: favicon
		});

		if (before !== this.state.draggingOver) {
			this.forceUpdate();
			this.props.onDragChange?.();
		}
	}
	dragOut = () => {
		if (!this.props.draggable) return false;

		this.setState({
			dragFavIcon: "",
			draggingOver: ""
		});
		this.forceUpdate();
		this.props.onDragChange?.();
	}
	drop = (e : React.DragEvent<HTMLDivElement>) => {
		if (!this.props.draggable) return false;

		this.stopProp(e);

		var before = this.state.draggingOver === "top" || this.state.draggingOver === "left";

		this.setState({
			draggingOver: "",
			dragFavIcon: ""
		});

		this.context.drop(this.props.tab.id, before, readTabDrag(e.dataTransfer));
		this.forceUpdate();
		this.props.onDragChange?.();
	}
	// A saved tab dragged over this saved tab: the drop marker on the side it
	// would go, when a drop there moves anything (TabManager.savedDropMoves);
	// an open tab: where its copy would go. Not stopped here: the saved window
	// card sees the event too, and clears its own marker while the pointer is
	// over a tab.
	savedDragOver = (e : React.DragEvent<HTMLDivElement>) => {
		const open = isOpenTabDrag(e.dataTransfer?.types);
		if ((!open && !isSavedTabDrag(e.dataTransfer?.types)) || !this.props.session) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const list = this.props.layout === LAYOUT.list;
		const before = list ? e.clientY < rect.top + rect.height / 2 : e.clientX < rect.left + rect.width / 2;
		if (!this.context.savedDropMoves(this.props.session.id, this.props.tab.index, before)) {
			if (this.state.draggingOver) this.setState({ draggingOver: "" });
			return;
		}
		e.preventDefault();
		e.dataTransfer.dropEffect = open ? "copy" : "move";
		const side = list ? (before ? "top" : "bottom") : (before ? "left" : "right");
		if (side !== this.state.draggingOver) this.setState({ draggingOver: side });
	}
	savedDragOut = (e : React.DragEvent<HTMLDivElement>) => {
		// moving onto a part of this tab is no leaving
		if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
		if (this.state.draggingOver) this.setState({ draggingOver: "" });
	}
	savedDrop = (e : React.DragEvent<HTMLDivElement>) => {
		if ((!isSavedTabDrag(e.dataTransfer?.types) && !isOpenTabDrag(e.dataTransfer?.types)) || !this.props.session) return;
		const side = this.state.draggingOver;
		this.setState({ draggingOver: "" });
		if (!side) return;
		// the card under it takes no drop of its own then
		e.preventDefault();
		e.stopPropagation();
		this.context.dropSaved(this.props.session.id, this.props.tab.index, side === "left" || side === "top", readTabDrag(e.dataTransfer));
	}
	selectTo(tabId : number) {
		if (!!tabId && !!this.props.tabs) this.context.selectTo(tabId, this.props.tabs);
	}
	favIconStyle() : React.CSSProperties {
		const style : Record<string, string> = {};
		if (this.state.favIcon) style["--fav"] = "url(" + this.state.favIcon + ")";
		return style as React.CSSProperties;
	}
	resolveFavIconUrl = () => {
		let image : string;
		// firefox screenshots; needs <all_urls>
		// if(!!browser.tabs.captureTab) {
		// 	console.log("tabs captureTab");
		// 	image = await browser.tabs.captureTab(this.props.tab.id);
		// 	image = "url(" + image + ")";
		// }else

		var _url : string = this.props.tab.url || this.props.tab.pendingUrl || "";

		if (!!_url && !IS_FIREFOX) {
			if (this.props.tab.status !== "loading") {
				image = "chrome-extension://" + chrome.runtime.id + "/_favicon/?pageUrl=" + encodeURIComponent(_url) + "&size=64";
			} else {
				image = "";
			}
		} else if (!!_url && _url.indexOf("chrome://") !== 0 && _url.indexOf("about:") !== 0) {
			 image = this.props.tab.favIconUrl ? "" + this.props.tab.favIconUrl + "" : "";
		 } else {
			const favIcons = ["bookmarks", "chrome", "crashes", "downloads", "extensions", "flags", "history", "settings"];
			let iconUrl = _url;
			if (iconUrl.length > 9) {
				let iconName = iconUrl.slice(9).match(/^\w+/g);
				image = !iconName || favIcons.indexOf(iconName[0]) < 0 ? "" : "../images/chrome/" + iconName[0] + ".png";
			}
		}
		if (this.state.favIcon == image) return;
		this.setState({
			favIcon: image,
			iconTone: "normal"
		});
		faviconTone(image).then((tone) => {
			// the favicon may have changed again while we were measuring
			if (this.state.favIcon !== image || this.state.iconTone === tone) return;
			this.setState({ iconTone: tone });
		});
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
