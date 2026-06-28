//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, { get: (a, b) => (typeof require !== "undefined" ? require : a)[b] }) : x)(function(x) {
	if (typeof require !== "undefined") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + x + "\" in an environment that doesn't expose the `require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules for more details.");
});
//#endregion
//#region node_modules/.pnpm/ms@2.1.3/node_modules/ms/index.js
var require_ms = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Helpers.
	*/
	var s = 1e3;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;
	/**
	* Parse or format the given `val`.
	*
	* Options:
	*
	*  - `long` verbose formatting [false]
	*
	* @param {String|Number} val
	* @param {Object} [options]
	* @throws {Error} throw an error if val is not a non-empty string or a number
	* @return {String|Number}
	* @api public
	*/
	module.exports = function(val, options) {
		options = options || {};
		var type = typeof val;
		if (type === "string" && val.length > 0) return parse(val);
		else if (type === "number" && isFinite(val)) return options.long ? fmtLong(val) : fmtShort(val);
		throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
	};
	/**
	* Parse the given `str` and return milliseconds.
	*
	* @param {String} str
	* @return {Number}
	* @api private
	*/
	function parse(str) {
		str = String(str);
		if (str.length > 100) return;
		var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
		if (!match) return;
		var n = parseFloat(match[1]);
		switch ((match[2] || "ms").toLowerCase()) {
			case "years":
			case "year":
			case "yrs":
			case "yr":
			case "y": return n * y;
			case "weeks":
			case "week":
			case "w": return n * w;
			case "days":
			case "day":
			case "d": return n * d;
			case "hours":
			case "hour":
			case "hrs":
			case "hr":
			case "h": return n * h;
			case "minutes":
			case "minute":
			case "mins":
			case "min":
			case "m": return n * m;
			case "seconds":
			case "second":
			case "secs":
			case "sec":
			case "s": return n * s;
			case "milliseconds":
			case "millisecond":
			case "msecs":
			case "msec":
			case "ms": return n;
			default: return;
		}
	}
	/**
	* Short format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtShort(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return Math.round(ms / d) + "d";
		if (msAbs >= h) return Math.round(ms / h) + "h";
		if (msAbs >= m) return Math.round(ms / m) + "m";
		if (msAbs >= s) return Math.round(ms / s) + "s";
		return ms + "ms";
	}
	/**
	* Long format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtLong(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return plural(ms, msAbs, d, "day");
		if (msAbs >= h) return plural(ms, msAbs, h, "hour");
		if (msAbs >= m) return plural(ms, msAbs, m, "minute");
		if (msAbs >= s) return plural(ms, msAbs, s, "second");
		return ms + " ms";
	}
	/**
	* Pluralization helper.
	*/
	function plural(ms, msAbs, n, name) {
		var isPlural = msAbs >= n * 1.5;
		return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
	}
}));
//#endregion
//#region node_modules/.pnpm/debug@4.4.3/node_modules/debug/src/common.js
var require_common = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the common logic for both the Node.js and web browser
	* implementations of `debug()`.
	*/
	function setup(env) {
		createDebug.debug = createDebug;
		createDebug.default = createDebug;
		createDebug.coerce = coerce;
		createDebug.disable = disable;
		createDebug.enable = enable;
		createDebug.enabled = enabled;
		createDebug.humanize = require_ms();
		createDebug.destroy = destroy;
		Object.keys(env).forEach((key) => {
			createDebug[key] = env[key];
		});
		/**
		* The currently active debug mode names, and names to skip.
		*/
		createDebug.names = [];
		createDebug.skips = [];
		/**
		* Map of special "%n" handling functions, for the debug "format" argument.
		*
		* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
		*/
		createDebug.formatters = {};
		/**
		* Selects a color for a debug namespace
		* @param {String} namespace The namespace string for the debug instance to be colored
		* @return {Number|String} An ANSI color code for the given namespace
		* @api private
		*/
		function selectColor(namespace) {
			let hash = 0;
			for (let i = 0; i < namespace.length; i++) {
				hash = (hash << 5) - hash + namespace.charCodeAt(i);
				hash |= 0;
			}
			return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
		}
		createDebug.selectColor = selectColor;
		/**
		* Create a debugger with the given `namespace`.
		*
		* @param {String} namespace
		* @return {Function}
		* @api public
		*/
		function createDebug(namespace) {
			let prevTime;
			let enableOverride = null;
			let namespacesCache;
			let enabledCache;
			function debug(...args) {
				if (!debug.enabled) return;
				const self = debug;
				const curr = Number(/* @__PURE__ */ new Date());
				self.diff = curr - (prevTime || curr);
				self.prev = prevTime;
				self.curr = curr;
				prevTime = curr;
				args[0] = createDebug.coerce(args[0]);
				if (typeof args[0] !== "string") args.unshift("%O");
				let index = 0;
				args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
					if (match === "%%") return "%";
					index++;
					const formatter = createDebug.formatters[format];
					if (typeof formatter === "function") {
						const val = args[index];
						match = formatter.call(self, val);
						args.splice(index, 1);
						index--;
					}
					return match;
				});
				createDebug.formatArgs.call(self, args);
				(self.log || createDebug.log).apply(self, args);
			}
			debug.namespace = namespace;
			debug.useColors = createDebug.useColors();
			debug.color = createDebug.selectColor(namespace);
			debug.extend = extend;
			debug.destroy = createDebug.destroy;
			Object.defineProperty(debug, "enabled", {
				enumerable: true,
				configurable: false,
				get: () => {
					if (enableOverride !== null) return enableOverride;
					if (namespacesCache !== createDebug.namespaces) {
						namespacesCache = createDebug.namespaces;
						enabledCache = createDebug.enabled(namespace);
					}
					return enabledCache;
				},
				set: (v) => {
					enableOverride = v;
				}
			});
			if (typeof createDebug.init === "function") createDebug.init(debug);
			return debug;
		}
		function extend(namespace, delimiter) {
			const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
			newDebug.log = this.log;
			return newDebug;
		}
		/**
		* Enables a debug mode by namespaces. This can include modes
		* separated by a colon and wildcards.
		*
		* @param {String} namespaces
		* @api public
		*/
		function enable(namespaces) {
			createDebug.save(namespaces);
			createDebug.namespaces = namespaces;
			createDebug.names = [];
			createDebug.skips = [];
			const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
			for (const ns of split) if (ns[0] === "-") createDebug.skips.push(ns.slice(1));
			else createDebug.names.push(ns);
		}
		/**
		* Checks if the given string matches a namespace template, honoring
		* asterisks as wildcards.
		*
		* @param {String} search
		* @param {String} template
		* @return {Boolean}
		*/
		function matchesTemplate(search, template) {
			let searchIndex = 0;
			let templateIndex = 0;
			let starIndex = -1;
			let matchIndex = 0;
			while (searchIndex < search.length) if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) if (template[templateIndex] === "*") {
				starIndex = templateIndex;
				matchIndex = searchIndex;
				templateIndex++;
			} else {
				searchIndex++;
				templateIndex++;
			}
			else if (starIndex !== -1) {
				templateIndex = starIndex + 1;
				matchIndex++;
				searchIndex = matchIndex;
			} else return false;
			while (templateIndex < template.length && template[templateIndex] === "*") templateIndex++;
			return templateIndex === template.length;
		}
		/**
		* Disable debug output.
		*
		* @return {String} namespaces
		* @api public
		*/
		function disable() {
			const namespaces = [...createDebug.names, ...createDebug.skips.map((namespace) => "-" + namespace)].join(",");
			createDebug.enable("");
			return namespaces;
		}
		/**
		* Returns true if the given mode name is enabled, false otherwise.
		*
		* @param {String} name
		* @return {Boolean}
		* @api public
		*/
		function enabled(name) {
			for (const skip of createDebug.skips) if (matchesTemplate(name, skip)) return false;
			for (const ns of createDebug.names) if (matchesTemplate(name, ns)) return true;
			return false;
		}
		/**
		* Coerce `val`.
		*
		* @param {Mixed} val
		* @return {Mixed}
		* @api private
		*/
		function coerce(val) {
			if (val instanceof Error) return val.stack || val.message;
			return val;
		}
		/**
		* XXX DO NOT USE. This is a temporary stub function.
		* XXX It WILL be removed in the next major release.
		*/
		function destroy() {
			console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
		}
		createDebug.enable(createDebug.load());
		return createDebug;
	}
	module.exports = setup;
}));
//#endregion
//#region src/consts.ts
var import_browser = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the web browser implementation of `debug()`.
	*/
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = localstorage();
	exports.destroy = (() => {
		let warned = false;
		return () => {
			if (!warned) {
				warned = true;
				console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
			}
		};
	})();
	/**
	* Colors.
	*/
	exports.colors = [
		"#0000CC",
		"#0000FF",
		"#0033CC",
		"#0033FF",
		"#0066CC",
		"#0066FF",
		"#0099CC",
		"#0099FF",
		"#00CC00",
		"#00CC33",
		"#00CC66",
		"#00CC99",
		"#00CCCC",
		"#00CCFF",
		"#3300CC",
		"#3300FF",
		"#3333CC",
		"#3333FF",
		"#3366CC",
		"#3366FF",
		"#3399CC",
		"#3399FF",
		"#33CC00",
		"#33CC33",
		"#33CC66",
		"#33CC99",
		"#33CCCC",
		"#33CCFF",
		"#6600CC",
		"#6600FF",
		"#6633CC",
		"#6633FF",
		"#66CC00",
		"#66CC33",
		"#9900CC",
		"#9900FF",
		"#9933CC",
		"#9933FF",
		"#99CC00",
		"#99CC33",
		"#CC0000",
		"#CC0033",
		"#CC0066",
		"#CC0099",
		"#CC00CC",
		"#CC00FF",
		"#CC3300",
		"#CC3333",
		"#CC3366",
		"#CC3399",
		"#CC33CC",
		"#CC33FF",
		"#CC6600",
		"#CC6633",
		"#CC9900",
		"#CC9933",
		"#CCCC00",
		"#CCCC33",
		"#FF0000",
		"#FF0033",
		"#FF0066",
		"#FF0099",
		"#FF00CC",
		"#FF00FF",
		"#FF3300",
		"#FF3333",
		"#FF3366",
		"#FF3399",
		"#FF33CC",
		"#FF33FF",
		"#FF6600",
		"#FF6633",
		"#FF9900",
		"#FF9933",
		"#FFCC00",
		"#FFCC33"
	];
	/**
	* Currently only WebKit-based Web Inspectors, Firefox >= v31,
	* and the Firebug extension (any Firefox version) are known
	* to support "%c" CSS customizations.
	*
	* TODO: add a `localStorage` variable to explicitly enable/disable colors
	*/
	function useColors() {
		if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) return true;
		if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) return false;
		let m;
		return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
	}
	/**
	* Colorize log arguments if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
		if (!this.useColors) return;
		const c = "color: " + this.color;
		args.splice(1, 0, c, "color: inherit");
		let index = 0;
		let lastC = 0;
		args[0].replace(/%[a-zA-Z%]/g, (match) => {
			if (match === "%%") return;
			index++;
			if (match === "%c") lastC = index;
		});
		args.splice(lastC, 0, c);
	}
	/**
	* Invokes `console.debug()` when available.
	* No-op when `console.debug` is not a "function".
	* If `console.debug` is not available, falls back
	* to `console.log`.
	*
	* @api public
	*/
	exports.log = console.debug || console.log || (() => {});
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		try {
			if (namespaces) exports.storage.setItem("debug", namespaces);
			else exports.storage.removeItem("debug");
		} catch (error) {}
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		let r;
		try {
			r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
		} catch (error) {}
		if (!r && typeof process !== "undefined" && "env" in process) r = process.env.DEBUG;
		return r;
	}
	/**
	* Localstorage attempts to return the localstorage.
	*
	* This is necessary because safari throws
	* when a user disables cookies/localstorage
	* and you attempt to access it.
	*
	* @return {LocalStorage}
	* @api private
	*/
	function localstorage() {
		try {
			return localStorage;
		} catch (error) {}
	}
	module.exports = require_common()(exports);
	const { formatters } = module.exports;
	/**
	* Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	*/
	formatters.j = function(v) {
		try {
			return JSON.stringify(v);
		} catch (error) {
			return "[UnexpectedJSONParseError]: " + error.message;
		}
	};
})))());
let DAVNamespace = /* @__PURE__ */ function(DAVNamespace) {
	DAVNamespace["CALENDAR_SERVER"] = "http://calendarserver.org/ns/";
	DAVNamespace["CALDAV_APPLE"] = "http://apple.com/ns/ical/";
	DAVNamespace["CALDAV"] = "urn:ietf:params:xml:ns:caldav";
	DAVNamespace["CARDDAV"] = "urn:ietf:params:xml:ns:carddav";
	DAVNamespace["DAV"] = "DAV:";
	return DAVNamespace;
}({});
const DAVAttributeMap = {
	["urn:ietf:params:xml:ns:caldav"]: "xmlns:c",
	["urn:ietf:params:xml:ns:carddav"]: "xmlns:card",
	["http://calendarserver.org/ns/"]: "xmlns:cs",
	["http://apple.com/ns/ical/"]: "xmlns:ca",
	["DAV:"]: "xmlns:d"
};
let DAVNamespaceShort = /* @__PURE__ */ function(DAVNamespaceShort) {
	DAVNamespaceShort["CALDAV"] = "c";
	DAVNamespaceShort["CARDDAV"] = "card";
	DAVNamespaceShort["CALENDAR_SERVER"] = "cs";
	DAVNamespaceShort["CALDAV_APPLE"] = "ca";
	DAVNamespaceShort["DAV"] = "d";
	return DAVNamespaceShort;
}({});
let ICALObjects = /* @__PURE__ */ function(ICALObjects) {
	ICALObjects["VEVENT"] = "VEVENT";
	ICALObjects["VTODO"] = "VTODO";
	ICALObjects["VJOURNAL"] = "VJOURNAL";
	ICALObjects["VFREEBUSY"] = "VFREEBUSY";
	ICALObjects["VTIMEZONE"] = "VTIMEZONE";
	ICALObjects["VALARM"] = "VALARM";
	return ICALObjects;
}({});
//#endregion
//#region node_modules/.pnpm/sax@1.4.4/node_modules/sax/lib/sax.js
var require_sax = /* @__PURE__ */ __commonJSMin(((exports) => {
	(function(sax) {
		sax.parser = function(strict, opt) {
			return new SAXParser(strict, opt);
		};
		sax.SAXParser = SAXParser;
		sax.SAXStream = SAXStream;
		sax.createStream = createStream;
		sax.MAX_BUFFER_LENGTH = 64 * 1024;
		var buffers = [
			"comment",
			"sgmlDecl",
			"textNode",
			"tagName",
			"doctype",
			"procInstName",
			"procInstBody",
			"entity",
			"attribName",
			"attribValue",
			"cdata",
			"script"
		];
		sax.EVENTS = [
			"text",
			"processinginstruction",
			"sgmldeclaration",
			"doctype",
			"comment",
			"opentagstart",
			"attribute",
			"opentag",
			"closetag",
			"opencdata",
			"cdata",
			"closecdata",
			"error",
			"end",
			"ready",
			"script",
			"opennamespace",
			"closenamespace"
		];
		function SAXParser(strict, opt) {
			if (!(this instanceof SAXParser)) return new SAXParser(strict, opt);
			var parser = this;
			clearBuffers(parser);
			parser.q = parser.c = "";
			parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH;
			parser.opt = opt || {};
			parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags;
			parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase";
			parser.tags = [];
			parser.closed = parser.closedRoot = parser.sawRoot = false;
			parser.tag = parser.error = null;
			parser.strict = !!strict;
			parser.noscript = !!(strict || parser.opt.noscript);
			parser.state = S.BEGIN;
			parser.strictEntities = parser.opt.strictEntities;
			parser.ENTITIES = parser.strictEntities ? Object.create(sax.XML_ENTITIES) : Object.create(sax.ENTITIES);
			parser.attribList = [];
			if (parser.opt.xmlns) parser.ns = Object.create(rootNS);
			if (parser.opt.unquotedAttributeValues === void 0) parser.opt.unquotedAttributeValues = !strict;
			parser.trackPosition = parser.opt.position !== false;
			if (parser.trackPosition) parser.position = parser.line = parser.column = 0;
			emit(parser, "onready");
		}
		if (!Object.create) Object.create = function(o) {
			function F() {}
			F.prototype = o;
			return new F();
		};
		if (!Object.keys) Object.keys = function(o) {
			var a = [];
			for (var i in o) if (o.hasOwnProperty(i)) a.push(i);
			return a;
		};
		function checkBufferLength(parser) {
			var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10);
			var maxActual = 0;
			for (var i = 0, l = buffers.length; i < l; i++) {
				var len = parser[buffers[i]].length;
				if (len > maxAllowed) switch (buffers[i]) {
					case "textNode":
						closeText(parser);
						break;
					case "cdata":
						emitNode(parser, "oncdata", parser.cdata);
						parser.cdata = "";
						break;
					case "script":
						emitNode(parser, "onscript", parser.script);
						parser.script = "";
						break;
					default: error(parser, "Max buffer length exceeded: " + buffers[i]);
				}
				maxActual = Math.max(maxActual, len);
			}
			parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH - maxActual + parser.position;
		}
		function clearBuffers(parser) {
			for (var i = 0, l = buffers.length; i < l; i++) parser[buffers[i]] = "";
		}
		function flushBuffers(parser) {
			closeText(parser);
			if (parser.cdata !== "") {
				emitNode(parser, "oncdata", parser.cdata);
				parser.cdata = "";
			}
			if (parser.script !== "") {
				emitNode(parser, "onscript", parser.script);
				parser.script = "";
			}
		}
		SAXParser.prototype = {
			end: function() {
				end(this);
			},
			write,
			resume: function() {
				this.error = null;
				return this;
			},
			close: function() {
				return this.write(null);
			},
			flush: function() {
				flushBuffers(this);
			}
		};
		var Stream;
		try {
			Stream = __require("stream").Stream;
		} catch (ex) {
			Stream = function() {};
		}
		if (!Stream) Stream = function() {};
		var streamWraps = sax.EVENTS.filter(function(ev) {
			return ev !== "error" && ev !== "end";
		});
		function createStream(strict, opt) {
			return new SAXStream(strict, opt);
		}
		function SAXStream(strict, opt) {
			if (!(this instanceof SAXStream)) return new SAXStream(strict, opt);
			Stream.apply(this);
			this._parser = new SAXParser(strict, opt);
			this.writable = true;
			this.readable = true;
			var me = this;
			this._parser.onend = function() {
				me.emit("end");
			};
			this._parser.onerror = function(er) {
				me.emit("error", er);
				me._parser.error = null;
			};
			this._decoder = null;
			streamWraps.forEach(function(ev) {
				Object.defineProperty(me, "on" + ev, {
					get: function() {
						return me._parser["on" + ev];
					},
					set: function(h) {
						if (!h) {
							me.removeAllListeners(ev);
							me._parser["on" + ev] = h;
							return h;
						}
						me.on(ev, h);
					},
					enumerable: true,
					configurable: false
				});
			});
		}
		SAXStream.prototype = Object.create(Stream.prototype, { constructor: { value: SAXStream } });
		SAXStream.prototype.write = function(data) {
			if (typeof Buffer === "function" && typeof Buffer.isBuffer === "function" && Buffer.isBuffer(data)) {
				if (!this._decoder) this._decoder = new TextDecoder("utf8");
				data = this._decoder.decode(data, { stream: true });
			}
			this._parser.write(data.toString());
			this.emit("data", data);
			return true;
		};
		SAXStream.prototype.end = function(chunk) {
			if (chunk && chunk.length) this.write(chunk);
			if (this._decoder) {
				var remaining = this._decoder.decode();
				if (remaining) {
					this._parser.write(remaining);
					this.emit("data", remaining);
				}
			}
			this._parser.end();
			return true;
		};
		SAXStream.prototype.on = function(ev, handler) {
			var me = this;
			if (!me._parser["on" + ev] && streamWraps.indexOf(ev) !== -1) me._parser["on" + ev] = function() {
				var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
				args.splice(0, 0, ev);
				me.emit.apply(me, args);
			};
			return Stream.prototype.on.call(me, ev, handler);
		};
		var CDATA = "[CDATA[";
		var DOCTYPE = "DOCTYPE";
		var XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
		var XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
		var rootNS = {
			xml: XML_NAMESPACE,
			xmlns: XMLNS_NAMESPACE
		};
		var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
		var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
		var entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
		var entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
		function isWhitespace(c) {
			return c === " " || c === "\n" || c === "\r" || c === "	";
		}
		function isQuote(c) {
			return c === "\"" || c === "'";
		}
		function isAttribEnd(c) {
			return c === ">" || isWhitespace(c);
		}
		function isMatch(regex, c) {
			return regex.test(c);
		}
		function notMatch(regex, c) {
			return !isMatch(regex, c);
		}
		var S = 0;
		sax.STATE = {
			BEGIN: S++,
			BEGIN_WHITESPACE: S++,
			TEXT: S++,
			TEXT_ENTITY: S++,
			OPEN_WAKA: S++,
			SGML_DECL: S++,
			SGML_DECL_QUOTED: S++,
			DOCTYPE: S++,
			DOCTYPE_QUOTED: S++,
			DOCTYPE_DTD: S++,
			DOCTYPE_DTD_QUOTED: S++,
			COMMENT_STARTING: S++,
			COMMENT: S++,
			COMMENT_ENDING: S++,
			COMMENT_ENDED: S++,
			CDATA: S++,
			CDATA_ENDING: S++,
			CDATA_ENDING_2: S++,
			PROC_INST: S++,
			PROC_INST_BODY: S++,
			PROC_INST_ENDING: S++,
			OPEN_TAG: S++,
			OPEN_TAG_SLASH: S++,
			ATTRIB: S++,
			ATTRIB_NAME: S++,
			ATTRIB_NAME_SAW_WHITE: S++,
			ATTRIB_VALUE: S++,
			ATTRIB_VALUE_QUOTED: S++,
			ATTRIB_VALUE_CLOSED: S++,
			ATTRIB_VALUE_UNQUOTED: S++,
			ATTRIB_VALUE_ENTITY_Q: S++,
			ATTRIB_VALUE_ENTITY_U: S++,
			CLOSE_TAG: S++,
			CLOSE_TAG_SAW_WHITE: S++,
			SCRIPT: S++,
			SCRIPT_ENDING: S++
		};
		sax.XML_ENTITIES = {
			amp: "&",
			gt: ">",
			lt: "<",
			quot: "\"",
			apos: "'"
		};
		sax.ENTITIES = {
			amp: "&",
			gt: ">",
			lt: "<",
			quot: "\"",
			apos: "'",
			AElig: 198,
			Aacute: 193,
			Acirc: 194,
			Agrave: 192,
			Aring: 197,
			Atilde: 195,
			Auml: 196,
			Ccedil: 199,
			ETH: 208,
			Eacute: 201,
			Ecirc: 202,
			Egrave: 200,
			Euml: 203,
			Iacute: 205,
			Icirc: 206,
			Igrave: 204,
			Iuml: 207,
			Ntilde: 209,
			Oacute: 211,
			Ocirc: 212,
			Ograve: 210,
			Oslash: 216,
			Otilde: 213,
			Ouml: 214,
			THORN: 222,
			Uacute: 218,
			Ucirc: 219,
			Ugrave: 217,
			Uuml: 220,
			Yacute: 221,
			aacute: 225,
			acirc: 226,
			aelig: 230,
			agrave: 224,
			aring: 229,
			atilde: 227,
			auml: 228,
			ccedil: 231,
			eacute: 233,
			ecirc: 234,
			egrave: 232,
			eth: 240,
			euml: 235,
			iacute: 237,
			icirc: 238,
			igrave: 236,
			iuml: 239,
			ntilde: 241,
			oacute: 243,
			ocirc: 244,
			ograve: 242,
			oslash: 248,
			otilde: 245,
			ouml: 246,
			szlig: 223,
			thorn: 254,
			uacute: 250,
			ucirc: 251,
			ugrave: 249,
			uuml: 252,
			yacute: 253,
			yuml: 255,
			copy: 169,
			reg: 174,
			nbsp: 160,
			iexcl: 161,
			cent: 162,
			pound: 163,
			curren: 164,
			yen: 165,
			brvbar: 166,
			sect: 167,
			uml: 168,
			ordf: 170,
			laquo: 171,
			not: 172,
			shy: 173,
			macr: 175,
			deg: 176,
			plusmn: 177,
			sup1: 185,
			sup2: 178,
			sup3: 179,
			acute: 180,
			micro: 181,
			para: 182,
			middot: 183,
			cedil: 184,
			ordm: 186,
			raquo: 187,
			frac14: 188,
			frac12: 189,
			frac34: 190,
			iquest: 191,
			times: 215,
			divide: 247,
			OElig: 338,
			oelig: 339,
			Scaron: 352,
			scaron: 353,
			Yuml: 376,
			fnof: 402,
			circ: 710,
			tilde: 732,
			Alpha: 913,
			Beta: 914,
			Gamma: 915,
			Delta: 916,
			Epsilon: 917,
			Zeta: 918,
			Eta: 919,
			Theta: 920,
			Iota: 921,
			Kappa: 922,
			Lambda: 923,
			Mu: 924,
			Nu: 925,
			Xi: 926,
			Omicron: 927,
			Pi: 928,
			Rho: 929,
			Sigma: 931,
			Tau: 932,
			Upsilon: 933,
			Phi: 934,
			Chi: 935,
			Psi: 936,
			Omega: 937,
			alpha: 945,
			beta: 946,
			gamma: 947,
			delta: 948,
			epsilon: 949,
			zeta: 950,
			eta: 951,
			theta: 952,
			iota: 953,
			kappa: 954,
			lambda: 955,
			mu: 956,
			nu: 957,
			xi: 958,
			omicron: 959,
			pi: 960,
			rho: 961,
			sigmaf: 962,
			sigma: 963,
			tau: 964,
			upsilon: 965,
			phi: 966,
			chi: 967,
			psi: 968,
			omega: 969,
			thetasym: 977,
			upsih: 978,
			piv: 982,
			ensp: 8194,
			emsp: 8195,
			thinsp: 8201,
			zwnj: 8204,
			zwj: 8205,
			lrm: 8206,
			rlm: 8207,
			ndash: 8211,
			mdash: 8212,
			lsquo: 8216,
			rsquo: 8217,
			sbquo: 8218,
			ldquo: 8220,
			rdquo: 8221,
			bdquo: 8222,
			dagger: 8224,
			Dagger: 8225,
			bull: 8226,
			hellip: 8230,
			permil: 8240,
			prime: 8242,
			Prime: 8243,
			lsaquo: 8249,
			rsaquo: 8250,
			oline: 8254,
			frasl: 8260,
			euro: 8364,
			image: 8465,
			weierp: 8472,
			real: 8476,
			trade: 8482,
			alefsym: 8501,
			larr: 8592,
			uarr: 8593,
			rarr: 8594,
			darr: 8595,
			harr: 8596,
			crarr: 8629,
			lArr: 8656,
			uArr: 8657,
			rArr: 8658,
			dArr: 8659,
			hArr: 8660,
			forall: 8704,
			part: 8706,
			exist: 8707,
			empty: 8709,
			nabla: 8711,
			isin: 8712,
			notin: 8713,
			ni: 8715,
			prod: 8719,
			sum: 8721,
			minus: 8722,
			lowast: 8727,
			radic: 8730,
			prop: 8733,
			infin: 8734,
			ang: 8736,
			and: 8743,
			or: 8744,
			cap: 8745,
			cup: 8746,
			int: 8747,
			there4: 8756,
			sim: 8764,
			cong: 8773,
			asymp: 8776,
			ne: 8800,
			equiv: 8801,
			le: 8804,
			ge: 8805,
			sub: 8834,
			sup: 8835,
			nsub: 8836,
			sube: 8838,
			supe: 8839,
			oplus: 8853,
			otimes: 8855,
			perp: 8869,
			sdot: 8901,
			lceil: 8968,
			rceil: 8969,
			lfloor: 8970,
			rfloor: 8971,
			lang: 9001,
			rang: 9002,
			loz: 9674,
			spades: 9824,
			clubs: 9827,
			hearts: 9829,
			diams: 9830
		};
		Object.keys(sax.ENTITIES).forEach(function(key) {
			var e = sax.ENTITIES[key];
			var s = typeof e === "number" ? String.fromCharCode(e) : e;
			sax.ENTITIES[key] = s;
		});
		for (var s in sax.STATE) sax.STATE[sax.STATE[s]] = s;
		S = sax.STATE;
		function emit(parser, event, data) {
			parser[event] && parser[event](data);
		}
		function emitNode(parser, nodeType, data) {
			if (parser.textNode) closeText(parser);
			emit(parser, nodeType, data);
		}
		function closeText(parser) {
			parser.textNode = textopts(parser.opt, parser.textNode);
			if (parser.textNode) emit(parser, "ontext", parser.textNode);
			parser.textNode = "";
		}
		function textopts(opt, text) {
			if (opt.trim) text = text.trim();
			if (opt.normalize) text = text.replace(/\s+/g, " ");
			return text;
		}
		function error(parser, er) {
			closeText(parser);
			if (parser.trackPosition) er += "\nLine: " + parser.line + "\nColumn: " + parser.column + "\nChar: " + parser.c;
			er = new Error(er);
			parser.error = er;
			emit(parser, "onerror", er);
			return parser;
		}
		function end(parser) {
			if (parser.sawRoot && !parser.closedRoot) strictFail(parser, "Unclosed root tag");
			if (parser.state !== S.BEGIN && parser.state !== S.BEGIN_WHITESPACE && parser.state !== S.TEXT) error(parser, "Unexpected end");
			closeText(parser);
			parser.c = "";
			parser.closed = true;
			emit(parser, "onend");
			SAXParser.call(parser, parser.strict, parser.opt);
			return parser;
		}
		function strictFail(parser, message) {
			if (typeof parser !== "object" || !(parser instanceof SAXParser)) throw new Error("bad call to strictFail");
			if (parser.strict) error(parser, message);
		}
		function newTag(parser) {
			if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]();
			var parent = parser.tags[parser.tags.length - 1] || parser;
			var tag = parser.tag = {
				name: parser.tagName,
				attributes: {}
			};
			if (parser.opt.xmlns) tag.ns = parent.ns;
			parser.attribList.length = 0;
			emitNode(parser, "onopentagstart", tag);
		}
		function qname(name, attribute) {
			var qualName = name.indexOf(":") < 0 ? ["", name] : name.split(":");
			var prefix = qualName[0];
			var local = qualName[1];
			if (attribute && name === "xmlns") {
				prefix = "xmlns";
				local = "";
			}
			return {
				prefix,
				local
			};
		}
		function attrib(parser) {
			if (!parser.strict) parser.attribName = parser.attribName[parser.looseCase]();
			if (parser.attribList.indexOf(parser.attribName) !== -1 || parser.tag.attributes.hasOwnProperty(parser.attribName)) {
				parser.attribName = parser.attribValue = "";
				return;
			}
			if (parser.opt.xmlns) {
				var qn = qname(parser.attribName, true);
				var prefix = qn.prefix;
				var local = qn.local;
				if (prefix === "xmlns") if (local === "xml" && parser.attribValue !== XML_NAMESPACE) strictFail(parser, "xml: prefix must be bound to " + XML_NAMESPACE + "\nActual: " + parser.attribValue);
				else if (local === "xmlns" && parser.attribValue !== XMLNS_NAMESPACE) strictFail(parser, "xmlns: prefix must be bound to " + XMLNS_NAMESPACE + "\nActual: " + parser.attribValue);
				else {
					var tag = parser.tag;
					var parent = parser.tags[parser.tags.length - 1] || parser;
					if (tag.ns === parent.ns) tag.ns = Object.create(parent.ns);
					tag.ns[local] = parser.attribValue;
				}
				parser.attribList.push([parser.attribName, parser.attribValue]);
			} else {
				parser.tag.attributes[parser.attribName] = parser.attribValue;
				emitNode(parser, "onattribute", {
					name: parser.attribName,
					value: parser.attribValue
				});
			}
			parser.attribName = parser.attribValue = "";
		}
		function openTag(parser, selfClosing) {
			if (parser.opt.xmlns) {
				var tag = parser.tag;
				var qn = qname(parser.tagName);
				tag.prefix = qn.prefix;
				tag.local = qn.local;
				tag.uri = tag.ns[qn.prefix] || "";
				if (tag.prefix && !tag.uri) {
					strictFail(parser, "Unbound namespace prefix: " + JSON.stringify(parser.tagName));
					tag.uri = qn.prefix;
				}
				var parent = parser.tags[parser.tags.length - 1] || parser;
				if (tag.ns && parent.ns !== tag.ns) Object.keys(tag.ns).forEach(function(p) {
					emitNode(parser, "onopennamespace", {
						prefix: p,
						uri: tag.ns[p]
					});
				});
				for (var i = 0, l = parser.attribList.length; i < l; i++) {
					var nv = parser.attribList[i];
					var name = nv[0];
					var value = nv[1];
					var qualName = qname(name, true);
					var prefix = qualName.prefix;
					var local = qualName.local;
					var uri = prefix === "" ? "" : tag.ns[prefix] || "";
					var a = {
						name,
						value,
						prefix,
						local,
						uri
					};
					if (prefix && prefix !== "xmlns" && !uri) {
						strictFail(parser, "Unbound namespace prefix: " + JSON.stringify(prefix));
						a.uri = prefix;
					}
					parser.tag.attributes[name] = a;
					emitNode(parser, "onattribute", a);
				}
				parser.attribList.length = 0;
			}
			parser.tag.isSelfClosing = !!selfClosing;
			parser.sawRoot = true;
			parser.tags.push(parser.tag);
			emitNode(parser, "onopentag", parser.tag);
			if (!selfClosing) {
				if (!parser.noscript && parser.tagName.toLowerCase() === "script") parser.state = S.SCRIPT;
				else parser.state = S.TEXT;
				parser.tag = null;
				parser.tagName = "";
			}
			parser.attribName = parser.attribValue = "";
			parser.attribList.length = 0;
		}
		function closeTag(parser) {
			if (!parser.tagName) {
				strictFail(parser, "Weird empty close tag.");
				parser.textNode += "</>";
				parser.state = S.TEXT;
				return;
			}
			if (parser.script) {
				if (parser.tagName !== "script") {
					parser.script += "</" + parser.tagName + ">";
					parser.tagName = "";
					parser.state = S.SCRIPT;
					return;
				}
				emitNode(parser, "onscript", parser.script);
				parser.script = "";
			}
			var t = parser.tags.length;
			var tagName = parser.tagName;
			if (!parser.strict) tagName = tagName[parser.looseCase]();
			var closeTo = tagName;
			while (t--) if (parser.tags[t].name !== closeTo) strictFail(parser, "Unexpected close tag");
			else break;
			if (t < 0) {
				strictFail(parser, "Unmatched closing tag: " + parser.tagName);
				parser.textNode += "</" + parser.tagName + ">";
				parser.state = S.TEXT;
				return;
			}
			parser.tagName = tagName;
			var s = parser.tags.length;
			while (s-- > t) {
				var tag = parser.tag = parser.tags.pop();
				parser.tagName = parser.tag.name;
				emitNode(parser, "onclosetag", parser.tagName);
				var x = {};
				for (var i in tag.ns) x[i] = tag.ns[i];
				var parent = parser.tags[parser.tags.length - 1] || parser;
				if (parser.opt.xmlns && tag.ns !== parent.ns) Object.keys(tag.ns).forEach(function(p) {
					var n = tag.ns[p];
					emitNode(parser, "onclosenamespace", {
						prefix: p,
						uri: n
					});
				});
			}
			if (t === 0) parser.closedRoot = true;
			parser.tagName = parser.attribValue = parser.attribName = "";
			parser.attribList.length = 0;
			parser.state = S.TEXT;
		}
		function parseEntity(parser) {
			var entity = parser.entity;
			var entityLC = entity.toLowerCase();
			var num;
			var numStr = "";
			if (parser.ENTITIES[entity]) return parser.ENTITIES[entity];
			if (parser.ENTITIES[entityLC]) return parser.ENTITIES[entityLC];
			entity = entityLC;
			if (entity.charAt(0) === "#") if (entity.charAt(1) === "x") {
				entity = entity.slice(2);
				num = parseInt(entity, 16);
				numStr = num.toString(16);
			} else {
				entity = entity.slice(1);
				num = parseInt(entity, 10);
				numStr = num.toString(10);
			}
			entity = entity.replace(/^0+/, "");
			if (isNaN(num) || numStr.toLowerCase() !== entity || num < 0 || num > 1114111) {
				strictFail(parser, "Invalid character entity");
				return "&" + parser.entity + ";";
			}
			return String.fromCodePoint(num);
		}
		function beginWhiteSpace(parser, c) {
			if (c === "<") {
				parser.state = S.OPEN_WAKA;
				parser.startTagPosition = parser.position;
			} else if (!isWhitespace(c)) {
				strictFail(parser, "Non-whitespace before first tag.");
				parser.textNode = c;
				parser.state = S.TEXT;
			}
		}
		function charAt(chunk, i) {
			var result = "";
			if (i < chunk.length) result = chunk.charAt(i);
			return result;
		}
		function write(chunk) {
			var parser = this;
			if (this.error) throw this.error;
			if (parser.closed) return error(parser, "Cannot write after close. Assign an onready handler.");
			if (chunk === null) return end(parser);
			if (typeof chunk === "object") chunk = chunk.toString();
			var i = 0;
			var c = "";
			while (true) {
				c = charAt(chunk, i++);
				parser.c = c;
				if (!c) break;
				if (parser.trackPosition) {
					parser.position++;
					if (c === "\n") {
						parser.line++;
						parser.column = 0;
					} else parser.column++;
				}
				switch (parser.state) {
					case S.BEGIN:
						parser.state = S.BEGIN_WHITESPACE;
						if (c === "﻿") continue;
						beginWhiteSpace(parser, c);
						continue;
					case S.BEGIN_WHITESPACE:
						beginWhiteSpace(parser, c);
						continue;
					case S.TEXT:
						if (parser.sawRoot && !parser.closedRoot) {
							var starti = i - 1;
							while (c && c !== "<" && c !== "&") {
								c = charAt(chunk, i++);
								if (c && parser.trackPosition) {
									parser.position++;
									if (c === "\n") {
										parser.line++;
										parser.column = 0;
									} else parser.column++;
								}
							}
							parser.textNode += chunk.substring(starti, i - 1);
						}
						if (c === "<" && !(parser.sawRoot && parser.closedRoot && !parser.strict)) {
							parser.state = S.OPEN_WAKA;
							parser.startTagPosition = parser.position;
						} else {
							if (!isWhitespace(c) && (!parser.sawRoot || parser.closedRoot)) strictFail(parser, "Text data outside of root node.");
							if (c === "&") parser.state = S.TEXT_ENTITY;
							else parser.textNode += c;
						}
						continue;
					case S.SCRIPT:
						if (c === "<") parser.state = S.SCRIPT_ENDING;
						else parser.script += c;
						continue;
					case S.SCRIPT_ENDING:
						if (c === "/") parser.state = S.CLOSE_TAG;
						else {
							parser.script += "<" + c;
							parser.state = S.SCRIPT;
						}
						continue;
					case S.OPEN_WAKA:
						if (c === "!") {
							parser.state = S.SGML_DECL;
							parser.sgmlDecl = "";
						} else if (isWhitespace(c)) {} else if (isMatch(nameStart, c)) {
							parser.state = S.OPEN_TAG;
							parser.tagName = c;
						} else if (c === "/") {
							parser.state = S.CLOSE_TAG;
							parser.tagName = "";
						} else if (c === "?") {
							parser.state = S.PROC_INST;
							parser.procInstName = parser.procInstBody = "";
						} else {
							strictFail(parser, "Unencoded <");
							if (parser.startTagPosition + 1 < parser.position) {
								var pad = parser.position - parser.startTagPosition;
								c = new Array(pad).join(" ") + c;
							}
							parser.textNode += "<" + c;
							parser.state = S.TEXT;
						}
						continue;
					case S.SGML_DECL:
						if (parser.sgmlDecl + c === "--") {
							parser.state = S.COMMENT;
							parser.comment = "";
							parser.sgmlDecl = "";
							continue;
						}
						if (parser.doctype && parser.doctype !== true && parser.sgmlDecl) {
							parser.state = S.DOCTYPE_DTD;
							parser.doctype += "<!" + parser.sgmlDecl + c;
							parser.sgmlDecl = "";
						} else if ((parser.sgmlDecl + c).toUpperCase() === CDATA) {
							emitNode(parser, "onopencdata");
							parser.state = S.CDATA;
							parser.sgmlDecl = "";
							parser.cdata = "";
						} else if ((parser.sgmlDecl + c).toUpperCase() === DOCTYPE) {
							parser.state = S.DOCTYPE;
							if (parser.doctype || parser.sawRoot) strictFail(parser, "Inappropriately located doctype declaration");
							parser.doctype = "";
							parser.sgmlDecl = "";
						} else if (c === ">") {
							emitNode(parser, "onsgmldeclaration", parser.sgmlDecl);
							parser.sgmlDecl = "";
							parser.state = S.TEXT;
						} else if (isQuote(c)) {
							parser.state = S.SGML_DECL_QUOTED;
							parser.sgmlDecl += c;
						} else parser.sgmlDecl += c;
						continue;
					case S.SGML_DECL_QUOTED:
						if (c === parser.q) {
							parser.state = S.SGML_DECL;
							parser.q = "";
						}
						parser.sgmlDecl += c;
						continue;
					case S.DOCTYPE:
						if (c === ">") {
							parser.state = S.TEXT;
							emitNode(parser, "ondoctype", parser.doctype);
							parser.doctype = true;
						} else {
							parser.doctype += c;
							if (c === "[") parser.state = S.DOCTYPE_DTD;
							else if (isQuote(c)) {
								parser.state = S.DOCTYPE_QUOTED;
								parser.q = c;
							}
						}
						continue;
					case S.DOCTYPE_QUOTED:
						parser.doctype += c;
						if (c === parser.q) {
							parser.q = "";
							parser.state = S.DOCTYPE;
						}
						continue;
					case S.DOCTYPE_DTD:
						if (c === "]") {
							parser.doctype += c;
							parser.state = S.DOCTYPE;
						} else if (c === "<") {
							parser.state = S.OPEN_WAKA;
							parser.startTagPosition = parser.position;
						} else if (isQuote(c)) {
							parser.doctype += c;
							parser.state = S.DOCTYPE_DTD_QUOTED;
							parser.q = c;
						} else parser.doctype += c;
						continue;
					case S.DOCTYPE_DTD_QUOTED:
						parser.doctype += c;
						if (c === parser.q) {
							parser.state = S.DOCTYPE_DTD;
							parser.q = "";
						}
						continue;
					case S.COMMENT:
						if (c === "-") parser.state = S.COMMENT_ENDING;
						else parser.comment += c;
						continue;
					case S.COMMENT_ENDING:
						if (c === "-") {
							parser.state = S.COMMENT_ENDED;
							parser.comment = textopts(parser.opt, parser.comment);
							if (parser.comment) emitNode(parser, "oncomment", parser.comment);
							parser.comment = "";
						} else {
							parser.comment += "-" + c;
							parser.state = S.COMMENT;
						}
						continue;
					case S.COMMENT_ENDED:
						if (c !== ">") {
							strictFail(parser, "Malformed comment");
							parser.comment += "--" + c;
							parser.state = S.COMMENT;
						} else if (parser.doctype && parser.doctype !== true) parser.state = S.DOCTYPE_DTD;
						else parser.state = S.TEXT;
						continue;
					case S.CDATA:
						var starti = i - 1;
						while (c && c !== "]") {
							c = charAt(chunk, i++);
							if (c && parser.trackPosition) {
								parser.position++;
								if (c === "\n") {
									parser.line++;
									parser.column = 0;
								} else parser.column++;
							}
						}
						parser.cdata += chunk.substring(starti, i - 1);
						if (c === "]") parser.state = S.CDATA_ENDING;
						continue;
					case S.CDATA_ENDING:
						if (c === "]") parser.state = S.CDATA_ENDING_2;
						else {
							parser.cdata += "]" + c;
							parser.state = S.CDATA;
						}
						continue;
					case S.CDATA_ENDING_2:
						if (c === ">") {
							if (parser.cdata) emitNode(parser, "oncdata", parser.cdata);
							emitNode(parser, "onclosecdata");
							parser.cdata = "";
							parser.state = S.TEXT;
						} else if (c === "]") parser.cdata += "]";
						else {
							parser.cdata += "]]" + c;
							parser.state = S.CDATA;
						}
						continue;
					case S.PROC_INST:
						if (c === "?") parser.state = S.PROC_INST_ENDING;
						else if (isWhitespace(c)) parser.state = S.PROC_INST_BODY;
						else parser.procInstName += c;
						continue;
					case S.PROC_INST_BODY:
						if (!parser.procInstBody && isWhitespace(c)) continue;
						else if (c === "?") parser.state = S.PROC_INST_ENDING;
						else parser.procInstBody += c;
						continue;
					case S.PROC_INST_ENDING:
						if (c === ">") {
							emitNode(parser, "onprocessinginstruction", {
								name: parser.procInstName,
								body: parser.procInstBody
							});
							parser.procInstName = parser.procInstBody = "";
							parser.state = S.TEXT;
						} else {
							parser.procInstBody += "?" + c;
							parser.state = S.PROC_INST_BODY;
						}
						continue;
					case S.OPEN_TAG:
						if (isMatch(nameBody, c)) parser.tagName += c;
						else {
							newTag(parser);
							if (c === ">") openTag(parser);
							else if (c === "/") parser.state = S.OPEN_TAG_SLASH;
							else {
								if (!isWhitespace(c)) strictFail(parser, "Invalid character in tag name");
								parser.state = S.ATTRIB;
							}
						}
						continue;
					case S.OPEN_TAG_SLASH:
						if (c === ">") {
							openTag(parser, true);
							closeTag(parser);
						} else {
							strictFail(parser, "Forward-slash in opening tag not followed by >");
							parser.state = S.ATTRIB;
						}
						continue;
					case S.ATTRIB:
						if (isWhitespace(c)) continue;
						else if (c === ">") openTag(parser);
						else if (c === "/") parser.state = S.OPEN_TAG_SLASH;
						else if (isMatch(nameStart, c)) {
							parser.attribName = c;
							parser.attribValue = "";
							parser.state = S.ATTRIB_NAME;
						} else strictFail(parser, "Invalid attribute name");
						continue;
					case S.ATTRIB_NAME:
						if (c === "=") parser.state = S.ATTRIB_VALUE;
						else if (c === ">") {
							strictFail(parser, "Attribute without value");
							parser.attribValue = parser.attribName;
							attrib(parser);
							openTag(parser);
						} else if (isWhitespace(c)) parser.state = S.ATTRIB_NAME_SAW_WHITE;
						else if (isMatch(nameBody, c)) parser.attribName += c;
						else strictFail(parser, "Invalid attribute name");
						continue;
					case S.ATTRIB_NAME_SAW_WHITE:
						if (c === "=") parser.state = S.ATTRIB_VALUE;
						else if (isWhitespace(c)) continue;
						else {
							strictFail(parser, "Attribute without value");
							parser.tag.attributes[parser.attribName] = "";
							parser.attribValue = "";
							emitNode(parser, "onattribute", {
								name: parser.attribName,
								value: ""
							});
							parser.attribName = "";
							if (c === ">") openTag(parser);
							else if (isMatch(nameStart, c)) {
								parser.attribName = c;
								parser.state = S.ATTRIB_NAME;
							} else {
								strictFail(parser, "Invalid attribute name");
								parser.state = S.ATTRIB;
							}
						}
						continue;
					case S.ATTRIB_VALUE:
						if (isWhitespace(c)) continue;
						else if (isQuote(c)) {
							parser.q = c;
							parser.state = S.ATTRIB_VALUE_QUOTED;
						} else {
							if (!parser.opt.unquotedAttributeValues) error(parser, "Unquoted attribute value");
							parser.state = S.ATTRIB_VALUE_UNQUOTED;
							parser.attribValue = c;
						}
						continue;
					case S.ATTRIB_VALUE_QUOTED:
						if (c !== parser.q) {
							if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_Q;
							else parser.attribValue += c;
							continue;
						}
						attrib(parser);
						parser.q = "";
						parser.state = S.ATTRIB_VALUE_CLOSED;
						continue;
					case S.ATTRIB_VALUE_CLOSED:
						if (isWhitespace(c)) parser.state = S.ATTRIB;
						else if (c === ">") openTag(parser);
						else if (c === "/") parser.state = S.OPEN_TAG_SLASH;
						else if (isMatch(nameStart, c)) {
							strictFail(parser, "No whitespace between attributes");
							parser.attribName = c;
							parser.attribValue = "";
							parser.state = S.ATTRIB_NAME;
						} else strictFail(parser, "Invalid attribute name");
						continue;
					case S.ATTRIB_VALUE_UNQUOTED:
						if (!isAttribEnd(c)) {
							if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_U;
							else parser.attribValue += c;
							continue;
						}
						attrib(parser);
						if (c === ">") openTag(parser);
						else parser.state = S.ATTRIB;
						continue;
					case S.CLOSE_TAG:
						if (!parser.tagName) if (isWhitespace(c)) continue;
						else if (notMatch(nameStart, c)) if (parser.script) {
							parser.script += "</" + c;
							parser.state = S.SCRIPT;
						} else strictFail(parser, "Invalid tagname in closing tag.");
						else parser.tagName = c;
						else if (c === ">") closeTag(parser);
						else if (isMatch(nameBody, c)) parser.tagName += c;
						else if (parser.script) {
							parser.script += "</" + parser.tagName + c;
							parser.tagName = "";
							parser.state = S.SCRIPT;
						} else {
							if (!isWhitespace(c)) strictFail(parser, "Invalid tagname in closing tag");
							parser.state = S.CLOSE_TAG_SAW_WHITE;
						}
						continue;
					case S.CLOSE_TAG_SAW_WHITE:
						if (isWhitespace(c)) continue;
						if (c === ">") closeTag(parser);
						else strictFail(parser, "Invalid characters in closing tag");
						continue;
					case S.TEXT_ENTITY:
					case S.ATTRIB_VALUE_ENTITY_Q:
					case S.ATTRIB_VALUE_ENTITY_U:
						var returnState;
						var buffer;
						switch (parser.state) {
							case S.TEXT_ENTITY:
								returnState = S.TEXT;
								buffer = "textNode";
								break;
							case S.ATTRIB_VALUE_ENTITY_Q:
								returnState = S.ATTRIB_VALUE_QUOTED;
								buffer = "attribValue";
								break;
							case S.ATTRIB_VALUE_ENTITY_U:
								returnState = S.ATTRIB_VALUE_UNQUOTED;
								buffer = "attribValue";
								break;
						}
						if (c === ";") {
							var parsedEntity = parseEntity(parser);
							if (parser.opt.unparsedEntities && !Object.values(sax.XML_ENTITIES).includes(parsedEntity)) {
								parser.entity = "";
								parser.state = returnState;
								parser.write(parsedEntity);
							} else {
								parser[buffer] += parsedEntity;
								parser.entity = "";
								parser.state = returnState;
							}
						} else if (isMatch(parser.entity.length ? entityBody : entityStart, c)) parser.entity += c;
						else {
							strictFail(parser, "Invalid character in entity name");
							parser[buffer] += "&" + parser.entity + c;
							parser.entity = "";
							parser.state = returnState;
						}
						continue;
					default: throw new Error(parser, "Unknown state: " + parser.state);
				}
			}
			if (parser.position >= parser.bufferCheckPosition) checkBufferLength(parser);
			return parser;
		}
		/*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
		/* istanbul ignore next */
		if (!String.fromCodePoint) (function() {
			var stringFromCharCode = String.fromCharCode;
			var floor = Math.floor;
			var fromCodePoint = function() {
				var MAX_SIZE = 16384;
				var codeUnits = [];
				var highSurrogate;
				var lowSurrogate;
				var index = -1;
				var length = arguments.length;
				if (!length) return "";
				var result = "";
				while (++index < length) {
					var codePoint = Number(arguments[index]);
					if (!isFinite(codePoint) || codePoint < 0 || codePoint > 1114111 || floor(codePoint) !== codePoint) throw RangeError("Invalid code point: " + codePoint);
					if (codePoint <= 65535) codeUnits.push(codePoint);
					else {
						codePoint -= 65536;
						highSurrogate = (codePoint >> 10) + 55296;
						lowSurrogate = codePoint % 1024 + 56320;
						codeUnits.push(highSurrogate, lowSurrogate);
					}
					if (index + 1 === length || codeUnits.length > MAX_SIZE) {
						result += stringFromCharCode.apply(null, codeUnits);
						codeUnits.length = 0;
					}
				}
				return result;
			};
			/* istanbul ignore next */
			if (Object.defineProperty) Object.defineProperty(String, "fromCodePoint", {
				value: fromCodePoint,
				configurable: true,
				writable: true
			});
			else String.fromCodePoint = fromCodePoint;
		})();
	})(typeof exports === "undefined" ? exports.sax = {} : exports);
}));
//#endregion
//#region node_modules/.pnpm/xml-js@1.6.11/node_modules/xml-js/lib/array-helper.js
var require_array_helper = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = { isArray: function(value) {
		if (Array.isArray) return Array.isArray(value);
		return Object.prototype.toString.call(value) === "[object Array]";
	} };
}));
//#endregion
//#region node_modules/.pnpm/xml-js@1.6.11/node_modules/xml-js/lib/options-helper.js
var require_options_helper = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isArray = require_array_helper().isArray;
	module.exports = {
		copyOptions: function(options) {
			var key, copy = {};
			for (key in options) if (options.hasOwnProperty(key)) copy[key] = options[key];
			return copy;
		},
		ensureFlagExists: function(item, options) {
			if (!(item in options) || typeof options[item] !== "boolean") options[item] = false;
		},
		ensureSpacesExists: function(options) {
			if (!("spaces" in options) || typeof options.spaces !== "number" && typeof options.spaces !== "string") options.spaces = 0;
		},
		ensureAlwaysArrayExists: function(options) {
			if (!("alwaysArray" in options) || typeof options.alwaysArray !== "boolean" && !isArray(options.alwaysArray)) options.alwaysArray = false;
		},
		ensureKeyExists: function(key, options) {
			if (!(key + "Key" in options) || typeof options[key + "Key"] !== "string") options[key + "Key"] = options.compact ? "_" + key : key;
		},
		checkFnExists: function(key, options) {
			return key + "Fn" in options;
		}
	};
}));
//#endregion
//#region node_modules/.pnpm/xml-js@1.6.11/node_modules/xml-js/lib/xml2js.js
var require_xml2js = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var sax = require_sax();
	var expat = {
		on: function() {},
		parse: function() {}
	};
	var helper = require_options_helper();
	var isArray = require_array_helper().isArray;
	var options;
	var pureJsParser = true;
	var currentElement;
	function validateOptions(userOptions) {
		options = helper.copyOptions(userOptions);
		helper.ensureFlagExists("ignoreDeclaration", options);
		helper.ensureFlagExists("ignoreInstruction", options);
		helper.ensureFlagExists("ignoreAttributes", options);
		helper.ensureFlagExists("ignoreText", options);
		helper.ensureFlagExists("ignoreComment", options);
		helper.ensureFlagExists("ignoreCdata", options);
		helper.ensureFlagExists("ignoreDoctype", options);
		helper.ensureFlagExists("compact", options);
		helper.ensureFlagExists("alwaysChildren", options);
		helper.ensureFlagExists("addParent", options);
		helper.ensureFlagExists("trim", options);
		helper.ensureFlagExists("nativeType", options);
		helper.ensureFlagExists("nativeTypeAttributes", options);
		helper.ensureFlagExists("sanitize", options);
		helper.ensureFlagExists("instructionHasAttributes", options);
		helper.ensureFlagExists("captureSpacesBetweenElements", options);
		helper.ensureAlwaysArrayExists(options);
		helper.ensureKeyExists("declaration", options);
		helper.ensureKeyExists("instruction", options);
		helper.ensureKeyExists("attributes", options);
		helper.ensureKeyExists("text", options);
		helper.ensureKeyExists("comment", options);
		helper.ensureKeyExists("cdata", options);
		helper.ensureKeyExists("doctype", options);
		helper.ensureKeyExists("type", options);
		helper.ensureKeyExists("name", options);
		helper.ensureKeyExists("elements", options);
		helper.ensureKeyExists("parent", options);
		helper.checkFnExists("doctype", options);
		helper.checkFnExists("instruction", options);
		helper.checkFnExists("cdata", options);
		helper.checkFnExists("comment", options);
		helper.checkFnExists("text", options);
		helper.checkFnExists("instructionName", options);
		helper.checkFnExists("elementName", options);
		helper.checkFnExists("attributeName", options);
		helper.checkFnExists("attributeValue", options);
		helper.checkFnExists("attributes", options);
		return options;
	}
	function nativeType(value) {
		var nValue = Number(value);
		if (!isNaN(nValue)) return nValue;
		var bValue = value.toLowerCase();
		if (bValue === "true") return true;
		else if (bValue === "false") return false;
		return value;
	}
	function addField(type, value) {
		var key;
		if (options.compact) {
			if (!currentElement[options[type + "Key"]] && (isArray(options.alwaysArray) ? options.alwaysArray.indexOf(options[type + "Key"]) !== -1 : options.alwaysArray)) currentElement[options[type + "Key"]] = [];
			if (currentElement[options[type + "Key"]] && !isArray(currentElement[options[type + "Key"]])) currentElement[options[type + "Key"]] = [currentElement[options[type + "Key"]]];
			if (type + "Fn" in options && typeof value === "string") value = options[type + "Fn"](value, currentElement);
			if (type === "instruction" && ("instructionFn" in options || "instructionNameFn" in options)) {
				for (key in value) if (value.hasOwnProperty(key)) if ("instructionFn" in options) value[key] = options.instructionFn(value[key], key, currentElement);
				else {
					var temp = value[key];
					delete value[key];
					value[options.instructionNameFn(key, temp, currentElement)] = temp;
				}
			}
			if (isArray(currentElement[options[type + "Key"]])) currentElement[options[type + "Key"]].push(value);
			else currentElement[options[type + "Key"]] = value;
		} else {
			if (!currentElement[options.elementsKey]) currentElement[options.elementsKey] = [];
			var element = {};
			element[options.typeKey] = type;
			if (type === "instruction") {
				for (key in value) if (value.hasOwnProperty(key)) break;
				element[options.nameKey] = "instructionNameFn" in options ? options.instructionNameFn(key, value, currentElement) : key;
				if (options.instructionHasAttributes) {
					element[options.attributesKey] = value[key][options.attributesKey];
					if ("instructionFn" in options) element[options.attributesKey] = options.instructionFn(element[options.attributesKey], key, currentElement);
				} else {
					if ("instructionFn" in options) value[key] = options.instructionFn(value[key], key, currentElement);
					element[options.instructionKey] = value[key];
				}
			} else {
				if (type + "Fn" in options) value = options[type + "Fn"](value, currentElement);
				element[options[type + "Key"]] = value;
			}
			if (options.addParent) element[options.parentKey] = currentElement;
			currentElement[options.elementsKey].push(element);
		}
	}
	function manipulateAttributes(attributes) {
		if ("attributesFn" in options && attributes) attributes = options.attributesFn(attributes, currentElement);
		if ((options.trim || "attributeValueFn" in options || "attributeNameFn" in options || options.nativeTypeAttributes) && attributes) {
			var key;
			for (key in attributes) if (attributes.hasOwnProperty(key)) {
				if (options.trim) attributes[key] = attributes[key].trim();
				if (options.nativeTypeAttributes) attributes[key] = nativeType(attributes[key]);
				if ("attributeValueFn" in options) attributes[key] = options.attributeValueFn(attributes[key], key, currentElement);
				if ("attributeNameFn" in options) {
					var temp = attributes[key];
					delete attributes[key];
					attributes[options.attributeNameFn(key, attributes[key], currentElement)] = temp;
				}
			}
		}
		return attributes;
	}
	function onInstruction(instruction) {
		var attributes = {};
		if (instruction.body && (instruction.name.toLowerCase() === "xml" || options.instructionHasAttributes)) {
			var attrsRegExp = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\w+))\s*/g;
			var match;
			while ((match = attrsRegExp.exec(instruction.body)) !== null) attributes[match[1]] = match[2] || match[3] || match[4];
			attributes = manipulateAttributes(attributes);
		}
		if (instruction.name.toLowerCase() === "xml") {
			if (options.ignoreDeclaration) return;
			currentElement[options.declarationKey] = {};
			if (Object.keys(attributes).length) currentElement[options.declarationKey][options.attributesKey] = attributes;
			if (options.addParent) currentElement[options.declarationKey][options.parentKey] = currentElement;
		} else {
			if (options.ignoreInstruction) return;
			if (options.trim) instruction.body = instruction.body.trim();
			var value = {};
			if (options.instructionHasAttributes && Object.keys(attributes).length) {
				value[instruction.name] = {};
				value[instruction.name][options.attributesKey] = attributes;
			} else value[instruction.name] = instruction.body;
			addField("instruction", value);
		}
	}
	function onStartElement(name, attributes) {
		var element;
		if (typeof name === "object") {
			attributes = name.attributes;
			name = name.name;
		}
		attributes = manipulateAttributes(attributes);
		if ("elementNameFn" in options) name = options.elementNameFn(name, currentElement);
		if (options.compact) {
			element = {};
			if (!options.ignoreAttributes && attributes && Object.keys(attributes).length) {
				element[options.attributesKey] = {};
				var key;
				for (key in attributes) if (attributes.hasOwnProperty(key)) element[options.attributesKey][key] = attributes[key];
			}
			if (!(name in currentElement) && (isArray(options.alwaysArray) ? options.alwaysArray.indexOf(name) !== -1 : options.alwaysArray)) currentElement[name] = [];
			if (currentElement[name] && !isArray(currentElement[name])) currentElement[name] = [currentElement[name]];
			if (isArray(currentElement[name])) currentElement[name].push(element);
			else currentElement[name] = element;
		} else {
			if (!currentElement[options.elementsKey]) currentElement[options.elementsKey] = [];
			element = {};
			element[options.typeKey] = "element";
			element[options.nameKey] = name;
			if (!options.ignoreAttributes && attributes && Object.keys(attributes).length) element[options.attributesKey] = attributes;
			if (options.alwaysChildren) element[options.elementsKey] = [];
			currentElement[options.elementsKey].push(element);
		}
		element[options.parentKey] = currentElement;
		currentElement = element;
	}
	function onText(text) {
		if (options.ignoreText) return;
		if (!text.trim() && !options.captureSpacesBetweenElements) return;
		if (options.trim) text = text.trim();
		if (options.nativeType) text = nativeType(text);
		if (options.sanitize) text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		addField("text", text);
	}
	function onComment(comment) {
		if (options.ignoreComment) return;
		if (options.trim) comment = comment.trim();
		addField("comment", comment);
	}
	function onEndElement(name) {
		var parentElement = currentElement[options.parentKey];
		if (!options.addParent) delete currentElement[options.parentKey];
		currentElement = parentElement;
	}
	function onCdata(cdata) {
		if (options.ignoreCdata) return;
		if (options.trim) cdata = cdata.trim();
		addField("cdata", cdata);
	}
	function onDoctype(doctype) {
		if (options.ignoreDoctype) return;
		doctype = doctype.replace(/^ /, "");
		if (options.trim) doctype = doctype.trim();
		addField("doctype", doctype);
	}
	function onError(error) {
		error.note = error;
	}
	module.exports = function(xml, userOptions) {
		var parser = pureJsParser ? sax.parser(true, {}) : parser = new expat.Parser("UTF-8");
		var result = {};
		currentElement = result;
		options = validateOptions(userOptions);
		if (pureJsParser) {
			parser.opt = { strictEntities: true };
			parser.onopentag = onStartElement;
			parser.ontext = onText;
			parser.oncomment = onComment;
			parser.onclosetag = onEndElement;
			parser.onerror = onError;
			parser.oncdata = onCdata;
			parser.ondoctype = onDoctype;
			parser.onprocessinginstruction = onInstruction;
		} else {
			parser.on("startElement", onStartElement);
			parser.on("text", onText);
			parser.on("comment", onComment);
			parser.on("endElement", onEndElement);
			parser.on("error", onError);
		}
		if (pureJsParser) parser.write(xml).close();
		else if (!parser.parse(xml)) throw new Error("XML parsing error: " + parser.getError());
		if (result[options.elementsKey]) {
			var temp = result[options.elementsKey];
			delete result[options.elementsKey];
			result[options.elementsKey] = temp;
			delete result.text;
		}
		return result;
	};
}));
//#endregion
//#region node_modules/.pnpm/xml-js@1.6.11/node_modules/xml-js/lib/xml2json.js
var require_xml2json = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var helper = require_options_helper();
	var xml2js = require_xml2js();
	function validateOptions(userOptions) {
		var options = helper.copyOptions(userOptions);
		helper.ensureSpacesExists(options);
		return options;
	}
	module.exports = function(xml, userOptions) {
		var options = validateOptions(userOptions), js = xml2js(xml, options), json, parentKey = "compact" in options && options.compact ? "_parent" : "parent";
		if ("addParent" in options && options.addParent) json = JSON.stringify(js, function(k, v) {
			return k === parentKey ? "_" : v;
		}, options.spaces);
		else json = JSON.stringify(js, null, options.spaces);
		return json.replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
	};
}));
//#endregion
//#region node_modules/.pnpm/xml-js@1.6.11/node_modules/xml-js/lib/js2xml.js
var require_js2xml = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var helper = require_options_helper();
	var isArray = require_array_helper().isArray;
	var currentElement, currentElementName;
	function validateOptions(userOptions) {
		var options = helper.copyOptions(userOptions);
		helper.ensureFlagExists("ignoreDeclaration", options);
		helper.ensureFlagExists("ignoreInstruction", options);
		helper.ensureFlagExists("ignoreAttributes", options);
		helper.ensureFlagExists("ignoreText", options);
		helper.ensureFlagExists("ignoreComment", options);
		helper.ensureFlagExists("ignoreCdata", options);
		helper.ensureFlagExists("ignoreDoctype", options);
		helper.ensureFlagExists("compact", options);
		helper.ensureFlagExists("indentText", options);
		helper.ensureFlagExists("indentCdata", options);
		helper.ensureFlagExists("indentAttributes", options);
		helper.ensureFlagExists("indentInstruction", options);
		helper.ensureFlagExists("fullTagEmptyElement", options);
		helper.ensureFlagExists("noQuotesForNativeAttributes", options);
		helper.ensureSpacesExists(options);
		if (typeof options.spaces === "number") options.spaces = Array(options.spaces + 1).join(" ");
		helper.ensureKeyExists("declaration", options);
		helper.ensureKeyExists("instruction", options);
		helper.ensureKeyExists("attributes", options);
		helper.ensureKeyExists("text", options);
		helper.ensureKeyExists("comment", options);
		helper.ensureKeyExists("cdata", options);
		helper.ensureKeyExists("doctype", options);
		helper.ensureKeyExists("type", options);
		helper.ensureKeyExists("name", options);
		helper.ensureKeyExists("elements", options);
		helper.checkFnExists("doctype", options);
		helper.checkFnExists("instruction", options);
		helper.checkFnExists("cdata", options);
		helper.checkFnExists("comment", options);
		helper.checkFnExists("text", options);
		helper.checkFnExists("instructionName", options);
		helper.checkFnExists("elementName", options);
		helper.checkFnExists("attributeName", options);
		helper.checkFnExists("attributeValue", options);
		helper.checkFnExists("attributes", options);
		helper.checkFnExists("fullTagEmptyElement", options);
		return options;
	}
	function writeIndentation(options, depth, firstLine) {
		return (!firstLine && options.spaces ? "\n" : "") + Array(depth + 1).join(options.spaces);
	}
	function writeAttributes(attributes, options, depth) {
		if (options.ignoreAttributes) return "";
		if ("attributesFn" in options) attributes = options.attributesFn(attributes, currentElementName, currentElement);
		var key, attr, attrName, quote, result = [];
		for (key in attributes) if (attributes.hasOwnProperty(key) && attributes[key] !== null && attributes[key] !== void 0) {
			quote = options.noQuotesForNativeAttributes && typeof attributes[key] !== "string" ? "" : "\"";
			attr = "" + attributes[key];
			attr = attr.replace(/"/g, "&quot;");
			attrName = "attributeNameFn" in options ? options.attributeNameFn(key, attr, currentElementName, currentElement) : key;
			result.push(options.spaces && options.indentAttributes ? writeIndentation(options, depth + 1, false) : " ");
			result.push(attrName + "=" + quote + ("attributeValueFn" in options ? options.attributeValueFn(attr, key, currentElementName, currentElement) : attr) + quote);
		}
		if (attributes && Object.keys(attributes).length && options.spaces && options.indentAttributes) result.push(writeIndentation(options, depth, false));
		return result.join("");
	}
	function writeDeclaration(declaration, options, depth) {
		currentElement = declaration;
		currentElementName = "xml";
		return options.ignoreDeclaration ? "" : "<?xml" + writeAttributes(declaration[options.attributesKey], options, depth) + "?>";
	}
	function writeInstruction(instruction, options, depth) {
		if (options.ignoreInstruction) return "";
		var key;
		for (key in instruction) if (instruction.hasOwnProperty(key)) break;
		var instructionName = "instructionNameFn" in options ? options.instructionNameFn(key, instruction[key], currentElementName, currentElement) : key;
		if (typeof instruction[key] === "object") {
			currentElement = instruction;
			currentElementName = instructionName;
			return "<?" + instructionName + writeAttributes(instruction[key][options.attributesKey], options, depth) + "?>";
		} else {
			var instructionValue = instruction[key] ? instruction[key] : "";
			if ("instructionFn" in options) instructionValue = options.instructionFn(instructionValue, key, currentElementName, currentElement);
			return "<?" + instructionName + (instructionValue ? " " + instructionValue : "") + "?>";
		}
	}
	function writeComment(comment, options) {
		return options.ignoreComment ? "" : "<!--" + ("commentFn" in options ? options.commentFn(comment, currentElementName, currentElement) : comment) + "-->";
	}
	function writeCdata(cdata, options) {
		return options.ignoreCdata ? "" : "<![CDATA[" + ("cdataFn" in options ? options.cdataFn(cdata, currentElementName, currentElement) : cdata.replace("]]>", "]]]]><![CDATA[>")) + "]]>";
	}
	function writeDoctype(doctype, options) {
		return options.ignoreDoctype ? "" : "<!DOCTYPE " + ("doctypeFn" in options ? options.doctypeFn(doctype, currentElementName, currentElement) : doctype) + ">";
	}
	function writeText(text, options) {
		if (options.ignoreText) return "";
		text = "" + text;
		text = text.replace(/&amp;/g, "&");
		text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		return "textFn" in options ? options.textFn(text, currentElementName, currentElement) : text;
	}
	function hasContent(element, options) {
		var i;
		if (element.elements && element.elements.length) for (i = 0; i < element.elements.length; ++i) switch (element.elements[i][options.typeKey]) {
			case "text":
				if (options.indentText) return true;
				break;
			case "cdata":
				if (options.indentCdata) return true;
				break;
			case "instruction":
				if (options.indentInstruction) return true;
				break;
			case "doctype":
			case "comment":
			case "element": return true;
			default: return true;
		}
		return false;
	}
	function writeElement(element, options, depth) {
		currentElement = element;
		currentElementName = element.name;
		var xml = [], elementName = "elementNameFn" in options ? options.elementNameFn(element.name, element) : element.name;
		xml.push("<" + elementName);
		if (element[options.attributesKey]) xml.push(writeAttributes(element[options.attributesKey], options, depth));
		var withClosingTag = element[options.elementsKey] && element[options.elementsKey].length || element[options.attributesKey] && element[options.attributesKey]["xml:space"] === "preserve";
		if (!withClosingTag) if ("fullTagEmptyElementFn" in options) withClosingTag = options.fullTagEmptyElementFn(element.name, element);
		else withClosingTag = options.fullTagEmptyElement;
		if (withClosingTag) {
			xml.push(">");
			if (element[options.elementsKey] && element[options.elementsKey].length) {
				xml.push(writeElements(element[options.elementsKey], options, depth + 1));
				currentElement = element;
				currentElementName = element.name;
			}
			xml.push(options.spaces && hasContent(element, options) ? "\n" + Array(depth + 1).join(options.spaces) : "");
			xml.push("</" + elementName + ">");
		} else xml.push("/>");
		return xml.join("");
	}
	function writeElements(elements, options, depth, firstLine) {
		return elements.reduce(function(xml, element) {
			var indent = writeIndentation(options, depth, firstLine && !xml);
			switch (element.type) {
				case "element": return xml + indent + writeElement(element, options, depth);
				case "comment": return xml + indent + writeComment(element[options.commentKey], options);
				case "doctype": return xml + indent + writeDoctype(element[options.doctypeKey], options);
				case "cdata": return xml + (options.indentCdata ? indent : "") + writeCdata(element[options.cdataKey], options);
				case "text": return xml + (options.indentText ? indent : "") + writeText(element[options.textKey], options);
				case "instruction":
					var instruction = {};
					instruction[element[options.nameKey]] = element[options.attributesKey] ? element : element[options.instructionKey];
					return xml + (options.indentInstruction ? indent : "") + writeInstruction(instruction, options, depth);
			}
		}, "");
	}
	function hasContentCompact(element, options, anyContent) {
		var key;
		for (key in element) if (element.hasOwnProperty(key)) switch (key) {
			case options.parentKey:
			case options.attributesKey: break;
			case options.textKey:
				if (options.indentText || anyContent) return true;
				break;
			case options.cdataKey:
				if (options.indentCdata || anyContent) return true;
				break;
			case options.instructionKey:
				if (options.indentInstruction || anyContent) return true;
				break;
			case options.doctypeKey:
			case options.commentKey: return true;
			default: return true;
		}
		return false;
	}
	function writeElementCompact(element, name, options, depth, indent) {
		currentElement = element;
		currentElementName = name;
		var elementName = "elementNameFn" in options ? options.elementNameFn(name, element) : name;
		if (typeof element === "undefined" || element === null || element === "") return "fullTagEmptyElementFn" in options && options.fullTagEmptyElementFn(name, element) || options.fullTagEmptyElement ? "<" + elementName + "></" + elementName + ">" : "<" + elementName + "/>";
		var xml = [];
		if (name) {
			xml.push("<" + elementName);
			if (typeof element !== "object") {
				xml.push(">" + writeText(element, options) + "</" + elementName + ">");
				return xml.join("");
			}
			if (element[options.attributesKey]) xml.push(writeAttributes(element[options.attributesKey], options, depth));
			var withClosingTag = hasContentCompact(element, options, true) || element[options.attributesKey] && element[options.attributesKey]["xml:space"] === "preserve";
			if (!withClosingTag) if ("fullTagEmptyElementFn" in options) withClosingTag = options.fullTagEmptyElementFn(name, element);
			else withClosingTag = options.fullTagEmptyElement;
			if (withClosingTag) xml.push(">");
			else {
				xml.push("/>");
				return xml.join("");
			}
		}
		xml.push(writeElementsCompact(element, options, depth + 1, false));
		currentElement = element;
		currentElementName = name;
		if (name) xml.push((indent ? writeIndentation(options, depth, false) : "") + "</" + elementName + ">");
		return xml.join("");
	}
	function writeElementsCompact(element, options, depth, firstLine) {
		var i, key, nodes, xml = [];
		for (key in element) if (element.hasOwnProperty(key)) {
			nodes = isArray(element[key]) ? element[key] : [element[key]];
			for (i = 0; i < nodes.length; ++i) {
				switch (key) {
					case options.declarationKey:
						xml.push(writeDeclaration(nodes[i], options, depth));
						break;
					case options.instructionKey:
						xml.push((options.indentInstruction ? writeIndentation(options, depth, firstLine) : "") + writeInstruction(nodes[i], options, depth));
						break;
					case options.attributesKey:
					case options.parentKey: break;
					case options.textKey:
						xml.push((options.indentText ? writeIndentation(options, depth, firstLine) : "") + writeText(nodes[i], options));
						break;
					case options.cdataKey:
						xml.push((options.indentCdata ? writeIndentation(options, depth, firstLine) : "") + writeCdata(nodes[i], options));
						break;
					case options.doctypeKey:
						xml.push(writeIndentation(options, depth, firstLine) + writeDoctype(nodes[i], options));
						break;
					case options.commentKey:
						xml.push(writeIndentation(options, depth, firstLine) + writeComment(nodes[i], options));
						break;
					default: xml.push(writeIndentation(options, depth, firstLine) + writeElementCompact(nodes[i], key, options, depth, hasContentCompact(nodes[i], options)));
				}
				firstLine = firstLine && !xml.length;
			}
		}
		return xml.join("");
	}
	module.exports = function(js, options) {
		options = validateOptions(options);
		var xml = [];
		currentElement = js;
		currentElementName = "_root_";
		if (options.compact) xml.push(writeElementsCompact(js, options, 0, true));
		else {
			if (js[options.declarationKey]) xml.push(writeDeclaration(js[options.declarationKey], options, 0));
			if (js[options.elementsKey] && js[options.elementsKey].length) xml.push(writeElements(js[options.elementsKey], options, 0, !xml.length));
		}
		return xml.join("");
	};
}));
//#endregion
//#region node_modules/.pnpm/xml-js@1.6.11/node_modules/xml-js/lib/json2xml.js
var require_json2xml = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var js2xml = require_js2xml();
	module.exports = function(json, options) {
		if (json instanceof Buffer) json = json.toString();
		var js = null;
		if (typeof json === "string") try {
			js = JSON.parse(json);
		} catch (e) {
			throw new Error("The JSON structure is invalid");
		}
		else js = json;
		return js2xml(js, options);
	};
}));
//#endregion
//#region src/util/camelCase.ts
var import_lib = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		xml2js: require_xml2js(),
		xml2json: require_xml2json(),
		js2xml: require_js2xml(),
		json2xml: require_json2xml()
	};
})))());
const camelCase = (str) => str.replace(/[-_]+(\w?)/g, (_m, c) => c ? c.toUpperCase() : "");
//#endregion
//#region src/util/fetch.ts
/**
* Resolve the runtime `fetch` implementation.
*
* All supported runtimes expose a standards-compliant `fetch` on
* `globalThis`:
*   - Node.js >= 18 (the minimum declared in package.json#engines)
*   - Modern browsers
*   - Bun (all versions)
*   - Deno (all versions)
*   - Cloudflare Workers, Electron, KaiOS 3+
*
* Exotic hosts without a global `fetch` must either install a polyfill on
* `globalThis` before importing tsdav, or pass their own `fetch`
* implementation to `createDAVClient`, the `DAVClient` constructor, or the
* individual request helpers.
*/
const resolveFetch = () => {
	if (typeof globalThis !== "undefined" && typeof globalThis.fetch === "function") return globalThis.fetch.bind(globalThis);
	return (() => {
		throw new Error("tsdav: global fetch is not available in this runtime. Upgrade to Node.js >= 18, run under a browser/Bun/Deno, or install a fetch polyfill on globalThis before importing tsdav. You can also pass a custom `fetch` implementation to `createDAVClient`, `DAVClient`, or individual request helpers.");
	});
};
const fetch = resolveFetch();
//#endregion
//#region src/util/nativeType.ts
const NUMERIC_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
const nativeType = (value) => {
	if (typeof value !== "string") return value;
	if (NUMERIC_RE.test(value)) {
		const nValue = Number(value);
		if (!Number.isNaN(nValue) && Number.isFinite(nValue)) return nValue;
	}
	const bValue = value.toLowerCase();
	if (bValue === "true") return true;
	if (bValue === "false") return false;
	return value;
};
//#endregion
//#region src/util/requestHelpers.ts
var requestHelpers_exports = /* @__PURE__ */ __exportAll({
	cleanupFalsy: () => cleanupFalsy,
	conditionalParam: () => conditionalParam,
	excludeHeaders: () => excludeHeaders,
	getDAVAttribute: () => getDAVAttribute,
	urlContains: () => urlContains,
	urlEquals: () => urlEquals
});
const normalizeUrl = (url) => {
	const trimmed = url.trim();
	return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};
/**
* Strict URL equality after trimming whitespace and a single trailing slash.
* Two URLs are equal if and only if their normalized forms are identical.
*/
const urlEquals = (urlA, urlB) => {
	if (!urlA && !urlB) return true;
	if (!urlA || !urlB) return false;
	return normalizeUrl(urlA) === normalizeUrl(urlB);
};
/**
* Loose URL containment check used for matching DAV responses against known
* collection/principal URLs. Tolerates trailing slashes and partial vs. full
* URLs (e.g. "www.example.com" vs. "https://www.example.com/").
*
* NOTE: this is intentionally permissive to accommodate DAV servers that
* return hrefs as paths instead of full URLs. Callers MUST only compare URLs
* at the same hierarchy level (collection-to-collection, object-to-object).
* Comparing a collection URL against an object URL will produce false
* positives because the collection URL is a prefix of the object URL.
*/
const urlContains = (urlA, urlB) => {
	if (!urlA && !urlB) return true;
	if (!urlA || !urlB) return false;
	const strippedUrlA = normalizeUrl(urlA);
	const strippedUrlB = normalizeUrl(urlB);
	return strippedUrlA.includes(strippedUrlB) || strippedUrlB.includes(strippedUrlA);
};
const getDAVAttribute = (nsArr) => nsArr.reduce((prev, curr) => ({
	...prev,
	[DAVAttributeMap[curr]]: curr
}), {});
const cleanupFalsy = (obj) => Object.entries(obj).reduce((prev, [key, value]) => {
	if (value) return {
		...prev,
		[key]: value
	};
	return prev;
}, {});
const conditionalParam = (key, param) => {
	if (param) return { [key]: param };
	return {};
};
const excludeHeaders = (headers, headersToExclude) => {
	if (!headers) return {};
	if (!headersToExclude || headersToExclude.length === 0) return headers;
	const excludeSet = new Set(headersToExclude.map((h) => h.toLowerCase()));
	return Object.fromEntries(Object.entries(headers).filter(([key]) => !excludeSet.has(key.toLowerCase())));
};
//#endregion
//#region src/request.ts
var request_exports = /* @__PURE__ */ __exportAll({
	createObject: () => createObject,
	davRequest: () => davRequest,
	deleteObject: () => deleteObject,
	propfind: () => propfind,
	updateObject: () => updateObject
});
const debug$5 = (0, import_browser.default)("tsdav:request");
const davRequest = async (params) => {
	const { url, init, convertIncoming = true, parseOutgoing = true, fetchOptions = {}, fetch: fetchOverride } = params;
	const requestFetch = fetchOverride ?? fetch;
	const { headers = {}, body, namespace, method, attributes } = init;
	const xmlBody = convertIncoming ? import_lib.default.js2xml({
		_declaration: { _attributes: {
			version: "1.0",
			encoding: "utf-8"
		} },
		_attributes: attributes,
		...body
	}, {
		compact: true,
		spaces: 2,
		elementNameFn: (name) => {
			if (namespace && !/^.+:.+/.test(name)) return `${namespace}:${name}`;
			return name;
		}
	}) : body;
	const fetchOptionsWithoutHeaders = { ...fetchOptions };
	delete fetchOptionsWithoutHeaders.headers;
	const mergedHeaders = {};
	const setHeader = (key, value) => {
		if (value == null) return;
		const lower = key.toLowerCase();
		Object.keys(mergedHeaders).forEach((existing) => {
			if (existing.toLowerCase() === lower) delete mergedHeaders[existing];
		});
		mergedHeaders[key] = value;
	};
	setHeader("Content-Type", "text/xml;charset=UTF-8");
	Object.entries(cleanupFalsy(headers)).forEach(([k, v]) => {
		setHeader(k, v);
	});
	Object.entries(fetchOptions.headers || {}).forEach(([k, v]) => {
		setHeader(k, v);
	});
	const davResponse = await requestFetch(url, {
		...fetchOptionsWithoutHeaders,
		headers: mergedHeaders,
		body: xmlBody,
		method
	});
	const resText = await davResponse.text();
	if (!davResponse.ok || !davResponse.headers.get("content-type")?.includes("xml") || !parseOutgoing || !resText) {
		const MAX_RAW = 4096;
		const raw = resText.length > MAX_RAW ? `${resText.slice(0, MAX_RAW)}…` : resText;
		return [{
			href: davResponse.url,
			ok: davResponse.ok,
			status: davResponse.status,
			statusText: davResponse.statusText,
			raw
		}];
	}
	let result;
	try {
		result = import_lib.default.xml2js(resText, {
			compact: true,
			trim: true,
			textFn: (value, parentElement) => {
				try {
					const parentOfParent = parentElement._parent;
					const pOpKeys = Object.keys(parentOfParent);
					const keyName = pOpKeys[pOpKeys.length - 1];
					const arrOfKey = parentOfParent[keyName];
					if (arrOfKey.length > 0) {
						const arr = arrOfKey;
						const arrIndex = arrOfKey.length - 1;
						arr[arrIndex] = nativeType(value);
					} else parentOfParent[keyName] = nativeType(value);
				} catch (e) {
					debug$5(e.stack);
				}
			},
			elementNameFn: (attributeName) => camelCase(attributeName.replace(/^.+:/, "")),
			attributesFn: (value) => {
				const newVal = { ...value };
				delete newVal.xmlns;
				return newVal;
			},
			ignoreDeclaration: true
		});
	} catch (e) {
		debug$5(`Failed to parse DAV response XML: ${e.message}`);
		return [{
			href: davResponse.url,
			ok: davResponse.ok,
			status: davResponse.status,
			statusText: davResponse.statusText,
			raw: resText
		}];
	}
	if (!result?.multistatus) return [{
		href: davResponse.url,
		ok: davResponse.ok,
		status: davResponse.status,
		statusText: davResponse.statusText,
		raw: result
	}];
	return (Array.isArray(result.multistatus.response) ? result.multistatus.response : [result.multistatus.response]).map((responseBody) => {
		const statusRegex = /^\S+\s(?<status>\d+)\s(?<statusText>.+)$/;
		if (!responseBody) return {
			status: davResponse.status,
			statusText: davResponse.statusText,
			ok: davResponse.ok
		};
		const matchArr = statusRegex.exec(responseBody.status);
		const status = matchArr?.groups ? Number.parseInt(matchArr.groups.status, 10) : davResponse.status;
		return {
			raw: result,
			href: responseBody.href,
			status,
			statusText: matchArr?.groups?.statusText ?? davResponse.statusText,
			ok: status >= 200 && status < 300,
			error: responseBody.error,
			responsedescription: responseBody.responsedescription,
			props: (Array.isArray(responseBody.propstat) ? responseBody.propstat : [responseBody.propstat]).reduce((prev, curr) => {
				return {
					...prev,
					...curr?.prop
				};
			}, {})
		};
	});
};
const propfind = async (params) => {
	const { url, props, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return davRequest({
		url,
		init: {
			method: "PROPFIND",
			headers: excludeHeaders(cleanupFalsy({
				depth,
				...headers
			}), headersToExclude),
			namespace: "d",
			body: { propfind: {
				_attributes: getDAVAttribute([
					"urn:ietf:params:xml:ns:caldav",
					"http://apple.com/ns/ical/",
					"http://calendarserver.org/ns/",
					"urn:ietf:params:xml:ns:carddav",
					"DAV:"
				]),
				prop: props
			} }
		},
		fetchOptions,
		fetch: fetchOverride
	});
};
const createObject = async (params) => {
	const { url, data, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return (fetchOverride ?? fetch)(url, {
		method: "PUT",
		body: data,
		headers: excludeHeaders(headers, headersToExclude),
		...fetchOptions
	});
};
const updateObject = async (params) => {
	const { url, data, etag, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return (fetchOverride ?? fetch)(url, {
		method: "PUT",
		body: data,
		headers: excludeHeaders(cleanupFalsy({
			"If-Match": etag,
			...headers
		}), headersToExclude),
		...fetchOptions
	});
};
const deleteObject = async (params) => {
	const { url, headers, etag, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return (fetchOverride ?? fetch)(url, {
		method: "DELETE",
		headers: excludeHeaders(cleanupFalsy({
			"If-Match": etag,
			...headers
		}), headersToExclude),
		...fetchOptions
	});
};
//#endregion
//#region src/util/typeHelpers.ts
function hasFields(obj, fields) {
	const inObj = (object) => fields.every((f) => object[f]);
	if (Array.isArray(obj)) return obj.every((o) => inObj(o));
	return inObj(obj);
}
const findMissingFieldNames = (obj, fields) => fields.reduce((prev, curr) => obj[curr] ? prev : `${prev.length ? `${prev},` : ""}${curr.toString()}`, "");
//#endregion
//#region src/collection.ts
var collection_exports = /* @__PURE__ */ __exportAll({
	collectionQuery: () => collectionQuery,
	isCollectionDirty: () => isCollectionDirty,
	makeCollection: () => makeCollection,
	smartCollectionSync: () => smartCollectionSync,
	smartCollectionSyncDetailed: () => smartCollectionSyncDetailed,
	supportedReportSet: () => supportedReportSet,
	syncCollection: () => syncCollection
});
const debug$4 = (0, import_browser.default)("tsdav:collection");
const collectionQuery = async (params) => {
	const { url, body, depth, defaultNamespace = "d", headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const queryResults = await davRequest({
		url,
		init: {
			method: "REPORT",
			headers: excludeHeaders(cleanupFalsy({
				depth,
				...headers
			}), headersToExclude),
			namespace: defaultNamespace,
			body
		},
		fetchOptions,
		fetch: fetchOverride
	});
	const errorResponse = queryResults.find((res) => !res.ok || res.status && res.status >= 400);
	if (errorResponse) throw new Error(`Collection query failed: ${errorResponse.status} ${errorResponse.statusText}. ${errorResponse.raw ? `Raw response: ${errorResponse.raw}` : ""}`);
	if (queryResults.length === 1 && !queryResults[0].raw && queryResults[0].status && queryResults[0].status < 300) return [];
	return queryResults;
};
const makeCollection = async (params) => {
	const { url, props, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return davRequest({
		url,
		init: {
			method: "MKCOL",
			headers: excludeHeaders(cleanupFalsy({
				depth,
				...headers
			}), headersToExclude),
			namespace: "d",
			body: props ? { mkcol: { set: { prop: props } } } : void 0
		},
		fetchOptions,
		fetch: fetchOverride
	});
};
const supportedReportSet = async (params) => {
	const { collection, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const supportedReport = (await propfind({
		url: collection.url,
		props: { [`d:supported-report-set`]: {} },
		depth: "0",
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	}))[0]?.props?.supportedReportSet?.supportedReport;
	if (!supportedReport) return [];
	return (Array.isArray(supportedReport) ? supportedReport : [supportedReport]).map((sr) => sr?.report ? Object.keys(sr.report)[0] : void 0).filter((name) => typeof name === "string" && name.length > 0);
};
const isCollectionDirty = async (params) => {
	const { collection, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const res = (await propfind({
		url: collection.url,
		props: { [`cs:getctag`]: {} },
		depth: "0",
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	})).filter((r) => urlContains(collection.url, r.href))[0];
	if (!res) throw new Error("Collection does not exist on server");
	return {
		isDirty: `${collection.ctag}` !== `${res.props?.getctag}`,
		newCtag: res.props?.getctag?.toString()
	};
};
/**
* This is for webdav sync-collection only
*/
const syncCollection = (params) => {
	const { url, props, headers, syncLevel, syncToken, headersToExclude, fetchOptions, fetch: fetchOverride } = params;
	return davRequest({
		url,
		init: {
			method: "REPORT",
			namespace: "d",
			headers: excludeHeaders({ ...headers }, headersToExclude),
			body: { "sync-collection": {
				_attributes: getDAVAttribute([
					"urn:ietf:params:xml:ns:caldav",
					"urn:ietf:params:xml:ns:carddav",
					"DAV:"
				]),
				"sync-level": syncLevel,
				"sync-token": syncToken,
				[`d:prop`]: props
			} }
		},
		fetchOptions,
		fetch: fetchOverride
	});
};
/** remote collection to local */
const smartCollectionSync = async (params) => {
	const { collection, method, headers, headersToExclude, account, detailedResult, fetchOptions = {}, fetch: fetchOverride } = params;
	const requiredFields = ["accountType", "homeUrl"];
	if (!account || !hasFields(account, requiredFields)) {
		if (!account) throw new Error("no account for smartCollectionSync");
		throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before smartCollectionSync`);
	}
	const syncMethod = method ?? (collection.reports?.includes("syncCollection") ? "webdav" : "basic");
	debug$4(`smart collection sync with type ${account.accountType} and method ${syncMethod}`);
	if (syncMethod === "webdav") {
		const result = await syncCollection({
			url: collection.url,
			props: {
				[`d:getetag`]: {},
				[`${account.accountType === "caldav" ? "c" : "card"}:${account.accountType === "caldav" ? "calendar-data" : "address-data"}`]: {},
				[`d:displayname`]: {}
			},
			syncLevel: 1,
			syncToken: collection.syncToken,
			headers: excludeHeaders(headers, headersToExclude),
			fetchOptions,
			fetch: fetchOverride
		});
		const objectResponses = result.filter((r) => {
			const extName = account.accountType === "caldav" ? ".ics" : ".vcf";
			return r.href?.slice(-4) === extName;
		});
		const changedObjectUrls = objectResponses.filter((o) => o.status !== 404).map((r) => r.href);
		const deletedObjectUrls = objectResponses.filter((o) => o.status === 404).map((r) => r.href);
		const remoteObjects = (changedObjectUrls.length ? await collection.objectMultiGet?.({
			url: collection.url,
			props: {
				[`d:getetag`]: {},
				[`${account.accountType === "caldav" ? "c" : "card"}:${account.accountType === "caldav" ? "calendar-data" : "address-data"}`]: {}
			},
			objectUrls: changedObjectUrls,
			depth: "1",
			headers: excludeHeaders(headers, headersToExclude),
			fetchOptions,
			fetch: fetchOverride
		}) ?? [] : []).map((res) => {
			return {
				url: res.href ?? "",
				etag: res.props?.getetag,
				data: account?.accountType === "caldav" ? res.props?.calendarData?._cdata ?? res.props?.calendarData : res.props?.addressData?._cdata ?? res.props?.addressData
			};
		});
		const localObjects = collection.objects ?? [];
		const created = remoteObjects.filter((o) => localObjects.every((lo) => !urlContains(lo.url, o.url)));
		const updated = localObjects.reduce((prev, curr) => {
			const found = remoteObjects.find((ro) => urlContains(ro.url, curr.url));
			if (found && found.etag && found.etag !== curr.etag) return [...prev, found];
			return prev;
		}, []);
		const deleted = deletedObjectUrls.map((o) => ({
			url: o,
			etag: ""
		}));
		const unchanged = localObjects.filter((lo) => remoteObjects.some((ro) => urlContains(lo.url, ro.url) && ro.etag === lo.etag));
		return {
			...collection,
			objects: detailedResult ? {
				created,
				updated,
				deleted
			} : [
				...unchanged,
				...created,
				...updated
			],
			syncToken: result[0]?.raw?.multistatus?.syncToken ?? collection.syncToken
		};
	}
	if (syncMethod === "basic") {
		const { isDirty, newCtag } = await isCollectionDirty({
			collection,
			headers: excludeHeaders(headers, headersToExclude),
			fetchOptions,
			fetch: fetchOverride
		});
		if (!isDirty) return detailedResult ? {
			...collection,
			objects: {
				created: [],
				updated: [],
				deleted: []
			}
		} : collection;
		const localObjects = collection.objects ?? [];
		const remoteObjects = await collection.fetchObjects?.({
			collection,
			headers: excludeHeaders(headers, headersToExclude),
			fetchOptions,
			fetch: fetchOverride
		}) ?? [];
		const created = remoteObjects.filter((ro) => localObjects.every((lo) => !urlContains(lo.url, ro.url)));
		const updated = localObjects.reduce((prev, curr) => {
			const found = remoteObjects.find((ro) => urlContains(ro.url, curr.url));
			if (found && found.etag && found.etag !== curr.etag) return [...prev, found];
			return prev;
		}, []);
		const deleted = localObjects.filter((cal) => remoteObjects.every((ro) => !urlContains(ro.url, cal.url)));
		const unchanged = localObjects.filter((lo) => remoteObjects.some((ro) => urlContains(lo.url, ro.url) && ro.etag === lo.etag));
		return {
			...collection,
			objects: detailedResult ? {
				created,
				updated,
				deleted
			} : [
				...unchanged,
				...created,
				...updated
			],
			ctag: newCtag
		};
	}
	return detailedResult ? {
		...collection,
		objects: {
			created: [],
			updated: [],
			deleted: []
		}
	} : collection;
};
const smartCollectionSyncDetailed = async (params) => smartCollectionSync({
	...params,
	detailedResult: true
});
//#endregion
//#region src/addressBook.ts
var addressBook_exports = /* @__PURE__ */ __exportAll({
	addressBookMultiGet: () => addressBookMultiGet,
	addressBookQuery: () => addressBookQuery,
	createVCard: () => createVCard,
	deleteVCard: () => deleteVCard,
	fetchAddressBooks: () => fetchAddressBooks,
	fetchVCards: () => fetchVCards,
	updateVCard: () => updateVCard
});
const debug$3 = (0, import_browser.default)("tsdav:addressBook");
const addressBookQuery = async (params) => {
	const { url, props, filters, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return collectionQuery({
		url,
		body: { "addressbook-query": cleanupFalsy({
			_attributes: getDAVAttribute(["urn:ietf:params:xml:ns:carddav", "DAV:"]),
			[`d:prop`]: props,
			filter: filters ?? { "prop-filter": { _attributes: { name: "FN" } } }
		}) },
		defaultNamespace: "card",
		depth,
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
};
const addressBookMultiGet = async (params) => {
	const { url, props, objectUrls, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return collectionQuery({
		url,
		body: { "addressbook-multiget": cleanupFalsy({
			_attributes: getDAVAttribute(["DAV:", "urn:ietf:params:xml:ns:carddav"]),
			[`d:prop`]: props,
			[`d:href`]: objectUrls
		}) },
		defaultNamespace: "card",
		depth,
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
};
const fetchAddressBooks = async (params) => {
	const { account, headers, props: customProps, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params ?? {};
	const requiredFields = ["homeUrl", "rootUrl"];
	if (!account || !hasFields(account, requiredFields)) {
		if (!account) throw new Error("no account for fetchAddressBooks");
		throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchAddressBooks`);
	}
	const res = await propfind({
		url: account.homeUrl,
		props: customProps ?? {
			[`d:displayname`]: {},
			[`cs:getctag`]: {},
			[`d:resourcetype`]: {},
			[`d:sync-token`]: {}
		},
		depth: "1",
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
	return Promise.all(res.filter((r) => Object.keys(r.props?.resourcetype ?? {}).includes("addressbook")).map((rs) => {
		const displayName = rs.props?.displayname?._cdata ?? rs.props?.displayname;
		debug$3(`Found address book named ${typeof displayName === "string" ? displayName : ""},
             props: ${JSON.stringify(rs.props)}`);
		return {
			url: new URL(rs.href ?? "", account.rootUrl ?? "").href,
			ctag: rs.props?.getctag,
			displayName: typeof displayName === "string" ? displayName : "",
			resourcetype: Object.keys(rs.props?.resourcetype ?? {}),
			syncToken: rs.props?.syncToken
		};
	}).map(async (addr) => ({
		...addr,
		reports: await supportedReportSet({
			collection: addr,
			headers: excludeHeaders(headers, headersToExclude),
			fetchOptions,
			fetch: fetchOverride
		})
	})));
};
const fetchVCards = async (params) => {
	const { addressBook, headers, objectUrls, headersToExclude, urlFilter = (url) => Boolean(url), useMultiGet = true, fetchOptions = {}, fetch: fetchOverride } = params;
	debug$3(`Fetching vcards from ${addressBook?.url}`);
	const requiredFields = ["url"];
	if (!addressBook || !hasFields(addressBook, requiredFields)) {
		if (!addressBook) throw new Error("cannot fetchVCards for undefined addressBook");
		throw new Error(`addressBook must have ${findMissingFieldNames(addressBook, requiredFields)} before fetchVCards`);
	}
	const vcardUrls = (objectUrls ?? (await addressBookQuery({
		url: addressBook.url,
		props: { [`d:getetag`]: {} },
		depth: "1",
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	})).map((res) => res.href ?? "")).map((url) => url.startsWith("http") || !url ? url : new URL(url, addressBook.url).href).filter((url) => url && !urlEquals(url, addressBook.url)).filter(urlFilter).map((url) => new URL(url).pathname);
	let vCardResults = [];
	if (vcardUrls.length > 0) if (useMultiGet) vCardResults = await addressBookMultiGet({
		url: addressBook.url,
		props: {
			[`d:getetag`]: {},
			[`card:address-data`]: {}
		},
		objectUrls: vcardUrls,
		depth: "1",
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
	else vCardResults = await addressBookQuery({
		url: addressBook.url,
		props: {
			[`d:getetag`]: {},
			[`card:address-data`]: {}
		},
		depth: "1",
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
	return vCardResults.map((res) => ({
		url: new URL(res.href ?? "", addressBook.url).href,
		etag: res.props?.getetag,
		data: res.props?.addressData?._cdata ?? res.props?.addressData
	}));
};
const createVCard = async (params) => {
	const { addressBook, vCardString, filename, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return createObject({
		url: new URL(filename, addressBook.url).href,
		data: vCardString,
		headers: excludeHeaders({
			"content-type": "text/vcard; charset=utf-8",
			"If-None-Match": "*",
			...headers
		}, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
};
const updateVCard = async (params) => {
	const { vCard, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return updateObject({
		url: vCard.url,
		data: vCard.data,
		etag: vCard.etag,
		headers: excludeHeaders({
			"content-type": "text/vcard; charset=utf-8",
			...headers
		}, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
};
const deleteVCard = async (params) => {
	const { vCard, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return deleteObject({
		url: vCard.url,
		etag: vCard.etag,
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
};
//#endregion
//#region src/calendar.ts
var calendar_exports = /* @__PURE__ */ __exportAll({
	calendarMultiGet: () => calendarMultiGet,
	calendarQuery: () => calendarQuery,
	createCalendarObject: () => createCalendarObject,
	deleteCalendarObject: () => deleteCalendarObject,
	fetchCalendarObjects: () => fetchCalendarObjects,
	fetchCalendarUserAddresses: () => fetchCalendarUserAddresses,
	fetchCalendars: () => fetchCalendars,
	freeBusyQuery: () => freeBusyQuery,
	makeCalendar: () => makeCalendar,
	syncCalendars: () => syncCalendars,
	syncCalendarsDetailed: () => syncCalendarsDetailed,
	updateCalendarObject: () => updateCalendarObject
});
const debug$2 = (0, import_browser.default)("tsdav:calendar");
const ISO_8601 = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i;
const ISO_8601_FULL = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;
/**
* Validate a time-range input: both endpoints must be ISO-8601 shaped AND
* parse to a real Date (so values like `0000-13-99` get rejected).
*/
const validateTimeRange = (timeRange) => {
	const { start, end } = timeRange;
	if (!(ISO_8601.test(start) && ISO_8601.test(end) || ISO_8601_FULL.test(start) && ISO_8601_FULL.test(end))) throw new Error("invalid timeRange format, not in ISO8601");
	if (Number.isNaN(new Date(start).getTime()) || Number.isNaN(new Date(end).getTime())) throw new Error("invalid timeRange: start or end is not a valid date");
};
const extractComponentNames = (compSet) => {
	let names = [];
	if (Array.isArray(compSet)) names = compSet.map((sc) => sc?._attributes?.name);
	else if (compSet && typeof compSet === "object") names = [compSet._attributes?.name];
	return names.filter((n) => typeof n === "string" && n.length > 0);
};
const fetchCalendarUserAddresses = async (params) => {
	const { account, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const requiredFields = ["principalUrl", "rootUrl"];
	if (!hasFields(account, requiredFields)) throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchUserAddresses`);
	debug$2(`Fetch user addresses from ${account.principalUrl}`);
	const matched = (await propfind({
		url: account.principalUrl,
		props: { [`c:calendar-user-address-set`]: {} },
		depth: "0",
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	})).find((r) => urlContains(account.principalUrl, r.href));
	if (!matched || !matched.ok) throw new Error("cannot find calendarUserAddresses");
	const rawHrefs = matched?.props?.calendarUserAddressSet?.href;
	let hrefArray = [];
	if (Array.isArray(rawHrefs)) hrefArray = rawHrefs;
	else if (rawHrefs) hrefArray = [rawHrefs];
	const addresses = hrefArray.filter((h) => typeof h === "string" && h.length > 0);
	debug$2(`Fetched calendar user addresses ${addresses}`);
	return addresses;
};
const calendarQuery = async (params) => {
	const { url, props, filters, timezone, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return collectionQuery({
		url,
		body: { "calendar-query": cleanupFalsy({
			_attributes: getDAVAttribute([
				"urn:ietf:params:xml:ns:caldav",
				"http://calendarserver.org/ns/",
				"http://apple.com/ns/ical/",
				"DAV:"
			]),
			[`d:prop`]: props,
			filter: filters,
			timezone
		}) },
		defaultNamespace: "c",
		depth,
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
};
const calendarMultiGet = async (params) => {
	const { url, props, objectUrls, filters, timezone, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return collectionQuery({
		url,
		body: { "calendar-multiget": cleanupFalsy({
			_attributes: getDAVAttribute(["DAV:", "urn:ietf:params:xml:ns:caldav"]),
			[`d:prop`]: props,
			[`d:href`]: objectUrls,
			filter: filters,
			timezone
		}) },
		defaultNamespace: "c",
		depth,
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
};
const makeCalendar = async (params) => {
	const { url, props, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return davRequest({
		url,
		init: {
			method: "MKCALENDAR",
			headers: excludeHeaders(cleanupFalsy({
				depth,
				...headers
			}), headersToExclude),
			namespace: "d",
			body: { [`c:mkcalendar`]: {
				_attributes: getDAVAttribute([
					"DAV:",
					"urn:ietf:params:xml:ns:caldav",
					"http://apple.com/ns/ical/"
				]),
				set: { prop: props }
			} }
		},
		fetchOptions,
		fetch: fetchOverride
	});
};
const fetchCalendars = async (params) => {
	const { headers, account, props: customProps, projectedProps, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params ?? {};
	const requiredFields = ["homeUrl", "rootUrl"];
	if (!account || !hasFields(account, requiredFields)) {
		if (!account) throw new Error("no account for fetchCalendars");
		throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchCalendars`);
	}
	const res = await propfind({
		url: account.homeUrl,
		props: customProps ?? {
			[`c:calendar-description`]: {},
			[`c:calendar-timezone`]: {},
			[`d:displayname`]: {},
			[`ca:calendar-color`]: {},
			[`cs:getctag`]: {},
			[`d:resourcetype`]: {},
			[`c:supported-calendar-component-set`]: {},
			[`d:sync-token`]: {}
		},
		depth: "1",
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
	return Promise.all(res.filter((r) => Object.keys(r.props?.resourcetype ?? {}).includes("calendar")).filter((rc) => {
		const components = extractComponentNames(rc.props?.supportedCalendarComponentSet?.comp);
		return components.length === 0 || components.some((c) => Object.values(ICALObjects).includes(c));
	}).map((rs) => {
		const description = rs.props?.calendarDescription;
		const timezone = rs.props?.calendarTimezone;
		const compSet = rs.props?.supportedCalendarComponentSet?.comp;
		const projectedEntries = Object.entries(rs.props ?? {}).filter(([key]) => projectedProps?.[key]);
		return {
			description: typeof description === "string" ? description : "",
			timezone: typeof timezone === "string" ? timezone : "",
			url: new URL(rs.href ?? "", account.rootUrl ?? "").href,
			ctag: rs.props?.getctag,
			calendarColor: rs.props?.calendarColor,
			displayName: rs.props?.displayname?._cdata ?? rs.props?.displayname,
			components: extractComponentNames(compSet),
			resourcetype: Object.keys(rs.props?.resourcetype ?? {}),
			syncToken: rs.props?.syncToken,
			...projectedProps && projectedEntries.length > 0 ? { projectedProps: Object.fromEntries(projectedEntries) } : {}
		};
	}).map(async (cal) => ({
		...cal,
		reports: await supportedReportSet({
			collection: cal,
			headers: excludeHeaders(headers, headersToExclude),
			fetchOptions,
			fetch: fetchOverride
		})
	})));
};
const fetchCalendarObjects = async (params) => {
	const { calendar, objectUrls, filters: customFilters, timeRange, headers, expand, urlFilter = (url) => Boolean(url?.includes(".ics")), useMultiGet = true, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	if (timeRange) validateTimeRange(timeRange);
	debug$2(`Fetching calendar objects from ${calendar?.url}`);
	const requiredFields = ["url"];
	if (!calendar || !hasFields(calendar, requiredFields)) {
		if (!calendar) throw new Error("cannot fetchCalendarObjects for undefined calendar");
		throw new Error(`calendar must have ${findMissingFieldNames(calendar, requiredFields)} before fetchCalendarObjects`);
	}
	const filters = customFilters ?? [{ "comp-filter": {
		_attributes: { name: "VCALENDAR" },
		"comp-filter": {
			_attributes: { name: "VEVENT" },
			...timeRange ? { "time-range": { _attributes: {
				start: `${new Date(timeRange.start).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`,
				end: `${new Date(timeRange.end).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`
			} } } : {}
		}
	} }];
	let initialResponses = [];
	if (!objectUrls) initialResponses = await calendarQuery({
		url: calendar.url,
		props: {
			[`d:getetag`]: {},
			...expand && timeRange ? { [`c:calendar-data`]: { [`c:expand`]: { _attributes: {
				start: `${new Date(timeRange.start).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`,
				end: `${new Date(timeRange.end).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`
			} } } } : {}
		},
		filters,
		depth: "1",
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
	const calendarObjectUrls = (objectUrls ?? initialResponses.map((res) => res.href ?? "")).map((url) => url.startsWith("http") || !url ? url : new URL(url, calendar.url).href).filter(urlFilter).map((url) => new URL(url).pathname);
	let calendarObjectResults = [];
	if (calendarObjectUrls.length > 0) if (expand && !objectUrls) calendarObjectResults = initialResponses.filter((res) => {
		return urlFilter(((res.href ?? "").startsWith("http") ? res.href : new URL(res.href ?? "", calendar.url).href) ?? "");
	});
	else if (!useMultiGet) calendarObjectResults = await calendarQuery({
		url: calendar.url,
		props: {
			[`d:getetag`]: {},
			[`c:calendar-data`]: { ...expand && timeRange ? { [`c:expand`]: { _attributes: {
				start: `${new Date(timeRange.start).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`,
				end: `${new Date(timeRange.end).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`
			} } } : {} }
		},
		filters,
		depth: "1",
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
	else calendarObjectResults = await calendarMultiGet({
		url: calendar.url,
		props: {
			[`d:getetag`]: {},
			[`c:calendar-data`]: { ...expand && timeRange ? { [`c:expand`]: { _attributes: {
				start: `${new Date(timeRange.start).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`,
				end: `${new Date(timeRange.end).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`
			} } } : {} }
		},
		objectUrls: calendarObjectUrls,
		depth: "1",
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
	return calendarObjectResults.map((res) => ({
		url: new URL(res.href ?? "", calendar.url).href,
		etag: `${res.props?.getetag}`,
		data: res.props?.calendarData?._cdata ?? res.props?.calendarData
	}));
};
const createCalendarObject = async (params) => {
	const { calendar, iCalString, filename, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return createObject({
		url: new URL(filename, calendar.url).href,
		data: iCalString,
		headers: excludeHeaders({
			"content-type": "text/calendar; charset=utf-8",
			"If-None-Match": "*",
			...headers
		}, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
};
const updateCalendarObject = async (params) => {
	const { calendarObject, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return updateObject({
		url: calendarObject.url,
		data: calendarObject.data,
		etag: calendarObject.etag,
		headers: excludeHeaders({
			"content-type": "text/calendar; charset=utf-8",
			...headers
		}, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
};
const deleteCalendarObject = async (params) => {
	const { calendarObject, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return deleteObject({
		url: calendarObject.url,
		etag: calendarObject.etag,
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
};
/**
* Sync remote calendars to local
*/
const syncCalendars = async (params) => {
	const { oldCalendars, account, detailedResult, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	if (!account) throw new Error("Must have account before syncCalendars");
	const localCalendars = oldCalendars ?? account.calendars ?? [];
	const remoteCalendars = await fetchCalendars({
		account,
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
	const created = remoteCalendars.filter((rc) => localCalendars.every((lc) => !urlContains(lc.url, rc.url)));
	debug$2(`new calendars: ${created.map((cc) => cc.displayName)}`);
	const updated = localCalendars.reduce((prev, curr) => {
		const found = remoteCalendars.find((rc) => urlContains(rc.url, curr.url));
		if (found && (found.syncToken && `${found.syncToken}` !== `${curr.syncToken}` || found.ctag && `${found.ctag}` !== `${curr.ctag}`)) return [...prev, found];
		return prev;
	}, []);
	debug$2(`updated calendars: ${updated.map((cc) => cc.displayName)}`);
	const updatedWithObjects = await Promise.all(updated.map(async (u) => {
		return await smartCollectionSync({
			collection: {
				...u,
				objectMultiGet: calendarMultiGet
			},
			method: "webdav",
			headers: excludeHeaders(headers, headersToExclude),
			account,
			fetchOptions,
			fetch: fetchOverride
		});
	}));
	const deleted = localCalendars.filter((cal) => remoteCalendars.every((rc) => !urlContains(rc.url, cal.url)));
	debug$2(`deleted calendars: ${deleted.map((cc) => cc.displayName)}`);
	const unchanged = localCalendars.filter((cal) => remoteCalendars.some((rc) => {
		if (!urlContains(rc.url, cal.url)) return false;
		const syncTokenMatches = !rc.syncToken || `${rc.syncToken}` === `${cal.syncToken}`;
		const ctagMatches = !rc.ctag || `${rc.ctag}` === `${cal.ctag}`;
		return syncTokenMatches && ctagMatches;
	}));
	debug$2(`unchanged calendars: ${unchanged.map((cc) => cc.displayName)}`);
	return detailedResult ? {
		created,
		updated: updatedWithObjects,
		deleted
	} : [
		...unchanged,
		...created,
		...updatedWithObjects
	];
};
const syncCalendarsDetailed = async (params) => syncCalendars({
	...params,
	detailedResult: true
});
const freeBusyQuery = async (params) => {
	const { url, timeRange, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	if (!timeRange) throw new Error("timeRange is required");
	validateTimeRange(timeRange);
	return (await collectionQuery({
		url,
		body: { "free-busy-query": cleanupFalsy({
			_attributes: getDAVAttribute(["urn:ietf:params:xml:ns:caldav"]),
			[`c:time-range`]: { _attributes: {
				start: `${new Date(timeRange.start).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`,
				end: `${new Date(timeRange.end).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`
			} }
		}) },
		defaultNamespace: "c",
		depth,
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	}))[0];
};
//#endregion
//#region src/account.ts
var account_exports = /* @__PURE__ */ __exportAll({
	createAccount: () => createAccount,
	fetchHomeUrl: () => fetchHomeUrl,
	fetchPrincipalUrl: () => fetchPrincipalUrl,
	serviceDiscovery: () => serviceDiscovery
});
const debug$1 = (0, import_browser.default)("tsdav:account");
const getCandidateRootUrls = (serverUrl, discoveredRootUrl) => {
	const candidates = [
		discoveredRootUrl,
		serverUrl,
		new URL("/", serverUrl).href
	];
	return candidates.filter((url, index) => candidates.indexOf(url) === index);
};
const serviceDiscovery = async (params) => {
	debug$1("Service discovery...");
	const { account, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const requestFetch = fetchOverride ?? fetch;
	const endpoint = new URL(account.serverUrl);
	const uri = new URL(`/.well-known/${account.accountType}`, endpoint);
	uri.protocol = endpoint.protocol ?? "http";
	const extractRedirect = (response) => {
		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get("Location");
			if (typeof location === "string" && location.length) {
				debug$1(`Service discovery redirected to ${location}`);
				const hasExplicitScheme = /^[a-z][a-z0-9+.-]*:/i.test(location);
				const serviceURL = new URL(location, endpoint);
				if (serviceURL.hostname === uri.hostname && uri.port && !serviceURL.port) serviceURL.port = uri.port;
				if (!hasExplicitScheme) serviceURL.protocol = endpoint.protocol ?? "http";
				return serviceURL.href;
			}
		}
	};
	try {
		const redirectUrl = extractRedirect(await requestFetch(uri.href, {
			...fetchOptions,
			method: "PROPFIND",
			headers: {
				...excludeHeaders(headers, headersToExclude),
				"Content-Type": "text/xml;charset=UTF-8"
			},
			body: `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:resourcetype/>
  </d:prop>
</d:propfind>`,
			redirect: "manual"
		}));
		if (redirectUrl) return redirectUrl;
	} catch (err) {
		debug$1(`Service discovery PROPFIND failed: ${err.stack}`);
	}
	try {
		const redirectUrl = extractRedirect(await requestFetch(uri.href, {
			...fetchOptions,
			method: "GET",
			headers: excludeHeaders(headers, headersToExclude),
			redirect: "manual"
		}));
		if (redirectUrl) return redirectUrl;
	} catch (err) {
		debug$1(`Service discovery GET failed: ${err.stack}`);
	}
	return endpoint.href;
};
const fetchPrincipalUrl = async (params) => {
	const { account, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const requiredFields = ["rootUrl"];
	if (!hasFields(account, requiredFields)) throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchPrincipalUrl`);
	debug$1(`Fetching principal url from path ${account.rootUrl}`);
	const [response] = await propfind({
		url: account.rootUrl,
		props: { [`d:current-user-principal`]: {} },
		depth: "0",
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
	if (!response.ok) {
		debug$1(`Fetch principal url failed: ${response.statusText}`);
		if (response.status === 401) throw new Error(`Invalid credentials: PROPFIND ${account.rootUrl} returned 401 Unauthorized`);
		throw new Error("cannot find principalUrl");
	}
	const principalHref = response.props?.currentUserPrincipal?.href;
	if (typeof principalHref !== "string" || !principalHref.length) {
		debug$1("Fetch principal url failed: missing current-user-principal href");
		throw new Error("cannot find principalUrl");
	}
	debug$1(`Fetched principal url ${principalHref}`);
	return new URL(principalHref, account.rootUrl).href;
};
const fetchHomeUrl = async (params) => {
	const { account, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const requiredFields = ["principalUrl", "rootUrl"];
	if (!hasFields(account, requiredFields)) throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchHomeUrl`);
	debug$1(`Fetch home url from ${account.principalUrl}`);
	const responses = await propfind({
		url: account.principalUrl,
		props: account.accountType === "caldav" ? { [`c:calendar-home-set`]: {} } : { [`card:addressbook-home-set`]: {} },
		depth: "0",
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
	const matched = responses.find((r) => urlContains(account.principalUrl, r.href));
	if (!matched || !matched.ok) {
		debug$1(`Fetch home url failed with status ${matched?.statusText} and error ${JSON.stringify(responses.map((r) => r.error))}`);
		throw new Error("cannot find homeUrl");
	}
	const homeHref = account.accountType === "caldav" ? matched.props?.calendarHomeSet?.href : matched.props?.addressbookHomeSet?.href;
	if (typeof homeHref !== "string" || homeHref.length === 0) {
		debug$1(`Fetch home url failed: server did not return a ${account.accountType === "caldav" ? "calendar-home-set" : "addressbook-home-set"} href`);
		throw new Error("cannot find homeUrl");
	}
	const result = new URL(homeHref, account.rootUrl).href;
	debug$1(`Fetched home url ${result}`);
	return result;
};
const createAccount = async (params) => {
	const { account, headers, loadCollections = false, loadObjects = false, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const newAccount = { ...account };
	const discoveredRootUrl = account.rootUrl ?? await serviceDiscovery({
		account,
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
	if (account.rootUrl) newAccount.rootUrl = account.rootUrl;
	else if (account.principalUrl) newAccount.rootUrl = discoveredRootUrl;
	else {
		const findPrincipalUrl = async (rootUrls, index = 0, lastPrincipalError) => {
			const rootUrl = rootUrls[index];
			if (!rootUrl) throw lastPrincipalError ?? /* @__PURE__ */ new Error("cannot find principalUrl");
			try {
				return {
					rootUrl,
					principalUrl: await fetchPrincipalUrl({
						account: {
							...newAccount,
							rootUrl
						},
						headers: excludeHeaders(headers, headersToExclude),
						fetchOptions,
						fetch: fetchOverride
					})
				};
			} catch (err) {
				return findPrincipalUrl(rootUrls, index + 1, err);
			}
		};
		const { rootUrl, principalUrl } = await findPrincipalUrl(getCandidateRootUrls(account.serverUrl, discoveredRootUrl));
		newAccount.rootUrl = rootUrl;
		newAccount.principalUrl = principalUrl;
	}
	newAccount.principalUrl = account.principalUrl ?? newAccount.principalUrl ?? await fetchPrincipalUrl({
		account: newAccount,
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
	newAccount.homeUrl = account.homeUrl ?? await fetchHomeUrl({
		account: newAccount,
		headers: excludeHeaders(headers, headersToExclude),
		fetchOptions,
		fetch: fetchOverride
	});
	if (loadCollections || loadObjects) {
		if (account.accountType === "caldav") newAccount.calendars = await fetchCalendars({
			headers: excludeHeaders(headers, headersToExclude),
			account: newAccount,
			fetchOptions,
			fetch: fetchOverride
		});
		else if (account.accountType === "carddav") newAccount.addressBooks = await fetchAddressBooks({
			headers: excludeHeaders(headers, headersToExclude),
			account: newAccount,
			fetchOptions,
			fetch: fetchOverride
		});
	}
	if (loadObjects) {
		if (account.accountType === "caldav" && newAccount.calendars) newAccount.calendars = await Promise.all(newAccount.calendars.map(async (cal) => ({
			...cal,
			objects: await fetchCalendarObjects({
				calendar: cal,
				headers: excludeHeaders(headers, headersToExclude),
				fetchOptions,
				fetch: fetchOverride
			})
		})));
		else if (account.accountType === "carddav" && newAccount.addressBooks) newAccount.addressBooks = await Promise.all(newAccount.addressBooks.map(async (addr) => ({
			...addr,
			objects: await fetchVCards({
				addressBook: addr,
				headers: excludeHeaders(headers, headersToExclude),
				fetchOptions,
				fetch: fetchOverride
			})
		})));
	}
	return newAccount;
};
//#endregion
//#region src/util/authHelpers.ts
var authHelpers_exports = /* @__PURE__ */ __exportAll({
	defaultParam: () => defaultParam,
	fetchOauthTokens: () => fetchOauthTokens,
	getBasicAuthHeaders: () => getBasicAuthHeaders,
	getBearerAuthHeaders: () => getBearerAuthHeaders,
	getOauthHeaders: () => getOauthHeaders,
	refreshAccessToken: () => refreshAccessToken
});
const debug = (0, import_browser.default)("tsdav:authHelper");
const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const NON_LATIN1_BASIC_AUTH_MESSAGE = "The string to be encoded contains characters outside of the Latin1 range.";
var InvalidCharacterError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "InvalidCharacterError";
	}
};
const assertLatin1 = (charCode) => {
	if (charCode > 255) throw new InvalidCharacterError(NON_LATIN1_BASIC_AUTH_MESSAGE);
};
const encodeBase64 = (input) => {
	let output = "";
	let position = 0;
	while (position < input.length) {
		const first = input.charCodeAt(position);
		position += 1;
		assertLatin1(first);
		if (position === input.length) {
			output += BASE64_ALPHABET[Math.floor(first / 4)];
			output += `${BASE64_ALPHABET[first % 4 * 16]}==`;
			break;
		}
		const second = input.charCodeAt(position);
		position += 1;
		assertLatin1(second);
		if (position === input.length) {
			output += BASE64_ALPHABET[Math.floor(first / 4)];
			output += BASE64_ALPHABET[first % 4 * 16 + Math.floor(second / 16)];
			output += `${BASE64_ALPHABET[second % 16 * 4]}=`;
			break;
		}
		const third = input.charCodeAt(position);
		position += 1;
		assertLatin1(third);
		output += BASE64_ALPHABET[Math.floor(first / 4)];
		output += BASE64_ALPHABET[first % 4 * 16 + Math.floor(second / 16)];
		output += BASE64_ALPHABET[second % 16 * 4 + Math.floor(third / 64)];
		output += BASE64_ALPHABET[third % 64];
	}
	return output;
};
/**
* Provide given params as default params to given function with optional params.
*
* suitable only for one param functions
* params are shallow merged
*/
const defaultParam = (fn, params) => (...args) => {
	return fn({
		...params,
		...args[0]
	});
};
const getBasicAuthHeaders = (credentials) => {
	debug(`Basic auth token generated for user "${credentials.username ?? ""}"`);
	return { authorization: `Basic ${encodeBase64(`${credentials.username}:${credentials.password}`)}` };
};
const getBearerAuthHeaders = (credentials) => {
	return { authorization: `Bearer ${credentials.accessToken}` };
};
const fetchOauthTokens = async (credentials, fetchOptions, fetchOverride) => {
	const requireFields = [
		"authorizationCode",
		"redirectUrl",
		"clientId",
		"clientSecret",
		"tokenUrl"
	];
	if (!hasFields(credentials, requireFields)) throw new Error(`Oauth credentials missing: ${findMissingFieldNames(credentials, requireFields)}`);
	const param = new URLSearchParams({
		grant_type: "authorization_code",
		code: credentials.authorizationCode,
		redirect_uri: credentials.redirectUrl,
		client_id: credentials.clientId,
		client_secret: credentials.clientSecret
	});
	debug(`Fetching oauth tokens from ${credentials.tokenUrl}`);
	const response = await (fetchOverride ?? fetch)(credentials.tokenUrl, {
		method: "POST",
		body: param.toString(),
		headers: { "content-type": "application/x-www-form-urlencoded" },
		...fetchOptions ?? {}
	});
	if (response.ok) return await response.json();
	debug(`Fetch Oauth tokens failed with status ${response.status}`);
	return {};
};
const refreshAccessToken = async (credentials, fetchOptions, fetchOverride) => {
	const requireFields = [
		"refreshToken",
		"clientId",
		"clientSecret",
		"tokenUrl"
	];
	if (!hasFields(credentials, requireFields)) throw new Error(`Oauth credentials missing: ${findMissingFieldNames(credentials, requireFields)}`);
	const param = new URLSearchParams({
		client_id: credentials.clientId,
		client_secret: credentials.clientSecret,
		refresh_token: credentials.refreshToken,
		grant_type: "refresh_token"
	});
	const response = await (fetchOverride ?? fetch)(credentials.tokenUrl, {
		method: "POST",
		body: param.toString(),
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		...fetchOptions ?? {}
	});
	if (response.ok) return await response.json();
	debug(`Refresh access token failed with status ${response.status}`);
	return {};
};
/**
* Resolve OAuth headers for the given credentials.
*
* This will mutate `credentials` in-place with the freshly issued
* `accessToken`, `refreshToken` (if rotated by the provider), and an
* `expiration` timestamp (ms since epoch). Callers that persist credentials
* across sessions should re-read these fields from the same credentials
* object after this call.
*/
const getOauthHeaders = async (credentials, fetchOptions, fetchOverride) => {
	debug("Fetching oauth headers");
	let tokens = {};
	let didRefresh = false;
	if (!credentials.refreshToken) {
		tokens = await fetchOauthTokens(credentials, fetchOptions, fetchOverride);
		didRefresh = true;
	} else if (credentials.refreshToken && !credentials.accessToken || Date.now() > (credentials.expiration ?? 0)) {
		tokens = await refreshAccessToken(credentials, fetchOptions, fetchOverride);
		didRefresh = true;
	} else tokens = {
		access_token: credentials.accessToken,
		refresh_token: credentials.refreshToken
	};
	if (didRefresh) {
		if (tokens.access_token) credentials.accessToken = tokens.access_token;
		if (tokens.refresh_token) credentials.refreshToken = tokens.refresh_token;
		if (typeof tokens.expires_in === "number") credentials.expiration = Date.now() + tokens.expires_in * 1e3;
	}
	debug("Oauth tokens obtained");
	return {
		tokens,
		headers: tokens.access_token ? { authorization: `Bearer ${tokens.access_token}` } : {}
	};
};
//#endregion
//#region src/client.ts
var client_exports = /* @__PURE__ */ __exportAll({
	DAVClient: () => DAVClient,
	createDAVClient: () => createDAVClient
});
const createDAVClient = async (params) => {
	const { serverUrl, credentials, authMethod = "Basic", defaultAccountType, authFunction, fetchOptions: defaultFetchOptions, fetch: fetchOverride } = params;
	let authHeaders = {};
	switch (authMethod) {
		case "Basic":
			authHeaders = getBasicAuthHeaders(credentials);
			break;
		case "Bearer":
			authHeaders = getBearerAuthHeaders(credentials);
			break;
		case "Oauth":
			authHeaders = (await getOauthHeaders(credentials, void 0, fetchOverride)).headers;
			break;
		case "Digest":
			authHeaders = { Authorization: `Digest ${credentials.digestString}` };
			break;
		case "Custom":
			if (!authFunction) throw new Error("authMethod 'Custom' requires an authFunction to produce request headers");
			authHeaders = await authFunction(credentials) ?? {};
			break;
		default: throw new Error("Invalid auth method");
	}
	const defaultAccount = defaultAccountType ? await createAccount({
		account: {
			serverUrl,
			credentials,
			accountType: defaultAccountType
		},
		headers: authHeaders,
		fetchOptions: defaultFetchOptions,
		fetch: fetchOverride
	}) : void 0;
	const davRequest$1 = async (params0) => {
		const { init, fetchOptions, fetch: fetchOverride2, ...rest } = params0;
		const { headers, ...restInit } = init;
		return davRequest({
			...rest,
			init: {
				...restInit,
				headers: {
					...authHeaders,
					...headers
				}
			},
			fetchOptions: fetchOptions ?? defaultFetchOptions,
			fetch: fetchOverride2 ?? fetchOverride
		});
	};
	const commonDefaults = {
		headers: authHeaders,
		fetchOptions: defaultFetchOptions,
		fetch: fetchOverride
	};
	const commonDefaultsWithUrl = {
		url: serverUrl,
		...commonDefaults
	};
	const commonDefaultsWithAccount = {
		account: defaultAccount,
		...commonDefaults
	};
	const createObject$1 = defaultParam(createObject, commonDefaultsWithUrl);
	const updateObject$1 = defaultParam(updateObject, commonDefaultsWithUrl);
	const deleteObject$1 = defaultParam(deleteObject, commonDefaultsWithUrl);
	const propfind$1 = defaultParam(propfind, commonDefaults);
	const createAccount$1 = async (params0) => {
		const { account, headers, loadCollections, loadObjects, fetchOptions, fetch: fetchOverride2 } = params0;
		const merged = {
			serverUrl,
			credentials,
			...account
		};
		if (!merged.accountType) throw new Error("createAccount requires an accountType; pass one via `account.accountType` or set `defaultAccountType` on the client.");
		return createAccount({
			account: merged,
			headers: {
				...authHeaders,
				...headers
			},
			loadCollections,
			loadObjects,
			fetchOptions: fetchOptions ?? defaultFetchOptions,
			fetch: fetchOverride2 ?? fetchOverride
		});
	};
	const collectionQuery$1 = defaultParam(collectionQuery, commonDefaults);
	const makeCollection$1 = defaultParam(makeCollection, commonDefaults);
	const syncCollection$1 = defaultParam(syncCollection, commonDefaults);
	const supportedReportSet$1 = defaultParam(supportedReportSet, commonDefaults);
	const isCollectionDirty$1 = defaultParam(isCollectionDirty, commonDefaults);
	const smartCollectionSync$1 = defaultParam(smartCollectionSync, commonDefaultsWithAccount);
	const smartCollectionSyncDetailed$1 = defaultParam(smartCollectionSyncDetailed, commonDefaultsWithAccount);
	const calendarQuery$1 = defaultParam(calendarQuery, commonDefaults);
	const calendarMultiGet$1 = defaultParam(calendarMultiGet, commonDefaults);
	const makeCalendar$1 = defaultParam(makeCalendar, commonDefaults);
	const fetchCalendars$1 = defaultParam(fetchCalendars, commonDefaultsWithAccount);
	const fetchCalendarUserAddresses$1 = defaultParam(fetchCalendarUserAddresses, commonDefaultsWithAccount);
	const fetchCalendarObjects$1 = defaultParam(fetchCalendarObjects, commonDefaults);
	const createCalendarObject$1 = defaultParam(createCalendarObject, commonDefaults);
	const updateCalendarObject$1 = defaultParam(updateCalendarObject, commonDefaults);
	const deleteCalendarObject$1 = defaultParam(deleteCalendarObject, commonDefaults);
	const syncCalendars$1 = defaultParam(syncCalendars, commonDefaultsWithAccount);
	const syncCalendarsDetailed$1 = defaultParam(syncCalendarsDetailed, commonDefaultsWithAccount);
	const addressBookQuery$1 = defaultParam(addressBookQuery, commonDefaults);
	const addressBookMultiGet$1 = defaultParam(addressBookMultiGet, commonDefaults);
	return {
		davRequest: davRequest$1,
		propfind: propfind$1,
		createAccount: createAccount$1,
		createObject: createObject$1,
		updateObject: updateObject$1,
		deleteObject: deleteObject$1,
		calendarQuery: calendarQuery$1,
		addressBookQuery: addressBookQuery$1,
		collectionQuery: collectionQuery$1,
		makeCollection: makeCollection$1,
		calendarMultiGet: calendarMultiGet$1,
		makeCalendar: makeCalendar$1,
		syncCollection: syncCollection$1,
		supportedReportSet: supportedReportSet$1,
		isCollectionDirty: isCollectionDirty$1,
		smartCollectionSync: smartCollectionSync$1,
		smartCollectionSyncDetailed: smartCollectionSyncDetailed$1,
		fetchCalendars: fetchCalendars$1,
		fetchCalendarUserAddresses: fetchCalendarUserAddresses$1,
		fetchCalendarObjects: fetchCalendarObjects$1,
		createCalendarObject: createCalendarObject$1,
		updateCalendarObject: updateCalendarObject$1,
		deleteCalendarObject: deleteCalendarObject$1,
		syncCalendars: syncCalendars$1,
		syncCalendarsDetailed: syncCalendarsDetailed$1,
		fetchAddressBooks: defaultParam(fetchAddressBooks, commonDefaultsWithAccount),
		addressBookMultiGet: addressBookMultiGet$1,
		fetchVCards: defaultParam(fetchVCards, commonDefaults),
		createVCard: defaultParam(createVCard, commonDefaults),
		updateVCard: defaultParam(updateVCard, commonDefaults),
		deleteVCard: defaultParam(deleteVCard, commonDefaults)
	};
};
var DAVClient = class {
	constructor(params) {
		this.serverUrl = params.serverUrl;
		this.credentials = params.credentials;
		this.authMethod = params.authMethod ?? "Basic";
		this.accountType = params.defaultAccountType ?? "caldav";
		this.authFunction = params.authFunction;
		this.fetchOptions = params.fetchOptions ?? {};
		this.fetchOverride = params.fetch;
	}
	async login(options) {
		switch (this.authMethod) {
			case "Basic":
				this.authHeaders = getBasicAuthHeaders(this.credentials);
				break;
			case "Bearer":
				this.authHeaders = getBearerAuthHeaders(this.credentials);
				break;
			case "Oauth":
				this.authHeaders = (await getOauthHeaders(this.credentials, this.fetchOptions, this.fetchOverride)).headers;
				break;
			case "Digest":
				this.authHeaders = { Authorization: `Digest ${this.credentials.digestString}` };
				break;
			case "Custom":
				if (!this.authFunction) throw new Error("authMethod 'Custom' requires an authFunction to produce request headers");
				this.authHeaders = await this.authFunction(this.credentials);
				break;
			default: throw new Error("Invalid auth method");
		}
		this.account = this.accountType ? await createAccount({
			account: {
				serverUrl: this.serverUrl,
				credentials: this.credentials,
				accountType: this.accountType
			},
			headers: this.authHeaders,
			loadCollections: options?.loadCollections,
			loadObjects: options?.loadObjects,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		}) : void 0;
	}
	async davRequest(params0) {
		const { init, fetchOptions, fetch: fetchOverride2, ...rest } = params0;
		const { headers, ...restInit } = init;
		return davRequest({
			...rest,
			init: {
				...restInit,
				headers: {
					...this.authHeaders,
					...headers
				}
			},
			fetchOptions: fetchOptions ?? this.fetchOptions,
			fetch: fetchOverride2 ?? this.fetchOverride
		});
	}
	async createObject(...params) {
		return defaultParam(createObject, {
			url: this.serverUrl,
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async updateObject(...params) {
		return defaultParam(updateObject, {
			url: this.serverUrl,
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async deleteObject(...params) {
		return defaultParam(deleteObject, {
			url: this.serverUrl,
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async propfind(...params) {
		return defaultParam(propfind, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async createAccount(params0) {
		const { account, headers, loadCollections, loadObjects, fetchOptions, fetch } = params0;
		const accountType = account.accountType ?? this.accountType;
		if (!accountType) throw new Error("createAccount requires an accountType; pass one via `account.accountType` or configure `defaultAccountType` on the DAVClient.");
		return createAccount({
			account: {
				serverUrl: this.serverUrl,
				credentials: this.credentials,
				...account,
				accountType
			},
			headers: {
				...this.authHeaders,
				...headers
			},
			loadCollections,
			loadObjects,
			fetchOptions: fetchOptions ?? this.fetchOptions,
			fetch: fetch ?? this.fetchOverride
		});
	}
	async collectionQuery(...params) {
		return defaultParam(collectionQuery, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async makeCollection(...params) {
		return defaultParam(makeCollection, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async syncCollection(...params) {
		return defaultParam(syncCollection, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async supportedReportSet(...params) {
		return defaultParam(supportedReportSet, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async isCollectionDirty(...params) {
		return defaultParam(isCollectionDirty, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async smartCollectionSync(...params) {
		return defaultParam(smartCollectionSync, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride,
			account: this.account
		})(params[0]);
	}
	async smartCollectionSyncDetailed(param) {
		return defaultParam(smartCollectionSyncDetailed, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride,
			account: this.account
		})(param);
	}
	async calendarQuery(...params) {
		return defaultParam(calendarQuery, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async makeCalendar(...params) {
		return defaultParam(makeCalendar, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async calendarMultiGet(...params) {
		return defaultParam(calendarMultiGet, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async fetchCalendars(...params) {
		return defaultParam(fetchCalendars, {
			headers: this.authHeaders,
			account: this.account,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params?.[0]);
	}
	async fetchCalendarUserAddresses(...params) {
		return defaultParam(fetchCalendarUserAddresses, {
			headers: this.authHeaders,
			account: this.account,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params?.[0]);
	}
	async fetchCalendarObjects(...params) {
		return defaultParam(fetchCalendarObjects, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async createCalendarObject(...params) {
		return defaultParam(createCalendarObject, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async updateCalendarObject(...params) {
		return defaultParam(updateCalendarObject, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async deleteCalendarObject(...params) {
		return defaultParam(deleteCalendarObject, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async syncCalendars(...params) {
		return defaultParam(syncCalendars, {
			headers: this.authHeaders,
			account: this.account,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async syncCalendarsDetailed(...params) {
		return defaultParam(syncCalendarsDetailed, {
			headers: this.authHeaders,
			account: this.account,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async addressBookQuery(...params) {
		return defaultParam(addressBookQuery, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async addressBookMultiGet(...params) {
		return defaultParam(addressBookMultiGet, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async fetchAddressBooks(...params) {
		return defaultParam(fetchAddressBooks, {
			headers: this.authHeaders,
			account: this.account,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params?.[0]);
	}
	async fetchVCards(...params) {
		return defaultParam(fetchVCards, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async createVCard(...params) {
		return defaultParam(createVCard, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async updateVCard(...params) {
		return defaultParam(updateVCard, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
	async deleteVCard(...params) {
		return defaultParam(deleteVCard, {
			headers: this.authHeaders,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		})(params[0]);
	}
};
//#endregion
//#region src/index.ts
var src_default = {
	DAVNamespace,
	DAVNamespaceShort,
	DAVAttributeMap,
	...client_exports,
	...request_exports,
	...collection_exports,
	...account_exports,
	...addressBook_exports,
	...calendar_exports,
	...authHelpers_exports,
	...requestHelpers_exports
};
//#endregion
export { DAVAttributeMap, DAVClient, DAVNamespace, DAVNamespaceShort, addressBookMultiGet, addressBookQuery, calendarMultiGet, calendarQuery, cleanupFalsy, collectionQuery, createAccount, createCalendarObject, createDAVClient, createObject, createVCard, davRequest, src_default as default, deleteCalendarObject, deleteObject, deleteVCard, fetchAddressBooks, fetchCalendarObjects, fetchCalendarUserAddresses, fetchCalendars, fetchOauthTokens, fetchVCards, freeBusyQuery, getBasicAuthHeaders, getBearerAuthHeaders, getDAVAttribute, getOauthHeaders, isCollectionDirty, makeCalendar, propfind, refreshAccessToken, smartCollectionSync, smartCollectionSyncDetailed, supportedReportSet, syncCalendars, syncCalendarsDetailed, syncCollection, updateCalendarObject, updateObject, updateVCard, urlContains, urlEquals };
