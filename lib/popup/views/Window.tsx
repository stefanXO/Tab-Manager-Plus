"use strict";

import {getLocalStorage, setLocalStorage, getLocalStorageMap} from "@helpers/storage";
import {Tab} from "@views";
import * as S from "@strings";
import * as React from "react";
import * as browser from 'webextension-polyfill';
import {ICommand, IWindow, IWindowState, ISavedSession} from '@types';

export class Window extends React.Component<IWindow, IWindowState> {
	constructor(props : IWindow) {
		super(props);

		this.state = {
			colorActive: false,
			windowTitles: [],
			color: "default",
			name: "",
			auto_name: "",
			tabs: 0,
			hover: false,
			dirty: false
		};

		this.addTab = this.addTab.bind(this);
		this.changeColors = this.changeColors.bind(this);
		this.changeName = this.changeName.bind(this);
		this.checkKey = this.checkKey.bind(this);
		this.closePopup = this.closePopup.bind(this);
		this.close = this.close.bind(this);
		this.colors = this.colors.bind(this);
		this.dragOver = this.dragOver.bind(this);
		this.dragLeave = this.dragLeave.bind(this);
		this.drop = this.drop.bind(this);
		this.maximize = this.maximize.bind(this);
		this.minimize = this.minimize.bind(this);
		this.save = this.save.bind(this);
		this.stop = this.stop.bind(this);
		this.windowClick = this.windowClick.bind(this);
		this.selectToFromTab = this.selectToFromTab.bind(this);
		this.hoverWindow = this.hoverWindow.bind(this);
		this.hoverWindowOut = this.hoverWindowOut.bind(this);
		this.checkSettings = this.checkSettings.bind(this);
	}

	async componentDidMount() {
		await this.checkSettings();
		await this.update();
	}

	async componentDidUpdate(prevProps, prevState) {
		if (this.state.dirty) {
			await this.update();
			this.setState({ dirty: false });
		}
	}


	async checkSettings() {
		let colors = await getLocalStorageMap<number, string>(S.windowColors);
		let color = colors.get(this.props.window.id) || "default";

		this.setState({
			color: color
		});
	}

	async update() {
		let name : string;
		if (!!this.props.window.title) {
			name = this.props.window.title;
		} else {
			let names : Map<number, string> = await getLocalStorageMap<number, string>(S.windowNames);
			name = names.get(this.props.window.id) || "";
		}

		if (!!name) {
			if (name !== this.state.name) {
				this.setState({
					name: name
				});
			}
			return;
		}

		let _window_titles = this.state.windowTitles;
		let _tabs = this.state.tabs;
		let tabs = await browser.tabs.query({ windowId: this.props.window.id });
		if (tabs.length == 0) return;

		if (_window_titles.length === 0 || this.state.tabs !== tabs.length + this.props.window.id * 99) {
			_window_titles.length = 0;
			_tabs = tabs.length + this.props.window.id * 99;

			for (let i = 0; i < tabs.length; i++) {
				const _tab = tabs[i];
				if (!!_tab && (!!_tab.url || !!_tab.pendingUrl)) {
					let url : URL;
					if (!!_tab.pendingUrl) {
						url = new URL(_tab.pendingUrl);
					} else if (!!_tab.url) {
						url = new URL(_tab.url);
					}

					// force refresh once we've loaded tabs
					if (_tab.status == "loading") _tabs--;

					let protocol = url.protocol || "";
					let hostname = url.hostname || "";
					if (protocol.indexOf("view-source") > -1 && !!url.pathname) {
						url = new URL(url.pathname);
						hostname = url.hostname || "source";
					} else if (protocol.indexOf("chrome-extension") > -1) {
						hostname = _tab.title || "extension";
					} else if (protocol.indexOf("about") > -1) {
						hostname = _tab.title || "about";
					} else if (hostname.indexOf("mail.google") > -1) {
						hostname = "gmail";
					} else {
						if (!hostname) hostname = "";
						hostname = hostname.replace("www.", "");
						if (!isIpAddress(hostname)) {
							let regex_var = new RegExp(/(\.[^\.]{0,2})(\.[^\.]{0,2})(\.*$)|(\.[^\.]*)(\.*$)/);
							hostname = hostname
								.replace(regex_var, "")
								.split(".")
								.pop();
						} else {
							if (!!_tab.title) {
								hostname = _tab.title;
							} else {
								let ip = hostname.split(".");
								hostname = ip[0] + "." + ip[1] + ".*.*";
							}
						}
					}

					if (!hostname || hostname.length > 7) {
						let title = _tab.title || "";

						const separators = /\s[—|•-]\s/; // Define separators here

						do {
							let titles = title.split(separators);
							let first = titles[0];
							let last = titles[titles.length - 1];
							if (slugify(first) == slugify(hostname) || slugify_no_space(first) == slugify_no_space(hostname) || slugify_no_space(first).startsWith(slugify_no_space(hostname).substring(0, 3)) || slugify_no_space(hostname).startsWith(slugify_no_space(first).substring(0, 3))) {
								title = first;
							} else if (slugify(last) == slugify(hostname) || slugify_no_space(last) == slugify_no_space(hostname) || slugify_no_space(last).startsWith(slugify_no_space(hostname).substring(0, 3)) || slugify_no_space(hostname).startsWith(slugify_no_space(last).substring(0, 3))) {
								title = last;
							} else {
								titles.sort((a : string, b : string) => a.length - b.length);
								titles.pop();
								title = titles.join("-");
							}
						} while (title.length > hostname.length && separators.test(title))

						if (!hostname || (!!title && title.length < 23)) {
							hostname = title;
						}

						// while (hostname.length > 21 && hostname.indexOf(" ") > -1) {
						// 	let hostnames = hostname.split(" ");
						// 	hostnames.pop();
						// 	hostname = hostnames.join(" ");
						// }

					}

					_window_titles.push(hostname);
				}
			}

			this.setState({
				tabs: _tabs
			})
		}

		if (_window_titles.length > 0) {
			name = this.topEntries(this.state.windowTitles).join("");
			this.setState({
				auto_name: name
			});
		}
	}

	render() {
		let _this = this;

		let color = this.state.color || "default";

		let hideWindow = true;
		let titleAdded = false;
		let tabsperrow = this.props.layout.indexOf("blocks") > -1 ? Math.ceil(Math.sqrt(this.props.tabs.length + 2)) : this.props.layout === "vertical" ? 1 : 15;
		let tabs = this.props.tabs.map(function(tab) {
			let isHidden : boolean = _this.props.hiddenTabs.has(tab.id) && _this.props.filterTabs;
			let isSelected : boolean = _this.props.selection.has(tab.id);
			if (!isHidden) hideWindow = false;
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
					draggable={true}
					drag={_this.props.drag}
					drop={_this.props.drop}
					dropWindow={_this.props.dropWindow}
					dragFavicon={_this.props.dragFavicon}
					parentUpdate={_this.forceUpdate.bind(_this)}
					ref={"tab" + tab.id}
					id={"tab-" + tab.id}
				/>
			);
		});
		if (!hideWindow) {
			if (!!this.props.tabactions) {
				tabs.push(
					<div key={"windownl_" + _this.props.window.id} className="newliner" />,
					<div key={"windowactions_" + this.props.window.id} className="window-actions">
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
						) : false}
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
						{this.props.window.state === "minimized" ? (
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
					<div key={"windowcolors_" + _this.props.window.id} className={"window-colors " + (this.state.colorActive ? "" : "hidden")} onClick={this.stop} onKeyDown={this.checkKey}>
						<h2 className="window-x" onClick={this.closePopup}>
							x
						</h2>
						<h3 className="center">Name the window</h3>
						<input
							className="window-name-input"
							type="text"
							onChange={this.changeName}
							value={this.state.name}
							placeholder={this.state.auto_name ?? "Name window..."}
							tabIndex={1}
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
				titleAdded = true;
				tabs.unshift(
					<h3
						key={"window-" + this.props.window.id + "-windowTitle"}
						className="editName center windowTitle"
						onClick={this.colors}
						title="Change the name of this window"
						onMouseEnter={this.props.hoverIcon}
					>
						{this.props.window.incognito ? "🕵" : ""}
						{!!this.state.name ? this.state.name : this.state.auto_name}
					</h3>
				);
			}

			if (tabsperrow < 5) {
				tabsperrow = 5;
			}
			let children = [];
			if (!!titleAdded) {
				children.push(tabs.shift());
			}
			let z = -1;
			for (let j = 0; j < tabs.length; j++) {
				let tab = tabs[j].props.tab;
				let isHidden = !!tab && !!tab.id && this.props.hiddenTabs.has(tab.id) && this.props.filterTabs;
				if(isHidden) continue;
				z++;
				children.push(tabs[j]);

				if ((z + 1) % tabsperrow === 0 && z && this.props.layout.indexOf("blocks") > -1) {
					children.push(<div className="newliner" key={"windownlz_" + _this.props.window.id + "_" + z} />);
				}
			}
			let focused = false;
			if (this.props.window.focused || this.props.lastOpenWindow === this.props.window.id) {
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
					onDragEnter={this.dragOver}
					onDragOver={this.dragOver}
					onDragLeave={this.dragLeave}
					onClick={this.windowClick}
					title={""}
					onMouseEnter={this.hoverWindow.bind(null, tabs)}
					onMouseLeave={this.hoverWindowOut}
					onDrop={this.drop}
				>
					<div key={"windowcontainer_" + this.props.window.id} className="windowcontainer" title={"Focus this window\nWill select this window with " + tabs.length + " tabs"}>{children}</div>
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
		this.setState({hover: true});
		this.stopProp(e);
	}
	dragLeave(e) {
		this.setState({hover: false});
		e.nativeEvent.preventDefault();
	}
	drop(e) {
		let distance = 1000000;
		let closestTab = null;
		let closestRef = null;

		for (let i = 0; i < this.props.tabs.length; i++) {
			let tab = this.props.tabs[i];
			let tabRef = (this.refs["tab" + tab.id] as Tab).state.tabRef.current;
			let tabRect = tabRef.getBoundingClientRect();
			let x = e.nativeEvent.clientX;
			let y = e.nativeEvent.clientY;
			let dx = tabRect.x - x;
			let dy = tabRect.y - y;
			let d = Math.sqrt(dx * dx + dy * dy);
			if (d < distance) {
				distance = d;
				closestTab = tab.id;
				closestRef = tabRef;
			}
		}

		this.stopProp(e);

		if (closestTab != null) {
			let before : boolean;
			let boundingRect = closestRef.getBoundingClientRect();
			if (this.props.layout === "vertical") {
				before = e.nativeEvent.clientY < boundingRect.top;
			} else {
				before = e.nativeEvent.clientX < boundingRect.left;
			}
			this.props.drop(closestTab, before);
		} else {
			this.props.dropWindow(this.props.window.id);
		}
	}
	hoverWindow(tabs, _) {
		this.setState({ hover: true });
		this.props.hoverIcon("Focus this window\nWill select this window with " + tabs.length + " tabs");
		// this.props.hoverIcon(e);
	}
	hoverWindowOut(_) {
		this.setState({ hover: false });
	}
	async checkKey(e) {
		// close popup when enter or escape have been pressed
		if (e.keyCode === 13 || e.keyCode === 27) {
			this.stopProp(e);
			await this.closePopup();
		}
	}
	async windowClick(e) {
		this.stopProp(e);

		let windowId = this.props.window.id;

		if (navigator.userAgent.search("Firefox") > -1) {
			browser.runtime.sendMessage<ICommand>({command: S.focus_on_window_delayed, window_id: windowId});
		} else {
			browser.runtime.sendMessage<ICommand>({command: S.focus_on_window, window_id: windowId});
		}

		this.props.parentUpdate();
		if (!!window.inPopup) window.close();
		return false;
	}
	selectToFromTab(tabId : number) {
		if (!!tabId) this.props.selectTo(tabId, this.props.tabs);
	}
	async close(e) {
		this.stopProp(e);
		await browser.windows.remove(this.props.window.id);
	}
	uuidv4() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
			let r = (Math.random() * 16) | 0,
				v = c === "x" ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}
	async save(e) {
		this.stopProp(e);

		console.log("session name", this.state.name);
		let sessionName = this.state.name || this.topEntries(this.state.windowTitles).join("");
		let sessionColor = this.state.color || "default";

		console.log("session name", sessionName);

		let session : ISavedSession = {
			tabs: [],
			windowsInfo: null,
			name: sessionName,
			customName: !!this.state.name,
			color: sessionColor,
			date: Date.now(),
			sessionStartTime: Date.now(),
			incognito: this.props.window.incognito,
			id: this.uuidv4()
		};

		let queryInfo : browser.Tabs.QueryQueryInfoType = {
			windowId: this.props.window.id
		};
		//queryInfo.currentWindow = true;

		console.log(queryInfo);

		let tabs : browser.Tabs.Tab[] = await browser.tabs.query(queryInfo);
		console.log(tabs);
		for (let tabkey in tabs) {
			if (navigator.userAgent.search("Firefox") > -1) {
				let newTab = tabs[tabkey];
				if (!!newTab.url && newTab.url.search("about:") > -1) {
					continue;
				}
			}
			session.tabs.push(tabs[tabkey]);
		}
		console.log(session.tabs);
		session.windowsInfo = await browser.windows.get(this.props.window.id);

		console.log(session);

		let sessions = await getLocalStorage('sessions', {});
		sessions[session.id] = session;

		let value = await setLocalStorage('sessions', sessions).catch(function(err) {
			console.log(err);
			console.error(err.message);
		});
		this.props.parentUpdate();
		console.log("Value is set to " + value);

		setTimeout(function() {
			this.props.scrollTo("session", session.id);
		}.bind(this), 150);
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
		}.bind(this), 150);
	}
	async changeColors(a) {
		this.setState(a);
		this.props.toggleColors(!this.state.colorActive, this.props.window.id);

		let color = a.color || "default";

		browser.runtime.sendMessage<ICommand>({
			command: S.set_window_color,
			window_id: this.props.window.id,
			color: color
		});

		this.setState({ color: color });
		await this.closePopup();
	}
	async closePopup() {
		this.props.toggleColors(!this.state.colorActive, this.props.window.id);
		this.setState({
			colorActive: !this.state.colorActive
		});
		await this.update();
		this.props.parentUpdate();
	}
	async changeName(e) {
		// this.setState(a);
		let name = "";
		if(e && e.target && e.target.value) name = e.target.value;

		browser.runtime.sendMessage<ICommand>({
			command: S.set_window_name,
			window_id: this.props.window.id,
			name: name
		});

		this.setState({
			name: name
		});
		if (navigator.userAgent.search("Firefox") > -1) {
			if(!!name) {
				await browser.windows.update(this.props.window.id, {
					titlePreface: name + " - "
				});
			}else{
				await browser.windows.update(this.props.window.id, {
					titlePreface: name
				});
			}
		}
	}
	topEntries(arr : string[]) : string[] {
		let cnts = arr.reduce(function(obj, val) {
			obj[val] = (obj[val] || 0) + 1;
			return obj;
		}, {});
		let sorted = Object.keys(cnts).sort(function(a, b) {
			return cnts[b] - cnts[a];
		});

		let more = 0;
		if (sorted.length === 3) {
		} else {
			while (sorted.length > 2) {
				sorted.pop();
				more++;
			}
		}
		for (let i = 0; i < sorted.length; i++) {
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

function slugify(text) {
	return text
		.toString()
		.toLowerCase()
		.replace(/\s+/g, "-") // Replace spaces with -
		.replace(/[^\w-]+/g, "") // Remove all non-word chars
		.replace(/--+/g, "-") // Replace multiple - with single -
		.replace(/^-+/, "") // Trim - from start of text
		.replace(/-+$/, ""); // Trim - from end of text
}

function slugify_no_space(text) {
	return text
		.toString()
		.toLowerCase()
		.replace(/\s+/g, "") // Replace spaces with -
		.replace(/[^\w-]+/g, "") // Remove all non-word chars
		.replace(/--+/g, "-") // Replace multiple - with single -
		.replace(/^-+/, "") // Trim - from start of text
		.replace(/-+$/, ""); // Trim - from end of text
}

// Function to check if the string is an IP address (IPv4 or IPv6)
function isIpAddress(input) {
	// Regex for IPv4: 0-255.0-255.0-255.0-255
	const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

	// Regex for IPv6: Matches standard IPv6 formatting (8 groups of 4 hex digits)
	const ipv6Regex = /^([a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/;

	return ipv4Regex.test(input) || ipv6Regex.test(input);
}