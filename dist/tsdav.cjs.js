'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var crossFetch = require('cross-fetch');
var getLogger = require('debug');
var convert = require('xml-js');
var base64 = require('base-64');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */


function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

exports.DAVNamespace = void 0;
(function (DAVNamespace) {
    DAVNamespace["CALENDAR_SERVER"] = "http://calendarserver.org/ns/";
    DAVNamespace["CALDAV_APPLE"] = "http://apple.com/ns/ical/";
    DAVNamespace["CALDAV"] = "urn:ietf:params:xml:ns:caldav";
    DAVNamespace["CARDDAV"] = "urn:ietf:params:xml:ns:carddav";
    DAVNamespace["DAV"] = "DAV:";
})(exports.DAVNamespace || (exports.DAVNamespace = {}));
const DAVAttributeMap = {
    [exports.DAVNamespace.CALDAV]: 'xmlns:c',
    [exports.DAVNamespace.CARDDAV]: 'xmlns:card',
    [exports.DAVNamespace.CALENDAR_SERVER]: 'xmlns:cs',
    [exports.DAVNamespace.CALDAV_APPLE]: 'xmlns:ca',
    [exports.DAVNamespace.DAV]: 'xmlns:d',
};
exports.DAVNamespaceShort = void 0;
(function (DAVNamespaceShort) {
    DAVNamespaceShort["CALDAV"] = "c";
    DAVNamespaceShort["CARDDAV"] = "card";
    DAVNamespaceShort["CALENDAR_SERVER"] = "cs";
    DAVNamespaceShort["CALDAV_APPLE"] = "ca";
    DAVNamespaceShort["DAV"] = "d";
})(exports.DAVNamespaceShort || (exports.DAVNamespaceShort = {}));
var ICALObjects;
(function (ICALObjects) {
    ICALObjects["VEVENT"] = "VEVENT";
    ICALObjects["VTODO"] = "VTODO";
    ICALObjects["VJOURNAL"] = "VJOURNAL";
    ICALObjects["VFREEBUSY"] = "VFREEBUSY";
    ICALObjects["VTIMEZONE"] = "VTIMEZONE";
    ICALObjects["VALARM"] = "VALARM";
})(ICALObjects || (ICALObjects = {}));

const camelCase = (str) => str.replace(/([-_]\w)/g, (g) => g[1].toUpperCase());

const nativeType = (value) => {
    const nValue = Number(value);
    if (!Number.isNaN(nValue)) {
        return nValue;
    }
    const bValue = value.toLowerCase();
    if (bValue === 'true') {
        return true;
    }
    if (bValue === 'false') {
        return false;
    }
    return value;
};

const urlEquals = (urlA, urlB) => {
    if (!urlA && !urlB) {
        return true;
    }
    if (!urlA || !urlB) {
        return false;
    }
    const trimmedUrlA = urlA.trim();
    const trimmedUrlB = urlB.trim();
    if (Math.abs(trimmedUrlA.length - trimmedUrlB.length) > 1) {
        return false;
    }
    const strippedUrlA = trimmedUrlA.slice(-1) === '/' ? trimmedUrlA.slice(0, -1) : trimmedUrlA;
    const strippedUrlB = trimmedUrlB.slice(-1) === '/' ? trimmedUrlB.slice(0, -1) : trimmedUrlB;
    return urlA.includes(strippedUrlB) || urlB.includes(strippedUrlA);
};
const urlContains = (urlA, urlB) => {
    if (!urlA && !urlB) {
        return true;
    }
    if (!urlA || !urlB) {
        return false;
    }
    const trimmedUrlA = urlA.trim();
    const trimmedUrlB = urlB.trim();
    const strippedUrlA = trimmedUrlA.slice(-1) === '/' ? trimmedUrlA.slice(0, -1) : trimmedUrlA;
    const strippedUrlB = trimmedUrlB.slice(-1) === '/' ? trimmedUrlB.slice(0, -1) : trimmedUrlB;
    return urlA.includes(strippedUrlB) || urlB.includes(strippedUrlA);
};
const getDAVAttribute = (nsArr) => nsArr.reduce((prev, curr) => (Object.assign(Object.assign({}, prev), { [DAVAttributeMap[curr]]: curr })), {});
const cleanupFalsy = (obj) => Object.entries(obj).reduce((prev, [key, value]) => {
    if (value)
        return Object.assign(Object.assign({}, prev), { [key]: value });
    return prev;
}, {});
const conditionalParam = (key, param) => {
    if (param) {
        return {
            [key]: param,
        };
    }
    return {};
};

var requestHelpers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    cleanupFalsy: cleanupFalsy,
    conditionalParam: conditionalParam,
    getDAVAttribute: getDAVAttribute,
    urlContains: urlContains,
    urlEquals: urlEquals
});

const debug$5 = getLogger('tsdav:request');
const davRequest = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { url, init, convertIncoming = true, parseOutgoing = true } = params;
    const { headers = {}, body, namespace, method, attributes } = init;
    const xmlBody = convertIncoming
        ? convert.js2xml(Object.assign(Object.assign({ _declaration: { _attributes: { version: '1.0', encoding: 'utf-8' } } }, body), { _attributes: attributes }), {
            compact: true,
            spaces: 2,
            elementNameFn: (name) => {
                // add namespace to all keys without namespace
                if (namespace && !/^.+:.+/.test(name)) {
                    return `${namespace}:${name}`;
                }
                return name;
            },
        })
        : body;
    // debug('outgoing xml:');
    // debug(`${method} ${url}`);
    // debug(
    //   `headers: ${JSON.stringify(
    //     {
    //       'Content-Type': 'text/xml;charset=UTF-8',
    //       ...cleanupFalsy(headers),
    //     },
    //     null,
    //     2
    //   )}`
    // );
    // debug(xmlBody);
    const davResponse = yield crossFetch.fetch(url, {
        headers: Object.assign({ 'Content-Type': 'text/xml;charset=UTF-8' }, cleanupFalsy(headers)),
        body: xmlBody,
        method,
    });
    const resText = yield davResponse.text();
    // filter out invalid responses
    // debug('response xml:');
    // debug(resText);
    // debug(davResponse);
    if (!davResponse.ok ||
        !((_a = davResponse.headers.get('content-type')) === null || _a === void 0 ? void 0 : _a.includes('xml')) ||
        !parseOutgoing) {
        return [
            {
                href: davResponse.url,
                ok: davResponse.ok,
                status: davResponse.status,
                statusText: davResponse.statusText,
                raw: resText,
            },
        ];
    }
    const result = convert.xml2js(resText, {
        compact: true,
        trim: true,
        textFn: (value, parentElement) => {
            try {
                // This is needed for xml-js design reasons
                // eslint-disable-next-line no-underscore-dangle
                const parentOfParent = parentElement._parent;
                const pOpKeys = Object.keys(parentOfParent);
                const keyNo = pOpKeys.length;
                const keyName = pOpKeys[keyNo - 1];
                const arrOfKey = parentOfParent[keyName];
                const arrOfKeyLen = arrOfKey.length;
                if (arrOfKeyLen > 0) {
                    const arr = arrOfKey;
                    const arrIndex = arrOfKey.length - 1;
                    arr[arrIndex] = nativeType(value);
                }
                else {
                    parentOfParent[keyName] = nativeType(value);
                }
            }
            catch (e) {
                debug$5(e.stack);
            }
        },
        // remove namespace & camelCase
        elementNameFn: (attributeName) => camelCase(attributeName.replace(/^.+:/, '')),
        attributesFn: (value) => {
            const newVal = Object.assign({}, value);
            delete newVal.xmlns;
            return newVal;
        },
        ignoreDeclaration: true,
    });
    const responseBodies = Array.isArray(result.multistatus.response)
        ? result.multistatus.response
        : [result.multistatus.response];
    return responseBodies.map((responseBody) => {
        var _a, _b;
        const statusRegex = /^\S+\s(?<status>\d+)\s(?<statusText>.+)$/;
        if (!responseBody) {
            return {
                status: davResponse.status,
                statusText: davResponse.statusText,
                ok: davResponse.ok,
            };
        }
        const matchArr = statusRegex.exec(responseBody.status);
        return {
            raw: result,
            href: responseBody.href,
            status: (matchArr === null || matchArr === void 0 ? void 0 : matchArr.groups) ? Number.parseInt(matchArr === null || matchArr === void 0 ? void 0 : matchArr.groups.status, 10) : davResponse.status,
            statusText: (_b = (_a = matchArr === null || matchArr === void 0 ? void 0 : matchArr.groups) === null || _a === void 0 ? void 0 : _a.statusText) !== null && _b !== void 0 ? _b : davResponse.statusText,
            ok: !responseBody.error,
            error: responseBody.error,
            responsedescription: responseBody.responsedescription,
            props: (Array.isArray(responseBody.propstat)
                ? responseBody.propstat
                : [responseBody.propstat]).reduce((prev, curr) => {
                return Object.assign(Object.assign({}, prev), curr === null || curr === void 0 ? void 0 : curr.prop);
            }, {}),
        };
    });
});
const propfind = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, props, depth, headers } = params;
    return davRequest({
        url,
        init: {
            method: 'PROPFIND',
            headers: cleanupFalsy(Object.assign({ depth }, headers)),
            namespace: exports.DAVNamespaceShort.DAV,
            body: {
                propfind: {
                    _attributes: getDAVAttribute([
                        exports.DAVNamespace.CALDAV,
                        exports.DAVNamespace.CALDAV_APPLE,
                        exports.DAVNamespace.CALENDAR_SERVER,
                        exports.DAVNamespace.CARDDAV,
                        exports.DAVNamespace.DAV,
                    ]),
                    prop: props,
                },
            },
        },
    });
});
const createObject = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, data, headers } = params;
    return crossFetch.fetch(url, { method: 'PUT', body: data, headers });
});
const updateObject = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, data, etag, headers } = params;
    return crossFetch.fetch(url, {
        method: 'PUT',
        body: data,
        headers: cleanupFalsy(Object.assign({ 'If-Match': etag }, headers)),
    });
});
const deleteObject = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, headers, etag } = params;
    return crossFetch.fetch(url, {
        method: 'DELETE',
        headers: cleanupFalsy(Object.assign({ 'If-Match': etag }, headers)),
    });
});

var request = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createObject: createObject,
    davRequest: davRequest,
    deleteObject: deleteObject,
    propfind: propfind,
    updateObject: updateObject
});

function hasFields(obj, fields) {
    const inObj = (object) => fields.every((f) => object[f]);
    if (Array.isArray(obj)) {
        return obj.every((o) => inObj(o));
    }
    return inObj(obj);
}
const findMissingFieldNames = (obj, fields) => fields.reduce((prev, curr) => (obj[curr] ? prev : `${prev.length ? `${prev},` : ''}${curr.toString()}`), '');

const debug$4 = getLogger('tsdav:collection');
const collectionQuery = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, body, depth, defaultNamespace = exports.DAVNamespaceShort.DAV, headers } = params;
    const queryResults = yield davRequest({
        url,
        init: {
            method: 'REPORT',
            headers: cleanupFalsy(Object.assign({ depth }, headers)),
            namespace: defaultNamespace,
            body,
        },
    });
    // empty query result
    if (queryResults.length === 1 && !queryResults[0].raw) {
        return [];
    }
    return queryResults;
});
const makeCollection = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, props, depth, headers } = params;
    return davRequest({
        url,
        init: {
            method: 'MKCOL',
            headers: cleanupFalsy(Object.assign({ depth }, headers)),
            namespace: exports.DAVNamespaceShort.DAV,
            body: props
                ? {
                    mkcol: {
                        set: {
                            prop: props,
                        },
                    },
                }
                : undefined,
        },
    });
});
const supportedReportSet = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { collection, headers } = params;
    const res = yield propfind({
        url: collection.url,
        props: {
            [`${exports.DAVNamespaceShort.DAV}:supported-report-set`]: {},
        },
        depth: '0',
        headers,
    });
    return ((_e = (_d = (_c = (_b = (_a = res[0]) === null || _a === void 0 ? void 0 : _a.props) === null || _b === void 0 ? void 0 : _b.supportedReportSet) === null || _c === void 0 ? void 0 : _c.supportedReport) === null || _d === void 0 ? void 0 : _d.map((sr) => Object.keys(sr.report)[0])) !== null && _e !== void 0 ? _e : []);
});
const isCollectionDirty = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g, _h;
    const { collection, headers } = params;
    const responses = yield propfind({
        url: collection.url,
        props: {
            [`${exports.DAVNamespaceShort.CALENDAR_SERVER}:getctag`]: {},
        },
        depth: '0',
        headers,
    });
    const res = responses.filter((r) => urlContains(collection.url, r.href))[0];
    if (!res) {
        throw new Error('Collection does not exist on server');
    }
    return {
        isDirty: collection.ctag !== ((_f = res.props) === null || _f === void 0 ? void 0 : _f.getctag),
        newCtag: (_h = (_g = res.props) === null || _g === void 0 ? void 0 : _g.getctag) === null || _h === void 0 ? void 0 : _h.toString(),
    };
});
/**
 * This is for webdav sync-collection only
 */
const syncCollection = (params) => {
    const { url, props, headers, syncLevel, syncToken } = params;
    return davRequest({
        url,
        init: {
            method: 'REPORT',
            namespace: exports.DAVNamespaceShort.DAV,
            headers: Object.assign({}, headers),
            body: {
                'sync-collection': {
                    _attributes: getDAVAttribute([
                        exports.DAVNamespace.CALDAV,
                        exports.DAVNamespace.CARDDAV,
                        exports.DAVNamespace.DAV,
                    ]),
                    'sync-level': syncLevel,
                    'sync-token': syncToken,
                    [`${exports.DAVNamespaceShort.DAV}:prop`]: props,
                },
            },
        },
    });
};
/** remote collection to local */
const smartCollectionSync = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    const { collection, method, headers, account, detailedResult } = params;
    const requiredFields = ['accountType', 'homeUrl'];
    if (!account || !hasFields(account, requiredFields)) {
        if (!account) {
            throw new Error('no account for smartCollectionSync');
        }
        throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before smartCollectionSync`);
    }
    const syncMethod = method !== null && method !== void 0 ? method : (((_j = collection.reports) === null || _j === void 0 ? void 0 : _j.includes('syncCollection')) ? 'webdav' : 'basic');
    debug$4(`smart collection sync with type ${account.accountType} and method ${syncMethod}`);
    if (syncMethod === 'webdav') {
        const result = yield syncCollection({
            url: collection.url,
            props: {
                [`${exports.DAVNamespaceShort.DAV}:getetag`]: {},
                [`${account.accountType === 'caldav' ? exports.DAVNamespaceShort.CALDAV : exports.DAVNamespaceShort.CARDDAV}:${account.accountType === 'caldav' ? 'calendar-data' : 'address-data'}`]: {},
                [`${exports.DAVNamespaceShort.DAV}:displayname`]: {},
            },
            syncLevel: 1,
            syncToken: collection.syncToken,
            headers,
        });
        const objectResponses = result.filter((r) => {
            var _a;
            const extName = account.accountType === 'caldav' ? '.ics' : '.vcf';
            return ((_a = r.href) === null || _a === void 0 ? void 0 : _a.slice(-4)) === extName;
        });
        const changedObjectUrls = objectResponses.filter((o) => o.status !== 404).map((r) => r.href);
        const deletedObjectUrls = objectResponses.filter((o) => o.status === 404).map((r) => r.href);
        const multiGetObjectResponse = changedObjectUrls.length
            ? (_l = (yield ((_k = collection === null || collection === void 0 ? void 0 : collection.objectMultiGet) === null || _k === void 0 ? void 0 : _k.call(collection, {
                url: collection.url,
                props: {
                    [`${exports.DAVNamespaceShort.DAV}:getetag`]: {},
                    [`${account.accountType === 'caldav'
                        ? exports.DAVNamespaceShort.CALDAV
                        : exports.DAVNamespaceShort.CARDDAV}:${account.accountType === 'caldav' ? 'calendar-data' : 'address-data'}`]: {},
                },
                objectUrls: changedObjectUrls,
                depth: '1',
                headers,
            })))) !== null && _l !== void 0 ? _l : []
            : [];
        const remoteObjects = multiGetObjectResponse.map((res) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return {
                url: (_a = res.href) !== null && _a !== void 0 ? _a : '',
                etag: (_b = res.props) === null || _b === void 0 ? void 0 : _b.getetag,
                data: (account === null || account === void 0 ? void 0 : account.accountType) === 'caldav'
                    ? (_e = (_d = (_c = res.props) === null || _c === void 0 ? void 0 : _c.calendarData) === null || _d === void 0 ? void 0 : _d._cdata) !== null && _e !== void 0 ? _e : (_f = res.props) === null || _f === void 0 ? void 0 : _f.calendarData
                    : (_j = (_h = (_g = res.props) === null || _g === void 0 ? void 0 : _g.addressData) === null || _h === void 0 ? void 0 : _h._cdata) !== null && _j !== void 0 ? _j : (_k = res.props) === null || _k === void 0 ? void 0 : _k.addressData,
            };
        });
        const localObjects = (_m = collection.objects) !== null && _m !== void 0 ? _m : [];
        // no existing url
        const created = remoteObjects.filter((o) => localObjects.every((lo) => !urlContains(lo.url, o.url)));
        // debug(`created objects: ${created.map((o) => o.url).join('\n')}`);
        // have same url, but etag different
        const updated = localObjects.reduce((prev, curr) => {
            const found = remoteObjects.find((ro) => urlContains(ro.url, curr.url));
            if (found && found.etag && found.etag !== curr.etag) {
                return [...prev, found];
            }
            return prev;
        }, []);
        // debug(`updated objects: ${updated.map((o) => o.url).join('\n')}`);
        const deleted = deletedObjectUrls.map((o) => ({
            url: o,
            etag: '',
        }));
        // debug(`deleted objects: ${deleted.map((o) => o.url).join('\n')}`);
        const unchanged = localObjects.filter((lo) => remoteObjects.some((ro) => urlContains(lo.url, ro.url) && ro.etag === lo.etag));
        return Object.assign(Object.assign({}, collection), { objects: detailedResult
                ? { created, updated, deleted }
                : [...unchanged, ...created, ...updated], 
            // all syncToken in the results are the same so we use the first one here
            syncToken: (_r = (_q = (_p = (_o = result[0]) === null || _o === void 0 ? void 0 : _o.raw) === null || _p === void 0 ? void 0 : _p.multistatus) === null || _q === void 0 ? void 0 : _q.syncToken) !== null && _r !== void 0 ? _r : collection.syncToken });
    }
    if (syncMethod === 'basic') {
        const { isDirty, newCtag } = yield isCollectionDirty({
            collection,
            headers,
        });
        const localObjects = (_s = collection.objects) !== null && _s !== void 0 ? _s : [];
        const remoteObjects = (_u = (yield ((_t = collection.fetchObjects) === null || _t === void 0 ? void 0 : _t.call(collection, { collection, headers })))) !== null && _u !== void 0 ? _u : [];
        // no existing url
        const created = remoteObjects.filter((ro) => localObjects.every((lo) => !urlContains(lo.url, ro.url)));
        // debug(`created objects: ${created.map((o) => o.url).join('\n')}`);
        // have same url, but etag different
        const updated = localObjects.reduce((prev, curr) => {
            const found = remoteObjects.find((ro) => urlContains(ro.url, curr.url));
            if (found && found.etag && found.etag !== curr.etag) {
                return [...prev, found];
            }
            return prev;
        }, []);
        // debug(`updated objects: ${updated.map((o) => o.url).join('\n')}`);
        // does not present in remote
        const deleted = localObjects.filter((cal) => remoteObjects.every((ro) => !urlContains(ro.url, cal.url)));
        // debug(`deleted objects: ${deleted.map((o) => o.url).join('\n')}`);
        const unchanged = localObjects.filter((lo) => remoteObjects.some((ro) => urlContains(lo.url, ro.url) && ro.etag === lo.etag));
        if (isDirty) {
            return Object.assign(Object.assign({}, collection), { objects: detailedResult
                    ? { created, updated, deleted }
                    : [...unchanged, ...created, ...updated], ctag: newCtag });
        }
    }
    return detailedResult
        ? Object.assign(Object.assign({}, collection), { objects: {
                created: [],
                updated: [],
                deleted: [],
            } }) : collection;
});

var collection = /*#__PURE__*/Object.freeze({
    __proto__: null,
    collectionQuery: collectionQuery,
    isCollectionDirty: isCollectionDirty,
    makeCollection: makeCollection,
    smartCollectionSync: smartCollectionSync,
    supportedReportSet: supportedReportSet,
    syncCollection: syncCollection
});

const debug$3 = getLogger('tsdav:addressBook');
const addressBookQuery = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, props, filters, depth, headers } = params;
    return collectionQuery({
        url,
        body: {
            'addressbook-query': {
                _attributes: getDAVAttribute([exports.DAVNamespace.CARDDAV, exports.DAVNamespace.DAV]),
                [`${exports.DAVNamespaceShort.DAV}:prop`]: props,
                filter: filters !== null && filters !== void 0 ? filters : {
                    'prop-filter': {
                        _attributes: {
                            name: 'FN',
                        },
                    },
                },
            },
        },
        defaultNamespace: exports.DAVNamespaceShort.CARDDAV,
        depth,
        headers,
    });
});
const addressBookMultiGet = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, props, objectUrls, depth, headers } = params;
    return collectionQuery({
        url,
        body: {
            'addressbook-multiget': {
                _attributes: getDAVAttribute([exports.DAVNamespace.DAV, exports.DAVNamespace.CARDDAV]),
                [`${exports.DAVNamespaceShort.DAV}:prop`]: props,
                [`${exports.DAVNamespaceShort.DAV}:href`]: objectUrls,
            },
        },
        defaultNamespace: exports.DAVNamespaceShort.CARDDAV,
        depth,
        headers,
    });
});
const fetchAddressBooks = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { account, headers, props: customProps } = params !== null && params !== void 0 ? params : {};
    const requiredFields = ['homeUrl', 'rootUrl'];
    if (!account || !hasFields(account, requiredFields)) {
        if (!account) {
            throw new Error('no account for fetchAddressBooks');
        }
        throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchAddressBooks`);
    }
    const res = yield propfind({
        url: account.homeUrl,
        props: customProps !== null && customProps !== void 0 ? customProps : {
            [`${exports.DAVNamespaceShort.DAV}:displayname`]: {},
            [`${exports.DAVNamespaceShort.CALENDAR_SERVER}:getctag`]: {},
            [`${exports.DAVNamespaceShort.DAV}:resourcetype`]: {},
            [`${exports.DAVNamespaceShort.DAV}:sync-token`]: {},
        },
        depth: '1',
        headers,
    });
    return Promise.all(res
        .filter((r) => { var _a, _b; return Object.keys((_b = (_a = r.props) === null || _a === void 0 ? void 0 : _a.resourcetype) !== null && _b !== void 0 ? _b : {}).includes('addressbook'); })
        .map((rs) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const displayName = (_c = (_b = (_a = rs.props) === null || _a === void 0 ? void 0 : _a.displayname) === null || _b === void 0 ? void 0 : _b._cdata) !== null && _c !== void 0 ? _c : (_d = rs.props) === null || _d === void 0 ? void 0 : _d.displayname;
        debug$3(`Found address book named ${typeof displayName === 'string' ? displayName : ''},
             props: ${JSON.stringify(rs.props)}`);
        return {
            url: new URL((_e = rs.href) !== null && _e !== void 0 ? _e : '', (_f = account.rootUrl) !== null && _f !== void 0 ? _f : '').href,
            ctag: (_g = rs.props) === null || _g === void 0 ? void 0 : _g.getctag,
            displayName: typeof displayName === 'string' ? displayName : '',
            resourcetype: Object.keys((_h = rs.props) === null || _h === void 0 ? void 0 : _h.resourcetype),
            syncToken: (_j = rs.props) === null || _j === void 0 ? void 0 : _j.syncToken,
        };
    })
        .map((addr) => __awaiter(void 0, void 0, void 0, function* () {
        return (Object.assign(Object.assign({}, addr), { reports: yield supportedReportSet({ collection: addr, headers }) }));
    })));
});
const fetchVCards = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { addressBook, headers, objectUrls, urlFilter = (url) => url, useMultiGet = true } = params;
    debug$3(`Fetching vcards from ${addressBook === null || addressBook === void 0 ? void 0 : addressBook.url}`);
    const requiredFields = ['url'];
    if (!addressBook || !hasFields(addressBook, requiredFields)) {
        if (!addressBook) {
            throw new Error('cannot fetchVCards for undefined addressBook');
        }
        throw new Error(`addressBook must have ${findMissingFieldNames(addressBook, requiredFields)} before fetchVCards`);
    }
    const vcardUrls = (objectUrls !== null && objectUrls !== void 0 ? objectUrls : 
    // fetch all objects of the calendar
    (yield addressBookQuery({
        url: addressBook.url,
        props: { [`${exports.DAVNamespaceShort.DAV}:getetag`]: {} },
        depth: '1',
        headers,
    })).map((res) => { var _a; return (res.ok ? (_a = res.href) !== null && _a !== void 0 ? _a : '' : ''); }))
        .map((url) => (url.startsWith('http') || !url ? url : new URL(url, addressBook.url).href))
        .filter(urlFilter)
        .map((url) => new URL(url).pathname);
    let vCardResults = [];
    if (vcardUrls.length > 0) {
        if (useMultiGet) {
            vCardResults = yield addressBookMultiGet({
                url: addressBook.url,
                props: {
                    [`${exports.DAVNamespaceShort.DAV}:getetag`]: {},
                    [`${exports.DAVNamespaceShort.CARDDAV}:address-data`]: {},
                },
                objectUrls: vcardUrls,
                depth: '1',
                headers,
            });
        }
        else {
            vCardResults = yield addressBookQuery({
                url: addressBook.url,
                props: {
                    [`${exports.DAVNamespaceShort.DAV}:getetag`]: {},
                    [`${exports.DAVNamespaceShort.CARDDAV}:address-data`]: {},
                },
                depth: '1',
                headers,
            });
        }
    }
    return vCardResults.map((res) => {
        var _a, _b, _c, _d, _e, _f;
        return ({
            url: new URL((_a = res.href) !== null && _a !== void 0 ? _a : '', addressBook.url).href,
            etag: (_b = res.props) === null || _b === void 0 ? void 0 : _b.getetag,
            data: (_e = (_d = (_c = res.props) === null || _c === void 0 ? void 0 : _c.addressData) === null || _d === void 0 ? void 0 : _d._cdata) !== null && _e !== void 0 ? _e : (_f = res.props) === null || _f === void 0 ? void 0 : _f.addressData,
        });
    });
});
const createVCard = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { addressBook, vCardString, filename, headers } = params;
    return createObject({
        url: new URL(filename, addressBook.url).href,
        data: vCardString,
        headers: Object.assign({ 'content-type': 'text/vcard; charset=utf-8', 'If-None-Match': '*' }, headers),
    });
});
const updateVCard = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { vCard, headers } = params;
    return updateObject({
        url: vCard.url,
        data: vCard.data,
        etag: vCard.etag,
        headers: Object.assign({ 'content-type': 'text/vcard; charset=utf-8' }, headers),
    });
});
const deleteVCard = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { vCard, headers } = params;
    return deleteObject({
        url: vCard.url,
        etag: vCard.etag,
        headers,
    });
});

var addressBook = /*#__PURE__*/Object.freeze({
    __proto__: null,
    addressBookMultiGet: addressBookMultiGet,
    addressBookQuery: addressBookQuery,
    createVCard: createVCard,
    deleteVCard: deleteVCard,
    fetchAddressBooks: fetchAddressBooks,
    fetchVCards: fetchVCards,
    updateVCard: updateVCard
});

const debug$2 = getLogger('tsdav:calendar');
const calendarQuery = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, props, filters, timezone, depth, headers } = params;
    return collectionQuery({
        url,
        body: {
            'calendar-query': cleanupFalsy({
                _attributes: getDAVAttribute([
                    exports.DAVNamespace.CALDAV,
                    exports.DAVNamespace.CALENDAR_SERVER,
                    exports.DAVNamespace.CALDAV_APPLE,
                    exports.DAVNamespace.DAV,
                ]),
                [`${exports.DAVNamespaceShort.DAV}:prop`]: props,
                filter: filters,
                timezone,
            }),
        },
        defaultNamespace: exports.DAVNamespaceShort.CALDAV,
        depth,
        headers,
    });
});
const calendarMultiGet = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, props, objectUrls, filters, timezone, depth, headers } = params;
    return collectionQuery({
        url,
        body: {
            'calendar-multiget': Object.assign(Object.assign({ _attributes: getDAVAttribute([exports.DAVNamespace.DAV, exports.DAVNamespace.CALDAV]), [`${exports.DAVNamespaceShort.DAV}:prop`]: props, [`${exports.DAVNamespaceShort.DAV}:href`]: objectUrls }, conditionalParam('filter', filters)), { timezone }),
        },
        defaultNamespace: exports.DAVNamespaceShort.CALDAV,
        depth,
        headers,
    });
});
const makeCalendar = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, props, depth, headers } = params;
    return davRequest({
        url,
        init: {
            method: 'MKCALENDAR',
            headers: cleanupFalsy(Object.assign({ depth }, headers)),
            namespace: exports.DAVNamespaceShort.DAV,
            body: {
                [`${exports.DAVNamespaceShort.CALDAV}:mkcalendar`]: {
                    _attributes: getDAVAttribute([
                        exports.DAVNamespace.DAV,
                        exports.DAVNamespace.CALDAV,
                        exports.DAVNamespace.CALDAV_APPLE,
                    ]),
                    set: {
                        prop: props,
                    },
                },
            },
        },
    });
});
const fetchCalendars = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { headers, account, props: customProps, projectedProps } = params !== null && params !== void 0 ? params : {};
    const requiredFields = ['homeUrl', 'rootUrl'];
    if (!account || !hasFields(account, requiredFields)) {
        if (!account) {
            throw new Error('no account for fetchCalendars');
        }
        throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchCalendars`);
    }
    const res = yield propfind({
        url: account.homeUrl,
        props: customProps !== null && customProps !== void 0 ? customProps : {
            [`${exports.DAVNamespaceShort.CALDAV}:calendar-description`]: {},
            [`${exports.DAVNamespaceShort.CALDAV}:calendar-timezone`]: {},
            [`${exports.DAVNamespaceShort.DAV}:displayname`]: {},
            [`${exports.DAVNamespaceShort.CALDAV_APPLE}:calendar-color`]: {},
            [`${exports.DAVNamespaceShort.CALENDAR_SERVER}:getctag`]: {},
            [`${exports.DAVNamespaceShort.DAV}:resourcetype`]: {},
            [`${exports.DAVNamespaceShort.CALDAV}:supported-calendar-component-set`]: {},
            [`${exports.DAVNamespaceShort.DAV}:sync-token`]: {},
        },
        depth: '1',
        headers,
    });
    return Promise.all(res
        .filter((r) => { var _a, _b; return Object.keys((_b = (_a = r.props) === null || _a === void 0 ? void 0 : _a.resourcetype) !== null && _b !== void 0 ? _b : {}).includes('calendar'); })
        .filter((rc) => {
        var _a, _b, _c;
        // filter out none iCal format calendars.
        const components = Array.isArray((_a = rc.props) === null || _a === void 0 ? void 0 : _a.supportedCalendarComponentSet.comp)
            ? (_b = rc.props) === null || _b === void 0 ? void 0 : _b.supportedCalendarComponentSet.comp.map((sc) => sc._attributes.name)
            : [(_c = rc.props) === null || _c === void 0 ? void 0 : _c.supportedCalendarComponentSet.comp._attributes.name] || [];
        return components.some((c) => Object.values(ICALObjects).includes(c));
    })
        .map((rs) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        // debug(`Found calendar ${rs.props?.displayname}`);
        const description = (_a = rs.props) === null || _a === void 0 ? void 0 : _a.calendarDescription;
        const timezone = (_b = rs.props) === null || _b === void 0 ? void 0 : _b.calendarTimezone;
        return Object.assign({ description: typeof description === 'string' ? description : '', timezone: typeof timezone === 'string' ? timezone : '', url: new URL((_c = rs.href) !== null && _c !== void 0 ? _c : '', (_d = account.rootUrl) !== null && _d !== void 0 ? _d : '').href, ctag: (_e = rs.props) === null || _e === void 0 ? void 0 : _e.getctag, calendarColor: (_f = rs.props) === null || _f === void 0 ? void 0 : _f.calendarColor, displayName: (_h = (_g = rs.props) === null || _g === void 0 ? void 0 : _g.displayname._cdata) !== null && _h !== void 0 ? _h : (_j = rs.props) === null || _j === void 0 ? void 0 : _j.displayname, components: Array.isArray((_k = rs.props) === null || _k === void 0 ? void 0 : _k.supportedCalendarComponentSet.comp)
                ? (_l = rs.props) === null || _l === void 0 ? void 0 : _l.supportedCalendarComponentSet.comp.map((sc) => sc._attributes.name)
                : [(_m = rs.props) === null || _m === void 0 ? void 0 : _m.supportedCalendarComponentSet.comp._attributes.name], resourcetype: Object.keys((_o = rs.props) === null || _o === void 0 ? void 0 : _o.resourcetype), syncToken: (_p = rs.props) === null || _p === void 0 ? void 0 : _p.syncToken }, conditionalParam('projectedProps', Object.fromEntries(Object.entries((_q = rs.props) !== null && _q !== void 0 ? _q : {}).filter(([key]) => projectedProps === null || projectedProps === void 0 ? void 0 : projectedProps[key]))));
    })
        .map((cal) => __awaiter(void 0, void 0, void 0, function* () {
        return (Object.assign(Object.assign({}, cal), { reports: yield supportedReportSet({ collection: cal, headers }) }));
    })));
});
const fetchCalendarObjects = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { calendar, objectUrls, filters: customFilters, timeRange, headers, expand, urlFilter = (url) => Boolean(url === null || url === void 0 ? void 0 : url.includes('.ics')), useMultiGet = true, } = params;
    if (timeRange) {
        // validate timeRange
        const ISO_8601 = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i;
        const ISO_8601_FULL = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;
        if ((!ISO_8601.test(timeRange.start) || !ISO_8601.test(timeRange.end)) &&
            (!ISO_8601_FULL.test(timeRange.start) || !ISO_8601_FULL.test(timeRange.end))) {
            throw new Error('invalid timeRange format, not in ISO8601');
        }
    }
    debug$2(`Fetching calendar objects from ${calendar === null || calendar === void 0 ? void 0 : calendar.url}`);
    const requiredFields = ['url'];
    if (!calendar || !hasFields(calendar, requiredFields)) {
        if (!calendar) {
            throw new Error('cannot fetchCalendarObjects for undefined calendar');
        }
        throw new Error(`calendar must have ${findMissingFieldNames(calendar, requiredFields)} before fetchCalendarObjects`);
    }
    // default to fetch all
    const filters = customFilters !== null && customFilters !== void 0 ? customFilters : [
        {
            'comp-filter': {
                _attributes: {
                    name: 'VCALENDAR',
                },
                'comp-filter': Object.assign({ _attributes: {
                        name: 'VEVENT',
                    } }, (timeRange
                    ? {
                        'time-range': {
                            _attributes: {
                                start: `${new Date(timeRange.start)
                                    .toISOString()
                                    .slice(0, 19)
                                    .replace(/[-:.]/g, '')}Z`,
                                end: `${new Date(timeRange.end)
                                    .toISOString()
                                    .slice(0, 19)
                                    .replace(/[-:.]/g, '')}Z`,
                            },
                        },
                    }
                    : {})),
            },
        },
    ];
    const calendarObjectUrls = (objectUrls !== null && objectUrls !== void 0 ? objectUrls : 
    // fetch all objects of the calendar
    (yield calendarQuery({
        url: calendar.url,
        props: {
            [`${exports.DAVNamespaceShort.DAV}:getetag`]: Object.assign({}, (expand && timeRange
                ? {
                    [`${exports.DAVNamespaceShort.CALDAV}:expand`]: {
                        _attributes: {
                            start: `${new Date(timeRange.start)
                                .toISOString()
                                .slice(0, 19)
                                .replace(/[-:.]/g, '')}Z`,
                            end: `${new Date(timeRange.end)
                                .toISOString()
                                .slice(0, 19)
                                .replace(/[-:.]/g, '')}Z`,
                        },
                    },
                }
                : {})),
        },
        filters,
        depth: '1',
        headers,
    })).map((res) => { var _a; return (_a = res.href) !== null && _a !== void 0 ? _a : ''; }))
        .map((url) => (url.startsWith('http') || !url ? url : new URL(url, calendar.url).href)) // patch up to full url if url is not full
        .filter(urlFilter) // custom filter function on calendar objects
        .map((url) => new URL(url).pathname); // obtain pathname of the url
    let calendarObjectResults = [];
    if (calendarObjectUrls.length > 0) {
        if (!useMultiGet || expand) {
            calendarObjectResults = yield calendarQuery({
                url: calendar.url,
                props: {
                    [`${exports.DAVNamespaceShort.DAV}:getetag`]: {},
                    [`${exports.DAVNamespaceShort.CALDAV}:calendar-data`]: Object.assign({}, (expand && timeRange
                        ? {
                            [`${exports.DAVNamespaceShort.CALDAV}:expand`]: {
                                _attributes: {
                                    start: `${new Date(timeRange.start)
                                        .toISOString()
                                        .slice(0, 19)
                                        .replace(/[-:.]/g, '')}Z`,
                                    end: `${new Date(timeRange.end)
                                        .toISOString()
                                        .slice(0, 19)
                                        .replace(/[-:.]/g, '')}Z`,
                                },
                            },
                        }
                        : {})),
                },
                filters,
                depth: '1',
                headers,
            });
        }
        else {
            calendarObjectResults = yield calendarMultiGet({
                url: calendar.url,
                props: {
                    [`${exports.DAVNamespaceShort.DAV}:getetag`]: {},
                    [`${exports.DAVNamespaceShort.CALDAV}:calendar-data`]: Object.assign({}, (expand && timeRange
                        ? {
                            [`${exports.DAVNamespaceShort.CALDAV}:expand`]: {
                                _attributes: {
                                    start: `${new Date(timeRange.start)
                                        .toISOString()
                                        .slice(0, 19)
                                        .replace(/[-:.]/g, '')}Z`,
                                    end: `${new Date(timeRange.end)
                                        .toISOString()
                                        .slice(0, 19)
                                        .replace(/[-:.]/g, '')}Z`,
                                },
                            },
                        }
                        : {})),
                },
                objectUrls: calendarObjectUrls,
                depth: '1',
                headers,
            });
        }
    }
    return calendarObjectResults.map((res) => {
        var _a, _b, _c, _d, _e, _f;
        return ({
            url: new URL((_a = res.href) !== null && _a !== void 0 ? _a : '', calendar.url).href,
            etag: `${(_b = res.props) === null || _b === void 0 ? void 0 : _b.getetag}`,
            data: (_e = (_d = (_c = res.props) === null || _c === void 0 ? void 0 : _c.calendarData) === null || _d === void 0 ? void 0 : _d._cdata) !== null && _e !== void 0 ? _e : (_f = res.props) === null || _f === void 0 ? void 0 : _f.calendarData,
        });
    });
});
const createCalendarObject = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { calendar, iCalString, filename, headers } = params;
    return createObject({
        url: new URL(filename, calendar.url).href,
        data: iCalString,
        headers: Object.assign({ 'content-type': 'text/calendar; charset=utf-8', 'If-None-Match': '*' }, headers),
    });
});
const updateCalendarObject = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { calendarObject, headers } = params;
    return updateObject({
        url: calendarObject.url,
        data: calendarObject.data,
        etag: calendarObject.etag,
        headers: Object.assign({ 'content-type': 'text/calendar; charset=utf-8' }, headers),
    });
});
const deleteCalendarObject = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { calendarObject, headers } = params;
    return deleteObject({ url: calendarObject.url, etag: calendarObject.etag, headers });
});
/**
 * Sync remote calendars to local
 */
const syncCalendars = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { oldCalendars, account, detailedResult, headers } = params;
    if (!account) {
        throw new Error('Must have account before syncCalendars');
    }
    const localCalendars = (_a = oldCalendars !== null && oldCalendars !== void 0 ? oldCalendars : account.calendars) !== null && _a !== void 0 ? _a : [];
    const remoteCalendars = yield fetchCalendars({ account, headers });
    // no existing url
    const created = remoteCalendars.filter((rc) => localCalendars.every((lc) => !urlContains(lc.url, rc.url)));
    debug$2(`new calendars: ${created.map((cc) => cc.displayName)}`);
    // have same url, but syncToken/ctag different
    const updated = localCalendars.reduce((prev, curr) => {
        const found = remoteCalendars.find((rc) => urlContains(rc.url, curr.url));
        if (found &&
            ((found.syncToken && found.syncToken !== curr.syncToken) ||
                (found.ctag && found.ctag !== curr.ctag))) {
            return [...prev, found];
        }
        return prev;
    }, []);
    debug$2(`updated calendars: ${updated.map((cc) => cc.displayName)}`);
    const updatedWithObjects = yield Promise.all(updated.map((u) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield smartCollectionSync({
            collection: Object.assign(Object.assign({}, u), { objectMultiGet: calendarMultiGet }),
            method: 'webdav',
            headers,
            account,
        });
        return result;
    })));
    // does not present in remote
    const deleted = localCalendars.filter((cal) => remoteCalendars.every((rc) => !urlContains(rc.url, cal.url)));
    debug$2(`deleted calendars: ${deleted.map((cc) => cc.displayName)}`);
    const unchanged = localCalendars.filter((cal) => remoteCalendars.some((rc) => urlContains(rc.url, cal.url) &&
        ((rc.syncToken && rc.syncToken !== cal.syncToken) || (rc.ctag && rc.ctag !== cal.ctag))));
    // debug(`unchanged calendars: ${unchanged.map((cc) => cc.displayName)}`);
    return detailedResult
        ? {
            created,
            updated,
            deleted,
        }
        : [...unchanged, ...created, ...updatedWithObjects];
});
const freeBusyQuery = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, timeRange, depth, headers } = params;
    if (timeRange) {
        // validate timeRange
        const ISO_8601 = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i;
        const ISO_8601_FULL = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;
        if ((!ISO_8601.test(timeRange.start) || !ISO_8601.test(timeRange.end)) &&
            (!ISO_8601_FULL.test(timeRange.start) || !ISO_8601_FULL.test(timeRange.end))) {
            throw new Error('invalid timeRange format, not in ISO8601');
        }
    }
    else {
        throw new Error('timeRange is required');
    }
    const result = yield collectionQuery({
        url,
        body: {
            'free-busy-query': cleanupFalsy({
                _attributes: getDAVAttribute([exports.DAVNamespace.CALDAV]),
                [`${exports.DAVNamespaceShort.CALDAV}:time-range`]: {
                    _attributes: {
                        start: `${new Date(timeRange.start).toISOString().slice(0, 19).replace(/[-:.]/g, '')}Z`,
                        end: `${new Date(timeRange.end).toISOString().slice(0, 19).replace(/[-:.]/g, '')}Z`,
                    },
                },
            }),
        },
        defaultNamespace: exports.DAVNamespaceShort.CALDAV,
        depth,
        headers,
    });
    return result[0];
});

var calendar = /*#__PURE__*/Object.freeze({
    __proto__: null,
    calendarMultiGet: calendarMultiGet,
    calendarQuery: calendarQuery,
    createCalendarObject: createCalendarObject,
    deleteCalendarObject: deleteCalendarObject,
    fetchCalendarObjects: fetchCalendarObjects,
    fetchCalendars: fetchCalendars,
    freeBusyQuery: freeBusyQuery,
    makeCalendar: makeCalendar,
    syncCalendars: syncCalendars,
    updateCalendarObject: updateCalendarObject
});

const debug$1 = getLogger('tsdav:account');
const serviceDiscovery = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    debug$1('Service discovery...');
    const { account, headers } = params;
    const endpoint = new URL(account.serverUrl);
    const uri = new URL(`/.well-known/${account.accountType}`, endpoint);
    uri.protocol = (_a = endpoint.protocol) !== null && _a !== void 0 ? _a : 'http';
    try {
        const response = yield crossFetch.fetch(uri.href, {
            headers,
            method: 'PROPFIND',
            redirect: 'manual',
        });
        if (response.status >= 300 && response.status < 400) {
            // http redirect.
            const location = response.headers.get('Location');
            if (typeof location === 'string' && location.length) {
                debug$1(`Service discovery redirected to ${location}`);
                const serviceURL = new URL(location, endpoint);
                if (serviceURL.hostname === uri.hostname && uri.port && !serviceURL.port) {
                    serviceURL.port = uri.port;
                }
                serviceURL.protocol = (_b = endpoint.protocol) !== null && _b !== void 0 ? _b : 'http';
                return serviceURL.href;
            }
        }
    }
    catch (err) {
        debug$1(`Service discovery failed: ${err.stack}`);
    }
    return endpoint.href;
});
const fetchPrincipalUrl = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e, _f, _g;
    const { account, headers } = params;
    const requiredFields = ['rootUrl'];
    if (!hasFields(account, requiredFields)) {
        throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchPrincipalUrl`);
    }
    debug$1(`Fetching principal url from path ${account.rootUrl}`);
    const [response] = yield propfind({
        url: account.rootUrl,
        props: {
            [`${exports.DAVNamespaceShort.DAV}:current-user-principal`]: {},
        },
        depth: '0',
        headers,
    });
    if (!response.ok) {
        debug$1(`Fetch principal url failed: ${response.statusText}`);
        if (response.status === 401) {
            throw new Error('Invalid credentials');
        }
    }
    debug$1(`Fetched principal url ${(_d = (_c = response.props) === null || _c === void 0 ? void 0 : _c.currentUserPrincipal) === null || _d === void 0 ? void 0 : _d.href}`);
    return new URL((_g = (_f = (_e = response.props) === null || _e === void 0 ? void 0 : _e.currentUserPrincipal) === null || _f === void 0 ? void 0 : _f.href) !== null && _g !== void 0 ? _g : '', account.rootUrl).href;
});
const fetchHomeUrl = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _h, _j;
    const { account, headers } = params;
    const requiredFields = ['principalUrl', 'rootUrl'];
    if (!hasFields(account, requiredFields)) {
        throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchHomeUrl`);
    }
    debug$1(`Fetch home url from ${account.principalUrl}`);
    const responses = yield propfind({
        url: account.principalUrl,
        props: account.accountType === 'caldav'
            ? { [`${exports.DAVNamespaceShort.CALDAV}:calendar-home-set`]: {} }
            : { [`${exports.DAVNamespaceShort.CARDDAV}:addressbook-home-set`]: {} },
        depth: '0',
        headers,
    });
    const matched = responses.find((r) => urlContains(account.principalUrl, r.href));
    if (!matched || !matched.ok) {
        throw new Error('cannot find homeUrl');
    }
    const result = new URL(account.accountType === 'caldav'
        ? (_h = matched === null || matched === void 0 ? void 0 : matched.props) === null || _h === void 0 ? void 0 : _h.calendarHomeSet.href
        : (_j = matched === null || matched === void 0 ? void 0 : matched.props) === null || _j === void 0 ? void 0 : _j.addressbookHomeSet.href, account.rootUrl).href;
    debug$1(`Fetched home url ${result}`);
    return result;
});
const createAccount = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { account, headers, loadCollections = false, loadObjects = false } = params;
    const newAccount = Object.assign({}, account);
    newAccount.rootUrl = yield serviceDiscovery({ account, headers });
    newAccount.principalUrl = yield fetchPrincipalUrl({ account: newAccount, headers });
    newAccount.homeUrl = yield fetchHomeUrl({ account: newAccount, headers });
    // to load objects you must first load collections
    if (loadCollections || loadObjects) {
        if (account.accountType === 'caldav') {
            newAccount.calendars = yield fetchCalendars({ headers, account: newAccount });
        }
        else if (account.accountType === 'carddav') {
            newAccount.addressBooks = yield fetchAddressBooks({ headers, account: newAccount });
        }
    }
    if (loadObjects) {
        if (account.accountType === 'caldav' && newAccount.calendars) {
            newAccount.calendars = yield Promise.all(newAccount.calendars.map((cal) => __awaiter(void 0, void 0, void 0, function* () {
                return (Object.assign(Object.assign({}, cal), { objects: yield fetchCalendarObjects({ calendar: cal, headers }) }));
            })));
        }
        else if (account.accountType === 'carddav' && newAccount.addressBooks) {
            newAccount.addressBooks = yield Promise.all(newAccount.addressBooks.map((addr) => __awaiter(void 0, void 0, void 0, function* () {
                return (Object.assign(Object.assign({}, addr), { objects: yield fetchVCards({ addressBook: addr, headers }) }));
            })));
        }
    }
    return newAccount;
});

var account = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createAccount: createAccount,
    fetchHomeUrl: fetchHomeUrl,
    fetchPrincipalUrl: fetchPrincipalUrl,
    serviceDiscovery: serviceDiscovery
});

const debug = getLogger('tsdav:authHelper');
/**
 * Provide given params as default params to given function with optional params.
 *
 * suitable only for one param functions
 * params are shallow merged
 */
const defaultParam = (fn, params) => (...args) => {
    return fn(Object.assign(Object.assign({}, params), args[0]));
};
const getBasicAuthHeaders = (credentials) => {
    debug(`Basic auth token generated: ${base64.encode(`${credentials.username}:${credentials.password}`)}`);
    return {
        authorization: `Basic ${base64.encode(`${credentials.username}:${credentials.password}`)}`,
    };
};
const fetchOauthTokens = (credentials) => __awaiter(void 0, void 0, void 0, function* () {
    const requireFields = [
        'authorizationCode',
        'redirectUrl',
        'clientId',
        'clientSecret',
        'tokenUrl',
    ];
    if (!hasFields(credentials, requireFields)) {
        throw new Error(`Oauth credentials missing: ${findMissingFieldNames(credentials, requireFields)}`);
    }
    const param = new URLSearchParams({
        grant_type: 'authorization_code',
        code: credentials.authorizationCode,
        redirect_uri: credentials.redirectUrl,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
    });
    debug(credentials.tokenUrl);
    debug(param.toString());
    const response = yield crossFetch.fetch(credentials.tokenUrl, {
        method: 'POST',
        body: param.toString(),
        headers: {
            'content-length': `${param.toString().length}`,
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    if (response.ok) {
        const tokens = yield response.json();
        return tokens;
    }
    debug(`Fetch Oauth tokens failed: ${yield response.text()}`);
    return {};
});
const refreshAccessToken = (credentials) => __awaiter(void 0, void 0, void 0, function* () {
    const requireFields = [
        'refreshToken',
        'clientId',
        'clientSecret',
        'tokenUrl',
    ];
    if (!hasFields(credentials, requireFields)) {
        throw new Error(`Oauth credentials missing: ${findMissingFieldNames(credentials, requireFields)}`);
    }
    const param = new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: credentials.refreshToken,
        grant_type: 'refresh_token',
    });
    const response = yield crossFetch.fetch(credentials.tokenUrl, {
        method: 'POST',
        body: param.toString(),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    if (response.ok) {
        const tokens = yield response.json();
        return tokens;
    }
    debug(`Refresh access token failed: ${yield response.text()}`);
    return {};
});
const getOauthHeaders = (credentials) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    debug('Fetching oauth headers');
    let tokens = {};
    if (!credentials.refreshToken) {
        // No refresh token, fetch new tokens
        tokens = yield fetchOauthTokens(credentials);
    }
    else if ((credentials.refreshToken && !credentials.accessToken) ||
        Date.now() > ((_a = credentials.expiration) !== null && _a !== void 0 ? _a : 0)) {
        // have refresh token, but no accessToken, fetch access token only
        // or have both, but accessToken was expired
        tokens = yield refreshAccessToken(credentials);
    }
    // now we should have valid access token
    debug(`Oauth tokens fetched: ${tokens.access_token}`);
    return {
        tokens,
        headers: {
            authorization: `Bearer ${tokens.access_token}`,
        },
    };
});

var authHelpers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    defaultParam: defaultParam,
    fetchOauthTokens: fetchOauthTokens,
    getBasicAuthHeaders: getBasicAuthHeaders,
    getOauthHeaders: getOauthHeaders,
    refreshAccessToken: refreshAccessToken
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createDAVClient = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { serverUrl, credentials, authMethod, defaultAccountType, authFunction } = params;
    let authHeaders = {};
    switch (authMethod) {
        case 'Basic':
            authHeaders = getBasicAuthHeaders(credentials);
            break;
        case 'Oauth':
            authHeaders = (yield getOauthHeaders(credentials)).headers;
            break;
        case 'Digest':
            authHeaders = {
                Authorization: `Digest ${credentials.digestString}`,
            };
            break;
        case 'Custom':
            authHeaders = (_a = (yield (authFunction === null || authFunction === void 0 ? void 0 : authFunction(credentials)))) !== null && _a !== void 0 ? _a : {};
            break;
        default:
            throw new Error('Invalid auth method');
    }
    const defaultAccount = defaultAccountType
        ? yield createAccount({
            account: { serverUrl, credentials, accountType: defaultAccountType },
            headers: authHeaders,
        })
        : undefined;
    const davRequest$1 = (params0) => __awaiter(void 0, void 0, void 0, function* () {
        const { init } = params0, rest = __rest(params0, ["init"]);
        const { headers } = init, restInit = __rest(init, ["headers"]);
        return davRequest(Object.assign(Object.assign({}, rest), { init: Object.assign(Object.assign({}, restInit), { headers: Object.assign(Object.assign({}, authHeaders), headers) }) }));
    });
    const createObject$1 = defaultParam(createObject, {
        url: serverUrl,
        headers: authHeaders,
    });
    const updateObject$1 = defaultParam(updateObject, { headers: authHeaders, url: serverUrl });
    const deleteObject$1 = defaultParam(deleteObject, { headers: authHeaders, url: serverUrl });
    const propfind$1 = defaultParam(propfind, { headers: authHeaders });
    // account
    const createAccount$1 = (params0) => __awaiter(void 0, void 0, void 0, function* () {
        const { account, headers, loadCollections, loadObjects } = params0;
        return createAccount({
            account: Object.assign({ serverUrl, credentials }, account),
            headers: Object.assign(Object.assign({}, authHeaders), headers),
            loadCollections,
            loadObjects,
        });
    });
    // collection
    const collectionQuery$1 = defaultParam(collectionQuery, { headers: authHeaders });
    const makeCollection$1 = defaultParam(makeCollection, { headers: authHeaders });
    const syncCollection$1 = defaultParam(syncCollection, { headers: authHeaders });
    const supportedReportSet$1 = defaultParam(supportedReportSet, {
        headers: authHeaders,
    });
    const isCollectionDirty$1 = defaultParam(isCollectionDirty, {
        headers: authHeaders,
    });
    const smartCollectionSync$1 = defaultParam(smartCollectionSync, {
        headers: authHeaders,
        account: defaultAccount,
    });
    // calendar
    const calendarQuery$1 = defaultParam(calendarQuery, { headers: authHeaders });
    const calendarMultiGet$1 = defaultParam(calendarMultiGet, { headers: authHeaders });
    const makeCalendar$1 = defaultParam(makeCalendar, { headers: authHeaders });
    const fetchCalendars$1 = defaultParam(fetchCalendars, {
        headers: authHeaders,
        account: defaultAccount,
    });
    const fetchCalendarObjects$1 = defaultParam(fetchCalendarObjects, {
        headers: authHeaders,
    });
    const createCalendarObject$1 = defaultParam(createCalendarObject, {
        headers: authHeaders,
    });
    const updateCalendarObject$1 = defaultParam(updateCalendarObject, {
        headers: authHeaders,
    });
    const deleteCalendarObject$1 = defaultParam(deleteCalendarObject, {
        headers: authHeaders,
    });
    const syncCalendars$1 = defaultParam(syncCalendars, {
        account: defaultAccount,
        headers: authHeaders,
    });
    // addressBook
    const addressBookQuery$1 = defaultParam(addressBookQuery, { headers: authHeaders });
    const addressBookMultiGet$1 = defaultParam(addressBookMultiGet, { headers: authHeaders });
    const fetchAddressBooks$1 = defaultParam(fetchAddressBooks, {
        account: defaultAccount,
        headers: authHeaders,
    });
    const fetchVCards$1 = defaultParam(fetchVCards, { headers: authHeaders });
    const createVCard$1 = defaultParam(createVCard, { headers: authHeaders });
    const updateVCard$1 = defaultParam(updateVCard, { headers: authHeaders });
    const deleteVCard$1 = defaultParam(deleteVCard, { headers: authHeaders });
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
        fetchCalendars: fetchCalendars$1,
        fetchCalendarObjects: fetchCalendarObjects$1,
        createCalendarObject: createCalendarObject$1,
        updateCalendarObject: updateCalendarObject$1,
        deleteCalendarObject: deleteCalendarObject$1,
        syncCalendars: syncCalendars$1,
        fetchAddressBooks: fetchAddressBooks$1,
        addressBookMultiGet: addressBookMultiGet$1,
        fetchVCards: fetchVCards$1,
        createVCard: createVCard$1,
        updateVCard: updateVCard$1,
        deleteVCard: deleteVCard$1,
    };
});
class DAVClient {
    constructor(params) {
        var _a, _b;
        this.serverUrl = params.serverUrl;
        this.credentials = params.credentials;
        this.authMethod = (_a = params.authMethod) !== null && _a !== void 0 ? _a : 'Basic';
        this.accountType = (_b = params.defaultAccountType) !== null && _b !== void 0 ? _b : 'caldav';
    }
    login() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            switch (this.authMethod) {
                case 'Basic':
                    this.authHeaders = getBasicAuthHeaders(this.credentials);
                    break;
                case 'Oauth':
                    this.authHeaders = (yield getOauthHeaders(this.credentials)).headers;
                    break;
                case 'Digest':
                    this.authHeaders = {
                        Authorization: `Digest ${this.credentials.digestString}`,
                    };
                    break;
                case 'Custom':
                    this.authHeaders = yield ((_a = this.authFunction) === null || _a === void 0 ? void 0 : _a.call(this, this.credentials));
                    break;
                default:
                    throw new Error('Invalid auth method');
            }
            this.account = this.accountType
                ? yield createAccount({
                    account: {
                        serverUrl: this.serverUrl,
                        credentials: this.credentials,
                        accountType: this.accountType,
                    },
                    headers: this.authHeaders,
                })
                : undefined;
        });
    }
    davRequest(params0) {
        return __awaiter(this, void 0, void 0, function* () {
            const { init } = params0, rest = __rest(params0, ["init"]);
            const { headers } = init, restInit = __rest(init, ["headers"]);
            return davRequest(Object.assign(Object.assign({}, rest), { init: Object.assign(Object.assign({}, restInit), { headers: Object.assign(Object.assign({}, this.authHeaders), headers) }) }));
        });
    }
    createObject(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(createObject, {
                url: this.serverUrl,
                headers: this.authHeaders,
            })(params[0]);
        });
    }
    updateObject(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(updateObject, { headers: this.authHeaders, url: this.serverUrl })(params[0]);
        });
    }
    deleteObject(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(deleteObject, { headers: this.authHeaders, url: this.serverUrl })(params[0]);
        });
    }
    propfind(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(propfind, { headers: this.authHeaders })(params[0]);
        });
    }
    createAccount(params0) {
        return __awaiter(this, void 0, void 0, function* () {
            const { account, headers, loadCollections, loadObjects } = params0;
            return createAccount({
                account: Object.assign({ serverUrl: this.serverUrl, credentials: this.credentials }, account),
                headers: Object.assign(Object.assign({}, this.authHeaders), headers),
                loadCollections,
                loadObjects,
            });
        });
    }
    collectionQuery(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(collectionQuery, { headers: this.authHeaders })(params[0]);
        });
    }
    makeCollection(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(makeCollection, { headers: this.authHeaders })(params[0]);
        });
    }
    syncCollection(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(syncCollection, { headers: this.authHeaders })(params[0]);
        });
    }
    supportedReportSet(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(supportedReportSet, { headers: this.authHeaders })(params[0]);
        });
    }
    isCollectionDirty(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(isCollectionDirty, { headers: this.authHeaders })(params[0]);
        });
    }
    smartCollectionSync(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(smartCollectionSync, {
                headers: this.authHeaders,
                account: this.account,
            })(params[0]);
        });
    }
    calendarQuery(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(calendarQuery, { headers: this.authHeaders })(params[0]);
        });
    }
    makeCalendar(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(makeCalendar, { headers: this.authHeaders })(params[0]);
        });
    }
    calendarMultiGet(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(calendarMultiGet, { headers: this.authHeaders })(params[0]);
        });
    }
    fetchCalendars(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(fetchCalendars, { headers: this.authHeaders, account: this.account })(params === null || params === void 0 ? void 0 : params[0]);
        });
    }
    fetchCalendarObjects(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(fetchCalendarObjects, { headers: this.authHeaders })(params[0]);
        });
    }
    createCalendarObject(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(createCalendarObject, { headers: this.authHeaders })(params[0]);
        });
    }
    updateCalendarObject(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(updateCalendarObject, { headers: this.authHeaders })(params[0]);
        });
    }
    deleteCalendarObject(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(deleteCalendarObject, { headers: this.authHeaders })(params[0]);
        });
    }
    syncCalendars(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(syncCalendars, {
                headers: this.authHeaders,
                account: this.account,
            })(params[0]);
        });
    }
    addressBookQuery(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(addressBookQuery, { headers: this.authHeaders })(params[0]);
        });
    }
    addressBookMultiGet(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(addressBookMultiGet, { headers: this.authHeaders })(params[0]);
        });
    }
    fetchAddressBooks(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(fetchAddressBooks, { headers: this.authHeaders, account: this.account })(params === null || params === void 0 ? void 0 : params[0]);
        });
    }
    fetchVCards(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(fetchVCards, { headers: this.authHeaders })(params[0]);
        });
    }
    createVCard(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(createVCard, { headers: this.authHeaders })(params[0]);
        });
    }
    updateVCard(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(updateVCard, { headers: this.authHeaders })(params[0]);
        });
    }
    deleteVCard(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return defaultParam(deleteVCard, { headers: this.authHeaders })(params[0]);
        });
    }
}

var client = /*#__PURE__*/Object.freeze({
    __proto__: null,
    DAVClient: DAVClient,
    createDAVClient: createDAVClient
});

var index = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ DAVNamespace: exports.DAVNamespace,
    DAVNamespaceShort: exports.DAVNamespaceShort,
    DAVAttributeMap }, client), request), collection), account), addressBook), calendar), authHelpers), requestHelpers);

exports.DAVAttributeMap = DAVAttributeMap;
exports.DAVClient = DAVClient;
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
exports.default = index;
exports.deleteCalendarObject = deleteCalendarObject;
exports.deleteObject = deleteObject;
exports.deleteVCard = deleteVCard;
exports.fetchAddressBooks = fetchAddressBooks;
exports.fetchCalendarObjects = fetchCalendarObjects;
exports.fetchCalendars = fetchCalendars;
exports.fetchOauthTokens = fetchOauthTokens;
exports.fetchVCards = fetchVCards;
exports.freeBusyQuery = freeBusyQuery;
exports.getBasicAuthHeaders = getBasicAuthHeaders;
exports.getDAVAttribute = getDAVAttribute;
exports.getOauthHeaders = getOauthHeaders;
exports.isCollectionDirty = isCollectionDirty;
exports.makeCalendar = makeCalendar;
exports.propfind = propfind;
exports.refreshAccessToken = refreshAccessToken;
exports.smartCollectionSync = smartCollectionSync;
exports.supportedReportSet = supportedReportSet;
exports.syncCalendars = syncCalendars;
exports.syncCollection = syncCollection;
exports.updateCalendarObject = updateCalendarObject;
exports.updateObject = updateObject;
exports.updateVCard = updateVCard;
exports.urlContains = urlContains;
exports.urlEquals = urlEquals;
