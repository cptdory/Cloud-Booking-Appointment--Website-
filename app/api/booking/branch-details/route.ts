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

// ===== Helper: Get specific branch details =====
async function getBranchDetails(
  accessToken: string,
  branchCode: string,
  retry = true
): Promise<any> {
  const tenantId = process.env.TENANT_ID!;
  const environment = "SandboxDev2";
  const company = "SQUADLETHICS";

  const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetBookingSetup?Company=${company}`;

  console.log("Calling Business Central API for branch details:", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      _BookingSetupCode: branchCode,
    }),
  });

  if ((res.status === 401 || res.status === 403) && retry) {
    const newToken = await getAccessToken();
    return await getBranchDetails(newToken, branchCode, false);
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

// ===== Helper: Parse the branch details response =====
function parseBranchDetails(branchDetails: any) {
  try {
    console.log("Parsing branch details:", branchDetails);
    
    // The response has a value field that contains a JSON string
    if (branchDetails.value && typeof branchDetails.value === 'string') {
      const parsedData = JSON.parse(branchDetails.value);
      console.log("Parsed branch data:", parsedData);
      
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        const branchData = parsedData[0];
        
        // Extract services, staff, and rooms from BookingParameter
        let services: any[] = [];
        let staff: any[] = [];
        let rooms: any[] = [];

        if (branchData.BookingParameter && Array.isArray(branchData.BookingParameter)) {
          branchData.BookingParameter.forEach((param: any) => {
            if (param.BookingParameterCode === 'Services' && param.BookingParameterValue) {
              services = param.BookingParameterValue.map((value: any) => ({
                id: value.BookingParameterValueId?.toString(),
                name: value.BookingParamterValueDescription || value.BookingParameterValueCode
              }));
            } else if (param.BookingParameterCode === 'Staff' && param.BookingParameterValue) {
              staff = param.BookingParameterValue.map((value: any) => ({
                id: value.BookingParameterValueId?.toString(),
                name: value.BookingParamterValueDescription || value.BookingParameterValueCode
              }));
            } else if (param.BookingParameterCode === 'Bed' && param.BookingParameterValue) {
              rooms = param.BookingParameterValue.map((value: any) => ({
                id: value.BookingParameterValueId?.toString(),
                name: value.BookingParamterValueDescription || value.BookingParameterValueCode
              }));
            }
          });
        }

        return {
          services,
          staff,
          rooms,
          branchInfo: {
            code: branchData.BookingSetupCode,
            description: branchData.BookingSetupDescription,
            timeIncrement: branchData.BookingSetupTimeIncrement,
            allowableTime: branchData.BookingSetupAllowableTime
          }
        };
      }
    }
    
    return { services: [], staff: [], rooms: [], branchInfo: null };
  } catch (error) {
    console.error("Error parsing branch details:", error);
    return { services: [], staff: [], rooms: [], branchInfo: null };
  }
}

// ===== GET - Fetch branch details with services, staff, and rooms =====
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchCode = searchParams.get("code");

    if (!branchCode) {
      return NextResponse.json(
        { error: "Branch code is required" },
        { status: 400 }
      );
    }

    console.log("GET /api/booking/branch-details called for branch:", branchCode);
    const accessToken = await getAccessToken();

    // Fetch branch details
    const branchDetails = await getBranchDetails(accessToken, branchCode);
    
    // Parse the branch details to extract services, staff, and rooms
    const { services, staff, rooms, branchInfo } = parseBranchDetails(branchDetails);

    const responseData = {
      branch: branchInfo,
      services,
      staff, 
      rooms,
    };

    console.log("Final response data:", responseData);

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch branch details", message: err.message },
      { status: 500 }
    );
  }
}