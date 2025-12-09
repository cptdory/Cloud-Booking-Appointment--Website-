import { NextRequest, NextResponse } from "next/server";
import { parseBCError, createErrorResponse } from "@/app/api/utils/bc-error-handler";

let memoryCache: { access_token: string; expires_at: number } | null = null;

async function getAccessToken() {
  const isVercel = !!process.env.VERCEL;

  if (isVercel) {
    if (memoryCache && Date.now() < memoryCache.expires_at) {
      return memoryCache.access_token;
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

// Safe JSON handler
async function safeParseJSON(res: Response) {
  const text = await res.text();
  if (!text || text.trim() === "") return null;

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse JSON. Raw response:", text);
    throw new Error("Business Central returned non-JSON response");
  }
}

// ===== Helper: create global admin =====
async function createGlobalAdmin(
  accessToken: string,
  body: any,
  retry = true
): Promise<any> {
  const tenantId = process.env.TENANT_ID!;
  const environment = process.env.ENVIRONMENT!;
  const company = process.env.COMPANY!;

  const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_CreateBookingStaffAuth?Company=${company}`;

  const requestBody = {
    _BookingSetupCode: "",
    _BookingParameterId: "0",
    _BookingParameterValueId: "0",
    _StaffCode: "ADMIN",
    _StaffName: body._StaffName || "",
    _StaffColor: "",
    _PortalPassword: body._PortalPassword || "",
  };

  console.log("Request body:", requestBody);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  // Retry token
  if ((res.status === 401 || res.status === 403) && retry) {
    const newToken = await getAccessToken();
    return await createGlobalAdmin(newToken, body, false);
  }

  // Log errors
  if (!res.ok) {
    const text = await res.text();
    console.error("Business Central API error:", {
      status: res.status,
      statusText: res.statusText,
      url,
      response: text,
    });
    const bcError = parseBCError(text);
    throw new Error(JSON.stringify(bcError));
  }

  // FIXED: No more "Unexpected end of JSON input"
  const json = await safeParseJSON(res);
  console.log("Business Central API response:", json);

  return json;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accessToken = await getAccessToken();

    const result = await createGlobalAdmin(accessToken, body);
    console.log("Book slot result:", result);

    return NextResponse.json({
      success: true,
      message: "Global admin created successfully",
    });
  } catch (error: any) {
    console.error("Error global admin:", error);
    const errorResponse = createErrorResponse(error, "Sign up failed");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
