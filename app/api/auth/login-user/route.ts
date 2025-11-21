import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// In /api/auth/login-user route.ts - Replace the current logic:
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

    // Call Business Central login API
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

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.error || "Login failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    // Check if login was successful based on BC response
    // This depends on what your BC API actually returns
    const loginResult = JSON.parse(data.value)[0];
    
    // Assuming BC returns a success flag or customer data
    if (!loginResult || !loginResult.CustomerNo) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create JWT token
    const tokenData = {
      customerNo: loginResult.CustomerNo,
      name: loginResult.Name,
      email: loginResult.EMail,
      role: "user",
    };

    const token = jwt.sign(
      tokenData,
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "1d" }
    );

    // Set cookie and return response
    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully",
      user: tokenData,
    });

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;

  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
