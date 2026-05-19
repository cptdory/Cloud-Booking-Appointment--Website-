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

  async getBookingSetupList() {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_GetBookingSetups",
      {}
    );
  }
}

export const bookingBranchSetupService = new BookingBranchSetupService();