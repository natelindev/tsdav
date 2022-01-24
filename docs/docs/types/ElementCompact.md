```ts
export interface ElementCompact {
  [key: string]: any;
  _declaration?: {
    _attributes?: DeclarationAttributes;
  };
  _instruction?: {
    [key: string]: string;
  };
  _attributes?: Attributes;
  _cdata?: string;
  _doctype?: string;
  _comment?: string;
  _text?: string | number;
}
```

[xml-js defined](https://github.com/nashwaan/xml-js/blob/f0376f265c4f299100fb4766828ebf066a0edeec/types/index.d.ts#L11)
compact js object representation of xml elements.

you can use this [helper](../helper.mdx) to help converting xml between js objects.
