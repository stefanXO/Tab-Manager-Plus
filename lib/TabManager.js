var TabManager = React.createFactory(React.createClass({
	getInitialState:function(){
		this.update();

		var layout = "horizontal"
		var animations = true;
		var compact = false;
		var tabactions = true;
		var badge = true;
		var filterTabs = false;

		if(this.localStorageAvailable()) {
			if(!localStorage["layout"]) localStorage["layout"] = "horizontal";
			if(typeof localStorage["tabLimit"] === "undefined") localStorage["tabLimit"] = "0";
			if(typeof localStorage["animations"] === "undefined") localStorage["animations"] = "1";
			if(typeof localStorage["compact"] === "undefined") localStorage["compact"] = "0";
			if(typeof localStorage["tabactions"] === "undefined") localStorage["tabactions"] = "1";
			if(typeof localStorage["badge"] === "undefined") localStorage["badge"] = "1";
			if(typeof localStorage["filter-tabs"] === "undefined") localStorage["filter-tabs"] = "0";
			if(typeof localStorage["version"] === "undefined") localStorage["version"] = "4.8.1";

			layout = localStorage["layout"];
			tabLimit = JSON.parse(localStorage["tabLimit"]);
			animations = this.toBoolean(localStorage["animations"]);
			compact = this.toBoolean(localStorage["compact"]);
			tabactions = this.toBoolean(localStorage["tabactions"]);
			badge = this.toBoolean(localStorage["badge"]);
			filterTabs = this.toBoolean(localStorage["filter-tabs"]);
		}

		return {
			layout:layout,
			animations:animations,
			tabLimit:tabLimit,
			compact:compact,
			tabactions:tabactions,
			transitionRunning: false,
			badge:badge,
			windows:[],
			selection:{},
			hiddenTabs:{},
			tabsbyid:{},
			windowsbyid:{},
			height:400,
			hasScrollBar:false,
			focusUpdates:0,
			topText: "",
			bottomText: "",
			optionsActive:false,
			filterTabs:filterTabs,
			dupTabs:false
		}
	},
	shouldComponentUpdate: function(nextProps, nextState) {
		//console.log("should update?", nextProps, nextState);
		return true;
	},
	hoverHandler(tab) {
		this.setState({ topText : tab.title });
		this.setState({ bottomText : tab.url });
	},
	hoverIcon(e) {
		var text = e.target.title || " ";
		var bottom = " ";
		if(text.indexOf("\n") > -1) {
			var a = text.split("\n");
			text = a[0];
			bottom = a[1];
		}
		this.setState({ topText : text });
		this.setState({ bottomText : bottom });
	},
	render:function(){
		var hiddenCount = this.state.hiddenCount || 0;
		var tabCount = this.state.tabCount || 0;
		return React.DOM.div({id:"root",className:(this.state.compact?"compact":"") + " " + (this.state.animations?"animations":"no-animations"),onKeyDown:this.checkKey,ref:"root",tabIndex:0},
			React.DOM.div({className:"window-container " + this.state.layout + " " + (this.state.optionsActive?"hidden":""),ref:"windowcontainer",tabIndex:2},
				this.state.windows.map(window => {
					return Window({
						window,
						tabs:window.tabs,
						incognito:window.incognito,
						layout:this.state.layout,
						selection:this.state.selection,
						searchActive:(this.state.searchLen > 0),
						tabactions:this.state.tabactions,
						hiddenTabs:this.state.hiddenTabs,
						filterTabs:this.state.filterTabs,
						hoverHandler:this.hoverHandler,
						hoverIcon:this.hoverIcon,
						tabMiddleClick:this.deleteTab.bind(this),
						parentScrollUpdate:this.scrollUpdate.bind(this),
						select:this.select.bind(this),
						drag:this.drag.bind(this),
						drop:this.drop.bind(this),
						dropWindow:this.dropWindow.bind(this),
						ref:"window"+window.id
					});
				})
			),
			React.DOM.div({className:"options-container " + (this.state.optionsActive?"":"hidden"),ref:"options-container"},
				TabOptions({
					compact:this.state.compact,
					animations:this.state.animations,
					tabLimit:this.state.tabLimit,
					tabactions:this.state.tabactions,
					badge:this.state.badge,
					toggleBadge:this.toggleBadge,
					toggleAnimations:this.toggleAnimations,
					toggleCompact:this.toggleCompact,
					toggleTabActions:this.toggleTabActions,
					changeTabLimit:this.changeTabLimit,
					badgeText:this.badgeText,
					animationsText:this.animationsText,
					tabLimitText:this.tabLimitText,
					compactText:this.compactText,
					tabActionsText:this.tabActionsText,
					getTip:this.getTip
				})
			),
			React.DOM.div({className:"window top",ref:"tophover"},
				React.DOM.div({className:"icon windowaction options",title:"Options",onClick:this.toggleOptions,onMouseEnter:this.hoverIcon}),
				React.DOM.input({type:"text",disabled:true,className:"tabtitle",ref:"topbox",placeholder:tabCount + " tabs in " + this.state.windows.length + " windows", value:this.state.topText }),
				React.DOM.input({type:"text",disabled:true,className:"taburl",ref:"topboxurl",placeholder:this.getTip(), value:this.state.bottomText}),
			),
			React.DOM.div({className:"window searchbox " + (this.state.optionsActive?"hidden":"")},
				React.DOM.input({type:"text",placeholder:"Search tabs...",tabIndex:"1",onChange:this.search,ref:"searchbox"}),
				React.DOM.div({className:"icon windowaction "+this.state.layout+"-view",title:"Change to " + this.readablelayout(this.nextlayout()) + " View",onClick:this.changelayout,onMouseEnter:this.hoverIcon}),
				React.DOM.div({className:"icon windowaction trash",
								title:(Object.keys(this.state.selection).length>0)?"Close selected tabs\nWill close " + Object.keys(this.state.selection).length + " tabs":"Close current Tab",onClick:this.deleteTabs,onMouseEnter:this.hoverIcon}),
				React.DOM.div({className:"icon windowaction pin",
								title:(Object.keys(this.state.selection).length>0)?"Pin selected tabs\nWill pin " + Object.keys(this.state.selection).length + " tabs":"Pin current Tab",onClick:this.pinTabs,onMouseEnter:this.hoverIcon}),
				React.DOM.div({className:"icon windowaction filter"+(this.state.filterTabs? " enabled":""),
								title:(this.state.filterTabs? "Do not hide":"Hide")+" tabs that do not match search" + (this.state.searchLen > 0?("\n" + (this.state.filterTabs?"Will reveal ":"Will hide ") + (Object.keys(this.state.tabsbyid).length - Object.keys(this.state.selection).length) + " tabs"):""),
								onClick:this.toggleFilterMismatchedTabs,onMouseEnter:this.hoverIcon}),
				React.DOM.div({className:"icon windowaction new",
								title:(Object.keys(this.state.selection).length>0?"Move tabs to new window\nWill move " + Object.keys(this.state.selection).length + " selected tabs to it":"Open new empty window"),onClick:this.addWindow,onMouseEnter:this.hoverIcon}),
				React.DOM.div({className:"icon windowaction duplicates"+(this.state.dupTabs? " enabled":""),title:"Highlight Duplicates",onClick:this.highlightDuplicates,onMouseEnter:this.hoverIcon})
			),
			React.DOM.div({className:"window placeholder"})
		)
	},
	componentDidMount:function(){
		chrome.windows.onCreated.addListener(this.update.bind(this))
		chrome.windows.onRemoved.addListener(this.update.bind(this))
		chrome.tabs.onCreated.addListener(this.update.bind(this))
		chrome.tabs.onUpdated.addListener(this.update.bind(this))
		chrome.tabs.onMoved.addListener(this.update.bind(this))
		chrome.tabs.onDetached.addListener(this.update.bind(this))
		chrome.tabs.onRemoved.addListener(this.update.bind(this))
		chrome.tabs.onReplaced.addListener(this.update.bind(this))
		this.refs.root.focus();
		this.focusRoot();
		// box.select();
		// box.focus();
	},
	focusRoot:function(){
		this.state.focusUpdates++;
		setTimeout(function() { 
			if(document.activeElement == document.body) {
				this.refs.root.focus();
				this.forceUpdate();
				if(this.state.focusUpdates < 5) this.focusRoot();
			}
		}.bind(this), 500);
	},
	componentWillUpdate:function(){
		this.scrollUpdate();
	},
	scrollUpdate:function(){

		return;


		if(!!this.state) {
			if(!!this.state.transitionRunning) return;
			this.state.hasScrollBar = ((this.refs.windowcontainer.scrollHeight > this.refs.windowcontainer.offsetHeight) || (this.refs.windowcontainer.scrollHeight > this.refs.windowcontainer.clientHeight));
			if(this.state.hasScrollBar) {
				//console.log("has scrollbar");
				var oldHeight = this.state.height;
				if(this.state.height < 600) {
					this.state.height += 50;
					if(this.state.height > 600) this.state.height = 600;
					if(this.state.height == oldHeight) return;
					this.state.transitionRunning = true;
					document.body.addEventListener("transitionend", this.transitionEnd);
					document.body.className = "c" + this.state.height;
					document.documentElement.className = "c" + this.state.height;
					//this.forceUpdate();
				}
			}else{

				if(!this.refs.windowcontainer.lastChild) return;
				//console.log("has no scrollbar");
				document.getElementsByClassName('window-container')
				var parentRect = this.refs.windowcontainer.getBoundingClientRect();
				var parentRectBot = parentRect.y + parentRect.height;
				var lastRect = this.refs.windowcontainer.lastChild.getBoundingClientRect();
				var lastRectBot = lastRect.y + lastRect.height;

				if(lastRectBot > parentRectBot) {
					//console.log("scroll present", lastRectBot, parentRectBot);
				}else{
					//console.log("no scroll present", lastRectBot, parentRectBot);
					//console.log("space...", parentRectBot-lastRectBot);
					var diff = parentRectBot-lastRectBot;
					//console.log("diff", diff);
					diff = (Math.ceil(diff/50)*50)-50;
					//console.log("diff", diff);
					if(diff > 0) {
						var oldHeight = this.state.height;
						if(this.state.height > 400) {
							this.state.height -= diff;
							if(this.state.height < 400) this.state.height = 400;
							if(this.state.height == oldHeight) return;
							this.state.transitionRunning = true;
							document.body.addEventListener("transitionend", this.transitionEnd);
							document.body.className = "c" + this.state.height;
							document.documentElement.className = "c" + this.state.height;
							//this.forceUpdate();
						}
					}
				}
				return;


			}
			//console.log(this.state.hasScrollBar);
		}
	},
	transitionEnd: function() {
		//console.log("transition ended");
		document.body.removeEventListener("transitionend", this.transitionEnd);
		this.state.transitionRunning = false;
		this.forceUpdate();
	},
	toggleOptions:function(){
		this.state.optionsActive = !this.state.optionsActive;
		this.forceUpdate();
	},
	update:function(){
		chrome.windows.getAll({populate:true},function(windows){
			windows.sort(function(a, b){
				var windows = JSON.parse(localStorage["windowAge"]);
				var aSort = windows.indexOf(a.id);
				var bSort = windows.indexOf(b.id);
				if(aSort < bSort) return -1;
				if(aSort > bSort) return 1;
				return 0;
			});
			this.state.windows = windows;
			this.state.windowsbyid = {};
			this.state.tabsbyid = {};
			var tabCount = 0;
			for(var i = 0; i < windows.length; i++){
				var window = windows[i];
				this.state.windowsbyid[window.id] = window;
				for(var j = 0; j < window.tabs.length; j++){
					var tab = window.tabs[j];
					this.state.tabsbyid[tab.id] = tab;
					tabCount++;
				}
			}
			for(var id in this.state.selection){
				if(!this.state.tabsbyid[id]) delete this.state.selection[id];
			}
			this.state.tabCount = tabCount;
			//this.state.searchLen = 0;
			this.forceUpdate();
		}.bind(this));
	},
	deleteTabs:function(){
		var tabs = Object.keys(this.state.selection).map(id => this.state.tabsbyid[id]);
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
		this.forceUpdate();
	},
	deleteTab:function(tabId) {
		chrome.tabs.remove(tabId);
	},
	addWindow:function(){
		var count = Object.keys(this.state.selection).length;
		var tabs = Object.keys(this.state.selection).map(id => this.state.tabsbyid[id]);

		if(count == 0) {
			chrome.windows.create({});
		}else if(count == 1) {
			chrome.runtime.getBackgroundPage(function callback(tabs, backgroundPage) {
				backgroundPage.focusOnTabAndWindow(tabs[0]);
			}.bind(null, tabs));
		}else{
			chrome.runtime.getBackgroundPage(function callback(tabs, backgroundPage) {
				backgroundPage.createWindowWithTabs(tabs);
			}.bind(null, tabs));
		}
	},
	pinTabs:function(){
		var tabs = Object.keys(this.state.selection).map(id => this.state.tabsbyid[id]).sort((a,b) => a.index-b.index);
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
	highlightDuplicates: function(e) {
		this.state.selection = {};
		this.state.hiddenTabs = {};
		this.state.searchLen = 0;
		this.state.dupTabs = !this.state.dupTabs;
		this.refs.searchbox.value = "";
		if(!this.state.dupTabs) {
			this.state.hiddenCount = 0;
			this.forceUpdate();
			return;
		}
		var hiddenCount = this.state.hiddenCount || 0;
		var idList = this.state.tabsbyid;
		var dup = [];
		for(var id in idList){
			var tab = this.state.tabsbyid[id];
			for(var id2 in idList){
				if(id == id2) continue;
				var tab2 = this.state.tabsbyid[id2];
				if(tab.url == tab2.url) {
					dup.push(id);
					break;
				}
			}
		}
		for(var id in dup) {
			this.state.searchLen++;
			hiddenCount -= (this.state.hiddenTabs[dup[id]] || 0);
			this.state.selection[dup[id]] = true;
			delete this.state.hiddenTabs[dup[id]];
		}
		for(var id in idList){
			var tab = this.state.tabsbyid[id]
			if(dup.indexOf(id) === -1) {
				hiddenCount += 1 - (this.state.hiddenTabs[id] || 0);
				this.state.hiddenTabs[id] = true;
				delete this.state.selection[id];
			}
		}
		if(dup.length == 0) {
			this.setState({
				topText : "No duplicates found",
				bottomText : " "
			});
		}else{
			this.setState({
				topText : "Highlighted " + dup.length + " duplicate tabs",
				bottomText : "Press enter to move them to a new window"
			});
		}
		this.state.hiddenCount = hiddenCount;
		this.forceUpdate();
	},
	search:function(e){
		var hiddenCount = this.state.hiddenCount || 0;
		var searchLen = (e.target.value || "").length;
		if(!searchLen){
			this.state.selection = {};
			this.state.hiddenTabs = {};
			hiddenCount = 0;
		}else{
			var idList;
			var lastSearchLen = this.state.searchLen;
			if(!lastSearchLen){
				idList = this.state.tabsbyid;
			}else if(lastSearchLen > searchLen){
				idList = this.state.hiddenTabs;
			}else if(lastSearchLen < searchLen){
				idList = this.state.selection;
			}else{
				return;
			}
			for(var id in idList){
				var tab = this.state.tabsbyid[id];
				if((tab.title+tab.url).toLowerCase().indexOf(e.target.value.toLowerCase()) >= 0){
					hiddenCount -= (this.state.hiddenTabs[id] || 0);
					this.state.selection[id] = true;
					delete this.state.hiddenTabs[id];
				}else{
					hiddenCount += 1 - (this.state.hiddenTabs[id] || 0);
					this.state.hiddenTabs[id] = true;
					delete this.state.selection[id];
				}
			}
		}
		this.state.hiddenCount = hiddenCount;
		this.state.searchLen = searchLen;
		var matches = Object.keys(this.state.selection).length;
		var matchtext = "";
		if(matches == 0 && searchLen > 0) {
			this.setState({
				topText : "No matches for '" + e.target.value + "'",
				bottomText : ""
			});
		} else if(matches == 0) {
			this.setState({
				topText : "",
				bottomText : ""
			});
		} else if(matches > 1) {
			this.setState({
				topText : Object.keys(this.state.selection).length + " matches for '" + e.target.value + "'",
				bottomText : "Press enter to move them to a new window"
			});
		}else if(matches == 1){
			this.setState({
				topText : Object.keys(this.state.selection).length + " match for '" + e.target.value + "'",
				bottomText : "Press enter to switch to the tab"
			});
		}
		this.forceUpdate();
	},
	checkKey:function(e){
		if(e.keyCode == 13) this.addWindow();
		// any typed keys
		if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 186 && e.keyCode <= 192) || (e.keyCode >= 219 && e.keyCode <= 22) || e.keyCode == 8 || e.keyCode == 46 || e.keyCode == 32) {
			if(document.activeElement != this.refs.searchbox) this.refs.searchbox.focus();
		}
		// arrow keys
		if(e.keyCode >= 37 && e.keyCode <= 40) {
			if(document.activeElement != this.refs.windowcontainer && document.activeElement != this.refs.searchbox) {
				this.refs.windowcontainer.focus();
			}
		}
		// page up / page down
		if(e.keyCode == 33 || e.keyCode == 34) {
			if(document.activeElement != this.refs.windowcontainer) {
				this.refs.windowcontainer.focus();
			}
		}
		this.forceUpdate();
	},
	changelayout:function(){
		if(this.state.layout == "blocks"){
			localStorage["layout"] = this.state.layout = "blocks-big";
		}else if(this.state.layout == "blocks-big"){
			localStorage["layout"] = this.state.layout = "horizontal";
		}else if(this.state.layout == "horizontal"){
			localStorage["layout"] = this.state.layout = "vertical";
		}else{
			localStorage["layout"] = this.state.layout = "blocks";
		}
		this.setState({ topText : "Switched to " + this.readablelayout(this.state.layout) + " view" });
		this.setState({ bottomText : " " });
		this.forceUpdate();
	},
	nextlayout:function(){
		if(this.state.layout == "blocks"){
			return "blocks-big";
		}else if(this.state.layout == "blocks-big"){
			return "horizontal";
		}else if(this.state.layout == "horizontal"){
			return "vertical";
		}else{
			return "blocks";
		}
	},
	readablelayout:function(layout){
		if(layout == "blocks"){
			return "Block";
		}else if(layout == "blocks-big"){
			return "Big Block";
		}else if(layout == "horizontal"){
			return "Horizontal";
		}else{
			return "Vertical";
		}
	},
	select:function(id){
		if(this.state.selection[id]){
			delete this.state.selection[id];
		}else{
			this.state.selection[id] = true;
		}
		var selected = Object.keys(this.state.selection).length;
		if(selected == 0) {
			this.setState({
				topText : "No tabs selected",
				bottomText : " "
			});
		}else if(selected == 1){
			this.setState({
				topText : "Selected " + selected + " tab",
				bottomText : "Press enter to switch to it"
			});
		}else{
			this.setState({
				topText : "Selected " + selected + " tabs",
				bottomText : "Press enter to move them to a new window"
			});
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
		var tab = this.state.tabsbyid[id];
		var tabs = Object.keys(this.state.selection).map(id => this.state.tabsbyid[id]);
		var index = tab.index+(before?0:1);

		for(var i = 0; i < tabs.length; i++){
			(function(t){
				chrome.tabs.move(t.id,{windowId:tab.windowId,index:index},function(){
					chrome.tabs.update(t.id,{pinned:t.pinned});
				});
			})(tabs[i]);
		}
		this.state.selection = {};
	},
	dropWindow:function(windowId){
		var tabs = Object.keys(this.state.selection).map(id => this.state.tabsbyid[id]);
		for(var i = 0; i < tabs.length; i++){
			(function(t,windowId){
				chrome.tabs.move(t.id,{windowId:windowId, index:-1},function(){
					chrome.tabs.update(t.id,{pinned:t.pinned});
				});
			})(tabs[i],windowId);
		}
		this.state.selection = {};
	},
	changeTabLimit:function(e){
		this.state.tabLimit = e.target.value;
		localStorage["tabLimit"] = JSON.stringify(this.state.tabLimit)
		this.tabLimitText();
		this.forceUpdate();
	},
	tabLimitText:function(){
		this.setState({
			bottomText : "Limit the number of tabs per window. Will move new tabs into a new window instead. 0 to turn off"
		});
	},
	toggleAnimations:function(){
		this.state.animations = !this.state.animations;
		localStorage["animations"] = this.state.animations? "1" : "0"
		this.animationsText();
		this.forceUpdate();
	},
	animationsText:function(){
		this.setState({
			bottomText : "Enables/disables animations. Default : on"
		});
	},
	toggleCompact:function(){
		this.state.compact = !this.state.compact;
		localStorage["compact"] = this.state.compact? "1" : "0"
		this.compactText();
		this.forceUpdate();
	},
	compactText:function(){
		this.setState({
			bottomText : "Compact mode is a more compressed layout. Default : off"
		});
	},
	toggleTabActions:function(){
		this.state.tabactions = !this.state.tabactions;
		localStorage["tabactions"] = this.state.tabactions? "1" : "0"
		this.tabActionsText();
		this.forceUpdate();
	},
	tabActionsText:function(){
		this.setState({
			bottomText : "Adds 'Open a new tab' and 'Close this window' option to each window. Default : on"
		});
	},
	toggleBadge:function(){
		this.state.badge = !this.state.badge;
		localStorage["badge"] = this.state.badge? "1" : "0"
		this.badgeText();
		chrome.runtime.getBackgroundPage(function callback(backgroundPage) {
			backgroundPage.updateTabCount();
		});
		this.forceUpdate();
	},
	badgeText:function(){
		this.setState({
			bottomText : "Shows the number of open tabs on the Tab Manager icon. Default : on"
		});
	},
	toggleFilterMismatchedTabs:function(){
		this.state.filterTabs = !this.state.filterTabs;
		localStorage["filter-tabs"] = this.state.filterTabs? "1" : "0"
		this.forceUpdate();
	},
	getTip:function(){
		var tips = [
			"You can right click on a tab to select it",
			"Press enter to move all selected tabs to a new window",
			"Middle click to close a tab",
			"Tab Manager Plus loves saving time",
			"To see incognito tabs, enable incognito access in the extension settings",
			"You can drag and drop tabs to other windows"
		];
		return "Tip: " + tips[Math.floor(Math.random()*tips.length)];
	},
	toBoolean: function (str) {
		if (typeof str === 'undefined' || str === null) {
			return false;
		} else if (typeof str === 'string') {
			switch (str.toLowerCase()) {
			case 'false':
			case 'no':
			case '0':
			case "":
				return false;
			default:
				return true;
			}
		} else if (typeof str === 'number') {
			return str !== 0
		}
		else {return true;}
	},
	localStorageAvailable: function(){
		var test = 'test';
		try {
			localStorage.setItem(test, test);
			localStorage.removeItem(test);
			return true;
		} catch(e) {
			return false;
		}
	},
	isInViewport: function(element, ofElement) {
		var rect = element.getBoundingClientRect();
		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= (ofElement.height) &&
			rect.right <= (ofElement.width)
		);
	},
	elVisible: function( elem ) {
	    if (!(elem instanceof Element)) throw Error('DomUtil: elem is not an element.');
	    const style = getComputedStyle(elem);
	    if (style.display === 'none') return false;
	    if (style.visibility !== 'visible') return false;
	    if (style.opacity < 0.1) return false;
	    if (elem.offsetWidth + elem.offsetHeight + elem.getBoundingClientRect().height +
	        elem.getBoundingClientRect().width === 0) {
	        return false;
	    }
	    const elemCenter   = {
	        x: elem.getBoundingClientRect().left + elem.offsetWidth / 2,
	        y: elem.getBoundingClientRect().top + elem.offsetHeight / 2
	    };
	    if (elemCenter.x < 0) return false;
	    if (elemCenter.x > (document.documentElement.clientWidth || window.innerWidth)) return false;
	    if (elemCenter.y < 0) return false;
	    if (elemCenter.y > (document.documentElement.clientHeight || window.innerHeight)) return false;
	    let pointContainer = document.elementFromPoint(elemCenter.x, elemCenter.y);
	    do {
	        if (pointContainer === elem) return true;
	    } while (pointContainer = pointContainer.parentNode);
	    return false;
	}
}));
