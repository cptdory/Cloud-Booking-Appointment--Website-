import { bcClient } from "./client";

class AvailableTimeslotService {
  async getAvailableTimeslot(
    bookingSetupCode: string,
    bookingDate: string,
    bookingParameterCount: string,
    bookingParameterIDs: string,
    bookingParameterValueIDs: string,
    skipTimeSlotAvailabilityCheck: string,
  ) {
    return bcClient.post<{value: string}>(
      "BookingAppointment_GetAvailableTimeSlot",
      {
        _BookingSetupCode:bookingSetupCode,
        _BookingDate:bookingDate,
        _BookingParameterCount:bookingParameterCount,
        _BookingParameterIDs:bookingParameterIDs,
        _BookingParameterValueIDs:bookingParameterValueIDs,
        _SkipTimeSlotAvailabilityCheck:skipTimeSlotAvailabilityCheck
      }
    );
  }

  async bookAvailableTimeslot(
    bookingSetupCode: string,
    bookingDate: string,
    bookingStartTime: string,
    bookingParameterCount: string,
    bookingParameterIDs: string,
    bookingParameterValueIDs: string,
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
      "BookingAppointment_BookAvailableTimeSlot",
      {
        _BookingSetupCode: bookingSetupCode,
        _BookingDate:bookingDate,
        _BookingStartTime:bookingStartTime,
        _BookingParameterCount:bookingParameterCount,
        _BookingParameterIDs:bookingParameterIDs,
        _BookingParameterValueIDs:bookingParameterValueIDs,
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

export const availableTimeslotService = new AvailableTimeslotService();