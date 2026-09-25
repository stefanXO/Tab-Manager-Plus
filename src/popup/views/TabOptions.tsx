"use strict";

import * as React from "react";
import * as browser from 'webextension-polyfill';
import { ICommand, ITabOptions, ITabOptionsState } from "@types";
import {ManagerContext, ITabManagerActions} from "../context";
import {getLocalStorage, setLocalStorage} from "@helpers/storage";
import {getSetting, saveSetting} from "@helpers/settings";
import * as S from "@strings";
import {IS_FIREFOX} from "@helpers/browser";


export class TabOptions extends React.Component<ITabOptions, ITabOptionsState> {
	static contextType = ManagerContext;
	declare context : ITabManagerActions;

	constructor(props : ITabOptions) {
		super(props);
		this.state = {};

	}
	logo() {
		return (
			<div className="logo-options" key="logo">
				<div className="logo-box">
					<img src="images/browsers.svg" style={{maxWidth: "3rem"}} alt="Tab Manager Plus"/>
					<h2 key="title">Tab Manager Plus {window.extensionVersion}</h2>
				</div>
			</div>
		);
	}

	optionsSection() {
		return (
			<div className="toggle-options" key="options">
				<div className="optionsBox">
					<h4>Tab options</h4>
					<div className="toggle-box">
						<input
							type="number"
							onMouseEnter={this.tabLimitText}
							onChange={this.changeTabLimit}
							value={this.props.tabLimit}
							id="enable_tabLimit"
							name="enable_tabLimit"
							min={"0"}
						/>
						<label onMouseEnter={this.tabLimitText} htmlFor="enable_tabLimit" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						<label className="textlabel" htmlFor="enable_tabLimit" style={{ textAlign: "left", whiteSpace: "pre", lineHeight: "2rem" }}>
							Limit Tabs Per Window
						</label>
						<div className="option-description">
							Once you reach this number of tabs, Tab Manager will move new tabs to a new window instead. No more windows with 60 tabs open!
							<br />
							<i>By default: 0 ( disabled )</i>
							<br />
							<i>Suggested value: 15</i>
						</div>
					</div>
				</div>
				<div className="optionsBox">
					<h4>Popup size</h4>
					<div className="option-description">
						You can resize the popup here up to a maximum size of 800x600. This limitation is a browser limitation, and we cannot display a bigger popup due to
						this. If you want to have a better overview, instead you can right click on the Tab Manager Plus icon, and `open in own tab`. This will open the Tab
						Manager in a new tab.
					</div>
					<div className="toggle-box half-size float-right">
						<label className="textlabel" htmlFor="enable_tabWidth" style={{ textAlign: "left", whiteSpace: "pre", lineHeight: "2rem" }}>
							Popup Width
						</label>
						<input
							type="number"
							min="450"
							max="800"
							step="25"
							onMouseEnter={this.tabWidthText}
							onChange={this.changeTabWidth}
							value={this.props.tabWidth}
							id="enable_tabWidth"
							name="enable_tabWidth"
						/>
						<label onMouseEnter={this.tabWidthText} htmlFor="enable_tabWidth" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
					</div>
					<div className="toggle-box half-size">
						<label className="textlabel" htmlFor="enable_tabHeight" style={{ textAlign: "left", whiteSpace: "pre", lineHeight: "2rem" }}>
							Popup Height
						</label>
						<input
							type="number"
							min="400"
							max="600"
							step="25"
							onMouseEnter={this.tabHeightText}
							onChange={this.changeTabHeight}
							value={this.props.tabHeight}
							id="enable_tabHeight"
							name="enable_tabHeight"
						/>
						<label onMouseEnter={this.tabHeightText} htmlFor="enable_tabHeight" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
					</div>
				</div>
				<div className="optionsBox">
					<h4>Window style</h4>
					<div className="toggle-box">
						<div className="toggle">
							<input
								type="checkbox"
								onMouseEnter={this.darkText}
								onChange={this.toggleDark}
								checked={this.props.dark}
								id="dark_mode"
								name="dark_mode"
							/>
							<label onMouseEnter={this.darkText} htmlFor="dark_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<label className="textlabel" htmlFor="dark_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
							Dark mode
						</label>
						<div className="option-description">
							Dark mode, for working at night time. <br />
							<i>By default: disabled</i>
						</div>
					</div>
					<div className="toggle-box">
						<div className="toggle">
							<input
								type="checkbox"
								onMouseEnter={this.compactText}
								onChange={this.toggleCompact}
								checked={this.props.compact}
								id="compact_mode"
								name="compact_mode"
							/>
							<label onMouseEnter={this.compactText} htmlFor="compact_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<label className="textlabel" htmlFor="compact_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
							Compact mode
						</label>
						<div className="option-description">
							Saves a little bit of space around the icons. Makes it less beautiful, but more space efficient. <br />
							<i>By default: disabled</i>
						</div>
					</div>
					<div className="toggle-box">
						<div className="toggle">
							<input
								type="checkbox"
								onMouseEnter={this.animationsText}
								onChange={this.toggleAnimations}
								checked={this.props.animations}
								id="enable_animations"
								name="enable_animations"
							/>
							<label onMouseEnter={this.animationsText} htmlFor="enable_animations" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<label className="textlabel" htmlFor="enable_animations" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
							Animations
						</label>
						<div className="option-description">
							Disables/enables animations and transitions in the popup. <br />
							<i>By default: enabled</i>
						</div>
					</div>
					<div className="toggle-box">
						<div className="toggle">
							<input
								type="checkbox"
								onMouseEnter={this.windowTitlesText}
								onChange={this.toggleWindowTitles}
								checked={this.props.windowTitles}
								id="enable_windowTitles"
								name="enable_windowTitles"
							/>
							<label onMouseEnter={this.windowTitlesText} htmlFor="enable_windowTitles" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<label className="textlabel" htmlFor="enable_windowTitles" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
							Window titles
						</label>
						<div className="option-description">
							Disables/enables window titles. <br />
							<i>By default: enabled</i>
						</div>
					</div>
				</div>
				<div className="optionsBox">
					<h4>Session Management</h4>
					<div className="toggle-box">
						<div className="toggle">
							<input
								type="checkbox"
								onMouseEnter={this.sessionsText}
								onChange={this.toggleSessions}
								checked={this.props.sessionsFeature}
								id="session_mode"
								name="session_mode"
							/>
							<label onMouseEnter={this.sessionsText} htmlFor="session_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<label className="textlabel" htmlFor="session_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
							Save Windows for Later
						</label>
						<div className="option-description">
							Allows you to save windows as sessions ( saved windows ). You can restore these saved windows later on. The restored windows won't have the history
							restored. This feature is currently in beta.
							<br />
							<i>By default: disabled ( experimental feature )</i>
						</div>
					</div>
					{this.props.sessionsFeature && <div className="toggle-box">
						<div className="toggle-box">
							<label className="textlabel" htmlFor="session_export" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
								<h4>Export/Backup Sessions</h4>
							</label>
							<button type="button" onMouseEnter={this.exportSessionsText} onClick={this.exportSessions} id="session_export" name="session_export">
								Export/Backup Sessions
							</button>
							<label onMouseEnter={this.exportSessionsText} htmlFor="session_export" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<div className="option-description">Allows you to backup your saved windows to an external file.</div>
					</div>}
					{this.props.sessionsFeature && <div className="toggle-box">
						<div className="toggle-box">
							<label className="textlabel" htmlFor="session_import" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
								<h4>Import/Restore Sessions</h4>
							</label>
							<input
								type="file"
								accept="application/json"
								onMouseEnter={this.importSessionsText}
								onChange={this.importSessions}
								id="session_import"
								name="session_import"
								placeholder="Import/Restore Sessions"
							/>
							<label onMouseEnter={this.importSessionsText} htmlFor="session_import" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<div className="option-description">
							Allows you to restore your backup from an external file. The restored windows will be added to your current saved windows.
						</div>
					</div>}
				</div>
				<div className="optionsBox">
					<h4>Popup icon</h4>
					<div className="toggle-box">
						<div className="toggle">
							<input
								type="checkbox"
								onMouseEnter={this.badgeText}
								onChange={this.toggleBadge}
								checked={this.props.badge}
								id="badge_mode"
								name="badge_mode"
							/>
							<label onMouseEnter={this.badgeText} htmlFor="badge_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<label className="textlabel" htmlFor="badge_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
							Count Tabs
						</label>
						<div className="option-description">
							Shows you the number of open tabs over the Tab Manager icon in the top right of your browser.
							<br />
							<i>By default: enabled</i>
						</div>
					</div>
					<div className="toggle-box">
						<div className="toggle">
							<input
								type="checkbox"
								onMouseEnter={this.openInOwnTabText}
								onChange={this.toggleOpenInOwnTab}
								checked={this.props.openInOwnTab}
								id="openinowntab_mode"
								name="openinowntab_mode"
							/>
							<label onMouseEnter={this.openInOwnTabText} htmlFor="openinowntab_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<label className="textlabel" htmlFor="openinowntab_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
							Open in own Tab by default
						</label>
						<div className="option-description">
							Opens the Tab Manager in own tab by default, instead of the popup.
							<br />
							<i>By default: disabled</i>
						</div>
					</div>
				</div>
				<div className="optionsBox">
					<h4>Window settings</h4>
					<div className="toggle-box">
						<div className="toggle">
							<input
								type="checkbox"
								onMouseEnter={this.hideText}
								onChange={this.toggleHide}
								checked={this.props.hideWindows}
								id="auto_hide"
								name="auto_hide"
							/>
							<label onMouseEnter={this.hideText} htmlFor="auto_hide" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<label className="textlabel" htmlFor="auto_hide" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
							Minimize inactive windows
						</label>
						<div className="option-description">
							With this option enabled, you will only have 1 open window per monitor at all times. When you switch to another window, the other windows will be
							minimized to the tray automatically.
							<br />
							<i>By default: disabled</i>
						</div>
					</div>
					<div className="toggle-box">
						<div className="toggle">
							<input
								type="checkbox"
								onMouseEnter={this.tabActionsText}
								onChange={this.toggleTabActions}
								checked={this.props.tabactions}
								id="tabactions_mode"
								name="tabactions_mode"
							/>
							<label onMouseEnter={this.tabActionsText} htmlFor="tabactions_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<label className="textlabel" htmlFor="tabactions_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
							Show action buttons
						</label>
						<div className="option-description">
							Displays buttons in every window for : opening a new tab, minimizing the window, assigning a color to the window and closing the window.
							<br />
							<i>By default: enabled</i>
						</div>
					</div>
				</div>
				<div className="optionsBox">
					<h4>Advanced settings</h4>
					<div className="toggle-box">
						<div className="toggle-box">
							<a href="#" onClick={this.openIncognitoOptions}>
								Allow in Incognito
							</a>
						</div>
						<div className="option-description">
							If you also want to see your incognito tabs in the Tab Manager overview, then enable incognito access for this extension.
						</div>
					</div>
					<div className="toggle-box">
						<a href="#" onClick={this.openShortcuts}>
							Change shortcut key
						</a>
						<div className="option-description">If you want to disable or change the shortcut key with which to open Tab Manager Plus, you can do so here.</div>
					</div>
				</div>
				<div className="optionsBox">
					<div className="toggle-box">
						<h4>Right mouse button</h4>
						<div className="option-description">With the right mouse button you can select tabs</div>
						<h4>Shift+Right mouse button</h4>
						<div className="option-description">
							While holding shift, and pressing the right mouse button you can select all tabs between the last selected tab and the current one
						</div>
						<h4>Middle mouse button</h4>
						<div className="option-description">With the middle mouse button you can close a tab</div>
						<h4>[Enter / Return] button</h4>
						<div className="option-description">
							With the return button you can switch to the currently selected tab, or move multiple selected tabs to a new window
						</div>
					</div>
				</div>
			</div>
		);
	}
	async openIncognitoOptions() {
		await browser.tabs.create({
			url: "chrome://extensions/?id=cnkdjjdmfiffagllbiiilooaoofcoeff"
		});
	}
	async openShortcuts() {
		await browser.tabs.create({ url: "chrome://extensions/shortcuts" });
	}
	licenses() {
		return (
			<div className="licenses" key="licenses">
				<div className="license">
					Tab Manager Plus is based on{" "}
					<a href="https://github.com/dsc/Tab-Manager" target="_blank" title="Tab-Manager">
						dsc/Tab-Manager
					</a>
					,{" "}
					<a href="https://github.com/joshperry/Tab-Manager" target="_blank" title="Tab-Manager">
						joshperry/Tab-Manager
					</a>{" "}
					and{" "}
					<a href="https://github.com/JonasNo/Tab-Manager" target="_blank" title="Tab-Manager">
						JonasNo/Tab-Manager
					</a>
					.<br />
					Licensed by{" "}
					<a href="http://creativecommons.org/licenses/by/3.0/" target="_blank" title=" Mozilla Public License (MPL)">
						MPLv2
					</a>
					. Icons made by{" "}
					<a href="http://www.freepik.com" title="Freepik">
						Freepik
					</a>{" "}
					from{" "}
					<a href="http://www.flaticon.com" title="Flaticon">
						www.flaticon.com
					</a>
					. Licensed by{" "}
					<a href="http://creativecommons.org/licenses/by/3.0/" target="_blank" title="Creative Commons BY 3.0">
						CC 3.0 BY
					</a>
					.
				</div>
			</div>
		);
	}
	render() {
		var children = [];

		children.push(this.logo());
		children.push(this.optionsSection());
		children.push(<div className="clearfix" key="clear_fix" />);
		//children.push(React.createElement('h4', {}, this.props.getTip()));
		children.push(this.licenses());

		return (
			<div className="options-window" key="options_window">
				<div key="options_content">{children}</div>
			</div>
		);
	}

	changeTabLimit = async (e : React.ChangeEvent<HTMLInputElement>) => {
		var _tab_limit = parseInt(e.target.value);
		this.context.setSetting("tabLimit", _tab_limit);
		await saveSetting("tabLimit", _tab_limit);
		this.tabLimitText();
	}
	tabLimitText = () => {
		this.context.setBottomText("Limit the number of tabs per window. Will move new tabs into a new window instead. 0 to turn off");
	}
	changeTabWidth = async (e : React.ChangeEvent<HTMLInputElement>) => {
		var _tab_width = parseInt(e.target.value);
		this.context.setSetting("tabWidth", _tab_width);
		await saveSetting("tabWidth", _tab_width);
		document.body.style.width = _tab_width + "px";
		this.tabWidthText();
	}
	tabWidthText = () => {
		this.context.setBottomText("Change the width of this window. 800 by default.");
	}
	changeTabHeight = async (e : React.ChangeEvent<HTMLInputElement>) => {
		var _tab_height = parseInt(e.target.value);
		this.context.setSetting("tabHeight", _tab_height);
		await saveSetting("tabHeight", _tab_height);
		document.body.style.height = _tab_height + "px";
		this.tabHeightText();
	}
	tabHeightText = () => {
		this.context.setBottomText("Change the height of this window. 600 by default.");
	}
	toggleAnimations = async () => {
		var _animations = !this.props.animations;
		this.context.setSetting("animations", _animations);
		await saveSetting("animations", _animations);
		this.animationsText();
	}
	animationsText = () => {
		this.context.setBottomText("Enables/disables animations. Default : on");
	}
	toggleWindowTitles = async () => {
		var _window_titles = !this.props.windowTitles;
		this.context.setSetting("windowTitles", _window_titles);
		await saveSetting("windowTitles", _window_titles);
		this.windowTitlesText();
	}
	windowTitlesText = () => {
		this.context.setBottomText("Enables/disables window titles. Default : on");
	}
	toggleCompact = async () => {
		var _compact = !this.props.compact;
		this.context.setSetting("compact", _compact);
		await saveSetting("compact", _compact);
		this.compactText();
	}
	compactText = () => {
		this.context.setBottomText("Compact mode is a more compressed layout. Default : off");
	}
	toggleDark = async () => {
		var _dark = !this.props.dark;
		this.context.setSetting("dark", _dark);
		await saveSetting("dark", _dark);

		this.darkText();
		if (_dark) {
			document.body.className = "dark";
			document.documentElement.className = "dark";
		} else {
			document.body.className = "";
			document.documentElement.className = "";
		}
	}
	darkText = () => {
		this.context.setBottomText("Dark mode inverts the layout - better on the eyes. Default : off");
	}
	toggleTabActions = async () => {
		var _tabactions = !this.props.tabactions;
		this.context.setSetting("tabactions", _tabactions);
		await saveSetting("tabactions", _tabactions);
		this.tabActionsText();
	}
	tabActionsText = () => {
		this.context.setBottomText("Adds 'Open a new tab' and 'Close this window' option to each window. Default : on");
	}
	toggleBadge = async () => {
		var _badge = !this.props.badge;
		this.context.setSetting("badge", _badge);
		await saveSetting("badge", _badge);
		this.badgeText();
		browser.runtime.sendMessage<ICommand>({command: S.update_tab_count});
	}
	badgeText = () => {
		this.context.setBottomText("Shows the number of open tabs on the Tab Manager icon. Default : on");
	}
	toggleOpenInOwnTab = async () => {
		var _openInOwnTab = !this.props.openInOwnTab;
		this.context.setSetting("openInOwnTab", _openInOwnTab);
		await saveSetting("openInOwnTab", _openInOwnTab);
		this.openInOwnTabText();
		browser.runtime.sendMessage<ICommand>({ command: S.reload_popup_controls });
	}
	openInOwnTabText = () => {
		this.context.setBottomText("Open the Tab Manager by default in own tab, or as a popup?");
	}
	toggleSessions = async () => {
		var _sessionsFeature = !this.props.sessionsFeature;
		this.context.setSetting("sessionsFeature", _sessionsFeature);
		await saveSetting("sessionsFeature", _sessionsFeature);
		if (_sessionsFeature) await this.context.sessionSync();
		this.sessionsText();
	}
	sessionsText = () => {
		this.context.setBottomText("Allows you to save/restore windows into sessions. ( Tab History will be lost ) Default : off");
	}
	exportSessions = () => {
		if (this.props.sessions.length === 0) {
			window.alert("You have currently no windows saved for later. There is nothing to export.");
			return;
		}
		let exportName = "tab-manager-plus-backup";
		let today = new Date();
		let y = today.getFullYear();
		// JavaScript months are 0-based.
		let m = ("0" + (today.getMonth() + 1)).slice(-2);
		let d = ("0" + today.getDate()).slice(-2);
		let h = ("0" + today.getHours()).slice(-2);
		let mi = ("0" + today.getMinutes()).slice(-2);
		let s = ("0" + today.getSeconds()).slice(-2);
		exportName += "-" + y + m + d + "-" + h + mi + "-" + s;

		const blob = new Blob([JSON.stringify(this.props.sessions, null, 2)], {type: "text/json"});
		var downloadAnchorNode = document.createElement("a");
		downloadAnchorNode.download = exportName + ".json";
		downloadAnchorNode.href = window.URL.createObjectURL(blob);
		downloadAnchorNode.dataset.downloadurl = ["text/json", downloadAnchorNode.download, downloadAnchorNode.href].join(":");

		const evt = new MouseEvent("click", {
			view: window,
			bubbles: true,
			cancelable: true,
		});

		document.body.appendChild(downloadAnchorNode); // required for firefox

		downloadAnchorNode.dispatchEvent(evt);
		downloadAnchorNode.remove();

		this.exportSessionsText();
		this.context.reload();
	}
	exportSessionsText = () => {
		this.context.setBottomText("Allows you to export your saved windows to an external backup");
	}
	importSessions = (evt : React.ChangeEvent<HTMLInputElement>) => {
		if (IS_FIREFOX) {
			if(window.inPopup) {
				window.alert("Due to a Firefox bug session import does not work in the popup. Please use the options screen or open Tab Manager Plus in its' own tab");
				return;
			}
		}
		try {
			let inputField = evt.target; // #session_import
			let files = evt.target.files;
			if (!files.length) {
				alert("No file selected!");
				this.context.setBottomText("Error: Could not read the backup file!");
				return;
			}
			let file = files[0];
			let reader = new FileReader();

			reader.onload = async event => {
				//console.log('FILE CONTENT', event.target.result);
				var backupFile;
				try {
					backupFile = JSON.parse(event.target.result.toString());
				} catch (err) {
					console.error(err);
					window.alert(err);
					this.context.setBottomText("Error: Could not read the backup file!");
				}
				if (!!backupFile && backupFile.length > 0) {
					var success = backupFile.length;
					for (let i = 0; i < backupFile.length; i++) {
						var newSession = backupFile[i];
						if (newSession.windowsInfo && newSession.tabs && newSession.id) {
							let sessions = await getLocalStorage(S.sessions, {});
							sessions[newSession.id] = newSession;
							//this.props.sessions.push(obj);

							await setLocalStorage(S.sessions, sessions).catch(function(err) {
								console.log(err);
								console.error(err.message);
								success--;
							});
							//console.log(value);
						}
					}
					this.context.setBottomText(success + " windows successfully restored!");
				} else {
					this.context.setBottomText("Error: Could not restore any windows from the backup file!");
				}
				inputField.value = "";
				await this.context.sessionSync();
			};
			reader.readAsText(file);
		} catch (err) {
			console.error(err);
			window.alert(err);
		}
		this.importSessionsText();
		this.context.reload();
	}
	importSessionsText = () => {
		this.context.setBottomText("Allows you to restore your saved windows from an external backup");
	}
	toggleHide = async () => {

		var _hide_windows = this.props.hideWindows;
		if (IS_FIREFOX) {
			_hide_windows = false;
		} else {
			var granted = await chrome.permissions.request({ permissions: ["system.display"] });
			if (granted) {
				_hide_windows = !_hide_windows;
			} else {
				_hide_windows = false;
			}
		}

		await saveSetting("hideWindows", _hide_windows);
		this.context.setSetting("hideWindows", _hide_windows);
		this.hideText();
	}
	hideText = () => {
		this.context.setBottomText("Automatically minimizes inactive chrome windows. Default : off");
	}

}