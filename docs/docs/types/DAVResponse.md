```ts
export type DAVResponse = {
  raw?: any;
  href?: string;
  status: number;
  statusText: string;
  ok: boolean;
  error?: { [key: string]: any };
  responsedescription?: string;
  props?: { [key: string]: { status: number; statusText: string; ok: boolean; value: any } | any };
};
```