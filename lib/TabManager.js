var TabManager = React.createFactory(React.createClass({
	getInitialState:function(){
		this.update();
		return {
			layout:localStorage["layout"]||"horizontal",
			windows:[],
			selection:{},
			hiddenTabs:{},
			tabsbyid:{},
			windowsbyid:{}
		}
	},
	render:function(){
		var self = this;
		var hiddenCount = self.state.hiddenCount || 0;
		var tabCount = self.state.tabCount || 0;
		return React.DOM.div({},
			this.state.windows.map(function(window){
				return Window({
					window:window,
					tabs:window.tabs,
					layout:self.state.layout,
					selection:self.state.selection,
					hiddenTabs:self.state.hiddenTabs,
					select:self.select.bind(self),
					drag:self.drag.bind(self),
					drop:self.drop.bind(self),
					ref:"window"+window.id
				})
			}),
			React.DOM.div({className:"window searchbox"},
				React.DOM.input({type:"text",onChange:this.search,onKeyDown:this.checkEnter,ref:"searchbox"}),
				React.DOM.div({className:"icon windowaction "+this.state.layout,title:"Change layout",onClick:this.changelayout}),
				React.DOM.div({className:"icon windowaction trash",title:"Delete Tabs",onClick:this.deleteTabs}),
				React.DOM.div({className:"icon windowaction pin",title:"Pin Tabs",onClick:this.pinTabs}),
				React.DOM.div({className:"icon windowaction new",title:"Add Window",onClick:this.addWindow})
			),
			React.DOM.div({className:"window placeholder"}),
			React.DOM.div({className:"infobox"}, !tabCount ? "" : "("+(tabCount-hiddenCount)+"/"+tabCount+")")
		)
	},
	componentDidMount:function(){
		var box = this.refs.searchbox.getDOMNode();
		box.focus();
		box.select();
		chrome.windows.onCreated.addListener(this.update.bind(this))
		chrome.windows.onRemoved.addListener(this.update.bind(this))
		chrome.tabs.onCreated.addListener(this.update.bind(this))
		chrome.tabs.onUpdated.addListener(this.update.bind(this))
		chrome.tabs.onMoved.addListener(this.update.bind(this))
		chrome.tabs.onDetached.addListener(this.update.bind(this))
		chrome.tabs.onRemoved.addListener(this.update.bind(this))
		chrome.tabs.onReplaced.addListener(this.update.bind(this))
	},
	update:function(){
		chrome.windows.getAll({populate:true},function(windows){
			this.state.windows = windows;
			this.state.windowsbyid = {};
			this.state.tabsbyid = {};
			for(var i = 0; i < windows.length; i++){
				var window = windows[i];
				this.state.windowsbyid[window.id] = window;
				for(var j = 0; j < window.tabs.length; j++){
					var tab = window.tabs[j];
					this.state.tabsbyid[tab.id] = tab;
				}
			}
			for(var id in this.state.selection){
				if(!this.state.tabsbyid[id]) delete this.state.tabsbyid[id];
			}
			this.forceUpdate();
		}.bind(this));
	},
	deleteTabs:function(){
		var self = this;
		var tabs = Object.keys(this.state.selection).map(function(id){return self.state.tabsbyid[id]});
		if(tabs.length){
			for(var i = 0; i < tabs.length; i++){
				chrome.tabs.remove(tabs[i].id);
			}
		}else{
			chrome.windows.getCurrent(function(w){
				chrome.tabs.getSelected(w.id,function(t){
					chrome.tabs.remove(t.id);
				});
			});
		}
	},
	addWindow:function(){
		var self = this;
		var tabs = Object.keys(this.state.selection).map(function(id){return self.state.tabsbyid[id]});
		var first = tabs.shift();
		var count = 0;
		if(first){
			chrome.windows.create({tabId:first.id},function(w){
				chrome.tabs.update(first.id,{pinned:first.pinned});
				for(var i = 0; i < tabs.length; i++){
					(function(tab){
						chrome.tabs.move(tab.id,{windowId:w.id,index:1},function(){
							chrome.tabs.update(tab.id,{pinned:tab.pinned});
						});
					})(tabs[i]);
				}
			});
		}else{
			chrome.windows.create({});
		}
	},
	pinTabs:function(){
		var self = this;
		var tabs = Object.keys(this.state.selection).map(function(id){return self.state.tabsbyid[id]}).sort(function(a,b){return a.index-b.index});
		if(tabs.length ){
			if(tabs[0].pinned) tabs.reverse();
			for(var i = 0; i < tabs.length; i++){
				chrome.tabs.update(tabs[i].id,{pinned:!tabs[0].pinned});
			}

		}else{
			chrome.windows.getCurrent(function(w){
				chrome.tabs.getSelected(w.id,function(t){
					chrome.tabs.update(t.id,{pinned:!t.pinned});
				});
			});
		}
	},
	search:function(e){
		var hiddenCount = 0;
		var tabCount = 0;
		for(var id in this.state.tabsbyid){
			var tab = this.state.tabsbyid[id];
			if((tab.title+tab.url).toLowerCase().indexOf(e.target.value.toLowerCase()) >= 0){
				this.state.selection[id] = true;
				delete this.state.hiddenTabs[id];
			}else{
				delete this.state.selection[id];
				this.state.hiddenTabs[id] = true;
				hiddenCount++;
			}
			tabCount++;
		}
		this.state.hiddenCount = hiddenCount;
		this.state.tabCount = tabCount;
		this.forceUpdate();
	},
	checkEnter:function(e){
		if(e.keyCode == 13) this.addWindow();
	},
	changelayout:function(){
		if(this.state.layout == "blocks"){
			localStorage["layout"] = this.state.layout = "horizontal";
		}else if(this.state.layout == "horizontal"){
			localStorage["layout"] = this.state.layout = "vertical";
		}else{
			localStorage["layout"] = this.state.layout = "blocks";
		}
		this.forceUpdate();
	},
	select:function(id){
		if(this.state.selection[id]){
			delete this.state.selection[id];
		}else{
			this.state.selection[id] = true;
		}
		this.forceUpdate();
	},
	drag:function(e,id){
		if(!this.state.selection[id]){
			this.state.selection = {};
			this.state.selection[id] = true;
		}
		this.forceUpdate();
	},
	drop:function(id,before){
		var self = this;
		var tab = this.state.tabsbyid[id];
		var tabs = Object.keys(this.state.selection).map(function(id){return self.state.tabsbyid[id]});
		var index = tab.index+(before?0:1);

		for(var i = 0; i < tabs.length; i++){
			(function(t){
				chrome.tabs.move(t.id,{windowId:tab.windowId,index:index},function(){
					chrome.tabs.update(t.id,{pinned:t.pinned});
				});
			})(tabs[i]);
		}
	}
}));
