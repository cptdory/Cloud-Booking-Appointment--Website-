import { NextResponse } from "next/server";

let memoryCache: { access_token: string; expires_at: number } | null = null;

// Helper: Fetch/refresh Access Token
async function getAccessToken() {
  const isVercel = !!process.env.VERCEL;
  if (isVercel && memoryCache && Date.now() < memoryCache.expires_at) {
    console.log("🔑 Using cached access token");
    return memoryCache.access_token;
  }

  console.log("🔑 Fetching new access token...");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const tokenRes = await fetch(`${baseUrl}/api/auth/token`);
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error("❌ Token fetch failed:", text);
    throw new Error("Failed to refresh token");
  }

  const data = await tokenRes.json();
  console.log("✅ Access token obtained successfully");

  if (isVercel && data.access_token) {
    memoryCache = {
      access_token: data.access_token,
      expires_at: Date.now() + 1000 * 60 * 30, // cache 30 min
    };
    console.log("🔑 Token cached for 30 minutes");
  }

  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { _BookingParameterValueId, _BookingSetupCode, _BookingParameterId } = body;

    // Validate required fields
    if (!_BookingParameterId || !_BookingParameterValueId) {
      console.error("❌ Missing required fields");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.TENANT_ID) {
      console.error("❌ TENANT_ID environment variable not set");
      return NextResponse.json({ error: "TENANT_ID not set" }, { status: 500 });
    }

    console.log("🔑 Getting access token...");
    const accessToken = await getAccessToken();
    const tenantId = process.env.TENANT_ID;
    const environment = process.env.ENVIRONMENT!;
    const company = process.env.COMPANY!;

    try {
      const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetBookingStaffEmail?Company=${encodeURIComponent(company)}`;

      const bcRequestBody = {
        _BookingSetupCode: _BookingSetupCode || "",
        _BookingParameterId: _BookingParameterId,
        _BookingParameterValueId: _BookingParameterValueId,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bcRequestBody),
      });

      console.log(`📥 Business Central response - status:`, res.status);

      let data: any = null;
      const text = await res.text();
      
      try {
        data = text ? JSON.parse(text) : null;
        console.log(`✅ Successfully parsed JSON response:`, data);
      } catch (err) {
        console.warn(`⚠️ Failed to parse BC response as JSON:`, text);
        return NextResponse.json({ 
          error: "Failed to parse response from Business Central" 
        }, { status: 500 });
      }

      if (!res.ok) {
        console.warn(`⚠️ Business Central API error:`, {
          status: res.status,
          statusText: res.statusText,
          data: data,
        });
        const errorMessage = data?.error?.message || data?.message || `Business Central API returned ${res.status}`;
        return NextResponse.json({ 
          error: errorMessage
        }, { status: res.status });
      }

      // Extract email from response
      // Response format: { value: '[{"StaffEmail":"john.palma@cloudsteps.com.ph"}]' }
      let email = "";
      
      if (data?.value) {
        try {
          // Parse the value if it's a string
          const parsedValue = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          
          if (Array.isArray(parsedValue) && parsedValue.length > 0 && parsedValue[0]?.StaffEmail) {
            email = parsedValue[0].StaffEmail;
          } else if (parsedValue?.StaffEmail) {
            email = parsedValue.StaffEmail;
          }
        } catch (parseErr) {
          console.warn("Failed to parse value field:", parseErr);
        }
      }
      
      return NextResponse.json({ 
        email,
        success: true 
      });

    } catch (error) {
      console.warn(`⚠️ Failed to get email:`, error);
      return NextResponse.json({ 
        error: "Failed to fetch email from Business Central",
        email: ""
      }, { status: 500 });
    }
    
  } catch (err: any) {
    console.error("❌ API route error:", err);
    return NextResponse.json({ 
      error: err.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
