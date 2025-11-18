// app/api/booking-setup/create-setup/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

let memoryCache: { access_token: string; expires_at: number } | null = null;

// ===== Helper: Fetch or refresh token =====
async function getAccessToken() {
  const isVercel = !!process.env.VERCEL;
  const cacheFile = path.join(
    process.cwd(),
    "app/api/auth/cache/token_cache.json"
  );

  // ✅ Use memory cache on Vercel
  if (isVercel) {
    if (memoryCache && Date.now() < memoryCache.expires_at) {
      return memoryCache.access_token;
    }
  } else if (fs.existsSync(cacheFile)) {
    // ✅ Local file cache
    const cache = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    if (cache.access_token && Date.now() < cache.expires_at) {
      return cache.access_token;
    }
  }

  // 🔄 Otherwise, call the token route to refresh
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const tokenRes = await fetch(`${baseUrl}/api/auth/token`);
  if (!tokenRes.ok)
    throw new Error(`Failed to refresh token (${tokenRes.status})`);
  const data = await tokenRes.json();

  // Store in memory cache if Vercel
  if (isVercel && data.access_token) {
    memoryCache = {
      access_token: data.access_token,
      expires_at: Date.now() + 1000 * 60 * 30, // fallback 30min
    };
  }

  return data.access_token;
}

// ===== Helper: Create Booking Setup in Business Central =====
async function createBookingSetup(
  accessToken: string,
  setupData: {
    Code: string;
    Description: string;
    LocationCode: string;
    TimeIncrement: string;
    ClosingAllowableTime: string;
  },
  retry = true
): Promise<any> {
  const tenantId = process.env.TENANT_ID!;
  const environment = "SandboxDev2";
  const company = "SQUADLETHICS";

  const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_CreateBookingSetup?Company=${company}`;

  const requestBody = {
    _Code: setupData.Code,
    _Description: setupData.Description,
    _LocationCode: setupData.LocationCode || "",
    _TimeIncrement: setupData.TimeIncrement,
    _ClosingAllowableTime: setupData.ClosingAllowableTime,
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
    return await createBookingSetup(newToken, setupData, false);
  }

  if (!res.ok) {
    const text = await res.text();
    console.error("Business Central API error:", {
      status: res.status,
      statusText: res.statusText,
      url,
      requestBody,
      response: text,
    });
    throw new Error(
      `Failed to create booking setup (${res.status}): ${res.statusText} - ${text}`
    );
  }

  // Business Central might return empty response or success message
  try {
    const json = await res.json();
    return json;
  } catch {
    // If no JSON response, return success status
    return { success: true, status: res.status };
  }
}

// ===== POST =====
export async function POST(req: NextRequest) {
  try {
    const accessToken = await getAccessToken();
    
    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    const { Code, Description, LocationCode, TimeIncrement, ClosingAllowableTime } = body;
    
    if (!Code || !Description || !TimeIncrement || !ClosingAllowableTime) {
      return NextResponse.json(
        { 
          error: "Validation error", 
          message: "Code, Description, TimeIncrement, and ClosingAllowableTime are required fields" 
        },
        { status: 400 }
      );
    }

    // Create the booking setup
    const result = await createBookingSetup(accessToken, {
      Code,
      Description,
      LocationCode: LocationCode || "",
      TimeIncrement,
      ClosingAllowableTime,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Booking setup created successfully",
      data: result 
    });

  } catch (err: any) {
    console.error("Create booking setup error:", err);
    return NextResponse.json(
      { 
        error: "Server error", 
        message: err.message 
      },
      { status: 500 }
    );
  }
}

// ===== OPTIONS ===== (for CORS preflight)
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}