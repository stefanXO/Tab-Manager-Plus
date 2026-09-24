"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/webextension-polyfill/dist/browser-polyfill.js
  var require_browser_polyfill = __commonJS({
    "node_modules/webextension-polyfill/dist/browser-polyfill.js"(exports, module) {
      (function(global, factory) {
        if (typeof define === "function" && define.amd) {
          define("webextension-polyfill", ["module"], factory);
        } else if (typeof exports !== "undefined") {
          factory(module);
        } else {
          var mod = {
            exports: {}
          };
          factory(mod);
          global.browser = mod.exports;
        }
      })(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : exports, function(module2) {
        "use strict";
        if (!(globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.runtime.id)) {
          throw new Error("This script should only be loaded in a browser extension.");
        }
        if (!(globalThis.browser && globalThis.browser.runtime && globalThis.browser.runtime.id)) {
          const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
          const wrapAPIs = (extensionAPIs) => {
            const apiMetadata = {
              "alarms": {
                "clear": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "clearAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "get": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "bookmarks": {
                "create": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getChildren": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getRecent": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getSubTree": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getTree": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "move": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeTree": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "search": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              },
              "browserAction": {
                "disable": {
                  "minArgs": 0,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "enable": {
                  "minArgs": 0,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "getBadgeBackgroundColor": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getBadgeText": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getPopup": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getTitle": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "openPopup": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "setBadgeBackgroundColor": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setBadgeText": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setIcon": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "setPopup": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setTitle": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                }
              },
              "browsingData": {
                "remove": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "removeCache": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeCookies": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeDownloads": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeFormData": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeHistory": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeLocalStorage": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removePasswords": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removePluginData": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "settings": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "commands": {
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "contextMenus": {
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              },
              "cookies": {
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAllCookieStores": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "set": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "devtools": {
                "inspectedWindow": {
                  "eval": {
                    "minArgs": 1,
                    "maxArgs": 2,
                    "singleCallbackArg": false
                  }
                },
                "panels": {
                  "create": {
                    "minArgs": 3,
                    "maxArgs": 3,
                    "singleCallbackArg": true
                  },
                  "elements": {
                    "createSidebarPane": {
                      "minArgs": 1,
                      "maxArgs": 1
                    }
                  }
                }
              },
              "downloads": {
                "cancel": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "download": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "erase": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getFileIcon": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "open": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "pause": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeFile": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "resume": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "search": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "show": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                }
              },
              "extension": {
                "isAllowedFileSchemeAccess": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "isAllowedIncognitoAccess": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "history": {
                "addUrl": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "deleteAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "deleteRange": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "deleteUrl": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getVisits": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "search": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "i18n": {
                "detectLanguage": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAcceptLanguages": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "identity": {
                "launchWebAuthFlow": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "idle": {
                "queryState": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "management": {
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getSelf": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "setEnabled": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "uninstallSelf": {
                  "minArgs": 0,
                  "maxArgs": 1
                }
              },
              "notifications": {
                "clear": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "create": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getPermissionLevel": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              },
              "pageAction": {
                "getPopup": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getTitle": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "hide": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setIcon": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "setPopup": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setTitle": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "show": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                }
              },
              "permissions": {
                "contains": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "request": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "runtime": {
                "getBackgroundPage": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getPlatformInfo": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "openOptionsPage": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "requestUpdateCheck": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "sendMessage": {
                  "minArgs": 1,
                  "maxArgs": 3
                },
                "sendNativeMessage": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "setUninstallURL": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "sessions": {
                "getDevices": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getRecentlyClosed": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "restore": {
                  "minArgs": 0,
                  "maxArgs": 1
                }
              },
              "storage": {
                "local": {
                  "clear": {
                    "minArgs": 0,
                    "maxArgs": 0
                  },
                  "get": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "getBytesInUse": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "remove": {
                    "minArgs": 1,
                    "maxArgs": 1
                  },
                  "set": {
                    "minArgs": 1,
                    "maxArgs": 1
                  }
                },
                "managed": {
                  "get": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "getBytesInUse": {
                    "minArgs": 0,
                    "maxArgs": 1
                  }
                },
                "sync": {
                  "clear": {
                    "minArgs": 0,
                    "maxArgs": 0
                  },
                  "get": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "getBytesInUse": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "remove": {
                    "minArgs": 1,
                    "maxArgs": 1
                  },
                  "set": {
                    "minArgs": 1,
                    "maxArgs": 1
                  }
                }
              },
              "tabs": {
                "captureVisibleTab": {
                  "minArgs": 0,
                  "maxArgs": 2
                },
                "create": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "detectLanguage": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "discard": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "duplicate": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "executeScript": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getCurrent": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getZoom": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getZoomSettings": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "goBack": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "goForward": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "highlight": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "insertCSS": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "move": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "query": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "reload": {
                  "minArgs": 0,
                  "maxArgs": 2
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeCSS": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "sendMessage": {
                  "minArgs": 2,
                  "maxArgs": 3
                },
                "setZoom": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "setZoomSettings": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "update": {
                  "minArgs": 1,
                  "maxArgs": 2
                }
              },
              "topSites": {
                "get": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "webNavigation": {
                "getAllFrames": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getFrame": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "webRequest": {
                "handlerBehaviorChanged": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "windows": {
                "create": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "get": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getCurrent": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getLastFocused": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              }
            };
            if (Object.keys(apiMetadata).length === 0) {
              throw new Error("api-metadata.json has not been included in browser-polyfill");
            }
            class DefaultWeakMap extends WeakMap {
              constructor(createItem, items = void 0) {
                super(items);
                this.createItem = createItem;
              }
              get(key) {
                if (!this.has(key)) {
                  this.set(key, this.createItem(key));
                }
                return super.get(key);
              }
            }
            const isThenable = (value) => {
              return value && typeof value === "object" && typeof value.then === "function";
            };
            const makeCallback = (promise, metadata) => {
              return (...callbackArgs) => {
                if (extensionAPIs.runtime.lastError) {
                  promise.reject(new Error(extensionAPIs.runtime.lastError.message));
                } else if (metadata.singleCallbackArg || callbackArgs.length <= 1 && metadata.singleCallbackArg !== false) {
                  promise.resolve(callbackArgs[0]);
                } else {
                  promise.resolve(callbackArgs);
                }
              };
            };
            const pluralizeArguments = (numArgs) => numArgs == 1 ? "argument" : "arguments";
            const wrapAsyncFunction = (name, metadata) => {
              return function asyncFunctionWrapper(target, ...args) {
                if (args.length < metadata.minArgs) {
                  throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
                }
                if (args.length > metadata.maxArgs) {
                  throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
                }
                return new Promise((resolve, reject) => {
                  if (metadata.fallbackToNoCallback) {
                    try {
                      target[name](...args, makeCallback({
                        resolve,
                        reject
                      }, metadata));
                    } catch (cbError) {
                      console.warn(`${name} API method doesn't seem to support the callback parameter, falling back to call it without a callback: `, cbError);
                      target[name](...args);
                      metadata.fallbackToNoCallback = false;
                      metadata.noCallback = true;
                      resolve();
                    }
                  } else if (metadata.noCallback) {
                    target[name](...args);
                    resolve();
                  } else {
                    target[name](...args, makeCallback({
                      resolve,
                      reject
                    }, metadata));
                  }
                });
              };
            };
            const wrapMethod = (target, method, wrapper) => {
              return new Proxy(method, {
                apply(targetMethod, thisObj, args) {
                  return wrapper.call(thisObj, target, ...args);
                }
              });
            };
            let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
            const wrapObject = (target, wrappers = {}, metadata = {}) => {
              let cache = /* @__PURE__ */ Object.create(null);
              let handlers = {
                has(proxyTarget2, prop) {
                  return prop in target || prop in cache;
                },
                get(proxyTarget2, prop, receiver) {
                  if (prop in cache) {
                    return cache[prop];
                  }
                  if (!(prop in target)) {
                    return void 0;
                  }
                  let value = target[prop];
                  if (typeof value === "function") {
                    if (typeof wrappers[prop] === "function") {
                      value = wrapMethod(target, target[prop], wrappers[prop]);
                    } else if (hasOwnProperty(metadata, prop)) {
                      let wrapper = wrapAsyncFunction(prop, metadata[prop]);
                      value = wrapMethod(target, target[prop], wrapper);
                    } else {
                      value = value.bind(target);
                    }
                  } else if (typeof value === "object" && value !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) {
                    value = wrapObject(value, wrappers[prop], metadata[prop]);
                  } else if (hasOwnProperty(metadata, "*")) {
                    value = wrapObject(value, wrappers[prop], metadata["*"]);
                  } else {
                    Object.defineProperty(cache, prop, {
                      configurable: true,
                      enumerable: true,
                      get() {
                        return target[prop];
                      },
                      set(value2) {
                        target[prop] = value2;
                      }
                    });
                    return value;
                  }
                  cache[prop] = value;
                  return value;
                },
                set(proxyTarget2, prop, value, receiver) {
                  if (prop in cache) {
                    cache[prop] = value;
                  } else {
                    target[prop] = value;
                  }
                  return true;
                },
                defineProperty(proxyTarget2, prop, desc) {
                  return Reflect.defineProperty(cache, prop, desc);
                },
                deleteProperty(proxyTarget2, prop) {
                  return Reflect.deleteProperty(cache, prop);
                }
              };
              let proxyTarget = Object.create(target);
              return new Proxy(proxyTarget, handlers);
            };
            const wrapEvent = (wrapperMap) => ({
              addListener(target, listener, ...args) {
                target.addListener(wrapperMap.get(listener), ...args);
              },
              hasListener(target, listener) {
                return target.hasListener(wrapperMap.get(listener));
              },
              removeListener(target, listener) {
                target.removeListener(wrapperMap.get(listener));
              }
            });
            const onRequestFinishedWrappers = new DefaultWeakMap((listener) => {
              if (typeof listener !== "function") {
                return listener;
              }
              return function onRequestFinished(req) {
                const wrappedReq = wrapObject(req, {}, {
                  getContent: {
                    minArgs: 0,
                    maxArgs: 0
                  }
                });
                listener(wrappedReq);
              };
            });
            const onMessageWrappers = new DefaultWeakMap((listener) => {
              if (typeof listener !== "function") {
                return listener;
              }
              return function onMessage(message, sender, sendResponse) {
                let didCallSendResponse = false;
                let wrappedSendResponse;
                let sendResponsePromise = new Promise((resolve) => {
                  wrappedSendResponse = function(response) {
                    didCallSendResponse = true;
                    resolve(response);
                  };
                });
                let result;
                try {
                  result = listener(message, sender, wrappedSendResponse);
                } catch (err) {
                  result = Promise.reject(err);
                }
                const isResultThenable = result !== true && isThenable(result);
                if (result !== true && !isResultThenable && !didCallSendResponse) {
                  return false;
                }
                const sendPromisedResult = (promise) => {
                  promise.then((msg) => {
                    sendResponse(msg);
                  }, (error) => {
                    let message2;
                    if (error && (error instanceof Error || typeof error.message === "string")) {
                      message2 = error.message;
                    } else {
                      message2 = "An unexpected error occurred";
                    }
                    sendResponse({
                      __mozWebExtensionPolyfillReject__: true,
                      message: message2
                    });
                  }).catch((err) => {
                    console.error("Failed to send onMessage rejected reply", err);
                  });
                };
                if (isResultThenable) {
                  sendPromisedResult(result);
                } else {
                  sendPromisedResult(sendResponsePromise);
                }
                return true;
              };
            });
            const wrappedSendMessageCallback = ({
              reject,
              resolve
            }, reply) => {
              if (extensionAPIs.runtime.lastError) {
                if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
                  resolve();
                } else {
                  reject(new Error(extensionAPIs.runtime.lastError.message));
                }
              } else if (reply && reply.__mozWebExtensionPolyfillReject__) {
                reject(new Error(reply.message));
              } else {
                resolve(reply);
              }
            };
            const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args) => {
              if (args.length < metadata.minArgs) {
                throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
              }
              if (args.length > metadata.maxArgs) {
                throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
              }
              return new Promise((resolve, reject) => {
                const wrappedCb = wrappedSendMessageCallback.bind(null, {
                  resolve,
                  reject
                });
                args.push(wrappedCb);
                apiNamespaceObj.sendMessage(...args);
              });
            };
            const staticWrappers = {
              devtools: {
                network: {
                  onRequestFinished: wrapEvent(onRequestFinishedWrappers)
                }
              },
              runtime: {
                onMessage: wrapEvent(onMessageWrappers),
                onMessageExternal: wrapEvent(onMessageWrappers),
                sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                  minArgs: 1,
                  maxArgs: 3
                })
              },
              tabs: {
                sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                  minArgs: 2,
                  maxArgs: 3
                })
              }
            };
            const settingMetadata = {
              clear: {
                minArgs: 1,
                maxArgs: 1
              },
              get: {
                minArgs: 1,
                maxArgs: 1
              },
              set: {
                minArgs: 1,
                maxArgs: 1
              }
            };
            apiMetadata.privacy = {
              network: {
                "*": settingMetadata
              },
              services: {
                "*": settingMetadata
              },
              websites: {
                "*": settingMetadata
              }
            };
            return wrapObject(extensionAPIs, staticWrappers, apiMetadata);
          };
          module2.exports = wrapAPIs(chrome);
        } else {
          module2.exports = globalThis.browser;
        }
      });
    }
  });

  // src/helpers/storage.ts
  var browser = __toESM(require_browser_polyfill());
  async function getLocalStorage(key, default_value = null) {
    const result = await browser.storage.local.get([key]);
    return result[key] === void 0 ? default_value : result[key];
  }
  async function getLocalStorageMap(key) {
    const result = await browser.storage.local.get([key]);
    if (result[key] === void 0) {
      return /* @__PURE__ */ new Map();
    }
    let newMap = /* @__PURE__ */ new Map();
    let obj = result[key];
    for (const [k, v] of Object.entries(obj)) {
      let key2 = parseInt(k);
      newMap.set(key2, v);
    }
    return newMap;
  }
  async function setLocalStorage(key, value) {
    const obj = {};
    obj[key] = value;
    return browser.storage.local.set(obj);
  }
  async function setLocalStorageMap(key, value) {
    const obj = {};
    obj[key] = Object.fromEntries(value);
    return browser.storage.local.set(obj);
  }
  var queue = Promise.resolve();
  function serialized(fn) {
    const run = queue.then(fn, fn);
    queue = run.catch(function() {
    });
    return run;
  }

  // src/service_worker/context.ts
  var browser2 = __toESM(require_browser_polyfill());
  var globalTabsActive = [];
  var tabsActiveLoaded = (async function() {
    try {
      const stored = await browser2.storage.session.get({ globalTabsActive: [] });
      if (stored.globalTabsActive instanceof Array && globalTabsActive.length === 0) {
        globalTabsActive.push(...stored.globalTabsActive);
      }
    } catch (e) {
      console.error(e);
    }
  })();
  function persistTabsActive() {
    return browser2.storage.session.set({ globalTabsActive }).catch(function(e) {
      console.error(e);
    });
  }
  async function forgetTab(tabId) {
    await tabsActiveLoaded;
    let changed = false;
    for (let i = globalTabsActive.length - 1; i >= 0; i--) {
      if (globalTabsActive[i].tabId === tabId) {
        globalTabsActive.splice(i, 1);
        changed = true;
      }
    }
    if (changed) await persistTabsActive();
  }

  // src/strings/strings.ts
  var reload_popup_controls = "reload_popup_controls";
  var update_tab_count = "update_tab_count";
  var discard_tabs = "discard_tabs";
  var move_tabs_to_window = "move_tabs_to_window";
  var focus_on_tab_and_window = "focus_on_tab_and_window";
  var focus_on_tab_and_window_delayed = "focus_on_tab_and_window_delayed";
  var focus_on_window = "focus_on_window";
  var focus_on_window_delayed = "focus_on_window_delayed";
  var set_window_color = "set_window_color";
  var set_window_name = "set_window_name";
  var create_window_with_tabs = "create_window_with_tabs";
  var create_window_with_session_tabs = "create_window_with_session_tabs";
  var close_tabs = "close_tabs";
  var switch_to_previous_active_tab = "switch_to_previous_active_tab";
  var refresh_windows = "refresh_windows";
  var open_in_own_tab = "open_in_own_tab";
  var open_popup = "open_popup";
  var open_sidebar = "open_sidebar";
  var sep1 = "sep1";
  var support_menu = "support_menu";
  var review = "review";
  var donate = "donate";
  var patron = "patron";
  var twitter = "twitter";
  var code_menu = "code_menu";
  var changelog = "changelog";
  var options = "options";
  var source = "source";
  var report = "report";
  var send = "send";
  var windowHashes = "windowHashes";
  var windowOrphaned = "windowOrphaned";
  var windowColors = "windowColors";
  var windowNames = "windowNames";

  // src/helpers/utils.ts
  function debounce(func, wait, immediate = false) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function later2() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }
  function is_in_bounds(object, bounds) {
    var C = object, B = bounds;
    if (C.left >= B.left && C.left <= B.left + B.width) {
      if (C.top >= B.top && C.top <= B.top + B.height) {
        return true;
      }
    }
    return false;
  }
  function stringHashcode(string) {
    var hash = 0;
    for (var i = 0; i < string.length; i++) {
      var code = string.charCodeAt(i);
      hash = (hash << 5) - hash + code;
      hash = hash & hash;
    }
    return hash;
  }

  // src/service_worker/background/tracking.ts
  var browser3 = __toESM(require_browser_polyfill());
  var cleanupDebounce = debounce(cleanUp, 500);
  var ORPHAN_MAX_AGE = 24 * 60 * 60 * 1e3;
  async function forgetWindowIds() {
    await serialized(async function() {
      for (const key of [windowNames, windowColors, windowHashes, windowOrphaned]) {
        const map = await getLocalStorageMap(key);
        const moved = /* @__PURE__ */ new Map();
        for (const [id, value] of map) {
          moved.set(id > 0 ? -id : id, value);
        }
        await setLocalStorageMap(key, moved);
      }
    });
  }
  function cleanUp(remove_old = false) {
    return serialized(function() {
      return cleanUpLocked(remove_old);
    });
  }
  async function cleanUpLocked(remove_old) {
    const activewindows = await browser3.windows.getAll({ populate: true });
    const windowids = [];
    for (const _w of activewindows) {
      if (_w.id === void 0) continue;
      windowids.push(_w.id);
    }
    let windows7 = await getLocalStorage("windowAge", []);
    if (!(windows7 instanceof Array)) windows7 = [];
    let windowsChanged = false;
    for (let i = windows7.length - 1; i >= 0; i--) {
      if (windowids.indexOf(windows7[i]) < 0) {
        windows7.splice(i, 1);
        windowsChanged = true;
      }
    }
    if (windowsChanged) await setLocalStorage("windowAge", windows7);
    const names = await getLocalStorageMap(windowNames);
    const colors = await getLocalStorageMap(windowColors);
    const hashes = await getLocalStorageMap(windowHashes);
    const orphaned = await getLocalStorageMap(windowOrphaned);
    const to_check = /* @__PURE__ */ new Set();
    for (const id of names.keys()) {
      if (windowids.indexOf(id) < 0) to_check.add(id);
    }
    for (const id of colors.keys()) {
      if (windowids.indexOf(id) < 0) to_check.add(id);
    }
    let namesChanged = false, colorsChanged = false, hashesChanged = false, orphanedChanged = false;
    const to_refresh = [];
    if (to_check.size > 0) {
      for (const w of activewindows) {
        if (w.id === void 0) continue;
        if (names.has(w.id) || colors.has(w.id)) continue;
        const windowhash = hashcode(w);
        for (const [id, _hash] of hashes) {
          if (!to_check.has(id)) continue;
          if (_hash !== windowhash) continue;
          console.log("found by hash, old id " + id + " new id " + w.id);
          to_refresh.push(w.id);
          if (names.has(id)) {
            names.set(w.id, names.get(id));
            names.delete(id);
            namesChanged = true;
          }
          if (colors.has(id)) {
            colors.set(w.id, colors.get(id));
            colors.delete(id);
            colorsChanged = true;
          }
          hashes.set(w.id, _hash);
          hashes.delete(id);
          hashesChanged = true;
          to_check.delete(id);
          break;
        }
      }
    }
    const now = Date.now();
    for (const id of to_check) {
      if (!orphaned.has(id)) {
        orphaned.set(id, now);
        orphanedChanged = true;
      }
    }
    for (const id of orphaned.keys()) {
      if (!to_check.has(id)) {
        orphaned.delete(id);
        orphanedChanged = true;
      }
    }
    if (remove_old) {
      for (const id of to_check) {
        if (now - orphaned.get(id) < ORPHAN_MAX_AGE) continue;
        console.log("dropping window " + id + ", gone for over a day");
        if (names.delete(id)) namesChanged = true;
        if (colors.delete(id)) colorsChanged = true;
        if (hashes.delete(id)) hashesChanged = true;
        orphaned.delete(id);
        orphanedChanged = true;
      }
      for (const id of hashes.keys()) {
        if (windowids.indexOf(id) < 0 && !names.has(id) && !colors.has(id)) {
          hashes.delete(id);
          hashesChanged = true;
        }
      }
    }
    if (namesChanged) await setLocalStorageMap(windowNames, names);
    if (colorsChanged) await setLocalStorageMap(windowColors, colors);
    if (hashesChanged) await setLocalStorageMap(windowHashes, hashes);
    if (orphanedChanged) await setLocalStorageMap(windowOrphaned, orphaned);
    if (to_refresh.length > 0) notifyRefresh(to_refresh);
  }

  // src/service_worker/background/windows.ts
  var browser5 = __toESM(require_browser_polyfill());

  // src/helpers/browser.ts
  var browser4 = __toESM(require_browser_polyfill());
  function detectFirefox() {
    try {
      return browser4.runtime.getURL("").startsWith("moz-extension://");
    } catch {
      return navigator.userAgent.indexOf("Firefox") > -1;
    }
  }
  var IS_FIREFOX = detectFirefox();

  // src/service_worker/background/windows.ts
  function setupWindowListeners() {
    browser5.windows.onFocusChanged.removeListener(windowFocus);
    browser5.windows.onCreated.removeListener(windowCreated);
    browser5.windows.onRemoved.removeListener(windowRemoved);
    browser5.windows.onFocusChanged.addListener(windowFocus);
    browser5.windows.onCreated.addListener(windowCreated);
    browser5.windows.onRemoved.addListener(windowRemoved);
  }
  async function createWindowWithTabs(tabs5, isIncognito = false) {
    var pinnedIndex = 0;
    var firstTab = tabs5.shift();
    var t = [];
    for (const _tab of tabs5) {
      t.push(_tab.id);
    }
    var firstPinned = firstTab.pinned;
    var w = await browser5.windows.create({ tabId: firstTab.id, incognito: !!isIncognito });
    if (firstPinned) {
      await browser5.tabs.update(w.tabs[0].id, { pinned: firstPinned });
      pinnedIndex++;
    }
    if (t.length > 0) {
      var i = 0;
      for (let oldTabId of t) {
        i++;
        var oldTab = await browser5.tabs.get(oldTabId);
        var tabPinned = oldTab.pinned;
        var movedTabs = [];
        if (!tabPinned) {
          movedTabs = await browser5.tabs.move(oldTabId, { windowId: w.id, index: -1 });
        } else {
          movedTabs = await browser5.tabs.move(oldTabId, { windowId: w.id, index: pinnedIndex++ });
        }
        let firstTab2;
        if (Array.isArray(movedTabs)) {
          firstTab2 = movedTabs[0];
        } else {
          firstTab2 = movedTabs;
        }
        if (!!firstTab2) {
          if (tabPinned) {
            await browser5.tabs.update(firstTab2.id, { pinned: tabPinned });
          }
        }
      }
    }
    await browser5.windows.update(w.id, { focused: true });
  }
  async function createWindowWithSessionTabs(session, tabId) {
    var customName;
    if (session && session.name && session.customName) {
      customName = session.name;
    }
    var color = "default";
    if (session && session.color) {
      color = session.color;
    }
    var whitelistWindow = ["left", "top", "width", "height", "incognito", "type"];
    if (IS_FIREFOX) {
      whitelistWindow = ["left", "top", "width", "height", "incognito", "type"];
    }
    var whitelistTab = ["url", "active", "selected", "pinned", "index"];
    if (IS_FIREFOX) {
      whitelistTab = ["url", "active", "pinned", "index"];
    }
    var filteredWindow = Object.keys(session.windowsInfo).filter(function(key) {
      return whitelistWindow.includes(key);
    }).reduce(function(obj, key) {
      obj[key] = session.windowsInfo[key];
      return obj;
    }, {});
    if (filteredWindow.left < 0 || filteredWindow.left > 800) filteredWindow.left = 0;
    if (filteredWindow.top < 0 || filteredWindow.top > 600) filteredWindow.top = 0;
    if (filteredWindow.width > 800) filteredWindow.width = 800;
    if (filteredWindow.height > 600) filteredWindow.height = 600;
    filteredWindow.type = "normal";
    const newWindow = await browser5.windows.create(filteredWindow).catch(function(error) {
      console.error(error);
      console.log(error);
      console.log(error.message);
    });
    if (!newWindow) return void 0;
    let emptyTab = newWindow.tabs[0].id;
    for (let i = 0; i < session.tabs.length; i++) {
      let newTab = Object.keys(session.tabs[i]).filter(function(key) {
        return whitelistTab.includes(key);
      }).reduce(function(obj, key) {
        obj[key] = session.tabs[i][key];
        return obj;
      }, {});
      var fTab = newTab;
      if (tabId != null && tabId !== fTab.index) {
        continue;
      }
      fTab.windowId = newWindow.id;
      if (IS_FIREFOX) {
        if (!!fTab.url && fTab.url.search("about:") > -1) {
          console.log("filtered by about: url", fTab.url);
          fTab.url = "";
        }
      }
      try {
        await browser5.tabs.create(fTab).catch(function(error) {
          console.error(error);
          console.log(error);
          console.log(error.message);
        });
      } catch (e) {
        console.log("couldn't restore tab");
        console.error(e);
      }
    }
    await browser5.tabs.remove(emptyTab).catch(function(error) {
      console.error(error);
      console.log(error);
      console.log(error.message);
    });
    if (customName) {
      console.log("setting name");
      await setWindowName(newWindow.id, customName);
    }
    if (color !== "default") {
      console.log("setting color");
      await setWindowColor(newWindow.id, color);
    }
    await browser5.windows.update(newWindow.id, { focused: true });
    return newWindow.id;
  }
  function focusOnWindowDelayed(windowId) {
    setTimeout(() => focusOnWindow(windowId), 125);
  }
  async function focusOnWindow(windowId) {
    await browser5.windows.update(windowId, { focused: true });
  }
  async function hideWindows(windowId) {
    if (IS_FIREFOX) return;
    if (!windowId || windowId < 0) return;
    let hide_windows = await getLocalStorage("hideWindows", false);
    if (!hide_windows) return;
    let has_permission = await browser5.permissions.contains({ permissions: ["system.display"] });
    if (!has_permission) return;
    let displaylayouts = await chrome.system.display.getInfo();
    let monitor_bounds = [];
    try {
      for (let displaylayout of displaylayouts) {
        monitor_bounds.push(displaylayout.bounds);
      }
    } catch (err) {
      console.error(err);
      return;
    }
    let windows7 = await browser5.windows.getAll({ populate: true });
    let monitor = null;
    for (let window of windows7) {
      if (window.id === windowId) {
        for (let bounds_index in monitor_bounds) {
          let _monitor = monitor_bounds[bounds_index];
          let _is_in_bounds = is_in_bounds(window, _monitor);
          if (_is_in_bounds) {
            monitor = _monitor;
            break;
          }
        }
      }
    }
    if (monitor == null) return;
    for (let window of windows7) {
      if (window.id !== windowId) {
        if (is_in_bounds(window, monitor)) {
          await browser5.windows.update(window.id, { "state": "minimized" });
        }
      }
    }
  }
  async function windowActive(windowId) {
    if (windowId < 0) return;
    await serialized(async function() {
      var windows7 = [];
      var windowAge = await getLocalStorage("windowAge", []);
      if (windowAge instanceof Array) windows7 = windowAge;
      if (windows7.indexOf(windowId) > -1) windows7.splice(windows7.indexOf(windowId), 1);
      windows7.unshift(windowId);
      await setLocalStorage("windowAge", windows7);
    });
  }
  async function windowFocus(windowId) {
    try {
      if (!!windowId) {
        await windowActive(windowId);
        await hideWindows(windowId);
      }
    } catch (e) {
    }
  }
  async function windowCreated(window) {
    try {
      if (!!window && !!window.id) {
        await windowActive(window.id);
      }
    } catch (e) {
    }
    setTimeout(cleanupDebounce, 250);
  }
  async function windowRemoved(windowId) {
    try {
      if (!!windowId) {
        await windowInactive(windowId);
      }
    } catch (e) {
    }
  }
  async function windowInactive(windowId) {
    await serialized(async function() {
      var windows7 = [];
      var windowAge = await getLocalStorage("windowAge", []);
      if (windowAge instanceof Array) windows7 = windowAge;
      if (windows7.indexOf(windowId) > -1) {
        windows7.splice(windows7.indexOf(windowId), 1);
        await setLocalStorage("windowAge", windows7);
      }
    });
  }
  async function checkWindow(windowId) {
    if (!windowId) return;
    const colors = await getLocalStorageMap(windowColors);
    const names = await getLocalStorageMap(windowNames);
    if (!names.has(windowId) && !colors.has(windowId)) return;
    let window;
    try {
      window = await browser5.windows.get(windowId, { populate: true });
    } catch (e) {
      return;
    }
    const newHash = hashcode(window);
    await serialized(async function() {
      const hashes = await getLocalStorageMap(windowHashes);
      if (hashes.get(windowId) === newHash) return;
      hashes.set(windowId, newHash);
      await setLocalStorageMap(windowHashes, hashes);
    });
  }
  function hashcode(window) {
    let urls = [];
    for (let i = 0; i < window.tabs.length; i++) {
      if (!window.tabs[i].url) continue;
      urls.push(window.tabs[i].url);
    }
    urls.sort();
    let hash = 0;
    for (let i = 0; i < urls.length; i++) {
      const code = stringHashcode(urls[i]);
      hash = (hash << 5) - hash + code;
      hash = hash & hash;
    }
    return hash;
  }

  // src/service_worker/background/tabs.ts
  var browser6 = __toESM(require_browser_polyfill());
  function setupTabListeners() {
    browser6.tabs.onCreated.removeListener(tabAdded);
    browser6.tabs.onUpdated.removeListener(tabCountChanged);
    browser6.tabs.onRemoved.removeListener(tabCountChanged);
    browser6.tabs.onReplaced.removeListener(tabCountChanged);
    browser6.tabs.onDetached.removeListener(tabCountChanged);
    browser6.tabs.onAttached.removeListener(tabCountChanged);
    browser6.tabs.onActivated.removeListener(tabActiveChanged);
    browser6.tabs.onMoved.removeListener(tabCountChanged);
    browser6.tabs.onRemoved.removeListener(tabRemoved);
    browser6.tabs.onCreated.removeListener(checkTabCreate);
    browser6.tabs.onUpdated.removeListener(checkTabUpdate);
    browser6.tabs.onRemoved.removeListener(checkTabRemove);
    browser6.tabs.onDetached.removeListener(checkTabDetached);
    browser6.tabs.onAttached.removeListener(checkTabAttached);
    browser6.tabs.onMoved.removeListener(checkTabMoved);
    browser6.tabs.onCreated.addListener(tabAdded);
    browser6.tabs.onUpdated.addListener(tabCountChanged);
    browser6.tabs.onRemoved.addListener(tabCountChanged);
    browser6.tabs.onReplaced.addListener(tabCountChanged);
    browser6.tabs.onDetached.addListener(tabCountChanged);
    browser6.tabs.onAttached.addListener(tabCountChanged);
    browser6.tabs.onActivated.addListener(tabActiveChanged);
    browser6.tabs.onMoved.addListener(tabCountChanged);
    browser6.tabs.onRemoved.addListener(tabRemoved);
    browser6.tabs.onCreated.addListener(checkTabCreate);
    browser6.tabs.onUpdated.addListener(checkTabUpdate);
    browser6.tabs.onRemoved.addListener(checkTabRemove);
    browser6.tabs.onDetached.addListener(checkTabDetached);
    browser6.tabs.onAttached.addListener(checkTabAttached);
    browser6.tabs.onMoved.addListener(checkTabMoved);
  }
  async function discardTabs(tabs5) {
    for (const tab of tabs5) {
      if (!tab.discarded) {
        browser6.tabs.discard(tab.id).catch(function(e) {
          console.error(e);
          console.log(e.message);
        });
      }
    }
  }
  async function closeTabs(tabs5) {
    for (const tab of tabs5) {
      await browser6.tabs.remove(tab.id);
    }
  }
  async function moveTabsToWindow(windowId, tabs5) {
    for (const tab of tabs5) {
      await browser6.tabs.move(tab.id, { windowId, index: -1 });
      await browser6.tabs.update(tab.id, { pinned: tab.pinned });
    }
  }
  function focusOnTabAndWindowDelayed(tabId, windowId) {
    setTimeout(() => focusOnTabAndWindow(tabId, windowId), 125);
  }
  async function focusOnTabAndWindow(tabId, windowId) {
    await browser6.windows.update(windowId, { focused: true });
    await browser6.tabs.update(tabId, { active: true });
    await tabActiveChanged({ tabId, windowId });
  }
  async function updateTabCount() {
    let run = true;
    const badge = await getLocalStorage("badge", true);
    if (!badge) run = false;
    if (run) {
      let result = await browser6.tabs.query({});
      let count = 0;
      if (!!result && !!result.length) {
        count = result.length;
      }
      await browser6.action.setBadgeText({ text: count + "" });
      await browser6.action.setBadgeBackgroundColor({ color: "purple" });
      const _to_remove = [];
      await tabsActiveLoaded;
      if (!!globalTabsActive) {
        for (let i = 0; i < globalTabsActive.length; i++) {
          const t = globalTabsActive[i];
          let found = false;
          if (!!result && !!result.length) {
            for (let j = 0; j < result.length; j++) {
              if (result[j].id === t.tabId) found = true;
            }
          }
          if (!found) _to_remove.push(i);
        }
      }
      const pruned = _to_remove.length > 0;
      while (_to_remove.length > 0) {
        let index = _to_remove.pop();
        if (!!globalTabsActive && globalTabsActive.length > 0) {
          if (!!globalTabsActive[index]) globalTabsActive.splice(index, 1);
        }
      }
      if (pruned) persistTabsActive();
    } else {
      await browser6.action.setBadgeText({ text: "" });
    }
  }
  function tabCountChanged() {
    updateTabCountDebounce();
  }
  var updateTabCountDebounce = debounce(updateTabCount, 250);
  async function tabAdded(tab) {
    const tabLimit = await getLocalStorage("tabLimit", 0);
    if (tabLimit > 0) {
      if (tab.id !== browser6.tabs.TAB_ID_NONE) {
        const tabCount = await browser6.tabs.query({ currentWindow: true });
        if (tabCount.length > tabLimit) {
          await createWindowWithTabs([tab], tab.incognito);
        }
      }
    }
    updateTabCountDebounce();
  }
  function tabActiveChanged(tab) {
    updateTabCountDebounce();
    return trackLastTab(tab);
  }
  function tabRemoved(tabId) {
    return forgetTab(tabId);
  }
  var checkWindowTimers = /* @__PURE__ */ new Map();
  function checkWindowDebounced(windowId) {
    if (!windowId) return;
    const timer = checkWindowTimers.get(windowId);
    if (timer) clearTimeout(timer);
    checkWindowTimers.set(windowId, setTimeout(function() {
      checkWindowTimers.delete(windowId);
      checkWindow(windowId).catch(function(e) {
        console.error(e);
      });
    }, 500));
  }
  async function checkTabCreate(tab) {
    checkWindowDebounced(tab.windowId);
  }
  async function checkTabUpdate(tabid, changeinfo, tab) {
    checkWindowDebounced(tab.windowId);
  }
  async function checkTabRemove(tabid, removeinfo) {
    if (removeinfo.isWindowClosing) return;
    checkWindowDebounced(removeinfo.windowId);
  }
  async function checkTabDetached(tabid, detachinfo) {
    checkWindowDebounced(detachinfo.oldWindowId);
  }
  async function checkTabAttached(tabid, attachinfo) {
    checkWindowDebounced(attachinfo.newWindowId);
  }
  async function checkTabMoved(tabid, moveinfo) {
    checkWindowDebounced(moveinfo.windowId);
  }

  // src/service_worker/ui/open.ts
  var browser7 = __toESM(require_browser_polyfill());
  async function openSidebar() {
    await browser7.sidebarAction.open();
  }
  async function openPopup() {
    const openInOwnTab = await getLocalStorage("openInOwnTab", false);
    if (openInOwnTab) {
      await browser7.action.setPopup({ popup: "popup.html?popup=true" });
      await browser7.action.openPopup();
      await browser7.action.setPopup({ popup: "" });
    } else {
      await browser7.action.openPopup();
    }
  }
  async function openAsOwnTab() {
    const popup_page = await browser7.runtime.getURL("popup.html");
    const tabs5 = await browser7.tabs.query({});
    let currentTab;
    let previousTab;
    await tabsActiveLoaded;
    if (!!globalTabsActive && globalTabsActive.length > 1) {
      currentTab = globalTabsActive[globalTabsActive.length - 1];
      previousTab = globalTabsActive[globalTabsActive.length - 2];
    }
    for (var i = 0; i < tabs5.length; i++) {
      const tab = tabs5[i];
      if (tab.url.indexOf("popup.html") > -1 && tab.url.indexOf(popup_page) > -1) {
        if (currentTab && currentTab.tabId && tab.id === currentTab.tabId && previousTab && previousTab.tabId) {
          await focusOnTabAndWindow(previousTab.tabId, previousTab.windowId);
          return;
        } else {
          await browser7.windows.update(tab.windowId, { focused: true });
          await browser7.tabs.highlight({ windowId: tab.windowId, tabs: tab.index });
          return;
        }
      }
    }
    await browser7.tabs.create({ url: "popup.html" });
  }
  function setupPopupListeners() {
    browser7.action.onClicked.removeListener(openAsOwnTab);
    browser7.action.onClicked.addListener(openAsOwnTab);
  }
  async function setupPopup() {
    const openInOwnTab = await getLocalStorage("openInOwnTab", false);
    if (openInOwnTab) {
      await browser7.action.setPopup({ popup: "" });
    } else {
      await browser7.action.setPopup({ popup: "popup.html?popup=true" });
    }
    if (browser7.sidebarAction) {
      await browser7.sidebarAction.setPanel({ panel: "popup.html?panel=true" });
    }
  }

  // src/service_worker/background/actions.ts
  var browser8 = __toESM(require_browser_polyfill());
  function handleMessages(message, sender) {
    if (!message || typeof message !== "object") return;
    let result;
    try {
      result = dispatch(message);
    } catch (e) {
      console.error(e);
      return;
    }
    if (!result) return;
    return result.catch(function(e) {
      console.error(e);
    });
  }
  function dispatch(request) {
    switch (request.command) {
      case reload_popup_controls:
        return setupPopup();
      case update_tab_count:
        return updateTabCount();
      case discard_tabs:
        return discardTabs(request.tabs);
      case move_tabs_to_window:
        return moveTabsToWindow(request.window_id, request.tabs);
      case focus_on_tab_and_window:
        if (!!request.tab) {
          return focusOnTabAndWindow(request.tab.id, request.tab.windowId);
        } else {
          return focusOnTabAndWindow(request.saved_tab.tabId, request.saved_tab.windowId);
        }
      case focus_on_tab_and_window_delayed:
        if (!!request.tab) {
          focusOnTabAndWindowDelayed(request.tab.id, request.tab.windowId);
        } else {
          focusOnTabAndWindowDelayed(request.saved_tab.tabId, request.saved_tab.windowId);
        }
        break;
      case focus_on_window:
        return focusOnWindow(request.window_id);
      case focus_on_window_delayed:
        focusOnWindowDelayed(request.window_id);
        break;
      case set_window_color:
        return setWindowColor(request.window_id, request.color);
      case set_window_name:
        return setWindowName(request.window_id, request.name);
      case create_window_with_tabs:
        return createWindowWithTabs(request.tabs, request.incognito);
      case create_window_with_session_tabs:
        return createWindowWithSessionTabs(request.session, request.tab_id);
      case close_tabs:
        return closeTabs(request.tabs);
    }
  }
  async function handleCommands(command) {
    if (command === switch_to_previous_active_tab) {
      await tabsActiveLoaded;
      while (globalTabsActive.length > 1) {
        const _tab = globalTabsActive[globalTabsActive.length - 2];
        try {
          await focusOnTabAndWindow(_tab.tabId, _tab.windowId);
          return;
        } catch (e) {
          globalTabsActive.splice(globalTabsActive.length - 2, 1);
          await persistTabsActive();
        }
      }
    }
  }
  async function trackLastTab(tab) {
    if (!!tab && !!tab.tabId) {
      await tabsActiveLoaded;
      if (!!globalTabsActive && globalTabsActive.length > 0) {
        var lastActive = globalTabsActive[globalTabsActive.length - 1];
        if (!!lastActive && lastActive.tabId === tab.tabId && lastActive.windowId === tab.windowId) {
          return;
        }
      }
      while (globalTabsActive.length > 20) {
        globalTabsActive.shift();
      }
      for (let i = globalTabsActive.length - 1; i >= 0; i--) {
        if (globalTabsActive[i].tabId === tab.tabId) {
          globalTabsActive.splice(i, 1);
        }
      }
      globalTabsActive.push(tab);
      await persistTabsActive();
    }
  }
  async function setWindowColor(windowId, color) {
    await serialized(async function() {
      var colors = await getLocalStorageMap(windowColors);
      if (!!color) {
        colors.set(windowId, color);
      } else {
        colors.delete(windowId);
      }
      await setLocalStorageMap(windowColors, colors);
      await updateWindowHash(windowId);
    });
    notifyRefresh([windowId]);
  }
  async function setWindowName(windowId, name) {
    await serialized(async function() {
      var names = await getLocalStorageMap(windowNames);
      if (!!name) {
        names.set(windowId, name);
      } else {
        names.delete(windowId);
      }
      await setLocalStorageMap(windowNames, names);
      await updateWindowHash(windowId);
    });
    notifyRefresh([windowId]);
  }
  function notifyRefresh(windowIds) {
    browser8.runtime.sendMessage({
      command: refresh_windows,
      window_ids: windowIds
    }).catch(function() {
    });
  }
  async function updateWindowHash(windowId) {
    const window = await browser8.windows.get(windowId, { populate: true });
    const hash = hashcode(window);
    const hashes = await getLocalStorageMap(windowHashes);
    hashes.set(windowId, hash);
    await setLocalStorageMap(windowHashes, hashes);
  }

  // src/service_worker/ui/context_menus.ts
  var browser9 = __toESM(require_browser_polyfill());
  async function setupContextMenus() {
    await browser9.contextMenus.removeAll();
    browser9.contextMenus.create({
      id: open_in_own_tab,
      title: "\u{1F4D4} Open in own tab",
      contexts: ["action"]
    });
    if (!!browser9.action.openPopup) {
      browser9.contextMenus.create({
        id: open_popup,
        title: "\u{1F4D1} Open popup",
        contexts: ["action"]
      });
    }
    if (!!browser9.sidebarAction) {
      browser9.contextMenus.create({
        id: open_sidebar,
        title: "\u{1F5C2} Open sidebar",
        contexts: ["action"]
      });
    }
    browser9.contextMenus.create({
      id: sep1,
      type: "separator",
      contexts: ["action"]
    });
    browser9.contextMenus.create({
      title: "\u{1F60D} Support this extension",
      id: support_menu,
      "contexts": ["action"]
    });
    browser9.contextMenus.create({
      id: review,
      title: "\u2B50 Leave a review",
      "contexts": ["action"],
      parentId: "support_menu"
    });
    browser9.contextMenus.create({
      id: donate,
      title: "\u2615 Donate to keep Extensions Alive",
      "contexts": ["action"],
      parentId: "support_menu"
    });
    browser9.contextMenus.create({
      id: patron,
      title: "\u{1F4B0} Become a Patron",
      "contexts": ["action"],
      parentId: "support_menu"
    });
    browser9.contextMenus.create({
      id: twitter,
      title: "\u{1F426} Follow on Twitter",
      "contexts": ["action"],
      parentId: "support_menu"
    });
    browser9.contextMenus.create({
      title: "\u{1F914} Issues and Suggestions",
      id: code_menu,
      "contexts": ["action"]
    });
    browser9.contextMenus.create({
      id: changelog,
      title: "\u{1F195} View recent changes",
      "contexts": ["action"],
      parentId: "code_menu"
    });
    browser9.contextMenus.create({
      id: options,
      title: "\u2699 Edit Options",
      "contexts": ["action"],
      parentId: "code_menu"
    });
    browser9.contextMenus.create({
      id: source,
      title: "\u{1F4BB} View source code",
      "contexts": ["action"],
      parentId: "code_menu"
    });
    browser9.contextMenus.create({
      id: report,
      title: "\u{1F914} Report an issue",
      "contexts": ["action"],
      parentId: "code_menu"
    });
    browser9.contextMenus.create({
      id: send,
      title: "\u{1F4A1} Send a suggestion",
      "contexts": ["action"],
      parentId: "code_menu"
    });
  }
  function setupContextMenuListeners() {
    browser9.contextMenus.onClicked.removeListener(contextListeners);
    browser9.contextMenus.onClicked.addListener(contextListeners);
  }
  async function contextListeners(info, tab) {
    switch (info.menuItemId) {
      case open_in_own_tab:
        await openAsOwnTab();
        break;
      case open_popup:
        await openPopup();
        break;
      case open_sidebar:
        await openSidebar();
        break;
      case donate:
        await browser9.tabs.create({ url: "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW" });
        break;
      case patron:
        await browser9.tabs.create({ url: "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW" });
        break;
      case changelog:
        await browser9.tabs.create({ url: "changelog.html" });
        break;
      case options:
        await browser9.tabs.create({ url: "options.html" });
        break;
      case report:
        await browser9.tabs.create({ url: "https://github.com/stefanXO/Tab-Manager-Plus/issues" });
        break;
      case source:
        await browser9.tabs.create({ url: "https://github.com/stefanXO/Tab-Manager-Plus" });
        break;
      case twitter:
        await browser9.tabs.create({ url: "https://www.twitter.com/mastef" });
        break;
      case send:
        await browser9.tabs.create({ url: "https://github.com/stefanXO/Tab-Manager-Plus/issues" });
        await browser9.tabs.create({ url: "mailto:markus+tmp@stefanxo.com" });
        break;
      case review:
        if (IS_FIREFOX) {
          await browser9.tabs.create({ url: "https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/" });
        } else {
          await browser9.tabs.create({ url: "https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff" });
        }
        break;
    }
  }

  // src/service_worker/service_worker.ts
  var browser10 = __toESM(require_browser_polyfill());
  var CLEANUP_ALARM = "cleanup_old_windows";
  browser10.commands.onCommand.addListener(handleCommands);
  browser10.runtime.onMessage.addListener(handleMessages);
  setupTabListeners();
  setupWindowListeners();
  setupContextMenuListeners();
  setupPopupListeners();
  browser10.alarms.onAlarm.addListener(async function(alarm) {
    if (alarm.name !== CLEANUP_ALARM) return;
    try {
      await cleanUp(true);
    } catch (e) {
      console.error(e);
    }
  });
  browser10.runtime.onInstalled.addListener(async function() {
    console.log(" ON INSTALLED");
    try {
      await setupContextMenus();
    } catch (e) {
      console.error(e);
    }
    await reconcileWindowAge();
  });
  browser10.runtime.onStartup.addListener(async function() {
    console.log(" ON STARTUP");
    try {
      await forgetWindowIds();
    } catch (e) {
      console.error(e);
    }
    await reconcileWindowAge();
    try {
      await cleanUp();
    } catch (e) {
      console.error(e);
    }
  });
  async function reconcileWindowAge() {
    try {
      const windows7 = await browser10.windows.getAll({});
      const liveIds = [];
      for (const w of windows7) {
        if (w.id !== void 0) liveIds.push(w.id);
      }
      if (liveIds.length === 0) return;
      await serialized(async function() {
        let windowAge = await getLocalStorage("windowAge", []);
        if (!(windowAge instanceof Array)) windowAge = [];
        windowAge = windowAge.filter(function(id) {
          return liveIds.indexOf(id) > -1;
        });
        for (const id of liveIds) {
          if (windowAge.indexOf(id) < 0) windowAge.push(id);
        }
        await setLocalStorage("windowAge", windowAge);
      });
    } catch (e) {
      console.error(e);
    }
  }
  async function setup() {
    try {
      await setupPopup();
    } catch (e) {
      console.error(e);
    }
    updateTabCountDebounce();
    const existing = await browser10.alarms.get(CLEANUP_ALARM);
    if (!existing) {
      await browser10.alarms.create(CLEANUP_ALARM, { delayInMinutes: 60, periodInMinutes: 60 });
    }
    setTimeout(cleanupDebounce, 2500);
  }
  setup();
})();
//# sourceMappingURL=service_worker.js.map
