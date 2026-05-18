import { bcClient } from "./client";

class BookingBusinessHoursService {
  async deleteBookingBusinessHour(
    bookingSetupCode: string,
    bookingBusinessHoursDayOfWeek: string,
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_DeleteBookingBusinessHour",
      {
        _BookingSetupCode: bookingSetupCode,
        _BookingBusinessHoursDayOfWeek: bookingBusinessHoursDayOfWeek
      }
    );
  }
  async getBookingBusinessHour(
    bookingSetupCode: string
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_GetBookingBusinessHours",
      {
        _BookingSetupCode: bookingSetupCode
      }
    );
  }

  async createBookingBusinessHour(
    bookingSetupCode: string,
    bookingBusinessHoursDayOfWeek: string,
    bookingBusinessHoursStartTime: string,
    bookingBusinessHoursEndTime: string,
    bookingBusinessHoursTimeIncrement: string,
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_CreateBookingBusinessHour",
      {
        _BookingSetupCode: bookingSetupCode,
        _BookingBusinessHoursDayOfWeek: bookingBusinessHoursDayOfWeek,
        _BookingBusinessHoursStartTime: bookingBusinessHoursStartTime,
        _BookingBusinessHoursEndTime: bookingBusinessHoursEndTime,
        _BookingBusinessHoursTimeIncrement: bookingBusinessHoursTimeIncrement
      }
    );
  }

  async updateBookingBusinessHour(
    bookingSetupCode: string,
    bookingBusinessHoursDayOfWeek: string,
    bookingBusinessHoursStartTime: string,
    bookingBusinessHoursEndTime: string,
    bookingBusinessHoursTimeIncrement: string,
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_UpdateBookingBusinessHour",
      {
        _BookingSetupCode: bookingSetupCode,
        _BookingBusinessHoursDayOfWeek: bookingBusinessHoursDayOfWeek,
        _BookingBusinessHoursStartTime: bookingBusinessHoursStartTime,
        _BookingBusinessHoursEndTime: bookingBusinessHoursEndTime,
        _BookingBusinessHoursTimeIncrement: bookingBusinessHoursTimeIncrement
      }
    );
  }
}

export const bookingBusinessHoursService = new BookingBusinessHoursService();