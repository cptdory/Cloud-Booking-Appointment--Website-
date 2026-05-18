import { bcClient } from "./client";

export type LoginAuthUser = {
  BookingSetupCode?: string;
  BookingParameterId?: string;
  BookingParameterValueId?: string;
  StaffCode?: string;
  Name?: string;
  Email?: string;
  Admin?: boolean;
  CustomerNo?: string;
  Name2?: string;
  PhoneNo?: string;
  Address?: string;
  Address2?: string;
  Age?: number;
  BirthDate?: string;
};

class LoginAuthService {
  async loginAuth(email: string, password: string, isUserLogin: string) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_LoginAuth",
      {
        _EmailAddress: email,
        _Password: password,
        _IsUserLogin: isUserLogin,
      }
    );
  }
}

export const authService = new LoginAuthService();