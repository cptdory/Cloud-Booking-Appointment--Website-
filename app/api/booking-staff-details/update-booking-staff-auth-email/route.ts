// api/booking-staff-details/update-booking-staff-auth-email
import { NextResponse } from "next/server";
import { bookingStaffDetailsService } from "@/services/business-central/booking-staff-details.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        const { bookingSetupCode, bookingParameterId, bookingParameterValueId, staffEmail, } = body;
        const result = await bookingStaffDetailsService.updateBookingStaffAuthEmail(bookingSetupCode, bookingParameterId, bookingParameterValueId, staffEmail,);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to update staff email", },
            { status: err?.response?.status || 500 }
        );
    }
}