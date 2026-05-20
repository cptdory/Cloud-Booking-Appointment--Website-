// api/booking-branch-setup/get-booking-setup-list
import { NextResponse } from "next/server";
import { bookingBranchSetupService } from "@/services/business-central/booking-branch-setup.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const result = await bookingBranchSetupService.getBookingSetupList();

    const parsed = JSON.parse(result?.value);
    return NextResponse.json(parsed ?? [], {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.response?.data?.error?.message ||
          "Failed to fetch customers",
      },
      {
        status: err?.response?.status || 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}
