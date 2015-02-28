var Window = React.createFactory(React.createClass({
	render:function(){
		console.log(this.props);
		var self = this;
		var tabsperrow = this.props.layout=="blocks"?Math.ceil(Math.sqrt(this.props.tabs.length+2)):(this.props.layout=="vertical"?1:15);
		var tabs = this.props.tabs.map(function(tab){
			return Tab({
				window:self.props.window,
				layout:self.props.layout,
				tab:tab,
				selected:self.props.selection[tab.id]?true:false,
				select:self.props.select,
				drag:self.props.drag,
				drop:self.props.drop,
				ref:"tab"+tab.id
			});
		});
		tabs.push(React.DOM.div({className:"icon add "+(this.props.layout == "blocks"?"":"windowaction"),onClick:this.addTab}));
		tabs.push(React.DOM.div({className:"icon close "+(this.props.layout == "blocks"?"":"windowaction"),onClick:this.close}));

		var children = [];
		for(var j = 0; j < tabs.length; j++){
			if(j % tabsperrow == 0 && j && (j < tabs.length-1 || this.props.layout == "blocks")){
				children.push(React.DOM.div({className:"newliner"}));
			}
			children.push(tabs[j]);
		}
		return React.DOM.div({className:"window "+(this.props.layout == "blocks"?"block":"")},children)
	},
	addTab:function(){
		chrome.tabs.create({windowId:this.props.window.id});
	},
	close:function(){
		chrome.windows.remove(this.props.window.id);
	}
}));
