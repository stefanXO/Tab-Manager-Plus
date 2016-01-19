var Window = React.createFactory(React.createClass({
	render:function(){
		var hideWindow = true;
		var tabsperrow = this.props.layout=="blocks"?Math.ceil(Math.sqrt(this.props.tabs.length+2)):(this.props.layout=="vertical"?1:15);
		var tabs = this.props.tabs.map(tab => {
			var isHidden = !!this.props.hiddenTabs[tab.id] && this.props.filterTabs;
			var isSelected = !!this.props.selection[tab.id];
			hideWindow &= isHidden;
			return Tab({
				window:this.props.window,
				layout:this.props.layout,
				tab:tab,
				selected:isSelected,
				hidden:isHidden,
				middleClick:this.props.tabMiddleClick,
				select:this.props.select,
				drag:this.props.drag,
				drop:this.props.drop,
				ref:"tab"+tab.id
			});
		});
		if(!hideWindow) {
			tabs.push(React.DOM.div({className:"icon add "+(this.props.layout == "blocks"?"":"windowaction"),onClick:this.addTab}));
			tabs.push(React.DOM.div({className:"icon close "+(this.props.layout == "blocks"?"":"windowaction"),onClick:this.close}));
			var children = [];
			for(var j = 0; j < tabs.length; j++){
				if(j % tabsperrow == 0 && j && (j < tabs.length-1 || this.props.layout == "blocks")){
					children.push(React.DOM.div({className:"newliner"}));
				}
				children.push(tabs[j]);
			}
			return React.DOM.div({className:"window "+(this.props.layout == "blocks"?"block":"")}, children);
		} else {
			return null;
		}
	},
	addTab:function(){
		chrome.tabs.create({windowId:this.props.window.id});
	},
	close:function(){
		chrome.windows.remove(this.props.window.id);
	}
}));
