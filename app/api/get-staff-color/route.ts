// app/api/booking/get-staff-colors/route.ts
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
    const { staffCodes } = body; // Array of staff codes to get colors for

    if (!staffCodes || !Array.isArray(staffCodes)) {
      return NextResponse.json({ error: "Staff codes array is required" }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const tenantId = process.env.TENANT_ID!;
    const environment = "SandboxDev2";
    const company = "SQUADLETHICS";

    // Fetch colors for all staff codes
    const staffColors: { [key: string]: { background: string; text: string } } = {};

    for (const staffCode of staffCodes) {
      try {
        const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetBookingStaffColor?Company=${encodeURIComponent(company)}`;

        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _BookingSetupCode: "MAIN",
            _BookingParameterId: "STAFF_COLOR",
            _BookingParameterValueId: staffCode,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          // Assuming the API returns color in format { value: "#3788d8" }
          if (data.value) {
            const backgroundColor = data.value;
            // Determine text color based on background brightness
            const textColor = getContrastColor(backgroundColor);
            staffColors[staffCode] = {
              background: backgroundColor,
              text: textColor
            };
          }
        }
      } catch (error) {
        console.warn(`Failed to get color for staff ${staffCode}:`, error);
        // Continue with other staff codes
      }
    }

    return NextResponse.json({ staffColors });
  } catch (err: any) {
    console.error("POST /api/booking/get-staff-colors failed:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
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