export class DAVObject {
  data: any;

  etag: string;

  url: string;

  constructor(options?: DAVObject) {
    if (options) {
      this.data = options.data;
      this.data = options.etag;
      this.data = options.url;
    }
  }
}
