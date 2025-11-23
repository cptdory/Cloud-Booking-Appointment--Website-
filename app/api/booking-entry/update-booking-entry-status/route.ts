import { NextResponse } from "next/server";

let memoryCache: { access_token: string; expires_at: number } | null = null;

// Helper: Fetch/refresh Access Token
async function getAccessToken() {
  const isVercel = !!process.env.VERCEL;
  if (isVercel && memoryCache && Date.now() < memoryCache.expires_at) {
    return memoryCache.access_token;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const tokenRes = await fetch(`${baseUrl}/api/auth/token`);
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error("Token fetch failed:", text);
    throw new Error("Failed to refresh token");
  }

  const data = await tokenRes.json();

  if (isVercel && data.access_token) {
    memoryCache = {
      access_token: data.access_token,
      expires_at: Date.now() + 1000 * 60 * 30, // cache 30 min
    };
  }

  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {_BookingStatus, _EntryNo } = body;

    if (!_EntryNo || !_BookingStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.TENANT_ID) {
      return NextResponse.json({ error: "TENANT_ID not set" }, { status: 500 });
    }

    const accessToken = await getAccessToken();
    const tenantId = process.env.TENANT_ID;
    const environment = "SandboxDev2";
    const company = "SQUADLETHICS";

    const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_UpdateBookingEntryStatus?Company=${encodeURIComponent(company)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _EntryNo: _EntryNo,
        _BookingStatus: _BookingStatus
      }),
    });

    let data: any = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      console.warn("Failed to parse BC response as JSON:", text);
    }

    if (!res.ok) {
      console.error("BC API error:", data || text);
      throw new Error(data?.error?.message || "Failed to update entry status");
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("POST /api/booking-entry/update-booking-entry-status failed:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}