function Window(w,t){
	var This = Div("window");				
	This.TabManager = t;
	This.ID = w.id;
	This.Window = w;
	for(var j = 0; j < w.tabs.length; j++){	
		if(j % 15 == 0 && j){
			This.appendChild(Div("newliner"));
		}				
		This.appendChild(Tab(w.tabs[j],This));
		
	}				
	var addtab = Div("icon windowaction add");
	var closewindow = Div("icon windowaction close");				
	This.appendChild(closewindow);
	This.appendChild(addtab);
	
	addtab.on("click",function(){
		chrome.tabs.create({windowId:w.id,},function(){
			This.TabManager.Restart();
		});
	});
	
	closewindow.on("click",function(){
		chrome.windows.remove(w.id,function(){
			This.TabManager.Restart();
		});
	});
	return This;
}
