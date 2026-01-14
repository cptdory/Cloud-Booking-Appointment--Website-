// path: /api/one-time-password/otp-generation
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

// ===== Helper: Send OTP to Email =====
async function sendToEmail(
  accessToken: string,
  body: any,
  retry = true
): Promise<any> {
  const tenantId = process.env.TENANT_ID!;
  const environment = process.env.ENVIRONMENT!;
  const company = process.env.COMPANY!;

  const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_OTPGeneration?Company=${company}`;

  const requestBody = {
    _EmailAddress: body._EmailAddress,
    _VerificationType: body._VerificationType,
  };

  console.log("Request body for OTP send:", requestBody);

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
    return await sendToEmail(newToken, body, false);
  }

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

  const json = await res.json();
  console.log("Business Central API response:", json);

  return json;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("OTP send request body:", body);
    
    if (!body._EmailAddress) {
      return NextResponse.json(
        { error: 'Missing required field', message: '_EmailAddress is required' },
        { status: 400 }
      );
    }
    
    const accessToken = await getAccessToken();
    console.log("Access token obtained for OTP send");

    const result = await sendToEmail(accessToken, body);
    console.log("OTP send result:", result);

    const extractedValue = result?.value ?? null;

    return NextResponse.json({
      success: true,
      value: extractedValue, 
    });

  } catch (error: any) {
    console.error('Error sending OTP:', error);
    const errorResponse = createErrorResponse(error, "Failed to send OTP");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}