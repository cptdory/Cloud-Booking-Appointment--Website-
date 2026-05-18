// api/booking-branch-setup/get-booking-setup
import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { bookingBranchSetupService } from "@/services/business-central/booking-branch-setup.service";

export async function GET() {
  try {
    const session = await getSession();
    const bookingSetupCode = session?.user?.booking_setup_code ?? "MAIN";
    if (!bookingSetupCode) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const result = await bookingBranchSetupService.getBookingSetup(bookingSetupCode);
    const parsed = JSON.parse(result?.value || "null");

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.response?.data?.error?.message ||
          "Failed to fetch booking setup",
      },
      { status: 500 }
    );
  }
}