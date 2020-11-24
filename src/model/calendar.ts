import { DAVCollection } from './davCollection';

export class Calendar extends DAVCollection {
  components: any;

  timezone: string;

  constructor(options: Calendar) {
    super(options);
    if (options) {
      this.components = options.components;
      this.timezone = options.timezone;
    }
  }
}
