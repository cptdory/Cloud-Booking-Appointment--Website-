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

    const { _BookingParameterValueIds, _BookingParameterValueId, _BookingSetupCode, _BookingParameterId } = body;

    // Validate required fields
    if (!_BookingParameterId) {
      console.error("❌ Missing _BookingParameterId");
      return NextResponse.json({ error: "_BookingSetupCode is required" }, { status: 400 });
    }

    // Check if we have array input or single value input
    const hasArrayInput = _BookingParameterValueIds && Array.isArray(_BookingParameterValueIds) && _BookingParameterValueIds.length > 0;
    const hasSingleInput = _BookingParameterValueId && _BookingParameterId;

    if (!hasArrayInput && !hasSingleInput) {
      console.error("❌ Missing staff identifiers:", { 
        _BookingParameterValueIds, 
        _BookingParameterValueId, 
        _BookingParameterId 
      });
      return NextResponse.json({ 
        error: "Either _BookingParameterValueIds array or both _BookingParameterValueId and _BookingParameterId are required" 
      }, { status: 400 });
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

    // Fetch colors for staff codes
    const staffColors: { [key: string]: { background: string; text: string } } = {};

    // Prepare staff list to process
    const staffToProcess: Array<{ parameterValueId: string; parameterId?: string }> = [];

    if (hasArrayInput) {
      staffToProcess.push(..._BookingParameterValueIds.map((id: string) => ({
        parameterValueId: id,
        parameterId: _BookingParameterId
      })));
    } else if (hasSingleInput) {
      // Single input - use provided parameter ID
      staffToProcess.push({
        parameterValueId: _BookingParameterValueId,
        parameterId: _BookingParameterId.toString() // Ensure it's a string
      });
    }

    console.log(`🎨 Processing ${staffToProcess.length} staff members`);

    for (const staff of staffToProcess) {
      try {
        console.log(`🎨 Fetching color for staff: ${staff.parameterValueId} with parameterId: ${staff.parameterId}`);
        
        const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetBookingStaffColor?Company=${encodeURIComponent(company)}`;

        const bcRequestBody = {
          _BookingSetupCode: _BookingSetupCode,
          _BookingParameterId: staff.parameterId,
          _BookingParameterValueId: staff.parameterValueId,
        };

        console.log(`📤 Sending to Business Central for ${staff.parameterValueId}:`, JSON.stringify(bcRequestBody, null, 2));

        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bcRequestBody),
        });

        console.log(`📥 Business Central response for ${staff.parameterValueId} - status:`, res.status);

        let data: any = null;
        const text = await res.text();
        
        try {
          data = text ? JSON.parse(text) : null;
          console.log(`✅ Successfully parsed JSON response for ${staff.parameterValueId}:`, data);
        } catch (err) {
          console.warn(`⚠️ Failed to parse BC response for ${staff.parameterValueId} as JSON:`, text);
          continue; // Skip this staff code and continue with others
        }

        if (!res.ok) {
          console.warn(`⚠️ Business Central API error for ${staff.parameterValueId}:`, {
            status: res.status,
            statusText: res.statusText,
            data: data,
            text: text
          });
          continue; // Skip this staff code and continue with others
        }

        // Parse the response to get the color
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
            staffColors[staff.parameterValueId] = {
              background: backgroundColor,
              text: textColor
            };
            console.log(`✅ Found color for ${staff.parameterValueId}: ${backgroundColor}`);
          } else {
            console.warn(`⚠️ No StaffColor found for staff ${staff.parameterValueId}`);
          }
        }

      } catch (error) {
        console.warn(`⚠️ Failed to get color for staff ${staff.parameterValueId}:`, error);
        // Continue with other staff codes
      }
    }
    
    console.log(`✅ Returning colors for ${Object.keys(staffColors).length} staff members`);
    return NextResponse.json({ staffColors });
  } catch (err: any) {
    console.error("❌ API route error:", err);
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