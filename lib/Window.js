var Window = React.createFactory(React.createClass({
	getInitialState: function getInitialState() {
		var colors = localStorage["windowColors"];
		if (!!colors) {
			colors = JSON.parse(colors);
		} else {
			colors = {};
		}
		var color = colors[this.props.window.id] || "default";
		return {
			colorActive: false,
			color: color };

	},
	render: function render() {var _this = this;
		var colors = localStorage["windowColors"];
		if (!!colors) {
			colors = JSON.parse(colors);
		} else {
			colors = {};
		}
		var color = colors[this.props.window.id] || "default";
		var hideWindow = true;
		var tabsperrow = this.props.layout.indexOf("blocks") > -1 ? Math.ceil(Math.sqrt(this.props.tabs.length + 2)) : this.props.layout == "vertical" ? 1 : 15;
		var tabs = this.props.tabs.map(function (tab) {
			var isHidden = !!_this.props.hiddenTabs[tab.id] && _this.props.filterTabs;
			var isSelected = !!_this.props.selection[tab.id];
			hideWindow &= isHidden;
			return Tab({
				window: _this.props.window,
				layout: _this.props.layout,
				tab: tab,
				selected: isSelected,
				hidden: isHidden,
				middleClick: _this.props.tabMiddleClick,
				hoverHandler: _this.props.hoverHandler,
				searchActive: _this.props.searchActive,
				select: _this.props.select,
				drag: _this.props.drag,
				drop: _this.props.drop,
				dropWindow: _this.props.dropWindow,
				ref: "tab" + tab.id });

		});
		if (!hideWindow) {
			if (!!this.props.tabactions) {
				tabs.push(
				React.DOM.div(
				{ className: "window-actions" },
				React.DOM.div({ className: "icon tabaction add " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Open a new tab", onClick: this.addTab, onMouseEnter: this.props.hoverIcon }),
				React.DOM.div({ className: "icon tabaction colors " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Colorize this window", onClick: this.colors, onMouseEnter: this.props.hoverIcon }),
				this.props.window.state == "minimized" ?
				React.DOM.div({ className: "icon tabaction maximize " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Maximize this window\nWill maximize " + tabs.length + " tabs", onClick: this.maximize, onMouseEnter: this.props.hoverIcon }) :
				React.DOM.div({ className: "icon tabaction minimize " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Minimize this window\nWill minimize " + tabs.length + " tabs", onClick: this.minimize, onMouseEnter: this.props.hoverIcon }),

				React.DOM.div({ className: "icon tabaction close " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Close this window\nWill close " + tabs.length + " tabs", onClick: this.close, onMouseEnter: this.props.hoverIcon })));


			}
			tabs.push(
			React.DOM.div({ className: "window-colors " + (this.state.colorActive ? "" : "hidden"), onClick: this.stop },
			React.DOM.h2({ className: "center" }, "Pick a color"),
			React.DOM.div({ className: "icon tabaction default " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "default" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color1 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color1" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color2 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color2" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color3 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color3" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color4 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color4" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color5 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color5" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color6 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color6" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color7 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color7" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color8 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color8" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color9 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color9" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color10 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color10" }), onMouseEnter: this.props.hoverIcon }),

			React.DOM.div({ className: "icon tabaction color11 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color11" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color12 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color12" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color13 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color13" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color14 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color14" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color15 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color15" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color16 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color16" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color17 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color17" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color18 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color18" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color19 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color19" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color20 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color20" }), onMouseEnter: this.props.hoverIcon }),

			React.DOM.div({ className: "icon tabaction color21 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color21" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color22 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color22" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color23 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color23" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color24 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color24" }), onMouseEnter: this.props.hoverIcon }),
			React.DOM.div({ className: "icon tabaction color25 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color25" }), onMouseEnter: this.props.hoverIcon })));



			var children = [];
			for (var j = 0; j < tabs.length; j++) {
				if (j % tabsperrow == 0 && j && (j < tabs.length - 1 || this.props.layout.indexOf("blocks") > -1)) {
					children.push(React.DOM.div({ className: "newliner" }));
				}
				children.push(tabs[j]);
			}
			return React.DOM.div({
				className: "window " + this.props.window.state + " " + color + " " + (this.props.layout.indexOf("blocks") > -1 ? "block" : "") + " " + this.props.layout + " " + (this.props.window.incognito ? " incognito" : "") + " " + (this.props.window.focused ? " focused" : ""),
				onDragOver: this.dragOver,
				onClick: this.windowClick,
				onDrop: this.drop },
			React.DOM.div({ className: "windowcontainer" }, children));
		} else {
			return null;
		}
	},
	componentDidUpdate: function componentDidUpdate() {
		this.props.parentScrollUpdate();
	},
	stop: function stop(e) {
		e.stopPropagation();
	},
	addTab: function addTab(e) {
		e.stopPropagation();
		chrome.tabs.create({ windowId: this.props.window.id });
	},
	dragOver: function dragOver(e) {
		e.nativeEvent.preventDefault();
	},
	drop: function drop(e) {
		e.stopPropagation();
		this.props.dropWindow(this.props.window.id);
	},
	windowClick: function windowClick() {
		chrome.windows.update(this.props.window.id, {
			"focused": true },
		function (a) {this.props.parentUpdate();}.bind(this));
	},
	close: function close(e) {
		e.stopPropagation();
		chrome.windows.remove(this.props.window.id);
	},
	minimize: function minimize(e) {
		e.stopPropagation();
		chrome.windows.update(this.props.window.id, {
			"state": "minimized" },
		function (a) {this.props.parentUpdate();}.bind(this));
	},
	maximize: function maximize(e) {
		e.stopPropagation();
		chrome.windows.update(this.props.window.id, {
			"state": "normal" },
		function (a) {this.props.parentUpdate();}.bind(this));
	},
	colors: function colors(e) {
		e.stopPropagation();
		this.setState({
			colorActive: !this.state.colorActive });

	},
	changeColors: function changeColors(a) {
		this.setState(a);
		var colors = localStorage["windowColors"];
		if (!!colors) {
			colors = JSON.parse(colors);
		} else {
			colors = {};
		}
		colors[this.props.window.id] = a.color;
		localStorage["windowColors"] = JSON.stringify(colors);
	} }));

