'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var crossFetch = require('cross-fetch');
var getLogger = require('debug');
var convert = require('xml-js');
var base64 = require('base-64');

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
const getDAVAttribute = (nsArr) => nsArr.reduce((prev, curr) => ({ ...prev, [DAVAttributeMap[curr]]: curr }), {});
const cleanupFalsy = (obj) => Object.entries(obj).reduce((prev, [key, value]) => {
    if (value)
        return { ...prev, [key]: value };
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
const excludeHeaders = (headers, headersToExclude) => {
    if (!headers) {
        return {};
    }
    if (!headersToExclude || headersToExclude.length === 0) {
        return headers;
    }
    return Object.fromEntries(Object.entries(headers).filter(([key]) => !headersToExclude.includes(key)));
};

var requestHelpers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    cleanupFalsy: cleanupFalsy,
    conditionalParam: conditionalParam,
    excludeHeaders: excludeHeaders,
    getDAVAttribute: getDAVAttribute,
    urlContains: urlContains,
    urlEquals: urlEquals
});

const debug$5 = getLogger('tsdav:request');
const davRequest = async (params) => {
    var _a;
    const { url, init, convertIncoming = true, parseOutgoing = true, fetchOptions = {} } = params;
    const { headers = {}, body, namespace, method, attributes } = init;
    const xmlBody = convertIncoming
        ? convert.js2xml({
            _declaration: { _attributes: { version: '1.0', encoding: 'utf-8' } },
            ...body,
            _attributes: attributes,
        }, {
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
    const fetchOptionsWithoutHeaders = {
        ...fetchOptions
    };
    delete fetchOptionsWithoutHeaders.headers;
    const davResponse = await crossFetch.fetch(url, {
        headers: {
            'Content-Type': 'text/xml;charset=UTF-8',
            ...cleanupFalsy(headers),
            ...(fetchOptions.headers || {})
        },
        body: xmlBody,
        method,
        ...fetchOptionsWithoutHeaders,
    });
    const resText = await davResponse.text();
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
            const newVal = { ...value };
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
                return {
                    ...prev,
                    ...curr === null || curr === void 0 ? void 0 : curr.prop,
                };
            }, {}),
        };
    });
};
const propfind = async (params) => {
    const { url, props, depth, headers, headersToExclude, fetchOptions = {} } = params;
    return davRequest({
        url,
        init: {
            method: 'PROPFIND',
            headers: excludeHeaders(cleanupFalsy({ depth, ...headers }), headersToExclude),
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
        fetchOptions,
    });
};
const createObject = async (params) => {
    const { url, data, headers, headersToExclude, fetchOptions = {} } = params;
    return crossFetch.fetch(url, {
        method: 'PUT',
        body: data,
        headers: excludeHeaders(headers, headersToExclude),
        ...fetchOptions,
    });
};
const updateObject = async (params) => {
    const { url, data, etag, headers, headersToExclude, fetchOptions = {} } = params;
    return crossFetch.fetch(url, {
        method: 'PUT',
        body: data,
        headers: excludeHeaders(cleanupFalsy({ 'If-Match': etag, ...headers }), headersToExclude),
        ...fetchOptions,
    });
};
const deleteObject = async (params) => {
    const { url, headers, etag, headersToExclude, fetchOptions = {} } = params;
    return crossFetch.fetch(url, {
        method: 'DELETE',
        headers: excludeHeaders(cleanupFalsy({ 'If-Match': etag, ...headers }), headersToExclude),
        ...fetchOptions,
    });
};

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

/* eslint-disable no-underscore-dangle */
const debug$4 = getLogger('tsdav:collection');
const collectionQuery = async (params) => {
    const { url, body, depth, defaultNamespace = exports.DAVNamespaceShort.DAV, headers, headersToExclude, fetchOptions = {} } = params;
    const queryResults = await davRequest({
        url,
        init: {
            method: 'REPORT',
            headers: excludeHeaders(cleanupFalsy({ depth, ...headers }), headersToExclude),
            namespace: defaultNamespace,
            body,
        },
        fetchOptions,
    });
    // empty query result
    if (queryResults.length === 1 && !queryResults[0].raw) {
        return [];
    }
    return queryResults;
};
const makeCollection = async (params) => {
    const { url, props, depth, headers, headersToExclude, fetchOptions = {} } = params;
    return davRequest({
        url,
        init: {
            method: 'MKCOL',
            headers: excludeHeaders(cleanupFalsy({ depth, ...headers }), headersToExclude),
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
        fetchOptions
    });
};
const supportedReportSet = async (params) => {
    var _a, _b, _c, _d, _e;
    const { collection, headers, headersToExclude, fetchOptions = {} } = params;
    const res = await propfind({
        url: collection.url,
        props: {
            [`${exports.DAVNamespaceShort.DAV}:supported-report-set`]: {},
        },
        depth: '0',
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions
    });
    return ((_e = (_d = (_c = (_b = (_a = res[0]) === null || _a === void 0 ? void 0 : _a.props) === null || _b === void 0 ? void 0 : _b.supportedReportSet) === null || _c === void 0 ? void 0 : _c.supportedReport) === null || _d === void 0 ? void 0 : _d.map((sr) => Object.keys(sr.report)[0])) !== null && _e !== void 0 ? _e : []);
};
const isCollectionDirty = async (params) => {
    var _a, _b, _c;
    const { collection, headers, headersToExclude, fetchOptions = {} } = params;
    const responses = await propfind({
        url: collection.url,
        props: {
            [`${exports.DAVNamespaceShort.CALENDAR_SERVER}:getctag`]: {},
        },
        depth: '0',
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions
    });
    const res = responses.filter((r) => urlContains(collection.url, r.href))[0];
    if (!res) {
        throw new Error('Collection does not exist on server');
    }
    return {
        isDirty: `${collection.ctag}` !== `${(_a = res.props) === null || _a === void 0 ? void 0 : _a.getctag}`,
        newCtag: (_c = (_b = res.props) === null || _b === void 0 ? void 0 : _b.getctag) === null || _c === void 0 ? void 0 : _c.toString(),
    };
};
/**
 * This is for webdav sync-collection only
 */
const syncCollection = (params) => {
    const { url, props, headers, syncLevel, syncToken, headersToExclude, fetchOptions } = params;
    return davRequest({
        url,
        init: {
            method: 'REPORT',
            namespace: exports.DAVNamespaceShort.DAV,
            headers: excludeHeaders({ ...headers }, headersToExclude),
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
        fetchOptions
    });
};
/** remote collection to local */
const smartCollectionSync = async (params) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const { collection, method, headers, headersToExclude, account, detailedResult, fetchOptions = {} } = params;
    const requiredFields = ['accountType', 'homeUrl'];
    if (!account || !hasFields(account, requiredFields)) {
        if (!account) {
            throw new Error('no account for smartCollectionSync');
        }
        throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before smartCollectionSync`);
    }
    const syncMethod = method !== null && method !== void 0 ? method : (((_a = collection.reports) === null || _a === void 0 ? void 0 : _a.includes('syncCollection')) ? 'webdav' : 'basic');
    debug$4(`smart collection sync with type ${account.accountType} and method ${syncMethod}`);
    if (syncMethod === 'webdav') {
        const result = await syncCollection({
            url: collection.url,
            props: {
                [`${exports.DAVNamespaceShort.DAV}:getetag`]: {},
                [`${account.accountType === 'caldav' ? exports.DAVNamespaceShort.CALDAV : exports.DAVNamespaceShort.CARDDAV}:${account.accountType === 'caldav' ? 'calendar-data' : 'address-data'}`]: {},
                [`${exports.DAVNamespaceShort.DAV}:displayname`]: {},
            },
            syncLevel: 1,
            syncToken: collection.syncToken,
            headers: excludeHeaders(headers, headersToExclude),
            fetchOptions
        });
        const objectResponses = result.filter((r) => {
            var _a;
            const extName = account.accountType === 'caldav' ? '.ics' : '.vcf';
            return ((_a = r.href) === null || _a === void 0 ? void 0 : _a.slice(-4)) === extName;
        });
        const changedObjectUrls = objectResponses.filter((o) => o.status !== 404).map((r) => r.href);
        const deletedObjectUrls = objectResponses.filter((o) => o.status === 404).map((r) => r.href);
        const multiGetObjectResponse = changedObjectUrls.length
            ? ((_c = (await ((_b = collection === null || collection === void 0 ? void 0 : collection.objectMultiGet) === null || _b === void 0 ? void 0 : _b.call(collection, {
                url: collection.url,
                props: {
                    [`${exports.DAVNamespaceShort.DAV}:getetag`]: {},
                    [`${account.accountType === 'caldav'
                        ? exports.DAVNamespaceShort.CALDAV
                        : exports.DAVNamespaceShort.CARDDAV}:${account.accountType === 'caldav' ? 'calendar-data' : 'address-data'}`]: {},
                },
                objectUrls: changedObjectUrls,
                depth: '1',
                headers: excludeHeaders(headers, headersToExclude),
                fetchOptions
            })))) !== null && _c !== void 0 ? _c : [])
            : [];
        const remoteObjects = multiGetObjectResponse.map((res) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return {
                url: (_a = res.href) !== null && _a !== void 0 ? _a : '',
                etag: (_b = res.props) === null || _b === void 0 ? void 0 : _b.getetag,
                data: (account === null || account === void 0 ? void 0 : account.accountType) === 'caldav'
                    ? ((_e = (_d = (_c = res.props) === null || _c === void 0 ? void 0 : _c.calendarData) === null || _d === void 0 ? void 0 : _d._cdata) !== null && _e !== void 0 ? _e : (_f = res.props) === null || _f === void 0 ? void 0 : _f.calendarData)
                    : ((_j = (_h = (_g = res.props) === null || _g === void 0 ? void 0 : _g.addressData) === null || _h === void 0 ? void 0 : _h._cdata) !== null && _j !== void 0 ? _j : (_k = res.props) === null || _k === void 0 ? void 0 : _k.addressData),
            };
        });
        const localObjects = (_d = collection.objects) !== null && _d !== void 0 ? _d : [];
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
        return {
            ...collection,
            objects: detailedResult
                ? { created, updated, deleted }
                : [...unchanged, ...created, ...updated],
            // all syncToken in the results are the same so we use the first one here
            syncToken: (_h = (_g = (_f = (_e = result[0]) === null || _e === void 0 ? void 0 : _e.raw) === null || _f === void 0 ? void 0 : _f.multistatus) === null || _g === void 0 ? void 0 : _g.syncToken) !== null && _h !== void 0 ? _h : collection.syncToken,
        };
    }
    if (syncMethod === 'basic') {
        const { isDirty, newCtag } = await isCollectionDirty({
            collection,
            headers: excludeHeaders(headers, headersToExclude),
            fetchOptions
        });
        const localObjects = (_j = collection.objects) !== null && _j !== void 0 ? _j : [];
        const remoteObjects = (_l = (await ((_k = collection.fetchObjects) === null || _k === void 0 ? void 0 : _k.call(collection, {
            collection,
            headers: excludeHeaders(headers, headersToExclude),
            fetchOptions
        })))) !== null && _l !== void 0 ? _l : [];
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
            return {
                ...collection,
                objects: detailedResult
                    ? { created, updated, deleted }
                    : [...unchanged, ...created, ...updated],
                ctag: newCtag,
            };
        }
    }
    return detailedResult
        ? {
            ...collection,
            objects: {
                created: [],
                updated: [],
                deleted: [],
            },
        }
        : collection;
};

var collection = /*#__PURE__*/Object.freeze({
    __proto__: null,
    collectionQuery: collectionQuery,
    isCollectionDirty: isCollectionDirty,
    makeCollection: makeCollection,
    smartCollectionSync: smartCollectionSync,
    supportedReportSet: supportedReportSet,
    syncCollection: syncCollection
});

/* eslint-disable no-underscore-dangle */
const debug$3 = getLogger('tsdav:addressBook');
const addressBookQuery = async (params) => {
    const { url, props, filters, depth, headers, headersToExclude, fetchOptions = {} } = params;
    return collectionQuery({
        url,
        body: {
            'addressbook-query': cleanupFalsy({
                _attributes: getDAVAttribute([exports.DAVNamespace.CARDDAV, exports.DAVNamespace.DAV]),
                [`${exports.DAVNamespaceShort.DAV}:prop`]: props,
                filter: filters !== null && filters !== void 0 ? filters : {
                    'prop-filter': {
                        _attributes: {
                            name: 'FN',
                        },
                    },
                },
            }),
        },
        defaultNamespace: exports.DAVNamespaceShort.CARDDAV,
        depth,
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    });
};
const addressBookMultiGet = async (params) => {
    const { url, props, objectUrls, depth, headers, headersToExclude, fetchOptions = {} } = params;
    return collectionQuery({
        url,
        body: {
            'addressbook-multiget': cleanupFalsy({
                _attributes: getDAVAttribute([exports.DAVNamespace.DAV, exports.DAVNamespace.CARDDAV]),
                [`${exports.DAVNamespaceShort.DAV}:prop`]: props,
                [`${exports.DAVNamespaceShort.DAV}:href`]: objectUrls,
            }),
        },
        defaultNamespace: exports.DAVNamespaceShort.CARDDAV,
        depth,
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    });
};
const fetchAddressBooks = async (params) => {
    const { account, headers, props: customProps, headersToExclude, fetchOptions = {}, } = params !== null && params !== void 0 ? params : {};
    const requiredFields = ['homeUrl', 'rootUrl'];
    if (!account || !hasFields(account, requiredFields)) {
        if (!account) {
            throw new Error('no account for fetchAddressBooks');
        }
        throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchAddressBooks`);
    }
    const res = await propfind({
        url: account.homeUrl,
        props: customProps !== null && customProps !== void 0 ? customProps : {
            [`${exports.DAVNamespaceShort.DAV}:displayname`]: {},
            [`${exports.DAVNamespaceShort.CALENDAR_SERVER}:getctag`]: {},
            [`${exports.DAVNamespaceShort.DAV}:resourcetype`]: {},
            [`${exports.DAVNamespaceShort.DAV}:sync-token`]: {},
        },
        depth: '1',
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
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
        .map(async (addr) => ({
        ...addr,
        reports: await supportedReportSet({
            collection: addr,
            headers: excludeHeaders(headers, headersToExclude),
            fetchOptions,
        }),
    })));
};
const fetchVCards = async (params) => {
    const { addressBook, headers, objectUrls, headersToExclude, urlFilter = (url) => url, useMultiGet = true, fetchOptions = {}, } = params;
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
    (await addressBookQuery({
        url: addressBook.url,
        props: { [`${exports.DAVNamespaceShort.DAV}:getetag`]: {} },
        depth: '1',
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    })).map((res) => { var _a; return (res.ok ? ((_a = res.href) !== null && _a !== void 0 ? _a : '') : ''); }))
        .map((url) => (url.startsWith('http') || !url ? url : new URL(url, addressBook.url).href))
        .filter(urlFilter)
        .map((url) => new URL(url).pathname);
    let vCardResults = [];
    if (vcardUrls.length > 0) {
        if (useMultiGet) {
            vCardResults = await addressBookMultiGet({
                url: addressBook.url,
                props: {
                    [`${exports.DAVNamespaceShort.DAV}:getetag`]: {},
                    [`${exports.DAVNamespaceShort.CARDDAV}:address-data`]: {},
                },
                objectUrls: vcardUrls,
                depth: '1',
                headers: excludeHeaders(headers, headersToExclude),
                fetchOptions,
            });
        }
        else {
            vCardResults = await addressBookQuery({
                url: addressBook.url,
                props: {
                    [`${exports.DAVNamespaceShort.DAV}:getetag`]: {},
                    [`${exports.DAVNamespaceShort.CARDDAV}:address-data`]: {},
                },
                depth: '1',
                headers: excludeHeaders(headers, headersToExclude),
                fetchOptions,
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
};
const createVCard = async (params) => {
    const { addressBook, vCardString, filename, headers, headersToExclude, fetchOptions = {}, } = params;
    return createObject({
        url: new URL(filename, addressBook.url).href,
        data: vCardString,
        headers: excludeHeaders({
            'content-type': 'text/vcard; charset=utf-8',
            'If-None-Match': '*',
            ...headers,
        }, headersToExclude),
        fetchOptions,
    });
};
const updateVCard = async (params) => {
    const { vCard, headers, headersToExclude, fetchOptions = {} } = params;
    return updateObject({
        url: vCard.url,
        data: vCard.data,
        etag: vCard.etag,
        headers: excludeHeaders({
            'content-type': 'text/vcard; charset=utf-8',
            ...headers,
        }, headersToExclude),
        fetchOptions,
    });
};
const deleteVCard = async (params) => {
    const { vCard, headers, headersToExclude, fetchOptions = {} } = params;
    return deleteObject({
        url: vCard.url,
        etag: vCard.etag,
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    });
};

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

/* eslint-disable no-underscore-dangle */
const debug$2 = getLogger('tsdav:calendar');
const fetchCalendarUserAddresses = async (params) => {
    var _a, _b, _c;
    const { account, headers, headersToExclude, fetchOptions = {} } = params;
    const requiredFields = ['principalUrl', 'rootUrl'];
    if (!hasFields(account, requiredFields)) {
        throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchUserAddresses`);
    }
    debug$2(`Fetch user addresses from ${account.principalUrl}`);
    const responses = await propfind({
        url: account.principalUrl,
        props: { [`${exports.DAVNamespaceShort.CALDAV}:calendar-user-address-set`]: {} },
        depth: '0',
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    });
    const matched = responses.find((r) => urlContains(account.principalUrl, r.href));
    if (!matched || !matched.ok) {
        throw new Error('cannot find calendarUserAddresses');
    }
    const addresses = ((_c = (_b = (_a = matched === null || matched === void 0 ? void 0 : matched.props) === null || _a === void 0 ? void 0 : _a.calendarUserAddressSet) === null || _b === void 0 ? void 0 : _b.href) === null || _c === void 0 ? void 0 : _c.filter(Boolean)) || [];
    debug$2(`Fetched calendar user addresses ${addresses}`);
    return addresses;
};
const calendarQuery = async (params) => {
    const { url, props, filters, timezone, depth, headers, headersToExclude, fetchOptions = {}, } = params;
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
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    });
};
const calendarMultiGet = async (params) => {
    const { url, props, objectUrls, filters, timezone, depth, headers, headersToExclude, fetchOptions = {}, } = params;
    return collectionQuery({
        url,
        body: {
            'calendar-multiget': cleanupFalsy({
                _attributes: getDAVAttribute([exports.DAVNamespace.DAV, exports.DAVNamespace.CALDAV]),
                [`${exports.DAVNamespaceShort.DAV}:prop`]: props,
                [`${exports.DAVNamespaceShort.DAV}:href`]: objectUrls,
                filter: filters,
                timezone,
            }),
        },
        defaultNamespace: exports.DAVNamespaceShort.CALDAV,
        depth,
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    });
};
const makeCalendar = async (params) => {
    const { url, props, depth, headers, headersToExclude, fetchOptions = {} } = params;
    return davRequest({
        url,
        init: {
            method: 'MKCALENDAR',
            headers: excludeHeaders(cleanupFalsy({ depth, ...headers }), headersToExclude),
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
        fetchOptions,
    });
};
const fetchCalendars = async (params) => {
    const { headers, account, props: customProps, projectedProps, headersToExclude, fetchOptions = {}, } = params !== null && params !== void 0 ? params : {};
    const requiredFields = ['homeUrl', 'rootUrl'];
    if (!account || !hasFields(account, requiredFields)) {
        if (!account) {
            throw new Error('no account for fetchCalendars');
        }
        throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchCalendars`);
    }
    const res = await propfind({
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
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    });
    return Promise.all(res
        .filter((r) => { var _a, _b; return Object.keys((_b = (_a = r.props) === null || _a === void 0 ? void 0 : _a.resourcetype) !== null && _b !== void 0 ? _b : {}).includes('calendar'); })
        .filter((rc) => {
        var _a, _b, _c, _d, _e, _f;
        // filter out none iCal format calendars.
        const components = Array.isArray((_b = (_a = rc.props) === null || _a === void 0 ? void 0 : _a.supportedCalendarComponentSet) === null || _b === void 0 ? void 0 : _b.comp)
            ? (_c = rc.props) === null || _c === void 0 ? void 0 : _c.supportedCalendarComponentSet.comp.map((sc) => sc._attributes.name)
            : [(_f = (_e = (_d = rc.props) === null || _d === void 0 ? void 0 : _d.supportedCalendarComponentSet) === null || _e === void 0 ? void 0 : _e.comp) === null || _f === void 0 ? void 0 : _f._attributes.name];
        return components.some((c) => Object.values(ICALObjects).includes(c));
    })
        .map((rs) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        // debug(`Found calendar ${rs.props?.displayname}`);
        const description = (_a = rs.props) === null || _a === void 0 ? void 0 : _a.calendarDescription;
        const timezone = (_b = rs.props) === null || _b === void 0 ? void 0 : _b.calendarTimezone;
        return {
            description: typeof description === 'string' ? description : '',
            timezone: typeof timezone === 'string' ? timezone : '',
            url: new URL((_c = rs.href) !== null && _c !== void 0 ? _c : '', (_d = account.rootUrl) !== null && _d !== void 0 ? _d : '').href,
            ctag: (_e = rs.props) === null || _e === void 0 ? void 0 : _e.getctag,
            calendarColor: (_f = rs.props) === null || _f === void 0 ? void 0 : _f.calendarColor,
            displayName: (_h = (_g = rs.props) === null || _g === void 0 ? void 0 : _g.displayname._cdata) !== null && _h !== void 0 ? _h : (_j = rs.props) === null || _j === void 0 ? void 0 : _j.displayname,
            components: Array.isArray((_k = rs.props) === null || _k === void 0 ? void 0 : _k.supportedCalendarComponentSet.comp)
                ? (_l = rs.props) === null || _l === void 0 ? void 0 : _l.supportedCalendarComponentSet.comp.map((sc) => sc._attributes.name)
                : [(_o = (_m = rs.props) === null || _m === void 0 ? void 0 : _m.supportedCalendarComponentSet.comp) === null || _o === void 0 ? void 0 : _o._attributes.name],
            resourcetype: Object.keys((_p = rs.props) === null || _p === void 0 ? void 0 : _p.resourcetype),
            syncToken: (_q = rs.props) === null || _q === void 0 ? void 0 : _q.syncToken,
            ...conditionalParam('projectedProps', Object.fromEntries(Object.entries((_r = rs.props) !== null && _r !== void 0 ? _r : {}).filter(([key]) => projectedProps === null || projectedProps === void 0 ? void 0 : projectedProps[key]))),
        };
    })
        .map(async (cal) => ({
        ...cal,
        reports: await supportedReportSet({
            collection: cal,
            headers: excludeHeaders(headers, headersToExclude),
            fetchOptions,
        }),
    })));
};
const fetchCalendarObjects = async (params) => {
    const { calendar, objectUrls, filters: customFilters, timeRange, headers, expand, urlFilter = (url) => Boolean(url === null || url === void 0 ? void 0 : url.includes('.ics')), useMultiGet = true, headersToExclude, fetchOptions = {}, } = params;
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
                'comp-filter': {
                    _attributes: {
                        name: 'VEVENT',
                    },
                    ...(timeRange
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
                        : {}),
                },
            },
        },
    ];
    const calendarObjectUrls = (objectUrls !== null && objectUrls !== void 0 ? objectUrls : 
    // fetch all objects of the calendar
    (await calendarQuery({
        url: calendar.url,
        props: {
            [`${exports.DAVNamespaceShort.DAV}:getetag`]: {
                ...(expand && timeRange
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
                    : {}),
            },
        },
        filters,
        depth: '1',
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    })).map((res) => { var _a; return (_a = res.href) !== null && _a !== void 0 ? _a : ''; }))
        .map((url) => (url.startsWith('http') || !url ? url : new URL(url, calendar.url).href)) // patch up to full url if url is not full
        .filter(urlFilter) // custom filter function on calendar objects
        .map((url) => new URL(url).pathname); // obtain pathname of the url
    let calendarObjectResults = [];
    if (calendarObjectUrls.length > 0) {
        if (!useMultiGet || expand) {
            calendarObjectResults = await calendarQuery({
                url: calendar.url,
                props: {
                    [`${exports.DAVNamespaceShort.DAV}:getetag`]: {},
                    [`${exports.DAVNamespaceShort.CALDAV}:calendar-data`]: {
                        ...(expand && timeRange
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
                            : {}),
                    },
                },
                filters,
                depth: '1',
                headers: excludeHeaders(headers, headersToExclude),
                fetchOptions,
            });
        }
        else {
            calendarObjectResults = await calendarMultiGet({
                url: calendar.url,
                props: {
                    [`${exports.DAVNamespaceShort.DAV}:getetag`]: {},
                    [`${exports.DAVNamespaceShort.CALDAV}:calendar-data`]: {
                        ...(expand && timeRange
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
                            : {}),
                    },
                },
                objectUrls: calendarObjectUrls,
                depth: '1',
                headers: excludeHeaders(headers, headersToExclude),
                fetchOptions,
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
};
const createCalendarObject = async (params) => {
    const { calendar, iCalString, filename, headers, headersToExclude, fetchOptions = {} } = params;
    return createObject({
        url: new URL(filename, calendar.url).href,
        data: iCalString,
        headers: excludeHeaders({
            'content-type': 'text/calendar; charset=utf-8',
            'If-None-Match': '*',
            ...headers,
        }, headersToExclude),
        fetchOptions,
    });
};
const updateCalendarObject = async (params) => {
    const { calendarObject, headers, headersToExclude, fetchOptions = {} } = params;
    return updateObject({
        url: calendarObject.url,
        data: calendarObject.data,
        etag: calendarObject.etag,
        headers: excludeHeaders({
            'content-type': 'text/calendar; charset=utf-8',
            ...headers,
        }, headersToExclude),
        fetchOptions,
    });
};
const deleteCalendarObject = async (params) => {
    const { calendarObject, headers, headersToExclude, fetchOptions = {} } = params;
    return deleteObject({
        url: calendarObject.url,
        etag: calendarObject.etag,
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    });
};
/**
 * Sync remote calendars to local
 */
const syncCalendars = async (params) => {
    var _a;
    const { oldCalendars, account, detailedResult, headers, headersToExclude, fetchOptions = {}, } = params;
    if (!account) {
        throw new Error('Must have account before syncCalendars');
    }
    const localCalendars = (_a = oldCalendars !== null && oldCalendars !== void 0 ? oldCalendars : account.calendars) !== null && _a !== void 0 ? _a : [];
    const remoteCalendars = await fetchCalendars({
        account,
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    });
    // no existing url
    const created = remoteCalendars.filter((rc) => localCalendars.every((lc) => !urlContains(lc.url, rc.url)));
    debug$2(`new calendars: ${created.map((cc) => cc.displayName)}`);
    // have same url, but syncToken/ctag different
    const updated = localCalendars.reduce((prev, curr) => {
        const found = remoteCalendars.find((rc) => urlContains(rc.url, curr.url));
        if (found &&
            ((found.syncToken && `${found.syncToken}` !== `${curr.syncToken}`) ||
                (found.ctag && `${found.ctag}` !== `${curr.ctag}`))) {
            return [...prev, found];
        }
        return prev;
    }, []);
    debug$2(`updated calendars: ${updated.map((cc) => cc.displayName)}`);
    const updatedWithObjects = await Promise.all(updated.map(async (u) => {
        const result = await smartCollectionSync({
            collection: { ...u, objectMultiGet: calendarMultiGet },
            method: 'webdav',
            headers: excludeHeaders(headers, headersToExclude),
            account,
            fetchOptions,
        });
        return result;
    }));
    // does not present in remote
    const deleted = localCalendars.filter((cal) => remoteCalendars.every((rc) => !urlContains(rc.url, cal.url)));
    debug$2(`deleted calendars: ${deleted.map((cc) => cc.displayName)}`);
    const unchanged = localCalendars.filter((cal) => remoteCalendars.some((rc) => urlContains(rc.url, cal.url) &&
        ((rc.syncToken && `${rc.syncToken}` !== `${cal.syncToken}`) ||
            (rc.ctag && `${rc.ctag}` !== `${cal.ctag}`))));
    // debug(`unchanged calendars: ${unchanged.map((cc) => cc.displayName)}`);
    return detailedResult
        ? {
            created,
            updated,
            deleted,
        }
        : [...unchanged, ...created, ...updatedWithObjects];
};
const freeBusyQuery = async (params) => {
    const { url, timeRange, depth, headers, headersToExclude, fetchOptions = {} } = params;
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
    const result = await collectionQuery({
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
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    });
    return result[0];
};

var calendar = /*#__PURE__*/Object.freeze({
    __proto__: null,
    calendarMultiGet: calendarMultiGet,
    calendarQuery: calendarQuery,
    createCalendarObject: createCalendarObject,
    deleteCalendarObject: deleteCalendarObject,
    fetchCalendarObjects: fetchCalendarObjects,
    fetchCalendarUserAddresses: fetchCalendarUserAddresses,
    fetchCalendars: fetchCalendars,
    freeBusyQuery: freeBusyQuery,
    makeCalendar: makeCalendar,
    syncCalendars: syncCalendars,
    updateCalendarObject: updateCalendarObject
});

const debug$1 = getLogger('tsdav:account');
const serviceDiscovery = async (params) => {
    var _a, _b;
    debug$1('Service discovery...');
    const { account, headers, headersToExclude, fetchOptions = {} } = params;
    const endpoint = new URL(account.serverUrl);
    const uri = new URL(`/.well-known/${account.accountType}`, endpoint);
    uri.protocol = (_a = endpoint.protocol) !== null && _a !== void 0 ? _a : 'http';
    try {
        const response = await crossFetch.fetch(uri.href, {
            headers: excludeHeaders(headers, headersToExclude),
            method: 'PROPFIND',
            redirect: 'manual',
            ...fetchOptions,
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
};
const fetchPrincipalUrl = async (params) => {
    var _a, _b, _c, _d, _e;
    const { account, headers, headersToExclude, fetchOptions = {} } = params;
    const requiredFields = ['rootUrl'];
    if (!hasFields(account, requiredFields)) {
        throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchPrincipalUrl`);
    }
    debug$1(`Fetching principal url from path ${account.rootUrl}`);
    const [response] = await propfind({
        url: account.rootUrl,
        props: {
            [`${exports.DAVNamespaceShort.DAV}:current-user-principal`]: {},
        },
        depth: '0',
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    });
    if (!response.ok) {
        debug$1(`Fetch principal url failed: ${response.statusText}`);
        if (response.status === 401) {
            throw new Error('Invalid credentials');
        }
    }
    debug$1(`Fetched principal url ${(_b = (_a = response.props) === null || _a === void 0 ? void 0 : _a.currentUserPrincipal) === null || _b === void 0 ? void 0 : _b.href}`);
    return new URL((_e = (_d = (_c = response.props) === null || _c === void 0 ? void 0 : _c.currentUserPrincipal) === null || _d === void 0 ? void 0 : _d.href) !== null && _e !== void 0 ? _e : '', account.rootUrl).href;
};
const fetchHomeUrl = async (params) => {
    var _a, _b;
    const { account, headers, headersToExclude, fetchOptions = {} } = params;
    const requiredFields = ['principalUrl', 'rootUrl'];
    if (!hasFields(account, requiredFields)) {
        throw new Error(`account must have ${findMissingFieldNames(account, requiredFields)} before fetchHomeUrl`);
    }
    debug$1(`Fetch home url from ${account.principalUrl}`);
    const responses = await propfind({
        url: account.principalUrl,
        props: account.accountType === 'caldav'
            ? { [`${exports.DAVNamespaceShort.CALDAV}:calendar-home-set`]: {} }
            : { [`${exports.DAVNamespaceShort.CARDDAV}:addressbook-home-set`]: {} },
        depth: '0',
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    });
    const matched = responses.find((r) => urlContains(account.principalUrl, r.href));
    if (!matched || !matched.ok) {
        debug$1(`Fetch home url failed with status ${matched === null || matched === void 0 ? void 0 : matched.statusText} and error ${JSON.stringify(responses.map((r) => r.error))}`);
        throw new Error('cannot find homeUrl');
    }
    const result = new URL(account.accountType === 'caldav'
        ? (_a = matched === null || matched === void 0 ? void 0 : matched.props) === null || _a === void 0 ? void 0 : _a.calendarHomeSet.href
        : (_b = matched === null || matched === void 0 ? void 0 : matched.props) === null || _b === void 0 ? void 0 : _b.addressbookHomeSet.href, account.rootUrl).href;
    debug$1(`Fetched home url ${result}`);
    return result;
};
const createAccount = async (params) => {
    const { account, headers, loadCollections = false, loadObjects = false, headersToExclude, fetchOptions = {}, } = params;
    const newAccount = { ...account };
    newAccount.rootUrl = await serviceDiscovery({
        account,
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    });
    newAccount.principalUrl = await fetchPrincipalUrl({
        account: newAccount,
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    });
    newAccount.homeUrl = await fetchHomeUrl({
        account: newAccount,
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
    });
    // to load objects you must first load collections
    if (loadCollections || loadObjects) {
        if (account.accountType === 'caldav') {
            newAccount.calendars = await fetchCalendars({
                headers: excludeHeaders(headers, headersToExclude),
                account: newAccount,
                fetchOptions,
            });
        }
        else if (account.accountType === 'carddav') {
            newAccount.addressBooks = await fetchAddressBooks({
                headers: excludeHeaders(headers, headersToExclude),
                account: newAccount,
                fetchOptions,
            });
        }
    }
    if (loadObjects) {
        if (account.accountType === 'caldav' && newAccount.calendars) {
            newAccount.calendars = await Promise.all(newAccount.calendars.map(async (cal) => ({
                ...cal,
                objects: await fetchCalendarObjects({
                    calendar: cal,
                    headers: excludeHeaders(headers, headersToExclude),
                    fetchOptions,
                }),
            })));
        }
        else if (account.accountType === 'carddav' && newAccount.addressBooks) {
            newAccount.addressBooks = await Promise.all(newAccount.addressBooks.map(async (addr) => ({
                ...addr,
                objects: await fetchVCards({
                    addressBook: addr,
                    headers: excludeHeaders(headers, headersToExclude),
                    fetchOptions,
                }),
            })));
        }
    }
    return newAccount;
};

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
    return fn({ ...params, ...args[0] });
};
const getBasicAuthHeaders = (credentials) => {
    debug(`Basic auth token generated: ${base64.encode(`${credentials.username}:${credentials.password}`)}`);
    return {
        authorization: `Basic ${base64.encode(`${credentials.username}:${credentials.password}`)}`,
    };
};
const fetchOauthTokens = async (credentials, fetchOptions) => {
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
    const response = await crossFetch.fetch(credentials.tokenUrl, {
        method: 'POST',
        body: param.toString(),
        headers: {
            'content-length': `${param.toString().length}`,
            'content-type': 'application/x-www-form-urlencoded',
        },
        ...(fetchOptions !== null && fetchOptions !== void 0 ? fetchOptions : {}),
    });
    if (response.ok) {
        const tokens = await response.json();
        return tokens;
    }
    debug(`Fetch Oauth tokens failed: ${await response.text()}`);
    return {};
};
const refreshAccessToken = async (credentials, fetchOptions) => {
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
    const response = await crossFetch.fetch(credentials.tokenUrl, {
        method: 'POST',
        body: param.toString(),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        ...(fetchOptions !== null && fetchOptions !== void 0 ? fetchOptions : {}),
    });
    if (response.ok) {
        const tokens = await response.json();
        return tokens;
    }
    debug(`Refresh access token failed: ${await response.text()}`);
    return {};
};
const getOauthHeaders = async (credentials, fetchOptions) => {
    var _a;
    debug('Fetching oauth headers');
    let tokens = {};
    if (!credentials.refreshToken) {
        // No refresh token, fetch new tokens
        tokens = await fetchOauthTokens(credentials, fetchOptions);
    }
    else if ((credentials.refreshToken && !credentials.accessToken) ||
        Date.now() > ((_a = credentials.expiration) !== null && _a !== void 0 ? _a : 0)) {
        // have refresh token, but no accessToken, fetch access token only
        // or have both, but accessToken was expired
        tokens = await refreshAccessToken(credentials, fetchOptions);
    }
    // now we should have valid access token
    debug(`Oauth tokens fetched: ${tokens.access_token}`);
    return {
        tokens,
        headers: {
            authorization: `Bearer ${tokens.access_token}`,
        },
    };
};

var authHelpers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    defaultParam: defaultParam,
    fetchOauthTokens: fetchOauthTokens,
    getBasicAuthHeaders: getBasicAuthHeaders,
    getOauthHeaders: getOauthHeaders,
    refreshAccessToken: refreshAccessToken
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createDAVClient = async (params) => {
    var _a;
    const { serverUrl, credentials, authMethod, defaultAccountType, authFunction } = params;
    let authHeaders = {};
    switch (authMethod) {
        case 'Basic':
            authHeaders = getBasicAuthHeaders(credentials);
            break;
        case 'Oauth':
            authHeaders = (await getOauthHeaders(credentials)).headers;
            break;
        case 'Digest':
            authHeaders = {
                Authorization: `Digest ${credentials.digestString}`,
            };
            break;
        case 'Custom':
            authHeaders = (_a = (await (authFunction === null || authFunction === void 0 ? void 0 : authFunction(credentials)))) !== null && _a !== void 0 ? _a : {};
            break;
        default:
            throw new Error('Invalid auth method');
    }
    const defaultAccount = defaultAccountType
        ? await createAccount({
            account: { serverUrl, credentials, accountType: defaultAccountType },
            headers: authHeaders,
        })
        : undefined;
    const davRequest$1 = async (params0) => {
        const { init, ...rest } = params0;
        const { headers, ...restInit } = init;
        return davRequest({
            ...rest,
            init: {
                ...restInit,
                headers: {
                    ...authHeaders,
                    ...headers,
                },
            },
        });
    };
    const createObject$1 = defaultParam(createObject, {
        url: serverUrl,
        headers: authHeaders,
    });
    const updateObject$1 = defaultParam(updateObject, { headers: authHeaders, url: serverUrl });
    const deleteObject$1 = defaultParam(deleteObject, { headers: authHeaders, url: serverUrl });
    const propfind$1 = defaultParam(propfind, { headers: authHeaders });
    // account
    const createAccount$1 = async (params0) => {
        const { account, headers, loadCollections, loadObjects } = params0;
        return createAccount({
            account: { serverUrl, credentials, ...account },
            headers: { ...authHeaders, ...headers },
            loadCollections,
            loadObjects,
        });
    };
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
    const fetchCalendarUserAddresses$1 = defaultParam(fetchCalendarUserAddresses, {
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
        fetchCalendarUserAddresses: fetchCalendarUserAddresses$1,
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
};
class DAVClient {
    constructor(params) {
        var _a, _b, _c;
        this.serverUrl = params.serverUrl;
        this.credentials = params.credentials;
        this.authMethod = (_a = params.authMethod) !== null && _a !== void 0 ? _a : 'Basic';
        this.accountType = (_b = params.defaultAccountType) !== null && _b !== void 0 ? _b : 'caldav';
        this.authFunction = params.authFunction;
        this.fetchOptions = (_c = params.fetchOptions) !== null && _c !== void 0 ? _c : {};
    }
    async login() {
        var _a;
        switch (this.authMethod) {
            case 'Basic':
                this.authHeaders = getBasicAuthHeaders(this.credentials);
                break;
            case 'Oauth':
                this.authHeaders = (await getOauthHeaders(this.credentials, this.fetchOptions)).headers;
                break;
            case 'Digest':
                this.authHeaders = {
                    Authorization: `Digest ${this.credentials.digestString}`,
                };
                break;
            case 'Custom':
                this.authHeaders = await ((_a = this.authFunction) === null || _a === void 0 ? void 0 : _a.call(this, this.credentials));
                break;
            default:
                throw new Error('Invalid auth method');
        }
        this.account = this.accountType
            ? await createAccount({
                account: {
                    serverUrl: this.serverUrl,
                    credentials: this.credentials,
                    accountType: this.accountType,
                },
                headers: this.authHeaders,
                fetchOptions: this.fetchOptions,
            })
            : undefined;
    }
    async davRequest(params0) {
        const { init, ...rest } = params0;
        const { headers, ...restInit } = init;
        return davRequest({
            ...rest,
            init: {
                ...restInit,
                headers: {
                    ...this.authHeaders,
                    ...headers,
                },
            },
            fetchOptions: this.fetchOptions,
        });
    }
    async createObject(...params) {
        return defaultParam(createObject, {
            url: this.serverUrl,
            headers: this.authHeaders,
            fetchOptions: this.fetchOptions,
        })(params[0]);
    }
    async updateObject(...params) {
        return defaultParam(updateObject, {
            url: this.serverUrl,
            headers: this.authHeaders,
            fetchOptions: this.fetchOptions,
        })(params[0]);
    }
    async deleteObject(...params) {
        return defaultParam(deleteObject, {
            url: this.serverUrl,
            headers: this.authHeaders,
            fetchOptions: this.fetchOptions,
        })(params[0]);
    }
    async propfind(...params) {
        return defaultParam(propfind, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async createAccount(params0) {
        const { account, headers, loadCollections, loadObjects, fetchOptions } = params0;
        return createAccount({
            account: { serverUrl: this.serverUrl, credentials: this.credentials, ...account },
            headers: { ...this.authHeaders, ...headers },
            loadCollections,
            loadObjects,
            fetchOptions: fetchOptions !== null && fetchOptions !== void 0 ? fetchOptions : this.fetchOptions,
        });
    }
    async collectionQuery(...params) {
        return defaultParam(collectionQuery, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async makeCollection(...params) {
        return defaultParam(makeCollection, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async syncCollection(...params) {
        return defaultParam(syncCollection, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async supportedReportSet(...params) {
        return defaultParam(supportedReportSet, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async isCollectionDirty(...params) {
        return defaultParam(isCollectionDirty, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async smartCollectionSync(...params) {
        return defaultParam(smartCollectionSync, {
            headers: this.authHeaders,
            fetchOptions: this.fetchOptions,
            account: this.account,
        })(params[0]);
    }
    async calendarQuery(...params) {
        return defaultParam(calendarQuery, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async makeCalendar(...params) {
        return defaultParam(makeCalendar, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async calendarMultiGet(...params) {
        return defaultParam(calendarMultiGet, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async fetchCalendars(...params) {
        return defaultParam(fetchCalendars, { headers: this.authHeaders, account: this.account, fetchOptions: this.fetchOptions })(params === null || params === void 0 ? void 0 : params[0]);
    }
    async fetchCalendarUserAddresses(...params) {
        return defaultParam(fetchCalendarUserAddresses, { headers: this.authHeaders, account: this.account, fetchOptions: this.fetchOptions })(params === null || params === void 0 ? void 0 : params[0]);
    }
    async fetchCalendarObjects(...params) {
        return defaultParam(fetchCalendarObjects, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async createCalendarObject(...params) {
        return defaultParam(createCalendarObject, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async updateCalendarObject(...params) {
        return defaultParam(updateCalendarObject, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async deleteCalendarObject(...params) {
        return defaultParam(deleteCalendarObject, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async syncCalendars(...params) {
        return defaultParam(syncCalendars, {
            headers: this.authHeaders,
            account: this.account,
            fetchOptions: this.fetchOptions
        })(params[0]);
    }
    async addressBookQuery(...params) {
        return defaultParam(addressBookQuery, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async addressBookMultiGet(...params) {
        return defaultParam(addressBookMultiGet, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async fetchAddressBooks(...params) {
        return defaultParam(fetchAddressBooks, { headers: this.authHeaders, account: this.account, fetchOptions: this.fetchOptions })(params === null || params === void 0 ? void 0 : params[0]);
    }
    async fetchVCards(...params) {
        return defaultParam(fetchVCards, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async createVCard(...params) {
        return defaultParam(createVCard, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async updateVCard(...params) {
        return defaultParam(updateVCard, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
    async deleteVCard(...params) {
        return defaultParam(deleteVCard, { headers: this.authHeaders, fetchOptions: this.fetchOptions })(params[0]);
    }
}

var client = /*#__PURE__*/Object.freeze({
    __proto__: null,
    DAVClient: DAVClient,
    createDAVClient: createDAVClient
});

var index = {
    DAVNamespace: exports.DAVNamespace,
    DAVNamespaceShort: exports.DAVNamespaceShort,
    DAVAttributeMap,
    ...client,
    ...request,
    ...collection,
    ...account,
    ...addressBook,
    ...calendar,
    ...authHelpers,
    ...requestHelpers,
};

exports.DAVAttributeMap = DAVAttributeMap;
exports.DAVClient = DAVClient;
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
exports.default = index;
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
