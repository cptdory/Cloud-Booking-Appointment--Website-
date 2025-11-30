import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

let memoryCache: { access_token: string; expires_at: number } | null = null;

// ─────────────────────────────────────────────
// Helper: Fetch/refresh Access Token
// ─────────────────────────────────────────────
async function getAccessToken() {
  const isVercel = !!process.env.VERCEL;
  const cacheFile = path.join(process.cwd(), "app/api/auth/cache/token_cache.json");

  // Memory cache (Vercel)
  if (isVercel) {
    if (memoryCache && Date.now() < memoryCache.expires_at) {
      return memoryCache.access_token;
    }
  }

  // Local file cache (dev)
  else if (fs.existsSync(cacheFile)) {
    const cache = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    if (cache.access_token && Date.now() < cache.expires_at) {
      return cache.access_token;
    }
  }

  // Fetch new token
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const tokenRes = await fetch(`${baseUrl}/api/auth/token`);
  if (!tokenRes.ok) throw new Error("Failed to refresh token");

  const data = await tokenRes.json();

  // Save to memory cache on Vercel
  if (isVercel && data.access_token) {
    memoryCache = {
      access_token: data.access_token,
      expires_at: Date.now() + 1000 * 60 * 30,
    };
  }

  return data.access_token;
}

// ─────────────────────────────────────────────
// Fetch Business Central Booking Details
// ─────────────────────────────────────────────
async function fetchBookingDetails(accessToken: string, code: string) {
  const tenantId = process.env.TENANT_ID!;
  const environment = process.env.ENVIRONMENT!;
  const company = process.env.COMPANY!;

  const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetBookingSetup?Company=${encodeURIComponent(company)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      _BookingSetupCode: code,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  const json = await res.json();
  return typeof json.value === "string" ? JSON.parse(json.value) : json.value;
}

// ─────────────────────────────────────────────
// GET Endpoint  →  /api/booking-setup/get-booking-setup?code=MAIN
// ─────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing ?code=" }, { status: 400 });
  }

  try {
    const token = await getAccessToken();
    const data = await fetchBookingDetails(token, code);
    return NextResponse.json({ value: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch booking details", message: err.message },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// POST Endpoint → body: { "_BookingSetupCode": "MAIN" }
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { _BookingSetupCode } = body;

    if (!_BookingSetupCode) {
      return NextResponse.json({ error: "Missing _BookingSetupCode" }, { status: 400 });
    }

    const token = await getAccessToken();
    const data = await fetchBookingDetails(token, _BookingSetupCode);

    return NextResponse.json({ value: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch booking details", message: err.message },
      { status: 500 }
    );
  }
}
