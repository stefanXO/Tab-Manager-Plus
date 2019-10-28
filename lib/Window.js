"use strict";var Window = React.createFactory(React.createClass({
	getInitialState: function getInitialState() {
		var colors = localStorage["windowColors"];
		if (!!colors) {
			colors = JSON.parse(colors);
		} else {
			colors = {};
		}
		var color = colors[this.props.window.id] || "default";
		var names = localStorage["windowNames"];
		if (!!names) {
			names = JSON.parse(names);
		} else {
			names = {};
		}
		var name = names[this.props.window.id] || "";
		return {
			colorActive: false,
			windowTitles: [],
			color: color,
			name: name,
			tabs: 0 };


	},
	render: function render() {var _this = this;
		var colors = localStorage["windowColors"];
		if (!!colors) {
			colors = JSON.parse(colors);
		} else {
			colors = {};
		}
		var color = colors[this.props.window.id] || "default";
		var names = localStorage["windowNames"];
		if (!!names) {
			names = JSON.parse(names);
		} else {
			names = {};
		}
		var name = names[this.props.window.id] || "";
		var hideWindow = true;
		var titleAdded = false;
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
				React.DOM.div({ className: "newliner" }),
				React.DOM.div(
				{ className: "window-actions" },
				this.props.sessionsFeature ? React.DOM.div({ className: "icon tabaction save " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Save this window for later\nWill save " + tabs.length + " tabs with this window for later. Please note : The saved tabs will lose their history.", onClick: this.save, onMouseEnter: this.props.hoverIcon }) : false,
				React.DOM.div({ className: "icon tabaction add " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Open a new tab", onClick: this.addTab, onMouseEnter: this.props.hoverIcon }),
				React.DOM.div({ className: "icon tabaction colors " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change window name or color", onClick: this.colors, onMouseEnter: this.props.hoverIcon }),
				this.props.window.state == "minimized" ?
				React.DOM.div({ className: "icon tabaction maximize " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Maximize this window\nWill maximize " + tabs.length + " tabs", onClick: this.maximize, onMouseEnter: this.props.hoverIcon }) :
				React.DOM.div({ className: "icon tabaction minimize " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Minimize this window\nWill minimize " + tabs.length + " tabs", onClick: this.minimize, onMouseEnter: this.props.hoverIcon }),
				React.DOM.div({ className: "icon tabaction close " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Close this window\nWill close " + tabs.length + " tabs", onClick: this.close, onMouseEnter: this.props.hoverIcon })));




			}
			if (this.state.colorActive) {
				tabs.push(
				React.DOM.div({ className: "window-colors " + (this.state.colorActive ? "" : "hidden"), onClick: this.stop },
				React.DOM.h2({ className: "window-x", onClick: this.closePopup }, "x"),
				React.DOM.h3({ className: "center" }, "Name the window"),
				React.DOM.input({ className: "window-name-input", type: "text", value: this.state.name, placeholder: this.state.windowTitles ? this.topEntries(this.state.windowTitles).join("") : "Name window...", tabIndex: "1", onChange: this.changeName, ref: "namebox" }),
				React.DOM.h3({ className: "center" }, "Pick a color"),
				React.DOM.div({ className: "colors-box" },
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
				React.DOM.div({ className: "icon tabaction color25 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Change background color", onClick: this.changeColors.bind(this, { colorActive: false, color: "color25" }), onMouseEnter: this.props.hoverIcon }))));
			}

			if (this.props.windowTitles) {
				if (name) {
					tabs.unshift(
					React.DOM.h3({ className: "editName center windowTitle", onClick: this.colors, title: "Change the name of this window", onMouseEnter: this.props.hoverIcon }, name));
					titleAdded = true;
				} else {
					if (this.state.windowTitles.length == 0 || this.state.tabs != tabs.length + this.props.window.id * 99) {
						this.state.windowTitles = [];
						this.state.tabs = tabs.length + this.props.window.id * 99;
						for (var i = 0; i < tabs.length; i++) {
							if (!!tabs[i].props && !!tabs[i].props.tab && !!tabs[i].props.tab.url) {
								var url = new URL(tabs[i].props.tab.url);
								var protocol = url.protocol;
								var hostname = url.hostname;
								if (protocol.indexOf("chrome-extension") > -1) {
									hostname = tabs[i].props.tab.title;
								} else if (protocol.indexOf("about") > -1) {
									hostname = tabs[i].props.tab.title;
								} else if (hostname.indexOf("mail.google") > -1) {
									hostname = "gmail";
								} else {
									hostname = hostname.replace("www.", "");
									var regex_var = new RegExp(/(\.[^\.]{0,2})(\.[^\.]{0,2})(\.*$)|(\.[^\.]*)(\.*$)/);
									hostname = hostname.replace(regex_var, '').split('.').pop();
								}
								if (hostname.length > 18) {
									hostname = tabs[i].props.tab.title;
									while (hostname.length > 18 && hostname.indexOf(" ") > -1) {
										hostname = hostname.split(" ");
										hostname.pop();
										hostname = hostname.join(" ");
									}
								}
								this.state.windowTitles.push(hostname);
							}
						};
					}

					if (this.state.windowTitles.length > 0) {
						tabs.unshift(
						React.DOM.h3({ className: "editName center windowTitle", onClick: this.colors, title: "Change the name of this window", onMouseEnter: this.props.hoverIcon }, this.topEntries(this.state.windowTitles).join("")));
						titleAdded = true;
					}
				}
			}

			if(tabsperrow < 5) {
				tabsperrow = 5;
			}
			var children = [];
			if(!!titleAdded) {
				children.push(tabs.shift());
			}
			for (var j = 0; j < tabs.length; j++) {
				children.push(tabs[j]);
				if ((j+1) % tabsperrow == 0 && j && (this.props.layout.indexOf("blocks") > -1)) {
					children.push(React.DOM.div({ className: "newliner" }));
				}
			}
			var focused = false;
			if (this.props.window.focused || this.props.lastOpenWindow == this.props.window.id) {
				focused = true;
			}
			return React.DOM.div({
				className: "window " + this.props.window.state + " " + (focused ? "activeWindow" : "") + " " + color + " " + (this.props.layout.indexOf("blocks") > -1 ? "block" : "") + " " + this.props.layout + " " + (this.props.window.incognito ? " incognito" : "") + " " + (focused ? " focused" : ""),
				onDragOver: this.dragOver,
				onClick: this.windowClick,
				title: "Focus this window\nWill select this window with " + tabs.length + " tabs",
				onMouseEnter: this.props.hoverIcon,
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
		browser.tabs.create({ windowId: this.props.window.id });
	},
	dragOver: function dragOver(e) {
		e.nativeEvent.preventDefault();
	},
	drop: function drop(e) {
		e.stopPropagation();
		this.props.dropWindow(this.props.window.id);
	},
	windowClick: async function windowClick() {
		await browser.windows.update(this.props.window.id, {
			"focused": true });
		this.props.parentUpdate();
		if(!!window.inPopup) window.close();
	},
	close: function close(e) {
		e.stopPropagation();
		browser.windows.remove(this.props.window.id);
	},
	uuidv4: function uuidv4() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = Math.random() * 16 | 0,v = c == 'x' ? r : r & 0x3 | 0x8;
			return v.toString(16);
		});
	},
	save: async function close(e) {
		e.stopPropagation();

		console.log("session name", this.state.name);
		var sessionName = this.state.name || this.topEntries(this.state.windowTitles).join("");
		console.log("session name", sessionName);

		var session = {
			tabs: [],
			windowsInfo: {},
			name: sessionName,
			date: Date.now(),
			sessionStartTime: Date.now(),
			id: this.uuidv4() };


		if (this.state.name) {
			session.customName = true;
		}

		var queryInfo = {};
		//queryInfo.currentWindow = true;
		queryInfo.windowId = this.props.window.id;
		console.log(queryInfo);

		var tabs = await browser.tabs.query(queryInfo);
		console.log(tabs);
		for (var tabkey in tabs) {
			if (navigator.userAgent.search("Firefox") > -1) {
				var newTab = tabs[tabkey];
				if (!!newTab.url && newTab.url.search("about:") > -1) {
					continue;
				}
			}
			session.tabs.push(tabs[tabkey]);
		}
		console.log(session.tabs);
		session.windowsInfo = await browser.windows.get(this.props.window.id);

		console.log(session);
		var obj = {};
		obj[session.id] = session;
		console.log(obj);

		var value = await browser.storage.local.set(obj).catch(function (err) {
			console.log(err);
			console.error(err.message);
		});
		console.log('Value is set to ' + value);
		this.props.parentUpdate();
		//browser.windows.remove(this.props.window.id);
	},
	minimize: async function minimize(e) {
		e.stopPropagation();
		await browser.windows.update(this.props.window.id, {
			"state": "minimized" });
		this.props.parentUpdate();
	},
	maximize: async function maximize(e) {
		e.stopPropagation();
		await browser.windows.update(this.props.window.id, {
			"state": "normal" });
		this.props.parentUpdate();
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
	},
	closePopup: function changeColors() {
		this.setState({
			colorActive: !this.state.colorActive });
	},
	changeName: function changeNames(e) {
		// this.setState(a);
		var names = localStorage["windowNames"];
		if (!!names) {
			names = JSON.parse(names);
		} else {
			names = {};
		}
		names[this.props.window.id] = e.target.value || "";
		localStorage["windowNames"] = JSON.stringify(names);
		this.setState({
			name: e.target.value || "" });

	},
	topEntries: function topEntries(arr)
	{
		var cnts = arr.reduce(function (obj, val) {
			obj[val] = (obj[val] || 0) + 1;
			return obj;
		}, {});
		var sorted = Object.keys(cnts).sort(function (a, b) {
			return cnts[b] - cnts[a];
		});


		var more = 0;
		if (sorted.length == 3) {

		} else {
			while (sorted.length > 2) {
				sorted.pop();
				more++;
			}
		}
		for (var i = 0; i < sorted.length; i++) {
			if (i > 0) {
				sorted[i] = ", " + sorted[i];
			}
		};
		if (more > 0) {
			sorted.push(" & " + more + " more");
		}
		return sorted;
	} }));

