var TabOptions = React.createFactory(React.createClass({
	getInitialState:function(){
		return {};
	},
	logo:function(){
		var logo = [
			React.DOM.img({src:"images/browsers.svg", style:{"max-width":"5rem"}}),
			React.DOM.h2({}, "Tab Manager Plus 4.8")
		];
		return React.DOM.div({className:"logo-options"}, React.DOM.div({className:"logo-box"}, logo));
	},
	optionsSection:function(){
		var opts = [
			React.DOM.div({className: "toggle-box"},
					React.DOM.input({type: "number", onMouseEnter: this.props.tabLimitText, onChange: this.props.changeTabLimit, value: this.props.tabLimit, id:"enable_tabLimit", name:"enable_tabLimit"}),
					React.DOM.label({onMouseEnter: this.props.tabLimitText, htmlFor: "enable_tabLimit", style:{"white-space": "pre", "line-height": "2rem"}}),
				React.DOM.label({className:"textlabel", htmlFor: "enable_tabLimit", style:{"text-align": "center", "white-space": "pre", "line-height": "2rem"}}, "Limit Tabs Per Window"),
			),		
			React.DOM.div({className: "toggle-box"},
				React.DOM.div({className: "toggle"},
					React.DOM.input({type: "checkbox", onMouseEnter: this.props.animationsText, onChange: this.props.toggleAnimations, checked: this.props.animations, id:"enable_animations", name:"enable_animations"}),
					React.DOM.label({onMouseEnter: this.props.animationsText, htmlFor: "enable_animations", style:{"white-space": "pre", "line-height": "2rem"}}),
				),
				React.DOM.label({className:"textlabel", htmlFor: "enable_animations", style:{"white-space": "pre", "line-height": "2rem"}}, "Animations"),
			),
			React.DOM.div({className: "toggle-box"},
				React.DOM.div({className: "toggle"},
					React.DOM.input({type: "checkbox", onMouseEnter: this.props.compactText, onChange: this.props.toggleCompact, checked: this.props.compact, id:"compact_mode", name:"compact_mode"}),
					React.DOM.label({onMouseEnter: this.props.compactText, htmlFor: "compact_mode", style:{"white-space": "pre", "line-height": "2rem"}}),
				),
				React.DOM.label({className:"textlabel", htmlFor: "compact_mode", style:{"white-space": "pre", "line-height": "2rem"}}, "Compact mode"),
			),
			React.DOM.div({className: "toggle-box"},
				React.DOM.div({className: "toggle"},
					React.DOM.input({type: "checkbox", onMouseEnter: this.props.tabActionsText, onChange: this.props.toggleTabActions, checked: this.props.tabactions, id:"tabactions_mode", name:"tabactions_mode"}),
					React.DOM.label({onMouseEnter: this.props.tabActionsText, htmlFor: "tabactions_mode", style:{"white-space": "pre", "line-height": "2rem"}}),
				),
				React.DOM.label({className:"textlabel", htmlFor: "tabactions_mode", style:{"white-space": "pre", "line-height": "2rem"}}, "Action buttons"),
			),
			React.DOM.div({className: "toggle-box"},
				React.DOM.div({className: "toggle"},
					React.DOM.input({type: "checkbox", onMouseEnter: this.props.badgeText, onChange: this.props.toggleBadge, checked: this.props.badge, id:"badge_mode", name:"badge_mode"}),
					React.DOM.label({onMouseEnter: this.props.badgeText, htmlFor: "badge_mode", style:{"white-space": "pre", "line-height": "2rem"}}),
				),
				React.DOM.label({className:"textlabel", htmlFor: "badge_mode", style:{"white-space": "pre", "line-height": "2rem"}}, "Count Tabs"),
			),
			React.DOM.div({className: "toggle-box"},
				React.DOM.a({href:"#", onClick: this.openIncognitoOptions}, "Allow in Incognito")
			),
			React.DOM.div({className: "toggle-box"},
				React.DOM.a({href:"#", onClick: this.openShortcuts}, "Change shortcut key")
			)
		];
		return React.DOM.div({className:"toggle-options"}, opts);
	},
	openIncognitoOptions: function() {
		chrome.tabs.create({url:'chrome://extensions/?id=cnkdjjdmfiffagllbiiilooaoofcoeff'});
	},
	openShortcuts: function() {
		chrome.tabs.create({url:'chrome://extensions/shortcuts'});
	},
	licenses:function(){
		var licenses = [];
		licenses.push(
			React.DOM.div({className:"license"},
				"Tab Manager Plus is based on  ",
				React.DOM.a({href:"https://github.com/dsc/Tab-Manager", "target":"_blank", "title":"Tab-Manager"},"dsc/Tab-Manager"),
				", ",
				React.DOM.a({href:"https://github.com/joshperry/Tab-Manager", "target":"_blank", "title":"Tab-Manager"},"joshperry/Tab-Manager"),
				" and ",
				React.DOM.a({href:"https://github.com/JonasNo/Tab-Manager", "target":"_blank", "title":"Tab-Manager"},"JonasNo/Tab-Manager"),
				". Licensed by ",
				React.DOM.a({href:"http://creativecommons.org/licenses/by/3.0/", "target":"_blank", "title":" Mozilla Public License (MPL)"},"MPLv2"),
				".",
				" Icons made by ",
				React.DOM.a({href:"http://www.freepik.com", "title":"Freepik"},"Freepik"),
				" from ",
				React.DOM.a({href:"http://www.flaticon.com", "title":"Flaticon"},"www.flaticon.com"),
				". Licensed by ",
				React.DOM.a({href:"http://creativecommons.org/licenses/by/3.0/", "target":"_blank", "title":"Creative Commons BY 3.0"},"CC 3.0 BY"),
				".",
			)
		);
		return React.DOM.div({className:"licenses"}, licenses);
	},
	render:function(){
		var children = [];

		children.push(this.logo());
		children.push(this.optionsSection());
		children.push(React.DOM.div({className:"clearfix"}))
		//children.push(React.DOM.h4({}, this.props.getTip()));
		children.push(this.licenses());

		return React.DOM.div({
					className:"options-window"
				}, 
				React.DOM.div({},children));

	}
}));

