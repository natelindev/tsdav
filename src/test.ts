import getLogger from 'debug';
import { encode } from 'base-64';
import { davRequest } from './request';

const debug = getLogger('tsdav:test');

(async () => {
  const result = await davRequest('http://localhost:5232/', {
    method: 'PROPFIND',
    headers: {
      Authorization: `Basic ${encode(`test:test`)}`,
    },
    body: {
      propertyupdate: {
        set: {
          prop: {
            authors: {
              Author: ['Jim Whitehead', 'Roy Fielding'],
            },
          },
        },
        remove: {
          prop: {
            'Copyright-Owner': {},
          },
        },
      },
    },
  });
  debug(result);
})();
