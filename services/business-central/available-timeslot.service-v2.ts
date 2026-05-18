import { bcClient } from "./client";

class AvailableTimeslotServiceV2 {
  async getAvailableTimeslotV2(
    branchCode: string,
    bookingDate: string,
    serviceId: string,
    staffId: string
  ) {
    return bcClient.post<{value: string}>(
      "BookingAppointment_GetAvailableTimeSlotv2",
      {
        _BranchCode:branchCode,
        _BookingDate:bookingDate,
        _ServiceId:serviceId,
        _StaffId:staffId,
      }
    );
  }

  async bookAvailableTimeslotV2(
    branchCode: string,
    bookingDate: string,
    startTime: string,
    serviceId: string,
    staffid: string,
    bookingNote: string,
    bookingEntryNo: string,
    customerNoOrEmailAdd: string,
    customerName: string,
    customerPhoneNo: string,
    customerBirthDate: string,
    customerAddress1: string,
    customerAddress2: string,
    skipTimeSlotAvailabilityCheck: string,
  ) {
    return bcClient.post<{value: string}>(
      "BookingAppointment_BookAvailableTimeSlotv2",
      {
        _BranchCode: branchCode,
        _BookingDate:bookingDate,
        _StartTime:startTime,
        _ServiceId:serviceId,
        _StaffId:staffid,
        _BookingNote:bookingNote,
        _BookingEntryNo:bookingEntryNo,
        _CustomerNoOrEmailAdd:customerNoOrEmailAdd,
        _CustomerName:customerName,
        _CustomerPhoneNo:customerPhoneNo,
        _CustomerBirthDate:customerBirthDate,
        _CustomerAddress1:customerAddress1,
        _CustomerAddress2:customerAddress2,
        _SkipTimeSlotAvailabilityCheck:skipTimeSlotAvailabilityCheck
      }
    );
  }
}

export const availableTimeslotServiceV2 = new AvailableTimeslotServiceV2();