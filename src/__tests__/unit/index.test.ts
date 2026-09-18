import { describe, it, expect } from 'vitest';
import * as tsdav from '../../index';

describe('tsdav public exports', () => {
  it('should export all public client, request, and collection functions', () => {
    expect(typeof tsdav.DAVClient).toBe('function');
    expect(typeof tsdav.createDAVClient).toBe('function');
    expect(typeof tsdav.davRequest).toBe('function');
    expect(typeof tsdav.propfind).toBe('function');
    expect(typeof tsdav.createObject).toBe('function');
    expect(typeof tsdav.updateObject).toBe('function');
    expect(typeof tsdav.deleteObject).toBe('function');
    expect(typeof tsdav.collectionQuery).toBe('function');
    expect(typeof tsdav.supportedReportSet).toBe('function');
    expect(typeof tsdav.isCollectionDirty).toBe('function');
    expect(typeof tsdav.syncCollection).toBe('function');
    expect(typeof tsdav.smartCollectionSync).toBe('function');
    expect(typeof tsdav.smartCollectionSyncDetailed).toBe('function');
  });

  it('should export all public account functions including discovery', () => {
    expect(typeof tsdav.createAccount).toBe('function');
    expect(typeof tsdav.serviceDiscovery).toBe('function');
    expect(typeof tsdav.fetchPrincipalUrl).toBe('function');
    expect(typeof tsdav.fetchHomeUrl).toBe('function');
  });

  it('should export all public calendar and addressbook functions', () => {
    expect(typeof tsdav.calendarQuery).toBe('function');
    expect(typeof tsdav.calendarMultiGet).toBe('function');
    expect(typeof tsdav.makeCalendar).toBe('function');
    expect(typeof tsdav.fetchCalendars).toBe('function');
    expect(typeof tsdav.fetchCalendarUserAddresses).toBe('function');
    expect(typeof tsdav.fetchCalendarObjects).toBe('function');
    expect(typeof tsdav.createCalendarObject).toBe('function');
    expect(typeof tsdav.updateCalendarObject).toBe('function');
    expect(typeof tsdav.deleteCalendarObject).toBe('function');
    expect(typeof tsdav.syncCalendars).toBe('function');
    expect(typeof tsdav.syncCalendarsDetailed).toBe('function');
    expect(typeof tsdav.freeBusyQuery).toBe('function');

    expect(typeof tsdav.addressBookQuery).toBe('function');
    expect(typeof tsdav.addressBookMultiGet).toBe('function');
    expect(typeof tsdav.fetchAddressBooks).toBe('function');
    expect(typeof tsdav.fetchVCards).toBe('function');
    expect(typeof tsdav.createVCard).toBe('function');
    expect(typeof tsdav.updateVCard).toBe('function');
    expect(typeof tsdav.deleteVCard).toBe('function');
  });

  it('should export auth and request helpers', () => {
    expect(typeof tsdav.getBasicAuthHeaders).toBe('function');
    expect(typeof tsdav.getBearerAuthHeaders).toBe('function');
    expect(typeof tsdav.getOauthHeaders).toBe('function');
    expect(typeof tsdav.fetchOauthTokens).toBe('function');
    expect(typeof tsdav.refreshAccessToken).toBe('function');

    expect(typeof tsdav.urlContains).toBe('function');
    expect(typeof tsdav.urlEquals).toBe('function');
    expect(typeof tsdav.urlMatches).toBe('function');
    expect(typeof tsdav.ensureTrailingSlash).toBe('function');
    expect(typeof tsdav.getDAVAttribute).toBe('function');
    expect(typeof tsdav.cleanupFalsy).toBe('function');
    expect(typeof tsdav.excludeHeaders).toBe('function');
    expect(typeof tsdav.mergeHeaders).toBe('function');
  });

  it('should export constants', () => {
    expect(tsdav.DAVNamespace).toBeDefined();
    expect(tsdav.DAVAttributeMap).toBeDefined();
    expect(tsdav.DAVNamespaceShort).toBeDefined();
    expect(tsdav.ICALObjects).toBeDefined();
    expect(tsdav.ICALObjects.VEVENT).toBe('VEVENT');
  });
});
