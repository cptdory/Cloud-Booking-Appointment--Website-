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

async function fetchCustomerData(accessToken: string, searchValue: string): Promise<any> {
  const tenantId = process.env.TENANT_ID!;
  const environment = "SandboxDev2";
  const company = "SQUADLETHICS";

  const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetCustomer?Company=${company}`;

  const requestBody = {
    _CustomerNoOrEmailAddress: searchValue
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Business Central API error:", {
      status: res.status,
      statusText: res.statusText,
      response: text,
    });
    throw new Error(`Failed to fetch customer data: ${res.status}`);
  }

  return await res.json();
}

// POST handler for customer profile lookup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email || body._emailOrCustomerNo;
    const customerNo = body.customerNo || body._CustomerNoOrEmailAddress;
    
    if (!email && !customerNo) {
      return NextResponse.json(
        { error: 'Either email or customer number is required' },
        { status: 400 }
      );
    }

    console.log("🔍 Searching customer with:", { email, customerNo });

    const accessToken = await getAccessToken();
    let result;
    let usedSearchType = '';

    // Try email first if available
    if (email) {
      console.log("📧 Trying search by email:", email);
      result = await fetchCustomerData(accessToken, email);
      usedSearchType = 'email';
      
      const customersByEmail = JSON.parse(result.value);
      if (customersByEmail && customersByEmail.length > 0) {
        console.log("✅ Found customer by email");
        const customerData = customersByEmail[0];
        const profileData = transformCustomerData(customerData);
        return NextResponse.json(profileData);
      }
      
      console.log("❌ No customer found by email, trying customer number...");
    }

    // If no email or no results by email, try customer number
    if (customerNo) {
      console.log("🔢 Trying search by customer number:", customerNo);
      result = await fetchCustomerData(accessToken, customerNo);
      usedSearchType = 'customerNo';
      
      const customersByNo = JSON.parse(result.value);
      if (customersByNo && customersByNo.length > 0) {
        console.log("✅ Found customer by customer number");
        const customerData = customersByNo[0];
        const profileData = transformCustomerData(customerData);
        return NextResponse.json(profileData);
      }
    }

    console.log("❌ No customer found with either email or customer number");
    return NextResponse.json(
      { error: 'Customer not found' },
      { status: 404 }
    );

  } catch (error: any) {
    console.error('Error in customer lookup:', error);
    return NextResponse.json(
      { error: "Failed to lookup customer", message: error.message },
      { status: 500 }
    );
  }
}

// Helper function to transform customer data
function transformCustomerData(customerData: any) {
  return {
    name: customerData.Name || "",
    phoneNo: customerData.PhoneNo || "",
    email: customerData.EMail || "",
    address: customerData.Address || "",
    address2: customerData.Address2 || "",
    age: customerData.Age || 0,
    birthDate: customerData.BirthDate ? customerData.BirthDate.split('T')[0] : "",
    customerNo: customerData.CustomerNo || ""
  };
}

// GET handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const customerNo = searchParams.get('customerNo');
    
    if (!email && !customerNo) {
      return NextResponse.json(
        { error: 'Either email or customerNo query parameter is required' },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();
    let result;

    // Try email first
    if (email) {
      result = await fetchCustomerData(accessToken, email);
      const customers = JSON.parse(result.value);
      if (customers && customers.length > 0) {
        const customerData = customers[0];
        const profileData = transformCustomerData(customerData);
        return NextResponse.json(profileData);
      }
    }

    // Then try customer number
    if (customerNo) {
      result = await fetchCustomerData(accessToken, customerNo);
      const customers = JSON.parse(result.value);
      if (customers && customers.length > 0) {
        const customerData = customers[0];
        const profileData = transformCustomerData(customerData);
        return NextResponse.json(profileData);
      }
    }

    return NextResponse.json(
      { error: 'Customer not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error fetching customer data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer data', message: error.message },
      { status: 500 }
    );
  }
}