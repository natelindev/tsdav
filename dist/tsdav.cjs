Object.defineProperties(exports, {
	__esModule: { value: true },
	[Symbol.toStringTag]: { value: "Module" }
});
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let debug = require("debug");
debug = __toESM(debug);
let xml_js = require("xml-js");
xml_js = __toESM(xml_js);
//#region src/consts.ts
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
//#region src/util/camelCase.ts
const camelCase = (str) => str.replace(/[-_]+(\w?)/g, (_m, c) => c ? c.toUpperCase() : "");
//#endregion
//#region src/util/typeHelpers.ts
function hasFields(obj, fields) {
	if (!obj) return false;
	const inObj = (object) => object != null && fields.every((f) => object[f]);
	if (Array.isArray(obj)) return obj.length > 0 && obj.every((o) => inObj(o));
	return inObj(obj);
}
const findMissingFieldNames = (obj, fields) => {
	if (!obj || typeof obj !== "object") return fields.map((f) => f.toString()).join(",");
	return fields.reduce((prev, curr) => obj[curr] ? prev : `${prev.length ? `${prev},` : ""}${curr.toString()}`, "");
};
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
//#endregion
//#region src/util/xml.ts
const davNamespaces = new Set(Object.values(DAVNamespace));
const standardNamespaces = new Map([
	...[
		"multistatus",
		"response",
		"propstat",
		"prop",
		"href",
		"status",
		"error",
		"responsedescription",
		"resourcetype",
		"collection",
		"getetag",
		"displayname",
		"syncToken",
		"supportedReportSet",
		"supportedReport",
		"report",
		"currentUserPrincipal"
	].map((name) => [name, "DAV:"]),
	...[
		"calendarData",
		"calendar",
		"calendarDescription",
		"calendarTimezone",
		"calendarHomeSet",
		"calendarUserAddressSet",
		"supportedCalendarComponentSet",
		"comp"
	].map((name) => [name, "urn:ietf:params:xml:ns:caldav"]),
	...[
		"addressData",
		"addressbook",
		"addressbookHomeSet"
	].map((name) => [name, "urn:ietf:params:xml:ns:carddav"]),
	["getctag", "http://calendarserver.org/ns/"],
	["calendarColor", "http://apple.com/ns/ical/"]
]);
const normalizedKey = (name, namespace) => {
	const localName = camelCase(name.replace(/^.*:/, ""));
	const standardNamespace = standardNamespaces.get(localName);
	return namespace && standardNamespace && namespace !== standardNamespace ? `{${namespace}}${localName}` : localName;
};
const normalizeElement = (element, inheritedNamespaces) => {
	const namespaceContext = Object.assign(Object.create(null), inheritedNamespaces);
	const attributes = Object.create(null);
	for (const [name, value] of Object.entries(element.attributes ?? {})) {
		if (name === "xmlns" || name.startsWith("xmlns:")) namespaceContext[name === "xmlns" ? "" : name.slice(6)] = String(value);
		if (name !== "xmlns") attributes[name] = value;
	}
	const name = element.name ?? "";
	const separator = name.indexOf(":");
	const namespace = namespaceContext[separator === -1 ? "" : name.slice(0, separator)] ?? "";
	const children = element.elements ?? [];
	const elements = children.filter((child) => child.type === "element");
	const text = children.filter((child) => child.type === "text" || child.type === "cdata").map((child) => String(child.text ?? child.cdata ?? "")).join("");
	const value = {};
	const namespaces = Object.create(null);
	if (Object.keys(attributes).length) value._attributes = attributes;
	if (!elements.length) {
		const hasText = children.some((child) => child.type === "text");
		const hasCdata = children.some((child) => child.type === "cdata");
		if (hasText) return {
			value: text,
			namespace,
			namespaces
		};
		if (hasCdata) value._cdata = text;
		return {
			value,
			namespace,
			namespaces
		};
	}
	if (text.trim()) value._text = text;
	for (const child of elements) {
		const normalized = normalizeElement(child, namespaceContext);
		const localName = camelCase((child.name ?? "").replace(/^.*:/, ""));
		let key = normalizedKey(child.name ?? "", normalized.namespace);
		const previousNamespace = namespaces[key];
		if (hasOwn(value, key) && previousNamespace !== normalized.namespace) {
			if (davNamespaces.has(normalized.namespace) && !davNamespaces.has(previousNamespace)) {
				const previousKey = `{${previousNamespace}}${localName}`;
				Object.defineProperty(value, previousKey, {
					value: value[key],
					enumerable: true,
					configurable: true,
					writable: true
				});
				namespaces[previousKey] = previousNamespace;
				delete value[key];
			} else key = `{${normalized.namespace}}${localName}`;
		}
		if (hasOwn(value, key)) {
			if (Array.isArray(value[key])) value[key].push(normalized.value);
			else value[key] = [value[key], normalized.value];
		} else Object.defineProperty(value, key, {
			value: normalized.value,
			enumerable: true,
			configurable: true,
			writable: true
		});
		namespaces[key] = normalized.namespace;
		if (localName === "prop" && normalized.namespace === "DAV:") value.propNamespaces = normalized.namespaces;
	}
	return {
		value,
		namespace,
		namespaces
	};
};
/** Preserve XML text order before normalizing DAV names to the existing compact shape. */
const parseDAVXML = (xml) => {
	const document = xml_js.default.xml2js(xml, {
		compact: false,
		ignoreDeclaration: true
	});
	const result = {};
	for (const element of document.elements ?? []) {
		if (element.type !== "element") continue;
		const normalized = normalizeElement(element, {});
		const key = normalizedKey(element.name ?? "", normalized.namespace);
		Object.defineProperty(result, key, {
			value: normalized.value,
			enumerable: true
		});
	}
	return result;
};
/** Keep same-name properties from distinct namespaces across propstat groups. */
const mergeDAVProps = (propStats) => {
	const groups = /* @__PURE__ */ new Map();
	for (const stat of propStats) {
		if (!stat.ok) continue;
		for (const [name, value] of Object.entries(stat.props)) {
			const namespaces = groups.get(name) ?? /* @__PURE__ */ new Map();
			namespaces.set(stat.namespaces?.[name] ?? "", value);
			groups.set(name, namespaces);
		}
	}
	const props = {};
	for (const [name, namespaces] of groups) {
		const primary = [...namespaces.keys()].find((namespace) => davNamespaces.has(namespace)) ?? namespaces.keys().next().value;
		for (const [namespace, value] of namespaces) Object.defineProperty(props, namespace === primary ? name : `{${namespace}}${name}`, {
			value,
			enumerable: true,
			configurable: true,
			writable: true
		});
	}
	return props;
};
//#endregion
//#region src/util/requestHelpers.ts
var requestHelpers_exports = /* @__PURE__ */ __exportAll({
	cleanupFalsy: () => cleanupFalsy,
	conditionalParam: () => conditionalParam,
	ensureTrailingSlash: () => ensureTrailingSlash,
	excludeHeaders: () => excludeHeaders,
	getDAVAttribute: () => getDAVAttribute,
	mergeHeaders: () => mergeHeaders,
	urlContains: () => urlContains,
	urlEquals: () => urlEquals,
	urlMatches: () => urlMatches
});
const normalizeUrl = (url) => {
	const trimmed = url.trim();
	return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};
/** Ensure a directory or collection URL ends with a trailing slash for relative resolution. */
const ensureTrailingSlash = (url) => {
	const trimmed = url.trim();
	const suffixIndex = trimmed.search(/[?#]/);
	const pathname = suffixIndex === -1 ? trimmed : trimmed.slice(0, suffixIndex);
	const suffix = suffixIndex === -1 ? "" : trimmed.slice(suffixIndex);
	return `${pathname.endsWith("/") ? pathname : `${pathname}/`}${suffix}`;
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
/**
* Compare two DAV hrefs as resource identifiers after resolving relative
* hrefs against the same collection or account URL.
*/
const urlMatches = (urlA, urlB, baseUrl) => {
	if (!urlA || !urlB || !baseUrl) return urlEquals(urlA, urlB);
	try {
		return urlEquals(new URL(urlA, baseUrl).href, new URL(urlB, baseUrl).href);
	} catch {
		return urlEquals(urlA, urlB);
	}
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
/** Merge all valid HeadersInit forms with case-insensitive last-write-wins semantics. */
const mergeHeaders = (...headerSources) => {
	const headersByLowercaseName = /* @__PURE__ */ new Map();
	const setHeader = (name, value) => {
		headersByLowercaseName.set(name.toLowerCase(), [name, value]);
	};
	for (const source of headerSources) {
		if (!source) continue;
		if (Array.isArray(source)) {
			for (const [name, value] of source) setHeader(name, value);
			continue;
		}
		if (typeof source.forEach === "function") {
			source.forEach((value, name) => {
				setHeader(name, value);
			});
			continue;
		}
		for (const [name, value] of Object.entries(source)) setHeader(name, value);
	}
	return Object.fromEntries(headersByLowercaseName.values());
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
const debug$6 = (0, debug.default)("tsdav:request");
const parseStatusLine = (statusLine) => {
	const match = /^\S+\s+(?<status>\d{3})(?:\s+(?<statusText>.*))?$/.exec(statusLine?.trim() ?? "");
	const status = match?.groups?.status;
	const statusText = match?.groups?.statusText;
	return status ? {
		status: Number.parseInt(status, 10),
		statusText: statusText ?? ""
	} : void 0;
};
const davRequest = async (params) => {
	const { url, init, convertIncoming = true, parseOutgoing = true, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const requestFetch = fetchOverride ?? fetch;
	const { headers = {}, body, namespace, method, attributes } = init;
	let processedBody = body;
	if (attributes && body != null && typeof body === "object" && !Array.isArray(body)) processedBody = Object.fromEntries(Object.entries(body).map(([key, value]) => {
		if (value && typeof value === "object" && !Array.isArray(value)) {
			const element = value;
			return [key, {
				...element,
				_attributes: {
					...attributes,
					...element._attributes
				}
			}];
		}
		return [key, value];
	}));
	const xmlBody = convertIncoming && body != null ? xml_js.default.js2xml({
		_declaration: { _attributes: {
			version: "1.0",
			encoding: "utf-8"
		} },
		...processedBody
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
	const mergedHeaders = excludeHeaders(mergeHeaders({ "Content-Type": "text/xml;charset=UTF-8" }, cleanupFalsy(headers), fetchOptions.headers), headersToExclude);
	const davResponse = await requestFetch(url, {
		...fetchOptionsWithoutHeaders,
		headers: mergedHeaders,
		body: xmlBody,
		method
	});
	const resText = await davResponse.text();
	if (!davResponse.ok || !davResponse.headers.get("content-type")?.toLowerCase().includes("xml") || !parseOutgoing || !resText) return [{
		href: davResponse.url,
		ok: davResponse.ok,
		status: davResponse.status,
		statusText: davResponse.statusText,
		raw: resText
	}];
	let result;
	try {
		result = parseDAVXML(resText);
	} catch (e) {
		debug$6(`Failed to parse DAV response XML: ${e.message}`);
		return [{
			href: davResponse.url,
			ok: false,
			status: davResponse.status,
			statusText: davResponse.statusText,
			raw: resText,
			parseError: e.message
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
		if (!responseBody) return {
			raw: result,
			status: davResponse.status,
			statusText: davResponse.statusText,
			ok: davResponse.ok
		};
		const propStats = (Array.isArray(responseBody.propstat) ? responseBody.propstat : responseBody.propstat ? [responseBody.propstat] : []).map((stat) => {
			const parsed = parseStatusLine(stat.status);
			const status = parsed?.status ?? 0;
			return {
				props: stat.prop ?? {},
				namespaces: stat.propNamespaces,
				status,
				statusText: parsed?.statusText ?? "Invalid DAV property status",
				ok: status >= 200 && status < 300,
				error: stat.error,
				responsedescription: stat.responsedescription
			};
		});
		const failedStatus = propStats.length > 0 && propStats.every((stat) => !stat.ok) ? propStats[0] : void 0;
		const parsedStatus = parseStatusLine(responseBody.status) ?? failedStatus;
		const status = parsedStatus?.status ?? davResponse.status;
		return {
			raw: result,
			href: responseBody.href,
			status,
			statusText: parsedStatus?.statusText ?? davResponse.statusText,
			ok: status >= 200 && status < 300,
			error: responseBody.error,
			responsedescription: responseBody.responsedescription,
			propStats,
			props: mergeDAVProps(propStats)
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
		headersToExclude,
		fetchOptions,
		fetch: fetchOverride
	});
};
const createObject = async (params) => {
	const { url, data, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const requestFetch = fetchOverride ?? fetch;
	const { headers: fetchHeaders, ...fetchOptionsWithoutHeaders } = fetchOptions;
	return requestFetch(url, {
		...fetchOptionsWithoutHeaders,
		method: "PUT",
		body: data,
		headers: excludeHeaders(mergeHeaders(headers, fetchHeaders), headersToExclude)
	});
};
const updateObject = async (params) => {
	const { url, data, etag, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const requestFetch = fetchOverride ?? fetch;
	const { headers: fetchHeaders, ...fetchOptionsWithoutHeaders } = fetchOptions;
	return requestFetch(url, {
		...fetchOptionsWithoutHeaders,
		method: "PUT",
		body: data,
		headers: excludeHeaders(mergeHeaders(cleanupFalsy({
			"If-Match": etag,
			...headers
		}), fetchHeaders), headersToExclude)
	});
};
const deleteObject = async (params) => {
	const { url, headers, etag, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const requestFetch = fetchOverride ?? fetch;
	const { headers: fetchHeaders, ...fetchOptionsWithoutHeaders } = fetchOptions;
	return requestFetch(url, {
		...fetchOptionsWithoutHeaders,
		method: "DELETE",
		headers: excludeHeaders(mergeHeaders(cleanupFalsy({
			"If-Match": etag,
			...headers
		}), fetchHeaders), headersToExclude)
	});
};
//#endregion
//#region src/util/syncHelpers.ts
/** Stable keys for linear-time DAV resource comparisons. */
const getDAVUrlKey = (url, baseUrl) => {
	let resolved;
	try {
		resolved = new URL(url, ensureTrailingSlash(baseUrl)).href;
	} catch {
		resolved = url.trim();
	}
	return resolved.endsWith("/") ? resolved.slice(0, -1) : resolved;
};
const diffDAVObjects = (local, remote, baseUrl, incremental = false, deletedObjects = []) => {
	const localByUrl = new Map(local.map((object) => [getDAVUrlKey(object.url, baseUrl), object]));
	const remoteByUrl = new Map(remote.map((object) => [getDAVUrlKey(object.url, baseUrl), object]));
	const deleted = incremental ? deletedObjects : local.filter((object) => !remoteByUrl.has(getDAVUrlKey(object.url, baseUrl)));
	const deletedUrls = new Set(deleted.map((object) => getDAVUrlKey(object.url, baseUrl)));
	const created = remote.filter((object) => !localByUrl.has(getDAVUrlKey(object.url, baseUrl)));
	const updated = [];
	const unchanged = [];
	for (const object of local) {
		const key = getDAVUrlKey(object.url, baseUrl);
		if (deletedUrls.has(key)) continue;
		const found = remoteByUrl.get(key);
		if (found && found.etag !== object.etag) updated.push(found);
		else if (found || incremental) unchanged.push(object);
	}
	return {
		created,
		updated,
		deleted,
		unchanged
	};
};
//#endregion
//#region src/util/responseHelpers.ts
const assertDAVResponses = (responses, context) => {
	const failed = responses.find((response) => !response.ok || response.status >= 400);
	if (failed) throw new Error(`${context}: ${failed.status} ${failed.statusText}`);
};
const assertDAVDiscovery = (responses, context) => {
	assertDAVResponses(responses, context);
	for (const response of responses) {
		if (response.raw?.multistatus && !response.raw.multistatus.response) continue;
		assertDAVProperty(response, "resourcetype", context);
		if (!response.props || !hasOwn(response.props, "resourcetype") || typeof response.href !== "string" || !response.href) throw new Error(`${context}: missing resourcetype or href in DAV multistatus response`);
	}
};
const assertDAVProperty = (response, name, context) => {
	const failed = response.propStats?.find((stat) => !stat.ok && hasOwn(stat.props, name));
	if (failed && !hasOwn(response.props ?? {}, name)) throw new Error(`${context}: ${name} returned ${failed.status} ${failed.statusText}`);
};
const assertDAVObjectResponses = (responses, property, objectUrls, baseUrl, context) => {
	assertDAVResponses(responses, context);
	const fetchedUrls = /* @__PURE__ */ new Set();
	for (const response of responses) {
		assertDAVProperty(response, property, context);
		if (!response.href || typeof (response.props?.[property]?._cdata ?? response.props?.[property]) !== "string") throw new Error(`${context}: missing ${property} or href`);
		fetchedUrls.add(getDAVUrlKey(response.href, baseUrl));
	}
	const withoutQuery = (url) => getDAVUrlKey(url.replace(/\?.*$/, ""), baseUrl);
	const countsByPath = /* @__PURE__ */ new Map();
	for (const url of objectUrls) {
		const key = withoutQuery(url);
		countsByPath.set(key, (countsByPath.get(key) ?? 0) + 1);
	}
	if (objectUrls.some((url) => !fetchedUrls.has(getDAVUrlKey(url, baseUrl)) && !(countsByPath.get(withoutQuery(url)) === 1 && fetchedUrls.has(withoutQuery(url))))) throw new Error(`${context}: incomplete response`);
};
const getDAVText = (value) => {
	const text = typeof value === "string" || typeof value === "number" ? String(value) : value?._cdata ?? value?._text;
	return typeof text === "string" ? text : void 0;
};
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
const debug$5 = (0, debug.default)("tsdav:collection");
const resolveDAVHref = (href, baseUrl) => {
	try {
		return new URL(href, ensureTrailingSlash(baseUrl)).href;
	} catch {
		return href;
	}
};
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
		headersToExclude,
		fetchOptions,
		fetch: fetchOverride
	});
	const emptyNotFound = queryResults[0];
	if (defaultNamespace === "c" && body?.["calendar-query"] != null && queryResults.length === 1 && emptyNotFound && emptyNotFound.status === 404 && urlMatches(url, emptyNotFound.href, url) && !emptyNotFound.error && Object.keys(emptyNotFound.props ?? {}).length === 0 && typeof emptyNotFound.raw === "object" && emptyNotFound.raw !== null && emptyNotFound.raw.multistatus?.response?.propstat == null) return [];
	const errorResponse = queryResults.find((res) => !res.ok || res.status && res.status >= 400);
	if (errorResponse) throw new Error(`Collection query failed: ${errorResponse.status} ${errorResponse.statusText}. ${typeof errorResponse.raw === "string" ? `Raw response: ${errorResponse.raw.slice(0, 4096)}` : ""}`);
	if ((body?.["calendar-query"] || body?.["calendar-multiget"] || body?.["addressbook-query"] || body?.["addressbook-multiget"]) && queryResults.some((response) => !response.raw?.multistatus)) throw new Error("Collection query failed: expected a DAV multistatus response");
	if ((body?.["calendar-query"] || body?.["calendar-multiget"] || body?.["addressbook-query"] || body?.["addressbook-multiget"]) && queryResults.some((response) => response.raw?.multistatus?.response && (typeof response.href !== "string" || !response.href))) throw new Error("Collection query failed: missing href in DAV response");
	const firstQueryResult = queryResults[0];
	if (queryResults.length === 1 && firstQueryResult && (!firstQueryResult.raw || firstQueryResult.raw.multistatus && !firstQueryResult.raw.multistatus.response) && firstQueryResult.status && firstQueryResult.status < 300) return [];
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
			body: props ? { mkcol: {
				_attributes: getDAVAttribute([
					"DAV:",
					"urn:ietf:params:xml:ns:caldav",
					"urn:ietf:params:xml:ns:carddav",
					"http://calendarserver.org/ns/",
					"http://apple.com/ns/ical/"
				]),
				set: { prop: props }
			} } : void 0
		},
		headersToExclude,
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
		headersToExclude,
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
		headersToExclude,
		fetchOptions,
		fetch: fetchOverride
	})).find((r) => urlMatches(collection.url, r.href, collection.url));
	if (!res) throw new Error("Collection does not exist on server");
	const unavailableCtag = res.propStats?.length && res.propStats.every((stat) => stat.status === 404 && hasOwn(stat.props, "getctag"));
	if (!res.ok && !unavailableCtag) throw new Error(`Collection status check failed: ${res.status} ${res.statusText}`);
	const remoteCtag = getDAVText(res.props?.getctag);
	return {
		isDirty: collection.ctag == null || remoteCtag == null || `${collection.ctag}` !== `${remoteCtag}`,
		newCtag: remoteCtag
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
		headersToExclude,
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
	debug$5(`smart collection sync with type ${account.accountType} and method ${syncMethod}`);
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
			headersToExclude,
			fetchOptions,
			fetch: fetchOverride
		});
		const isObjectResponse = (r) => {
			return typeof r.href === "string" && getDAVUrlKey(r.href, collection.url) !== getDAVUrlKey(collection.url, collection.url) && !r.props?.resourcetype?.collection;
		};
		const errorResponse = result.find((r) => (!r.ok || r.status >= 400) && !(r.status === 404 && !r.propStats?.length && isObjectResponse(r)));
		if (errorResponse) throw new Error(`Collection sync failed: ${errorResponse.status} ${errorResponse.statusText}`);
		if (result.some((response) => response.raw && !response.raw.multistatus)) throw new Error("Collection sync failed: expected a DAV multistatus response");
		if (result.some((response) => response.raw?.multistatus?.response && (typeof response.href !== "string" || !response.href))) throw new Error("Collection sync failed: missing href in DAV response");
		const objectResponses = result.filter(isObjectResponse);
		const changedObjectUrls = objectResponses.filter((o) => o.status !== 404).map((r) => r.href);
		const deletedObjectUrls = objectResponses.filter((o) => o.status === 404).map((r) => r.href);
		const objectMultiGet = collection.objectMultiGet;
		if (changedObjectUrls.length > 0 && !objectMultiGet) throw new Error("collection.objectMultiGet is required for webdav sync changes");
		const multiGetObjectResponse = changedObjectUrls.length ? await objectMultiGet?.({
			url: collection.url,
			props: {
				[`d:getetag`]: {},
				[`${account.accountType === "caldav" ? "c" : "card"}:${account.accountType === "caldav" ? "calendar-data" : "address-data"}`]: {}
			},
			objectUrls: changedObjectUrls,
			depth: "1",
			headers: excludeHeaders(headers, headersToExclude),
			headersToExclude,
			fetchOptions,
			fetch: fetchOverride
		}) ?? [] : [];
		assertDAVObjectResponses(multiGetObjectResponse, account.accountType === "caldav" ? "calendarData" : "addressData", changedObjectUrls, collection.url, "Collection sync multi-get failed");
		const remoteObjects = multiGetObjectResponse.map((res) => {
			return {
				url: resolveDAVHref(res.href ?? "", collection.url),
				etag: getDAVText(res.props?.getetag),
				data: account?.accountType === "caldav" ? res.props?.calendarData?._cdata ?? res.props?.calendarData : res.props?.addressData?._cdata ?? res.props?.addressData
			};
		});
		const localObjects = collection.objects ?? [];
		const deletedObjects = deletedObjectUrls.map((url) => ({
			url: resolveDAVHref(url, collection.url),
			etag: ""
		}));
		const { created, updated, deleted, unchanged } = diffDAVObjects(localObjects, remoteObjects, collection.url, true, deletedObjects);
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
			syncToken: getDAVText(result[0]?.raw?.multistatus?.syncToken) ?? collection.syncToken
		};
	}
	if (syncMethod === "basic") {
		const { isDirty, newCtag } = await isCollectionDirty({
			collection,
			headers: excludeHeaders(headers, headersToExclude),
			headersToExclude,
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
		if (!collection.fetchObjects) throw new Error("collection.fetchObjects is required for basic sync changes");
		const remoteObjects = await collection.fetchObjects({
			collection,
			headers: excludeHeaders(headers, headersToExclude),
			headersToExclude,
			fetchOptions,
			fetch: fetchOverride
		}) ?? [];
		const { created, updated, deleted, unchanged } = diffDAVObjects(localObjects, remoteObjects, collection.url);
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
const debug$4 = (0, debug.default)("tsdav:addressBook");
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
		headersToExclude,
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
		headersToExclude,
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
		props: {
			...customProps ?? {
				[`d:displayname`]: {},
				[`cs:getctag`]: {},
				[`d:resourcetype`]: {},
				[`d:sync-token`]: {}
			},
			[`d:resourcetype`]: {}
		},
		depth: "1",
		headers: excludeHeaders(headers, headersToExclude),
		headersToExclude,
		fetchOptions,
		fetch: fetchOverride
	});
	assertDAVDiscovery(res, "Address book discovery failed");
	return Promise.all(res.filter((r) => Object.keys(r.props?.resourcetype ?? {}).includes("addressbook")).map((rs) => {
		const displayName = rs.props?.displayname?._cdata ?? rs.props?.displayname;
		debug$4(`Found address book named ${typeof displayName === "string" ? displayName : ""},
             props: ${JSON.stringify(rs.props)}`);
		return {
			url: new URL(rs.href ?? "", ensureTrailingSlash(account.rootUrl ?? "")).href,
			ctag: getDAVText(rs.props?.getctag),
			displayName: typeof displayName === "string" ? displayName : "",
			resourcetype: Object.keys(rs.props?.resourcetype ?? {}),
			syncToken: getDAVText(rs.props?.syncToken)
		};
	}).map(async (addr) => ({
		...addr,
		reports: await supportedReportSet({
			collection: addr,
			headers: excludeHeaders(headers, headersToExclude),
			headersToExclude,
			fetchOptions,
			fetch: fetchOverride
		})
	})));
};
const fetchVCards = async (params) => {
	const { addressBook, headers, objectUrls, headersToExclude, urlFilter = (url) => Boolean(url), useMultiGet = true, fetchOptions = {}, fetch: fetchOverride } = params;
	debug$4(`Fetching vcards from ${addressBook?.url}`);
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
		headersToExclude,
		fetchOptions,
		fetch: fetchOverride
	})).map((res) => res.href ?? "")).filter((url) => typeof url === "string" && url.trim().length > 0).map((url) => url.startsWith("http") ? url : new URL(url, ensureTrailingSlash(addressBook.url)).href).filter((url) => !urlEquals(url, addressBook.url)).filter(urlFilter).map((url) => {
		const parsedUrl = new URL(url);
		return `${parsedUrl.pathname}${parsedUrl.search}`;
	});
	const targetUrls = new Set(vcardUrls.map((url) => getDAVUrlKey(url, addressBook.url)));
	let vCardResults = [];
	if (vcardUrls.length > 0) {
		if (useMultiGet) vCardResults = await addressBookMultiGet({
			url: addressBook.url,
			props: {
				[`d:getetag`]: {},
				[`card:address-data`]: {}
			},
			objectUrls: vcardUrls,
			depth: "1",
			headers: excludeHeaders(headers, headersToExclude),
			headersToExclude,
			fetchOptions,
			fetch: fetchOverride
		});
		else {
			vCardResults = await addressBookQuery({
				url: addressBook.url,
				props: {
					[`d:getetag`]: {},
					[`card:address-data`]: {}
				},
				depth: "1",
				headers: excludeHeaders(headers, headersToExclude),
				headersToExclude,
				fetchOptions,
				fetch: fetchOverride
			});
			vCardResults = vCardResults.filter((res) => !!res.href && targetUrls.has(getDAVUrlKey(res.href, addressBook.url)));
		}
	}
	assertDAVObjectResponses(vCardResults, "addressData", vcardUrls, addressBook.url, "VCard fetch failed");
	return vCardResults.map((res) => ({
		url: new URL(res.href ?? "", ensureTrailingSlash(addressBook.url)).href,
		etag: getDAVText(res.props?.getetag),
		data: res.props?.addressData?._cdata ?? res.props?.addressData
	}));
};
const createVCard = async (params) => {
	const { addressBook, vCardString, filename, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return createObject({
		url: new URL(filename, ensureTrailingSlash(addressBook.url)).href,
		data: vCardString,
		headers: excludeHeaders({
			"content-type": "text/vcard; charset=utf-8",
			"If-None-Match": "*",
			...headers
		}, headersToExclude),
		headersToExclude,
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
		headersToExclude,
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
		headersToExclude,
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
const debug$3 = (0, debug.default)("tsdav:calendar");
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
	if (new Date(start).getTime() >= new Date(end).getTime()) throw new Error("invalid timeRange: start must be before end");
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
	debug$3(`Fetch user addresses from ${account.principalUrl}`);
	const matched = (await propfind({
		url: account.principalUrl,
		props: { [`c:calendar-user-address-set`]: {} },
		depth: "0",
		headers: excludeHeaders(headers, headersToExclude),
		headersToExclude,
		fetchOptions,
		fetch: fetchOverride
	})).find((r) => urlMatches(account.principalUrl, r.href, account.rootUrl));
	if (!matched || !matched.ok) throw new Error("cannot find calendarUserAddresses");
	const rawHrefs = matched?.props?.calendarUserAddressSet?.href;
	let hrefArray = [];
	if (Array.isArray(rawHrefs)) hrefArray = rawHrefs;
	else if (rawHrefs) hrefArray = [rawHrefs];
	const addresses = hrefArray.filter((h) => typeof h === "string" && h.length > 0);
	debug$3(`Fetched calendar user addresses ${addresses}`);
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
		headersToExclude,
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
		headersToExclude,
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
		headersToExclude,
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
		props: {
			...customProps ?? {
				[`c:calendar-description`]: {},
				[`c:calendar-timezone`]: {},
				[`d:displayname`]: {},
				[`ca:calendar-color`]: {},
				[`cs:getctag`]: {},
				[`d:resourcetype`]: {},
				[`c:supported-calendar-component-set`]: {},
				[`d:sync-token`]: {}
			},
			[`d:resourcetype`]: {},
			[`c:supported-calendar-component-set`]: {}
		},
		depth: "1",
		headers: excludeHeaders(headers, headersToExclude),
		headersToExclude,
		fetchOptions,
		fetch: fetchOverride
	});
	assertDAVDiscovery(res, "Calendar discovery failed");
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
			url: new URL(rs.href ?? "", ensureTrailingSlash(account.rootUrl ?? "")).href,
			ctag: getDAVText(rs.props?.getctag),
			calendarColor: rs.props?.calendarColor,
			displayName: getDAVText(rs.props?.displayname),
			components: extractComponentNames(compSet),
			resourcetype: Object.keys(rs.props?.resourcetype ?? {}),
			syncToken: getDAVText(rs.props?.syncToken),
			...projectedProps && projectedEntries.length > 0 ? { projectedProps: Object.fromEntries(projectedEntries) } : {}
		};
	}).map(async (cal) => ({
		...cal,
		reports: await supportedReportSet({
			collection: cal,
			headers: excludeHeaders(headers, headersToExclude),
			headersToExclude,
			fetchOptions,
			fetch: fetchOverride
		})
	})));
};
const fetchCalendarObjects = async (params) => {
	const { calendar, objectUrls, filters: customFilters, timeRange, headers, expand, urlFilter = (url) => Boolean(url?.includes(".ics")), useMultiGet = true, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	if (expand && !timeRange) throw new Error("timeRange is required when expand is true");
	if (timeRange) validateTimeRange(timeRange);
	debug$3(`Fetching calendar objects from ${calendar?.url}`);
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
		headersToExclude,
		fetchOptions,
		fetch: fetchOverride
	});
	const calendarObjectUrls = (objectUrls ?? initialResponses.map((res) => res.href ?? "")).filter((url) => typeof url === "string" && url.trim().length > 0).map((url) => url.startsWith("http") ? url : new URL(url, ensureTrailingSlash(calendar.url)).href).filter(urlFilter).map((url) => {
		const parsedUrl = new URL(url);
		return `${parsedUrl.pathname}${parsedUrl.search}`;
	});
	const targetUrls = new Set(calendarObjectUrls.map((url) => getDAVUrlKey(url, calendar.url)));
	let calendarObjectResults = [];
	if (calendarObjectUrls.length > 0) {
		if (expand && !objectUrls) calendarObjectResults = initialResponses.filter((res) => {
			const fullUrl = (res.href ?? "").startsWith("http") ? res.href : new URL(res.href ?? "", ensureTrailingSlash(calendar.url)).href;
			return urlFilter(fullUrl ?? "");
		});
		else if (!useMultiGet) {
			calendarObjectResults = await calendarQuery({
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
				headersToExclude,
				fetchOptions,
				fetch: fetchOverride
			});
			calendarObjectResults = calendarObjectResults.filter((res) => {
				const fullUrl = (res.href ?? "").startsWith("http") ? res.href ?? "" : new URL(res.href ?? "", ensureTrailingSlash(calendar.url)).href;
				return targetUrls.has(getDAVUrlKey(fullUrl, calendar.url));
			});
		} else calendarObjectResults = await calendarMultiGet({
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
			headersToExclude,
			fetchOptions,
			fetch: fetchOverride
		});
	}
	assertDAVObjectResponses(calendarObjectResults, "calendarData", calendarObjectUrls, calendar.url, "Calendar object fetch failed");
	return calendarObjectResults.map((res) => ({
		url: new URL(res.href ?? "", ensureTrailingSlash(calendar.url)).href,
		etag: getDAVText(res.props?.getetag),
		data: res.props?.calendarData?._cdata ?? res.props?.calendarData
	}));
};
const createCalendarObject = async (params) => {
	const { calendar, iCalString, filename, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	return createObject({
		url: new URL(filename, ensureTrailingSlash(calendar.url)).href,
		data: iCalString,
		headers: excludeHeaders({
			"content-type": "text/calendar; charset=utf-8",
			"If-None-Match": "*",
			...headers
		}, headersToExclude),
		headersToExclude,
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
		headersToExclude,
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
		headersToExclude,
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
		headersToExclude,
		fetchOptions,
		fetch: fetchOverride
	});
	const baseUrl = account.rootUrl ?? account.homeUrl ?? account.serverUrl;
	const localByUrl = new Map(localCalendars.map((cal) => [getDAVUrlKey(cal.url, baseUrl), cal]));
	const remoteByUrl = new Map(remoteCalendars.map((cal) => [getDAVUrlKey(cal.url, baseUrl), cal]));
	const created = remoteCalendars.filter((cal) => !localByUrl.has(getDAVUrlKey(cal.url, baseUrl)));
	const updated = [];
	const unchanged = [];
	const deleted = [];
	for (const local of localCalendars) {
		const remote = remoteByUrl.get(getDAVUrlKey(local.url, baseUrl));
		if (!remote) deleted.push(local);
		else if (!remote.syncToken && !remote.ctag || remote.syncToken && remote.syncToken !== local.syncToken || remote.ctag && remote.ctag !== local.ctag) updated.push({
			local,
			remote
		});
		else unchanged.push(local);
	}
	debug$3(`updated calendars: ${updated.map(({ remote }) => remote.displayName)}`);
	const updatedWithObjects = await Promise.all(updated.map(async ({ local, remote }) => {
		const fetchObjects = async (fetchParams) => {
			if (!fetchParams) return [];
			const { collection, ...requestParams } = fetchParams;
			return fetchCalendarObjects({
				...requestParams,
				calendar: collection,
				filters: { "comp-filter": { _attributes: { name: "VCALENDAR" } } },
				urlFilter: (url) => getDAVUrlKey(url, collection.url) !== getDAVUrlKey(collection.url, collection.url)
			});
		};
		const collection = {
			...remote,
			ctag: local.ctag,
			syncToken: local.syncToken,
			objects: local.objects,
			objectMultiGet: calendarMultiGet,
			fetchObjects
		};
		const result = await smartCollectionSync({
			collection,
			detailedResult: false,
			headers: excludeHeaders(headers, headersToExclude),
			headersToExclude,
			account,
			fetchOptions,
			fetch: fetchOverride
		});
		return {
			...result,
			ctag: remote.reports?.includes("syncCollection") ? remote.ctag ?? result.ctag : result.ctag ?? remote.ctag,
			syncToken: remote.reports?.includes("syncCollection") ? result.syncToken : remote.syncToken ?? result.syncToken
		};
	}));
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
	const response = (await collectionQuery({
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
		headersToExclude,
		fetchOptions,
		fetch: fetchOverride
	}))[0];
	if (!response) throw new Error("freeBusyQuery returned no response");
	return response;
};
//#endregion
//#region src/account.ts
var account_exports = /* @__PURE__ */ __exportAll({
	createAccount: () => createAccount,
	fetchHomeUrl: () => fetchHomeUrl,
	fetchPrincipalUrl: () => fetchPrincipalUrl,
	serviceDiscovery: () => serviceDiscovery
});
const debug$2 = (0, debug.default)("tsdav:account");
const getCandidateRootUrls = (serverUrl, discoveredRootUrl) => {
	const candidates = [
		discoveredRootUrl,
		serverUrl,
		new URL("/", serverUrl).href
	];
	return candidates.filter((url, index) => candidates.indexOf(url) === index);
};
const serviceDiscovery = async (params) => {
	debug$2("Service discovery...");
	const { account, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const requestFetch = fetchOverride ?? fetch;
	const endpoint = new URL(account.serverUrl);
	const { headers: fetchHeaders, ...fetchOptionsWithoutHeaders } = fetchOptions;
	const uri = new URL(`/.well-known/${account.accountType}`, endpoint);
	uri.protocol = endpoint.protocol ?? "http";
	const extractRedirect = (response) => {
		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get("Location");
			if (typeof location === "string" && location.length) {
				debug$2(`Service discovery redirected to ${location}`);
				return new URL(location, uri).href;
			}
		}
	};
	try {
		const redirectUrl = extractRedirect(await requestFetch(uri.href, {
			...fetchOptionsWithoutHeaders,
			method: "PROPFIND",
			headers: excludeHeaders(mergeHeaders({ "Content-Type": "text/xml;charset=UTF-8" }, headers, fetchHeaders), headersToExclude),
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
		debug$2(`Service discovery PROPFIND failed: ${err.stack}`);
	}
	try {
		const redirectUrl = extractRedirect(await requestFetch(uri.href, {
			...fetchOptionsWithoutHeaders,
			method: "GET",
			body: void 0,
			headers: excludeHeaders(mergeHeaders(headers, fetchHeaders), headersToExclude),
			redirect: "manual"
		}));
		if (redirectUrl) return redirectUrl;
	} catch (err) {
		debug$2(`Service discovery GET failed: ${err.stack}`);
	}
	return endpoint.href;
};
const extractHref = (raw) => {
	if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
	if (Array.isArray(raw)) {
		for (const item of raw) {
			const found = extractHref(item);
			if (found) return found;
		}
		return;
	}
	if (raw && typeof raw === "object") {
		if ("_cdata" in raw && typeof raw._cdata === "string") {
			const cdata = raw._cdata.trim();
			if (cdata.length > 0) return cdata;
		}
		if ("_text" in raw && typeof raw._text === "string") {
			const text = raw._text.trim();
			if (text.length > 0) return text;
		}
	}
};
const fetchPrincipalUrl = async (params) => {
	const { account, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const requiredFields = ["rootUrl"];
	if (!hasFields(account, requiredFields)) throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchPrincipalUrl`);
	debug$2(`Fetching principal url from path ${account.rootUrl}`);
	const [response] = await propfind({
		url: account.rootUrl,
		props: { [`d:current-user-principal`]: {} },
		depth: "0",
		headers: excludeHeaders(headers, headersToExclude),
		headersToExclude,
		fetchOptions,
		fetch: fetchOverride
	});
	if (!response?.ok) {
		debug$2(`Fetch principal url failed: ${response?.statusText ?? "empty response"}`);
		if (response?.status === 401) throw new Error(`Invalid credentials: PROPFIND ${account.rootUrl} returned 401 Unauthorized`);
		throw new Error("cannot find principalUrl");
	}
	const principalHref = extractHref(response.props?.currentUserPrincipal?.href);
	if (!principalHref) {
		debug$2("Fetch principal url failed: missing current-user-principal href");
		throw new Error("cannot find principalUrl");
	}
	debug$2(`Fetched principal url ${principalHref}`);
	return new URL(principalHref, ensureTrailingSlash(account.rootUrl)).href;
};
const fetchHomeUrl = async (params) => {
	const { account, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const requiredFields = ["principalUrl", "rootUrl"];
	if (!hasFields(account, requiredFields)) throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchHomeUrl`);
	debug$2(`Fetch home url from ${account.principalUrl}`);
	const responses = await propfind({
		url: account.principalUrl,
		props: account.accountType === "caldav" ? { [`c:calendar-home-set`]: {} } : { [`card:addressbook-home-set`]: {} },
		depth: "0",
		headers: excludeHeaders(headers, headersToExclude),
		headersToExclude,
		fetchOptions,
		fetch: fetchOverride
	});
	const matched = responses.find((r) => urlMatches(account.principalUrl, r.href, account.rootUrl));
	if (!matched || !matched.ok) {
		debug$2(`Fetch home url failed with status ${matched?.statusText} and error ${JSON.stringify(responses.map((r) => r.error))}`);
		throw new Error("cannot find homeUrl");
	}
	const homeHref = extractHref(account.accountType === "caldav" ? matched.props?.calendarHomeSet?.href : matched.props?.addressbookHomeSet?.href);
	if (!homeHref) {
		debug$2(`Fetch home url failed: server did not return a ${account.accountType === "caldav" ? "calendar-home-set" : "addressbook-home-set"} href`);
		throw new Error("cannot find homeUrl");
	}
	const result = new URL(homeHref, ensureTrailingSlash(account.rootUrl)).href;
	debug$2(`Fetched home url ${result}`);
	return result;
};
const createAccount = async (params) => {
	const { account, headers, loadCollections = false, loadObjects = false, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
	const newAccount = { ...account };
	const discoveredRootUrl = account.rootUrl ?? await serviceDiscovery({
		account,
		headers: excludeHeaders(headers, headersToExclude),
		headersToExclude,
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
						headersToExclude,
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
		headersToExclude,
		fetchOptions,
		fetch: fetchOverride
	});
	newAccount.homeUrl = account.homeUrl ?? await fetchHomeUrl({
		account: newAccount,
		headers: excludeHeaders(headers, headersToExclude),
		headersToExclude,
		fetchOptions,
		fetch: fetchOverride
	});
	if (loadCollections || loadObjects) {
		if (account.accountType === "caldav") newAccount.calendars = await fetchCalendars({
			headers: excludeHeaders(headers, headersToExclude),
			headersToExclude,
			account: newAccount,
			fetchOptions,
			fetch: fetchOverride
		});
		else if (account.accountType === "carddav") newAccount.addressBooks = await fetchAddressBooks({
			headers: excludeHeaders(headers, headersToExclude),
			headersToExclude,
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
				filters: { "comp-filter": { _attributes: { name: "VCALENDAR" } } },
				urlFilter: (url) => !urlEquals(url, cal.url),
				headers: excludeHeaders(headers, headersToExclude),
				headersToExclude,
				fetchOptions,
				fetch: fetchOverride
			})
		})));
		else if (account.accountType === "carddav" && newAccount.addressBooks) newAccount.addressBooks = await Promise.all(newAccount.addressBooks.map(async (addr) => ({
			...addr,
			objects: await fetchVCards({
				addressBook: addr,
				headers: excludeHeaders(headers, headersToExclude),
				headersToExclude,
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
const debug$1 = (0, debug.default)("tsdav:authHelper");
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
	const overrides = args[0];
	const mergedParams = {
		...params,
		...overrides
	};
	if (params.headers || overrides?.headers) mergedParams.headers = mergeHeaders(params.headers, overrides?.headers);
	return fn(mergedParams);
};
const getBasicAuthHeaders = (credentials) => {
	debug$1(`Basic auth token generated for user "${credentials.username ?? ""}"`);
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
	debug$1(`Fetching oauth tokens from ${credentials.tokenUrl}`);
	const requestFetch = fetchOverride ?? fetch;
	const { headers: fetchHeaders, ...fetchOptionsWithoutHeaders } = fetchOptions ?? {};
	const response = await requestFetch(credentials.tokenUrl, {
		...fetchOptionsWithoutHeaders,
		method: "POST",
		body: param.toString(),
		headers: mergeHeaders({ "content-type": "application/x-www-form-urlencoded" }, fetchHeaders)
	});
	if (response.ok) return await response.json();
	debug$1(`Fetch Oauth tokens failed with status ${response.status}`);
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
	const requestFetch = fetchOverride ?? fetch;
	const { headers: fetchHeaders, ...fetchOptionsWithoutHeaders } = fetchOptions ?? {};
	const response = await requestFetch(credentials.tokenUrl, {
		...fetchOptionsWithoutHeaders,
		method: "POST",
		body: param.toString(),
		headers: mergeHeaders({ "Content-Type": "application/x-www-form-urlencoded" }, fetchHeaders)
	});
	if (response.ok) return await response.json();
	debug$1(`Refresh access token failed with status ${response.status}`);
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
	debug$1("Fetching oauth headers");
	let tokens = {};
	let didRefresh = false;
	if (credentials.accessToken && (credentials.expiration == null && !credentials.refreshToken || credentials.expiration != null && Date.now() < credentials.expiration)) tokens = {
		access_token: credentials.accessToken,
		refresh_token: credentials.refreshToken
	};
	else {
		tokens = credentials.refreshToken ? await refreshAccessToken(credentials, fetchOptions, fetchOverride) : await fetchOauthTokens(credentials, fetchOptions, fetchOverride);
		didRefresh = true;
	}
	if (didRefresh) {
		if (tokens.access_token) credentials.accessToken = tokens.access_token;
		if (tokens.refresh_token) credentials.refreshToken = tokens.refresh_token;
		if (tokens.access_token) credentials.expiration = typeof tokens.expires_in === "number" ? Date.now() + tokens.expires_in * 1e3 : void 0;
	}
	debug$1("Oauth tokens obtained");
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
const resolveAuthHeaders = async (client, fetchOptions = client.fetchOptions, fetchOverride = client.fetchOverride) => {
	switch (client.authMethod) {
		case "Basic": return getBasicAuthHeaders(client.credentials);
		case "Bearer": return getBearerAuthHeaders(client.credentials);
		case "Oauth": {
			const { headers } = await getOauthHeaders(client.credentials, fetchOptions, fetchOverride);
			if (!headers.authorization) throw new Error("OAuth authentication failed: token endpoint returned no access token");
			return headers;
		}
		case "Digest": return { Authorization: `Digest ${client.credentials.digestString}` };
		case "Custom":
			if (!client.authFunction) throw new Error("authMethod 'Custom' requires an authFunction to produce request headers");
			return await client.authFunction(client.credentials) ?? {};
		default: throw new Error("Invalid auth method");
	}
};
const createDAVClient = async (params) => {
	const client = new DAVClient(params);
	client.authHeaders = await resolveAuthHeaders(client);
	client.account = params.defaultAccountType ? await createAccount({
		account: {
			serverUrl: params.serverUrl,
			credentials: params.credentials,
			accountType: params.defaultAccountType
		},
		headers: client.authHeaders,
		fetchOptions: client.fetchOptions,
		fetch: client.fetchOverride
	}) : void 0;
	return {
		davRequest: client.davRequest.bind(client),
		propfind: client.propfind.bind(client),
		createAccount: async (...args) => {
			if (!args[0].account.accountType) throw new Error("createAccount requires an accountType; pass one via `account.accountType`.");
			return client.createAccount(...args);
		},
		createObject: client.createObject.bind(client),
		updateObject: client.updateObject.bind(client),
		deleteObject: client.deleteObject.bind(client),
		calendarQuery: client.calendarQuery.bind(client),
		addressBookQuery: client.addressBookQuery.bind(client),
		collectionQuery: client.collectionQuery.bind(client),
		makeCollection: client.makeCollection.bind(client),
		calendarMultiGet: client.calendarMultiGet.bind(client),
		makeCalendar: client.makeCalendar.bind(client),
		freeBusyQuery: client.freeBusyQuery.bind(client),
		syncCollection: client.syncCollection.bind(client),
		supportedReportSet: client.supportedReportSet.bind(client),
		isCollectionDirty: client.isCollectionDirty.bind(client),
		smartCollectionSync: client.smartCollectionSync.bind(client),
		smartCollectionSyncDetailed: client.smartCollectionSyncDetailed.bind(client),
		fetchCalendars: client.fetchCalendars.bind(client),
		fetchCalendarUserAddresses: client.fetchCalendarUserAddresses.bind(client),
		fetchCalendarObjects: client.fetchCalendarObjects.bind(client),
		createCalendarObject: client.createCalendarObject.bind(client),
		updateCalendarObject: client.updateCalendarObject.bind(client),
		deleteCalendarObject: client.deleteCalendarObject.bind(client),
		syncCalendars: client.syncCalendars.bind(client),
		syncCalendarsDetailed: client.syncCalendarsDetailed.bind(client),
		fetchAddressBooks: client.fetchAddressBooks.bind(client),
		addressBookMultiGet: client.addressBookMultiGet.bind(client),
		fetchVCards: client.fetchVCards.bind(client),
		createVCard: client.createVCard.bind(client),
		updateVCard: client.updateVCard.bind(client),
		deleteVCard: client.deleteVCard.bind(client)
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
		this.calendarMultiGet = this.calendarMultiGet.bind(this);
		this.addressBookMultiGet = this.addressBookMultiGet.bind(this);
	}
	async authenticate(force = false, fetchOptions = this.fetchOptions, fetchOverride = this.fetchOverride) {
		if (!force && this.authMethod !== "Oauth") return;
		if (!force && this.authHeaders && this.credentials.accessToken && (this.credentials.expiration == null || Date.now() < this.credentials.expiration)) {
			this.authHeaders = { authorization: `Bearer ${this.credentials.accessToken}` };
			return;
		}
		if (this.authentication) return this.authentication;
		const authenticate = async () => {
			this.authHeaders = await resolveAuthHeaders(this, fetchOptions, fetchOverride);
		};
		this.authentication = authenticate();
		try {
			await this.authentication;
		} finally {
			this.authentication = void 0;
		}
	}
	async requestDefaults(params) {
		await this.authenticate(false, params?.fetchOptions ?? this.fetchOptions, params?.fetch ?? this.fetchOverride);
		return {
			url: this.serverUrl,
			headers: this.authHeaders,
			account: this.account,
			fetchOptions: this.fetchOptions,
			fetch: this.fetchOverride
		};
	}
	async invoke(fn, params) {
		const defaults = await this.requestDefaults(params);
		return await defaultParam(fn, defaults)(...[params]);
	}
	async login(options) {
		await this.authenticate(true);
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
		const defaults = await this.requestDefaults(params0);
		return davRequest({
			...rest,
			init: {
				...restInit,
				headers: mergeHeaders(defaults.headers, headers)
			},
			fetchOptions: fetchOptions ?? this.fetchOptions,
			fetch: fetchOverride2 ?? this.fetchOverride
		});
	}
	async createObject(...params) {
		return this.invoke(createObject, params[0]);
	}
	async updateObject(...params) {
		return this.invoke(updateObject, params[0]);
	}
	async deleteObject(...params) {
		return this.invoke(deleteObject, params[0]);
	}
	async propfind(...params) {
		return this.invoke(propfind, params[0]);
	}
	async createAccount(params0) {
		const { account, headers, headersToExclude, loadCollections, loadObjects, fetchOptions, fetch } = params0;
		const defaults = await this.requestDefaults(params0);
		const accountType = account.accountType ?? this.accountType;
		if (!accountType) throw new Error("createAccount requires an accountType; pass one via `account.accountType` or configure `defaultAccountType` on the DAVClient.");
		return createAccount({
			account: {
				serverUrl: this.serverUrl,
				credentials: this.credentials,
				...account,
				accountType
			},
			headers: mergeHeaders(defaults.headers, headers),
			headersToExclude,
			loadCollections,
			loadObjects,
			fetchOptions: fetchOptions ?? this.fetchOptions,
			fetch: fetch ?? this.fetchOverride
		});
	}
	async collectionQuery(...params) {
		return this.invoke(collectionQuery, params[0]);
	}
	async makeCollection(...params) {
		return this.invoke(makeCollection, params[0]);
	}
	async syncCollection(...params) {
		return this.invoke(syncCollection, params[0]);
	}
	async supportedReportSet(...params) {
		return this.invoke(supportedReportSet, params[0]);
	}
	async isCollectionDirty(...params) {
		return this.invoke(isCollectionDirty, params[0]);
	}
	async smartCollectionSync(...params) {
		return this.invoke(smartCollectionSync, params[0]);
	}
	async smartCollectionSyncDetailed(param) {
		return this.invoke(smartCollectionSyncDetailed, param);
	}
	async calendarQuery(...params) {
		return this.invoke(calendarQuery, params[0]);
	}
	async makeCalendar(...params) {
		return this.invoke(makeCalendar, params[0]);
	}
	async freeBusyQuery(...params) {
		return this.invoke(freeBusyQuery, params[0]);
	}
	async calendarMultiGet(...params) {
		return this.invoke(calendarMultiGet, params[0]);
	}
	async fetchCalendars(...params) {
		return this.invoke(fetchCalendars, params[0]);
	}
	async fetchCalendarUserAddresses(...params) {
		return this.invoke(fetchCalendarUserAddresses, params[0]);
	}
	async fetchCalendarObjects(...params) {
		return this.invoke(fetchCalendarObjects, params[0]);
	}
	async createCalendarObject(...params) {
		return this.invoke(createCalendarObject, params[0]);
	}
	async updateCalendarObject(...params) {
		return this.invoke(updateCalendarObject, params[0]);
	}
	async deleteCalendarObject(...params) {
		return this.invoke(deleteCalendarObject, params[0]);
	}
	async syncCalendars(...params) {
		return this.invoke(syncCalendars, params[0]);
	}
	async syncCalendarsDetailed(...params) {
		return this.invoke(syncCalendarsDetailed, params[0]);
	}
	async addressBookQuery(...params) {
		return this.invoke(addressBookQuery, params[0]);
	}
	async addressBookMultiGet(...params) {
		return this.invoke(addressBookMultiGet, params[0]);
	}
	async fetchAddressBooks(...params) {
		return this.invoke(fetchAddressBooks, params[0]);
	}
	async fetchVCards(...params) {
		return this.invoke(fetchVCards, params[0]);
	}
	async createVCard(...params) {
		return this.invoke(createVCard, params[0]);
	}
	async updateVCard(...params) {
		return this.invoke(updateVCard, params[0]);
	}
	async deleteVCard(...params) {
		return this.invoke(deleteVCard, params[0]);
	}
};
//#endregion
//#region src/index.ts
var src_default = {
	DAVNamespace,
	DAVNamespaceShort,
	DAVAttributeMap,
	ICALObjects,
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
exports.DAVAttributeMap = DAVAttributeMap;
exports.DAVClient = DAVClient;
exports.DAVNamespace = DAVNamespace;
exports.DAVNamespaceShort = DAVNamespaceShort;
exports.ICALObjects = ICALObjects;
exports.addressBookMultiGet = addressBookMultiGet;
exports.addressBookQuery = addressBookQuery;
exports.calendarMultiGet = calendarMultiGet;
exports.calendarQuery = calendarQuery;
exports.cleanupFalsy = cleanupFalsy;
exports.collectionQuery = collectionQuery;
exports.createAccount = createAccount;
exports.createCalendarObject = createCalendarObject;
exports.createDAVClient = createDAVClient;
exports.createObject = createObject;
exports.createVCard = createVCard;
exports.davRequest = davRequest;
exports.default = src_default;
exports.deleteCalendarObject = deleteCalendarObject;
exports.deleteObject = deleteObject;
exports.deleteVCard = deleteVCard;
exports.ensureTrailingSlash = ensureTrailingSlash;
exports.excludeHeaders = excludeHeaders;
exports.fetchAddressBooks = fetchAddressBooks;
exports.fetchCalendarObjects = fetchCalendarObjects;
exports.fetchCalendarUserAddresses = fetchCalendarUserAddresses;
exports.fetchCalendars = fetchCalendars;
exports.fetchHomeUrl = fetchHomeUrl;
exports.fetchOauthTokens = fetchOauthTokens;
exports.fetchPrincipalUrl = fetchPrincipalUrl;
exports.fetchVCards = fetchVCards;
exports.freeBusyQuery = freeBusyQuery;
exports.getBasicAuthHeaders = getBasicAuthHeaders;
exports.getBearerAuthHeaders = getBearerAuthHeaders;
exports.getDAVAttribute = getDAVAttribute;
exports.getOauthHeaders = getOauthHeaders;
exports.isCollectionDirty = isCollectionDirty;
exports.makeCalendar = makeCalendar;
exports.makeCollection = makeCollection;
exports.mergeHeaders = mergeHeaders;
exports.propfind = propfind;
exports.refreshAccessToken = refreshAccessToken;
exports.serviceDiscovery = serviceDiscovery;
exports.smartCollectionSync = smartCollectionSync;
exports.smartCollectionSyncDetailed = smartCollectionSyncDetailed;
exports.supportedReportSet = supportedReportSet;
exports.syncCalendars = syncCalendars;
exports.syncCalendarsDetailed = syncCalendarsDetailed;
exports.syncCollection = syncCollection;
exports.updateCalendarObject = updateCalendarObject;
exports.updateObject = updateObject;
exports.updateVCard = updateVCard;
exports.urlContains = urlContains;
exports.urlEquals = urlEquals;
exports.urlMatches = urlMatches;
