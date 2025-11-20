import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

let memoryCache: { access_token: string; expires_at: number } | null = null;

async function getAccessToken() {
  const isVercel = !!process.env.VERCEL;
  const cacheFile = path.join(process.cwd(), "app/api/auth/cache/token_cache.json");

  if (isVercel) {
    if (memoryCache && Date.now() < memoryCache.expires_at) {
      return memoryCache.access_token;
    }
  } else if (fs.existsSync(cacheFile)) {
    const cache = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    if (cache.access_token && Date.now() < cache.expires_at) {
      return cache.access_token;
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const tokenRes = await fetch(`${baseUrl}/api/auth/token`);
  if (!tokenRes.ok) throw new Error("Failed to refresh token");
  const data = await tokenRes.json();

  if (isVercel && data.access_token) {
    memoryCache = {
      access_token: data.access_token,
      expires_at: Date.now() + 1000 * 60 * 30,
    };
  }

  return data.access_token;
}

async function callBusinessCentralAPI(endpoint: string, body: any) {
  const tenantId = process.env.TENANT_ID!;
  const environment = "SandboxDev2";
  const company = "SQUADLETHICS";
  const token = await getAccessToken();

  const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/${endpoint}?Company=${encodeURIComponent(company)}`;

  console.log('Calling Business Central API:', { endpoint, body, url });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Business Central API error:', errorText);
    throw new Error(`API Error: ${res.status} - ${errorText}`);
  }

  // Some BC endpoints might return empty responses
  const contentLength = res.headers.get('content-length');
  if (contentLength === '0') {
    return { success: true };
  }

  try {
    return await res.json();
  } catch (e) {
    // If no JSON response, assume success
    return { success: true };
  }
}

export async function POST(req: Request) {
  try {
    const { action, data } = await req.json();

    console.log('Received request:', { action, data });

    let endpoint = "";
    let body = {};

    switch (action) {
      case "create":
        endpoint = "BookingAppointment_CreateBookingBusinessHour";
        body = {
          _BookingSetupCode: data.bookingSetupCode,
          _BookingBusinessHoursDayOfWeek: data.dayOfWeek,
          _BookingBusinessHoursStartTime: data.startTime,
          _BookingBusinessHoursEndTime: data.endTime,
          _BookingBusinessHoursTimeIncrement: data.timeIncrement,
        };
        break;

      case "update":
        endpoint = "BookingAppointment_UpdateBookingBusinessHour";
        body = {
          _BookingSetupCode: data.bookingSetupCode,
          _BookingBusinessHoursDayOfWeek: data.dayOfWeek,
          _BookingBusinessHoursStartTime: data.startTime,
          _BookingBusinessHoursEndTime: data.endTime,
          _BookingBusinessHoursTimeIncrement: data.timeIncrement,
        };
        break;

      case "delete":
        endpoint = "BookingAppointment_DeleteBookingBusinessHour";
        body = {
          _BookingSetupCode: data.bookingSetupCode,
          _BookingBusinessHoursDayOfWeek: data.dayOfWeek,
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const result = await callBusinessCentralAPI(endpoint, body);
    console.log('Business Central API result:', result);
    
    return NextResponse.json({ success: true, data: result });

  } catch (err: any) {
    console.error('Error in business-hours API:', err);
    return NextResponse.json(
      { error: "Failed to process business hours", message: err.message },
      { status: 500 }
    );
  }
}