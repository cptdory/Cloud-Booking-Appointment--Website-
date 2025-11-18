import { NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Get entries request body:", body);
    
    const accessToken = await getAccessToken();
    const tenantId = process.env.TENANT_ID!;
    const environment = "SandboxDev2";
    const company = "SQUADLETHICS";

    const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetBookingEntries?Company=${company}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Business Central API error:", {
        status: res.status,
        statusText: res.statusText,
        response: text,
      });
      throw new Error(`Failed to fetch booking entries: ${res.status}`);
    }

    const json = await res.json();
    console.log("Booking entries response received");
    
    return NextResponse.json(json);
  } catch (error: any) {
    console.error('Error fetching booking entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking entries', message: error.message },
      { status: 500 }
    );
  }
}