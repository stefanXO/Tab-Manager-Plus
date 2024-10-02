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
		this.stopProp(e);
	}
	async windowClick(e) {
		var _this2 = this;
		this.stopProp(e);
		console.log("source window", this.props.window);
		// chrome.runtime.getBackgroundPage(function callback(tabs, backgroundPage) {
		// 	backgroundPage.createWindowWithTabs(tabs);
		// }.bind(null, this.props.window.tabs));

		let backgroundPage = await browser.runtime.getBackgroundPage();
		if (navigator.userAgent.search("Firefox") > -1) {
			backgroundPage.createWindowWithTabsFromSessionDelayed(this.props.window);
		} else {
			backgroundPage.createWindowWithTabsFromSession(this.props.window);
		}

		///////

		console.log("updating parent");

		this.props.parentUpdate();

		if (!!window.inPopup) {
			window.close();
		}else{
			setTimeout(function () {
				this.props.scrollTo("window", browser.windows.WINDOW_ID_CURRENT);
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
		this.stopProp(e);
		var value = await browser.storage.local.remove(this.props.window.id);
		console.log(value);
		this.props.parentUpdate();
		// browser.windows.remove(this.props.window.windowsInfo.id);
	}
	maximize(e) {
		this.stopProp(e);
		// browser.windows.update(this.props.window.windowsInfo.id, {
		// 	"state": "normal" },
		// function (a) {this.props.parentUpdate();}.bind(this));
	}
	stopProp(e) {
		if (e && e.nativeEvent) {
			e.nativeEvent.preventDefault();
			e.nativeEvent.stopPropagation();
		}
		if (e && e.preventDefault) {
			e.preventDefault();
			e.stopPropagation();
		}
	}
}
