import { bcClient } from "./client";

export type OrganizationSetup = {
  Name: string;
  Logo: string;
  Headline: string;
  LoginImage: string;
  FacebookLink: string;
  TwitterLink: string;
  YoutubeLink: string;
  LinkedinLink: string;
};

class OrganizationService {
  async getBookingOrganizationSetup(tenantId: string) {
    return bcClient.post<{ value: string }>(
      "BookingAppointment_GetBookingOrganizationSetup",
      {
        _TenantId: tenantId,
      }
    );
  }
}

export const organizationService = new OrganizationService();