"use strict";var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();function _asyncToGenerator(fn) {return function () {var gen = fn.apply(this, arguments);return new Promise(function (resolve, reject) {function step(key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {return Promise.resolve(value).then(function (value) {step("next", value);}, function (err) {step("throw", err);});}}return step("next");});};}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self, call) {if (!self) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call && (typeof call === "object" || typeof call === "function") ? call : self;}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;}var

Tab = function (_React$Component) {_inherits(Tab, _React$Component);
	function Tab(props) {_classCallCheck(this, Tab);var _this = _possibleConstructorReturn(this, (Tab.__proto__ || Object.getPrototypeOf(Tab)).call(this,
		props));
		_this.state = {
			favIcon: "" };


		_this.onHover = _this.onHover.bind(_this);
		_this.onMouseDown = _this.onMouseDown.bind(_this);
		_this.click = _this.click.bind(_this);
		_this.dragStart = _this.dragStart.bind(_this);
		_this.dragOver = _this.dragOver.bind(_this);
		_this.dragOut = _this.dragOut.bind(_this);
		_this.drop = _this.drop.bind(_this);
		_this.resolveFavIconUrl = _this.resolveFavIconUrl.bind(_this);return _this;

	}_createClass(Tab, [{ key: "componentWillMount", value: function componentWillMount()
		{
			this.resolveFavIconUrl();
		} }, { key: "render", value: function render()
		{
			var children = [];
			if (this.props.layout == "vertical") {
				children.push(
				React.createElement("div", { key: "tab-pinned-" + this.props.tab.id, className: "tab-pinned " + (!this.props.tab.pinned ? "hidden" : "") }, "Pinned"));



				children.push(
				React.createElement("div", { key: "tab-highlighted-" + this.props.tab.id, className: "tab-highlighted " + (!this.props.tab.highlighted ? "hidden" : "") }, "Active"));



				children.push(
				React.createElement("div", { key: "tab-selected-" + this.props.tab.id, className: "tab-selected " + (!this.props.selected ? "hidden" : "") }, "Selected"));



				children.push(
				React.createElement("div", {
					key: "tab-icon-" + this.props.tab.id,
					className: "iconoverlay ",
					style: {
						backgroundImage: this.state.favIcon } }));



				children.push(
				React.createElement("div", { key: "tab-title-" + this.props.tab.id, className: "tabtitle" },
					this.props.tab.title));


			}

			var tabDom = {
				className:
				"icon tab " + (
				this.props.selected ? "selected " : "") + (
				this.props.tab.pinned ? "pinned " : "") + (
				this.props.tab.highlighted ? "highlighted " : "") + (
				this.props.hidden ? "hidden " : "") + (
				this.props.tab.mutedInfo && this.props.tab.mutedInfo.muted ? "muted " : "") + (
				this.props.tab.audible ? "audible " : "") + (
				this.props.tab.discarded ? "discarded " : "") + (
				this.props.layout == "vertical" ? "full " : "") + (
				this.props.tab.incognito ? "incognito " : "") + (
				this.state.draggingOver || "") + (
				this.props.searchActive ? "search-active " : "") +
				" tab-" +
				this.props.tab.id +
				" " + (
				this.props.layout == "vertical" ? "vertical " : "blocks "),
				style:
				this.props.layout == "vertical" ?
				{} :
				{ backgroundImage: this.state.favIcon },


				id: this.props.id,
				title: this.props.tab.title,
				onClick: this.click,
				onMouseDown: this.onMouseDown,
				onMouseEnter: this.onHover };


			if (!!this.props.drag) {
				tabDom["onDragStart"] = this.dragStart;
				tabDom["onDragOver"] = this.dragOver;
				tabDom["onDragLeave"] = this.dragOut;
				tabDom["onDrop"] = this.drop;
				tabDom["draggable"] = "true";
			}

			return (
				React.createElement("div", tabDom,
					children,
					React.createElement("div", { className: "limiter" })));


		} }, { key: "onHover", value: function onHover(
		e) {
			this.props.hoverHandler(this.props.tab);
			this.resolveFavIconUrl();
		} }, { key: "onMouseDown", value: function onMouseDown(
		e) {
			if (e.button === 0) return;
			if (!this.props.drag) return;
			this.click(e);
		} }, { key: "click", value: function () {var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(
			e) {var tabId, windowId, backgroundPage;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:if (
								this.props.drag) {_context.next = 2;break;}return _context.abrupt("return");case 2:
								this.stopProp(e);

								tabId = this.props.tab.id;
								windowId = this.props.window.id;if (!(

								e.button === 1)) {_context.next = 9;break;}
								this.props.middleClick(tabId);_context.next = 19;break;case 9:if (!(
								e.button === 2 || e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)) {_context.next = 14;break;}
								e.preventDefault();
								if (e.button === 2 && (e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)) {
									this.props.selectTo(tabId);
								} else {
									this.props.select(tabId);
								}_context.next = 19;break;case 14:_context.next = 16;return (

									browser.runtime.getBackgroundPage());case 16:backgroundPage = _context.sent;
								if (navigator.userAgent.search("Firefox") > -1) {
									backgroundPage.focusOnTabAndWindowDelayed({ id: tabId, windowId: windowId });
								} else {
									backgroundPage.focusOnTabAndWindow({ id: tabId, windowId: windowId });
								}
								if (!!window.inPopup) window.close();case 19:return _context.abrupt("return",

								false);case 20:case "end":return _context.stop();}}}, _callee, this);}));function click(_x) {return _ref.apply(this, arguments);}return click;}() }, { key: "dragStart", value: function dragStart(

		e) {
			if (!!this.props.drag) {
				e.dataTransfer.setData("Text", this.props.tab.id);
				e.dataTransfer.setData("text/uri-list", this.props.tab.url);
				this.props.drag(e, this.props.tab.id);
			} else {
				return false;
			}
		} }, { key: "dragOver", value: function dragOver(
		e) {
			this.stopProp(e);
			if (!this.props.drag) return;
			var before = this.state.draggingOver;
			if (this.props.layout == "vertical") {
				this.state.draggingOver = e.nativeEvent.offsetY > ReactDOM.findDOMNode(this).clientHeight / 2 ? "bottom" : "top";
			} else {
				this.state.draggingOver = e.nativeEvent.offsetX > ReactDOM.findDOMNode(this).clientWidth / 2 ? "right" : "left";
			}
			if (before != this.state.draggingOver) this.forceUpdate();
		} }, { key: "dragOut", value: function dragOut()
		{
			if (!this.props.drag) return;
			delete this.state.draggingOver;
			this.forceUpdate();
		} }, { key: "drop", value: function drop(
		e) {
			if (!!this.props.drop) {
				this.stopProp(e);
				var before = this.state.draggingOver == "top" || this.state.draggingOver == "left";
				delete this.state.draggingOver;
				this.props.drop(this.props.tab.id, before);
			} else {
				return false;
			}
		} }, { key: "resolveFavIconUrl", value: function () {var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {var image, favIcons, iconName;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:


								// firefox screenshots; needs <all_urls>
								// if(!!browser.tabs.captureTab) {
								// 	console.log("tabs captureTab");
								// 	image = await browser.tabs.captureTab(this.props.tab.id);
								// 	image = "url(" + image + ")";
								// }else
								if (this.props.tab.url.indexOf("chrome://") !== 0 && this.props.tab.url.indexOf("about:") !== 0) {
									// chrome screenshots / only for active tabs; needs <all_urls>
									// if(!!browser.tabs.captureVisibleTab && this.props.tab.highlighted) {
									// 	console.log("tabsCapture");
									// 	try {
									// 		image = await browser.tabs.captureVisibleTab( this.props.window.id, {} );
									// 		//console.log(image);
									// 	} catch ( e ) {
									// 		console.log(e.message);
									// 	}
									// 	image = "url(" + image + ")";
									// }else{
									image = this.props.tab.favIconUrl ? "url(" + this.props.tab.favIconUrl + ")" : "";
									//}
								} else {
									favIcons = ["bookmarks", "chrome", "crashes", "downloads", "extensions", "flags", "history", "settings"];
									iconName = this.props.tab.url.slice(9).match(/^\w+/g);
									image = !iconName || favIcons.indexOf(iconName[0]) < 0 ? "" : "url(../images/chrome/" + iconName[0] + ".png)";
								}
								this.setState({
									favIcon: image });case 2:case "end":return _context2.stop();}}}, _callee2, this);}));function resolveFavIconUrl() {return _ref2.apply(this, arguments);}return resolveFavIconUrl;}() }, { key: "stopProp", value: function stopProp(


		e) {
			if (e && e.nativeEvent) {
				e.nativeEvent.preventDefault();
				e.nativeEvent.stopPropagation();
			}
			if (e && e.preventDefault) {
				e.preventDefault();
				e.stopPropagation();
			}
		} }]);return Tab;}(React.Component);