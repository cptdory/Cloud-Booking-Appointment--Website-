export type AuthUser = {
    booking_setup_code: string;
    staff_code: string;
    staff_name: string | null;
    name: string;
    email: string;
    is_admin: boolean;
    role: string;
    phone_number: string;
    address: string;
    address2: string;
    age: string;
    birthdate: string;
    customer_number?: any;
    booking_parameter_id?: string;
    booking_parameter_value_id?: string;
    tenant_id: string;
}

export type BookingSetup = {
    code: string;
    description: string;
    location:string;
}

export type BookingParameter = {
    name: string;
    url: string;
    icon: string;
    values?: BookingParameterValue[];
}

export type BookingParameterValue = {
    id: string;
    code: string;
    description: string;
    duration: number;
}
export type RoomContentProps = {
    values: BookingParameterValue[];
    bookingSetupCode: string;
    bookingParameterId: string;
    bookingParameterCode: string;
}

export type ServicesContentProps = {
    values: BookingParameterValue[];
    bookingSetupCode: string;
    bookingParameterId: string;
    bookingParameterCode: string;
    staffValues?: BookingParameterValue[];
}

export type StaffContentProps = {
    values: BookingParameterValue[];
    bookingSetupCode: string;
    bookingParameterId: string;
    bookingParameterCode: string;
}

export type BookingParameterData = {
    code: string;
    id: string;
}
export type BusinessHours = {
    DayOfWeek: string;
    StartTime: string;
    EndTime: string;
    TimeIncrement: number;
}

export type PageProps = {
    auth: {
        logged_in: boolean;
        user: AuthUser | null;
    };
    bookingParameters: BookingParameter[];
    bookingParameter: BookingParameterData;
    bookingBusinessHours: BusinessHours[] | null;
}

export type AlertItem = {
  id: string;
  message: string;
  title?: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export type AlertContextType = {
  alerts: AlertItem[];
  addAlert: (message: string, type?: 'success' | 'error' | 'info', title?: string, duration?: number) => void;
  removeAlert: (id: string) => void;
}

export type CustomerData  ={
  CustomerNo: string;
  Name: string;
  Name2?: string;
  PhoneNo: string;
  EMail: string;
  Address: string;
  Address2: string;
  Age: string;
  BirthDate: string;
}
export type BookingEntriesData  ={
  EntryNo: string;
  BookingStartDate: string;
  BookingEndDate: string;
  BookingStartTime: string;
  BookingEndTime: string;
  BookingNote: string;
  BookingStatus: string;
  BookingSetupCode: string;
  ServiceCode: string;
  ServiceName: string;
  StaffCode: string;
  StaffName: string;
  StaffColor: string;
  TimeOff: string;
  WholeDayOff: string;
  CustomerNo: string;
  Name: string;
  Name2?: string;
  PhoneNo: string;
  EMail: string;
  Age: string;
  BirthDate: string;
  Address: string;
  Address2: string; 
  BookingParameters: any
  Rescheduled?: string;
  ServiceDuration?: number;
  ServicePrice?: number;
}
