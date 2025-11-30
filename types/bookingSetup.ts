import { BookingParameter } from "./bookingParameter";
export type BookingSetup = {
      BookingSetupCode: string;
      BookingSetupDescription: string;
      BookingSetupTimeIncrement: number;
      BookingSetupAllowableTime: number;
      BookingParameter: BookingParameter[];
      BookingServiceStaffRela: any[];
      BookingServiceDefaultValue: any[];
      BookingBusinessHours: any[];
}