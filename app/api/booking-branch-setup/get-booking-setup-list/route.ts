// api/booking-branch-setup/get-booking-setup-list
import { NextResponse } from "next/server";
import { bookingBranchSetupService } from "@/services/business-central/booking-branch-setup.service";

export async function GET() {
  try {
    const result = await bookingBranchSetupService.getBookingSetupList();

    const parsed = JSON.parse(result?.value);
    console.log("Fetched booking setup list:", parsed);
    return NextResponse.json(parsed ?? []);
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.response?.data?.error?.message ||
          "Failed to fetch customers",
      },
      { status: err?.response?.status || 500 }
    );
  }
}