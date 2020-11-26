import { DAVCalendar } from './davCalendar';
import { DAVObject } from './davObject';

export class DAVCalendarObject extends DAVObject {
  calendar?: DAVCalendar;

  calendarData?: any;

  constructor(options?: DAVCalendarObject) {
    super(options);
    if (options) {
      this.calendar = options.calendar;
      this.calendarData = options.calendarData;
    }
  }
}
