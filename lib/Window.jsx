"use strict";

class Window extends React.Component {
	constructor(props) {
		super(props);
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
		if(!!this.props.window.titlePreface) {
			name = this.props.window.titlePreface;
		}
		this.state = {
			colorActive: false,
			windowTitles: [],
			color: color,
			name: name,
			tabs: 0
		};

		this.addTab = this.addTab.bind(this);
		this.changeColors = this.changeColors.bind(this);
		this.changeName = this.changeName.bind(this);
		this.checkKey = this.checkKey.bind(this);
		this.closePopup = this.closePopup.bind(this);
		this.close = this.close.bind(this);
		this.colors = this.colors.bind(this);
		this.dragOver = this.dragOver.bind(this);
		this.drop = this.drop.bind(this);
		this.maximize = this.maximize.bind(this);
		this.minimize = this.minimize.bind(this);
		this.save = this.save.bind(this);
		this.stop = this.stop.bind(this);
		this.windowClick = this.windowClick.bind(this);
		this.selectToFromTab = this.selectToFromTab.bind(this);
	}

	render() {
		var _this = this;
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
		var tabs = this.props.tabs.map(function(tab) {
			var isHidden = !!_this.props.hiddenTabs[tab.id] && _this.props.filterTabs;
			var isSelected = !!_this.props.selection[tab.id];
			hideWindow &= isHidden;
			return (
				<Tab
					key={"windowtab_" + _this.props.window.id + "_" + tab.id}
					window={_this.props.window}
					layout={_this.props.layout}
					tab={tab}
					selected={isSelected}
					hidden={isHidden}
					middleClick={_this.props.tabMiddleClick}
					hoverHandler={_this.props.hoverHandler}
					searchActive={_this.props.searchActive}
					select={_this.props.select}
					selectTo={_this.selectToFromTab}
					drag={_this.props.drag}
					drop={_this.props.drop}
					dropWindow={_this.props.dropWindow}
					ref={"tab" + tab.id}
					id={"tab-" + tab.id}
				/>
			);
		});
		if (!hideWindow) {
			if (!!this.props.tabactions) {
				tabs.push(
					<div className="newliner" />,
					<div className="window-actions">
						{this.props.sessionsFeature ? (
							<div
								className={"icon tabaction save " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title={
									"Save this window for later\nWill save " +
									tabs.length +
									" tabs with this window for later. Please note : The saved tabs will lose their history."
								}
								onClick={this.save}
								onMouseEnter={this.props.hoverIcon}
							/>
						) : (
							false
						)}
						<div
							className={"icon tabaction add " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
							title="Open a new tab"
							onClick={this.addTab}
							onMouseEnter={this.props.hoverIcon}
						/>
						<div
							className={"icon tabaction colors " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
							title="Change window name or color"
							onClick={this.colors}
							onMouseEnter={this.props.hoverIcon}
						/>
						{this.props.window.state == "minimized" ? (
							<div
								className={"icon tabaction maximize " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title={"Maximize this window\nWill maximize " + tabs.length + " tabs"}
								onClick={this.maximize}
								onMouseEnter={this.props.hoverIcon}
							/>
						) : (
							<div
								className={"icon tabaction minimize " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title={"Minimize this window\nWill minimize " + tabs.length + " tabs"}
								onClick={this.minimize}
								onMouseEnter={this.props.hoverIcon}
							/>
						)}
						<div
							className={"icon tabaction close " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
							title={"Close this window\nWill close " + tabs.length + " tabs"}
							onClick={this.close}
							onMouseEnter={this.props.hoverIcon}
						/>
					</div>
				);
			}
			if (this.state.colorActive) {
				tabs.push(
					<div className={"window-colors " + (this.state.colorActive ? "" : "hidden")} onClick={this.stop} onKeyDown={this.checkKey}>
						<h2 className="window-x" onClick={this.closePopup}>
							x
						</h2>
						<h3 className="center">Name the window</h3>
						<input
							className="window-name-input"
							type="text"
							onChange={this.changeName}
							value={this.state.name}
							placeholder={this.state.windowTitles ? this.topEntries(this.state.windowTitles).join("") : "Name window..."}
							tabIndex="1"
							ref="namebox"
							onKeyDown={this.checkKey}
						/>
						<h3 className="center">Pick a color</h3>
						<div className="colors-box">
							<div
								className={"icon tabaction default " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "default" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color1 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color1" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color2 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color2" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color3 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color3" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color4 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color4" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color5 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color5" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color6 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color6" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color7 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color7" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color8 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color8" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color9 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color9" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color10 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color10" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color11 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color11" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color12 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color12" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color13 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color13" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color14 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color14" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color15 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color15" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color16 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color16" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color17 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color17" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color18 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color18" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color19 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color19" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color20 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color20" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color21 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color21" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color22 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color22" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color23 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color23" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color24 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color24" })}
								onMouseEnter={this.props.hoverIcon}
							/>
							<div
								className={"icon tabaction color25 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
								title="Change background color"
								onClick={this.changeColors.bind(this, { colorActive: false, color: "color25" })}
								onMouseEnter={this.props.hoverIcon}
							/>
						</div>
					</div>
				);
			}

			if (this.props.windowTitles) {
				if (name) {
					tabs.unshift(
						<h3
							key={"window-" + this.props.window.id + "-windowTitle"}
							className="editName center windowTitle"
							onClick={this.colors}
							title="Change the name of this window"
							onMouseEnter={this.props.hoverIcon}
						>
							{name}
						</h3>
					);
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
									hostname = hostname
										.replace(regex_var, "")
										.split(".")
										.pop();
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
						}
					}

					if (this.state.windowTitles.length > 0) {
						tabs.unshift(
							<h3
								key={"window-" + this.props.window.id + "-windowTitle"}
								className="editName center windowTitle"
								onClick={this.colors}
								title="Change the name of this window"
								onMouseEnter={this.props.hoverIcon}
							>
								{this.topEntries(this.state.windowTitles).join("")}
							</h3>
						);
						titleAdded = true;
					}
				}
			}

			if (tabsperrow < 5) {
				tabsperrow = 5;
			}
			var children = [];
			if (!!titleAdded) {
				children.push(tabs.shift());
			}
			var z = -1;
			for (var j = 0; j < tabs.length; j++) {
				var tab = tabs[j].props.tab;
				var isHidden = !!tab && !!tab.id && !!this.props.hiddenTabs[tab.id] && this.props.filterTabs;
				if(!isHidden) {
					z++;
					children.push(tabs[j]);
				}
				if ((z + 1) % tabsperrow == 0 && z && this.props.layout.indexOf("blocks") > -1) {
					children.push(<div className="newliner" />);
				}
			}
			var focused = false;
			if (this.props.window.focused || this.props.lastOpenWindow == this.props.window.id) {
				focused = true;
			}
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
						(this.props.layout.indexOf("blocks") > -1 ? "block" : "") +
						" " +
						this.props.layout +
						" " +
						(this.props.window.incognito ? " incognito" : "") +
						" " +
						(focused ? " focused" : "")
					}
					onDragOver={this.dragOver}
					onClick={this.windowClick}
					title={"Focus this window\nWill select this window with " + tabs.length + " tabs"}
					onMouseEnter={this.props.hoverIcon}
					onDrop={this.drop}
				>
					<div className="windowcontainer" title={"Focus this window\nWill select this window with " + tabs.length + " tabs"}>{children}</div>
				</div>
			);
		} else {
			return null;
		}
	}
	stop(e) {
		this.stopProp(e);
	}
	addTab(e) {
		this.stopProp(e);
		browser.tabs.create({ windowId: this.props.window.id });
	}
	dragOver(e) {
		this.stopProp(e);
	}
	drop(e) {
		this.stopProp(e);
		this.props.dropWindow(this.props.window.id);
	}
	checkKey(e) {
		// close popup when enter or escape have been pressed
		if (e.keyCode == 13 || e.keyCode == 27) {
			this.stopProp(e);
			this.closePopup();
		}
	}
	async windowClick(e) {
		this.stopProp(e);
		var backgroundPage = await browser.runtime.getBackgroundPage();
		var windowId = this.props.window.id;
		if (navigator.userAgent.search("Firefox") > -1) {
			backgroundPage.focusOnWindowDelayed(windowId);
		}else{
			backgroundPage.focusOnWindow(windowId);
		}
		this.props.parentUpdate();
		if (!!window.inPopup) window.close();
		return false;
	}
	selectToFromTab(tabId) {
		if(tabId) this.props.selectTo(tabId, this.props.tabs);
	}
	close(e) {
		this.stopProp(e);
		browser.windows.remove(this.props.window.id);
	}
	uuidv4() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
			var r = (Math.random() * 16) | 0,
				v = c == "x" ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}
	async save(e) {
		this.stopProp(e);

		console.log("session name", this.state.name);
		var sessionName = this.state.name || this.topEntries(this.state.windowTitles).join("");
		console.log("session name", sessionName);

		var session = {
			tabs: [],
			windowsInfo: {},
			name: sessionName,
			date: Date.now(),
			sessionStartTime: Date.now(),
			id: this.uuidv4()
		};

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

		var value = await browser.storage.local.set(obj).catch(function(err) {
			console.log(err);
			console.error(err.message);
		});
		this.props.parentUpdate();
		console.log("Value is set to " + value);

		setTimeout(function() {
			this.props.scrollTo("session", session.id);
		}.bind(this), 250);
	}
	async minimize(e) {
		this.stopProp(e);
		await browser.windows.update(this.props.window.id, {
			state: "minimized"
		});
		this.props.parentUpdate();
	}
	async maximize(e) {
		this.stopProp(e);
		await browser.windows.update(this.props.window.id, {
			state: "normal"
		});
		this.props.parentUpdate();
	}
	colors(e) {
		this.stopProp(e);
		this.props.toggleColors(!this.state.colorActive, this.props.window.id);
		this.setState({
			colorActive: !this.state.colorActive
		});
		setTimeout(function() {
			if(this.state.colorActive) {
				this.refs.namebox.focus();
			}
		}.bind(this), 250);
	}
	changeColors(a) {
		this.setState(a);
		var colors = localStorage["windowColors"];
		if (!!colors) {
			colors = JSON.parse(colors);
		} else {
			colors = {};
		}
		colors[this.props.window.id] = a.color;
		localStorage["windowColors"] = JSON.stringify(colors);
	}
	closePopup() {
		this.props.toggleColors(!this.state.colorActive, this.props.window.id);
		this.setState({
			colorActive: !this.state.colorActive
		});
		this.props.parentUpdate();
	}
	async changeName(e) {
		// this.setState(a);
		var name = "";
		if(e && e.target && e.target.value) name = e.target.value;

		var names = localStorage["windowNames"];
		if (!!names) {
			names = JSON.parse(names);
		} else {
			names = {};
		}
		names[this.props.window.id] = name;
		localStorage["windowNames"] = JSON.stringify(names);
		this.setState({
			name: name
		});
		if (navigator.userAgent.search("Firefox") > -1) {
			if(!!name) {
				browser.windows.update(this.props.window.id, {
					titlePreface: name + " - "
				});
			}else{
				browser.windows.update(this.props.window.id, {
					titlePreface: name
				});
			}
		}
	}
	topEntries(arr) {
		var cnts = arr.reduce(function(obj, val) {
			obj[val] = (obj[val] || 0) + 1;
			return obj;
		}, {});
		var sorted = Object.keys(cnts).sort(function(a, b) {
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
		}
		if (more > 0) {
			sorted.push(" & " + more + " more");
		}
		return sorted;
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
