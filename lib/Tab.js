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
		return React.DOM.div({
			className: "icon tab " + (
			this.props.selected ? "selected " : "") + (
			this.props.tab.pinned ? "pinned " : "") + (
			this.props.tab.highlighted ? "highlighted " : "") + (
			this.props.hidden ? "hidden " : "") + (
			this.props.layout == "vertical" ? "full " : "") + (
			this.props.tab.incognito ? "incognito " : "") + (
			this.state.draggingOver || "") + (
			this.props.searchActive ? "search-active " : "") + (
			this.props.layout == "vertical" ? "vertical " : ""),
			style: {
				backgroundImage: this.resolveFavIconUrl() },

			title: this.props.tab.title,
			onClick: this.click,
			onMouseDown: this.onMouseDown,
			onDragStart: this.dragStart,
			onDragOver: this.dragOver,
			onDragLeave: this.dragOut,
			onMouseEnter: this.onHover,
			onDrop: this.drop,
			draggable: "true" },

		children,
		React.DOM.div({ className: "limiter" }));

	},
	onHover: function onHover(e) {
		this.props.hoverHandler(this.props.tab);
	},
	onMouseDown: function onMouseDown(e) {
		if (e.button === 0) return;
		this.click(e);
	},
	click: function click(e) {
		e.nativeEvent.preventDefault();
		e.nativeEvent.stopPropagation();
		if (e.button === 1) {
			this.props.middleClick(this.props.tab.id);
		} else if (e.button === 2 || e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey) {
			e.preventDefault();
			this.props.select(this.props.tab.id);
		} else {
			chrome.tabs.update(this.props.tab.id, { active: true });
			chrome.windows.update(this.props.window.id, { focused: true });
		}
		return false;
	},
	dragStart: function dragStart(e) {
		e.dataTransfer.setData('Text', this.props.tab.id);
		this.props.drag(e, this.props.tab.id);
	},
	dragOver: function dragOver(e) {
		e.nativeEvent.preventDefault();
		var before = this.state.draggingOver;
		if (this.props.layout == "vertical") {
			this.state.draggingOver = e.nativeEvent.offsetY > ReactDOM.findDOMNode(this).clientHeight / 2 ? "bottom" : "top";
		} else {
			this.state.draggingOver = e.nativeEvent.offsetX > ReactDOM.findDOMNode(this).clientWidth / 2 ? "right" : "left";
		}
		if (before != this.state.draggingOver) this.forceUpdate();
	},
	dragOut: function dragOut() {
		delete this.state.draggingOver;
		this.forceUpdate();
	},
	drop: function drop(e) {
		e.nativeEvent.preventDefault();
		e.stopPropagation();
		var before = this.state.draggingOver == "top" || this.state.draggingOver == "left";
		delete this.state.draggingOver;
		this.props.drop(this.props.tab.id, before);
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

