import { bcClient } from "./client";
class OTPService {
  async otpGeneration(
    emailAddress:string,
    verificationType:string
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_OTPGeneration",
      {
        _EmailAddress:emailAddress,
        _VerificationType:verificationType
      }
    );
  }

  async otpValidation(
    requestId: string,
    otp:string
  ) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_OTPValidation",
      {
        _RequestId: requestId,
        _OTP:otp
      }
    );
  }
}

export const otpService = new OTPService();