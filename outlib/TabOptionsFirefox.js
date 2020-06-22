"use strict";var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self, call) {if (!self) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call && (typeof call === "object" || typeof call === "function") ? call : self;}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;}var

TabOptions = function (_React$Component) {_inherits(TabOptions, _React$Component);
	function TabOptions(props) {_classCallCheck(this, TabOptions);var _this = _possibleConstructorReturn(this, (TabOptions.__proto__ || Object.getPrototypeOf(TabOptions)).call(this,
		props));
		_this.state = {};return _this;
	}_createClass(TabOptions, [{ key: "logo", value: function logo()
		{
			var logo = [React.createElement("img", { src: "images/browsers.svg", style: { maxWidth: "3rem" } }), React.createElement("h2", null, "Tab Manager Plus ", "5.2.0")];

			return (
				React.createElement("div", { className: "logo-options" },
					React.createElement("div", { className: "logo-box" }, logo)));


		} }, { key: "optionsSection", value: function optionsSection()
		{
			var opts = [
			React.createElement("div", { className: "optionsBox" },
				React.createElement("h4", null, "Tab options"),
				React.createElement("div", { className: "toggle-box" },
					React.createElement("input", {
						type: "number",
						onMouseEnter: this.props.tabLimitText,
						onChange: this.props.changeTabLimit,
						value: this.props.tabLimit,
						id: "enable_tabLimit",
						name: "enable_tabLimit" }),

					React.createElement("label", { onMouseEnter: this.props.tabLimitText, htmlFor: "enable_tabLimit", style: { whiteSpace: "pre", lineHeight: "2rem" } }),
					React.createElement("label", { className: "textlabel", htmlFor: "enable_tabLimit", style: { textAlign: "", whiteSpace: "pre", lineHeight: "2rem" } }, "Limit Tabs Per Window"),


					React.createElement("div", { className: "option-description" }, "Once you reach this number of tabs, Tab Manager will move new tabs to a new window instead. No more windows with 60 tabs open!",

						React.createElement("br", null),
						React.createElement("i", null, "By default: 0 ( disabled )"),
						React.createElement("br", null),
						React.createElement("i", null, "Suggested value: 15")))),



			React.createElement("div", { className: "optionsBox" },
				React.createElement("h4", null, "Popup size"),
				React.createElement("div", { className: "option-description" }, "You can resize the popup here up to a maximum size of 800x600. This limitation is a browser limitation, and we cannot display a bigger popup due to this. If you want to have a better overview, instead you can right click on the Tab Manager Plus icon, and `open in own tab`. This will open the Tab Manager in a new tab."),




				React.createElement("div", { className: "toggle-box half-size float-right" },
					React.createElement("label", { className: "textlabel", htmlFor: "enable_tabWidth", style: { textAlign: "", whiteSpace: "pre", lineHeight: "2rem" } }, "Popup Width"),


					React.createElement("input", {
						type: "number",
						min: "450",
						max: "800",
						step: "25",
						onMouseEnter: this.props.tabWidthText,
						onChange: this.props.changeTabWidth,
						value: this.props.tabWidth,
						id: "enable_tabWidth",
						name: "enable_tabWidth" }),

					React.createElement("label", { onMouseEnter: this.props.tabWidthText, htmlFor: "enable_tabWidth", style: { whiteSpace: "pre", lineHeight: "2rem" } })),

				React.createElement("div", { className: "toggle-box half-size" },
					React.createElement("label", { className: "textlabel", htmlFor: "enable_tabHeight", style: { textAlign: "", whiteSpace: "pre", lineHeight: "2rem" } }, "Popup Height"),


					React.createElement("input", {
						type: "number",
						min: "400",
						max: "600",
						step: "25",
						onMouseEnter: this.props.tabHeightText,
						onChange: this.props.changeTabHeight,
						value: this.props.tabHeight,
						id: "enable_tabHeight",
						name: "enable_tabHeight" }),

					React.createElement("label", { onMouseEnter: this.props.tabHeightText, htmlFor: "enable_tabHeight", style: { whiteSpace: "pre", lineHeight: "2rem" } }))),


			React.createElement("div", { className: "optionsBox" },
				React.createElement("h4", null, "Window style"),
				React.createElement("div", { className: "toggle-box" },
					React.createElement("div", { className: "toggle" },
						React.createElement("input", {
							type: "checkbox",
							onMouseEnter: this.props.darkText,
							onChange: this.props.toggleDark,
							checked: this.props.dark,
							id: "dark_mode",
							name: "dark_mode" }),

						React.createElement("label", { onMouseEnter: this.props.darkText, htmlFor: "dark_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } })),

					React.createElement("label", { className: "textlabel", htmlFor: "dark_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Dark mode"),


					React.createElement("div", { className: "option-description" }, "Dark mode, for working at night time. ",
						React.createElement("br", null),
						React.createElement("i", null, "By default: disabled"))),


				React.createElement("div", { className: "toggle-box" },
					React.createElement("div", { className: "toggle" },
						React.createElement("input", {
							type: "checkbox",
							onMouseEnter: this.props.compactText,
							onChange: this.props.toggleCompact,
							checked: this.props.compact,
							id: "compact_mode",
							name: "compact_mode" }),

						React.createElement("label", { onMouseEnter: this.props.compactText, htmlFor: "compact_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } })),

					React.createElement("label", { className: "textlabel", htmlFor: "compact_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Compact mode"),


					React.createElement("div", { className: "option-description" }, "Saves a little bit of space around the icons. Makes it less beautiful, but more space efficient. ",
						React.createElement("br", null),
						React.createElement("i", null, "By default: disabled"))),


				React.createElement("div", { className: "toggle-box" },
					React.createElement("div", { className: "toggle" },
						React.createElement("input", {
							type: "checkbox",
							onMouseEnter: this.props.animationsText,
							onChange: this.props.toggleAnimations,
							checked: this.props.animations,
							id: "enable_animations",
							name: "enable_animations" }),

						React.createElement("label", { onMouseEnter: this.props.animationsText, htmlFor: "enable_animations", style: { whiteSpace: "pre", lineHeight: "2rem" } })),

					React.createElement("label", { className: "textlabel", htmlFor: "enable_animations", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Animations"),


					React.createElement("div", { className: "option-description" }, "Disables/enables animations and transitions in the popup. ",
						React.createElement("br", null),
						React.createElement("i", null, "By default: enabled"))),


				React.createElement("div", { className: "toggle-box" },
					React.createElement("div", { className: "toggle" },
						React.createElement("input", {
							type: "checkbox",
							onMouseEnter: this.props.windowTitlesText,
							onChange: this.props.toggleWindowTitles,
							checked: this.props.windowTitles,
							id: "enable_windowTitles",
							name: "enable_windowTitles" }),

						React.createElement("label", { onMouseEnter: this.props.windowTitlesText, htmlFor: "enable_windowTitles", style: { whiteSpace: "pre", lineHeight: "2rem" } })),

					React.createElement("label", { className: "textlabel", htmlFor: "enable_windowTitles", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Window titles"),


					React.createElement("div", { className: "option-description" }, "Disables/enables window titles. ",
						React.createElement("br", null),
						React.createElement("i", null, "By default: enabled")))),



			React.createElement("div", { className: "optionsBox" },
				React.createElement("h4", null, "Session Management"),
				React.createElement("div", { className: "toggle-box" },
					React.createElement("div", { className: "toggle" },
						React.createElement("input", {
							type: "checkbox",
							onMouseEnter: this.props.sessionsText,
							onChange: this.props.toggleSessions,
							checked: this.props.sessionsFeature,
							id: "session_mode",
							name: "session_mode" }),

						React.createElement("label", { onMouseEnter: this.props.sessionsText, htmlFor: "session_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } })),

					React.createElement("label", { className: "textlabel", htmlFor: "session_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Save Windows for Later"),


					React.createElement("div", { className: "option-description" }, "Allows you to save windows as sessions ( saved windows ). You can restore these saved windows later on. The restored windows won't have the history restored. This feature is currently in beta.",


						React.createElement("br", null),
						React.createElement("i", null, "By default: disabled ( experimental feature )"))),


				this.props.sessionsFeature && React.createElement("div", { className: "toggle-box" },
					React.createElement("div", { className: "toggle-box" },
						React.createElement("label", { className: "textlabel", htmlFor: "session_export", style: { whiteSpace: "pre", lineHeight: "2rem" } },
							React.createElement("h4", null, "Export/Backup Sessions")),

						React.createElement("button", { type: "button", onMouseEnter: this.props.exportSessionsText, onClick: this.props.exportSessions, id: "session_export", name: "session_export" }, "Export/Backup Sessions"),


						React.createElement("label", { onMouseEnter: this.props.exportSessionsText, htmlFor: "session_export", style: { whiteSpace: "pre", lineHeight: "2rem" } })),

					React.createElement("div", { className: "option-description" }, "Allows you to backup your saved windows to an external file.")),

				this.props.sessionsFeature && React.createElement("div", { className: "toggle-box" },
					React.createElement("div", { className: "toggle-box" },
						React.createElement("label", { className: "textlabel", htmlFor: "session_import", style: { whiteSpace: "pre", lineHeight: "2rem" } },
							React.createElement("h4", null, "Import/Restore Sessions")),

						React.createElement("input", {
							type: "file",
							accept: "application/json",
							onMouseEnter: this.props.importSessionsText,
							onChange: this.props.importSessions,
							id: "session_import",
							name: "session_import",
							placeholder: "Import/Restore Sessions" }),

						React.createElement("label", { onMouseEnter: this.props.importSessionsText, htmlFor: "session_import", style: { whiteSpace: "pre", lineHeight: "2rem" } })),

					React.createElement("div", { className: "option-description" }, "Allows you to restore your backup from an external file. The restored windows will be added to your current saved windows."))),




			React.createElement("div", { className: "optionsBox" },
				React.createElement("h4", null, "Popup icon"),
				React.createElement("div", { className: "toggle-box" },
					React.createElement("div", { className: "toggle" },
						React.createElement("input", {
							type: "checkbox",
							onMouseEnter: this.props.badgeText,
							onChange: this.props.toggleBadge,
							checked: this.props.badge,
							id: "badge_mode",
							name: "badge_mode" }),

						React.createElement("label", { onMouseEnter: this.props.badgeText, htmlFor: "badge_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } })),

					React.createElement("label", { className: "textlabel", htmlFor: "badge_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Count Tabs"),


					React.createElement("div", { className: "option-description" }, "Shows you the number of open tabs over the Tab Manager icon in the top right of your browser.",

						React.createElement("br", null),
						React.createElement("i", null, "By default: enabled"))),


				React.createElement("div", { className: "toggle-box" },
					React.createElement("div", { className: "toggle" },
						React.createElement("input", {
							type: "checkbox",
							onMouseEnter: this.props.openInOwnTabText,
							onChange: this.props.toggleOpenInOwnTab,
							checked: this.props.openInOwnTab,
							id: "openinowntab_mode",
							name: "openinowntab_mode" }),

						React.createElement("label", { onMouseEnter: this.props.openInOwnTabText, htmlFor: "openinowntab_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } })),

					React.createElement("label", { className: "textlabel", htmlFor: "openinowntab_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Open in own Tab by default"),


					React.createElement("div", { className: "option-description" }, "Opens the Tab Manager in own tab by default, instead of the popup.",

						React.createElement("br", null),
						React.createElement("i", null, "By default: disabled")))),



			React.createElement("div", { className: "optionsBox" },
				React.createElement("h4", null, "Window settings"),
				React.createElement("div", { className: "toggle-box" },
					React.createElement("div", { className: "toggle" },
						React.createElement("input", {
							type: "checkbox",
							onMouseEnter: this.props.tabActionsText,
							onChange: this.props.toggleTabActions,
							checked: this.props.tabactions,
							id: "tabactions_mode",
							name: "tabactions_mode" }),

						React.createElement("label", { onMouseEnter: this.props.tabActionsText, htmlFor: "tabactions_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } })),

					React.createElement("label", { className: "textlabel", htmlFor: "tabactions_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Show action buttons"),


					React.createElement("div", { className: "option-description" }, "Displays buttons in every window for : opening a new tab, minimizing the window, assigning a color to the window and closing the window.",

						React.createElement("br", null),
						React.createElement("i", null, "By default: enabled")))),



			React.createElement("div", { className: "optionsBox" },
				React.createElement("h4", null, "Advanced settings"),
				React.createElement("div", { className: "toggle-box" },
					React.createElement("div", { className: "toggle-box" },
						React.createElement("a", { href: "#", onClick: this.openIncognitoOptions }, "Allow in Private Windows")),



					React.createElement("div", { className: "option-description" }, "If you also want to see your private tabs in the Tab Manager overview, then enable private windows access for this extension.")),



				React.createElement("div", { className: "toggle-box" },
					React.createElement("a", { href: "#", onClick: this.openShortcuts }, "Change shortcut key"),


					React.createElement("div", { className: "option-description" }, "If you want to disable or change the shortcut key with which to open Tab Manager Plus, you can do so in the add-ons settings. Click on the settings cog on the next page, and then 'Manage Extension Shortcuts'."))),





			React.createElement("div", { className: "optionsBox" },
				React.createElement("div", { className: "toggle-box" },
					React.createElement("h4", null, "Right mouse button"),
					React.createElement("div", { className: "option-description" }, "With the right mouse button you can select tabs"),
					React.createElement("h4", null, "Shift+Right mouse button"),
					React.createElement("div", { className: "option-description" }, "While holding shift, and pressing the right mouse button you can select all tabs between the last selected tab and the current one"),


					React.createElement("h4", null, "Middle mouse button"),
					React.createElement("div", { className: "option-description" }, "With the middle mouse button you can close a tab"),
					React.createElement("h4", null, "[Enter / Return] button"),
					React.createElement("div", { className: "option-description" }, "With the return button you can switch to the currently selected tab, or move multiple selected tabs to a new window")))];






			return React.createElement("div", { className: "toggle-options" }, opts);
		} }, { key: "openIncognitoOptions", value: function openIncognitoOptions()
		{
			browser.runtime.openOptionsPage();
			// browser.tabs.create({ url: 'about:addons' });
		} }, { key: "openShortcuts", value: function openShortcuts()
		{
			browser.runtime.openOptionsPage();
			//browser.tabs.create({ url: 'about:addons' });
		} }, { key: "licenses", value: function licenses()
		{
			var licenses = [];
			licenses.push(
			React.createElement("div", { className: "license" }, "Tab Manager Plus is based on",
				" ",
				React.createElement("a", { href: "https://github.com/dsc/Tab-Manager", target: "_blank", title: "Tab-Manager" }, "dsc/Tab-Manager"), ",",


				" ",
				React.createElement("a", { href: "https://github.com/joshperry/Tab-Manager", target: "_blank", title: "Tab-Manager" }, "joshperry/Tab-Manager"),

				" ", "and",
				" ",
				React.createElement("a", { href: "https://github.com/JonasNo/Tab-Manager", target: "_blank", title: "Tab-Manager" }, "JonasNo/Tab-Manager"), ".",


				React.createElement("br", null), "Licensed by",
				" ",
				React.createElement("a", { href: "http://creativecommons.org/licenses/by/3.0/", target: "_blank", title: " Mozilla Public License (MPL)" }, "MPLv2"), ". Icons made by",


				" ",
				React.createElement("a", { href: "http://www.freepik.com", title: "Freepik" }, "Freepik"),

				" ", "from",
				" ",
				React.createElement("a", { href: "http://www.flaticon.com", title: "Flaticon" }, "www.flaticon.com"), ". Licensed by",


				" ",
				React.createElement("a", { href: "http://creativecommons.org/licenses/by/3.0/", target: "_blank", title: "Creative Commons BY 3.0" }, "CC 3.0 BY"), "."));






			return React.createElement("div", { className: "licenses" }, licenses);
		} }, { key: "render", value: function render()
		{
			var children = [];

			children.push(this.logo());
			children.push(this.optionsSection());
			children.push(React.createElement("div", { className: "clearfix" }));
			//children.push(React.createElement('h4', {}, this.props.getTip()));
			children.push(this.licenses());

			return (
				React.createElement("div", { className: "options-window" },
					React.createElement("div", null, children)));


		} }]);return TabOptions;}(React.Component);