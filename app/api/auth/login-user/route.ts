import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createErrorResponse } from "@/app/api/utils/bc-error-handler";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { _PortalUsername, _PortalPassword, _IsAdminLogin } = body;

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
        _IsAdminLogin,
      }),
    });

    const bcData = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        bcData.error ? { error: bcData.error } : { error: { code: "BC_Error", message: "Login failed" } },
        { status: res.status }
      );
    }

    // BC RETURNS `value` JSON STRING ARRAY
    let loginResult = null;
    try {
      loginResult = JSON.parse(bcData.value)[0];
    } catch (err) {
      console.error("Parse error:", err);
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

    const isAdmin = String(_IsAdminLogin) === "true";

    if (isAdmin) {
      // ADMIN LOGIN: Validate staff data
      if (!loginResult.StaffCode) {
        return NextResponse.json(
          { error: "Invalid admin credentials" },
          { status: 401 }
        );
      }
    } else {
      // CUSTOMER LOGIN: Must have CustomerNo (adjust based on your BC customer response)
      if (!loginResult.CustomerNo) {
        return NextResponse.json(
          { error: "Invalid customer credentials" },
          { status: 401 }
        );
      }
    }

    // -------------------------------
    // CREATE JWT PAYLOAD
    // -------------------------------

let tokenData;

if (isAdmin) {
  // Determine if this admin is a Global Admin
  const bookingSetup = {
    code: loginResult.BookingSetupCode || "",
    parameterId: loginResult.BookingParameterId || 0,
    parameterValueId: loginResult.BookingParameterValueId || 0
  };

  const isGlobalAdmin =
    bookingSetup.code === "" &&
    bookingSetup.parameterId === 0 &&
    bookingSetup.parameterValueId === 0;

  tokenData = {
    role: isGlobalAdmin ? "global-admin" : "admin",
    username: loginResult.StaffCode,
    name: loginResult.StaffName,
    email: "",
    staffCode: loginResult.StaffCode,
    staffName: loginResult.StaffName,
    staffColor: loginResult.StaffColor || "",
    currentBookingSetup: bookingSetup,
  };

} else {
  // CUSTOMER TOKEN DATA
  tokenData = {
    role: "customer",
    customerNo: loginResult.CustomerNo,
    name: loginResult.Name,
    email: loginResult.EMail || loginResult.Email,
    customerId: loginResult.CustomerId || loginResult.Id
  };
}

    console.log("Creating token for:", tokenData);

    const token = jwt.sign(tokenData, process.env.JWT_SECRET || "dev_secret", {
      expiresIn: "1d",
    });

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
    console.error("Login error:", error);
    const errorResponse = createErrorResponse(error, "Login failed");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
