import { urlIncludes } from '../util/urlIncludes';
import { DAVNamespace } from '../consts';
import { propfind } from '../request';
import { DAVObject } from './davObject';

export class DAVCollection {
  data: any;

  objects: DAVObject[];

  account?: string;

  ctag?: string;

  description?: string;

  displayName?: string;

  reports?: string;

  resourcetype?: any;

  syncToken?: string;

  url?: string;

  webdavSync?: () => Promise<void>;

  basicSync?: () => Promise<void>;

  constructor(options: DAVCollection) {
    if (options) {
      this.data = options.data;
      this.objects = options.objects;
      this.account = options.account;
      this.ctag = options.ctag;
      this.description = options.description;
      this.displayName = options.displayName;
      this.reports = options.reports;
      this.resourcetype = options.resourcetype;
      this.syncToken = options.syncToken;
      this.url = options.url;
    }
  }

  async supportedReportSet(): Promise<boolean> {
    const res = await propfind(
      this.url,
      [{ name: 'supported-report-set', namespace: DAVNamespace.DAV }],
      { depth: '1' }
    );
    return res[0]?.props?.supportedReportSet.value;
  }

  async isCollectionDirty(): Promise<boolean> {
    if (!this.ctag) {
      return false;
    }
    const responses = await propfind(
      this.url,
      [{ name: 'getctag', namespace: DAVNamespace.CALENDAR_SERVER }],
      {
        depth: '0',
      }
    );

    const res = responses.filter((r) => urlIncludes(this.url, r.href))[0];
    if (!res) {
      throw new Error('Collection does not exist on server');
    }

    return this.ctag !== res.props.getctag.value;
  }

  async sync(method: 'basic' | 'webdav'): Promise<void> {
    const syncMethod = method ?? this.reports?.includes('syncCollection') ? 'webdav' : 'basic';
    if (syncMethod === 'webdav') {
      return this.webdavSync();
    }
    return this.basicSync();
  }
}
