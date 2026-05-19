// api/booking-branch-setup/update-booking-setup
import { NextResponse } from "next/server";
import { bookingBranchSetupService } from "@/services/business-central/booking-branch-setup.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
          bookingSetupCode,
          description,
          locationCode,
          timeIncrement,
          closingAllowableTime,
          timeSlotBookableCount,
          currencyCode,
          currencySymbol,
          otpValidityPeriod,
        } = body;
        const result = await bookingBranchSetupService.updateBookingSetup(
          bookingSetupCode,
          description,
          locationCode,
          timeIncrement,
          closingAllowableTime,
          timeSlotBookableCount,
          currencyCode,
          currencySymbol,
          otpValidityPeriod
        );
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            {error:err?.response?.data?.error?.message ||"Failed to update booking setup",},
            { status: err?.response?.status || 500 }
        );
    }
}