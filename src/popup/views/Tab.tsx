"use strict";

import * as S from "@strings";
import * as React from "react";
import * as browser from 'webextension-polyfill';
import {ICommand, ITab, ITabState} from '@types';
import {ManagerContext, ITabManagerActions} from '../context';
import {faviconTone} from '@helpers/favicon';
import {IS_FIREFOX} from "@helpers/browser";

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
			hovered: false
		};

	}

	componentDidMount() {
		this.update();
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
		if (this.props.layout === "vertical") {
			children.push(
				<div key={"tab-pinned-" + this.props.tab.id} className={"tab-pinned " + (!this.props.tab.pinned ? "hidden" : "")}>
					📌 Pinned
				</div>
			);
			children.push(
				<div key={"tab-highlighted-" + this.props.tab.id} className={"tab-highlighted " + (!this.props.tab.highlighted ? "hidden" : "")}>
					👁 Active
				</div>
			);
			children.push(
				<div key={"tab-selected-" + this.props.tab.id} className={"tab-selected " + (!this.props.selected ? "hidden" : "")}>
					✅ Selected
				</div>
			);
			const muted = !!this.props.tab.mutedInfo && this.props.tab.mutedInfo.muted;
			children.push(
				<div key={"tab-audible-" + this.props.tab.id} className={"tab-audible " + (!this.props.tab.audible && !muted ? "hidden" : "")}>
					{muted ? "🔇 Muted" : "🔊 Media"}
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
					{this.props.tab.title || ""}
				</div>
			);
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
				(this.props.layout === "vertical" ? "full " : "") +
				(this.props.tab.incognito ? "incognito " : "") +
				(this.state.draggingOver ? this.state.draggingOver + " " : "") +
				(this.props.searchActive ? "search-active " : "") +
				(this.props.faded ? "search-faded " : "") +
				"icon-" + this.state.iconTone + " " +
				" tab-" +
				this.props.tab.id +
				" " +
				(this.props.layout === "vertical" ? "vertical " : "blocks "),
			style:
				(this.props.layout === "vertical"
					? { }
					: this.favIconStyle()
				)
			,
			id: this.props.id,
			title: this.props.tab.title,
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
		}

		return (
			<div {...tabDom} ref={this.tabRef}>
				{children}
				<div className="limiter" />
			</div>
		);
	}
	onHover = () => {
		this.setState({hovered: true});
	}
	onHoverOut = () => {
		this.setState({hovered: false});
	}
	onMouseDown = async (e : React.MouseEvent<HTMLDivElement>) => {
		if (e.button === 0) return;
		if (!this.props.draggable) return;
		await this.click(e);
	}
	click = async (e : React.MouseEvent<HTMLDivElement>) => {
		this.stopProp(e);

		var tabId : number = this.props.tab.id;

		if (e.button === 1) {
			this.context.deleteTab(tabId);
		} else if (e.button === 2 || e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey) {
			e.preventDefault();
			if (e.button === 2 && (e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)) {
				this.selectTo(tabId);
			} else {
				this.context.select(tabId);
			}
		} else {
			if (!!this.props.onOpen) {
				this.props.onOpen(e, this.props.tab.id);
			} else {
				let windowId = this.props.window.id;

				if (IS_FIREFOX) {
					browser.runtime.sendMessage<ICommand>({
						command: S.focus_on_tab_and_window_delayed,
						saved_tab: {tabId: tabId, windowId: windowId}
					});
				} else {
					browser.runtime.sendMessage<ICommand>({
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
		if (!this.props.draggable) return false;

		this.setState({
			dragFavIcon: ""
		});
		this.context.dragFavicon(this.state.favIcon);
		e.dataTransfer.setData("Text", this.props.tab.id.toString());
		e.dataTransfer.setData("text/uri-list", this.props.tab.url || "");
		this.context.drag(e, this.props.tab.id);
	}
	dragOver = (e : React.DragEvent<HTMLDivElement>) => {
		if (!this.props.draggable) return false;

		let favicon = this.context.dragFavicon();
		let draggingover;

		var before = this.state.draggingOver;
		if (this.props.layout === "vertical") {
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

		this.context.drop(this.props.tab.id, before);
		this.forceUpdate();
		this.props.onDragChange?.();
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
