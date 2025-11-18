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

// ===== Helper: Call Business Central API =====
async function fetchBusinessCentralData(
  accessToken: string,
  retry = true
): Promise<any[]> {
  const tenantId = process.env.TENANT_ID!;
  const environment = "SandboxDev2";
  const company = "SQUADLETHICS";

  const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetBookingSetups?Company=${company}`;

  console.log("Calling Business Central API:", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: "",
  });

  if ((res.status === 401 || res.status === 403) && retry) {
    const newToken = await getAccessToken();
    return await fetchBusinessCentralData(newToken, false);
  }

  if (!res.ok) {
    const text = await res.text();
    console.error("Business Central API error:", {
      status: res.status,
      statusText: res.statusText,
      url,
      response: text,
    });
    throw new Error(
      `Failed request (${res.status}): ${res.statusText} - ${text}`
    );
  }

  const json = await res.json();
  console.log("Business Central API response:", json);

  if (!json?.value) {
    console.warn("No value in response, returning empty array");
    return [];
  }

  const value = json.value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? value : [];
}

// ===== GET - Fetch all booking setups =====
export async function GET() {
  try {
    console.log("GET /api/booking-setup called");
    const accessToken = await getAccessToken();
    console.log("Access token obtained");

    const data = await fetchBusinessCentralData(accessToken);
    console.log("Data fetched:", data);

    return NextResponse.json({ value: data });
  } catch (err: any) {
    console.error("GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch booking setups", message: err.message },
      { status: 500 }
    );
  }
}
// ===== Helper: Create Booking Setup =====
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
    console.error("Business Central CREATE error:", {
      status: res.status,
      statusText: res.statusText,
      response: text,
    });
    throw new Error(`Failed to create booking (${res.status}): ${text}`);
  }

  try {
    return await res.json();
  } catch {
    return { success: true };
  }
}

// ===== POST - Create new booking setup =====
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { Code, Description, LocationCode, TimeIncrement, ClosingAllowableTime } = body;

    if (!Code || !Description || !TimeIncrement || !ClosingAllowableTime) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Code, Description, TimeIncrement, and ClosingAllowableTime are required"
        },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

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
      data: result,
    });

  } catch (err: any) {
    console.error("POST error:", err);
    return NextResponse.json(
      { error: "Failed to create booking setup", message: err.message },
      { status: 500 }
    );
  }
}


// ===== DELETE - Delete booking setup =====
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Booking setup code is required" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();
    const tenantId = process.env.TENANT_ID!;
    const environment = "SandboxDev2";
    const company = "SQUADLETHICS";

    const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_DeleteBookingSetup?Company=${company}`;

    console.log("Deleting booking setup:", code);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _Code: code,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Business Central DELETE error:", {
        status: res.status,
        statusText: res.statusText,
        response: text,
      });
      throw new Error(`Failed to delete (${res.status}): ${res.statusText}`);
    }

    // Handle empty response body
    const contentType = res.headers.get("content-type");
    let result = null;

    if (contentType && contentType.includes("application/json")) {
      const text = await res.text();
      if (text && text.trim()) {
        result = JSON.parse(text);
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete booking setup", message: err.message },
      { status: 500 }
    );
  }
}
