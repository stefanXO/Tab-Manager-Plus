"use strict";var Session = React.createFactory(React.createClass({
	getInitialState: function getInitialState() {
		console.log(this.props.window.name);
		var name = this.props.window.name;
		return {
			windowTitles: [],
			name: name,
			tabs: 0 };


	},
	render: function render() {var _this = this;
		var name = this.props.window.name;
		var hideWindow = true;
		var tabsperrow = this.props.layout.indexOf("blocks") > -1 ? Math.ceil(Math.sqrt(this.props.tabs.length + 2)) : this.props.layout == "vertical" ? 1 : 15;
		var tabs = this.props.tabs.map(function (tab) {
			var tabId = tab.id * tab.id * tab.id * 100;
			var isHidden = !!_this.props.hiddenTabs[tabId] && _this.props.filterTabs;
			var isSelected = !!_this.props.selection[tabId];
			tab.id = tabId;
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
				ref: "tab" + tabId });

		});
		if (!hideWindow) {
			if (!!this.props.tabactions) {
				tabs.push(
				React.DOM.div(
				{ className: "window-actions" },
					React.DOM.div({ className: "icon tabaction restore " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Restore this saved window\nWill restore " + tabs.length + " tabs. Please note : The tabs will be restored without their history.", onClick: this.windowClick, onMouseEnter: this.props.hoverIcon }),
					React.DOM.div({ className: "icon tabaction delete " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"), title: "Delete this saved window\nWill delete " + tabs.length + " tabs permanently", onClick: this.close, onMouseEnter: this.props.hoverIcon })
				));


			}
			


			if (this.props.windowTitles) {
				if (name) {
					tabs.unshift(
					React.DOM.h3({ className: "center windowTitle" }, name));

				}
			}

			var children = [];
			for (var j = 0; j < tabs.length; j++) {
				if (j % tabsperrow == 0 && j && (j < tabs.length - 1 || this.props.layout.indexOf("blocks") > -1)) {
					children.push(React.DOM.div({ className: "newliner" }));
				}
				children.push(tabs[j]);
			}
			var focused = false;
			if (this.props.window.windowsInfo.focused || this.props.lastOpenWindow == this.props.window.windowsInfo.id) {
				focused = true;
			}
			return React.DOM.div({
				className: "window " + this.props.window.windowsInfo.state + " " + (focused ? "activeWindow" : "") + " session " + (this.props.layout.indexOf("blocks") > -1 ? "block" : "") + " " + this.props.layout + " " + (this.props.window.windowsInfo.incognito ? " incognito" : "") + " " + (focused ? " focused" : ""),
				onClick: this.windowClick
			},
			React.DOM.div({ className: "windowcontainer" }, children));
		} else {
			return null;
		}
	},
	shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
		//console.log("should update?", nextProps, nextState);
		return true;
	},
	stop: function stop(e) {
		e.stopPropagation();
	},
	windowClick: async function windowClick(e) {
		e.stopPropagation();
		console.log("source window", this.props.window);
		// chrome.runtime.getBackgroundPage(function callback(tabs, backgroundPage) {
		// 	backgroundPage.createWindowWithTabs(tabs);
		// }.bind(null, this.props.window.tabs));

		var customName = false;
		if(this.props.window && this.props.window.name && this.props.window.customName) {
			customName = this.props.window.name;
		}

		var whitelistWindow = [
			'url',
			'tabId',
			'left',
			'top',
			'width',
			'height',
			'focused',
			'incognito',
			'type',
			'setSelfAsOpener'
		];

		var whitelistTab = [
			'windowId',
			'index',
			'url',
			'active',
			'selected',
			'pinned',
			'openerTabId'
		];

		var filteredWindow = Object.keys(this.props.window.windowsInfo)
		  .filter(key => whitelistWindow.includes(key))
		  .reduce((obj, key) => {
		    obj[key] = this.props.window.windowsInfo[key];
		    return obj;
		  }, {});
		console.log("filtered window", filteredWindow);

		var newWindow = await browser.windows.create(filteredWindow).catch(function(error) {
			console.error(error);
			console.log(error);
			console.log(error.message);
		});
		console.log("new window", newWindow);
		for (var i = 0; i < this.props.window.tabs.length; i++) {
			var newTab = Object.keys(this.props.window.tabs[i])
			  .filter(key => whitelistTab.includes(key))
			  .reduce((obj, key) => {
			    obj[key] = this.props.window.tabs[i][key];
			    return obj;
			  }, {});
			console.log("source tab", newTab);
			newTab.windowId = newWindow.id;
			var tabCreated = await browser.tabs.create(newTab);
			console.log("end tab", tabCreated);
			if(i == 0) {
				await browser.tabs.remove(newWindow.tabs[0].id);
			}
		}

		if(customName) {
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
	},
	close: async function close(e) {
		e.stopPropagation();
		var value = await browser.storage.local.remove(this.props.window.id);
		console.log(value);
		this.props.parentUpdate();
		// browser.windows.remove(this.props.window.windowsInfo.id);
	},
	maximize: function maximize(e) {
		e.stopPropagation();
		// browser.windows.update(this.props.window.windowsInfo.id, {
		// 	"state": "normal" },
		// function (a) {this.props.parentUpdate();}.bind(this));
	}
 }));

