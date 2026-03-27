import { BookingEntry } from "./bookingEntry";
export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    description?: string;
    location?: string;
    staff: string;
    staffCode: string;
    staffName: string;
    service: string;
    customer: string;
    status: string;
    branch: string;
    room: string;
    timeOff: boolean;
    rawData?: BookingEntry;
  };
  color: string;
  textColor: string;
};
