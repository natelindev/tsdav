import getLogger from 'debug';

import { DAVClient } from './client';
import { DAVCredentials } from './model';

const debug = getLogger('tsdav:test');

(async () => {
  const credentials = new DAVCredentials({ username: 'test', password: 'test' });
  const client = new DAVClient({ url: 'http://localhost:5232', credentials });
  await client.basicAuth();
  const result = await client.createAccount({
    accountType: 'caldav',
    server: client.url,
    rootUrl: 'http://sadf:adsf@localhost:5232/',
  });
  debug(result);
})();
