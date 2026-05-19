// api/booking-branch-setup/update-booking-setup
import { NextResponse } from "next/server";
import { bookingBranchSetupService } from "@/services/business-central/booking-branch-setup.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Received booking setup update request with body:", body);
        const {
          bookingSetupCode,
          description,
          locationCode,
          timeIncrement,
          closingAllowableTime,
          timeSlotBookableCount,
          currencyCode,
          currencySymbol
        } = body;
        const result = await bookingBranchSetupService.updateBookingSetup(
          bookingSetupCode,
          description,
          locationCode,
          timeIncrement,
          closingAllowableTime,
          timeSlotBookableCount,
          currencyCode,
          currencySymbol
        );
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
                console.error(
      "BC ERROR:",
      JSON.stringify(err?.response?.data, null, 2)
    );
        return NextResponse.json(
            {error:err?.response?.data?.error?.message ||"Failed to update booking setup",},
            { status: err?.response?.status || 500 }
        );
    }
}