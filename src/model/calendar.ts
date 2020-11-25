import getLogger from 'debug';
import { DAVCollection } from './davCollection';

const debug = getLogger('tsdav:calendar');

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
