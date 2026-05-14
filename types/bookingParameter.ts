export type BookingParameter = {
      BookingParameterId: number;
  BookingParameterCode: string;
  BookingParameterSequence: number;
  BookingParameterCheckAvailability: boolean;
  BookingParameterCheckDuration: boolean;
  BookingParameterStaff: boolean;
  BookingParameterService: boolean;
  BookingParameterValue: {
    BookingParameterValueId: number;
    BookingParameterValueCode: string;
    BookingParameterValueDescription: string;
    BookingParameterValueDuration: number;
    BookingParameterValueServiceSequence: number;
  }[];
}