"use strict";

class Tab extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			favIcon: ""
		};

		this.onHover = this.onHover.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.click = this.click.bind(this);
		this.dragStart = this.dragStart.bind(this);
		this.dragOver = this.dragOver.bind(this);
		this.dragOut = this.dragOut.bind(this);
		this.drop = this.drop.bind(this);
		this.resolveFavIconUrl = this.resolveFavIconUrl.bind(this);

	}
	componentWillMount() {
		this.resolveFavIconUrl();
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
						backgroundImage: this.state.favIcon
					}}
				/>
			);
			children.push(
				<div key={"tab-title-" + this.props.tab.id} className="tabtitle">
					{this.props.tab.title}
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
					: { backgroundImage: this.state.favIcon }
				)
			,
			id: this.props.id,
			title: this.props.tab.title,
			onClick: this.click,
			onMouseDown: this.onMouseDown,
			onMouseEnter: this.onHover
		};

		if (!!this.props.drag) {
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
		this.props.hoverHandler(this.props.tab);
		this.resolveFavIconUrl();
	}
	onMouseDown(e) {
		if (e.button === 0) return;
		if (!this.props.drag) return;
		this.click(e);
	}
	async click(e) {
		if (!this.props.drag) return;
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
			var backgroundPage = await browser.runtime.getBackgroundPage();
			if (navigator.userAgent.search("Firefox") > -1) {
				backgroundPage.focusOnTabAndWindowDelayed({ id: tabId, windowId: windowId });
			}else{
				backgroundPage.focusOnTabAndWindow({ id: tabId, windowId: windowId });
			}
			if (!!window.inPopup) window.close();
		}
		return false;
	}
	dragStart(e) {
		if (!!this.props.drag) {
			e.dataTransfer.setData("Text", this.props.tab.id);
			e.dataTransfer.setData("text/uri-list", this.props.tab.url);
			this.props.drag(e, this.props.tab.id);
		} else {
			return false;
		}
	}
	dragOver(e) {
		this.stopProp(e);
		if (!this.props.drag) return;
		var before = this.state.draggingOver;
		if (this.props.layout == "vertical") {
			this.state.draggingOver = e.nativeEvent.offsetY > ReactDOM.findDOMNode(this).clientHeight / 2 ? "bottom" : "top";
		} else {
			this.state.draggingOver = e.nativeEvent.offsetX > ReactDOM.findDOMNode(this).clientWidth / 2 ? "right" : "left";
		}
		if (before != this.state.draggingOver) this.forceUpdate();
	}
	dragOut() {
		if (!this.props.drag) return;
		delete this.state.draggingOver;
		this.forceUpdate();
	}
	drop(e) {
		if (!!this.props.drop) {
			this.stopProp(e);
			var before = this.state.draggingOver == "top" || this.state.draggingOver == "left";
			delete this.state.draggingOver;
			this.props.drop(this.props.tab.id, before);
		} else {
			return false;
		}
	}
	async resolveFavIconUrl() {
		var image;
		// firefox screenshots; needs <all_urls>
		// if(!!browser.tabs.captureTab) {
		// 	console.log("tabs captureTab");
		// 	image = await browser.tabs.captureTab(this.props.tab.id);
		// 	image = "url(" + image + ")";
		// }else
		if (this.props.tab.url.indexOf("chrome://") !== 0 && this.props.tab.url.indexOf("about:") !== 0) {
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
			image = this.props.tab.favIconUrl ? "url(" + this.props.tab.favIconUrl + ")" : "";
			//}
		} else {
			var favIcons = ["bookmarks", "chrome", "crashes", "downloads", "extensions", "flags", "history", "settings"];
			var iconName = this.props.tab.url.slice(9).match(/^\w+/g);
			image = !iconName || favIcons.indexOf(iconName[0]) < 0 ? "" : "url(../images/chrome/" + iconName[0] + ".png)";
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
