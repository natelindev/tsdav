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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
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
//#region src/util/camelCase.ts
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
const debug$6 = (0, debug.default)("tsdav:request");
const davRequest = async (params) => {
	const { url, init, convertIncoming = true, parseOutgoing = true, fetchOptions = {}, fetch: fetchOverride } = params;
	const requestFetch = fetchOverride ?? fetch;
	const { headers = {}, body, namespace, method, attributes } = init;
	const xmlBody = convertIncoming ? xml_js.default.js2xml({
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
		result = xml_js.default.xml2js(resText, {
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
					debug$6(e.stack);
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
		debug$6(`Failed to parse DAV response XML: ${e.message}`);
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
const debug$5 = (0, debug.default)("tsdav:collection");
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
		debug$4(`Found address book named ${typeof displayName === "string" ? displayName : ""},
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
		fetchOptions,
		fetch: fetchOverride
	})).find((r) => urlContains(account.principalUrl, r.href));
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
	debug$3(`new calendars: ${created.map((cc) => cc.displayName)}`);
	const updated = localCalendars.reduce((prev, curr) => {
		const found = remoteCalendars.find((rc) => urlContains(rc.url, curr.url));
		if (found && (found.syncToken && `${found.syncToken}` !== `${curr.syncToken}` || found.ctag && `${found.ctag}` !== `${curr.ctag}`)) return [...prev, found];
		return prev;
	}, []);
	debug$3(`updated calendars: ${updated.map((cc) => cc.displayName)}`);
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
	debug$3(`deleted calendars: ${deleted.map((cc) => cc.displayName)}`);
	const unchanged = localCalendars.filter((cal) => remoteCalendars.some((rc) => {
		if (!urlContains(rc.url, cal.url)) return false;
		const syncTokenMatches = !rc.syncToken || `${rc.syncToken}` === `${cal.syncToken}`;
		const ctagMatches = !rc.ctag || `${rc.ctag}` === `${cal.ctag}`;
		return syncTokenMatches && ctagMatches;
	}));
	debug$3(`unchanged calendars: ${unchanged.map((cc) => cc.displayName)}`);
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
	const uri = new URL(`/.well-known/${account.accountType}`, endpoint);
	uri.protocol = endpoint.protocol ?? "http";
	const extractRedirect = (response) => {
		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get("Location");
			if (typeof location === "string" && location.length) {
				debug$2(`Service discovery redirected to ${location}`);
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
		debug$2(`Service discovery PROPFIND failed: ${err.stack}`);
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
		debug$2(`Service discovery GET failed: ${err.stack}`);
	}
	return endpoint.href;
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
		fetchOptions,
		fetch: fetchOverride
	});
	if (!response.ok) {
		debug$2(`Fetch principal url failed: ${response.statusText}`);
		if (response.status === 401) throw new Error(`Invalid credentials: PROPFIND ${account.rootUrl} returned 401 Unauthorized`);
		throw new Error("cannot find principalUrl");
	}
	const principalHref = response.props?.currentUserPrincipal?.href;
	if (typeof principalHref !== "string" || !principalHref.length) {
		debug$2("Fetch principal url failed: missing current-user-principal href");
		throw new Error("cannot find principalUrl");
	}
	debug$2(`Fetched principal url ${principalHref}`);
	return new URL(principalHref, account.rootUrl).href;
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
		fetchOptions,
		fetch: fetchOverride
	});
	const matched = responses.find((r) => urlContains(account.principalUrl, r.href));
	if (!matched || !matched.ok) {
		debug$2(`Fetch home url failed with status ${matched?.statusText} and error ${JSON.stringify(responses.map((r) => r.error))}`);
		throw new Error("cannot find homeUrl");
	}
	const homeHref = account.accountType === "caldav" ? matched.props?.calendarHomeSet?.href : matched.props?.addressbookHomeSet?.href;
	if (typeof homeHref !== "string" || homeHref.length === 0) {
		debug$2(`Fetch home url failed: server did not return a ${account.accountType === "caldav" ? "calendar-home-set" : "addressbook-home-set"} href`);
		throw new Error("cannot find homeUrl");
	}
	const result = new URL(homeHref, account.rootUrl).href;
	debug$2(`Fetched home url ${result}`);
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
	return fn({
		...params,
		...args[0]
	});
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
	const response = await (fetchOverride ?? fetch)(credentials.tokenUrl, {
		method: "POST",
		body: param.toString(),
		headers: { "content-type": "application/x-www-form-urlencoded" },
		...fetchOptions ?? {}
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
	const response = await (fetchOverride ?? fetch)(credentials.tokenUrl, {
		method: "POST",
		body: param.toString(),
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		...fetchOptions ?? {}
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
exports.DAVAttributeMap = DAVAttributeMap;
exports.DAVClient = DAVClient;
exports.DAVNamespace = DAVNamespace;
exports.DAVNamespaceShort = DAVNamespaceShort;
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
exports.fetchAddressBooks = fetchAddressBooks;
exports.fetchCalendarObjects = fetchCalendarObjects;
exports.fetchCalendarUserAddresses = fetchCalendarUserAddresses;
exports.fetchCalendars = fetchCalendars;
exports.fetchOauthTokens = fetchOauthTokens;
exports.fetchVCards = fetchVCards;
exports.freeBusyQuery = freeBusyQuery;
exports.getBasicAuthHeaders = getBasicAuthHeaders;
exports.getBearerAuthHeaders = getBearerAuthHeaders;
exports.getDAVAttribute = getDAVAttribute;
exports.getOauthHeaders = getOauthHeaders;
exports.isCollectionDirty = isCollectionDirty;
exports.makeCalendar = makeCalendar;
exports.propfind = propfind;
exports.refreshAccessToken = refreshAccessToken;
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
