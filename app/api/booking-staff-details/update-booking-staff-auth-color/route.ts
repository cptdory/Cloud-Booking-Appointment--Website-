// api/booking-staff-details/update-booking-staff-auth-color
import { NextResponse } from "next/server";
import { bookingStaffDetailsService } from "@/services/business-central/booking-staff-details.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingSetupCode, bookingParameterId, bookingParameterValueId, staffColor, } = body;
        const result = await bookingStaffDetailsService.updateBookingStaffAuthColor(bookingSetupCode, bookingParameterId, bookingParameterValueId, staffColor,);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to update staff color", },
            { status: err?.response?.status || 500 }
        );
    }
}