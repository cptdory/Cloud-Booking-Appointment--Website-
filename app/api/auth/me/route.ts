import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic"; // <-- Important

export function GET(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    return NextResponse.json({ authenticated: true, user: decoded });
  } catch (err) {
    return NextResponse.json({ authenticated: false });
  }
}
