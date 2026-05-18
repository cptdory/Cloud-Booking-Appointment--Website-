import { bcClient } from "./client";

class BookingParameterService {
  async deleteBookingParameterValue(
    bookingSetupCode: string,
    bookingParameterId: string,
    bookingParameterValueId: string,
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_DeleteBookingParameterValue",
      {
        _BookingSetupCode: bookingSetupCode,
        _BookingParameterId: bookingParameterId,
        _BookingParameterValueId: bookingParameterValueId,
      }
    );
  }
  async getBookingParameterValues(
    bookingSetupCode: string,
    bookingParameterId: string
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_GetBookingParameterValues",
      {
        _BookingSetupCode: bookingSetupCode,
        _BookingParameterId: bookingParameterId
      }
    );
  }

  async createBookingParameterValue(
    bookingSetupCode: string,
    bookingParameterId: string,
    bookingParameterValueCode: string,
    bookingParameterValueDesc: string,
    bookingParameterValueDuration: string,
    bookingParameterValueStaff: string,
    bookingParameterValueService: string,
    bookingParameterValueServicePrice: string,
    bookingParameterValueServiceSequence: string,
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_CreateBookingParameterValue",
      {
        _BookingSetupCode: bookingSetupCode,
        _BookingParameterId: bookingParameterId,
        _BookingParameterValueCode: bookingParameterValueCode,
        _BookingParameterValueDesc: bookingParameterValueDesc,
        _BookingParameterValueDuration: bookingParameterValueDuration,
        _BookingParameterValueStaff: bookingParameterValueStaff,
        _BookingParameterValueService: bookingParameterValueService,
        _BookingParameterValueServicePrice: bookingParameterValueServicePrice,
        _BookingParameterValueServiceSequence: bookingParameterValueServiceSequence
      }
    );
  }
  async updateBookingParameterValue(
    bookingSetupCode: string,
    bookingParameterId: string,
    bookingParameterValueId: string,
    bookingParameterValueCode: string,
    bookingParameterValueDesc: string,
    bookingParameterValueDuration: string,
    bookingParameterValueStaff: string,
    bookingParameterValueService: string,
    bookingParameterValueServicePrice: string,
    bookingParameterValueServiceSequence: string
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_UpdateBookingParameterValue",
      {
        _BookingSetupCode: bookingSetupCode,
        _BookingParameterId: bookingParameterId,
        _BookingParameterValueId: bookingParameterValueId,
        _BookingParameterValueCode: bookingParameterValueCode,
        _BookingParameterValueDesc: bookingParameterValueDesc,
        _BookingParameterValueDuration: bookingParameterValueDuration,
        _BookingParameterValueStaff: bookingParameterValueStaff,
        _BookingParameterValueService: bookingParameterValueService,
        _BookingParameterValueServicePrice: bookingParameterValueServicePrice,
        _BookingParameterValueServiceSequence: bookingParameterValueServiceSequence
      }
    );
  }
}
export const bookingParameterService = new BookingParameterService();