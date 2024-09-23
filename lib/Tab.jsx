"use strict";

class Tab extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			favIcon: "",
			dragFavIcon: "",
			hovered: false
		};

		this.onHover = this.onHover.bind(this);
		this.onHoverOut = this.onHoverOut.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.click = this.click.bind(this);
		this.dragStart = this.dragStart.bind(this);
		this.dragOver = this.dragOver.bind(this);
		this.dragOut = this.dragOut.bind(this);
		this.drop = this.drop.bind(this);
		this.resolveFavIconUrl = this.resolveFavIconUrl.bind(this);

		this.tabRef = React.createRef();

	}
	componentWillMount() {
		this.resolveFavIconUrl();
		setTimeout(this.resolveFavIconUrl, 2500);
	}
	render() {
		var children = [];
		if (this.props.layout == "vertical") {
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
			children.push(
				<div
					key={"tab-icon-" + this.props.tab.id}
					className="iconoverlay "
					style={{
						backgroundImage: "url(" + this.state.favIcon + ")"
					}}
				/>
			);
			children.push(
				<div key={"tab-title-" + this.props.tab.id} className="tabtitle">
					{this.props.tab.title || ""}
				</div>
			);
		}

		var tabDom = {
			className:
				"icon tab " +
				(this.props.selected ? "selected " : "") +
				(this.props.tab.pinned ? "pinned " : "") +
				(this.props.tab.highlighted ? "highlighted " : "") +
				(this.props.hidden ? "hidden " : "") +
				((this.props.tab.mutedInfo && this.props.tab.mutedInfo.muted) ? "muted " : "") +
				(this.props.tab.audible ? "audible " : "") +
				(this.props.tab.discarded ? "discarded " : "") +
				(this.props.layout == "vertical" ? "full " : "") +
				(this.props.tab.incognito ? "incognito " : "") +
				(this.state.draggingOver || "") +
				(this.props.searchActive ? "search-active " : "") +
				" tab-" +
				this.props.tab.id +
				" " +
				(this.props.layout == "vertical" ? "vertical " : "blocks "),
			style:
				(this.props.layout == "vertical"
					? { }
					: { backgroundImage: "url(" + this.state.favIcon + ")" }
				)
			,
			id: this.props.id,
			title: this.props.tab.title,
			onClick: this.click,
			onMouseDown: this.onMouseDown,
			onMouseEnter: this.onHover,
			onMouseOut: this.onHoverOut,
			ref: this.tabRef
		};

		if (!!this.props.draggable) {
			tabDom["onDragStart"] = this.dragStart;
			tabDom["onDragOver"] = this.dragOver;
			tabDom["onDragLeave"] = this.dragOut;
			tabDom["onDrop"] = this.drop;
			tabDom["draggable"] = "true";
		}

		return (
			<div {...tabDom}>
				{children}
				<div className="limiter" />
			</div>
		);
	}
	onHover(e) {
		this.setState({hover: true});
		this.props.hoverHandler(this.props.tab);
		this.resolveFavIconUrl();
	}
	onHoverOut(e) {
		this.setState({hover: false});
	}
	onMouseDown(e) {
		if (e.button === 0) return;
		if (!this.props.draggable) return;
		this.click(e);
	}
	async click(e) {
		this.stopProp(e);

		var tabId = this.props.tab.id;
		var windowId = this.props.window.id;

		if (e.button === 1) {
			this.props.middleClick(tabId);
		} else if (e.button === 2 || e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey) {
			e.preventDefault();
			if (e.button === 2 && (e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)) {
				this.props.selectTo(tabId);
			} else {
				this.props.select(tabId);
			}
		} else {
			if (!!this.props.click) {
				this.props.click(e, this.props.tab.id);
			} else {
				if (navigator.userAgent.search("Firefox") > -1) {
					browser.runtime.sendMessage({
						command: "focus_on_tab_and_window_delayed",
						tab: {id: tabId, windowId: windowId}
					});
				} else {
					browser.runtime.sendMessage({
						command: "focus_on_tab_and_window",
						tab: {id: tabId, windowId: windowId}
					});
				}
			}

			if (!!window.inPopup) window.close();
		}
		return false;
	}
	dragStart(e) {
		if (!this.props.draggable) return false;
		if (!this.props.drag) return false;

		this.state.dragFavIcon = "";
		this.props.dragFavicon(this.state.favIcon);
		e.dataTransfer.setData("Text", this.props.tab.id);
		e.dataTransfer.setData("text/uri-list", this.props.tab.url || "");
		this.props.drag(e, this.props.tab.id);
	}
	dragOver(e) {
		if (!this.props.draggable) return false;
		if (!this.props.drag) return false;

		this.state.dragFavIcon = this.props.dragFavicon();

		var before = this.state.draggingOver;
		if (this.props.layout == "vertical") {
			this.state.draggingOver = e.nativeEvent.offsetY > ReactDOM.findDOMNode(this).clientHeight / 2 ? "bottom" : "top";
		} else {
			this.state.draggingOver = e.nativeEvent.offsetX > ReactDOM.findDOMNode(this).clientWidth / 2 ? "right" : "left";
		}
		if (before != this.state.draggingOver) {
			this.forceUpdate();
			this.props.parentUpdate();
		}
	}
	dragOut() {
		if (!this.props.draggable) return false;
		if (!this.props.drag) return;
		this.state.dragFavIcon = "";
		delete this.state.draggingOver;
		this.forceUpdate();
		this.props.parentUpdate();
	}
	drop(e) {
		if (!this.props.draggable) return false;
		if (!this.props.drag) return false;
		if (!this.props.drop) return;

		this.state.dragFavIcon = "";
		this.stopProp(e);
		var before = this.state.draggingOver == "top" || this.state.draggingOver == "left";
		delete this.state.draggingOver;

		this.props.drop(this.props.tab.id, before);
		this.forceUpdate();
		this.props.parentUpdate();
	}
	async resolveFavIconUrl() {
		var image;
		// firefox screenshots; needs <all_urls>
		// if(!!browser.tabs.captureTab) {
		// 	console.log("tabs captureTab");
		// 	image = await browser.tabs.captureTab(this.props.tab.id);
		// 	image = "url(" + image + ")";
		// }else
		if (navigator.userAgent.search("Firefox") == -1) {
			image = "chrome-extension://" + chrome.runtime.id + "/_favicon/?pageUrl=" + encodeURIComponent(this.props.tab.url) + "&size=64";
		} else if (!!this.props.tab.url && this.props.tab.url.indexOf("chrome://") !== 0 && this.props.tab.url.indexOf("about:") !== 0) {
			// chrome screenshots / only for active tabs; needs <all_urls>
			// if(!!browser.tabs.captureVisibleTab && this.props.tab.highlighted) {
			// 	console.log("tabsCapture");
			// 	try {
			// 		image = await browser.tabs.captureVisibleTab( this.props.window.id, {} );
			// 		//console.log(image);
			// 	} catch ( e ) {
			// 		console.log(e.message);
			// 	}
			// 	image = "url(" + image + ")";
			// }else{
			image = this.props.tab.favIconUrl ? "" + this.props.tab.favIconUrl + "" : "";
			//}
		} else {
			var favIcons = ["bookmarks", "chrome", "crashes", "downloads", "extensions", "flags", "history", "settings"];
			var iconUrl = this.props.tab.url || "";
			var iconName = "";
			if (iconUrl.length > 9) iconName = iconUrl.slice(9).match(/^\w+/g);
			image = !iconName || favIcons.indexOf(iconName[0]) < 0 ? "" : "../images/chrome/" + iconName[0] + ".png";
		}
		this.setState({
			favIcon: image
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
