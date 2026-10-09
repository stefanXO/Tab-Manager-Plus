"use strict";

import * as React from "react";
import * as browser from 'webextension-polyfill';
import { ICommand, ISavedSession, ITabOptions, ITabOptionsState } from "@types";
import {ManagerContext, ITabManagerActions, ISettings} from "../context";
import {getLocalStorageMap} from "@helpers/storage";
import {currentShowMonitors, saveSetting, Settings, SETTING_DEFAULTS} from "@helpers/settings";
import {buildEverythingExport} from "../debugExport";
import {buildSessionsFile, everythingFileName, sessionsFileName, settingsFileName} from "../sessionsFile";
import {buildSettingsFile, planSettingsImport, settingsSummary, settingsWorked} from "../settingsFile";
import {importNoticeKind, importSummary, planImport} from "../importCount";
import {debugExportNote, sessionsExportNote, settingsExportNote} from "../exportNotes";
import {ERROR_MS} from "../notices";
import {switchShowMonitors} from "@helpers/monitors";
import {sizePopup, popupScreen} from "@helpers/popup_size";
import {restoreDisplays} from "../restoreDisplays";
import {getShortcuts} from "@helpers/shortcuts";
import {applyTheme, Theme} from "@helpers/theme";
import type {IconName} from "@icons/types";
import * as S from "@strings";
import {ActionOption, ChoiceOption, NumberOption, OptionsBox, OptionsRow, SwitchOption} from "./options";
import {Description, OptionIcon, OptionTitle} from "./options/shared";

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
	supportLinks: "Shows the Donate and Rate buttons at the top of the popup. Default : on",
	sessions: "Allows you to save/restore windows into sessions. ( Tab History will be lost ) Default : on",
	exportSessions: "Allows you to export your saved windows to an external sessions file",
	importSessions: "Allows you to restore your saved windows from an external sessions file",
	exportSettings: "Allows you to export your Tab Manager Plus settings to an external settings file. Saved windows, window names and colors are not part of it",
	importSettings: "Allows you to restore your settings from an external settings file. Ones that need a browser permission have to be turned on here first",
	badge: "Shows the number of open tabs on the Tab Manager icon. Default : on",
	openInOwnTab: "Open the Tab Manager by default in own tab, or as a popup?",
	hide: "Automatically minimizes inactive browser windows. Default : off",
	monitors: "Lets the window card's map show every monitor, not just the one this popup is on. Recommended : on",
	popupSize: "The size of the popup, at most 800x600 (a browser limit). Default : 800x600",
	incognito: IS_FIREFOX
		? "How to allow Tab Manager Plus in private windows, to see your private tabs too"
		: "Opens the browser's extension settings, where you can allow Tab Manager Plus in incognito windows",
	shortcuts: IS_FIREFOX && !CAN_OPEN_SHORTCUTS
		? "Lists the keys set now, and how to change or turn off the key that opens Tab Manager Plus"
		: "Lists the keys set now. The link opens the browser's shortcut settings, to change or turn off the key that opens Tab Manager Plus",
	changelog: "Opens the list of changes of every release in a new tab",
	documentation: "Opens a short guide with examples in a new tab: search, keys, windows and saved windows",
	debugExport: "Saves a JSON file with your windows and tabs (titles, urls, times) and the current settings, for reporting a bug or a bad automatic window name",
	tabActions: "Adds 'Open a new tab' and 'Close this window' option to each window. Default : on",
} as const;
type HelpKey = keyof typeof HELP;

// The settings the options screen changes through store(); the on/off ones
// through toggle().
type SwitchSetting = "animations" | "windowTitles" | "supportLinks" | "compact" | "tabactions" | "badge" | "openInOwnTab" | "sessionsFeature" | "hideWindows";
type OptionSetting = SwitchSetting | "theme" | "tabLimit" | "tabWidth" | "tabHeight";

// each choice's icon: the system theme, a sun, a moon (the last two are
// optional in an icon family: without them the choice is just its label)
const THEME_CHOICES : readonly { value : Theme, label : string, icon : IconName }[] = [
	{ value: "system", label: "System", icon: "theme" },
	{ value: "light", label: "Light", icon: "theme-light" },
	{ value: "dark", label: "Dark", icon: "theme-dark" }
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
		clearTimeout(this.debugCopiedTimer);
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
		const importBlocked = this.importBlocked();
		return (
			<div className="toggle-options" key="options">
				<OptionsBox title="Tab options">
					<NumberOption
						id="enable_tabLimit"
						help={this.help("tabLimit")}
						icon="tab-limit"
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
					<OptionsRow>
						<NumberOption
							id="enable_tabWidth"
							help={this.help("tabWidth")}
							icon="popup-width"
							label="Popup Width"
							value={p.tabWidth}
							onChange={this.changeTabWidth}
							min="450" max="800" step="25"
							labelFirst
						/>
						<NumberOption
							id="enable_tabHeight"
							help={this.help("tabHeight")}
							icon="popup-height"
							label="Popup Height"
							value={p.tabHeight}
							onChange={this.changeTabHeight}
							min="400" max="600" step="25"
							labelFirst
						/>
					</OptionsRow>
				</OptionsBox>
				<OptionsBox title="Window style">
					<ChoiceOption
						id="theme_mode"
						help={this.help("theme")}
						icon="theme"
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
						icon="compact"
						label="Compact mode"
						checked={p.compact}
						onChange={() => this.toggle("compact", "compact")}
						description="Saves a little bit of space around the icons. Makes it less beautiful, but more space efficient. "
						notes={["By default: disabled"]}
					/>
					<SwitchOption
						id="enable_animations"
						help={this.help("animations")}
						icon="animations"
						label="Animations"
						checked={p.animations}
						onChange={() => this.toggle("animations", "animations")}
						description="Disables/enables animations and transitions in the popup. "
						notes={["By default: enabled"]}
					/>
					<SwitchOption
						id="enable_windowTitles"
						help={this.help("windowTitles")}
						icon="window-titles"
						label="Window titles"
						checked={p.windowTitles}
						onChange={() => this.toggle("windowTitles", "windowTitles")}
						description="Disables/enables window titles. "
						notes={["By default: enabled"]}
					/>
					<SwitchOption
						id="enable_supportLinks"
						help={this.help("supportLinks")}
						icon="support-links"
						label="Donate and Rate buttons"
						checked={p.supportLinks}
						onChange={() => this.toggle("supportLinks", "supportLinks")}
						description="Shows the Donate and Rate buttons next to the options button at the top of the popup. "
						notes={["By default: enabled"]}
					/>
				</OptionsBox>
				<OptionsBox title="Session Management">
					<SwitchOption
						id="session_mode"
						help={this.help("sessions")}
						icon="sessions"
						label="Save Windows for Later"
						checked={p.sessionsFeature}
						onChange={this.toggleSessions}
						description="Allows you to save windows as sessions ( saved windows ). You can restore these saved windows later on. The restored windows won't have the history restored."
						notes={["By default: enabled"]}
					/>
					{p.sessionsFeature && <OptionsRow>
						<ActionOption
							id="session_export"
							help={this.help("exportSessions")}
							icon="export-sessions"
							label="Export Sessions"
							description="Allows you to save your saved windows to an external sessions file."
							notes={[sessionsExportNote(p.sessions)]}
						>
							<button type="button" onClick={this.exportSessions} id="session_export" name="session_export"
							        disabled={!p.sessions?.length}>
								Export Sessions
							</button>
						</ActionOption>
						<ActionOption
							id="session_import"
							help={this.help("importSessions")}
							icon="import-sessions"
							label="Import Sessions"
							description="Allows you to restore saved windows from a sessions file (or from a debug file, which holds them too). The restored windows will be added to your current saved windows."
							notes={[
								...(importBlocked ? ["Due to a Firefox bug session import does not work in the popup. Please use the options screen or open Tab Manager Plus in its own tab"] : []),
							]}
						>
							<input
								type="file"
								accept="application/json"
								onChange={this.importSessions}
								disabled={importBlocked}
								id="session_import"
								name="session_import"
								placeholder="Import/Restore Sessions"
							/>
						</ActionOption>
					</OptionsRow>}
				</OptionsBox>
				<OptionsBox title="Settings backup">
					<OptionsRow>
						<ActionOption
							id="settings_export"
							help={this.help("exportSettings")}
							icon="export-settings"
							label="Export Settings"
							description="Allows you to save your settings to an external settings file, to keep them or to use them in another browser."
							notes={[settingsExportNote(Object.keys(SETTING_DEFAULTS).length)]}
						>
							<button type="button" onClick={this.exportSettings} id="settings_export" name="settings_export">
								Export Settings
							</button>
						</ActionOption>
						<ActionOption
							id="settings_import"
							help={this.help("importSettings")}
							icon="import-settings"
							label="Import Settings"
							description="Allows you to restore your settings from a settings file (or from a debug file, which holds them too). Settings that are not valid are skipped. Those that need a browser permission (Minimize inactive windows, Show all monitors) are only taken while that permission is granted: turn them on here first."
							notes={[
								...(importBlocked ? ["Due to a Firefox bug settings import does not work in the popup. Please use the options screen or open Tab Manager Plus in its own tab"] : []),
							]}
						>
							<input
								type="file"
								accept="application/json"
								onChange={this.importSettings}
								disabled={importBlocked}
								id="settings_import"
								name="settings_import"
								placeholder="Import Settings"
							/>
						</ActionOption>
					</OptionsRow>
				</OptionsBox>
				<OptionsBox title="Popup icon">
					<SwitchOption
						id="badge_mode"
						help={this.help("badge")}
						icon="badge"
						label="Count Tabs"
						checked={p.badge}
						onChange={this.toggleBadge}
						description="Shows you the number of open tabs over the Tab Manager icon in the top right of your browser."
						notes={["By default: enabled"]}
					/>
					<SwitchOption
						id="openinowntab_mode"
						help={this.help("openInOwnTab")}
						icon="own-tab"
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
						icon="minimize-inactive"
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
							icon="monitors"
							label="Show all monitors"
							checked={!!this.state.monitorAccess}
							onChange={this.toggleMonitors}
							description="The window card (hover a window) draws a map of your monitors and where the window is. With this on it knows all of them; it asks the browser for permission to read your display layout, the same one Minimize inactive windows uses."
							notes={["Recommended: enabled", "Starts disabled: the browser only grants the permission when you turn it on"]}
						/>
					)}
					<SwitchOption
						id="tabactions_mode"
						help={this.help("tabActions")}
						icon="action-buttons"
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
								<OptionTitle icon="private-windows"><strong>Allow in Private Windows</strong></OptionTitle>
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
								<OptionTitle icon="private-windows">
									<a href="#" onClick={this.openIncognitoOptions}>
										Allow in Incognito
									</a>
								</OptionTitle>
							</div>
							<div className="option-description">
								If you also want to see your incognito tabs in the Tab Manager overview, then enable incognito access for this extension.
							</div>
						</div>
					)}
					{IS_FIREFOX && !CAN_OPEN_SHORTCUTS ? (
						<div className="toggle-box" {...this.help("shortcuts")}>
							<OptionTitle icon="shortcuts"><strong>Change shortcut key</strong></OptionTitle>
							{this.shortcutList()}
							<div className="option-description">
								If you want to disable or change the shortcut key with which to open Tab Manager Plus, you can do so in the add-ons settings: open about:addons,
								click the settings cog, and then 'Manage Extension Shortcuts'.
							</div>
						</div>
					) : (
						<div className="toggle-box" {...this.help("shortcuts")}>
							<OptionTitle icon="shortcuts">
								<a href="#" onClick={this.openShortcuts}>
									Change shortcut key
								</a>
							</OptionTitle>
							{this.shortcutList()}
							<div className="option-description">If you want to disable or change the shortcut key with which to open Tab Manager Plus, you can do so here.</div>
						</div>
					)}
					<div className="toggle-box" {...this.help("changelog")}>
						<OptionTitle icon="changelog">
							<a href="changelog.html" target="_blank" rel="noopener">
								What's new in this version
							</a>
						</OptionTitle>
						<div className="option-description">The changes of every release, and where to leave a review or report a problem.</div>
					</div>
					<div className="toggle-box" {...this.help("documentation")}>
						<OptionTitle icon="changelog">
							<a href="documentation.html" target="_blank" rel="noopener">
								Help: how to use Tab Manager Plus
							</a>
						</OptionTitle>
						<div className="option-description">A short guide with examples: searching, selecting, the keyboard, windows and saved windows.</div>
					</div>
				</OptionsBox>
				<OptionsBox title="Export tabs for debugging">
					<div className="toggle-box" {...this.help("debugExport")}>
						<div className="option-actions">
							<OptionIcon icon="debug-export" />
							<button type="button" id="debug_export" onClick={this.exportDebug}>Save debug file</button>
							<button type="button" id="debug_copy"
							        onClick={this.copyDebug}>{this.state.debugCopied ? "Copied" : "Copy to clipboard"}</button>
						</div>
						<Description
							text="Writes every open window and tab (title, url, last used, pinned, active), the automatic name Tab Manager Plus gave each window, your saved windows and your settings to a JSON file (tab-manager-plus-everything-date-time.json, which Import Sessions can also read). Nothing is sent anywhere. Attach it to a bug report when a window name or a search result looks wrong."
							notes={[debugExportNote(p.windowCount, p.tabCount)]}
						/>
					</div>
				</OptionsBox>
				<div className="optionsBox">
					<div className="toggle-box">
						<h4><OptionTitle icon="mouse-right">Right mouse button</OptionTitle></h4>
						<div className="option-description">With the right mouse button you can select tabs</div>
						<h4><OptionTitle icon="mouse-shift-right">Shift+Right mouse button</OptionTitle></h4>
						<div className="option-description">
							While holding shift, and pressing the right mouse button you can select all tabs between the last selected tab and the current one
						</div>
						<h4><OptionTitle icon="mouse-middle">Middle mouse button</OptionTitle></h4>
						<div className="option-description">With the middle mouse button you can close a tab</div>
						<h4><OptionTitle icon="key-enter">[Enter / Return] button</OptionTitle></h4>
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
	// Credits for the code and images the extension ships; changelog.html
	// carries a static copy of the same text
	licenses() {
		const link = (href : string, text : string) => <a href={href} target="_blank" rel="noopener">{text}</a>;
		return (
			<div className="licenses" key="licenses">
				<div className="license">
					Tab Manager Plus is based on {link("https://github.com/dsc/Tab-Manager", "dsc/Tab-Manager")},{" "}
					{link("https://github.com/joshperry/Tab-Manager", "joshperry/Tab-Manager")} and{" "}
					{link("https://github.com/JonasNo/Tab-Manager", "JonasNo/Tab-Manager")}.
					Licensed under {link("https://www.mozilla.org/MPL/2.0/", "MPL 2.0")}.<br />
					Extension icon made by {link("https://www.freepik.com", "Freepik")} from {link("https://www.flaticon.com", "www.flaticon.com")},
					licensed under {link("https://creativecommons.org/licenses/by/3.0/", "CC BY 3.0")}.
					Font {link("https://fonts.google.com/noto/specimen/Noto+Sans", "Noto Sans")} by Google ({link("https://openfontlicense.org", "SIL OFL 1.1")}).
					Uses {link("https://react.dev", "React")} and {link("https://github.com/necolas/normalize.css", "normalize.css")} (MIT)
					and {link("https://github.com/mozilla/webextension-polyfill", "webextension-polyfill")} (MPL 2.0)
					and the {link("https://publicsuffix.org", "Public Suffix List")} (MPL 2.0).
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

	// the number fields hand over real numbers only (options/NumberOption.tsx)
	changeTabLimit = async (value : number) => {
		await this.store("tabLimit", value);
		this.showHelp("tabLimit");
	}
	changeTabWidth = async (value : number) => {
		await this.store("tabWidth", value);
		if (window.inPopup) sizePopup(value, this.props.tabHeight);
		this.showHelp("tabWidth");
	}
	changeTabHeight = async (value : number) => {
		await this.store("tabHeight", value);
		if (window.inPopup) sizePopup(this.props.tabWidth, value);
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
	// the debug export as text, read fresh from the browser
	private debugJson = async () : Promise<{ json : string, date : Date }> => {
		const [windows, names, stored] = await Promise.all([
			browser.windows.getAll({ populate: true }),
			getLocalStorageMap<number, string>(S.windowNames),
			browser.storage.local.get(Object.keys(SETTING_DEFAULTS))
		]);
		const date = new Date();
		const data = buildEverythingExport(windows, { ...SETTING_DEFAULTS, ...stored }, {
			extension: browser.runtime.getManifest().version,
			browser: navigator.userAgent,
			exported: date,
			names
		}, this.props.sessions || []);
		data.restore = await this.restoreDiagnostic();
		return { json: JSON.stringify(data, null, 2), date };
	}
	// the worker's view of a restore: its monitors, the permission, the plan
	// for each saved window and the last restores (helpers/restoreDiagnostic.ts)
	private restoreDiagnostic = async () : Promise<unknown> => {
		try {
			const answer = await browser.runtime.sendMessage<ICommand, unknown>({
				command: S.restore_diagnostic,
				screen: popupScreen(),
				displays: await restoreDisplays()
			});
			return answer ?? { error: "the worker did not answer" };
		} catch (e) {
			return { error: String(e instanceof Error ? e.message : e) };
		}
	}
	exportDebug = async () => {
		try {
			const { json, date } = await this.debugJson();
			const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
			const a = document.createElement("a");
			a.href = url;
			a.download = everythingFileName(date);
			document.body.appendChild(a); // required for firefox
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch (e) {
			this.context.showError("The debug file could not be saved: " + (e instanceof Error ? e.message : e));
		}
	}
	private debugCopiedTimer? : ReturnType<typeof setTimeout>;
	copyDebug = async () => {
		try {
			const { json } = await this.debugJson();
			try {
				await navigator.clipboard.writeText(json);
			} catch (e) {
				const area = document.createElement("textarea");
				area.value = json;
				area.setAttribute("readonly", "");
				area.style.position = "fixed";
				area.style.opacity = "0";
				document.body.appendChild(area);
				area.select();
				const ok = document.execCommand("copy");
				area.remove();
				if (!ok) throw e;
			}
			this.setState({ debugCopied: true });
			clearTimeout(this.debugCopiedTimer);
			this.debugCopiedTimer = setTimeout(() => this.setState({ debugCopied: false }), 1500);
		} catch (e) {
			this.context.showError("Could not copy to the clipboard: " + (e instanceof Error ? e.message : e));
		}
	}
	exportSessions = () => {
		// the button is disabled then (and the note says why): nothing to do
		if (!this.props.sessions?.length) return;
		const blob = new Blob([JSON.stringify(buildSessionsFile(this.props.sessions), null, 2)], {type: "text/json"});
		var downloadAnchorNode = document.createElement("a");
		downloadAnchorNode.download = sessionsFileName(new Date());
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
	// Firefox: the file picker does not work in the popup (a browser bug)
	private importBlocked = () => IS_FIREFOX && !!window.inPopup;
	importSessions = (evt : React.ChangeEvent<HTMLInputElement>) => {
		// the file picker is disabled then, with the reason as its note
		if (this.importBlocked()) return;
		// the notices of whatever came before go, and a delete still counting
		// down is written first: the import adds to what is stored after it
		this.context.closeNotices();
		try {
			let inputField = evt.target; // #session_import
			let files = evt.target.files;
			if (!files.length) {
				this.context.showError("No file selected!");
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
					this.context.showError("Could not read the sessions file: " + (err instanceof Error ? err.message : err));
					inputField.value = "";
					return;
				}
				const plan = planImport<ISavedSession>(backupFile);
				// One write through the manager, after any other change to the
				// saved windows; listed first, with new order numbers and their
				// tab indexes fixed (../sessionStore.ts); the ones with the same
				// tabs as a saved window already there are left out. Refused:
				// none is stored.
				let failed = 0;
				let already = 0;
				try {
					already = await this.context.importSavedWindows(plan.valid);
				} catch (err) {
					console.error(err);
					failed = plan.valid.length;
				}
				const summary = importSummary(plan, failed, already);
				// something restored, or all of it already there, or a foreign file
				// that gave nothing: a note; nothing restored, or the browser
				// refused some: an error
				if (importNoticeKind(plan, failed, already) === "info") this.context.showInfo(summary);
				else this.context.showError(summary);
				inputField.value = "";
			};
			reader.readAsText(file);
		} catch (err) {
			console.error(err);
			this.context.showError("Could not import the sessions file: " + (err instanceof Error ? err.message : err));
		}
		this.showHelp("importSessions");
		this.context.reload();
	}
	// Saves text as a JSON download, the way the session export does
	private downloadJson(json : string, fileName : string) {
		const blob = new Blob([json], {type: "text/json"});
		const anchor = document.createElement("a");
		anchor.download = fileName;
		anchor.href = window.URL.createObjectURL(blob);
		anchor.dataset.downloadurl = ["text/json", anchor.download, anchor.href].join(":");
		document.body.appendChild(anchor); // required for firefox
		anchor.dispatchEvent(new MouseEvent("click", { view: window, bubbles: true, cancelable: true }));
		anchor.remove();
		const url = anchor.href;
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
	exportSettings = async () => {
		try {
			const stored = await browser.storage.local.get(Object.keys(SETTING_DEFAULTS));
			const date = new Date();
			const file = buildSettingsFile({ ...SETTING_DEFAULTS, ...stored }, SETTING_DEFAULTS, {
				extension: browser.runtime.getManifest().version,
				exported: date
			});
			this.downloadJson(JSON.stringify(file, null, 2), settingsFileName(date));
		} catch (e) {
			this.context.showError("The settings file could not be saved: " + (e instanceof Error ? e.message : e));
		}
		this.showHelp("exportSettings");
	}
	importSettings = (evt : React.ChangeEvent<HTMLInputElement>) => {
		// the file picker is disabled then, with the reason as its note
		if (this.importBlocked()) return;
		this.context.closeNotices();
		const inputField = evt.target; // #settings_import
		const file = inputField.files?.[0];
		if (!file) {
			this.context.showError("No file selected!");
			return;
		}
		const reader = new FileReader();
		reader.onerror = () => {
			this.context.showError("Could not read the settings file");
			inputField.value = "";
		};
		reader.onload = async event => {
			let parsed : unknown;
			try {
				parsed = JSON.parse(event.target.result.toString());
			} catch (err) {
				console.error(err);
				this.context.showError("Could not read the settings file: " + (err instanceof Error ? err.message : err));
				inputField.value = "";
				return;
			}
			try {
				const summary = await this.applySettingsFile(parsed);
				if (summary.worked) this.context.showInfo(summary.text, ERROR_MS);
				else this.context.showError(summary.text);
			} catch (err) {
				console.error(err);
				this.context.showError("Could not import the settings file: " + (err instanceof Error ? err.message : err));
			}
			inputField.value = "";
		};
		reader.readAsText(file);
		this.showHelp("importSettings");
	}
	// Writes the valid settings of a parsed file to storage and says what it did.
	// The popup follows storage (TabManager.onStorageChanged: theme, size, layout,
	// switches), so this screen shows the new values at once. A setting that needs
	// system.display is only taken when the browser has granted it already: a file
	// picker is no click on the setting's own switch, which is the only place the
	// browser lets the permission be asked for (see settingsFile.ts).
	private async applySettingsFile(parsed : unknown) : Promise<{ text : string, worked : boolean }> {
		const [stored, systemDisplay] = await Promise.all([
			browser.storage.local.get(Object.keys(SETTING_DEFAULTS)),
			IS_FIREFOX ? false : browser.permissions.contains({ permissions: ["system.display"] }).catch(() => false)
		]);
		const plan = planSettingsImport(parsed, { defaults: SETTING_DEFAULTS, current: { ...SETTING_DEFAULTS, ...stored }, firefox: IS_FIREFOX, systemDisplay });
		if (Object.keys(plan.values).length) {
			await browser.storage.local.set(plan.values);
			// what the worker only learns by being told
			if ("badge" in plan.values) browser.runtime.sendMessage<ICommand>({ command: S.update_tab_count });
			if ("openInOwnTab" in plan.values) browser.runtime.sendMessage<ICommand>({ command: S.reload_popup_controls });
			if (!IS_FIREFOX && ("showMonitors" in plan.values || "hideWindows" in plan.values)) await this.checkMonitorAccess();
		}
		return { text: settingsSummary(plan), worked: settingsWorked(plan) };
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