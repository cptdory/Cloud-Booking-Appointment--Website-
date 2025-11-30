import { NextRequest, NextResponse } from "next/server";

let memoryCache: { access_token: string; expires_at: number } | null = null;

async function getAccessToken() {
  const isVercel = !!process.env.VERCEL;

  if (isVercel && memoryCache && Date.now() < memoryCache.expires_at) {
    return memoryCache.access_token;
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

async function updateCustomerInBC(accessToken: string, customerData: any, retry = true): Promise<any> {
  const tenantId = process.env.TENANT_ID!;
  const environment = process.env.ENVIRONMENT!;
  const company = process.env.COMPANY!;

  const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_UpdateCustomerDetails?Company=${company}`;

  // Format the birth date to match your Postman example (MM/DD/YYYY)
  const formatBirthDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const requestBody = {
    _CustomerNo: customerData.customerNo,
    _Name: customerData.name,
    _Name2: "", 
    _PhoneNo: customerData.phoneNo,
    _Email: customerData.email,
    _Address: customerData.address,
    _Address2: customerData.address2,
    _Age: customerData.age?.toString() || "0",
    _BirthDate: formatBirthDate(customerData.birthDate),
  };

  console.log("Updating customer in Business Central:", requestBody);

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
    return await updateCustomerInBC(newToken, customerData, false);
  }

  if (!res.ok) {
    const text = await res.text();
    console.error("Business Central API error:", {
      status: res.status,
      statusText: res.statusText,
      response: text,
    });
    throw new Error(`Failed to update customer: ${res.status}`);
  }

  return await res.json();
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received update request:", body);

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Get customer number from auth (you might want to get this from the session)
    const authRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/me`, {
      headers: {
        Cookie: request.headers.get('cookie') || ''
      }
    });

    let customerNo = body.customerNo;
    
    if (!customerNo && authRes.ok) {
      const authData = await authRes.json();
      customerNo = authData.user?.customerNo;
    }

    if (!customerNo) {
      return NextResponse.json(
        { error: "Customer number is required" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();
    
    // Prepare customer data for Business Central
    const customerData = {
      customerNo: customerNo,
      name: body.name,
      name2: body.name2 || body.name, // Use name as fallback for Name2
      phoneNo: body.phoneNo || "",
      email: body.email,
      address: body.address || "",
      address2: body.address2 || "",
      age: body.age || 0,
      birthDate: body.birthDate || "",
    };

    const result = await updateCustomerInBC(accessToken, customerData);

    console.log("Business Central update response:", result);

    // Check if the update was successful
    // The response structure might be different, adjust based on actual BC response
    if (result.value && typeof result.value === 'string') {
      try {
        const parsedResult = JSON.parse(result.value);
        if (parsedResult.success === false) {
          throw new Error(parsedResult.message || "Update failed");
        }
      } catch (e) {
        // If parsing fails, assume success for now
        console.log("Could not parse response, assuming success");
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Profile updated successfully",
      data: result 
    });

  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', message: error.message },
      { status: 500 }
    );
  }
}

// Optional: Also support POST method for flexibility
export async function POST(request: NextRequest) {
  return PUT(request);
}