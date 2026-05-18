import { bcClient } from "./client";

class BookingPlanningPeriodService {
    async getBookingPlanningPeriod(
        bookingSetupCode: string
    ) {
        return bcClient.post<{ value: string }>(
            "BookingAppointment_GetBookingPlanningPeriods",
            {
                _BookingSetupCode: bookingSetupCode
            }
        );
    }
    async createBookingPlanningPeriod(
        bookingSetupCode: string,
        code: string,
        description: string,
        dateFrom: string,
        dateTo: string
    ) {
        return bcClient.post<{ value: string }>(
            "BookingAppointment_CreateBookingPlanningPeriod",
            {
                _BookingSetupCode: bookingSetupCode,
                _Code: code,
                _Description: description,
                _DateFrom: dateFrom,
                _DateTo: dateTo
            }
        );
    }
    async updateBookingPlanningPeriod(
        bookingSetupCode: string,
        code: string,
        description: string,
        dateFrom: string,
        dateTo: string
    ) {
        return bcClient.post<{ value: string }>(
            "BookingAppointment_UpdateBookingPlanningPeriod",
            {
                _BookingSetupCode: bookingSetupCode,
                _Code: code,
                _Description: description,
                _DateFrom: dateFrom,
                _DateTo: dateTo
            }
        );
    }
    async deleteBookingPlanningPeriod(
        bookingSetupCode: string,
        code: string
    ) {
        return bcClient.post<{ value: string }>(
            "BookingAppointment_DeleteBookingPlanningPeriod",
            {
                _BookingSetupCode: bookingSetupCode,
                _Code: code
            }
        );
    }
    async setBookingPlanningPeriodActive(
        bookingSetupCode: string,
        code: string
    ) {
        return bcClient.post<{ value: string }>(
            "BookingAppointment_SetBookingPlanningPeriodActive",
            {
                _BookingSetupCode: bookingSetupCode,
                _Code: code
            }
        );
    }
    async setBookingPlanningPeriodInactive(
        bookingSetupCode: string,
        code: string
    ) {
        return bcClient.post<{ value: string }>(
            "BookingAppointment_SetBookingPlanningPeriodInactive",
            {
                _BookingSetupCode: bookingSetupCode,
                _Code: code
            }
        );
    }
}

export const bookingPlanningPeriodService = new BookingPlanningPeriodService();