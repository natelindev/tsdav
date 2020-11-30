import getLogger from 'debug';

const debug = getLogger('tsdav:test');

// (async () => {
//   const credentials = new DAVCredentials({
//     clientId: '',
//     clientSecret: '',
//     tokenUrl: '',
//     authorizationCode: '',
//   });
//   const client = new DAVClient({
//     url: '',
//     credentials,
//   });
//   await client.oauth();
//   const account = await client.createAccount({
//     accountType: 'caldav',
//     credentials,
//     server: client.url,
//   });
//   const calendars = await client.fetchCalendars(account);
//   debug(calendars);
// })();
