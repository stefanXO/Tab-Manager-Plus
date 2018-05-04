var Window = React.createFactory(React.createClass({
	getInitialState:function(){
		return {};
	},
	render:function(){
		var hideWindow = true;
		var tabsperrow = (this.props.layout.indexOf("blocks")>-1)?Math.ceil(Math.sqrt(this.props.tabs.length+2)):(this.props.layout=="vertical"?1:15);
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
				hoverHandler:this.props.hoverHandler,
				searchActive:this.props.searchActive,
				select:this.props.select,
				drag:this.props.drag,
				drop:this.props.drop,
				dropWindow:this.props.dropWindow,
				ref:"tab"+tab.id
			});
		});
		if(!hideWindow) {
			if(!!this.props.tabactions) {
				tabs.push(
					React.DOM.div(
						{className:"window-actions"},
						React.DOM.div({className:"icon tabaction add "+((this.props.layout.indexOf("blocks")>-1)?"":"windowaction"),title:"Open a new tab",onClick:this.addTab,onMouseEnter:this.props.hoverIcon}),
						React.DOM.div({className:"icon tabaction close "+((this.props.layout.indexOf("blocks")>-1)?"":"windowaction"),title:"Close this window\nWill close " + tabs.length + " tabs",onClick:this.close,onMouseEnter:this.props.hoverIcon}),
					)
				);
			}
			var children = [];
			for(var j = 0; j < tabs.length; j++){
				if(j % tabsperrow == 0 && j && (j < tabs.length-1 || (this.props.layout.indexOf("blocks")>-1))){
					children.push(React.DOM.div({className:"newliner"}));
				}
				children.push(tabs[j]);
			}
			return React.DOM.div({
						className:"window "+(this.props.layout.indexOf("blocks")>-1?"block":"")+" "+this.props.layout+" "+(this.props.window.incognito?" incognito":"")+" "+(this.props.window.focused?" focused":""),
						onDragOver:this.dragOver,
						onDrop:this.drop
					}, React.DOM.div({className:"windowcontainer"},children));
		} else {
			return null;
		}
	},
	componentDidUpdate:function(){
		this.props.parentScrollUpdate();
	},
	addTab:function(){
		chrome.tabs.create({windowId:this.props.window.id});
	},
	dragOver:function(e){
		e.nativeEvent.preventDefault();
	},
	drop:function(e){
		e.stopPropagation();
		this.props.dropWindow(this.props.window.id);
	},
	close:function(){
		chrome.windows.remove(this.props.window.id);
	}
}));
