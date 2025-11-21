import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { _PortalUsername, _PortalPassword, _IsAdminLogin } = body;

    console.log('Login attempt:', { _PortalUsername, _IsAdminLogin });

    if (!_PortalUsername || !_PortalPassword) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      );
    }

    // CALL BUSINESS CENTRAL LOGIN API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/auth/login-bc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _PortalUsername,
        _PortalPassword,
        _IsAdminLogin
      }),
    });

    const bcData = await res.json();
    console.log('BC API Response:', bcData);

    if (!res.ok) {
      return NextResponse.json(
        { error: bcData.error || "Login failed" },
        { status: res.status }
      );
    }

    // BC RETURNS `value` JSON STRING ARRAY
    let loginResult = null;
    try {
      loginResult = JSON.parse(bcData.value)[0];
      console.log('Parsed login result:', loginResult);
    } catch (err) {
      console.error('Parse error:', err);
      return NextResponse.json(
        { error: "Invalid BC response format" },
        { status: 500 }
      );
    }

    if (!loginResult) {
      return NextResponse.json(
        { error: "Invalid login response" },
        { status: 401 }
      );
    }

    // Check if login was successful based on your BC API response structure
    // If BC returns empty staff data, consider it failed
    const isAdmin = String(_IsAdminLogin) === "true";

    if (isAdmin) {
      // ADMIN LOGIN: Validate staff data
      if (!loginResult.StaffCode || !loginResult.StaffName) {
        console.log('Admin validation failed - missing staff fields');
        return NextResponse.json(
          { error: "Invalid admin credentials" },
          { status: 401 }
        );
      }
    } else {
      // CUSTOMER LOGIN: Must have CustomerNo (adjust based on your BC customer response)
      if (!loginResult.CustomerNo) {
        console.log('Customer validation failed - missing CustomerNo');
        return NextResponse.json(
          { error: "Invalid customer credentials" },
          { status: 401 }
        );
      }
    }

    // -------------------------------
    // CREATE JWT PAYLOAD
    // -------------------------------
    const tokenData = isAdmin
      ? {
      role: "admin",
      username: loginResult.StaffCode,
      name: loginResult.StaffName,
      email: "",
      staffCode: loginResult.StaffCode,
      staffName: loginResult.StaffName,
      staffColor: loginResult.StaffColor || "",
      // Include current booking setup context
      currentBookingSetup: {
        code: loginResult.BookingSetupCode || "",
        parameterId: loginResult.BookingParameterId || 0,
        parameterValueId: loginResult.BookingParameterValueId || 0
      }
    }
      : {
          role: "customer",
          customerNo: loginResult.CustomerNo,
          name: loginResult.Name,
          email: loginResult.EMail || loginResult.Email,
          customerId: loginResult.CustomerId || loginResult.Id
        };

    console.log('Creating token for:', tokenData);

    const token = jwt.sign(
      tokenData,
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "1d" }
    );

    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully",
      user: tokenData,
    });

    // SET SESSION COOKIE
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}