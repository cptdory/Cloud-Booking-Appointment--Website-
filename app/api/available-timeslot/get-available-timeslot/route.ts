import { NextRequest, NextResponse } from "next/server";

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

// ===== Helper: Get available time slots =====
async function getAvailableTimeSlots(
  accessToken: string,
  body: any,
  retry = true
): Promise<any> {
  const tenantId = process.env.TENANT_ID!;
  const environment = process.env.ENVIRONMENT!;
  const company = process.env.COMPANY!;

  const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetAvailableTimeSlot?Company=${company}`;

  const requestBody = {
    _BookingSetupCode: String(body._BookingSetupCode || ''),
    _BookingDate: String(body._BookingDate || ''),
    _BookingParameterCount: String(body._BookingParameterCount || ''),
    _BookingParameterIDs: String(body._BookingParameterIDs || ''),
    _BookingParameterValueIDs: String(body._BookingParameterValueIDs || ''),
    _SkipTimeSlotAvailabilityCheck: String(body._SkipTimeSlotAvailabilityCheck || '')
  };

  console.log("Calling Business Central API for available time slots:", url);
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

  if ((res.status === 401 || res.status === 403) && retry) {
    const newToken = await getAccessToken();
    return await getAvailableTimeSlots(newToken, body, false);
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

  return json;
}

// ===== Helper: Format time for display =====
function formatTimeForDisplay(timeString: string, id: number): string {
  try {
    // Convert "10:30:00" to "10:30 AM"
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const minute = minutes;
    
    let formattedTime;
    if (hour === 0) {
      formattedTime = `12:${minute} AM`;
    } else if (hour === 12) {
      formattedTime = `12:${minute} PM`;
    } else if (hour > 12) {
      formattedTime = `${hour - 12}:${minute} PM`;
    } else {
      formattedTime = `${hour}:${minute} AM`;
    }
    
    // Return the formatted time with ID to ensure uniqueness
    return formattedTime;
  } catch (error) {
    console.error("Error formatting time:", error);
    return timeString;
  }
}

// Then update the parsing function:
function parseTimeSlotsResponse(response: any) {
  try {
    console.log("Parsing time slots response:", response);
    
    // The response has a value field that contains a JSON string
    if (response.value && typeof response.value === 'string') {
      const parsedData = JSON.parse(response.value);
      console.log("Parsed time slots data:", parsedData);
      
      if (Array.isArray(parsedData)) {
        // Transform the data to match our frontend expectations
        const timeSlots = parsedData.map((slot: any) => ({
          id: slot.Id, // Include the ID for uniqueness
          time: formatTimeForDisplay(slot.Time, slot.Id),
          available: slot.IsAvailable === 'Yes' && slot.AllowBooking === 'Yes'
        }));
        
        return timeSlots;
      }
    }
    
    return [];
  } catch (error) {
    console.error("Error parsing time slots response:", error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Available slots request body:", body);
    
    const accessToken = await getAccessToken();
    console.log("Access token obtained for available slots");

    const response = await getAvailableTimeSlots(accessToken, body);
    console.log("Available time slots raw response:", response);

    // Parse the response to extract the time slots
    const timeSlots = parseTimeSlotsResponse(response);
    console.log("Parsed time slots:", timeSlots);

    return NextResponse.json({ value: timeSlots });
  } catch (error: any) {
    console.error('Error fetching available time slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available time slots', message: error.message },
      { status: 500 }
    );
  }
}