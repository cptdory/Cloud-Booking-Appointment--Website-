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
      expires_at: Date.now() + 1000 * 60 * 30, // 30 mins
    };
  }

  return data.access_token;
}

async function fetchCustomerData(accessToken: string, customerNo: string): Promise<any> {
  const tenantId = process.env.TENANT_ID!;
  const environment = "SandboxDev2";
  const company = "SQUADLETHICS";

  const url = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/ODataV4/BookingAppointment_GetCustomer?Company=${company}`;

  const requestBody = {
    _CustomerNo: customerNo
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customerNo = body.customerNo || body._CustomerNo;

    if (!customerNo) {
      return NextResponse.json(
        { error: "Customer number is required" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();
    const result = await fetchCustomerData(accessToken, customerNo);

    const customers = JSON.parse(result.value);
    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(transformCustomerData(customers[0]));

  } catch (error: any) {
    console.error("Error in customer lookup:", error);
    return NextResponse.json(
      { error: "Failed to lookup customer", message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerNo = searchParams.get("customerNo");

    if (!customerNo) {
      return NextResponse.json(
        { error: "customerNo query parameter is required" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();
    const result = await fetchCustomerData(accessToken, customerNo);

    const customers = JSON.parse(result.value);
    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(transformCustomerData(customers[0]));

  } catch (error: any) {
    console.error("Error fetching customer data:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer data", message: error.message },
      { status: 500 }
    );
  }
}

function transformCustomerData(customerData: any) {
  return {
    name: customerData.Name || "",
    phoneNo: customerData.PhoneNo || "",
    email: customerData.EMail || "",
    address: customerData.Address || "",
    address2: customerData.Address2 || "",
    age: customerData.Age || 0,
    birthDate: customerData.BirthDate ? customerData.BirthDate.split("T")[0] : "",
    customerNo: customerData.CustomerNo || ""
  };
}
