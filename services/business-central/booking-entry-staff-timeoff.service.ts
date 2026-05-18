import { bcClient } from "./client";

class EntryStaffTimeoff {
  async deleteBookingEntryStaffTimeOff(
    bookingEntryNo: string
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_DeleteBookingEntryStaffTimeOff",
      {
        _BookingEntryNo: bookingEntryNo,
      }
    );
  }

  async createBookingEntryStaffTimeOff(
    bookingSetupCode: string,
    staffCode: string,
    staffName: string,
    timeOffStartDate: string,
    timeOffEndDate: string,
    timeOffStartTime: string,
    timeOffEndTime: string,
    wholeDay: string,
    timeOffReason: string
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_CreateBookingEntryStaffTimeOff",
      {
        _BookingSetupCode: bookingSetupCode,
        _StaffCode: staffCode,
        _StaffName: staffName,
        _TimeOffStartDate: timeOffStartDate,
        _TimeOffEndDate: timeOffEndDate,
        _TimeOffStartTime: timeOffStartTime,
        _TimeOffEndTime: timeOffEndTime,
        _WholeDay: wholeDay,
        _TimeOffReason: timeOffReason
      }
    );
  }

  async updateBookingEntryStaffTimeOff(
    bookingSetupCode: string,
    staffCode: string,
    staffName: string,
    timeOffDate: string,
    timeOffStartTime: string,
    timeOffEndTime: string,
    wholeDay: string,
    timeOffReason: string,
    bookingEntryNo: string

  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_UpdateBookingEntryStaffTimeOff",
      {
        _BookingSetupCode: bookingSetupCode,
        _StaffCode: staffCode,
        _StaffName: staffName,
        _TimeOffDate: timeOffDate,
        _TimeOffStartTime: timeOffStartTime,
        _TimeOffEndTime: timeOffEndTime,
        _WholeDay: wholeDay,
        _TimeOffReason: timeOffReason,
        _BookingEntryNo: bookingEntryNo
      }
    );
  }
}

export const entryStaffTimeoff = new EntryStaffTimeoff();