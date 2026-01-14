import { NextRequest, NextResponse } from "next/server";
import { parseBCError, createErrorResponse } from "@/app/api/utils/bc-error-handler";

let memoryCache: { access_token: string; expires_at: number } | null = null;

async function getAccessToken() {
  const isVercel = !!process.env.VERCEL;

  if (isVercel && memoryCache && Date.now() < memoryCache.expires_at) {
    return memoryCache.access_token;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const tokenRes = await fetch(`${baseUrl}/api/auth/token`);
  if (!tokenRes.ok)
    throw new Error(`Failed to refresh token (${tokenRes.status})`);

  const data = await tokenRes.json();

  if (isVercel && data.access_token) {
    memoryCache = {
      access_token: data.access_token,
      expires_at: Date.now() + 1000 * 60 * 30,
    };
  }

  return data.access_token;
}

async function authLogin(accessToken: string, body: any, retry = true): Promise<any> {
  const tenantId = process.env.TENANT_ID!;
  const environment = process.env.ENVIRONMENT!;
  const company = process.env.COMPANY!;

  const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_LoginAuth?Company=${company}`;

  // Prepare request body based on login type
  const requestBody = {
    _PortalUsername: String(body._PortalUsername || ""),
    _PortalPassword: String(body._PortalPassword || ""),
    _IsAdminLogin: String(body._IsAdminLogin || "false")
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if ((res.status === 401 || res.status === 403) && retry) {
    // Token might be expired, refresh and retry once
    const newToken = await getAccessToken();
    return await authLogin(newToken, body, false);
  }

  if (!res.ok) {
    const text = await res.text();
    console.error('BC Login Error:', { status: res.status, statusText: res.statusText, text });
    
    const bcError = parseBCError(text);
    throw new Error(JSON.stringify(bcError));
  }

  const result = await res.json();
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const accessToken = await getAccessToken();
    const result = await authLogin(accessToken, body);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Login API Error:', error);
    
    const errorResponse = createErrorResponse(error, "Login failed");
    return NextResponse.json(errorResponse, { status: 400 });
  }
}