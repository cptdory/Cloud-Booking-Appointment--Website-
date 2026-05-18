import { bcClient } from "./client";

class BookingStaffRelaService {
  async getBookingStaffRela(
    bookingSetupCode: string,
    serviceId: string
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_GetAssignServiceStaff",
      {
        _BookingSetupCode: bookingSetupCode,
        _ServiceId: serviceId
      }
    );
  }

  async deleteBookingStaffRela(
    bookingSetupCode: string,
    serviceId: string,
    staffId: string,
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_DeleteAssignServiceStaff",
      {
        _BookingSetupCode: bookingSetupCode,
        _ServiceId: serviceId,
        _StaffId: staffId
      }
    );
  }

  async createBookingStaffRela(
    bookingSetupCode: string,
    bookingParameterId: string,
    serviceId: string,
    staffId: string,
    staffCode: string,
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_CreateAssignServiceStaff",
      {
        _BookingSetupCode: bookingSetupCode,
        _BookingParameterId_Staff: bookingParameterId,
        _ServiceId: serviceId,
        _StaffId: staffId,
        _StaffCode: staffCode
      }
    );
  }
}

export const bookingStaffService = new BookingStaffRelaService();