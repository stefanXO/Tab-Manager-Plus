function Tab(t,w){
	var limiter = Div("limiter");
	var This = Div("icon tab");

	This.Window = w;
	This.ID = t.id;
	This.Pinned = t.pinned;
	This.Tab = t;
	if(t.favIconUrl){
		This.style.backgroundImage = "url("+t.favIconUrl+")";
	}
	This.title = t.title;
	if(This.Window.TabManager.Layout == "vertical"){
		This.style.paddingLeft = "20px";
		This.appendChild(Div("tabtitle",This.title));
	}
	if(t.incognito){
		This.addClass("incognito");
	}
	
	
	This.on("mousedown",function(e){
		
		var hadClass = This.hasClass("selected");
		This.addClass("selected");
		if(e.shiftKey && This.Window.TabManager.LastClicked){
			var tabs = This.Window.childNodes;
			tabs.indexOf = Array.prototype.indexOf;
			var i = tabs.indexOf(This.Window.TabManager.LastClicked);
			for(var d = i > tabs.indexOf(This)?-1:1; i >= 0 && i < tabs.length && tabs[i] != This; i += d){
				tabs[i].addClass("selected");
			}
		}
		This.Window.TabManager.LastClicked = This;
		
		var x = e.clientX;
		var y = e.clientY;
		
		var doubel = Div();
		doubel.style.position = "absolute";
		doubel.style.opacity = "0.0";
		document.body.appendChild(doubel);
		
		var tabs = This.Window.TabManager.getElementsByClassName("tab selected");
		for(var i = 0; i < tabs.length; i++){
			doubel.appendChild(tabs[i].cloneNode(true));
		}
		
		function onMouseMove(e){
			if(Math.abs(e.clientX-x) > 5 || Math.abs(e.clientY)-y > 5){
				This.Window.TabManager.Dragging = true;
				doubel.style.top = (e.clientY+10)+"px";
				doubel.style.left = (e.clientX+10)+"px";
				doubel.style.opacity = "0.5";
			}
		}
		function onMouseUp(e){
			document.body.removeChild(doubel);					
			document.removeEventListener("mousemove",onMouseMove);
			document.removeEventListener("mouseup",onMouseUp);
			
			
			console.log(This.Window);
			if(!This.Window.TabManager.Dragging){
				if(!e.ctrlKey && !e.shiftKey){
					var tabs = This.Window.TabManager.getElementsByClassName("tab selected");
					for(var i =0; i < tabs.length; i++){
						if(tabs[i] != This){
							tabs[i].removeClass("selected");
						}
					}
				}else{
					if(hadClass){
						This.removeClass("selected");
					}
				}
			}
			
			This.Window.TabManager.Dragging = false;
		}
		
		document.addEventListener("mousemove",onMouseMove);
		document.addEventListener("mouseup",onMouseUp);
		
	});
	
	This.on("mousemove",function(e){
		if(This.Window.TabManager.Dragging){
			if(e.clientX > This.offsetLeft+(This.clientWidth)){										
				This.swapClass("left","right");
			}else{
				This.swapClass("right","left");
			}
		}
	});

		
	This.on("mouseout","mouseup",function(){
		This.removeClass("left");
		This.removeClass("right");
	});
	
	This.on("mouseup",function(e){
		if(This.Window.TabManager.Dragging){
			var tabs = This.Window.TabManager.getElementsByClassName("tab selected");
			var index = This.Tab.index;
			if(This.hasClass("right")){
				index++;
			}
			var t = [];
			for(var i  = 0; i < tabs.length; i++){
				t.push(tabs[i].Tab);
			}
			chrome.extension.sendRequest({action:"move",tabs:t,index:index,windowId:This.Window.ID},function(){
				This.Window.TabManager.Restart();
			});		
		}else if(!e.shiftKey && !e.ctrlKey ){
			chrome.windows.update(This.Tab.windowId,{focused:true});			
			chrome.tabs.update(This.ID,{selected:true});			
		}
	});

			
	This.appendChild(limiter);
	
	return This;
}
