```ts
export type DAVFilter = {
  type: string;
  attributes: { [key: string]: string };
  value?: string | number;
  children?: DAVFilter[];
};
```