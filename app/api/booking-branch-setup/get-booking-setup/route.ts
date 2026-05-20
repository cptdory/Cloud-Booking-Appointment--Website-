// api/booking-branch-setup/get-booking-setup
import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { bookingBranchSetupService } from "@/services/business-central/booking-branch-setup.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code")?.trim();
    const session = await getSession();
    const bookingSetupCode = code || session?.user?.booking_setup_code || "MAIN";
    if (!bookingSetupCode) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const result = await bookingBranchSetupService.getBookingSetup(bookingSetupCode);
    const parsed = JSON.parse(result?.value || "null");
    return NextResponse.json(parsed, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err: any) {
        console.error(
      "BC ERROR:",
      JSON.stringify(err?.response?.data, null, 2)
    );
    return NextResponse.json(
      {
        error:
          err?.response?.data?.error?.message ||
          "Failed to fetch booking setup",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}
