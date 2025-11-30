import { NextResponse } from "next/server";

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

export async function GET() {
  try {
    console.log("GET /api/customer/get-customers called");
    const accessToken = await getAccessToken();
    console.log("Access token obtained");

    const tenantId = process.env.TENANT_ID!;
    const environment = process.env.ENVIRONMENT!;
    const company = process.env.COMPANY!;

    const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetCustomers?Company=${company}`;

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

    if (!res.ok) {
      const text = await res.text();
      console.error("Business Central API error:", {
        status: res.status,
        statusText: res.statusText,
        response: text,
      });
      throw new Error(`Failed request (${res.status}): ${res.statusText}`);
    }

    const json = await res.json();
    console.log("Business Central API response:", json);

    if (!json?.value) {
      console.warn("No value in response, returning empty array");
      return NextResponse.json({ value: [] });
    }

    // Parse the stringified JSON if needed
    let value = json.value;
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        value = [];
      }
    }

    const finalData = Array.isArray(value) ? value : [value];
    console.log("Final customers data:", finalData);

    return NextResponse.json({ value: finalData });
  } catch (err: any) {
    console.error("GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch customers", message: err.message },
      { status: 500 }
    );
  }
}