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

  // lib/helpers/storage.ts
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

  // lib/service_worker/context.ts
  var globalTabsActive = [];

  // lib/strings/strings.ts
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
  var windowColors = "windowColors";
  var windowNames = "windowNames";

  // lib/helpers/utils.ts
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

  // lib/service_worker/background/tracking.ts
  var browser2 = __toESM(require_browser_polyfill());
  var cleanupDebounce = debounce(cleanUp, 500);
  async function cleanUp(remove_old = false) {
    let activewindows = await browser2.windows.getAll({ populate: true });
    let windowids = [];
    for (let _w of activewindows) {
      windowids.push(_w.id);
    }
    let windows7 = await getLocalStorage("windowAge", []);
    if (!(windows7 instanceof Array)) windows7 = [];
    for (let i = windows7.length - 1; i >= 0; i--) {
      if (windowids.indexOf(windows7[i]) < 0) {
        windows7.splice(i, 1);
      }
    }
    await setLocalStorage("windowAge", windows7);
    let names = await getLocalStorageMap(windowNames);
    let colors = await getLocalStorageMap(windowColors);
    let to_check = /* @__PURE__ */ new Set();
    let exists = /* @__PURE__ */ new Set();
    let to_refresh = [];
    for (const [id, _name] of names) {
      if (windowids.indexOf(id) < 0) {
        to_check.add(id);
      } else {
        exists.add(id);
      }
    }
    for (const [id, _color] of colors) {
      if (windowids.indexOf(id) < 0) {
        to_check.add(id);
      } else {
        exists.add(id);
      }
    }
    if (to_check.size > 0) {
      let hashes = await getLocalStorageMap(windowHashes);
      let found = false;
      for (let w of activewindows) {
        const windowhash = hashcode(w);
        for (const [id, _hash] of hashes) {
          if (!to_check.has(id)) continue;
          if (exists.has(id)) continue;
          if (w.id === id) break;
          if (_hash === windowhash) {
            console.log("found by hash, old id " + id + " new id " + w.id);
            to_refresh.push(w.id);
            if (!!names.get(id)) {
              names.set(w.id, names.get(id));
              names.delete(id);
            }
            if (!!colors.get(id)) {
              colors.set(w.id, colors.get(id));
              colors.delete(id);
            }
            hashes.set(w.id, _hash);
            hashes.delete(id);
            found = true;
            to_check.delete(id);
            break;
          }
        }
      }
      let save = false;
      if (remove_old) {
        for (const _id of to_check) {
          console.log("should delete from to check " + _id);
          colors.delete(_id);
          names.delete(_id);
          hashes.delete(_id);
          save = true;
        }
      }
      if (found || save) {
        await setLocalStorageMap(windowNames, names);
        await setLocalStorageMap(windowColors, colors);
        await setLocalStorageMap(windowHashes, hashes);
        if (found) {
          browser2.runtime.sendMessage({
            command: refresh_windows,
            window_ids: to_refresh
          });
        }
      }
    }
  }

  // lib/service_worker/background/windows.ts
  var browser3 = __toESM(require_browser_polyfill());
  async function setupWindowListeners() {
    browser3.windows.onFocusChanged.removeListener(windowFocus);
    browser3.windows.onCreated.removeListener(windowCreated);
    browser3.windows.onRemoved.removeListener(windowRemoved);
    browser3.windows.onFocusChanged.addListener(windowFocus);
    browser3.windows.onCreated.addListener(windowCreated);
    browser3.windows.onRemoved.addListener(windowRemoved);
  }
  async function createWindowWithTabs(tabs5, isIncognito = false) {
    var pinnedIndex = 0;
    var firstTab = tabs5.shift();
    var t = [];
    for (const _tab of tabs5) {
      t.push(_tab.id);
    }
    var firstPinned = firstTab.pinned;
    var w = await browser3.windows.create({ tabId: firstTab.id, incognito: !!isIncognito });
    if (firstPinned) {
      await browser3.tabs.update(w.tabs[0].id, { pinned: firstPinned });
      pinnedIndex++;
    }
    if (t.length > 0) {
      var i = 0;
      for (let oldTabId of t) {
        i++;
        var oldTab = await browser3.tabs.get(oldTabId);
        var tabPinned = oldTab.pinned;
        var movedTabs = [];
        if (!tabPinned) {
          movedTabs = await browser3.tabs.move(oldTabId, { windowId: w.id, index: -1 });
        } else {
          movedTabs = await browser3.tabs.move(oldTabId, { windowId: w.id, index: pinnedIndex++ });
        }
        let firstTab2;
        if (Array.isArray(movedTabs)) {
          firstTab2 = movedTabs[0];
        } else {
          firstTab2 = movedTabs;
        }
        if (!!firstTab2) {
          if (tabPinned) {
            await browser3.tabs.update(firstTab2.id, { pinned: tabPinned });
          }
        }
      }
    }
    await browser3.windows.update(w.id, { focused: true });
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
    if (navigator.userAgent.search("Firefox") > -1) {
      whitelistWindow = ["left", "top", "width", "height", "incognito", "type"];
    }
    var whitelistTab = ["url", "active", "selected", "pinned", "index"];
    if (navigator.userAgent.search("Firefox") > -1) {
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
    const newWindow = await browser3.windows.create(filteredWindow).catch(function(error) {
      console.error(error);
      console.log(error);
      console.log(error.message);
    });
    if (!newWindow) return;
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
      if (navigator.userAgent.search("Firefox") > -1) {
        if (!!fTab.url && fTab.url.search("about:") > -1) {
          console.log("filtered by about: url", fTab.url);
          fTab.url = "";
        }
      }
      try {
        await browser3.tabs.create(fTab).catch(function(error) {
          console.error(error);
          console.log(error);
          console.log(error.message);
        });
      } catch (e) {
        console.log("couldn't restore tab");
        console.error(e);
      }
    }
    await browser3.tabs.remove(emptyTab).catch(function(error) {
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
    await browser3.windows.update(newWindow.id, { focused: true });
  }
  function focusOnWindowDelayed(windowId) {
    setTimeout(focusOnWindow.bind(this, windowId), 125);
  }
  async function focusOnWindow(windowId) {
    await browser3.windows.update(windowId, { focused: true });
  }
  async function hideWindows(windowId) {
    if (navigator.userAgent.search("Firefox") > -1) return;
    if (!windowId || windowId < 0) return;
    let hide_windows = await getLocalStorage("hideWindows", false);
    if (!hide_windows) return;
    let has_permission = await browser3.permissions.contains({ permissions: ["system.display"] });
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
    let windows7 = await browser3.windows.getAll({ populate: true });
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
          await browser3.windows.update(window.id, { "state": "minimized" });
        }
      }
    }
  }
  async function windowActive(windowId) {
    if (windowId < 0) return;
    var windows7 = [];
    var windowAge = await getLocalStorage("windowAge", []);
    if (windowAge instanceof Array) windows7 = windowAge;
    if (windows7.indexOf(windowId) > -1) windows7.splice(windows7.indexOf(windowId), 1);
    windows7.unshift(windowId);
    await setLocalStorage("windowAge", windows7);
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
        await windowActive(windowId);
      }
    } catch (e) {
    }
  }
  async function checkWindow(windowId) {
    if (!windowId) return;
    const colors = await getLocalStorageMap(windowColors);
    const names = await getLocalStorageMap(windowNames);
    if (!names[windowId] && !colors[windowId]) return;
    const hashes = await getLocalStorageMap(windowHashes);
    try {
      const window = await browser3.windows.get(windowId, { populate: true });
      let newHash = hashcode(window);
      hashes.set(windowId, newHash);
      await setLocalStorageMap(windowHashes, hashes);
    } catch (e) {
      console.log(e);
    }
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

  // lib/service_worker/background/tabs.ts
  var browser4 = __toESM(require_browser_polyfill());
  async function setupTabListeners() {
    browser4.tabs.onCreated.removeListener(tabAdded);
    browser4.tabs.onUpdated.removeListener(tabCountChanged);
    browser4.tabs.onRemoved.removeListener(tabCountChanged);
    browser4.tabs.onReplaced.removeListener(tabCountChanged);
    browser4.tabs.onDetached.removeListener(tabCountChanged);
    browser4.tabs.onAttached.removeListener(tabCountChanged);
    browser4.tabs.onActivated.removeListener(tabActiveChanged);
    browser4.tabs.onMoved.removeListener(tabCountChanged);
    browser4.tabs.onCreated.removeListener(checkTabCreate);
    browser4.tabs.onUpdated.removeListener(checkTabUpdate);
    browser4.tabs.onRemoved.removeListener(checkTabRemove);
    browser4.tabs.onDetached.removeListener(checkTabDetached);
    browser4.tabs.onAttached.removeListener(checkTabAttached);
    browser4.tabs.onMoved.removeListener(checkTabMoved);
    browser4.tabs.onCreated.addListener(tabAdded);
    browser4.tabs.onUpdated.addListener(tabCountChanged);
    browser4.tabs.onRemoved.addListener(tabCountChanged);
    browser4.tabs.onReplaced.addListener(tabCountChanged);
    browser4.tabs.onDetached.addListener(tabCountChanged);
    browser4.tabs.onAttached.addListener(tabCountChanged);
    browser4.tabs.onActivated.addListener(tabActiveChanged);
    browser4.tabs.onMoved.addListener(tabCountChanged);
    browser4.tabs.onCreated.addListener(checkTabCreate);
    browser4.tabs.onUpdated.addListener(checkTabUpdate);
    browser4.tabs.onRemoved.addListener(checkTabRemove);
    browser4.tabs.onDetached.addListener(checkTabDetached);
    browser4.tabs.onAttached.addListener(checkTabAttached);
    browser4.tabs.onMoved.addListener(checkTabMoved);
  }
  async function discardTabs(tabs5) {
    for (const tab of tabs5) {
      if (!tab.discarded) {
        browser4.tabs.discard(tab.id).catch(function(e) {
          console.error(e);
          console.log(e.message);
        });
      }
    }
  }
  async function closeTabs(tabs5) {
    for (const tab of tabs5) {
      await browser4.tabs.remove(tab.id);
    }
  }
  async function moveTabsToWindow(windowId, tabs5) {
    for (const tab of tabs5) {
      await browser4.tabs.move(tab.id, { windowId, index: -1 });
      await browser4.tabs.update(tab.id, { pinned: tab.pinned });
    }
  }
  function focusOnTabAndWindowDelayed(tabId, windowId) {
    setTimeout(focusOnTabAndWindow.bind(this, tabId, windowId), 125);
  }
  async function focusOnTabAndWindow(tabId, windowId) {
    await browser4.windows.update(windowId, { focused: true });
    await browser4.tabs.update(tabId, { active: true });
    await tabActiveChanged({ tabId, windowId });
  }
  async function updateTabCount() {
    let run = true;
    const badge = await getLocalStorage("badge", true);
    if (!badge) run = false;
    if (run) {
      let result = await browser4.tabs.query({});
      let count = 0;
      if (!!result && !!result.length) {
        count = result.length;
      }
      await browser4.action.setBadgeText({ text: count + "" });
      await browser4.action.setBadgeBackgroundColor({ color: "purple" });
      const _to_remove = [];
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
      while (_to_remove.length > 0) {
        let index = _to_remove.pop();
        if (!!globalTabsActive && globalTabsActive.length > 0) {
          if (!!globalTabsActive[index]) globalTabsActive.splice(index, 1);
        }
      }
    } else {
      await browser4.action.setBadgeText({ text: "" });
    }
  }
  function tabCountChanged() {
    updateTabCountDebounce();
  }
  var updateTabCountDebounce = debounce(updateTabCount, 250);
  async function tabAdded(tab) {
    const tabLimit = await getLocalStorage("tabLimit", 0);
    if (tabLimit > 0) {
      if (tab.id !== browser4.tabs.TAB_ID_NONE) {
        const tabCount = await browser4.tabs.query({ currentWindow: true });
        if (tabCount.length > tabLimit) {
          await createWindowWithTabs([tab], tab.incognito);
        }
      }
    }
    updateTabCountDebounce();
  }
  function tabActiveChanged(tab) {
    trackLastTab(tab);
    updateTabCountDebounce();
  }
  async function checkTabCreate(tab) {
    await checkWindow(tab.windowId);
  }
  async function checkTabUpdate(tabid, changeinfo, tab) {
    await checkWindow(tab.windowId);
  }
  async function checkTabRemove(tabid, removeinfo) {
    if (removeinfo.isWindowClosing) return;
    await checkWindow(removeinfo.windowId);
  }
  async function checkTabDetached(tabid, detachinfo) {
    await checkWindow(detachinfo.oldWindowId);
  }
  async function checkTabAttached(tabid, attachinfo) {
    await checkWindow(attachinfo.newWindowId);
  }
  async function checkTabMoved(tabid, moveinfo) {
    await checkWindow(moveinfo.windowId);
  }

  // lib/service_worker/ui/open.ts
  var browser5 = __toESM(require_browser_polyfill());
  async function openSidebar() {
    await browser5.sidebarAction.open();
  }
  async function openPopup() {
    const openInOwnTab = await getLocalStorage("openInOwnTab", false);
    if (openInOwnTab) {
      await browser5.action.setPopup({ popup: "popup.html?popup=true" });
      await browser5.action.openPopup();
      await browser5.action.setPopup({ popup: "" });
    } else {
      await browser5.action.openPopup();
    }
  }
  async function openAsOwnTab() {
    const popup_page = await browser5.runtime.getURL("popup.html");
    const tabs5 = await browser5.tabs.query({});
    let currentTab;
    let previousTab;
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
          await browser5.windows.update(tab.windowId, { focused: true });
          await browser5.tabs.highlight({ windowId: tab.windowId, tabs: tab.index });
          return;
        }
      }
    }
    await browser5.tabs.create({ url: "popup.html" });
  }
  async function setupPopup() {
    const openInOwnTab = await getLocalStorage("openInOwnTab", false);
    browser5.action.onClicked.removeListener(openAsOwnTab);
    if (openInOwnTab) {
      await browser5.action.setPopup({ popup: "" });
      browser5.action.onClicked.addListener(openAsOwnTab);
    } else {
      await browser5.action.setPopup({ popup: "popup.html?popup=true" });
    }
    if (browser5.sidebarAction) {
      await browser5.sidebarAction.setPanel({ panel: "popup.html?panel=true" });
    }
  }

  // lib/service_worker/background/actions.ts
  var browser6 = __toESM(require_browser_polyfill());
  async function handleMessages(message, sender, sendResponse) {
    const request = message;
    switch (request.command) {
      case reload_popup_controls:
        setupPopup();
        break;
      case update_tab_count:
        updateTabCount();
        break;
      case discard_tabs:
        discardTabs(request.tabs);
        break;
      case move_tabs_to_window:
        moveTabsToWindow(request.window_id, request.tabs);
        break;
      case focus_on_tab_and_window:
        if (!!request.tab) {
          focusOnTabAndWindow(request.tab.id, request.tab.windowId);
        } else {
          focusOnTabAndWindow(request.saved_tab.tabId, request.saved_tab.windowId);
        }
        break;
      case focus_on_tab_and_window_delayed:
        if (!!request.tab) {
          focusOnTabAndWindowDelayed(request.tab.id, request.tab.windowId);
        } else {
          focusOnTabAndWindowDelayed(request.saved_tab.tabId, request.saved_tab.windowId);
        }
        break;
      case focus_on_window:
        focusOnWindow(request.window_id);
        break;
      case focus_on_window_delayed:
        focusOnWindowDelayed(request.window_id);
        break;
      case set_window_color:
        setWindowColor(request.window_id, request.color);
        break;
      case set_window_name:
        setWindowName(request.window_id, request.name);
        break;
      case create_window_with_tabs:
        createWindowWithTabs(request.tabs, request.incognito);
        break;
      case create_window_with_session_tabs:
        createWindowWithSessionTabs(request.session, request.tab_id);
        break;
      case close_tabs:
        closeTabs(request.tabs);
        break;
    }
  }
  function handleCommands(command) {
    if (command === switch_to_previous_active_tab) {
      if (!!globalTabsActive && globalTabsActive.length > 1) {
        var _tab = globalTabsActive[globalTabsActive.length - 2];
        focusOnTabAndWindow(_tab.tabId, _tab.windowId);
      }
    }
  }
  function trackLastTab(tab) {
    if (!!tab && !!tab.tabId) {
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
    }
  }
  async function setWindowColor(windowId, color) {
    var colors = await getLocalStorageMap(windowColors);
    if (!!color) {
      colors.set(windowId, color);
    } else {
      colors.delete(windowId);
    }
    await setLocalStorageMap(windowColors, colors);
    await updateWindowHash(windowId);
    browser6.runtime.sendMessage({
      command: refresh_windows,
      window_ids: [windowId]
    });
  }
  async function setWindowName(windowId, name) {
    var names = await getLocalStorageMap(windowNames);
    if (!!name) {
      names.set(windowId, name);
    } else {
      names.delete(windowId);
    }
    await setLocalStorageMap(windowNames, names);
    await updateWindowHash(windowId);
    browser6.runtime.sendMessage({
      command: refresh_windows,
      window_ids: [windowId]
    });
  }
  async function updateWindowHash(windowId) {
    const window = await browser6.windows.get(windowId, { populate: true });
    const hash = hashcode(window);
    const hashes = await getLocalStorageMap(windowHashes);
    hashes.set(windowId, hash);
    await setLocalStorageMap(windowHashes, hashes);
  }

  // lib/service_worker/ui/context_menus.ts
  var browser7 = __toESM(require_browser_polyfill());
  async function setupContextMenus() {
    await browser7.contextMenus.removeAll();
    browser7.contextMenus.create({
      id: open_in_own_tab,
      title: "\u{1F4D4} Open in own tab",
      contexts: ["action"]
    });
    if (!!browser7.action.openPopup) {
      browser7.contextMenus.create({
        id: open_popup,
        title: "\u{1F4D1} Open popup",
        contexts: ["action"]
      });
    }
    if (!!browser7.sidebarAction) {
      browser7.contextMenus.create({
        id: open_sidebar,
        title: "\u{1F5C2} Open sidebar",
        contexts: ["action"]
      });
    }
    browser7.contextMenus.create({
      id: sep1,
      type: "separator",
      contexts: ["action"]
    });
    browser7.contextMenus.create({
      title: "\u{1F60D} Support this extension",
      id: support_menu,
      "contexts": ["action"]
    });
    browser7.contextMenus.create({
      id: review,
      title: "\u2B50 Leave a review",
      "contexts": ["action"],
      parentId: "support_menu"
    });
    browser7.contextMenus.create({
      id: donate,
      title: "\u2615 Donate to keep Extensions Alive",
      "contexts": ["action"],
      parentId: "support_menu"
    });
    browser7.contextMenus.create({
      id: patron,
      title: "\u{1F4B0} Become a Patron",
      "contexts": ["action"],
      parentId: "support_menu"
    });
    browser7.contextMenus.create({
      id: twitter,
      title: "\u{1F426} Follow on Twitter",
      "contexts": ["action"],
      parentId: "support_menu"
    });
    browser7.contextMenus.create({
      title: "\u{1F914} Issues and Suggestions",
      id: code_menu,
      "contexts": ["action"]
    });
    browser7.contextMenus.create({
      id: changelog,
      title: "\u{1F195} View recent changes",
      "contexts": ["action"],
      parentId: "code_menu"
    });
    browser7.contextMenus.create({
      id: options,
      title: "\u2699 Edit Options",
      "contexts": ["action"],
      parentId: "code_menu"
    });
    browser7.contextMenus.create({
      id: source,
      title: "\u{1F4BB} View source code",
      "contexts": ["action"],
      parentId: "code_menu"
    });
    browser7.contextMenus.create({
      id: report,
      title: "\u{1F914} Report an issue",
      "contexts": ["action"],
      parentId: "code_menu"
    });
    browser7.contextMenus.create({
      id: send,
      title: "\u{1F4A1} Send a suggestion",
      "contexts": ["action"],
      parentId: "code_menu"
    });
    browser7.contextMenus.onClicked.removeListener(contextListeners);
    browser7.contextMenus.onClicked.addListener(contextListeners);
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
        await browser7.tabs.create({ url: "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW" });
        break;
      case patron:
        await browser7.tabs.create({ url: "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW" });
        break;
      case changelog:
        await browser7.tabs.create({ url: "changelog.html" });
        break;
      case options:
        await browser7.tabs.create({ url: "options.html" });
        break;
      case report:
        await browser7.tabs.create({ url: "https://github.com/stefanXO/Tab-Manager-Plus/issues" });
        break;
      case source:
        await browser7.tabs.create({ url: "https://github.com/stefanXO/Tab-Manager-Plus" });
        break;
      case twitter:
        await browser7.tabs.create({ url: "https://www.twitter.com/mastef" });
        break;
      case send:
        await browser7.tabs.create({ url: "https://github.com/stefanXO/Tab-Manager-Plus/issues" });
        await browser7.tabs.create({ url: "mailto:markus+tmp@stefanxo.com" });
        break;
      case review:
        if (navigator.userAgent.search("Firefox") > -1) {
          await browser7.tabs.create({ url: "https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/" });
        } else {
          await browser7.tabs.create({ url: "https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff" });
        }
        break;
    }
  }

  // lib/service_worker/service_worker.ts
  var browser8 = __toESM(require_browser_polyfill());
  browser8.runtime.onStartup.addListener(
    async function() {
      console.log(" ON STARTUP");
    }
  );
  browser8.runtime.onSuspend.addListener(
    async function() {
      console.log(" ON SUSPEND");
    }
  );
  browser8.commands.onCommand.addListener(handleCommands);
  browser8.runtime.onMessage.addListener(handleMessages);
  (async function() {
    var windows7 = await browser8.windows.getAll({ populate: true });
    await setLocalStorage("windowAge", []);
    if (!!windows7 && windows7.length > 0) {
      windows7.sort(function(a, b) {
        if (a.id < b.id) return 1;
        if (a.id > b.id) return -1;
        return 0;
      });
      for (let i = 0; i < windows7.length; i++) {
        if (!!windows7[i].id) await windowActive(windows7[i].id);
      }
    }
  })();
  var setupDebounced = debounce(setup, 2e3);
  async function setup() {
    await setupContextMenus();
    await setupPopup();
    await setupTabListeners();
    await setupWindowListeners();
    updateTabCountDebounce();
    setTimeout(cleanupDebounce, 2500);
    setTimeout(cleanUp.bind(this, true), 2e5);
  }
  setInterval(setupDebounced, 3e5);
  setup();
})();
//# sourceMappingURL=service_worker.js.map
