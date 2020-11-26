import { DAVCollection } from './davCollection';

export class DAVCalendar extends DAVCollection {
  components?: any;

  timezone?: string;

  constructor(options?: DAVCalendar) {
    super(options);
    if (options) {
      this.components = options.components;
      this.timezone = options.timezone;
    }
  }
}
