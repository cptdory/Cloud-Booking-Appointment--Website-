import axios from "axios";
import { tokenService } from "./token.service";

export type BCResponse<T> = {
  data: T;
};

class BusinessCentralClient {
  private baseUrl: string;
  private company: string;

  constructor() {
    const tenant = process.env.TENANT_ID!;
    const env = process.env.ENVIRONMENT!;
    this.company = process.env.COMPANY!;

    this.baseUrl = `https://api.businesscentral.dynamics.com/v2.0/${tenant}/${env}/ODataV4`;
  }

  private async getAxiosInstance() {
    const token = await tokenService.getAccessToken();

    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      params: {
        Company: this.company,
      },
    });
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const api = await this.getAxiosInstance();

    const response = await api.post(endpoint, body);

    return response.data;
  }
}

export const bcClient = new BusinessCentralClient();