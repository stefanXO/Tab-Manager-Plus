"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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

  // node_modules/object-assign/index.js
  var require_object_assign = __commonJS({
    "node_modules/object-assign/index.js"(exports, module) {
      "use strict";
      var getOwnPropertySymbols = Object.getOwnPropertySymbols;
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      var propIsEnumerable = Object.prototype.propertyIsEnumerable;
      function toObject(val) {
        if (val === null || val === void 0) {
          throw new TypeError("Object.assign cannot be called with null or undefined");
        }
        return Object(val);
      }
      function shouldUseNative() {
        try {
          if (!Object.assign) {
            return false;
          }
          var test1 = new String("abc");
          test1[5] = "de";
          if (Object.getOwnPropertyNames(test1)[0] === "5") {
            return false;
          }
          var test2 = {};
          for (var i = 0; i < 10; i++) {
            test2["_" + String.fromCharCode(i)] = i;
          }
          var order2 = Object.getOwnPropertyNames(test2).map(function(n) {
            return test2[n];
          });
          if (order2.join("") !== "0123456789") {
            return false;
          }
          var test3 = {};
          "abcdefghijklmnopqrst".split("").forEach(function(letter) {
            test3[letter] = letter;
          });
          if (Object.keys(Object.assign({}, test3)).join("") !== "abcdefghijklmnopqrst") {
            return false;
          }
          return true;
        } catch (err) {
          return false;
        }
      }
      module.exports = shouldUseNative() ? Object.assign : function(target, source) {
        var from;
        var to = toObject(target);
        var symbols;
        for (var s = 1; s < arguments.length; s++) {
          from = Object(arguments[s]);
          for (var key in from) {
            if (hasOwnProperty.call(from, key)) {
              to[key] = from[key];
            }
          }
          if (getOwnPropertySymbols) {
            symbols = getOwnPropertySymbols(from);
            for (var i = 0; i < symbols.length; i++) {
              if (propIsEnumerable.call(from, symbols[i])) {
                to[symbols[i]] = from[symbols[i]];
              }
            }
          }
        }
        return to;
      };
    }
  });

  // node_modules/react/cjs/react.production.min.js
  var require_react_production_min = __commonJS({
    "node_modules/react/cjs/react.production.min.js"(exports, module) {
      "use strict";
      var h = require_object_assign();
      var n = "function" === typeof Symbol && Symbol.for;
      var p = n ? Symbol.for("react.element") : 60103;
      var q = n ? Symbol.for("react.portal") : 60106;
      var r = n ? Symbol.for("react.fragment") : 60107;
      var t = n ? Symbol.for("react.strict_mode") : 60108;
      var u = n ? Symbol.for("react.profiler") : 60114;
      var v = n ? Symbol.for("react.provider") : 60109;
      var w = n ? Symbol.for("react.context") : 60110;
      var x = n ? Symbol.for("react.forward_ref") : 60112;
      var y = n ? Symbol.for("react.suspense") : 60113;
      n && Symbol.for("react.suspense_list");
      var z = n ? Symbol.for("react.memo") : 60115;
      var aa = n ? Symbol.for("react.lazy") : 60116;
      n && Symbol.for("react.fundamental");
      n && Symbol.for("react.responder");
      n && Symbol.for("react.scope");
      var A = "function" === typeof Symbol && Symbol.iterator;
      function B(a) {
        for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a, c = 1; c < arguments.length; c++) b += "&args[]=" + encodeURIComponent(arguments[c]);
        return "Minified React error #" + a + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      var C = { isMounted: function() {
        return false;
      }, enqueueForceUpdate: function() {
      }, enqueueReplaceState: function() {
      }, enqueueSetState: function() {
      } };
      var D = {};
      function E(a, b, c) {
        this.props = a;
        this.context = b;
        this.refs = D;
        this.updater = c || C;
      }
      E.prototype.isReactComponent = {};
      E.prototype.setState = function(a, b) {
        if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error(B(85));
        this.updater.enqueueSetState(this, a, b, "setState");
      };
      E.prototype.forceUpdate = function(a) {
        this.updater.enqueueForceUpdate(this, a, "forceUpdate");
      };
      function F() {
      }
      F.prototype = E.prototype;
      function G(a, b, c) {
        this.props = a;
        this.context = b;
        this.refs = D;
        this.updater = c || C;
      }
      var H = G.prototype = new F();
      H.constructor = G;
      h(H, E.prototype);
      H.isPureReactComponent = true;
      var I = { current: null };
      var J = { current: null };
      var K = Object.prototype.hasOwnProperty;
      var L = { key: true, ref: true, __self: true, __source: true };
      function M(a, b, c) {
        var e, d = {}, g = null, l = null;
        if (null != b) for (e in void 0 !== b.ref && (l = b.ref), void 0 !== b.key && (g = "" + b.key), b) K.call(b, e) && !L.hasOwnProperty(e) && (d[e] = b[e]);
        var f = arguments.length - 2;
        if (1 === f) d.children = c;
        else if (1 < f) {
          for (var k = Array(f), m = 0; m < f; m++) k[m] = arguments[m + 2];
          d.children = k;
        }
        if (a && a.defaultProps) for (e in f = a.defaultProps, f) void 0 === d[e] && (d[e] = f[e]);
        return { $$typeof: p, type: a, key: g, ref: l, props: d, _owner: J.current };
      }
      function ba(a, b) {
        return { $$typeof: p, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
      }
      function N(a) {
        return "object" === typeof a && null !== a && a.$$typeof === p;
      }
      function escape(a) {
        var b = { "=": "=0", ":": "=2" };
        return "$" + ("" + a).replace(/[=:]/g, function(a2) {
          return b[a2];
        });
      }
      var O = /\/+/g;
      var P = [];
      function Q(a, b, c, e) {
        if (P.length) {
          var d = P.pop();
          d.result = a;
          d.keyPrefix = b;
          d.func = c;
          d.context = e;
          d.count = 0;
          return d;
        }
        return { result: a, keyPrefix: b, func: c, context: e, count: 0 };
      }
      function R(a) {
        a.result = null;
        a.keyPrefix = null;
        a.func = null;
        a.context = null;
        a.count = 0;
        10 > P.length && P.push(a);
      }
      function S(a, b, c, e) {
        var d = typeof a;
        if ("undefined" === d || "boolean" === d) a = null;
        var g = false;
        if (null === a) g = true;
        else switch (d) {
          case "string":
          case "number":
            g = true;
            break;
          case "object":
            switch (a.$$typeof) {
              case p:
              case q:
                g = true;
            }
        }
        if (g) return c(e, a, "" === b ? "." + T(a, 0) : b), 1;
        g = 0;
        b = "" === b ? "." : b + ":";
        if (Array.isArray(a)) for (var l = 0; l < a.length; l++) {
          d = a[l];
          var f = b + T(d, l);
          g += S(d, f, c, e);
        }
        else if (null === a || "object" !== typeof a ? f = null : (f = A && a[A] || a["@@iterator"], f = "function" === typeof f ? f : null), "function" === typeof f) for (a = f.call(a), l = 0; !(d = a.next()).done; ) d = d.value, f = b + T(d, l++), g += S(d, f, c, e);
        else if ("object" === d) throw c = "" + a, Error(B(31, "[object Object]" === c ? "object with keys {" + Object.keys(a).join(", ") + "}" : c, ""));
        return g;
      }
      function U(a, b, c) {
        return null == a ? 0 : S(a, "", b, c);
      }
      function T(a, b) {
        return "object" === typeof a && null !== a && null != a.key ? escape(a.key) : b.toString(36);
      }
      function ca(a, b) {
        a.func.call(a.context, b, a.count++);
      }
      function da(a, b, c) {
        var e = a.result, d = a.keyPrefix;
        a = a.func.call(a.context, b, a.count++);
        Array.isArray(a) ? V(a, e, c, function(a2) {
          return a2;
        }) : null != a && (N(a) && (a = ba(a, d + (!a.key || b && b.key === a.key ? "" : ("" + a.key).replace(O, "$&/") + "/") + c)), e.push(a));
      }
      function V(a, b, c, e, d) {
        var g = "";
        null != c && (g = ("" + c).replace(O, "$&/") + "/");
        b = Q(b, g, e, d);
        U(a, da, b);
        R(b);
      }
      function W() {
        var a = I.current;
        if (null === a) throw Error(B(321));
        return a;
      }
      var X = {
        Children: { map: function(a, b, c) {
          if (null == a) return a;
          var e = [];
          V(a, e, null, b, c);
          return e;
        }, forEach: function(a, b, c) {
          if (null == a) return a;
          b = Q(null, null, b, c);
          U(a, ca, b);
          R(b);
        }, count: function(a) {
          return U(a, function() {
            return null;
          }, null);
        }, toArray: function(a) {
          var b = [];
          V(a, b, null, function(a2) {
            return a2;
          });
          return b;
        }, only: function(a) {
          if (!N(a)) throw Error(B(143));
          return a;
        } },
        createRef: function() {
          return { current: null };
        },
        Component: E,
        PureComponent: G,
        createContext: function(a, b) {
          void 0 === b && (b = null);
          a = {
            $$typeof: w,
            _calculateChangedBits: b,
            _currentValue: a,
            _currentValue2: a,
            _threadCount: 0,
            Provider: null,
            Consumer: null
          };
          a.Provider = { $$typeof: v, _context: a };
          return a.Consumer = a;
        },
        forwardRef: function(a) {
          return { $$typeof: x, render: a };
        },
        lazy: function(a) {
          return { $$typeof: aa, _ctor: a, _status: -1, _result: null };
        },
        memo: function(a, b) {
          return { $$typeof: z, type: a, compare: void 0 === b ? null : b };
        },
        useCallback: function(a, b) {
          return W().useCallback(a, b);
        },
        useContext: function(a, b) {
          return W().useContext(a, b);
        },
        useEffect: function(a, b) {
          return W().useEffect(a, b);
        },
        useImperativeHandle: function(a, b, c) {
          return W().useImperativeHandle(a, b, c);
        },
        useDebugValue: function() {
        },
        useLayoutEffect: function(a, b) {
          return W().useLayoutEffect(a, b);
        },
        useMemo: function(a, b) {
          return W().useMemo(a, b);
        },
        useReducer: function(a, b, c) {
          return W().useReducer(a, b, c);
        },
        useRef: function(a) {
          return W().useRef(a);
        },
        useState: function(a) {
          return W().useState(a);
        },
        Fragment: r,
        Profiler: u,
        StrictMode: t,
        Suspense: y,
        createElement: M,
        cloneElement: function(a, b, c) {
          if (null === a || void 0 === a) throw Error(B(267, a));
          var e = h({}, a.props), d = a.key, g = a.ref, l = a._owner;
          if (null != b) {
            void 0 !== b.ref && (g = b.ref, l = J.current);
            void 0 !== b.key && (d = "" + b.key);
            if (a.type && a.type.defaultProps) var f = a.type.defaultProps;
            for (k in b) K.call(b, k) && !L.hasOwnProperty(k) && (e[k] = void 0 === b[k] && void 0 !== f ? f[k] : b[k]);
          }
          var k = arguments.length - 2;
          if (1 === k) e.children = c;
          else if (1 < k) {
            f = Array(k);
            for (var m = 0; m < k; m++) f[m] = arguments[m + 2];
            e.children = f;
          }
          return { $$typeof: p, type: a.type, key: d, ref: g, props: e, _owner: l };
        },
        createFactory: function(a) {
          var b = M.bind(null, a);
          b.type = a;
          return b;
        },
        isValidElement: N,
        version: "16.11.0",
        __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: { ReactCurrentDispatcher: I, ReactCurrentBatchConfig: { suspense: null }, ReactCurrentOwner: J, IsSomeRendererActing: { current: false }, assign: h }
      };
      var Y = { default: X };
      var Z = Y && X || Y;
      module.exports = Z.default || Z;
    }
  });

  // node_modules/react/index.js
  var require_react = __commonJS({
    "node_modules/react/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_react_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/scheduler/cjs/scheduler.production.min.js
  var require_scheduler_production_min = __commonJS({
    "node_modules/scheduler/cjs/scheduler.production.min.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var f;
      var g;
      var h;
      var k;
      var l;
      if ("undefined" === typeof window || "function" !== typeof MessageChannel) {
        p = null, q = null, t = function() {
          if (null !== p) try {
            var a = exports.unstable_now();
            p(true, a);
            p = null;
          } catch (b) {
            throw setTimeout(t, 0), b;
          }
        }, u = Date.now();
        exports.unstable_now = function() {
          return Date.now() - u;
        };
        f = function(a) {
          null !== p ? setTimeout(f, 0, a) : (p = a, setTimeout(t, 0));
        };
        g = function(a, b) {
          q = setTimeout(a, b);
        };
        h = function() {
          clearTimeout(q);
        };
        k = function() {
          return false;
        };
        l = exports.unstable_forceFrameRate = function() {
        };
      } else {
        w = window.performance, x = window.Date, y = window.setTimeout, z = window.clearTimeout, A = window.requestAnimationFrame, B = window.cancelAnimationFrame;
        "undefined" !== typeof console && ("function" !== typeof A && console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"), "function" !== typeof B && console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"));
        if ("object" === typeof w && "function" === typeof w.now) exports.unstable_now = function() {
          return w.now();
        };
        else {
          C = x.now();
          exports.unstable_now = function() {
            return x.now() - C;
          };
        }
        D = false, E = null, F = -1, G = 5, H = 0;
        k = function() {
          return exports.unstable_now() >= H;
        };
        l = function() {
        };
        exports.unstable_forceFrameRate = function(a) {
          0 > a || 125 < a ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing framerates higher than 125 fps is not unsupported") : G = 0 < a ? Math.floor(1e3 / a) : 33.33;
        };
        I = new MessageChannel(), J = I.port2;
        I.port1.onmessage = function() {
          if (null !== E) {
            var a = exports.unstable_now();
            H = a + G;
            try {
              E(true, a) ? J.postMessage(null) : (D = false, E = null);
            } catch (b) {
              throw J.postMessage(null), b;
            }
          } else D = false;
        };
        f = function(a) {
          E = a;
          D || (D = true, J.postMessage(null));
        };
        g = function(a, b) {
          F = y(function() {
            a(exports.unstable_now());
          }, b);
        };
        h = function() {
          z(F);
          F = -1;
        };
      }
      var p;
      var q;
      var t;
      var u;
      var w;
      var x;
      var y;
      var z;
      var A;
      var B;
      var C;
      var D;
      var E;
      var F;
      var G;
      var H;
      var I;
      var J;
      function K(a, b) {
        var c = a.length;
        a.push(b);
        a: for (; ; ) {
          var d = Math.floor((c - 1) / 2), e = a[d];
          if (void 0 !== e && 0 < L(e, b)) a[d] = b, a[c] = e, c = d;
          else break a;
        }
      }
      function M(a) {
        a = a[0];
        return void 0 === a ? null : a;
      }
      function N(a) {
        var b = a[0];
        if (void 0 !== b) {
          var c = a.pop();
          if (c !== b) {
            a[0] = c;
            a: for (var d = 0, e = a.length; d < e; ) {
              var m = 2 * (d + 1) - 1, n = a[m], v = m + 1, r = a[v];
              if (void 0 !== n && 0 > L(n, c)) void 0 !== r && 0 > L(r, n) ? (a[d] = r, a[v] = c, d = v) : (a[d] = n, a[m] = c, d = m);
              else if (void 0 !== r && 0 > L(r, c)) a[d] = r, a[v] = c, d = v;
              else break a;
            }
          }
          return b;
        }
        return null;
      }
      function L(a, b) {
        var c = a.sortIndex - b.sortIndex;
        return 0 !== c ? c : a.id - b.id;
      }
      var O = [];
      var P = [];
      var Q = 1;
      var R = null;
      var S = 3;
      var T = false;
      var U = false;
      var V = false;
      function W(a) {
        for (var b = M(P); null !== b; ) {
          if (null === b.callback) N(P);
          else if (b.startTime <= a) N(P), b.sortIndex = b.expirationTime, K(O, b);
          else break;
          b = M(P);
        }
      }
      function X(a) {
        V = false;
        W(a);
        if (!U) if (null !== M(O)) U = true, f(Y);
        else {
          var b = M(P);
          null !== b && g(X, b.startTime - a);
        }
      }
      function Y(a, b) {
        U = false;
        V && (V = false, h());
        T = true;
        var c = S;
        try {
          W(b);
          for (R = M(O); null !== R && (!(R.expirationTime > b) || a && !k()); ) {
            var d = R.callback;
            if (null !== d) {
              R.callback = null;
              S = R.priorityLevel;
              var e = d(R.expirationTime <= b);
              b = exports.unstable_now();
              "function" === typeof e ? R.callback = e : R === M(O) && N(O);
              W(b);
            } else N(O);
            R = M(O);
          }
          if (null !== R) var m = true;
          else {
            var n = M(P);
            null !== n && g(X, n.startTime - b);
            m = false;
          }
          return m;
        } finally {
          R = null, S = c, T = false;
        }
      }
      function Z(a) {
        switch (a) {
          case 1:
            return -1;
          case 2:
            return 250;
          case 5:
            return 1073741823;
          case 4:
            return 1e4;
          default:
            return 5e3;
        }
      }
      var aa = l;
      exports.unstable_ImmediatePriority = 1;
      exports.unstable_UserBlockingPriority = 2;
      exports.unstable_NormalPriority = 3;
      exports.unstable_IdlePriority = 5;
      exports.unstable_LowPriority = 4;
      exports.unstable_runWithPriority = function(a, b) {
        switch (a) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            a = 3;
        }
        var c = S;
        S = a;
        try {
          return b();
        } finally {
          S = c;
        }
      };
      exports.unstable_next = function(a) {
        switch (S) {
          case 1:
          case 2:
          case 3:
            var b = 3;
            break;
          default:
            b = S;
        }
        var c = S;
        S = b;
        try {
          return a();
        } finally {
          S = c;
        }
      };
      exports.unstable_scheduleCallback = function(a, b, c) {
        var d = exports.unstable_now();
        if ("object" === typeof c && null !== c) {
          var e = c.delay;
          e = "number" === typeof e && 0 < e ? d + e : d;
          c = "number" === typeof c.timeout ? c.timeout : Z(a);
        } else c = Z(a), e = d;
        c = e + c;
        a = { id: Q++, callback: b, priorityLevel: a, startTime: e, expirationTime: c, sortIndex: -1 };
        e > d ? (a.sortIndex = e, K(P, a), null === M(O) && a === M(P) && (V ? h() : V = true, g(X, e - d))) : (a.sortIndex = c, K(O, a), U || T || (U = true, f(Y)));
        return a;
      };
      exports.unstable_cancelCallback = function(a) {
        a.callback = null;
      };
      exports.unstable_wrapCallback = function(a) {
        var b = S;
        return function() {
          var c = S;
          S = b;
          try {
            return a.apply(this, arguments);
          } finally {
            S = c;
          }
        };
      };
      exports.unstable_getCurrentPriorityLevel = function() {
        return S;
      };
      exports.unstable_shouldYield = function() {
        var a = exports.unstable_now();
        W(a);
        var b = M(O);
        return b !== R && null !== R && null !== b && null !== b.callback && b.startTime <= a && b.expirationTime < R.expirationTime || k();
      };
      exports.unstable_requestPaint = aa;
      exports.unstable_continueExecution = function() {
        U || T || (U = true, f(Y));
      };
      exports.unstable_pauseExecution = function() {
      };
      exports.unstable_getFirstCallbackNode = function() {
        return M(O);
      };
      exports.unstable_Profiling = null;
    }
  });

  // node_modules/scheduler/index.js
  var require_scheduler = __commonJS({
    "node_modules/scheduler/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_scheduler_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/cjs/react-dom.production.min.js
  var require_react_dom_production_min = __commonJS({
    "node_modules/react-dom/cjs/react-dom.production.min.js"(exports, module) {
      "use strict";
      var aa = require_react();
      var n = require_object_assign();
      var q = require_scheduler();
      function u(a) {
        for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a, c = 1; c < arguments.length; c++) b += "&args[]=" + encodeURIComponent(arguments[c]);
        return "Minified React error #" + a + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      if (!aa) throw Error(u(227));
      var ba = null;
      var ca = {};
      function da() {
        if (ba) for (var a in ca) {
          var b = ca[a], c = ba.indexOf(a);
          if (!(-1 < c)) throw Error(u(96, a));
          if (!ea[c]) {
            if (!b.extractEvents) throw Error(u(97, a));
            ea[c] = b;
            c = b.eventTypes;
            for (var d in c) {
              var e = void 0;
              var f = c[d], g = b, h = d;
              if (fa.hasOwnProperty(h)) throw Error(u(99, h));
              fa[h] = f;
              var k = f.phasedRegistrationNames;
              if (k) {
                for (e in k) k.hasOwnProperty(e) && ha(k[e], g, h);
                e = true;
              } else f.registrationName ? (ha(f.registrationName, g, h), e = true) : e = false;
              if (!e) throw Error(u(98, d, a));
            }
          }
        }
      }
      function ha(a, b, c) {
        if (ia[a]) throw Error(u(100, a));
        ia[a] = b;
        ja[a] = b.eventTypes[c].dependencies;
      }
      var ea = [];
      var fa = {};
      var ia = {};
      var ja = {};
      function ka(a, b, c, d, e, f, g, h, k) {
        var l = Array.prototype.slice.call(arguments, 3);
        try {
          b.apply(c, l);
        } catch (m) {
          this.onError(m);
        }
      }
      var la = false;
      var ma = null;
      var na = false;
      var oa = null;
      var pa = { onError: function(a) {
        la = true;
        ma = a;
      } };
      function qa(a, b, c, d, e, f, g, h, k) {
        la = false;
        ma = null;
        ka.apply(pa, arguments);
      }
      function ra(a, b, c, d, e, f, g, h, k) {
        qa.apply(this, arguments);
        if (la) {
          if (la) {
            var l = ma;
            la = false;
            ma = null;
          } else throw Error(u(198));
          na || (na = true, oa = l);
        }
      }
      var sa = null;
      var ua = null;
      var va = null;
      function wa(a, b, c) {
        var d = a.type || "unknown-event";
        a.currentTarget = va(c);
        ra(d, b, void 0, a);
        a.currentTarget = null;
      }
      function xa(a, b) {
        if (null == b) throw Error(u(30));
        if (null == a) return b;
        if (Array.isArray(a)) {
          if (Array.isArray(b)) return a.push.apply(a, b), a;
          a.push(b);
          return a;
        }
        return Array.isArray(b) ? [a].concat(b) : [a, b];
      }
      function ya(a, b, c) {
        Array.isArray(a) ? a.forEach(b, c) : a && b.call(c, a);
      }
      var za = null;
      function Aa(a) {
        if (a) {
          var b = a._dispatchListeners, c = a._dispatchInstances;
          if (Array.isArray(b)) for (var d = 0; d < b.length && !a.isPropagationStopped(); d++) wa(a, b[d], c[d]);
          else b && wa(a, b, c);
          a._dispatchListeners = null;
          a._dispatchInstances = null;
          a.isPersistent() || a.constructor.release(a);
        }
      }
      function Ba(a) {
        null !== a && (za = xa(za, a));
        a = za;
        za = null;
        if (a) {
          ya(a, Aa);
          if (za) throw Error(u(95));
          if (na) throw a = oa, na = false, oa = null, a;
        }
      }
      var Ca = { injectEventPluginOrder: function(a) {
        if (ba) throw Error(u(101));
        ba = Array.prototype.slice.call(a);
        da();
      }, injectEventPluginsByName: function(a) {
        var b = false, c;
        for (c in a) if (a.hasOwnProperty(c)) {
          var d = a[c];
          if (!ca.hasOwnProperty(c) || ca[c] !== d) {
            if (ca[c]) throw Error(u(102, c));
            ca[c] = d;
            b = true;
          }
        }
        b && da();
      } };
      function Da(a, b) {
        var c = a.stateNode;
        if (!c) return null;
        var d = sa(c);
        if (!d) return null;
        c = d[b];
        a: switch (b) {
          case "onClick":
          case "onClickCapture":
          case "onDoubleClick":
          case "onDoubleClickCapture":
          case "onMouseDown":
          case "onMouseDownCapture":
          case "onMouseMove":
          case "onMouseMoveCapture":
          case "onMouseUp":
          case "onMouseUpCapture":
            (d = !d.disabled) || (a = a.type, d = !("button" === a || "input" === a || "select" === a || "textarea" === a));
            a = !d;
            break a;
          default:
            a = false;
        }
        if (a) return null;
        if (c && "function" !== typeof c) throw Error(u(231, b, typeof c));
        return c;
      }
      var Ea = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      Ea.hasOwnProperty("ReactCurrentDispatcher") || (Ea.ReactCurrentDispatcher = { current: null });
      Ea.hasOwnProperty("ReactCurrentBatchConfig") || (Ea.ReactCurrentBatchConfig = { suspense: null });
      var Fa = /^(.*)[\\\/]/;
      var w = "function" === typeof Symbol && Symbol.for;
      var Ga = w ? Symbol.for("react.element") : 60103;
      var Ha = w ? Symbol.for("react.portal") : 60106;
      var Ia = w ? Symbol.for("react.fragment") : 60107;
      var Ja = w ? Symbol.for("react.strict_mode") : 60108;
      var Ka = w ? Symbol.for("react.profiler") : 60114;
      var La = w ? Symbol.for("react.provider") : 60109;
      var Ma = w ? Symbol.for("react.context") : 60110;
      var Na = w ? Symbol.for("react.concurrent_mode") : 60111;
      var Oa = w ? Symbol.for("react.forward_ref") : 60112;
      var Pa = w ? Symbol.for("react.suspense") : 60113;
      var Qa = w ? Symbol.for("react.suspense_list") : 60120;
      var Ra = w ? Symbol.for("react.memo") : 60115;
      var Sa = w ? Symbol.for("react.lazy") : 60116;
      w && Symbol.for("react.fundamental");
      w && Symbol.for("react.responder");
      w && Symbol.for("react.scope");
      var Ta = "function" === typeof Symbol && Symbol.iterator;
      function Ua(a) {
        if (null === a || "object" !== typeof a) return null;
        a = Ta && a[Ta] || a["@@iterator"];
        return "function" === typeof a ? a : null;
      }
      function Va(a) {
        if (-1 === a._status) {
          a._status = 0;
          var b = a._ctor;
          b = b();
          a._result = b;
          b.then(function(b2) {
            0 === a._status && (b2 = b2.default, a._status = 1, a._result = b2);
          }, function(b2) {
            0 === a._status && (a._status = 2, a._result = b2);
          });
        }
      }
      function Wa(a) {
        if (null == a) return null;
        if ("function" === typeof a) return a.displayName || a.name || null;
        if ("string" === typeof a) return a;
        switch (a) {
          case Ia:
            return "Fragment";
          case Ha:
            return "Portal";
          case Ka:
            return "Profiler";
          case Ja:
            return "StrictMode";
          case Pa:
            return "Suspense";
          case Qa:
            return "SuspenseList";
        }
        if ("object" === typeof a) switch (a.$$typeof) {
          case Ma:
            return "Context.Consumer";
          case La:
            return "Context.Provider";
          case Oa:
            var b = a.render;
            b = b.displayName || b.name || "";
            return a.displayName || ("" !== b ? "ForwardRef(" + b + ")" : "ForwardRef");
          case Ra:
            return Wa(a.type);
          case Sa:
            if (a = 1 === a._status ? a._result : null) return Wa(a);
        }
        return null;
      }
      function Xa(a) {
        var b = "";
        do {
          a: switch (a.tag) {
            case 3:
            case 4:
            case 6:
            case 7:
            case 10:
            case 9:
              var c = "";
              break a;
            default:
              var d = a._debugOwner, e = a._debugSource, f = Wa(a.type);
              c = null;
              d && (c = Wa(d.type));
              d = f;
              f = "";
              e ? f = " (at " + e.fileName.replace(Fa, "") + ":" + e.lineNumber + ")" : c && (f = " (created by " + c + ")");
              c = "\n    in " + (d || "Unknown") + f;
          }
          b += c;
          a = a.return;
        } while (a);
        return b;
      }
      var Ya = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement);
      var Za = null;
      var $a = null;
      var ab = null;
      function bb(a) {
        if (a = ua(a)) {
          if ("function" !== typeof Za) throw Error(u(280));
          var b = sa(a.stateNode);
          Za(a.stateNode, a.type, b);
        }
      }
      function cb(a) {
        $a ? ab ? ab.push(a) : ab = [a] : $a = a;
      }
      function db() {
        if ($a) {
          var a = $a, b = ab;
          ab = $a = null;
          bb(a);
          if (b) for (a = 0; a < b.length; a++) bb(b[a]);
        }
      }
      function eb(a, b) {
        return a(b);
      }
      function fb(a, b, c, d) {
        return a(b, c, d);
      }
      function gb() {
      }
      var hb = eb;
      var ib = false;
      var jb = false;
      function kb() {
        if (null !== $a || null !== ab) gb(), db();
      }
      var lb = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/;
      var mb = Object.prototype.hasOwnProperty;
      var nb = {};
      var ob = {};
      function pb(a) {
        if (mb.call(ob, a)) return true;
        if (mb.call(nb, a)) return false;
        if (lb.test(a)) return ob[a] = true;
        nb[a] = true;
        return false;
      }
      function qb(a, b, c, d) {
        if (null !== c && 0 === c.type) return false;
        switch (typeof b) {
          case "function":
          case "symbol":
            return true;
          case "boolean":
            if (d) return false;
            if (null !== c) return !c.acceptsBooleans;
            a = a.toLowerCase().slice(0, 5);
            return "data-" !== a && "aria-" !== a;
          default:
            return false;
        }
      }
      function rb(a, b, c, d) {
        if (null === b || "undefined" === typeof b || qb(a, b, c, d)) return true;
        if (d) return false;
        if (null !== c) switch (c.type) {
          case 3:
            return !b;
          case 4:
            return false === b;
          case 5:
            return isNaN(b);
          case 6:
            return isNaN(b) || 1 > b;
        }
        return false;
      }
      function B(a, b, c, d, e, f) {
        this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
        this.attributeName = d;
        this.attributeNamespace = e;
        this.mustUseProperty = c;
        this.propertyName = a;
        this.type = b;
        this.sanitizeURL = f;
      }
      var D = {};
      "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a) {
        D[a] = new B(a, 0, false, a, null, false);
      });
      [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a) {
        var b = a[0];
        D[b] = new B(b, 1, false, a[1], null, false);
      });
      ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a) {
        D[a] = new B(a, 2, false, a.toLowerCase(), null, false);
      });
      ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a) {
        D[a] = new B(a, 2, false, a, null, false);
      });
      "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a) {
        D[a] = new B(a, 3, false, a.toLowerCase(), null, false);
      });
      ["checked", "multiple", "muted", "selected"].forEach(function(a) {
        D[a] = new B(a, 3, true, a, null, false);
      });
      ["capture", "download"].forEach(function(a) {
        D[a] = new B(a, 4, false, a, null, false);
      });
      ["cols", "rows", "size", "span"].forEach(function(a) {
        D[a] = new B(a, 6, false, a, null, false);
      });
      ["rowSpan", "start"].forEach(function(a) {
        D[a] = new B(a, 5, false, a.toLowerCase(), null, false);
      });
      var sb = /[\-:]([a-z])/g;
      function tb(a) {
        return a[1].toUpperCase();
      }
      "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a) {
        var b = a.replace(
          sb,
          tb
        );
        D[b] = new B(b, 1, false, a, null, false);
      });
      "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a) {
        var b = a.replace(sb, tb);
        D[b] = new B(b, 1, false, a, "http://www.w3.org/1999/xlink", false);
      });
      ["xml:base", "xml:lang", "xml:space"].forEach(function(a) {
        var b = a.replace(sb, tb);
        D[b] = new B(b, 1, false, a, "http://www.w3.org/XML/1998/namespace", false);
      });
      ["tabIndex", "crossOrigin"].forEach(function(a) {
        D[a] = new B(a, 1, false, a.toLowerCase(), null, false);
      });
      D.xlinkHref = new B("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true);
      ["src", "href", "action", "formAction"].forEach(function(a) {
        D[a] = new B(a, 1, false, a.toLowerCase(), null, true);
      });
      function ub(a) {
        switch (typeof a) {
          case "boolean":
          case "number":
          case "object":
          case "string":
          case "undefined":
            return a;
          default:
            return "";
        }
      }
      function vb(a, b, c, d) {
        var e = D.hasOwnProperty(b) ? D[b] : null;
        var f = null !== e ? 0 === e.type : d ? false : !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1] ? false : true;
        f || (rb(b, c, e, d) && (c = null), d || null === e ? pb(b) && (null === c ? a.removeAttribute(b) : a.setAttribute(b, "" + c)) : e.mustUseProperty ? a[e.propertyName] = null === c ? 3 === e.type ? false : "" : c : (b = e.attributeName, d = e.attributeNamespace, null === c ? a.removeAttribute(b) : (e = e.type, c = 3 === e || 4 === e && true === c ? "" : "" + c, d ? a.setAttributeNS(d, b, c) : a.setAttribute(b, c))));
      }
      function wb(a) {
        var b = a.type;
        return (a = a.nodeName) && "input" === a.toLowerCase() && ("checkbox" === b || "radio" === b);
      }
      function xb(a) {
        var b = wb(a) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a.constructor.prototype, b), d = "" + a[b];
        if (!a.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
          var e = c.get, f = c.set;
          Object.defineProperty(a, b, { configurable: true, get: function() {
            return e.call(this);
          }, set: function(a2) {
            d = "" + a2;
            f.call(this, a2);
          } });
          Object.defineProperty(a, b, { enumerable: c.enumerable });
          return { getValue: function() {
            return d;
          }, setValue: function(a2) {
            d = "" + a2;
          }, stopTracking: function() {
            a._valueTracker = null;
            delete a[b];
          } };
        }
      }
      function yb(a) {
        a._valueTracker || (a._valueTracker = xb(a));
      }
      function zb(a) {
        if (!a) return false;
        var b = a._valueTracker;
        if (!b) return true;
        var c = b.getValue();
        var d = "";
        a && (d = wb(a) ? a.checked ? "true" : "false" : a.value);
        a = d;
        return a !== c ? (b.setValue(a), true) : false;
      }
      function Ab(a, b) {
        var c = b.checked;
        return n({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c ? c : a._wrapperState.initialChecked });
      }
      function Bb(a, b) {
        var c = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
        c = ub(null != b.value ? b.value : c);
        a._wrapperState = { initialChecked: d, initialValue: c, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
      }
      function Cb(a, b) {
        b = b.checked;
        null != b && vb(a, "checked", b, false);
      }
      function Eb(a, b) {
        Cb(a, b);
        var c = ub(b.value), d = b.type;
        if (null != c) if ("number" === d) {
          if (0 === c && "" === a.value || a.value != c) a.value = "" + c;
        } else a.value !== "" + c && (a.value = "" + c);
        else if ("submit" === d || "reset" === d) {
          a.removeAttribute("value");
          return;
        }
        b.hasOwnProperty("value") ? Fb(a, b.type, c) : b.hasOwnProperty("defaultValue") && Fb(a, b.type, ub(b.defaultValue));
        null == b.checked && null != b.defaultChecked && (a.defaultChecked = !!b.defaultChecked);
      }
      function Gb(a, b, c) {
        if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
          var d = b.type;
          if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value)) return;
          b = "" + a._wrapperState.initialValue;
          c || b === a.value || (a.value = b);
          a.defaultValue = b;
        }
        c = a.name;
        "" !== c && (a.name = "");
        a.defaultChecked = !a.defaultChecked;
        a.defaultChecked = !!a._wrapperState.initialChecked;
        "" !== c && (a.name = c);
      }
      function Fb(a, b, c) {
        if ("number" !== b || a.ownerDocument.activeElement !== a) null == c ? a.defaultValue = "" + a._wrapperState.initialValue : a.defaultValue !== "" + c && (a.defaultValue = "" + c);
      }
      function Hb(a) {
        var b = "";
        aa.Children.forEach(a, function(a2) {
          null != a2 && (b += a2);
        });
        return b;
      }
      function Ib(a, b) {
        a = n({ children: void 0 }, b);
        if (b = Hb(b.children)) a.children = b;
        return a;
      }
      function Jb(a, b, c, d) {
        a = a.options;
        if (b) {
          b = {};
          for (var e = 0; e < c.length; e++) b["$" + c[e]] = true;
          for (c = 0; c < a.length; c++) e = b.hasOwnProperty("$" + a[c].value), a[c].selected !== e && (a[c].selected = e), e && d && (a[c].defaultSelected = true);
        } else {
          c = "" + ub(c);
          b = null;
          for (e = 0; e < a.length; e++) {
            if (a[e].value === c) {
              a[e].selected = true;
              d && (a[e].defaultSelected = true);
              return;
            }
            null !== b || a[e].disabled || (b = a[e]);
          }
          null !== b && (b.selected = true);
        }
      }
      function Kb(a, b) {
        if (null != b.dangerouslySetInnerHTML) throw Error(u(91));
        return n({}, b, { value: void 0, defaultValue: void 0, children: "" + a._wrapperState.initialValue });
      }
      function Lb(a, b) {
        var c = b.value;
        if (null == c) {
          c = b.defaultValue;
          b = b.children;
          if (null != b) {
            if (null != c) throw Error(u(92));
            if (Array.isArray(b)) {
              if (!(1 >= b.length)) throw Error(u(93));
              b = b[0];
            }
            c = b;
          }
          null == c && (c = "");
        }
        a._wrapperState = { initialValue: ub(c) };
      }
      function Mb(a, b) {
        var c = ub(b.value), d = ub(b.defaultValue);
        null != c && (c = "" + c, c !== a.value && (a.value = c), null == b.defaultValue && a.defaultValue !== c && (a.defaultValue = c));
        null != d && (a.defaultValue = "" + d);
      }
      function Nb(a) {
        var b = a.textContent;
        b === a._wrapperState.initialValue && "" !== b && null !== b && (a.value = b);
      }
      var Ob = { html: "http://www.w3.org/1999/xhtml", mathml: "http://www.w3.org/1998/Math/MathML", svg: "http://www.w3.org/2000/svg" };
      function Pb(a) {
        switch (a) {
          case "svg":
            return "http://www.w3.org/2000/svg";
          case "math":
            return "http://www.w3.org/1998/Math/MathML";
          default:
            return "http://www.w3.org/1999/xhtml";
        }
      }
      function Qb(a, b) {
        return null == a || "http://www.w3.org/1999/xhtml" === a ? Pb(b) : "http://www.w3.org/2000/svg" === a && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a;
      }
      var Rb;
      var Sb = function(a) {
        return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d, e) {
          MSApp.execUnsafeLocalFunction(function() {
            return a(b, c, d, e);
          });
        } : a;
      }(function(a, b) {
        if (a.namespaceURI !== Ob.svg || "innerHTML" in a) a.innerHTML = b;
        else {
          Rb = Rb || document.createElement("div");
          Rb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
          for (b = Rb.firstChild; a.firstChild; ) a.removeChild(a.firstChild);
          for (; b.firstChild; ) a.appendChild(b.firstChild);
        }
      });
      function Tb(a, b) {
        if (b) {
          var c = a.firstChild;
          if (c && c === a.lastChild && 3 === c.nodeType) {
            c.nodeValue = b;
            return;
          }
        }
        a.textContent = b;
      }
      function Ub(a, b) {
        var c = {};
        c[a.toLowerCase()] = b.toLowerCase();
        c["Webkit" + a] = "webkit" + b;
        c["Moz" + a] = "moz" + b;
        return c;
      }
      var Vb = { animationend: Ub("Animation", "AnimationEnd"), animationiteration: Ub("Animation", "AnimationIteration"), animationstart: Ub("Animation", "AnimationStart"), transitionend: Ub("Transition", "TransitionEnd") };
      var Wb = {};
      var Xb = {};
      Ya && (Xb = document.createElement("div").style, "AnimationEvent" in window || (delete Vb.animationend.animation, delete Vb.animationiteration.animation, delete Vb.animationstart.animation), "TransitionEvent" in window || delete Vb.transitionend.transition);
      function Yb(a) {
        if (Wb[a]) return Wb[a];
        if (!Vb[a]) return a;
        var b = Vb[a], c;
        for (c in b) if (b.hasOwnProperty(c) && c in Xb) return Wb[a] = b[c];
        return a;
      }
      var Zb = Yb("animationend");
      var $b = Yb("animationiteration");
      var ac = Yb("animationstart");
      var bc = Yb("transitionend");
      var dc = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(" ");
      function ec(a) {
        var b = a, c = a;
        if (a.alternate) for (; b.return; ) b = b.return;
        else {
          a = b;
          do
            b = a, 0 !== (b.effectTag & 1026) && (c = b.return), a = b.return;
          while (a);
        }
        return 3 === b.tag ? c : null;
      }
      function fc(a) {
        if (13 === a.tag) {
          var b = a.memoizedState;
          null === b && (a = a.alternate, null !== a && (b = a.memoizedState));
          if (null !== b) return b.dehydrated;
        }
        return null;
      }
      function gc(a) {
        if (ec(a) !== a) throw Error(u(188));
      }
      function hc(a) {
        var b = a.alternate;
        if (!b) {
          b = ec(a);
          if (null === b) throw Error(u(188));
          return b !== a ? null : a;
        }
        for (var c = a, d = b; ; ) {
          var e = c.return;
          if (null === e) break;
          var f = e.alternate;
          if (null === f) {
            d = e.return;
            if (null !== d) {
              c = d;
              continue;
            }
            break;
          }
          if (e.child === f.child) {
            for (f = e.child; f; ) {
              if (f === c) return gc(e), a;
              if (f === d) return gc(e), b;
              f = f.sibling;
            }
            throw Error(u(188));
          }
          if (c.return !== d.return) c = e, d = f;
          else {
            for (var g = false, h = e.child; h; ) {
              if (h === c) {
                g = true;
                c = e;
                d = f;
                break;
              }
              if (h === d) {
                g = true;
                d = e;
                c = f;
                break;
              }
              h = h.sibling;
            }
            if (!g) {
              for (h = f.child; h; ) {
                if (h === c) {
                  g = true;
                  c = f;
                  d = e;
                  break;
                }
                if (h === d) {
                  g = true;
                  d = f;
                  c = e;
                  break;
                }
                h = h.sibling;
              }
              if (!g) throw Error(u(189));
            }
          }
          if (c.alternate !== d) throw Error(u(190));
        }
        if (3 !== c.tag) throw Error(u(188));
        return c.stateNode.current === c ? a : b;
      }
      function ic(a) {
        a = hc(a);
        if (!a) return null;
        for (var b = a; ; ) {
          if (5 === b.tag || 6 === b.tag) return b;
          if (b.child) b.child.return = b, b = b.child;
          else {
            if (b === a) break;
            for (; !b.sibling; ) {
              if (!b.return || b.return === a) return null;
              b = b.return;
            }
            b.sibling.return = b.return;
            b = b.sibling;
          }
        }
        return null;
      }
      var jc;
      var kc;
      var lc;
      var mc = false;
      var nc = [];
      var oc = null;
      var pc = null;
      var qc = null;
      var rc = /* @__PURE__ */ new Map();
      var sc = /* @__PURE__ */ new Map();
      var tc = [];
      var uc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput close cancel copy cut paste click change contextmenu reset submit".split(" ");
      var vc = "focus blur dragenter dragleave mouseover mouseout pointerover pointerout gotpointercapture lostpointercapture".split(" ");
      function wc(a) {
        var b = xc(a);
        uc.forEach(function(c) {
          yc(c, a, b);
        });
        vc.forEach(function(c) {
          yc(c, a, b);
        });
      }
      function zc(a, b, c, d) {
        return { blockedOn: a, topLevelType: b, eventSystemFlags: c | 32, nativeEvent: d };
      }
      function Ac(a, b) {
        switch (a) {
          case "focus":
          case "blur":
            oc = null;
            break;
          case "dragenter":
          case "dragleave":
            pc = null;
            break;
          case "mouseover":
          case "mouseout":
            qc = null;
            break;
          case "pointerover":
          case "pointerout":
            rc.delete(b.pointerId);
            break;
          case "gotpointercapture":
          case "lostpointercapture":
            sc.delete(b.pointerId);
        }
      }
      function Bc(a, b, c, d, e) {
        if (null === a || a.nativeEvent !== e) return a = zc(b, c, d, e), null !== b && (b = Cc(b), null !== b && kc(b)), a;
        a.eventSystemFlags |= d;
        return a;
      }
      function Dc(a, b, c, d) {
        switch (b) {
          case "focus":
            return oc = Bc(oc, a, b, c, d), true;
          case "dragenter":
            return pc = Bc(pc, a, b, c, d), true;
          case "mouseover":
            return qc = Bc(qc, a, b, c, d), true;
          case "pointerover":
            var e = d.pointerId;
            rc.set(e, Bc(rc.get(e) || null, a, b, c, d));
            return true;
          case "gotpointercapture":
            return e = d.pointerId, sc.set(e, Bc(sc.get(e) || null, a, b, c, d)), true;
        }
        return false;
      }
      function Ec(a) {
        var b = Fc(a.target);
        if (null !== b) {
          var c = ec(b);
          if (null !== c) {
            if (b = c.tag, 13 === b) {
              if (b = fc(c), null !== b) {
                a.blockedOn = b;
                q.unstable_runWithPriority(a.priority, function() {
                  lc(c);
                });
                return;
              }
            } else if (3 === b && c.stateNode.hydrate) {
              a.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
              return;
            }
          }
        }
        a.blockedOn = null;
      }
      function Gc(a) {
        if (null !== a.blockedOn) return false;
        var b = Hc(a.topLevelType, a.eventSystemFlags, a.nativeEvent);
        if (null !== b) {
          var c = Cc(b);
          null !== c && kc(c);
          a.blockedOn = b;
          return false;
        }
        return true;
      }
      function Ic(a, b, c) {
        Gc(a) && c.delete(b);
      }
      function Jc() {
        for (mc = false; 0 < nc.length; ) {
          var a = nc[0];
          if (null !== a.blockedOn) {
            a = Cc(a.blockedOn);
            null !== a && jc(a);
            break;
          }
          var b = Hc(a.topLevelType, a.eventSystemFlags, a.nativeEvent);
          null !== b ? a.blockedOn = b : nc.shift();
        }
        null !== oc && Gc(oc) && (oc = null);
        null !== pc && Gc(pc) && (pc = null);
        null !== qc && Gc(qc) && (qc = null);
        rc.forEach(Ic);
        sc.forEach(Ic);
      }
      function Kc(a, b) {
        a.blockedOn === b && (a.blockedOn = null, mc || (mc = true, q.unstable_scheduleCallback(q.unstable_NormalPriority, Jc)));
      }
      function Lc(a) {
        function b(b2) {
          return Kc(b2, a);
        }
        if (0 < nc.length) {
          Kc(nc[0], a);
          for (var c = 1; c < nc.length; c++) {
            var d = nc[c];
            d.blockedOn === a && (d.blockedOn = null);
          }
        }
        null !== oc && Kc(oc, a);
        null !== pc && Kc(pc, a);
        null !== qc && Kc(qc, a);
        rc.forEach(b);
        sc.forEach(b);
        for (c = 0; c < tc.length; c++) d = tc[c], d.blockedOn === a && (d.blockedOn = null);
        for (; 0 < tc.length && (c = tc[0], null === c.blockedOn); ) Ec(c), null === c.blockedOn && tc.shift();
      }
      function Mc(a) {
        a = a.target || a.srcElement || window;
        a.correspondingUseElement && (a = a.correspondingUseElement);
        return 3 === a.nodeType ? a.parentNode : a;
      }
      function Nc(a) {
        do
          a = a.return;
        while (a && 5 !== a.tag);
        return a ? a : null;
      }
      function Oc(a, b, c) {
        if (b = Da(a, c.dispatchConfig.phasedRegistrationNames[b])) c._dispatchListeners = xa(c._dispatchListeners, b), c._dispatchInstances = xa(c._dispatchInstances, a);
      }
      function Pc(a) {
        if (a && a.dispatchConfig.phasedRegistrationNames) {
          for (var b = a._targetInst, c = []; b; ) c.push(b), b = Nc(b);
          for (b = c.length; 0 < b--; ) Oc(c[b], "captured", a);
          for (b = 0; b < c.length; b++) Oc(c[b], "bubbled", a);
        }
      }
      function Qc(a, b, c) {
        a && c && c.dispatchConfig.registrationName && (b = Da(a, c.dispatchConfig.registrationName)) && (c._dispatchListeners = xa(c._dispatchListeners, b), c._dispatchInstances = xa(c._dispatchInstances, a));
      }
      function Rc(a) {
        a && a.dispatchConfig.registrationName && Qc(a._targetInst, null, a);
      }
      function Sc(a) {
        ya(a, Pc);
      }
      function Tc() {
        return true;
      }
      function Uc() {
        return false;
      }
      function E(a, b, c, d) {
        this.dispatchConfig = a;
        this._targetInst = b;
        this.nativeEvent = c;
        a = this.constructor.Interface;
        for (var e in a) a.hasOwnProperty(e) && ((b = a[e]) ? this[e] = b(c) : "target" === e ? this.target = d : this[e] = c[e]);
        this.isDefaultPrevented = (null != c.defaultPrevented ? c.defaultPrevented : false === c.returnValue) ? Tc : Uc;
        this.isPropagationStopped = Uc;
        return this;
      }
      n(E.prototype, { preventDefault: function() {
        this.defaultPrevented = true;
        var a = this.nativeEvent;
        a && (a.preventDefault ? a.preventDefault() : "unknown" !== typeof a.returnValue && (a.returnValue = false), this.isDefaultPrevented = Tc);
      }, stopPropagation: function() {
        var a = this.nativeEvent;
        a && (a.stopPropagation ? a.stopPropagation() : "unknown" !== typeof a.cancelBubble && (a.cancelBubble = true), this.isPropagationStopped = Tc);
      }, persist: function() {
        this.isPersistent = Tc;
      }, isPersistent: Uc, destructor: function() {
        var a = this.constructor.Interface, b;
        for (b in a) this[b] = null;
        this.nativeEvent = this._targetInst = this.dispatchConfig = null;
        this.isPropagationStopped = this.isDefaultPrevented = Uc;
        this._dispatchInstances = this._dispatchListeners = null;
      } });
      E.Interface = { type: null, target: null, currentTarget: function() {
        return null;
      }, eventPhase: null, bubbles: null, cancelable: null, timeStamp: function(a) {
        return a.timeStamp || Date.now();
      }, defaultPrevented: null, isTrusted: null };
      E.extend = function(a) {
        function b() {
        }
        function c() {
          return d.apply(this, arguments);
        }
        var d = this;
        b.prototype = d.prototype;
        var e = new b();
        n(e, c.prototype);
        c.prototype = e;
        c.prototype.constructor = c;
        c.Interface = n({}, d.Interface, a);
        c.extend = d.extend;
        Vc(c);
        return c;
      };
      Vc(E);
      function Wc(a, b, c, d) {
        if (this.eventPool.length) {
          var e = this.eventPool.pop();
          this.call(e, a, b, c, d);
          return e;
        }
        return new this(a, b, c, d);
      }
      function Xc(a) {
        if (!(a instanceof this)) throw Error(u(279));
        a.destructor();
        10 > this.eventPool.length && this.eventPool.push(a);
      }
      function Vc(a) {
        a.eventPool = [];
        a.getPooled = Wc;
        a.release = Xc;
      }
      var Yc = E.extend({ animationName: null, elapsedTime: null, pseudoElement: null });
      var Zc = E.extend({ clipboardData: function(a) {
        return "clipboardData" in a ? a.clipboardData : window.clipboardData;
      } });
      var $c = E.extend({ view: null, detail: null });
      var ad = $c.extend({ relatedTarget: null });
      function bd(a) {
        var b = a.keyCode;
        "charCode" in a ? (a = a.charCode, 0 === a && 13 === b && (a = 13)) : a = b;
        10 === a && (a = 13);
        return 32 <= a || 13 === a ? a : 0;
      }
      var cd = { Esc: "Escape", Spacebar: " ", Left: "ArrowLeft", Up: "ArrowUp", Right: "ArrowRight", Down: "ArrowDown", Del: "Delete", Win: "OS", Menu: "ContextMenu", Apps: "ContextMenu", Scroll: "ScrollLock", MozPrintableKey: "Unidentified" };
      var ed = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta"
      };
      var fd = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
      function gd(a) {
        var b = this.nativeEvent;
        return b.getModifierState ? b.getModifierState(a) : (a = fd[a]) ? !!b[a] : false;
      }
      function hd() {
        return gd;
      }
      var id = $c.extend({ key: function(a) {
        if (a.key) {
          var b = cd[a.key] || a.key;
          if ("Unidentified" !== b) return b;
        }
        return "keypress" === a.type ? (a = bd(a), 13 === a ? "Enter" : String.fromCharCode(a)) : "keydown" === a.type || "keyup" === a.type ? ed[a.keyCode] || "Unidentified" : "";
      }, location: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, repeat: null, locale: null, getModifierState: hd, charCode: function(a) {
        return "keypress" === a.type ? bd(a) : 0;
      }, keyCode: function(a) {
        return "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
      }, which: function(a) {
        return "keypress" === a.type ? bd(a) : "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
      } });
      var jd = 0;
      var kd = 0;
      var ld = false;
      var md = false;
      var nd = $c.extend({ screenX: null, screenY: null, clientX: null, clientY: null, pageX: null, pageY: null, ctrlKey: null, shiftKey: null, altKey: null, metaKey: null, getModifierState: hd, button: null, buttons: null, relatedTarget: function(a) {
        return a.relatedTarget || (a.fromElement === a.srcElement ? a.toElement : a.fromElement);
      }, movementX: function(a) {
        if ("movementX" in a) return a.movementX;
        var b = jd;
        jd = a.screenX;
        return ld ? "mousemove" === a.type ? a.screenX - b : 0 : (ld = true, 0);
      }, movementY: function(a) {
        if ("movementY" in a) return a.movementY;
        var b = kd;
        kd = a.screenY;
        return md ? "mousemove" === a.type ? a.screenY - b : 0 : (md = true, 0);
      } });
      var od = nd.extend({ pointerId: null, width: null, height: null, pressure: null, tangentialPressure: null, tiltX: null, tiltY: null, twist: null, pointerType: null, isPrimary: null });
      var pd = nd.extend({ dataTransfer: null });
      var qd = $c.extend({ touches: null, targetTouches: null, changedTouches: null, altKey: null, metaKey: null, ctrlKey: null, shiftKey: null, getModifierState: hd });
      var rd = E.extend({
        propertyName: null,
        elapsedTime: null,
        pseudoElement: null
      });
      var sd = nd.extend({ deltaX: function(a) {
        return "deltaX" in a ? a.deltaX : "wheelDeltaX" in a ? -a.wheelDeltaX : 0;
      }, deltaY: function(a) {
        return "deltaY" in a ? a.deltaY : "wheelDeltaY" in a ? -a.wheelDeltaY : "wheelDelta" in a ? -a.wheelDelta : 0;
      }, deltaZ: null, deltaMode: null });
      var td = [["blur", "blur", 0], ["cancel", "cancel", 0], ["click", "click", 0], ["close", "close", 0], ["contextmenu", "contextMenu", 0], ["copy", "copy", 0], ["cut", "cut", 0], ["auxclick", "auxClick", 0], ["dblclick", "doubleClick", 0], [
        "dragend",
        "dragEnd",
        0
      ], ["dragstart", "dragStart", 0], ["drop", "drop", 0], ["focus", "focus", 0], ["input", "input", 0], ["invalid", "invalid", 0], ["keydown", "keyDown", 0], ["keypress", "keyPress", 0], ["keyup", "keyUp", 0], ["mousedown", "mouseDown", 0], ["mouseup", "mouseUp", 0], ["paste", "paste", 0], ["pause", "pause", 0], ["play", "play", 0], ["pointercancel", "pointerCancel", 0], ["pointerdown", "pointerDown", 0], ["pointerup", "pointerUp", 0], ["ratechange", "rateChange", 0], ["reset", "reset", 0], ["seeked", "seeked", 0], ["submit", "submit", 0], [
        "touchcancel",
        "touchCancel",
        0
      ], ["touchend", "touchEnd", 0], ["touchstart", "touchStart", 0], ["volumechange", "volumeChange", 0], ["drag", "drag", 1], ["dragenter", "dragEnter", 1], ["dragexit", "dragExit", 1], ["dragleave", "dragLeave", 1], ["dragover", "dragOver", 1], ["mousemove", "mouseMove", 1], ["mouseout", "mouseOut", 1], ["mouseover", "mouseOver", 1], ["pointermove", "pointerMove", 1], ["pointerout", "pointerOut", 1], ["pointerover", "pointerOver", 1], ["scroll", "scroll", 1], ["toggle", "toggle", 1], ["touchmove", "touchMove", 1], ["wheel", "wheel", 1], [
        "abort",
        "abort",
        2
      ], [Zb, "animationEnd", 2], [$b, "animationIteration", 2], [ac, "animationStart", 2], ["canplay", "canPlay", 2], ["canplaythrough", "canPlayThrough", 2], ["durationchange", "durationChange", 2], ["emptied", "emptied", 2], ["encrypted", "encrypted", 2], ["ended", "ended", 2], ["error", "error", 2], ["gotpointercapture", "gotPointerCapture", 2], ["load", "load", 2], ["loadeddata", "loadedData", 2], ["loadedmetadata", "loadedMetadata", 2], ["loadstart", "loadStart", 2], ["lostpointercapture", "lostPointerCapture", 2], ["playing", "playing", 2], [
        "progress",
        "progress",
        2
      ], ["seeking", "seeking", 2], ["stalled", "stalled", 2], ["suspend", "suspend", 2], ["timeupdate", "timeUpdate", 2], [bc, "transitionEnd", 2], ["waiting", "waiting", 2]];
      var ud = {};
      var vd = {};
      var xd = 0;
      for (; xd < td.length; xd++) {
        yd = td[xd], zd = yd[0], Ad = yd[1], Bd = yd[2], Cd = "on" + (Ad[0].toUpperCase() + Ad.slice(1)), Dd = { phasedRegistrationNames: { bubbled: Cd, captured: Cd + "Capture" }, dependencies: [zd], eventPriority: Bd };
        ud[Ad] = Dd;
        vd[zd] = Dd;
      }
      var yd;
      var zd;
      var Ad;
      var Bd;
      var Cd;
      var Dd;
      var Ed = { eventTypes: ud, getEventPriority: function(a) {
        a = vd[a];
        return void 0 !== a ? a.eventPriority : 2;
      }, extractEvents: function(a, b, c, d) {
        var e = vd[a];
        if (!e) return null;
        switch (a) {
          case "keypress":
            if (0 === bd(c)) return null;
          case "keydown":
          case "keyup":
            a = id;
            break;
          case "blur":
          case "focus":
            a = ad;
            break;
          case "click":
            if (2 === c.button) return null;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            a = nd;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            a = pd;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            a = qd;
            break;
          case Zb:
          case $b:
          case ac:
            a = Yc;
            break;
          case bc:
            a = rd;
            break;
          case "scroll":
            a = $c;
            break;
          case "wheel":
            a = sd;
            break;
          case "copy":
          case "cut":
          case "paste":
            a = Zc;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            a = od;
            break;
          default:
            a = E;
        }
        b = a.getPooled(e, b, c, d);
        Sc(b);
        return b;
      } };
      var Fd = q.unstable_UserBlockingPriority;
      var Gd = q.unstable_runWithPriority;
      var Hd = Ed.getEventPriority;
      var Id = 10;
      var Jd = [];
      function Kd(a) {
        var b = a.targetInst, c = b;
        do {
          if (!c) {
            a.ancestors.push(c);
            break;
          }
          var d = c;
          if (3 === d.tag) d = d.stateNode.containerInfo;
          else {
            for (; d.return; ) d = d.return;
            d = 3 !== d.tag ? null : d.stateNode.containerInfo;
          }
          if (!d) break;
          b = c.tag;
          5 !== b && 6 !== b || a.ancestors.push(c);
          c = Fc(d);
        } while (c);
        for (c = 0; c < a.ancestors.length; c++) {
          b = a.ancestors[c];
          var e = Mc(a.nativeEvent);
          d = a.topLevelType;
          for (var f = a.nativeEvent, g = a.eventSystemFlags, h = null, k = 0; k < ea.length; k++) {
            var l = ea[k];
            l && (l = l.extractEvents(d, b, f, e, g)) && (h = xa(h, l));
          }
          Ba(h);
        }
      }
      var Ld = true;
      function F(a, b) {
        Md(b, a, false);
      }
      function Md(a, b, c) {
        switch (Hd(b)) {
          case 0:
            var d = Nd.bind(null, b, 1);
            break;
          case 1:
            d = Od.bind(null, b, 1);
            break;
          default:
            d = Pd.bind(null, b, 1);
        }
        c ? a.addEventListener(b, d, true) : a.addEventListener(b, d, false);
      }
      function Nd(a, b, c) {
        ib || gb();
        var d = Pd, e = ib;
        ib = true;
        try {
          fb(d, a, b, c);
        } finally {
          (ib = e) || kb();
        }
      }
      function Od(a, b, c) {
        Gd(Fd, Pd.bind(null, a, b, c));
      }
      function Qd(a, b, c, d) {
        if (Jd.length) {
          var e = Jd.pop();
          e.topLevelType = a;
          e.eventSystemFlags = b;
          e.nativeEvent = c;
          e.targetInst = d;
          a = e;
        } else a = { topLevelType: a, eventSystemFlags: b, nativeEvent: c, targetInst: d, ancestors: [] };
        try {
          if (b = Kd, c = a, jb) b(c, void 0);
          else {
            jb = true;
            try {
              hb(b, c, void 0);
            } finally {
              jb = false, kb();
            }
          }
        } finally {
          a.topLevelType = null, a.nativeEvent = null, a.targetInst = null, a.ancestors.length = 0, Jd.length < Id && Jd.push(a);
        }
      }
      function Pd(a, b, c) {
        if (Ld) if (0 < nc.length && -1 < uc.indexOf(a)) a = zc(null, a, b, c), nc.push(a);
        else {
          var d = Hc(a, b, c);
          null === d ? Ac(a, c) : -1 < uc.indexOf(a) ? (a = zc(d, a, b, c), nc.push(a)) : Dc(d, a, b, c) || (Ac(a, c), Qd(a, b, c, null));
        }
      }
      function Hc(a, b, c) {
        var d = Mc(c);
        d = Fc(d);
        if (null !== d) {
          var e = ec(d);
          if (null === e) d = null;
          else {
            var f = e.tag;
            if (13 === f) {
              d = fc(e);
              if (null !== d) return d;
              d = null;
            } else if (3 === f) {
              if (e.stateNode.hydrate) return 3 === e.tag ? e.stateNode.containerInfo : null;
              d = null;
            } else e !== d && (d = null);
          }
        }
        Qd(a, b, c, d);
        return null;
      }
      function Rd(a) {
        if (!Ya) return false;
        a = "on" + a;
        var b = a in document;
        b || (b = document.createElement("div"), b.setAttribute(a, "return;"), b = "function" === typeof b[a]);
        return b;
      }
      var Sd = new ("function" === typeof WeakMap ? WeakMap : Map)();
      function xc(a) {
        var b = Sd.get(a);
        void 0 === b && (b = /* @__PURE__ */ new Set(), Sd.set(a, b));
        return b;
      }
      function yc(a, b, c) {
        if (!c.has(a)) {
          switch (a) {
            case "scroll":
              Md(b, "scroll", true);
              break;
            case "focus":
            case "blur":
              Md(b, "focus", true);
              Md(b, "blur", true);
              c.add("blur");
              c.add("focus");
              break;
            case "cancel":
            case "close":
              Rd(a) && Md(b, a, true);
              break;
            case "invalid":
            case "submit":
            case "reset":
              break;
            default:
              -1 === dc.indexOf(a) && F(a, b);
          }
          c.add(a);
        }
      }
      var Td = {
        animationIterationCount: true,
        borderImageOutset: true,
        borderImageSlice: true,
        borderImageWidth: true,
        boxFlex: true,
        boxFlexGroup: true,
        boxOrdinalGroup: true,
        columnCount: true,
        columns: true,
        flex: true,
        flexGrow: true,
        flexPositive: true,
        flexShrink: true,
        flexNegative: true,
        flexOrder: true,
        gridArea: true,
        gridRow: true,
        gridRowEnd: true,
        gridRowSpan: true,
        gridRowStart: true,
        gridColumn: true,
        gridColumnEnd: true,
        gridColumnSpan: true,
        gridColumnStart: true,
        fontWeight: true,
        lineClamp: true,
        lineHeight: true,
        opacity: true,
        order: true,
        orphans: true,
        tabSize: true,
        widows: true,
        zIndex: true,
        zoom: true,
        fillOpacity: true,
        floodOpacity: true,
        stopOpacity: true,
        strokeDasharray: true,
        strokeDashoffset: true,
        strokeMiterlimit: true,
        strokeOpacity: true,
        strokeWidth: true
      };
      var Ud = ["Webkit", "ms", "Moz", "O"];
      Object.keys(Td).forEach(function(a) {
        Ud.forEach(function(b) {
          b = b + a.charAt(0).toUpperCase() + a.substring(1);
          Td[b] = Td[a];
        });
      });
      function Vd(a, b, c) {
        return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || Td.hasOwnProperty(a) && Td[a] ? ("" + b).trim() : b + "px";
      }
      function Wd(a, b) {
        a = a.style;
        for (var c in b) if (b.hasOwnProperty(c)) {
          var d = 0 === c.indexOf("--"), e = Vd(c, b[c], d);
          "float" === c && (c = "cssFloat");
          d ? a.setProperty(c, e) : a[c] = e;
        }
      }
      var Xd = n({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
      function Yd(a, b) {
        if (b) {
          if (Xd[a] && (null != b.children || null != b.dangerouslySetInnerHTML)) throw Error(u(137, a, ""));
          if (null != b.dangerouslySetInnerHTML) {
            if (null != b.children) throw Error(u(60));
            if (!("object" === typeof b.dangerouslySetInnerHTML && "__html" in b.dangerouslySetInnerHTML)) throw Error(u(61));
          }
          if (null != b.style && "object" !== typeof b.style) throw Error(u(62, ""));
        }
      }
      function Zd(a, b) {
        if (-1 === a.indexOf("-")) return "string" === typeof b.is;
        switch (a) {
          case "annotation-xml":
          case "color-profile":
          case "font-face":
          case "font-face-src":
          case "font-face-uri":
          case "font-face-format":
          case "font-face-name":
          case "missing-glyph":
            return false;
          default:
            return true;
        }
      }
      function $d(a, b) {
        a = 9 === a.nodeType || 11 === a.nodeType ? a : a.ownerDocument;
        var c = xc(a);
        b = ja[b];
        for (var d = 0; d < b.length; d++) yc(b[d], a, c);
      }
      function ae() {
      }
      function be(a) {
        a = a || ("undefined" !== typeof document ? document : void 0);
        if ("undefined" === typeof a) return null;
        try {
          return a.activeElement || a.body;
        } catch (b) {
          return a.body;
        }
      }
      function ce(a) {
        for (; a && a.firstChild; ) a = a.firstChild;
        return a;
      }
      function de(a, b) {
        var c = ce(a);
        a = 0;
        for (var d; c; ) {
          if (3 === c.nodeType) {
            d = a + c.textContent.length;
            if (a <= b && d >= b) return { node: c, offset: b - a };
            a = d;
          }
          a: {
            for (; c; ) {
              if (c.nextSibling) {
                c = c.nextSibling;
                break a;
              }
              c = c.parentNode;
            }
            c = void 0;
          }
          c = ce(c);
        }
      }
      function ee(a, b) {
        return a && b ? a === b ? true : a && 3 === a.nodeType ? false : b && 3 === b.nodeType ? ee(a, b.parentNode) : "contains" in a ? a.contains(b) : a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : false : false;
      }
      function fe() {
        for (var a = window, b = be(); b instanceof a.HTMLIFrameElement; ) {
          try {
            var c = "string" === typeof b.contentWindow.location.href;
          } catch (d) {
            c = false;
          }
          if (c) a = b.contentWindow;
          else break;
          b = be(a.document);
        }
        return b;
      }
      function ge(a) {
        var b = a && a.nodeName && a.nodeName.toLowerCase();
        return b && ("input" === b && ("text" === a.type || "search" === a.type || "tel" === a.type || "url" === a.type || "password" === a.type) || "textarea" === b || "true" === a.contentEditable);
      }
      var he = "$";
      var ie = "/$";
      var je = "$?";
      var ke = "$!";
      var le = null;
      var me = null;
      function ne(a, b) {
        switch (a) {
          case "button":
          case "input":
          case "select":
          case "textarea":
            return !!b.autoFocus;
        }
        return false;
      }
      function oe(a, b) {
        return "textarea" === a || "option" === a || "noscript" === a || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
      }
      var pe = "function" === typeof setTimeout ? setTimeout : void 0;
      var qe = "function" === typeof clearTimeout ? clearTimeout : void 0;
      function re(a) {
        for (; null != a; a = a.nextSibling) {
          var b = a.nodeType;
          if (1 === b || 3 === b) break;
        }
        return a;
      }
      function se(a) {
        a = a.previousSibling;
        for (var b = 0; a; ) {
          if (8 === a.nodeType) {
            var c = a.data;
            if (c === he || c === ke || c === je) {
              if (0 === b) return a;
              b--;
            } else c === ie && b++;
          }
          a = a.previousSibling;
        }
        return null;
      }
      var te = Math.random().toString(36).slice(2);
      var ue = "__reactInternalInstance$" + te;
      var ve = "__reactEventHandlers$" + te;
      var we = "__reactContainere$" + te;
      function Fc(a) {
        var b = a[ue];
        if (b) return b;
        for (var c = a.parentNode; c; ) {
          if (b = c[we] || c[ue]) {
            c = b.alternate;
            if (null !== b.child || null !== c && null !== c.child) for (a = se(a); null !== a; ) {
              if (c = a[ue]) return c;
              a = se(a);
            }
            return b;
          }
          a = c;
          c = a.parentNode;
        }
        return null;
      }
      function Cc(a) {
        a = a[ue] || a[we];
        return !a || 5 !== a.tag && 6 !== a.tag && 13 !== a.tag && 3 !== a.tag ? null : a;
      }
      function xe(a) {
        if (5 === a.tag || 6 === a.tag) return a.stateNode;
        throw Error(u(33));
      }
      function ye(a) {
        return a[ve] || null;
      }
      var ze = null;
      var Ae = null;
      var Be = null;
      function Ce() {
        if (Be) return Be;
        var a, b = Ae, c = b.length, d, e = "value" in ze ? ze.value : ze.textContent, f = e.length;
        for (a = 0; a < c && b[a] === e[a]; a++) ;
        var g = c - a;
        for (d = 1; d <= g && b[c - d] === e[f - d]; d++) ;
        return Be = e.slice(a, 1 < d ? 1 - d : void 0);
      }
      var De = E.extend({ data: null });
      var Ee = E.extend({ data: null });
      var Fe = [9, 13, 27, 32];
      var Ge = Ya && "CompositionEvent" in window;
      var He = null;
      Ya && "documentMode" in document && (He = document.documentMode);
      var Ie = Ya && "TextEvent" in window && !He;
      var Je = Ya && (!Ge || He && 8 < He && 11 >= He);
      var Ke = String.fromCharCode(32);
      var Le = { beforeInput: { phasedRegistrationNames: { bubbled: "onBeforeInput", captured: "onBeforeInputCapture" }, dependencies: ["compositionend", "keypress", "textInput", "paste"] }, compositionEnd: { phasedRegistrationNames: { bubbled: "onCompositionEnd", captured: "onCompositionEndCapture" }, dependencies: "blur compositionend keydown keypress keyup mousedown".split(" ") }, compositionStart: { phasedRegistrationNames: {
        bubbled: "onCompositionStart",
        captured: "onCompositionStartCapture"
      }, dependencies: "blur compositionstart keydown keypress keyup mousedown".split(" ") }, compositionUpdate: { phasedRegistrationNames: { bubbled: "onCompositionUpdate", captured: "onCompositionUpdateCapture" }, dependencies: "blur compositionupdate keydown keypress keyup mousedown".split(" ") } };
      var Me = false;
      function Ne(a, b) {
        switch (a) {
          case "keyup":
            return -1 !== Fe.indexOf(b.keyCode);
          case "keydown":
            return 229 !== b.keyCode;
          case "keypress":
          case "mousedown":
          case "blur":
            return true;
          default:
            return false;
        }
      }
      function Oe(a) {
        a = a.detail;
        return "object" === typeof a && "data" in a ? a.data : null;
      }
      var Pe = false;
      function Qe(a, b) {
        switch (a) {
          case "compositionend":
            return Oe(b);
          case "keypress":
            if (32 !== b.which) return null;
            Me = true;
            return Ke;
          case "textInput":
            return a = b.data, a === Ke && Me ? null : a;
          default:
            return null;
        }
      }
      function Re(a, b) {
        if (Pe) return "compositionend" === a || !Ge && Ne(a, b) ? (a = Ce(), Be = Ae = ze = null, Pe = false, a) : null;
        switch (a) {
          case "paste":
            return null;
          case "keypress":
            if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
              if (b.char && 1 < b.char.length) return b.char;
              if (b.which) return String.fromCharCode(b.which);
            }
            return null;
          case "compositionend":
            return Je && "ko" !== b.locale ? null : b.data;
          default:
            return null;
        }
      }
      var Se = { eventTypes: Le, extractEvents: function(a, b, c, d) {
        var e;
        if (Ge) b: {
          switch (a) {
            case "compositionstart":
              var f = Le.compositionStart;
              break b;
            case "compositionend":
              f = Le.compositionEnd;
              break b;
            case "compositionupdate":
              f = Le.compositionUpdate;
              break b;
          }
          f = void 0;
        }
        else Pe ? Ne(a, c) && (f = Le.compositionEnd) : "keydown" === a && 229 === c.keyCode && (f = Le.compositionStart);
        f ? (Je && "ko" !== c.locale && (Pe || f !== Le.compositionStart ? f === Le.compositionEnd && Pe && (e = Ce()) : (ze = d, Ae = "value" in ze ? ze.value : ze.textContent, Pe = true)), f = De.getPooled(
          f,
          b,
          c,
          d
        ), e ? f.data = e : (e = Oe(c), null !== e && (f.data = e)), Sc(f), e = f) : e = null;
        (a = Ie ? Qe(a, c) : Re(a, c)) ? (b = Ee.getPooled(Le.beforeInput, b, c, d), b.data = a, Sc(b)) : b = null;
        return null === e ? b : null === b ? e : [e, b];
      } };
      var Te = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
      function Ue(a) {
        var b = a && a.nodeName && a.nodeName.toLowerCase();
        return "input" === b ? !!Te[a.type] : "textarea" === b ? true : false;
      }
      var Ve = { change: { phasedRegistrationNames: { bubbled: "onChange", captured: "onChangeCapture" }, dependencies: "blur change click focus input keydown keyup selectionchange".split(" ") } };
      function We(a, b, c) {
        a = E.getPooled(Ve.change, a, b, c);
        a.type = "change";
        cb(c);
        Sc(a);
        return a;
      }
      var Xe = null;
      var Ye = null;
      function Ze(a) {
        Ba(a);
      }
      function $e(a) {
        var b = xe(a);
        if (zb(b)) return a;
      }
      function af(a, b) {
        if ("change" === a) return b;
      }
      var bf = false;
      Ya && (bf = Rd("input") && (!document.documentMode || 9 < document.documentMode));
      function cf() {
        Xe && (Xe.detachEvent("onpropertychange", df), Ye = Xe = null);
      }
      function df(a) {
        if ("value" === a.propertyName && $e(Ye)) if (a = We(Ye, a, Mc(a)), ib) Ba(a);
        else {
          ib = true;
          try {
            eb(Ze, a);
          } finally {
            ib = false, kb();
          }
        }
      }
      function ef(a, b, c) {
        "focus" === a ? (cf(), Xe = b, Ye = c, Xe.attachEvent("onpropertychange", df)) : "blur" === a && cf();
      }
      function ff(a) {
        if ("selectionchange" === a || "keyup" === a || "keydown" === a) return $e(Ye);
      }
      function gf(a, b) {
        if ("click" === a) return $e(b);
      }
      function hf(a, b) {
        if ("input" === a || "change" === a) return $e(b);
      }
      var jf = { eventTypes: Ve, _isInputEventSupported: bf, extractEvents: function(a, b, c, d) {
        var e = b ? xe(b) : window, f = e.nodeName && e.nodeName.toLowerCase();
        if ("select" === f || "input" === f && "file" === e.type) var g = af;
        else if (Ue(e)) if (bf) g = hf;
        else {
          g = ff;
          var h = ef;
        }
        else (f = e.nodeName) && "input" === f.toLowerCase() && ("checkbox" === e.type || "radio" === e.type) && (g = gf);
        if (g && (g = g(a, b))) return We(g, c, d);
        h && h(a, e, b);
        "blur" === a && (a = e._wrapperState) && a.controlled && "number" === e.type && Fb(e, "number", e.value);
      } };
      var kf = { mouseEnter: {
        registrationName: "onMouseEnter",
        dependencies: ["mouseout", "mouseover"]
      }, mouseLeave: { registrationName: "onMouseLeave", dependencies: ["mouseout", "mouseover"] }, pointerEnter: { registrationName: "onPointerEnter", dependencies: ["pointerout", "pointerover"] }, pointerLeave: { registrationName: "onPointerLeave", dependencies: ["pointerout", "pointerover"] } };
      var lf;
      var mf = { eventTypes: kf, extractEvents: function(a, b, c, d, e) {
        var f = "mouseover" === a || "pointerover" === a, g = "mouseout" === a || "pointerout" === a;
        if (f && 0 === (e & 32) && (c.relatedTarget || c.fromElement) || !g && !f) return null;
        e = d.window === d ? d : (e = d.ownerDocument) ? e.defaultView || e.parentWindow : window;
        if (g) {
          if (g = b, b = (b = c.relatedTarget || c.toElement) ? Fc(b) : null, null !== b && (f = ec(b), b !== f || 5 !== b.tag && 6 !== b.tag)) b = null;
        } else g = null;
        if (g === b) return null;
        if ("mouseout" === a || "mouseover" === a) {
          var h = nd;
          var k = kf.mouseLeave;
          var l = kf.mouseEnter;
          var m = "mouse";
        } else if ("pointerout" === a || "pointerover" === a) h = od, k = kf.pointerLeave, l = kf.pointerEnter, m = "pointer";
        a = null == g ? e : xe(g);
        e = null == b ? e : xe(b);
        k = h.getPooled(k, g, c, d);
        k.type = m + "leave";
        k.target = a;
        k.relatedTarget = e;
        d = h.getPooled(l, b, c, d);
        d.type = m + "enter";
        d.target = e;
        d.relatedTarget = a;
        h = g;
        m = b;
        if (h && m) a: {
          l = h;
          a = m;
          g = 0;
          for (b = l; b; b = Nc(b)) g++;
          b = 0;
          for (e = a; e; e = Nc(e)) b++;
          for (; 0 < g - b; ) l = Nc(l), g--;
          for (; 0 < b - g; ) a = Nc(a), b--;
          for (; g--; ) {
            if (l === a || l === a.alternate) break a;
            l = Nc(l);
            a = Nc(a);
          }
          l = null;
        }
        else l = null;
        a = l;
        for (l = []; h && h !== a; ) {
          g = h.alternate;
          if (null !== g && g === a) break;
          l.push(h);
          h = Nc(h);
        }
        for (h = []; m && m !== a; ) {
          g = m.alternate;
          if (null !== g && g === a) break;
          h.push(m);
          m = Nc(m);
        }
        for (m = 0; m < l.length; m++) Qc(l[m], "bubbled", k);
        for (m = h.length; 0 < m--; ) Qc(h[m], "captured", d);
        if (c === lf) return lf = null, [k];
        lf = c;
        return [k, d];
      } };
      function nf(a, b) {
        return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
      }
      var of = "function" === typeof Object.is ? Object.is : nf;
      var pf = Object.prototype.hasOwnProperty;
      function qf(a, b) {
        if (of(a, b)) return true;
        if ("object" !== typeof a || null === a || "object" !== typeof b || null === b) return false;
        var c = Object.keys(a), d = Object.keys(b);
        if (c.length !== d.length) return false;
        for (d = 0; d < c.length; d++) if (!pf.call(b, c[d]) || !of(a[c[d]], b[c[d]])) return false;
        return true;
      }
      var rf = Ya && "documentMode" in document && 11 >= document.documentMode;
      var sf = { select: { phasedRegistrationNames: { bubbled: "onSelect", captured: "onSelectCapture" }, dependencies: "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(" ") } };
      var tf = null;
      var uf = null;
      var vf = null;
      var wf = false;
      function xf(a, b) {
        var c = b.window === b ? b.document : 9 === b.nodeType ? b : b.ownerDocument;
        if (wf || null == tf || tf !== be(c)) return null;
        c = tf;
        "selectionStart" in c && ge(c) ? c = { start: c.selectionStart, end: c.selectionEnd } : (c = (c.ownerDocument && c.ownerDocument.defaultView || window).getSelection(), c = { anchorNode: c.anchorNode, anchorOffset: c.anchorOffset, focusNode: c.focusNode, focusOffset: c.focusOffset });
        return vf && qf(vf, c) ? null : (vf = c, a = E.getPooled(sf.select, uf, a, b), a.type = "select", a.target = tf, Sc(a), a);
      }
      var yf = { eventTypes: sf, extractEvents: function(a, b, c, d) {
        var e = d.window === d ? d.document : 9 === d.nodeType ? d : d.ownerDocument, f;
        if (!(f = !e)) {
          a: {
            e = xc(e);
            f = ja.onSelect;
            for (var g = 0; g < f.length; g++) if (!e.has(f[g])) {
              e = false;
              break a;
            }
            e = true;
          }
          f = !e;
        }
        if (f) return null;
        e = b ? xe(b) : window;
        switch (a) {
          case "focus":
            if (Ue(e) || "true" === e.contentEditable) tf = e, uf = b, vf = null;
            break;
          case "blur":
            vf = uf = tf = null;
            break;
          case "mousedown":
            wf = true;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            return wf = false, xf(c, d);
          case "selectionchange":
            if (rf) break;
          case "keydown":
          case "keyup":
            return xf(c, d);
        }
        return null;
      } };
      Ca.injectEventPluginOrder("ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(" "));
      var zf = Cc;
      sa = ye;
      ua = zf;
      va = xe;
      Ca.injectEventPluginsByName({ SimpleEventPlugin: Ed, EnterLeaveEventPlugin: mf, ChangeEventPlugin: jf, SelectEventPlugin: yf, BeforeInputEventPlugin: Se });
      var Af = [];
      var Bf = -1;
      function G(a) {
        0 > Bf || (a.current = Af[Bf], Af[Bf] = null, Bf--);
      }
      function I(a, b) {
        Bf++;
        Af[Bf] = a.current;
        a.current = b;
      }
      var Cf = {};
      var J = { current: Cf };
      var K = { current: false };
      var Df = Cf;
      function Ef(a, b) {
        var c = a.type.contextTypes;
        if (!c) return Cf;
        var d = a.stateNode;
        if (d && d.__reactInternalMemoizedUnmaskedChildContext === b) return d.__reactInternalMemoizedMaskedChildContext;
        var e = {}, f;
        for (f in c) e[f] = b[f];
        d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = b, a.__reactInternalMemoizedMaskedChildContext = e);
        return e;
      }
      function L(a) {
        a = a.childContextTypes;
        return null !== a && void 0 !== a;
      }
      function Ff(a) {
        G(K, a);
        G(J, a);
      }
      function Gf(a) {
        G(K, a);
        G(J, a);
      }
      function Hf(a, b, c) {
        if (J.current !== Cf) throw Error(u(168));
        I(J, b, a);
        I(K, c, a);
      }
      function If(a, b, c) {
        var d = a.stateNode;
        a = b.childContextTypes;
        if ("function" !== typeof d.getChildContext) return c;
        d = d.getChildContext();
        for (var e in d) if (!(e in a)) throw Error(u(108, Wa(b) || "Unknown", e));
        return n({}, c, {}, d);
      }
      function Jf(a) {
        var b = a.stateNode;
        b = b && b.__reactInternalMemoizedMergedChildContext || Cf;
        Df = J.current;
        I(J, b, a);
        I(K, K.current, a);
        return true;
      }
      function Kf(a, b, c) {
        var d = a.stateNode;
        if (!d) throw Error(u(169));
        c ? (b = If(a, b, Df), d.__reactInternalMemoizedMergedChildContext = b, G(K, a), G(J, a), I(J, b, a)) : G(K, a);
        I(K, c, a);
      }
      var Lf = q.unstable_runWithPriority;
      var Mf = q.unstable_scheduleCallback;
      var Nf = q.unstable_cancelCallback;
      var Of = q.unstable_shouldYield;
      var Pf = q.unstable_requestPaint;
      var Qf = q.unstable_now;
      var Rf = q.unstable_getCurrentPriorityLevel;
      var Sf = q.unstable_ImmediatePriority;
      var Tf = q.unstable_UserBlockingPriority;
      var Uf = q.unstable_NormalPriority;
      var Vf = q.unstable_LowPriority;
      var Wf = q.unstable_IdlePriority;
      var Xf = {};
      var Yf = void 0 !== Pf ? Pf : function() {
      };
      var Zf = null;
      var $f = null;
      var ag = false;
      var bg = Qf();
      var cg = 1e4 > bg ? Qf : function() {
        return Qf() - bg;
      };
      function dg() {
        switch (Rf()) {
          case Sf:
            return 99;
          case Tf:
            return 98;
          case Uf:
            return 97;
          case Vf:
            return 96;
          case Wf:
            return 95;
          default:
            throw Error(u(332));
        }
      }
      function eg(a) {
        switch (a) {
          case 99:
            return Sf;
          case 98:
            return Tf;
          case 97:
            return Uf;
          case 96:
            return Vf;
          case 95:
            return Wf;
          default:
            throw Error(u(332));
        }
      }
      function fg(a, b) {
        a = eg(a);
        return Lf(a, b);
      }
      function gg(a, b, c) {
        a = eg(a);
        return Mf(a, b, c);
      }
      function hg(a) {
        null === Zf ? (Zf = [a], $f = Mf(Sf, ig)) : Zf.push(a);
        return Xf;
      }
      function jg() {
        if (null !== $f) {
          var a = $f;
          $f = null;
          Nf(a);
        }
        ig();
      }
      function ig() {
        if (!ag && null !== Zf) {
          ag = true;
          var a = 0;
          try {
            var b = Zf;
            fg(99, function() {
              for (; a < b.length; a++) {
                var c = b[a];
                do
                  c = c(true);
                while (null !== c);
              }
            });
            Zf = null;
          } catch (c) {
            throw null !== Zf && (Zf = Zf.slice(a + 1)), Mf(Sf, jg), c;
          } finally {
            ag = false;
          }
        }
      }
      var kg = 3;
      function lg(a, b, c) {
        c /= 10;
        return 1073741821 - (((1073741821 - a + b / 10) / c | 0) + 1) * c;
      }
      function mg(a, b) {
        if (a && a.defaultProps) {
          b = n({}, b);
          a = a.defaultProps;
          for (var c in a) void 0 === b[c] && (b[c] = a[c]);
        }
        return b;
      }
      var ng = { current: null };
      var og = null;
      var pg = null;
      var qg = null;
      function rg() {
        qg = pg = og = null;
      }
      function sg(a, b) {
        var c = a.type._context;
        I(ng, c._currentValue, a);
        c._currentValue = b;
      }
      function tg(a) {
        var b = ng.current;
        G(ng, a);
        a.type._context._currentValue = b;
      }
      function ug(a, b) {
        for (; null !== a; ) {
          var c = a.alternate;
          if (a.childExpirationTime < b) a.childExpirationTime = b, null !== c && c.childExpirationTime < b && (c.childExpirationTime = b);
          else if (null !== c && c.childExpirationTime < b) c.childExpirationTime = b;
          else break;
          a = a.return;
        }
      }
      function vg(a, b) {
        og = a;
        qg = pg = null;
        a = a.dependencies;
        null !== a && null !== a.firstContext && (a.expirationTime >= b && (wg = true), a.firstContext = null);
      }
      function xg(a, b) {
        if (qg !== a && false !== b && 0 !== b) {
          if ("number" !== typeof b || 1073741823 === b) qg = a, b = 1073741823;
          b = { context: a, observedBits: b, next: null };
          if (null === pg) {
            if (null === og) throw Error(u(308));
            pg = b;
            og.dependencies = { expirationTime: 0, firstContext: b, responders: null };
          } else pg = pg.next = b;
        }
        return a._currentValue;
      }
      var yg = false;
      function zg(a) {
        return { baseState: a, firstUpdate: null, lastUpdate: null, firstCapturedUpdate: null, lastCapturedUpdate: null, firstEffect: null, lastEffect: null, firstCapturedEffect: null, lastCapturedEffect: null };
      }
      function Ag(a) {
        return { baseState: a.baseState, firstUpdate: a.firstUpdate, lastUpdate: a.lastUpdate, firstCapturedUpdate: null, lastCapturedUpdate: null, firstEffect: null, lastEffect: null, firstCapturedEffect: null, lastCapturedEffect: null };
      }
      function Bg(a, b) {
        return { expirationTime: a, suspenseConfig: b, tag: 0, payload: null, callback: null, next: null, nextEffect: null };
      }
      function Cg(a, b) {
        null === a.lastUpdate ? a.firstUpdate = a.lastUpdate = b : (a.lastUpdate.next = b, a.lastUpdate = b);
      }
      function Dg(a, b) {
        var c = a.alternate;
        if (null === c) {
          var d = a.updateQueue;
          var e = null;
          null === d && (d = a.updateQueue = zg(a.memoizedState));
        } else d = a.updateQueue, e = c.updateQueue, null === d ? null === e ? (d = a.updateQueue = zg(a.memoizedState), e = c.updateQueue = zg(c.memoizedState)) : d = a.updateQueue = Ag(e) : null === e && (e = c.updateQueue = Ag(d));
        null === e || d === e ? Cg(d, b) : null === d.lastUpdate || null === e.lastUpdate ? (Cg(d, b), Cg(e, b)) : (Cg(d, b), e.lastUpdate = b);
      }
      function Eg(a, b) {
        var c = a.updateQueue;
        c = null === c ? a.updateQueue = zg(a.memoizedState) : Fg(a, c);
        null === c.lastCapturedUpdate ? c.firstCapturedUpdate = c.lastCapturedUpdate = b : (c.lastCapturedUpdate.next = b, c.lastCapturedUpdate = b);
      }
      function Fg(a, b) {
        var c = a.alternate;
        null !== c && b === c.updateQueue && (b = a.updateQueue = Ag(b));
        return b;
      }
      function Gg(a, b, c, d, e, f) {
        switch (c.tag) {
          case 1:
            return a = c.payload, "function" === typeof a ? a.call(f, d, e) : a;
          case 3:
            a.effectTag = a.effectTag & -4097 | 64;
          case 0:
            a = c.payload;
            e = "function" === typeof a ? a.call(f, d, e) : a;
            if (null === e || void 0 === e) break;
            return n({}, d, e);
          case 2:
            yg = true;
        }
        return d;
      }
      function Hg(a, b, c, d, e) {
        yg = false;
        b = Fg(a, b);
        for (var f = b.baseState, g = null, h = 0, k = b.firstUpdate, l = f; null !== k; ) {
          var m = k.expirationTime;
          m < e ? (null === g && (g = k, f = l), h < m && (h = m)) : (Ig(m, k.suspenseConfig), l = Gg(a, b, k, l, c, d), null !== k.callback && (a.effectTag |= 32, k.nextEffect = null, null === b.lastEffect ? b.firstEffect = b.lastEffect = k : (b.lastEffect.nextEffect = k, b.lastEffect = k)));
          k = k.next;
        }
        m = null;
        for (k = b.firstCapturedUpdate; null !== k; ) {
          var C = k.expirationTime;
          C < e ? (null === m && (m = k, null === g && (f = l)), h < C && (h = C)) : (l = Gg(a, b, k, l, c, d), null !== k.callback && (a.effectTag |= 32, k.nextEffect = null, null === b.lastCapturedEffect ? b.firstCapturedEffect = b.lastCapturedEffect = k : (b.lastCapturedEffect.nextEffect = k, b.lastCapturedEffect = k)));
          k = k.next;
        }
        null === g && (b.lastUpdate = null);
        null === m ? b.lastCapturedUpdate = null : a.effectTag |= 32;
        null === g && null === m && (f = l);
        b.baseState = f;
        b.firstUpdate = g;
        b.firstCapturedUpdate = m;
        Jg(h);
        a.expirationTime = h;
        a.memoizedState = l;
      }
      function Kg(a, b, c) {
        null !== b.firstCapturedUpdate && (null !== b.lastUpdate && (b.lastUpdate.next = b.firstCapturedUpdate, b.lastUpdate = b.lastCapturedUpdate), b.firstCapturedUpdate = b.lastCapturedUpdate = null);
        Lg(b.firstEffect, c);
        b.firstEffect = b.lastEffect = null;
        Lg(b.firstCapturedEffect, c);
        b.firstCapturedEffect = b.lastCapturedEffect = null;
      }
      function Lg(a, b) {
        for (; null !== a; ) {
          var c = a.callback;
          if (null !== c) {
            a.callback = null;
            var d = b;
            if ("function" !== typeof c) throw Error(u(191, c));
            c.call(d);
          }
          a = a.nextEffect;
        }
      }
      var Mg = Ea.ReactCurrentBatchConfig;
      var Ng = new aa.Component().refs;
      function Og(a, b, c, d) {
        b = a.memoizedState;
        c = c(d, b);
        c = null === c || void 0 === c ? b : n({}, b, c);
        a.memoizedState = c;
        d = a.updateQueue;
        null !== d && 0 === a.expirationTime && (d.baseState = c);
      }
      var Sg = { isMounted: function(a) {
        return (a = a._reactInternalFiber) ? ec(a) === a : false;
      }, enqueueSetState: function(a, b, c) {
        a = a._reactInternalFiber;
        var d = Pg(), e = Mg.suspense;
        d = Qg(d, a, e);
        e = Bg(d, e);
        e.payload = b;
        void 0 !== c && null !== c && (e.callback = c);
        Dg(a, e);
        Rg(a, d);
      }, enqueueReplaceState: function(a, b, c) {
        a = a._reactInternalFiber;
        var d = Pg(), e = Mg.suspense;
        d = Qg(d, a, e);
        e = Bg(d, e);
        e.tag = 1;
        e.payload = b;
        void 0 !== c && null !== c && (e.callback = c);
        Dg(a, e);
        Rg(a, d);
      }, enqueueForceUpdate: function(a, b) {
        a = a._reactInternalFiber;
        var c = Pg(), d = Mg.suspense;
        c = Qg(c, a, d);
        d = Bg(c, d);
        d.tag = 2;
        void 0 !== b && null !== b && (d.callback = b);
        Dg(a, d);
        Rg(a, c);
      } };
      function Tg(a, b, c, d, e, f, g) {
        a = a.stateNode;
        return "function" === typeof a.shouldComponentUpdate ? a.shouldComponentUpdate(d, f, g) : b.prototype && b.prototype.isPureReactComponent ? !qf(c, d) || !qf(e, f) : true;
      }
      function Ug(a, b, c) {
        var d = false, e = Cf;
        var f = b.contextType;
        "object" === typeof f && null !== f ? f = xg(f) : (e = L(b) ? Df : J.current, d = b.contextTypes, f = (d = null !== d && void 0 !== d) ? Ef(a, e) : Cf);
        b = new b(c, f);
        a.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
        b.updater = Sg;
        a.stateNode = b;
        b._reactInternalFiber = a;
        d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = e, a.__reactInternalMemoizedMaskedChildContext = f);
        return b;
      }
      function Vg(a, b, c, d) {
        a = b.state;
        "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d);
        "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d);
        b.state !== a && Sg.enqueueReplaceState(b, b.state, null);
      }
      function Wg(a, b, c, d) {
        var e = a.stateNode;
        e.props = c;
        e.state = a.memoizedState;
        e.refs = Ng;
        var f = b.contextType;
        "object" === typeof f && null !== f ? e.context = xg(f) : (f = L(b) ? Df : J.current, e.context = Ef(a, f));
        f = a.updateQueue;
        null !== f && (Hg(a, f, c, e, d), e.state = a.memoizedState);
        f = b.getDerivedStateFromProps;
        "function" === typeof f && (Og(a, b, f, c), e.state = a.memoizedState);
        "function" === typeof b.getDerivedStateFromProps || "function" === typeof e.getSnapshotBeforeUpdate || "function" !== typeof e.UNSAFE_componentWillMount && "function" !== typeof e.componentWillMount || (b = e.state, "function" === typeof e.componentWillMount && e.componentWillMount(), "function" === typeof e.UNSAFE_componentWillMount && e.UNSAFE_componentWillMount(), b !== e.state && Sg.enqueueReplaceState(e, e.state, null), f = a.updateQueue, null !== f && (Hg(a, f, c, e, d), e.state = a.memoizedState));
        "function" === typeof e.componentDidMount && (a.effectTag |= 4);
      }
      var Xg = Array.isArray;
      function Yg(a, b, c) {
        a = c.ref;
        if (null !== a && "function" !== typeof a && "object" !== typeof a) {
          if (c._owner) {
            c = c._owner;
            if (c) {
              if (1 !== c.tag) throw Error(u(309));
              var d = c.stateNode;
            }
            if (!d) throw Error(u(147, a));
            var e = "" + a;
            if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === e) return b.ref;
            b = function(a2) {
              var b2 = d.refs;
              b2 === Ng && (b2 = d.refs = {});
              null === a2 ? delete b2[e] : b2[e] = a2;
            };
            b._stringRef = e;
            return b;
          }
          if ("string" !== typeof a) throw Error(u(284));
          if (!c._owner) throw Error(u(290, a));
        }
        return a;
      }
      function Zg(a, b) {
        if ("textarea" !== a.type) throw Error(u(31, "[object Object]" === Object.prototype.toString.call(b) ? "object with keys {" + Object.keys(b).join(", ") + "}" : b, ""));
      }
      function $g(a) {
        function b(b2, c2) {
          if (a) {
            var d2 = b2.lastEffect;
            null !== d2 ? (d2.nextEffect = c2, b2.lastEffect = c2) : b2.firstEffect = b2.lastEffect = c2;
            c2.nextEffect = null;
            c2.effectTag = 8;
          }
        }
        function c(c2, d2) {
          if (!a) return null;
          for (; null !== d2; ) b(c2, d2), d2 = d2.sibling;
          return null;
        }
        function d(a2, b2) {
          for (a2 = /* @__PURE__ */ new Map(); null !== b2; ) null !== b2.key ? a2.set(b2.key, b2) : a2.set(b2.index, b2), b2 = b2.sibling;
          return a2;
        }
        function e(a2, b2, c2) {
          a2 = ah(a2, b2, c2);
          a2.index = 0;
          a2.sibling = null;
          return a2;
        }
        function f(b2, c2, d2) {
          b2.index = d2;
          if (!a) return c2;
          d2 = b2.alternate;
          if (null !== d2) return d2 = d2.index, d2 < c2 ? (b2.effectTag = 2, c2) : d2;
          b2.effectTag = 2;
          return c2;
        }
        function g(b2) {
          a && null === b2.alternate && (b2.effectTag = 2);
          return b2;
        }
        function h(a2, b2, c2, d2) {
          if (null === b2 || 6 !== b2.tag) return b2 = bh(c2, a2.mode, d2), b2.return = a2, b2;
          b2 = e(b2, c2, d2);
          b2.return = a2;
          return b2;
        }
        function k(a2, b2, c2, d2) {
          if (null !== b2 && b2.elementType === c2.type) return d2 = e(b2, c2.props, d2), d2.ref = Yg(a2, b2, c2), d2.return = a2, d2;
          d2 = ch(c2.type, c2.key, c2.props, null, a2.mode, d2);
          d2.ref = Yg(a2, b2, c2);
          d2.return = a2;
          return d2;
        }
        function l(a2, b2, c2, d2) {
          if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c2.containerInfo || b2.stateNode.implementation !== c2.implementation) return b2 = dh(c2, a2.mode, d2), b2.return = a2, b2;
          b2 = e(b2, c2.children || [], d2);
          b2.return = a2;
          return b2;
        }
        function m(a2, b2, c2, d2, f2) {
          if (null === b2 || 7 !== b2.tag) return b2 = eh(c2, a2.mode, d2, f2), b2.return = a2, b2;
          b2 = e(b2, c2, d2);
          b2.return = a2;
          return b2;
        }
        function C(a2, b2, c2) {
          if ("string" === typeof b2 || "number" === typeof b2) return b2 = bh("" + b2, a2.mode, c2), b2.return = a2, b2;
          if ("object" === typeof b2 && null !== b2) {
            switch (b2.$$typeof) {
              case Ga:
                return c2 = ch(b2.type, b2.key, b2.props, null, a2.mode, c2), c2.ref = Yg(a2, null, b2), c2.return = a2, c2;
              case Ha:
                return b2 = dh(b2, a2.mode, c2), b2.return = a2, b2;
            }
            if (Xg(b2) || Ua(b2)) return b2 = eh(b2, a2.mode, c2, null), b2.return = a2, b2;
            Zg(a2, b2);
          }
          return null;
        }
        function y(a2, b2, c2, d2) {
          var e2 = null !== b2 ? b2.key : null;
          if ("string" === typeof c2 || "number" === typeof c2) return null !== e2 ? null : h(a2, b2, "" + c2, d2);
          if ("object" === typeof c2 && null !== c2) {
            switch (c2.$$typeof) {
              case Ga:
                return c2.key === e2 ? c2.type === Ia ? m(a2, b2, c2.props.children, d2, e2) : k(a2, b2, c2, d2) : null;
              case Ha:
                return c2.key === e2 ? l(a2, b2, c2, d2) : null;
            }
            if (Xg(c2) || Ua(c2)) return null !== e2 ? null : m(a2, b2, c2, d2, null);
            Zg(a2, c2);
          }
          return null;
        }
        function H(a2, b2, c2, d2, e2) {
          if ("string" === typeof d2 || "number" === typeof d2) return a2 = a2.get(c2) || null, h(b2, a2, "" + d2, e2);
          if ("object" === typeof d2 && null !== d2) {
            switch (d2.$$typeof) {
              case Ga:
                return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, d2.type === Ia ? m(b2, a2, d2.props.children, e2, d2.key) : k(b2, a2, d2, e2);
              case Ha:
                return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, l(b2, a2, d2, e2);
            }
            if (Xg(d2) || Ua(d2)) return a2 = a2.get(c2) || null, m(b2, a2, d2, e2, null);
            Zg(b2, d2);
          }
          return null;
        }
        function z(e2, g2, h2, k2) {
          for (var l2 = null, m2 = null, r = g2, x = g2 = 0, A = null; null !== r && x < h2.length; x++) {
            r.index > x ? (A = r, r = null) : A = r.sibling;
            var p = y(e2, r, h2[x], k2);
            if (null === p) {
              null === r && (r = A);
              break;
            }
            a && r && null === p.alternate && b(e2, r);
            g2 = f(p, g2, x);
            null === m2 ? l2 = p : m2.sibling = p;
            m2 = p;
            r = A;
          }
          if (x === h2.length) return c(e2, r), l2;
          if (null === r) {
            for (; x < h2.length; x++) r = C(e2, h2[x], k2), null !== r && (g2 = f(r, g2, x), null === m2 ? l2 = r : m2.sibling = r, m2 = r);
            return l2;
          }
          for (r = d(e2, r); x < h2.length; x++) A = H(r, e2, x, h2[x], k2), null !== A && (a && null !== A.alternate && r.delete(null === A.key ? x : A.key), g2 = f(A, g2, x), null === m2 ? l2 = A : m2.sibling = A, m2 = A);
          a && r.forEach(function(a2) {
            return b(e2, a2);
          });
          return l2;
        }
        function ta(e2, g2, h2, k2) {
          var l2 = Ua(h2);
          if ("function" !== typeof l2) throw Error(u(150));
          h2 = l2.call(h2);
          if (null == h2) throw Error(u(151));
          for (var m2 = l2 = null, r = g2, x = g2 = 0, A = null, p = h2.next(); null !== r && !p.done; x++, p = h2.next()) {
            r.index > x ? (A = r, r = null) : A = r.sibling;
            var z2 = y(e2, r, p.value, k2);
            if (null === z2) {
              null === r && (r = A);
              break;
            }
            a && r && null === z2.alternate && b(e2, r);
            g2 = f(z2, g2, x);
            null === m2 ? l2 = z2 : m2.sibling = z2;
            m2 = z2;
            r = A;
          }
          if (p.done) return c(e2, r), l2;
          if (null === r) {
            for (; !p.done; x++, p = h2.next()) p = C(e2, p.value, k2), null !== p && (g2 = f(p, g2, x), null === m2 ? l2 = p : m2.sibling = p, m2 = p);
            return l2;
          }
          for (r = d(e2, r); !p.done; x++, p = h2.next()) p = H(r, e2, x, p.value, k2), null !== p && (a && null !== p.alternate && r.delete(null === p.key ? x : p.key), g2 = f(p, g2, x), null === m2 ? l2 = p : m2.sibling = p, m2 = p);
          a && r.forEach(function(a2) {
            return b(e2, a2);
          });
          return l2;
        }
        return function(a2, d2, f2, h2) {
          var k2 = "object" === typeof f2 && null !== f2 && f2.type === Ia && null === f2.key;
          k2 && (f2 = f2.props.children);
          var l2 = "object" === typeof f2 && null !== f2;
          if (l2) switch (f2.$$typeof) {
            case Ga:
              a: {
                l2 = f2.key;
                for (k2 = d2; null !== k2; ) {
                  if (k2.key === l2) if (7 === k2.tag ? f2.type === Ia : k2.elementType === f2.type) {
                    c(a2, k2.sibling);
                    d2 = e(k2, f2.type === Ia ? f2.props.children : f2.props, h2);
                    d2.ref = Yg(a2, k2, f2);
                    d2.return = a2;
                    a2 = d2;
                    break a;
                  } else {
                    c(
                      a2,
                      k2
                    );
                    break;
                  }
                  else b(a2, k2);
                  k2 = k2.sibling;
                }
                f2.type === Ia ? (d2 = eh(f2.props.children, a2.mode, h2, f2.key), d2.return = a2, a2 = d2) : (h2 = ch(f2.type, f2.key, f2.props, null, a2.mode, h2), h2.ref = Yg(a2, d2, f2), h2.return = a2, a2 = h2);
              }
              return g(a2);
            case Ha:
              a: {
                for (k2 = f2.key; null !== d2; ) {
                  if (d2.key === k2) if (4 === d2.tag && d2.stateNode.containerInfo === f2.containerInfo && d2.stateNode.implementation === f2.implementation) {
                    c(a2, d2.sibling);
                    d2 = e(d2, f2.children || [], h2);
                    d2.return = a2;
                    a2 = d2;
                    break a;
                  } else {
                    c(a2, d2);
                    break;
                  }
                  else b(a2, d2);
                  d2 = d2.sibling;
                }
                d2 = dh(f2, a2.mode, h2);
                d2.return = a2;
                a2 = d2;
              }
              return g(a2);
          }
          if ("string" === typeof f2 || "number" === typeof f2) return f2 = "" + f2, null !== d2 && 6 === d2.tag ? (c(a2, d2.sibling), d2 = e(d2, f2, h2), d2.return = a2, a2 = d2) : (c(a2, d2), d2 = bh(f2, a2.mode, h2), d2.return = a2, a2 = d2), g(a2);
          if (Xg(f2)) return z(a2, d2, f2, h2);
          if (Ua(f2)) return ta(a2, d2, f2, h2);
          l2 && Zg(a2, f2);
          if ("undefined" === typeof f2 && !k2) switch (a2.tag) {
            case 1:
            case 0:
              throw a2 = a2.type, Error(u(152, a2.displayName || a2.name || "Component"));
          }
          return c(a2, d2);
        };
      }
      var fh = $g(true);
      var gh = $g(false);
      var hh = {};
      var ih = { current: hh };
      var jh = { current: hh };
      var kh = { current: hh };
      function lh(a) {
        if (a === hh) throw Error(u(174));
        return a;
      }
      function mh(a, b) {
        I(kh, b, a);
        I(jh, a, a);
        I(ih, hh, a);
        var c = b.nodeType;
        switch (c) {
          case 9:
          case 11:
            b = (b = b.documentElement) ? b.namespaceURI : Qb(null, "");
            break;
          default:
            c = 8 === c ? b.parentNode : b, b = c.namespaceURI || null, c = c.tagName, b = Qb(b, c);
        }
        G(ih, a);
        I(ih, b, a);
      }
      function nh(a) {
        G(ih, a);
        G(jh, a);
        G(kh, a);
      }
      function oh(a) {
        lh(kh.current);
        var b = lh(ih.current);
        var c = Qb(b, a.type);
        b !== c && (I(jh, a, a), I(ih, c, a));
      }
      function ph(a) {
        jh.current === a && (G(ih, a), G(jh, a));
      }
      var M = { current: 0 };
      function qh(a) {
        for (var b = a; null !== b; ) {
          if (13 === b.tag) {
            var c = b.memoizedState;
            if (null !== c && (c = c.dehydrated, null === c || c.data === je || c.data === ke)) return b;
          } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
            if (0 !== (b.effectTag & 64)) return b;
          } else if (null !== b.child) {
            b.child.return = b;
            b = b.child;
            continue;
          }
          if (b === a) break;
          for (; null === b.sibling; ) {
            if (null === b.return || b.return === a) return null;
            b = b.return;
          }
          b.sibling.return = b.return;
          b = b.sibling;
        }
        return null;
      }
      function rh(a, b) {
        return { responder: a, props: b };
      }
      var sh = Ea.ReactCurrentDispatcher;
      var N = Ea.ReactCurrentBatchConfig;
      var th = 0;
      var uh = null;
      var O = null;
      var vh = null;
      var wh = null;
      var P = null;
      var xh = null;
      var yh = 0;
      var zh = null;
      var Ah = 0;
      var Bh = false;
      var Ch = null;
      var Gh = 0;
      function Q() {
        throw Error(u(321));
      }
      function Hh(a, b) {
        if (null === b) return false;
        for (var c = 0; c < b.length && c < a.length; c++) if (!of(a[c], b[c])) return false;
        return true;
      }
      function Ih(a, b, c, d, e, f) {
        th = f;
        uh = b;
        vh = null !== a ? a.memoizedState : null;
        sh.current = null === vh ? Jh : Kh;
        b = c(d, e);
        if (Bh) {
          do
            Bh = false, Gh += 1, vh = null !== a ? a.memoizedState : null, xh = wh, zh = P = O = null, sh.current = Kh, b = c(d, e);
          while (Bh);
          Ch = null;
          Gh = 0;
        }
        sh.current = Lh;
        a = uh;
        a.memoizedState = wh;
        a.expirationTime = yh;
        a.updateQueue = zh;
        a.effectTag |= Ah;
        a = null !== O && null !== O.next;
        th = 0;
        xh = P = wh = vh = O = uh = null;
        yh = 0;
        zh = null;
        Ah = 0;
        if (a) throw Error(u(300));
        return b;
      }
      function Mh() {
        sh.current = Lh;
        th = 0;
        xh = P = wh = vh = O = uh = null;
        yh = 0;
        zh = null;
        Ah = 0;
        Bh = false;
        Ch = null;
        Gh = 0;
      }
      function Nh() {
        var a = { memoizedState: null, baseState: null, queue: null, baseUpdate: null, next: null };
        null === P ? wh = P = a : P = P.next = a;
        return P;
      }
      function Oh() {
        if (null !== xh) P = xh, xh = P.next, O = vh, vh = null !== O ? O.next : null;
        else {
          if (null === vh) throw Error(u(310));
          O = vh;
          var a = { memoizedState: O.memoizedState, baseState: O.baseState, queue: O.queue, baseUpdate: O.baseUpdate, next: null };
          P = null === P ? wh = a : P.next = a;
          vh = O.next;
        }
        return P;
      }
      function Ph(a, b) {
        return "function" === typeof b ? b(a) : b;
      }
      function Qh(a) {
        var b = Oh(), c = b.queue;
        if (null === c) throw Error(u(311));
        c.lastRenderedReducer = a;
        if (0 < Gh) {
          var d = c.dispatch;
          if (null !== Ch) {
            var e = Ch.get(c);
            if (void 0 !== e) {
              Ch.delete(c);
              var f = b.memoizedState;
              do
                f = a(f, e.action), e = e.next;
              while (null !== e);
              of(f, b.memoizedState) || (wg = true);
              b.memoizedState = f;
              b.baseUpdate === c.last && (b.baseState = f);
              c.lastRenderedState = f;
              return [f, d];
            }
          }
          return [b.memoizedState, d];
        }
        d = c.last;
        var g = b.baseUpdate;
        f = b.baseState;
        null !== g ? (null !== d && (d.next = null), d = g.next) : d = null !== d ? d.next : null;
        if (null !== d) {
          var h = e = null, k = d, l = false;
          do {
            var m = k.expirationTime;
            m < th ? (l || (l = true, h = g, e = f), m > yh && (yh = m, Jg(yh))) : (Ig(m, k.suspenseConfig), f = k.eagerReducer === a ? k.eagerState : a(f, k.action));
            g = k;
            k = k.next;
          } while (null !== k && k !== d);
          l || (h = g, e = f);
          of(f, b.memoizedState) || (wg = true);
          b.memoizedState = f;
          b.baseUpdate = h;
          b.baseState = e;
          c.lastRenderedState = f;
        }
        return [b.memoizedState, c.dispatch];
      }
      function Rh(a) {
        var b = Nh();
        "function" === typeof a && (a = a());
        b.memoizedState = b.baseState = a;
        a = b.queue = { last: null, dispatch: null, lastRenderedReducer: Ph, lastRenderedState: a };
        a = a.dispatch = Sh.bind(null, uh, a);
        return [b.memoizedState, a];
      }
      function Th(a) {
        return Qh(Ph, a);
      }
      function Uh(a, b, c, d) {
        a = { tag: a, create: b, destroy: c, deps: d, next: null };
        null === zh ? (zh = { lastEffect: null }, zh.lastEffect = a.next = a) : (b = zh.lastEffect, null === b ? zh.lastEffect = a.next = a : (c = b.next, b.next = a, a.next = c, zh.lastEffect = a));
        return a;
      }
      function Vh(a, b, c, d) {
        var e = Nh();
        Ah |= a;
        e.memoizedState = Uh(b, c, void 0, void 0 === d ? null : d);
      }
      function Wh(a, b, c, d) {
        var e = Oh();
        d = void 0 === d ? null : d;
        var f = void 0;
        if (null !== O) {
          var g = O.memoizedState;
          f = g.destroy;
          if (null !== d && Hh(d, g.deps)) {
            Uh(0, c, f, d);
            return;
          }
        }
        Ah |= a;
        e.memoizedState = Uh(b, c, f, d);
      }
      function Xh(a, b) {
        return Vh(516, 192, a, b);
      }
      function Yh(a, b) {
        return Wh(516, 192, a, b);
      }
      function Zh(a, b) {
        if ("function" === typeof b) return a = a(), b(a), function() {
          b(null);
        };
        if (null !== b && void 0 !== b) return a = a(), b.current = a, function() {
          b.current = null;
        };
      }
      function $h() {
      }
      function ai(a, b) {
        Nh().memoizedState = [a, void 0 === b ? null : b];
        return a;
      }
      function bi(a, b) {
        var c = Oh();
        b = void 0 === b ? null : b;
        var d = c.memoizedState;
        if (null !== d && null !== b && Hh(b, d[1])) return d[0];
        c.memoizedState = [a, b];
        return a;
      }
      function Sh(a, b, c) {
        if (!(25 > Gh)) throw Error(u(301));
        var d = a.alternate;
        if (a === uh || null !== d && d === uh) if (Bh = true, a = { expirationTime: th, suspenseConfig: null, action: c, eagerReducer: null, eagerState: null, next: null }, null === Ch && (Ch = /* @__PURE__ */ new Map()), c = Ch.get(b), void 0 === c) Ch.set(b, a);
        else {
          for (b = c; null !== b.next; ) b = b.next;
          b.next = a;
        }
        else {
          var e = Pg(), f = Mg.suspense;
          e = Qg(e, a, f);
          f = { expirationTime: e, suspenseConfig: f, action: c, eagerReducer: null, eagerState: null, next: null };
          var g = b.last;
          if (null === g) f.next = f;
          else {
            var h = g.next;
            null !== h && (f.next = h);
            g.next = f;
          }
          b.last = f;
          if (0 === a.expirationTime && (null === d || 0 === d.expirationTime) && (d = b.lastRenderedReducer, null !== d)) try {
            var k = b.lastRenderedState, l = d(k, c);
            f.eagerReducer = d;
            f.eagerState = l;
            if (of(l, k)) return;
          } catch (m) {
          } finally {
          }
          Rg(a, e);
        }
      }
      var Lh = { readContext: xg, useCallback: Q, useContext: Q, useEffect: Q, useImperativeHandle: Q, useLayoutEffect: Q, useMemo: Q, useReducer: Q, useRef: Q, useState: Q, useDebugValue: Q, useResponder: Q, useDeferredValue: Q, useTransition: Q };
      var Jh = { readContext: xg, useCallback: ai, useContext: xg, useEffect: Xh, useImperativeHandle: function(a, b, c) {
        c = null !== c && void 0 !== c ? c.concat([a]) : null;
        return Vh(4, 36, Zh.bind(null, b, a), c);
      }, useLayoutEffect: function(a, b) {
        return Vh(4, 36, a, b);
      }, useMemo: function(a, b) {
        var c = Nh();
        b = void 0 === b ? null : b;
        a = a();
        c.memoizedState = [a, b];
        return a;
      }, useReducer: function(a, b, c) {
        var d = Nh();
        b = void 0 !== c ? c(b) : b;
        d.memoizedState = d.baseState = b;
        a = d.queue = { last: null, dispatch: null, lastRenderedReducer: a, lastRenderedState: b };
        a = a.dispatch = Sh.bind(null, uh, a);
        return [d.memoizedState, a];
      }, useRef: function(a) {
        var b = Nh();
        a = { current: a };
        return b.memoizedState = a;
      }, useState: Rh, useDebugValue: $h, useResponder: rh, useDeferredValue: function(a, b) {
        var c = Rh(a), d = c[0], e = c[1];
        Xh(function() {
          q.unstable_next(function() {
            var c2 = N.suspense;
            N.suspense = void 0 === b ? null : b;
            try {
              e(a);
            } finally {
              N.suspense = c2;
            }
          });
        }, [a, b]);
        return d;
      }, useTransition: function(a) {
        var b = Rh(false), c = b[0], d = b[1];
        return [ai(function(b2) {
          d(true);
          q.unstable_next(function() {
            var c2 = N.suspense;
            N.suspense = void 0 === a ? null : a;
            try {
              d(false), b2();
            } finally {
              N.suspense = c2;
            }
          });
        }, [a, c]), c];
      } };
      var Kh = { readContext: xg, useCallback: bi, useContext: xg, useEffect: Yh, useImperativeHandle: function(a, b, c) {
        c = null !== c && void 0 !== c ? c.concat([a]) : null;
        return Wh(4, 36, Zh.bind(null, b, a), c);
      }, useLayoutEffect: function(a, b) {
        return Wh(4, 36, a, b);
      }, useMemo: function(a, b) {
        var c = Oh();
        b = void 0 === b ? null : b;
        var d = c.memoizedState;
        if (null !== d && null !== b && Hh(b, d[1])) return d[0];
        a = a();
        c.memoizedState = [a, b];
        return a;
      }, useReducer: Qh, useRef: function() {
        return Oh().memoizedState;
      }, useState: Th, useDebugValue: $h, useResponder: rh, useDeferredValue: function(a, b) {
        var c = Th(a), d = c[0], e = c[1];
        Yh(function() {
          q.unstable_next(function() {
            var c2 = N.suspense;
            N.suspense = void 0 === b ? null : b;
            try {
              e(a);
            } finally {
              N.suspense = c2;
            }
          });
        }, [a, b]);
        return d;
      }, useTransition: function(a) {
        var b = Th(false), c = b[0], d = b[1];
        return [bi(function(b2) {
          d(true);
          q.unstable_next(function() {
            var c2 = N.suspense;
            N.suspense = void 0 === a ? null : a;
            try {
              d(false), b2();
            } finally {
              N.suspense = c2;
            }
          });
        }, [a, c]), c];
      } };
      var ci = null;
      var di = null;
      var ei = false;
      function fi(a, b) {
        var c = gi(5, null, null, 0);
        c.elementType = "DELETED";
        c.type = "DELETED";
        c.stateNode = b;
        c.return = a;
        c.effectTag = 8;
        null !== a.lastEffect ? (a.lastEffect.nextEffect = c, a.lastEffect = c) : a.firstEffect = a.lastEffect = c;
      }
      function hi(a, b) {
        switch (a.tag) {
          case 5:
            var c = a.type;
            b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
            return null !== b ? (a.stateNode = b, true) : false;
          case 6:
            return b = "" === a.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a.stateNode = b, true) : false;
          case 13:
            return false;
          default:
            return false;
        }
      }
      function ii(a) {
        if (ei) {
          var b = di;
          if (b) {
            var c = b;
            if (!hi(a, b)) {
              b = re(c.nextSibling);
              if (!b || !hi(a, b)) {
                a.effectTag = a.effectTag & -1025 | 2;
                ei = false;
                ci = a;
                return;
              }
              fi(ci, c);
            }
            ci = a;
            di = re(b.firstChild);
          } else a.effectTag = a.effectTag & -1025 | 2, ei = false, ci = a;
        }
      }
      function ji(a) {
        for (a = a.return; null !== a && 5 !== a.tag && 3 !== a.tag && 13 !== a.tag; ) a = a.return;
        ci = a;
      }
      function ki(a) {
        if (a !== ci) return false;
        if (!ei) return ji(a), ei = true, false;
        var b = a.type;
        if (5 !== a.tag || "head" !== b && "body" !== b && !oe(b, a.memoizedProps)) for (b = di; b; ) fi(a, b), b = re(b.nextSibling);
        ji(a);
        if (13 === a.tag) {
          a = a.memoizedState;
          a = null !== a ? a.dehydrated : null;
          if (!a) throw Error(u(317));
          a: {
            a = a.nextSibling;
            for (b = 0; a; ) {
              if (8 === a.nodeType) {
                var c = a.data;
                if (c === ie) {
                  if (0 === b) {
                    di = re(a.nextSibling);
                    break a;
                  }
                  b--;
                } else c !== he && c !== ke && c !== je || b++;
              }
              a = a.nextSibling;
            }
            di = null;
          }
        } else di = ci ? re(a.stateNode.nextSibling) : null;
        return true;
      }
      function li() {
        di = ci = null;
        ei = false;
      }
      var mi = Ea.ReactCurrentOwner;
      var wg = false;
      function R(a, b, c, d) {
        b.child = null === a ? gh(b, null, c, d) : fh(b, a.child, c, d);
      }
      function ni(a, b, c, d, e) {
        c = c.render;
        var f = b.ref;
        vg(b, e);
        d = Ih(a, b, c, d, f, e);
        if (null !== a && !wg) return b.updateQueue = a.updateQueue, b.effectTag &= -517, a.expirationTime <= e && (a.expirationTime = 0), oi(a, b, e);
        b.effectTag |= 1;
        R(a, b, d, e);
        return b.child;
      }
      function pi(a, b, c, d, e, f) {
        if (null === a) {
          var g = c.type;
          if ("function" === typeof g && !qi(g) && void 0 === g.defaultProps && null === c.compare && void 0 === c.defaultProps) return b.tag = 15, b.type = g, ri(a, b, g, d, e, f);
          a = ch(c.type, null, d, null, b.mode, f);
          a.ref = b.ref;
          a.return = b;
          return b.child = a;
        }
        g = a.child;
        if (e < f && (e = g.memoizedProps, c = c.compare, c = null !== c ? c : qf, c(e, d) && a.ref === b.ref)) return oi(a, b, f);
        b.effectTag |= 1;
        a = ah(g, d, f);
        a.ref = b.ref;
        a.return = b;
        return b.child = a;
      }
      function ri(a, b, c, d, e, f) {
        return null !== a && qf(a.memoizedProps, d) && a.ref === b.ref && (wg = false, e < f) ? oi(a, b, f) : si(a, b, c, d, f);
      }
      function ti(a, b) {
        var c = b.ref;
        if (null === a && null !== c || null !== a && a.ref !== c) b.effectTag |= 128;
      }
      function si(a, b, c, d, e) {
        var f = L(c) ? Df : J.current;
        f = Ef(b, f);
        vg(b, e);
        c = Ih(a, b, c, d, f, e);
        if (null !== a && !wg) return b.updateQueue = a.updateQueue, b.effectTag &= -517, a.expirationTime <= e && (a.expirationTime = 0), oi(a, b, e);
        b.effectTag |= 1;
        R(a, b, c, e);
        return b.child;
      }
      function ui(a, b, c, d, e) {
        if (L(c)) {
          var f = true;
          Jf(b);
        } else f = false;
        vg(b, e);
        if (null === b.stateNode) null !== a && (a.alternate = null, b.alternate = null, b.effectTag |= 2), Ug(b, c, d, e), Wg(b, c, d, e), d = true;
        else if (null === a) {
          var g = b.stateNode, h = b.memoizedProps;
          g.props = h;
          var k = g.context, l = c.contextType;
          "object" === typeof l && null !== l ? l = xg(l) : (l = L(c) ? Df : J.current, l = Ef(b, l));
          var m = c.getDerivedStateFromProps, C = "function" === typeof m || "function" === typeof g.getSnapshotBeforeUpdate;
          C || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k !== l) && Vg(b, g, d, l);
          yg = false;
          var y = b.memoizedState;
          k = g.state = y;
          var H = b.updateQueue;
          null !== H && (Hg(b, H, d, g, e), k = b.memoizedState);
          h !== d || y !== k || K.current || yg ? ("function" === typeof m && (Og(b, c, m, d), k = b.memoizedState), (h = yg || Tg(b, c, h, d, y, k, l)) ? (C || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.effectTag |= 4)) : ("function" === typeof g.componentDidMount && (b.effectTag |= 4), b.memoizedProps = d, b.memoizedState = k), g.props = d, g.state = k, g.context = l, d = h) : ("function" === typeof g.componentDidMount && (b.effectTag |= 4), d = false);
        } else g = b.stateNode, h = b.memoizedProps, g.props = b.type === b.elementType ? h : mg(b.type, h), k = g.context, l = c.contextType, "object" === typeof l && null !== l ? l = xg(l) : (l = L(c) ? Df : J.current, l = Ef(b, l)), m = c.getDerivedStateFromProps, (C = "function" === typeof m || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k !== l) && Vg(b, g, d, l), yg = false, k = b.memoizedState, y = g.state = k, H = b.updateQueue, null !== H && (Hg(b, H, d, g, e), y = b.memoizedState), h !== d || k !== y || K.current || yg ? ("function" === typeof m && (Og(b, c, m, d), y = b.memoizedState), (m = yg || Tg(b, c, h, d, k, y, l)) ? (C || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, y, l), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, y, l)), "function" === typeof g.componentDidUpdate && (b.effectTag |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.effectTag |= 256)) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && k === a.memoizedState || (b.effectTag |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && k === a.memoizedState || (b.effectTag |= 256), b.memoizedProps = d, b.memoizedState = y), g.props = d, g.state = y, g.context = l, d = m) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && k === a.memoizedState || (b.effectTag |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && k === a.memoizedState || (b.effectTag |= 256), d = false);
        return vi(a, b, c, d, f, e);
      }
      function vi(a, b, c, d, e, f) {
        ti(a, b);
        var g = 0 !== (b.effectTag & 64);
        if (!d && !g) return e && Kf(b, c, false), oi(a, b, f);
        d = b.stateNode;
        mi.current = b;
        var h = g && "function" !== typeof c.getDerivedStateFromError ? null : d.render();
        b.effectTag |= 1;
        null !== a && g ? (b.child = fh(b, a.child, null, f), b.child = fh(b, null, h, f)) : R(a, b, h, f);
        b.memoizedState = d.state;
        e && Kf(b, c, true);
        return b.child;
      }
      function wi(a) {
        var b = a.stateNode;
        b.pendingContext ? Hf(a, b.pendingContext, b.pendingContext !== b.context) : b.context && Hf(a, b.context, false);
        mh(a, b.containerInfo);
      }
      var xi = { dehydrated: null, retryTime: 0 };
      function yi(a, b, c) {
        var d = b.mode, e = b.pendingProps, f = M.current, g = false, h;
        (h = 0 !== (b.effectTag & 64)) || (h = 0 !== (f & 2) && (null === a || null !== a.memoizedState));
        h ? (g = true, b.effectTag &= -65) : null !== a && null === a.memoizedState || void 0 === e.fallback || true === e.unstable_avoidThisFallback || (f |= 1);
        I(M, f & 1, b);
        if (null === a) {
          void 0 !== e.fallback && ii(b);
          if (g) {
            g = e.fallback;
            e = eh(null, d, 0, null);
            e.return = b;
            if (0 === (b.mode & 2)) for (a = null !== b.memoizedState ? b.child.child : b.child, e.child = a; null !== a; ) a.return = e, a = a.sibling;
            c = eh(g, d, c, null);
            c.return = b;
            e.sibling = c;
            b.memoizedState = xi;
            b.child = e;
            return c;
          }
          d = e.children;
          b.memoizedState = null;
          return b.child = gh(b, null, d, c);
        }
        if (null !== a.memoizedState) {
          a = a.child;
          d = a.sibling;
          if (g) {
            e = e.fallback;
            c = ah(a, a.pendingProps, 0);
            c.return = b;
            if (0 === (b.mode & 2) && (g = null !== b.memoizedState ? b.child.child : b.child, g !== a.child)) for (c.child = g; null !== g; ) g.return = c, g = g.sibling;
            d = ah(d, e, d.expirationTime);
            d.return = b;
            c.sibling = d;
            c.childExpirationTime = 0;
            b.memoizedState = xi;
            b.child = c;
            return d;
          }
          c = fh(b, a.child, e.children, c);
          b.memoizedState = null;
          return b.child = c;
        }
        a = a.child;
        if (g) {
          g = e.fallback;
          e = eh(null, d, 0, null);
          e.return = b;
          e.child = a;
          null !== a && (a.return = e);
          if (0 === (b.mode & 2)) for (a = null !== b.memoizedState ? b.child.child : b.child, e.child = a; null !== a; ) a.return = e, a = a.sibling;
          c = eh(g, d, c, null);
          c.return = b;
          e.sibling = c;
          c.effectTag |= 2;
          e.childExpirationTime = 0;
          b.memoizedState = xi;
          b.child = e;
          return c;
        }
        b.memoizedState = null;
        return b.child = fh(b, a, e.children, c);
      }
      function zi(a, b) {
        a.expirationTime < b && (a.expirationTime = b);
        var c = a.alternate;
        null !== c && c.expirationTime < b && (c.expirationTime = b);
        ug(a.return, b);
      }
      function Ai(a, b, c, d, e, f) {
        var g = a.memoizedState;
        null === g ? a.memoizedState = { isBackwards: b, rendering: null, last: d, tail: c, tailExpiration: 0, tailMode: e, lastEffect: f } : (g.isBackwards = b, g.rendering = null, g.last = d, g.tail = c, g.tailExpiration = 0, g.tailMode = e, g.lastEffect = f);
      }
      function Bi(a, b, c) {
        var d = b.pendingProps, e = d.revealOrder, f = d.tail;
        R(a, b, d.children, c);
        d = M.current;
        if (0 !== (d & 2)) d = d & 1 | 2, b.effectTag |= 64;
        else {
          if (null !== a && 0 !== (a.effectTag & 64)) a: for (a = b.child; null !== a; ) {
            if (13 === a.tag) null !== a.memoizedState && zi(a, c);
            else if (19 === a.tag) zi(a, c);
            else if (null !== a.child) {
              a.child.return = a;
              a = a.child;
              continue;
            }
            if (a === b) break a;
            for (; null === a.sibling; ) {
              if (null === a.return || a.return === b) break a;
              a = a.return;
            }
            a.sibling.return = a.return;
            a = a.sibling;
          }
          d &= 1;
        }
        I(M, d, b);
        if (0 === (b.mode & 2)) b.memoizedState = null;
        else switch (e) {
          case "forwards":
            c = b.child;
            for (e = null; null !== c; ) a = c.alternate, null !== a && null === qh(a) && (e = c), c = c.sibling;
            c = e;
            null === c ? (e = b.child, b.child = null) : (e = c.sibling, c.sibling = null);
            Ai(b, false, e, c, f, b.lastEffect);
            break;
          case "backwards":
            c = null;
            e = b.child;
            for (b.child = null; null !== e; ) {
              a = e.alternate;
              if (null !== a && null === qh(a)) {
                b.child = e;
                break;
              }
              a = e.sibling;
              e.sibling = c;
              c = e;
              e = a;
            }
            Ai(b, true, c, null, f, b.lastEffect);
            break;
          case "together":
            Ai(b, false, null, null, void 0, b.lastEffect);
            break;
          default:
            b.memoizedState = null;
        }
        return b.child;
      }
      function oi(a, b, c) {
        null !== a && (b.dependencies = a.dependencies);
        var d = b.expirationTime;
        0 !== d && Jg(d);
        if (b.childExpirationTime < c) return null;
        if (null !== a && b.child !== a.child) throw Error(u(153));
        if (null !== b.child) {
          a = b.child;
          c = ah(a, a.pendingProps, a.expirationTime);
          b.child = c;
          for (c.return = b; null !== a.sibling; ) a = a.sibling, c = c.sibling = ah(a, a.pendingProps, a.expirationTime), c.return = b;
          c.sibling = null;
        }
        return b.child;
      }
      function Ci(a) {
        a.effectTag |= 4;
      }
      var Hi;
      var Ii;
      var Ji;
      var Ki;
      Hi = function(a, b) {
        for (var c = b.child; null !== c; ) {
          if (5 === c.tag || 6 === c.tag) a.appendChild(c.stateNode);
          else if (4 !== c.tag && null !== c.child) {
            c.child.return = c;
            c = c.child;
            continue;
          }
          if (c === b) break;
          for (; null === c.sibling; ) {
            if (null === c.return || c.return === b) return;
            c = c.return;
          }
          c.sibling.return = c.return;
          c = c.sibling;
        }
      };
      Ii = function() {
      };
      Ji = function(a, b, c, d, e) {
        var f = a.memoizedProps;
        if (f !== d) {
          var g = b.stateNode;
          lh(ih.current);
          a = null;
          switch (c) {
            case "input":
              f = Ab(g, f);
              d = Ab(g, d);
              a = [];
              break;
            case "option":
              f = Ib(g, f);
              d = Ib(g, d);
              a = [];
              break;
            case "select":
              f = n({}, f, { value: void 0 });
              d = n({}, d, { value: void 0 });
              a = [];
              break;
            case "textarea":
              f = Kb(g, f);
              d = Kb(g, d);
              a = [];
              break;
            default:
              "function" !== typeof f.onClick && "function" === typeof d.onClick && (g.onclick = ae);
          }
          Yd(c, d);
          var h, k;
          c = null;
          for (h in f) if (!d.hasOwnProperty(h) && f.hasOwnProperty(h) && null != f[h]) if ("style" === h) for (k in g = f[h], g) g.hasOwnProperty(k) && (c || (c = {}), c[k] = "");
          else "dangerouslySetInnerHTML" !== h && "children" !== h && "suppressContentEditableWarning" !== h && "suppressHydrationWarning" !== h && "autoFocus" !== h && (ia.hasOwnProperty(h) ? a || (a = []) : (a = a || []).push(h, null));
          for (h in d) {
            var l = d[h];
            g = null != f ? f[h] : void 0;
            if (d.hasOwnProperty(h) && l !== g && (null != l || null != g)) if ("style" === h) if (g) {
              for (k in g) !g.hasOwnProperty(k) || l && l.hasOwnProperty(k) || (c || (c = {}), c[k] = "");
              for (k in l) l.hasOwnProperty(k) && g[k] !== l[k] && (c || (c = {}), c[k] = l[k]);
            } else c || (a || (a = []), a.push(h, c)), c = l;
            else "dangerouslySetInnerHTML" === h ? (l = l ? l.__html : void 0, g = g ? g.__html : void 0, null != l && g !== l && (a = a || []).push(h, "" + l)) : "children" === h ? g === l || "string" !== typeof l && "number" !== typeof l || (a = a || []).push(h, "" + l) : "suppressContentEditableWarning" !== h && "suppressHydrationWarning" !== h && (ia.hasOwnProperty(h) ? (null != l && $d(e, h), a || g === l || (a = [])) : (a = a || []).push(h, l));
          }
          c && (a = a || []).push("style", c);
          e = a;
          (b.updateQueue = e) && Ci(b);
        }
      };
      Ki = function(a, b, c, d) {
        c !== d && Ci(b);
      };
      function Li(a, b) {
        switch (a.tailMode) {
          case "hidden":
            b = a.tail;
            for (var c = null; null !== b; ) null !== b.alternate && (c = b), b = b.sibling;
            null === c ? a.tail = null : c.sibling = null;
            break;
          case "collapsed":
            c = a.tail;
            for (var d = null; null !== c; ) null !== c.alternate && (d = c), c = c.sibling;
            null === d ? b || null === a.tail ? a.tail = null : a.tail.sibling = null : d.sibling = null;
        }
      }
      function Mi(a) {
        switch (a.tag) {
          case 1:
            L(a.type) && Ff(a);
            var b = a.effectTag;
            return b & 4096 ? (a.effectTag = b & -4097 | 64, a) : null;
          case 3:
            nh(a);
            Gf(a);
            b = a.effectTag;
            if (0 !== (b & 64)) throw Error(u(285));
            a.effectTag = b & -4097 | 64;
            return a;
          case 5:
            return ph(a), null;
          case 13:
            return G(M, a), b = a.effectTag, b & 4096 ? (a.effectTag = b & -4097 | 64, a) : null;
          case 19:
            return G(M, a), null;
          case 4:
            return nh(a), null;
          case 10:
            return tg(a), null;
          default:
            return null;
        }
      }
      function Ni(a, b) {
        return { value: a, source: b, stack: Xa(b) };
      }
      var Oi = "function" === typeof WeakSet ? WeakSet : Set;
      function Pi(a, b) {
        var c = b.source, d = b.stack;
        null === d && null !== c && (d = Xa(c));
        null !== c && Wa(c.type);
        b = b.value;
        null !== a && 1 === a.tag && Wa(a.type);
        try {
          console.error(b);
        } catch (e) {
          setTimeout(function() {
            throw e;
          });
        }
      }
      function Qi(a, b) {
        try {
          b.props = a.memoizedProps, b.state = a.memoizedState, b.componentWillUnmount();
        } catch (c) {
          Ri(a, c);
        }
      }
      function Si(a) {
        var b = a.ref;
        if (null !== b) if ("function" === typeof b) try {
          b(null);
        } catch (c) {
          Ri(a, c);
        }
        else b.current = null;
      }
      function Ti(a, b) {
        switch (b.tag) {
          case 0:
          case 11:
          case 15:
            Ui(2, 0, b);
            break;
          case 1:
            if (b.effectTag & 256 && null !== a) {
              var c = a.memoizedProps, d = a.memoizedState;
              a = b.stateNode;
              b = a.getSnapshotBeforeUpdate(b.elementType === b.type ? c : mg(b.type, c), d);
              a.__reactInternalSnapshotBeforeUpdate = b;
            }
            break;
          case 3:
          case 5:
          case 6:
          case 4:
          case 17:
            break;
          default:
            throw Error(u(163));
        }
      }
      function Ui(a, b, c) {
        c = c.updateQueue;
        c = null !== c ? c.lastEffect : null;
        if (null !== c) {
          var d = c = c.next;
          do {
            if (0 !== (d.tag & a)) {
              var e = d.destroy;
              d.destroy = void 0;
              void 0 !== e && e();
            }
            0 !== (d.tag & b) && (e = d.create, d.destroy = e());
            d = d.next;
          } while (d !== c);
        }
      }
      function Vi(a, b, c) {
        "function" === typeof Wi && Wi(b);
        switch (b.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            a = b.updateQueue;
            if (null !== a && (a = a.lastEffect, null !== a)) {
              var d = a.next;
              fg(97 < c ? 97 : c, function() {
                var a2 = d;
                do {
                  var c2 = a2.destroy;
                  if (void 0 !== c2) {
                    var g = b;
                    try {
                      c2();
                    } catch (h) {
                      Ri(g, h);
                    }
                  }
                  a2 = a2.next;
                } while (a2 !== d);
              });
            }
            break;
          case 1:
            Si(b);
            c = b.stateNode;
            "function" === typeof c.componentWillUnmount && Qi(b, c);
            break;
          case 5:
            Si(b);
            break;
          case 4:
            Xi(a, b, c);
        }
      }
      function Yi(a) {
        var b = a.alternate;
        a.return = null;
        a.child = null;
        a.memoizedState = null;
        a.updateQueue = null;
        a.dependencies = null;
        a.alternate = null;
        a.firstEffect = null;
        a.lastEffect = null;
        a.pendingProps = null;
        a.memoizedProps = null;
        null !== b && Yi(b);
      }
      function Zi(a) {
        return 5 === a.tag || 3 === a.tag || 4 === a.tag;
      }
      function $i(a) {
        a: {
          for (var b = a.return; null !== b; ) {
            if (Zi(b)) {
              var c = b;
              break a;
            }
            b = b.return;
          }
          throw Error(u(160));
        }
        b = c.stateNode;
        switch (c.tag) {
          case 5:
            var d = false;
            break;
          case 3:
            b = b.containerInfo;
            d = true;
            break;
          case 4:
            b = b.containerInfo;
            d = true;
            break;
          default:
            throw Error(u(161));
        }
        c.effectTag & 16 && (Tb(b, ""), c.effectTag &= -17);
        a: b: for (c = a; ; ) {
          for (; null === c.sibling; ) {
            if (null === c.return || Zi(c.return)) {
              c = null;
              break a;
            }
            c = c.return;
          }
          c.sibling.return = c.return;
          for (c = c.sibling; 5 !== c.tag && 6 !== c.tag && 18 !== c.tag; ) {
            if (c.effectTag & 2) continue b;
            if (null === c.child || 4 === c.tag) continue b;
            else c.child.return = c, c = c.child;
          }
          if (!(c.effectTag & 2)) {
            c = c.stateNode;
            break a;
          }
        }
        for (var e = a; ; ) {
          var f = 5 === e.tag || 6 === e.tag;
          if (f) {
            var g = f ? e.stateNode : e.stateNode.instance;
            if (c) if (d) {
              f = b;
              var h = g;
              g = c;
              8 === f.nodeType ? f.parentNode.insertBefore(h, g) : f.insertBefore(h, g);
            } else b.insertBefore(g, c);
            else d ? (h = b, 8 === h.nodeType ? (f = h.parentNode, f.insertBefore(g, h)) : (f = h, f.appendChild(g)), h = h._reactRootContainer, null !== h && void 0 !== h || null !== f.onclick || (f.onclick = ae)) : b.appendChild(g);
          } else if (4 !== e.tag && null !== e.child) {
            e.child.return = e;
            e = e.child;
            continue;
          }
          if (e === a) break;
          for (; null === e.sibling; ) {
            if (null === e.return || e.return === a) return;
            e = e.return;
          }
          e.sibling.return = e.return;
          e = e.sibling;
        }
      }
      function Xi(a, b, c) {
        for (var d = b, e = false, f, g; ; ) {
          if (!e) {
            e = d.return;
            a: for (; ; ) {
              if (null === e) throw Error(u(160));
              f = e.stateNode;
              switch (e.tag) {
                case 5:
                  g = false;
                  break a;
                case 3:
                  f = f.containerInfo;
                  g = true;
                  break a;
                case 4:
                  f = f.containerInfo;
                  g = true;
                  break a;
              }
              e = e.return;
            }
            e = true;
          }
          if (5 === d.tag || 6 === d.tag) {
            a: for (var h = a, k = d, l = c, m = k; ; ) if (Vi(h, m, l), null !== m.child && 4 !== m.tag) m.child.return = m, m = m.child;
            else {
              if (m === k) break;
              for (; null === m.sibling; ) {
                if (null === m.return || m.return === k) break a;
                m = m.return;
              }
              m.sibling.return = m.return;
              m = m.sibling;
            }
            g ? (h = f, k = d.stateNode, 8 === h.nodeType ? h.parentNode.removeChild(k) : h.removeChild(k)) : f.removeChild(d.stateNode);
          } else if (4 === d.tag) {
            if (null !== d.child) {
              f = d.stateNode.containerInfo;
              g = true;
              d.child.return = d;
              d = d.child;
              continue;
            }
          } else if (Vi(a, d, c), null !== d.child) {
            d.child.return = d;
            d = d.child;
            continue;
          }
          if (d === b) break;
          for (; null === d.sibling; ) {
            if (null === d.return || d.return === b) return;
            d = d.return;
            4 === d.tag && (e = false);
          }
          d.sibling.return = d.return;
          d = d.sibling;
        }
      }
      function aj(a, b) {
        switch (b.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            Ui(4, 8, b);
            break;
          case 1:
            break;
          case 5:
            var c = b.stateNode;
            if (null != c) {
              var d = b.memoizedProps, e = null !== a ? a.memoizedProps : d;
              a = b.type;
              var f = b.updateQueue;
              b.updateQueue = null;
              if (null !== f) {
                c[ve] = d;
                "input" === a && "radio" === d.type && null != d.name && Cb(c, d);
                Zd(a, e);
                b = Zd(a, d);
                for (e = 0; e < f.length; e += 2) {
                  var g = f[e], h = f[e + 1];
                  "style" === g ? Wd(c, h) : "dangerouslySetInnerHTML" === g ? Sb(c, h) : "children" === g ? Tb(c, h) : vb(c, g, h, b);
                }
                switch (a) {
                  case "input":
                    Eb(c, d);
                    break;
                  case "textarea":
                    Mb(
                      c,
                      d
                    );
                    break;
                  case "select":
                    b = c._wrapperState.wasMultiple, c._wrapperState.wasMultiple = !!d.multiple, a = d.value, null != a ? Jb(c, !!d.multiple, a, false) : b !== !!d.multiple && (null != d.defaultValue ? Jb(c, !!d.multiple, d.defaultValue, true) : Jb(c, !!d.multiple, d.multiple ? [] : "", false));
                }
              }
            }
            break;
          case 6:
            if (null === b.stateNode) throw Error(u(162));
            b.stateNode.nodeValue = b.memoizedProps;
            break;
          case 3:
            b = b.stateNode;
            b.hydrate && (b.hydrate = false, Lc(b.containerInfo));
            break;
          case 12:
            break;
          case 13:
            c = b;
            null === b.memoizedState ? d = false : (d = true, c = b.child, bj = cg());
            if (null !== c) a: for (a = c; ; ) {
              if (5 === a.tag) f = a.stateNode, d ? (f = f.style, "function" === typeof f.setProperty ? f.setProperty("display", "none", "important") : f.display = "none") : (f = a.stateNode, e = a.memoizedProps.style, e = void 0 !== e && null !== e && e.hasOwnProperty("display") ? e.display : null, f.style.display = Vd("display", e));
              else if (6 === a.tag) a.stateNode.nodeValue = d ? "" : a.memoizedProps;
              else if (13 === a.tag && null !== a.memoizedState && null === a.memoizedState.dehydrated) {
                f = a.child.sibling;
                f.return = a;
                a = f;
                continue;
              } else if (null !== a.child) {
                a.child.return = a;
                a = a.child;
                continue;
              }
              if (a === c) break a;
              for (; null === a.sibling; ) {
                if (null === a.return || a.return === c) break a;
                a = a.return;
              }
              a.sibling.return = a.return;
              a = a.sibling;
            }
            cj(b);
            break;
          case 19:
            cj(b);
            break;
          case 17:
            break;
          case 20:
            break;
          case 21:
            break;
          default:
            throw Error(u(163));
        }
      }
      function cj(a) {
        var b = a.updateQueue;
        if (null !== b) {
          a.updateQueue = null;
          var c = a.stateNode;
          null === c && (c = a.stateNode = new Oi());
          b.forEach(function(b2) {
            var d = dj.bind(null, a, b2);
            c.has(b2) || (c.add(b2), b2.then(d, d));
          });
        }
      }
      var ej = "function" === typeof WeakMap ? WeakMap : Map;
      function fj(a, b, c) {
        c = Bg(c, null);
        c.tag = 3;
        c.payload = { element: null };
        var d = b.value;
        c.callback = function() {
          gj || (gj = true, hj = d);
          Pi(a, b);
        };
        return c;
      }
      function ij(a, b, c) {
        c = Bg(c, null);
        c.tag = 3;
        var d = a.type.getDerivedStateFromError;
        if ("function" === typeof d) {
          var e = b.value;
          c.payload = function() {
            Pi(a, b);
            return d(e);
          };
        }
        var f = a.stateNode;
        null !== f && "function" === typeof f.componentDidCatch && (c.callback = function() {
          "function" !== typeof d && (null === jj ? jj = /* @__PURE__ */ new Set([this]) : jj.add(this), Pi(a, b));
          var c2 = b.stack;
          this.componentDidCatch(b.value, { componentStack: null !== c2 ? c2 : "" });
        });
        return c;
      }
      var kj = Math.ceil;
      var lj = Ea.ReactCurrentDispatcher;
      var mj = Ea.ReactCurrentOwner;
      var S = 0;
      var nj = 8;
      var oj = 16;
      var pj = 32;
      var qj = 0;
      var rj = 1;
      var sj = 2;
      var tj = 3;
      var uj = 4;
      var vj = 5;
      var T = S;
      var U = null;
      var V = null;
      var W = 0;
      var X = qj;
      var wj = null;
      var xj = 1073741823;
      var yj = 1073741823;
      var zj = null;
      var Aj = 0;
      var Bj = false;
      var bj = 0;
      var Cj = 500;
      var Y = null;
      var gj = false;
      var hj = null;
      var jj = null;
      var Dj = false;
      var Ej = null;
      var Fj = 90;
      var Gj = null;
      var Hj = 0;
      var Ij = null;
      var Jj = 0;
      function Pg() {
        return (T & (oj | pj)) !== S ? 1073741821 - (cg() / 10 | 0) : 0 !== Jj ? Jj : Jj = 1073741821 - (cg() / 10 | 0);
      }
      function Qg(a, b, c) {
        b = b.mode;
        if (0 === (b & 2)) return 1073741823;
        var d = dg();
        if (0 === (b & 4)) return 99 === d ? 1073741823 : 1073741822;
        if ((T & oj) !== S) return W;
        if (null !== c) a = lg(a, c.timeoutMs | 0 || 5e3, 250);
        else switch (d) {
          case 99:
            a = 1073741823;
            break;
          case 98:
            a = lg(a, 150, 100);
            break;
          case 97:
          case 96:
            a = lg(a, 5e3, 250);
            break;
          case 95:
            a = 2;
            break;
          default:
            throw Error(u(326));
        }
        null !== U && a === W && --a;
        return a;
      }
      function Rg(a, b) {
        if (50 < Hj) throw Hj = 0, Ij = null, Error(u(185));
        a = Kj(a, b);
        if (null !== a) {
          var c = dg();
          1073741823 === b ? (T & nj) !== S && (T & (oj | pj)) === S ? Lj(a) : (Z(a), T === S && jg()) : Z(a);
          (T & 4) === S || 98 !== c && 99 !== c || (null === Gj ? Gj = /* @__PURE__ */ new Map([[a, b]]) : (c = Gj.get(a), (void 0 === c || c > b) && Gj.set(a, b)));
        }
      }
      function Kj(a, b) {
        a.expirationTime < b && (a.expirationTime = b);
        var c = a.alternate;
        null !== c && c.expirationTime < b && (c.expirationTime = b);
        var d = a.return, e = null;
        if (null === d && 3 === a.tag) e = a.stateNode;
        else for (; null !== d; ) {
          c = d.alternate;
          d.childExpirationTime < b && (d.childExpirationTime = b);
          null !== c && c.childExpirationTime < b && (c.childExpirationTime = b);
          if (null === d.return && 3 === d.tag) {
            e = d.stateNode;
            break;
          }
          d = d.return;
        }
        null !== e && (U === e && (Jg(b), X === uj && Mj(e, W)), Nj(e, b));
        return e;
      }
      function Oj(a) {
        var b = a.lastExpiredTime;
        if (0 !== b) return b;
        b = a.firstPendingTime;
        if (!Pj(a, b)) return b;
        b = a.lastPingedTime;
        a = a.nextKnownPendingLevel;
        return b > a ? b : a;
      }
      function Z(a) {
        if (0 !== a.lastExpiredTime) a.callbackExpirationTime = 1073741823, a.callbackPriority = 99, a.callbackNode = hg(Lj.bind(null, a));
        else {
          var b = Oj(a), c = a.callbackNode;
          if (0 === b) null !== c && (a.callbackNode = null, a.callbackExpirationTime = 0, a.callbackPriority = 90);
          else {
            var d = Pg();
            1073741823 === b ? d = 99 : 1 === b || 2 === b ? d = 95 : (d = 10 * (1073741821 - b) - 10 * (1073741821 - d), d = 0 >= d ? 99 : 250 >= d ? 98 : 5250 >= d ? 97 : 95);
            if (null !== c) {
              var e = a.callbackPriority;
              if (a.callbackExpirationTime === b && e >= d) return;
              c !== Xf && Nf(c);
            }
            a.callbackExpirationTime = b;
            a.callbackPriority = d;
            b = 1073741823 === b ? hg(Lj.bind(null, a)) : gg(d, Qj.bind(null, a), { timeout: 10 * (1073741821 - b) - cg() });
            a.callbackNode = b;
          }
        }
      }
      function Qj(a, b) {
        Jj = 0;
        if (b) return b = Pg(), Rj(a, b), Z(a), null;
        var c = Oj(a);
        if (0 !== c) {
          b = a.callbackNode;
          if ((T & (oj | pj)) !== S) throw Error(u(327));
          Sj();
          a === U && c === W || Tj(a, c);
          if (null !== V) {
            var d = T;
            T |= oj;
            var e = Uj(a);
            do
              try {
                Vj();
                break;
              } catch (h) {
                Wj(a, h);
              }
            while (1);
            rg();
            T = d;
            lj.current = e;
            if (X === rj) throw b = wj, Tj(a, c), Mj(a, c), Z(a), b;
            if (null === V) switch (e = a.finishedWork = a.current.alternate, a.finishedExpirationTime = c, d = X, U = null, d) {
              case qj:
              case rj:
                throw Error(u(345));
              case sj:
                Rj(a, 2 < c ? 2 : c);
                break;
              case tj:
                Mj(a, c);
                d = a.lastSuspendedTime;
                c === d && (a.nextKnownPendingLevel = Xj(e));
                if (1073741823 === xj && (e = bj + Cj - cg(), 10 < e)) {
                  if (Bj) {
                    var f = a.lastPingedTime;
                    if (0 === f || f >= c) {
                      a.lastPingedTime = c;
                      Tj(a, c);
                      break;
                    }
                  }
                  f = Oj(a);
                  if (0 !== f && f !== c) break;
                  if (0 !== d && d !== c) {
                    a.lastPingedTime = d;
                    break;
                  }
                  a.timeoutHandle = pe(Yj.bind(null, a), e);
                  break;
                }
                Yj(a);
                break;
              case uj:
                Mj(a, c);
                d = a.lastSuspendedTime;
                c === d && (a.nextKnownPendingLevel = Xj(e));
                if (Bj && (e = a.lastPingedTime, 0 === e || e >= c)) {
                  a.lastPingedTime = c;
                  Tj(a, c);
                  break;
                }
                e = Oj(a);
                if (0 !== e && e !== c) break;
                if (0 !== d && d !== c) {
                  a.lastPingedTime = d;
                  break;
                }
                1073741823 !== yj ? d = 10 * (1073741821 - yj) - cg() : 1073741823 === xj ? d = 0 : (d = 10 * (1073741821 - xj) - 5e3, e = cg(), c = 10 * (1073741821 - c) - e, d = e - d, 0 > d && (d = 0), d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * kj(d / 1960)) - d, c < d && (d = c));
                if (10 < d) {
                  a.timeoutHandle = pe(Yj.bind(null, a), d);
                  break;
                }
                Yj(a);
                break;
              case vj:
                if (1073741823 !== xj && null !== zj) {
                  f = xj;
                  var g = zj;
                  d = g.busyMinDurationMs | 0;
                  0 >= d ? d = 0 : (e = g.busyDelayMs | 0, f = cg() - (10 * (1073741821 - f) - (g.timeoutMs | 0 || 5e3)), d = f <= e ? 0 : e + d - f);
                  if (10 < d) {
                    Mj(a, c);
                    a.timeoutHandle = pe(Yj.bind(null, a), d);
                    break;
                  }
                }
                Yj(a);
                break;
              default:
                throw Error(u(329));
            }
            Z(a);
            if (a.callbackNode === b) return Qj.bind(null, a);
          }
        }
        return null;
      }
      function Lj(a) {
        var b = a.lastExpiredTime;
        b = 0 !== b ? b : 1073741823;
        if (a.finishedExpirationTime === b) Yj(a);
        else {
          if ((T & (oj | pj)) !== S) throw Error(u(327));
          Sj();
          a === U && b === W || Tj(a, b);
          if (null !== V) {
            var c = T;
            T |= oj;
            var d = Uj(a);
            do
              try {
                Zj();
                break;
              } catch (e) {
                Wj(a, e);
              }
            while (1);
            rg();
            T = c;
            lj.current = d;
            if (X === rj) throw c = wj, Tj(a, b), Mj(a, b), Z(a), c;
            if (null !== V) throw Error(u(261));
            a.finishedWork = a.current.alternate;
            a.finishedExpirationTime = b;
            U = null;
            Yj(a);
            Z(a);
          }
        }
        return null;
      }
      function ak() {
        if (null !== Gj) {
          var a = Gj;
          Gj = null;
          a.forEach(function(a2, c) {
            Rj(c, a2);
            Z(c);
          });
          jg();
        }
      }
      function bk(a, b) {
        var c = T;
        T |= 1;
        try {
          return a(b);
        } finally {
          T = c, T === S && jg();
        }
      }
      function ck(a, b) {
        var c = T;
        T &= -2;
        T |= nj;
        try {
          return a(b);
        } finally {
          T = c, T === S && jg();
        }
      }
      function Tj(a, b) {
        a.finishedWork = null;
        a.finishedExpirationTime = 0;
        var c = a.timeoutHandle;
        -1 !== c && (a.timeoutHandle = -1, qe(c));
        if (null !== V) for (c = V.return; null !== c; ) {
          var d = c;
          switch (d.tag) {
            case 1:
              var e = d.type.childContextTypes;
              null !== e && void 0 !== e && Ff(d);
              break;
            case 3:
              nh(d);
              Gf(d);
              break;
            case 5:
              ph(d);
              break;
            case 4:
              nh(d);
              break;
            case 13:
              G(M, d);
              break;
            case 19:
              G(M, d);
              break;
            case 10:
              tg(d);
          }
          c = c.return;
        }
        U = a;
        V = ah(a.current, null, b);
        W = b;
        X = qj;
        wj = null;
        yj = xj = 1073741823;
        zj = null;
        Aj = 0;
        Bj = false;
      }
      function Wj(a, b) {
        do {
          try {
            rg();
            Mh();
            if (null === V || null === V.return) return X = rj, wj = b, null;
            a: {
              var c = a, d = V.return, e = V, f = b;
              b = W;
              e.effectTag |= 2048;
              e.firstEffect = e.lastEffect = null;
              if (null !== f && "object" === typeof f && "function" === typeof f.then) {
                var g = f, h = 0 !== (M.current & 1), k = d;
                do {
                  var l;
                  if (l = 13 === k.tag) {
                    var m = k.memoizedState;
                    if (null !== m) l = null !== m.dehydrated ? true : false;
                    else {
                      var C = k.memoizedProps;
                      l = void 0 === C.fallback ? false : true !== C.unstable_avoidThisFallback ? true : h ? false : true;
                    }
                  }
                  if (l) {
                    var y = k.updateQueue;
                    if (null === y) {
                      var H = /* @__PURE__ */ new Set();
                      H.add(g);
                      k.updateQueue = H;
                    } else y.add(g);
                    if (0 === (k.mode & 2)) {
                      k.effectTag |= 64;
                      e.effectTag &= -2981;
                      if (1 === e.tag) if (null === e.alternate) e.tag = 17;
                      else {
                        var z = Bg(1073741823, null);
                        z.tag = 2;
                        Dg(e, z);
                      }
                      e.expirationTime = 1073741823;
                      break a;
                    }
                    f = void 0;
                    e = b;
                    var ta = c.pingCache;
                    null === ta ? (ta = c.pingCache = new ej(), f = /* @__PURE__ */ new Set(), ta.set(g, f)) : (f = ta.get(g), void 0 === f && (f = /* @__PURE__ */ new Set(), ta.set(g, f)));
                    if (!f.has(e)) {
                      f.add(e);
                      var r = dk.bind(null, c, g, e);
                      g.then(r, r);
                    }
                    k.effectTag |= 4096;
                    k.expirationTime = b;
                    break a;
                  }
                  k = k.return;
                } while (null !== k);
                f = Error((Wa(e.type) || "A React component") + " suspended while rendering, but no fallback UI was specified.\n\nAdd a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display." + Xa(e));
              }
              X !== vj && (X = sj);
              f = Ni(f, e);
              k = d;
              do {
                switch (k.tag) {
                  case 3:
                    g = f;
                    k.effectTag |= 4096;
                    k.expirationTime = b;
                    var x = fj(k, g, b);
                    Eg(k, x);
                    break a;
                  case 1:
                    g = f;
                    var A = k.type, p = k.stateNode;
                    if (0 === (k.effectTag & 64) && ("function" === typeof A.getDerivedStateFromError || null !== p && "function" === typeof p.componentDidCatch && (null === jj || !jj.has(p)))) {
                      k.effectTag |= 4096;
                      k.expirationTime = b;
                      var t = ij(k, g, b);
                      Eg(k, t);
                      break a;
                    }
                }
                k = k.return;
              } while (null !== k);
            }
            V = ek(V);
          } catch (v) {
            b = v;
            continue;
          }
          break;
        } while (1);
      }
      function Uj() {
        var a = lj.current;
        lj.current = Lh;
        return null === a ? Lh : a;
      }
      function Ig(a, b) {
        a < xj && 2 < a && (xj = a);
        null !== b && a < yj && 2 < a && (yj = a, zj = b);
      }
      function Jg(a) {
        a > Aj && (Aj = a);
      }
      function Zj() {
        for (; null !== V; ) V = fk(V);
      }
      function Vj() {
        for (; null !== V && !Of(); ) V = fk(V);
      }
      function fk(a) {
        var b = gk(a.alternate, a, W);
        a.memoizedProps = a.pendingProps;
        null === b && (b = ek(a));
        mj.current = null;
        return b;
      }
      function ek(a) {
        V = a;
        do {
          var b = V.alternate;
          a = V.return;
          if (0 === (V.effectTag & 2048)) {
            a: {
              var c = b;
              b = V;
              var d = W;
              var e = b.pendingProps;
              switch (b.tag) {
                case 2:
                  break;
                case 16:
                  break;
                case 15:
                case 0:
                  break;
                case 1:
                  L(b.type) && Ff(b);
                  break;
                case 3:
                  nh(b);
                  Gf(b);
                  e = b.stateNode;
                  e.pendingContext && (e.context = e.pendingContext, e.pendingContext = null);
                  (null === c || null === c.child) && ki(b) && Ci(b);
                  Ii(b);
                  break;
                case 5:
                  ph(b);
                  d = lh(kh.current);
                  var f = b.type;
                  if (null !== c && null != b.stateNode) Ji(c, b, f, e, d), c.ref !== b.ref && (b.effectTag |= 128);
                  else if (e) {
                    var g = lh(ih.current);
                    if (ki(b)) {
                      e = b;
                      var h = e.stateNode;
                      c = e.type;
                      var k = e.memoizedProps, l = d;
                      h[ue] = e;
                      h[ve] = k;
                      f = void 0;
                      d = h;
                      switch (c) {
                        case "iframe":
                        case "object":
                        case "embed":
                          F("load", d);
                          break;
                        case "video":
                        case "audio":
                          for (h = 0; h < dc.length; h++) F(dc[h], d);
                          break;
                        case "source":
                          F("error", d);
                          break;
                        case "img":
                        case "image":
                        case "link":
                          F("error", d);
                          F("load", d);
                          break;
                        case "form":
                          F("reset", d);
                          F("submit", d);
                          break;
                        case "details":
                          F("toggle", d);
                          break;
                        case "input":
                          Bb(d, k);
                          F("invalid", d);
                          $d(l, "onChange");
                          break;
                        case "select":
                          d._wrapperState = { wasMultiple: !!k.multiple };
                          F("invalid", d);
                          $d(l, "onChange");
                          break;
                        case "textarea":
                          Lb(d, k), F("invalid", d), $d(l, "onChange");
                      }
                      Yd(c, k);
                      h = null;
                      for (f in k) k.hasOwnProperty(f) && (g = k[f], "children" === f ? "string" === typeof g ? d.textContent !== g && (h = ["children", g]) : "number" === typeof g && d.textContent !== "" + g && (h = ["children", "" + g]) : ia.hasOwnProperty(f) && null != g && $d(l, f));
                      switch (c) {
                        case "input":
                          yb(d);
                          Gb(d, k, true);
                          break;
                        case "textarea":
                          yb(d);
                          Nb(d, k);
                          break;
                        case "select":
                        case "option":
                          break;
                        default:
                          "function" === typeof k.onClick && (d.onclick = ae);
                      }
                      f = h;
                      e.updateQueue = f;
                      e = null !== f ? true : false;
                      e && Ci(b);
                    } else {
                      c = b;
                      l = f;
                      k = e;
                      h = 9 === d.nodeType ? d : d.ownerDocument;
                      g === Ob.html && (g = Pb(l));
                      g === Ob.html ? "script" === l ? (k = h.createElement("div"), k.innerHTML = "<script><\/script>", h = k.removeChild(k.firstChild)) : "string" === typeof k.is ? h = h.createElement(l, { is: k.is }) : (h = h.createElement(l), "select" === l && (l = h, k.multiple ? l.multiple = true : k.size && (l.size = k.size))) : h = h.createElementNS(g, l);
                      k = h;
                      k[ue] = c;
                      k[ve] = e;
                      Hi(k, b, false, false);
                      b.stateNode = k;
                      l = f;
                      c = e;
                      var m = d, C = Zd(l, c);
                      switch (l) {
                        case "iframe":
                        case "object":
                        case "embed":
                          F(
                            "load",
                            k
                          );
                          d = c;
                          break;
                        case "video":
                        case "audio":
                          for (d = 0; d < dc.length; d++) F(dc[d], k);
                          d = c;
                          break;
                        case "source":
                          F("error", k);
                          d = c;
                          break;
                        case "img":
                        case "image":
                        case "link":
                          F("error", k);
                          F("load", k);
                          d = c;
                          break;
                        case "form":
                          F("reset", k);
                          F("submit", k);
                          d = c;
                          break;
                        case "details":
                          F("toggle", k);
                          d = c;
                          break;
                        case "input":
                          Bb(k, c);
                          d = Ab(k, c);
                          F("invalid", k);
                          $d(m, "onChange");
                          break;
                        case "option":
                          d = Ib(k, c);
                          break;
                        case "select":
                          k._wrapperState = { wasMultiple: !!c.multiple };
                          d = n({}, c, { value: void 0 });
                          F("invalid", k);
                          $d(m, "onChange");
                          break;
                        case "textarea":
                          Lb(
                            k,
                            c
                          );
                          d = Kb(k, c);
                          F("invalid", k);
                          $d(m, "onChange");
                          break;
                        default:
                          d = c;
                      }
                      Yd(l, d);
                      h = void 0;
                      g = l;
                      var y = k, H = d;
                      for (h in H) if (H.hasOwnProperty(h)) {
                        var z = H[h];
                        "style" === h ? Wd(y, z) : "dangerouslySetInnerHTML" === h ? (z = z ? z.__html : void 0, null != z && Sb(y, z)) : "children" === h ? "string" === typeof z ? ("textarea" !== g || "" !== z) && Tb(y, z) : "number" === typeof z && Tb(y, "" + z) : "suppressContentEditableWarning" !== h && "suppressHydrationWarning" !== h && "autoFocus" !== h && (ia.hasOwnProperty(h) ? null != z && $d(m, h) : null != z && vb(y, h, z, C));
                      }
                      switch (l) {
                        case "input":
                          yb(k);
                          Gb(k, c, false);
                          break;
                        case "textarea":
                          yb(k);
                          Nb(k, c);
                          break;
                        case "option":
                          null != c.value && k.setAttribute("value", "" + ub(c.value));
                          break;
                        case "select":
                          d = k;
                          d.multiple = !!c.multiple;
                          k = c.value;
                          null != k ? Jb(d, !!c.multiple, k, false) : null != c.defaultValue && Jb(d, !!c.multiple, c.defaultValue, true);
                          break;
                        default:
                          "function" === typeof d.onClick && (k.onclick = ae);
                      }
                      (e = ne(f, e)) && Ci(b);
                    }
                    null !== b.ref && (b.effectTag |= 128);
                  } else if (null === b.stateNode) throw Error(u(166));
                  break;
                case 6:
                  if (c && null != b.stateNode) Ki(c, b, c.memoizedProps, e);
                  else {
                    if ("string" !== typeof e && null === b.stateNode) throw Error(u(166));
                    d = lh(kh.current);
                    lh(ih.current);
                    ki(b) ? (e = b, f = e.stateNode, d = e.memoizedProps, f[ue] = e, (e = f.nodeValue !== d) && Ci(b)) : (f = b, e = (9 === d.nodeType ? d : d.ownerDocument).createTextNode(e), e[ue] = f, b.stateNode = e);
                  }
                  break;
                case 11:
                  break;
                case 13:
                  G(M, b);
                  e = b.memoizedState;
                  if (0 !== (b.effectTag & 64)) {
                    b.expirationTime = d;
                    break a;
                  }
                  e = null !== e;
                  f = false;
                  null === c ? void 0 !== b.memoizedProps.fallback && ki(b) : (d = c.memoizedState, f = null !== d, e || null === d || (d = c.child.sibling, null !== d && (k = b.firstEffect, null !== k ? (b.firstEffect = d, d.nextEffect = k) : (b.firstEffect = b.lastEffect = d, d.nextEffect = null), d.effectTag = 8)));
                  if (e && !f && 0 !== (b.mode & 2)) if (null === c && true !== b.memoizedProps.unstable_avoidThisFallback || 0 !== (M.current & 1)) X === qj && (X = tj);
                  else {
                    if (X === qj || X === tj) X = uj;
                    0 !== Aj && null !== U && (Mj(U, W), Nj(U, Aj));
                  }
                  if (e || f) b.effectTag |= 4;
                  break;
                case 7:
                  break;
                case 8:
                  break;
                case 12:
                  break;
                case 4:
                  nh(b);
                  Ii(b);
                  break;
                case 10:
                  tg(b);
                  break;
                case 9:
                  break;
                case 14:
                  break;
                case 17:
                  L(b.type) && Ff(b);
                  break;
                case 19:
                  G(M, b);
                  e = b.memoizedState;
                  if (null === e) break;
                  f = 0 !== (b.effectTag & 64);
                  k = e.rendering;
                  if (null === k) if (f) Li(e, false);
                  else {
                    if (X !== qj || null !== c && 0 !== (c.effectTag & 64)) for (c = b.child; null !== c; ) {
                      k = qh(c);
                      if (null !== k) {
                        b.effectTag |= 64;
                        Li(e, false);
                        f = k.updateQueue;
                        null !== f && (b.updateQueue = f, b.effectTag |= 4);
                        null === e.lastEffect && (b.firstEffect = null);
                        b.lastEffect = e.lastEffect;
                        e = d;
                        for (f = b.child; null !== f; ) d = f, c = e, d.effectTag &= 2, d.nextEffect = null, d.firstEffect = null, d.lastEffect = null, k = d.alternate, null === k ? (d.childExpirationTime = 0, d.expirationTime = c, d.child = null, d.memoizedProps = null, d.memoizedState = null, d.updateQueue = null, d.dependencies = null) : (d.childExpirationTime = k.childExpirationTime, d.expirationTime = k.expirationTime, d.child = k.child, d.memoizedProps = k.memoizedProps, d.memoizedState = k.memoizedState, d.updateQueue = k.updateQueue, c = k.dependencies, d.dependencies = null === c ? null : { expirationTime: c.expirationTime, firstContext: c.firstContext, responders: c.responders }), f = f.sibling;
                        I(M, M.current & 1 | 2, b);
                        b = b.child;
                        break a;
                      }
                      c = c.sibling;
                    }
                  }
                  else {
                    if (!f) if (c = qh(k), null !== c) {
                      if (b.effectTag |= 64, f = true, d = c.updateQueue, null !== d && (b.updateQueue = d, b.effectTag |= 4), Li(e, true), null === e.tail && "hidden" === e.tailMode) {
                        b = b.lastEffect = e.lastEffect;
                        null !== b && (b.nextEffect = null);
                        break;
                      }
                    } else cg() > e.tailExpiration && 1 < d && (b.effectTag |= 64, f = true, Li(e, false), b.expirationTime = b.childExpirationTime = d - 1);
                    e.isBackwards ? (k.sibling = b.child, b.child = k) : (d = e.last, null !== d ? d.sibling = k : b.child = k, e.last = k);
                  }
                  if (null !== e.tail) {
                    0 === e.tailExpiration && (e.tailExpiration = cg() + 500);
                    d = e.tail;
                    e.rendering = d;
                    e.tail = d.sibling;
                    e.lastEffect = b.lastEffect;
                    d.sibling = null;
                    e = M.current;
                    e = f ? e & 1 | 2 : e & 1;
                    I(M, e, b);
                    b = d;
                    break a;
                  }
                  break;
                case 20:
                  break;
                case 21:
                  break;
                default:
                  throw Error(u(156, b.tag));
              }
              b = null;
            }
            e = V;
            if (1 === W || 1 !== e.childExpirationTime) {
              f = 0;
              for (d = e.child; null !== d; ) c = d.expirationTime, k = d.childExpirationTime, c > f && (f = c), k > f && (f = k), d = d.sibling;
              e.childExpirationTime = f;
            }
            if (null !== b) return b;
            null !== a && 0 === (a.effectTag & 2048) && (null === a.firstEffect && (a.firstEffect = V.firstEffect), null !== V.lastEffect && (null !== a.lastEffect && (a.lastEffect.nextEffect = V.firstEffect), a.lastEffect = V.lastEffect), 1 < V.effectTag && (null !== a.lastEffect ? a.lastEffect.nextEffect = V : a.firstEffect = V, a.lastEffect = V));
          } else {
            b = Mi(V, W);
            if (null !== b) return b.effectTag &= 2047, b;
            null !== a && (a.firstEffect = a.lastEffect = null, a.effectTag |= 2048);
          }
          b = V.sibling;
          if (null !== b) return b;
          V = a;
        } while (null !== V);
        X === qj && (X = vj);
        return null;
      }
      function Xj(a) {
        var b = a.expirationTime;
        a = a.childExpirationTime;
        return b > a ? b : a;
      }
      function Yj(a) {
        var b = dg();
        fg(99, ik.bind(null, a, b));
        return null;
      }
      function ik(a, b) {
        Sj();
        if ((T & (oj | pj)) !== S) throw Error(u(327));
        var c = a.finishedWork, d = a.finishedExpirationTime;
        if (null === c) return null;
        a.finishedWork = null;
        a.finishedExpirationTime = 0;
        if (c === a.current) throw Error(u(177));
        a.callbackNode = null;
        a.callbackExpirationTime = 0;
        a.callbackPriority = 90;
        a.nextKnownPendingLevel = 0;
        var e = Xj(c);
        a.firstPendingTime = e;
        d <= a.lastSuspendedTime ? a.firstSuspendedTime = a.lastSuspendedTime = a.nextKnownPendingLevel = 0 : d <= a.firstSuspendedTime && (a.firstSuspendedTime = d - 1);
        d <= a.lastPingedTime && (a.lastPingedTime = 0);
        d <= a.lastExpiredTime && (a.lastExpiredTime = 0);
        a === U && (V = U = null, W = 0);
        1 < c.effectTag ? null !== c.lastEffect ? (c.lastEffect.nextEffect = c, e = c.firstEffect) : e = c : e = c.firstEffect;
        if (null !== e) {
          var f = T;
          T |= pj;
          mj.current = null;
          le = Ld;
          var g = fe();
          if (ge(g)) {
            if ("selectionStart" in g) var h = { start: g.selectionStart, end: g.selectionEnd };
            else a: {
              h = (h = g.ownerDocument) && h.defaultView || window;
              var k = h.getSelection && h.getSelection();
              if (k && 0 !== k.rangeCount) {
                h = k.anchorNode;
                var l = k.anchorOffset, m = k.focusNode;
                k = k.focusOffset;
                try {
                  h.nodeType, m.nodeType;
                } catch (Db) {
                  h = null;
                  break a;
                }
                var C = 0, y = -1, H = -1, z = 0, ta = 0, r = g, x = null;
                b: for (; ; ) {
                  for (var A; ; ) {
                    r !== h || 0 !== l && 3 !== r.nodeType || (y = C + l);
                    r !== m || 0 !== k && 3 !== r.nodeType || (H = C + k);
                    3 === r.nodeType && (C += r.nodeValue.length);
                    if (null === (A = r.firstChild)) break;
                    x = r;
                    r = A;
                  }
                  for (; ; ) {
                    if (r === g) break b;
                    x === h && ++z === l && (y = C);
                    x === m && ++ta === k && (H = C);
                    if (null !== (A = r.nextSibling)) break;
                    r = x;
                    x = r.parentNode;
                  }
                  r = A;
                }
                h = -1 === y || -1 === H ? null : { start: y, end: H };
              } else h = null;
            }
            h = h || { start: 0, end: 0 };
          } else h = null;
          me = { focusedElem: g, selectionRange: h };
          Ld = false;
          Y = e;
          do
            try {
              jk();
            } catch (Db) {
              if (null === Y) throw Error(u(330));
              Ri(Y, Db);
              Y = Y.nextEffect;
            }
          while (null !== Y);
          Y = e;
          do
            try {
              for (g = a, h = b; null !== Y; ) {
                var p = Y.effectTag;
                p & 16 && Tb(Y.stateNode, "");
                if (p & 128) {
                  var t = Y.alternate;
                  if (null !== t) {
                    var v = t.ref;
                    null !== v && ("function" === typeof v ? v(null) : v.current = null);
                  }
                }
                switch (p & 1038) {
                  case 2:
                    $i(Y);
                    Y.effectTag &= -3;
                    break;
                  case 6:
                    $i(Y);
                    Y.effectTag &= -3;
                    aj(Y.alternate, Y);
                    break;
                  case 1024:
                    Y.effectTag &= -1025;
                    break;
                  case 1028:
                    Y.effectTag &= -1025;
                    aj(Y.alternate, Y);
                    break;
                  case 4:
                    aj(
                      Y.alternate,
                      Y
                    );
                    break;
                  case 8:
                    l = Y, Xi(g, l, h), Yi(l);
                }
                Y = Y.nextEffect;
              }
            } catch (Db) {
              if (null === Y) throw Error(u(330));
              Ri(Y, Db);
              Y = Y.nextEffect;
            }
          while (null !== Y);
          v = me;
          t = fe();
          p = v.focusedElem;
          h = v.selectionRange;
          if (t !== p && p && p.ownerDocument && ee(p.ownerDocument.documentElement, p)) {
            null !== h && ge(p) && (t = h.start, v = h.end, void 0 === v && (v = t), "selectionStart" in p ? (p.selectionStart = t, p.selectionEnd = Math.min(v, p.value.length)) : (v = (t = p.ownerDocument || document) && t.defaultView || window, v.getSelection && (v = v.getSelection(), l = p.textContent.length, g = Math.min(h.start, l), h = void 0 === h.end ? g : Math.min(h.end, l), !v.extend && g > h && (l = h, h = g, g = l), l = de(p, g), m = de(p, h), l && m && (1 !== v.rangeCount || v.anchorNode !== l.node || v.anchorOffset !== l.offset || v.focusNode !== m.node || v.focusOffset !== m.offset) && (t = t.createRange(), t.setStart(l.node, l.offset), v.removeAllRanges(), g > h ? (v.addRange(t), v.extend(m.node, m.offset)) : (t.setEnd(m.node, m.offset), v.addRange(t))))));
            t = [];
            for (v = p; v = v.parentNode; ) 1 === v.nodeType && t.push({ element: v, left: v.scrollLeft, top: v.scrollTop });
            "function" === typeof p.focus && p.focus();
            for (p = 0; p < t.length; p++) v = t[p], v.element.scrollLeft = v.left, v.element.scrollTop = v.top;
          }
          me = null;
          Ld = !!le;
          le = null;
          a.current = c;
          Y = e;
          do
            try {
              for (p = d; null !== Y; ) {
                var Dh = Y.effectTag;
                if (Dh & 36) {
                  var cc = Y.alternate;
                  t = Y;
                  v = p;
                  switch (t.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Ui(16, 32, t);
                      break;
                    case 1:
                      var dd = t.stateNode;
                      if (t.effectTag & 4) if (null === cc) dd.componentDidMount();
                      else {
                        var hk = t.elementType === t.type ? cc.memoizedProps : mg(t.type, cc.memoizedProps);
                        dd.componentDidUpdate(hk, cc.memoizedState, dd.__reactInternalSnapshotBeforeUpdate);
                      }
                      var Eh = t.updateQueue;
                      null !== Eh && Kg(t, Eh, dd, v);
                      break;
                    case 3:
                      var Fh = t.updateQueue;
                      if (null !== Fh) {
                        g = null;
                        if (null !== t.child) switch (t.child.tag) {
                          case 5:
                            g = t.child.stateNode;
                            break;
                          case 1:
                            g = t.child.stateNode;
                        }
                        Kg(t, Fh, g, v);
                      }
                      break;
                    case 5:
                      var xk = t.stateNode;
                      null === cc && t.effectTag & 4 && ne(t.type, t.memoizedProps) && xk.focus();
                      break;
                    case 6:
                      break;
                    case 4:
                      break;
                    case 12:
                      break;
                    case 13:
                      if (null === t.memoizedState) {
                        var Di = t.alternate;
                        if (null !== Di) {
                          var Ei = Di.memoizedState;
                          if (null !== Ei) {
                            var Fi = Ei.dehydrated;
                            null !== Fi && Lc(Fi);
                          }
                        }
                      }
                      break;
                    case 19:
                    case 17:
                    case 20:
                    case 21:
                      break;
                    default:
                      throw Error(u(163));
                  }
                }
                if (Dh & 128) {
                  t = void 0;
                  var wd = Y.ref;
                  if (null !== wd) {
                    var Gi = Y.stateNode;
                    switch (Y.tag) {
                      case 5:
                        t = Gi;
                        break;
                      default:
                        t = Gi;
                    }
                    "function" === typeof wd ? wd(t) : wd.current = t;
                  }
                }
                Y = Y.nextEffect;
              }
            } catch (Db) {
              if (null === Y) throw Error(u(330));
              Ri(Y, Db);
              Y = Y.nextEffect;
            }
          while (null !== Y);
          Y = null;
          Yf();
          T = f;
        } else a.current = c;
        if (Dj) Dj = false, Ej = a, Fj = b;
        else for (Y = e; null !== Y; ) b = Y.nextEffect, Y.nextEffect = null, Y = b;
        b = a.firstPendingTime;
        0 === b && (jj = null);
        1073741823 === b ? a === Ij ? Hj++ : (Hj = 0, Ij = a) : Hj = 0;
        "function" === typeof kk && kk(c.stateNode, d);
        Z(a);
        if (gj) throw gj = false, a = hj, hj = null, a;
        if ((T & nj) !== S) return null;
        jg();
        return null;
      }
      function jk() {
        for (; null !== Y; ) {
          var a = Y.effectTag;
          0 !== (a & 256) && Ti(Y.alternate, Y);
          0 === (a & 512) || Dj || (Dj = true, gg(97, function() {
            Sj();
            return null;
          }));
          Y = Y.nextEffect;
        }
      }
      function Sj() {
        if (90 !== Fj) {
          var a = 97 < Fj ? 97 : Fj;
          Fj = 90;
          return fg(a, lk);
        }
      }
      function lk() {
        if (null === Ej) return false;
        var a = Ej;
        Ej = null;
        if ((T & (oj | pj)) !== S) throw Error(u(331));
        var b = T;
        T |= pj;
        for (a = a.current.firstEffect; null !== a; ) {
          try {
            var c = a;
            if (0 !== (c.effectTag & 512)) switch (c.tag) {
              case 0:
              case 11:
              case 15:
                Ui(128, 0, c), Ui(0, 64, c);
            }
          } catch (d) {
            if (null === a) throw Error(u(330));
            Ri(a, d);
          }
          c = a.nextEffect;
          a.nextEffect = null;
          a = c;
        }
        T = b;
        jg();
        return true;
      }
      function mk(a, b, c) {
        b = Ni(c, b);
        b = fj(a, b, 1073741823);
        Dg(a, b);
        a = Kj(a, 1073741823);
        null !== a && Z(a);
      }
      function Ri(a, b) {
        if (3 === a.tag) mk(a, a, b);
        else for (var c = a.return; null !== c; ) {
          if (3 === c.tag) {
            mk(c, a, b);
            break;
          } else if (1 === c.tag) {
            var d = c.stateNode;
            if ("function" === typeof c.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === jj || !jj.has(d))) {
              a = Ni(b, a);
              a = ij(c, a, 1073741823);
              Dg(c, a);
              c = Kj(c, 1073741823);
              null !== c && Z(c);
              break;
            }
          }
          c = c.return;
        }
      }
      function dk(a, b, c) {
        var d = a.pingCache;
        null !== d && d.delete(b);
        U === a && W === c ? X === uj || X === tj && 1073741823 === xj && cg() - bj < Cj ? Tj(a, W) : Bj = true : Pj(a, c) && (b = a.lastPingedTime, 0 !== b && b < c || (a.lastPingedTime = c, a.finishedExpirationTime === c && (a.finishedExpirationTime = 0, a.finishedWork = null), Z(a)));
      }
      function dj(a, b) {
        var c = a.stateNode;
        null !== c && c.delete(b);
        b = 0;
        0 === b && (b = Pg(), b = Qg(b, a, null));
        a = Kj(a, b);
        null !== a && Z(a);
      }
      var gk;
      gk = function(a, b, c) {
        var d = b.expirationTime;
        if (null !== a) {
          var e = b.pendingProps;
          if (a.memoizedProps !== e || K.current) wg = true;
          else {
            if (d < c) {
              wg = false;
              switch (b.tag) {
                case 3:
                  wi(b);
                  li();
                  break;
                case 5:
                  oh(b);
                  if (b.mode & 4 && 1 !== c && e.hidden) return b.expirationTime = b.childExpirationTime = 1, null;
                  break;
                case 1:
                  L(b.type) && Jf(b);
                  break;
                case 4:
                  mh(b, b.stateNode.containerInfo);
                  break;
                case 10:
                  sg(b, b.memoizedProps.value);
                  break;
                case 13:
                  if (null !== b.memoizedState) {
                    d = b.child.childExpirationTime;
                    if (0 !== d && d >= c) return yi(a, b, c);
                    I(M, M.current & 1, b);
                    b = oi(a, b, c);
                    return null !== b ? b.sibling : null;
                  }
                  I(M, M.current & 1, b);
                  break;
                case 19:
                  d = b.childExpirationTime >= c;
                  if (0 !== (a.effectTag & 64)) {
                    if (d) return Bi(a, b, c);
                    b.effectTag |= 64;
                  }
                  e = b.memoizedState;
                  null !== e && (e.rendering = null, e.tail = null);
                  I(M, M.current, b);
                  if (!d) return null;
              }
              return oi(a, b, c);
            }
            wg = false;
          }
        } else wg = false;
        b.expirationTime = 0;
        switch (b.tag) {
          case 2:
            d = b.type;
            null !== a && (a.alternate = null, b.alternate = null, b.effectTag |= 2);
            a = b.pendingProps;
            e = Ef(b, J.current);
            vg(b, c);
            e = Ih(null, b, d, a, e, c);
            b.effectTag |= 1;
            if ("object" === typeof e && null !== e && "function" === typeof e.render && void 0 === e.$$typeof) {
              b.tag = 1;
              Mh();
              if (L(d)) {
                var f = true;
                Jf(b);
              } else f = false;
              b.memoizedState = null !== e.state && void 0 !== e.state ? e.state : null;
              var g = d.getDerivedStateFromProps;
              "function" === typeof g && Og(b, d, g, a);
              e.updater = Sg;
              b.stateNode = e;
              e._reactInternalFiber = b;
              Wg(b, d, a, c);
              b = vi(null, b, d, true, f, c);
            } else b.tag = 0, R(null, b, e, c), b = b.child;
            return b;
          case 16:
            e = b.elementType;
            null !== a && (a.alternate = null, b.alternate = null, b.effectTag |= 2);
            a = b.pendingProps;
            Va(e);
            if (1 !== e._status) throw e._result;
            e = e._result;
            b.type = e;
            f = b.tag = nk(e);
            a = mg(e, a);
            switch (f) {
              case 0:
                b = si(null, b, e, a, c);
                break;
              case 1:
                b = ui(null, b, e, a, c);
                break;
              case 11:
                b = ni(null, b, e, a, c);
                break;
              case 14:
                b = pi(null, b, e, mg(e.type, a), d, c);
                break;
              default:
                throw Error(u(306, e, ""));
            }
            return b;
          case 0:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : mg(d, e), si(a, b, d, e, c);
          case 1:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : mg(d, e), ui(a, b, d, e, c);
          case 3:
            wi(b);
            d = b.updateQueue;
            if (null === d) throw Error(u(282));
            e = b.memoizedState;
            e = null !== e ? e.element : null;
            Hg(b, d, b.pendingProps, null, c);
            d = b.memoizedState.element;
            if (d === e) li(), b = oi(a, b, c);
            else {
              if (e = b.stateNode.hydrate) di = re(b.stateNode.containerInfo.firstChild), ci = b, e = ei = true;
              if (e) for (c = gh(b, null, d, c), b.child = c; c; ) c.effectTag = c.effectTag & -3 | 1024, c = c.sibling;
              else R(a, b, d, c), li();
              b = b.child;
            }
            return b;
          case 5:
            return oh(b), null === a && ii(b), d = b.type, e = b.pendingProps, f = null !== a ? a.memoizedProps : null, g = e.children, oe(d, e) ? g = null : null !== f && oe(d, f) && (b.effectTag |= 16), ti(a, b), b.mode & 4 && 1 !== c && e.hidden ? (b.expirationTime = b.childExpirationTime = 1, b = null) : (R(a, b, g, c), b = b.child), b;
          case 6:
            return null === a && ii(b), null;
          case 13:
            return yi(a, b, c);
          case 4:
            return mh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a ? b.child = fh(b, null, d, c) : R(a, b, d, c), b.child;
          case 11:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : mg(d, e), ni(a, b, d, e, c);
          case 7:
            return R(a, b, b.pendingProps, c), b.child;
          case 8:
            return R(a, b, b.pendingProps.children, c), b.child;
          case 12:
            return R(a, b, b.pendingProps.children, c), b.child;
          case 10:
            a: {
              d = b.type._context;
              e = b.pendingProps;
              g = b.memoizedProps;
              f = e.value;
              sg(b, f);
              if (null !== g) {
                var h = g.value;
                f = of(h, f) ? 0 : ("function" === typeof d._calculateChangedBits ? d._calculateChangedBits(h, f) : 1073741823) | 0;
                if (0 === f) {
                  if (g.children === e.children && !K.current) {
                    b = oi(a, b, c);
                    break a;
                  }
                } else for (h = b.child, null !== h && (h.return = b); null !== h; ) {
                  var k = h.dependencies;
                  if (null !== k) {
                    g = h.child;
                    for (var l = k.firstContext; null !== l; ) {
                      if (l.context === d && 0 !== (l.observedBits & f)) {
                        1 === h.tag && (l = Bg(c, null), l.tag = 2, Dg(h, l));
                        h.expirationTime < c && (h.expirationTime = c);
                        l = h.alternate;
                        null !== l && l.expirationTime < c && (l.expirationTime = c);
                        ug(h.return, c);
                        k.expirationTime < c && (k.expirationTime = c);
                        break;
                      }
                      l = l.next;
                    }
                  } else g = 10 === h.tag ? h.type === b.type ? null : h.child : h.child;
                  if (null !== g) g.return = h;
                  else for (g = h; null !== g; ) {
                    if (g === b) {
                      g = null;
                      break;
                    }
                    h = g.sibling;
                    if (null !== h) {
                      h.return = g.return;
                      g = h;
                      break;
                    }
                    g = g.return;
                  }
                  h = g;
                }
              }
              R(a, b, e.children, c);
              b = b.child;
            }
            return b;
          case 9:
            return e = b.type, f = b.pendingProps, d = f.children, vg(b, c), e = xg(e, f.unstable_observedBits), d = d(e), b.effectTag |= 1, R(a, b, d, c), b.child;
          case 14:
            return e = b.type, f = mg(e, b.pendingProps), f = mg(e.type, f), pi(a, b, e, f, d, c);
          case 15:
            return ri(a, b, b.type, b.pendingProps, d, c);
          case 17:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : mg(d, e), null !== a && (a.alternate = null, b.alternate = null, b.effectTag |= 2), b.tag = 1, L(d) ? (a = true, Jf(b)) : a = false, vg(b, c), Ug(b, d, e, c), Wg(b, d, e, c), vi(null, b, d, true, a, c);
          case 19:
            return Bi(a, b, c);
        }
        throw Error(u(156, b.tag));
      };
      var kk = null;
      var Wi = null;
      function ok(a) {
        if ("undefined" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) return false;
        var b = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (b.isDisabled || !b.supportsFiber) return true;
        try {
          var c = b.inject(a);
          kk = function(a2) {
            try {
              b.onCommitFiberRoot(c, a2, void 0, 64 === (a2.current.effectTag & 64));
            } catch (e) {
            }
          };
          Wi = function(a2) {
            try {
              b.onCommitFiberUnmount(c, a2);
            } catch (e) {
            }
          };
        } catch (d) {
        }
        return true;
      }
      function pk(a, b, c, d) {
        this.tag = a;
        this.key = c;
        this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
        this.index = 0;
        this.ref = null;
        this.pendingProps = b;
        this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
        this.mode = d;
        this.effectTag = 0;
        this.lastEffect = this.firstEffect = this.nextEffect = null;
        this.childExpirationTime = this.expirationTime = 0;
        this.alternate = null;
      }
      function gi(a, b, c, d) {
        return new pk(a, b, c, d);
      }
      function qi(a) {
        a = a.prototype;
        return !(!a || !a.isReactComponent);
      }
      function nk(a) {
        if ("function" === typeof a) return qi(a) ? 1 : 0;
        if (void 0 !== a && null !== a) {
          a = a.$$typeof;
          if (a === Oa) return 11;
          if (a === Ra) return 14;
        }
        return 2;
      }
      function ah(a, b) {
        var c = a.alternate;
        null === c ? (c = gi(a.tag, b, a.key, a.mode), c.elementType = a.elementType, c.type = a.type, c.stateNode = a.stateNode, c.alternate = a, a.alternate = c) : (c.pendingProps = b, c.effectTag = 0, c.nextEffect = null, c.firstEffect = null, c.lastEffect = null);
        c.childExpirationTime = a.childExpirationTime;
        c.expirationTime = a.expirationTime;
        c.child = a.child;
        c.memoizedProps = a.memoizedProps;
        c.memoizedState = a.memoizedState;
        c.updateQueue = a.updateQueue;
        b = a.dependencies;
        c.dependencies = null === b ? null : {
          expirationTime: b.expirationTime,
          firstContext: b.firstContext,
          responders: b.responders
        };
        c.sibling = a.sibling;
        c.index = a.index;
        c.ref = a.ref;
        return c;
      }
      function ch(a, b, c, d, e, f) {
        var g = 2;
        d = a;
        if ("function" === typeof a) qi(a) && (g = 1);
        else if ("string" === typeof a) g = 5;
        else a: switch (a) {
          case Ia:
            return eh(c.children, e, f, b);
          case Na:
            g = 8;
            e |= 7;
            break;
          case Ja:
            g = 8;
            e |= 1;
            break;
          case Ka:
            return a = gi(12, c, b, e | 8), a.elementType = Ka, a.type = Ka, a.expirationTime = f, a;
          case Pa:
            return a = gi(13, c, b, e), a.type = Pa, a.elementType = Pa, a.expirationTime = f, a;
          case Qa:
            return a = gi(19, c, b, e), a.elementType = Qa, a.expirationTime = f, a;
          default:
            if ("object" === typeof a && null !== a) switch (a.$$typeof) {
              case La:
                g = 10;
                break a;
              case Ma:
                g = 9;
                break a;
              case Oa:
                g = 11;
                break a;
              case Ra:
                g = 14;
                break a;
              case Sa:
                g = 16;
                d = null;
                break a;
            }
            throw Error(u(130, null == a ? a : typeof a, ""));
        }
        b = gi(g, c, b, e);
        b.elementType = a;
        b.type = d;
        b.expirationTime = f;
        return b;
      }
      function eh(a, b, c, d) {
        a = gi(7, a, d, b);
        a.expirationTime = c;
        return a;
      }
      function bh(a, b, c) {
        a = gi(6, a, null, b);
        a.expirationTime = c;
        return a;
      }
      function dh(a, b, c) {
        b = gi(4, null !== a.children ? a.children : [], a.key, b);
        b.expirationTime = c;
        b.stateNode = { containerInfo: a.containerInfo, pendingChildren: null, implementation: a.implementation };
        return b;
      }
      function qk(a, b, c) {
        this.tag = b;
        this.current = null;
        this.containerInfo = a;
        this.pingCache = this.pendingChildren = null;
        this.finishedExpirationTime = 0;
        this.finishedWork = null;
        this.timeoutHandle = -1;
        this.pendingContext = this.context = null;
        this.hydrate = c;
        this.callbackNode = null;
        this.callbackPriority = 90;
        this.lastExpiredTime = this.lastPingedTime = this.nextKnownPendingLevel = this.lastSuspendedTime = this.firstSuspendedTime = this.firstPendingTime = 0;
      }
      function Pj(a, b) {
        var c = a.firstSuspendedTime;
        a = a.lastSuspendedTime;
        return 0 !== c && c >= b && a <= b;
      }
      function Mj(a, b) {
        var c = a.firstSuspendedTime, d = a.lastSuspendedTime;
        c < b && (a.firstSuspendedTime = b);
        if (d > b || 0 === c) a.lastSuspendedTime = b;
        b <= a.lastPingedTime && (a.lastPingedTime = 0);
        b <= a.lastExpiredTime && (a.lastExpiredTime = 0);
      }
      function Nj(a, b) {
        b > a.firstPendingTime && (a.firstPendingTime = b);
        var c = a.firstSuspendedTime;
        0 !== c && (b >= c ? a.firstSuspendedTime = a.lastSuspendedTime = a.nextKnownPendingLevel = 0 : b >= a.lastSuspendedTime && (a.lastSuspendedTime = b + 1), b > a.nextKnownPendingLevel && (a.nextKnownPendingLevel = b));
      }
      function Rj(a, b) {
        var c = a.lastExpiredTime;
        if (0 === c || c > b) a.lastExpiredTime = b;
      }
      function rk(a, b, c, d) {
        var e = b.current, f = Pg(), g = Mg.suspense;
        f = Qg(f, e, g);
        a: if (c) {
          c = c._reactInternalFiber;
          b: {
            if (ec(c) !== c || 1 !== c.tag) throw Error(u(170));
            var h = c;
            do {
              switch (h.tag) {
                case 3:
                  h = h.stateNode.context;
                  break b;
                case 1:
                  if (L(h.type)) {
                    h = h.stateNode.__reactInternalMemoizedMergedChildContext;
                    break b;
                  }
              }
              h = h.return;
            } while (null !== h);
            throw Error(u(171));
          }
          if (1 === c.tag) {
            var k = c.type;
            if (L(k)) {
              c = If(c, k, h);
              break a;
            }
          }
          c = h;
        } else c = Cf;
        null === b.context ? b.context = c : b.pendingContext = c;
        b = Bg(f, g);
        b.payload = { element: a };
        d = void 0 === d ? null : d;
        null !== d && (b.callback = d);
        Dg(e, b);
        Rg(e, f);
        return f;
      }
      function sk(a) {
        a = a.current;
        if (!a.child) return null;
        switch (a.child.tag) {
          case 5:
            return a.child.stateNode;
          default:
            return a.child.stateNode;
        }
      }
      function tk(a, b) {
        a = a.memoizedState;
        null !== a && null !== a.dehydrated && a.retryTime < b && (a.retryTime = b);
      }
      function uk(a, b) {
        tk(a, b);
        (a = a.alternate) && tk(a, b);
      }
      function vk(a, b, c) {
        var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
        return { $$typeof: Ha, key: null == d ? null : "" + d, children: a, containerInfo: b, implementation: c };
      }
      jc = function(a) {
        if (13 === a.tag) {
          var b = lg(Pg(), 150, 100);
          Rg(a, b);
          uk(a, b);
        }
      };
      kc = function(a) {
        if (13 === a.tag) {
          Pg();
          var b = kg++;
          Rg(a, b);
          uk(a, b);
        }
      };
      lc = function(a) {
        if (13 === a.tag) {
          var b = Pg();
          b = Qg(b, a, null);
          Rg(a, b);
          uk(a, b);
        }
      };
      Za = function(a, b, c) {
        switch (b) {
          case "input":
            Eb(a, c);
            b = c.name;
            if ("radio" === c.type && null != b) {
              for (c = a; c.parentNode; ) c = c.parentNode;
              c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
              for (b = 0; b < c.length; b++) {
                var d = c[b];
                if (d !== a && d.form === a.form) {
                  var e = ye(d);
                  if (!e) throw Error(u(90));
                  zb(d);
                  Eb(d, e);
                }
              }
            }
            break;
          case "textarea":
            Mb(a, c);
            break;
          case "select":
            b = c.value, null != b && Jb(a, !!c.multiple, b, false);
        }
      };
      function wk(a, b, c) {
        c = null != c && true === c.hydrate;
        var d = new qk(a, b, c), e = gi(3, null, null, 2 === b ? 7 : 1 === b ? 3 : 0);
        d.current = e;
        e.stateNode = d;
        a[we] = d.current;
        c && 0 !== b && wc(9 === a.nodeType ? a : a.ownerDocument);
        this._internalRoot = d;
      }
      wk.prototype.render = function(a, b) {
        var c = this._internalRoot;
        rk(a, c, null, void 0 === b ? null : b);
      };
      wk.prototype.unmount = function(a) {
        var b = this._internalRoot;
        rk(null, b, null, void 0 === a ? null : a);
      };
      function yk(a) {
        return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType && (8 !== a.nodeType || " react-mount-point-unstable " !== a.nodeValue));
      }
      eb = bk;
      fb = function(a, b, c, d) {
        var e = T;
        T |= 4;
        try {
          return fg(98, a.bind(null, b, c, d));
        } finally {
          T = e, T === S && jg();
        }
      };
      gb = function() {
        (T & (1 | oj | pj)) === S && (ak(), Sj());
      };
      hb = function(a, b) {
        var c = T;
        T |= 2;
        try {
          return a(b);
        } finally {
          T = c, T === S && jg();
        }
      };
      function zk(a, b) {
        b || (b = a ? 9 === a.nodeType ? a.documentElement : a.firstChild : null, b = !(!b || 1 !== b.nodeType || !b.hasAttribute("data-reactroot")));
        if (!b) for (var c; c = a.lastChild; ) a.removeChild(c);
        return new wk(a, 0, b ? { hydrate: true } : void 0);
      }
      function Ak(a, b, c, d, e) {
        var f = c._reactRootContainer;
        if (f) {
          var g = f._internalRoot;
          if ("function" === typeof e) {
            var h = e;
            e = function() {
              var a2 = sk(g);
              h.call(a2);
            };
          }
          rk(b, g, a, e);
        } else {
          f = c._reactRootContainer = zk(c, d);
          g = f._internalRoot;
          if ("function" === typeof e) {
            var k = e;
            e = function() {
              var a2 = sk(g);
              k.call(a2);
            };
          }
          ck(function() {
            rk(b, g, a, e);
          });
        }
        return sk(g);
      }
      function Bk(a, b) {
        var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
        if (!yk(b)) throw Error(u(200));
        return vk(a, b, null, c);
      }
      var Ck = { createPortal: Bk, findDOMNode: function(a) {
        if (null == a) return null;
        if (1 === a.nodeType) return a;
        var b = a._reactInternalFiber;
        if (void 0 === b) {
          if ("function" === typeof a.render) throw Error(u(188));
          throw Error(u(268, Object.keys(a)));
        }
        a = ic(b);
        a = null === a ? null : a.stateNode;
        return a;
      }, hydrate: function(a, b, c) {
        if (!yk(b)) throw Error(u(200));
        return Ak(null, a, b, true, c);
      }, render: function(a, b, c) {
        if (!yk(b)) throw Error(u(200));
        return Ak(null, a, b, false, c);
      }, unstable_renderSubtreeIntoContainer: function(a, b, c, d) {
        if (!yk(c)) throw Error(u(200));
        if (null == a || void 0 === a._reactInternalFiber) throw Error(u(38));
        return Ak(a, b, c, false, d);
      }, unmountComponentAtNode: function(a) {
        if (!yk(a)) throw Error(u(40));
        return a._reactRootContainer ? (ck(function() {
          Ak(null, null, a, false, function() {
            a._reactRootContainer = null;
          });
        }), true) : false;
      }, unstable_createPortal: function() {
        return Bk.apply(void 0, arguments);
      }, unstable_batchedUpdates: bk, flushSync: function(a, b) {
        if ((T & (oj | pj)) !== S) throw Error(u(187));
        var c = T;
        T |= 1;
        try {
          return fg(99, a.bind(null, b));
        } finally {
          T = c, jg();
        }
      }, __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: { Events: [
        Cc,
        xe,
        ye,
        Ca.injectEventPluginsByName,
        fa,
        Sc,
        function(a) {
          ya(a, Rc);
        },
        cb,
        db,
        Pd,
        Ba,
        Sj,
        { current: false }
      ] } };
      (function(a) {
        var b = a.findFiberByHostInstance;
        return ok(n({}, a, { overrideHookState: null, overrideProps: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: Ea.ReactCurrentDispatcher, findHostInstanceByFiber: function(a2) {
          a2 = ic(a2);
          return null === a2 ? null : a2.stateNode;
        }, findFiberByHostInstance: function(a2) {
          return b ? b(a2) : null;
        }, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null }));
      })({
        findFiberByHostInstance: Fc,
        bundleType: 0,
        version: "16.11.0",
        rendererPackageName: "react-dom"
      });
      var Dk = { default: Ck };
      var Ek = Dk && Ck || Dk;
      module.exports = Ek.default || Ek;
    }
  });

  // node_modules/react-dom/index.js
  var require_react_dom = __commonJS({
    "node_modules/react-dom/index.js"(exports, module) {
      "use strict";
      function checkDCE() {
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
          return;
        }
        if (false) {
          throw new Error("^_^");
        }
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
        } catch (err) {
          console.error(err);
        }
      }
      if (true) {
        checkDCE();
        module.exports = require_react_dom_production_min();
      } else {
        module.exports = null;
      }
    }
  });

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
  function maybePluralize(count, noun, suffix = "s") {
    return `${count} ${noun}${count !== 1 ? suffix : ""}`;
  }
  function toBoolean(str) {
    if (typeof str === "undefined" || str === null) {
      return false;
    } else if (typeof str === "string") {
      switch (str.toLowerCase()) {
        case "false":
        case "no":
        case "0":
        case "":
          return false;
        default:
          return true;
      }
    } else if (typeof str === "number") {
      return str !== 0;
    } else {
      return true;
    }
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
  var refresh_windows = "refresh_windows";
  var windowColors = "windowColors";
  var windowNames = "windowNames";

  // src/helpers/migrate.ts
  var browser = __toESM(require_browser_polyfill());
  var stringkeys = [
    "layout",
    "version"
  ];
  var jsonkeys = [
    "tabLimit",
    "tabWidth",
    "tabHeight",
    "windowAge",
    windowNames,
    windowColors
  ];
  var boolkeys = [
    "openInOwnTab",
    "animations",
    "windowTitles",
    "compact",
    "dark",
    "tabactions",
    "badge",
    "sessionsFeature",
    "hideWindows",
    "filter-tabs"
  ];
  (async function() {
    let needsMigration = false;
    for (const key of stringkeys) {
      if (!!localStorage[key]) {
        needsMigration = true;
        break;
      }
    }
    for (const key of boolkeys) {
      if (!!localStorage[key]) {
        needsMigration = true;
        break;
      }
    }
    for (const key of jsonkeys) {
      if (!!localStorage[key]) {
        needsMigration = true;
        break;
      }
    }
    if (needsMigration) {
      let keyValue = {};
      let values = await browser.storage.local.get(null);
      if (!!values) {
        for (const key in values) {
          if (!!values[key].tabs) {
            console.log("session deleting " + key);
            await browser.storage.local.remove(key);
          } else {
            delete values[key];
          }
        }
        keyValue["sessions"] = values;
      }
      for (const key of stringkeys) {
        if (!!localStorage[key]) keyValue[key] = localStorage[key];
      }
      for (const key of boolkeys) {
        if (!!localStorage[key]) keyValue[key] = toBoolean(localStorage[key]);
      }
      for (const key of jsonkeys) {
        if (!!localStorage[key]) keyValue[key] = JSON.parse(localStorage[key]);
      }
      await browser.storage.local.set(keyValue);
      for (const key of stringkeys) localStorage.removeItem(key);
      for (const key of boolkeys) localStorage.removeItem(key);
      for (const key of jsonkeys) localStorage.removeItem(key);
    }
  })();

  // src/helpers/storage.ts
  var browser2 = __toESM(require_browser_polyfill());
  async function getLocalStorage(key, default_value = null) {
    const result = await browser2.storage.local.get([key]);
    return result[key] === void 0 ? default_value : result[key];
  }
  async function getLocalStorageMap(key) {
    const result = await browser2.storage.local.get([key]);
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
    return browser2.storage.local.set(obj);
  }

  // src/popup/views/Session.tsx
  var React = __toESM(require_react());
  var browser3 = __toESM(require_browser_polyfill());
  var Session = class extends React.Component {
    constructor(props) {
      super(props);
      let name = this.props.session.name;
      let color = this.props.session.color || "default";
      this.state = {
        name,
        color
      };
      this.stop = this.stop.bind(this);
      this.windowClick = this.windowClick.bind(this);
      this.windowTabClick = this.windowTabClick.bind(this);
      this.close = this.close.bind(this);
      this.openTab = this.openTab.bind(this);
      this.maximize = this.maximize.bind(this);
    }
    render() {
      let _this = this;
      let hideWindow = true;
      let titleAdded = false;
      let tabsperrow = this.props.layout.indexOf("blocks") > -1 ? Math.ceil(Math.sqrt(this.props.tabs.length + 2)) : this.props.layout === "vertical" ? 1 : 15;
      let tabs4 = this.props.tabs.map(function(tab) {
        let tabId = tab.id * tab.id * tab.id * 100;
        let isHidden = _this.props.hiddenTabs.has(tabId) && _this.props.filterTabs;
        let isSelected = _this.props.selection.has(tabId);
        tab.id = tab.index;
        if (!isHidden) hideWindow = false;
        return /* @__PURE__ */ React.createElement(
          Tab,
          {
            id: "sessiontab_" + _this.props.session.id + "_" + tab.index,
            key: "sessiontab_" + _this.props.session.id + "_" + tab.index,
            session: _this.props.session,
            layout: _this.props.layout,
            tab,
            selected: isSelected,
            hidden: isHidden,
            draggable: false,
            click: _this.openTab,
            middleClick: _this.props.tabMiddleClick,
            hoverHandler: _this.props.hoverHandler,
            searchActive: _this.props.searchActive,
            select: _this.props.select,
            ref: "sessiontab" + tabId
          }
        );
      });
      if (!hideWindow) {
        if (!!this.props.tabactions) {
          tabs4.push(
            /* @__PURE__ */ React.createElement("div", { key: "sessionnl_" + _this.props.session.id, className: "newliner" }),
            /* @__PURE__ */ React.createElement("div", { key: "sessionwa_" + _this.props.session.id, className: "window-actions" }, /* @__PURE__ */ React.createElement(
              "div",
              {
                className: "icon tabaction restore " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Restore this saved window\nWill restore " + tabs4.length + " tabs. Please note : The tabs will be restored without their history.",
                onClick: this.windowClick,
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React.createElement(
              "div",
              {
                className: "icon tabaction delete " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Delete this saved window\nWill delete " + tabs4.length + " tabs permanently",
                onClick: this.close,
                onMouseEnter: this.props.hoverIcon
              }
            ))
          );
        }
        if (this.props.windowTitles) {
          if (this.state.name) {
            tabs4.unshift(
              /* @__PURE__ */ React.createElement("h3", { key: "session-" + this.props.session.id + "-windowTitle", className: "center windowTitle" }, this.state.name)
            );
            titleAdded = true;
          }
        }
        if (tabsperrow < 3) {
          tabsperrow = 3;
        }
        var children = [];
        if (!!titleAdded) {
          children.push(tabs4.shift());
        }
        for (var j = 0; j < tabs4.length; j++) {
          children.push(tabs4[j]);
          if ((j + 1) % tabsperrow === 0 && j && this.props.layout.indexOf("blocks") > -1) {
            children.push(/* @__PURE__ */ React.createElement("div", { key: "sessionnl_" + _this.props.session.id + "_" + j, className: "newliner" }));
          }
        }
        var focused = false;
        if (this.props.session.windowsInfo.focused || this.props.lastOpenWindow === this.props.session.windowsInfo.id) {
          focused = true;
        }
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: "session-" + this.props.session.id,
            id: "session-" + this.props.session.id,
            className: "window " + this.props.session.windowsInfo.state + " " + (focused ? "activeWindow" : "") + " session " + (this.props.layout.indexOf("blocks") > -1 ? "block" : "") + " " + this.props.layout + " " + this.state.color + " " + (this.props.session.windowsInfo.incognito ? " incognito" : "") + " " + (focused ? " focused" : ""),
            onClick: this.windowClick
          },
          /* @__PURE__ */ React.createElement("div", { className: "windowcontainer" }, children)
        );
      } else {
        return null;
      }
    }
    shouldComponentUpdate(nextProps, nextState) {
      return true;
    }
    stop(e) {
      e.stopPropagation();
    }
    async windowTabClick(e) {
      e.stopPropagation();
    }
    async windowClick(e) {
      this.restoreSession(e, null);
    }
    async openTab(e, index) {
      this.restoreSession(e, index);
    }
    async restoreSession(e, tabId) {
      e.stopPropagation();
      await browser3.runtime.sendMessage({
        command: create_window_with_session_tabs,
        session: this.props.session,
        tab_id: tabId
      });
      this.props.parentUpdate();
      if (!!window.inPopup) {
        window.close();
      } else {
        setTimeout(function() {
          this.props.scrollTo("window", browser3.windows.WINDOW_ID_CURRENT);
        }.bind(this), 500);
      }
    }
    async close(e) {
      e.stopPropagation();
      var sessions = await getLocalStorage("sessions", {});
      delete sessions[this.props.session.id];
      var value = await setLocalStorage("sessions", sessions).catch(function(err) {
        console.log(err);
        console.error(err.message);
      });
      console.log(value);
      this.props.parentUpdate();
    }
    maximize(e) {
      e.stopPropagation();
    }
  };

  // src/popup/views/Tab.tsx
  var React2 = __toESM(require_react());
  var browser4 = __toESM(require_browser_polyfill());
  var Tab = class extends React2.Component {
    constructor(props) {
      super(props);
      this.state = {
        favIcon: "",
        dragFavIcon: "",
        draggingOver: "",
        hovered: false,
        tabRef: React2.createRef()
      };
      this.onHover = this.onHover.bind(this);
      this.onHoverOut = this.onHoverOut.bind(this);
      this.onMouseDown = this.onMouseDown.bind(this);
      this.click = this.click.bind(this);
      this.dragStart = this.dragStart.bind(this);
      this.dragOver = this.dragOver.bind(this);
      this.dragOut = this.dragOut.bind(this);
      this.drop = this.drop.bind(this);
      this.resolveFavIconUrl = this.resolveFavIconUrl.bind(this);
      this.checkSettings = this.checkSettings.bind(this);
    }
    async componentDidMount() {
      await this.checkSettings();
    }
    async checkSettings() {
      await this.resolveFavIconUrl();
    }
    render() {
      const children = [];
      if (this.props.layout === "vertical") {
        children.push(
          /* @__PURE__ */ React2.createElement("div", { key: "tab-pinned-" + this.props.tab.id, className: "tab-pinned " + (!this.props.tab.pinned ? "hidden" : "") }, "Pinned")
        );
        children.push(
          /* @__PURE__ */ React2.createElement("div", { key: "tab-highlighted-" + this.props.tab.id, className: "tab-highlighted " + (!this.props.tab.highlighted ? "hidden" : "") }, "Active")
        );
        children.push(
          /* @__PURE__ */ React2.createElement("div", { key: "tab-selected-" + this.props.tab.id, className: "tab-selected " + (!this.props.selected ? "hidden" : "") }, "Selected")
        );
        children.push(
          /* @__PURE__ */ React2.createElement(
            "div",
            {
              key: "tab-icon-" + this.props.tab.id,
              className: "iconoverlay ",
              style: {
                backgroundImage: !!this.state.favIcon ? "url(" + this.state.favIcon + ")" : ""
              }
            }
          )
        );
        children.push(
          /* @__PURE__ */ React2.createElement("div", { key: "tab-title-" + this.props.tab.id, className: "tabtitle" }, this.props.tab.title || "")
        );
      }
      var tabDom = {
        className: "icon tab " + (this.props.selected ? "selected " : "") + (this.props.tab.pinned ? "pinned " : "") + (this.props.tab.highlighted ? "highlighted " : "") + (this.props.hidden ? "hidden " : "") + (this.props.tab.mutedInfo && this.props.tab.mutedInfo.muted ? "muted " : "") + (this.props.tab.audible ? "audible " : "") + (this.props.tab.discarded ? "discarded " : "") + (this.props.layout === "vertical" ? "full " : "") + (this.props.tab.incognito ? "incognito " : "") + this.state.draggingOver + (this.props.searchActive ? "search-active " : "") + " tab-" + this.props.tab.id + " " + (this.props.layout === "vertical" ? "vertical " : "blocks "),
        style: this.props.layout === "vertical" ? {} : { backgroundImage: !!this.state.favIcon ? "url(" + this.state.favIcon + ")" : "" },
        id: this.props.id,
        title: this.props.tab.title,
        onClick: this.click,
        onMouseDown: this.onMouseDown,
        onMouseEnter: this.onHover,
        onMouseOut: this.onHoverOut,
        ref: this.state.tabRef
      };
      if (!!this.props.draggable) {
        tabDom["onDragStart"] = this.dragStart;
        tabDom["onDragOver"] = this.dragOver;
        tabDom["onDragLeave"] = this.dragOut;
        tabDom["onDrop"] = this.drop;
        tabDom["draggable"] = "true";
      }
      return /* @__PURE__ */ React2.createElement("div", { ...tabDom }, children, /* @__PURE__ */ React2.createElement("div", { className: "limiter" }));
    }
    onHover(e) {
      this.setState({ hovered: true });
      this.props.hoverHandler(this.props.tab);
    }
    onHoverOut(e) {
      this.setState({ hovered: false });
    }
    async onMouseDown(e) {
      if (e.button === 0) return;
      if (!this.props.draggable) return;
      await this.click(e);
    }
    async click(e) {
      this.stopProp(e);
      var tabId = this.props.tab.id;
      if (e.button === 1) {
        this.props.middleClick(tabId);
      } else if (e.button === 2 || e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey) {
        e.preventDefault();
        if (e.button === 2 && (e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)) {
          this.props.selectTo(tabId);
        } else {
          this.props.select(tabId);
        }
      } else {
        if (!!this.props.click) {
          this.props.click(e, this.props.tab.id);
        } else {
          let windowId = this.props.window.id;
          if (navigator.userAgent.search("Firefox") > -1) {
            browser4.runtime.sendMessage({
              command: focus_on_tab_and_window_delayed,
              saved_tab: { tabId, windowId }
            });
          } else {
            browser4.runtime.sendMessage({
              command: focus_on_tab_and_window,
              saved_tab: { tabId, windowId }
            });
          }
        }
        if (!!window.inPopup) window.close();
      }
      return false;
    }
    dragStart(e) {
      if (!this.props.draggable) return false;
      if (!this.props.drag) return false;
      this.setState({
        dragFavIcon: ""
      });
      this.props.dragFavicon(this.state.favIcon);
      e.dataTransfer.setData("Text", this.props.tab.id.toString());
      e.dataTransfer.setData("text/uri-list", this.props.tab.url || "");
      this.props.drag(e, this.props.tab.id);
    }
    dragOver(e) {
      if (!this.props.draggable) return false;
      if (!this.props.drag) return false;
      let favicon = this.props.dragFavicon();
      let draggingover;
      var before = this.state.draggingOver;
      if (this.props.layout === "vertical") {
        draggingover = e.nativeEvent.offsetY > this.state.tabRef.current.clientHeight / 2 ? "bottom" : "top";
      } else {
        draggingover = e.nativeEvent.offsetX > this.state.tabRef.current.clientWidth / 2 ? "right" : "left";
      }
      this.setState({
        draggingOver: draggingover,
        dragFavIcon: favicon
      });
      if (before !== this.state.draggingOver) {
        this.forceUpdate();
        this.props.parentUpdate();
      }
    }
    dragOut() {
      if (!this.props.draggable) return false;
      if (!this.props.drag) return;
      this.setState({
        dragFavIcon: "",
        draggingOver: ""
      });
      this.forceUpdate();
      this.props.parentUpdate();
    }
    drop(e) {
      if (!this.props.draggable) return false;
      if (!this.props.drag) return false;
      if (!this.props.drop) return;
      this.stopProp(e);
      var before = this.state.draggingOver === "top" || this.state.draggingOver === "left";
      this.setState({
        draggingOver: "",
        dragFavIcon: ""
      });
      this.props.drop(this.props.tab.id, before);
      this.forceUpdate();
      this.props.parentUpdate();
    }
    async resolveFavIconUrl() {
      let image;
      var _url = this.props.tab.url || this.props.tab.pendingUrl || "";
      if (!!_url && navigator.userAgent.search("Firefox") === -1) {
        image = "chrome-extension://" + chrome.runtime.id + "/_favicon/?pageUrl=" + encodeURIComponent(_url) + "&size=64";
      } else if (!!_url && _url.indexOf("chrome://") !== 0 && _url.indexOf("about:") !== 0) {
        image = this.props.tab.favIconUrl ? "" + this.props.tab.favIconUrl : "";
      } else {
        const favIcons = ["bookmarks", "chrome", "crashes", "downloads", "extensions", "flags", "history", "settings"];
        let iconUrl = _url;
        if (iconUrl.length > 9) {
          let iconName = iconUrl.slice(9).match(/^\w+/g);
          console.log(iconName);
          image = !iconName || favIcons.indexOf(iconName[0]) < 0 ? "" : "../images/chrome/" + iconName[0] + ".png";
        }
      }
      this.setState({
        favIcon: image
      });
    }
    stopProp(e) {
      if (e && e.nativeEvent) {
        e.nativeEvent.preventDefault();
        e.nativeEvent.stopPropagation();
      }
      if (e && e.preventDefault) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  // src/popup/views/TabManager.tsx
  var React3 = __toESM(require_react());
  var browser5 = __toESM(require_browser_polyfill());
  var { setTimeout: setTimeout2, clearTimeout: clearTimeout2 } = window;
  var TabManager = class extends React3.Component {
    constructor(props) {
      super(props);
      let layout = "blocks";
      let animations = true;
      let windowTitles = true;
      let compact = false;
      let dark = false;
      let tabactions = true;
      let badge = true;
      let sessionsFeature = false;
      let hideWindows = false;
      let filterTabs = false;
      let tabLimit = 0;
      let openInOwnTab = false;
      let tabWidth = 800;
      let tabHeight = 600;
      let resetTimeout = -1;
      this.state = {
        layout,
        animations,
        windowTitles,
        tabLimit,
        openInOwnTab,
        tabWidth,
        tabHeight,
        compact,
        dark,
        tabactions,
        badge,
        hideWindows,
        sessionsFeature,
        lastOpenWindow: -1,
        windows: [],
        sessions: [],
        selection: /* @__PURE__ */ new Set(),
        lastSelect: 0,
        hiddenTabs: /* @__PURE__ */ new Set(),
        tabsbyid: /* @__PURE__ */ new Map(),
        windowsbyid: /* @__PURE__ */ new Map(),
        resetTimeout,
        height: 600,
        hasScrollBar: false,
        focusUpdates: 0,
        topText: "",
        bottomText: "",
        lastDirection: "",
        optionsActive: !!this.props.optionsActive,
        filterTabs,
        dupTabs: false,
        dragFavicon: "",
        colorsActive: 0,
        tabCount: 0,
        hiddenCount: 0,
        searchLen: 0
      };
      this.addWindow = this.addWindow.bind(this);
      this.animationsText = this.animationsText.bind(this);
      this.badgeText = this.badgeText.bind(this);
      this.changelayout = this.changelayout.bind(this);
      this.changeTabHeight = this.changeTabHeight.bind(this);
      this.changeTabLimit = this.changeTabLimit.bind(this);
      this.changeTabWidth = this.changeTabWidth.bind(this);
      this.checkKey = this.checkKey.bind(this);
      this.clearSelection = this.clearSelection.bind(this);
      this.compactText = this.compactText.bind(this);
      this.darkText = this.darkText.bind(this);
      this.deleteTabs = this.deleteTabs.bind(this);
      this.discardTabs = this.discardTabs.bind(this);
      this.donate = this.donate.bind(this);
      this.exportSessions = this.exportSessions.bind(this);
      this.exportSessionsText = this.exportSessionsText.bind(this);
      this.getTip = this.getTip.bind(this);
      this.hideText = this.hideText.bind(this);
      this.highlightDuplicates = this.highlightDuplicates.bind(this);
      this.hoverIcon = this.hoverIcon.bind(this);
      this.importSessions = this.importSessions.bind(this);
      this.importSessionsText = this.importSessionsText.bind(this);
      this.openInOwnTabText = this.openInOwnTabText.bind(this);
      this.pinTabs = this.pinTabs.bind(this);
      this.rateExtension = this.rateExtension.bind(this);
      this.scrollTo = this.scrollTo.bind(this);
      this.search = this.search.bind(this);
      this.sessionsText = this.sessionsText.bind(this);
      this.sessionSync = this.sessionSync.bind(this);
      this.tabActionsText = this.tabActionsText.bind(this);
      this.tabHeightText = this.tabHeightText.bind(this);
      this.tabLimitText = this.tabLimitText.bind(this);
      this.tabWidthText = this.tabWidthText.bind(this);
      this.toggleAnimations = this.toggleAnimations.bind(this);
      this.toggleBadge = this.toggleBadge.bind(this);
      this.toggleCompact = this.toggleCompact.bind(this);
      this.toggleDark = this.toggleDark.bind(this);
      this.toggleFilterMismatchedTabs = this.toggleFilterMismatchedTabs.bind(this);
      this.toggleHide = this.toggleHide.bind(this);
      this.toggleOpenInOwnTab = this.toggleOpenInOwnTab.bind(this);
      this.toggleOptions = this.toggleOptions.bind(this);
      this.toggleSessions = this.toggleSessions.bind(this);
      this.toggleTabActions = this.toggleTabActions.bind(this);
      this.toggleWindowTitles = this.toggleWindowTitles.bind(this);
      this.update = this.update.bind(this);
      this.windowTitlesText = this.windowTitlesText.bind(this);
      this.onTabDetached = this.onTabDetached.bind(this);
      this.onTabAttached = this.onTabAttached.bind(this);
      this.onTabRemoved = this.onTabRemoved.bind(this);
      this.onTabCreated = this.onTabCreated.bind(this);
      this.dirtyWindow = this.dirtyWindow.bind(this);
    }
    UNSAFE_componentWillMount() {
      this.update();
    }
    async loadStorage() {
      var layout = "blocks";
      var animations = true;
      var windowTitles = true;
      var compact = false;
      var dark = false;
      var tabactions = true;
      var badge = true;
      var sessionsFeature = false;
      var hideWindows = false;
      var filterTabs = false;
      var tabLimit = 0;
      var openInOwnTab = false;
      var tabWidth = 800;
      var tabHeight = 600;
      var storage4 = await browser5.storage.local.get(null);
      if (!storage4["layout"]) storage4["layout"] = layout;
      if (typeof storage4["tabLimit"] === "undefined") storage4["tabLimit"] = tabLimit;
      if (typeof storage4["tabWidth"] === "undefined") storage4["tabWidth"] = tabWidth;
      if (typeof storage4["tabHeight"] === "undefined") storage4["tabHeight"] = tabHeight;
      if (typeof storage4["animations"] === "undefined") storage4["animations"] = animations;
      if (typeof storage4["windowTitles"] === "undefined") storage4["windowTitles"] = windowTitles;
      if (typeof storage4["tabactions"] === "undefined") storage4["tabactions"] = tabactions;
      if (typeof storage4["badge"] === "undefined") storage4["badge"] = badge;
      if (typeof storage4["openInOwnTab"] === "undefined") storage4["openInOwnTab"] = openInOwnTab;
      if (typeof storage4["compact"] === "undefined") storage4["compact"] = compact;
      if (typeof storage4["dark"] === "undefined") storage4["dark"] = dark;
      if (typeof storage4["sessionsFeature"] === "undefined") storage4["sessionsFeature"] = sessionsFeature;
      if (typeof storage4["hideWindows"] === "undefined") storage4["hideWindows"] = hideWindows;
      if (typeof storage4["filter-tabs"] === "undefined") storage4["filter-tabs"] = filterTabs;
      storage4["version"] = window.extensionVersion;
      await browser5.storage.local.set(storage4);
      layout = storage4["layout"];
      tabLimit = storage4["tabLimit"];
      tabWidth = storage4["tabWidth"];
      tabHeight = storage4["tabHeight"];
      openInOwnTab = storage4["openInOwnTab"];
      animations = storage4["animations"];
      windowTitles = storage4["windowTitles"];
      compact = storage4["compact"];
      dark = storage4["dark"];
      tabactions = storage4["tabactions"];
      badge = storage4["badge"];
      sessionsFeature = storage4["sessionsFeature"];
      hideWindows = storage4["hideWindows"];
      filterTabs = storage4["filter-tabs"];
      if (dark) {
        document.body.className = "dark";
      } else {
        document.body.className = "";
      }
      this.setState({
        layout,
        animations,
        windowTitles,
        tabLimit,
        openInOwnTab,
        tabWidth,
        tabHeight,
        compact,
        dark,
        tabactions,
        badge,
        hideWindows,
        sessionsFeature,
        filterTabs
      });
    }
    hoverHandler(tab) {
      this.setState({ topText: tab.title || "" });
      this.setState({ bottomText: tab.url || tab.pendingUrl || "" });
      var _reset_timeout = this.state.resetTimeout;
      clearTimeout2(_reset_timeout);
      _reset_timeout = setTimeout2(
        function() {
          this.setState({ topText: "", bottomText: "" });
          this.update();
        }.bind(this),
        15e3
      );
      this.setState({ resetTimeout: _reset_timeout });
    }
    hoverIcon(e) {
      var text = "";
      if (typeof e === "string") {
        text = e;
      } else {
        if (e && e.nativeEvent) {
          e.nativeEvent.preventDefault();
          e.nativeEvent.stopPropagation();
        }
        if (e && e.target && !!e.target.title) {
          text = e.target.title;
        }
      }
      var bottom = " ";
      if (text.indexOf("\n") > -1) {
        var a = text.split("\n");
        text = a[0];
        bottom = a[1];
      }
      this.setState({ topText: text });
      this.setState({ bottomText: bottom });
      this.forceUpdate();
    }
    render() {
      let _this = this;
      let tabCount = this.state.tabCount;
      let haveMin = false;
      let haveSess = false;
      for (let i = this.state.windows.length - 1; i >= 0; i--) {
        if (this.state.windows[i].state === "minimized") haveMin = true;
      }
      if (this.state.sessionsFeature) {
        if (this.state.sessions.length > 0) haveSess = true;
        if (haveSess && this.state.filterTabs) {
          if (this.state.searchLen > 0 || this.state.hiddenTabs.size > 0) {
            haveSess = false;
          }
        }
      }
      return /* @__PURE__ */ React3.createElement(
        "div",
        {
          id: "root",
          className: (this.state.compact ? "compact" : "") + " " + (this.state.animations ? "animations" : "no-animations") + " " + (this.state.windowTitles ? "windowTitles" : "no-windowTitles"),
          onKeyDown: this.checkKey,
          ref: "root",
          tabIndex: 0
        },
        !this.state.optionsActive && /* @__PURE__ */ React3.createElement("div", { className: "window-container " + this.state.layout, ref: "windowcontainer", tabIndex: 2 }, this.state.windows.map(function(window2) {
          if (window2.state === "minimized") return;
          if (!!this.state.colorsActive && this.state.colorsActive !== window2.id) return;
          return /* @__PURE__ */ React3.createElement(
            Window,
            {
              key: "window" + window2.id,
              window: window2,
              tabs: window2.tabs,
              incognito: window2.incognito,
              layout: _this.state.layout,
              selection: _this.state.selection,
              searchActive: _this.state.searchLen > 0,
              sessionsFeature: _this.state.sessionsFeature,
              tabactions: _this.state.tabactions,
              hiddenTabs: _this.state.hiddenTabs,
              filterTabs: _this.state.filterTabs,
              hoverHandler: _this.hoverHandler.bind(_this),
              scrollTo: _this.scrollTo.bind(_this),
              hoverIcon: _this.hoverIcon.bind(_this),
              parentUpdate: _this.update.bind(_this),
              toggleColors: _this.toggleColors.bind(_this),
              tabMiddleClick: _this.deleteTab.bind(_this),
              select: _this.select.bind(_this),
              selectTo: _this.selectTo.bind(_this),
              draggable: true,
              drag: _this.drag.bind(_this),
              drop: _this.drop.bind(_this),
              dropWindow: _this.dropWindow.bind(_this),
              windowTitles: _this.state.windowTitles,
              lastOpenWindow: _this.state.lastOpenWindow,
              dragFavicon: _this.dragFavicon.bind(_this),
              ref: "window" + window2.id
            }
          );
        }.bind(this)), /* @__PURE__ */ React3.createElement("div", { className: "hrCont " + (!haveMin ? "hidden" : "") }, /* @__PURE__ */ React3.createElement("div", { className: "hrDiv" }, /* @__PURE__ */ React3.createElement("span", { className: "hrSpan" }, "Minimized windows"))), this.state.windows.map(function(window2) {
          if (window2.state !== "minimized") return;
          if (!!this.state.colorsActive && this.state.colorsActive !== window2.id) return;
          return /* @__PURE__ */ React3.createElement(
            Window,
            {
              key: "window" + window2.id,
              window: window2,
              tabs: window2.tabs,
              incognito: window2.incognito,
              layout: _this.state.layout,
              selection: _this.state.selection,
              searchActive: _this.state.searchLen > 0,
              sessionsFeature: _this.state.sessionsFeature,
              tabactions: _this.state.tabactions,
              hiddenTabs: _this.state.hiddenTabs,
              filterTabs: _this.state.filterTabs,
              hoverHandler: _this.hoverHandler.bind(_this),
              scrollTo: _this.scrollTo.bind(_this),
              hoverIcon: _this.hoverIcon.bind(_this),
              parentUpdate: _this.update.bind(_this),
              toggleColors: _this.toggleColors.bind(_this),
              tabMiddleClick: _this.deleteTab.bind(_this),
              select: _this.select.bind(_this),
              selectTo: _this.selectTo.bind(_this),
              draggable: true,
              drag: _this.drag.bind(_this),
              drop: _this.drop.bind(_this),
              dropWindow: _this.dropWindow.bind(_this),
              windowTitles: _this.state.windowTitles,
              lastOpenWindow: _this.state.lastOpenWindow,
              dragFavicon: _this.dragFavicon.bind(_this),
              ref: "window" + window2.id
            }
          );
        }.bind(this)), /* @__PURE__ */ React3.createElement("div", { className: "hrCont " + (!haveSess ? "hidden" : "") }, /* @__PURE__ */ React3.createElement("div", { className: "hrDiv" }, /* @__PURE__ */ React3.createElement("span", { className: "hrSpan" }, "Saved windows"))), haveSess ? this.state.sessions.map(function(window2) {
          if (!!this.state.colorsActive && this.state.colorsActive !== window2.id) return;
          return /* @__PURE__ */ React3.createElement(
            Session,
            {
              key: "session" + window2.id,
              session: window2,
              tabs: window2.tabs,
              incognito: window2.incognito,
              layout: _this.state.layout,
              selection: _this.state.selection,
              searchActive: _this.state.searchLen > 0,
              tabactions: _this.state.tabactions,
              hiddenTabs: _this.state.hiddenTabs,
              filterTabs: _this.state.filterTabs,
              hoverHandler: _this.hoverHandler.bind(_this),
              scrollTo: _this.scrollTo.bind(_this),
              hoverIcon: _this.hoverIcon.bind(_this),
              parentUpdate: _this.update.bind(_this),
              toggleColors: _this.toggleColors.bind(_this),
              tabMiddleClick: _this.deleteTab.bind(_this),
              select: _this.select.bind(_this),
              windowTitles: _this.state.windowTitles,
              lastOpenWindow: _this.state.lastOpenWindow,
              draggable: false,
              ref: "session" + window2.id
            }
          );
        }.bind(this)) : false),
        this.state.optionsActive && /* @__PURE__ */ React3.createElement("div", { className: "options-container", ref: "options-container" }, /* @__PURE__ */ React3.createElement(
          TabOptions,
          {
            compact: this.state.compact,
            dark: this.state.dark,
            animations: this.state.animations,
            windowTitles: this.state.windowTitles,
            tabLimit: this.state.tabLimit,
            openInOwnTab: this.state.openInOwnTab,
            tabWidth: this.state.tabWidth,
            tabHeight: this.state.tabHeight,
            tabactions: this.state.tabactions,
            badge: this.state.badge,
            hideWindows: this.state.hideWindows,
            sessionsFeature: this.state.sessionsFeature,
            exportSessions: this.exportSessions,
            importSessions: this.importSessions,
            toggleOpenInOwnTab: this.toggleOpenInOwnTab,
            toggleBadge: this.toggleBadge,
            toggleHide: this.toggleHide,
            toggleSessions: this.toggleSessions,
            toggleAnimations: this.toggleAnimations,
            toggleWindowTitles: this.toggleWindowTitles,
            toggleCompact: this.toggleCompact,
            toggleDark: this.toggleDark,
            toggleTabActions: this.toggleTabActions,
            changeTabLimit: this.changeTabLimit,
            changeTabWidth: this.changeTabWidth,
            changeTabHeight: this.changeTabHeight,
            openInOwnTabText: this.openInOwnTabText,
            badgeText: this.badgeText,
            hideText: this.hideText,
            sessionsText: this.sessionsText,
            exportSessionsText: this.exportSessionsText,
            importSessionsText: this.importSessionsText,
            animationsText: this.animationsText,
            windowTitlesText: this.windowTitlesText,
            tabLimitText: this.tabLimitText,
            tabWidthText: this.tabWidthText,
            tabHeightText: this.tabHeightText,
            compactText: this.compactText,
            darkText: this.darkText,
            tabActionsText: this.tabActionsText,
            getTip: this.getTip
          }
        )),
        /* @__PURE__ */ React3.createElement("div", { className: "window top", ref: "tophover" }, /* @__PURE__ */ React3.createElement("div", { className: "icon windowaction donate", title: "Donate a Coffee", onClick: this.donate, onMouseEnter: this.hoverIcon }), /* @__PURE__ */ React3.createElement(
          "div",
          {
            className: "icon windowaction rate",
            title: "Rate Tab Manager Plus",
            onClick: this.rateExtension,
            onMouseEnter: this.hoverIcon
          }
        ), /* @__PURE__ */ React3.createElement("div", { className: "icon windowaction options", title: "Options", onClick: this.toggleOptions, onMouseEnter: this.hoverIcon }), /* @__PURE__ */ React3.createElement(
          "input",
          {
            type: "text",
            disabled: true,
            className: "tabtitle",
            ref: "topbox",
            placeholder: maybePluralize(tabCount, "tab") + " in " + maybePluralize(this.state.windows.length, "window"),
            value: this.state.topText
          }
        ), /* @__PURE__ */ React3.createElement("input", { type: "text", disabled: true, className: "taburl", ref: "topboxurl", placeholder: this.getTip(), value: this.state.bottomText })),
        !this.state.optionsActive && !this.state.colorsActive && /* @__PURE__ */ React3.createElement("div", { className: "window searchbox" }, /* @__PURE__ */ React3.createElement("table", null, /* @__PURE__ */ React3.createElement("tbody", null, /* @__PURE__ */ React3.createElement("tr", null, /* @__PURE__ */ React3.createElement("td", { className: "one" }, /* @__PURE__ */ React3.createElement("input", { className: "searchBoxInput", type: "text", placeholder: "Start typing to search tabs...", tabIndex: 1, onChange: this.search, ref: "searchbox" })), /* @__PURE__ */ React3.createElement("td", { className: "two" }, /* @__PURE__ */ React3.createElement(
          "div",
          {
            className: "icon windowaction " + this.state.layout + "-view",
            title: "Change to " + this.readablelayout(this.nextlayout()) + " View",
            onClick: this.changelayout,
            onMouseEnter: this.hoverIcon
          }
        ), /* @__PURE__ */ React3.createElement(
          "div",
          {
            className: "icon windowaction trash",
            title: this.state.selection.size > 0 ? "Close selected tabs\nWill close " + maybePluralize(this.state.selection.size, "tab") : "Close current Tab",
            onClick: this.deleteTabs,
            onMouseEnter: this.hoverIcon
          }
        ), /* @__PURE__ */ React3.createElement(
          "div",
          {
            className: "icon windowaction discard",
            title: this.state.selection.size > 0 ? "Discard selected tabs\nWill discard " + maybePluralize(this.state.selection.size, "tab") + " - freeing memory" : "Select tabs to discard them and free memory",
            style: this.state.selection.size > 0 ? {} : { opacity: 0.25 },
            onClick: this.discardTabs,
            onMouseEnter: this.hoverIcon
          }
        ), /* @__PURE__ */ React3.createElement(
          "div",
          {
            className: "icon windowaction pin",
            title: this.state.selection.size > 0 ? "Pin selected tabs\nWill pin " + maybePluralize(this.state.selection.size, "tab") : "Pin current Tab",
            onClick: this.pinTabs,
            onMouseEnter: this.hoverIcon
          }
        ), /* @__PURE__ */ React3.createElement(
          "div",
          {
            className: "icon windowaction filter" + (this.state.filterTabs ? " enabled" : ""),
            title: (this.state.filterTabs ? "Turn off hiding of" : "Hide") + " tabs that do not match search" + (this.state.searchLen > 0 ? "\n" + (this.state.filterTabs ? "Will reveal " : "Will hide ") + maybePluralize(this.state.tabsbyid.size - this.state.selection.size, "tab") : ""),
            onClick: this.toggleFilterMismatchedTabs,
            onMouseEnter: this.hoverIcon
          }
        ), /* @__PURE__ */ React3.createElement(
          "div",
          {
            className: "icon windowaction new",
            title: this.state.selection.size > 0 ? "Move tabs to new window\nWill move " + maybePluralize(this.state.selection.size, "selected tab") + " to it" : "Open new empty window",
            onClick: this.addWindow,
            onMouseEnter: this.hoverIcon
          }
        ), /* @__PURE__ */ React3.createElement(
          "div",
          {
            className: "icon windowaction duplicates" + (this.state.dupTabs ? " enabled" : ""),
            title: "Highlight Duplicates",
            onClick: this.highlightDuplicates,
            onMouseEnter: this.hoverIcon
          }
        )))))),
        /* @__PURE__ */ React3.createElement("div", { className: "window placeholder" })
      );
    }
    async componentDidMount() {
      await this.loadStorage();
      if (navigator.userAgent.search("Firefox") > -1) {
      } else {
        let result = await browser5.permissions.contains({ permissions: ["system.display"] });
        if (!result) {
          setLocalStorage("hideWindows", false);
          this.setState({
            hideWindows: false
          });
        }
      }
      let _this = this;
      let runUpdate = debounce(this.update, 250);
      runUpdate = runUpdate.bind(this);
      var runTabUpdate = async (tabid, changeinfo, tab) => {
        this.dirtyWindow(tab.windowId);
        if (!!_this.refs["window" + tab.windowId]) {
          var window2 = _this.refs["window" + tab.windowId];
          if (!!window2.refs["tab" + tabid]) {
            var _tabref = window2.refs["tab" + tabid];
            await _tabref.checkSettings();
          }
        }
      };
      browser5.tabs.onCreated.addListener(runUpdate);
      browser5.tabs.onUpdated.addListener(runUpdate);
      browser5.tabs.onUpdated.addListener(runTabUpdate);
      browser5.tabs.onMoved.addListener(runUpdate);
      browser5.tabs.onRemoved.addListener(runUpdate);
      browser5.tabs.onReplaced.addListener(runUpdate);
      browser5.tabs.onDetached.addListener(runUpdate);
      browser5.tabs.onAttached.addListener(runUpdate);
      browser5.tabs.onCreated.addListener(this.onTabCreated);
      browser5.tabs.onDetached.addListener(this.onTabDetached);
      browser5.tabs.onAttached.addListener(this.onTabAttached);
      browser5.tabs.onRemoved.addListener(this.onTabRemoved);
      browser5.tabs.onActivated.addListener(runUpdate);
      browser5.windows.onFocusChanged.addListener(runUpdate);
      browser5.windows.onCreated.addListener(runUpdate);
      browser5.windows.onRemoved.addListener(runUpdate);
      browser5.runtime.onMessage.addListener(async function(message, sender, sendResponse) {
        const request = message;
        console.log(request.command);
        switch (request.command) {
          case refresh_windows:
            let window_ids = request.window_ids;
            for (let window_id of window_ids) {
              if (!_this.refs["window" + window_id]) continue;
              _this.refs["window" + window_id].checkSettings();
            }
            break;
        }
      });
      browser5.storage.onChanged.addListener(this.sessionSync);
      await this.sessionSync();
      this.refs.root.focus();
      this.focusRoot();
      setTimeout2(async function() {
        var scrollArea = document.getElementsByClassName("window-container")[0];
        var activeWindow = document.getElementsByClassName("activeWindow");
        if (!!activeWindow && activeWindow.length > 0) {
          var activeTab = activeWindow[0].getElementsByClassName("highlighted");
          if (!!activeTab && activeTab.length > 0) {
            if (!!scrollArea && scrollArea.scrollTop > 0) {
            } else {
              var animations = await getLocalStorage("animations", false);
              activeTab[0].scrollIntoView({ behavior: animations ? "smooth" : "instant", block: "center", inline: "nearest" });
            }
          }
        }
      }, 250);
    }
    async sessionSync() {
      let values = await getLocalStorage("sessions", {});
      let sessions = [];
      for (let key in values) {
        let sess = values[key];
        if (sess.id && sess.tabs && sess.windowsInfo) {
          sessions.push(sess);
        }
      }
      this.setState({
        sessions
      });
      await this.update();
    }
    focusRoot() {
      this.setState({ focusUpdates: this.state.focusUpdates + 1 });
      setTimeout2(
        function() {
          if (document.activeElement === document.body) {
            this.refs.root.focus();
            this.forceUpdate();
            if (this.state.focusUpdates < 5) this.focusRoot();
          }
        }.bind(this),
        500
      );
    }
    dragFavicon(icon) {
      if (!icon) {
        return this.state.dragFavicon;
      } else {
        this.setState({ dragFavicon: icon });
        return icon;
      }
    }
    rateExtension() {
      if (navigator.userAgent.search("Firefox") > -1) {
        browser5.tabs.create({ url: "https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/" });
      } else {
        browser5.tabs.create({ url: "https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff" });
      }
      this.forceUpdate();
    }
    donate() {
      browser5.tabs.create({ url: "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW" });
      this.forceUpdate();
    }
    toggleOptions() {
      this.setState({ optionsActive: !this.state.optionsActive });
      this.forceUpdate();
    }
    toggleColors(active, windowId) {
      this.setState({
        colorsActive: !!active ? windowId : 0
      });
      console.log("colorsActive", active, windowId, this.state.colorsActive);
      this.forceUpdate();
    }
    onTabCreated(tab) {
      this.dirtyWindow(tab.windowId);
    }
    onTabRemoved(tabId, removeInfo) {
      this.dirtyWindow(removeInfo.windowId);
    }
    onTabDetached(tabId, detachInfo) {
      const windowId = detachInfo.oldWindowId;
      this.dirtyWindow(windowId);
    }
    onTabAttached(tabId, attachInfo) {
      const windowId = attachInfo.newWindowId;
      this.dirtyWindow(windowId);
    }
    dirtyWindow(windowId) {
      const window2 = this.refs["window" + windowId];
      if (!window2) return;
      window2.setState({ dirty: true });
    }
    async update() {
      const windows4 = await browser5.windows.getAll({ populate: true });
      const sort_windows = await getLocalStorage("windowAge", []);
      windows4.sort(function(a, b) {
        var aSort = sort_windows.indexOf(a.id);
        var bSort = sort_windows.indexOf(b.id);
        if (a.state === "minimized" && b.state !== "minimized") return 1;
        if (b.state === "minimized" && a.state !== "minimized") return -1;
        if (aSort < bSort) return -1;
        if (aSort > bSort) return 1;
        return 0;
      });
      this.state.windowsbyid.clear();
      this.state.tabsbyid.clear();
      this.setState({
        lastOpenWindow: windows4[0].id,
        windows: windows4
      });
      let tabCount = 0;
      for (const window2 of windows4) {
        this.state.windowsbyid.set(window2.id, window2);
        for (const tab of window2.tabs) {
          this.state.tabsbyid.set(tab.id, tab);
          tabCount++;
        }
      }
      for (let id of this.state.selection.keys()) {
        if (!this.state.tabsbyid.has(id)) {
          this.state.selection.delete(id);
          this.setState({ lastSelect: id });
        }
      }
      this.setState({
        tabCount
      });
    }
    async deleteTabs() {
      const _this = this;
      const tabs4 = [...this.state.selection.keys()].map(function(id) {
        return _this.state.tabsbyid.get(id);
      });
      if (tabs4.length) {
        browser5.runtime.sendMessage({ command: close_tabs, tabs: tabs4 });
      } else {
        const t = await browser5.tabs.query({ currentWindow: true, active: true });
        if (t && t.length > 0) {
          await browser5.tabs.remove(t[0].id);
        }
      }
      this.forceUpdate();
    }
    deleteTab(tabId) {
      browser5.tabs.remove(tabId);
    }
    async discardTabs() {
      const _this = this;
      const tabs4 = [...this.state.selection.keys()].map(function(id) {
        return _this.state.tabsbyid.get(id);
      });
      if (tabs4.length) {
        browser5.runtime.sendMessage({ command: discard_tabs, tabs: tabs4 });
      }
      this.clearSelection();
    }
    discardTab(tabId) {
      browser5.tabs.discard(tabId);
    }
    async addWindow() {
      const _this = this;
      const count = this.state.selection.size;
      const tabs4 = [...this.state.selection.keys()].map(function(id) {
        return _this.state.tabsbyid.get(id);
      });
      const incognito_tabs = tabs4.filter(function(tab) {
        return tab.incognito;
      });
      const normal_tabs = tabs4.filter(function(tab) {
        return !tab.incognito;
      });
      if (count === 0) {
        await browser5.windows.create({});
      } else if (count === 1) {
        if (navigator.userAgent.search("Firefox") > -1) {
          await browser5.runtime.sendMessage({ command: focus_on_tab_and_window_delayed, tab: tabs4[0] });
        } else {
          await browser5.runtime.sendMessage({ command: focus_on_tab_and_window, tab: tabs4[0] });
        }
      } else {
        if (normal_tabs.length > 0) {
          await browser5.runtime.sendMessage({ command: create_window_with_tabs, tabs: normal_tabs, incognito: false });
        }
        if (incognito_tabs.length > 0) {
          await browser5.runtime.sendMessage({ command: create_window_with_tabs, tabs: incognito_tabs, incognito: true });
        }
      }
      if (!!window.inPopup) window.close();
    }
    async pinTabs() {
      const _this = this;
      const tabs4 = [...this.state.selection.keys()].map(function(id) {
        return _this.state.tabsbyid.get(id);
      }).sort(function(a, b) {
        return a.index - b.index;
      });
      if (tabs4.length) {
        if (tabs4[0].pinned) tabs4.reverse();
        for (let i = 0; i < tabs4.length; i++) {
          await browser5.tabs.update(tabs4[i].id, { pinned: !tabs4[0].pinned });
        }
      } else {
        const t = await browser5.tabs.query({ currentWindow: true, active: true });
        if (t && t.length > 0) {
          await browser5.tabs.update(t[0].id, { pinned: !t[0].pinned });
        }
      }
    }
    highlightDuplicates(e) {
      this.state.selection.clear();
      this.state.hiddenTabs.clear();
      let searchLen = 0;
      const dupTabs = !this.state.dupTabs;
      this.refs.searchbox.value = "";
      if (!dupTabs) {
        this.setState({
          hiddenCount: 0,
          dupTabs,
          searchLen
        });
        this.forceUpdate();
        return;
      }
      let hiddenCount = this.state.hiddenCount || 0;
      const idList = [...this.state.tabsbyid.keys()];
      const dup = [];
      for (const id of idList) {
        var tab = this.state.tabsbyid.get(id);
        for (const id2 of idList) {
          if (id === id2) continue;
          var tab2 = this.state.tabsbyid.get(id2);
          if (tab.url === tab2.url) {
            dup.push(id);
            break;
          }
        }
      }
      for (const dupItem of dup) {
        searchLen++;
        hiddenCount -= this.state.hiddenTabs.has(dupItem) ? 1 : 0;
        this.state.selection.add(dupItem);
        this.state.hiddenTabs.delete(dupItem);
        this.setState({
          lastSelect: dupItem
        });
      }
      for (const tab_id of idList) {
        if (dup.indexOf(tab_id) === -1) {
          hiddenCount += 1 - (this.state.hiddenTabs.has(tab_id) ? 1 : 0);
          this.state.hiddenTabs.add(tab_id);
          this.state.selection.delete(tab_id);
          this.setState({
            lastSelect: tab_id
          });
        }
      }
      if (dup.length === 0) {
        this.setState({
          topText: "No duplicates found",
          bottomText: " "
        });
      } else {
        this.setState({
          topText: "Highlighted " + dup.length + " duplicate tabs",
          bottomText: "Press enter to move them to a new window"
        });
      }
      this.setState({
        hiddenCount
      });
      this.setState({
        searchLen,
        dupTabs
      });
      this.forceUpdate();
    }
    search(e) {
      let hiddenCount = this.state.hiddenCount || 0;
      const searchQuery = e.target.value || "";
      const searchLen = searchQuery.length;
      let searchType = "normal";
      let searchTerms = [];
      if (searchQuery.indexOf(" ") === -1) {
        searchType = "normal";
      } else if (searchQuery.indexOf(" OR ") > -1) {
        searchTerms = searchQuery.split(" OR ");
        searchType = "OR";
      } else if (searchQuery.indexOf(" ") > -1) {
        searchTerms = searchQuery.split(" ");
        searchType = "AND";
      }
      if (searchType !== "normal") {
        searchTerms = searchTerms.filter(function(entry) {
          return entry.trim() !== "";
        });
      }
      if (!searchLen) {
        this.state.selection.clear();
        this.state.hiddenTabs.clear();
        hiddenCount = 0;
      } else {
        let idList;
        const lastSearchLen = this.state.searchLen;
        idList = [...this.state.tabsbyid.keys()];
        if (searchType === "normal") {
          if (!lastSearchLen) {
            idList = [...this.state.tabsbyid.keys()];
          } else if (lastSearchLen > searchLen) {
            idList = [...this.state.hiddenTabs.keys()];
          } else if (lastSearchLen < searchLen) {
            idList = [...this.state.selection.keys()];
          }
        }
        for (const id of idList) {
          const tab = this.state.tabsbyid.get(id);
          let tabSearchTerm;
          if (!!tab.title) tabSearchTerm = tab.title;
          if (!!tab.url) tabSearchTerm += " " + tab.url;
          tabSearchTerm = tabSearchTerm.toLowerCase();
          let match = false;
          if (searchType === "normal") {
            match = tabSearchTerm.indexOf(e.target.value.toLowerCase()) >= 0;
          } else if (searchType === "OR") {
            for (let searchOR of searchTerms) {
              searchOR = searchOR.trim().toLowerCase();
              if (tabSearchTerm.indexOf(searchOR) >= 0) {
                match = true;
                break;
              }
            }
          } else if (searchType === "AND") {
            let andMatch = true;
            for (let searchAND of searchTerms) {
              searchAND = searchAND.trim().toLowerCase();
              if (tabSearchTerm.indexOf(searchAND) >= 0) {
              } else {
                andMatch = false;
                break;
              }
            }
            match = andMatch;
          }
          if (match) {
            hiddenCount -= this.state.hiddenTabs.has(id) ? 1 : 0;
            this.state.selection.add(id);
            this.state.hiddenTabs.delete(id);
          } else {
            hiddenCount += 1 - (this.state.hiddenTabs.has(id) ? 1 : 0);
            this.state.hiddenTabs.add(id);
            this.state.selection.delete(id);
          }
          this.setState({
            lastSelect: id
          });
        }
      }
      this.setState({
        hiddenCount,
        searchLen
      });
      const matches = this.state.selection.size;
      if (matches === 0 && searchLen > 0) {
        this.setState({
          topText: "No matches for '" + searchQuery + "'",
          bottomText: ""
        });
      } else if (matches === 0) {
        this.setState({
          topText: "",
          bottomText: ""
        });
      } else if (matches > 1) {
        this.setState({
          topText: this.state.selection.size + " matches for '" + searchQuery + "'",
          bottomText: "Press enter to move them to a new window"
        });
      } else if (matches === 1) {
        this.setState({
          topText: this.state.selection.size + " match for '" + searchQuery + "'",
          bottomText: "Press enter to switch to the tab"
        });
      }
      this.forceUpdate();
    }
    clearSelection() {
      this.state.selection.clear();
      this.setState({
        lastSelect: 0
      });
    }
    checkKey(e) {
      var _a, _b;
      if (e.keyCode === 13) this.addWindow();
      if (e.keyCode === 27) {
        if (this.state.searchLen > 0 || this.state.selection.size > 0) {
          e.nativeEvent.preventDefault();
          e.nativeEvent.stopPropagation();
        }
        this.state.hiddenTabs.clear();
        this.setState({
          searchLen: 0
        });
        this.refs.searchbox.value = "";
        this.clearSelection();
      }
      if (e.keyCode >= 48 && e.keyCode <= 57 || e.keyCode >= 65 && e.keyCode <= 90 || e.keyCode >= 186 && e.keyCode <= 192 || e.keyCode >= 219 && e.keyCode <= 22 || e.keyCode === 8 || e.keyCode === 46 || e.keyCode === 32) {
        if (document.activeElement !== this.refs.searchbox) {
          var activeInputElement = document.activeElement;
          console.log(activeInputElement);
          console.log(this.refs.searchbox);
          if (activeInputElement.type !== "text" && activeInputElement.type !== "input") {
            (_a = this.refs.searchbox) == null ? void 0 : _a.focus();
          }
        }
      }
      if (e.keyCode >= 37 && e.keyCode <= 40) {
        if (document.activeElement !== this.refs.windowcontainer && document.activeElement !== this.refs.searchbox) {
          console.log(activeInputElement);
          console.log(this.refs.windowcontainer);
          (_b = this.refs.windowcontainer) == null ? void 0 : _b.focus();
        }
        if (document.activeElement !== this.refs.searchbox || !this.refs.searchbox.value) {
          let goLeft = e.keyCode === 37;
          let goRight = e.keyCode === 39;
          let goUp = e.keyCode === 38;
          let goDown = e.keyCode === 40;
          if (this.state.layout === "vertical") {
            goLeft = e.keyCode === 38;
            goRight = e.keyCode === 40;
            goUp = e.keyCode === 37;
            goDown = e.keyCode === 39;
          }
          if (goLeft || goRight || goUp || goDown) {
            e.nativeEvent.preventDefault();
            e.nativeEvent.stopPropagation();
          }
          const altKey = e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey;
          if (goLeft || goRight) {
            let selectedTabs = [...this.state.selection.keys()];
            if (!altKey && selectedTabs.length > 1) {
            } else {
              let found = false;
              let selectedNext = false;
              let selectedTab = 0;
              let first = 0;
              let prev = 0;
              let last = 0;
              if (selectedTabs.length === 1) {
                selectedTab = selectedTabs[0];
              } else if (selectedTabs.length > 1) {
                if (!!this.state.lastSelect) {
                  selectedTab = this.state.lastSelect;
                } else {
                  selectedTab = selectedTabs[0];
                }
              } else if (selectedTabs.length === 0 && !!this.state.lastSelect) {
                selectedTab = this.state.lastSelect;
              }
              if (!!this.state.lastDirection) {
                if (goRight && this.state.lastDirection === "goRight") {
                } else if (goLeft && this.state.lastDirection === "goLeft") {
                } else if (selectedTabs.length > 1) {
                  this.select(this.state.lastSelect);
                  this.setState({
                    lastDirection: ""
                  });
                  found = true;
                } else {
                  this.setState({
                    lastDirection: ""
                  });
                }
              }
              if (!this.state.lastDirection) {
                if (goRight) this.setState({ lastDirection: "goRight" });
                if (goLeft) this.setState({ lastDirection: "goLeft" });
              }
              for (const _w of this.state.windows) {
                if (found) break;
                if (_w.state !== "minimized") {
                  for (const _t of _w.tabs) {
                    last = _t.id;
                    if (!first) first = _t.id;
                    if (!selectedTab) {
                      if (!altKey) this.state.selection.clear();
                      this.select(_t.id);
                      found = true;
                      break;
                    } else if (selectedTab === _t.id) {
                      if (goRight) {
                        selectedNext = true;
                      } else if (!!prev) {
                        if (!altKey) this.state.selection.clear();
                        this.select(prev);
                        found = true;
                        break;
                      }
                    } else if (selectedNext) {
                      if (!altKey) this.state.selection.clear();
                      this.select(_t.id);
                      found = true;
                      break;
                    }
                    prev = _t.id;
                  }
                }
              }
              for (const _w of this.state.windows) {
                if (found) break;
                if (_w.state === "minimized") {
                  for (const _t of _w.tabs) {
                    last = _t.id;
                    if (!first) first = _t.id;
                    if (!selectedTab) {
                      if (!altKey) this.state.selection.clear();
                      this.select(_t.id);
                      found = true;
                      break;
                    } else if (selectedTab === _t.id) {
                      if (goRight) {
                        selectedNext = true;
                      } else if (!!prev) {
                        if (!altKey) this.state.selection.clear();
                        this.select(prev);
                        found = true;
                        break;
                      }
                    } else if (selectedNext) {
                      if (!altKey) this.state.selection.clear();
                      this.select(_t.id);
                      found = true;
                      break;
                    }
                    prev = _t.id;
                  }
                }
              }
              if (!found && goRight && !!first) {
                if (!altKey) this.state.selection.clear();
                this.select(first);
                found = true;
              }
              if (!found && goLeft && !!last) {
                if (!altKey) this.state.selection.clear();
                this.select(last);
                found = true;
              }
            }
          }
          if (goUp || goDown) {
            let selectedTabs = [...this.state.selection.keys()];
            if (selectedTabs.length > 1) {
            } else {
              let found = false;
              let selectedNext = false;
              let selectedTab = -1;
              let first = 0;
              let prev = 0;
              let last = 0;
              let tabPosition = -1;
              let i = -1;
              if (selectedTabs.length === 1) {
                selectedTab = selectedTabs[0];
              }
              for (const _w of this.state.windows) {
                i = 0;
                if (found) break;
                if (_w.state !== "minimized") {
                  if (!first) first = _w.id;
                  for (const _t of _w.tabs) {
                    i++;
                    last = _w.id;
                    if (!selectedTab) {
                      this.selectWindowTab(_w.id, tabPosition);
                      found = true;
                      break;
                    } else if (selectedTab === _t.id) {
                      tabPosition = i;
                      if (goDown) {
                        selectedNext = true;
                        break;
                      } else if (!!prev) {
                        this.selectWindowTab(prev, tabPosition);
                        found = true;
                        break;
                      }
                    } else if (selectedNext) {
                      this.selectWindowTab(_w.id, tabPosition);
                      found = true;
                      break;
                    }
                  }
                  prev = _w.id;
                }
              }
              for (const _w of this.state.windows) {
                i = 0;
                if (found) break;
                if (_w.state === "minimized") {
                  if (!first) first = _w.id;
                  for (const _t of _w.tabs) {
                    i++;
                    last = _w.id;
                    if (!selectedTab) {
                      this.selectWindowTab(_w.id, tabPosition);
                      found = true;
                      break;
                    } else if (selectedTab === _t.id) {
                      tabPosition = i;
                      if (goDown) {
                        selectedNext = true;
                        break;
                      } else if (!!prev) {
                        this.selectWindowTab(prev, tabPosition);
                        found = true;
                        break;
                      }
                    } else if (selectedNext) {
                      this.selectWindowTab(_w.id, tabPosition);
                      found = true;
                      break;
                    }
                  }
                  prev = _w.id;
                }
              }
              if (!found && goDown && !!first) {
                this.state.selection.clear();
                this.selectWindowTab(first, tabPosition);
                found = true;
              }
              if (!found && goUp && !!last) {
                this.state.selection.clear();
                this.selectWindowTab(last, tabPosition);
                found = true;
              }
            }
          }
        }
      }
      if (e.keyCode === 33 || e.keyCode === 34) {
        if (document.activeElement != this.refs.windowcontainer) {
          this.refs.windowcontainer.focus();
        }
      }
    }
    selectWindowTab(windowId, tabPosition) {
      if (!tabPosition || tabPosition < 1) tabPosition = 1;
      for (let _w of this.state.windows) {
        if (_w.id !== windowId) continue;
        let i = 0;
        for (let _t of _w.tabs) {
          i++;
          if (_w.tabs.length >= tabPosition && tabPosition === i || _w.tabs.length < tabPosition && _w.tabs.length === i) {
            this.state.selection.clear();
            this.select(_t.id);
          }
        }
      }
    }
    scrollTo(what, id) {
      var els = document.getElementById(what + "-" + id);
      if (!!els) {
        if (!this.elVisible(els)) {
          els.scrollIntoView({ behavior: this.state.animations ? "smooth" : "instant", block: "center", inline: "nearest" });
        }
      }
    }
    async changelayout(layout) {
      var newLayout;
      if (layout && typeof layout === "string") {
        newLayout = layout;
      } else {
        newLayout = this.nextlayout();
      }
      await setLocalStorage("layout", newLayout);
      this.setState({
        layout: newLayout,
        topText: "Switched to " + this.readablelayout(this.state.layout) + " view",
        bottomText: " "
      });
      this.forceUpdate();
    }
    nextlayout() {
      switch (this.state.layout) {
        case "blocks":
          return "blocks-big";
        case "blocks-big":
          return "horizontal";
        case "horizontal":
          return "vertical";
        default:
          return "blocks";
      }
    }
    readablelayout(layout) {
      switch (layout) {
        case "blocks":
          return "Block";
        case "blocks-big":
          return "Big Block";
        case "horizontal":
          return "Horizontal";
        default:
          return "Vertical";
      }
    }
    select(id) {
      if (this.state.selection.has(id)) {
        this.state.selection.delete(id);
        this.setState({
          lastSelect: id
        });
      } else {
        this.state.selection.add(id);
        this.setState({
          lastSelect: id
        });
      }
      this.scrollTo("tab", id);
      var tab = this.state.tabsbyid.get(id);
      if (!!this.refs["window" + tab.windowId] && !!this.refs["window" + tab.windowId].refs["tab" + id]) {
        this.refs["window" + tab.windowId].refs["tab" + id].resolveFavIconUrl();
      }
      console.log(this.state.selection);
      var selected = this.state.selection.size;
      if (selected === 0) {
        this.setState({
          topText: "No tabs selected",
          bottomText: " "
        });
      } else if (selected === 1) {
        this.setState({
          topText: "Selected " + selected + " tab",
          bottomText: "Press enter to switch to it"
        });
      } else {
        this.setState({
          topText: "Selected " + selected + " tabs",
          bottomText: "Press enter to move them to a new window"
        });
      }
    }
    selectTo(id, tabs4) {
      let activate = false;
      const lastSelect = this.state.lastSelect;
      if (id === lastSelect) {
        this.select(id);
        return;
      }
      if (!!lastSelect) {
        if (this.state.selection.has(lastSelect)) {
          activate = true;
        }
      } else {
        if (this.state.selection.has(id)) {
          activate = false;
        } else {
          activate = true;
        }
      }
      let rangeIndex1;
      let rangeIndex2;
      for (let i = 0; i < tabs4.length; i++) {
        if (tabs4[i].id === id) {
          rangeIndex1 = i;
        }
        if (!!lastSelect && tabs4[i].id === lastSelect) {
          rangeIndex2 = i;
        }
      }
      if (!!lastSelect && !rangeIndex2) {
        this.select(id);
        return;
      }
      if (!rangeIndex2) {
        const neighbours = [];
        for (let i = 0; i < tabs4.length; i++) {
          const tabId = tabs4[i].id;
          if (tabId !== id) {
            if (this.state.selection.has(tabId)) {
              neighbours.push(tabId);
            }
          }
        }
        if (activate) {
          let leftSibling = 0;
          let rightSibling = tabs4.length - 1;
          for (let i = 0; i < rangeIndex1; i++) {
            if (neighbours.indexOf(i) > -1) {
              leftSibling = i;
            }
          }
          for (let i = tabs4.length - 1; i > rangeIndex1; i--) {
            if (neighbours.indexOf(i) > -1) {
              rightSibling = i;
            }
          }
          let diff1 = rangeIndex1 - leftSibling;
          let diff2 = rightSibling - rangeIndex1;
          if (diff1 > diff2) {
            rangeIndex2 = rightSibling;
          } else {
            rangeIndex2 = leftSibling;
          }
        } else {
          let leftSibling = rangeIndex1;
          let rightSibling = rangeIndex1;
          for (let i = rangeIndex1; i > 0; i--) {
            if (neighbours.indexOf(i) > -1) {
              leftSibling = i;
            }
          }
          for (let i = rangeIndex1; i < tabs4.length; i++) {
            if (neighbours.indexOf(i) > -1) {
              rightSibling = i;
            }
          }
          let diff1 = rangeIndex1 - leftSibling;
          let diff2 = rightSibling - rangeIndex1;
          if (diff1 > diff2) {
            rangeIndex2 = leftSibling;
          } else {
            rangeIndex2 = rightSibling;
          }
        }
      }
      this.setState({
        lastSelect: tabs4[rangeIndex2].id
      });
      if (rangeIndex2 < rangeIndex1) {
        let r1 = rangeIndex2;
        let r2 = rangeIndex1;
        rangeIndex1 = r1;
        rangeIndex2 = r2;
      }
      for (let i = 0; i < tabs4.length; i++) {
        if (i >= rangeIndex1 && i <= rangeIndex2) {
          const _tab_id = tabs4[i].id;
          if (activate) {
            this.state.selection.add(_tab_id);
          } else {
            this.state.selection.delete(_tab_id);
          }
        }
      }
      this.scrollTo("tab", this.state.lastSelect);
      const selected = this.state.selection.size;
      if (selected === 0) {
        this.setState({
          topText: "No tabs selected",
          bottomText: " "
        });
      } else if (selected === 1) {
        this.setState({
          topText: "Selected " + selected + " tab",
          bottomText: "Press enter to switch to it"
        });
      } else {
        this.setState({
          topText: "Selected " + selected + " tabs",
          bottomText: "Press enter to move them to a new window"
        });
      }
      this.forceUpdate();
    }
    drag(e, id) {
      if (!this.state.selection.has(id)) {
        this.state.selection.add(id);
        this.setState({
          lastSelect: id
        });
      }
      this.forceUpdate();
    }
    async drop(id, before) {
      var _this = this;
      var tab = this.state.tabsbyid.get(id);
      var tabs4 = [...this.state.selection.keys()].map(function(id2) {
        return _this.state.tabsbyid.get(id2);
      });
      var index = tab.index + (before ? 0 : 1);
      for (let i = 0; i < tabs4.length; i++) {
        const t = tabs4[i];
        await browser5.tabs.move(t.id, { windowId: tab.windowId, index });
        await browser5.tabs.update(t.id, { pinned: t.pinned });
      }
      this.state.selection.clear();
      this.update();
    }
    async dropWindow(windowId) {
      var _this = this;
      var tabs4 = [...this.state.selection.keys()].map(function(id) {
        return _this.state.tabsbyid.get(id);
      });
      browser5.runtime.sendMessage({ command: move_tabs_to_window, window_id: windowId, tabs: tabs4 });
      this.state.selection.clear();
    }
    async changeTabLimit(e) {
      var _tab_limit = parseInt(e.target.value);
      this.setState({
        tabLimit: _tab_limit
      });
      await setLocalStorage("tabLimit", _tab_limit);
      this.tabLimitText();
      this.forceUpdate();
    }
    tabLimitText() {
      this.setState({
        bottomText: "Limit the number of tabs per window. Will move new tabs into a new window instead. 0 to turn off"
      });
    }
    async changeTabWidth(e) {
      var _tab_width = parseInt(e.target.value);
      this.setState({
        tabWidth: _tab_width
      });
      await setLocalStorage("tabWidth", _tab_width);
      document.body.style.width = _tab_width + "px";
      this.tabWidthText();
      this.forceUpdate();
    }
    tabWidthText() {
      this.setState({
        bottomText: "Change the width of this window. 800 by default."
      });
    }
    async changeTabHeight(e) {
      var _tab_height = parseInt(e.target.value);
      this.setState({
        tabHeight: _tab_height
      });
      await setLocalStorage("tabHeight", _tab_height);
      document.body.style.height = _tab_height + "px";
      this.tabHeightText();
      this.forceUpdate();
    }
    tabHeightText() {
      this.setState({
        bottomText: "Change the height of this window. 600 by default."
      });
    }
    async toggleAnimations() {
      var _animations = !this.state.animations;
      this.setState({ animations: _animations });
      await setLocalStorage("animations", _animations);
      this.animationsText();
      this.forceUpdate();
    }
    animationsText() {
      this.setState({
        bottomText: "Enables/disables animations. Default : on"
      });
    }
    async toggleWindowTitles() {
      var _window_titles = !this.state.windowTitles;
      this.setState({ windowTitles: _window_titles });
      await setLocalStorage("windowTitles", _window_titles);
      this.windowTitlesText();
      this.forceUpdate();
    }
    windowTitlesText() {
      this.setState({
        bottomText: "Enables/disables window titles. Default : on"
      });
    }
    async toggleCompact() {
      var _compact = !this.state.compact;
      this.setState({ compact: _compact });
      await setLocalStorage("compact", _compact);
      this.compactText();
      this.forceUpdate();
    }
    compactText() {
      this.setState({
        bottomText: "Compact mode is a more compressed layout. Default : off"
      });
    }
    async toggleDark() {
      var _dark = !this.state.dark;
      this.setState({ dark: _dark });
      await setLocalStorage("dark", _dark);
      this.darkText();
      if (_dark) {
        document.body.className = "dark";
        document.documentElement.className = "dark";
      } else {
        document.body.className = "";
        document.documentElement.className = "";
      }
      this.forceUpdate();
    }
    darkText() {
      this.setState({
        bottomText: "Dark mode inverts the layout - better on the eyes. Default : off"
      });
    }
    async toggleTabActions() {
      var _tabactions = !this.state.tabactions;
      this.setState({ tabactions: _tabactions });
      await setLocalStorage("tabactions", _tabactions);
      this.tabActionsText();
      this.forceUpdate();
    }
    tabActionsText() {
      this.setState({
        bottomText: "Adds 'Open a new tab' and 'Close this window' option to each window. Default : on"
      });
    }
    async toggleBadge() {
      var _badge = !this.state.badge;
      this.setState({ badge: _badge });
      await setLocalStorage("badge", _badge);
      this.badgeText();
      browser5.runtime.sendMessage({ command: update_tab_count });
      this.forceUpdate();
    }
    badgeText() {
      this.setState({
        bottomText: "Shows the number of open tabs on the Tab Manager icon. Default : on"
      });
    }
    async toggleOpenInOwnTab() {
      var _openInOwnTab = !this.state.openInOwnTab;
      this.setState({ openInOwnTab: _openInOwnTab });
      await setLocalStorage("openInOwnTab", _openInOwnTab);
      this.openInOwnTabText();
      browser5.runtime.sendMessage({ command: reload_popup_controls });
      this.forceUpdate();
    }
    openInOwnTabText() {
      this.setState({
        bottomText: "Open the Tab Manager by default in own tab, or as a popup?"
      });
    }
    async toggleSessions() {
      var _sessionsFeature = !this.state.sessionsFeature;
      this.setState({ sessionsFeature: _sessionsFeature });
      await setLocalStorage("sessionsFeature", _sessionsFeature);
      this.sessionsText();
      this.forceUpdate();
    }
    sessionsText() {
      this.setState({
        bottomText: "Allows you to save/restore windows into sessions. ( Tab History will be lost ) Default : off"
      });
    }
    exportSessions() {
      if (this.state.sessions.length === 0) {
        window.alert("You have currently no windows saved for later. There is nothing to export.");
        return;
      }
      var exportName = "tab-manager-plus-backup";
      var today = /* @__PURE__ */ new Date();
      var y = today.getFullYear();
      var m = ("0" + (today.getMonth() + 1)).slice(-2);
      var d = ("0" + today.getDate()).slice(-2);
      var h = ("0" + today.getHours()).slice(-2);
      var mi = ("0" + today.getMinutes()).slice(-2);
      var s = ("0" + today.getSeconds()).slice(-2);
      exportName += "-" + y + m + d + "-" + h + mi + "-" + s;
      var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state.sessions, null, 2));
      var downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", exportName + ".json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      this.exportSessionsText();
      this.forceUpdate();
    }
    exportSessionsText() {
      this.setState({
        bottomText: "Allows you to export your saved windows to an external backup"
      });
    }
    importSessions(evt) {
      if (navigator.userAgent.search("Firefox") > -1) {
        if (window.inPopup) {
          window.alert("Due to a Firefox bug session import does not work in the popup. Please use the options screen or open Tab Manager Plus in its' own tab");
          return;
        }
      }
      try {
        let inputField = evt.target;
        let files = evt.target.files;
        if (!files.length) {
          alert("No file selected!");
          this.setState({ bottomText: "Error: Could not read the backup file!" });
          return;
        }
        let file = files[0];
        let reader = new FileReader();
        reader.onload = async (event) => {
          var backupFile;
          try {
            backupFile = JSON.parse(event.target.result.toString());
          } catch (err) {
            console.error(err);
            window.alert(err);
            this.setState({ bottomText: "Error: Could not read the backup file!" });
          }
          if (!!backupFile && backupFile.length > 0) {
            var success = backupFile.length;
            for (let i = 0; i < backupFile.length; i++) {
              var newSession = backupFile[i];
              if (newSession.windowsInfo && newSession.tabs && newSession.id) {
                let sessions = await getLocalStorage("sessions", {});
                sessions[newSession.id] = newSession;
                await setLocalStorage("sessions", sessions).catch(function(err) {
                  console.log(err);
                  console.error(err.message);
                  success--;
                });
              }
            }
            this.setState({ bottomText: success + " windows successfully restored!" });
          } else {
            this.setState({ bottomText: "Error: Could not restore any windows from the backup file!" });
          }
          inputField.value = "";
          this.sessionSync();
        };
        reader.readAsText(file);
      } catch (err) {
        console.error(err);
        window.alert(err);
      }
      this.importSessionsText();
      this.forceUpdate();
    }
    importSessionsText() {
      this.setState({
        bottomText: "Allows you to restore your saved windows from an external backup"
      });
    }
    async toggleHide() {
      var _hide_windows = this.state.hideWindows;
      if (navigator.userAgent.search("Firefox") > -1) {
        _hide_windows = false;
      } else {
        var granted = await chrome.permissions.request({ permissions: ["system.display"] });
        if (granted) {
          _hide_windows = !_hide_windows;
        } else {
          _hide_windows = false;
        }
      }
      await setLocalStorage("hideWindows", _hide_windows);
      this.setState({
        hideWindows: _hide_windows
      });
      this.hideText();
      this.forceUpdate();
    }
    hideText() {
      this.setState({
        bottomText: "Automatically minimizes inactive chrome windows. Default : off"
      });
    }
    async toggleFilterMismatchedTabs() {
      var _filter_tabs = !this.state.filterTabs;
      this.setState({
        filterTabs: _filter_tabs
      });
      await setLocalStorage("filter-tabs", _filter_tabs);
      this.forceUpdate();
    }
    getTip() {
      var tips = [
        "You can right click on a tab to select it",
        "Press enter to move all selected tabs to a new window",
        "Middle click to close a tab",
        "Tab Manager Plus loves saving time",
        "To see incognito tabs, enable incognito access in the extension settings",
        "You can drag and drop tabs to other windows",
        "You can type to search right away",
        "You can search for different tabs : google OR yahoo"
      ];
      return "Tip: " + tips[Math.floor(Math.random() * tips.length)];
    }
    elVisible(elem) {
      if (!(elem instanceof Element)) throw Error("DomUtil: elem is not an element.");
      var style = getComputedStyle(elem);
      if (style.display === "none") return false;
      if (style.visibility !== "visible") return false;
      let _opacity = parseFloat(style.opacity);
      if (_opacity < 0.1) return false;
      if (elem.offsetWidth + elem.offsetHeight + elem.getBoundingClientRect().height + elem.getBoundingClientRect().width === 0) {
        return false;
      }
      var elemCenter = {
        x: elem.getBoundingClientRect().left + elem.offsetWidth / 2,
        y: elem.getBoundingClientRect().top + elem.offsetHeight / 2
      };
      if (elemCenter.x < 0) return false;
      if (elemCenter.x > (document.documentElement.clientWidth || window.innerWidth)) return false;
      if (elemCenter.y < 0) return false;
      if (elemCenter.y > (document.documentElement.clientHeight || window.innerHeight)) return false;
      var pointContainer = document.elementFromPoint(elemCenter.x, elemCenter.y);
      do {
        if (pointContainer === elem) return true;
      } while (pointContainer = pointContainer.parentNode);
      return false;
    }
  };

  // src/popup/views/TabOptions.tsx
  var React4 = __toESM(require_react());
  var browser6 = __toESM(require_browser_polyfill());
  var TabOptions = class extends React4.Component {
    constructor(props) {
      super(props);
      this.state = {};
    }
    logo() {
      return /* @__PURE__ */ React4.createElement("div", { className: "logo-options", key: "logo" }, /* @__PURE__ */ React4.createElement("div", { className: "logo-box" }, /* @__PURE__ */ React4.createElement("img", { src: "images/browsers.svg", style: { maxWidth: "3rem" }, alt: "Tab Manager Plus" }), /* @__PURE__ */ React4.createElement("h2", { key: "title" }, "Tab Manager Plus ", window.extensionVersion)));
    }
    optionsSection() {
      return /* @__PURE__ */ React4.createElement("div", { className: "toggle-options", key: "options" }, /* @__PURE__ */ React4.createElement("div", { className: "optionsBox" }, /* @__PURE__ */ React4.createElement("h4", null, "Tab options"), /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement(
        "input",
        {
          type: "number",
          onMouseEnter: this.props.tabLimitText,
          onChange: this.props.changeTabLimit,
          value: this.props.tabLimit,
          id: "enable_tabLimit",
          name: "enable_tabLimit"
        }
      ), /* @__PURE__ */ React4.createElement("label", { onMouseEnter: this.props.tabLimitText, htmlFor: "enable_tabLimit", style: { whiteSpace: "pre", lineHeight: "2rem" } }), /* @__PURE__ */ React4.createElement("label", { className: "textlabel", htmlFor: "enable_tabLimit", style: { textAlign: "", whiteSpace: "pre", lineHeight: "2rem" } }, "Limit Tabs Per Window"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "Once you reach this number of tabs, Tab Manager will move new tabs to a new window instead. No more windows with 60 tabs open!", /* @__PURE__ */ React4.createElement("br", null), /* @__PURE__ */ React4.createElement("i", null, "By default: 0 ( disabled )"), /* @__PURE__ */ React4.createElement("br", null), /* @__PURE__ */ React4.createElement("i", null, "Suggested value: 15")))), /* @__PURE__ */ React4.createElement("div", { className: "optionsBox" }, /* @__PURE__ */ React4.createElement("h4", null, "Popup size"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "You can resize the popup here up to a maximum size of 800x600. This limitation is a browser limitation, and we cannot display a bigger popup due to this. If you want to have a better overview, instead you can right click on the Tab Manager Plus icon, and `open in own tab`. This will open the Tab Manager in a new tab."), /* @__PURE__ */ React4.createElement("div", { className: "toggle-box half-size float-right" }, /* @__PURE__ */ React4.createElement("label", { className: "textlabel", htmlFor: "enable_tabWidth", style: { textAlign: "", whiteSpace: "pre", lineHeight: "2rem" } }, "Popup Width"), /* @__PURE__ */ React4.createElement(
        "input",
        {
          type: "number",
          min: "450",
          max: "800",
          step: "25",
          onMouseEnter: this.props.tabWidthText,
          onChange: this.props.changeTabWidth,
          value: this.props.tabWidth,
          id: "enable_tabWidth",
          name: "enable_tabWidth"
        }
      ), /* @__PURE__ */ React4.createElement("label", { onMouseEnter: this.props.tabWidthText, htmlFor: "enable_tabWidth", style: { whiteSpace: "pre", lineHeight: "2rem" } })), /* @__PURE__ */ React4.createElement("div", { className: "toggle-box half-size" }, /* @__PURE__ */ React4.createElement("label", { className: "textlabel", htmlFor: "enable_tabHeight", style: { textAlign: "", whiteSpace: "pre", lineHeight: "2rem" } }, "Popup Height"), /* @__PURE__ */ React4.createElement(
        "input",
        {
          type: "number",
          min: "400",
          max: "600",
          step: "25",
          onMouseEnter: this.props.tabHeightText,
          onChange: this.props.changeTabHeight,
          value: this.props.tabHeight,
          id: "enable_tabHeight",
          name: "enable_tabHeight"
        }
      ), /* @__PURE__ */ React4.createElement("label", { onMouseEnter: this.props.tabHeightText, htmlFor: "enable_tabHeight", style: { whiteSpace: "pre", lineHeight: "2rem" } }))), /* @__PURE__ */ React4.createElement("div", { className: "optionsBox" }, /* @__PURE__ */ React4.createElement("h4", null, "Window style"), /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("div", { className: "toggle" }, /* @__PURE__ */ React4.createElement(
        "input",
        {
          type: "checkbox",
          onMouseEnter: this.props.darkText,
          onChange: this.props.toggleDark,
          checked: this.props.dark,
          id: "dark_mode",
          name: "dark_mode"
        }
      ), /* @__PURE__ */ React4.createElement("label", { onMouseEnter: this.props.darkText, htmlFor: "dark_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } })), /* @__PURE__ */ React4.createElement("label", { className: "textlabel", htmlFor: "dark_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Dark mode"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "Dark mode, for working at night time. ", /* @__PURE__ */ React4.createElement("br", null), /* @__PURE__ */ React4.createElement("i", null, "By default: disabled"))), /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("div", { className: "toggle" }, /* @__PURE__ */ React4.createElement(
        "input",
        {
          type: "checkbox",
          onMouseEnter: this.props.compactText,
          onChange: this.props.toggleCompact,
          checked: this.props.compact,
          id: "compact_mode",
          name: "compact_mode"
        }
      ), /* @__PURE__ */ React4.createElement("label", { onMouseEnter: this.props.compactText, htmlFor: "compact_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } })), /* @__PURE__ */ React4.createElement("label", { className: "textlabel", htmlFor: "compact_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Compact mode"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "Saves a little bit of space around the icons. Makes it less beautiful, but more space efficient. ", /* @__PURE__ */ React4.createElement("br", null), /* @__PURE__ */ React4.createElement("i", null, "By default: disabled"))), /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("div", { className: "toggle" }, /* @__PURE__ */ React4.createElement(
        "input",
        {
          type: "checkbox",
          onMouseEnter: this.props.animationsText,
          onChange: this.props.toggleAnimations,
          checked: this.props.animations,
          id: "enable_animations",
          name: "enable_animations"
        }
      ), /* @__PURE__ */ React4.createElement("label", { onMouseEnter: this.props.animationsText, htmlFor: "enable_animations", style: { whiteSpace: "pre", lineHeight: "2rem" } })), /* @__PURE__ */ React4.createElement("label", { className: "textlabel", htmlFor: "enable_animations", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Animations"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "Disables/enables animations and transitions in the popup. ", /* @__PURE__ */ React4.createElement("br", null), /* @__PURE__ */ React4.createElement("i", null, "By default: enabled"))), /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("div", { className: "toggle" }, /* @__PURE__ */ React4.createElement(
        "input",
        {
          type: "checkbox",
          onMouseEnter: this.props.windowTitlesText,
          onChange: this.props.toggleWindowTitles,
          checked: this.props.windowTitles,
          id: "enable_windowTitles",
          name: "enable_windowTitles"
        }
      ), /* @__PURE__ */ React4.createElement("label", { onMouseEnter: this.props.windowTitlesText, htmlFor: "enable_windowTitles", style: { whiteSpace: "pre", lineHeight: "2rem" } })), /* @__PURE__ */ React4.createElement("label", { className: "textlabel", htmlFor: "enable_windowTitles", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Window titles"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "Disables/enables window titles. ", /* @__PURE__ */ React4.createElement("br", null), /* @__PURE__ */ React4.createElement("i", null, "By default: enabled")))), /* @__PURE__ */ React4.createElement("div", { className: "optionsBox" }, /* @__PURE__ */ React4.createElement("h4", null, "Session Management"), /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("div", { className: "toggle" }, /* @__PURE__ */ React4.createElement(
        "input",
        {
          type: "checkbox",
          onMouseEnter: this.props.sessionsText,
          onChange: this.props.toggleSessions,
          checked: this.props.sessionsFeature,
          id: "session_mode",
          name: "session_mode"
        }
      ), /* @__PURE__ */ React4.createElement("label", { onMouseEnter: this.props.sessionsText, htmlFor: "session_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } })), /* @__PURE__ */ React4.createElement("label", { className: "textlabel", htmlFor: "session_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Save Windows for Later"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "Allows you to save windows as sessions ( saved windows ). You can restore these saved windows later on. The restored windows won't have the history restored. This feature is currently in beta.", /* @__PURE__ */ React4.createElement("br", null), /* @__PURE__ */ React4.createElement("i", null, "By default: disabled ( experimental feature )"))), this.props.sessionsFeature && /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("label", { className: "textlabel", htmlFor: "session_export", style: { whiteSpace: "pre", lineHeight: "2rem" } }, /* @__PURE__ */ React4.createElement("h4", null, "Export/Backup Sessions")), /* @__PURE__ */ React4.createElement("button", { type: "button", onMouseEnter: this.props.exportSessionsText, onClick: this.props.exportSessions, id: "session_export", name: "session_export" }, "Export/Backup Sessions"), /* @__PURE__ */ React4.createElement("label", { onMouseEnter: this.props.exportSessionsText, htmlFor: "session_export", style: { whiteSpace: "pre", lineHeight: "2rem" } })), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "Allows you to backup your saved windows to an external file.")), this.props.sessionsFeature && /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("label", { className: "textlabel", htmlFor: "session_import", style: { whiteSpace: "pre", lineHeight: "2rem" } }, /* @__PURE__ */ React4.createElement("h4", null, "Import/Restore Sessions")), /* @__PURE__ */ React4.createElement(
        "input",
        {
          type: "file",
          accept: "application/json",
          onMouseEnter: this.props.importSessionsText,
          onChange: this.props.importSessions,
          id: "session_import",
          name: "session_import",
          placeholder: "Import/Restore Sessions"
        }
      ), /* @__PURE__ */ React4.createElement("label", { onMouseEnter: this.props.importSessionsText, htmlFor: "session_import", style: { whiteSpace: "pre", lineHeight: "2rem" } })), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "Allows you to restore your backup from an external file. The restored windows will be added to your current saved windows."))), /* @__PURE__ */ React4.createElement("div", { className: "optionsBox" }, /* @__PURE__ */ React4.createElement("h4", null, "Popup icon"), /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("div", { className: "toggle" }, /* @__PURE__ */ React4.createElement(
        "input",
        {
          type: "checkbox",
          onMouseEnter: this.props.badgeText,
          onChange: this.props.toggleBadge,
          checked: this.props.badge,
          id: "badge_mode",
          name: "badge_mode"
        }
      ), /* @__PURE__ */ React4.createElement("label", { onMouseEnter: this.props.badgeText, htmlFor: "badge_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } })), /* @__PURE__ */ React4.createElement("label", { className: "textlabel", htmlFor: "badge_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Count Tabs"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "Shows you the number of open tabs over the Tab Manager icon in the top right of your browser.", /* @__PURE__ */ React4.createElement("br", null), /* @__PURE__ */ React4.createElement("i", null, "By default: enabled"))), /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("div", { className: "toggle" }, /* @__PURE__ */ React4.createElement(
        "input",
        {
          type: "checkbox",
          onMouseEnter: this.props.openInOwnTabText,
          onChange: this.props.toggleOpenInOwnTab,
          checked: this.props.openInOwnTab,
          id: "openinowntab_mode",
          name: "openinowntab_mode"
        }
      ), /* @__PURE__ */ React4.createElement("label", { onMouseEnter: this.props.openInOwnTabText, htmlFor: "openinowntab_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } })), /* @__PURE__ */ React4.createElement("label", { className: "textlabel", htmlFor: "openinowntab_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Open in own Tab by default"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "Opens the Tab Manager in own tab by default, instead of the popup.", /* @__PURE__ */ React4.createElement("br", null), /* @__PURE__ */ React4.createElement("i", null, "By default: disabled")))), /* @__PURE__ */ React4.createElement("div", { className: "optionsBox" }, /* @__PURE__ */ React4.createElement("h4", null, "Window settings"), /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("div", { className: "toggle" }, /* @__PURE__ */ React4.createElement(
        "input",
        {
          type: "checkbox",
          onMouseEnter: this.props.hideText,
          onChange: this.props.toggleHide,
          checked: this.props.hideWindows,
          id: "auto_hide",
          name: "auto_hide"
        }
      ), /* @__PURE__ */ React4.createElement("label", { onMouseEnter: this.props.hideText, htmlFor: "auto_hide", style: { whiteSpace: "pre", lineHeight: "2rem" } })), /* @__PURE__ */ React4.createElement("label", { className: "textlabel", htmlFor: "auto_hide", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Minimize inactive windows"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "With this option enabled, you will only have 1 open window per monitor at all times. When you switch to another window, the other windows will be minimized to the tray automatically.", /* @__PURE__ */ React4.createElement("br", null), /* @__PURE__ */ React4.createElement("i", null, "By default: disabled"))), /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("div", { className: "toggle" }, /* @__PURE__ */ React4.createElement(
        "input",
        {
          type: "checkbox",
          onMouseEnter: this.props.tabActionsText,
          onChange: this.props.toggleTabActions,
          checked: this.props.tabactions,
          id: "tabactions_mode",
          name: "tabactions_mode"
        }
      ), /* @__PURE__ */ React4.createElement("label", { onMouseEnter: this.props.tabActionsText, htmlFor: "tabactions_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } })), /* @__PURE__ */ React4.createElement("label", { className: "textlabel", htmlFor: "tabactions_mode", style: { whiteSpace: "pre", lineHeight: "2rem" } }, "Show action buttons"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "Displays buttons in every window for : opening a new tab, minimizing the window, assigning a color to the window and closing the window.", /* @__PURE__ */ React4.createElement("br", null), /* @__PURE__ */ React4.createElement("i", null, "By default: enabled")))), /* @__PURE__ */ React4.createElement("div", { className: "optionsBox" }, /* @__PURE__ */ React4.createElement("h4", null, "Advanced settings"), /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("a", { href: "#", onClick: this.openIncognitoOptions }, "Allow in Incognito")), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "If you also want to see your incognito tabs in the Tab Manager overview, then enable incognito access for this extension.")), /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("a", { href: "#", onClick: this.openShortcuts }, "Change shortcut key"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "If you want to disable or change the shortcut key with which to open Tab Manager Plus, you can do so here."))), /* @__PURE__ */ React4.createElement("div", { className: "optionsBox" }, /* @__PURE__ */ React4.createElement("div", { className: "toggle-box" }, /* @__PURE__ */ React4.createElement("h4", null, "Right mouse button"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "With the right mouse button you can select tabs"), /* @__PURE__ */ React4.createElement("h4", null, "Shift+Right mouse button"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "While holding shift, and pressing the right mouse button you can select all tabs between the last selected tab and the current one"), /* @__PURE__ */ React4.createElement("h4", null, "Middle mouse button"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "With the middle mouse button you can close a tab"), /* @__PURE__ */ React4.createElement("h4", null, "[Enter / Return] button"), /* @__PURE__ */ React4.createElement("div", { className: "option-description" }, "With the return button you can switch to the currently selected tab, or move multiple selected tabs to a new window"))));
    }
    async openIncognitoOptions() {
      await browser6.tabs.create({
        url: "chrome://extensions/?id=cnkdjjdmfiffagllbiiilooaoofcoeff"
      });
    }
    async openShortcuts() {
      await browser6.tabs.create({ url: "chrome://extensions/shortcuts" });
    }
    licenses() {
      return /* @__PURE__ */ React4.createElement("div", { className: "licenses", key: "licenses" }, /* @__PURE__ */ React4.createElement("div", { className: "license" }, "Tab Manager Plus is based on", " ", /* @__PURE__ */ React4.createElement("a", { href: "https://github.com/dsc/Tab-Manager", target: "_blank", title: "Tab-Manager" }, "dsc/Tab-Manager"), ",", " ", /* @__PURE__ */ React4.createElement("a", { href: "https://github.com/joshperry/Tab-Manager", target: "_blank", title: "Tab-Manager" }, "joshperry/Tab-Manager"), " ", "and", " ", /* @__PURE__ */ React4.createElement("a", { href: "https://github.com/JonasNo/Tab-Manager", target: "_blank", title: "Tab-Manager" }, "JonasNo/Tab-Manager"), ".", /* @__PURE__ */ React4.createElement("br", null), "Licensed by", " ", /* @__PURE__ */ React4.createElement("a", { href: "http://creativecommons.org/licenses/by/3.0/", target: "_blank", title: " Mozilla Public License (MPL)" }, "MPLv2"), ". Icons made by", " ", /* @__PURE__ */ React4.createElement("a", { href: "http://www.freepik.com", title: "Freepik" }, "Freepik"), " ", "from", " ", /* @__PURE__ */ React4.createElement("a", { href: "http://www.flaticon.com", title: "Flaticon" }, "www.flaticon.com"), ". Licensed by", " ", /* @__PURE__ */ React4.createElement("a", { href: "http://creativecommons.org/licenses/by/3.0/", target: "_blank", title: "Creative Commons BY 3.0" }, "CC 3.0 BY"), "."));
    }
    render() {
      var children = [];
      children.push(this.logo());
      children.push(this.optionsSection());
      children.push(/* @__PURE__ */ React4.createElement("div", { className: "clearfix", key: "clear_fix" }));
      children.push(this.licenses());
      return /* @__PURE__ */ React4.createElement("div", { className: "options-window", key: "options_window" }, /* @__PURE__ */ React4.createElement("div", { key: "options_content" }, children));
    }
  };

  // src/popup/views/Window.tsx
  var React5 = __toESM(require_react());
  var browser7 = __toESM(require_browser_polyfill());
  var Window = class extends React5.Component {
    constructor(props) {
      super(props);
      this.state = {
        colorActive: false,
        windowTitles: [],
        color: "default",
        name: "",
        auto_name: "",
        tabs: 0,
        hover: false,
        dirty: false
      };
      this.addTab = this.addTab.bind(this);
      this.changeColors = this.changeColors.bind(this);
      this.changeName = this.changeName.bind(this);
      this.checkKey = this.checkKey.bind(this);
      this.closePopup = this.closePopup.bind(this);
      this.close = this.close.bind(this);
      this.colors = this.colors.bind(this);
      this.dragOver = this.dragOver.bind(this);
      this.dragLeave = this.dragLeave.bind(this);
      this.drop = this.drop.bind(this);
      this.maximize = this.maximize.bind(this);
      this.minimize = this.minimize.bind(this);
      this.save = this.save.bind(this);
      this.stop = this.stop.bind(this);
      this.windowClick = this.windowClick.bind(this);
      this.selectToFromTab = this.selectToFromTab.bind(this);
      this.hoverWindow = this.hoverWindow.bind(this);
      this.hoverWindowOut = this.hoverWindowOut.bind(this);
      this.checkSettings = this.checkSettings.bind(this);
    }
    async componentDidMount() {
      await this.checkSettings();
      await this.update();
    }
    async componentDidUpdate(prevProps, prevState) {
      if (this.state.dirty) {
        await this.update();
        this.setState({ dirty: false });
      }
    }
    async checkSettings() {
      let colors = await getLocalStorageMap(windowColors);
      let color = colors.get(this.props.window.id) || "default";
      this.setState({
        color
      });
    }
    async update() {
      let name;
      if (!!this.props.window.title) {
        name = this.props.window.title;
      } else {
        let names = await getLocalStorageMap(windowNames);
        name = names.get(this.props.window.id) || "";
      }
      if (!!name) {
        if (name !== this.state.name) {
          this.setState({
            name
          });
        }
        return;
      }
      let _window_titles = this.state.windowTitles;
      let _tabs = this.state.tabs;
      let tabs4 = await browser7.tabs.query({ windowId: this.props.window.id });
      if (tabs4.length == 0) return;
      if (_window_titles.length === 0 || this.state.tabs !== tabs4.length + this.props.window.id * 99) {
        _window_titles.length = 0;
        _tabs = tabs4.length + this.props.window.id * 99;
        for (let i = 0; i < tabs4.length; i++) {
          const _tab = tabs4[i];
          if (!!_tab && (!!_tab.url || !!_tab.pendingUrl)) {
            let url;
            if (!!_tab.pendingUrl) {
              url = new URL(_tab.pendingUrl);
            } else if (!!_tab.url) {
              url = new URL(_tab.url);
            }
            if (_tab.status == "loading") _tabs--;
            let protocol = url.protocol || "";
            let hostname = url.hostname || "";
            if (protocol.indexOf("view-source") > -1 && !!url.pathname) {
              url = new URL(url.pathname);
              hostname = url.hostname || "source";
            } else if (protocol.indexOf("chrome-extension") > -1) {
              hostname = _tab.title || "extension";
            } else if (protocol.indexOf("about") > -1) {
              hostname = _tab.title || "about";
            } else if (hostname.indexOf("mail.google") > -1) {
              hostname = "gmail";
            } else {
              if (!hostname) hostname = "";
              hostname = hostname.replace("www.", "");
              if (!isIpAddress(hostname)) {
                let regex_var = new RegExp(/(\.[^\.]{0,2})(\.[^\.]{0,2})(\.*$)|(\.[^\.]*)(\.*$)/);
                hostname = hostname.replace(regex_var, "").split(".").pop();
              } else {
                if (!!_tab.title) {
                  hostname = _tab.title;
                } else {
                  let ip = hostname.split(".");
                  hostname = ip[0] + "." + ip[1] + ".*.*";
                }
              }
            }
            if (!hostname || hostname.length > 7) {
              let title = _tab.title || "";
              const separators = /\s[—|•-]\s/;
              do {
                let titles = title.split(separators);
                let first = titles[0];
                let last = titles[titles.length - 1];
                if (slugify(first) == slugify(hostname) || slugify_no_space(first) == slugify_no_space(hostname) || slugify_no_space(first).startsWith(slugify_no_space(hostname).substring(0, 3)) || slugify_no_space(hostname).startsWith(slugify_no_space(first).substring(0, 3))) {
                  title = first;
                } else if (slugify(last) == slugify(hostname) || slugify_no_space(last) == slugify_no_space(hostname) || slugify_no_space(last).startsWith(slugify_no_space(hostname).substring(0, 3)) || slugify_no_space(hostname).startsWith(slugify_no_space(last).substring(0, 3))) {
                  title = last;
                } else {
                  titles.sort((a, b) => a.length - b.length);
                  titles.pop();
                  title = titles.join("-");
                }
              } while (title.length > hostname.length && separators.test(title));
              if (!hostname || !!title && title.length < 23) {
                hostname = title;
              }
            }
            _window_titles.push(hostname);
          }
        }
        this.setState({
          tabs: _tabs
        });
      }
      if (_window_titles.length > 0) {
        name = this.topEntries(this.state.windowTitles).join("");
        this.setState({
          auto_name: name
        });
      }
    }
    render() {
      let _this = this;
      let color = this.state.color || "default";
      let hideWindow = true;
      let titleAdded = false;
      let tabsperrow = this.props.layout.indexOf("blocks") > -1 ? Math.ceil(Math.sqrt(this.props.tabs.length + 2)) : this.props.layout === "vertical" ? 1 : 15;
      let tabs4 = this.props.tabs.map(function(tab) {
        let isHidden = _this.props.hiddenTabs.has(tab.id) && _this.props.filterTabs;
        let isSelected = _this.props.selection.has(tab.id);
        if (!isHidden) hideWindow = false;
        return /* @__PURE__ */ React5.createElement(
          Tab,
          {
            key: "windowtab_" + _this.props.window.id + "_" + tab.id,
            window: _this.props.window,
            layout: _this.props.layout,
            tab,
            selected: isSelected,
            hidden: isHidden,
            middleClick: _this.props.tabMiddleClick,
            hoverHandler: _this.props.hoverHandler,
            searchActive: _this.props.searchActive,
            select: _this.props.select,
            selectTo: _this.selectToFromTab,
            draggable: true,
            drag: _this.props.drag,
            drop: _this.props.drop,
            dropWindow: _this.props.dropWindow,
            dragFavicon: _this.props.dragFavicon,
            parentUpdate: _this.forceUpdate.bind(_this),
            ref: "tab" + tab.id,
            id: "tab-" + tab.id
          }
        );
      });
      if (!hideWindow) {
        if (!!this.props.tabactions) {
          tabs4.push(
            /* @__PURE__ */ React5.createElement("div", { key: "windownl_" + _this.props.window.id, className: "newliner" }),
            /* @__PURE__ */ React5.createElement("div", { key: "windowactions_" + this.props.window.id, className: "window-actions" }, this.props.sessionsFeature ? /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction save " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Save this window for later\nWill save " + tabs4.length + " tabs with this window for later. Please note : The saved tabs will lose their history.",
                onClick: this.save,
                onMouseEnter: this.props.hoverIcon
              }
            ) : false, /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction add " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Open a new tab",
                onClick: this.addTab,
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction colors " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change window name or color",
                onClick: this.colors,
                onMouseEnter: this.props.hoverIcon
              }
            ), this.props.window.state === "minimized" ? /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction maximize " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Maximize this window\nWill maximize " + tabs4.length + " tabs",
                onClick: this.maximize,
                onMouseEnter: this.props.hoverIcon
              }
            ) : /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction minimize " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Minimize this window\nWill minimize " + tabs4.length + " tabs",
                onClick: this.minimize,
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction close " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Close this window\nWill close " + tabs4.length + " tabs",
                onClick: this.close,
                onMouseEnter: this.props.hoverIcon
              }
            ))
          );
        }
        if (this.state.colorActive) {
          tabs4.push(
            /* @__PURE__ */ React5.createElement("div", { key: "windowcolors_" + _this.props.window.id, className: "window-colors " + (this.state.colorActive ? "" : "hidden"), onClick: this.stop, onKeyDown: this.checkKey }, /* @__PURE__ */ React5.createElement("h2", { className: "window-x", onClick: this.closePopup }, "x"), /* @__PURE__ */ React5.createElement("h3", { className: "center" }, "Name the window"), /* @__PURE__ */ React5.createElement(
              "input",
              {
                className: "window-name-input",
                type: "text",
                onChange: this.changeName,
                value: this.state.name,
                placeholder: this.state.auto_name ?? "Name window...",
                tabIndex: 1,
                ref: "namebox",
                onKeyDown: this.checkKey
              }
            ), /* @__PURE__ */ React5.createElement("h3", { className: "center" }, "Pick a color"), /* @__PURE__ */ React5.createElement("div", { className: "colors-box" }, /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction default " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "default" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color1 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color1" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color2 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color2" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color3 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color3" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color4 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color4" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color5 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color5" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color6 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color6" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color7 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color7" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color8 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color8" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color9 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color9" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color10 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color10" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color11 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color11" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color12 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color12" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color13 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color13" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color14 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color14" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color15 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color15" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color16 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color16" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color17 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color17" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color18 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color18" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color19 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color19" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color20 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color20" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color21 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color21" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color22 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color22" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color23 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color23" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color24 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color24" }),
                onMouseEnter: this.props.hoverIcon
              }
            ), /* @__PURE__ */ React5.createElement(
              "div",
              {
                className: "icon tabaction color25 " + (this.props.layout.indexOf("blocks") > -1 ? "" : "windowaction"),
                title: "Change background color",
                onClick: this.changeColors.bind(this, { colorActive: false, color: "color25" }),
                onMouseEnter: this.props.hoverIcon
              }
            )))
          );
        }
        if (this.props.windowTitles) {
          titleAdded = true;
          tabs4.unshift(
            /* @__PURE__ */ React5.createElement(
              "h3",
              {
                key: "window-" + this.props.window.id + "-windowTitle",
                className: "editName center windowTitle",
                onClick: this.colors,
                title: "Change the name of this window",
                onMouseEnter: this.props.hoverIcon
              },
              this.props.window.incognito ? "\u{1F575}" : "",
              !!this.state.name ? this.state.name : this.state.auto_name
            )
          );
        }
        if (tabsperrow < 5) {
          tabsperrow = 5;
        }
        let children = [];
        if (!!titleAdded) {
          children.push(tabs4.shift());
        }
        let z = -1;
        for (let j = 0; j < tabs4.length; j++) {
          let tab = tabs4[j].props.tab;
          let isHidden = !!tab && !!tab.id && this.props.hiddenTabs.has(tab.id) && this.props.filterTabs;
          if (isHidden) continue;
          z++;
          children.push(tabs4[j]);
          if ((z + 1) % tabsperrow === 0 && z && this.props.layout.indexOf("blocks") > -1) {
            children.push(/* @__PURE__ */ React5.createElement("div", { className: "newliner", key: "windownlz_" + _this.props.window.id + "_" + z }));
          }
        }
        let focused = false;
        if (this.props.window.focused || this.props.lastOpenWindow === this.props.window.id) {
          focused = true;
        }
        return /* @__PURE__ */ React5.createElement(
          "div",
          {
            key: "window-" + this.props.window.id,
            id: "window-" + this.props.window.id,
            className: "window " + this.props.window.state + " window-" + this.props.window.id + " " + (focused ? "activeWindow" : "") + " " + color + " " + (this.props.layout.indexOf("blocks") > -1 ? "block" : "") + " " + this.props.layout + " " + (this.props.window.incognito ? " incognito" : "") + " " + (focused ? " focused" : ""),
            onDragEnter: this.dragOver,
            onDragOver: this.dragOver,
            onDragLeave: this.dragLeave,
            onClick: this.windowClick,
            title: "",
            onMouseEnter: this.hoverWindow.bind(null, tabs4),
            onMouseLeave: this.hoverWindowOut,
            onDrop: this.drop
          },
          /* @__PURE__ */ React5.createElement("div", { key: "windowcontainer_" + this.props.window.id, className: "windowcontainer", title: "Focus this window\nWill select this window with " + tabs4.length + " tabs" }, children)
        );
      } else {
        return null;
      }
    }
    stop(e) {
      this.stopProp(e);
    }
    addTab(e) {
      this.stopProp(e);
      browser7.tabs.create({ windowId: this.props.window.id });
    }
    dragOver(e) {
      this.setState({ hover: true });
      this.stopProp(e);
    }
    dragLeave(e) {
      this.setState({ hover: false });
      e.nativeEvent.preventDefault();
    }
    drop(e) {
      let distance = 1e6;
      let closestTab = null;
      let closestRef = null;
      for (let i = 0; i < this.props.tabs.length; i++) {
        let tab = this.props.tabs[i];
        let tabRef = this.refs["tab" + tab.id].state.tabRef.current;
        let tabRect = tabRef.getBoundingClientRect();
        let x = e.nativeEvent.clientX;
        let y = e.nativeEvent.clientY;
        let dx = tabRect.x - x;
        let dy = tabRect.y - y;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (d < distance) {
          distance = d;
          closestTab = tab.id;
          closestRef = tabRef;
        }
      }
      this.stopProp(e);
      if (closestTab != null) {
        let before;
        let boundingRect = closestRef.getBoundingClientRect();
        if (this.props.layout === "vertical") {
          before = e.nativeEvent.clientY < boundingRect.top;
        } else {
          before = e.nativeEvent.clientX < boundingRect.left;
        }
        this.props.drop(closestTab, before);
      } else {
        this.props.dropWindow(this.props.window.id);
      }
    }
    hoverWindow(tabs4, _) {
      this.setState({ hover: true });
      this.props.hoverIcon("Focus this window\nWill select this window with " + tabs4.length + " tabs");
    }
    hoverWindowOut(_) {
      this.setState({ hover: false });
    }
    async checkKey(e) {
      if (e.keyCode === 13 || e.keyCode === 27) {
        this.stopProp(e);
        await this.closePopup();
      }
    }
    async windowClick(e) {
      this.stopProp(e);
      let windowId = this.props.window.id;
      if (navigator.userAgent.search("Firefox") > -1) {
        browser7.runtime.sendMessage({ command: focus_on_window_delayed, window_id: windowId });
      } else {
        browser7.runtime.sendMessage({ command: focus_on_window, window_id: windowId });
      }
      this.props.parentUpdate();
      if (!!window.inPopup) window.close();
      return false;
    }
    selectToFromTab(tabId) {
      if (!!tabId) this.props.selectTo(tabId, this.props.tabs);
    }
    async close(e) {
      this.stopProp(e);
      await browser7.windows.remove(this.props.window.id);
    }
    uuidv4() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c === "x" ? r : r & 3 | 8;
        return v.toString(16);
      });
    }
    async save(e) {
      this.stopProp(e);
      console.log("session name", this.state.name);
      let sessionName = this.state.name || this.topEntries(this.state.windowTitles).join("");
      let sessionColor = this.state.color || "default";
      console.log("session name", sessionName);
      let session = {
        tabs: [],
        windowsInfo: null,
        name: sessionName,
        customName: !!this.state.name,
        color: sessionColor,
        date: Date.now(),
        sessionStartTime: Date.now(),
        incognito: this.props.window.incognito,
        id: this.uuidv4()
      };
      let queryInfo = {
        windowId: this.props.window.id
      };
      console.log(queryInfo);
      let tabs4 = await browser7.tabs.query(queryInfo);
      console.log(tabs4);
      for (let tabkey in tabs4) {
        if (navigator.userAgent.search("Firefox") > -1) {
          let newTab = tabs4[tabkey];
          if (!!newTab.url && newTab.url.search("about:") > -1) {
            continue;
          }
        }
        session.tabs.push(tabs4[tabkey]);
      }
      console.log(session.tabs);
      session.windowsInfo = await browser7.windows.get(this.props.window.id);
      console.log(session);
      let sessions = await getLocalStorage("sessions", {});
      sessions[session.id] = session;
      let value = await setLocalStorage("sessions", sessions).catch(function(err) {
        console.log(err);
        console.error(err.message);
      });
      this.props.parentUpdate();
      console.log("Value is set to " + value);
      setTimeout(function() {
        this.props.scrollTo("session", session.id);
      }.bind(this), 150);
    }
    async minimize(e) {
      this.stopProp(e);
      await browser7.windows.update(this.props.window.id, {
        state: "minimized"
      });
      this.props.parentUpdate();
    }
    async maximize(e) {
      this.stopProp(e);
      await browser7.windows.update(this.props.window.id, {
        state: "normal"
      });
      this.props.parentUpdate();
    }
    colors(e) {
      this.stopProp(e);
      this.props.toggleColors(!this.state.colorActive, this.props.window.id);
      this.setState({
        colorActive: !this.state.colorActive
      });
      setTimeout(function() {
        if (this.state.colorActive) {
          this.refs.namebox.focus();
        }
      }.bind(this), 150);
    }
    async changeColors(a) {
      this.setState(a);
      this.props.toggleColors(!this.state.colorActive, this.props.window.id);
      let color = a.color || "default";
      browser7.runtime.sendMessage({
        command: set_window_color,
        window_id: this.props.window.id,
        color
      });
      this.setState({ color });
      await this.closePopup();
    }
    async closePopup() {
      this.props.toggleColors(!this.state.colorActive, this.props.window.id);
      this.setState({
        colorActive: !this.state.colorActive
      });
      await this.update();
      this.props.parentUpdate();
    }
    async changeName(e) {
      let name = "";
      if (e && e.target && e.target.value) name = e.target.value;
      browser7.runtime.sendMessage({
        command: set_window_name,
        window_id: this.props.window.id,
        name
      });
      this.setState({
        name
      });
      if (navigator.userAgent.search("Firefox") > -1) {
        if (!!name) {
          await browser7.windows.update(this.props.window.id, {
            titlePreface: name + " - "
          });
        } else {
          await browser7.windows.update(this.props.window.id, {
            titlePreface: name
          });
        }
      }
    }
    topEntries(arr) {
      let cnts = arr.reduce(function(obj, val) {
        obj[val] = (obj[val] || 0) + 1;
        return obj;
      }, {});
      let sorted = Object.keys(cnts).sort(function(a, b) {
        return cnts[b] - cnts[a];
      });
      let more = 0;
      if (sorted.length === 3) {
      } else {
        while (sorted.length > 2) {
          sorted.pop();
          more++;
        }
      }
      for (let i = 0; i < sorted.length; i++) {
        if (i > 0) {
          sorted[i] = ", " + sorted[i];
        }
      }
      if (more > 0) {
        sorted.push(" & " + more + " more");
      }
      return sorted;
    }
    stopProp(e) {
      if (e && e.nativeEvent) {
        e.nativeEvent.preventDefault();
        e.nativeEvent.stopPropagation();
      }
      if (e && e.preventDefault) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };
  function slugify(text) {
    return text.toString().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "").replace(/--+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
  }
  function slugify_no_space(text) {
    return text.toString().toLowerCase().replace(/\s+/g, "").replace(/[^\w-]+/g, "").replace(/--+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
  }
  function isIpAddress(input) {
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^([a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/;
    return ipv4Regex.test(input) || ipv6Regex.test(input);
  }

  // src/popup/popup.tsx
  var React6 = __toESM(require_react());
  var ReactDOM = __toESM(require_react_dom());
  window.loaded = false;
  window.inPopup = window.location.search.indexOf("?popup") > -1;
  window.inPanel = window.location.search.indexOf("?panel") > -1;
  window.extensionVersion = "6.0.0";
  window.onload = () => window.requestAnimationFrame(loadApp);
  setTimeout(loadApp, 75);
  setTimeout(loadApp, 125);
  setTimeout(loadApp, 250);
  setTimeout(loadApp, 375);
  setTimeout(loadApp, 700);
  setTimeout(loadApp, 1e3);
  setTimeout(loadApp, 2e3);
  setTimeout(loadApp, 3e3);
  setTimeout(loadApp, 5e3);
  setTimeout(loadApp, 15e3);
  async function loadApp() {
    if (!!window.loaded) return;
    let height = await getLocalStorage("tabHeight", 600);
    let width = await getLocalStorage("tabWidth", 800);
    console.log(height, width);
    if (window.inPopup) {
      if (height > 0 && width > 0) {
        document.body.style.width = width + "px";
        document.body.style.height = height + "px";
      }
      var root = document.getElementById("root");
      if (root != null) {
        var _height = parseInt(document.body.style.height.split("px")[0]) || 0;
        if (_height < 300) {
          _height = 400;
          document.body.style.minHeight = _height + "px";
        } else {
          _height++;
          if (_height > 600) _height = 600;
          document.body.style.minHeight = _height + "px";
        }
      }
    } else {
      if (window.inPanel) {
        document.documentElement.style.maxHeight = "auto";
        document.documentElement.style.maxWidth = "auto";
        document.body.style.maxHeight = "auto";
        document.body.style.maxWidth = "auto";
      }
      document.documentElement.style.maxHeight = "100%";
      document.documentElement.style.maxWidth = "100%";
      document.documentElement.style.height = "100%";
      document.documentElement.style.width = "100%";
      document.body.style.maxHeight = "100%";
      document.body.style.maxWidth = "100%";
      document.body.style.height = "100%";
      document.body.style.width = "100%";
    }
    if (!!window.loaded) return;
    window.loaded = true;
    ReactDOM.render(/* @__PURE__ */ React6.createElement(TabManager, { optionsActive: !!window.optionPage }), document.getElementById("TMP"));
  }
  window.addEventListener("contextmenu", function(e) {
    e.preventDefault();
  });
})();
/*! Bundled license information:

object-assign/index.js:
  (*
  object-assign
  (c) Sindre Sorhus
  @license MIT
  *)

react/cjs/react.production.min.js:
  (** @license React v16.11.0
   * react.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

scheduler/cjs/scheduler.production.min.js:
  (** @license React v0.17.0
   * scheduler.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.min.js:
  (** @license React v16.11.0
   * react-dom.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
//# sourceMappingURL=popup.js.map
