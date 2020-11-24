import { DAVCollection } from './davCollection';
import { DAVObject } from './davObject';

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

export class CalendarObject extends DAVObject {
  calendar: any;
  calendarData: any;
  constructor(options: CalendarObject) {
    super(options);
    if (options) {
      this.calendar = options.calendar;
      this.calendarData = options.calendarData;
    }
  }
}
