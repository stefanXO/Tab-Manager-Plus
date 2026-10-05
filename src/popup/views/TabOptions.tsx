"use strict";

import * as React from "react";
import * as browser from 'webextension-polyfill';
import { ICommand, ITabOptions, ITabOptionsState } from "@types";
import {ManagerContext, ITabManagerActions, ISettings} from "../context";
import {getLocalStorage, setLocalStorage} from "@helpers/storage";
import {currentShowMonitors, saveSetting, Settings} from "@helpers/settings";
import {switchShowMonitors} from "@helpers/monitors";
import {sizePopup} from "@helpers/popup_size";
import {getShortcuts} from "@helpers/shortcuts";
import {applyTheme, Theme} from "@helpers/theme";
import * as S from "@strings";
import {ActionOption, ChoiceOption, NumberOption, OptionsBox, SwitchOption} from "./options";
import {Description} from "./options/shared";

// Firefox cannot open about:addons (nor chrome:// pages) from an extension.
// Its shortcut settings open through commands.openShortcutSettings() (Firefox
// 137+); without it the options screen shows the steps instead of a link.
const CAN_OPEN_SHORTCUTS = IS_FIREFOX && typeof browser.commands?.openShortcutSettings === "function";

// Each option's help text, shown in the header's second line while the
// pointer is anywhere over the option or its control has focus.
const HELP = {
	tabLimit: "Limit the number of tabs per window. Will move new tabs into a new window instead. 0 to turn off",
	tabWidth: "Change the width of this window. 800 by default.",
	tabHeight: "Change the height of this window. 600 by default.",
	theme: "Light or dark colours, or follow your system's setting. Default : system",
	compact: "Compact mode is a more compressed layout. Default : off",
	animations: "Enables/disables animations. Default : on",
	windowTitles: "Enables/disables window titles. Default : on",
	sessions: "Allows you to save/restore windows into sessions. ( Tab History will be lost ) Default : off",
	exportSessions: "Allows you to export your saved windows to an external backup",
	importSessions: "Allows you to restore your saved windows from an external backup",
	badge: "Shows the number of open tabs on the Tab Manager icon. Default : on",
	openInOwnTab: "Open the Tab Manager by default in own tab, or as a popup?",
	hide: "Automatically minimizes inactive browser windows. Default : off",
	monitors: "Lets the window card's map show every monitor, not just the one this popup is on. Default : off",
	popupSize: "The size of the popup, at most 800x600 (a browser limit). Default : 800x600",
	incognito: IS_FIREFOX
		? "How to allow Tab Manager Plus in private windows, to see your private tabs too"
		: "Opens the browser's extension settings, where you can allow Tab Manager Plus in incognito windows",
	shortcuts: IS_FIREFOX && !CAN_OPEN_SHORTCUTS
		? "Lists the keys set now, and how to change or turn off the key that opens Tab Manager Plus"
		: "Lists the keys set now. The link opens the browser's shortcut settings, to change or turn off the key that opens Tab Manager Plus",
	changelog: "Opens the list of changes of every release in a new tab",
	tabActions: "Adds 'Open a new tab' and 'Close this window' option to each window. Default : on",
} as const;
type HelpKey = keyof typeof HELP;

// The settings the options screen changes through store(); the on/off ones
// through toggle().
type SwitchSetting = "animations" | "windowTitles" | "compact" | "tabactions" | "badge" | "openInOwnTab" | "sessionsFeature" | "hideWindows";
type OptionSetting = SwitchSetting | "theme" | "tabLimit" | "tabWidth" | "tabHeight";

const THEME_CHOICES : readonly { value : Theme, label : string }[] = [
	{ value: "system", label: "System" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" }
];

export class TabOptions extends React.Component<ITabOptions, ITabOptionsState> {
	static contextType = ManagerContext;
	declare context : ITabManagerActions;

	constructor(props : ITabOptions) {
		super(props);
		this.state = {};

	}
	async componentDidMount() {
		// the keys change in the browser's shortcut settings: read them again
		// when the user comes back from there
		window.addEventListener("focus", this.loadShortcuts);
		this.loadShortcuts();
		// Firefox has no link to its private windows setting, so show where it stands
		if (IS_FIREFOX) {
			const incognitoAllowed = await browser.extension.isAllowedIncognitoAccess().catch(() => undefined);
			this.setState({ incognitoAllowed });
		} else {
			// "Show all monitors": a setting of its own next to the system.display
			// permission (which "Minimize inactive windows" can grant as well)
			browser.permissions.onAdded?.addListener(this.checkMonitorAccess);
			browser.permissions.onRemoved?.addListener(this.checkMonitorAccess);
			await this.checkMonitorAccess();
		}
	}
	componentWillUnmount() {
		window.removeEventListener("focus", this.loadShortcuts);
		if (!IS_FIREFOX) {
			browser.permissions.onAdded?.removeListener(this.checkMonitorAccess);
			browser.permissions.onRemoved?.removeListener(this.checkMonitorAccess);
		}
	}
	// Reads the setting + permission, applying the unset -> on rule. Only the
	// latest call sets the state: a permission event racing a click must not
	// show what was stored before the click's own save.
	private monitorCheck = 0;
	checkMonitorAccess = async () => {
		const run = ++this.monitorCheck;
		const { setting, enabled } = await currentShowMonitors();
		if (run !== this.monitorCheck) return;
		if (enabled !== this.state.monitorAccess || setting !== this.state.showMonitors) this.setState({ monitorAccess: enabled, showMonitors: setting });
	}
	loadShortcuts = async () => {
		const shortcuts = await getShortcuts();
		this.setState({ shortcuts });
	}
	// Each command with its current key, or "Not set"
	shortcutList() {
		const shortcuts = this.state.shortcuts;
		if (!shortcuts?.length) return null;
		return (
			<ul className="shortcut-list">
				{shortcuts.map((s) => (
					<li key={s.name}>
						<span className="shortcut-label">{s.label}</span>
						{s.shortcut ? <kbd>{s.shortcut}</kbd> : <span className="shortcut-unset">Not set</span>}
					</li>
				))}
			</ul>
		);
	}
	// The help text for a whole option section. TabManager's delegated
	// mouseover reads data-hover from the closest element that has one (a
	// leading newline = no header title, the text on the second line), so the
	// text holds for every element inside the section; without it every
	// mouseover on the section's children cleared the header. Focus inside the
	// section shows the same text for keyboard users.
	help(key : HelpKey) {
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
		const p = this.props;
		return (
			<div className="toggle-options" key="options">
				<OptionsBox title="Tab options">
					<NumberOption
						id="enable_tabLimit"
						help={this.help("tabLimit")}
						label="Limit Tabs Per Window"
						value={p.tabLimit}
						onChange={this.changeTabLimit}
						min="0"
						description="Once you reach this number of tabs, Tab Manager will move new tabs to a new window instead. No more windows with 60 tabs open!"
						notes={["By default: 0 ( disabled )", "Suggested value: 15"]}
					/>
				</OptionsBox>
				<OptionsBox title="Popup size" help={this.help("popupSize")}>
					<div className="option-description">
						You can resize the popup here up to a maximum size of 800x600. This limitation is a browser limitation, and we cannot display a bigger popup due to
						this. If you want to have a better overview, instead you can right click on the Tab Manager Plus icon, and `open in own tab`. This will open the Tab
						Manager in a new tab.
					</div>
					<NumberOption
						id="enable_tabWidth"
						help={this.help("tabWidth")}
						label="Popup Width"
						value={p.tabWidth}
						onChange={this.changeTabWidth}
						min="450" max="800" step="25"
						className="half-size float-right"
						labelFirst
					/>
					<NumberOption
						id="enable_tabHeight"
						help={this.help("tabHeight")}
						label="Popup Height"
						value={p.tabHeight}
						onChange={this.changeTabHeight}
						min="400" max="600" step="25"
						className="half-size"
						labelFirst
					/>
				</OptionsBox>
				<OptionsBox title="Window style">
					<ChoiceOption
						id="theme_mode"
						help={this.help("theme")}
						label="Theme"
						value={p.theme}
						choices={THEME_CHOICES}
						onChange={this.changeTheme}
						description="Light or dark colours. System follows the dark mode of your operating system (or browser), and switches along with it. "
						notes={["By default: system"]}
					/>
					<SwitchOption
						id="compact_mode"
						help={this.help("compact")}
						label="Compact mode"
						checked={p.compact}
						onChange={() => this.toggle("compact", "compact")}
						description="Saves a little bit of space around the icons. Makes it less beautiful, but more space efficient. "
						notes={["By default: disabled"]}
					/>
					<SwitchOption
						id="enable_animations"
						help={this.help("animations")}
						label="Animations"
						checked={p.animations}
						onChange={() => this.toggle("animations", "animations")}
						description="Disables/enables animations and transitions in the popup. "
						notes={["By default: enabled"]}
					/>
					<SwitchOption
						id="enable_windowTitles"
						help={this.help("windowTitles")}
						label="Window titles"
						checked={p.windowTitles}
						onChange={() => this.toggle("windowTitles", "windowTitles")}
						description="Disables/enables window titles. "
						notes={["By default: enabled"]}
					/>
				</OptionsBox>
				<OptionsBox title="Session Management">
					<SwitchOption
						id="session_mode"
						help={this.help("sessions")}
						label="Save Windows for Later"
						checked={p.sessionsFeature}
						onChange={this.toggleSessions}
						description="Allows you to save windows as sessions ( saved windows ). You can restore these saved windows later on. The restored windows won't have the history restored. This feature is currently in beta."
						notes={["By default: disabled ( experimental feature )"]}
					/>
					{p.sessionsFeature && <ActionOption
						id="session_export"
						help={this.help("exportSessions")}
						label="Export/Backup Sessions"
						description="Allows you to backup your saved windows to an external file."
					>
						<button type="button" onClick={this.exportSessions} id="session_export" name="session_export">
							Export/Backup Sessions
						</button>
					</ActionOption>}
					{p.sessionsFeature && <ActionOption
						id="session_import"
						help={this.help("importSessions")}
						label="Import/Restore Sessions"
						description="Allows you to restore your backup from an external file. The restored windows will be added to your current saved windows."
					>
						<input
							type="file"
							accept="application/json"
							onChange={this.importSessions}
							id="session_import"
							name="session_import"
							placeholder="Import/Restore Sessions"
						/>
					</ActionOption>}
				</OptionsBox>
				<OptionsBox title="Popup icon">
					<SwitchOption
						id="badge_mode"
						help={this.help("badge")}
						label="Count Tabs"
						checked={p.badge}
						onChange={this.toggleBadge}
						description="Shows you the number of open tabs over the Tab Manager icon in the top right of your browser."
						notes={["By default: enabled"]}
					/>
					<SwitchOption
						id="openinowntab_mode"
						help={this.help("openInOwnTab")}
						label="Open in own Tab by default"
						checked={p.openInOwnTab}
						onChange={this.toggleOpenInOwnTab}
						description="Opens the Tab Manager in own tab by default, instead of the popup."
						notes={["By default: disabled"]}
					/>
				</OptionsBox>
				<OptionsBox title="Window settings">
					{/* Firefox has no system.display: it keeps one window active on all monitors together */}
					<SwitchOption
						id="auto_hide"
						help={this.help("hide")}
						label="Minimize inactive windows"
						checked={p.hideWindows}
						onChange={this.toggleHide}
						description={"With this option enabled, you will only have 1 open window per monitor at all times. When you switch to another window, the other windows will be minimized to the tray automatically."
							+ (IS_FIREFOX ? " Firefox: every other window, on every monitor." : "")}
						notes={["By default: disabled"]}
					/>
					{!IS_FIREFOX && (
						<SwitchOption
							id="monitors_mode"
							help={this.help("monitors")}
							label="Show all monitors"
							checked={!!this.state.monitorAccess}
							onChange={this.toggleMonitors}
							description="The window card (hover a window) draws a map of your monitors and where the window is. With this on it knows all of them; it asks the browser for permission to read your display layout, the same one Minimize inactive windows uses."
							notes={["By default: disabled"]}
						/>
					)}
					<SwitchOption
						id="tabactions_mode"
						help={this.help("tabActions")}
						label="Show action buttons"
						checked={p.tabactions}
						onChange={() => this.toggle("tabactions", "tabActions")}
						description="Displays buttons in every window for : opening a new tab, minimizing the window, assigning a color to the window and closing the window."
						notes={["By default: enabled"]}
					/>
				</OptionsBox>
				<OptionsBox title="Advanced settings">
					{IS_FIREFOX ? (
						<div className="toggle-box" {...this.help("incognito")}>
							<div className="toggle-box">
								<strong>Allow in Private Windows</strong>
							</div>
							<Description
								text={
									"If you also want to see your private tabs in the Tab Manager overview, then allow this extension in private windows: " +
									"open about:addons, click Tab Manager Plus, and on its Details tab set 'Run in Private Windows' to Allow."
								}
								notes={this.state.incognitoAllowed === undefined ? [] : ["Currently: " + (this.state.incognitoAllowed ? "allowed" : "not allowed")]}
							/>
						</div>
					) : (
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
					)}
					{IS_FIREFOX && !CAN_OPEN_SHORTCUTS ? (
						<div className="toggle-box" {...this.help("shortcuts")}>
							<strong>Change shortcut key</strong>
							{this.shortcutList()}
							<div className="option-description">
								If you want to disable or change the shortcut key with which to open Tab Manager Plus, you can do so in the add-ons settings: open about:addons,
								click the settings cog, and then 'Manage Extension Shortcuts'.
							</div>
						</div>
					) : (
						<div className="toggle-box" {...this.help("shortcuts")}>
							<a href="#" onClick={this.openShortcuts}>
								Change shortcut key
							</a>
							{this.shortcutList()}
							<div className="option-description">If you want to disable or change the shortcut key with which to open Tab Manager Plus, you can do so here.</div>
						</div>
					)}
					<div className="toggle-box" {...this.help("changelog")}>
						<a href="changelog.html" target="_blank" rel="noopener">
							What's new in this version
						</a>
						<div className="option-description">The changes of every release, and where to leave a review or report a problem.</div>
					</div>
				</OptionsBox>
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
	// Chrome only: Firefox shows the steps instead (it cannot open about:addons)
	async openIncognitoOptions() {
		await browser.tabs.create({
			url: "chrome://extensions/?id=" + browser.runtime.id
		});
	}
	async openShortcuts() {
		if (CAN_OPEN_SHORTCUTS) {
			await browser.commands.openShortcutSettings();
		} else {
			await browser.tabs.create({ url: "chrome://extensions/shortcuts" });
		}
	}
	licenses() {
		return (
			<div className="licenses" key="licenses">
				<div className="license">
					Tab Manager Plus is based on {link("https://github.com/dsc/Tab-Manager", "dsc/Tab-Manager")},{" "}
					{link("https://github.com/joshperry/Tab-Manager", "joshperry/Tab-Manager")} and{" "}
					{link("https://github.com/JonasNo/Tab-Manager", "JonasNo/Tab-Manager")}.
					Licensed under {link("https://www.mozilla.org/MPL/2.0/", "MPL 2.0")}.<br />
					Icons made by {link("https://www.freepik.com", "Freepik")} from {link("https://www.flaticon.com", "www.flaticon.com")},
					licensed under {link("https://creativecommons.org/licenses/by/3.0/", "CC BY 3.0")}.
					Uses {link("https://react.dev", "React")} and {link("https://github.com/necolas/normalize.css", "normalize.css")} (MIT)
					and {link("https://github.com/mozilla/webextension-polyfill", "webextension-polyfill")} (MPL 2.0).
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

	showHelp(key : HelpKey) {
		this.context.setBottomText(HELP[key]);
	}
	// Puts a setting into the popup's state and into storage.
	async store<K extends OptionSetting>(key : K, value : ISettings[K] & Settings[K]) {
		this.context.setSetting(key, value);
		await saveSetting(key, value);
	}
	// Flips an on/off setting and shows the option's help text; resolves to
	// the new value, for the options with a side effect.
	toggle = async (key : SwitchSetting, help : HelpKey) : Promise<boolean> => {
		const value = !this.props[key];
		await this.store(key, value);
		this.showHelp(help);
		return value;
	}

	changeTabLimit = async (e : React.ChangeEvent<HTMLInputElement>) => {
		await this.store("tabLimit", parseInt(e.target.value));
		this.showHelp("tabLimit");
	}
	changeTabWidth = async (e : React.ChangeEvent<HTMLInputElement>) => {
		var _tab_width = parseInt(e.target.value);
		await this.store("tabWidth", _tab_width);
		if (window.inPopup) sizePopup(_tab_width, this.props.tabHeight);
		this.showHelp("tabWidth");
	}
	changeTabHeight = async (e : React.ChangeEvent<HTMLInputElement>) => {
		var _tab_height = parseInt(e.target.value);
		await this.store("tabHeight", _tab_height);
		if (window.inPopup) sizePopup(this.props.tabWidth, _tab_height);
		this.showHelp("tabHeight");
	}
	changeTheme = async (theme : Theme) => {
		applyTheme(theme);
		await this.store("theme", theme);
		this.showHelp("theme");
	}
	toggleBadge = async () => {
		await this.toggle("badge", "badge");
		browser.runtime.sendMessage<ICommand>({command: S.update_tab_count});
	}
	toggleOpenInOwnTab = async () => {
		await this.toggle("openInOwnTab", "openInOwnTab");
		browser.runtime.sendMessage<ICommand>({ command: S.reload_popup_controls });
	}
	toggleSessions = async () => {
		var _sessionsFeature = !this.props.sessionsFeature;
		await this.store("sessionsFeature", _sessionsFeature);
		// the help text only once the sync is done
		if (_sessionsFeature) await this.context.sessionSync();
		this.showHelp("sessions");
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

		this.showHelp("exportSessions");
		this.context.reload();
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
		this.showHelp("importSessions");
		this.context.reload();
	}
	// Chrome only. On: asks for the system.display permission from this click
	// (when missing); denied leaves the setting and the switch off. Off: the
	// setting "off", which a later grant never undoes. The permission is never
	// given back here: "Minimize inactive windows" may need it.
	toggleMonitors = async () => {
		const turnOn = !this.state.monitorAccess;
		this.monitorCheck++;
		const granted = turnOn
			? await chrome.permissions.request({ permissions: ["system.display"] }).catch(() => false)
			: false;
		const setting = switchShowMonitors(this.state.showMonitors || "unset", turnOn, granted);
		await saveSetting("showMonitors", setting);
		await this.checkMonitorAccess();
		this.showHelp("monitors");
	}
	// Chrome needs the system.display permission (one window per monitor);
	// Firefox needs none (one window in all), a plain toggle
	toggleHide = async () => {
		if (IS_FIREFOX) {
			await this.toggle("hideWindows", "hide");
			return;
		}

		var _hide_windows = this.props.hideWindows;
		var granted = await chrome.permissions.request({ permissions: ["system.display"] });
		if (granted) {
			_hide_windows = !_hide_windows;
		} else {
			_hide_windows = false;
		}

		await saveSetting("hideWindows", _hide_windows);
		this.context.setSetting("hideWindows", _hide_windows);
		this.showHelp("hide");
	}

}