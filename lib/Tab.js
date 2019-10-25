"use strict";var Tab = React.createFactory(React.createClass({
	getInitialState: function getInitialState() {
		return {};
	},
	render: function render() {
		var children = [];
		if (this.props.layout == "vertical") {
			children.push(React.DOM.div({ className: "tab-pinned " + (!this.props.tab.pinned ? "hidden" : "") }, "Pinned"));
			children.push(React.DOM.div({ className: "tab-highlighted " + (!this.props.tab.highlighted ? "hidden" : "") }, "Active"));
			children.push(React.DOM.div({ className: "tab-selected " + (!this.props.selected ? "hidden" : "") }, "Selected"));
			children.push(React.DOM.div({ className: "iconoverlay ", style: {
					backgroundImage: this.resolveFavIconUrl() } }));

			children.push(React.DOM.div({ className: "tabtitle" }, this.props.tab.title));
		}


		var tabDom = {
			className: "icon tab " + (
			this.props.selected ? "selected " : "") + (
			this.props.tab.pinned ? "pinned " : "") + (
			this.props.tab.highlighted ? "highlighted " : "") + (
			this.props.hidden ? "hidden " : "") + (
			this.props.layout == "vertical" ? "full " : "") + (
			this.props.tab.incognito ? "incognito " : "") + (
			this.state.draggingOver || "") + (
			this.props.searchActive ? "search-active " : "") + " " + this.props.tab.id + " " + (
			this.props.layout == "vertical" ? "vertical " : ""),
			style: {
				backgroundImage: this.resolveFavIconUrl() },

			title: this.props.tab.title,
			onClick: this.click,
			onMouseDown: this.onMouseDown,
			onMouseEnter: this.onHover };


		if (!!this.props.drag) {
			tabDom["onDragStart"] = this.dragStart;
			tabDom["onDragOver"] = this.dragOver;
			tabDom["onDragLeave"] = this.dragOut;
			tabDom["onDrop"] = this.drop;
			tabDom["draggable"] = "true";
		}

		return React.DOM.div(tabDom,

		children,
		React.DOM.div({ className: "limiter" }));

	},
	onHover: function onHover(e) {
		this.props.hoverHandler(this.props.tab);
	},
	onMouseDown: function onMouseDown(e) {
		if (e.button === 0) return;
		if (!this.props.drag) return;
		this.click(e);
	},
	click: async function click(e) {
		e.nativeEvent.preventDefault();
		e.nativeEvent.stopPropagation();
		if (!this.props.drag) return;
		if (e.button === 1) {
			this.props.middleClick(this.props.tab.id);
		} else if (e.button === 2 || e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey) {
			e.preventDefault();
			this.props.select(this.props.tab.id);
		} else {
			await browser.tabs.update(this.props.tab.id, { active: true });
			await browser.windows.update(this.props.window.id, { focused: true });
			if(!!window.inPopup) window.close();
		}
		return false;
	},
	dragStart: function dragStart(e) {
		if (!!this.props.drag) {
			e.dataTransfer.setData('Text', this.props.tab.id);
			this.props.drag(e, this.props.tab.id);
		} else {
			return false;
		}
	},
	dragOver: function dragOver(e) {
		e.nativeEvent.preventDefault();
		if (!this.props.drag) return;
		var before = this.state.draggingOver;
		if (this.props.layout == "vertical") {
			this.state.draggingOver = e.nativeEvent.offsetY > ReactDOM.findDOMNode(this).clientHeight / 2 ? "bottom" : "top";
		} else {
			this.state.draggingOver = e.nativeEvent.offsetX > ReactDOM.findDOMNode(this).clientWidth / 2 ? "right" : "left";
		}
		if (before != this.state.draggingOver) this.forceUpdate();
	},
	dragOut: function dragOut() {
		if (!this.props.drag) return;
		delete this.state.draggingOver;
		this.forceUpdate();
	},
	drop: function drop(e) {
		if (!!this.props.drop) {
			e.nativeEvent.preventDefault();
			e.stopPropagation();
			var before = this.state.draggingOver == "top" || this.state.draggingOver == "left";
			delete this.state.draggingOver;
			this.props.drop(this.props.tab.id, before);
		} else {
			return false;
		}
	},
	resolveFavIconUrl: function resolveFavIconUrl() {
		if (this.props.tab.url.indexOf("chrome://") !== 0 && this.props.tab.url.indexOf("about:") !== 0) {
			return this.props.tab.favIconUrl ? "url(" + this.props.tab.favIconUrl + ")" : "";
		} else {
			var favIcons = ["bookmarks", "chrome", "crashes", "downloads", "extensions", "flags", "history", "settings"];
			var iconName = this.props.tab.url.slice(9).match(/^\w+/g);
			return !iconName || favIcons.indexOf(iconName[0]) < 0 ? "" : "url(../images/chrome/" + iconName[0] + ".png)";
		}
	} }));

