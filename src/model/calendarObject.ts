import { Calendar } from './calendar';
import { DAVObject } from './davObject';

export class CalendarObject extends DAVObject {
  calendar: Calendar;

  calendarData: any;

  constructor(options: CalendarObject) {
    super(options);
    if (options) {
      this.calendar = options.calendar;
      this.calendarData = options.calendarData;
    }
  }
}
