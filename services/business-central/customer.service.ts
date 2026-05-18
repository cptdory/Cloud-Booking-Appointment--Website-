import { bcClient } from "./client";
class CustomerService {
  async getCustomers() {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_GetCustomers",
      {}
    );
  }

  async getCustomer(
    customerNo: string
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_GetCustomer",
      {
        _CustomerNo: customerNo,
      }
    );
  }

  async updateCustomerDetails(
      customerNo: string,
      name: string,
      phoneNo: string,
      email: string,
      address: string,
      address2: string,
      birthDate: string,
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_UpdateCustomerDetails",
      {
        _CustomerNo:customerNo,
        _Name:name,
        _Name2: "",
        _PhoneNo:phoneNo,
        _Email:email,
        _Address:address,
        _Address2:address2,
        _Age: "0",
        _BirthDate:birthDate,
      }
    );
  }

  async validateCustomerEmailAddress(
    email: string
  ) {
    return bcClient.post(
      "BookingAppointment_ValidateCustomerEmailAddress",
      {
        _Email: email,
      }
    );
  }
}

export const customerService = new CustomerService();