import { NextResponse } from "next/server";

let memoryCache: { access_token: string; expires_at: number } | null = null;

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
      expires_at: Date.now() + 1000 * 60 * 30,
    };
  }

  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { _BookingSetupCode, _ServiceId } = body;

    if (!_BookingSetupCode || !_ServiceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const tenantId = process.env.TENANT_ID!;
    const environment = "SandboxDev2";
    const company = "SQUADLETHICS";

    const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetAssignServiceStaff?Company=${encodeURIComponent(company)}`;

    console.log("Calling BC API for staff assignments:", url);
    console.log("Request body:", { _BookingSetupCode, _ServiceId });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _BookingSetupCode: _BookingSetupCode,
        _ServiceId: _ServiceId,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("BC API error:", {
        status: res.status,
        statusText: res.statusText,
        response: text,
      });
      throw new Error(`Failed to get staff assignments: ${res.statusText}`);
    }

    const data = await res.json();
    console.log("Staff assignments response:", data);

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("POST /api/booking-service-staff-rela/get-booking-service-staff-rela failed:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Add this to handle GET requests if needed, or remove if only POST is allowed
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST instead." },
    { status: 405 }
  );
}