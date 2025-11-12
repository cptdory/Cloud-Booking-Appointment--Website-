import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

let memoryCache: { access_token: string; expires_at: number } | null = null;

// ===== Helper: Get access token =====
async function getAccessToken() {
  const isVercel = !!process.env.VERCEL;
  const cacheFile = path.join(process.cwd(), "app/api/auth/cache/token_cache.json");

  if (isVercel) {
    if (memoryCache && Date.now() < memoryCache.expires_at) {
      return memoryCache.access_token;
    }
  } else if (fs.existsSync(cacheFile)) {
    const cache = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    if (cache.access_token && Date.now() < cache.expires_at) {
      return cache.access_token;
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const tokenRes = await fetch(`${baseUrl}/api/auth/token`);
  if (!tokenRes.ok) throw new Error(`Failed to refresh token (${tokenRes.status})`);
  const data = await tokenRes.json();

  if (isVercel && data.access_token) {
    memoryCache = {
      access_token: data.access_token,
      expires_at: Date.now() + 1000 * 60 * 30,
    };
  }

  return data.access_token;
}

// ===== Helper: Parse and format Business Central response =====
function formatBusinessCentralResponse(data: any): any {
  // If the response has a value property that contains a JSON string
  if (data && data.value && typeof data.value === 'string') {
    try {
      // Parse the JSON string from the value property
      const parsedValue = JSON.parse(data.value);
      
      // If the parsed value is an array, return the first item (should be the setup data)
      if (Array.isArray(parsedValue) && parsedValue.length > 0) {
        return parsedValue[0];
      }
      
      return parsedValue;
    } catch (parseError) {
      console.error("Failed to parse JSON string from value:", parseError);
      return { raw: data.value };
    }
  }
  
  // If data is already a parsed object, return as is
  if (data && typeof data === 'object') {
    return data;
  }
  
  return null;
}

// ===== Helper: Transform the data to a more usable format =====
function transformBookingSetupData(rawData: any) {
  if (!rawData) return null;

  return {
    code: rawData.BookingSetupCode,
    description: rawData.BookingSetupDescription,
    timeIncrement: rawData.BookingSetupTimeIncrement,
    allowableTime: rawData.BookingSetupAllowableTime,
    parameters: rawData.BookingParameter?.map((param: any) => ({
      id: param.BookingParameterID,
      code: param.BookingParameterCode,
      sequence: param.BookingParameterSequence,
      values: param.BookingParameterValue?.map((value: any) => ({
        id: value.BookingParameterValueID,
        code: value.BookingParameterValueCode,
        description: value.BookingParamterDesc
      })) || []
    })) || [],
    serviceStaffRelations: rawData.BookingServiceStaffRela?.map((rel: any) => ({
      serviceId: rel.BookingParameterServiceID,
      serviceCode: rel.BookingParameterServiceCode,
      staffId: rel.BookingParameterValueID,
      staffCode: rel.BookingParameterValueCode
    })) || [],
    serviceDefaults: rawData.BookingServiceDefaultValue?.map((defaultVal: any) => ({
      parameterId: defaultVal.BookingParameterID,
      parameterCode: defaultVal.BookingParameterCode,
      valueId: defaultVal.BookingParameterValueID,
      valueCode: defaultVal.BookingParameterValueCode,
      defaults: defaultVal.DefaultValue?.map((def: any) => ({
        parameterId: def.BookingParameterId,
        valueId: def.BookingParameterValueId,
        valueCode: def.BookingParameterValueCode
      })) || []
    })) || [],
    businessHours: rawData.BookingBusinessHours?.map((hours: any) => ({
      dayOfWeek: hours.DaysOfWeek,
      startTime: hours.StarTime, // Note: typo in API response "StarTime" instead of "StartTime"
      endTime: hours.EndTime,
      timeIncrement: hours.TimeIncrement
    })) || []
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch");

    if (!branch) {
      return NextResponse.json({ error: "Branch parameter is required" }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    const tenantId = process.env.TENANT_ID!;
    const environment = "SandboxDev2";
    const company = "SQUADLETHICS";

    const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetBookingSetup?Company=${company}`;

    const body = JSON.stringify({
      _BookingSetupCode: branch
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Business Central API error:", {
        status: res.status,
        statusText: res.statusText,
        url,
        response: errorText
      });
      return NextResponse.json({ 
        error: "Failed to fetch booking setup", 
        status: res.status, 
        message: res.statusText 
      }, { status: res.status });
    }

    const responseData = await res.json();
    
    // Format the response data
    const formattedData = formatBusinessCentralResponse(responseData);
    
    if (!formattedData) {
      return NextResponse.json({ 
        error: "No booking setup data found for the specified branch",
        branch: branch
      }, { status: 404 });
    }

    // Transform the data to a more usable format
    const transformedData = transformBookingSetupData(formattedData);

    // Return formatted response
    return NextResponse.json({
      success: true,
      branch: branch,
      data: transformedData,
      rawData: formattedData, // Include raw data for reference
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error("Server error in booking/setup:", err);
    return NextResponse.json({ 
      error: "Server error", 
      message: err.message 
    }, { status: 500 });
  }
}