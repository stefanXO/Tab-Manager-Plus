"use strict";

import * as React from "react";
import * as browser from 'webextension-polyfill';
import { ICommand, ITabOptions, ITabOptionsState } from "@types";
import {ManagerContext, ITabManagerActions} from "../context";
import {getLocalStorage, setLocalStorage} from "@helpers/storage";
import {getSetting, saveSetting} from "@helpers/settings";
import {sizePopup} from "@helpers/popup_size";
import {applyTheme} from "@helpers/theme";
import * as S from "@strings";


// Each option's help text, shown in the header's second line while the
// pointer is anywhere over the option or its control has focus.
const HELP = {
	tabLimit: "Limit the number of tabs per window. Will move new tabs into a new window instead. 0 to turn off",
	tabWidth: "Change the width of this window. 800 by default.",
	tabHeight: "Change the height of this window. 600 by default.",
	dark: "Dark mode inverts the layout - better on the eyes. Default : off",
	compact: "Compact mode is a more compressed layout. Default : off",
	animations: "Enables/disables animations. Default : on",
	windowTitles: "Enables/disables window titles. Default : on",
	sessions: "Allows you to save/restore windows into sessions. ( Tab History will be lost ) Default : off",
	exportSessions: "Allows you to export your saved windows to an external backup",
	importSessions: "Allows you to restore your saved windows from an external backup",
	badge: "Shows the number of open tabs on the Tab Manager icon. Default : on",
	openInOwnTab: "Open the Tab Manager by default in own tab, or as a popup?",
	hide: "Automatically minimizes inactive chrome windows. Default : off",
	popupSize: "The size of the popup, at most 800x600 (a browser limit). Default : 800x600",
	incognito: "Opens the browser's extension settings, where you can allow Tab Manager Plus in incognito windows",
	shortcuts: "Opens the browser's shortcut settings, to change or turn off the key that opens Tab Manager Plus",
	changelog: "Opens the list of changes of every release in a new tab",
	tabActions: "Adds 'Open a new tab' and 'Close this window' option to each window. Default : on",
} as const;

export class TabOptions extends React.Component<ITabOptions, ITabOptionsState> {
	static contextType = ManagerContext;
	declare context : ITabManagerActions;

	constructor(props : ITabOptions) {
		super(props);
		this.state = {};

	}
	// The help text for a whole option section. TabManager's delegated
	// mouseover reads data-hover from the closest element that has one (a
	// leading newline = no header title, the text on the second line), so the
	// text holds for every element inside the section; without it every
	// mouseover on the section's children cleared the header. Focus inside the
	// section shows the same text for keyboard users.
	help(key : keyof typeof HELP) {
		return {
			"data-hover": "\n" + HELP[key],
			"data-hover-hold": "",
			onFocus: () => this.context.setBottomText(HELP[key])
		};
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
					<div className="toggle-box" {...this.help("tabLimit")}>
						<input
							type="number"
							onChange={this.changeTabLimit}
							value={this.props.tabLimit}
							id="enable_tabLimit"
							name="enable_tabLimit"
							min={"0"}
						/>
						<label htmlFor="enable_tabLimit" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
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
				<div className="optionsBox" {...this.help("popupSize")}>
					<h4>Popup size</h4>
					<div className="option-description">
						You can resize the popup here up to a maximum size of 800x600. This limitation is a browser limitation, and we cannot display a bigger popup due to
						this. If you want to have a better overview, instead you can right click on the Tab Manager Plus icon, and `open in own tab`. This will open the Tab
						Manager in a new tab.
					</div>
					<div className="toggle-box half-size float-right" {...this.help("tabWidth")}>
						<label className="textlabel" htmlFor="enable_tabWidth" style={{ textAlign: "left", whiteSpace: "pre", lineHeight: "2rem" }}>
							Popup Width
						</label>
						<input
							type="number"
							min="450"
							max="800"
							step="25"
							onChange={this.changeTabWidth}
							value={this.props.tabWidth}
							id="enable_tabWidth"
							name="enable_tabWidth"
						/>
						<label htmlFor="enable_tabWidth" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
					</div>
					<div className="toggle-box half-size" {...this.help("tabHeight")}>
						<label className="textlabel" htmlFor="enable_tabHeight" style={{ textAlign: "left", whiteSpace: "pre", lineHeight: "2rem" }}>
							Popup Height
						</label>
						<input
							type="number"
							min="400"
							max="600"
							step="25"
							onChange={this.changeTabHeight}
							value={this.props.tabHeight}
							id="enable_tabHeight"
							name="enable_tabHeight"
						/>
						<label htmlFor="enable_tabHeight" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
					</div>
				</div>
				<div className="optionsBox">
					<h4>Window style</h4>
					<div className="toggle-box" {...this.help("dark")}>
						<div className="toggle">
							<input
								type="checkbox"
								onChange={this.toggleDark}
								checked={this.props.dark}
								id="dark_mode"
								name="dark_mode"
							/>
							<label htmlFor="dark_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<label className="textlabel" htmlFor="dark_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
							Dark mode
						</label>
						<div className="option-description">
							Dark mode, for working at night time. <br />
							<i>By default: disabled</i>
						</div>
					</div>
					<div className="toggle-box" {...this.help("compact")}>
						<div className="toggle">
							<input
								type="checkbox"
								onChange={this.toggleCompact}
								checked={this.props.compact}
								id="compact_mode"
								name="compact_mode"
							/>
							<label htmlFor="compact_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<label className="textlabel" htmlFor="compact_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
							Compact mode
						</label>
						<div className="option-description">
							Saves a little bit of space around the icons. Makes it less beautiful, but more space efficient. <br />
							<i>By default: disabled</i>
						</div>
					</div>
					<div className="toggle-box" {...this.help("animations")}>
						<div className="toggle">
							<input
								type="checkbox"
								onChange={this.toggleAnimations}
								checked={this.props.animations}
								id="enable_animations"
								name="enable_animations"
							/>
							<label htmlFor="enable_animations" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<label className="textlabel" htmlFor="enable_animations" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
							Animations
						</label>
						<div className="option-description">
							Disables/enables animations and transitions in the popup. <br />
							<i>By default: enabled</i>
						</div>
					</div>
					<div className="toggle-box" {...this.help("windowTitles")}>
						<div className="toggle">
							<input
								type="checkbox"
								onChange={this.toggleWindowTitles}
								checked={this.props.windowTitles}
								id="enable_windowTitles"
								name="enable_windowTitles"
							/>
							<label htmlFor="enable_windowTitles" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
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
					<div className="toggle-box" {...this.help("sessions")}>
						<div className="toggle">
							<input
								type="checkbox"
								onChange={this.toggleSessions}
								checked={this.props.sessionsFeature}
								id="session_mode"
								name="session_mode"
							/>
							<label htmlFor="session_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
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
					{this.props.sessionsFeature && <div className="toggle-box" {...this.help("exportSessions")}>
						<div className="toggle-box">
							<label className="textlabel" htmlFor="session_export" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
								<h4>Export/Backup Sessions</h4>
							</label>
							<button type="button" onClick={this.exportSessions} id="session_export" name="session_export">
								Export/Backup Sessions
							</button>
							<label htmlFor="session_export" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<div className="option-description">Allows you to backup your saved windows to an external file.</div>
					</div>}
					{this.props.sessionsFeature && <div className="toggle-box" {...this.help("importSessions")}>
						<div className="toggle-box">
							<label className="textlabel" htmlFor="session_import" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
								<h4>Import/Restore Sessions</h4>
							</label>
							<input
								type="file"
								accept="application/json"
								onChange={this.importSessions}
								id="session_import"
								name="session_import"
								placeholder="Import/Restore Sessions"
							/>
							<label htmlFor="session_import" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
						</div>
						<div className="option-description">
							Allows you to restore your backup from an external file. The restored windows will be added to your current saved windows.
						</div>
					</div>}
				</div>
				<div className="optionsBox">
					<h4>Popup icon</h4>
					<div className="toggle-box" {...this.help("badge")}>
						<div className="toggle">
							<input
								type="checkbox"
								onChange={this.toggleBadge}
								checked={this.props.badge}
								id="badge_mode"
								name="badge_mode"
							/>
							<label htmlFor="badge_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
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
					<div className="toggle-box" {...this.help("openInOwnTab")}>
						<div className="toggle">
							<input
								type="checkbox"
								onChange={this.toggleOpenInOwnTab}
								checked={this.props.openInOwnTab}
								id="openinowntab_mode"
								name="openinowntab_mode"
							/>
							<label htmlFor="openinowntab_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
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
					<div className="toggle-box" {...this.help("hide")}>
						<div className="toggle">
							<input
								type="checkbox"
								onChange={this.toggleHide}
								checked={this.props.hideWindows}
								id="auto_hide"
								name="auto_hide"
							/>
							<label htmlFor="auto_hide" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
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
					<div className="toggle-box" {...this.help("tabActions")}>
						<div className="toggle">
							<input
								type="checkbox"
								onChange={this.toggleTabActions}
								checked={this.props.tabactions}
								id="tabactions_mode"
								name="tabactions_mode"
							/>
							<label htmlFor="tabactions_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
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
					<div className="toggle-box" {...this.help("incognito")}>
						<div className="toggle-box">
							<a href="#" onClick={this.openIncognitoOptions}>
								Allow in Incognito
							</a>
						</div>
						<div className="option-description">
							If you also want to see your incognito tabs in the Tab Manager overview, then enable incognito access for this extension.
						</div>
					</div>
					<div className="toggle-box" {...this.help("shortcuts")}>
						<a href="#" onClick={this.openShortcuts}>
							Change shortcut key
						</a>
						<div className="option-description">If you want to disable or change the shortcut key with which to open Tab Manager Plus, you can do so here.</div>
					</div>
					<div className="toggle-box" {...this.help("changelog")}>
						<a href="changelog.html" target="_blank" rel="noopener">
							What's new in this version
						</a>
						<div className="option-description">The changes of every release, and where to leave a review or report a problem.</div>
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
		this.context.setBottomText(HELP.tabLimit);
	}
	changeTabWidth = async (e : React.ChangeEvent<HTMLInputElement>) => {
		var _tab_width = parseInt(e.target.value);
		this.context.setSetting("tabWidth", _tab_width);
		await saveSetting("tabWidth", _tab_width);
		if (window.inPopup) sizePopup(_tab_width, this.props.tabHeight);
		this.tabWidthText();
	}
	tabWidthText = () => {
		this.context.setBottomText(HELP.tabWidth);
	}
	changeTabHeight = async (e : React.ChangeEvent<HTMLInputElement>) => {
		var _tab_height = parseInt(e.target.value);
		this.context.setSetting("tabHeight", _tab_height);
		await saveSetting("tabHeight", _tab_height);
		if (window.inPopup) sizePopup(this.props.tabWidth, _tab_height);
		this.tabHeightText();
	}
	tabHeightText = () => {
		this.context.setBottomText(HELP.tabHeight);
	}
	toggleAnimations = async () => {
		var _animations = !this.props.animations;
		this.context.setSetting("animations", _animations);
		await saveSetting("animations", _animations);
		this.animationsText();
	}
	animationsText = () => {
		this.context.setBottomText(HELP.animations);
	}
	toggleWindowTitles = async () => {
		var _window_titles = !this.props.windowTitles;
		this.context.setSetting("windowTitles", _window_titles);
		await saveSetting("windowTitles", _window_titles);
		this.windowTitlesText();
	}
	windowTitlesText = () => {
		this.context.setBottomText(HELP.windowTitles);
	}
	toggleCompact = async () => {
		var _compact = !this.props.compact;
		this.context.setSetting("compact", _compact);
		await saveSetting("compact", _compact);
		this.compactText();
	}
	compactText = () => {
		this.context.setBottomText(HELP.compact);
	}
	toggleDark = async () => {
		var _dark = !this.props.dark;
		this.context.setSetting("dark", _dark);
		await saveSetting("dark", _dark);

		this.darkText();
		applyTheme(_dark);
	}
	darkText = () => {
		this.context.setBottomText(HELP.dark);
	}
	toggleTabActions = async () => {
		var _tabactions = !this.props.tabactions;
		this.context.setSetting("tabactions", _tabactions);
		await saveSetting("tabactions", _tabactions);
		this.tabActionsText();
	}
	tabActionsText = () => {
		this.context.setBottomText(HELP.tabActions);
	}
	toggleBadge = async () => {
		var _badge = !this.props.badge;
		this.context.setSetting("badge", _badge);
		await saveSetting("badge", _badge);
		this.badgeText();
		browser.runtime.sendMessage<ICommand>({command: S.update_tab_count});
	}
	badgeText = () => {
		this.context.setBottomText(HELP.badge);
	}
	toggleOpenInOwnTab = async () => {
		var _openInOwnTab = !this.props.openInOwnTab;
		this.context.setSetting("openInOwnTab", _openInOwnTab);
		await saveSetting("openInOwnTab", _openInOwnTab);
		this.openInOwnTabText();
		browser.runtime.sendMessage<ICommand>({ command: S.reload_popup_controls });
	}
	openInOwnTabText = () => {
		this.context.setBottomText(HELP.openInOwnTab);
	}
	toggleSessions = async () => {
		var _sessionsFeature = !this.props.sessionsFeature;
		this.context.setSetting("sessionsFeature", _sessionsFeature);
		await saveSetting("sessionsFeature", _sessionsFeature);
		if (_sessionsFeature) await this.context.sessionSync();
		this.sessionsText();
	}
	sessionsText = () => {
		this.context.setBottomText(HELP.sessions);
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
		this.context.setBottomText(HELP.exportSessions);
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
		this.context.setBottomText(HELP.importSessions);
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
		this.context.setBottomText(HELP.hide);
	}

}