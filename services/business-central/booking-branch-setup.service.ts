import { bcClient } from "./client";

class BookingBranchSetupService {
  async getBookingSetup(
    bookingSetupCode: string
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_GetBookingSetup",
      {
        _Code: bookingSetupCode,
      }
    );
  }
  async updateBookingSetup(
    bookingSetupCode: string,
    description: string,
    locationCode: string,
    timeIncrement: number,
    closingAllowableTime: number,
    timeSlotBookableCount?: number,
    currencyCode?: string,
    currencySymbol?: string
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_UpdateBookingSetup",
      {
        _Code: bookingSetupCode,
        _Description: description,
        _Address: locationCode,
        _TimeIncrement: timeIncrement,
        _ClosingAllowableTime: closingAllowableTime,
        _TimeSlotBookableCount: timeSlotBookableCount,
        _CurrencyCode: currencyCode,
        _CurrencySymbol: currencySymbol
      }
    );
  }

  async getBookingSetupList() {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_GetBookingSetups",
      {}
    );
  }
}

export const bookingBranchSetupService = new BookingBranchSetupService();