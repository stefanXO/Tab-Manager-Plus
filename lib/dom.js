function Tag(type,cls,content){
	var tag = document.createElement(type);
	if(cls){
		tag.className = cls;
	}
	if(content){
		if(typeof content == "string"){
			tag.innerHTML = content;
		}else{
			for(var i = 2; i < arguments.length; i++){
				tag.appendChild(arguments[i]);
			}
		}
	}
	tag.on = function(){
		var tag = this;
		var args = arguments;
		function remove(){
			for(var i = 0; i < args.length-1; i++){
				tag.removeEventListener(args[i],cb);
			}
		}
		function cb(e){
			args[args.length-1].call(tag,e,remove);
		}
		for(var i = 0; i < args.length-1; i++){
			tag.addEventListener(args[i],cb);
		}							
		return remove;
	}
	tag.addClass = function(cls){
		var classes = this.className.split(" ");
		for(var i = 0; i < classes.length; i++){
			if(classes[i] == cls){
				return;
			}
		}
		classes.push(cls);
		this.className = classes.join(" ");
	}
	tag.removeClass = function(cls){
		var classes = this.className.split(" ");
		for(var i = 0; i < classes.length; i++){
			if(classes[i] == cls){
				classes.splice(i,1);
			}
		}
		this.className = classes.join(" ");
	}
	tag.hasClass = function(cls){
		var classes = this.className.split(" ");
		for(var i = 0; i < classes.length; i++){
			if(classes[i] == cls){
				return true;
			}
		}
		return false;
	}
	tag.toggleClass = function(cls){
		(this.hasClass(cls)?this.removeClass:this.addClass)(cls);			
	}
	tag.swapClass = function(before,after){
		this.removeClass(before);
		this.addClass(after);
	}
	return tag;
}
function Div(cls,content){
	var args = ["div"];
	for(var i = 0; i < arguments.length; i++){
		args.push(arguments[i]);
	}
	return Tag.apply(this,args);
}
function Ipt(type,cls, value){
	var args = ["input",cls];
	var tag = Tag.apply(this,args);
	tag.setAttribute("type",type);
	if(value){
		tag.value = value;
	}
	return tag;
}
function Txt(cls,value){
	var args = ["text",cls,value];
	return Ipt.apply(this,args);
}
function Btn(value,cls){
	var args = ["button",cls,value];
	return Ipt.apply(this,args);
}
function Sel(cls,options){
	var args = ["select",cls];
	var tag = Tag.apply(this,args);				
	if(!options){
		options = {};
	}
	
	for(var a in options){
		var o = Tag("option",0,options[a]);
		o.value = a;
		tag.appendChild(o);						
	}
	
	return tag;
}