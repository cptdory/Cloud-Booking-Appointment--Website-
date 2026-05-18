// api/booking-staff-details/get-booking-staff-color
import { NextResponse } from "next/server";
import { bookingStaffDetailsService } from "@/services/business-central/booking-staff-details.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingSetupCode, bookingParameterId, bookingParameterValueId, } = body;
        const result = await bookingStaffDetailsService.getBookingStaffColor(bookingSetupCode, bookingParameterId, bookingParameterValueId,);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to get staff color", },
            { status: err?.response?.status || 500 }
        );
    }
}