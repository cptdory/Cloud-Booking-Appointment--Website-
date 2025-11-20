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

// ─────────────────────────────────────────────
// Fetch Business Central Booking Details
// ─────────────────────────────────────────────
async function fetchBookingDetails(accessToken: string, code: string) {
  const tenantId = process.env.TENANT_ID!;
  const environment = "SandboxDev2";
  const company = "SQUADLETHICS";

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
// GET Endpoint
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
