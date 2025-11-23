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

    const { _BookingParameterValueIds, _BookingSetupCode } = body;

    if (!_BookingParameterValueIds || !Array.isArray(_BookingParameterValueIds) || _BookingParameterValueIds.length === 0) {
      console.error("❌ Missing or invalid _BookingParameterValueIds:", _BookingParameterValueIds);
      return NextResponse.json({ error: "_BookingParameterValueIds array is required" }, { status: 400 });
    }

    if (!_BookingSetupCode) {
      console.error("❌ Missing _BookingSetupCode");
      return NextResponse.json({ error: "_BookingSetupCode is required" }, { status: 400 });
    }

    if (!process.env.TENANT_ID) {
      console.error("❌ TENANT_ID environment variable not set");
      return NextResponse.json({ error: "TENANT_ID not set" }, { status: 500 });
    }

    console.log("🔑 Getting access token...");
    const accessToken = await getAccessToken();
    const tenantId = process.env.TENANT_ID;
    const environment = "SandboxDev2";
    const company = "SQUADLETHICS";

    // Fetch colors for all staff codes
    const staffColors: { [key: string]: { background: string; text: string } } = {};

    for (const _BookingParameterValueId of _BookingParameterValueIds) {
      try {
        console.log(`🎨 Fetching color for staff: ${_BookingParameterValueId}`);
        
        const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetBookingStaffColor?Company=${encodeURIComponent(company)}`;

        const bcRequestBody = {
          _BookingSetupCode: _BookingSetupCode,
          _BookingParameterId: "5",
          _BookingParameterValueId: _BookingParameterValueId,
        };

        console.log(`📤 Sending to Business Central for ${_BookingParameterValueId}:`, JSON.stringify(bcRequestBody, null, 2));

        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bcRequestBody),
        });

        console.log(`📥 Business Central response for ${_BookingParameterValueId} - status:`, res.status);

        let data: any = null;
        const text = await res.text();
        
        try {
          data = text ? JSON.parse(text) : null;
          console.log(`✅ Successfully parsed JSON response for ${_BookingParameterValueId}:`, data);
        } catch (err) {
          console.warn(`⚠️ Failed to parse BC response for ${_BookingParameterValueId} as JSON:`, text);
          continue; // Skip this staff code and continue with others
        }

        if (!res.ok) {
          console.warn(`⚠️ Business Central API error for ${_BookingParameterValueId}:`, {
            status: res.status,
            statusText: res.statusText,
            data: data,
            text: text
          });
          continue; // Skip this staff code and continue with others
        }

        // Assuming the API returns color in format { value: "#3788d8" }
if (data && data.value) {
  let backgroundColor = "";

  try {
    const parsed = JSON.parse(data.value); // Convert string → array/object

    if (Array.isArray(parsed) && parsed[0]?.StaffColor) {
      backgroundColor = parsed[0].StaffColor;
    }
  } catch (e) {
    console.warn("⚠️ Value is not valid JSON:", data.value);
  }

  if (backgroundColor) {
    const textColor = getContrastColor(backgroundColor);
    staffColors[_BookingParameterValueId] = {
      background: backgroundColor,
      text: textColor
    };
  } else {
    console.warn(`⚠️ No StaffColor found for staff ${_BookingParameterValueId}`);
  }
}


      } catch (error) {
        console.warn(`⚠️ Failed to get color for staff ${_BookingParameterValueId}:`, error);
        // Continue with other staff codes
      }
    }
    
    return NextResponse.json({ staffColors });
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message || "Internal Server Error" 
    }, { status: 500 });
  }
}

// Helper function to determine text color based on background brightness
function getContrastColor(hexColor: string): string {
  // Remove the # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#ffffff';
}