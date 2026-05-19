import { NextResponse } from "next/server";
import { authService } from "@/services/business-central/auth.service";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { emailAddress, password, isUserLogin, tenantId } = body;
    const result = await authService.loginAuth(emailAddress,password,isUserLogin);

    const parsed = JSON.parse(result?.value);
    const user = parsed?.[0];

    if (!user) {
      return NextResponse.json(
        { error: "Invalid Staff Credentials" },
        { status: 401 }
      );
    }
    const defaultBranch = user?.Branches?.find((b: any) => b.Default === true) ?? user?.Branches?.[0];
    const sessionData = isUserLogin === "true"
        ? {
            logged_in: true,
            user: {
              // booking_setup_code: user?.BranchCode ?? "MAIN",
              booking_setup_code: defaultBranch?.BranchCode ?? "",
              staff_code: user?.StaffCode,
              name: user?.Name,
              email: user?.Email,
              is_admin: !!user?.Admin,
              role: "user",
              tenant_id: tenantId,
            },
          }
        : {
            logged_in: true,
            user: {
              customer_number: user?.CustomerNo,
              name: user?.Name,
              name2: user?.Name2,
              phone_number: user?.PhoneNo,
              email: user?.EMail,
              address: user?.Address,
              address2: user?.Address2,
              age: user?.Age,
              birthdate: user?.BirthDate,
              role: "customer",
              tenant_id: tenantId,
            },
          };

    const token = await createSession(sessionData);

    const res = NextResponse.json({
      success: true,
      user: sessionData.user,
    });

    res.cookies.set("auth_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      {
        error:err?.response?.data?.error?.message || "Login failed",
      },
      { status: err?.response?.status || 500 }
    );
  }
}