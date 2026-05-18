import { bcClient } from "./client";

class BookingUserService {
  async updateBookingUserAuthPassword(
      bookingSetupCode: string,
      emailAddress: string,
      password: string,
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_UpdateBookingUserPassword",
      {
        _BookingSetupCode: bookingSetupCode,
        _EmailAddress: emailAddress,
        _Password: password,
      }
    );
  }
}

export const bookingUserService = new BookingUserService();