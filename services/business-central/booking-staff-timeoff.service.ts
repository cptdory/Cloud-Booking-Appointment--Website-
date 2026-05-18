import { bcClient } from "./client";

class StaffTimeoff {
  async createBookingStaffTimeoff(
    bookingSetupCode: string,
    bookingParameterId: string,
    bookingParameterValueId: string,
    staffCode: string,
    staffName: string,
    day: string,
    fromTime: string,
    toTime: string,
    wholeDay: string
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_CreateBookingStaffTimeOff",
      {
        _BookingSetupCode: bookingSetupCode,
        _BookingParameterId: bookingParameterId,
        _BookingParameterValueId: bookingParameterValueId,
        _StaffCode: staffCode,
        _StaffName: staffName,
        _Day: day,
        _FromTime: fromTime,
        _ToTime: toTime,
        _WholeDay: wholeDay,
      }
    );
  }
  async updateBookingStaffTimeoff(
    bookingSetupCode: string,
    bookingParameterId: string,
    bookingParameterValueId: string,
    staffCode: string,
    staffName: string,
    day: string,
    fromTime: string,
    toTime: string,
    wholeDay: string
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_UpdateBookingStaffTimeOff",
      {
        _BookingSetupCode: bookingSetupCode,
        _BookingParameterId: bookingParameterId,
        _BookingParameterValueId: bookingParameterValueId,
        _StaffCode: staffCode,
        _StaffName: staffName,
        _Day: day,
        _FromTime: fromTime,
        _ToTime: toTime,
        _WholeDay: wholeDay,
      }
    );
  }
  async deleteBookingStaffTimeoff(
    bookingSetupCode: string,
    bookingParameterId: string,
    bookingParameterValueId: string,
    day: string,
    fromTime: string
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_DeleteBookingStaffTimeOff",
      {
        _BookingSetupCode: bookingSetupCode,
        _BookingParameterId: bookingParameterId,
        _BookingParameterValueId: bookingParameterValueId,
        _Day: day,
        _FromTime: fromTime,
      }
    );
  }
  async getBookingStaffTimeoff(
    bookingSetupCode: string,
    bookingParameterId: string,
    bookingParameterValueId: string
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_GetBookingStaffTimeOff",
      {
        _BookingSetupCode: bookingSetupCode,
        _BookingParameterId: bookingParameterId,
        _BookingParameterValueId: bookingParameterValueId
      }
    );
  }
}

export const staffTimeoff = new StaffTimeoff();