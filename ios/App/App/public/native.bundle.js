(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
  var init_dist = __esm({
    "node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p = new Promise((resolve) => call.then(() => resolve({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          if (index !== -1) {
            this.listeners[eventName].splice(index, 1);
          }
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
      (function(SystemBarsStyle2) {
        SystemBarsStyle2["Dark"] = "DARK";
        SystemBarsStyle2["Light"] = "LIGHT";
        SystemBarsStyle2["Default"] = "DEFAULT";
      })(SystemBarsStyle || (SystemBarsStyle = {}));
      (function(SystemBarType2) {
        SystemBarType2["StatusBar"] = "StatusBar";
        SystemBarType2["NavigationBar"] = "NavigationBar";
      })(SystemBarType || (SystemBarType = {}));
      SystemBarsPluginWeb = class extends WebPlugin {
        async setStyle() {
          this.unavailable("not available for web");
        }
        async setAnimation() {
          this.unavailable("not available for web");
        }
        async show() {
          this.unavailable("not available for web");
        }
        async hide() {
          this.unavailable("not available for web");
        }
      };
      SystemBars = registerPlugin("SystemBars", {
        web: () => new SystemBarsPluginWeb()
      });
    }
  });

  // node_modules/@capacitor/haptics/dist/esm/definitions.js
  var ImpactStyle, NotificationType;
  var init_definitions = __esm({
    "node_modules/@capacitor/haptics/dist/esm/definitions.js"() {
      (function(ImpactStyle2) {
        ImpactStyle2["Heavy"] = "HEAVY";
        ImpactStyle2["Medium"] = "MEDIUM";
        ImpactStyle2["Light"] = "LIGHT";
      })(ImpactStyle || (ImpactStyle = {}));
      (function(NotificationType2) {
        NotificationType2["Success"] = "SUCCESS";
        NotificationType2["Warning"] = "WARNING";
        NotificationType2["Error"] = "ERROR";
      })(NotificationType || (NotificationType = {}));
    }
  });

  // node_modules/@capacitor/haptics/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    HapticsWeb: () => HapticsWeb
  });
  var HapticsWeb;
  var init_web = __esm({
    "node_modules/@capacitor/haptics/dist/esm/web.js"() {
      init_dist();
      init_definitions();
      HapticsWeb = class extends WebPlugin {
        constructor() {
          super(...arguments);
          this.selectionStarted = false;
        }
        async impact(options) {
          const pattern = this.patternForImpact(options === null || options === void 0 ? void 0 : options.style);
          this.vibrateWithPattern(pattern);
        }
        async notification(options) {
          const pattern = this.patternForNotification(options === null || options === void 0 ? void 0 : options.type);
          this.vibrateWithPattern(pattern);
        }
        async vibrate(options) {
          const duration = (options === null || options === void 0 ? void 0 : options.duration) || 300;
          this.vibrateWithPattern([duration]);
        }
        async selectionStart() {
          this.selectionStarted = true;
        }
        async selectionChanged() {
          if (this.selectionStarted) {
            this.vibrateWithPattern([70]);
          }
        }
        async selectionEnd() {
          this.selectionStarted = false;
        }
        patternForImpact(style = ImpactStyle.Heavy) {
          if (style === ImpactStyle.Medium) {
            return [43];
          } else if (style === ImpactStyle.Light) {
            return [20];
          }
          return [61];
        }
        patternForNotification(type = NotificationType.Success) {
          if (type === NotificationType.Warning) {
            return [30, 40, 30, 50, 60];
          } else if (type === NotificationType.Error) {
            return [27, 45, 50];
          }
          return [35, 65, 21];
        }
        vibrateWithPattern(pattern) {
          if (navigator.vibrate) {
            navigator.vibrate(pattern);
          } else {
            throw this.unavailable("Browser does not support the vibrate API");
          }
        }
      };
    }
  });

  // node_modules/@capacitor-community/admob/dist/esm/consent/consent-status.enum.js
  var AdmobConsentStatus;
  var init_consent_status_enum = __esm({
    "node_modules/@capacitor-community/admob/dist/esm/consent/consent-status.enum.js"() {
      (function(AdmobConsentStatus2) {
        AdmobConsentStatus2["NOT_REQUIRED"] = "NOT_REQUIRED";
        AdmobConsentStatus2["OBTAINED"] = "OBTAINED";
        AdmobConsentStatus2["REQUIRED"] = "REQUIRED";
        AdmobConsentStatus2["UNKNOWN"] = "UNKNOWN";
      })(AdmobConsentStatus || (AdmobConsentStatus = {}));
    }
  });

  // node_modules/@capacitor-community/admob/dist/esm/consent/privacy-options-requirement-status.enum.js
  var PrivacyOptionsRequirementStatus;
  var init_privacy_options_requirement_status_enum = __esm({
    "node_modules/@capacitor-community/admob/dist/esm/consent/privacy-options-requirement-status.enum.js"() {
      (function(PrivacyOptionsRequirementStatus2) {
        PrivacyOptionsRequirementStatus2["NOT_REQUIRED"] = "NOT_REQUIRED";
        PrivacyOptionsRequirementStatus2["REQUIRED"] = "REQUIRED";
        PrivacyOptionsRequirementStatus2["UNKNOWN"] = "UNKNOWN";
      })(PrivacyOptionsRequirementStatus || (PrivacyOptionsRequirementStatus = {}));
    }
  });

  // node_modules/@capacitor-community/admob/dist/esm/web.js
  var web_exports2 = {};
  __export(web_exports2, {
    AdMobWeb: () => AdMobWeb
  });
  var AdMobWeb;
  var init_web2 = __esm({
    "node_modules/@capacitor-community/admob/dist/esm/web.js"() {
      init_dist();
      init_consent_status_enum();
      init_privacy_options_requirement_status_enum();
      AdMobWeb = class extends WebPlugin {
        async initialize() {
          console.log("initialize");
        }
        async requestTrackingAuthorization() {
          console.log("requestTrackingAuthorization");
        }
        async trackingAuthorizationStatus() {
          return {
            status: "authorized"
          };
        }
        async requestConsentInfo(options) {
          console.log("requestConsentInfo", options);
          return {
            status: AdmobConsentStatus.REQUIRED,
            isConsentFormAvailable: true,
            canRequestAds: true,
            privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus.REQUIRED
          };
        }
        async showPrivacyOptionsForm() {
          console.log("showPrivacyOptionsForm");
        }
        async showConsentForm() {
          console.log("showConsentForm");
          return {
            status: AdmobConsentStatus.REQUIRED,
            canRequestAds: true,
            privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus.REQUIRED
          };
        }
        async resetConsentInfo() {
          console.log("resetConsentInfo");
        }
        async setApplicationMuted(options) {
          console.log("setApplicationMuted", options);
        }
        async setApplicationVolume(options) {
          console.log("setApplicationVolume", options);
        }
        async showBanner(options) {
          console.log("showBanner", options);
        }
        async hideBanner() {
          console.log("hideBanner");
        }
        async resumeBanner() {
          console.log("resumeBanner");
        }
        async removeBanner() {
          console.log("removeBanner");
        }
        async startNativeAdFeed() {
          throw new Error("Native ads are only available on iOS and Android");
        }
        async destroyNativeAdFeed(options) {
          console.log("destroyNativeAdFeed", options);
        }
        async loadNativeAd() {
          throw new Error("Native ads are only available on iOS and Android");
        }
        async updateNativeAdPlacements(options) {
          console.log("updateNativeAdPlacements", options);
        }
        async removeNativeAd(options) {
          console.log("removeNativeAd", options);
        }
        async prepareInterstitial(options) {
          console.log("prepareInterstitial", options);
          return {
            adUnitId: options.adId
          };
        }
        async showInterstitial(options) {
          console.log("showInterstitial", options);
        }
        async prepareRewardVideoAd(options) {
          console.log("prepareRewardVideoAd", options);
          return {
            adUnitId: options.adId
          };
        }
        async showRewardVideoAd(options) {
          console.log("showRewardVideoAd", options);
          return {
            type: "",
            amount: 0
          };
        }
        async prepareRewardInterstitialAd(options) {
          console.log("prepareRewardInterstitialAd", options);
          return {
            adUnitId: options.adId
          };
        }
        async showRewardInterstitialAd(options) {
          console.log("showRewardInterstitialAd", options);
          return {
            type: "",
            amount: 0
          };
        }
        async loadAppOpen(options) {
          console.log("loadAppOpen", options);
          return {
            adUnitId: options.adId
          };
        }
        async showAppOpen(options) {
          console.log("showAppOpen", options);
        }
        async isAppOpenLoaded() {
          return { value: false };
        }
        addListener(eventName, listenerFunc) {
          void listenerFunc;
          console.log("addListener", eventName);
          return Promise.resolve({ remove: () => Promise.resolve() });
        }
      };
    }
  });

  // node_modules/capacitor-game-connect-8/dist/esm/web.js
  var web_exports3 = {};
  __export(web_exports3, {
    CapacitorGameConnectWeb: () => CapacitorGameConnectWeb
  });
  var CapacitorGameConnectWeb;
  var init_web3 = __esm({
    "node_modules/capacitor-game-connect-8/dist/esm/web.js"() {
      init_dist();
      CapacitorGameConnectWeb = class extends WebPlugin {
        /**
         * * Method to sign-in a user to Google Play Services
         * * TODO: migrate interface to a different file
         * * Add web support for signIn
         */
        async signIn() {
          return Promise.resolve({});
        }
        /**
         * Method to display the Leaderboards view from Google Play Services SDK
         *
         * @param leaderboardID as string
         */
        async showLeaderboard(options) {
          console.info("showLeaderboard function has been called", options);
          return Promise.resolve();
        }
        /**
         * * Method to submit a score to the Google Play Services SDK
         *
         * @returns Promise
         */
        async submitScore(options) {
          console.info("submitScore function has been called", options);
          return Promise.resolve();
        }
        /**
         * * Method to display the Achievements view from Google Play SDK
         *
         * @returns Promise
         */
        async showAchievements() {
          return Promise.resolve();
        }
        /**
         * * Method to unlock an achievement
         *
         * @returns  Promise
         */
        async unlockAchievement(options) {
          console.info("unlockAchievement function has been called", options);
          return Promise.resolve();
        }
        /**
         * * Method to increment the progress of an achievement
         *
         * @returns Promise
         */
        async incrementAchievementProgress(options) {
          console.info("incrementAchievementProgress function has been called", options);
          return Promise.resolve();
        }
        /**
         * * Function to get the total player score from a specific leaderboard
         *
         * @param options { leaderboardID: string }
         * @returns Promise<PlayerScore>
         */
        async getUserTotalScore(options) {
          console.info("getUserTotalScore function has been called", options);
          return Promise.resolve({});
        }
      };
    }
  });

  // node_modules/@capacitor/splash-screen/dist/esm/web.js
  var web_exports4 = {};
  __export(web_exports4, {
    SplashScreenWeb: () => SplashScreenWeb
  });
  var SplashScreenWeb;
  var init_web4 = __esm({
    "node_modules/@capacitor/splash-screen/dist/esm/web.js"() {
      init_dist();
      SplashScreenWeb = class extends WebPlugin {
        async show(_options) {
          return void 0;
        }
        async hide(_options) {
          return void 0;
        }
      };
    }
  });

  // scripts/native-bridge.js
  init_dist();

  // node_modules/@capacitor/haptics/dist/esm/index.js
  init_dist();
  init_definitions();
  var Haptics = registerPlugin("Haptics", {
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.HapticsWeb())
  });

  // node_modules/@capacitor-community/admob/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor-community/admob/dist/esm/native-ads/native-ad-feed.js
  init_dist();

  // node_modules/@webview-native-ui/engine/dist/projection/styles.js
  var hidden = ":is([data-native-ui-snapshot-source], [data-native-ui-snapshot-prepared], [data-native-ui-snapshot-content])";
  var snapshotStyles = `
@layer native-ui-projection {
${hidden}, ${hidden} *, ${hidden}::part(native) { visibility: hidden !important; }
${hidden}::before, ${hidden}::after,
${hidden} *::before, ${hidden} *::after {
  visibility: hidden !important;
}
}
[data-native-ui-snapshot-visible] { opacity:1!important;overflow:visible!important; }
[data-native-ui-snapshot-visible][data-native-ui-snapshot-positioned] { position:relative!important; }
`;

  // node_modules/@capacitor-community/admob/dist/esm/native-ads/native-ad-template.enum.js
  var NativeAdTemplate;
  (function(NativeAdTemplate2) {
    NativeAdTemplate2["Small"] = "small";
    NativeAdTemplate2["Medium"] = "medium";
  })(NativeAdTemplate || (NativeAdTemplate = {}));

  // node_modules/@capacitor-community/admob/dist/esm/native-ads/native-ad-feed.js
  var bridge;
  var configureNativeAdBridge = (adMobBridge) => {
    bridge = adMobBridge;
  };

  // node_modules/@capacitor-community/admob/dist/esm/definitions.js
  var MaxAdContentRating;
  (function(MaxAdContentRating2) {
    MaxAdContentRating2["General"] = "General";
    MaxAdContentRating2["ParentalGuidance"] = "ParentalGuidance";
    MaxAdContentRating2["Teen"] = "Teen";
    MaxAdContentRating2["MatureAudience"] = "MatureAudience";
  })(MaxAdContentRating || (MaxAdContentRating = {}));

  // node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-plugin-events.enum.js
  var BannerAdPluginEvents;
  (function(BannerAdPluginEvents2) {
    BannerAdPluginEvents2["SizeChanged"] = "bannerAdSizeChanged";
    BannerAdPluginEvents2["Loaded"] = "bannerAdLoaded";
    BannerAdPluginEvents2["FailedToLoad"] = "bannerAdFailedToLoad";
    BannerAdPluginEvents2["Opened"] = "bannerAdOpened";
    BannerAdPluginEvents2["Closed"] = "bannerAdClosed";
    BannerAdPluginEvents2["AdImpression"] = "bannerAdImpression";
    BannerAdPluginEvents2["AdPaid"] = "bannerAdPaid";
  })(BannerAdPluginEvents || (BannerAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-position.enum.js
  var BannerAdPosition;
  (function(BannerAdPosition2) {
    BannerAdPosition2["TOP_CENTER"] = "TOP_CENTER";
    BannerAdPosition2["CENTER"] = "CENTER";
    BannerAdPosition2["BOTTOM_CENTER"] = "BOTTOM_CENTER";
  })(BannerAdPosition || (BannerAdPosition = {}));

  // node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-size.enum.js
  var BannerAdSize;
  (function(BannerAdSize2) {
    BannerAdSize2["BANNER"] = "BANNER";
    BannerAdSize2["FULL_BANNER"] = "FULL_BANNER";
    BannerAdSize2["LARGE_BANNER"] = "LARGE_BANNER";
    BannerAdSize2["MEDIUM_RECTANGLE"] = "MEDIUM_RECTANGLE";
    BannerAdSize2["LEADERBOARD"] = "LEADERBOARD";
    BannerAdSize2["ADAPTIVE_BANNER"] = "ADAPTIVE_BANNER";
    BannerAdSize2["SMART_BANNER"] = "SMART_BANNER";
  })(BannerAdSize || (BannerAdSize = {}));

  // node_modules/@capacitor-community/admob/dist/esm/interstitial/interstitial-ad-plugin-events.enum.js
  var InterstitialAdPluginEvents;
  (function(InterstitialAdPluginEvents2) {
    InterstitialAdPluginEvents2["Loaded"] = "interstitialAdLoaded";
    InterstitialAdPluginEvents2["FailedToLoad"] = "interstitialAdFailedToLoad";
    InterstitialAdPluginEvents2["Showed"] = "interstitialAdShowed";
    InterstitialAdPluginEvents2["FailedToShow"] = "interstitialAdFailedToShow";
    InterstitialAdPluginEvents2["Dismissed"] = "interstitialAdDismissed";
    InterstitialAdPluginEvents2["AdImpression"] = "interstitialAdImpression";
  })(InterstitialAdPluginEvents || (InterstitialAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-ad-plugin-events.enum.js
  var RewardInterstitialAdPluginEvents;
  (function(RewardInterstitialAdPluginEvents2) {
    RewardInterstitialAdPluginEvents2["Loaded"] = "onRewardedInterstitialAdLoaded";
    RewardInterstitialAdPluginEvents2["FailedToLoad"] = "onRewardedInterstitialAdFailedToLoad";
    RewardInterstitialAdPluginEvents2["Showed"] = "onRewardedInterstitialAdShowed";
    RewardInterstitialAdPluginEvents2["FailedToShow"] = "onRewardedInterstitialAdFailedToShow";
    RewardInterstitialAdPluginEvents2["Dismissed"] = "onRewardedInterstitialAdDismissed";
    RewardInterstitialAdPluginEvents2["Rewarded"] = "onRewardedInterstitialAdReward";
    RewardInterstitialAdPluginEvents2["AdImpression"] = "onRewardedInterstitialAdImpression";
  })(RewardInterstitialAdPluginEvents || (RewardInterstitialAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/reward/reward-ad-plugin-events.enum.js
  var RewardAdPluginEvents;
  (function(RewardAdPluginEvents2) {
    RewardAdPluginEvents2["adClicked"] = "onRewardedVideoAdClicked";
    RewardAdPluginEvents2["Loaded"] = "onRewardedVideoAdLoaded";
    RewardAdPluginEvents2["FailedToLoad"] = "onRewardedVideoAdFailedToLoad";
    RewardAdPluginEvents2["Showed"] = "onRewardedVideoAdShowed";
    RewardAdPluginEvents2["FailedToShow"] = "onRewardedVideoAdFailedToShow";
    RewardAdPluginEvents2["Dismissed"] = "onRewardedVideoAdDismissed";
    RewardAdPluginEvents2["Rewarded"] = "onRewardedVideoAdReward";
    RewardAdPluginEvents2["AdImpression"] = "onRewardedVideoAdImpression";
  })(RewardAdPluginEvents || (RewardAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/consent/index.js
  init_consent_status_enum();

  // node_modules/@capacitor-community/admob/dist/esm/consent/consent-debug-geography.enum.js
  var AdmobConsentDebugGeography;
  (function(AdmobConsentDebugGeography2) {
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["DISABLED"] = 0] = "DISABLED";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["EEA"] = 1] = "EEA";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["NOT_EEA"] = 2] = "NOT_EEA";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["US"] = 3] = "US";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["OTHER"] = 4] = "OTHER";
  })(AdmobConsentDebugGeography || (AdmobConsentDebugGeography = {}));

  // node_modules/@capacitor-community/admob/dist/esm/shared/ad-mob-revenue-data.interface.js
  var AdValuePrecision;
  (function(AdValuePrecision2) {
    AdValuePrecision2[AdValuePrecision2["Unknown"] = 0] = "Unknown";
    AdValuePrecision2[AdValuePrecision2["Estimated"] = 1] = "Estimated";
    AdValuePrecision2[AdValuePrecision2["PublisherProvided"] = 2] = "PublisherProvided";
    AdValuePrecision2[AdValuePrecision2["Precise"] = 3] = "Precise";
  })(AdValuePrecision || (AdValuePrecision = {}));

  // node_modules/@capacitor-community/admob/dist/esm/app-open/app-open-ad-plugin-events.enum.js
  var AppOpenAdPluginEvents;
  (function(AppOpenAdPluginEvents2) {
    AppOpenAdPluginEvents2["Loaded"] = "appOpenAdLoaded";
    AppOpenAdPluginEvents2["FailedToLoad"] = "appOpenAdFailedToLoad";
    AppOpenAdPluginEvents2["Opened"] = "appOpenAdOpened";
    AppOpenAdPluginEvents2["Closed"] = "appOpenAdClosed";
    AppOpenAdPluginEvents2["FailedToShow"] = "appOpenAdFailedToShow";
    AppOpenAdPluginEvents2["AdImpression"] = "appOpenAdImpression";
  })(AppOpenAdPluginEvents || (AppOpenAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/native-ads/native-ad-plugin-events.enum.js
  var NativeAdPluginEvents;
  (function(NativeAdPluginEvents2) {
    NativeAdPluginEvents2["Loaded"] = "nativeAdLoaded";
    NativeAdPluginEvents2["FailedToLoad"] = "nativeAdFailedToLoad";
    NativeAdPluginEvents2["Clicked"] = "nativeAdClicked";
    NativeAdPluginEvents2["AdImpression"] = "nativeAdImpression";
    NativeAdPluginEvents2["Opened"] = "nativeAdOpened";
    NativeAdPluginEvents2["Closed"] = "nativeAdClosed";
    NativeAdPluginEvents2["AdPaid"] = "nativeAdPaid";
  })(NativeAdPluginEvents || (NativeAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/index.js
  var nativeAdBridge = registerPlugin("AdMob", {
    web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.AdMobWeb())
  });
  var AdMob = nativeAdBridge;
  configureNativeAdBridge(nativeAdBridge);

  // node_modules/capacitor-game-connect-8/dist/esm/index.js
  init_dist();
  var CapacitorGameConnect = registerPlugin("CapacitorGameConnect", {
    web: () => Promise.resolve().then(() => (init_web3(), web_exports3)).then((m) => new m.CapacitorGameConnectWeb())
  });

  // node_modules/@capacitor/status-bar/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor/status-bar/dist/esm/definitions.js
  var Style;
  (function(Style2) {
    Style2["Dark"] = "DARK";
    Style2["Light"] = "LIGHT";
    Style2["Default"] = "DEFAULT";
  })(Style || (Style = {}));
  var Animation;
  (function(Animation2) {
    Animation2["None"] = "NONE";
    Animation2["Slide"] = "SLIDE";
    Animation2["Fade"] = "FADE";
  })(Animation || (Animation = {}));

  // node_modules/@capacitor/status-bar/dist/esm/index.js
  var StatusBar = registerPlugin("StatusBar");

  // node_modules/@capacitor/splash-screen/dist/esm/index.js
  init_dist();
  var SplashScreen = registerPlugin("SplashScreen", {
    web: () => Promise.resolve().then(() => (init_web4(), web_exports4)).then((m) => new m.SplashScreenWeb())
  });

  // scripts/consent-flow.mjs
  var ConsentStatus = {
    UNKNOWN: "UNKNOWN",
    REQUIRED: "REQUIRED",
    NOT_REQUIRED: "NOT_REQUIRED",
    OBTAINED: "OBTAINED"
  };
  var PrivacyOptions = {
    UNKNOWN: "UNKNOWN",
    NOT_REQUIRED: "NOT_REQUIRED",
    REQUIRED: "REQUIRED"
  };
  var TrackingStatus = {
    NOT_DETERMINED: "notDetermined",
    RESTRICTED: "restricted",
    DENIED: "denied",
    AUTHORIZED: "authorized"
  };
  function privacyOptionsRequired(info) {
    return !!(info && info.privacyOptionsRequirementStatus === PrivacyOptions.REQUIRED);
  }
  function shouldPresentConsentForm(info) {
    return !!(info && info.isConsentFormAvailable === true && info.status === ConsentStatus.REQUIRED);
  }
  function shouldRequestTracking(trackingStatus, umpPresentsAtt) {
    if (umpPresentsAtt) return false;
    return trackingStatus === TrackingStatus.NOT_DETERMINED;
  }
  function asError(err) {
    if (err instanceof Error) return err;
    return new Error(err == null ? "consent failed" : String(err));
  }
  function confirmedInfo(info) {
    if (!info || typeof info.canRequestAds !== "boolean") return null;
    return info;
  }
  function blankConsent() {
    return {
      canRequestAds: false,
      privacyOptionsRequired: false,
      status: null,
      formShown: false,
      error: null,
      info: null
    };
  }
  function applyInfo(result, info) {
    result.canRequestAds = info.canRequestAds === true;
    result.privacyOptionsRequired = privacyOptionsRequired(info);
    result.status = info.status == null ? null : info.status;
    result.info = info;
    result.error = null;
    return result;
  }
  async function gatherConsent(admob) {
    const result = blankConsent();
    let info;
    try {
      info = confirmedInfo(await admob.requestConsentInfo());
    } catch (err) {
      result.error = asError(err);
      return result;
    }
    if (!info) {
      result.error = new Error("canRequestAds was not confirmed");
      return result;
    }
    if (shouldPresentConsentForm(info)) {
      result.formShown = true;
      try {
        const after = confirmedInfo(await admob.showConsentForm());
        if (after) {
          info = after;
        } else {
          info = confirmedInfo(await admob.requestConsentInfo());
          if (!info) {
            result.error = new Error("canRequestAds was not confirmed");
            return result;
          }
        }
      } catch (err) {
        result.error = asError(err);
        try {
          const reread = confirmedInfo(await admob.requestConsentInfo());
          if (!reread) return result;
          info = reread;
        } catch (err2) {
          result.error = asError(err2);
          return result;
        }
      }
    }
    return applyInfo(result, info);
  }
  async function requestTrackingIfNeeded(admob, umpPresentsAtt) {
    const trace = { requested: false, status: null, error: null, skipped: null };
    if (umpPresentsAtt) {
      trace.skipped = "ump-idfa-message";
      return trace;
    }
    let status;
    try {
      const res = await admob.trackingAuthorizationStatus();
      status = res && res.status;
    } catch (err) {
      trace.error = asError(err);
      trace.skipped = "status-unavailable";
      return trace;
    }
    trace.status = status || null;
    if (!shouldRequestTracking(status, umpPresentsAtt)) {
      trace.skipped = "already-determined";
      return trace;
    }
    try {
      const res = await admob.requestTrackingAuthorization();
      trace.requested = true;
      trace.status = res && res.status || status;
    } catch (err) {
      trace.error = asError(err);
    }
    return trace;
  }
  async function runLaunchPrivacy(admob, options) {
    const umpPresentsAtt = !!(options && options.umpPresentsAtt);
    const consent = await gatherConsent(admob);
    const tracking = await requestTrackingIfNeeded(admob, umpPresentsAtt);
    if (options && typeof options.afterTracking === "function") {
      try {
        await options.afterTracking();
      } catch (err) {
        tracking.afterTrackingError = asError(err);
      }
    }
    return { consent, tracking };
  }
  function createAdGate(admob, options) {
    const useTestAds = !!(options && options.useTestAds);
    const banner = options && options.banner || {};
    const rewarded = options && options.rewarded || {};
    let canRequestAds = false;
    let privacyOptionsFlag = false;
    let ready = false;
    let initPromise = null;
    let initCount = 0;
    let bannerVisible = false;
    let bannerOp = null;
    let adsPaused = false;
    function apply(consent) {
      canRequestAds = !!(consent && consent.canRequestAds === true);
      privacyOptionsFlag = !!(consent && consent.privacyOptionsRequired === true);
    }
    async function ensureInitialized() {
      if (adsPaused || canRequestAds !== true) return false;
      if (ready) return true;
      if (!initPromise) {
        initCount += 1;
        initPromise = Promise.resolve().then(() => admob.initialize({ initializeForTesting: useTestAds })).then(() => {
          ready = true;
        }).catch((err) => {
          initPromise = null;
          ready = false;
          throw err;
        });
      }
      try {
        await initPromise;
        return ready === true && canRequestAds === true && !adsPaused;
      } catch (_) {
        return false;
      }
    }
    async function hideBanner() {
      if (bannerOp) {
        try {
          await bannerOp;
        } catch (_) {
        }
      }
      bannerOp = null;
      if (!bannerVisible) return;
      try {
        await admob.removeBanner();
      } catch (_) {
      }
      bannerVisible = false;
    }
    async function syncBanner() {
      if (adsPaused) {
        return { bannerVisible, initialized: ready, paused: true };
      }
      if (canRequestAds !== true) {
        await hideBanner();
        return { bannerVisible: false, initialized: ready, paused: false };
      }
      const ok = await ensureInitialized();
      if (!ok || canRequestAds !== true || adsPaused) {
        await hideBanner();
        return { bannerVisible: false, initialized: ready, paused: adsPaused };
      }
      if (!bannerVisible && !bannerOp) {
        bannerOp = Promise.resolve().then(() => admob.showBanner(banner)).then(async () => {
          if (canRequestAds !== true || adsPaused) {
            bannerVisible = false;
            try {
              await admob.removeBanner();
            } catch (_) {
            }
            return;
          }
          bannerVisible = true;
        }).catch(() => {
          bannerVisible = false;
        }).finally(() => {
          if (!bannerVisible) bannerOp = null;
        });
      }
      if (bannerOp) {
        try {
          await bannerOp;
        } catch (_) {
        }
      }
      return { bannerVisible, initialized: ready, paused: false };
    }
    async function showRewarded() {
      if (adsPaused || canRequestAds !== true) return false;
      const ok = await ensureInitialized();
      if (!ok || adsPaused || canRequestAds !== true) return false;
      try {
        await admob.prepareRewardVideoAd(rewarded);
        await admob.showRewardVideoAd();
        return true;
      } catch (_) {
        return false;
      }
    }
    async function openPrivacySettings() {
      adsPaused = true;
      try {
        let info;
        try {
          info = confirmedInfo(await admob.requestConsentInfo());
        } catch (err) {
          canRequestAds = false;
          return { shown: false, canRequestAds: false, privacyOptionsRequired: privacyOptionsFlag, error: asError(err) };
        }
        if (!info) {
          canRequestAds = false;
          return {
            shown: false,
            canRequestAds: false,
            privacyOptionsRequired: privacyOptionsFlag,
            error: new Error("canRequestAds was not confirmed")
          };
        }
        privacyOptionsFlag = privacyOptionsRequired(info);
        canRequestAds = info.canRequestAds === true;
        if (!privacyOptionsFlag) {
          return { shown: false, canRequestAds, privacyOptionsRequired: false, error: null };
        }
        try {
          await admob.showPrivacyOptionsForm();
        } catch (err) {
          try {
            const reread = confirmedInfo(await admob.requestConsentInfo());
            if (!reread) canRequestAds = false;
            else {
              canRequestAds = reread.canRequestAds === true;
              privacyOptionsFlag = privacyOptionsRequired(reread);
            }
          } catch (_) {
            canRequestAds = false;
          }
          return {
            shown: false,
            canRequestAds,
            privacyOptionsRequired: privacyOptionsFlag,
            error: asError(err)
          };
        }
        try {
          const after = confirmedInfo(await admob.requestConsentInfo());
          if (!after) canRequestAds = false;
          else {
            canRequestAds = after.canRequestAds === true;
            privacyOptionsFlag = privacyOptionsRequired(after);
          }
        } catch (_) {
          canRequestAds = false;
        }
        return { shown: true, canRequestAds, privacyOptionsRequired: privacyOptionsFlag, error: null };
      } finally {
        adsPaused = false;
        try {
          await syncBanner();
        } catch (_) {
        }
      }
    }
    function snapshot() {
      return {
        canRequestAds,
        privacyOptionsRequired: privacyOptionsFlag,
        ready,
        bannerVisible,
        initCount,
        adsPaused
      };
    }
    return { apply, syncBanner, showRewarded, openPrivacySettings, snapshot };
  }
  async function completeNativeLaunch(admob, gate, options) {
    const privacy = await runLaunchPrivacy(admob, options || {});
    gate.apply(privacy.consent);
    let ads = { bannerVisible: false, initialized: false, paused: false };
    try {
      ads = await gate.syncBanner();
    } catch (err) {
      privacy.adsError = asError(err);
    }
    return { ...privacy, ads };
  }

  // scripts/native-bridge.js
  var USE_TEST_ADS = false;
  var ADMOB = {
    // Google official TEST app / unit IDs (iOS). Used only when USE_TEST_ADS is true.
    TEST_APP_ID: "ca-app-pub-3940256099942544~1458002511",
    TEST_BANNER: "ca-app-pub-3940256099942544/2934735716",
    TEST_REWARDED: "ca-app-pub-3940256099942544/1712485313",
    // Snack Laps AdMob account. App ID must also match GADApplicationIdentifier.
    REAL_APP_ID: "ca-app-pub-6414962483147556~2280759881",
    REAL_BANNER: "ca-app-pub-6414962483147556/7715638137",
    REAL_REWARDED: "ca-app-pub-6414962483147556/1372224089"
  };
  var GAME_CENTER = {
    // PLACEHOLDER — create this classic leaderboard in App Store Connect → Game Center
    LEADERBOARD_ID: "snacklaps.highscore"
  };
  var UMP_PRESENTS_ATT = false;
  var CONSENT_INFO_TIMEOUT_MS = 15e3;
  function isNative() {
    try {
      return !!(Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
    } catch (_) {
      return false;
    }
  }
  function bannerId() {
    return USE_TEST_ADS ? ADMOB.TEST_BANNER : ADMOB.REAL_BANNER;
  }
  function rewardedId() {
    return USE_TEST_ADS ? ADMOB.TEST_REWARDED : ADMOB.REAL_REWARDED;
  }
  var adGate = null;
  var launchPromise = null;
  var privacyBusy = false;
  function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("consent info timed out")), ms);
      Promise.resolve(promise).then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        }
      );
    });
  }
  function privacyPreviewRequested() {
    try {
      return new URLSearchParams(window.location.search).get("privacyPreview") === "1";
    } catch (_) {
      return false;
    }
  }
  function setPrivacyNote(text) {
    document.querySelectorAll(".privacyNote").forEach((el) => {
      el.textContent = text || "";
    });
  }
  function createNativeAdMob() {
    return {
      requestConsentInfo() {
        return withTimeout(
          AdMob.requestConsentInfo({ tagForUnderAgeOfConsent: false }),
          CONSENT_INFO_TIMEOUT_MS
        );
      },
      showConsentForm() {
        return AdMob.showConsentForm();
      },
      showPrivacyOptionsForm() {
        return AdMob.showPrivacyOptionsForm();
      },
      trackingAuthorizationStatus() {
        return AdMob.trackingAuthorizationStatus();
      },
      requestTrackingAuthorization() {
        return AdMob.requestTrackingAuthorization();
      },
      initialize(opts) {
        return AdMob.initialize(opts || { initializeForTesting: USE_TEST_ADS });
      },
      showBanner(opts) {
        const adEl = document.getElementById("ad");
        if (adEl) {
          adEl.style.visibility = "hidden";
          adEl.style.pointerEvents = "none";
          adEl.setAttribute("aria-hidden", "true");
          adEl.innerHTML = "";
        }
        return AdMob.showBanner(opts);
      },
      removeBanner() {
        return AdMob.removeBanner();
      },
      prepareRewardVideoAd(opts) {
        return AdMob.prepareRewardVideoAd(opts);
      },
      showRewardVideoAd() {
        return AdMob.showRewardVideoAd();
      }
    };
  }
  async function initAudioSession() {
    try {
      if (navigator.audioSession) navigator.audioSession.type = "playback";
    } catch (_) {
    }
  }
  async function initStatusChrome() {
    try {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setOverlaysWebView({ overlay: true });
    } catch (_) {
    }
    try {
      await SplashScreen.hide();
    } catch (_) {
    }
  }
  async function initGameCenter() {
    try {
      const user = await CapacitorGameConnect.signIn();
      gcSignedIn = true;
      console.info("[SnackNative] Game Center signed in", user && user.player_name);
    } catch (err) {
      gcSignedIn = false;
      console.warn("[SnackNative] Game Center sign-in failed", err);
    }
  }
  var gcSignedIn = false;
  async function showRewardedAdNative() {
    try {
      if (launchPromise) {
        try {
          await launchPromise;
        } catch (_) {
        }
      }
      if (!adGate) return false;
      return await adGate.showRewarded();
    } catch (err) {
      console.warn("[SnackNative] rewarded ad failed/dismissed", err);
      return false;
    }
  }
  async function submitBestScore(score) {
    if (!isNative() || !(score > 0)) return;
    try {
      if (!gcSignedIn) {
        try {
          await CapacitorGameConnect.signIn();
          gcSignedIn = true;
        } catch (_) {
        }
      }
      await CapacitorGameConnect.submitScore({
        leaderboardID: GAME_CENTER.LEADERBOARD_ID,
        totalScoreAmount: Math.floor(score)
      });
    } catch (err) {
      console.warn("[SnackNative] submitScore failed", err);
    }
  }
  async function showGlobalLeaderboard() {
    if (!isNative()) {
      alert("Global Leaderboard is available in the iPhone app via Game Center.");
      return;
    }
    try {
      if (!gcSignedIn) {
        await CapacitorGameConnect.signIn();
        gcSignedIn = true;
      }
      await CapacitorGameConnect.showLeaderboard({
        leaderboardID: GAME_CENTER.LEADERBOARD_ID
      });
    } catch (err) {
      console.warn("[SnackNative] showLeaderboard failed", err);
      alert("Could not open Game Center. Make sure you are signed into Game Center on this iPhone.");
    }
  }
  async function haptic(kind) {
    if (!isNative()) return;
    try {
      if (kind === "eat") {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (kind === "crash") {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (kind === "unlock" || kind === "scene") {
        await Haptics.notification({
          type: kind === "unlock" ? NotificationType.Success : NotificationType.Warning
        });
      } else {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
    } catch (_) {
    }
  }
  function wirePrivacyControls() {
    if (!isNative() && privacyPreviewRequested()) {
      document.documentElement.classList.add("native-app");
      document.body.classList.add("native-app");
    }
    document.querySelectorAll(".privacyBtn").forEach((btn) => {
      if (btn.dataset.bound === "1") return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", (event) => {
        onPrivacyTap(event).catch(() => {
        });
      });
    });
  }
  async function onPrivacyTap(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!isNative()) return;
    if (privacyBusy) return;
    privacyBusy = true;
    try {
      if (launchPromise) {
        try {
          await launchPromise;
        } catch (_) {
        }
      }
      if (!adGate) {
        setPrivacyNote("Could not open ad settings. You can keep playing.");
        return;
      }
      const result = await adGate.openPrivacySettings();
      if (result.shown) {
        setPrivacyNote(result.canRequestAds ? "Saved. Ads can still show." : "Saved. Ads are off. You can keep playing.");
      } else if (result.error) {
        setPrivacyNote("Could not open ad settings. You can keep playing.");
      } else {
        setPrivacyNote("No ad-privacy form is required right now.");
      }
    } catch (_) {
      setPrivacyNote("Could not open ad settings. You can keep playing.");
    } finally {
      privacyBusy = false;
    }
  }
  async function init() {
    wirePrivacyControls();
    if (!isNative()) return;
    document.documentElement.classList.add("native-app");
    document.body.classList.add("native-app");
    const admob = createNativeAdMob();
    adGate = createAdGate(admob, {
      useTestAds: USE_TEST_ADS,
      banner: {
        adId: bannerId(),
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: USE_TEST_ADS
      },
      rewarded: {
        adId: rewardedId(),
        isTesting: USE_TEST_ADS
      }
    });
    launchPromise = (async () => {
      await initAudioSession();
      await initStatusChrome();
      await completeNativeLaunch(admob, adGate, {
        umpPresentsAtt: UMP_PRESENTS_ATT,
        afterTracking: () => initGameCenter()
      });
    })();
    try {
      await launchPromise;
    } catch (err) {
      console.warn("[SnackNative] startup privacy flow failed", err);
    }
  }
  var SnackNative = {
    isNative,
    init,
    showRewardedAd: showRewardedAdNative,
    submitBestScore,
    showGlobalLeaderboard,
    haptic,
    config: { ADMOB, GAME_CENTER, USE_TEST_ADS, UMP_PRESENTS_ATT }
  };
  window.SnackNative = SnackNative;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init().catch((e) => console.warn(e));
    });
  } else {
    init().catch((e) => console.warn(e));
  }
  var native_bridge_default = SnackNative;
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
