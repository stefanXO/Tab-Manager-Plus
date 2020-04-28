"use strict";

class Session extends React.Component {
	constructor(props) {
		super(props);
		//console.log(this.props.window);
		//console.log(this.props.window.name);
		var name = this.props.window.name;
		this.state = {
			windowTitles: [],
			name: name,
			tabs: 0
		};

		this.stop = this.stop.bind(this);
		this.windowClick = this.windowClick.bind(this);
		this.close = this.close.bind(this);
		this.maximize = this.maximize.bind(this);

	}
	render() {
		var _this = this;
		var name = this.props.window.name;
		var hideWindow = true;
		var titleAdded = false;
		var tabsperrow = this.props.layout.indexOf("blocks") > -1 ? Math.ceil(Math.sqrt(this.props.tabs.length + 2)) : this.props.layout == "vertical" ? 1 : 15;
		var tabs = this.props.tabs.map(function(tab) {
			var tabId = tab.id * tab.id * tab.id * 100;
			var isHidden = !!_this.props.hiddenTabs[tabId] && _this.props.filterTabs;
			var isSelected = !!_this.props.selection[tabId];
			tab.id = tabId;
			hideWindow &= isHidden;
			return (
				<Tab
					key={"sessiontab_" + _this.props.window.id + "_" + tab.index}
					window={_this.props.window}
					layout={_this.props.layout}
					tab={tab}
					selected={isSelected}
					hidden={isHidden}
					middleClick={_this.props.tabMiddleClick}
					hoverHandler={_this.props.hoverHandler}
					searchActive={_this.props.searchActive}
					select={_this.props.select}
					ref={"sessiontab" + tabId}
					id={"sessiontab-" + tab.id}
				/>
			);
		});
		if (!hideWindow) {
			if (!!this.props.tabactions) {
				tabs.push(
					<div className="newliner" />,
					<div className="window-actions">
						<div
							className={"icon tabaction restore " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
							title={"Restore this saved window\nWill restore " + tabs.length + " tabs. Please note : The tabs will be restored without their history."}
							onClick={this.windowClick}
							onMouseEnter={this.props.hoverIcon}
						/>
						<div
							className={"icon tabaction delete " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction")}
							title={"Delete this saved window\nWill delete " + tabs.length + " tabs permanently"}
							onClick={this.close}
							onMouseEnter={this.props.hoverIcon}
						/>
					</div>
				);
			}

			if (this.props.windowTitles) {
				if (name) {
					tabs.unshift(
						<h3 key={"session-" + this.props.window.id + "-windowTitle"} className="center windowTitle">
							{name}
						</h3>
					);
					titleAdded = true;
				}
			}
			if (tabsperrow < 3) {
				tabsperrow = 3;
			}
			var children = [];
			if (!!titleAdded) {
				children.push(tabs.shift());
			}
			for (var j = 0; j < tabs.length; j++) {
				children.push(tabs[j]);
				if ((j + 1) % tabsperrow == 0 && j && this.props.layout.indexOf("blocks") > -1) {
					children.push(<div className="newliner" />);
				}
			}
			var focused = false;
			if (this.props.window.windowsInfo.focused || this.props.lastOpenWindow == this.props.window.windowsInfo.id) {
				focused = true;
			}
			return (
				<div
					key={"session-" + this.props.window.id}
					id={"session-" + this.props.window.id}
					className={
						"window " +
						this.props.window.windowsInfo.state +
						" " +
						(focused ? "activeWindow" : "") +
						" session " +
						(this.props.layout.indexOf("blocks") > -1 ? "block" : "") +
						" " +
						this.props.layout +
						" " +
						(this.props.window.windowsInfo.incognito ? " incognito" : "") +
						" " +
						(focused ? " focused" : "")
					}
					onClick={this.windowClick}
				>
					<div className="windowcontainer">{children}</div>
				</div>
			);
		} else {
			return null;
		}
	}
	shouldComponentUpdate(nextProps, nextState) {
		//console.log("should update?", nextProps, nextState);
		return true;
	}
	stop(e) {
		e.stopPropagation();
	}
	async windowClick(e) {
		var _this2 = this;
		e.stopPropagation();
		console.log("source window", this.props.window);
		// chrome.runtime.getBackgroundPage(function callback(tabs, backgroundPage) {
		// 	backgroundPage.createWindowWithTabs(tabs);
		// }.bind(null, this.props.window.tabs));

		var customName = false;
		if (this.props.window && this.props.window.name && this.props.window.customName) {
			customName = this.props.window.name;
		}

		var whitelistWindow = ["left", "top", "width", "height", "incognito", "type"];

		if (navigator.userAgent.search("Firefox") > -1) {
			whitelistWindow = ["left", "top", "width", "height", "incognito", "type"];
		}

		var whitelistTab = ["url", "active", "selected", "pinned"];

		if (navigator.userAgent.search("Firefox") > -1) {
			whitelistTab = ["url", "active", "pinned"];
		}

		var filteredWindow = Object.keys(this.props.window.windowsInfo)
			.filter(function(key) {
				return whitelistWindow.includes(key);
			})
			.reduce(function(obj, key) {
				obj[key] = _this2.props.window.windowsInfo[key];
				return obj;
			}, {});
		console.log("filtered window", filteredWindow);

		var newWindow = await browser.windows.create(filteredWindow).catch(function(error) {
			console.error(error);
			console.log(error);
			console.log(error.message);
		});

		var emptyTab = newWindow.tabs[0].id;

		for (var i = 0; i < this.props.window.tabs.length; i++) {
			var newTab = Object.keys(this.props.window.tabs[i])
				.filter(function(key) {
					return whitelistTab.includes(key);
				})
				.reduce(function(obj, key) {
					obj[key] = _this2.props.window.tabs[i][key];
					return obj;
				}, {});
			console.log("source tab", newTab);
			if (navigator.userAgent.search("Firefox") > -1) {
				if (!!newTab.url && newTab.url.search("about:") > -1) {
					console.log("filtered by about: url", newTab.url);
					newTab.url = "";
				}
			}
			newTab.windowId = newWindow.id;
			var tabCreated = await browser.tabs.create(newTab).catch(function(error) {
				console.error(error);
				console.log(error);
				console.log(error.message);
			});
		}

		await browser.tabs.remove(emptyTab).catch(function(error) {
			console.error(error);
			console.log(error);
			console.log(error.message);
		});

		if (customName) {
			var names = localStorage["windowNames"];
			if (!!names) {
				names = JSON.parse(names);
			} else {
				names = {};
			}
			names[newWindow.id] = customName || "";
			localStorage["windowNames"] = JSON.stringify(names);
		}

		this.props.parentUpdate();

		if (!!window.inPopup) {
			window.close();
		}else{
			setTimeout(function() {
				this.props.scrollTo("window", newWindow.id);
			}.bind(this), 250);
		}

		// , function (tabs, w) {
		// 	browser.tabs.create(first.id, { pinned: first.pinned });
		// 	if (t.length > 0) {
		// 		browser.tabs.move(t, { windowId: w.id, index: -1 }, function (tab) {
		// 			browser.tabs.update(tab.id, { pinned: tab.pinned });
		// 		});
		// 	}
		// 	browser.windows.update(w.id, { focused: true });
		// }.bind(null, this.props.window.tabs));
		// browser.windows.update(this.props.window.windowsInfo.id, {
		// 	"focused": true },
		// function (a) {this.props.parentUpdate();}.bind(this));
	}
	async close(e) {
		e.stopPropagation();
		var value = await browser.storage.local.remove(this.props.window.id);
		console.log(value);
		this.props.parentUpdate();
		// browser.windows.remove(this.props.window.windowsInfo.id);
	}
	maximize(e) {
		e.stopPropagation();
		// browser.windows.update(this.props.window.windowsInfo.id, {
		// 	"state": "normal" },
		// function (a) {this.props.parentUpdate();}.bind(this));
	}
}
