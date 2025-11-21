import { NextResponse } from "next/server";

let memoryCache: { access_token: string; expires_at: number } | null = null;

async function getAccessToken() {
  const isVercel = !!process.env.VERCEL;
  if (isVercel && memoryCache && Date.now() < memoryCache.expires_at) {
    return memoryCache.access_token;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const tokenRes = await fetch(`${baseUrl}/api/auth/token`);
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error("Token fetch failed:", text);
    throw new Error("Failed to refresh token");
  }

  const data = await tokenRes.json();
  if (isVercel && data.access_token) {
    memoryCache = {
      access_token: data.access_token,
      expires_at: Date.now() + 1000 * 60 * 30,
    };
  }
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📨 Received request body:", body);
    
    const { _CustomerNo, _PortalPassword } = body;

    if (!_CustomerNo || !_PortalPassword) {
      console.log("❌ Missing fields:", { _CustomerNo, _PortalPassword });
      return NextResponse.json({ 
        error: "Missing required fields: _CustomerNo and _PortalPassword are required" 
      }, { status: 400 });
    }

    if (!process.env.TENANT_ID) {
      return NextResponse.json({ error: "TENANT_ID not set" }, { status: 500 });
    }

    const accessToken = await getAccessToken();
    const tenantId = process.env.TENANT_ID;
    const environment = "SandboxDev2";
    const company = "SQUADLETHICS";

    // Try different possible endpoints - one of these might be correct
    const possibleEndpoints = [
      `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/Company('${company}')/UpdateCustomerPassword`,
      `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_UpdateCustomerPassword?Company=${company}`,
      `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/UpdateCustomerPassword?Company=${company}`,
    ];

    let lastError = null;
    
    for (const url of possibleEndpoints) {
      try {
        console.log("🔄 Trying endpoint:", url);
        console.log("📤 Sending data to BC:", {
          _CustomerNo,
          _PortalPassword
        });

        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            _CustomerNo: _CustomerNo,
            _PortalPassword: _PortalPassword,
          }),
        });

        const text = await res.text();
        console.log(`📥 Response from ${url}:`, {
          status: res.status,
          statusText: res.statusText,
          body: text
        });

        if (res.ok) {
          let data = null;
          try {
            data = text ? JSON.parse(text) : null;
          } catch (e) {
            data = { raw: text };
          }
          return NextResponse.json({ 
            success: true, 
            message: "Password updated successfully",
            data 
          });
        } else {
          lastError = { status: res.status, body: text };
        }
      } catch (err) {
        console.error(`❌ Error with endpoint ${url}:`, err);
        lastError = err;
      }
    }

    // If all endpoints failed
    return NextResponse.json({ 
      error: "All API endpoints failed",
      lastError: lastError 
    }, { status: 400 });

  } catch (err: any) {
    console.error("❌ POST /api/update-customer-password failed:", err);
    return NextResponse.json({ 
      error: err.message || "Internal Server Error" 
    }, { status: 500 });
  }
}