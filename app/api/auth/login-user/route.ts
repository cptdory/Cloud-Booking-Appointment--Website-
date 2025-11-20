import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailOrCustomerNo = body._emailOrCustomerNo;
    const password = body.password;

    if (!emailOrCustomerNo) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/auth/login-bc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _emailOrCustomerNo: emailOrCustomerNo }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Invalid login credentials. Please try again." },
        { status: 401 }
      );
    }

    const data = await res.json();
    const bcData = JSON.parse(data.value)[0];

    if (!bcData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Password check
    if (password !== bcData.PortalPassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // JWT payload
    const tokenData = {
      customerNo: bcData.CustomerNo,
      name: bcData.Name,
      email: bcData.EMail,
      role: "user",
    };

    // Create signed token
    const token = jwt.sign(
      tokenData,
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "1d" }
    );

    // Response
    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully",
      user: tokenData,
    });

    // Set HttpOnly cookie
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response;

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
