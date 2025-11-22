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

// ===== Helper: Format date to MM/DD/YYYY =====
function formatDateToMMDDYYYY(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided, returning original:', dateString);
      return dateString;
    }
    
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

// ===== Helper: Book time slot =====
async function bookTimeSlot(
  accessToken: string,
  body: any,
  retry = true
): Promise<any> {
  const tenantId = process.env.TENANT_ID!;
  const environment = "SandboxDev2";
  const company = "SQUADLETHICS";

  const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_BookAvailableTimeSlot?Company=${company}`;

  // Format the date to MM/DD/YYYY before sending
  const formattedDate = formatDateToMMDDYYYY(body._BookingDate || '');

  // Convert all values to strings to match Business Central expectations
  const requestBody = {
    _BookingSetupCode: String(body._BookingSetupCode || ''),
    _BookingDate: formattedDate, // Use the formatted date
    _BookingStartTime: String(body._BookingStartTime || ''),
    _BookingParameterCount: String(body._BookingParameterCount || ''),
    _BookingParameterIDs: String(body._BookingParameterIDs || ''),
    _BookingParameterValueIDs: String(body._BookingParameterValueIDs || ''),
    _CustomerNo: String(body._CustomerNo || ''),
    _BookingNote: String(body._BookingNote || '')
  };

  console.log("Calling Business Central API to book time slot:", url);
  console.log("Original date:", body._BookingDate);
  console.log("Formatted date:", formattedDate);
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
    return await bookTimeSlot(newToken, body, false);
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Book slot request body:", body);
    
    const accessToken = await getAccessToken();
    console.log("Access token obtained for book slot");

    const result = await bookTimeSlot(accessToken, body);
    console.log("Book slot result:", result);

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking', message: error.message },
      { status: 500 }
    );
  }
}