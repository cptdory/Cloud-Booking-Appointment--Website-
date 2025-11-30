import { NextRequest, NextResponse } from "next/server";

let memoryCache: { access_token: string; expires_at: number } | null = null;

/* ============================================================
    FAST ACCESS TOKEN
============================================================ */
async function getAccessToken() {
  const isVercel = !!process.env.VERCEL;

  // Use cached token
  if (isVercel && memoryCache && Date.now() < memoryCache.expires_at) {
    return memoryCache.access_token;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const tokenRes = await fetch(`${baseUrl}/api/auth/token`, {
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    throw new Error(`Failed to refresh token`);
  }

  const data = await tokenRes.json();

  // Cache for 30 mins
  if (isVercel && data.access_token) {
    memoryCache = {
      access_token: data.access_token,
      expires_at: Date.now() + 1000 * 60 * 30,
    };
  }

  return data.access_token;
}

/* ============================================================
    ROUTE — FAST, CLEAN, SAME OUTPUT
============================================================ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const accessToken = await getAccessToken();
    const tenantId = process.env.TENANT_ID!;
    const environment = process.env.ENVIRONMENT!;
    const company = process.env.COMPANY!;

    const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetBookingEntries?Company=${encodeURIComponent(
      company
    )}`;

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
      const errorText = await res.text();
      throw new Error(
        `BC API error ${res.status}: ${res.statusText} | ${errorText}`
      );
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch booking entries",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
