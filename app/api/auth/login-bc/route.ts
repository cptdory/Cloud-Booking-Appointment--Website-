import { NextRequest, NextResponse } from "next/server";

let memoryCache: { access_token: string; expires_at: number } | null = null;

async function getAccessToken() {
  const isVercel = !!process.env.VERCEL;

  if (isVercel) {
    if (memoryCache && Date.now() < memoryCache.expires_at) {
      return memoryCache.access_token;
    }
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
  const environment = "SandboxDev2";
  const company = "SQUADLETHICS";

  const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetCustomer?Company=${company}`;

  const requestBody = {
    _CustomerNoOrEmailAddress: String(body._emailOrCustomerNo || "")
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
    const newToken = await getAccessToken();
    return await authLogin(newToken, body, false);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed request (${res.status}): ${res.statusText} - ${text}`);
  }

  return await res.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accessToken = await getAccessToken();
    const result = await authLogin(accessToken, body);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to login", message: error.message },
      { status: 500 }
    );
  }
}
