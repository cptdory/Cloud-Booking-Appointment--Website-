// app/api/update-booking-parameter-value/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

let memoryCache: { access_token: string; expires_at: number } | null = null;

async function getAccessToken() {
  const isVercel = !!process.env.VERCEL;
  const cacheFile = path.join(process.cwd(), "app/api/auth/cache/token_cache.json");

  if (isVercel) {
    if (memoryCache && Date.now() < memoryCache.expires_at) return memoryCache.access_token;
  } else if (fs.existsSync(cacheFile)) {
    const cache = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    if (cache.access_token && Date.now() < cache.expires_at) return cache.access_token;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const tokenRes = await fetch(`${baseUrl}/api/auth/token`);
  if (!tokenRes.ok) throw new Error("Failed to refresh token");
  const data = await tokenRes.json();

  if (isVercel && data.access_token) {
    memoryCache = { access_token: data.access_token, expires_at: Date.now() + 1000 * 60 * 30 };
  }

  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // minimal validation
    if (!body._BookingSetupCode || !body._BookingParameterId || !body._BookingParameterValueId ||!body._BookingParameterValueCode) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const token = await getAccessToken();

    const tenantId = process.env.TENANT_ID!;
    const environment = process.env.BC_ENV || "SandboxDev2";
    const company = process.env.COMPANY || "SQUADLETHICS";

    const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_UpdateBookingParameterValue?Company=${encodeURIComponent(company)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _BookingSetupCode: body._BookingSetupCode,
        _BookingParameterId: String(body._BookingParameterId),
        _BookingParameterValueId: String(body._BookingParameterValueId),
        _BookingParameterValueCode: String(body._BookingParameterValueCode),
        _BookingParamenterValueDesc: body._BookingParamenterValueDesc,
        _BookingParameterValueDuration: String(body._BookingParameterValueDuration),
        _BookingParameterValueStaff: body._BookingParameterValueStaff ?? "No",
        _BookingParameterValueService: body._BookingParameterValueService ?? "Yes",
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ message: "BC update failed", detail: text }, { status: 500 });
    }

    return NextResponse.json({ message: "Updated", detail: text });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Server Error" }, { status: 500 });
  }
}
