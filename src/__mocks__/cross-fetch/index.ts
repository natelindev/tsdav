import { fetch as realFetch, Headers } from 'cross-fetch';
import { createHash } from 'crypto';
import fs from 'fs';

const dataPath = `${__dirname}/../../__tests__/integration/data/networkRequestData.json`;
type StoredValue = {
  readonly headers: Record<string, string>;
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly text: string;
};

const appendJSON = async (filepath: string, keyData: string, valueData: string) => {
  // create if not exist
  if (!fs.existsSync(filepath)) {
    await fs.promises.writeFile(filepath, '{}');
  }

  // read from json file
  const store: Record<string, string> = JSON.parse(await fs.promises.readFile(filepath, 'utf8'));
  // hash keyData
  const hash = createHash('sha256');
  const key = hash.update(keyData).digest('base64');
  const value = Buffer.from(valueData).toString('base64');

  // store inside json
  store[key] = value;
  // write back to json
  await fs.promises.writeFile(filepath, JSON.stringify(store));
};

export const fetch = async (
  url: string,
  init: { method: string; body: string; headers: Record<string, string> },
) => {
  if (process.env.MOCK_FETCH === 'true' && fs.existsSync(dataPath)) {
    const data = JSON.parse(await fs.promises.readFile(dataPath, 'utf8'));
    const hash = createHash('sha256');
    const key = hash
      .update(JSON.stringify({ url, init: { method: init.method, body: init.body } }))
      .digest('base64');
    if (!(key in data)) {
      throw new Error(`No mock data for network request ${url} with method ${init.method}`);
    }
    // parse base64
    const value = Buffer.from(data[key], 'base64').toString();
    const valueData: StoredValue = JSON.parse(value);
    return {
      ok: valueData.ok,
      status: valueData.status,
      statusText: valueData.statusText,
      headers: new Headers(valueData.headers),
      url: valueData.url,
      text: async () => valueData.text,
      json: async () => JSON.parse(valueData.text),
    };
  }
  const response = await realFetch(url, init);
  const text = await response?.text();

  if (process.env.RECORD_NETWORK_REQUESTS === 'true') {
    await appendJSON(
      dataPath,
      JSON.stringify({ url, init: { method: init.method, body: init.body } }),
      JSON.stringify(<StoredValue>{
        ok: response.ok,
        status: response?.status,
        statusText: response?.statusText,
        headers: Object.fromEntries(response?.headers.entries()),
        url: response?.url,
        text,
      }),
    );
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    url: response.url,
    text: async () => text,
    json: async () => JSON.parse(text),
  };
};
