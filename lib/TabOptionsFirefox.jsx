"use strict";

class TabOptions extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}
	logo() {
		var logo = [<img src="images/browsers.svg" style={{ maxWidth: "3rem" }} />, <h2>Tab Manager Plus {__VERSION__}</h2>];

		return (
			<div className="logo-options">
				<div className="logo-box">{logo}</div>
			</div>
		);
	}
	optionsSection() {
		var opts = [
			<div className="optionsBox">
				<h4>Tab options</h4>
				<div className="toggle-box">
					<input
						type="number"
						onMouseEnter={this.props.tabLimitText}
						onChange={this.props.changeTabLimit}
						value={this.props.tabLimit}
						id="enable_tabLimit"
						name="enable_tabLimit"
					/>
					<label onMouseEnter={this.props.tabLimitText} htmlFor="enable_tabLimit" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
					<label className="textlabel" htmlFor="enable_tabLimit" style={{ textAlign: "", whiteSpace: "pre", lineHeight: "2rem" }}>
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
			</div>,
			<div className="optionsBox">
				<h4>Popup size</h4>
				<div className="option-description">
					You can resize the popup here up to a maximum size of 800x600. This limitation is a browser limitation, and we cannot display a bigger popup due to
					this. If you want to have a better overview, instead you can right click on the Tab Manager Plus icon, and `open in own tab`. This will open the Tab
					Manager in a new tab.
				</div>
				<div className="toggle-box half-size float-right">
					<label className="textlabel" htmlFor="enable_tabWidth" style={{ textAlign: "", whiteSpace: "pre", lineHeight: "2rem" }}>
						Popup Width
					</label>
					<input
						type="number"
						min="450"
						max="800"
						step="25"
						onMouseEnter={this.props.tabWidthText}
						onChange={this.props.changeTabWidth}
						value={this.props.tabWidth}
						id="enable_tabWidth"
						name="enable_tabWidth"
					/>
					<label onMouseEnter={this.props.tabWidthText} htmlFor="enable_tabWidth" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
				</div>
				<div className="toggle-box half-size">
					<label className="textlabel" htmlFor="enable_tabHeight" style={{ textAlign: "", whiteSpace: "pre", lineHeight: "2rem" }}>
						Popup Height
					</label>
					<input
						type="number"
						min="400"
						max="600"
						step="25"
						onMouseEnter={this.props.tabHeightText}
						onChange={this.props.changeTabHeight}
						value={this.props.tabHeight}
						id="enable_tabHeight"
						name="enable_tabHeight"
					/>
					<label onMouseEnter={this.props.tabHeightText} htmlFor="enable_tabHeight" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
				</div>
			</div>,
			<div className="optionsBox">
				<h4>Window style</h4>
				<div className="toggle-box">
					<div className="toggle">
						<input
							type="checkbox"
							onMouseEnter={this.props.darkText}
							onChange={this.props.toggleDark}
							checked={this.props.dark}
							id="dark_mode"
							name="dark_mode"
						/>
						<label onMouseEnter={this.props.darkText} htmlFor="dark_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
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
							onMouseEnter={this.props.compactText}
							onChange={this.props.toggleCompact}
							checked={this.props.compact}
							id="compact_mode"
							name="compact_mode"
						/>
						<label onMouseEnter={this.props.compactText} htmlFor="compact_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
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
							onMouseEnter={this.props.animationsText}
							onChange={this.props.toggleAnimations}
							checked={this.props.animations}
							id="enable_animations"
							name="enable_animations"
						/>
						<label onMouseEnter={this.props.animationsText} htmlFor="enable_animations" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
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
							onMouseEnter={this.props.windowTitlesText}
							onChange={this.props.toggleWindowTitles}
							checked={this.props.windowTitles}
							id="enable_windowTitles"
							name="enable_windowTitles"
						/>
						<label onMouseEnter={this.props.windowTitlesText} htmlFor="enable_windowTitles" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
					</div>
					<label className="textlabel" htmlFor="enable_windowTitles" style={{ whiteSpace: "pre", lineHeight: "2rem" }}>
						Window titles
					</label>
					<div className="option-description">
						Disables/enables window titles. <br />
						<i>By default: enabled</i>
					</div>
				</div>
			</div>,
			<div className="optionsBox">
				<h4>Session Management</h4>
				<div className="toggle-box">
					<div className="toggle">
						<input
							type="checkbox"
							onMouseEnter={this.props.sessionsText}
							onChange={this.props.toggleSessions}
							checked={this.props.sessionsFeature}
							id="session_mode"
							name="session_mode"
						/>
						<label onMouseEnter={this.props.sessionsText} htmlFor="session_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
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
						<button type="button" onMouseEnter={this.props.exportSessionsText} onClick={this.props.exportSessions} id="session_export" name="session_export">
							Export/Backup Sessions
						</button>
						<label onMouseEnter={this.props.exportSessionsText} htmlFor="session_export" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
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
							onMouseEnter={this.props.importSessionsText}
							onChange={this.props.importSessions}
							id="session_import"
							name="session_import"
							placeholder="Import/Restore Sessions"
						/>
						<label onMouseEnter={this.props.importSessionsText} htmlFor="session_import" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
					</div>
					<div className="option-description">
						Allows you to restore your backup from an external file. The restored windows will be added to your current saved windows.
					</div>
				</div>}
			</div>,
			<div className="optionsBox">
				<h4>Popup icon</h4>
				<div className="toggle-box">
					<div className="toggle">
						<input
							type="checkbox"
							onMouseEnter={this.props.badgeText}
							onChange={this.props.toggleBadge}
							checked={this.props.badge}
							id="badge_mode"
							name="badge_mode"
						/>
						<label onMouseEnter={this.props.badgeText} htmlFor="badge_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
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
							onMouseEnter={this.props.openInOwnTabText}
							onChange={this.props.toggleOpenInOwnTab}
							checked={this.props.openInOwnTab}
							id="openinowntab_mode"
							name="openinowntab_mode"
						/>
						<label onMouseEnter={this.props.openInOwnTabText} htmlFor="openinowntab_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
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
			</div>,
			<div className="optionsBox">
				<h4>Window settings</h4>
				<div className="toggle-box">
					<div className="toggle">
						<input
							type="checkbox"
							onMouseEnter={this.props.tabActionsText}
							onChange={this.props.toggleTabActions}
							checked={this.props.tabactions}
							id="tabactions_mode"
							name="tabactions_mode"
						/>
						<label onMouseEnter={this.props.tabActionsText} htmlFor="tabactions_mode" style={{ whiteSpace: "pre", lineHeight: "2rem" }} />
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
			</div>,
			<div className="optionsBox">
				<h4>Advanced settings</h4>
				<div className="toggle-box">
					<div className="toggle-box">
						<a href="#" onClick={this.openIncognitoOptions}>
							Allow in Private Windows
						</a>
					</div>
					<div className="option-description">
						If you also want to see your private tabs in the Tab Manager overview, then enable private windows access for this extension.
					</div>
				</div>
				<div className="toggle-box">
					<a href="#" onClick={this.openShortcuts}>
						Change shortcut key
					</a>
					<div className="option-description">
						If you want to disable or change the shortcut key with which to open Tab Manager Plus, you can do so in the add-ons settings. Click on the settings
						cog on the next page, and then 'Manage Extension Shortcuts'.
					</div>
				</div>
			</div>,
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
		];

		return <div className="toggle-options">{opts}</div>;
	}
	openIncognitoOptions() {
		browser.runtime.openOptionsPage();
		// browser.tabs.create({ url: 'about:addons' });
	}
	openShortcuts() {
		browser.runtime.openOptionsPage();
		//browser.tabs.create({ url: 'about:addons' });
	}
	licenses() {
		var licenses = [];
		licenses.push(
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
		);

		return <div className="licenses">{licenses}</div>;
	}
	render() {
		var children = [];

		children.push(this.logo());
		children.push(this.optionsSection());
		children.push(<div className="clearfix" />);
		//children.push(React.createElement('h4', {}, this.props.getTip()));
		children.push(this.licenses());

		return (
			<div className="options-window">
				<div>{children}</div>
			</div>
		);
	}
}
