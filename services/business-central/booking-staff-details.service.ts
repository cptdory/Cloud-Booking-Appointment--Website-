import { bcClient } from "./client";

class BookingStaffDetailsService {
    async getBookingStaffColor(
        bookingSetupCode: string,
        bookingParameterId: string,
        bookingParameterValueId: string,
    ) {
        return bcClient.post<{ value: string }>(
            "BookingAppointment_GetBookingStaffColor",
            {
                _BookingSetupCode: bookingSetupCode,
                _BookingParameterId: bookingParameterId,
                _BookingParameterValueId: bookingParameterValueId
            }
        );
    }

    async updateBookingStaffAuthColor(
        bookingSetupCode: string,
        bookingParameterId: string,
        bookingParameterValueId: string,
        staffColor: string,
    ) {
        return bcClient.post<{ value: string }>(
            "BookingAppointment_UpdateBookingStaffAuthColor",
            {
                _BookingSetupCode:bookingSetupCode,
                _BookingParameterId:bookingParameterId,
                _BookingParameterValueId:bookingParameterValueId,
                _StaffColor:staffColor
            }
        );
    }

    async getBookingStaffEmail(
        bookingSetupCode: string,
        bookingParameterId: string,
        bookingParameterValueId: string,
    ) {
        return bcClient.post<{value: string}>(
            "BookingAppointment_GetBookingStaffEmail",
            {
                _BookingSetupCode: bookingSetupCode,
                _BookingParameterId: bookingParameterId,
                _BookingParameterValueId: bookingParameterValueId
            }
        );
    }

    async updateBookingStaffAuthEmail(
        bookingSetupCode: string,
        bookingParameterId: string,
        bookingParameterValueId: string,
        staffEmail: string,
    ) {
        return bcClient.post<{value: string}>(
            "BookingAppointment_UpdateBookingStaffAuthEmailAddress",
            {
                _BookingSetupCode: bookingSetupCode,
                _BookingParameterId:bookingParameterId,
                _BookingParameterValueId:bookingParameterValueId,
                _StaffEmail:staffEmail
            }
        );
    }
}

export const bookingStaffDetailsService = new BookingStaffDetailsService();