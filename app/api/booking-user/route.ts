import { NextResponse } from "next/server";
import { bookingUserService } from "@/services/business-central/booking-user.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      bookingSetupCode,
      emailAddress,
      password,
    } = body;

    const result =
      await bookingUserService.updateBookingUserAuthPassword(
        bookingSetupCode,
        emailAddress,
        password
      );

    const parsed = JSON.parse(result?.value || "null");

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.response?.data?.error?.message ||
          "Failed to update booking user password",
      },
      { status: err?.response?.status || 500 }
    );
  }
}