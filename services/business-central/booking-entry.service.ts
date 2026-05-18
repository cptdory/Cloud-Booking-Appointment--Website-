import { bcClient } from "./client";

class BookingEntryService {
  async getBookingEntries(
    bookingSetupCode: string,
    dateFrom: string,
    dateTo: string,
    status: string

  ) {
    return bcClient.post<{value:string}>(
      "BookingAppointment_GetBookingEntries",
      {
        _BookingSetupCode: bookingSetupCode,
        _DateFrom: dateFrom,
        _DateTo: dateTo,
        _Status: status
      }
    );
  }

  async getBookingEntry(
    bookingEntryNo: string
  ) {
    return bcClient.post<{value:string}>(
      "BookingAppointment_GetBookingEntry",
      {
        _BookingEntryNo: bookingEntryNo,
      }
    );
  }

  async getCustomerBookingEntries(
    customerNo: string
  ) {
    return bcClient.post<{value:string}>(
      "BookingAppointment_GetCustomerBookingEntries",
      {
        _CustomerNo: customerNo,
      }
    );
  }

  async updateBookingEntryStatus(
    bookingEntryNo: string,
    bookingStatus: string
  ) {
    return bcClient.post<{value:string}>(
      "BookingAppointment_UpdateBookingEntryStatus",
      {
        _EntryNo: bookingEntryNo,
        _BookingStatus: bookingStatus,
      }
    );
  }
}

export const bookingEntryService = new BookingEntryService();