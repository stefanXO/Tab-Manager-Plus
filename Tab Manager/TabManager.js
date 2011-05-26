function TabManager(){
	var This = Div();
	This.Dragging = false;
	This.LastClicked = null;
	This.Restart = function(){
		This.innerHTML = "";
		chrome.windows.getAll({populate:true},function(windows){
			for(var i = 0; i < windows.length; i++){
				This.appendChild(Window(windows[i],This));
			}
			var addwindow;
			var deletetabs;
			var pintabs;
			var search;
			This.appendChild(
				Div("window",
					search = Txt(),
					deletetabs = Div("icon windowaction trash"),
					pintabs = Div("icon windowaction pin"),
					addwindow = Div("icon windowaction new")
				)
			);
			search.focus();
			search.select();
			
			deletetabs.on("click",function(){
				var tabs = This.getElementsByClassName("tab selected");
				if(tabs.length){
					var t = [];
					for(var i = 0; i < tabs.length; i++){
						t.push(tabs[i].Tab);
					}
					chrome.extension.sendRequest({action:"delete",tabs:t},function(){
						This.Restart();
					});
				}else{
					chrome.windows.getCurrent(function(w){
						console.log(w);
						chrome.tabs.getSelected(w.id,function(t){
							chrome.tabs.remove(t.id,This.Restart);
						});
					});
				}
			});
			addwindow.on("click",function(){
				var tabs = This.getElementsByClassName("tab selected");
				var t = [];
				for(var i = 0; i < tabs.length; i++){
					t.push(tabs[i].Tab);
				}							
				chrome.extension.sendRequest({action:"new",tabs:t},function(){
					This.Restart();
				});
			});
			pintabs.on("click",function(){
				var tabs = This.getElementsByClassName("tab selected");
				if(tabs.length ){
					for(var i = 0; i < tabs.length; i++){
						chrome.tabs.update(tabs[i].ID,{pinned:!tabs[i].Pinned},This.Restart);
					}
				}else{
					chrome.windows.getCurrent(function(w){
						console.log(w);
						chrome.tabs.getSelected(w.id,function(t){
							chrome.tabs.update(t.id,{pinned:!t.pinned},This.Restart);
						});
					});
				}
			});
			
			search.on("keyup",function(){
				var tabs = This.getElementsByClassName("tab");
				for(var i = 0; i < tabs.length; i++){
					var tab = tabs[i];
					if((tab.Tab.title+tab.Tab.url).toLowerCase().indexOf(search.value.toLowerCase()) >= 0){
						tab.addClass("selected");
					}else{
						tab.removeClass("selected");
					}
				}
			});
		});					
	}
	This.Restart();
	
	return This;
}
